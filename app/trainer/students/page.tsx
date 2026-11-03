"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  UserCheck,
  Search,
  CalendarPlus,
  Sparkles,
  Award,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Check,
} from "lucide-react";

interface StudentRecord {
  id: string;
  fullName: string;
  email: string;
  role?: string;
  batchCode?: string;
  batch?: string;
  technology?: string;
  interviewsTaken?: number;
  avgScore?: number;
  readiness?: string;
}

const AVAILABLE_BATCHES = [
  { code: "PY-2026-A", label: "PY-2026-A (Python Track)", tech: "Python Full Stack" },
  { code: "JAVA-2026-B", label: "JAVA-2026-B (Java Enterprise)", tech: "Java Enterprise" },
  { code: "DSA-2026-C", label: "DSA-2026-C (DSA & Systems)", tech: "DSA & Algorithms" },
  { code: "REACT-2026-D", label: "REACT-2026-D (Frontend & React)", tech: "React & Next.js" },
  { code: "FULLSTACK-2026-E", label: "FULLSTACK-2026-E (Full Stack Placement)", tech: "MERN / Full Stack" },
];

export default function TrainerStudentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [batchNotice, setBatchNotice] = useState<string | null>(null);
  const [trainerUser, setTrainerUser] = useState({
    name: "Faculty Trainer",
    email: "",
  });

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users?role=student");
      if (res.ok) {
        const json = await res.json();
        const list = Array.isArray(json.data) ? json.data : (Array.isArray(json.users) ? json.users : []);
        if (list.length > 0) {
          const mapped: StudentRecord[] = list.map((u: any) => ({
            id: u.id,
            fullName: u.fullName || u.email?.split("@")[0] || "Candidate",
            email: u.email,
            role: u.role,
            batchCode: u.batchCode || "UNASSIGNED",
            batch: u.batchCode && u.batchCode !== "UNASSIGNED" ? `Batch ${u.batchCode}` : "Unassigned",
            technology: u.batchCode?.startsWith("JAVA")
              ? "Java Enterprise"
              : u.batchCode?.startsWith("DSA")
              ? "DSA & Algorithms"
              : u.batchCode?.startsWith("PY")
              ? "Python Full Stack"
              : "General",
            interviewsTaken: 0,
            avgScore: 0,
            readiness: u.batchCode && u.batchCode !== "UNASSIGNED" ? "Cohort Enrolled" : "Pending Assignment",
          }));
          setStudents(mapped);
          setLoading(false);
          return;
        }
      }
    } catch (e) {
      console.warn("Could not fetch students from API:", e);
    }

    // Clean initial state: zero dummy/fake student accounts
    setStudents([]);
    setLoading(false);
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

    fetchStudents();
    // Auto-poll every 3 seconds so new candidate sign-ins show up dynamically
    const pollTimer = setInterval(() => {
      fetchStudents();
    }, 3000);
    return () => clearInterval(pollTimer);
  }, []);

  const handleAssignBatch = async (studentId: string, studentName: string, newBatch: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_batch",
          userId: studentId,
          batchCode: newBatch,
        }),
      });

      if (res.ok) {
        setStudents((prev) =>
          prev.map((s) =>
            s.id === studentId
              ? {
                  ...s,
                  batchCode: newBatch,
                  batch: `Batch ${newBatch}`,
                  technology:
                    AVAILABLE_BATCHES.find((b) => b.code === newBatch)?.tech || s.technology,
                }
              : s
          )
        );
        setBatchNotice(`Assigned ${studentName} to batch ${newBatch}!`);
        setTimeout(() => setBatchNotice(null), 4000);
      }
    } catch (e) {
      console.error("Failed to assign student to batch:", e);
    }
  };

  const filtered = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.technology || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.batchCode || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppShell role="trainer" userName={trainerUser.name} userEmail={trainerUser.email}>
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E2E8F0] gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                STUDENT COHORTS
              </span>
              <span className="text-xs text-[#64748B]">• Mentorship & Interview Readiness</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Assigned Candidate Rosters
            </h1>
            <p className="text-sm text-[#475569] mt-0.5">
              Track candidates, assign them to your cohort batches, and schedule targeted AI mock interviews.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchStudents}
              className="btn btn-outline text-xs py-2 px-3 flex items-center gap-1.5"
              title="Refresh Roster"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>
            <Link href="/trainer/schedule" className="btn btn-primary self-start sm:self-auto">
              <CalendarPlus size={16} />
              <span>Schedule Candidate Mock</span>
            </Link>
          </div>
        </div>

        {batchNotice && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <Check size={16} className="text-emerald-600" />
            <span>{batchNotice}</span>
          </div>
        )}

        {/* Search */}
        <div className="card p-4 bg-white border border-[#E2E8F0] max-w-md">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate by name, track, batch or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-9 text-xs"
            />
          </div>
        </div>

        {/* Students Table */}
        <div className="card p-0 overflow-hidden bg-white border border-[#E2E8F0]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-bold text-[#64748B] uppercase tracking-wider">
                  <th className="py-3 px-4">CANDIDATE</th>
                  <th className="py-3 px-4">ASSIGN TO TEACHER BATCH</th>
                  <th className="py-3 px-4 text-center">MOCKS COMPLETED</th>
                  <th className="py-3 px-4 text-center">AVERAGE SCORE</th>
                  <th className="py-3 px-4 text-center">READINESS STATUS</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                      Loading candidates from database...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                      No matching candidates found.
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#0F172A]">{s.fullName}</div>
                        <div className="text-xs text-[#64748B]">{s.email}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <select
                            value={s.batchCode || ""}
                            onChange={(e) => handleAssignBatch(s.id, s.fullName, e.target.value)}
                            className="text-xs font-mono font-bold py-1 px-2.5 rounded-lg border border-slate-300 bg-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                          >
                            <option value="">-- Assign Batch --</option>
                            {AVAILABLE_BATCHES.map((b) => (
                              <option key={b.code} value={b.code}>
                                {b.label}
                              </option>
                            ))}
                          </select>
                          <span className="text-[11px] font-medium text-slate-500 block">
                            Track: {s.technology}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {s.interviewsTaken} Sessions
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-xs font-extrabold px-2.5 py-0.5 rounded bg-[#FFEDD5] text-[#C2410C] border border-[#FED7AA]">
                          {s.avgScore}%
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`badge text-[10px] ${
                            (s.avgScore || 0) >= 85
                              ? "badge-success"
                              : (s.avgScore || 0) >= 75
                              ? "badge-orange"
                              : "badge-danger"
                          }`}
                        >
                          {s.readiness}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          href={`/trainer/schedule?candidateId=${encodeURIComponent(s.id)}&name=${encodeURIComponent(s.fullName)}`}
                          className="btn btn-primary btn-sm text-xs py-1 px-3"
                        >
                          Schedule AI Mock
                        </Link>
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
  );
}
