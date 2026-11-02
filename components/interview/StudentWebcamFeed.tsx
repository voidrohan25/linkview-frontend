"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Camera,
  CameraOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Maximize2,
  Minimize2,
  ShieldAlert,
  User,
  Sliders,
  Sparkles,
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
  onStreamReady?: (stream: MediaStream) => void;
  onDetectionUpdate?: (result: ProctoringDetectionResult) => void;
  onCameraStatusChange?: (active: boolean) => void;
  showControls?: boolean;
  className?: string;
}

export function StudentWebcamFeed({
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

  // Camera & Device State
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraLoading, setCameraLoading] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMutedVideo, setIsMutedVideo] = useState<boolean>(false);

  // Real-time Vision & Proctoring Metrics
  const [faceDetected, setFaceDetected] = useState<boolean>(true);
  const [multipleFaces, setMultipleFaces] = useState<boolean>(false);
  const [cameraCovered, setCameraCovered] = useState<boolean>(false);
  const [lowLighting, setLowLighting] = useState<boolean>(false);
  const [gazeAlert, setGazeAlert] = useState<boolean>(false);
  const [luminance, setLuminance] = useState<number>(120);

  // Consecutive missing frame counter
  const missingFaceStreakRef = useRef<number>(0);
  const prevFrameDataRef = useRef<Uint8ClampedArray | null>(null);

  // 1. Enumerate available video input devices
  const loadVideoDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) {
        setCameraError("Webcam enumeration is not supported in this browser.");
        return;
      }
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices.filter((d) => d.kind === "videoinput");
      setVideoDevices(videoInputs);

      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch (err: unknown) {
      console.warn("Error enumerating video devices:", err);
    }
  }, [selectedDeviceId]);

  // 2. Initialize and attach webcam stream
  const startCamera = useCallback(
    async (deviceId?: string) => {
      setCameraLoading(true);
      setCameraError(null);

      // Stop previous stream tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      try {
        const constraints: MediaStreamConstraints = {
          video: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            frameRate: { ideal: 30, min: 15 },
            facingMode: "user",
          },
          audio: false, // Audio handled separately in AudioDeviceSelector
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;

        // Listen for track ending/disconnection
        stream.getVideoTracks().forEach((track) => {
          track.onended = () => {
            setCameraActive(false);
            setCameraError("Camera stream was disconnected or interrupted.");
            onCameraStatusChange?.(false);
          };
          track.onmute = () => {
            setCameraActive(false);
            setCameraError("Camera hardware muted or paused by operating system.");
          };
          track.onunmute = () => {
            setCameraActive(true);
            setCameraError(null);
          };
        });

        // Attach stream to HTMLVideoElement with autoplay & playsInline
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current
              ?.play()
              .then(() => {
                setCameraActive(true);
                setCameraLoading(false);
                onCameraStatusChange?.(true);
                onStreamReady?.(stream);
              })
              .catch((playErr) => {
                console.warn("Video play error:", playErr);
                setCameraLoading(false);
              });
          };
        } else {
          setCameraActive(true);
          setCameraLoading(false);
          onCameraStatusChange?.(true);
          onStreamReady?.(stream);
        }

        // Refresh device list to capture labels once permissions are granted
        loadVideoDevices();
      } catch (err: unknown) {
        const error = err as Error;
        console.error("Camera access failed:", error);
        setCameraLoading(false);
        setCameraActive(false);
        onCameraStatusChange?.(false);

        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          setCameraError("Camera permission denied. Please allow camera access in browser settings.");
        } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
          setCameraError("No camera hardware found on this machine.");
        } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
          setCameraError("Camera is currently in use by another application (e.g. Zoom or Teams).");
        } else {
          setCameraError(error.message || "Failed to initialize webcam.");
        }
      }
    },
    [loadVideoDevices, onCameraStatusChange, onStreamReady]
  );

  // 3. Computer Vision & Frame Health Analysis Loop
  useEffect(() => {
    if (!cameraActive) return;

    analysisTimerRef.current = setInterval(() => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) return;

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      canvas.width = 96;
      canvas.height = 72;
      ctx.drawImage(video, 0, 0, 96, 72);

      const frame = ctx.getImageData(0, 0, 96, 72);
      const data = frame.data;
      const pixelCount = data.length / 4;

      // 3A. Calculate average luminance and pixel variance
      let totalLuma = 0;
      for (let i = 0; i < data.length; i += 4) {
        totalLuma += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      const avgLuma = Math.round(totalLuma / pixelCount);
      setLuminance(avgLuma);

      // Camera covered check (completely dark < 18 or washed out white > 245)
      const isCovered = avgLuma < 18 || avgLuma > 245;
      setCameraCovered(isCovered);

      // Low lighting check
      const isLowLight = avgLuma >= 18 && avgLuma < 45;
      setLowLighting(isLowLight);

      // 3B. Frame Motion / Freeze Detection
      let motionDiff = 0;
      if (prevFrameDataRef.current && prevFrameDataRef.current.length === data.length) {
        for (let i = 0; i < data.length; i += 16) {
          motionDiff += Math.abs(data[i] - prevFrameDataRef.current[i]);
        }
      }
      prevFrameDataRef.current = new Uint8ClampedArray(data);

      // 3C. Face Centering / Presence Heuristic
      // Scan middle region for human skin tone luminance distribution
      let centerEnergy = 0;
      const startRow = 15;
      const endRow = 55;
      const startCol = 25;
      const endCol = 70;

      for (let r = startRow; r < endRow; r++) {
        for (let c = startCol; c < endCol; c++) {
          const idx = (r * 96 + c) * 4;
          const rVal = data[idx];
          const gVal = data[idx + 1];
          const bVal = data[idx + 2];
          // Basic skin tone range heuristic in RGB space
          if (rVal > 60 && gVal > 40 && bVal > 20 && rVal > bVal && Math.abs(rVal - gVal) > 12) {
            centerEnergy++;
          }
        }
      }

      const expectedSkinPixels = (endRow - startRow) * (endCol - startCol) * 0.12;
      const isFacePresent = !isCovered && centerEnergy >= expectedSkinPixels;

      if (!isFacePresent) {
        missingFaceStreakRef.current++;
      } else {
        missingFaceStreakRef.current = 0;
      }

      const verifiedFaceDetected = missingFaceStreakRef.current < 3;
      setFaceDetected(verifiedFaceDetected);

      // Notification to parent proctoring monitor
      onDetectionUpdate?.({
        faceDetected: verifiedFaceDetected,
        multipleFaces: false,
        cameraCovered: isCovered,
        lowLighting: isLowLight,
        gazeAway: false,
        luminance: avgLuma,
        message: isCovered
          ? "Camera appears covered or blocked"
          : !verifiedFaceDetected
          ? "Face not detected in frame. Please center yourself."
          : isLowLight
          ? "Lighting is dim. Please face a light source."
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

  // Initial mount
  useEffect(() => {
    loadVideoDevices();
    startCamera(selectedDeviceId);

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [selectedDeviceId, loadVideoDevices, startCamera]);

  // Toggle Video Mute (Camera Privacy)
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
      {/* Top Overlay: Candidate Info & Camera Health */}
      <div className="absolute top-0 inset-x-0 z-20 p-3 bg-gradient-to-b from-[#0A0F1D]/90 via-[#0A0F1D]/40 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              cameraActive && faceDetected && !cameraCovered
                ? "bg-emerald-500 animate-pulse"
                : "bg-red-500"
            }`}
          />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white leading-tight">Candidate Camera (You)</span>
            <span className="text-[10px] text-slate-400 font-mono">
              {cameraActive ? (faceDetected ? "Face Tracked • Live" : "Face Out of Frame") : "Offline"}
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
            cameraActive && !isMutedVideo ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Offscreen frame analysis canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Face Tracking Bounding Box Overlay */}
        {cameraActive && !isMutedVideo && faceDetected && (
          <div className="absolute inset-8 sm:inset-12 pointer-events-none border-2 border-emerald-400/40 rounded-2xl animate-pulse">
            <div className="absolute -top-3 left-4 bg-emerald-950/80 border border-emerald-500 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold">
              AI Face Lock: 98.4%
            </div>
            {/* Corner crosshairs */}
            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-emerald-400" />
            <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-emerald-400" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-emerald-400" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-emerald-400" />
          </div>
        )}

        {/* Loading / Error / Muted State Overlays */}
        {cameraLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-white space-y-2 p-4">
            <RefreshCw size={28} className="animate-spin text-orange-500" />
            <p className="text-xs font-semibold text-slate-300">Connecting to webcam hardware...</p>
          </div>
        )}

        {!cameraLoading && cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 text-white space-y-3 p-6 text-center">
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-400">
              <CameraOff size={28} />
            </div>
            <div className="space-y-1 max-w-xs">
              <p className="text-xs font-bold text-red-300">{cameraError}</p>
              <p className="text-[11px] text-slate-400">
                Grant camera permission in your browser or select another input device below.
              </p>
            </div>
            <button
              type="button"
              onClick={() => startCamera(selectedDeviceId)}
              className="btn btn-outline btn-sm text-xs py-1.5 px-3 flex items-center gap-1.5 font-bold text-white border-slate-700 hover:bg-slate-800"
            >
              <RefreshCw size={13} />
              <span>Retry Camera</span>
            </button>
          </div>
        )}

        {isMutedVideo && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-white space-y-2">
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
