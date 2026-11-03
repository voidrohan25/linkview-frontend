"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  FileText,
  Printer,
  Sparkles,
  TrendingUp,
  Award,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

interface EvaluationReport {
  id: string;
  studentName: string;
  studentEmail: string;
  batchName?: string;
  technology: string;
  scheduledAt: string;
  status: string;
  scorecard?: {
    overallScore: number;
    technicalAccuracy?: number;
    communication?: number;
  };
}

export default function TrainerReportsPage() {
  const [reports, setReports] = useState<EvaluationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [trainerUser, setTrainerUser] = useState({
    name: "Faculty Trainer",
    email: "",
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("linktest_current_user");
      if (saved) {
        const u = JSON.parse(saved);
        if (u.fullName || u.email) {
          setTrainerUser({
            name: u.fullName || u.email.split("@")[0],
            email: u.email,
          });
        }
      }
    } catch {}

    fetch("/api/interviews")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data && Array.isArray(json.data.interviews)) {
          const completedOnly = json.data.interviews.filter(
            (i: any) => i.status === "completed"
          );
          setReports(completedOnly);
        }
      })
      .catch((err) => console.error("Error loading trainer reports:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell role="trainer" userName={trainerUser.name} userEmail={trainerUser.email}>
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

          <button onClick={() => window.print()} className="btn btn-outline text-xs py-2 px-3.5 self-start sm:self-auto flex items-center gap-2">
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
                  <th className="py-3 px-4 text-center">OVERALL SCORE</th>
                  <th className="py-3 px-4 text-center">COMPLETED DATE</th>
                  <th className="py-3 px-4 text-right">SCORECARD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                      Loading candidate scorecards...
                    </td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-400 text-xs">
                      No candidate interview reports submitted yet. As learners finish their voice mock interviews, reports will appear here.
                    </td>
                  </tr>
                ) : (
                  reports.map((r) => (
                    <tr key={r.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#0F172A]">{r.studentName}</div>
                        <div className="text-xs text-[#64748B]">{r.studentEmail}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-700">{r.batchName || "Direct Session"}</td>
                      <td className="py-3.5 px-4 font-semibold text-blue-700">{r.technology}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-xs font-extrabold px-2.5 py-0.5 rounded bg-[#FFEDD5] text-[#C2410C] border border-[#FED7AA]">
                          {r.scorecard?.overallScore ?? "—"}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-xs text-slate-500">
                        {new Date(r.scheduledAt).toLocaleDateString()}
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
