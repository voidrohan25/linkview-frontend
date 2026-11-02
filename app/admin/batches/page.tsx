"use client";

import React, { useState } from "react";
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
} from "lucide-react";

interface Batch {
  id: string;
  name: string;
  code: string;
  technology: string;
  trainerName: string;
  studentCount: number;
  startDate: string;
  status: "ongoing" | "upcoming" | "completed";
}

export default function AdminBatchesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([
    {
      id: "batch-py-01",
      name: "Python Full Stack 2026-A",
      code: "PY-2026-A",
      technology: "Python",
      trainerName: "Priya Nambiar",
      studentCount: 28,
      startDate: "2026-08-15",
      status: "ongoing",
    },
    {
      id: "batch-jv-01",
      name: "Java Enterprise Systems 2026-B",
      code: "JV-2026-B",
      technology: "Java",
      trainerName: "Rahul Sir",
      studentCount: 34,
      startDate: "2026-08-20",
      status: "ongoing",
    },
    {
      id: "batch-dsa-01",
      name: "DSA & Systems Placement Track",
      code: "DSA-2026-P",
      technology: "DSA",
      trainerName: "Rahul Sir",
      studentCount: 42,
      startDate: "2026-09-01",
      status: "ongoing",
    },
  ]);

  const [newBatch, setNewBatch] = useState({
    name: "",
    code: "",
    technology: "Python",
    trainerName: "Rahul Sir",
    studentCount: 25,
  });

  const handleAddBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatch.name || !newBatch.code) return;

    const b: Batch = {
      id: `batch-${Date.now().toString().slice(-4)}`,
      name: newBatch.name,
      code: newBatch.code,
      technology: newBatch.technology,
      trainerName: newBatch.trainerName,
      studentCount: Number(newBatch.studentCount) || 20,
      startDate: new Date().toISOString().split("T")[0],
      status: "ongoing",
    };

    setBatches([...batches, b]);
    setModalOpen(false);
    setNewBatch({
      name: "",
      code: "",
      technology: "Python",
      trainerName: "Rahul Sir",
      studentCount: 25,
    });
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
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Batch & Cohort Management
            </h1>
            <p className="text-sm text-[#475569] mt-0.5">
              Manage multi-technology course batches, trainer allocations, and batch-wide interview readiness.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="btn btn-primary self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Create New Batch</span>
          </button>
        </div>

        {/* Batches Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {batches.map((batch) => (
            <div key={batch.id} className="card p-6 bg-white border border-[#E2E8F0] flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-[#FFEDD5] text-[#C2410C] border border-[#FED7AA]">
                    {batch.technology}
                  </span>
                  <span className="badge badge-success text-[10px]">Active</span>
                </div>

                <h3 className="text-lg font-bold text-[#0F172A] mb-1 leading-snug">
                  {batch.name}
                </h3>
                <span className="text-xs text-slate-500 font-mono block mb-4">
                  Code: {batch.code}
                </span>

                <div className="space-y-2 text-xs text-slate-600 bg-[#F8FAFC] p-3.5 rounded-lg border border-[#E2E8F0]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Lead Trainer:</span>
                    <span className="font-bold text-slate-800">{batch.trainerName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Enrolled Candidates:</span>
                    <span className="font-bold text-slate-800">{batch.studentCount} Students</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Commenced:</span>
                    <span className="font-medium text-slate-700">{batch.startDate}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
                <Link
                  href="/trainer/schedule"
                  className="btn btn-primary btn-sm text-xs py-1.5 px-3"
                >
                  <Sparkles size={13} />
                  <span>Schedule Batch Mock</span>
                </Link>
                <Link
                  href="/admin/users"
                  className="btn btn-outline btn-sm text-xs py-1.5 px-3 text-slate-600"
                >
                  <span>View Roster</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Create Batch Modal */}
        {modalOpen && (
          <div className="modal-overlay" onClick={() => setModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
                <h3 className="text-lg font-bold text-[#0F172A] m-0">Create New Cohort Batch</h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddBatch} className="space-y-4 pt-4">
                <div className="form-group">
                  <label className="form-label">Batch Title *</label>
                  <input
                    type="text"
                    required
                    value={newBatch.name}
                    onChange={(e) => setNewBatch({ ...newBatch, name: e.target.value })}
                    placeholder="e.g. React & Full Stack 2026-C"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Batch Code *</label>
                  <input
                    type="text"
                    required
                    value={newBatch.code}
                    onChange={(e) => setNewBatch({ ...newBatch, code: e.target.value })}
                    placeholder="e.g. REACT-2026-C"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Core Technology Track</label>
                  <select
                    value={newBatch.technology}
                    onChange={(e) => setNewBatch({ ...newBatch, technology: e.target.value })}
                    className="form-select"
                  >
                    <option value="Python">Python</option>
                    <option value="Java">Java</option>
                    <option value="DSA">Data Structures & Algorithms (DSA)</option>
                    <option value="React">React & Modern Frontend</option>
                    <option value="SQL">SQL & Database Systems</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Assigned Faculty Trainer</label>
                  <select
                    value={newBatch.trainerName}
                    onChange={(e) => setNewBatch({ ...newBatch, trainerName: e.target.value })}
                    className="form-select"
                  >
                    <option value="Rahul Sir">Rahul Sir (Founder & Lead Trainer)</option>
                    <option value="Priya Nambiar">Priya Nambiar</option>
                    <option value="Vikrant Mehta">Vikrant Mehta</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-[#E2E8F0] flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="btn btn-secondary text-xs"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary text-xs">
                    Create Cohort
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
