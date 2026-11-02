"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  BookOpen,
  Users,
  Sparkles,
  CalendarPlus,
  CheckCircle2,
  Clock,
  Video,
  FileText,
  Check,
  X,
  AlertCircle,
  ChevronRight,
  TrendingUp,
} from "lucide-react";

interface InterviewItem {
  id: string;
  studentName: string;
  studentEmail: string;
  technology: string;
  interviewType: string;
  difficulty: string;
  status: string;
  scheduledAt: string;
  scorecard?: {
    overallScore: number;
  };
}

export default function TrainerDashboardPage() {
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [filterTab, setFilterTab] = useState<"ALL" | "PENDING" | "COMPLETED">("PENDING");
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/interviews?role=trainer")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data && data.data.recentInterviews) {
          setInterviews(data.data.recentInterviews);
        }
      })
      .catch((err) => console.error("Failed to load trainer dashboard:", err));
  }, []);

  const pendingList = interviews.filter((i) => i.status === "pending_evaluation");
  const completedList = interviews.filter((i) => i.status === "completed");
  const displayList =
    filterTab === "ALL"
      ? interviews
      : filterTab === "PENDING"
      ? pendingList
      : completedList;

  const handleQuickApprove = async (id: string) => {
    setEvaluatingId(id);
    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve_scorecard",
          interviewId: id,
          remarks: "Verified and approved by trainer. Good conceptual understanding.",
          approved: true,
        }),
      });
      if (res.ok) {
        setInterviews((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, status: "completed" } : item
          )
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluatingId(null);
    }
  };

  return (
    <AppShell role="trainer" userName="Rahul Sir (Lead Faculty)" userEmail="rahul.sir@linktest.io">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* LinkTest Faculty Command Center Gradient Banner */}
        <div
          className="rounded-2xl p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-5"
          style={{ background: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)" }}
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-white/20 text-white border border-white/30">
                Faculty Command Center
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1">
              Welcome back, Rahul Sir!
            </h1>
            <p className="text-sm text-blue-100 max-w-xl">
              Manage your cohort interview sessions, review AI evaluations, provide authoritative remarks, and conduct live mocks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/trainer/schedule"
              className="btn btn-primary text-xs py-2 px-4 shadow-md font-bold"
              style={{ background: "#F97316", borderColor: "#F97316" }}
            >
              <CalendarPlus size={15} />
              <span>Schedule AI Mock</span>
            </Link>
            <Link
              href="/trainer/conduct"
              className="btn btn-outline text-xs py-2 px-4 font-bold bg-white text-[#1E3A8A] border-white hover:bg-blue-50"
            >
              <Video size={15} />
              <span>Live Mock Studio</span>
            </Link>
          </div>
        </div>

        {/* 4 Statistics Cards (Replicating LinkTest Faculty Dashboard) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card p-5 bg-white border border-[#E2E8F0]">
            <div className="flex items-center gap-2 text-[#2563EB] mb-1">
              <BookOpen size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Assigned Batches</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] mt-1">
              3 Cohorts
            </div>
          </div>

          <div className="card p-5 bg-white border border-[#E2E8F0]">
            <div className="flex items-center gap-2 text-[#16A34A] mb-1">
              <Users size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Assigned Students</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#16A34A] mt-1">
              104 Mentees
            </div>
          </div>

          <div className="card p-5 bg-white border border-[#E2E8F0]">
            <div className="flex items-center gap-2 text-[#D97706] mb-1">
              <AlertCircle size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Pending Evaluation</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#D97706] mt-1">
              {pendingList.length} Awaiting
            </div>
          </div>

          <div className="card p-5 bg-white border border-[#E2E8F0]">
            <div className="flex items-center gap-2 text-[#9333EA] mb-1">
              <CheckCircle2 size={16} />
              <span className="text-xs font-bold uppercase tracking-wider">Completed Sessions</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#9333EA] mt-1">
              {completedList.length} Graded
            </div>
          </div>
        </div>

        {/* Evaluation Queue Table (Exact LinkTest Mock Test Requests Replication) */}
        <div className="card p-5 bg-white border border-[#E2E8F0] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2E8F0]">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-[#0F172A] m-0 flex items-center gap-2">
                  <Sparkles size={18} className="text-[#2563EB]" />
                  <span>Student Interview Evaluations</span>
                </h3>
                {pendingList.length > 0 && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#FEF3C7] text-[#B45309] border border-[#FCD34D]">
                    {pendingList.length} PENDING
                  </span>
                )}
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Review candidate audio transcripts, AI evaluations, add faculty remarks, and publish scores.
              </p>
            </div>

            <div className="flex items-center gap-1 bg-[#F1F5F9] p-1 rounded-lg">
              {(["PENDING", "COMPLETED", "ALL"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
                    filterTab === tab
                      ? "bg-white text-[#0F172A] shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tab === "PENDING" ? "Pending" : tab === "COMPLETED" ? "Completed" : "All"}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-bold text-[#64748B] uppercase tracking-wider">
                  <th className="py-3 px-4">CANDIDATE</th>
                  <th className="py-3 px-4">TECHNOLOGY & TYPE</th>
                  <th className="py-3 px-4">SCHEDULED / SUBMITTED</th>
                  <th className="py-3 px-4 text-center">STATUS</th>
                  <th className="py-3 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {displayList.map((item) => (
                  <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#0F172A]">{item.studentName}</div>
                      <div className="text-xs text-[#64748B]">{item.studentEmail}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{item.technology}</div>
                      <span className="text-[11px] font-medium text-slate-500 capitalize">
                        {item.interviewType} • {item.difficulty}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      {new Date(item.scheduledAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {item.status === "completed" ? (
                        <span className="badge badge-success text-[11px]">Approved</span>
                      ) : (
                        <span className="badge badge-warning text-[11px]">Pending Review</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {item.status === "pending_evaluation" ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleQuickApprove(item.id)}
                            disabled={evaluatingId === item.id}
                            className="btn btn-sm text-xs font-bold py-1 px-3 bg-[#16A34A] text-white hover:bg-emerald-700"
                          >
                            <Check size={13} />
                            <span>{evaluatingId === item.id ? "Saving..." : "Approve Score"}</span>
                          </button>
                          <Link
                            href="/trainer/approvals"
                            className="btn btn-outline btn-sm text-xs py-1 px-2.5"
                          >
                            Add Remarks
                          </Link>
                        </div>
                      ) : (
                        <Link
                          href={`/student/interview/${item.id}/report`}
                          className="btn btn-outline btn-sm text-xs py-1 px-3"
                        >
                          View Scorecard
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2 Lower Cards: Assigned Cohorts & Today's Schedule */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="card p-5 bg-white border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-[#0F172A] m-0 flex items-center gap-2">
                <BookOpen size={16} className="text-[#2563EB]" />
                <span>Assigned Batches</span>
              </h3>
              <Link href="/trainer/batches" className="text-xs font-bold text-[#2563EB] hover:underline">
                View All Batches →
              </Link>
            </div>
            <div className="space-y-2">
              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-800">Java Enterprise Systems 2026-B</div>
                  <div className="text-[11px] text-slate-500">34 Active Candidates</div>
                </div>
                <Link href="/trainer/schedule" className="btn btn-outline btn-sm text-xs py-1 px-2">
                  Schedule Mock
                </Link>
              </div>

              <div className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-800">DSA & Systems Placement Track</div>
                  <div className="text-[11px] text-slate-500">42 Active Candidates</div>
                </div>
                <Link href="/trainer/schedule" className="btn btn-outline btn-sm text-xs py-1 px-2">
                  Schedule Mock
                </Link>
              </div>
            </div>
          </div>

          <div className="card p-5 bg-white border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-[#0F172A] m-0 flex items-center gap-2">
                <Users size={16} className="text-[#16A34A]" />
                <span>Assigned Candidates</span>
              </h3>
              <Link href="/trainer/students" className="text-xs font-bold text-[#16A34A] hover:underline">
                View Student Rosters →
              </Link>
            </div>
            <div className="space-y-2">
              <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-800">Pooja Iyer (Java)</div>
                  <div className="text-[11px] text-emerald-700 font-semibold">Latest Score: 93% · Placement Ready</div>
                </div>
                <Link href="/student/interview/int-2026-002/report" className="text-xs font-bold text-blue-600">
                  Report
                </Link>
              </div>

              <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-800">Rohan Verma (DSA)</div>
                  <div className="text-[11px] text-amber-700 font-semibold">Latest Score: 72% · Needs Follow-up</div>
                </div>
                <Link href="/trainer/approvals" className="text-xs font-bold text-amber-600">
                  Review
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
