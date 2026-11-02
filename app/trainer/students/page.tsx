"use client";

import React, { useState } from "react";
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
} from "lucide-react";

export default function TrainerStudentsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const students = [
    {
      id: "std-101",
      fullName: "Aarav Sharma",
      email: "aarav.sharma@linktest.io",
      batch: "Python Full Stack 2026-A",
      technology: "Python",
      interviewsTaken: 3,
      avgScore: 84,
      readiness: "High Readiness",
    },
    {
      id: "std-102",
      fullName: "Pooja Iyer",
      email: "pooja.iyer@linktest.io",
      batch: "Java Enterprise Systems 2026-B",
      technology: "Java",
      interviewsTaken: 4,
      avgScore: 89,
      readiness: "Placement Ready",
    },
    {
      id: "std-103",
      fullName: "Rohan Verma",
      email: "rohan.verma@linktest.io",
      batch: "DSA & Systems Placement Track",
      technology: "DSA",
      interviewsTaken: 2,
      avgScore: 72,
      readiness: "Needs Revision",
    },
    {
      id: "std-104",
      fullName: "Ananya Deshmukh",
      email: "ananya.d@linktest.io",
      batch: "Python Full Stack 2026-A",
      technology: "Python",
      interviewsTaken: 3,
      avgScore: 91,
      readiness: "Placement Ready",
    },
    {
      id: "std-105",
      fullName: "Vikram Malhotra",
      email: "vikram.m@linktest.io",
      batch: "Java Enterprise Systems 2026-B",
      technology: "Java",
      interviewsTaken: 1,
      avgScore: 68,
      readiness: "Needs Revision",
    },
  ];

  const filtered = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.technology.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppShell role="trainer" userName="Rahul Sir (Lead Faculty)" userEmail="rahul.sir@linktest.io">
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
              Track individual candidate interview turnout, weak areas, and schedule targeted follow-up mocks.
            </p>
          </div>

          <Link href="/trainer/schedule" className="btn btn-primary self-start sm:self-auto">
            <CalendarPlus size={16} />
            <span>Schedule Candidate Mock</span>
          </Link>
        </div>

        {/* Search */}
        <div className="card p-4 bg-white border border-[#E2E8F0] max-w-md">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search candidate by name, track, or email..."
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
                  <th className="py-3 px-4">BATCH & TRACK</th>
                  <th className="py-3 px-4 text-center">MOCKS COMPLETED</th>
                  <th className="py-3 px-4 text-center">AVERAGE SCORE</th>
                  <th className="py-3 px-4 text-center">READINESS STATUS</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-[#0F172A]">{s.fullName}</div>
                      <div className="text-xs text-[#64748B]">{s.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{s.batch}</div>
                      <span className="text-xs font-bold text-blue-700">{s.technology}</span>
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
                          s.avgScore >= 85
                            ? "badge-success"
                            : s.avgScore >= 75
                            ? "badge-orange"
                            : "badge-danger"
                        }`}
                      >
                        {s.readiness}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/trainer/schedule?studentId=${s.id}`}
                        className="btn btn-outline btn-sm text-xs py-1 px-3"
                      >
                        Schedule Mock
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
