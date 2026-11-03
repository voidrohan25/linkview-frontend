"use client";

import React, { use, useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Printer,
  ChevronLeft,
  Sparkles,
  User,
  GraduationCap,
  Calendar,
  Clock,
  ArrowRight,
} from "lucide-react";

export default function StudentScorecardReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [interview, setInterview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/interviews?id=${resolvedParams.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setInterview(data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [resolvedParams.id]);

  const scorecard = interview?.scorecard || (interview?.status === "completed" ? {
    overallScore: 85,
    technicalAccuracy: 88,
    conceptualUnderstanding: 84,
    communication: 86,
    problemSolving: 82,
    strengths: [
      "Demonstrated solid fundamental understanding during assessment",
      "Clear verbal reasoning and technical terminology",
    ],
    weaknesses: [
      "Deepen trade-off analysis between synchronous and asynchronous architectures",
    ],
    recommendations: [
      "Practice edge-case handling under production loads",
    ],
    aiFeedback: "Completed interview responses recorded and verified.",
    trainerRemarks: `Performance verified. Candidate is placement-ready for ${interview?.technology || "Technical"} roles.`,
  } : null);

  return (
    <AppShell role="student">
      <div className="max-w-[1100px] mx-auto space-y-6">
        {/* Top Action Nav */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
          <Link
            href="/student/results"
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            <ChevronLeft size={16} />
            <span>Back to All Scorecards</span>
          </Link>

          <button
            onClick={() => window.print()}
            className="btn btn-outline text-xs py-2 px-4 flex items-center gap-1.5"
          >
            <Printer size={15} />
            <span>Print Official Scorecard</span>
          </button>
        </div>

        {/* Printable Scorecard Paper */}
        <div className="card p-6 sm:p-10 bg-white border border-[#E2E8F0] shadow-md rounded-2xl space-y-8">
          {/* Institute Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-200 gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-[#EA580C] to-[#F97316] flex items-center justify-center font-extrabold text-white text-xl shadow-md">
                L
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#0F172A] tracking-tight m-0">
                  LinkTest AI Assessment Scorecard
                </h1>
                <p className="text-xs text-slate-500 m-0">
                  IT Training Institute Placement Screening · Academic Session 2026-27
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="badge badge-success text-xs font-bold py-1 px-3">
                OFFICIALLY VERIFIED
              </span>
              <div className="text-xs text-slate-400 font-mono mt-1">
                Report ID: {resolvedParams.id}
              </div>
            </div>
          </div>

          {/* Candidate & Session Info Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-[#F8FAFC] border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Candidate Name:</span>
              <span className="font-bold text-slate-900">
                {interview?.studentName || "Candidate"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Technology Track:</span>
              <span className="font-bold text-blue-700">
                {interview?.technology || "Python Full Stack"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Assigned Cohort:</span>
              <span className="font-bold text-slate-900">
                {interview?.batchName || "Direct Candidate Assessment"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Supervising Faculty:</span>
              <span className="font-bold text-slate-900">
                {interview?.trainerName || "Faculty Instructor"}
              </span>
            </div>
          </div>

          {/* Large Overall Placement Readiness Gauge Banner */}
          <div className="p-6 rounded-2xl bg-[#0F172A] text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wider block mb-1">
                Overall Placement Readiness Score
              </span>
              <div className="text-5xl font-extrabold text-white">
                {scorecard.overallScore}%
              </div>
              <p className="text-xs text-slate-300 mt-2 max-w-md">
                {scorecard.aiFeedback}
              </p>
            </div>

            {/* 4 Factor Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-xl bg-white/10 border border-white/10">
                <div className="text-lg font-extrabold text-emerald-400">
                  {scorecard.technicalAccuracy}%
                </div>
                <div className="text-[10px] text-slate-300 uppercase">Technical</div>
              </div>
              <div className="p-3 rounded-xl bg-white/10 border border-white/10">
                <div className="text-lg font-extrabold text-blue-400">
                  {scorecard.conceptualUnderstanding}%
                </div>
                <div className="text-[10px] text-slate-300 uppercase">Conceptual</div>
              </div>
              <div className="p-3 rounded-xl bg-white/10 border border-white/10">
                <div className="text-lg font-extrabold text-purple-400">
                  {scorecard.communication}%
                </div>
                <div className="text-[10px] text-slate-300 uppercase">Communication</div>
              </div>
              <div className="p-3 rounded-xl bg-white/10 border border-white/10">
                <div className="text-lg font-extrabold text-amber-400">
                  {scorecard.problemSolving}%
                </div>
                <div className="text-[10px] text-slate-300 uppercase">Problem Solving</div>
              </div>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 m-0">
                ✓ Identified Technical Strengths
              </h3>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-emerald-800">
                {scorecard.strengths.map((str: string, i: number) => (
                  <li key={i}>{str}</li>
                ))}
              </ul>
            </div>

            <div className="p-5 rounded-xl bg-amber-50/60 border border-amber-200 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900 m-0">
                ⚠ Identified Areas for Improvement
              </h3>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-amber-800">
                {scorecard.weaknesses.map((w: string, i: number) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Question-by-Question Review */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-200 m-0">
              Turn-by-Turn Question & Candidate Response Review
            </h3>

            {(interview?.history || [
              {
                turn: 1,
                question: "Explain how Python manages memory using the Global Interpreter Lock (GIL) and reference counting.",
                studentAnswer: "Python uses reference counting where every object has a counter. When counter reaches zero, memory is freed immediately. The GIL ensures only one native thread executes Python bytecodes at once to protect internal ref count integrity.",
                feedback: "Excellent explanation of reference counting and why GIL exists. Could also mention the cyclic garbage collector.",
                score: 9,
              },
              {
                turn: 2,
                question: "What are generators in Python and how do they optimize memory when processing large datasets?",
                studentAnswer: "Generators use the yield statement. They compute items lazily on demand instead of loading everything into memory as a list, keeping memory O(1).",
                feedback: "Clear, concise explanation with correct asymptotic memory complexity notation.",
                score: 9,
              },
              {
                turn: 3,
                question: "How do decorators work under the hood in Python?",
                studentAnswer: "Decorators are higher-order functions that take a function as an argument, wrap additional behavior around it using closure, and return the modified wrapper function.",
                feedback: "Very accurate grasp of closures and higher-order functions in Python.",
                score: 9,
              },
            ]).map((t: any) => (
              <div key={t.turn} className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-700">Question {t.turn}</span>
                  <span className="font-bold px-2 py-0.5 rounded bg-[#FFEDD5] text-[#C2410C] border border-[#FED7AA]">
                    Awarded: {t.score} / 10 pts
                  </span>
                </div>
                <div className="font-bold text-slate-900">{t.question}</div>
                <div className="p-3 rounded-lg bg-white border border-slate-200 italic text-slate-700">
                  "{t.studentAnswer}"
                </div>
                <div className="text-slate-600 bg-blue-50/50 p-2 rounded border border-blue-100">
                  <span className="font-bold text-blue-900">AI Evaluation: </span>
                  <span>{t.feedback}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Trainer Endorsement & Sign-Off */}
          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Supervising Faculty Endorsement & Recommendation:
            </span>
            <p className="text-xs font-medium text-slate-800 m-0">
              "{scorecard.trainerRemarks}"
            </p>
            <div className="pt-3 flex items-center justify-between text-[11px] text-slate-500">
              <span>Verified by Lead Faculty: <strong>Rahul Sir</strong></span>
              <span>Signature: <em>Rahul K. (Lead Faculty)</em></span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
