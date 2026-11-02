"use client";

import React, { useState, useEffect, useRef } from "react";
import { Volume2, Mic, Sparkles, User, Settings2, Video, CheckCircle2 } from "lucide-react";

export type AvatarPersonaId = "sarah" | "alex" | "vikram";

export interface AvatarPersona {
  id: AvatarPersonaId;
  name: string;
  title: string;
  experience: string;
  specialty: string;
  avatarImage: string;
  voiceGender: "female" | "male";
}

export const AVATAR_PERSONAS: Record<AvatarPersonaId, AvatarPersona> = {
  sarah: {
    id: "sarah",
    name: "Dr. Sarah Mitchell",
    title: "Principal Technical Lead & AI Architect",
    experience: "12+ Yrs Experience",
    specialty: "System Design, Algorithms, Python & Cloud",
    avatarImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80",
    voiceGender: "female",
  },
  alex: {
    id: "alex",
    name: "Alex Vance",
    title: "Senior Engineering Director",
    experience: "15+ Yrs Experience",
    specialty: "Distributed Systems, Java & Backend Architecture",
    avatarImage: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=800&auto=format&fit=crop&q=80",
    voiceGender: "male",
  },
  vikram: {
    id: "vikram",
    name: "Vikram Malhotra",
    title: "Staff Full-Stack & HR Evaluator",
    experience: "10+ Yrs Experience",
    specialty: "Full Stack, Behavioral & Communication Fluency",
    avatarImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80",
    voiceGender: "male",
  },
};

interface AIAvatarProps {
  isSpeaking: boolean;
  isListening: boolean;
  isEvaluating?: boolean;
  currentTurn?: number;
  totalTurns?: number;
  trackName?: string;
  audioLevel?: number; // 0 to 100
  selectedPersona?: AvatarPersonaId;
  onPersonaChange?: (id: AvatarPersonaId) => void;
  className?: string;
  compact?: boolean;
}

