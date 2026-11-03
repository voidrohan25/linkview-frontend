"use client";

import React, { use, useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { VoiceInterviewRoom } from "@/components/interview/VoiceInterviewRoom";
import { Clock, ShieldCheck, ArrowLeft, Play, RefreshCw, AlertCircle } from "lucide-react";

export default function StudentInterviewByIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [interview, setInterview] = useState<any>(null);
  const [requesting, setRequesting] = useState(false);

  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/interviews?id=${sessionId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setInterview(json.data);
        }
      }
    } catch (e) {
      console.warn("Could not load session:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
    // Live polling every 3 seconds while waiting for trainer approval
    const timer = setInterval(() => {
      fetchSession();
    }, 3000);
    return () => clearInterval(timer);
  }, [sessionId]);

  const handleRequestApproval = async () => {
    setRequesting(true);
    try {
      await fetch("/api/trainer/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request_start",
          interviewId: sessionId,
        }),
      });
      await fetchSession();
    } catch (e) {
      console.error(e);
    } finally {
      setRequesting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      {loading ? (
        <AppShell role="student">
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center space-y-3">
              <RefreshCw size={24} className="animate-spin text-orange-500 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">Verifying interview authorization gate...</p>
            </div>
          </div>
        </AppShell>
      ) : interview && interview.approvalStatus !== "approved" ? (
        <AppShell role="student">
          <div className="max-w-xl mx-auto py-12 px-4">
            <div className="card p-8 bg-white border border-[#E2E8F0] shadow-xl rounded-3xl text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-sm">
                <Clock size={32} className={interview.approvalStatus === "pending" ? "animate-spin" : ""} />
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-extrabold px-3 py-1 rounded-full bg-amber-100 text-amber-900 uppercase tracking-wider">
                  Live Proctoring Authorization Required
                </span>
                <h1 className="text-2xl font-extrabold text-[#0F172A]">
                  Trainer Approval Gate
                </h1>
                <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                  This mock interview for <strong>{interview.technology || "Technical"} Track</strong> requires real-time authorization from your Faculty Trainer before the AI room will activate.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left space-y-2 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Candidate:</span>
                  <span className="font-bold text-slate-900">{interview.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned Faculty:</span>
                  <span className="font-bold text-slate-900">{interview.trainerName || "Faculty Lead"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Gate Status:</span>
                  <span className={`font-bold ${interview.approvalStatus === "pending" ? "text-amber-600 animate-pulse" : "text-slate-600"}`}>
                    {interview.approvalStatus === "pending" ? "⏳ Waiting for Trainer Approval..." : "Authorization Not Requested"}
                  </span>
                </div>
              </div>

              {interview.approvalStatus === "pending" ? (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-semibold space-y-2">
                  <p>
                    Your request is active on the Trainer&apos;s live queue. Stay on this screen; this room will automatically activate as soon as your trainer clicks <strong>Approve</strong>.
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-700 font-mono">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                    Auto-checking every 3s...
                  </span>
                </div>
              ) : (
                <button
                  onClick={handleRequestApproval}
                  disabled={requesting}
                  className="btn btn-primary w-full py-3 text-sm font-bold shadow-lg shadow-orange-600/20 bg-gradient-to-tr from-[#EA580C] to-[#F97316] text-white"
                >
                  <Play size={16} fill="currentColor" />
                  <span>{requesting ? "Submitting..." : "Send Live Start Request to Trainer"}</span>
                </button>
              )}

              <div className="pt-2">
                <Link href="/student/dashboard" className="text-xs text-slate-500 hover:text-slate-800 font-bold inline-flex items-center gap-1">
                  <ArrowLeft size={13} />
                  <span>Return to Student Dashboard</span>
                </Link>
              </div>
            </div>
          </div>
        </AppShell>
      ) : (
        <AppShell role="student">
          <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading Interview Room...</div>}>
            <VoiceInterviewRoom
              initialSessionId={sessionId}
              defaultTrack={interview?.technology || "Python"}
            />
          </Suspense>
        </AppShell>
      )}
    </ProtectedRoute>
  );
}
