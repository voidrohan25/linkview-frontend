"use client";

import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Target, Sparkles, TrendingUp, Award, ArrowRight } from "lucide-react";

export default function StudentPerformancePage() {
  const topics = [
    { name: "Python Core & OOP", mastery: 92, status: "Advanced", color: "from-orange-500 to-amber-500" },
    { name: "CPython Memory & GIL", mastery: 88, status: "Proficient", color: "from-blue-600 to-indigo-600" },
    { name: "Algorithms & Kadane / Dynamic Programming", mastery: 74, status: "Intermediate", color: "from-emerald-500 to-teal-500" },
    { name: "SQL Query Optimization & Indexes", mastery: 85, status: "Proficient", color: "from-purple-500 to-pink-500" },
    { name: "System Design & Distributed Patterns", mastery: 68, status: "Developing", color: "from-slate-600 to-slate-800" },
    { name: "Behavioral & STAR Communication", mastery: 90, status: "Advanced", color: "from-amber-500 to-orange-600" },
  ];

  return (
    <AppShell role="student">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E2E8F0] gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#F0FDF4] text-[#15803D] border border-[#BBF7D0]">
                CURRICULUM BENCHMARK
              </span>
              <span className="text-xs text-[#64748B]">• Technical Skill Distribution</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Curriculum Mastery & Radar
            </h1>
            <p className="text-sm text-[#475569] mt-0.5">
              Comprehensive breakdown of topic competencies based on your AI voice mock interview responses.
            </p>
          </div>

          <Link href="/student/interview/active" className="btn btn-primary self-start sm:self-auto">
            <Sparkles size={16} />
            <span>Practice Weak Topics</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {topics.map((t) => (
            <div key={t.name} className="card p-6 bg-white border border-[#E2E8F0] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#0F172A]">{t.name}</span>
                <span className="text-xs font-bold text-slate-700">{t.mastery}%</span>
              </div>

              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${t.color} rounded-full transition-all duration-500`}
                  style={{ width: `${t.mastery}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Tier: <strong className="text-slate-800">{t.status}</strong></span>
                <Link href="/student/interview/active" className="text-blue-600 font-bold hover:underline flex items-center gap-1">
                  <span>Targeted Drill</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
