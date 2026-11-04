"use client";

import React from "react";
import { Volume2, Mic, CheckCircle2, Activity, Bot } from "lucide-react";

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
    avatarImage: "/ai-interviewer.jpg",
    voiceGender: "female",
  },
  alex: {
    id: "alex",
    name: "Alex Vance",
    title: "Senior Engineering Director",
    experience: "15+ Yrs Experience",
    specialty: "Distributed Systems, Java & Backend Architecture",
    avatarImage: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=1000&auto=format&fit=crop&q=85",
    voiceGender: "male",
  },
  vikram: {
    id: "vikram",
    name: "Vikram Malhotra",
    title: "Staff Full-Stack & Systems Lead",
    experience: "10+ Yrs Experience",
    specialty: "Full Stack, Architecture & System Concurrency",
    avatarImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1000&auto=format&fit=crop&q=85",
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
  minimalMode?: boolean;
}

export function AIAvatar({
  isSpeaking,
  isListening,
  isEvaluating = false,
  currentTurn = 1,
  totalTurns = 3,
  trackName = "Technical",
  audioLevel = 0,
  selectedPersona = "sarah",
  onPersonaChange,
  className = "",
  compact = false,
  minimalMode = false,
}: AIAvatarProps) {
  const persona = AVATAR_PERSONAS[selectedPersona] || AVATAR_PERSONAS.sarah;

  if (minimalMode) {
    return (
      <div
        className={`relative w-full aspect-[16/9] min-h-[220px] sm:min-h-[260px] md:min-h-[300px] overflow-hidden bg-slate-950 flex items-center justify-center ${className}`}
      >
        {/* Main Presenter Frame from User Reference Image */}
        <img
          src={persona.avatarImage}
          alt={persona.name}
          className={`w-full h-full object-cover transition-transform duration-700 ${
            isSpeaking ? "scale-[1.02]" : "scale-100"
          }`}
        />

          {/* Dynamic Ambient Lighting based on speaking/listening state */}
          <div
            className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
              isSpeaking
                ? "bg-gradient-to-t from-orange-950/40 via-transparent to-slate-950/20 opacity-100"
                : isListening
                ? "bg-gradient-to-t from-emerald-950/30 via-transparent to-slate-950/20 opacity-100"
                : "opacity-20"
            }`}
          />

          {/* Exact Reference Pill: [ 🤖 AI Interviewer ● ] in bottom-left */}
          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0B0F19]/80 backdrop-blur-md border border-slate-700/60 text-white text-xs font-semibold shadow-xl pointer-events-none">
            <Bot size={15} className="text-cyan-400" />
            <span>AI Interviewer</span>
            <span
              className={`w-2 h-2 rounded-full ${
                isSpeaking
                  ? "bg-orange-400 animate-ping"
                  : isListening
                  ? "bg-emerald-400 animate-pulse"
                  : "bg-emerald-400"
              } ml-0.5`}
            />
          </div>

          {/* Animated Waveform when AI speaks */}
          {isSpeaking && (
            <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-orange-500/40 shadow-xl pointer-events-none">
              <span className="w-1 h-3.5 bg-orange-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1 h-5 bg-orange-300 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1 h-2 bg-orange-400 rounded-full animate-bounce" />
              <span className="w-1 h-4 bg-orange-300 rounded-full animate-bounce [animation-delay:-0.2s]" />
              <span className="text-[11px] font-bold text-orange-200 ml-1">Speaking...</span>
            </div>
          )}
        </div>
    );
  }

  // Standard fallback mode
  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-700/80 bg-[#0F172A] shadow-xl flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800/80 z-20 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
          <span className="text-xs font-bold text-slate-200">{persona.name}</span>
          <span className="hidden sm:inline-block text-[10px] text-slate-400">
            • {persona.title.split("&")[0].trim()}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
            {(Object.keys(AVATAR_PERSONAS) as AvatarPersonaId[]).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => onPersonaChange?.(id)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all ${
                  selectedPersona === id
                    ? "bg-orange-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {AVATAR_PERSONAS[id].name.split(" ")[1] || AVATAR_PERSONAS[id].name}
              </button>
            ))}
          </div>

          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 size={10} />
            <span className="hidden md:inline">1080p HD</span>
          </span>
        </div>
      </div>

      <div className="relative w-full bg-slate-950 flex items-center justify-center overflow-hidden aspect-[16/9] min-h-[180px] sm:min-h-[220px] max-h-[300px]">
        <img
          src={persona.avatarImage}
          alt={persona.name}
          className={`h-full w-auto max-w-full object-cover object-top transition-transform duration-500 ${
            isSpeaking ? "scale-[1.02]" : "scale-100"
          }`}
        />
      </div>

      <div className="px-3.5 py-2 bg-slate-900/95 border-t border-slate-800/80 flex items-center justify-between text-xs z-20 shrink-0">
        <div className="flex items-center gap-2">
          {isSpeaking ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/40 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
              <span>{persona.name.split(" ")[0]} is speaking...</span>
            </div>
          ) : isListening ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Listening to candidate response</span>
            </div>
          ) : isEvaluating ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[11px] font-bold">
              <Activity size={12} className="animate-spin text-blue-400" />
              <span>Evaluating against rubric...</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-slate-400 text-[11px]">
              <Volume2 size={13} className="text-slate-500" />
              <span>Ready for next turn</span>
            </div>
          )}
        </div>

        <div className="text-[11px] text-slate-400 font-medium">
          Turn <strong className="text-slate-200">{currentTurn}</strong> of {totalTurns}
        </div>
      </div>
    </div>
  );
}
