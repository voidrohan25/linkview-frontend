"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/authContext";
import {
  Sparkles,
  Mic,
  Brain,
  Award,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Code,
  Layers,
  FileText,
  BarChart3,
  Bot,
  Zap,
  Star,
  Users,
} from "lucide-react";

export default function RootHomePage() {
  const { user, status } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (idx: number) => {
    setOpenFaq((prev) => (prev === idx ? null : idx));
  };

  const FAQS = [
    {
      q: "How does the AI Mock Interview evaluation work?",
      a: "Our AI panel analyzes your spoken and written responses against authoritative production software engineering rubrics. It evaluates four core dimensions: Technical Accuracy, Conceptual Understanding, Verbal/Written Communication, and Problem Solving, highlighting specific strengths and missed concepts.",
    },
    {
      q: "Can I answer using both Voice and Text?",
      a: "Yes! You can conduct realistic voice simulations using your microphone and our AI avatar persona (with live speech-to-text transcription), or switch to the distraction-free text editor to write out code solutions and technical explanations.",
    },
    {
      q: "What technical categories and programming languages are covered?",
      a: "We support comprehensive technical viva preparation across 13 core disciplines, including Python internals & GIL, Java JVM & Concurrency, JavaScript Event Loop & Closures, Data Structures & Algorithms, Object-Oriented Design (SOLID), SQL & DBMS transaction isolation, Operating Systems, Computer Networks, System Design, and Behavioral STAR interviews.",
    },
    {
      q: "Is my mock interview performance report shareable?",
      a: "Yes. Every completed interview produces a verified Diagnostic Scorecard detailing overall readiness score, turn-by-turn answer reviews, rubric factor scores, and a printer-friendly PDF report you can use to track your interview readiness.",
    },
    {
      q: "Is it suitable for entry-level candidates and college placements?",
      a: "Absolutely. You can calibrate the difficulty between Beginner (Core Foundations), Medium (Placement / Standard Mid-Level), Hard (Senior / Systems), and Adaptive.",
    },
  ];

  const CATEGORIES = [
    { title: "Python Internals & Viva", desc: "CPython memory model, reference counting, generational GC, and the Global Interpreter Lock (GIL).", icon: "🐍", color: "orange" },
    { title: "Java Enterprise Architecture", desc: "JVM memory regions, garbage collectors (G1/ZGC), ConcurrentHashMap CAS locking, and multithreading.", icon: "☕", color: "blue" },
    { title: "JavaScript & Full-Stack", desc: "Event loop, microtasks vs macrotasks, lexical closures, prototypes, and React Server Components.", icon: "⚡", color: "amber" },
    { title: "Data Structures & Algorithms", desc: "Kadane algorithm, binary search, tree & graph traversals, and dynamic programming patterns.", icon: "🌲", color: "emerald" },
    { title: "System Design & Scalability", desc: "Distributed rate limiters, horizontal scaling, caching strategies, CAP theorem, and event-driven architecture.", icon: "🏗️", color: "purple" },
    { title: "SQL & Transaction Isolation", desc: "ACID guarantees, dirty vs phantom reads, B-Tree disk I/O, and clustered vs non-clustered indexing.", icon: "🗄️", color: "indigo" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      {/* 1. TOP NAVIGATION */}
      <header className="h-16 bg-[#0F172A] border-b border-[#1E293B] sticky top-0 z-50 px-4 sm:px-8 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-[#EA580C] to-[#F97316] flex items-center justify-center font-extrabold text-white text-base shadow-md">
              L
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-white leading-none">
                Link<span className="text-[#F97316]">Test</span>
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                AI MOCK INTERVIEW
              </span>
            </div>
          </Link>

          <span className="hidden md:inline-flex text-[11px] font-bold px-2.5 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/30">
            ENGINE v2.6 ONLINE
          </span>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-300">
          <a href="#features" className="hover:text-white transition-colors">Platform Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
          <a href="#categories" className="hover:text-white transition-colors">Interview Categories</a>
          <a href="#sample-report" className="hover:text-white transition-colors">Sample Scorecard</a>
          <a href="#faqs" className="hover:text-white transition-colors">FAQs</a>
        </nav>

        {/* Right CTA */}
        <div className="flex items-center gap-3">
          {status === "READY" && user && (user.role !== "admin" || (typeof window !== "undefined" && sessionStorage.getItem("linktest_admin_token") === "linktest_admin_valid_token_2026")) ? (
            <Link
              href={user.role === "admin" ? "/admin/dashboard" : user.role === "trainer" ? "/trainer/dashboard" : "/student/dashboard"}
              className="btn btn-primary text-xs py-2 px-4 font-bold flex items-center gap-1.5 shadow-md"
            >
              <span>Go to {user.role === "admin" ? "Admin Console" : user.role === "trainer" ? "Evaluator Studio" : "Candidate Dashboard"}</span>
              <ArrowRight size={13} />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="btn btn-primary text-xs py-2 px-4 font-bold flex items-center gap-1.5 shadow-md"
              >
                <Sparkles size={13} />
                <span>Start Mock Free</span>
              </Link>
            </>
          )}
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white py-16 sm:py-24 px-4 sm:px-8">
        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-bold uppercase tracking-wider animate-fadeIn">
            <Sparkles size={14} className="text-orange-400" />
            <span>AI-Powered Job Interview Simulation & Feedback</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Master Technical Job Interviews with <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500">Realistic AI Practice</span>
          </h1>

          <p className="text-sm sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Practice real engineering viva rounds, coding architecture, and behavioral STAR questions with interactive AI hiring panels. Receive instant rubric evaluations, pinpoint weaknesses, and eliminate interview anxiety before real hiring rounds.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            <Link
              href={user ? "/student/interview/setup" : "/login"}
              className="btn btn-primary text-sm sm:text-base py-3.5 px-8 font-bold flex items-center justify-center gap-2 shadow-xl shadow-orange-500/30 w-full sm:w-auto"
            >
              <Mic size={18} />
              <span>Start Free Mock Interview</span>
              <ArrowRight size={18} />
            </Link>

            <a
              href="#features"
              className="btn btn-outline text-sm sm:text-base py-3.5 px-6 font-bold text-white border-slate-600 hover:bg-white/10 w-full sm:w-auto flex items-center justify-center gap-2"
            >
              <span>Explore Platform Features</span>
            </a>
          </div>

          {/* Key Value Badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-slate-300 font-semibold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>Voice & Text Simulation</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>13 Engineering Disciplines</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>Verified Rubric Scorecards</span>
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span>Zero Placement Fee</span>
            </span>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS (3 Simple Steps) */}
      <section id="how-it-works" className="py-16 sm:py-20 px-4 sm:px-8 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-bold text-orange-600 uppercase tracking-wider block">
            THE CANDIDATE WORKFLOW
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            How AI Mock Interview Prepares You
          </h2>
          <p className="text-sm text-slate-500">
            A continuous diagnostic loop designed to transition you from hesitant answers to structured engineering confidence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-3 relative">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 font-extrabold text-base flex items-center justify-center">
              1
            </div>
            <h3 className="text-base font-bold text-[#0F172A] m-0">Calibrate Role & Technology</h3>
            <p className="text-xs text-slate-600 leading-relaxed m-0">
              Select your target role (Python, Java, Full-Stack, DSA, DevOps) and difficulty level. The AI generates tailored questions reflecting real company interview standards.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-3 relative">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-extrabold text-base flex items-center justify-center">
              2
            </div>
            <h3 className="text-base font-bold text-[#0F172A] m-0">Simulate Live Interview</h3>
            <p className="text-xs text-slate-600 leading-relaxed m-0">
              Speak your answers naturally using browser microphone speech-to-text or write detailed technical code definitions in our clean distraction-free room.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm space-y-3 relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 font-extrabold text-base flex items-center justify-center">
              3
            </div>
            <h3 className="text-base font-bold text-[#0F172A] m-0">In-Depth Diagnostic Report</h3>
            <p className="text-xs text-slate-600 leading-relaxed m-0">
              Receive actionable factor-based scoring (Accuracy, Communication, Problem Solving), strengths, and precise recommendations for every turn.
            </p>
          </div>
        </div>
      </section>

      {/* 4. SUPPORTED INTERVIEW CATEGORIES */}
      <section id="categories" className="py-16 sm:py-20 bg-slate-100/70 border-y border-[#E2E8F0] px-4 sm:px-8">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider block">
              13 TECHNICAL VIVA DISCIPLINES
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
              Calibrated for Modern Engineering Roles
            </h2>
            <p className="text-sm text-slate-500">
              Practice rigorous technical vivas curated from real placement drives and senior engineering hiring benchmarks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {CATEGORIES.map((cat, idx) => (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm hover:border-orange-300 transition-all space-y-3"
              >
                <div className="text-2xl">{cat.icon}</div>
                <h3 className="text-base font-bold text-[#0F172A] m-0">{cat.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed m-0">{cat.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center pt-2">
            <Link
              href={user ? "/student/materials" : "/login"}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 inline-flex items-center gap-1"
            >
              <span>Explore All 13 Categories in Question Bank</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. SAMPLE SCORECARD PREVIEW */}
      <section id="sample-report" className="py-16 sm:py-20 px-4 sm:px-8 max-w-5xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold text-orange-600 uppercase tracking-wider block">
            OBJECTIVE EVALUATION RUBRICS
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            Sample Diagnostic Scorecard
          </h2>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            Every practice round produces verifiable factor breakdowns to quantify placement readiness.
          </p>
        </div>

        {/* Scorecard Widget Mock */}
        <div className="card p-6 sm:p-8 bg-white border border-[#E2E8F0] shadow-lg rounded-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
                DIAGNOSTIC VERIFIED
              </span>
              <h3 className="text-lg font-bold text-[#0F172A] mt-1 m-0">Python Full-Stack Placement Simulation</h3>
              <p className="text-xs text-slate-500 m-0">Evaluated on Reference Architecture Guidelines</p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-400 block">Overall Readiness Score</span>
              <span className="text-3xl font-extrabold text-emerald-600 font-mono">88%</span>
            </div>
          </div>

          {/* 4 Factor Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-base font-extrabold text-emerald-600">92%</div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Technical Accuracy</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-base font-extrabold text-blue-600">86%</div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Conceptual Depth</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-base font-extrabold text-purple-600">85%</div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Communication</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <div className="text-base font-extrabold text-amber-600">88%</div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Problem Solving</div>
            </div>
          </div>

          {/* Turn 1 Sample */}
          <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 space-y-2 text-xs">
            <div className="flex items-center justify-between font-bold">
              <span className="text-orange-700">Question 1: Python Memory & Reference Counting</span>
              <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">9 / 10 pts</span>
            </div>
            <p className="text-slate-800 m-0 font-medium">
              "Explain how Python manages memory using the Global Interpreter Lock (GIL) and reference counting."
            </p>
            <div className="p-2.5 rounded bg-white border border-slate-200 italic text-slate-600">
              "Candidate accurately explained reference counting and GIL mutex mechanics. Correctly cited cyclic garbage collector for handling reference cycles."
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQS */}
      <section id="faqs" className="py-16 sm:py-20 bg-white border-t border-[#E2E8F0] px-4 sm:px-8">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider block">
              FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
              Everything You Need to Know
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-5 text-left bg-slate-50/60 hover:bg-slate-50 flex items-center justify-between gap-4 font-bold text-sm text-[#0F172A]"
                  >
                    <span>{faq.q}</span>
                    {isOpen ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="p-5 pt-1 text-xs text-slate-600 leading-relaxed bg-white">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. BOTTOM CTA */}
      <section className="py-16 px-4 sm:px-8 bg-gradient-to-r from-slate-900 via-[#0F172A] to-slate-900 text-white text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to Ace Your Next Technical Interview?
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Practice for your dream role right now. Unlimited simulations, real engineering feedback, and zero pressure.
          </p>
          <div className="pt-2">
            <Link
              href={user ? "/student/interview/setup" : "/login"}
              className="btn btn-primary text-sm sm:text-base py-3.5 px-8 font-bold inline-flex items-center gap-2 shadow-xl shadow-orange-500/30"
            >
              <Sparkles size={16} />
              <span>Launch Your First Mock Session</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="bg-[#0A192F] text-slate-400 border-t border-[#1E293B] py-10 px-4 sm:px-8 text-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-gradient-to-tr from-[#EA580C] to-[#F97316] flex items-center justify-center font-extrabold text-white text-xs">
              L
            </div>
            <span className="font-extrabold text-white">LinkTest AI Mock Interview</span>
            <span className="text-slate-600">·</span>
            <span>Production Placement Platform</span>
          </div>

          <div className="flex items-center gap-5">
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#categories" className="hover:text-white">Question Bank</a>
            <a href="#faqs" className="hover:text-white">FAQs</a>
            <Link href="/login" className="hover:text-white font-bold text-orange-400">Sign In</Link>
          </div>
        </div>
        <div className="max-w-6xl mx-auto text-center sm:text-left text-slate-500 text-[11px] mt-4">
          © {new Date().getFullYear()} LinkTest AI. All rights reserved. Built for engineering candidates and technical placement mastery.
        </div>
      </footer>
    </div>
  );
}
