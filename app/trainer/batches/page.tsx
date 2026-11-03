"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  BookOpen,
  Users,
  Sparkles,
  ArrowRight,
  Layers,
  UserPlus,
  Search,
  CheckCircle2,
  X,
  GraduationCap,
} from "lucide-react";

interface BatchItem {
  id: string;
  name: string;
  code: string;
  technology: string;
  trainerName?: string;
  trainerId?: string;
  studentCount?: number;
  students?: string[];
  enrolledStudents?: Array<{ id: string; fullName: string; email: string }>;
}

interface StudentCandidate {
  id: string;
  fullName: string;
  email: string;
  batchCode?: string;
}

export default function TrainerBatchesPage() {
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [trainerUser, setTrainerUser] = useState({
    name: "Faculty Trainer",
    email: "",
  });

  // Enrollment Modal State
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [targetBatch, setTargetBatch] = useState<BatchItem | null>(null);
  const [candidateSearch, setCandidateSearch] = useState("");
  const [allStudents, setAllStudents] = useState<StudentCandidate[]>([]);
  const [enrollingEmail, setEnrollingEmail] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadBatches = async () => {
    try {
      const res = await fetch("/api/batches");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setBatches(json.data);
      }
    } catch (e) {
      console.error("Error loading trainer batches:", e);
    } finally {
      setLoading(false);
    }
  };

  const loadAllStudents = async () => {
    try {
      const res = await fetch("/api/admin/users?role=student");
      const json = await res.json();
      const list = Array.isArray(json.data) ? json.data : (Array.isArray(json.users) ? json.users : []);
      setAllStudents(list);
    } catch {}
  };

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

    loadBatches();
    loadAllStudents();
  }, []);

  const openEnrollModal = (batch: BatchItem) => {
    setTargetBatch(batch);
    setCandidateSearch("");
    setStatusMsg(null);
    setEnrollModalOpen(true);
  };

  const handleEnrollStudent = async (student: StudentCandidate) => {
    if (!targetBatch) return;
    setEnrollingEmail(student.email);
    setStatusMsg(null);

    try {
      const res = await fetch("/api/batches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "enroll_student",
          batchCode: targetBatch.code,
          studentEmail: student.email,
          studentName: student.fullName,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setStatusMsg({
          type: "success",
          text: `Candidate ${student.fullName} (${student.email}) successfully enrolled into ${targetBatch.name}!`,
        });

        // Update local targetBatch
        setTargetBatch((prev) =>
          prev
            ? {
                ...prev,
                students: [...(prev.students || []), student.email.toLowerCase()],
                studentCount: (prev.studentCount || 0) + 1,
              }
            : null
        );

        // Reload batches and students
        loadBatches();
        loadAllStudents();
      } else {
        setStatusMsg({ type: "error", text: json.error || "Failed to enroll student" });
      }
    } catch {
      setStatusMsg({ type: "error", text: "Network error during enrollment" });
    } finally {
      setEnrollingEmail(null);
    }
  };

  // Scope batches to logged-in trainer (unless admin / lead faculty)
  const isLeadAdmin =
    trainerUser.email.toLowerCase().includes("admin") ||
    trainerUser.email.toLowerCase() === "rahul.sir@linktest.io" ||
    !trainerUser.email;

  const assignedBatches = isLeadAdmin
    ? batches
    : batches.filter(
        (b) =>
          (b.trainerName && b.trainerName.toLowerCase().includes(trainerUser.name.toLowerCase())) ||
          (b.trainerId && b.trainerId.toLowerCase() === trainerUser.email.toLowerCase())
      );

  const filteredCandidates = allStudents.filter(
    (s) =>
      !candidateSearch ||
      s.fullName.toLowerCase().includes(candidateSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(candidateSearch.toLowerCase())
  );

  return (
    <AppShell role="trainer" userName={trainerUser.name} userEmail={trainerUser.email}>
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
              Search students by name or email, enroll them into your assigned cohorts, and schedule AI mock interviews.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/trainer/schedule" className="btn btn-primary self-start sm:self-auto flex items-center gap-2">
              <Sparkles size={16} />
              <span>Schedule Batch Mock</span>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Loading assigned batches...</div>
        ) : assignedBatches.length === 0 ? (
          <div className="p-10 rounded-2xl bg-white border border-[#E2E8F0] text-center space-y-3">
            <BookOpen size={36} className="text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800 m-0">No active cohorts assigned</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto m-0">
              When the institute administrator creates cohorts and assigns you as faculty, they will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assignedBatches.map((batch) => (
              <div key={batch.id} className="card p-6 bg-white border border-[#E2E8F0] space-y-4 rounded-2xl shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      {batch.technology}
                    </span>
                    <h3 className="text-lg font-bold text-[#0F172A] mt-2 mb-0.5">{batch.name}</h3>
                    <span className="text-xs text-slate-500 font-mono">Code: {batch.code}</span>
                  </div>
                  <span className="badge badge-success text-[10px]">Active</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Enrolled Students</span>
                    <strong className="text-base font-extrabold text-slate-900">
                      {batch.students ? batch.students.length : (batch.studentCount || 0)} Candidates
                    </strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[11px]">Assigned Faculty</span>
                    <span className="font-semibold text-slate-700">
                      {batch.trainerName || "Lead Faculty"}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => openEnrollModal(batch)}
                    className="btn btn-outline btn-sm text-xs py-1.5 px-3 flex items-center gap-1.5 text-blue-700 border-blue-200 hover:bg-blue-50 font-bold"
                  >
                    <UserPlus size={14} />
                    <span>Search & Add Student</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <Link href="/trainer/schedule" className="btn btn-primary btn-sm text-xs py-1.5 px-3">
                      <Sparkles size={13} />
                      <span>Schedule Mock</span>
                    </Link>
                    <Link href="/trainer/students" className="btn btn-outline btn-sm text-xs py-1.5 px-3 text-slate-600">
                      <span>Roster</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* SEARCH & ENROLL STUDENT MODAL */}
        {enrollModalOpen && targetBatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 m-0">
                      Enroll Student into {targetBatch.name}
                    </h3>
                    <p className="text-xs text-slate-500 m-0">
                      Batch Code: <span className="font-mono font-bold text-slate-700">{targetBatch.code}</span> • Track: {targetBatch.technology}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEnrollModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              {statusMsg && (
                <div
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                    statusMsg.type === "success"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-red-50 border-red-200 text-red-800"
                  }`}
                >
                  {statusMsg.type === "success" ? (
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  ) : (
                    <X size={16} className="text-red-600 shrink-0" />
                  )}
                  <span>{statusMsg.text}</span>
                </div>
              )}

              {/* Student Search Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Search Registered Student by Name or Email:
                </label>
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    autoFocus
                    placeholder="Type student name or email to search..."
                    value={candidateSearch}
                    onChange={(e) => setCandidateSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Matching Candidate List */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Available Students ({filteredCandidates.length})
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                  {filteredCandidates.length === 0 ? (
                    <div className="p-4 text-center text-slate-400">
                      No students found matching &quot;{candidateSearch}&quot;.
                    </div>
                  ) : (
                    filteredCandidates.map((student) => {
                      const isAlreadyEnrolled =
                        targetBatch.students?.some((e) => e.toLowerCase() === student.email.toLowerCase()) ||
                        student.batchCode === targetBatch.code;

                      const isEnrolling = enrollingEmail === student.email;

                      return (
                        <div
                          key={student.id}
                          className="p-3 flex items-center justify-between gap-3 hover:bg-white transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0">
                              {student.fullName ? student.fullName.slice(0, 2).toUpperCase() : "S"}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 leading-tight">
                                {student.fullName}
                              </span>
                              <span className="text-[11px] text-slate-500 font-mono">
                                {student.email}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                Current Status:{" "}
                                {student.batchCode && student.batchCode !== "UNASSIGNED"
                                  ? `Batch ${student.batchCode}`
                                  : "Unassigned"}
                              </span>
                            </div>
                          </div>

                          <div>
                            {isAlreadyEnrolled ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 size={12} />
                                <span>Enrolled</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                disabled={isEnrolling}
                                onClick={() => handleEnrollStudent(student)}
                                className="btn btn-primary text-xs py-1.5 px-3 font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 shadow-sm"
                              >
                                <UserPlus size={13} />
                                <span>{isEnrolling ? "Enrolling..." : "+ Add to Batch"}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setEnrollModalOpen(false)}
                  className="btn btn-outline text-xs py-2 px-4 font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
