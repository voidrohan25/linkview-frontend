"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  BarChart3,
  Download,
  Printer,
  Sparkles,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

export default function AdminReportsPage() {
  const [downloading, setDownloading] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      alert("Institutional Interview Performance Report generated and downloaded successfully.");
    }, 1200);
  };

  return (
    <AppShell role="admin" userName="Rahul Sir (Founder & Admin)" userEmail="rahul.sir@linktest.io">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E2E8F0] gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                INSTITUTIONAL METRICS
              </span>
              <span className="text-xs text-[#64748B]">• Cohort Placement Performance</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Reports & Performance Analytics
            </h1>
            <p className="text-sm text-[#475569] mt-0.5">
              Comprehensive institute-level mock interview evaluation scorecards, tech mastery, and weakness diagnosis.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="btn btn-outline text-xs py-2 px-3.5">
              <Printer size={15} />
              <span>Print Scorecard</span>
            </button>
            <button onClick={handleExport} disabled={downloading} className="btn btn-primary text-xs py-2 px-3.5">
              <Download size={15} />
              <span>{downloading ? "Exporting PDF..." : "Export Consolidated Report"}</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="card p-5 bg-white border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                OVERALL CANDIDATE READINESS
              </span>
              <Award size={18} className="text-[#EA580C]" />
            </div>
            <div className="text-3xl font-extrabold text-[#0F172A]">86.4%</div>
            <div className="text-xs text-[#16A34A] font-semibold mt-1">
              +4.2% improvement vs previous cohort
            </div>
          </div>

          <div className="card p-5 bg-white border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                COMPLETED EVALUATIONS
              </span>
              <CheckCircle2 size={18} className="text-[#10B981]" />
            </div>
            <div className="text-3xl font-extrabold text-[#0F172A]">48 Sessions</div>
            <div className="text-xs text-[#64748B] mt-1">
              98.2% candidate turn completion rate
            </div>
          </div>

          <div className="card p-5 bg-white border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                TIER-1 PLACEMENT CLEARANCE
              </span>
              <TrendingUp size={18} className="text-[#2563EB]" />
            </div>
            <div className="text-3xl font-extrabold text-[#0F172A]">72% Candidates</div>
            <div className="text-xs text-[#64748B] mt-1">
              Qualified for product-company mock rounds
            </div>
          </div>
        </div>

        {/* Technology Mastery Breakdown */}
        <div className="card p-6 bg-white border border-[#E2E8F0]">
          <h3 className="text-base font-bold text-[#0F172A] mb-4">
            Technology Track Performance Breakdown
          </h3>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-800">Python Full Stack & Backend Architecture</span>
                <span className="text-[#EA580C]">89% Average Score</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full" style={{ width: "89%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-800">Java Enterprise Systems & Spring Framework</span>
                <span className="text-blue-600">88% Average Score</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full" style={{ width: "88%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-800">Data Structures & Algorithmic Problem Solving</span>
                <span className="text-emerald-600">76% Average Score</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full" style={{ width: "76%" }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-800">HR, Behavioral & STAR Communication</span>
                <span className="text-purple-600">92% Average Score</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{ width: "92%" }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Identified Common Weaknesses & Action Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="card p-6 bg-white border border-[#E2E8F0]">
            <div className="flex items-center gap-2 mb-3 text-amber-700">
              <AlertTriangle size={18} />
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] m-0">
                Top Identified Technical Gaps
              </h3>
            </div>
            <ul className="space-y-2 text-xs text-slate-700 pl-4 list-disc">
              <li>
                <strong>Garbage Collection & GC cycles:</strong> Candidates often confuse WeakReference vs SoftReference memory triggers.
              </li>
              <li>
                <strong>Asymptotic Space Overhead:</strong> Candidates frequently omit recursion call-stack auxiliary memory in dynamic programming.
              </li>
              <li>
                <strong>CPython Concurrency:</strong> Confusion persists between multithreading vs multiprocessing CPU-bound bottlenecks.
              </li>
            </ul>
          </div>

          <div className="card p-6 bg-white border border-[#E2E8F0]">
            <div className="flex items-center gap-2 mb-3 text-emerald-700">
              <CheckCircle2 size={18} />
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] m-0">
                Institute Remediation Strategy
              </h3>
            </div>
            <ul className="space-y-2 text-xs text-slate-700 pl-4 list-disc">
              <li>
                <strong>Mandatory Mock Round 2:</strong> Schedule follow-up micro-interviews on edge cases for candidates scoring below 75%.
              </li>
              <li>
                <strong>Trainer Code Walkthrough:</strong> Rahul Sir to conduct focused workshop on JVM thread dumps and production troubleshooting.
              </li>
              <li>
                <strong>Voice Practice Drills:</strong> Encourage students to utilize the AI Voice Room to hone structured STAR verbal explanations.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
