"use client";

import React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { BookOpen, FileText, Download, Sparkles, ExternalLink } from "lucide-react";

export default function StudentMaterialsPage() {
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
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E2E8F0] gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]">
                PREPARATION MATERIALS
              </span>
              <span className="text-xs text-[#64748B]">• Institute Technical Guides</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Interview Study Materials & Guides
            </h1>
            <p className="text-sm text-[#475569] mt-0.5">
              Curated lecture notes, interview cheat sheets, and architectural pattern guides authored by Rahul Sir & faculty.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {guides.map((g, idx) => (
            <div key={idx} className="card p-6 bg-white border border-[#E2E8F0] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {g.topic}
                  </span>
                  <span className="text-xs font-medium text-slate-500">{g.pages}</span>
                </div>

                <h3 className="font-bold text-base text-[#0F172A] mb-2">{g.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">{g.summary}</p>
              </div>

              <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
                <span className="text-[11px] text-slate-400">PDF Guide • Verified</span>
                <button
                  onClick={() => alert(`Downloading "${g.title}"...`)}
                  className="btn btn-outline btn-sm text-xs py-1.5 px-3 flex items-center gap-1.5"
                >
                  <Download size={13} />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  </ProtectedRoute>
);
}
