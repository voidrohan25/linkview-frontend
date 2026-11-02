"use client";

import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { BookOpen, Users, Sparkles, ArrowRight } from "lucide-react";

export default function TrainerBatchesPage() {
  const batches = [
    {
      id: "batch-jv-01",
      name: "Java Enterprise Systems 2026-B",
      code: "JV-2026-B",
      technology: "Java",
      studentsCount: 34,
      avgScore: 88,
      completedMocks: 18,
    },
    {
      id: "batch-dsa-01",
      name: "DSA & Systems Placement Track",
      code: "DSA-2026-P",
      technology: "DSA",
      studentsCount: 42,
      avgScore: 76,
      completedMocks: 24,
    },
  ];

  return (
    <AppShell role="trainer" userName="Rahul Sir (Lead Faculty)" userEmail="rahul.sir@linktest.io">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E2E8F0] gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#F0F9FF] text-[#0284C7] border border-[#BAE6FD]">
                COHORT MANAGEMENT
              </span>
              <span className="text-xs text-[#64748B]">• Assigned Teaching Divisions</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Assigned Cohorts & Batches
            </h1>
            <p className="text-sm text-[#475569] mt-0.5">
              Review batch interview readiness and trigger cohort-wide AI mock interview rounds.
            </p>
          </div>

          <Link href="/trainer/schedule" className="btn btn-primary self-start sm:self-auto">
            <Sparkles size={16} />
            <span>Schedule Batch Mock</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {batches.map((batch) => (
            <div key={batch.id} className="card p-6 bg-white border border-[#E2E8F0] space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {batch.technology}
                  </span>
                  <h3 className="text-lg font-bold text-[#0F172A] mt-2 mb-0.5">{batch.name}</h3>
                  <span className="text-xs text-slate-500 font-mono">Code: {batch.code}</span>
                </div>
                <span className="badge badge-success text-[10px]">Active</span>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center">
                <div>
                  <div className="text-base font-extrabold text-slate-900">{batch.studentsCount}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Students</div>
                </div>
                <div className="border-x border-slate-200">
                  <div className="text-base font-extrabold text-[#EA580C]">{batch.avgScore}%</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Avg Score</div>
                </div>
                <div>
                  <div className="text-base font-extrabold text-emerald-600">{batch.completedMocks}</div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase">Mocks Run</div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <Link href="/trainer/schedule" className="btn btn-primary btn-sm text-xs py-1.5 px-3">
                  <Sparkles size={13} />
                  <span>Schedule Cohort Round</span>
                </Link>
                <Link href="/trainer/students" className="btn btn-outline btn-sm text-xs py-1.5 px-3 text-slate-600">
                  <span>View Learners</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
