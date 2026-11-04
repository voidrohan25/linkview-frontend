"use client";

import React, { useState, useEffect } from "react";
import { Volume2, Mic, Sparkles, User, Video, CheckCircle2, Activity } from "lucide-react";

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
    avatarImage: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1000&auto=format&fit=crop&q=85",
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
}: AIAvatarProps) {
  const persona = AVATAR_PERSONAS[selectedPersona] || AVATAR_PERSONAS.sarah;

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-700/80 bg-[#0F172A] shadow-xl flex flex-col justify-between ${className}`}
    >
      {/* 1. Header Toolbar (Identical to StudentWebcamFeed for perfect horizontal alignment) */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800/80 z-20 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
          <span className="text-xs font-bold text-slate-200">
            {persona.name}
          </span>
          <span className="hidden sm:inline-block text-[10px] text-slate-400">
            • {persona.title.split("&")[0].trim()}
          </span>
        </div>

        {/* Persona Switcher Buttons */}
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

      {/* 2. Main Stage: Realistic Professional Video Feed */}
      <div
        className={`relative w-full bg-slate-950 flex items-center justify-center overflow-hidden aspect-[16/9] min-h-[180px] sm:min-h-[220px] max-h-[300px]`}
      >
        {/* Background Studio / Executive Office Depth */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40 blur-[1px] scale-105 transition-all duration-700"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80')",
          }}
        />

        {/* Dynamic Studio Lighting Ambient Overlay */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 pointer-events-none ${
            isSpeaking
              ? "bg-gradient-to-t from-orange-950/60 via-transparent to-slate-950/40 opacity-100"
              : isListening
              ? "bg-gradient-to-t from-emerald-950/50 via-transparent to-slate-950/40 opacity-100"
              : isEvaluating
              ? "bg-gradient-to-t from-blue-950/60 via-transparent to-slate-950/40 opacity-100"
              : "opacity-40"
          }`}
        />

        {/* Professional Interviewer Presenter Portrait */}
        <div className="relative z-10 w-full h-full flex items-end justify-center">
          <img
            src={persona.avatarImage}
            alt={persona.name}
            className={`h-full w-auto max-w-full object-cover object-top transition-transform duration-500 ${
              isSpeaking ? "scale-[1.02]" : "scale-100"
            }`}
          />
        </div>

        {/* Live Speaking Multi-Bar Audio Waveform Overlay */}
        {isSpeaking && (
          <div className="absolute inset-x-0 bottom-12 z-20 flex items-center justify-center gap-1 pointer-events-none">
            <div className="px-3.5 py-1.5 rounded-full bg-slate-950/80 border border-orange-500/50 backdrop-blur-md shadow-2xl flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-5 bg-orange-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-2.5 bg-orange-300 rounded-full animate-bounce" />
              <span className="w-1.5 h-6 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.2s]" />
              <span className="w-1.5 h-4 bg-orange-400 rounded-full animate-bounce [animation-delay:-0.1s]" />
              <span className="w-1.5 h-2 bg-orange-500 rounded-full animate-bounce [animation-delay:-0.25s]" />
              <span className="text-[11px] font-bold text-orange-200 ml-1.5">
                AI Speech Synthesis Live
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Bottom Status HUD Bar */}
      <div className="px-3.5 py-2 bg-slate-900/95 border-t border-slate-800/80 flex items-center justify-between text-xs z-20 shrink-0">
        {/* Dynamic Status Pill */}
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
              <span className="text-[10px] text-emerald-400 font-mono ml-0.5">
                {audioLevel > 5 ? `(${audioLevel}% lvl)` : ""}
              </span>
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

        {/* Turn Indicator */}
        <div className="text-[11px] text-slate-400 font-medium">
          Turn <strong className="text-slate-200">{currentTurn}</strong> of {totalTurns}
        </div>
      </div>
    </div>
  );
}
