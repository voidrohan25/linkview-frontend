"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  Sparkles,
  Mic,
  Clock,
  CheckCircle2,
  Calendar,
  Award,
  ArrowRight,
  Filter,
  Play,
  ShieldCheck,
} from "lucide-react";

interface StudentInterviewItem {
  id: string;
  technology: string;
  interviewType?: string;
  difficulty: string;
  durationMinutes: number;
  questionCount?: number;
  scheduledAt: string;
  trainerName: string;
  batchName?: string;
  status: "scheduled" | "in_progress" | "completed" | "pending_evaluation" | "cancelled";
  approvalStatus?: "not_requested" | "pending" | "approved" | "rejected";
  scorecard?: {
    overallScore: number;
  };
}

export default function StudentInterviewsListPage() {
  const [interviews, setInterviews] = useState<StudentInterviewItem[]>([]);
  const [filterTech, setFilterTech] = useState("all");
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState<string | null>(null);

  const [studentUser, setStudentUser] = useState({
    name: "Candidate",
    email: "",
  });

  const loadInterviews = (userEmail?: string) => {
    const emailToUse = userEmail || studentUser.email;
    const url = emailToUse
      ? `/api/interviews?role=student&email=${encodeURIComponent(emailToUse)}`
      : `/api/interviews?role=student`;

    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          const all = [
            ...(json.data.upcomingInterviews || []),
            ...(json.data.completedInterviews || []),
          ];
          if (json.data.nextScheduledInterview) {
            const exists = all.some((i) => i.id === json.data.nextScheduledInterview.id);
            if (!exists) all.unshift(json.data.nextScheduledInterview);
          }
          setInterviews(all);
        }
      })
      .catch((err) => console.error("Error loading assigned interviews:", err))
      .finally(() => setLoading(false));
  };

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

    loadInterviews(resolvedEmail);
    const interval = setInterval(() => loadInterviews(resolvedEmail), 3000);
    return () => clearInterval(interval);
  }, []);

  const handleRequestStart = async (id: string) => {
    setRequestingId(id);
    try {
      const res = await fetch("/api/trainer/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request_start",
          interviewId: id,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setInterviews((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, approvalStatus: "pending" } : item
          )
        );
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRequestingId(null);
    }
  };

  const filtered = interviews.filter(
    (item) => filterTech === "all" || item.technology.toLowerCase() === filterTech.toLowerCase()
  );

  return (
    <AppShell role="student" userName={studentUser.name} userEmail={studentUser.email}>
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E2E8F0] gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#FFEDD5] text-[#C2410C] border border-[#FED7AA]">
                TECHNICAL SCREENINGS
              </span>
              <span className="text-xs text-[#64748B]">• AI Mock Interview Programs</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Assigned AI Mock Interviews
            </h1>
            <p className="text-sm text-[#475569] mt-0.5">
              Attend scheduled voice interviews, view transcripts, and inspect performance scorecards.
            </p>
          </div>

          <Link href="/student/interview/active" className="btn btn-primary self-start sm:self-auto flex items-center gap-2">
            <Mic size={16} />
            <span>Open Voice Interview Room</span>
          </Link>
        </div>

        {/* Filter */}
        <div className="card p-4 bg-white border border-[#E2E8F0] flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">Filter by Technology:</span>
          <select
            value={filterTech}
            onChange={(e) => setFilterTech(e.target.value)}
            className="form-select text-xs py-1.5 px-3"
          >
            <option value="all">All Technologies</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="dsa">DSA</option>
            <option value="react">React</option>
            <option value="sql">SQL</option>
            <option value="hr">HR</option>
          </select>
        </div>

        {/* Interviews Grid */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Loading assigned interviews...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 rounded-2xl bg-white border border-[#E2E8F0] text-center space-y-3">
            <Calendar size={36} className="text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800 m-0">No assigned interviews scheduled</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto m-0">
              When faculty trainers schedule mock rounds for your cohort or individual account, they will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="card p-6 bg-white border border-[#E2E8F0] hover:border-slate-300 transition-all rounded-2xl flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                      {item.technology}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        item.status === "completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : item.approvalStatus === "approved"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : item.approvalStatus === "pending"
                          ? "bg-amber-100 text-amber-800 animate-pulse"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {item.status === "completed"
                        ? "Completed"
                        : item.approvalStatus === "approved"
                        ? "Trainer Approved"
                        : item.approvalStatus === "pending"
                        ? "Awaiting Trainer Approval"
                        : "Scheduled"}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[#0F172A] m-0 leading-snug">
                    {item.technology} Technical AI Mock Assessment
                  </h3>

                  <div className="text-xs text-slate-500 space-y-1">
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="text-slate-400" />
                      <span>{new Date(item.scheduledAt).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{new Date(item.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <div>Assigned by: <strong>{item.trainerName}</strong></div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  {item.status === "completed" ? (
                    <Link
                      href={`/student/interview/${item.id}/report`}
                      className="btn btn-outline text-xs py-2 px-4 w-full flex items-center justify-center gap-1.5 font-bold"
                    >
                      <span>View Performance Report</span>
                      <ArrowRight size={13} />
                    </Link>
                  ) : item.approvalStatus === "approved" ? (
                    <Link
                      href={`/student/interview/${item.id}`}
                      className="btn btn-primary text-xs py-2.5 px-4 w-full flex items-center justify-center gap-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                    >
                      <Play size={14} fill="currentColor" />
                      <span>Enter AI Interview Room</span>
                    </Link>
                  ) : item.approvalStatus === "pending" ? (
                    <button
                      disabled
                      className="btn btn-outline text-xs py-2 px-4 w-full flex items-center justify-center gap-2 bg-amber-50 text-amber-800 border-amber-300 cursor-wait font-bold"
                    >
                      <Clock size={14} className="animate-spin text-amber-600" />
                      <span>Waiting for Trainer Approval...</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRequestStart(item.id)}
                      disabled={requestingId === item.id}
                      className="btn btn-primary text-xs py-2.5 px-4 w-full flex items-center justify-center gap-2 font-bold text-white shadow-md shadow-orange-600/20"
                    >
                      <Play size={14} fill="currentColor" />
                      <span>{requestingId === item.id ? "Submitting Request..." : "Request to Start Mock"}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
