"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  Award,
  Sparkles,
  Mic,
  FileCheck2,
  BookOpen,
  Target,
  Clock,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Layers,
  Code,
  ShieldCheck,
} from "lucide-react";

export default function StudentDashboardPage() {
  const [readinessScore, setReadinessScore] = useState(86);
  const [interviews, setInterviews] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/interviews?role=student")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          if (data.data.upcomingInterviews) setInterviews(data.data.upcomingInterviews);
          if (data.data.readinessScore) setReadinessScore(data.data.readinessScore);
        }
      })
      .catch((err) => console.error(err));
  }, []);

  const readinessColor = readinessScore >= 75 ? "#16A34A" : readinessScore >= 65 ? "#D97706" : "#DC2626";
  const readinessBg = readinessScore >= 75 ? "#DCFCE7" : readinessScore >= 65 ? "#FEF3C7" : "#FEE2E2";
  const readinessStatus =
    readinessScore >= 75
      ? "Placement Ready (≥75%)"
      : readinessScore >= 65
      ? "Preparation Warning (65-74%)"
      : "Critical Shortage (<65%)";

  return (
    <AppShell role="student" userName="Aarav Sharma" userEmail="aarav.sharma@linktest.io">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* LinkTest Student Portal Gradient Banner */}
        <div
          className="rounded-2xl p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5"
          style={{ background: "linear-gradient(135deg, #0F172A 0%, #0B1120 100%)" }}
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 tracking-wide uppercase">
                STUDENT PORTAL
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1">
              Welcome back, Aarav! 👋
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Track your interview schedule, placement readiness gauge, AI voice interview scores, and curriculum track mastery.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/student/interview/active"
              className="btn btn-primary text-xs py-2.5 px-5 font-bold shadow-md"
            >
              <Mic size={15} />
              <span>Voice Interview Room</span>
            </Link>
            <Link
              href="/student/interviews"
              className="btn btn-outline text-xs py-2.5 px-4 font-bold bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              <Sparkles size={15} />
              <span>View All Mocks</span>
            </Link>
          </div>
        </div>

        {/* 4 Cards Grid - Including LinkTest Attendance Safety Gauge replicated as Interview Readiness Gauge */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Interview Readiness Safety Gauge */}
          <div
            className="card p-5 bg-white border border-[#E2E8F0]"
            style={{ borderLeft: `5px solid ${readinessColor}` }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#64748B]">Interview Readiness</span>
              <span
                className="text-[10px] font-extrabold px-2 py-0.5 rounded"
                style={{ background: readinessBg, color: readinessColor }}
              >
                {readinessScore >= 75 ? "Safe" : "Warning"}
              </span>
            </div>
            <div className="text-3xl font-extrabold leading-tight" style={{ color: readinessColor }}>
              {readinessScore}%
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, readinessScore)}%`, background: readinessColor }}
              ></div>
            </div>
            <span className="text-[11px] text-[#64748B] mt-1.5 block font-medium">
              {readinessStatus}
            </span>
          </div>

          {/* Card 2: Today's Scheduled Mocks */}
          <div className="card p-5 bg-white border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#64748B]">Scheduled Mocks</span>
              <div className="p-1.5 rounded-lg bg-orange-50 text-orange-600">
                <Calendar size={18} />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-[#0F172A] leading-tight">
              {interviews.length || 1}
            </div>
            <span className="text-[11px] text-[#64748B] mt-1.5 block">
              Upcoming technical voice round
            </span>
          </div>

          {/* Card 3: Completed Scorecards */}
          <div className="card p-5 bg-white border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#64748B]">Completed Scorecards</span>
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-[#0F172A] leading-tight">3</div>
            <span className="text-[11px] text-[#64748B] mt-1.5 block">
              Verified by Rahul Sir & faculty
            </span>
          </div>

          {/* Card 4: Enrolled Tracks */}
          <div className="card p-5 bg-white border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#64748B]">Technology Track</span>
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <BookOpen size={18} />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-[#0F172A] leading-tight">Python FS</div>
            <span className="text-[11px] text-[#64748B] mt-1.5 block">
              Batch: Python Full Stack 2026-A
            </span>
          </div>
        </div>

        {/* Quick Tools & Learning Hub (Replicating LinkTest Quick Tools) */}
        <div className="space-y-3">
          <h3 className="text-base font-bold text-[#0F172A] m-0">
            Quick Tools & Learning Hub
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Link
              href="/student/interview/active"
              className="card p-4 text-center hover:shadow-md transition-all border border-[#E2E8F0] bg-white group"
            >
              <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 w-fit mx-auto mb-2 group-hover:scale-105 transition-transform">
                <Mic size={20} />
              </div>
              <div className="font-bold text-xs text-[#0F172A]">Voice Room</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Live AI Interview</div>
            </Link>

            <Link
              href="/student/interviews"
              className="card p-4 text-center hover:shadow-md transition-all border border-[#E2E8F0] bg-white group"
            >
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 w-fit mx-auto mb-2 group-hover:scale-105 transition-transform">
                <Sparkles size={20} />
              </div>
              <div className="font-bold text-xs text-[#0F172A]">Mock Tests</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Assigned Rounds</div>
            </Link>

            <Link
              href="/student/results"
              className="card p-4 text-center hover:shadow-md transition-all border border-[#E2E8F0] bg-white group"
            >
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 w-fit mx-auto mb-2 group-hover:scale-105 transition-transform">
                <FileCheck2 size={20} />
              </div>
              <div className="font-bold text-xs text-[#0F172A]">Scorecards</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Feedback & Marks</div>
            </Link>

            <Link
              href="/student/performance"
              className="card p-4 text-center hover:shadow-md transition-all border border-[#E2E8F0] bg-white group"
            >
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 w-fit mx-auto mb-2 group-hover:scale-105 transition-transform">
                <Target size={20} />
              </div>
              <div className="font-bold text-xs text-[#0F172A]">Mastery Radar</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Topic Strengths</div>
            </Link>

            <Link
              href="/student/materials"
              className="card p-4 text-center hover:shadow-md transition-all border border-[#E2E8F0] bg-white group"
            >
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 w-fit mx-auto mb-2 group-hover:scale-105 transition-transform">
                <BookOpen size={20} />
              </div>
              <div className="font-bold text-xs text-[#0F172A]">Prep Guides</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Cheat Sheets</div>
            </Link>

            <Link
              href="/admin/question-bank"
              className="card p-4 text-center hover:shadow-md transition-all border border-[#E2E8F0] bg-white group"
            >
              <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700 w-fit mx-auto mb-2 group-hover:scale-105 transition-transform">
                <Code size={20} />
              </div>
              <div className="font-bold text-xs text-[#0F172A]">Question Lab</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Curriculum Bank</div>
            </Link>
          </div>
        </div>

        {/* Available Mock Interviews & Screenings Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider block">
                ASSESSMENTS & SCREENINGS
              </span>
              <h2 className="text-xl font-extrabold text-[#0F172A] m-0">
                Available AI Mock Interviews
              </h2>
            </div>
            <Link
              href="/student/interviews"
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
            >
              <span>View All Mocks</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Card 1 */}
            <div className="card p-5 bg-white border border-[#E2E8F0] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200 uppercase">
                    Python
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                    Voice & Audio
                  </span>
                </div>

                <h3 className="font-bold text-base text-[#0F172A] mb-1">
                  Python Full Stack Technical Screening
                </h3>
                <p className="text-xs text-slate-600 line-clamp-2 mb-4">
                  Evaluates memory management, GIL, generators, decorators, and asynchronous programming.
                </p>

                <div className="grid grid-cols-2 gap-2 bg-[#F8FAFC] p-3 rounded-lg text-xs text-slate-600 mb-4 border border-[#E2E8F0]">
                  <div>⏱ Duration: <strong>30 mins</strong></div>
                  <div>🎯 Level: <strong>Intermediate</strong></div>
                  <div>❓ Questions: <strong>3 Turns</strong></div>
                  <div>🎙 Voice Mode: <strong>Active</strong></div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0]">
                <Link
                  href="/student/interview/active"
                  className="btn btn-primary btn-sm w-full font-bold text-xs py-2 justify-center"
                >
                  <Mic size={14} />
                  <span>Start Voice Mock Interview</span>
                </Link>
              </div>
            </div>

            {/* Card 2 */}
            <div className="card p-5 bg-white border border-[#E2E8F0] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                    Java
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                    Completed
                  </span>
                </div>

                <h3 className="font-bold text-base text-[#0F172A] mb-1">
                  Java Enterprise Systems & JVM Internals
                </h3>
                <p className="text-xs text-slate-600 line-clamp-2 mb-4">
                  Concurrency, ConcurrentHashMap internal CAS mechanisms, and multi-threaded deadlocks.
                </p>

                <div className="grid grid-cols-2 gap-2 bg-[#F8FAFC] p-3 rounded-lg text-xs text-slate-600 mb-4 border border-[#E2E8F0]">
                  <div>⏱ Duration: <strong>45 mins</strong></div>
                  <div>🎯 Score: <strong>93% (Passed)</strong></div>
                  <div>❓ Questions: <strong>3 Turns</strong></div>
                  <div>👨‍🏫 Evaluated: <strong>Rahul Sir</strong></div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0]">
                <Link
                  href="/student/interview/int-2026-002/report"
                  className="btn btn-outline btn-sm w-full font-bold text-xs py-2 justify-center"
                >
                  <FileCheck2 size={14} />
                  <span>View Official Scorecard</span>
                </Link>
              </div>
            </div>

            {/* Card 3 */}
            <div className="card p-5 bg-white border border-[#E2E8F0] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                    DSA
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700">
                    In Review
                  </span>
                </div>

                <h3 className="font-bold text-base text-[#0F172A] mb-1">
                  DSA & Algorithmic Problem Solving
                </h3>
                <p className="text-xs text-slate-600 line-clamp-2 mb-4">
                  Kadane's algorithm, Dijkstra vs Bellman-Ford negative edge weights, and Bloom filters.
                </p>

                <div className="grid grid-cols-2 gap-2 bg-[#F8FAFC] p-3 rounded-lg text-xs text-slate-600 mb-4 border border-[#E2E8F0]">
                  <div>⏱ Duration: <strong>30 mins</strong></div>
                  <div>🎯 Level: <strong>Intermediate</strong></div>
                  <div>❓ Turns: <strong>3 Turns</strong></div>
                  <div>⏳ Status: <strong>Pending Review</strong></div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0]">
                <Link
                  href="/student/interview/int-2026-003/report"
                  className="btn btn-outline btn-sm w-full font-bold text-xs py-2 justify-center"
                >
                  <Clock size={14} />
                  <span>View Evaluation Status</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Scorecards & Outcomes */}
        <div className="card p-5 bg-white border border-[#E2E8F0] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
            <div>
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
                SCORECARDS & OUTCOMES
              </span>
              <h3 className="text-base font-extrabold text-[#0F172A] m-0">
                Latest Interview Scorecards
              </h3>
            </div>
            <Link href="/student/results" className="text-xs font-bold text-blue-600 hover:underline">
              View All Results →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="badge badge-success text-[10px]">RELEASED</span>
                <span className="text-xs font-extrabold text-blue-700">JAVA TECHNICAL</span>
              </div>
              <h4 className="font-bold text-sm text-slate-900 m-0">
                Java Enterprise Systems 2026-B
              </h4>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-blue-100">
                <span className="text-slate-600">Overall Score:</span>
                <span className="text-base font-extrabold text-emerald-600">93% (Passed)</span>
              </div>
              <Link
                href="/student/interview/int-2026-002/report"
                className="btn btn-primary btn-sm w-full text-xs py-1.5 justify-center font-bold"
              >
                Inspect Scorecard & Remarks
              </Link>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <span className="badge badge-warning text-[10px]">UNDER REVIEW</span>
                <span className="text-xs font-extrabold text-slate-700">DSA CODING</span>
              </div>
              <h4 className="font-bold text-sm text-slate-900 m-0">
                DSA & Systems Placement Track
              </h4>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <span className="text-slate-600">Current Status:</span>
                <span className="font-bold text-amber-700">Awaiting Trainer Remarks</span>
              </div>
              <Link
                href="/student/interview/int-2026-003/report"
                className="btn btn-outline btn-sm w-full text-xs py-1.5 justify-center font-semibold"
              >
                Inspect Transcript
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
