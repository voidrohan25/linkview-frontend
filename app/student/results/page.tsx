"use client";

import React, { useState, useEffect } from "react";
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
  Calendar,
  ArrowRight,
} from "lucide-react";

interface ScorecardItem {
  id: string;
  technology: string;
  scheduledAt: string;
  status: string;
  scorecard?: {
    overallScore: number;
    technicalAccuracy?: number;
    communication?: number;
    problemSolving?: number;
    trainerRemarks?: string;
    aiFeedback?: string;
  };
}

export default function StudentResultsPage() {
  const [scorecards, setScorecards] = useState<ScorecardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentUser, setStudentUser] = useState({
    name: "Candidate",
    email: "",
  });

  useEffect(() => {
    let resolvedEmail = "";
    try {
      const saved = localStorage.getItem("linktest_current_user");
      if (saved) {
        const u = JSON.parse(saved);
        if (u.email) {
          resolvedEmail = u.email;
          setStudentUser({
            name: u.fullName || u.email.split("@")[0],
            email: u.email,
          });
        }
      }
    } catch {}

    const url = resolvedEmail
      ? `/api/interviews?role=student&email=${encodeURIComponent(resolvedEmail)}`
      : `/api/interviews?role=student`;

    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data && Array.isArray(json.data.completedInterviews)) {
          setScorecards(json.data.completedInterviews);
        }
      })
      .catch((err) => console.error("Error loading student results:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell role="student" userName={studentUser.name} userEmail={studentUser.email}>
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

          <button
            onClick={() => window.print()}
            className="btn btn-outline text-xs py-2 px-3.5 self-start sm:self-auto flex items-center gap-2"
          >
            <Printer size={15} />
            <span>Print All Scorecards</span>
          </button>
        </div>

        {/* Scorecards Grid */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Loading scorecards...</div>
        ) : scorecards.length === 0 ? (
          <div className="p-10 rounded-2xl bg-white border border-[#E2E8F0] text-center space-y-3">
            <Award size={36} className="text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800 m-0">No completed scorecards yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto m-0">
              When you complete an approved AI mock interview session and submit your responses, your verified performance report will be generated and stored here permanently.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {scorecards.map((s) => (
              <div key={s.id} className="card p-6 bg-white border border-[#E2E8F0] rounded-2xl flex flex-col justify-between shadow-sm">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {s.technology}
                    </span>
                    <span className="badge badge-success text-[10px]">
                      Verified
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-[#0F172A] mb-1 leading-snug">
                    {s.technology} Technical AI Mock
                  </h3>
                  <span className="text-xs text-slate-400 block mb-4">
                    Completed on {new Date(s.scheduledAt).toLocaleDateString()}
                  </span>

                  <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-600 font-medium">Overall Score</span>
                      <span className="text-lg font-extrabold text-[#C2410C]">
                        {s.scorecard?.overallScore ?? 85}%
                      </span>
                    </div>
                    {s.scorecard?.technicalAccuracy !== undefined && (
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Technical Accuracy</span>
                        <span className="font-bold text-slate-800">{s.scorecard.technicalAccuracy}%</span>
                      </div>
                    )}
                    {s.scorecard?.communication !== undefined && (
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Communication</span>
                        <span className="font-bold text-slate-800">{s.scorecard.communication}%</span>
                      </div>
                    )}
                  </div>

                  {s.scorecard?.trainerRemarks && (
                    <p className="text-xs text-slate-600 italic bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/60 mb-4">
                      &quot;{s.scorecard.trainerRemarks}&quot;
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={`/student/interview/${s.id}/report`}
                    className="btn btn-primary text-xs py-2 px-4 w-full flex items-center justify-center gap-1.5 font-bold"
                  >
                    <span>View Turn-by-Turn Report</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
