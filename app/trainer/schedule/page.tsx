"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  FileQuestion,
  Plus,
} from "lucide-react";
import { QuestionBankItem } from "@/lib/interviewStore";

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

  // Question Source: 'auto' | 'custom'
  const [questionSource, setQuestionSource] = useState<"auto" | "custom">("auto");
  const [availableBankQuestions, setAvailableBankQuestions] = useState<QuestionBankItem[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [studentsList, setStudentsList] = useState<any[]>([]);

  // Load question bank and registered students
  useEffect(() => {
    fetch("/api/trainer/questions")
      .then((res) => res.json())
      .then((json) => {
        if (json.success) {
          setAvailableBankQuestions(json.data || []);
        }
      })
      .catch(() => {});

    fetch("/api/admin/users?role=student")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setStudentsList(json.data);
          setSelectedStudent(json.data[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const filteredQuestions = availableBankQuestions.filter(
    (q) => q.technology.toLowerCase() === technology.toLowerCase()
  );

  const toggleQuestionSelection = (id: string) => {
    if (selectedQuestionIds.includes(id)) {
      setSelectedQuestionIds(selectedQuestionIds.filter((item) => item !== id));
    } else {
      setSelectedQuestionIds([...selectedQuestionIds, id]);
    }
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg("");

    try {
      const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00Z`).toISOString();
      const customQuestionsText =
        questionSource === "custom"
          ? availableBankQuestions
              .filter((q) => selectedQuestionIds.includes(q.id))
              .map((q) => q.question)
          : undefined;

      const selectedUser = studentsList.find((s) => s.id === selectedStudent);

      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "schedule",
          studentId: selectedStudent,
          studentName: selectedUser ? selectedUser.fullName : undefined,
          studentEmail: selectedUser ? selectedUser.email : undefined,
          batchId: selectedBatch,
          technology,
          interviewType,
          difficulty,
          durationMinutes,
          questionCount: customQuestionsText ? customQuestionsText.length : questionCount,
          scheduledAt,
          customQuestions: customQuestionsText,
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
          <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight m-0">
            Schedule AI Mock Interview
          </h1>
          <p className="text-sm text-[#475569] mt-0.5">
            Configure target technologies, difficulty level, and assign turn-based voice interview sessions with standard or custom imported questions.
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
                <label className="form-label text-xs">Select Candidate *</label>
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="form-select text-xs"
                >
                  {studentsList.length > 0 ? (
                    studentsList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.email}) {s.batchCode ? `• ${s.batchCode}` : ""}
                      </option>
                    ))
                  ) : (
                    <option value="">-- No registered candidates found yet. (Sign in with Google to populate) --</option>
                  )}
                </select>
              </div>
            ) : (
              <div className="form-group pt-2">
                <label className="form-label text-xs">Select Target Batch *</label>
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
                <label className="form-label text-xs">Technology Track *</label>
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
                  <option value="Communication">Free Communication & HR</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label text-xs">Difficulty Level *</label>
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
                <label className="form-label text-xs">Interview Type</label>
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
                <label className="form-label text-xs">Duration (Minutes)</label>
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
                <label className="form-label text-xs">Question Count</label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="form-input text-xs"
                  disabled={questionSource === "custom"}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label text-xs">Scheduled Date</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="form-input text-xs"
                />
              </div>

              <div className="form-group">
                <label className="form-label text-xs">Scheduled Time</label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="form-input text-xs"
                />
              </div>
            </div>
          </div>

          {/* 3. Question Source (Standard vs Custom Imported Questions) */}
          <div className="card p-6 bg-white border border-[#E2E8F0] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] m-0">
                3. Interview Question Source
              </h3>
              <Link
                href="/trainer/import-questions"
                className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
              >
                <Plus size={13} />
                <span>Import New Questions</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setQuestionSource("auto")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  questionSource === "auto"
                    ? "border-orange-500 bg-orange-50/50 shadow-sm"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="font-bold text-xs text-[#0F172A]">Standard AI Question Bank</div>
                <div className="text-[11px] text-slate-500">
                  Adaptive questions automatically selected for {technology}
                </div>
              </button>

              <button
                type="button"
                onClick={() => setQuestionSource("custom")}
                className={`p-3 rounded-xl border text-left transition-all ${
                  questionSource === "custom"
                    ? "border-orange-500 bg-orange-50/50 shadow-sm"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="font-bold text-xs text-[#0F172A]">Custom Imported Questions</div>
                <div className="text-[11px] text-slate-500">
                  Select specific questions imported by faculty
                </div>
              </button>
            </div>

            {/* Custom Question Picker */}
            {questionSource === "custom" && (
              <div className="space-y-3 pt-2">
                <div className="text-xs text-slate-600 flex items-center justify-between">
                  <span>Select questions to ask in this mock interview:</span>
                  <span className="font-bold text-orange-600">
                    {selectedQuestionIds.length} questions selected
                  </span>
                </div>

                {filteredQuestions.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-2">
                    <p className="text-xs text-slate-600 m-0">
                      No custom questions found for <strong>{technology}</strong>.
                    </p>
                    <Link
                      href="/trainer/import-questions"
                      className="btn btn-outline btn-sm text-xs py-1 px-3 inline-flex items-center gap-1"
                    >
                      <Plus size={12} />
                      <span>Import Questions for {technology}</span>
                    </Link>
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
                    {filteredQuestions.map((q) => {
                      const isChecked = selectedQuestionIds.includes(q.id);
                      return (
                        <div
                          key={q.id}
                          onClick={() => toggleQuestionSelection(q.id)}
                          className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-start gap-2.5 transition-colors ${
                            isChecked
                              ? "bg-white border-orange-500 shadow-sm"
                              : "bg-white/80 border-slate-200 hover:border-slate-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="mt-0.5 rounded text-orange-600 focus:ring-orange-500"
                          />
                          <div className="flex-1">
                            <span className="font-semibold text-slate-800">{q.question}</span>
                            <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                              <span className="font-medium text-slate-600">{q.topic}</span>
                              <span>•</span>
                              <span className="capitalize">{q.difficulty}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
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
              className="btn btn-primary text-xs py-2.5 px-6 font-bold flex items-center gap-1.5 shadow-sm"
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
