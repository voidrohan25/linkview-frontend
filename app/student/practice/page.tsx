"use client";

import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Mic, Sparkles, MessageSquare, Award, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function StudentPracticePage() {
  const practiceTracks = [
    {
      id: "comm-intro",
      title: "Self Introduction & Elevator Pitch",
      category: "Communication",
      description: "Deliver a structured 90-second professional introduction highlighting your stack, projects, and goals.",
      durationMinutes: 10,
      freeAttemptsRemaining: 3,
      trackId: "communication",
      persona: "Dr. Sarah Mitchell",
      color: "orange",
    },
    {
      id: "comm-hr",
      title: "Basic HR & Behavioral Questions",
      category: "HR",
      description: "Master standard HR inquiries on conflict management, team collaboration, leadership, and strengths.",
      durationMinutes: 15,
      freeAttemptsRemaining: 2,
      trackId: "hr",
      persona: "Vikram Malhotra",
      color: "blue",
    },
    {
      id: "comm-fluency",
      title: "English Fluency & Verbal Articulation",
      category: "Fluency",
      description: "Develop crisp verbal cadence, reduced filler words, and professional engineering vocabulary.",
      durationMinutes: 12,
      freeAttemptsRemaining: 3,
      trackId: "communication",
      persona: "Alex Vance",
      color: "emerald",
    },
    {
      id: "comm-workplace",
      title: "Workplace Situational Handling",
      category: "Behavioral",
      description: "Demonstrate ownership under pressure, cross-functional communication, and stakeholder diplomacy.",
      durationMinutes: 15,
      freeAttemptsRemaining: 2,
      trackId: "communication",
      persona: "Dr. Sarah Mitchell",
      color: "purple",
    },
    {
      id: "comm-confidence",
      title: "Speaking Confidence & Executive Presence",
      category: "Leadership",
      description: "Refine vocal tone, eye contact pacing, and persuasive technical storytelling for hiring rounds.",
      durationMinutes: 10,
      freeAttemptsRemaining: 3,
      trackId: "communication",
      persona: "Vikram Malhotra",
      color: "amber",
    },
  ];

  return (
    <AppShell role="student">
      <div className="max-w-[1280px] mx-auto space-y-6">
        {/* Header */}
        <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-700 uppercase tracking-wider">
                FREE COMMUNICATION PRACTICE
              </span>
              <span className="text-xs text-slate-400">• On-Demand Voice Lab</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#0F172A] m-0">
              Practice Your Communication Skills
            </h1>
            <p className="text-xs text-slate-500 m-0">
              Unlimited practice on verbal fluency, elevator pitches, and behavioral situational questions.
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <CheckCircle2 size={15} className="text-emerald-600" />
            <span>Free Tier Active • 13 Total Attempts Available</span>
          </div>
        </div>

        {/* Practice Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {practiceTracks.map((item) => (
            <div
              key={item.id}
              className="card p-5 bg-white border border-[#E2E8F0] hover:border-orange-300 hover:shadow-md transition-all rounded-2xl flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {item.category}
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {item.freeAttemptsRemaining} Attempts Left
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-extrabold text-[#0F172A] leading-snug m-0 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed m-0">
                    {item.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>Duration: ~{item.durationMinutes} mins</span>
                  <span>Interviewer: {item.persona}</span>
                </div>

                <Link
                  href="/student/interview/active"
                  className="btn btn-primary w-full text-xs py-2 font-bold flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Mic size={14} />
                  <span>Start Practice Session</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
