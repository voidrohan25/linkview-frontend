"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Mic, Volume2, CheckCircle2, AlertCircle, RefreshCw, Usb, Headphones, ShieldAlert } from "lucide-react";

interface AudioDeviceSelectorProps {
  onStreamReady?: (stream: MediaStream) => void;
  onLevelChange?: (level: number) => void;
  onDeviceSelect?: (deviceId: string, deviceLabel: string) => void;
  initialDeviceId?: string;
  className?: string;
}

export function AudioDeviceSelector({
  onStreamReady,
  onLevelChange,
  onDeviceSelect,
  initialDeviceId,
  className = "",
}: AudioDeviceSelectorProps) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(initialDeviceId || "");
  const [selectedDeviceLabel, setSelectedDeviceLabel] = useState<string>("");
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [micActive, setMicActive] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [hasUsbDevice, setHasUsbDevice] = useState<boolean>(false);
  const [requestingPermission, setRequestingPermission] = useState<boolean>(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Helper to identify external / USB microphones from device label
  const isUsbOrExternal = useCallback((label: string): boolean => {
    if (!label) return false;
    const lower = label.toLowerCase();
    return (
      lower.includes("usb") ||
      lower.includes("external") ||
      lower.includes("headset") ||
      lower.includes("headphone") ||
      lower.includes("earphone") ||
      lower.includes("bluetooth") ||
      lower.includes("wireless") ||
      lower.includes("pnp") ||
      lower.includes("mic in") ||
      lower.includes("aux") ||
      lower.includes("webcam") ||
      lower.includes("camera") ||
      lower.includes("c-media") ||
      lower.includes("yeti") ||
      lower.includes("rode") ||
      lower.includes("fifine") ||
      lower.includes("shure") ||
      lower.includes("boya") ||
      lower.includes("hyperx") ||
      lower.includes("jbl") ||
      lower.includes("logitech")
    );
  }, []);

  // 1. Fetch & Enumerate all audio input devices (Built-in + External USB)
  const loadAudioDevices = useCallback(async (promptPermission: boolean = false) => {
    setMicError(null);
    try {
      if (!navigator.mediaDevices?.enumerateDevices) {
        setMicError("Microphone device enumeration is not supported by this browser.");
        return;
      }

      // If requested or if labels might be empty, probe for permission
      if (promptPermission) {
        setRequestingPermission(true);
        try {
          const probeStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          probeStream.getTracks().forEach((track) => track.stop());
        } catch (probeErr: any) {
          console.warn("Audio permission probe:", probeErr?.message || probeErr);
        } finally {
          setRequestingPermission(false);
        }
      }

      // Always enumerate devices (even if standard getUserMedia failed, USB devices might still be listable)
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter((d) => d.kind === "audioinput");
      setDevices(audioInputs);

      // Check if any connected device is an external USB microphone
      const usbFound = audioInputs.some((d) => isUsbOrExternal(d.label));
      setHasUsbDevice(usbFound);

      // Pick best default device: prefer existing selection, then USB device, then first device
      if (audioInputs.length > 0) {
        const currentStillExists = audioInputs.some((d) => d.deviceId === selectedDeviceId);
        let targetId = selectedDeviceId;

        if (!targetId || !currentStillExists) {
          const firstUsb = audioInputs.find((d) => isUsbOrExternal(d.label));
          targetId = firstUsb ? firstUsb.deviceId : audioInputs[0].deviceId;
        }

        setSelectedDeviceId(targetId);
        const activeDev = audioInputs.find((d) => d.deviceId === targetId);
        const activeLabel = activeDev?.label || (targetId ? "External / USB Microphone" : "Default Microphone");
        setSelectedDeviceLabel(activeLabel);
        onDeviceSelect?.(targetId, activeLabel);
      } else {
        setMicError("No microphone detected. Please plug in an external USB microphone or enable your built-in mic.");
      }
    } catch (err: any) {
      console.warn("Device enumeration error:", err);
      setMicError(err?.message || "Unable to access microphone devices. Please allow permissions in browser.");
    }
  }, [isUsbOrExternal, onDeviceSelect, selectedDeviceId]);

  // 2. Start monitoring audio decibel levels for selected device
  const startMonitoring = useCallback(async (deviceId?: string) => {
    stopMonitoring();
    setMicError(null);

    try {
      let stream: MediaStream | null = null;

      // Strategy 1: Attempt exact device constraint (best for explicit USB selection)
      if (deviceId) {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              deviceId: { exact: deviceId },
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
        } catch (exactErr) {
          console.warn("Exact device constraint failed, trying ideal fallback:", exactErr);
          // Strategy 2: Ideal device constraint fallback
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: {
                deviceId: { ideal: deviceId },
                echoCancellation: true,
              },
            });
          } catch {
            stream = null;
          }
        }
      }

      // Strategy 3: General audio fallback if specific device failed
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
      }

      streamRef.current = stream;
      onStreamReady?.(stream);

      // Web Audio API decibel / frequency analyser
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        setMicActive(true);
        return;
      }

      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.4;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        // Normalize 0-128 to 0-100%
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setAudioLevel(normalized);
        onLevelChange?.(normalized);

        animFrameRef.current = requestAnimationFrame(checkLevel);
      };

      checkLevel();
      setMicActive(true);
    } catch (err: any) {
      console.warn("Audio monitoring connection notice:", err);
      setMicError(
        err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError"
          ? "Microphone access blocked. Click 'Allow' in your browser URL bar."
          : err?.name === "NotFoundError" || err?.name === "DevicesNotFoundError"
          ? "No audio device found. Please connect an external USB microphone."
          : err?.name === "NotReadableError"
          ? "Microphone in use by another application. Try selecting an external USB mic below."
          : err?.message || "Unable to connect to selected microphone."
      );
      setMicActive(false);
    }
  }, [onLevelChange, onStreamReady]);

  const stopMonitoring = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setAudioLevel(0);
    setMicActive(false);
  }, []);

  // Hotplug listener for USB microphones & audio devices
  useEffect(() => {
    loadAudioDevices(true);

    const handleDeviceChange = () => {
      console.log("Audio hardware device change detected. Rescanning microphones...");
      loadAudioDevices(false);
    };

    if (navigator.mediaDevices?.addEventListener) {
      navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);
    }

    return () => {
      if (navigator.mediaDevices?.removeEventListener) {
        navigator.mediaDevices.removeEventListener("devicechange", handleDeviceChange);
      }
      stopMonitoring();
    };
  }, [loadAudioDevices, stopMonitoring]);

  // Restart monitoring whenever selectedDeviceId updates
  useEffect(() => {
    if (selectedDeviceId) {
      startMonitoring(selectedDeviceId);
    }
    return () => {
      stopMonitoring();
    };
  }, [selectedDeviceId, startMonitoring, stopMonitoring]);

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    const chosen = devices.find((d) => d.deviceId === deviceId);
    const label = chosen?.label || (deviceId ? "External Microphone" : "Default Microphone");
    setSelectedDeviceLabel(label);
    onDeviceSelect?.(deviceId, label);
  };

  const isCurrentUsb = isUsbOrExternal(selectedDeviceLabel);

  return (
    <div className={`space-y-3 p-4 rounded-xl bg-slate-900 border border-slate-800 text-white shadow-md ${className}`}>
      {/* Header with Rescan / Permission Trigger */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
          {isCurrentUsb ? (
            <Usb size={15} className="text-cyan-400" />
          ) : (
            <Mic size={15} className="text-orange-400" />
          )}
          <span>Active Audio Input (Microphone)</span>
        </label>

        <button
          type="button"
          onClick={() => loadAudioDevices(true)}
          disabled={requestingPermission}
          className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer"
          title="Rescan connected audio devices"
        >
          <RefreshCw size={12} className={requestingPermission ? "animate-spin text-orange-400" : ""} />
          <span>{requestingPermission ? "Detecting..." : "Rescan Devices"}</span>
        </button>
      </div>

      {/* USB External Mic Badge Notification */}
      {hasUsbDevice && (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-800/80 text-[11px] text-cyan-300 font-medium">
          <Usb size={13} className="text-cyan-400 shrink-0" />
          <span>External USB microphone detected and ready for use.</span>
        </div>
      )}

      {/* Device dropdown with USB / External grouping */}
      <div className="space-y-1">
        <select
          value={selectedDeviceId}
          onChange={(e) => handleDeviceChange(e.target.value)}
          className="w-full bg-slate-800/90 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-sans cursor-pointer"
        >
          {devices.length === 0 ? (
            <option value="">Default Microphone (Plug in USB mic to select)</option>
          ) : (
            devices.map((device, idx) => {
              const usb = isUsbOrExternal(device.label);
              const label = device.label || `Audio Input ${idx + 1}`;
              return (
                <option key={device.deviceId || idx} value={device.deviceId}>
                  {usb ? `🔌 [USB / External] ${label}` : `💻 [Built-in / System] ${label}`}
                </option>
              );
            })
          )}
        </select>
      </div>

      {/* Error or "Unable" state helper banner with actionable USB fallback */}
      {micError && (
        <div className="p-3 rounded-xl bg-red-950/60 border border-red-800/80 text-xs text-red-200 space-y-2">
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-200 m-0">{micError}</p>
              <p className="text-[11px] text-red-300/80 m-0 pt-0.5">
                If your built-in microphone is disabled, connect any external USB microphone, headset, or webcam mic.
              </p>
            </div>
          </div>

          <div className="pt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() => loadAudioDevices(true)}
              className="px-3 py-1.5 rounded-lg bg-red-800/80 hover:bg-red-700 text-white font-bold text-[11px] flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <RefreshCw size={12} />
              <span>Retry Permission & Detect USB Mic</span>
            </button>
          </div>
        </div>
      )}

      {/* Real-time Decibel / Volume Bar with live speech visualizer */}
      <div className="space-y-1 pt-1">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span>Voice Input Level:</span>
            {micActive && audioLevel > 5 && (
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 size={11} />
                <span>Audio Detected</span>
              </span>
            )}
          </span>
          <span className="font-mono font-bold text-slate-200">{audioLevel}%</span>
        </div>

        <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-700/80">
          <div
            className={`h-full rounded-full transition-all duration-75 ${
              audioLevel > 65
                ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                : audioLevel > 15
                ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                : "bg-slate-700"
            }`}
            style={{ width: `${Math.max(2, audioLevel)}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
          <span>0% (Silent)</span>
          <span className="text-slate-400">Target Range: 20% - 60%</span>
          <span>100% (Peak)</span>
        </div>
      </div>
    </div>
  );
}

export default AudioDeviceSelector;
