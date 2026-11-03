"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/authContext";
import {
  Sparkles,
  Briefcase,
  Layers,
  Clock,
  Mic,
  FileText,
  Sliders,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Code,
  Brain,
  MessageSquare,
  HelpCircle,
} from "lucide-react";

const TARGET_ROLES = [
  "Python Developer",
  "Java Developer",
  "Frontend Developer (React/Next.js)",
  "Backend Developer (Node/Python/Java)",
  "Full-Stack Developer",
  "Data Analyst",
  "Data Scientist / AI Engineer",
  "DevOps & Cloud Engineer",
  "Software Engineer (DSA & Systems)",
  "Custom Role",
];

const SKILL_TAGS = [
  "Python",
  "Java",
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "SQL & DBMS",
  "DSA & Algorithms",
  "System Design",
  "Operating Systems",
  "Computer Networks",
  "Docker & Kubernetes",
  "AWS Cloud",
  "STAR Behavioral",
];

export default function InterviewSetupPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [interviewType, setInterviewType] = useState<"technical" | "hr" | "behavioral" | "mixed">("technical");
  const [targetRole, setTargetRole] = useState("Python Developer");
  const [customRole, setCustomRole] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [yearsExperience, setYearsExperience] = useState("1-3 years");
  const [selectedSkills, setSelectedSkills] = useState<string[]>(["Python", "DSA & Algorithms", "SQL & DBMS"]);
  const [customSkillInput, setCustomSkillInput] = useState("");
  const [questionCount, setQuestionCount] = useState<number>(3);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "adaptive">("medium");
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [answerMode, setAnswerMode] = useState<"voice" | "text">("voice");
  const [jobDescription, setJobDescription] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const addCustomSkill = () => {
    if (customSkillInput.trim() && !selectedSkills.includes(customSkillInput.trim())) {
      setSelectedSkills((prev) => [...prev, customSkillInput.trim()]);
      setCustomSkillInput("");
    }
  };

  const handleStartInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmitting(true);

    const effectiveRole = targetRole === "Custom Role" ? customRole.trim() || "Software Engineer" : targetRole;
    if (selectedSkills.length === 0) {
      setErrorMsg("Please select at least one technology or target skill.");
      setSubmitting(false);
      return;
    }

    try {
      const sessionId = `sim-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "schedule",
          id: sessionId,
          studentName: user?.fullName || "Candidate",
          studentEmail: user?.email || "candidate@linktest.io",
          technology: selectedSkills[0] || effectiveRole,
          interviewType,
          difficulty: difficulty === "adaptive" ? "intermediate" : difficulty,
          durationMinutes,
          questionCount,
          status: "scheduled",
          batchName: "Self-Configured Mock",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to configure interview session");
      }

      // Store configuration preferences for active room
      try {
        localStorage.setItem(
          `linktest_session_config_${sessionId}`,
          JSON.stringify({
            role: effectiveRole,
            skills: selectedSkills,
            difficulty,
            answerMode,
            experienceLevel,
            durationMinutes,
            questionCount,
          })
        );
      } catch {}

      router.push(`/student/interview/active?sessionId=${sessionId}&mode=${answerMode}`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to initialize interview room");
      setSubmitting(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <AppShell role="student">
        <div className="max-w-4xl mx-auto space-y-8 pb-12">
          {/* Header */}
          <div className="border-b border-[#E2E8F0] pb-5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-700 uppercase tracking-wider">
                AI INTERVIEW CONFIGURATION
              </span>
              <span className="text-xs text-slate-400">• Step 1 of 2</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight m-0">
              Configure Your Mock Interview
            </h1>
            <p className="text-sm text-slate-500 mt-1 m-0">
              Calibrate the AI hiring panel to evaluate your target role, core technologies, and verbal fluency.
            </p>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleStartInterview} className="space-y-8">
            {/* 1. Target Role & Category */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <Briefcase className="text-orange-600" size={20} />
                <h2 className="text-lg font-bold text-[#0F172A] m-0">1. Target Job Role & Interview Format</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Target Role
                  </label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    className="w-full text-sm font-semibold rounded-xl border border-slate-200 px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {TARGET_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  {targetRole === "Custom Role" && (
                    <input
                      type="text"
                      placeholder="Specify custom role (e.g. Embedded Firmware Engineer)"
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                      className="mt-2.5 w-full text-sm rounded-xl border border-slate-200 px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                      required
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Interview Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "technical", label: "Technical Viva" },
                      { id: "behavioral", label: "Behavioral (STAR)" },
                      { id: "hr", label: "HR / Culture" },
                      { id: "mixed", label: "Comprehensive Mixed" },
                    ].map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => setInterviewType(t.id as any)}
                        className={`text-xs font-bold py-2.5 px-3 rounded-xl border text-center transition-all ${
                          interviewType === t.id
                            ? "bg-orange-50 border-orange-500 text-orange-800 shadow-sm"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Experience Level */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Seniority / Experience Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "beginner", label: "Beginner / Fresher" },
                      { id: "intermediate", label: "Mid (2-4 Yrs)" },
                      { id: "advanced", label: "Senior (5+ Yrs)" },
                    ].map((lvl) => (
                      <button
                        type="button"
                        key={lvl.id}
                        onClick={() => setExperienceLevel(lvl.id as any)}
                        className={`text-xs font-bold py-2 px-2 rounded-xl border text-center transition-all ${
                          experienceLevel === lvl.id
                            ? "bg-slate-900 border-slate-900 text-white"
                            : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {lvl.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Experience Range
                  </label>
                  <select
                    value={yearsExperience}
                    onChange={(e) => setYearsExperience(e.target.value)}
                    className="w-full text-sm font-semibold rounded-xl border border-slate-200 px-3.5 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="0-1 years">0 - 1 years (Entry-Level Placement)</option>
                    <option value="1-3 years">1 - 3 years (Junior Engineer)</option>
                    <option value="3-5 years">3 - 5 years (Mid-Level Engineer)</option>
                    <option value="5+ years">5+ years (Lead / Senior Architect)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 2. Skills & Technologies */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <Code className="text-orange-600" size={20} />
                  <h2 className="text-lg font-bold text-[#0F172A] m-0">2. Technologies & Key Competencies</h2>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {selectedSkills.length} selected
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {SKILL_TAGS.map((skill) => {
                  const isSelected = selectedSkills.includes(skill);
                  return (
                    <button
                      type="button"
                      key={skill}
                      onClick={() => toggleSkill(skill)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                        isSelected
                          ? "bg-orange-500 border-orange-500 text-white shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {skill} {isSelected && "✓"}
                    </button>
                  );
                })}
              </div>

              {/* Add custom skill tag */}
              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Add another technology (e.g. Redis, GraphQL, Flutter)"
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addCustomSkill();
                    }
                  }}
                  className="text-xs rounded-xl border border-slate-200 px-3 py-2 bg-slate-50 focus:bg-white flex-1 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="button"
                  onClick={addCustomSkill}
                  className="btn btn-outline text-xs py-2 px-3.5"
                >
                  Add Tag
                </button>
              </div>
            </div>

            {/* 3. Session Calibration & Answer Mode */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <Sliders className="text-orange-600" size={20} />
                <h2 className="text-lg font-bold text-[#0F172A] m-0">3. Interview Parameters & Answering Mode</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Number of Questions
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[3, 5, 10].map((count) => (
                      <button
                        type="button"
                        key={count}
                        onClick={() => setQuestionCount(count)}
                        className={`text-xs font-bold py-2 rounded-xl border text-center transition-all ${
                          questionCount === count
                            ? "bg-orange-500 border-orange-500 text-white"
                            : "bg-white border-slate-200 text-slate-700"
                        }`}
                      >
                        {count} Qs
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Difficulty Caliber
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full text-xs font-bold rounded-xl border border-slate-200 px-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="easy">Easy (Core Foundations)</option>
                    <option value="medium">Medium (Standard Placement)</option>
                    <option value="hard">Hard (Production Architecture)</option>
                    <option value="adaptive">Adaptive (Dynamically Calibrated)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                    Target Duration
                  </label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full text-xs font-bold rounded-xl border border-slate-200 px-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value={15}>15 Minutes (Quick Sprint)</option>
                    <option value={30}>30 Minutes (Standard Round)</option>
                    <option value={45}>45 Minutes (Full Technical Viva)</option>
                  </select>
                </div>
              </div>

              {/* Answer Mode */}
              <div className="pt-3 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wider">
                  Select Candidate Answer Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    onClick={() => setAnswerMode("voice")}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      answerMode === "voice"
                        ? "bg-orange-50/70 border-orange-500 shadow-sm"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className={`p-2.5 rounded-lg ${answerMode === "voice" ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-600"}`}>
                      <Mic size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#0F172A]">Voice & AI Avatar Mode</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">RECOMMENDED</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 m-0">
                        Realistic speech-to-text simulation. Practice vocal clarity, pacing, and reduce verbal hesitation.
                      </p>
                    </div>
                  </div>

                  <div
                    onClick={() => setAnswerMode("text")}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      answerMode === "text"
                        ? "bg-orange-50/70 border-orange-500 shadow-sm"
                        : "bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className={`p-2.5 rounded-lg ${answerMode === "text" ? "bg-orange-500 text-white" : "bg-slate-100 text-slate-600"}`}>
                      <FileText size={20} />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-[#0F172A]">Direct Text Answer Mode</span>
                      <p className="text-xs text-slate-500 mt-1 m-0">
                        Type your code explanations and technical definitions directly into a distraction-free answer editor.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Optional Job Description & Target Focus */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-2">
                <Brain className="text-orange-600" size={20} />
                <h2 className="text-base font-bold text-[#0F172A] m-0">4. Job Description & Context (Optional)</h2>
              </div>
              <p className="text-xs text-slate-500 m-0">
                Paste the specific Job Description (JD) or company interview focus you are targeting to guide tailored AI questions.
              </p>
              <textarea
                rows={3}
                placeholder="Paste company job requirements (e.g. 'Looking for backend engineer with high-concurrency Python asyncio and PostgreSQL scaling experience...')"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full text-xs rounded-xl border border-slate-200 p-3 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Launch CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <Link
                href="/student/dashboard"
                className="text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                ← Back to Candidate Dashboard
              </Link>

              <button
                type="submit"
                disabled={submitting}
                className="btn btn-primary text-sm py-3 px-8 w-full sm:w-auto flex items-center justify-center gap-2 shadow-lg"
              >
                <Sparkles size={16} />
                <span>{submitting ? "Initializing AI Interview Room..." : "Launch Interview Room Now"}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </div>
      </AppShell>
    </ProtectedRoute>
  );
}
