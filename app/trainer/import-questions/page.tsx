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
} from "lucide-react";
import { QuestionBankItem } from "@/lib/interviewStore";

export default function TrainerImportQuestionsPage() {
  const router = useRouter();

  // Active tab: 'single' | 'bulk' | 'paste'
  const [activeTab, setActiveTab] = useState<"single" | "bulk" | "paste">("single");

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
  const [parsedPreview, setParsedPreview] = useState<Partial<QuestionBankItem>[]>([]);

  // Bank List & Filter State
  const [bankQuestions, setBankQuestions] = useState<QuestionBankItem[]>([]);
  const [filterTech, setFilterTech] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  useEffect(() => {
    loadQuestions();
  }, []);

  // 1. Submit Single Question
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;

    setStatusMsg(null);
    try {
      const keypointsArray = keypoints
        .split(/[,;\n]/)
        .map((k) => k.trim())
        .filter(Boolean);

      const res = await fetch("/api/trainer/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          technology: tech,
          topic: topic.trim() || `${tech} Core Concepts`,
          difficulty,
          question: questionText.trim(),
          expectedKeypoints: keypointsArray,
          idealAnswer: idealAnswer.trim(),
          tags: [tech, topic || "General", "TrainerImport"],
        }),
      });

      const json = await res.json();
      if (json.success) {
        setStatusMsg({ type: "success", text: "Question successfully added to question bank!" });
        setQuestionText("");
        setTopic("");
        setKeypoints("");
        setIdealAnswer("");
        loadQuestions();
      } else {
        setStatusMsg({ type: "error", text: json.error || "Failed to add question" });
      }
    } catch {
      setStatusMsg({ type: "error", text: "Network error occurred while saving question" });
    }
  };

  // 2. Parse & Ingest JSON or CSV Bulk Data
  const handleBulkParse = (text: string) => {
    setBulkInput(text);
    setStatusMsg(null);
    if (!text.trim()) {
      setParsedPreview([]);
      return;
    }

    try {
      // Try JSON first
      if (text.trim().startsWith("[") || text.trim().startsWith("{")) {
        const parsed = JSON.parse(text);
        const list = Array.isArray(parsed) ? parsed : [parsed];
        setParsedPreview(
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

      // Try CSV format (technology,topic,difficulty,question)
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
      setParsedPreview(csvItems);
    } catch (err: any) {
      setStatusMsg({ type: "error", text: "Invalid JSON or CSV format: " + err.message });
      setParsedPreview([]);
    }
  };

  const handleBulkSubmit = async () => {
    if (parsedPreview.length === 0) return;
    setStatusMsg(null);

    try {
      const res = await fetch("/api/trainer/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: parsedPreview }),
      });

      const json = await res.json();
      if (json.success) {
        setStatusMsg({ type: "success", text: json.message });
        setBulkInput("");
        setParsedPreview([]);
        loadQuestions();
      } else {
        setStatusMsg({ type: "error", text: json.error || "Bulk import failed" });
      }
    } catch {
      setStatusMsg({ type: "error", text: "Failed to submit bulk questions" });
    }
  };

  // 3. Quick Text Paste Parser (Numbered lines e.g. "1. Question... \n 2. Question...")
  const handleParseRawText = () => {
    if (!rawTextPaste.trim()) return;
    const lines = rawTextPaste
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const questions: Partial<QuestionBankItem>[] = [];
    lines.forEach((line) => {
      // Strip leading numbering "1.", "Q1:", etc.
      const cleaned = line.replace(/^(\d+[\.\:\)]|\w\d+[\.\:\)]|q\d+[\.\:\)])\s*/i, "").trim();
      if (cleaned.length > 10) {
        questions.push({
          technology: tech,
          topic: topic.trim() || `${tech} Concepts`,
          difficulty,
          question: cleaned,
          expectedKeypoints: [],
          tags: [tech, "PastedList"],
        });
      }
    });

    setParsedPreview(questions);
    setActiveTab("bulk");
    setBulkInput(JSON.stringify(questions, null, 2));
  };

  // Delete Question
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this question from the bank?")) return;
    try {
      const res = await fetch(`/api/trainer/questions?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setBankQuestions((prev) => prev.filter((q) => q.id !== id));
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

  // Sample JSON Template Loader
  const loadSampleJson = () => {
    const sample = [
      {
        technology: "Python",
        topic: "Memory & GIL",
        difficulty: "intermediate",
        question: "Explain how Python manages memory using reference counting and the cyclic GC.",
        expectedKeypoints: ["ob_refcnt", "generational garbage collector", "cyclic references"],
        idealAnswer: "Python uses reference counting as primary mechanism. A cyclic GC handles circular references.",
      },
      {
        technology: "Python",
        topic: "Asyncio",
        difficulty: "advanced",
        question: "How does the asyncio event loop coordinate coroutines without operating system thread context switches?",
        expectedKeypoints: ["single thread cooperative multitasking", "epoll/kqueue", "generators under the hood"],
        idealAnswer: "Asyncio uses cooperative multitasking where tasks yield control explicitly via await keywords.",
      },
    ];
    handleBulkParse(JSON.stringify(sample, null, 2));
  };

  return (
    <AppShell role="trainer" userName="Rahul Sir (Lead Faculty)" userEmail="rahul.sir@linktest.io">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F0] gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                TRAINER STUDIO
              </span>
              <span className="text-xs text-slate-500">• Question Management & Ingestion</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight m-0">
              Import & Manage Mock Interview Questions
            </h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Create, paste, or bulk-import custom interview questions to test students on exact institutional curriculums.
            </p>
          </div>

          <Link
            href="/trainer/schedule"
            className="btn btn-primary text-xs py-2 px-4 font-bold flex items-center gap-1.5 shadow-sm"
          >
            <CalendarPlus size={14} />
            <span>Schedule Interview with Bank</span>
          </Link>
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

        {/* Ingestion Methods Tabs */}
        <div className="card p-6 bg-white border border-[#E2E8F0] shadow-sm rounded-2xl space-y-5">
          <div className="flex border-b border-slate-200 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("single")}
              className={`pb-3 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === "single"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Plus size={14} />
              <span>Manual Entry Form</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("bulk")}
              className={`pb-3 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === "bulk"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <UploadCloud size={14} />
              <span>Bulk CSV / JSON Ingestion</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("paste")}
              className={`pb-3 px-3 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === "paste"
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <FileText size={14} />
              <span>Paste Question Paper / Syllabus</span>
            </button>
          </div>

          {/* TAB 1: Single Question Manual Form */}
          {activeTab === "single" && (
            <form onSubmit={handleSingleSubmit} className="space-y-4">
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

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="btn btn-primary text-xs py-2 px-5 font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Plus size={14} />
                  <span>Add Question to Bank</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Bulk CSV / JSON Ingestion */}
          {activeTab === "bulk" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Paste JSON array or CSV data below, or load a sample template:</span>
                <button
                  type="button"
                  onClick={loadSampleJson}
                  className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
                >
                  <Sparkles size={12} />
                  <span>Load Sample JSON Template</span>
                </button>
              </div>

              <textarea
                rows={7}
                placeholder={`Paste JSON array of questions:\n[\n  {\n    "technology": "Java",\n    "topic": "Concurrency",\n    "difficulty": "intermediate",\n    "question": "Explain ConcurrentHashMap mechanics in Java 8."\n  }\n]`}
                value={bulkInput}
                onChange={(e) => handleBulkParse(e.target.value)}
                className="w-full font-mono bg-slate-900 text-emerald-400 p-3 rounded-xl border border-slate-800 text-xs focus:outline-none"
              />

              {parsedPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">
                      Validated Questions Preview ({parsedPreview.length} items ready to import):
                    </span>
                    <button
                      type="button"
                      onClick={handleBulkSubmit}
                      className="btn btn-primary text-xs py-1.5 px-4 font-bold flex items-center gap-1"
                    >
                      <UploadCloud size={14} />
                      <span>Import {parsedPreview.length} Questions</span>
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y text-xs">
                    {parsedPreview.map((item, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between gap-3 bg-slate-50">
                        <div className="flex-1 truncate">
                          <span className="font-bold text-orange-600 mr-2">[{item.technology}]</span>
                          <span className="text-slate-800">{item.question}</span>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 capitalize">
                          {item.difficulty}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Paste Question Paper / Syllabus */}
          {activeTab === "paste" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Target Technology:</label>
                  <select
                    value={tech}
                    onChange={(e) => setTech(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-semibold"
                  >
                    <option value="Python">Python</option>
                    <option value="Java">Java</option>
                    <option value="DSA">DSA</option>
                    <option value="SQL">SQL</option>
                    <option value="React">React</option>
                    <option value="FullStack">Full Stack</option>
                    <option value="Communication">Communication</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Difficulty:</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-semibold"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Paste Raw Questions (one per line or numbered list):
                </label>
                <textarea
                  rows={6}
                  placeholder={`1. Explain how memory indexing works in PostgreSQL.\n2. How do decorators work under the hood in Python?\n3. What is the difference between shallow and deep copy?`}
                  value={rawTextPaste}
                  onChange={(e) => setRawTextPaste(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleParseRawText}
                  className="btn btn-primary text-xs py-2 px-5 font-bold flex items-center gap-1.5"
                >
                  <Sparkles size={14} />
                  <span>Parse & Preview Questions</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CURRENT QUESTION BANK TABLE */}
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
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800 w-48 focus:outline-none focus:border-orange-500"
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

          {filteredQuestions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 space-y-2">
              <FileQuestion size={28} className="mx-auto text-slate-400" />
              <p className="m-0 font-medium">No questions matching your filter.</p>
              <p className="text-[11px] text-slate-400 m-0">Use the form above to add custom questions.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                    <th className="py-2.5 px-3">Track</th>
                    <th className="py-2.5 px-3">Topic</th>
                    <th className="py-2.5 px-3">Question</th>
                    <th className="py-2.5 px-3">Difficulty</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredQuestions.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
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
                        <button
                          type="button"
                          onClick={() => handleDelete(q.id)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete question"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
