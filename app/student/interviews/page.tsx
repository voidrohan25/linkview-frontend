"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  Sparkles,
  Mic,
  Clock,
  CheckCircle2,
  Calendar,
  Award,
  ArrowRight,
  Filter,
} from "lucide-react";

export default function StudentInterviewsListPage() {
  const [filterTech, setFilterTech] = useState("all");

  const mockInterviews = [
    {
      id: "int-2026-001",
      title: "Python Full Stack Technical Screening",
      technology: "Python",
      difficulty: "Intermediate",
      duration: "30 mins",
      turns: "3 Turns",
      status: "completed",
      score: 90,
      description: "Evaluates memory management, GIL, generators, decorators, and asynchronous programming.",
    },
    {
      id: "int-2026-002",
      title: "Java Enterprise Systems & JVM Internals",
      technology: "Java",
      difficulty: "Advanced",
      duration: "45 mins",
      turns: "3 Turns",
      status: "completed",
      score: 93,
      description: "Concurrency, ConcurrentHashMap internal CAS mechanisms, and multi-threaded deadlocks.",
    },
    {
      id: "int-2026-003",
      title: "DSA & Algorithmic Problem Solving",
      technology: "DSA",
      difficulty: "Intermediate",
      duration: "30 mins",
      turns: "3 Turns",
      status: "pending_evaluation",
      score: null,
      description: "Kadane's algorithm, Dijkstra vs Bellman-Ford negative edge weights, and Bloom filters.",
    },
    {
      id: "int-2026-004",
      title: "Python Backend & Framework Architecture",
      technology: "Python",
      difficulty: "Intermediate",
      duration: "30 mins",
      turns: "3 Turns",
      status: "scheduled",
      score: null,
      description: "Django REST, database ORM query profiling, indexing strategies, and caching.",
    },
  ];

  const filtered = mockInterviews.filter(
    (item) => filterTech === "all" || item.technology.toLowerCase() === filterTech.toLowerCase()
  );

  return (
    <AppShell role="student">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E2E8F0] gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#FFEDD5] text-[#C2410C] border border-[#FED7AA]">
                TECHNICAL SCREENINGS
              </span>
              <span className="text-xs text-[#64748B]">• AI Mock Interview Programs</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Assigned AI Mock Interviews
            </h1>
            <p className="text-sm text-[#475569] mt-0.5">
              Attend scheduled voice interviews, view transcripts, and inspect performance scorecards.
            </p>
          </div>

          <Link href="/student/interview/active" className="btn btn-primary self-start sm:self-auto">
            <Mic size={16} />
            <span>Open Voice Interview Room</span>
          </Link>
        </div>

        {/* Filter */}
        <div className="card p-4 bg-white border border-[#E2E8F0] flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">Filter by Technology:</span>
          <select
            value={filterTech}
            onChange={(e) => setFilterTech(e.target.value)}
            className="form-select text-xs py-1.5 px-3 w-48"
          >
            <option value="all">All Technologies</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="dsa">DSA</option>
          </select>
        </div>

        {/* Interviews Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((item) => (
            <div key={item.id} className="card p-5 bg-white border border-[#E2E8F0] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                    {item.technology}
                  </span>
                  {item.status === "completed" ? (
                    <span className="badge badge-success text-[10px]">Completed</span>
                  ) : item.status === "pending_evaluation" ? (
                    <span className="badge badge-warning text-[10px]">Under Review</span>
                  ) : (
                    <span className="badge badge-blue text-[10px]">Scheduled</span>
                  )}
                </div>

                <h3 className="font-bold text-base text-[#0F172A] mb-1 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-600 line-clamp-2 mb-4">
                  {item.description}
                </p>

                <div className="grid grid-cols-2 gap-2 bg-[#F8FAFC] p-3 rounded-lg text-xs text-slate-600 mb-4 border border-[#E2E8F0]">
                  <div>⏱ Duration: <strong>{item.duration}</strong></div>
                  <div>🎯 Level: <strong>{item.difficulty}</strong></div>
                  <div>❓ Turns: <strong>{item.turns}</strong></div>
                  <div>
                    {item.score !== null ? (
                      <span className="text-emerald-700 font-bold">Score: {item.score}%</span>
                    ) : (
                      <span>Mode: <strong>Voice & Audio</strong></span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0]">
                {item.status === "completed" ? (
                  <Link
                    href={`/student/interview/${item.id}/report`}
                    className="btn btn-outline btn-sm w-full font-bold text-xs py-2 justify-center"
                  >
                    <span>View Official Scorecard</span>
                    <ArrowRight size={13} />
                  </Link>
                ) : item.status === "pending_evaluation" ? (
                  <Link
                    href={`/student/interview/${item.id}/report`}
                    className="btn btn-outline btn-sm w-full font-bold text-xs py-2 justify-center text-amber-700 border-amber-300"
                  >
                    <span>Inspect Submission</span>
                  </Link>
                ) : (
                  <Link
                    href={`/student/interview/${item.id}`}
                    className="btn btn-primary btn-sm w-full font-bold text-xs py-2 justify-center"
                  >
                    <Mic size={14} />
                    <span>Start Mock Interview</span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
