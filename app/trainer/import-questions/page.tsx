"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import {
  FileQuestion,
  Sparkles,
  UploadCloud,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Download,
  Filter,
  Search,
  BookOpen,
  CalendarPlus,
  Calendar,
  Clock,
  User,
  X,
  Play,
  CheckSquare,
  Square,
} from "lucide-react";
import { QuestionBankItem } from "@/lib/interviewStore";

export default function TrainerImportQuestionsPage() {
  const router = useRouter();

  // Active tab: 'single' | 'bulk' | 'paste'
  const [activeTab, setActiveTab] = useState<"single" | "bulk" | "paste">("paste");

  // Single Question Form State
  const [tech, setTech] = useState("Python");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [questionText, setQuestionText] = useState("");
  const [keypoints, setKeypoints] = useState("");
  const [idealAnswer, setIdealAnswer] = useState("");

  // Bulk File / Paste State
  const [bulkInput, setBulkInput] = useState("");
  const [rawTextPaste, setRawTextPaste] = useState("");
  const [parsedPasteQuestions, setParsedPasteQuestions] = useState<Partial<QuestionBankItem>[]>([]);
  const [bulkParsedPreview, setBulkParsedPreview] = useState<Partial<QuestionBankItem>[]>([]);

  // Bank List & Filter State
  const [bankQuestions, setBankQuestions] = useState<QuestionBankItem[]>([]);
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([]);
  const [filterTech, setFilterTech] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Direct Scheduling Modal State
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [questionsToSchedule, setQuestionsToSchedule] = useState<QuestionBankItem[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState("");
  const [scheduleTech, setScheduleTech] = useState("Python");
  const [scheduleDifficulty, setScheduleDifficulty] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [scheduleTimeMode, setScheduleTimeMode] = useState<"now" | "custom">("now");
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split("T")[0]);
  const [scheduleTime, setScheduleTime] = useState("16:00");
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledSuccessData, setScheduledSuccessData] = useState<any | null>(null);

  // Fetch Questions
  const loadQuestions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/trainer/questions");
      const json = await res.json();
      if (json.success) {
        setBankQuestions(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load questions:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Registered Students
  const loadCandidates = async () => {
    try {
      const res = await fetch("/api/admin/users?role=student");
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setCandidates(json.data);
        setSelectedCandidateId(json.data[0].id);
      } else {
        // Fallback default student option
        setCandidates([
          { id: "std-101", fullName: "Aarav Sharma", email: "aarav.sharma@linktest.io", batchCode: "PY-2026-A" },
        ]);
        setSelectedCandidateId("std-101");
      }
    } catch {
      setCandidates([
        { id: "std-101", fullName: "Aarav Sharma", email: "aarav.sharma@linktest.io", batchCode: "PY-2026-A" },
      ]);
      setSelectedCandidateId("std-101");
    }
  };

  useEffect(() => {
    loadQuestions();
    loadCandidates();
  }, []);

  // 1. Submit Single Question
  const handleSingleSubmit = async (e: React.FormEvent, andSchedule = false) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    setStatusMsg(null);
    try {
      const keypointsArray = keypoints
        .split(/[,;\n]/)
        .map((k) => k.trim())
        .filter(Boolean);

      const payload = {
        technology: tech,
        topic: topic.trim() || `${tech} Core Concepts`,
        difficulty,
        question: questionText.trim(),
        expectedKeypoints: keypointsArray,
        idealAnswer: idealAnswer.trim(),
        tags: [tech, topic || "General", "TrainerImport"],
      };

      const res = await fetch("/api/trainer/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        setStatusMsg({ type: "success", text: "Question successfully added to question bank!" });
        const createdQuestion = json.data;
        setQuestionText("");
        setTopic("");
        setKeypoints("");
        setIdealAnswer("");
        await loadQuestions();

        if (andSchedule && createdQuestion) {
          openScheduleModal([createdQuestion]);
        }
      } else {
        setStatusMsg({ type: "error", text: json.error || "Failed to add question" });
      }
    } catch {
      setStatusMsg({ type: "error", text: "Network error occurred while saving question" });
    }
  };

  // 2. Parse Raw Text (Numbered or line-by-line questions)
  const handleParseRawText = (text: string) => {
    setRawTextPaste(text);
    if (!text.trim()) {
      setParsedPasteQuestions([]);
      return;
    }

    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const questions: Partial<QuestionBankItem>[] = [];
    lines.forEach((line) => {
      // Strip leading numbering "1.", "1)", "Q1:", "- ", etc.
      const cleaned = line.replace(/^(\d+[\.\:\)]|\w\d+[\.\:\)]|q\d+[\.\:\)]|[-*•])\s*/i, "").trim();
      if (cleaned.length > 8) {
        questions.push({
          technology: tech,
          topic: topic.trim() || `${tech} Technical Interview`,
          difficulty,
          question: cleaned,
          expectedKeypoints: [],
          idealAnswer: "",
          tags: [tech, "PastedSyllabus"],
        });
      }
    });

    setParsedPasteQuestions(questions);
  };

  // 3. Direct Submit of Pasted Questions
  const handlePasteSubmit = async (andSchedule = false) => {
    if (parsedPasteQuestions.length === 0) return;
    setStatusMsg(null);

    try {
      const res = await fetch("/api/trainer/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: parsedPasteQuestions }),
      });

      const json = await res.json();
      if (json.success) {
        const count = json.data?.length || parsedPasteQuestions.length;
        setStatusMsg({
          type: "success",
          text: `Successfully imported ${count} questions into the Institutional Question Bank!`,
        });
        const importedList = json.data || parsedPasteQuestions;
        setRawTextPaste("");
        setParsedPasteQuestions([]);
        await loadQuestions();

        if (andSchedule && importedList.length > 0) {
          openScheduleModal(importedList);
        }
      } else {
        setStatusMsg({ type: "error", text: json.error || "Failed to import questions" });
      }
    } catch {
      setStatusMsg({ type: "error", text: "Network error during bulk import" });
    }
  };

  // 4. Bulk JSON / CSV Parser
  const handleBulkParse = (text: string) => {
    setBulkInput(text);
    setStatusMsg(null);
    if (!text.trim()) {
      setBulkParsedPreview([]);
      return;
    }

    try {
      if (text.trim().startsWith("[") || text.trim().startsWith("{")) {
        const parsed = JSON.parse(text);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        setBulkParsedPreview(
          list.map((q: any) => ({
            technology: q.technology || tech,
            topic: q.topic || "Imported Topic",
            difficulty: q.difficulty || "intermediate",
            question: q.question || q.prompt || "",
            expectedKeypoints: Array.isArray(q.expectedKeypoints) ? q.expectedKeypoints : [],
            idealAnswer: q.idealAnswer || "",
            tags: [q.technology || tech, "BulkImport"],
          }))
        );
        return;
      }

      const lines = text.trim().split("\n");
      const csvItems: Partial<QuestionBankItem>[] = [];
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || (i === 0 && line.toLowerCase().includes("question"))) continue;
        const parts = line.split(",").map((p) => p.trim().replace(/^"|"$/g, ""));
        if (parts.length >= 2) {
          csvItems.push({
            technology: parts[0] || tech,
            topic: parts[1] || "Imported Topic",
            difficulty: (parts[2] as any) || "intermediate",
            question: parts[3] || parts[parts.length - 1],
            expectedKeypoints: [],
            tags: [parts[0] || tech, "CSVImport"],
          });
        }
      }
      setBulkParsedPreview(csvItems);
    } catch (err: any) {
      setStatusMsg({ type: "error", text: "Invalid JSON/CSV format: " + err.message });
      setBulkParsedPreview([]);
    }
  };

  const handleBulkSubmit = async (andSchedule = false) => {
    if (bulkParsedPreview.length === 0) return;
    setStatusMsg(null);

    try {
      const res = await fetch("/api/trainer/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: bulkParsedPreview }),
      });

      const json = await res.json();
      if (json.success) {
        setStatusMsg({ type: "success", text: json.message });
        const importedList = json.data || bulkParsedPreview;
        setBulkInput("");
        setBulkParsedPreview([]);
        await loadQuestions();

        if (andSchedule && importedList.length > 0) {
          openScheduleModal(importedList);
        }
      } else {
        setStatusMsg({ type: "error", text: json.error || "Bulk import failed" });
      }
    } catch {
      setStatusMsg({ type: "error", text: "Failed to submit bulk questions" });
    }
  };

  // Open Direct Scheduling Modal
  const openScheduleModal = (questions: QuestionBankItem[]) => {
    if (!questions || questions.length === 0) return;
    setQuestionsToSchedule(questions);
    setScheduleTech(questions[0].technology || tech);
    setScheduleDifficulty((questions[0].difficulty as any) || difficulty);
    setScheduledSuccessData(null);
    setScheduleModalOpen(true);
  };

  // Handle Multi-Select Checkboxes
  const toggleSelectAll = () => {
    if (selectedBankIds.length === filteredQuestions.length) {
      setSelectedBankIds([]);
    } else {
      setSelectedBankIds(filteredQuestions.map((q) => q.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedBankIds.includes(id)) {
      setSelectedBankIds(selectedBankIds.filter((item) => item !== id));
    } else {
      setSelectedBankIds([...selectedBankIds, id]);
    }
  };

  // Direct Schedule Submission to /api/interviews
  const handleConfirmSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (questionsToSchedule.length === 0) return;

    setIsScheduling(true);
    setScheduledSuccessData(null);

    try {
      const candidate = candidates.find((c) => c.id === selectedCandidateId) || candidates[0];
      const studentName = candidate?.fullName || "Enrolled Student";
      const studentEmail = candidate?.email || "student@linktest.io";

      const scheduledAt =
        scheduleTimeMode === "now"
          ? new Date().toISOString()
          : new Date(`${scheduleDate}T${scheduleTime}:00Z`).toISOString();

      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "schedule",
          studentId: candidate?.id || "std-101",
          studentName,
          studentEmail,
          technology: scheduleTech,
          interviewType: "technical",
          difficulty: scheduleDifficulty,
          durationMinutes: 30,
          questionCount: questionsToSchedule.length,
          scheduledAt,
          customQuestions: questionsToSchedule.map((q) => q.question),
        }),
      });

      const json = await res.json();
      if (json.success) {
        setScheduledSuccessData(json.data);
        setStatusMsg({
          type: "success",
          text: `AI Mock Interview successfully scheduled for ${studentName} (${scheduleTech}) with ${questionsToSchedule.length} imported questions!`,
        });
      } else {
        alert(json.error || "Failed to schedule interview.");
      }
    } catch {
      alert("Network error occurred while scheduling.");
    } finally {
      setIsScheduling(false);
    }
  };

  // Delete Question
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this question from the bank?")) return;
    try {
      const res = await fetch(`/api/trainer/questions?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setBankQuestions((prev) => prev.filter((q) => q.id !== id));
        setSelectedBankIds((prev) => prev.filter((item) => item !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered List
  const filteredQuestions = bankQuestions.filter((q) => {
    const matchesTech = filterTech === "all" || q.technology.toLowerCase() === filterTech.toLowerCase();
    const matchesQuery =
      !searchQuery ||
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTech && matchesQuery;
  });

  return (
    <AppShell role="trainer" userName="Faculty Trainer" userEmail="trainer@linktest.io">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F0] gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                TRAINER STUDIO
              </span>
              <span className="text-xs text-slate-500">• Question Import & Direct Scheduler</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight m-0">
              Import & Schedule Mock Interview Questions
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Paste your institutional questions, import question papers, and immediately assign AI voice mock interviews to candidates.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/trainer/schedule"
              className="btn btn-outline text-xs py-2 px-3.5 font-bold flex items-center gap-1.5"
            >
              <Calendar size={14} />
              <span>Full Scheduler</span>
            </Link>
          </div>
        </div>

        {/* Status Alerts */}
        {statusMsg && (
          <div
            className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              statusMsg.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {statusMsg.type === "success" ? (
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={16} className="text-red-600 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* INGESTION METHODS TABS */}
        <div className="card p-6 bg-white border border-[#E2E8F0] shadow-sm rounded-2xl space-y-5">
          <div className="flex border-b border-slate-200 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("paste")}
              className={`pb-3 px-3.5 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === "paste"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <FileText size={15} />
              <span>Paste Question Paper / Syllabus</span>
              <span className="text-[10px] bg-orange-100 text-orange-800 px-1.5 py-0.2 rounded font-bold">Fastest</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("single")}
              className={`pb-3 px-3.5 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === "single"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Plus size={15} />
              <span>Manual Entry Form</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("bulk")}
              className={`pb-3 px-3.5 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === "bulk"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <UploadCloud size={15} />
              <span>Bulk JSON / CSV</span>
            </button>
          </div>

          {/* TAB 1: PASTE QUESTION PAPER / SYLLABUS (MOST REQUESTED) */}
          {activeTab === "paste" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Technology Track:</label>
                  <select
                    value={tech}
                    onChange={(e) => setTech(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold"
                  >
                    <option value="Python">Python</option>
                    <option value="Java">Java</option>
                    <option value="DSA">Data Structures & Algorithms</option>
                    <option value="SQL">SQL & Relational Databases</option>
                    <option value="React">React & Frontend Architecture</option>
                    <option value="FullStack">Full Stack Systems</option>
                    <option value="Communication">HR & Behavioral STAR</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Topic / Exam Name:</label>
                  <input
                    type="text"
                    placeholder="e.g. Midterm Technical Assessment"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Difficulty:</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate (Recommended)</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between mb-1">
                  <span>Paste Questions (1 per line or numbered list):</span>
                  <span className="text-[11px] text-slate-400 font-normal">Numbering (1., 2., Q1:) is stripped automatically</span>
                </label>
                <textarea
                  rows={6}
                  placeholder={`1. Explain how memory indexing works in PostgreSQL using B-Trees.\n2. How does Python manage reference counting with cyclic garbage collection?\n3. What are the key differences between optimistic and pessimistic locking in databases?`}
                  value={rawTextPaste}
                  onChange={(e) => handleParseRawText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>

              {/* Instant Parsed Preview */}
              {parsedPasteQuestions.length > 0 && (
                <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-orange-950 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-orange-600" />
                      <span>{parsedPasteQuestions.length} Questions Detected & Ready</span>
                    </span>
                    <span className="text-[11px] text-orange-800 font-medium">
                      Track: <strong>{tech}</strong> • Difficulty: <strong>{difficulty}</strong>
                    </span>
                  </div>

                  <div className="max-h-48 overflow-y-auto divide-y divide-orange-100 bg-white rounded-lg border border-orange-200 text-xs">
                    {parsedPasteQuestions.map((q, idx) => (
                      <div key={idx} className="p-2.5 flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-slate-800 font-medium leading-relaxed">{q.question}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => handlePasteSubmit(false)}
                      className="w-full sm:w-auto btn btn-outline text-xs py-2 px-4 font-bold flex items-center justify-center gap-1.5"
                    >
                      <UploadCloud size={14} />
                      <span>Save {parsedPasteQuestions.length} Questions to Bank</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePasteSubmit(true)}
                      className="w-full sm:w-auto btn btn-primary text-xs py-2 px-5 font-bold flex items-center justify-center gap-1.5 shadow-md bg-gradient-to-r from-orange-600 to-amber-600 text-white"
                    >
                      <CalendarPlus size={15} />
                      <span>Import & Schedule Mock Interview Now</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MANUAL ENTRY FORM */}
          {activeTab === "single" && (
            <form onSubmit={(e) => handleSingleSubmit(e, false)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Technology Track:
                  </label>
                  <select
                    value={tech}
                    onChange={(e) => setTech(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                  >
                    <option value="Python">Python</option>
                    <option value="Java">Java</option>
                    <option value="DSA">Data Structures & Algorithms</option>
                    <option value="SQL">SQL & Database Internals</option>
                    <option value="React">React & Frontend</option>
                    <option value="FullStack">Full Stack Systems</option>
                    <option value="Communication">Free Communication & HR</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Topic / Concept:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Memory Management / Indexing"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Difficulty:
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                  >
                    <option value="beginner">Beginner (Foundations)</option>
                    <option value="intermediate">Intermediate (Systems & Trade-offs)</option>
                    <option value="advanced">Advanced (Staff Architect Level)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Interview Question Prompt: <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Type the exact question the AI interviewer should ask the candidate..."
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs leading-relaxed text-slate-800 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Expected Key Points (comma or newline separated):
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Reference counting, Generational GC, GIL thread safety"
                    value={keypoints}
                    onChange={(e) => setKeypoints(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Ideal Answer / Reference Solution:
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief reference answer for the AI rubric evaluation..."
                    value={idealAnswer}
                    onChange={(e) => setIdealAnswer(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
                <button
                  type="submit"
                  className="w-full sm:w-auto btn btn-outline text-xs py-2 px-5 font-bold flex items-center justify-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Save Question to Bank</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => handleSingleSubmit(e, true)}
                  className="w-full sm:w-auto btn btn-primary text-xs py-2 px-5 font-bold flex items-center justify-center gap-1.5 shadow-md bg-gradient-to-r from-orange-600 to-amber-600 text-white"
                >
                  <CalendarPlus size={15} />
                  <span>Save & Schedule Mock Now</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: BULK CSV / JSON */}
          {activeTab === "bulk" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Paste JSON array or CSV data below:</span>
                <button
                  type="button"
                  onClick={() => {
                    const sample = [
                      {
                        technology: "Python",
                        topic: "Memory & GIL",
                        difficulty: "intermediate",
                        question: "Explain how Python manages memory using reference counting and the cyclic GC.",
                        expectedKeypoints: ["ob_refcnt", "generational garbage collector", "cyclic references"],
                      },
                      {
                        technology: "Python",
                        topic: "Asyncio",
                        difficulty: "advanced",
                        question: "How does the asyncio event loop coordinate coroutines without thread context switches?",
                        expectedKeypoints: ["single thread cooperative multitasking", "epoll/kqueue", "generators"],
                      },
                    ];
                    handleBulkParse(JSON.stringify(sample, null, 2));
                  }}
                  className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
                >
                  <Sparkles size={12} />
                  <span>Load Sample JSON</span>
                </button>
              </div>

              <textarea
                rows={6}
                placeholder={`Paste JSON array of questions:\n[\n  {\n    "technology": "Java",\n    "topic": "Concurrency",\n    "difficulty": "intermediate",\n    "question": "Explain ConcurrentHashMap mechanics in Java 8."\n  }\n]`}
                value={bulkInput}
                onChange={(e) => handleBulkParse(e.target.value)}
                className="w-full font-mono bg-slate-900 text-emerald-400 p-3 rounded-xl border border-slate-800 text-xs focus:outline-none"
              />

              {bulkParsedPreview.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-50 border rounded-xl">
                  <span className="text-xs font-bold text-slate-800">
                    {bulkParsedPreview.length} questions parsed and ready
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleBulkSubmit(false)}
                      className="btn btn-outline text-xs py-1.5 px-4 font-bold"
                    >
                      Import to Bank
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkSubmit(true)}
                      className="btn btn-primary text-xs py-1.5 px-4 font-bold bg-orange-600 text-white"
                    >
                      Import & Schedule Mock
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* QUESTION BANK TABLE WITH SELECTION & DIRECT SCHEDULING */}
        <div className="card p-6 bg-white border border-[#E2E8F0] shadow-sm rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-orange-500" />
              <h3 className="text-base font-extrabold text-[#0F172A] m-0">
                Institutional Question Bank ({filteredQuestions.length})
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 w-44 focus:outline-none focus:border-orange-500"
                />
              </div>

              <select
                value={filterTech}
                onChange={(e) => setFilterTech(e.target.value)}
                className="py-1.5 px-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
              >
                <option value="all">All Tracks</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="dsa">DSA</option>
                <option value="sql">SQL</option>
                <option value="react">React</option>
                <option value="communication">Communication</option>
              </select>
            </div>
          </div>

          {/* Floating Selected Actions Bar */}
          {selectedBankIds.length > 0 && (
            <div className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-orange-900">
                <CheckSquare size={16} className="text-orange-600" />
                <span>{selectedBankIds.length} Question{selectedBankIds.length > 1 ? "s" : ""} Selected</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  const selectedQuestions = bankQuestions.filter((q) => selectedBankIds.includes(q.id));
                  openScheduleModal(selectedQuestions);
                }}
                className="btn btn-primary text-xs py-1.5 px-4 font-bold flex items-center gap-1.5 bg-orange-600 text-white shadow-sm"
              >
                <CalendarPlus size={14} />
                <span>Schedule AI Mock with Selected ({selectedBankIds.length})</span>
              </button>
            </div>
          )}

          {filteredQuestions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 space-y-2">
              <FileQuestion size={28} className="mx-auto text-slate-400" />
              <p className="m-0 font-medium">No questions matching your filter.</p>
              <p className="text-[11px] text-slate-400 m-0">Use the form above to paste or add questions.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    <th className="py-2.5 px-2 w-8">
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="text-slate-500 hover:text-orange-600"
                        title={selectedBankIds.length === filteredQuestions.length ? "Deselect all" : "Select all"}
                      >
                        {selectedBankIds.length === filteredQuestions.length && filteredQuestions.length > 0 ? (
                          <CheckSquare size={15} className="text-orange-600" />
                        ) : (
                          <Square size={15} />
                        )}
                      </button>
                    </th>
                    <th className="py-2.5 px-3">Track</th>
                    <th className="py-2.5 px-3">Topic</th>
                    <th className="py-2.5 px-3">Question</th>
                    <th className="py-2.5 px-3">Difficulty</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQuestions.map((q) => {
                    const isSelected = selectedBankIds.includes(q.id);
                    return (
                      <tr
                        key={q.id}
                        className={`hover:bg-slate-50/80 transition-colors ${isSelected ? "bg-orange-50/40" : ""}`}
                      >
                        <td className="py-3 px-2">
                          <button
                            type="button"
                            onClick={() => toggleSelectOne(q.id)}
                            className="text-slate-400 hover:text-orange-600"
                          >
                            {isSelected ? (
                              <CheckSquare size={15} className="text-orange-600" />
                            ) : (
                              <Square size={15} />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-3 font-bold text-orange-600 whitespace-nowrap">
                          {q.technology}
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-medium whitespace-nowrap">
                          {q.topic}
                        </td>
                        <td className="py-3 px-3 text-slate-800 leading-relaxed max-w-md">
                          {q.question}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                              q.difficulty === "advanced"
                                ? "bg-red-100 text-red-800"
                                : q.difficulty === "intermediate"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {q.difficulty}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openScheduleModal([q])}
                              className="btn btn-outline text-[11px] py-1 px-2.5 font-bold flex items-center gap-1 text-orange-600 hover:bg-orange-50 border-orange-200"
                              title="Schedule mock interview with this question"
                            >
                              <CalendarPlus size={13} />
                              <span>Schedule</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(q.id)}
                              className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              title="Delete question"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* DIRECT SCHEDULE MODAL */}
        {scheduleModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-orange-100 text-orange-600">
                    <CalendarPlus size={18} />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 m-0">
                      Schedule AI Mock Interview
                    </h3>
                    <p className="text-xs text-slate-500 m-0">
                      Assign turn-based voice interview with {questionsToSchedule.length} imported question{questionsToSchedule.length > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              {scheduledSuccessData ? (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={24} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-emerald-900 m-0">
                      Interview Scheduled Successfully!
                    </h4>
                    <p className="text-xs text-emerald-700 m-0">
                      Session ID: <strong className="font-mono">{scheduledSuccessData.id}</strong>
                    </p>
                    <p className="text-xs text-slate-600 pt-1">
                      Candidate will see this mock interview on their dashboard immediately.
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <Link
                      href="/student/interview/active"
                      className="btn btn-primary text-xs py-2 px-5 font-bold flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Play size={14} />
                      <span>Launch / Test Interview Room</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => setScheduleModalOpen(false)}
                      className="btn btn-outline text-xs py-2 px-4 font-bold"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleConfirmSchedule} className="space-y-4">
                  {/* Selected Questions Preview */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">
                      Questions to be Asked by AI Interviewer ({questionsToSchedule.length}):
                    </label>
                    <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 rounded-xl border border-slate-200 bg-slate-50 text-xs">
                      {questionsToSchedule.map((q, i) => (
                        <div key={q.id || i} className="p-2.5 flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-orange-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-slate-800 font-medium">{q.question}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Candidate Selection */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Select Target Candidate: <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedCandidateId}
                      onChange={(e) => setSelectedCandidateId(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-semibold text-slate-800"
                      required
                    >
                      {candidates.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.fullName} ({c.email}) {c.batchCode ? `• ${c.batchCode}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tech & Difficulty */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Track:</label>
                      <input
                        type="text"
                        value={scheduleTech}
                        onChange={(e) => setScheduleTech(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Difficulty:</label>
                      <select
                        value={scheduleDifficulty}
                        onChange={(e) => setScheduleDifficulty(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 font-semibold"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                  </div>

                  {/* Timing Option */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700 block">Availability Schedule:</label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setScheduleTimeMode("now")}
                        className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                          scheduleTimeMode === "now"
                            ? "bg-orange-50 border-orange-500 text-orange-900"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        ⚡ Ready Immediately
                        <span className="block text-[10px] font-normal text-slate-500">Student can start right now</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setScheduleTimeMode("custom")}
                        className={`p-2.5 rounded-xl border text-left font-bold transition-all ${
                          scheduleTimeMode === "custom"
                            ? "bg-orange-50 border-orange-500 text-orange-900"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        📅 Specific Date & Time
                        <span className="block text-[10px] font-normal text-slate-500">Set future countdown</span>
                      </button>
                    </div>

                    {scheduleTimeMode === "custom" && (
                      <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                        <input
                          type="date"
                          value={scheduleDate}
                          onChange={(e) => setScheduleDate(e.target.value)}
                          className="bg-slate-50 border border-slate-300 rounded-xl p-2 font-semibold"
                        />
                        <input
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                          className="bg-slate-50 border border-slate-300 rounded-xl p-2 font-semibold"
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setScheduleModalOpen(false)}
                      className="btn btn-outline text-xs py-2 px-4 font-bold"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isScheduling}
                      className="btn btn-primary text-xs py-2 px-5 font-bold flex items-center gap-1.5 bg-orange-600 text-white shadow-md disabled:opacity-50"
                    >
                      <CalendarPlus size={15} />
                      <span>{isScheduling ? "Scheduling..." : "Confirm & Schedule Mock"}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
