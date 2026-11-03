"use client";

import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  FileCheck2,
  Award,
  Sparkles,
  Printer,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";

export default function StudentResultsPage() {
  const scorecards = [
    {
      id: "int-2026-001",
      title: "Python Full Stack Technical Screening",
      technology: "Python",
      overallScore: 90,
      technical: 92,
      communication: 88,
      status: "Verified",
      evaluatedAt: "Nov 01, 2026",
      remarks: "Aarav is placement-ready for Python Backend Engineer roles.",
    },
    {
      id: "int-2026-002",
      title: "Java Enterprise Systems & JVM Internals",
      technology: "Java",
      overallScore: 93,
      technical: 95,
      communication: 92,
      status: "Verified",
      evaluatedAt: "Nov 01, 2026",
      remarks: "Superb performance by Pooja. Rahul Sir verified and approved scorecard.",
    },
    {
      id: "int-2026-003",
      title: "DSA & Systems Algorithmic Screening",
      technology: "DSA",
      overallScore: 78,
      technical: 80,
      communication: 76,
      status: "In Review",
      evaluatedAt: "Nov 01, 2026",
      remarks: "Candidate demonstrates strong reasoning; needs follow-up on negative edge weights.",
    },
  ];

  return (
    <AppShell role="student">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E2E8F0] gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                SCORECARDS & OUTCOMES
              </span>
              <span className="text-xs text-[#64748B]">• Official Verified Outcomes</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
              My Interview Scorecards
            </h1>
            <p className="text-sm text-[#475569] mt-0.5">
              Access your detailed turn-by-turn evaluations, AI feedback, and faculty mentor remarks.
            </p>
          </div>

          <button onClick={() => window.print()} className="btn btn-outline text-xs py-2 px-3.5 self-start sm:self-auto">
            <Printer size={15} />
            <span>Print All Scorecards</span>
          </button>
        </div>

        {/* Scorecards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {scorecards.map((s) => (
            <div key={s.id} className="card p-6 bg-white border border-[#E2E8F0] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {s.technology}
                  </span>
                  <span className={`badge text-[10px] ${s.status === "Verified" ? "badge-success" : "badge-warning"}`}>
                    {s.status}
                  </span>
                </div>

                <h3 className="font-bold text-base text-[#0F172A] mb-1 leading-snug">
                  {s.title}
                </h3>
                <span className="text-xs text-slate-400 block mb-4">
                  Completed on {s.evaluatedAt}
                </span>

                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-semibold">Overall Placement Score:</span>
                    <span className="text-xl font-extrabold text-[#C2410C]">{s.overallScore}%</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center text-xs pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-slate-400 text-[10px] block">Technical:</span>
                      <span className="font-bold text-slate-800">{s.technical}%</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block">Communication:</span>
                      <span className="font-bold text-slate-800">{s.communication}%</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 italic bg-amber-50/50 p-3 rounded-lg border border-amber-100">
                  "{s.remarks}"
                </p>
              </div>

              <div className="pt-4 mt-4 border-t border-[#E2E8F0]">
                <Link
                  href={`/student/interview/${s.id}/report`}
                  className="btn btn-primary btn-sm w-full font-bold text-xs py-2 justify-center"
                >
                  <span>View Full Performance Report</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
