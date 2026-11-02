"use client";

import React, { useState } from "react";
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
} from "lucide-react";

interface Trainer {
  id: string;
  fullName: string;
  email: string;
  specialization: string;
  assignedBatches: string[];
  status: "active" | "inactive";
  scheduledInterviews: number;
  pendingEvaluations: number;
}

export default function AdminTrainersPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [trainers, setTrainers] = useState<Trainer[]>([
    {
      id: "tr-201",
      fullName: "Rahul Sir (Founder & Lead Trainer)",
      email: "rahul.sir@linktest.io",
      specialization: "System Design, DSA, Core Java",
      assignedBatches: ["Java Enterprise Systems 2026-B", "DSA & Systems Placement Track"],
      status: "active",
      scheduledInterviews: 18,
      pendingEvaluations: 3,
    },
    {
      id: "tr-202",
      fullName: "Priya Nambiar",
      email: "priya.nambiar@linktest.io",
      specialization: "Python, Django, Machine Learning & SQL",
      assignedBatches: ["Python Full Stack 2026-A"],
      status: "active",
      scheduledInterviews: 12,
      pendingEvaluations: 2,
    },
    {
      id: "tr-203",
      fullName: "Vikrant Mehta",
      email: "vikrant.m@linktest.io",
      specialization: "Frontend Architecture, React, TypeScript, Next.js",
      assignedBatches: ["Python Full Stack 2026-A"],
      status: "active",
      scheduledInterviews: 8,
      pendingEvaluations: 1,
    },
  ]);

  const [newTrainer, setNewTrainer] = useState({
    fullName: "",
    email: "",
    specialization: "",
  });

  const handleAddTrainer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrainer.fullName || !newTrainer.email) return;

    const trainer: Trainer = {
      id: `tr-${Date.now().toString().slice(-3)}`,
      fullName: newTrainer.fullName,
      email: newTrainer.email,
      specialization: newTrainer.specialization || "Full Stack Engineering",
      assignedBatches: ["Python Full Stack 2026-A"],
      status: "active",
      scheduledInterviews: 0,
      pendingEvaluations: 0,
    };

    setTrainers([...trainers, trainer]);
    setModalOpen(false);
    setNewTrainer({ fullName: "", email: "", specialization: "" });
  };

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
              Authoritative management of faculty accounts, cohort allocations, and evaluation throughput.
            </p>
          </div>

          <button
            onClick={() => setModalOpen(true)}
            className="btn btn-primary self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>Add Faculty Trainer</span>
          </button>
        </div>

        {/* Trainers Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {trainers.map((tr) => (
            <div key={tr.id} className="card p-6 bg-white border border-[#E2E8F0] flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-[#1E3A8A] to-[#2563EB] flex items-center justify-center text-white font-extrabold text-sm shadow-sm">
                      {tr.fullName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-[#0F172A] leading-tight">
                        {tr.fullName}
                      </h3>
                      <span className="text-xs text-slate-500 font-mono">{tr.id}</span>
                    </div>
                  </div>
                  <span className="badge badge-success text-[10px]">Active</span>
                </div>

                <div className="space-y-2 mt-4 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail size={14} className="text-slate-400" />
                    <span>{tr.email}</span>
                  </div>

                  <div className="flex items-start gap-2 text-slate-600">
                    <Sparkles size={14} className="text-orange-500 flex-shrink-0 mt-0.5" />
                    <span className="font-medium text-slate-800">{tr.specialization}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E2E8F0]">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Assigned Batches:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {tr.assignedBatches.map((b) => (
                      <span
                        key={b}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-[#E2E8F0] grid grid-cols-2 gap-2 text-center bg-[#F8FAFC] -mx-6 -mb-6 p-4 rounded-b-xl">
                <div>
                  <div className="text-lg font-extrabold text-[#0F172A]">
                    {tr.scheduledInterviews}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">Interviews</div>
                </div>
                <div className="border-l border-slate-200">
                  <div className="text-lg font-extrabold text-amber-600">
                    {tr.pendingEvaluations}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">Pending Review</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add Trainer Modal */}
        {modalOpen && (
          <div className="modal-overlay" onClick={() => setModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
                <h3 className="text-lg font-bold text-[#0F172A] m-0">Invite New Faculty Trainer</h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddTrainer} className="space-y-4 pt-4">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={newTrainer.fullName}
                    onChange={(e) => setNewTrainer({ ...newTrainer, fullName: e.target.value })}
                    placeholder="e.g. Dr. Rajesh Kulkarni"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={newTrainer.email}
                    onChange={(e) => setNewTrainer({ ...newTrainer, email: e.target.value })}
                    placeholder="e.g. rajesh.k@linktest.io"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Specialization / Technologies</label>
                  <input
                    type="text"
                    value={newTrainer.specialization}
                    onChange={(e) => setNewTrainer({ ...newTrainer, specialization: e.target.value })}
                    placeholder="e.g. Java, Spring Boot, Microservices"
                    className="form-input"
                  />
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
                    Create Trainer Account
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
