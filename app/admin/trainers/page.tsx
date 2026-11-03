"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  GraduationCap,
  Plus,
  BookOpen,
  Mail,
  Sparkles,
  CheckCircle2,
  X,
  Search,
  Trash2,
  UserX,
  ShieldCheck,
} from "lucide-react";

interface TrainerUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: "active" | "suspended" | "invited";
  batchCode?: string;
  joinedAt: string;
}

interface BatchItem {
  id: string;
  name: string;
  code: string;
  technology: string;
  trainerName?: string;
}

export default function AdminTrainersPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [trainers, setTrainers] = useState<TrainerUser[]>([]);
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const [newTrainer, setNewTrainer] = useState({
    fullName: "",
    email: "",
    batchCode: "",
  });

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [tRes, bRes] = await Promise.all([
        fetch("/api/admin/users?role=trainer"),
        fetch("/api/batches"),
      ]);
      const tJson = await tRes.json();
      const bJson = await bRes.json();

      if (tJson.success && Array.isArray(tJson.data)) {
        setTrainers(tJson.data);
      }
      if (bJson.success && Array.isArray(bJson.data)) {
        setBatches(bJson.data);
      }
    } catch (e) {
      console.error("Error loading trainers:", e);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(false);
    const interval = setInterval(() => loadData(true), 3000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleAddTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrainer.fullName.trim() || !newTrainer.email.trim()) return;

    setSubmitting(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "trainer",
          fullName: newTrainer.fullName.trim(),
          email: newTrainer.email.trim().toLowerCase(),
          batchCode: newTrainer.batchCode || (batches[0]?.code ?? "GLOBAL"),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setMsg(`Trainer "${newTrainer.fullName}" invited/registered successfully.`);
        setNewTrainer({ fullName: "", email: "", batchCode: "" });
        setModalOpen(false);
        loadData(false);
      } else {
        alert(json.error || "Failed to create trainer");
      }
    } catch (e) {
      console.error(e);
      alert("Error adding trainer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemote = async (user: TrainerUser) => {
    if (!confirm(`Demote ${user.fullName} back to Student?`)) return;
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "demote",
          userId: user.id,
        }),
      });
      if (res.ok) {
        loadData(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (user: TrainerUser) => {
    if (!confirm(`Are you sure you want to delete trainer ${user.fullName} (${user.email})?`)) return;
    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(user.id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        loadData(false);
      } else {
        const j = await res.json();
        alert(j.error || "Cannot delete user");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredTrainers = trainers.filter(
    (t) =>
      t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppShell role="admin" userName="Rahul Sir (Founder & Admin)" userEmail="rahul.sir@linktest.io">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E2E8F0] gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                FACULTY ROSTER
              </span>
              <span className="text-xs text-[#64748B]">• Technical Instructors & Mentors</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Faculty & Trainer Management
            </h1>
            <p className="text-sm text-[#475569] mt-0.5">
              Manage trainer profiles, batch assignments, and live interview approvals.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="btn btn-primary self-start sm:self-auto flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Add / Invite Trainer</span>
          </button>
        </div>

        {msg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <span>{msg}</span>
          </div>
        )}

        {/* Search */}
        <div className="card p-3.5 bg-white border border-[#E2E8F0] flex items-center gap-3">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search trainers by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs outline-none bg-transparent"
          />
        </div>

        {/* Trainers Cards Grid */}
        {loading && trainers.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">Loading faculty roster...</div>
        ) : filteredTrainers.length === 0 ? (
          <div className="p-10 rounded-2xl bg-white border border-[#E2E8F0] text-center space-y-3">
            <GraduationCap size={36} className="text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800 m-0">No faculty trainers found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto m-0">
              Click &quot;Add / Invite Trainer&quot; or promote an existing student from the Student Roster to assign them as faculty.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTrainers.map((tr) => (
              <div
                key={tr.id}
                className="card p-5 bg-white border border-[#E2E8F0] hover:border-slate-300 transition-all rounded-2xl flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-md shrink-0">
                        {tr.fullName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-[#0F172A] m-0">{tr.fullName}</h3>
                        <span className="text-xs text-slate-500 truncate block max-w-[180px]">
                          {tr.email}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      Trainer
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Assigned Batch:</span>
                      <strong className="text-slate-800 font-mono">
                        {tr.batchCode || "All Batches"}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <span>Status:</span>
                      <span className="font-semibold text-emerald-600 capitalize">
                        {tr.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleDemote(tr)}
                    className="btn btn-outline text-xs py-1.5 px-3 text-slate-600 hover:text-amber-700 hover:border-amber-400 flex items-center gap-1"
                    title="Demote to Student"
                  >
                    <UserX size={13} />
                    <span>Demote</span>
                  </button>
                  <button
                    onClick={() => handleDelete(tr)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Delete Trainer"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Add Trainer */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 bg-[#0F172A]/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <GraduationCap className="text-blue-600" size={20} />
                  <h3 className="font-bold text-base text-[#0F172A] m-0">Add Faculty Trainer</h3>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddTrainer} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikram Malhotra"
                    value={newTrainer.fullName}
                    onChange={(e) => setNewTrainer({ ...newTrainer, fullName: e.target.value })}
                    className="form-input text-xs w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Trainer Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. vikram@linktest.io"
                    value={newTrainer.email}
                    onChange={(e) => setNewTrainer({ ...newTrainer, email: e.target.value })}
                    className="form-input text-xs w-full p-2.5 rounded-xl border border-slate-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Assign Cohort / Batch</label>
                  <select
                    value={newTrainer.batchCode}
                    onChange={(e) => setNewTrainer({ ...newTrainer, batchCode: e.target.value })}
                    className="form-select text-xs w-full p-2.5 rounded-xl border border-slate-200"
                  >
                    <option value="">-- All Institute Batches --</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.code}>
                        {b.name} ({b.code})
                      </option>
                    ))}
                  </select>
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
                    {submitting ? "Saving..." : "Save Trainer"}
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
