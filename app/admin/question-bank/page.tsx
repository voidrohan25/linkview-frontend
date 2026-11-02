"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  FileQuestion,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Tag,
  BookOpen,
  ChevronDown,
  X,
} from "lucide-react";

interface QuestionItem {
  id: string;
  technology: string;
  topic: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  question: string;
  expectedKeypoints: string[];
  idealAnswer: string;
  tags: string[];
}

export default function AdminQuestionBankPage() {
  const [techFilter, setTechFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>("qb-01");

  const [questions, setQuestions] = useState<QuestionItem[]>([
    {
      id: "qb-01",
      technology: "Java",
      topic: "JVM & Memory Management",
      difficulty: "advanced",
      question: "How does the Java Garbage Collector differentiate between unreachable objects and softly reachable objects?",
      expectedKeypoints: ["WeakReference vs SoftReference", "JVM heap pressure thresholds", "G1 / ZGC collection cycles"],
      idealAnswer: "Softly reachable objects are collected only when the JVM genuinely needs memory before throwing OutOfMemoryError, making them ideal for memory-sensitive caches. Weakly reachable objects are collected eagerly during normal minor/major GC cycles as soon as strong references are lost.",
      tags: ["Java", "JVM", "Garbage Collection", "Memory"],
    },
    {
      id: "qb-02",
      technology: "Java",
      topic: "Concurrency",
      difficulty: "intermediate",
      question: "Can you explain the internal working of ConcurrentHashMap in Java 8 compared to earlier versions?",
      expectedKeypoints: ["Segment locks in Java 7", "CAS + synchronized on node heads in Java 8", "TreeBin conversion on collision"],
      idealAnswer: "In Java 7, ConcurrentHashMap used Segment Locking (16 segments by default). In Java 8, segment locks were replaced by lock-free Compare-And-Swap (CAS) for bucket insertion and fine-grained synchronized blocks locking only the head node of a hash bucket, converting linked chains to red-black TreeBins when bucket size exceeds 8.",
      tags: ["Java", "Concurrency", "Hash Table"],
    },
    {
      id: "qb-03",
      technology: "Python",
      topic: "Internals & GIL",
      difficulty: "intermediate",
      question: "Explain how Python manages memory using the Global Interpreter Lock (GIL) and reference counting.",
      expectedKeypoints: ["Reference counting primary mechanism", "Cyclic GC (generational) for reference cycles", "GIL prevents race conditions on ob_refcnt"],
      idealAnswer: "CPython relies primarily on reference counting where every PyObject tracks its reference count. A generational garbage collector handles cyclic references. The GIL exists because CPython memory allocation and reference count manipulation are not thread-safe without mutexes, enforcing single-threaded bytecode execution.",
      tags: ["Python", "Memory", "GIL", "Internals"],
    },
    {
      id: "qb-04",
      technology: "Python",
      topic: "Generators & Iterators",
      difficulty: "beginner",
      question: "What are generators in Python and how do they optimize memory when processing large datasets?",
      expectedKeypoints: ["yield keyword", "Lazy evaluation / on-demand computation", "O(1) memory footprint vs list O(n)"],
      idealAnswer: "Generators are functions that yield values one at a time instead of returning a complete collection into memory. By maintaining stack execution state across yields, they consume O(1) memory regardless of whether streaming a thousand or a billion records.",
      tags: ["Python", "Generators", "Performance"],
    },
    {
      id: "qb-05",
      technology: "DSA",
      topic: "Arrays & Dynamic Programming",
      difficulty: "intermediate",
      question: "Given an array of integers, how would you find the subarray with the largest sum in O(n) time?",
      expectedKeypoints: ["Kadane algorithm", "max_ending_here and max_so_far", "Negative numbers edge case handling"],
      idealAnswer: "We use Kadane algorithm. We maintain two running accumulators: max_ending_here and max_so_far. At each element x, max_ending_here = max(x, max_ending_here + x), and max_so_far = max(max_so_far, max_ending_here), running in linear O(n) time and O(1) auxiliary space.",
      tags: ["DSA", "Arrays", "Kadane", "Dynamic Programming"],
    },
    {
      id: "qb-06",
      technology: "HR",
      topic: "Behavioral & Leadership",
      difficulty: "beginner",
      question: "Tell me about a challenging technical hurdle you encountered in a team project and how you resolved it.",
      expectedKeypoints: ["STAR format (Situation, Task, Action, Result)", "Clear technical decision making", "Team communication"],
      idealAnswer: "Use the STAR format: Describe the exact technical challenge (e.g. database query lockups during peak traffic), specify your ownership role, break down the systematic diagnostics and code changes you delivered, and quantify the resulting performance boost or latency reduction.",
      tags: ["HR", "Behavioral", "Culture Fit"],
    },
  ]);

  const [newQ, setNewQ] = useState({
    technology: "Python",
    topic: "",
    difficulty: "intermediate" as "beginner" | "intermediate" | "advanced",
    question: "",
    idealAnswer: "",
  });

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQ.question || !newQ.topic) return;

    const item: QuestionItem = {
      id: `qb-${Date.now().toString().slice(-4)}`,
      technology: newQ.technology,
      topic: newQ.topic,
      difficulty: newQ.difficulty,
      question: newQ.question,
      expectedKeypoints: ["Key conceptual clarity", "Edge-case handling"],
      idealAnswer: newQ.idealAnswer || "Thorough, structured technical explanation.",
      tags: [newQ.technology, newQ.topic],
    };

    setQuestions([item, ...questions]);
    setModalOpen(false);
    setNewQ({
      technology: "Python",
      topic: "",
      difficulty: "intermediate",
      question: "",
      idealAnswer: "",
    });
  };

  const filtered = questions.filter((q) => {
    const matchesSearch =
      q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTech = techFilter === "all" || q.technology.toLowerCase() === techFilter.toLowerCase();
    return matchesSearch && matchesTech;
  });

  return (
    <AppShell role="admin" userName="Rahul Sir (Founder & Admin)" userEmail="rahul.sir@linktest.io">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E2E8F0] gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                CURRICULUM REPOSITORY
              </span>
              <span className="text-xs text-[#64748B]">• Technical & HR Question Bank</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Institute Question Bank
            </h1>
            <p className="text-sm text-[#475569] mt-0.5">
              Curated repository of interview questions, expected technical keypoints, and benchmark answer guidelines.
            </p>
          </div>

          <button onClick={() => setModalOpen(true)} className="btn btn-primary self-start sm:self-auto">
            <Plus size={16} />
            <span>Add Question</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="card p-4 bg-white border border-[#E2E8F0] flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search question, concept, or topic..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Filter size={15} className="text-slate-400" />
            <select
              value={techFilter}
              onChange={(e) => setTechFilter(e.target.value)}
              className="form-select text-xs py-2 px-3"
            >
              <option value="all">All Tracks</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="dsa">DSA</option>
              <option value="hr">HR & Behavioral</option>
            </select>
          </div>
        </div>

        {/* Question List */}
        <div className="space-y-3">
          {filtered.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className="card p-5 bg-white border border-[#E2E8F0] transition-all"
              >
                <div
                  className="flex items-start justify-between gap-4 cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : item.id)}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {item.technology}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {item.topic}
                      </span>
                      <span className="text-[11px] font-medium capitalize px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        {item.difficulty}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#0F172A] leading-snug">
                      {item.question}
                    </h3>
                  </div>

                  <button
                    className="p-1 rounded text-slate-400 hover:text-slate-600 transition-transform"
                    style={{ transform: isExpanded ? "rotate(180deg)" : "none" }}
                  >
                    <ChevronDown size={18} />
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-[#E2E8F0] space-y-3 text-xs">
                    <div>
                      <span className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                        Expected Keypoints to Evaluate:
                      </span>
                      <ul className="list-disc pl-5 space-y-1 text-slate-600">
                        {item.expectedKeypoints.map((kp, idx) => (
                          <li key={idx}>{kp}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-[#F8FAFC] p-3 rounded-lg border border-[#E2E8F0]">
                      <span className="font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                        Benchmark / Ideal Answer:
                      </span>
                      <p className="text-slate-700 leading-relaxed m-0">{item.idealAnswer}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Question Modal */}
        {modalOpen && (
          <div className="modal-overlay" onClick={() => setModalOpen(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
                <h3 className="text-lg font-bold text-[#0F172A] m-0">Add Question to Bank</h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddQuestion} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-group">
                    <label className="form-label">Technology *</label>
                    <select
                      value={newQ.technology}
                      onChange={(e) => setNewQ({ ...newQ, technology: e.target.value })}
                      className="form-select"
                    >
                      <option value="Python">Python</option>
                      <option value="Java">Java</option>
                      <option value="DSA">DSA</option>
                      <option value="React">React</option>
                      <option value="SQL">SQL</option>
                      <option value="HR">HR & Behavioral</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Difficulty *</label>
                    <select
                      value={newQ.difficulty}
                      onChange={(e) => setNewQ({ ...newQ, difficulty: e.target.value as any })}
                      className="form-select"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Topic / Concept *</label>
                  <input
                    type="text"
                    required
                    value={newQ.topic}
                    onChange={(e) => setNewQ({ ...newQ, topic: e.target.value })}
                    placeholder="e.g. Asynchronous I/O & Event Loop"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Interview Question *</label>
                  <textarea
                    rows={3}
                    required
                    value={newQ.question}
                    onChange={(e) => setNewQ({ ...newQ, question: e.target.value })}
                    placeholder="Enter the complete question prompt..."
                    className="form-textarea"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Benchmark Ideal Answer</label>
                  <textarea
                    rows={3}
                    value={newQ.idealAnswer}
                    onChange={(e) => setNewQ({ ...newQ, idealAnswer: e.target.value })}
                    placeholder="Key concepts, complexity, and criteria the AI should evaluate..."
                    className="form-textarea"
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
                    Save to Question Bank
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
