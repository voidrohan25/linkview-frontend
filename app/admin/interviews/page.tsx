"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";

interface InterviewRecord {
  id: string;
  studentName: string;
  studentEmail: string;
  trainerName: string;
  technology: string;
  interviewType: string;
  difficulty: string;
  durationMinutes: number;
  scheduledAt: string;
  status: "scheduled" | "in_progress" | "completed" | "pending_evaluation";
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

  useEffect(() => {
    fetch("/api/interviews")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data && data.data.interviews) {
          setInterviews(data.data.interviews);
        }
      })
      .catch((err) => console.error("Error fetching interviews:", err))
      .finally(() => setLoading(false));
  }, []);

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

          <Link href="/trainer/schedule" className="btn btn-primary self-start sm:self-auto">
            <Plus size={16} />
            <span>Schedule New Interview</span>
          </Link>
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
              className="form-input pl-9 text-xs"
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
                  <th className="py-3 px-4 text-center">SCORE</th>
                  <th className="py-3 px-4 text-center">STATUS</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredInterviews.map((item) => (
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
                    <td className="py-3.5 px-4 text-center font-bold">
                      {item.scorecard?.overallScore ? (
                        <span className="text-xs font-extrabold px-2 py-0.5 rounded bg-[#FFEDD5] text-[#C2410C] border border-[#FED7AA]">
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
                      {item.status === "completed" ? (
                        <Link
                          href={`/student/interview/${item.id}/report`}
                          className="btn btn-outline btn-sm text-xs py-1 px-3"
                        >
                          Scorecard
                        </Link>
                      ) : item.status === "pending_evaluation" ? (
                        <Link
                          href="/trainer/approvals"
                          className="btn btn-primary btn-sm text-xs py-1 px-3"
                        >
                          Review
                        </Link>
                      ) : (
                        <Link
                          href="/student/interview/active"
                          className="btn btn-primary btn-sm text-xs py-1 px-3"
                        >
                          Start Live
                        </Link>
                      )}
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
