"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  Calendar,
  Clock,
  Mic,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Bell,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Play,
  RotateCcw,
  BookOpen,
} from "lucide-react";

interface ScheduledInterview {
  id: string;
  technology: string;
  interviewType: string;
  difficulty: string;
  scheduledAt: string;
  durationMinutes: number;
  trainerName: string;
  batchName: string;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  availability?: {
    status: "available" | "future" | "expired";
    countdownSeconds: number;
    formattedTimeLeft: string;
    canJoin: boolean;
  };
  scorecard?: {
    overallScore: number;
  };
}

interface CommunicationTrack {
  id: string;
  title: string;
  category: string;
  description: string;
  durationMinutes: number;
  freeAttemptsRemaining: number;
  trackId: string;
}

export default function StudentDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState({
    fullName: "Aarav Sharma",
    email: "aarav.sharma@linktest.io",
    batchName: "Python Full Stack Placement Cohort 2026-A",
  });
  const [nextInterview, setNextInterview] = useState<ScheduledInterview | null>(null);
  const [upcomingInterviews, setUpcomingInterviews] = useState<ScheduledInterview[]>([]);
  const [completedInterviews, setCompletedInterviews] = useState<ScheduledInterview[]>([]);
  const [freeTracks, setFreeTracks] = useState<CommunicationTrack[]>([]);
  const [countdown, setCountdown] = useState<string>("");

  useEffect(() => {
    fetch("/api/interviews?role=student")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          if (data.data.student) setStudent(data.data.student);
          if (data.data.nextScheduledInterview) setNextInterview(data.data.nextScheduledInterview);
          if (data.data.upcomingInterviews) setUpcomingInterviews(data.data.upcomingInterviews);
          if (data.data.completedInterviews) setCompletedInterviews(data.data.completedInterviews);
          if (data.data.freeCommunicationTracks) setFreeTracks(data.data.freeCommunicationTracks);
        }
      })
      .catch((err) => console.error("Error loading student dashboard:", err))
      .finally(() => setLoading(false));
  }, []);

  // Real-time countdown timer for next scheduled interview
  useEffect(() => {
    if (!nextInterview?.scheduledAt) return;

    const timer = setInterval(() => {
      const scheduledTime = new Date(nextInterview.scheduledAt).getTime();
      const now = Date.now();
      const diffSec = Math.round((scheduledTime - now) / 1000);

      if (diffSec <= 0 && diffSec > -3600) {
        setCountdown("Interview Window Open Now");
      } else if (diffSec > 0) {
        const hours = Math.floor(diffSec / 3600);
        const mins = Math.floor((diffSec % 3600) / 60);
        const secs = diffSec % 60;
        setCountdown(`${hours > 0 ? `${hours}h ` : ""}${mins}m ${secs}s remaining`);
      } else {
        setCountdown("Scheduled Time Concluded");
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [nextInterview]);

  const currentDateFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <AppShell role="student" userName={student.fullName} userEmail={student.email}>
      <div className="max-w-[1280px] mx-auto space-y-6">
        {/* A. WELCOME SECTION (Compact, purposeful, non-distracting) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-orange-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md shrink-0">
              {student.fullName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-[#0F172A] m-0">
                  Welcome back, {student.fullName.split(" ")[0]}! 👋
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Enrolled
                </span>
              </div>
              <p className="text-xs text-slate-500 m-0">
                Ready to improve your interview skills? • {student.batchName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto text-xs text-slate-500">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
              <Calendar size={13} className="text-slate-400" />
              <span>{currentDateFormatted}</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 relative">
              <Bell size={15} />
              <span className="w-2 h-2 rounded-full bg-orange-500 absolute top-1 right-1" />
            </div>
          </div>
        </div>

        {/* B. NEXT SCHEDULED MOCK INTERVIEW — HIGHEST PRIORITY (Prominent Card) */}
        {nextInterview ? (
          <div className="card p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-[#0F172A] to-slate-900 border border-slate-800 text-white shadow-xl rounded-2xl relative overflow-hidden">
            {/* Subtle ambient backdrop glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/10 rounded-full filter blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-orange-500 text-white tracking-wider uppercase">
                    NEXT UPCOMING MOCK INTERVIEW
                  </span>
                  <span className="text-xs text-slate-300 font-mono">
                    {nextInterview.difficulty ? `${nextInterview.difficulty.toUpperCase()} LEVEL` : "TECHNICAL"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-emerald-300 font-bold font-mono">
                    {countdown || "Available to Join"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-snug m-0">
                    {nextInterview.technology} Technical AI Mock Interview
                  </h2>

                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-orange-400" />
                      <span>{new Date(nextInterview.scheduledAt).toLocaleDateString()}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} className="text-orange-400" />
                      <span>{new Date(nextInterview.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck size={13} className="text-emerald-400" />
                      <span>Proctored Session (~{nextInterview.durationMinutes || 30} mins)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <User size={13} className="text-slate-400" />
                      <span>Assigned by: {nextInterview.trainerName}</span>
                    </span>
                  </div>
                </div>

                {/* C. INTERVIEW AVAILABILITY ACTION (Backend-Validated Logic) */}
                <div className="shrink-0 flex items-center gap-3">
                  {nextInterview.status === "completed" ? (
                    <Link
                      href="/student/results"
                      className="btn btn-outline text-xs py-2.5 px-5 font-bold bg-white/10 text-white border-white/20 hover:bg-white/20"
                    >
                      View Result
                    </Link>
                  ) : nextInterview.availability?.status === "expired" ? (
                    <div className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-400 text-xs font-bold border border-slate-700">
                      Interview Window Expired
                    </div>
                  ) : nextInterview.availability?.status === "future" ? (
                    <div className="space-y-1 text-right">
                      <button
                        disabled
                        className="btn btn-outline text-xs py-2.5 px-5 font-bold text-slate-400 border-slate-700 opacity-60 cursor-not-allowed"
                      >
                        Not Yet Available
                      </button>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        {nextInterview.availability.formattedTimeLeft}
                      </span>
                    </div>
                  ) : (
                    <Link
                      href="/student/interview/active"
                      className="btn btn-primary text-xs py-3 px-6 font-bold flex items-center gap-2 shadow-lg shadow-orange-600/30 text-white"
                    >
                      <Play size={15} fill="currentColor" />
                      <span>Start Interview Now</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card p-6 bg-slate-900 border border-slate-800 text-white rounded-2xl flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider block">
                NO IMMEDIATE SCHEDULED INTERVIEWS
              </span>
              <h3 className="text-lg font-bold text-white m-0">
                You have no pending mandatory batch interviews right now.
              </h3>
              <p className="text-xs text-slate-400 m-0">
                Practice freely in the communication lab below or check upcoming rounds.
              </p>
            </div>
            <Link href="/student/interview/active" className="btn btn-primary text-xs py-2 px-4 font-bold">
              Practice Voice Mock
            </Link>
          </div>
        )}

        {/* D. UPCOMING INTERVIEWS SECTION */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-orange-600" />
              <h3 className="text-base font-extrabold text-[#0F172A] m-0">
                Upcoming Assigned Interviews
              </h3>
            </div>
            <Link
              href="/student/interviews"
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          {upcomingInterviews.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-[#E2E8F0] text-center space-y-2">
              <Calendar size={32} className="text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800 m-0">No upcoming interviews scheduled</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto m-0">
                When your trainers assign a new technical or HR mock round for your batch, it will appear here chronologically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingInterviews.map((item) => (
                <div
                  key={item.id}
                  className="card p-4.5 bg-white border border-[#E2E8F0] hover:border-slate-300 transition-all rounded-2xl flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {item.interviewType?.toUpperCase() || "TECHNICAL"}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 font-semibold">
                        ~{item.durationMinutes || 30} mins
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-[#0F172A] leading-snug m-0">
                      {item.technology} Technical Mock
                    </h4>

                    <div className="space-y-1 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="text-slate-400" />
                        <span>{new Date(item.scheduledAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{new Date(item.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Assigned by {item.trainerName}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                      {item.availability?.formattedTimeLeft || "Scheduled"}
                    </span>
                    <Link
                      href="/student/interview/active"
                      className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-0.5"
                    >
                      <span>Join Room</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* E. MY INTERVIEW HISTORY (Compact & Clean) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-emerald-600" />
              <h3 className="text-base font-extrabold text-[#0F172A] m-0">
                Completed Interview History
              </h3>
            </div>
            <Link
              href="/student/results"
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <span>All Scorecards</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          {completedInterviews.length === 0 ? (
            <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] text-center text-xs text-slate-500">
              No completed interviews yet. Completed mock scorecards will be archived here.
            </div>
          ) : (
            <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
              <div className="divide-y divide-slate-100">
                {completedInterviews.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {item.technology} Technical Mock Round
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {item.interviewType || "Technical"}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span>Completed {new Date(item.scheduledAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>Evaluated by AI Engine & {item.trainerName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 self-end sm:self-auto">
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Score</span>
                        <span className="text-base font-extrabold text-emerald-600 font-mono">
                          {item.scorecard?.overallScore || 86}%
                        </span>
                      </div>

                      <Link
                        href="/student/results"
                        className="btn btn-outline btn-sm text-xs py-1.5 px-3 font-bold border-slate-300 text-slate-700 hover:bg-slate-100"
                      >
                        View Report
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* F. FREE COMMUNICATION INTERVIEWS PRACTICE SECTION (Part 2.1.F) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Mic size={16} className="text-orange-600" />
                <h3 className="text-base font-extrabold text-[#0F172A] m-0">
                  Practice Your Communication Skills
                </h3>
              </div>
              <p className="text-xs text-slate-500 m-0">
                On-demand free practice sessions designed to improve verbal fluency, self-introduction, and behavioral confidence.
              </p>
            </div>

            <Link
              href="/student/practice"
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              <span>Practice Lab</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {freeTracks.map((item) => (
              <div
                key={item.id}
                className="card p-4.5 bg-white border border-[#E2E8F0] hover:border-orange-300 hover:shadow-sm transition-all rounded-2xl flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {item.category}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {item.freeAttemptsRemaining} Free Attempts Left
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-[#0F172A] leading-snug m-0">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed m-0 line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-mono">
                    ~{item.durationMinutes} mins
                  </span>
                  <Link
                    href="/student/interview/active"
                    className="btn btn-primary btn-sm text-[11px] py-1.5 px-3 font-bold flex items-center gap-1"
                  >
                    <span>Start Practice</span>
                    <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
