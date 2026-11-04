"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, Volume2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

interface AudioDeviceSelectorProps {
  onStreamReady?: (stream: MediaStream) => void;
  onLevelChange?: (level: number) => void;
  initialDeviceId?: string;
}

export function AudioDeviceSelector({
  onStreamReady,
  onLevelChange,
  initialDeviceId,
}: AudioDeviceSelectorProps) {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(initialDeviceId || "");
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [micActive, setMicActive] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // 1. Fetch available microphones
  const loadAudioDevices = async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) {
        setMicError("Media devices enumeration not supported in this browser.");
        return;
      }

      // Request permission once to ensure device labels are populated
      await navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
        stream.getTracks().forEach((t) => t.stop());
      });

      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter((d) => d.kind === "audioinput");
      setDevices(audioInputs);

      if (audioInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(audioInputs[0].deviceId);
      }
    } catch (err: unknown) {
      const e = err as Error;
      console.warn("Failed to enumerate devices:", e);
      setMicError(e.message || "Microphone access denied.");
    }
  };

  // 2. Start monitoring audio levels for selected device
  const startMonitoring = async (deviceId?: string) => {
    stopMonitoring();
    setMicError(null);

    try {
      const constraints: MediaStreamConstraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      onStreamReady?.(stream);

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
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
    } catch (err: unknown) {
      const e = err as Error;
      console.error("Audio monitoring failed:", e);
      setMicError(e.message || "Could not connect to microphone");
      setMicActive(false);
    }
  };

  const stopMonitoring = () => {
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
  };

  useEffect(() => {
    loadAudioDevices();
    startMonitoring(selectedDeviceId);

    return () => {
      stopMonitoring();
    };
  }, [selectedDeviceId]);

  return (
    <div className="space-y-3 p-4 rounded-xl bg-slate-900 border border-slate-800 text-white">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
          <Mic size={14} className="text-orange-400" />
          <span>Active Microphone Input</span>
        </label>
        <button
          type="button"
          onClick={loadAudioDevices}
          className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
          title="Refresh devices"
        >
          <RefreshCw size={12} />
          <span>Rescan</span>
        </button>
      </div>

      {/* Device dropdown */}
      <select
        value={selectedDeviceId}
        onChange={(e) => setSelectedDeviceId(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-orange-500"
      >
        {devices.length === 0 ? (
          <option value="">Default Microphone</option>
        ) : (
          devices.map((device, idx) => (
            <option key={device.deviceId || idx} value={device.deviceId}>
              {device.label || `Microphone ${idx + 1}`}
            </option>
          ))
        )}
      </select>

      {micError && (
        <div className="p-2 rounded-lg bg-red-950/60 border border-red-800/80 text-[11px] text-red-300 flex items-center gap-1.5">
          <AlertCircle size={13} className="shrink-0" />
          <span>{micError}</span>
        </div>
      )}

      {/* Real-time Decibel / Volume Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span>Input Volume (Speak now to test):</span>
          <span className="font-mono font-bold text-slate-200">{audioLevel}%</span>
        </div>

        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
          <div
            className={`h-full rounded-full transition-all duration-75 ${
              audioLevel > 60
                ? "bg-red-500"
                : audioLevel > 15
                ? "bg-emerald-500"
                : "bg-slate-600"
            }`}
            style={{ width: `${audioLevel}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] text-slate-500 pt-0.5">
          <span>0 dB</span>
          <span>Target Speech: 25 - 65%</span>
          <span>100 dB</span>
        </div>
      </div>
    </div>
  );
}
export default AudioDeviceSelector;
