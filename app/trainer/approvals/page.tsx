"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/authContext";
import {
  CheckCircle2,
  AlertCircle,
  Sparkles,
  MessageSquare,
  Clock,
  User,
  Check,
  X,
  FileCheck2,
  ChevronDown,
  RefreshCw,
  ShieldCheck,
  Zap,
  Trash2,
} from "lucide-react";

interface PendingInterviewRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  technology: string;
  interviewType: string;
  difficulty: string;
  scheduledAt: string;
  approvalStatus: string;
  approvalRequestedAt?: string;
  questionCount?: number;
  durationMinutes?: number;
}

export default function TrainerApprovalsPage() {
  const [pendingRequests, setPendingRequests] = useState<PendingInterviewRequest[]>([]);
  const [allInterviews, setAllInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { user: authUser } = useAuth();
  const [trainerUser, setTrainerUser] = useState({
    name: authUser?.fullName || "Faculty Trainer",
    email: authUser?.email || "",
  });

  useEffect(() => {
    if (authUser?.email) {
      setTrainerUser({
        name: authUser.fullName || authUser.email.split("@")[0],
        email: authUser.email,
      });
    }
  }, [authUser]);

  const fetchApprovals = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // 1. Fetch pending requests
      const res = await fetch("/api/trainer/approvals");
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data.pendingInterviews)) {
          setPendingRequests(json.data.pendingInterviews);
        } else if (Array.isArray(json.pendingRequests)) {
          setPendingRequests(json.pendingRequests);
        }
      }

      // 2. Fetch all scheduled/active interviews for overview
      const intRes = await fetch("/api/interviews");
      if (intRes.ok) {
        const intData = await intRes.json();
        if (intData.success && intData.data && Array.isArray(intData.data.interviews)) {
          setAllInterviews(intData.data.interviews);
        }
      }
    } catch (e) {
      console.warn("Could not poll approvals:", e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovals(false);
    const interval = setInterval(() => {
      fetchApprovals(true);
    }, 12000);
    return () => clearInterval(interval);
  }, [fetchApprovals]);

  const handleDecision = async (interviewId: string, action: "approve_start" | "reject_start", studentName: string) => {
    setProcessingId(interviewId);
    try {
      const res = await fetch("/api/trainer/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          interviewId,
          trainerName: trainerUser.name,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setToastMsg(
          action === "approve_start"
            ? `Approved ${studentName}! Mock interview room unlocked.`
            : `Declined request for ${studentName}.`
        );
        setTimeout(() => setToastMsg(""), 4000);
        await fetchApprovals(true);
      }
    } catch (e) {
      console.error("Decision error:", e);
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteInterview = async (interviewId: string) => {
    if (!confirm("Are you sure you want to delete this interview record? This will permanently remove it.")) return;
    try {
      const res = await fetch(`/api/interviews?id=${interviewId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setToastMsg("Interview record deleted successfully.");
        setTimeout(() => setToastMsg(""), 3500);
        await fetchApprovals(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["trainer"]}>
      <AppShell role="trainer" userName={trainerUser.name} userEmail={trainerUser.email}>
      <div className="max-w-[1300px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E2E8F0] gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                PROCTORING & AUTHORIZATION
              </span>
              <span className="text-xs text-[#64748B]">• Live Candidate Gatekeeper</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Mock Interview Authorization Queue
            </h1>
            <p className="text-sm text-[#475569] mt-0.5">
              Review live candidate access requests. Candidates can only enter the AI Interview Room after your live approval.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Live Listening (3s)</span>
            </span>
            <button
              onClick={() => fetchApprovals(false)}
              className="btn btn-outline text-xs py-2 px-3 font-bold flex items-center gap-1.5"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm animate-fadeIn">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* 1. PRIMARY SECTION: Live Candidate Requests Awaiting Approval */}
        <div className="card p-6 bg-white border border-[#E2E8F0] shadow-sm rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                <Clock size={16} className="animate-spin" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 m-0">
                  Live Requests Awaiting Your Approval
                </h2>
                <span className="text-xs text-slate-500">
                  Students currently waiting on their screens to start their mock test
                </span>
              </div>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              {pendingRequests.length} Pending
            </span>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-2">
              <ShieldCheck size={32} className="mx-auto text-emerald-500" />
              <h3 className="text-sm font-bold text-slate-800">No Pending Student Requests</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                When a student with a scheduled interview clicks <strong>&quot;Start Mock Interview&quot;</strong> on their screen, their live request will appear here instantly for you to approve.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-5 rounded-2xl bg-gradient-to-tr from-white to-amber-50/40 border-2 border-amber-300 shadow-md space-y-4 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 uppercase tracking-wide">
                        Requesting Entrance Now
                      </span>
                      <h3 className="text-lg font-extrabold text-slate-900 mt-1 mb-0.5">
                        {req.studentName}
                      </h3>
                      <span className="text-xs text-slate-500 block">{req.studentEmail}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {req.technology} Track
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-1">
                        {req.questionCount || 3} Questions • {req.durationMinutes || 30}m
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-amber-200 text-xs text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Clock size={13} className="text-amber-600" />
                      <span>Requested: {req.approvalRequestedAt ? new Date(req.approvalRequestedAt).toLocaleTimeString() : "Just now"}</span>
                    </span>
                    <span className="text-[10px] text-amber-700 font-bold animate-pulse">
                      Waiting for trainer...
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleDecision(req.id, "approve_start", req.studentName)}
                      disabled={processingId === req.id}
                      className="flex-1 btn btn-primary text-xs py-2.5 px-4 font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                    >
                      <Check size={16} />
                      <span>{processingId === req.id ? "Approving..." : "Approve & Unlock Room"}</span>
                    </button>

                    <button
                      onClick={() => handleDecision(req.id, "reject_start", req.studentName)}
                      disabled={processingId === req.id}
                      className="btn btn-outline text-xs py-2.5 px-3 font-bold text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      <X size={15} />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 2. OVERVIEW: Scheduled & Approved Candidate Sessions */}
        <div className="card p-6 bg-white border border-[#E2E8F0] shadow-sm rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 m-0">
                Scheduled Candidate Interviews Overview
              </h2>
              <span className="text-xs text-slate-500">
                Status of all mock interviews scheduled by faculty
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-bold text-[#64748B] uppercase tracking-wider">
                  <th className="py-3 px-4">CANDIDATE</th>
                  <th className="py-3 px-4">TRACK & TYPE</th>
                  <th className="py-3 px-4">SCHEDULED TIME</th>
                  <th className="py-3 px-4 text-center">APPROVAL GATE STATUS</th>
                  <th className="py-3 px-4 text-right">MANUAL ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {allInterviews.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400 text-xs">
                      No interviews scheduled yet. Go to &quot;Schedule AI Mock&quot; to assign interviews to candidates.
                    </td>
                  </tr>
                ) : (
                  allInterviews.map((intv) => (
                    <tr key={intv.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{intv.studentName}</div>
                        <div className="text-xs text-slate-500">{intv.studentEmail}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-blue-700 text-xs">{intv.technology}</span>
                        <span className="text-xs text-slate-500 block capitalize">{intv.difficulty}</span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {new Date(intv.scheduledAt).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {intv.approvalStatus === "approved" ? (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ✓ Approved by Trainer
                          </span>
                        ) : intv.approvalStatus === "pending" ? (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 animate-pulse">
                            ⏳ Pending Approval
                          </span>
                        ) : intv.approvalStatus === "rejected" ? (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
                            ✕ Rejected
                          </span>
                        ) : (
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            Not Yet Requested
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {intv.approvalStatus !== "approved" && (
                            <button
                              onClick={() => handleDecision(intv.id, "approve_start", intv.studentName)}
                              className="btn btn-outline btn-sm text-xs py-1 px-3 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                            >
                              Pre-Approve
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteInterview(intv.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Interview Record"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
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
  </ProtectedRoute>
);
}
