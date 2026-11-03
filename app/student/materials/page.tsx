"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import {
  FileQuestion,
  Download,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  Mic,
  BookOpen,
  CheckCircle2,
  Code,
  Layers,
} from "lucide-react";

interface QuestionItem {
  id: string;
  technology: string;
  topic: string;
  difficulty: string;
  question: string;
  expectedKeypoints: string[];
  idealAnswer: string;
  tags: string[];
}

const CATEGORIES = [
  "All",
  "Python",
  "Java",
  "JavaScript",
  "DSA",
  "OOP",
  "DBMS",
  "SQL",
  "Operating Systems",
  "Computer Networks",
  "System Design",
  "Web Development",
  "HR",
  "Communication",
];

export default function StudentQuestionBankPage() {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/interviews")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data && Array.isArray(data.data.questionBank)) {
          setQuestions(data.data.questionBank);
        }
      })
      .catch((err) => console.warn(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredQuestions = questions.filter((q) => {
    const matchesCategory =
      selectedCategory === "All" ||
      q.technology.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      q.tags.some((t) => t.toLowerCase().includes(selectedCategory.toLowerCase()));

    const matchesSearch =
      searchQuery.trim() === "" ||
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.technology.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const guides = [
    {
      title: "Python Memory & Concurrency Master Sheet",
      topic: "Python Internals",
      pages: "12 Pages",
      summary: "Comprehensive guide to CPython reference counting, generational cyclic GC, and GIL mechanics.",
    },
    {
      title: "Java Concurrency & ConcurrentHashMap Internals",
      topic: "Java Architecture",
      pages: "16 Pages",
      summary: "CAS lock-free operations, TreeBin collision resolutions, and deadlock diagnostics with jstack.",
    },
    {
      title: "Algorithmic Complexity & Top 50 DSA Patterns",
      topic: "DSA Placement Track",
      pages: "24 Pages",
      summary: "Kadane, two-pointer, sliding window, Dijkstra vs Bellman-Ford, and dynamic programming state transitions.",
    },
    {
      title: "The STAR Method for Technical & Behavioral Hiring",
      topic: "HR & Cultural Fit",
      pages: "8 Pages",
      summary: "How to frame technical hurdles, architectural trade-offs, and project leadership using structured STAR answers.",
    },
  ];

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <AppShell role="student">
        <div className="max-w-[1400px] mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E2E8F0] gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-700 uppercase tracking-wider">
                  TECHNICAL VIVA & QUESTION BANK
                </span>
                <span className="text-xs text-slate-400">• Curated Across 13 Engineering Disciplines</span>
              </div>
              <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight m-0">
                Question Bank & Technical Viva Cheatsheets
              </h1>
              <p className="text-sm text-slate-500 mt-1 m-0">
                Browse core engineering viva questions, expected key points, and architectural answers across Python, Java, DSA, DBMS, OS, and System Design.
              </p>
            </div>

            <Link
              href="/student/interview/setup"
              className="btn btn-primary text-xs py-2.5 px-5 font-bold flex items-center gap-2 self-start sm:self-auto shadow-md"
            >
              <Sparkles size={14} />
              <span>Launch Mock on These Topics</span>
            </Link>
          </div>

          {/* Quick Cheatsheets Section */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider m-0 flex items-center gap-2">
              <BookOpen size={16} className="text-orange-600" />
              <span>Downloadable Technical Viva Cheatsheets</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {guides.map((g, idx) => (
                <div key={idx} className="card p-4.5 bg-white border border-[#E2E8F0] rounded-2xl flex flex-col justify-between shadow-sm space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">
                        {g.topic}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">{g.pages}</span>
                    </div>
                    <h3 className="font-bold text-xs text-[#0F172A] leading-snug mb-1">{g.title}</h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed m-0">{g.summary}</p>
                  </div>
                  <button
                    onClick={() => alert(`Opening ${g.title}...`)}
                    className="btn btn-outline text-xs py-1.5 px-3 flex items-center justify-center gap-1.5 w-full"
                  >
                    <Download size={13} />
                    <span>Download PDF</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive Question Bank Browser */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-extrabold text-[#0F172A] m-0 flex items-center gap-2">
                  <FileQuestion size={18} className="text-orange-600" />
                  <span>Curated Technical Viva Roster ({filteredQuestions.length} Questions)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 m-0">
                  Review expected rubrics and ideal answers to benchmark your knowledge before mock rounds.
                </p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search size={14} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search questions or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                    selectedCategory === cat
                      ? "bg-slate-900 border-slate-900 text-white shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Question Cards List */}
            <div className="space-y-3">
              {filteredQuestions.length === 0 ? (
                <div className="p-10 rounded-2xl bg-white border border-[#E2E8F0] text-center text-slate-400 space-y-2">
                  <FileQuestion size={32} className="mx-auto text-slate-300" />
                  <p className="text-xs font-semibold text-slate-600 m-0">No questions found matching your filter.</p>
                </div>
              ) : (
                filteredQuestions.map((q) => {
                  const isExpanded = expandedId === q.id;
                  return (
                    <div
                      key={q.id}
                      className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-sm transition-all hover:border-orange-300 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-700 uppercase">
                              {q.technology}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {q.topic}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              q.difficulty === "advanced" ? "bg-red-50 text-red-700" : q.difficulty === "intermediate" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                            }`}>
                              {q.difficulty?.toUpperCase()}
                            </span>
                          </div>

                          <h3 className="text-sm sm:text-base font-bold text-[#0F172A] leading-snug m-0">
                            {q.question}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-start shrink-0">
                          <Link
                            href={`/student/interview/active?track=${encodeURIComponent(q.technology)}`}
                            className="btn btn-outline text-xs py-1.5 px-3 flex items-center gap-1 font-bold text-orange-600 hover:text-orange-700"
                          >
                            <Mic size={13} />
                            <span>Practice</span>
                          </Link>
                          <button
                            onClick={() => toggleExpand(q.id)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Keypoints & Ideal Answer */}
                      {isExpanded && (
                        <div className="pt-3 border-t border-slate-100 space-y-3 animate-fadeIn">
                          {q.expectedKeypoints && q.expectedKeypoints.length > 0 && (
                            <div>
                              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                                Expected Key Points Evaluated by AI:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {q.expectedKeypoints.map((kp, idx) => (
                                  <span
                                    key={idx}
                                    className="text-xs font-medium px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1"
                                  >
                                    <CheckCircle2 size={12} className="text-emerald-600" />
                                    <span>{kp}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {q.idealAnswer && (
                            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                                Ideal Architectural Answer Outline:
                              </span>
                              <p className="text-xs text-slate-700 leading-relaxed m-0 font-mono">
                                {q.idealAnswer}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