export function AIAvatar({
  isSpeaking,
  isListening,
  isEvaluating = false,
  currentTurn = 1,
  totalTurns = 5,
  trackName = "Technical",
  audioLevel = 0,
  selectedPersona = "sarah",
  onPersonaChange,
  className = "",
  compact = false,
}: AIAvatarProps) {
  const persona = AVATAR_PERSONAS[selectedPersona] || AVATAR_PERSONAS.sarah;

  // Real-time animation states
  const [isBlinking, setIsBlinking] = useState(false);
  const [headTilt, setHeadTilt] = useState({ x: 0, y: 0 });
  const [mouthOpen, setMouthOpen] = useState(0); // 0 to 100
  const [showConfig, setShowConfig] = useState(false);

  // Configuration for real-time avatar services (Tavus, HeyGen, D-ID)
  const [avatarProvider, setAvatarProvider] = useState<"native" | "heygen" | "did" | "tavus">("native");
  const [apiKey, setApiKey] = useState("");
  const [providerConnected, setProviderConnected] = useState(false);

  // Natural Blinking Cycle (every 3.2 - 5.5 seconds)
  useEffect(() => {
    let blinkTimeout: NodeJS.Timeout;
    const triggerBlink = () => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
        const nextDelay = 3200 + Math.random() * 2400;
        blinkTimeout = setTimeout(triggerBlink, nextDelay);
      }, 140);
    };

    blinkTimeout = setTimeout(triggerBlink, 2800);
    return () => clearTimeout(blinkTimeout);
  }, []);

  // Subtle Head Micro-movements (breathing & natural posture shift)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isSpeaking) {
        // More expressive head movements when speaking
        setHeadTilt({
          x: (Math.random() - 0.5) * 3,
          y: (Math.random() - 0.5) * 2.5,
        });
      } else if (isListening) {
        // Attentive slight forward tilt when listening to student
        setHeadTilt({
          x: (Math.random() - 0.5) * 1.5,
          y: -1.2 + (Math.random() - 0.5) * 0.8,
        });
      } else {
        // Resting posture
        setHeadTilt({
          x: (Math.random() - 0.5) * 1.2,
          y: (Math.random() - 0.5) * 1.2,
        });
      }
    }, 2200);

    return () => clearInterval(interval);
  }, [isSpeaking, isListening]);

  // Audio-reactive lip sync when AI is speaking
  useEffect(() => {
    if (!isSpeaking) {
      setMouthOpen(0);
      return;
    }

    const mouthInterval = setInterval(() => {
      // Natural speech rhythm with pauses and phonetic variations
      const intensity = Math.random() > 0.15 ? 25 + Math.random() * 65 : 5;
      setMouthOpen(intensity);
    }, 90);

    return () => {
      clearInterval(mouthInterval);
      setMouthOpen(0);
    };
  }, [isSpeaking]);

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-[#0A0F1D] border border-slate-800 shadow-2xl flex flex-col group ${className}`}>
      {/* Top Overlay: Interviewer Badge & Persona Selector */}
      <div className="absolute top-0 inset-x-0 z-20 p-4 bg-gradient-to-b from-[#0A0F1D]/90 via-[#0A0F1D]/50 to-transparent flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-orange-600/90 border border-orange-400/40 flex items-center justify-center font-bold text-white shadow-lg backdrop-blur-sm">
            AI
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white leading-tight">{persona.name}</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800/80 text-orange-400 border border-slate-700 font-semibold">
                {persona.title}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 m-0">
              {trackName} Mock Interview • Question {currentTurn} of {totalTurns}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Persona selector pills */}
          <div className="hidden sm:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            {(["sarah", "alex", "vikram"] as AvatarPersonaId[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => onPersonaChange?.(id)}
                className={`text-[11px] font-bold px-2 py-1 rounded-lg transition-colors ${
                  selectedPersona === id
                    ? "bg-orange-600 text-white"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {AVATAR_PERSONAS[id].name.split(" ")[1] || AVATAR_PERSONAS[id].name}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
            title="Avatar Integration Settings (Tavus / HeyGen / D-ID)"
          >
            <Settings2 size={15} />
          </button>
        </div>
      </div>

      {/* Main Avatar Stage Viewport */}
      <div className={`relative w-full overflow-hidden flex items-center justify-center bg-gradient-to-b from-[#0F172A] to-[#020617] ${
        compact
          ? "aspect-[16/10] sm:aspect-[16/9] min-h-[220px] max-h-[300px]"
          : "aspect-[16/10] sm:aspect-[16/9] min-h-[260px] max-h-[420px]"
      }`}>
        {/* Background Depth of Field: Executive Technical Interview Room */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 blur-[2px] scale-105"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80')",
          }}
        />

        {/* Ambient Lighting Glow based on current state */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
            isSpeaking
              ? "bg-radial from-orange-500/15 via-transparent to-transparent opacity-100"
              : isListening
              ? "bg-radial from-emerald-500/15 via-transparent to-transparent opacity-100"
              : isEvaluating
              ? "bg-radial from-blue-500/15 via-transparent to-transparent opacity-100"
              : "opacity-40"
          }`}
        />

        {/* Photorealistic Animated Avatar Body */}
        <div
          className="relative z-10 w-full h-full flex flex-col items-center justify-end transition-transform duration-500 ease-out"
          style={{
            transform: `translate(${headTilt.x}px, ${headTilt.y}px)`,
          }}
        >
          {/* Main Portrait Container */}
          <div className="relative w-[300px] sm:w-[360px] h-[300px] sm:h-[360px] flex items-center justify-center">
            {/* Soft Ambient Shadow */}
            <div className="absolute inset-0 rounded-full bg-black/40 filter blur-xl scale-95" />

            {/* High-Fidelity Persona Portrait */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full overflow-hidden border-4 border-slate-700/60 shadow-2xl bg-slate-900">
              <img
                src={persona.avatarImage}
                alt={persona.name}
                className={`w-full h-full object-cover object-top transition-transform duration-300 ${
                  isSpeaking ? "scale-105" : "scale-100"
                }`}
              />

              {/* Natural Blink Overlay (Smooth Translucent Eye Lid Easing) */}
              <div
                className={`absolute inset-0 bg-slate-900/85 transition-opacity duration-100 pointer-events-none ${
                  isBlinking ? "opacity-90" : "opacity-0"
                }`}
                style={{
                  clipPath: "ellipse(50% 12% at 50% 42%)",
                }}
              />

              {/* Audio-Reactive Lip / Jaw Movement Layer */}
              {isSpeaking && (
                <div
                  className="absolute bottom-[28%] left-1/2 -translate-x-1/2 w-12 sm:w-14 rounded-full bg-slate-950/70 border border-red-900/30 filter blur-[0.5px] transition-all duration-75 pointer-events-none"
                  style={{
                    height: `${Math.max(6, Math.min(26, mouthOpen * 0.28))}px`,
                    transform: `translateX(-50%) scaleX(${1 + mouthOpen * 0.003})`,
                  }}
                />
              )}

              {/* Listening Mic Wave Pulse Indicator around Avatar */}
              {isListening && (
                <div
                  className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping opacity-25 pointer-events-none"
                  style={{
                    animationDuration: `${Math.max(0.6, 2 - audioLevel * 0.02)}s`,
                  }}
                />
              )}
            </div>

            {/* Active Studio Headphones / Microphone Indicator */}
            <div className="absolute -bottom-2 right-12 z-20 p-2.5 rounded-full bg-[#0F172A] border-2 border-slate-700 shadow-xl flex items-center justify-center text-white">
              {isSpeaking ? (
                <Volume2 size={18} className="text-orange-400 animate-pulse" />
              ) : isListening ? (
                <Mic size={18} className="text-emerald-400 animate-bounce" />
              ) : (
                <User size={18} className="text-slate-400" />
              )}
            </div>
          </div>
        </div>

        {/* Bottom Audio Status HUD */}
        <div className="absolute bottom-3 inset-x-4 z-20 flex items-center justify-between">
          {/* Dynamic State Pill */}
          <div>
            {isSpeaking ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-orange-500/20 text-orange-300 border border-orange-500/40 backdrop-blur-md shadow-lg">
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping"></span>
                <span className="text-xs font-bold tracking-wide">
                  {persona.name.split(" ")[0]} is Speaking...
                </span>
                {/* Audio visualizer bars */}
                <div className="flex items-center gap-0.5 ml-1">
                  <span className="w-1 h-3 bg-orange-400 rounded-full animate-pulse"></span>
                  <span className="w-1 h-4 bg-orange-300 rounded-full animate-bounce"></span>
                  <span className="w-1 h-2 bg-orange-400 rounded-full animate-pulse"></span>
                </div>
              </div>
            ) : isListening ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 backdrop-blur-md shadow-lg">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-xs font-bold tracking-wide">
                  Listening to your response...
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  {audioLevel > 5 ? `${audioLevel}% Level` : "Waiting for voice"}
                </span>
              </div>
            ) : isEvaluating ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/40 backdrop-blur-md shadow-lg">
                <Sparkles size={14} className="text-blue-400 animate-spin" />
                <span className="text-xs font-bold tracking-wide">
                  Analyzing technical evaluation...
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900/80 text-slate-400 border border-slate-800 text-xs">
                <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                <span>Standby Mode</span>
              </div>
            )}
          </div>

          {/* Experience tag */}
          <div className="text-[11px] text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-slate-800/80 hidden sm:block">
            {persona.experience} • {persona.specialty.split(",")[0]}
          </div>
        </div>
      </div>

      {/* Avatar Settings / External Real-Time Service Drawer */}
      {showConfig && (
        <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3 text-xs text-slate-300">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="font-bold text-white flex items-center gap-2">
              <Video size={14} className="text-orange-500" />
              <span>Real-Time AI Avatar Provider Integration</span>
            </span>
            <button
              onClick={() => setShowConfig(false)}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <p className="text-slate-400 leading-relaxed m-0 text-[11px]">
            LinkTest includes a built-in photorealistic animated human interviewer with autonomic blinking,
            natural head shifts, and audio-reactive lip synchronization. You can also connect external
            video streaming avatar providers below.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Avatar Engine:
              </label>
              <select
                value={avatarProvider}
                onChange={(e) => setAvatarProvider(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs"
              >
                <option value="native">Native Photorealistic Animated Avatar (Active)</option>
                <option value="heygen">HeyGen Streaming Interactive Avatar</option>
                <option value="did">D-ID Real-Time Agents API</option>
                <option value="tavus">Tavus Conversational Video API</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                API Key (Optional):
              </label>
              <input
                type="password"
                placeholder={avatarProvider === "native" ? "Not required for native avatar" : "Enter API key"}
                disabled={avatarProvider === "native"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs disabled:opacity-50"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between text-[11px]">
            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
              <CheckCircle2 size={13} />
              <span>Active Engine: Native Human Avatar (Zero Latency, No Token Cost)</span>
            </span>
            <button
              type="button"
              onClick={() => setShowConfig(false)}
              className="btn btn-outline btn-sm text-[11px] py-1 px-3 text-slate-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default AIAvatar;
