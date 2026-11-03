"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/lib/supabase";
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
  approvalStatus?: "not_requested" | "pending" | "approved" | "rejected";
  approvalRequestedAt?: string;
  approvalDecisionAt?: string;
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
    fullName: "Student",
    email: "",
    batchName: "Placement Cohort 2026",
  });
  const [nextInterview, setNextInterview] = useState<ScheduledInterview | null>(null);
  const [upcomingInterviews, setUpcomingInterviews] = useState<ScheduledInterview[]>([]);
  const [completedInterviews, setCompletedInterviews] = useState<ScheduledInterview[]>([]);
  const [freeTracks, setFreeTracks] = useState<CommunicationTrack[]>([]);
  const [countdown, setCountdown] = useState<string>("");
  const [requestingApproval, setRequestingApproval] = useState(false);

  const loadDashboard = useCallback((userEmail?: string, silent = false) => {
    if (!silent) setLoading(true);
    const emailToUse = userEmail || student.email;
    const url = emailToUse
      ? `/api/interviews?role=student&email=${encodeURIComponent(emailToUse)}`
      : `/api/interviews?role=student`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setNextInterview(data.data.nextScheduledInterview || null);
          setUpcomingInterviews(data.data.upcomingInterviews || []);
          setCompletedInterviews(data.data.completedInterviews || []);
          setFreeTracks(data.data.freeCommunicationTracks || []);
        }
      })
      .catch((err) => console.error("Error loading student dashboard:", err))
      .finally(() => {
        if (!silent) setLoading(false);
      });
  }, [student.email]);

  useEffect(() => {
    let resolvedEmail = "";
    // 1. Sync real student profile from localStorage & Supabase
    try {
      const saved = localStorage.getItem("linktest_current_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.email) {
          resolvedEmail = parsed.email;
          setStudent((prev) => ({
            ...prev,
            fullName: parsed.fullName || parsed.email.split("@")[0],
            email: parsed.email,
          }));
        }
      }
    } catch {}

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        resolvedEmail = user.email;
        const name =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email.split("@")[0];
        setStudent((prev) => ({
          ...prev,
          fullName: name,
          email: user.email!,
        }));
      }
      loadDashboard(resolvedEmail, false);
    }).catch(() => {
      loadDashboard(resolvedEmail, false);
    });

    // Real-time polling every 3 seconds so trainer approvals update the room instantly
    const pollInterval = setInterval(() => {
      loadDashboard(resolvedEmail || student.email, true);
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [loadDashboard, student.email]);

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

  const handleRequestStartInterview = async (interviewId: string) => {
    setRequestingApproval(true);
    try {
      const res = await fetch("/api/trainer/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request_start",
          interviewId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNextInterview((prev) => (prev ? { ...prev, approvalStatus: "pending" } : null));
      }
    } catch (e) {
      console.error("Failed to submit request:", e);
    } finally {
      setRequestingApproval(false);
    }
  };

  const currentDateFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <AppShell role="student" userName={student.fullName} userEmail={student.email}>
      <div className="max-w-[1280px] mx-auto space-y-6">
        {/* A. WELCOME SECTION */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-orange-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md shrink-0">
              {student.fullName
                ? student.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                : "ST"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-[#0F172A] m-0">
                  Welcome back, {student.fullName ? student.fullName.split(" ")[0] : "Candidate"}! 👋
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Enrolled Candidate
                </span>
              </div>
              <p className="text-xs text-slate-500 m-0">
                {student.email || "Active Student Session"} • Academic Session 2026-27
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto text-xs text-slate-500">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200">
              <Calendar size={13} className="text-slate-400" />
              <span>{currentDateFormatted}</span>
            </div>
          </div>
        </div>

        {/* B. NEXT SCHEDULED MOCK INTERVIEW — WITH TRAINER APPROVAL WORKFLOW */}
        {nextInterview ? (
          <div className="card p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-[#0F172A] to-slate-900 border border-slate-800 text-white shadow-xl rounded-2xl relative overflow-hidden space-y-4">
            <div className="relative z-10 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-orange-500 text-white tracking-wider uppercase">
                    ASSIGNED MOCK INTERVIEW
                  </span>
                  <span className="text-xs text-slate-300 font-mono">
                    {nextInterview.difficulty ? `${nextInterview.difficulty.toUpperCase()} LEVEL` : "TECHNICAL"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  {nextInterview.approvalStatus === "approved" ? (
                    <span className="text-emerald-300 font-bold flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-600/50 px-2.5 py-1 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Trainer Approved • Room Ready</span>
                    </span>
                  ) : nextInterview.approvalStatus === "pending" ? (
                    <span className="text-amber-300 font-bold flex items-center gap-1.5 bg-amber-950/80 border border-amber-600/50 px-2.5 py-1 rounded-full">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      <span>Request Sent • Awaiting Trainer Live Approval</span>
                    </span>
                  ) : (
                    <span className="text-slate-300 font-mono">
                      {countdown || "Available to Request"}
                    </span>
                  )}
                </div>
              </div>

              {/* Approval Notice Banner */}
              {nextInterview.approvalStatus === "approved" ? (
                <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
                  <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
                  <span>
                    <strong>Authorized:</strong> Your faculty trainer has approved your interview entrance. Click below to enter the live AI room.
                  </span>
                </div>
              ) : nextInterview.approvalStatus === "pending" ? (
                <div className="p-3.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
                  <Clock size={18} className="text-amber-400 animate-spin shrink-0" />
                  <span>
                    <strong>Awaiting Trainer:</strong> Your request has been delivered to your faculty trainer. Once they click approve, this room unlocks automatically.
                  </span>
                </div>
              ) : null}

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

                {/* DYNAMIC ACTION BUTTON */}
                <div className="shrink-0 flex items-center gap-3">
                  {nextInterview.status === "completed" ? (
                    <Link
                      href="/student/results"
                      className="btn btn-outline text-xs py-2.5 px-5 font-bold bg-white/10 text-white border-white/20 hover:bg-white/20"
                    >
                      View Result
                    </Link>
                  ) : nextInterview.approvalStatus === "approved" ? (
                    <Link
                      href={`/student/interview/${nextInterview.id}`}
                      className="btn btn-primary text-xs py-3 px-6 font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse"
                    >
                      <Play size={15} fill="currentColor" />
                      <span>Enter AI Interview Room (Approved)</span>
                    </Link>
                  ) : nextInterview.approvalStatus === "pending" ? (
                    <button
                      disabled
                      className="btn btn-outline text-xs py-3 px-6 font-bold flex items-center gap-2 bg-amber-500/20 text-amber-300 border-amber-500/40 cursor-wait"
                    >
                      <Clock size={15} className="animate-spin text-amber-400" />
                      <span>Waiting for Trainer Approval...</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRequestStartInterview(nextInterview.id)}
                      disabled={requestingApproval}
                      className="btn btn-primary text-xs py-3 px-6 font-bold flex items-center gap-2 shadow-lg shadow-orange-600/30 text-white bg-gradient-to-tr from-[#EA580C] to-[#F97316] disabled:opacity-50"
                    >
                      <Play size={15} fill="currentColor" />
                      <span>{requestingApproval ? "Submitting Request..." : "Start Mock Interview"}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card p-8 bg-slate-900 border border-slate-800 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider block">
                NO SCHEDULED INTERVIEWS CURRENTLY
              </span>
              <h3 className="text-lg font-bold text-white m-0">
                You have no pending mandatory batch interviews right now.
              </h3>
              <p className="text-xs text-slate-400 m-0">
                When your faculty trainer schedules a technical mock assessment for your cohort, it will appear here instantly.
              </p>
            </div>
            <Link
              href="/student/interview/active"
              className="btn btn-primary text-xs py-2.5 px-4 font-bold shrink-0 self-start sm:self-auto"
            >
              Practice Voice Lab
            </Link>
          </div>
        )}

        {/* C. UPCOMING INTERVIEWS SECTION */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-orange-600" />
              <h3 className="text-base font-extrabold text-[#0F172A] m-0">
                Upcoming Assigned Interviews
              </h3>
            </div>
          </div>

          {upcomingInterviews.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-[#E2E8F0] text-center space-y-2">
              <Calendar size={32} className="text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800 m-0">No other upcoming interviews scheduled</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto m-0">
                When your trainers schedule additional rounds, they will appear here chronologically.
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
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {item.approvalStatus === "approved" ? "✓ Approved" : "Approval Needed"}
                    </span>
                    {item.approvalStatus === "approved" ? (
                      <Link
                        href={`/student/interview/${item.id}`}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
                      >
                        <span>Enter Room</span>
                        <ArrowRight size={13} />
                      </Link>
                    ) : (
                      <button
                        onClick={() => handleRequestStartInterview(item.id)}
                        className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-0.5"
                      >
                        <span>Start Mock</span>
                        <ArrowRight size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
