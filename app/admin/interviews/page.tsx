"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  Sparkles,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  Trash2,
} from "lucide-react";

interface InterviewRecord {
  id: string;
  studentName: string;
  studentEmail: string;
  trainerName: string;
  batchName?: string;
  technology: string;
  interviewType: string;
  difficulty: string;
  durationMinutes: number;
  scheduledAt: string;
  status: "scheduled" | "in_progress" | "completed" | "pending_evaluation" | "cancelled";
  approvalStatus?: string;
  scorecard?: {
    overallScore: number;
  };
}

export default function AdminInterviewsPage() {
  const [interviews, setInterviews] = useState<InterviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTech, setFilterTech] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Scheduling Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<"student" | "batch">("student");

  const [form, setForm] = useState({
    studentId: "",
    batchId: "",
    trainerName: "Rahul Sir (Lead Faculty)",
    technology: "Python",
    interviewType: "technical",
    difficulty: "intermediate",
    durationMinutes: 30,
    scheduledDate: new Date().toISOString().split("T")[0],
    scheduledTime: "16:00",
  });

  const loadInterviews = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch("/api/interviews");
      const data = await res.json();
      if (data.success && data.data && Array.isArray(data.data.interviews)) {
        setInterviews(data.data.interviews);
      }
    } catch (err) {
      console.error("Error fetching interviews:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const loadPrerequisites = async () => {
    try {
      const [sRes, tRes, bRes] = await Promise.all([
        fetch("/api/admin/users?role=student"),
        fetch("/api/admin/users?role=trainer"),
        fetch("/api/batches"),
      ]);
      const sJson = await sRes.json();
      const tJson = await tRes.json();
      const bJson = await bRes.json();

      if (sJson.success && Array.isArray(sJson.data)) {
        setStudents(sJson.data);
        if (sJson.data.length > 0 && !form.studentId) {
          setForm((prev) => ({ ...prev, studentId: sJson.data[0].id }));
        }
      }
      if (tJson.success && Array.isArray(tJson.data)) {
        setTrainers(tJson.data);
      }
      if (bJson.success && Array.isArray(bJson.data)) {
        setBatches(bJson.data);
        if (bJson.data.length > 0 && !form.batchId) {
          setForm((prev) => ({ ...prev, batchId: bJson.data[0].id }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadInterviews(false);
    loadPrerequisites();
    const interval = setInterval(() => loadInterviews(true), 3000);
    return () => clearInterval(interval);
  }, [loadInterviews]);

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const scheduledAt = new Date(`${form.scheduledDate}T${form.scheduledTime}:00Z`).toISOString();
      const selStudent = students.find((s) => s.id === form.studentId);
      const selBatch = batches.find((b) => b.id === form.batchId);

      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "schedule",
          studentId: scheduleMode === "student" ? form.studentId : undefined,
          studentName: scheduleMode === "student" && selStudent ? selStudent.fullName : undefined,
          studentEmail: scheduleMode === "student" && selStudent ? selStudent.email : undefined,
          batchId: scheduleMode === "batch" ? form.batchId : selStudent?.batchCode,
          batchName: selBatch ? selBatch.name : undefined,
          trainerName: form.trainerName,
          technology: form.technology,
          interviewType: form.interviewType,
          difficulty: form.difficulty,
          durationMinutes: form.durationMinutes,
          questionCount: 3,
          scheduledAt,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setModalOpen(false);
        loadInterviews(false);
      } else {
        alert(json.error || "Failed to schedule interview");
      }
    } catch (err) {
      console.error(err);
      alert("Error scheduling interview");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to cancel and delete this mock interview record?")) return;
    try {
      const res = await fetch(`/api/interviews?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadInterviews(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredInterviews = interviews.filter((item) => {
    const matchesSearch =
      item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.trainerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.technology.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTech = filterTech === "all" || item.technology.toLowerCase() === filterTech.toLowerCase();
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    return matchesSearch && matchesTech && matchesStatus;
  });

  return (
    <AppShell role="admin" userName="Rahul Sir (Founder & Admin)" userEmail="rahul.sir@linktest.io">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E2E8F0] gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                INTERVIEW OPERATIONS
              </span>
              <span className="text-xs text-[#64748B]">• Institute AI Mock Scheduling</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
              AI Mock Interview Programs
            </h1>
            <p className="text-sm text-[#475569] mt-0.5">
              Monitor turn-based AI technical and HR interviews, candidate transcripts, and evaluation scorecards.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="btn btn-primary self-start sm:self-auto flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Schedule New Interview</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="card p-4 bg-white border border-[#E2E8F0] flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate, trainer, or tech..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-9 text-xs w-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <select
              value={filterTech}
              onChange={(e) => setFilterTech(e.target.value)}
              className="form-select text-xs py-2 px-3"
            >
              <option value="all">All Technologies</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="dsa">DSA</option>
              <option value="react">React</option>
              <option value="sql">SQL</option>
              <option value="hr">HR / Behavioral</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="form-select text-xs py-2 px-3"
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="pending_evaluation">Pending Evaluation</option>
            </select>
          </div>
        </div>

        {/* Interviews Table */}
        <div className="card p-0 overflow-hidden bg-white border border-[#E2E8F0]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-bold text-[#64748B] uppercase tracking-wider">
                  <th className="py-3 px-4">CANDIDATE</th>
                  <th className="py-3 px-4">SUPERVISING TRAINER</th>
                  <th className="py-3 px-4">TECHNOLOGY & TYPE</th>
                  <th className="py-3 px-4 text-center">DIFFICULTY</th>
                  <th className="py-3 px-4 text-center">APPROVAL</th>
                  <th className="py-3 px-4 text-center">SCORE</th>
                  <th className="py-3 px-4 text-center">STATUS</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {loading && interviews.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                      Loading scheduled interviews...
                    </td>
                  </tr>
                ) : filteredInterviews.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400 text-xs">
                      No interviews scheduled yet. Click &quot;Schedule New Interview&quot; to assign a candidate assessment.
                    </td>
                  </tr>
                ) : (
                  filteredInterviews.map((item) => (
                    <tr key={item.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#0F172A]">{item.studentName}</div>
                        <div className="text-xs text-[#64748B]">{item.studentEmail}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800">{item.trainerName}</div>
                        <div className="text-xs text-slate-500">
                          {new Date(item.scheduledAt).toLocaleDateString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{item.technology}</div>
                        <span className="text-[11px] font-medium text-slate-500 capitalize">
                          {item.interviewType} Round ({item.durationMinutes}m)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {item.difficulty}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            item.approvalStatus === "approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : item.approvalStatus === "pending"
                              ? "bg-amber-100 text-amber-800 animate-pulse"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {item.approvalStatus === "approved"
                            ? "Approved"
                            : item.approvalStatus === "pending"
                            ? "Pending"
                            : "Not Requested"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold">
                        {item.scorecard?.overallScore ? (
                          <span className="text-xs font-extrabold px-2.5 py-0.5 rounded bg-[#FFEDD5] text-[#C2410C] border border-[#FED7AA]">
                            {item.scorecard.overallScore}%
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {item.status === "completed" ? (
                          <span className="badge badge-success text-[11px]">Completed</span>
                        ) : item.status === "pending_evaluation" ? (
                          <span className="badge badge-warning text-[11px]">Needs Review</span>
                        ) : (
                          <span className="badge badge-blue text-[11px]">Scheduled</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {item.status === "completed" ? (
                            <Link
                              href={`/student/interview/${item.id}/report`}
                              className="btn btn-outline btn-sm text-xs py-1 px-3"
                            >
                              Report
                            </Link>
                          ) : (
                            <span className="text-xs text-slate-400 font-mono">Active</span>
                          )}
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete Interview"
                          >
                            <Trash2 size={15} />
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

        {/* Schedule Interview Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-[#0F172A]/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-orange-600" size={20} />
                  <h3 className="font-bold text-base text-[#0F172A] m-0">Schedule Mock Interview</h3>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleScheduleSubmit} className="space-y-4">
                {/* Target Mode */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setScheduleMode("student")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      scheduleMode === "student"
                        ? "bg-orange-50 text-orange-700 border-orange-300"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    Target Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleMode("batch")}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      scheduleMode === "batch"
                        ? "bg-blue-50 text-blue-700 border-blue-300"
                        : "bg-slate-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    Target Batch Cohort
                  </button>
                </div>

                {scheduleMode === "student" ? (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Select Student *</label>
                    <select
                      value={form.studentId}
                      onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                      className="form-select text-xs w-full p-2.5 rounded-xl border border-slate-200"
                    >
                      {students.length > 0 ? (
                        students.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.fullName} ({s.email}) {s.batchCode ? `• ${s.batchCode}` : ""}
                          </option>
                        ))
                      ) : (
                        <option value="">No students registered yet</option>
                      )}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Select Batch Cohort *</label>
                    <select
                      value={form.batchId}
                      onChange={(e) => setForm({ ...form, batchId: e.target.value })}
                      className="form-select text-xs w-full p-2.5 rounded-xl border border-slate-200"
                    >
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name} ({b.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Technology Track *</label>
                    <select
                      value={form.technology}
                      onChange={(e) => setForm({ ...form, technology: e.target.value })}
                      className="form-select text-xs w-full p-2 rounded-xl border border-slate-200"
                    >
                      <option value="Python">Python</option>
                      <option value="Java">Java</option>
                      <option value="DSA">DSA & Algorithms</option>
                      <option value="React">React & Frontend</option>
                      <option value="SQL">SQL & DBMS</option>
                      <option value="FullStack">Full Stack Systems</option>
                      <option value="HR">HR / Behavioral</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Difficulty Level</label>
                    <select
                      value={form.difficulty}
                      onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                      className="form-select text-xs w-full p-2 rounded-xl border border-slate-200"
                    >
                      <option value="beginner">Beginner (Foundations)</option>
                      <option value="intermediate">Intermediate (Systems & Trade-offs)</option>
                      <option value="advanced">Advanced (High-scale & Concurrency)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Supervising Trainer</label>
                  <select
                    value={form.trainerName}
                    onChange={(e) => setForm({ ...form, trainerName: e.target.value })}
                    className="form-select text-xs w-full p-2.5 rounded-xl border border-slate-200"
                  >
                    <option value="Rahul Sir (Lead Faculty)">Rahul Sir (Lead Faculty)</option>
                    {trainers.map((t) => (
                      <option key={t.id} value={t.fullName}>
                        {t.fullName} ({t.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Date *</label>
                    <input
                      type="date"
                      required
                      value={form.scheduledDate}
                      onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                      className="form-input text-xs w-full p-2 rounded-xl border border-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Time (IST) *</label>
                    <input
                      type="time"
                      required
                      value={form.scheduledTime}
                      onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })}
                      className="form-input text-xs w-full p-2 rounded-xl border border-slate-200"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="btn btn-outline text-xs py-2 px-4"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary text-xs py-2 px-5 font-bold"
                  >
                    {submitting ? "Scheduling..." : "Confirm Schedule"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
