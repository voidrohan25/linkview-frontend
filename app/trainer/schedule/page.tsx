"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import {
  CalendarPlus,
  Sparkles,
  Users,
  Clock,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
} from "lucide-react";

export default function TrainerSchedulePage() {
  const router = useRouter();

  const [mode, setMode] = useState<"student" | "batch">("student");
  const [selectedStudent, setSelectedStudent] = useState("std-101");
  const [selectedBatch, setSelectedBatch] = useState("batch-py-01");
  const [technology, setTechnology] = useState("Python");
  const [interviewType, setInterviewType] = useState<"technical" | "hr" | "coding" | "mixed">("technical");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [questionCount, setQuestionCount] = useState(3);
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split("T")[0]);
  const [scheduledTime, setScheduledTime] = useState("15:00");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg("");

    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00Z`).toISOString();
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "schedule",
          studentId: selectedStudent,
          batchId: selectedBatch,
          technology,
          interviewType,
          difficulty,
          durationMinutes,
          questionCount,
          scheduledAt,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSuccessMsg(
          `AI Mock Interview successfully scheduled for ${technology} (${difficulty.toUpperCase()} level). Session ID: ${json.data.id}`
        );
        setTimeout(() => {
          router.push("/trainer/dashboard");
        }, 1800);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell role="trainer" userName="Rahul Sir (Lead Faculty)" userEmail="rahul.sir@linktest.io">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="pb-5 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#FFEDD5] text-[#C2410C] border border-[#FED7AA]">
              AI SCHEDULER
            </span>
            <span className="text-xs text-[#64748B]">• Automated Technical Interviewer</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
            Schedule AI Mock Interview
          </h1>
          <p className="text-sm text-[#475569] mt-0.5">
            Configure target technologies, difficulty level, and assign turn-based voice interview sessions to students.
          </p>
        </div>

        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSchedule} className="space-y-6">
          {/* Target Candidate vs Cohort Toggle */}
          <div className="card p-6 bg-white border border-[#E2E8F0] space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] m-0">
              1. Candidate Assignment Target
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMode("student")}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                  mode === "student"
                    ? "border-orange-500 bg-orange-50/50 shadow-sm"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    mode === "student" ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Users size={16} />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#0F172A]">Individual Student</div>
                  <div className="text-[11px] text-slate-500">Target a specific candidate</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMode("batch")}
                className={`p-3 rounded-xl border text-left flex items-center gap-3 transition-all ${
                  mode === "batch"
                    ? "border-blue-600 bg-blue-50/50 shadow-sm"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div
                  className={`p-2 rounded-lg ${
                    mode === "batch" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <BookOpen size={16} />
                </div>
                <div>
                  <div className="font-bold text-xs text-[#0F172A]">Entire Batch Cohort</div>
                  <div className="text-[11px] text-slate-500">Assign to all batch students</div>
                </div>
              </button>
            </div>

            {mode === "student" ? (
              <div className="form-group pt-2">
                <label className="form-label">Select Candidate *</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="form-select text-xs"
                >
                  <option value="std-101">Aarav Sharma (Python Full Stack 2026-A)</option>
                  <option value="std-102">Pooja Iyer (Java Enterprise Systems 2026-B)</option>
                  <option value="std-103">Rohan Verma (DSA Placement Track)</option>
                  <option value="std-104">Ananya Deshmukh (Python Full Stack 2026-A)</option>
                  <option value="std-105">Vikram Malhotra (Java Enterprise Systems 2026-B)</option>
                </select>
              </div>
            ) : (
              <div className="form-group pt-2">
                <label className="form-label">Select Target Batch *</label>
                <select
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className="form-select text-xs"
                >
                  <option value="batch-py-01">Python Full Stack 2026-A (28 Students)</option>
                  <option value="batch-jv-01">Java Enterprise Systems 2026-B (34 Students)</option>
                  <option value="batch-dsa-01">DSA & Systems Placement Track (42 Students)</option>
                </select>
              </div>
            )}
          </div>

          {/* Technology & Interview Specs */}
          <div className="card p-6 bg-white border border-[#E2E8F0] space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] m-0">
              2. Interview Curriculum & Parameters
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Technology Track *</label>
                <select
                  value={technology}
                  onChange={(e) => setTechnology(e.target.value)}
                  className="form-select text-xs"
                >
                  <option value="Python">Python</option>
                  <option value="Java">Java</option>
                  <option value="DSA">Data Structures & Algorithms (DSA)</option>
                  <option value="React">React & Frontend</option>
                  <option value="SQL">SQL & Database Systems</option>
                  <option value="HR">HR & Cultural Fit</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Difficulty Level *</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="form-select text-xs"
                >
                  <option value="beginner">Beginner (Foundations & Syntax)</option>
                  <option value="intermediate">Intermediate (Systems & Trade-offs)</option>
                  <option value="advanced">Advanced (Production & Architecture)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="form-group">
                <label className="form-label">Interview Type</label>
                <select
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value as any)}
                  className="form-select text-xs"
                >
                  <option value="technical">Technical Round</option>
                  <option value="coding">Algorithmic / Coding</option>
                  <option value="hr">HR & Behavioral</option>
                  <option value="mixed">Mixed Comprehensive</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Duration (Minutes)</label>
                <input
                  type="number"
                  min="15"
                  max="90"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="form-input text-xs"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Question Count</label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="form-input text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Scheduled Date</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="form-input text-xs"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Scheduled Time</label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="form-input text-xs"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/trainer/dashboard")}
              className="btn btn-secondary text-xs py-2 px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary text-xs py-2.5 px-6 font-bold"
            >
              <Sparkles size={15} />
              <span>{submitting ? "Scheduling Session..." : "Confirm & Schedule Mock"}</span>
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
