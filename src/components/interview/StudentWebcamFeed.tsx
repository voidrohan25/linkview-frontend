"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Camera,
  CameraOff,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Eye,
  Activity,
  User,
} from "lucide-react";

export interface ProctoringDetectionResult {
  faceDetected: boolean;
  multipleFaces: boolean;
  cameraCovered: boolean;
  lowLighting: boolean;
  gazeAway: boolean;
  headDown: boolean;
  luminance: number; // 0 to 255
  confidence: number;
  fps: number;
  message?: string;
  eventType?: "face_missing" | "multiple_faces" | "camera_covered" | "gaze_away" | "head_down";
}

interface StudentWebcamFeedProps {
  externalStream?: MediaStream | null;
  onStreamReady?: (stream: MediaStream) => void;
  onDetectionUpdate?: (result: ProctoringDetectionResult) => void;
  onCameraStatusChange?: (active: boolean) => void;
  isMuted?: boolean;
  onToggleMute?: () => void;
  showControls?: boolean;
  className?: string;
  compact?: boolean;
  minimalMode?: boolean;
}

export function StudentWebcamFeed({
  externalStream,
  onStreamReady,
  onDetectionUpdate,
  onCameraStatusChange,
  isMuted,
  onToggleMute,
  showControls = true,
  className = "",
  compact = false,
  minimalMode = false,
}: StudentWebcamFeedProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const rvfcHandleRef = useRef<number | null>(null);
  const streamStartTimeRef = useRef<number>(0);
  const lastInferenceTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const lastFpsCalcTimeRef = useRef<number>(0);
  const currentFpsRef = useRef<number>(6.5);

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
  const [gazeAway, setGazeAway] = useState<boolean>(false);
  const [headDown, setHeadDown] = useState<boolean>(false);
  const [luminance, setLuminance] = useState<number>(120);
  const [fpsDisplay, setFpsDisplay] = useState<number>(6.5);

  // Consecutive anomaly counters for temporal stability (prevents single-frame false positives)
  const missingFaceStreakRef = useRef<number>(0);
  const multipleFacesStreakRef = useRef<number>(0);
  const gazeAwayStreakRef = useRef<number>(0);
  const headDownStreakRef = useRef<number>(0);
  const cameraCoveredStreakRef = useRef<number>(0);
  const isRunningInferenceRef = useRef<boolean>(false);

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
      lastFpsCalcTimeRef.current = Date.now();

      const video = videoRef.current;
      if (!video) return;

      video.srcObject = stream;
      video.muted = true;
      video.playsInline = true;

      const playVideo = () => {
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
              console.warn("Webcam play warning:", err);
              setCameraActive(true);
              setCameraLoading(false);
            });
        }
      };

      if (video.readyState >= 2) {
        playVideo();
      } else {
        video.onloadedmetadata = () => {
          playVideo();
        };
      }

      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          setCameraActive(false);
          setCameraError("Webcam stream disconnected.");
          onCameraStatusChange?.(false);
        };
        track.onmute = () => setCameraActive(false);
        track.onunmute = () => {
          setCameraActive(true);
          setCameraError(null);
        };
      });

      const timer = setTimeout(() => {
        setCameraLoading(false);
        setCameraActive(true);
      }, 1500);

      return () => clearTimeout(timer);
    },
    [onCameraStatusChange, onStreamReady]
  );

  // 3. Initialize camera hardware with resilient constraints
  const startCamera = useCallback(
    async (deviceId?: string) => {
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

      if (streamRef.current && streamRef.current !== externalStream) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      try {
        let stream: MediaStream | null = null;
        try {
          const constraints: MediaStreamConstraints = {
            video: deviceId
              ? { deviceId: { ideal: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
              : { width: { ideal: 1280 }, height: { ideal: 720 } },
            audio: false,
          };
          stream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch {
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
          setCameraError("Camera permission denied. Click below or allow access in Chrome settings.");
        } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
          setCameraError("Camera hardware busy or restarting. Click 'Retry Camera' below.");
        } else {
          setCameraError(error.message || "Failed to initialize webcam.");
        }
      }
    },
    [externalStream, attachStreamToVideo, loadVideoDevices, onCameraStatusChange]
  );

  // 4. Initial setup and handling external stream
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
      // Do not stop tracks if stream was shared with parent via onStreamReady or externalStream
      if (streamRef.current && !onStreamReady && streamRef.current !== externalStream) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [externalStream, selectedDeviceId]); // eslint-disable-line react-hooks/exhaustive-deps

  // 5. High-Speed, Low-Latency Computer Vision Pipeline (~6-8 FPS, <8ms execution)
  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2 || isRunningInferenceRef.current) return;

    // Grace period for camera exposure calibration (first 3.5s)
    if (Date.now() - streamStartTimeRef.current < 3500) return;

    isRunningInferenceRef.current = true;

    try {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      const W = 120;
      const H = 90;
      canvas.width = W;
      canvas.height = H;
      ctx.drawImage(video, 0, 0, W, H);

      const frame = ctx.getImageData(0, 0, W, H);
      const data = frame.data;
      const totalPixels = W * H;

      // 5A. Instant Luminance Calculation
      let totalLuma = 0;
      for (let i = 0; i < data.length; i += 4) {
        totalLuma += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      const avgLuma = Math.round(totalLuma / totalPixels);
      setLuminance(avgLuma);

      const isCovered = avgLuma < 8 || avgLuma > 252;
      const isDim = avgLuma >= 8 && avgLuma < 35;
      setLowLighting(isDim);

      if (isCovered) {
        cameraCoveredStreakRef.current++;
      } else {
        cameraCoveredStreakRef.current = 0;
      }
      const confirmedCovered = cameraCoveredStreakRef.current >= 4;
      setCameraCovered(confirmedCovered);

      // 5B. Skin Tone & Facial Centroid Analysis
      let faceEnergy = 0;
      let leftEnergy = 0;
      let rightEnergy = 0;
      let topEnergy = 0;
      let bottomEnergy = 0;
      let sumX = 0;
      let sumY = 0;

      // Bounding box scanning
      for (let y = 10; y < H - 10; y++) {
        for (let x = 15; x < W - 15; x++) {
          const idx = (y * W + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // Normalized color space skin detection
          if (r > 45 && g > 30 && b > 18 && r >= b && Math.abs(r - g) > 5) {
            faceEnergy++;
            sumX += x;
            sumY += y;

            if (x < W / 2) leftEnergy++;
            else rightEnergy++;

            if (y < H / 2) topEnergy++;
            else bottomEnergy++;
          }
        }
      }

      const totalScan = (W - 30) * (H - 20);
      const isFacePresent = !confirmedCovered && faceEnergy >= totalScan * 0.07;

      // Temporal filtering for face missing
      if (!isFacePresent) {
        missingFaceStreakRef.current++;
      } else {
        missingFaceStreakRef.current = 0;
      }
      // Require 4 consecutive failures before confirming violation
      const confirmedFaceDetected = missingFaceStreakRef.current < 4;
      setFaceDetected(confirmedFaceDetected);

      // 5C. Head Pose / Centroid Estimation (Gaze away & downward look)
      let isGazingAway = false;
      let isHeadDown = false;

      if (isFacePresent && faceEnergy > 0) {
        const centroidX = sumX / faceEnergy;
        const centroidY = sumY / faceEnergy;

        // Center is W/2 = 60, H/2 = 45
        // Horizontal deviation > 22 pixels (~36% offset) indicates looking away
        if (Math.abs(centroidX - W / 2) > 22) {
          gazeAwayStreakRef.current++;
        } else {
          gazeAwayStreakRef.current = 0;
        }

        // Vertical deviation downward > 18 pixels indicates downward look (e.g. at phone or notes)
        if (centroidY - H / 2 > 18) {
          headDownStreakRef.current++;
        } else {
          headDownStreakRef.current = 0;
        }

        isGazingAway = gazeAwayStreakRef.current >= 4;
        isHeadDown = headDownStreakRef.current >= 4;
      }

      setGazeAway(isGazingAway);
      setHeadDown(isHeadDown);

      // 5D. Multiple Faces Heuristic (dual separated peaks)
      const hasMultipleFaces =
        isFacePresent &&
        leftEnergy > totalScan * 0.12 &&
        rightEnergy > totalScan * 0.12 &&
        Math.abs(leftEnergy - rightEnergy) < totalScan * 0.04;

      if (hasMultipleFaces) {
        multipleFacesStreakRef.current++;
      } else {
        multipleFacesStreakRef.current = 0;
      }
      const confirmedMultiFaces = multipleFacesStreakRef.current >= 4;
      setMultipleFaces(confirmedMultiFaces);

      // 5E. Calculate current inference FPS
      frameCountRef.current++;
      const now = Date.now();
      if (now - lastFpsCalcTimeRef.current >= 1500) {
        const elapsed = (now - lastFpsCalcTimeRef.current) / 1000;
        const fps = Math.round((frameCountRef.current / elapsed) * 10) / 10;
        currentFpsRef.current = fps;
        setFpsDisplay(fps);
        frameCountRef.current = 0;
        lastFpsCalcTimeRef.current = now;
      }

      // 5F. Notify Parent Proctoring Monitor
      let eventType: ProctoringDetectionResult["eventType"] = undefined;
      let message: string | undefined = undefined;

      if (confirmedCovered) {
        eventType = "camera_covered";
        message = "Camera lens appears covered or obstructed";
      } else if (!confirmedFaceDetected) {
        eventType = "face_missing";
        message = "Face not detected in camera frame. Keep face centered.";
      } else if (confirmedMultiFaces) {
        eventType = "multiple_faces";
        message = "Multiple faces detected in assessment camera view";
      } else if (isGazingAway) {
        eventType = "gaze_away";
        message = "Repeated looking away from interview screen detected";
      } else if (isHeadDown) {
        eventType = "head_down";
        message = "Prolonged downward head position detected";
      }

      onDetectionUpdate?.({
        faceDetected: confirmedFaceDetected,
        multipleFaces: confirmedMultiFaces,
        cameraCovered: confirmedCovered,
        lowLighting: isDim,
        gazeAway: isGazingAway,
        headDown: isHeadDown,
        luminance: avgLuma,
        confidence: isFacePresent ? 0.94 : 0.2,
        fps: currentFpsRef.current,
        eventType,
        message,
      });
    } finally {
      isRunningInferenceRef.current = false;
    }
  }, [onDetectionUpdate]);

  // 6. High-Frequency Scheduler (requestVideoFrameCallback with ~140ms rAF throttle)
  useEffect(() => {
    if (!cameraActive) return;

    let isMounted = true;
    const intervalMs = 150; // ~6.7 checks per second

    const scheduleNextFrame = () => {
      if (!isMounted) return;

      const now = Date.now();
      if (now - lastInferenceTimeRef.current >= intervalMs) {
        processFrame();
        lastInferenceTimeRef.current = now;
      }

      const video = videoRef.current;
      if (video && "requestVideoFrameCallback" in video) {
        rvfcHandleRef.current = (video as any).requestVideoFrameCallback(() => {
          scheduleNextFrame();
        });
      } else {
        animFrameIdRef.current = requestAnimationFrame(() => {
          scheduleNextFrame();
        });
      }
    };

    scheduleNextFrame();

    return () => {
      isMounted = false;
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      const video = videoRef.current;
      if (video && rvfcHandleRef.current && "cancelVideoFrameCallback" in video) {
        (video as any).cancelVideoFrameCallback(rvfcHandleRef.current);
      }
    };
  }, [cameraActive, processFrame]);

  // Sync external isMuted prop if provided
  useEffect(() => {
    if (isMuted !== undefined && streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isMuted;
        setIsMutedVideo(isMuted);
      }
    }
  }, [isMuted]);

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
      {/* Top Telemetry & Proctoring Status (Standard mode only) */}
      {!minimalMode && (
        <div className="absolute top-0 inset-x-0 z-20 p-2.5 bg-gradient-to-b from-[#0A0F1D]/90 via-[#0A0F1D]/40 to-transparent flex items-center justify-between pointer-events-none">
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
                    ? `AI Face Lock • Live (${fpsDisplay} FPS)`
                    : "Calibrating • Keep Centered"
                  : "Initializing..."}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {gazeAway && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 flex items-center gap-1">
                <Eye size={11} />
                <span>Gaze Away</span>
              </span>
            )}

            {multipleFaces && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1">
                <AlertTriangle size={11} />
                <span>Multiple Faces</span>
              </span>
            )}

            {cameraCovered && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 flex items-center gap-1">
                <ShieldAlert size={11} />
                <span>Obstructed</span>
              </span>
            )}

            {cameraActive && faceDetected && !cameraCovered && !gazeAway && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 size={11} />
                <span>Verified Feed</span>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main Video Viewport */}
      <div
        className={`relative w-full bg-black flex items-center justify-center overflow-hidden ${
          compact ? "aspect-[16/9] min-h-[180px] sm:min-h-[220px] max-h-[300px]" : "aspect-[16/9]"
        }`}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover -scale-x-100 transition-opacity duration-300 ${
            !isMutedVideo ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Minimal Mode Bottom-Left Candidate Pill */}
        {minimalMode && (
          <div className="absolute bottom-3 left-3 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0B0F19]/80 backdrop-blur-md border border-slate-700/60 text-white text-xs font-semibold shadow-lg pointer-events-none">
            <User size={13} className="text-cyan-400" />
            <span>Candidate</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
          </div>
        )}

        {/* Offscreen frame analysis canvas */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Face Tracking Bounding Box Overlay (Standard Mode Only) */}
        {cameraActive && !isMutedVideo && !minimalMode && (
          <div className="absolute inset-6 sm:inset-8 pointer-events-none border-2 border-emerald-400/35 rounded-2xl">
            <div className="absolute -top-3 left-4 bg-emerald-950/80 border border-emerald-500 text-emerald-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1">
              <Activity size={10} className="animate-spin text-emerald-400" />
              <span>AI Face Track • Live</span>
            </div>
            <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-emerald-400" />
            <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-emerald-400" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-emerald-400" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-emerald-400" />
          </div>
        )}

        {/* Loading overlay */}
        {cameraLoading && !cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-sm text-white space-y-2 p-4 z-10">
            <RefreshCw size={24} className="animate-spin text-orange-500" />
            <p className="text-xs font-semibold text-slate-200">Connecting to webcam...</p>
          </div>
        )}

        {/* Error overlay */}
        {cameraError && !cameraActive && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/95 text-white space-y-3 p-6 text-center z-10">
            <div className="p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-400">
              <CameraOff size={26} />
            </div>
            <div className="space-y-1 max-w-xs">
              <p className="text-xs font-bold text-red-300">{cameraError}</p>
              <p className="text-[11px] text-slate-400">
                Grant camera access or select an alternate camera below.
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

        {/* Muted overlay */}
        {isMutedVideo && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-white space-y-2 z-10">
            <CameraOff size={30} className="text-slate-500" />
            <span className="text-xs text-slate-400 font-semibold">Camera Feed Paused</span>
          </div>
        )}
      </div>

      {/* Bottom Camera Toolbar & Device Selector */}
      {showControls && !minimalMode && (
        <div className="p-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
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
              {isMutedVideo ? <CameraOff size={13} /> : <Camera size={13} />}
            </button>

            <button
              type="button"
              onClick={() => startCamera(selectedDeviceId)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Rescan & reconnect camera"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentWebcamFeed;
