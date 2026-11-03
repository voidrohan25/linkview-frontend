"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/authContext";
import { supabase } from "@/lib/supabase";
import {
  User,
  Mail,
  Briefcase,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Award,
  Settings,
  Lock,
  Trash2,
  Sliders,
  Save,
  Info,
} from "lucide-react";

export default function StudentProfilePage() {
  const { user: authUser } = useAuth();

  const [student, setStudent] = useState({
    fullName: authUser?.fullName || "Candidate",
    email: authUser?.email || "",
    preferredRole: "Python Full-Stack Developer",
    experienceLevel: "1-3 years (Junior to Mid)",
    skills: ["Python", "DSA & Algorithms", "SQL & DBMS", "React"],
    preferredMode: "voice" as "voice" | "text",
    privacyConsent: true,
    interviewsCompleted: 0,
    averageScore: 0,
    joinedDate: "Active Member",
  });

  const [savedNotice, setSavedNotice] = useState(false);
  const [newSkillInput, setNewSkillInput] = useState("");

  useEffect(() => {
    let resolvedEmail = authUser?.email || "";
    try {
      const saved = localStorage.getItem("linktest_candidate_profile");
      if (saved) {
        const parsed = JSON.parse(saved);
        setStudent((prev) => ({ ...prev, ...parsed }));
      }
    } catch {}

    if (resolvedEmail) {
      fetch(`/api/interviews?role=student&email=${encodeURIComponent(resolvedEmail)}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            const completed = json.data.completedInterviews || [];
            const avg =
              completed.length > 0
                ? Math.round(
                    completed.reduce(
                      (acc: number, item: any) =>
                        acc + (item.scorecard?.overallScore || 0),
                      0
                    ) / completed.length
                  )
                : 0;

            setStudent((prev) => ({
              ...prev,
              fullName: authUser?.fullName || prev.fullName,
              email: resolvedEmail,
              interviewsCompleted: completed.length,
              averageScore: avg,
            }));
          }
        })
        .catch(() => {});
    }
  }, [authUser]);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem("linktest_candidate_profile", JSON.stringify(student));
      setSavedNotice(true);
      setTimeout(() => setSavedNotice(false), 3000);
    } catch {}
  };

  const handleAddSkill = () => {
    if (newSkillInput.trim() && !student.skills.includes(newSkillInput.trim())) {
      setStudent((prev) => ({ ...prev, skills: [...prev.skills, newSkillInput.trim()] }));
      setNewSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setStudent((prev) => ({ ...prev, skills: prev.skills.filter((s) => s !== skill) }));
  };

  const handleClearHistory = async () => {
    if (!confirm("Are you sure you want to clear your local candidate session cache? Completed server records are maintained securely.")) return;
    try {
      localStorage.removeItem("linktest_candidate_profile");
      alert("Local candidate session preferences reset.");
    } catch {}
  };

  const initials = student.fullName
    ? student.fullName
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "CN";

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <AppShell role="student" userName={student.fullName} userEmail={student.email}>
        <div className="max-w-[960px] mx-auto space-y-6 pb-12">
          {/* Header Card */}
          <div className="p-6 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#EA580C] to-[#F97316] text-white font-extrabold text-2xl flex items-center justify-center shadow-md">
                {initials}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold text-slate-900 m-0">{student.fullName}</h1>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 uppercase">
                    AI Mock Candidate
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 m-0">
                  {student.email} • Target Role: {student.preferredRole}
                </p>
              </div>
            </div>

            <div className="text-right self-end sm:self-auto">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Readiness</span>
              <span className="text-2xl font-extrabold text-emerald-600 font-mono">
                {student.averageScore > 0 ? `${student.averageScore}%` : "—"}
              </span>
            </div>
          </div>

          {savedNotice && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>Candidate preferences saved successfully!</span>
            </div>
          )}

          <form onSubmit={handleSavePreferences} className="space-y-6">
            {/* 1. Candidate Career Profile */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Briefcase size={18} className="text-orange-600" />
                <h2 className="text-base font-bold text-slate-900 m-0">Target Career & Technical Profile</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={student.fullName}
                    onChange={(e) => setStudent({ ...student, fullName: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={student.email}
                    disabled
                    className="w-full text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 bg-slate-100 text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Preferred Job Role
                  </label>
                  <input
                    type="text"
                    value={student.preferredRole}
                    onChange={(e) => setStudent({ ...student, preferredRole: e.target.value })}
                    placeholder="e.g. Python Backend Engineer, Full-Stack Developer"
                    className="w-full text-xs rounded-xl border border-slate-200 px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Experience Level
                  </label>
                  <select
                    value={student.experienceLevel}
                    onChange={(e) => setStudent({ ...student, experienceLevel: e.target.value })}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-200 px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="0-1 years (Fresher / Entry)">0 - 1 years (Fresher / Entry Placement)</option>
                    <option value="1-3 years (Junior to Mid)">1 - 3 years (Junior to Mid-Level)</option>
                    <option value="3-5 years (Senior)">3 - 5 years (Senior Software Engineer)</option>
                    <option value="5+ years (Lead / Architect)">5+ years (Lead Engineer / Architect)</option>
                  </select>
                </div>
              </div>

              {/* Skills Tags */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                  Target Technologies & Skills
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {student.skills.map((s) => (
                    <span
                      key={s}
                      className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-orange-50 text-orange-800 border border-orange-200 flex items-center gap-1.5"
                    >
                      <span>{s}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(s)}
                        className="text-orange-400 hover:text-orange-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a technology or skill (e.g. Docker, TypeScript, FastApi)..."
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 focus:bg-white flex-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="btn btn-outline text-xs py-2 px-3.5"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Interview Preferences & Answer Mode */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <Sliders size={18} className="text-orange-600" />
                <h2 className="text-base font-bold text-slate-900 m-0">Default Interview Preferences</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Preferred Answering Method
                  </label>
                  <select
                    value={student.preferredMode}
                    onChange={(e) => setStudent({ ...student, preferredMode: e.target.value as any })}
                    className="w-full text-xs font-semibold rounded-xl border border-slate-200 px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="voice">Voice & Speech Recognition (Realistic Simulation)</option>
                    <option value="text">Clean Text Input (Code & Written Definitions)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Proctoring & Integrity Checks
                  </label>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                    <span>Multi-flag tab switch & webcam monitoring active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Privacy, Data Protection & Account Controls */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <ShieldCheck size={18} className="text-orange-600" />
                <h2 className="text-base font-bold text-slate-900 m-0">Privacy & Data Governance</h2>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2 leading-relaxed">
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                  <Info size={15} className="text-blue-600" />
                  <span>How your interview data is handled:</span>
                </div>
                <p className="m-0">
                  • <strong>Speech Recordings:</strong> Processed in real-time in your browser via the Web Speech API and discarded immediately after transcription. No continuous raw audio files are stored permanently on unencrypted public disks.
                </p>
                <p className="m-0">
                  • <strong>Transcripts & Scorecards:</strong> Associated strictly with your authenticated candidate account ID. They are never shared publicly or indexed by search engines.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
                >
                  <Trash2 size={13} />
                  <span>Reset Local Candidate Cache</span>
                </button>

                <button
                  type="submit"
                  className="btn btn-primary text-xs py-2 px-6 font-bold flex items-center gap-2 shadow-md"
                >
                  <Save size={14} />
                  <span>Save Preferences</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
