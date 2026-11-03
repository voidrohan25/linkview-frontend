"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { BookOpen, Users, Sparkles, ArrowRight, Layers } from "lucide-react";

interface BatchItem {
  id: string;
  name: string;
  code: string;
  technology: string;
  trainerName?: string;
  trainerId?: string;
  studentCount?: number;
  students?: string[];
}

export default function TrainerBatchesPage() {
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [trainerUser, setTrainerUser] = useState({
    name: "Faculty Trainer",
    email: "",
  });

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

    fetch("/api/batches")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data)) {
          setBatches(json.data);
        }
      })
      .catch((e) => console.error("Error loading trainer batches:", e))
      .finally(() => setLoading(false));
  }, []);

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
              Review batch interview readiness and trigger cohort-wide AI mock interview rounds.
            </p>
          </div>

          <Link href="/trainer/schedule" className="btn btn-primary self-start sm:self-auto flex items-center gap-2">
            <Sparkles size={16} />
            <span>Schedule Batch Mock</span>
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Loading assigned batches...</div>
        ) : batches.length === 0 ? (
          <div className="p-10 rounded-2xl bg-white border border-[#E2E8F0] text-center space-y-3">
            <BookOpen size={36} className="text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800 m-0">No active cohorts assigned</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto m-0">
              When the institute administrator creates cohorts and assigns you as faculty, they will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {batches.map((batch) => (
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

                <div className="pt-2 flex items-center justify-between">
                  <Link href="/trainer/schedule" className="btn btn-primary btn-sm text-xs py-1.5 px-3">
                    <Sparkles size={13} />
                    <span>Schedule Cohort Round</span>
                  </Link>
                  <Link href="/trainer/students" className="btn btn-outline btn-sm text-xs py-1.5 px-3 text-slate-600">
                    <span>View Learners</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
