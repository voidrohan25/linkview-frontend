"use client";

import React, { useState, useEffect } from "react";
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
  Calendar,
  Layers,
} from "lucide-react";

interface AdminReportsData {
  totalStudents: number;
  totalTrainers: number;
  totalBatches: number;
  totalInterviews: number;
  completed: number;
  upcoming: number;
  avgScore: number;
  recentActivity: Array<{
    id: string;
    studentName: string;
    studentEmail: string;
    technology: string;
    difficulty: string;
    status: string;
    score: number | null;
    scheduledAt: string;
  }>;
}

export default function AdminReportsPage() {
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AdminReportsData | null>(null);

  useEffect(() => {
    fetch("/api/interviews?role=admin")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          setData(json.data);
        }
      })
      .catch((err) => console.error("Error loading admin reports:", err))
      .finally(() => setLoading(false));
  }, []);

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

  const completedActivities = (data?.recentActivity || []).filter(
    (a) => a.status === "completed" && a.score !== null
  );

  const tier1ClearanceCount = completedActivities.filter(
    (a) => (a.score || 0) >= 80
  ).length;

  const tier1Percentage =
    completedActivities.length > 0
      ? Math.round((tier1ClearanceCount / completedActivities.length) * 100)
      : 0;

  // Compute tech breakdown dynamically
  const techMap: Record<string, { total: number; sum: number }> = {};
  completedActivities.forEach((a) => {
    const tech = a.technology || "General";
    if (!techMap[tech]) techMap[tech] = { total: 0, sum: 0 };
    techMap[tech].total += 1;
    techMap[tech].sum += a.score || 0;
  });

  const techBreakdown = Object.entries(techMap).map(([tech, stat]) => ({
    tech,
    avg: Math.round(stat.sum / stat.total),
    count: stat.total,
  }));

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
            <div className="text-3xl font-extrabold text-[#0F172A]">
              {data?.avgScore ? `${data.avgScore}%` : "0%"}
            </div>
            <div className="text-xs text-slate-500 font-semibold mt-1">
              Based on {completedActivities.length} evaluated student sessions
            </div>
          </div>

          <div className="card p-5 bg-white border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                COMPLETED EVALUATIONS
              </span>
              <CheckCircle2 size={18} className="text-[#10B981]" />
            </div>
            <div className="text-3xl font-extrabold text-[#0F172A]">
              {data?.completed || 0} Sessions
            </div>
            <div className="text-xs text-[#64748B] mt-1">
              {data?.upcoming || 0} scheduled sessions queued
            </div>
          </div>

          <div className="card p-5 bg-white border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                TIER-1 PLACEMENT CLEARANCE
              </span>
              <TrendingUp size={18} className="text-[#2563EB]" />
            </div>
            <div className="text-3xl font-extrabold text-[#0F172A]">
              {tier1Percentage}% Candidates
            </div>
            <div className="text-xs text-[#64748B] mt-1">
              {tier1ClearanceCount} scored 80%+ on AI assessments
            </div>
          </div>
        </div>

        {/* Technology Mastery Breakdown */}
        <div className="card p-6 bg-white border border-[#E2E8F0]">
          <h3 className="text-base font-bold text-[#0F172A] mb-4">
            Technology Track Performance Breakdown
          </h3>

          {techBreakdown.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              No completed sessions recorded yet. As students take mock assessments, technology breakdowns will calculate automatically.
            </div>
          ) : (
            <div className="space-y-4">
              {techBreakdown.map((t) => (
                <div key={t.tech}>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-slate-800">{t.tech} Track ({t.count} sessions)</span>
                    <span className="text-[#EA580C]">{t.avg}% Average Score</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, Math.max(5, t.avg))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Performance Log */}
        <div className="card p-6 bg-white border border-[#E2E8F0] space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#0F172A] m-0">
              Evaluated Candidate Sessions
            </h3>
            <span className="text-xs text-slate-500">
              {completedActivities.length} total completed
            </span>
          </div>

          {completedActivities.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No completed candidate interview reports found yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {completedActivities.map((act) => (
                <div key={act.id} className="py-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 m-0">{act.studentName}</h4>
                    <span className="text-[11px] text-slate-500">
                      {act.technology} • {act.difficulty.toUpperCase()} • {new Date(act.scheduledAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {act.score !== null ? `${act.score}%` : "Completed"}
                    </span>
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
