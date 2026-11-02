"use client";

import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  FileText,
  Printer,
  Sparkles,
  TrendingUp,
  Award,
  ChevronRight,
} from "lucide-react";

export default function TrainerReportsPage() {
  const reports = [
    {
      id: "int-2026-001",
      candidate: "Aarav Sharma",
      batch: "Python Full Stack 2026-A",
      technology: "Python",
      overallScore: 90,
      technical: 92,
      communication: 88,
      status: "Approved",
    },
    {
      id: "int-2026-002",
      candidate: "Pooja Iyer",
      batch: "Java Enterprise Systems 2026-B",
      technology: "Java",
      overallScore: 93,
      technical: 95,
      communication: 92,
      status: "Approved",
    },
  ];

  return (
    <AppShell role="trainer" userName="Rahul Sir (Lead Faculty)" userEmail="rahul.sir@linktest.io">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E2E8F0] gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                EVALUATION OUTCOMES
              </span>
              <span className="text-xs text-[#64748B]">• Cohort Scorecards & Reviews</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Candidate Performance Reports
            </h1>
            <p className="text-sm text-[#475569] mt-0.5">
              Consolidated evaluation outcomes, technical breakdowns, and printable candidate placement reports.
            </p>
          </div>

          <button onClick={() => window.print()} className="btn btn-outline text-xs py-2 px-3.5 self-start sm:self-auto">
            <Printer size={15} />
            <span>Print Cohort Report</span>
          </button>
        </div>

        <div className="card p-0 overflow-hidden bg-white border border-[#E2E8F0]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-bold text-[#64748B] uppercase tracking-wider">
                  <th className="py-3 px-4">CANDIDATE</th>
                  <th className="py-3 px-4">COHORT BATCH</th>
                  <th className="py-3 px-4">TECH TRACK</th>
                  <th className="py-3 px-4 text-center">TECHNICAL</th>
                  <th className="py-3 px-4 text-center">COMMUNICATION</th>
                  <th className="py-3 px-4 text-center">OVERALL SCORE</th>
                  <th className="py-3 px-4 text-right">SCORECARD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#0F172A]">{r.candidate}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-700">{r.batch}</td>
                    <td className="py-3.5 px-4 font-semibold text-blue-700">{r.technology}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">{r.technical}%</td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">{r.communication}%</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-xs font-extrabold px-2.5 py-0.5 rounded bg-[#FFEDD5] text-[#C2410C] border border-[#FED7AA]">
                        {r.overallScore}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/student/interview/${r.id}/report`}
                        className="btn btn-outline btn-sm text-xs py-1 px-3"
                      >
                        View Full Report
                      </Link>
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
