"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import {
  Mic,
  Sparkles,
  MessageSquare,
  Award,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Bot,
  Send,
  HelpCircle,
  Lightbulb,
  FileText,
  RotateCcw,
} from "lucide-react";

interface CoachMessage {
  sender: "user" | "coach";
  text: string;
  category?: string;
  starTip?: { situation?: string; task?: string; action?: string; result?: string };
}

export default function StudentPracticePage() {
  const [activeTab, setActiveTab] = useState<"coach" | "tracks">("coach");
  const [userPrompt, setUserPrompt] = useState("");
  const [isThinking, setIsThinking] = useState(false);

  const [chatHistory, setChatHistory] = useState<CoachMessage[]>([
    {
      sender: "coach",
      text: "Hello! I am your AI Interview Coach. I'm here to help you structure STAR answers, clarify complex engineering viva concepts (like Python memory, Java concurrency, and System Design), or review your draft responses before your interview. How can I help you prepare today?",
    },
  ]);

  const QUICK_PROMPTS = [
    "How do I structure a STAR response for a critical production bug?",
    "Explain Python memory management & the GIL in an interview setting",
    "How should I answer 'What is your greatest technical weakness?'",
    "Explain ACID isolation levels with real database examples",
    "Give me an ideal 90-second elevator pitch template for a Junior Developer",
  ];

  const practiceTracks = [
    {
      id: "comm-intro",
      title: "Self Introduction & Elevator Pitch",
      category: "Communication",
      description: "Deliver a structured 90-second professional introduction highlighting your stack, projects, and goals.",
      durationMinutes: 10,
      trackId: "communication",
      persona: "Dr. Sarah Mitchell",
      color: "orange",
    },
    {
      id: "comm-hr",
      title: "Basic HR & Behavioral Questions",
      category: "HR",
      description: "Master standard HR inquiries on conflict management, team collaboration, leadership, and strengths.",
      durationMinutes: 15,
      trackId: "hr",
      persona: "Vikram Malhotra",
      color: "blue",
    },
    {
      id: "comm-fluency",
      title: "English Fluency & Verbal Articulation",
      category: "Fluency",
      description: "Develop crisp verbal cadence, reduced filler words, and professional engineering vocabulary.",
      durationMinutes: 12,
      trackId: "communication",
      persona: "Alex Vance",
      color: "emerald",
    },
    {
      id: "comm-workplace",
      title: "Workplace Situational Handling",
      category: "Behavioral",
      description: "Demonstrate ownership under pressure, cross-functional communication, and stakeholder diplomacy.",
      durationMinutes: 15,
      trackId: "communication",
      persona: "Dr. Sarah Mitchell",
      color: "purple",
    },
    {
      id: "comm-confidence",
      title: "Speaking Confidence & Executive Presence",
      category: "Leadership",
      description: "Refine vocal tone, eye contact pacing, and persuasive technical storytelling for hiring rounds.",
      durationMinutes: 10,
      trackId: "communication",
      persona: "Vikram Malhotra",
      color: "amber",
    },
  ];

  const handleSendPrompt = async (textToSend?: string) => {
    const promptText = (textToSend || userPrompt).trim();
    if (!promptText) return;

    setUserPrompt("");
    const newHistory: CoachMessage[] = [...chatHistory, { sender: "user", text: promptText }];
    setChatHistory(newHistory);
    setIsThinking(true);

    try {
      // Generate intelligent coaching response using prompt matching or AI endpoint
      let coachReply = "";
      const lower = promptText.toLowerCase();

      if (lower.includes("star") || lower.includes("bug") || lower.includes("production")) {
        coachReply = `Here is how to frame a STAR response for a critical production incident:

• Situation: Set context in 15 seconds. "During our peak holiday deployment last quarter, our payment gateway service experienced an intermittent 502 timeout spike affecting 8% of transactions."
• Task: Define your exact responsibility. "As the on-call backend engineer, my objective was to stabilize the checkout flow without data corruption and identify the root bottleneck."
• Action: Detail your technical decision-making. "I immediately enabled read-replica failovers, inspected latency graphs in Datadog, isolated a connection leak in our PostgreSQL pool, and deployed a targeted patch with adjusted idle connection timeouts."
• Result: Quantify the outcome. "Service stabilized within 14 minutes with zero lost transactions. I followed up by authoring a blameless post-mortem and adding automated connection pool alarms."`;
      } else if (lower.includes("gil") || lower.includes("python memory") || lower.includes("garbage")) {
        coachReply = `When explaining Python Memory & GIL to an interviewer:

1. Primary Mechanism: Explain that CPython relies on Reference Counting (PyObject.ob_refcnt). When reference count drops to 0, memory is deallocated immediately.
2. Cyclic GC: Acknowledge that reference cycles (A -> B -> A) cannot be freed by reference counting alone, so Python incorporates a generational garbage collector (Generations 0, 1, 2) utilizing doubly-linked lists.
3. The GIL: Clarify WHY the GIL exists: CPython's memory management is not thread-safe. The GIL is a mutual exclusion lock preventing multiple native threads from executing Python bytecodes simultaneously.
4. Solutions: Emphasize that for CPU-bound tasks, we use multiprocessing or native C extensions; for I/O-bound tasks, asyncio or threading is optimal.`;
      } else if (lower.includes("weakness")) {
        coachReply = `Key rule for 'What is your greatest weakness?': Choose a genuine professional or technical area you are actively remediating with measurable steps.

• Recommended structure:
"Early on, I tended to over-engineer solutions, adding premature abstractions before requirements stabilized. I learned that simplicity and shipping working code are paramount. Now, I enforce a strict MVP-first principle: I write the cleanest direct solution first, add comprehensive unit tests, and only refactor into design patterns when actual scaling requirements demand it."`;
      } else if (lower.includes("acid") || lower.includes("isolation")) {
        coachReply = `ACID Isolation Levels Breakdown for Technical Rounds:

1. Read Uncommitted: Transactions can see dirty uncommitted writes. Lowest isolation.
2. Read Committed: Prevents dirty reads. A query only sees rows committed before it ran. (Default in PostgreSQL).
3. Repeatable Read: Prevents non-repeatable reads. If query A reads row X, re-reading row X in the same transaction will yield the identical value even if transaction B committed an update.
4. Serializable: Strictest level. Prevents phantom rows by serializing execution order via predicate locks or SSI.`;
      } else {
        coachReply = `Great interview preparation topic! Here are 3 tactical tips for framing this in an interview:

1. Start with the 'Bottom Line Up Front' (BLUF): State your core answer in 1 concise sentence before diving into supporting details.
2. Structure with Numbers: Interviewers remember structured thoughts (e.g. "There are three key architectural trade-offs: latency, consistency, and maintenance cost...").
3. Relate to Real Experience: Conclude by citing a project where you applied this principle and the measurable outcome achieved.`;
      }

      setChatHistory([...newHistory, { sender: "coach", text: coachReply }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <AppShell role="student">
        <div className="max-w-[1280px] mx-auto space-y-6">
          {/* Header */}
          <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-700 uppercase tracking-wider">
                  AI INTERVIEW COACH & PRACTICE
                </span>
                <span className="text-xs text-slate-400">• On-Demand Preparation</span>
              </div>
              <h1 className="text-2xl font-extrabold text-[#0F172A] m-0">
                AI Interview Coach & Communication Lab
              </h1>
              <p className="text-xs text-slate-500 m-0">
                Master STAR responses, refine engineering viva definitions, and practice vocal confidence with our AI coaching system.
              </p>
            </div>

            {/* Tab Toggles */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200">
              <button
                onClick={() => setActiveTab("coach")}
                className={`text-xs font-bold py-1.5 px-3.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === "coach"
                    ? "bg-white text-orange-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Bot size={14} />
                <span>AI Coach</span>
              </button>
              <button
                onClick={() => setActiveTab("tracks")}
                className={`text-xs font-bold py-1.5 px-3.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === "tracks"
                    ? "bg-white text-orange-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Mic size={14} />
                <span>Voice Practice Tracks</span>
              </button>
            </div>
          </div>

          {activeTab === "coach" ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Interactive Coach Chat */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col h-[600px] overflow-hidden">
                {/* Chat Top Banner */}
                <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                      <Bot size={18} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-800 m-0">AI Senior Interview Coach</h3>
                      <p className="text-[10px] text-emerald-600 font-semibold m-0 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Online • Specializing in Technical Viva & Behavioral STAR
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      setChatHistory([
                        {
                          sender: "coach",
                          text: "Conversation cleared. What interview topic, question, or draft answer would you like to review?",
                        },
                      ])
                    }
                    className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 flex items-center gap-1"
                  >
                    <RotateCcw size={12} />
                    <span>Reset</span>
                  </button>
                </div>

                {/* Messages Feed */}
                <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50">
                  {chatHistory.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.sender === "coach" && (
                        <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                          <Bot size={15} />
                        </div>
                      )}
                      <div
                        className={`p-4 rounded-2xl max-w-xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                          msg.sender === "user"
                            ? "bg-slate-900 text-white rounded-tr-none shadow-sm"
                            : "bg-white text-slate-800 border border-slate-200 rounded-tl-none shadow-sm"
                        }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}

                  {isThinking && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        <Bot size={15} />
                      </div>
                      <div className="p-3.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-500 rounded-tl-none flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
                        <span>AI Coach is structuring feedback...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-slate-100 bg-white space-y-2">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendPrompt();
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      placeholder="Ask the coach about any interview concept, question, or paste your answer..."
                      value={userPrompt}
                      onChange={(e) => setUserPrompt(e.target.value)}
                      className="flex-1 text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <button
                      type="submit"
                      disabled={!userPrompt.trim() || isThinking}
                      className="btn btn-primary text-xs py-2 px-4 font-bold flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <span>Ask Coach</span>
                      <Send size={13} />
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Col: Quick Prompts & STAR Framework Guide */}
              <div className="space-y-5">
                <div className="card p-5 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="text-orange-500" size={17} />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider m-0">
                      Suggested Coaching Prompts
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {QUICK_PROMPTS.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendPrompt(q)}
                        className="w-full text-left text-xs p-2.5 rounded-xl border border-slate-100 bg-slate-50 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-900 transition-all font-medium text-slate-700"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="card p-5 bg-gradient-to-br from-slate-900 to-[#0F172A] text-white border border-slate-800 rounded-2xl shadow-sm space-y-3">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-orange-500 text-white uppercase tracking-wider">
                    STAR FORMULA
                  </span>
                  <h4 className="text-sm font-bold text-white m-0">
                    The Gold Standard for Behavioral Rounds
                  </h4>
                  <ul className="text-xs text-slate-300 space-y-2 p-0 list-none m-0">
                    <li><strong className="text-orange-400">S</strong>ituation: Set the challenge context in 1-2 sentences.</li>
                    <li><strong className="text-orange-400">T</strong>ask: Explain your explicit responsibility.</li>
                    <li><strong className="text-orange-400">A</strong>ction: Detail your technical and team choices.</li>
                    <li><strong className="text-orange-400">R</strong>esult: Quantify the business or system metric achieved.</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            /* Voice Practice Tracks */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {practiceTracks.map((item) => (
                <div
                  key={item.id}
                  className="card p-5 bg-white border border-[#E2E8F0] hover:border-orange-300 hover:shadow-md transition-all rounded-2xl flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-700 uppercase tracking-wider">
                        {item.category}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {item.durationMinutes} mins
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-[#0F172A] m-0">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-500 leading-relaxed m-0">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-400">
                      Interviewer: {item.persona}
                    </span>

                    <Link
                      href={`/student/interview/active?track=${encodeURIComponent(item.trackId)}`}
                      className="btn btn-primary text-xs py-2 px-3.5 font-bold flex items-center gap-1.5"
                    >
                      <Mic size={13} />
                      <span>Start Practice</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
