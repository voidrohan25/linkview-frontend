"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/lib/supabase";
import { User, Mail, Phone, BookOpen, GraduationCap, ShieldCheck, CheckCircle2, Award } from "lucide-react";

export default function StudentProfilePage() {
  const [student, setStudent] = useState({
    fullName: "Student",
    email: "student@linktest.io",
    phone: "+91 98765 43210",
    batchName: "Python Full Stack Placement Cohort 2026-A",
    batchCode: "PY-2026-A",
    technology: "Python & Distributed Systems",
    status: "active",
    interviewsCompleted: 1,
    averageScore: 86,
    joinedDate: "January 15, 2026",
    assignedTrainer: "Rahul Sir (Lead Faculty)",
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("linktest_current_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.email) {
          setStudent((prev) => ({
            ...prev,
            fullName: parsed.fullName || parsed.email.split("@")[0],
            email: parsed.email,
          }));
        }
      }
    } catch {}

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        const name =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email.split("@")[0];
        setStudent((prev) => ({
          ...prev,
          fullName: name,
          email: user.email!,
        }));
      }
    }).catch(() => {});
  }, []);

  return (
    <AppShell role="student" userName={student.fullName} userEmail={student.email}>
      <div className="max-w-[960px] mx-auto space-y-6">
        <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-orange-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
              AS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 m-0">{student.fullName}</h1>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                  Active Student
                </span>
              </div>
              <p className="text-xs text-slate-500 m-0">{student.email} • {student.batchCode}</p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Placement Readiness</span>
            <span className="text-2xl font-extrabold text-emerald-600 font-mono">{student.averageScore}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Personal Info */}
          <div className="card p-5 bg-white border border-[#E2E8F0] rounded-2xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <User size={18} className="text-orange-600" />
              <h3 className="text-sm font-bold text-slate-900 m-0">Personal Information</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Full Name</span>
                <span className="font-semibold text-slate-800">{student.fullName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Email Address</span>
                <span className="font-semibold text-slate-800">{student.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Contact Phone</span>
                <span className="font-semibold text-slate-800">{student.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Enrolled Date</span>
                <span className="font-semibold text-slate-800">{student.joinedDate}</span>
              </div>
            </div>
          </div>

          {/* Academic Cohort */}
          <div className="card p-5 bg-white border border-[#E2E8F0] rounded-2xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <BookOpen size={18} className="text-orange-600" />
              <h3 className="text-sm font-bold text-slate-900 m-0">Cohort & Faculty Allocation</h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Enrolled Batch</span>
                <span className="font-semibold text-slate-800">{student.batchName}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Primary Specialization</span>
                <span className="font-semibold text-slate-800">{student.technology}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Assigned Faculty Lead</span>
                <span className="font-semibold text-slate-800">{student.assignedTrainer}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Assessments Completed</span>
                <span className="font-semibold text-slate-800">{student.interviewsCompleted} Completed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
