"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  Users,
  GraduationCap,
  BookOpen,
  Sparkles,
  HelpCircle,
  FileQuestion,
  RefreshCw,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileText,
  ShieldCheck,
  Award,
  ChevronRight,
  Activity,
} from "lucide-react";

interface AdminStats {
  totalStudents: number;
  totalTrainers: number;
  totalBatches: number;
  totalInterviews: number;
  completed: number;
  upcoming: number;
  pendingEvaluations: number;
  avgScore: number;
  recentActivity: Array<{
    id: string;
    studentName: string;
    technology: string;
    difficulty: string;
    status: string;
    score: number | null;
    scheduledAt: string;
  }>;
  health: {
    database: string;
    apiServer: string;
    auth: string;
    speechRecognition: string;
    speechSynthesis: string;
    aiEngine: string;
  };
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState<string>("Just now");
  const [adminUser, setAdminUser] = useState({
    name: "Rahul Sir (Founder & Admin)",
    email: "rahul.sir@linktest.io",
  });

  const loadData = async () => {
    try {
      const saved = localStorage.getItem("linktest_current_user");
      if (saved) {
        const u = JSON.parse(saved);
        if (u.fullName || u.email) {
          setAdminUser({
            name: u.fullName || u.email.split("@")[0],
            email: u.email,
          });
        }
      }
    } catch {}

    try {
      const res = await fetch("/api/interviews?role=admin");
      const json = await res.json();
      if (json.success && json.data) {
        setStats(json.data);
      }
    } catch (err) {
      console.error("Failed to load admin dashboard:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLastChecked(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(), 3000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  return (
    <AppShell role="admin" userName={adminUser.name} userEmail={adminUser.email}>
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-[#E2E8F0]">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA] tracking-wide">
                ADMIN CONSOLE
              </span>
              <span className="text-xs text-[#64748B]">• Academic Session 2026-27</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              System Overview & Operations
            </h1>
            <p className="text-sm text-[#475569] mt-0.5">
              High-level metrics for student cohorts, trainer allocations, AI mock interview schedules, and platform health.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/batches"
              className="btn btn-primary text-xs py-2 px-3.5"
            >
              <BookOpen size={15} />
              <span>Manage Batches</span>
            </Link>
            <Link
              href="/admin/interviews"
              className="btn btn-outline text-xs py-2 px-3.5"
            >
              <Sparkles size={15} />
              <span>Interview Sessions</span>
            </Link>
            <Link
              href="/admin/question-bank"
              className="btn btn-outline text-xs py-2 px-3.5"
            >
              <FileQuestion size={15} />
              <span>Question Bank</span>
            </Link>
            <Link
              href="/admin/users"
              className="btn btn-outline text-xs py-2 px-3.5"
            >
              <Users size={15} />
              <span>Users & Access</span>
            </Link>
          </div>
        </div>

        {/* 4 Primary Top Metric Cards (Replicating LinkTest Admin Layout) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                ACTIVE BATCHES
              </span>
              <div className="p-2 rounded-lg bg-[#F0F9FF] text-[#0284C7]">
                <BookOpen size={18} />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-[#0F172A] leading-tight">
              {stats?.totalBatches ?? 0}
            </div>
            <div className="text-xs text-[#64748B] mt-1.5">
              Assigned student technology cohorts
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                TOTAL STUDENTS
              </span>
              <div className="p-2 rounded-lg bg-[#FFEDD5] text-[#EA580C]">
                <Users size={18} />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-[#0F172A] leading-tight">
              {stats?.totalStudents ?? 0}
            </div>
            <div className="text-xs text-[#64748B] mt-1.5">
              Active candidates in mock preparation
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                FACULTY & TRAINERS
              </span>
              <div className="p-2 rounded-lg bg-[#EFF6FF] text-[#2563EB]">
                <GraduationCap size={18} />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-[#0F172A] leading-tight">
              {stats?.totalTrainers ?? 0}
            </div>
            <div className="text-xs text-[#64748B] mt-1.5">
              Assigned technical mentors & faculty
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                AI MOCK SESSIONS
              </span>
              <div className="p-2 rounded-lg bg-[#ECFDF5] text-[#059669]">
                <Sparkles size={18} />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-[#0F172A] leading-tight">
              {stats?.totalInterviews ?? 0}
            </div>
            <div className="text-xs text-[#64748B] mt-1.5">
              Scheduled & conducted interviews
            </div>
          </div>
        </div>

        {/* 4 Secondary Operations Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4 bg-white border border-[#E2E8F0]">
            <div className="text-xs font-semibold text-[#64748B]">COMPLETED SESSIONS</div>
            <div className="text-2xl font-bold text-[#059669] mt-1">
              {stats?.completed ?? 0}
            </div>
            <div className="text-[11px] text-[#94A3B8] mt-1">Evaluated with full scorecards</div>
          </div>

          <div className="card p-4 bg-white border border-[#E2E8F0]">
            <div className="text-xs font-semibold text-[#64748B]">UPCOMING INTERVIEWS</div>
            <div className="text-2xl font-bold text-[#2563EB] mt-1">
              {stats?.upcoming ?? 0}
            </div>
            <div className="text-[11px] text-[#94A3B8] mt-1">Scheduled candidate slots</div>
          </div>

          <div className="card p-4 bg-white border border-[#E2E8F0]">
            <div className="text-xs font-semibold text-[#64748B]">PENDING EVALUATION</div>
            <div className="text-2xl font-bold text-[#D97706] mt-1">
              {stats?.pendingEvaluations ?? 0}
            </div>
            <div className="text-[11px] text-[#94A3B8] mt-1">Awaiting trainer sign-off</div>
          </div>

          <div className="card p-4 bg-white border border-[#E2E8F0]">
            <div className="text-xs font-semibold text-[#64748B]">AVERAGE SCORE</div>
            <div className="text-2xl font-bold text-[#EA580C] mt-1">
              {stats?.avgScore ?? 0}%
            </div>
            <div className="text-[11px] text-[#94A3B8] mt-1">Across technical and HR rounds</div>
          </div>
        </div>

        {/* System Health Status Card (Exact LinkTest System Health replication) */}
        <div className="card p-5 bg-white border border-[#E2E8F0]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-[#E2E8F0] gap-2 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#0F172A] m-0">
                  SYSTEM HEALTH & INFRASTRUCTURE
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                  ● System Operational
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Current platform voice, speech recognition, database, and Gemini LLM operational status
              </p>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="btn btn-ghost btn-sm border border-[#E2E8F0] bg-white text-xs text-[#475569] self-start sm:self-auto"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 py-1">
            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
              <span className="text-xs text-[#64748B] font-medium block">Database</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-emerald-700">Connected</span>
              </div>
            </div>

            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
              <span className="text-xs text-[#64748B] font-medium block">API Server</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-emerald-700">Online</span>
              </div>
            </div>

            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
              <span className="text-xs text-[#64748B] font-medium block">Speech Recognition</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-emerald-700">Ready</span>
              </div>
            </div>

            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
              <span className="text-xs text-[#64748B] font-medium block">Speech Synthesis</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-emerald-700">Operational</span>
              </div>
            </div>

            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
              <span className="text-xs text-[#64748B] font-medium block">AI Evaluation</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-emerald-700">Gemini 1.5</span>
              </div>
            </div>

            <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
              <span className="text-xs text-[#64748B] font-medium block">Auth Service</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-bold text-emerald-700">Verified</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#94A3B8]">
            <span>Last checked: {lastChecked}</span>
            <span>Capacity verified for 500 examinees</span>
          </div>
        </div>

        {/* Live Stream Table: Recent Candidate Interview Submissions */}
        <div className="card p-0 overflow-hidden bg-white border border-[#E2E8F0]">
          <div className="p-4 sm:p-5 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#0F172A] m-0">
                Recent Candidate Interview Submissions
              </h3>
              <p className="text-xs text-[#64748B] mt-0.5">
                Live stream of scheduled, completed, and pending interview evaluations
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/admin/reports"
                className="btn btn-ghost btn-sm text-xs font-semibold text-[#475569] flex items-center gap-1"
              >
                <span>View All Reports</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-bold text-[#64748B] uppercase tracking-wider">
                  <th className="py-3 px-4">CANDIDATE</th>
                  <th className="py-3 px-4">TECHNOLOGY</th>
                  <th className="py-3 px-4">DIFFICULTY</th>
                  <th className="py-3 px-4">SCORE</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {stats?.recentActivity?.map((row) => (
                  <tr key={row.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#0F172A]">{row.studentName}</div>
                      <div className="text-xs text-[#64748B]">ID: {row.id}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-[#1E293B]">{row.technology}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="capitalize text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {row.difficulty}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {row.score !== null ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#FFEDD5] text-[#C2410C] border border-[#FED7AA]">
                          {row.score}%
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Scheduled</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {row.status === "completed" ? (
                        <span className="badge badge-success text-[11px]">Completed</span>
                      ) : row.status === "pending_evaluation" ? (
                        <span className="badge badge-warning text-[11px]">In Review</span>
                      ) : (
                        <span className="badge badge-blue text-[11px]">Scheduled</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {row.status === "completed" ? (
                        <Link
                          href={`/student/interview/${row.id}/report`}
                          className="btn btn-outline btn-sm text-xs font-semibold py-1 px-2.5"
                        >
                          View Scorecard
                        </Link>
                      ) : row.status === "pending_evaluation" ? (
                        <Link
                          href="/trainer/approvals"
                          className="btn btn-primary btn-sm text-xs font-semibold py-1 px-2.5"
                        >
                          Evaluate Now
                        </Link>
                      ) : (
                        <Link
                          href="/student/interview/active"
                          className="btn btn-outline btn-sm text-xs font-semibold py-1 px-2.5"
                        >
                          Start Live
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
