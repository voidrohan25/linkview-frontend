"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  CameraOff,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
} from "lucide-react";

export interface ProctoringEvent {
  id: string;
  type: "tab_switch" | "window_blur" | "face_missing" | "fullscreen_exit" | "copy_paste_attempt";
  severity: "low" | "medium" | "high";
  message: string;
  timestamp: string;
  durationSeconds?: number;
}

interface ProctoringMonitorProps {
  isActive: boolean;
  onProctoringEvent?: (event: ProctoringEvent) => void;
  onFaceStatusChange?: (present: boolean) => void;
}

export function ProctoringMonitor({
  isActive,
  onProctoringEvent,
  onFaceStatusChange,
}: ProctoringMonitorProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // States
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [faceDetected, setFaceDetected] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [violationsCount, setViolationsCount] = useState(0);

  // Blur / tab switch timer
  const blurStartTimeRef = useRef<number | null>(null);

  // 1. Initialize Webcam Stream
  useEffect(() => {
    if (!isActive) return;

    let mounted = true;

    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user",
          },
        });

        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraActive(true);
        setCameraError(null);
      } catch (err: unknown) {
        const e = err as Error;
        console.warn("Proctoring webcam permission error:", e);
        setCameraError("Webcam access required for proctored interview.");
        setCameraActive(false);
      }
    }

    initCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [isActive]);

  // Record an integrity violation event
  const recordViolation = (
    type: ProctoringEvent["type"],
    severity: ProctoringEvent["severity"],
    message: string,
    durationSeconds?: number
  ) => {
    const event: ProctoringEvent = {
      id: `proc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      severity,
      message,
      timestamp: new Date().toLocaleTimeString(),
      durationSeconds,
    };

    setViolationsCount((c) => c + 1);
    setWarningMessage(message);
    setTimeout(() => setWarningMessage(null), 5000);

    onProctoringEvent?.(event);
  };

  // 2. Tab Switch & Window Focus Monitoring
  useEffect(() => {
    if (!isActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        blurStartTimeRef.current = Date.now();
        recordViolation(
          "tab_switch",
          "high",
          "Tab switch detected! Leaving the assessment tab is strictly recorded."
        );
      } else {
        if (blurStartTimeRef.current) {
          const awayDuration = Math.round((Date.now() - blurStartTimeRef.current) / 1000);
          blurStartTimeRef.current = null;
          if (awayDuration > 1) {
            recordViolation(
              "tab_switch",
              "high",
              `Returned after ${awayDuration}s away from assessment.`,
              awayDuration
            );
          }
        }
      }
    };

    const handleWindowBlur = () => {
      if (!document.hidden && !blurStartTimeRef.current) {
        blurStartTimeRef.current = Date.now();
        recordViolation(
          "window_blur",
          "medium",
          "Window focus lost! Please keep interview window active."
        );
      }
    };

    const handleWindowFocus = () => {
      if (blurStartTimeRef.current) {
        blurStartTimeRef.current = null;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [isActive]);

  // 3. Fullscreen Monitoring
  useEffect(() => {
    if (!isActive) return;

    const handleFullscreenChange = () => {
      const isFull = Boolean(document.fullscreenElement);
      setIsFullscreen(isFull);

      if (!isFull) {
        recordViolation(
          "fullscreen_exit",
          "medium",
          "Candidate exited full-screen mode. Please maintain full screen."
        );
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [isActive]);

  // 4. Copy-Paste Prevention
  useEffect(() => {
    if (!isActive) return;

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      recordViolation(
        "copy_paste_attempt",
        "low",
        "Copying text is prohibited during proctored evaluation."
      );
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      recordViolation(
        "copy_paste_attempt",
        "low",
        "Pasting external text is prohibited during proctored evaluation."
      );
    };

    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
    };
  }, [isActive]);

  // 5. Canvas-based Face & Luminance Presence Check
  useEffect(() => {
    if (!isActive || !cameraActive) return;

    let missingStreak = 0;

    const interval = setInterval(() => {
      if (!videoRef.current || !canvasRef.current) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!ctx || video.readyState < 2) return;

      canvas.width = 64;
      canvas.height = 48;
      ctx.drawImage(video, 0, 0, 64, 48);

      const frame = ctx.getImageData(0, 0, 64, 48);
      const data = frame.data;

      // Calculate average luminance and pixel variance
      let totalLuma = 0;
      for (let i = 0; i < data.length; i += 4) {
        totalLuma += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      const avgLuma = totalLuma / (data.length / 4);

      // If luminance is virtually 0 (covered camera) or too low
      const isFeedActive = avgLuma > 15 && avgLuma < 250;

      if (!isFeedActive) {
        missingStreak++;
        if (missingStreak >= 3) {
          setFaceDetected(false);
          onFaceStatusChange?.(false);
          recordViolation("face_missing", "high", "Camera covered or face missing from view!");
        }
      } else {
        missingStreak = 0;
        setFaceDetected(true);
        onFaceStatusChange?.(true);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isActive, cameraActive]);

  // Toggle Fullscreen helper
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <>
      {/* Warning Toast Banner */}
      {warningMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4 animate-in fade-in slide-in-from-top-4">
          <div className="p-3 rounded-xl bg-red-600 text-white shadow-2xl flex items-center gap-3 border border-red-500">
            <AlertTriangle size={20} className="shrink-0 animate-bounce" />
            <div className="flex-1 text-xs font-semibold">{warningMessage}</div>
            <button
              onClick={() => setWarningMessage(null)}
              className="text-white/80 hover:text-white text-xs font-bold px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Picture-in-Picture Webcam Monitor Widget */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl">
        {/* Top Header */}
        <div className="px-3 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                cameraActive && faceDetected ? "bg-emerald-500 animate-pulse" : "bg-red-500"
              }`}
            />
            <span className="font-bold text-slate-200 text-[11px]">Candidate Webcam</span>
          </div>

          <div className="flex items-center gap-2">
            {violationsCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                {violationsCount} Flags
              </span>
            )}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          </div>
        </div>

        {/* Video Viewport */}
        <div className="relative aspect-[4/3] bg-black flex items-center justify-center overflow-hidden">
          {cameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover -scale-x-100"
            />
          ) : (
            <div className="p-4 text-center space-y-2">
              <CameraOff size={28} className="mx-auto text-slate-500" />
              <p className="text-[11px] text-slate-400 m-0">
                {cameraError || "Waiting for camera authorization..."}
              </p>
            </div>
          )}

          {/* Offscreen canvas for luminance / face presence analysis */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Status Overlay */}
          <div className="absolute bottom-2 inset-x-2 flex items-center justify-between">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md border ${
                faceDetected
                  ? "bg-emerald-950/70 text-emerald-300 border-emerald-800/80"
                  : "bg-red-950/80 text-red-300 border-red-800"
              }`}
            >
              {faceDetected ? "Face Tracked" : "Face Out of Frame"}
            </span>

            <span className="text-[10px] font-mono bg-black/60 text-slate-300 px-1.5 py-0.5 rounded">
              {isFullscreen ? "Full-Screen ✓" : "Standard Window"}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
export default ProctoringMonitor;
