"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/authContext";
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
  approvalStatus?: string;
  scheduledAt: string;
  scorecard?: {
    overallScore: number;
  };
}

export default function TrainerDashboardPage() {
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [filterTab, setFilterTab] = useState<"ALL" | "PENDING" | "COMPLETED">("ALL");
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [trainerUser, setTrainerUser] = useState({
    name: authUser?.fullName || "Faculty Trainer",
    email: authUser?.email || "",
  });
  const emailRef = useRef(authUser?.email || "");

  useEffect(() => {
    if (authUser?.email) {
      emailRef.current = authUser.email;
      setTrainerUser({
        name: authUser.fullName || authUser.email.split("@")[0],
        email: authUser.email,
      });
    }
  }, [authUser]);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const email = emailRef.current;
      const emailParam = email ? `&email=${encodeURIComponent(email)}` : "";
      const [intRes, bRes, sRes] = await Promise.all([
        fetch(`/api/interviews?role=trainer${emailParam}`),
        fetch("/api/batches"),
        fetch("/api/admin/users?role=student"),
      ]);

      const intJson = await intRes.json();
      const bJson = await bRes.json();
      const sJson = await sRes.json();

      if (intJson.success && intJson.data) {
        setInterviews(intJson.data.recentInterviews || []);
      }
      if (bJson.success && Array.isArray(bJson.data)) {
        setBatches(bJson.data);
      }
      if (sJson.success && Array.isArray(sJson.data)) {
        setStudents(sJson.data);
      }
    } catch (err) {
      console.warn("Failed to load trainer dashboard:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const email = authUser?.email || "";
    emailRef.current = email;
    loadData(false);
    const interval = setInterval(() => loadData(true), 12000);
    return () => clearInterval(interval);
  }, [authUser?.email, loadData]);

  const pendingList = interviews.filter(
    (i) => i.status === "pending_evaluation" || i.approvalStatus === "pending"
  );
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
          remarks: `Verified and approved by ${trainerUser.name}. Good conceptual understanding.`,
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
    <ProtectedRoute allowedRoles={["trainer"]}>
      <AppShell role="trainer" userName={trainerUser.name} userEmail={trainerUser.email}>
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Faculty Command Center Gradient Banner */}
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
              Welcome back, {trainerUser.name}!
            </h1>
            <p className="text-sm text-blue-100 max-w-xl">
              Manage your cohort interview sessions, review candidate start requests, and inspect real-time AI evaluations.
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
              href="/trainer/approvals"
              className="btn btn-outline text-xs py-2 px-4 bg-white/10 hover:bg-white/20 text-white border-white/30 font-bold"
            >
              <CheckCircle2 size={15} />
              <span>Candidate Approvals</span>
            </Link>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="card p-5 bg-white border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                ASSIGNED BATCHES
              </span>
              <BookOpen size={18} className="text-[#2563EB]" />
            </div>
            <div className="text-3xl font-extrabold text-[#0F172A]">{batches.length}</div>
            <div className="text-xs text-[#2563EB] font-semibold mt-1">
              Active Institute Divisions
            </div>
          </div>

          <div className="card p-5 bg-white border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                REGISTERED LEARNERS
              </span>
              <Users size={18} className="text-[#16A34A]" />
            </div>
            <div className="text-3xl font-extrabold text-[#0F172A]">{students.length}</div>
            <div className="text-xs text-slate-500 mt-1">
              Enrolled students in platform
            </div>
          </div>

          <div className="card p-5 bg-white border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
                PENDING APPROVALS
              </span>
              <Clock size={18} className="text-[#EA580C]" />
            </div>
            <div className="text-3xl font-extrabold text-[#0F172A]">
              {pendingList.length}
            </div>
            <div className="text-xs text-orange-600 font-semibold mt-1">
              {pendingList.length > 0 ? "Requests awaiting your approval" : "All queues cleared"}
            </div>
          </div>
        </div>

        {/* Recent Interviews / Queue */}
        <div className="card p-0 overflow-hidden bg-white border border-[#E2E8F0] space-y-0">
          <div className="p-4 sm:p-5 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-base text-[#0F172A] m-0">Recent Candidate Assessments</h3>
              <p className="text-xs text-slate-500 mt-0.5 m-0">
                Scheduled and completed turn-based technical mock sessions
              </p>
            </div>

            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              {(["ALL", "PENDING", "COMPLETED"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterTab(tab)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                    filterTab === tab
                      ? "bg-white text-slate-900 shadow-sm"
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
                  <th className="py-3 px-4 text-center">APPROVAL / STATUS</th>
                  <th className="py-3 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {loading && interviews.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 text-xs">
                      Loading mock sessions...
                    </td>
                  </tr>
                ) : displayList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-slate-400 text-xs">
                      No interviews in this tab. Click &quot;Schedule AI Mock&quot; to schedule candidate interviews.
                    </td>
                  </tr>
                ) : (
                  displayList.map((item) => (
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
                          <span className="badge badge-success text-[11px]">Completed</span>
                        ) : item.approvalStatus === "approved" ? (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            Approved
                          </span>
                        ) : item.approvalStatus === "pending" ? (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-amber-100 text-amber-800 animate-pulse">
                            Needs Approval
                          </span>
                        ) : (
                          <span className="badge badge-blue text-[11px]">Scheduled</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {item.status === "completed" ? (
                          <Link
                            href={`/student/interview/${item.id}/report`}
                            className="btn btn-outline btn-sm text-xs py-1 px-3"
                          >
                            Scorecard
                          </Link>
                        ) : item.approvalStatus === "pending" ? (
                          <Link
                            href="/trainer/approvals"
                            className="btn btn-primary btn-sm text-xs py-1 px-3 bg-amber-600 text-white hover:bg-amber-700"
                          >
                            Review Request
                          </Link>
                        ) : (
                          <Link
                            href="/trainer/approvals"
                            className="btn btn-outline btn-sm text-xs py-1 px-3 text-slate-600"
                          >
                            Manage
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2 Lower Cards: Assigned Batches & Candidates */}
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
            {batches.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 m-0">No cohorts assigned yet.</p>
            ) : (
              <div className="space-y-2">
                {batches.slice(0, 3).map((b) => (
                  <div key={b.id} className="p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-800">{b.name}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        Code: {b.code} • {b.students ? b.students.length : (b.studentCount || 0)} Students
                      </div>
                    </div>
                    <Link href="/trainer/schedule" className="btn btn-outline btn-sm text-xs py-1 px-2">
                      Schedule Mock
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-5 bg-white border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-[#0F172A] m-0 flex items-center gap-2">
                <Users size={16} className="text-[#16A34A]" />
                <span>Registered Learners</span>
              </h3>
              <Link href="/trainer/students" className="text-xs font-bold text-[#16A34A] hover:underline">
                View Student Rosters →
              </Link>
            </div>
            {students.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 m-0">No students registered yet.</p>
            ) : (
              <div className="space-y-2">
                {students.slice(0, 3).map((st) => (
                  <div key={st.id} className="p-3 bg-emerald-50/40 rounded-lg border border-emerald-100 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-800">{st.fullName}</div>
                      <div className="text-[11px] text-slate-500">
                        {st.email} • {st.batchCode || "Unassigned"}
                      </div>
                    </div>
                    <Link href="/trainer/schedule" className="text-xs font-bold text-blue-600">
                      Assign Mock
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  </ProtectedRoute>
);
}
