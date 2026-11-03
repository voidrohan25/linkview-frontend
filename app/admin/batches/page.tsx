"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  BookOpen,
  Plus,
  Users,
  Calendar,
  Sparkles,
  ArrowRight,
  X,
  Trash2,
  RefreshCw,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface BatchRecord {
  id: string;
  name: string;
  code: string;
  technology: string;
  trainerName: string;
  studentCount: number;
  startDate: string;
  status: "ongoing" | "upcoming" | "completed";
  enrolledStudents?: Array<{ id: string; fullName: string; email: string }>;
}

export default function AdminBatchesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const [newBatch, setNewBatch] = useState({
    name: "",
    code: "",
    technology: "Python Full Stack",
    trainerName: "Rahul Sir (Lead Faculty)",
    selectedStudentEmails: [] as string[],
  });

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // 1. Fetch persistent batches
      const bRes = await fetch("/api/batches");
      if (bRes.ok) {
        const bJson = await bRes.json();
        if (bJson.success && Array.isArray(bJson.data)) {
          setBatches(bJson.data);
        }
      }

      // 2. Fetch trainers for assignment
      const tRes = await fetch("/api/admin/users?role=trainer");
      if (tRes.ok) {
        const tJson = await tRes.json();
        const list = Array.isArray(tJson.data) ? tJson.data : (Array.isArray(tJson.users) ? tJson.users : []);
        setTrainers(list);
      }

      // 3. Fetch students to add to batch
      const sRes = await fetch("/api/admin/users?role=student");
      if (sRes.ok) {
        const sJson = await sRes.json();
        const list = Array.isArray(sJson.data) ? sJson.data : (Array.isArray(sJson.users) ? sJson.users : []);
        setStudents(list);
      }
    } catch (e) {
      console.warn("Could not load batches:", e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadData(false);
    const interval = setInterval(() => {
      loadData(true);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleStudentSelection = (email: string) => {
    if (newBatch.selectedStudentEmails.includes(email)) {
      setNewBatch({
        ...newBatch,
        selectedStudentEmails: newBatch.selectedStudentEmails.filter((e) => e !== email),
      });
    } else {
      setNewBatch({
        ...newBatch,
        selectedStudentEmails: [...newBatch.selectedStudentEmails, email],
      });
    }
  };

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatch.name || !newBatch.code) return;

    try {
      const res = await fetch("/api/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newBatch.name,
          code: newBatch.code,
          technology: newBatch.technology,
          trainerName: newBatch.trainerName,
          students: newBatch.selectedStudentEmails,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setStatusMsg(`Created batch ${newBatch.code.toUpperCase()} successfully!`);
        setTimeout(() => setStatusMsg(null), 4000);
        setModalOpen(false);
        setNewBatch({
          name: "",
          code: "",
          technology: "Python Full Stack",
          trainerName: "Rahul Sir (Lead Faculty)",
          selectedStudentEmails: [],
        });
        await loadData(false);
      }
    } catch (err) {
      console.error("Failed to create batch:", err);
    }
  };

  const handleDeleteBatch = async (batchId: string, batchName: string) => {
    if (!confirm(`Are you sure you want to delete batch "${batchName}"? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/batches?id=${batchId}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setStatusMsg(`Batch ${batchName} deleted.`);
        setTimeout(() => setStatusMsg(null), 4000);
        await loadData(false);
      }
    } catch (e) {
      console.error("Failed to delete batch:", e);
    }
  };

  return (
    <AppShell role="admin" userName="Rahul Sir (Founder & Admin)" userEmail="rahul.sir@linktest.io">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E2E8F0] gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#F0F9FF] text-[#0284C7] border border-[#BAE6FD]">
                ACADEMIC COHORTS
              </span>
              <span className="text-xs text-[#64748B]">• Active Technology Batches</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight m-0">
              Batch & Cohort Management
            </h1>
            <p className="text-sm text-[#475569] mt-0.5">
              Create batches, assign trainers, enroll students, and schedule batch-wide AI mock interviews.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Live Synced</span>
            </span>
            <button
              onClick={() => setModalOpen(true)}
              className="btn btn-primary self-start sm:self-auto flex items-center gap-1.5"
            >
              <Plus size={16} />
              <span>Create New Batch</span>
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {statusMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm animate-fadeIn">
            <Check size={16} className="text-emerald-600" />
            <span>{statusMsg}</span>
          </div>
        )}

        {/* Batches Grid */}
        {loading && batches.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Loading batches from database...
          </div>
        ) : batches.length === 0 ? (
          <div className="card p-12 text-center bg-white border border-[#E2E8F0] rounded-2xl space-y-3">
            <BookOpen size={36} className="mx-auto text-slate-300" />
            <h3 className="text-base font-bold text-slate-800">No Cohort Batches Created Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Click &quot;Create New Batch&quot; above to create a technology batch, assign a faculty trainer, and add enrolled candidates.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {batches.map((batch) => {
              const isExpanded = expandedBatchId === batch.id;
              const enrolled = batch.enrolledStudents || [];

              return (
                <div key={batch.id} className="card p-6 bg-white border border-[#E2E8F0] flex flex-col justify-between shadow-sm rounded-2xl relative">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-[#FFEDD5] text-[#C2410C] border border-[#FED7AA]">
                        {batch.technology}
                      </span>
                      <button
                        onClick={() => handleDeleteBatch(batch.id, batch.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Batch"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <h3 className="text-lg font-bold text-[#0F172A] mb-1 leading-snug">
                      {batch.name}
                    </h3>
                    <span className="text-xs text-slate-500 font-mono block mb-4">
                      Code: {batch.code}
                    </span>

                    <div className="space-y-2 text-xs text-slate-600 bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Assigned Trainer:</span>
                        <span className="font-bold text-slate-800">{batch.trainerName}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Enrolled Students:</span>
                        <span className="font-bold text-blue-700">{batch.studentCount} Candidates</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Commenced:</span>
                        <span className="font-medium text-slate-700">{batch.startDate}</span>
                      </div>
                    </div>

                    {/* Expandable Roster List */}
                    {enrolled.length > 0 && (
                      <div className="mt-3">
                        <button
                          onClick={() => setExpandedBatchId(isExpanded ? null : batch.id)}
                          className="text-xs text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1"
                        >
                          <span>{isExpanded ? "Hide Enrolled Candidates" : `View Enrolled Candidates (${enrolled.length})`}</span>
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>

                        {isExpanded && (
                          <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 max-h-36 overflow-y-auto">
                            {enrolled.map((s) => (
                              <div key={s.id} className="flex justify-between items-center text-[11px]">
                                <span className="font-semibold text-slate-800">{s.fullName}</span>
                                <span className="text-slate-400 font-mono">{s.email}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                    <Link
                      href="/trainer/schedule"
                      className="btn btn-primary btn-sm text-xs py-1.5 px-3"
                    >
                      <Sparkles size={13} />
                      <span>Schedule Mock</span>
                    </Link>
                    <Link
                      href="/admin/users"
                      className="btn btn-outline btn-sm text-xs py-1.5 px-3 text-slate-600"
                    >
                      <span>View Users</span>
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create Batch Modal */}
        {modalOpen && (
          <div className="modal-overlay" onClick={() => setModalOpen(false)}>
            <div className="modal-content max-w-lg" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
                <div>
                  <h3 className="text-lg font-bold text-[#0F172A] m-0">Create New Cohort Batch</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Assign a faculty trainer and enroll students directly</p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddBatch} className="space-y-4 pt-4">
                <div className="form-group">
                  <label className="form-label text-xs font-bold">Batch Title *</label>
                  <input
                    type="text"
                    required
                    value={newBatch.name}
                    onChange={(e) => setNewBatch({ ...newBatch, name: e.target.value })}
                    placeholder="e.g. Python Full Stack Placement 2026-B"
                    className="form-input text-xs"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label text-xs font-bold">Batch Code *</label>
                  <input
                    type="text"
                    required
                    value={newBatch.code}
                    onChange={(e) => setNewBatch({ ...newBatch, code: e.target.value })}
                    placeholder="e.g. PY-2026-B"
                    className="form-input text-xs font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label text-xs font-bold">Technology Track</label>
                    <select
                      value={newBatch.technology}
                      onChange={(e) => setNewBatch({ ...newBatch, technology: e.target.value })}
                      className="form-select text-xs font-semibold"
                    >
                      <option value="Python Full Stack">Python Full Stack</option>
                      <option value="Java Enterprise Systems">Java Enterprise Systems</option>
                      <option value="DSA & Systems">DSA & Systems</option>
                      <option value="React & Frontend">React & Frontend</option>
                      <option value="MERN Full Stack">MERN Full Stack</option>
                      <option value="SQL & Data Engineering">SQL & Data Engineering</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label text-xs font-bold">Assign Trainer / Faculty</label>
                    <select
                      value={newBatch.trainerName}
                      onChange={(e) => setNewBatch({ ...newBatch, trainerName: e.target.value })}
                      className="form-select text-xs font-semibold"
                    >
                      <option value="Rahul Sir (Lead Faculty)">Rahul Sir (Lead Faculty)</option>
                      {trainers.map((t) => (
                        <option key={t.id} value={t.fullName}>
                          {t.fullName} ({t.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Add Students Section */}
                <div className="form-group">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="form-label text-xs font-bold m-0">
                      Enroll Registered Students ({newBatch.selectedStudentEmails.length} Selected)
                    </label>
                  </div>
                  {students.length === 0 ? (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                      No registered students found yet. As students sign in, they will appear here.
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl max-h-40 overflow-y-auto space-y-2">
                      {students.map((s) => {
                        const isChecked = newBatch.selectedStudentEmails.includes(s.email);
                        return (
                          <label
                            key={s.id}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs border transition-colors ${
                              isChecked
                                ? "bg-blue-50 border-blue-300 text-blue-900 font-semibold"
                                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-100"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleToggleStudentSelection(s.email)}
                                className="rounded text-blue-600 focus:ring-blue-500"
                              />
                              <span>{s.fullName}</span>
                            </div>
                            <span className="text-[11px] text-slate-400 font-mono">{s.email}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-[#E2E8F0]">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="btn btn-outline text-xs py-2 px-4"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary text-xs py-2 px-5 font-bold"
                  >
                    Create & Assign Batch
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
