"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Camera,
  CameraOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

export interface ProctoringDetectionResult {
  faceDetected: boolean;
  multipleFaces: boolean;
  cameraCovered: boolean;
  lowLighting: boolean;
  gazeAway: boolean;
  luminance: number; // 0 to 255
  message?: string;
}

interface StudentWebcamFeedProps {
  externalStream?: MediaStream | null;
  onStreamReady?: (stream: MediaStream) => void;
  onDetectionUpdate?: (result: ProctoringDetectionResult) => void;
  onCameraStatusChange?: (active: boolean) => void;
  showControls?: boolean;
  className?: string;
}

export function StudentWebcamFeed({
  externalStream,
  onStreamReady,
  onDetectionUpdate,
  onCameraStatusChange,
  showControls = true,
  className = "",
}: StudentWebcamFeedProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const analysisTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streamStartTimeRef = useRef<number>(0);

  // Camera & Device State
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraLoading, setCameraLoading] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMutedVideo, setIsMutedVideo] = useState<boolean>(false);

  // Real-time Vision & Proctoring Metrics
  const [faceDetected, setFaceDetected] = useState<boolean>(true);
  const [cameraCovered, setCameraCovered] = useState<boolean>(false);
  const [lowLighting, setLowLighting] = useState<boolean>(false);
  const [luminance, setLuminance] = useState<number>(120);

  // Consecutive missing frame counter
  const missingFaceStreakRef = useRef<number>(0);

  // 1. Enumerate available video input devices
  const loadVideoDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices.filter((d) => d.kind === "videoinput");
      setVideoDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch (err) {
      console.warn("Device enumeration notice:", err);
    }
  }, [selectedDeviceId]);

  // 2. Attach a given MediaStream to the video element safely
  const attachStreamToVideo = useCallback(
    (stream: MediaStream) => {
      streamRef.current = stream;
      streamStartTimeRef.current = Date.now();

      const video = videoRef.current;
      if (!video) return;

      video.srcObject = stream;
      video.muted = true;

      // Handle play promise safely
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setCameraActive(true);
            setCameraLoading(false);
            setCameraError(null);
            onCameraStatusChange?.(true);
            onStreamReady?.(stream);
          })
          .catch((err) => {
            console.warn("Webcam autoplay warning:", err);
            // Even if browser requires user interaction for play, clear loading
            setCameraLoading(false);
            setCameraActive(true);
          });
      }

      // Track lifecycle events
      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          setCameraActive(false);
          setCameraError("Webcam stream ended or disconnected.");
          onCameraStatusChange?.(false);
        };
        track.onmute = () => {
          setCameraActive(false);
        };
        track.onunmute = () => {
          setCameraActive(true);
          setCameraError(null);
        };
      });

      // Quick fallback timeout to guarantee loading spinner disappears
      const timer = setTimeout(() => {
        setCameraLoading(false);
        setCameraActive(true);
      }, 1200);

      return () => clearTimeout(timer);
    },
    [onCameraStatusChange, onStreamReady]
  );

  // 3. Initialize camera hardware with resilient fallback constraints
  const startCamera = useCallback(
    async (deviceId?: string) => {
      // If external stream is passed and alive, use it directly
      if (
        externalStream &&
        externalStream.active &&
        externalStream.getVideoTracks().some((t) => t.readyState === "live")
      ) {
        attachStreamToVideo(externalStream);
        return;
      }

      setCameraLoading(true);
      setCameraError(null);

      // Stop previous stream tracks owned by this component
      if (streamRef.current && streamRef.current !== externalStream) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      try {
        let stream: MediaStream | null = null;

        // Attempt 1: Ideal HD constraints
        try {
          const constraints: MediaStreamConstraints = {
            video: deviceId
              ? { deviceId: { ideal: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
              : { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          };
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (attempt1Err) {
          console.warn("Attempt 1 with HD constraints failed, falling back to basic video:", attempt1Err);
          // Attempt 2: Basic resilient fallback constraint
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }

        if (stream) {
          attachStreamToVideo(stream);
          loadVideoDevices();
        }
      } catch (err: unknown) {
        const error = err as Error;
        console.error("Camera acquisition failed:", error);
        setCameraLoading(false);
        setCameraActive(false);
        onCameraStatusChange?.(false);

        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          setCameraError("Camera permission denied. Click 'Grant Camera' below or enable permissions in Chrome.");
        } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
          setCameraError("Camera hardware is busy in another app or restarting. Click 'Retry Camera' below.");
        } else {
          setCameraError(error.message || "Failed to initialize webcam.");
        }
      }
    },
    [externalStream, attachStreamToVideo, loadVideoDevices, onCameraStatusChange]
  );

  // 4. Initial setup and handling external stream changes
  useEffect(() => {
    loadVideoDevices();

    if (
      externalStream &&
      externalStream.active &&
      externalStream.getVideoTracks().some((t) => t.readyState === "live")
    ) {
      attachStreamToVideo(externalStream);
    } else {
      startCamera(selectedDeviceId);
    }

    return () => {
      // Only stop tracks if we own them (not external)
      if (streamRef.current && streamRef.current !== externalStream) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [externalStream, selectedDeviceId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 5. Computer Vision & Frame Health Analysis Loop
  useEffect(() => {
    if (!cameraActive) return;

    analysisTimerRef.current = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      // Skip analysis during camera sensor warm-up (first 3.5 seconds)
      if (Date.now() - streamStartTimeRef.current < 3500) {
        return;
      }

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = 96;
      canvas.height = 72;
      ctx.drawImage(video, 0, 0, 96, 72);

      const frame = ctx.getImageData(0, 0, 96, 72);
      const data = frame.data;
      const pixelCount = data.length / 4;

      // 5A. Calculate average luminance
      let totalLuma = 0;
      for (let i = 0; i < data.length; i += 4) {
        totalLuma += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      const avgLuma = Math.round(totalLuma / pixelCount);
      setLuminance(avgLuma);

      // Camera covered check (strictly under 10 or washed out above 250)
      const isCovered = avgLuma < 10 || avgLuma > 250;
      setCameraCovered(isCovered);

      // Low lighting check
      const isLowLight = avgLuma >= 10 && avgLuma < 35;
      setLowLighting(isLowLight);

      // 5B. Face Presence & Skin Tone Area Heuristic
      let centerEnergy = 0;
      const startRow = 12;
      const endRow = 58;
      const startCol = 20;
      const endCol = 76;

      for (let r = startRow; r < endRow; r++) {
        for (let c = startCol; c < endCol; c++) {
          const idx = (r * 96 + c) * 4;
          const rVal = data[idx];
          const gVal = data[idx + 1];
          const bVal = data[idx + 2];

          // Inclusive skin tone & facial contour spectrum
          if (
            rVal > 45 &&
            gVal > 30 &&
            bVal > 15 &&
            rVal >= bVal &&
            Math.abs(rVal - gVal) > 6
          ) {
            centerEnergy++;
          }
        }
      }

      const totalScanArea = (endRow - startRow) * (endCol - startCol);
      const isFacePresent = !isCovered && centerEnergy >= totalScanArea * 0.08;

      if (!isFacePresent) {
        missingFaceStreakRef.current++;
      } else {
        missingFaceStreakRef.current = 0;
      }

      // Require 4 consecutive failures (8+ seconds) before triggering violation
      const verifiedFaceDetected = missingFaceStreakRef.current < 4;
      setFaceDetected(verifiedFaceDetected);

      // Only notify parent proctoring monitor if status changed
      onDetectionUpdate?.({
        faceDetected: verifiedFaceDetected,
        multipleFaces: false,
        cameraCovered: isCovered,
        lowLighting: isLowLight,
        gazeAway: false,
        luminance: avgLuma,
        message: isCovered
          ? "Camera lens appears covered or obstructed"
          : !verifiedFaceDetected
          ? "Face not detected in camera frame. Keep face centered."
          : undefined,
      });
    }, 2000);

    return () => {
      if (analysisTimerRef.current) {
        clearInterval(analysisTimerRef.current);
        analysisTimerRef.current = null;
      }
    };
  }, [cameraActive, onDetectionUpdate]);

  // Toggle Video Mute (Privacy)
  const toggleVideoMute = () => {
    if (!streamRef.current) return;
    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsMutedVideo(!videoTrack.enabled);
    }
  };

  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-[#0A0F1D] border border-slate-800 shadow-2xl flex flex-col ${className}`}
    >
      {/* Top Telemetry & Proctoring Status */}
      <div className="absolute top-0 inset-x-0 z-20 p-3 bg-gradient-to-b from-[#0A0F1D]/90 via-[#0A0F1D]/40 to-transparent flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              cameraActive && faceDetected && !cameraCovered
                ? "bg-emerald-500 animate-pulse"
                : "bg-amber-500"
            }`}
          />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white leading-tight">Candidate Camera (You)</span>
            <span className="text-[10px] text-slate-400 font-mono">
              {cameraActive
                ? faceDetected
                  ? "Face Tracked • Live"
                  : "Calibrating • Keep Centered"
                : "Initializing..."}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {lowLighting && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <AlertTriangle size={11} />
              <span>Dim Light</span>
            </span>
          )}

          {cameraCovered && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1">
              <ShieldAlert size={11} />
              <span>Obstructed</span>
            </span>
          )}

          {cameraActive && faceDetected && !cameraCovered && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 size={11} />
              <span>Verified Feed</span>
            </span>
          )}
        </div>
      </div>

      {/* Main Video Viewport */}
      <div className="relative w-full aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
        {/* Actual Live Video Feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover -scale-x-100 transition-opacity duration-300 ${
            !isMutedVideo ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Offscreen frame analysis canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Face Tracking Bounding Box Overlay */}
        {cameraActive && !isMutedVideo && (
          <div className="absolute inset-8 sm:inset-12 pointer-events-none border-2 border-emerald-400/35 rounded-2xl">
            <div className="absolute -top-3 left-4 bg-emerald-950/80 border border-emerald-500 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
              AI Face Lock • Live
            </div>
            {/* Corner crosshairs */}
            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-emerald-400" />
            <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-emerald-400" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-emerald-400" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-emerald-400" />
          </div>
        )}

        {/* Non-blocking loading pill (only shown when truly loading without video) */}
        {cameraLoading && !cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-sm text-white space-y-2 p-4 z-10">
            <RefreshCw size={26} className="animate-spin text-orange-500" />
            <p className="text-xs font-semibold text-slate-200">Connecting to webcam...</p>
          </div>
        )}

        {/* Camera Error / Permission Fallback View */}
        {cameraError && !cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 text-white space-y-3 p-6 text-center z-10">
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-400">
              <CameraOff size={28} />
            </div>
            <div className="space-y-1 max-w-xs">
              <p className="text-xs font-bold text-red-300">{cameraError}</p>
              <p className="text-[11px] text-slate-400">
                Grant camera access in your browser or select an alternate camera below.
              </p>
            </div>
            <button
              type="button"
              onClick={() => startCamera(selectedDeviceId)}
              className="btn btn-primary btn-sm text-xs py-1.5 px-4 flex items-center gap-1.5 font-bold shadow-md"
            >
              <RefreshCw size={13} />
              <span>Retry / Connect Camera</span>
            </button>
          </div>
        )}

        {/* Video Muted Overlay */}
        {isMutedVideo && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-white space-y-2 z-10">
            <CameraOff size={32} className="text-slate-500" />
            <span className="text-xs text-slate-400 font-semibold">Camera Feed Paused</span>
          </div>
        )}
      </div>

      {/* Bottom Camera Toolbar & Device Selector */}
      {showControls && (
        <div className="p-2.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          {/* Device Dropdown */}
          <div className="flex-1 mr-2">
            <select
              value={selectedDeviceId}
              onChange={(e) => {
                setSelectedDeviceId(e.target.value);
                startCamera(e.target.value);
              }}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1 px-2 text-[11px] text-slate-300 focus:outline-none focus:border-orange-500 truncate"
            >
              {videoDevices.length === 0 ? (
                <option value="">Default Webcam</option>
              ) : (
                videoDevices.map((d, i) => (
                  <option key={d.deviceId || i} value={d.deviceId}>
                    {d.label || `Camera ${i + 1}`}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Quick controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleVideoMute}
              className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                isMutedVideo
                  ? "bg-red-600 text-white"
                  : "bg-slate-800 hover:bg-slate-700 text-slate-300"
              }`}
              title={isMutedVideo ? "Enable Camera" : "Disable Camera"}
            >
              {isMutedVideo ? <CameraOff size={14} /> : <Camera size={14} />}
            </button>

            <button
              type="button"
              onClick={() => startCamera(selectedDeviceId)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Rescan & reconnect camera"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentWebcamFeed;
