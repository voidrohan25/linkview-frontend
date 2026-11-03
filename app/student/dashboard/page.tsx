"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/authContext";
import {
  Calendar,
  Clock,
  Mic,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  ArrowRight,
  ShieldCheck,
  Play,
  RotateCcw,
  BookOpen,
  Trash2,
  Award,
  TrendingUp,
  Target,
  Zap,
  BarChart3,
  Sliders,
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

export default function StudentDashboardPage() {
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState({
    fullName: authUser?.fullName || "Candidate",
    email: authUser?.email || "",
    batchName: authUser?.batchCode || "General Candidate",
  });
  const [nextInterview, setNextInterview] = useState<ScheduledInterview | null>(null);
  const [upcomingInterviews, setUpcomingInterviews] = useState<ScheduledInterview[]>([]);
  const [completedInterviews, setCompletedInterviews] = useState<ScheduledInterview[]>([]);
  const [metrics, setMetrics] = useState({
    interviewsCompleted: 0,
    interviewsThisWeek: 0,
    averageScore: 0,
    completionRate: 0,
    strongestSkills: [] as string[],
    skillsToImprove: [] as string[],
    recommendedNext: "Targeted Mock: Python Memory & Internals",
  });
  const [countdown, setCountdown] = useState<string>("");
  const [requestingApproval, setRequestingApproval] = useState(false);
  const activeEmailRef = useRef<string>("");

  useEffect(() => {
    if (authUser?.email) {
      activeEmailRef.current = authUser.email;
      setStudent((prev) => ({
        ...prev,
        fullName: authUser.fullName || prev.fullName,
        email: authUser.email,
        batchName: authUser.batchCode || prev.batchName,
      }));
    }
  }, [authUser]);

  const loadDashboard = useCallback(async (userEmail?: string, silent = false) => {
    const emailToUse = userEmail || activeEmailRef.current;
    if (!silent) setLoading(true);

    try {
      const url = emailToUse
        ? `/api/interviews?role=student&email=${encodeURIComponent(emailToUse)}`
        : `/api/interviews?role=student`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.success && data.data) {
        if (data.data.student) {
          setStudent((prev) => ({
            fullName: data.data.student.fullName || prev.fullName,
            email: data.data.student.email || prev.email,
            batchName: data.data.student.batchName || prev.batchName || "General Candidate",
          }));
        }
        setNextInterview(data.data.nextScheduledInterview || null);
        setUpcomingInterviews(data.data.upcomingInterviews || []);
        const completed = data.data.completedInterviews || [];
        setCompletedInterviews(completed);

        setMetrics({
          interviewsCompleted: data.data.interviewsCompleted ?? completed.length,
          interviewsThisWeek: data.data.interviewsThisWeek ?? 0,
          averageScore: data.data.student?.averageScore ?? (data.data.readinessScore || 0),
          completionRate: data.data.completionRate ?? (completed.length > 0 ? 100 : 0),
          strongestSkills: data.data.strongestSkills?.length > 0 ? data.data.strongestSkills : (completed.length > 0 ? ["Technical Clarity", "Problem Decomposition"] : []),
          skillsToImprove: data.data.skillsToImprove?.length > 0 ? data.data.skillsToImprove : (completed.length > 0 ? ["Asymptotic Analysis", "Edge-Case Handling"] : []),
          recommendedNext: data.data.recommendedNext || "Foundational Technical Viva (Python / DSA)",
        });
      }
    } catch (err) {
      console.warn("Error loading candidate dashboard:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const email = authUser?.email || "";
    activeEmailRef.current = email;
    loadDashboard(email, false);

    const pollInterval = setInterval(() => {
      loadDashboard(activeEmailRef.current, true);
    }, 15000);

    return () => clearInterval(pollInterval);
  }, [authUser?.email, loadDashboard]);

  // Countdown timer for next interview
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

  const handleDeleteInterview = async (interviewId: string) => {
    if (!confirm("Are you sure you want to dismiss this interview record?")) return;
    try {
      const res = await fetch(`/api/interviews?id=${interviewId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadDashboard(student.email, false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const currentDateFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <AppShell role="student" userName={student.fullName} userEmail={student.email}>
        <div className="max-w-[1280px] mx-auto space-y-6">
          {/* A. WELCOME & ACTION HEADER */}
          <div className="p-5 sm:p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#EA580C] to-[#F97316] text-white font-extrabold flex items-center justify-center text-base shadow-md shrink-0">
                {student.fullName
                  ? student.fullName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                  : "CN"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight m-0">
                    Welcome back, {student.fullName ? student.fullName.split(" ")[0] : "Candidate"}! 👋
                  </h1>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                    AI Mock Candidate
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 m-0">
                  {student.email || "Active Candidate"} • Verified Mock Interview Track
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/student/interview/setup"
                className="btn btn-primary text-xs py-2.5 px-5 font-bold flex items-center gap-2 shadow-md"
              >
                <Sparkles size={15} />
                <span>Start New Mock Interview</span>
              </Link>
              <Link
                href="/student/interview/active"
                className="btn btn-outline text-xs py-2.5 px-4 font-bold flex items-center gap-1.5"
              >
                <Mic size={14} className="text-orange-500" />
                <span>Voice Lab</span>
              </Link>
            </div>
          </div>

          {/* B. 4 AUTHORITATIVE METRICS CARDS (Section 5C) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-4.5 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Completed</span>
                <CheckCircle2 size={18} className="text-emerald-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
                {metrics.interviewsCompleted}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 m-0">
                Total finished AI sessions
              </p>
            </div>

            <div className="card p-4.5 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">This Week</span>
                <Clock size={18} className="text-orange-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
                {metrics.interviewsThisWeek}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 m-0">
                Practiced in the last 7 days
              </p>
            </div>

            <div className="card p-4.5 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Average Score</span>
                <Award size={18} className="text-blue-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
                {metrics.averageScore > 0 ? `${metrics.averageScore}%` : "—"}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 m-0">
                {metrics.averageScore >= 75 ? "Placement caliber ready" : metrics.averageScore > 0 ? "Building consistency" : "No evaluations yet"}
              </p>
            </div>

            <div className="card p-4.5 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Completion Rate</span>
                <Target size={18} className="text-purple-500" />
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#0F172A]">
                {metrics.interviewsCompleted > 0 ? "100%" : "—"}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 m-0">
                Finished vs abandoned rounds
              </p>
            </div>
          </div>

          {/* C. PERFORMANCE INSIGHTS & RECOMMENDED NEXT SESSION */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2 card p-5 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="text-orange-600" size={18} />
                  <h3 className="text-sm font-bold text-[#0F172A] m-0">Candidate Competency Matrix</h3>
                </div>
                <Link href="/student/performance" className="text-xs font-bold text-orange-600 hover:text-orange-700">
                  Full Analytics →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200/70 space-y-2">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
                    ✓ Strongest Skill Categories
                  </span>
                  {metrics.strongestSkills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {metrics.strongestSkills.map((s, idx) => (
                        <span key={idx} className="text-xs font-bold px-2 py-0.5 rounded-md bg-white text-emerald-700 border border-emerald-200">
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 m-0">
                      Complete your first interview to highlight your strongest technical competencies.
                    </p>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/70 space-y-2">
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                    ⚡ Focus Areas for Improvement
                  </span>
                  {metrics.skillsToImprove.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {metrics.skillsToImprove.map((s, idx) => (
                        <span key={idx} className="text-xs font-bold px-2 py-0.5 rounded-md bg-white text-amber-800 border border-amber-200">
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 m-0">
                      AI evaluations will flag areas like edge-case proofs, concurrency, or STAR structure here.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Recommended Next Practice */}
            <div className="card p-5 bg-gradient-to-br from-slate-900 to-[#0F172A] text-white border border-slate-800 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-orange-500 text-white uppercase tracking-wider">
                  AI RECOMMENDATION
                </span>
                <h4 className="text-base font-bold text-white m-0">
                  Recommended Next Practice
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed m-0">
                  {metrics.recommendedNext}
                </p>
              </div>

              <Link
                href="/student/interview/setup"
                className="btn btn-primary text-xs py-2.5 px-4 font-bold flex items-center justify-center gap-1.5 w-full shadow-md"
              >
                <span>Launch Recommended Round</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>

          {/* D. NEXT SCHEDULED OR ACTIVE MOCK INTERVIEW */}
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
                        <span>Room Unlocked • Ready to Enter</span>
                      </span>
                    ) : nextInterview.approvalStatus === "pending" ? (
                      <span className="text-amber-300 font-bold flex items-center gap-1.5 bg-amber-950/80 border border-amber-600/50 px-2.5 py-1 rounded-full">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        <span>Request Sent • Awaiting Evaluator Approval</span>
                      </span>
                    ) : (
                      <span className="text-slate-300 font-mono">
                        {countdown || "Available to Start"}
                      </span>
                    )}
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
                        <span>Proctored Simulation (~{nextInterview.durationMinutes || 30} mins)</span>
                      </span>
                    </div>
                  </div>

                  {/* ACTION BUTTON */}
                  <div className="shrink-0 flex items-center gap-3">
                    {nextInterview.status === "completed" ? (
                      <Link
                        href={`/student/interview/${nextInterview.id}/report`}
                        className="btn btn-outline text-xs py-2.5 px-5 font-bold bg-white/10 text-white border-white/20 hover:bg-white/20"
                      >
                        View Scorecard
                      </Link>
                    ) : nextInterview.approvalStatus === "approved" ? (
                      <Link
                        href={`/student/interview/${nextInterview.id}`}
                        className="btn btn-primary text-xs py-3 px-6 font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse"
                      >
                        <Play size={15} fill="currentColor" />
                        <span>Enter AI Interview Room</span>
                      </Link>
                    ) : nextInterview.approvalStatus === "pending" ? (
                      <button
                        disabled
                        className="btn btn-outline text-xs py-3 px-6 font-bold flex items-center gap-2 bg-amber-500/20 text-amber-300 border-amber-500/40 cursor-wait"
                      >
                        <Clock size={15} className="animate-spin text-amber-400" />
                        <span>Waiting for Approval...</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRequestStartInterview(nextInterview.id)}
                        disabled={requestingApproval}
                        className="btn btn-primary text-xs py-3 px-6 font-bold flex items-center gap-2 shadow-lg shadow-orange-600/30 text-white bg-gradient-to-tr from-[#EA580C] to-[#F97316] disabled:opacity-50"
                      >
                        <Play size={15} fill="currentColor" />
                        <span>{requestingApproval ? "Requesting..." : "Start Mock Interview"}</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDeleteInterview(nextInterview.id)}
                      title="Dismiss Interview"
                      className="p-2.5 rounded-xl bg-white/10 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-white/10 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-7 bg-white border border-[#E2E8F0] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-sm">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider block">
                  ON-DEMAND AI MOCK INTERVIEWS
                </span>
                <h3 className="text-base sm:text-lg font-bold text-[#0F172A] m-0">
                  Ready for your next round? Configure a targeted interview anytime.
                </h3>
                <p className="text-xs text-slate-500 m-0">
                  Select your target role, years of experience, and difficulty. The AI panel adapts questions to your exact stack.
                </p>
              </div>
              <Link
                href="/student/interview/setup"
                className="btn btn-primary text-xs py-3 px-6 font-bold shrink-0 self-start sm:self-auto shadow-md flex items-center gap-2"
              >
                <Sparkles size={15} />
                <span>Configure & Start Interview</span>
              </Link>
            </div>
          )}

          {/* E. RECENT COMPLETED SESSIONS WITH FULL REPORT ACCESS */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <h3 className="text-base font-extrabold text-[#0F172A] m-0">
                  Recent Interview Scorecards & History
                </h3>
              </div>
              {completedInterviews.length > 0 && (
                <Link href="/student/results" className="text-xs font-bold text-orange-600 hover:text-orange-700">
                  View All History →
                </Link>
              )}
            </div>

            {completedInterviews.length === 0 ? (
              <div className="p-10 rounded-2xl bg-white border border-[#E2E8F0] text-center space-y-3">
                <Award size={36} className="text-slate-300 mx-auto" />
                <h4 className="text-sm font-bold text-slate-800 m-0">No Completed Interviews Yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto m-0">
                  Complete your first AI mock interview to generate in-depth scorecards, technical feedback, and strengths analysis.
                </p>
                <div className="pt-2">
                  <Link href="/student/interview/setup" className="btn btn-primary text-xs py-2 px-4 font-bold">
                    Start Your First Interview
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedInterviews.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    className="card p-4.5 bg-white border border-[#E2E8F0] hover:border-orange-300 transition-all rounded-2xl flex flex-col justify-between space-y-3 shadow-sm"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {item.interviewType ? item.interviewType.toUpperCase() : "TECHNICAL"}
                        </span>
                        {item.scorecard?.overallScore !== undefined && (
                          <span className="text-xs font-extrabold text-emerald-600">
                            {item.scorecard.overallScore}/100
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-[#0F172A] leading-snug m-0">
                        {item.technology} Mock Assessment
                      </h4>
                      <p className="text-xs text-slate-400 m-0">
                        Evaluated on {new Date(item.scheduledAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <Link
                        href={`/student/interview/${item.id}/report`}
                        className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-0.5"
                      >
                        <span>View Performance Report</span>
                        <ArrowRight size={13} />
                      </Link>
                      <button
                        onClick={() => handleDeleteInterview(item.id)}
                        title="Dismiss interview record"
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
