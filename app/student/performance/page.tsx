"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/authContext";
import { Target, Sparkles, TrendingUp, Award, ArrowRight, BarChart3 } from "lucide-react";

interface CompetencyTopic {
  name: string;
  mastery: number;
  status: string;
  color: string;
}

export default function StudentPerformancePage() {
  const [topics, setTopics] = useState<CompetencyTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentUser, setStudentUser] = useState({
    name: "Candidate",
    email: "",
  });

  useEffect(() => {
    let resolvedEmail = "";
    try {
      const saved = localStorage.getItem("linktest_current_user");
      if (saved) {
        const u = JSON.parse(saved);
        if (u.email) {
          resolvedEmail = u.email;
          setStudentUser({
            name: u.fullName || u.email.split("@")[0],
            email: u.email,
          });
        }
      }
    } catch {}

    const url = resolvedEmail
      ? `/api/interviews?role=student&email=${encodeURIComponent(resolvedEmail)}`
      : `/api/interviews?role=student`;

    fetch(url)
      .then((res) => res.json())
      .then((json) => {
        if (json.success && json.data) {
          const completed: any[] = json.data.completedInterviews || [];
          if (completed.length === 0) {
            setTopics([]);
          } else {
            // Aggregate technology mastery from real scorecards
            const techMap: Record<string, { totalScore: number; count: number }> = {};
            completed.forEach((item) => {
              const tech = item.technology || "General Technical";
              const score = item.scorecard?.overallScore || 75;
              if (!techMap[tech]) techMap[tech] = { totalScore: 0, count: 0 };
              techMap[tech].totalScore += score;
              techMap[tech].count += 1;
            });

            const colors = [
              "from-orange-500 to-amber-500",
              "from-blue-600 to-indigo-600",
              "from-emerald-500 to-teal-500",
              "from-purple-500 to-pink-500",
              "from-amber-500 to-orange-600",
            ];

            const computedTopics: CompetencyTopic[] = Object.entries(techMap).map(
              ([tech, stat], index) => {
                const avg = Math.round(stat.totalScore / stat.count);
                const status =
                  avg >= 85 ? "Advanced" : avg >= 70 ? "Proficient" : "Developing";
                return {
                  name: `${tech} Competency`,
                  mastery: avg,
                  status,
                  color: colors[index % colors.length],
                };
              }
            );

            setTopics(computedTopics);
          }
        }
      })
      .catch((err) => console.error("Error loading performance:", err))
      .finally(() => setLoading(false));
  }, []);

  const { user: authUser } = useAuth();

  useEffect(() => {
    if (authUser?.email) {
      setStudentUser({
        name: authUser.fullName || authUser.email.split("@")[0],
        email: authUser.email,
      });
    }
  }, [authUser]);

  return (
    <ProtectedRoute allowedRoles={["student"]}>
      <AppShell role="student" userName={studentUser.name} userEmail={studentUser.email}>
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

          <Link href="/student/interview/active" className="btn btn-primary self-start sm:self-auto flex items-center gap-2">
            <Sparkles size={16} />
            <span>Practice Voice Lab</span>
          </Link>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Computing performance radar...</div>
        ) : topics.length === 0 ? (
          <div className="p-10 rounded-2xl bg-white border border-[#E2E8F0] text-center space-y-3">
            <BarChart3 size={36} className="text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800 m-0">No evaluated benchmarks yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto m-0">
              Complete assigned AI technical mock assessments to generate your skill mastery radar and weakness diagnosis.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {topics.map((t) => (
              <div key={t.name} className="card p-6 bg-white border border-[#E2E8F0] space-y-3 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#0F172A]">{t.name}</span>
                  <span className="text-xs font-bold text-slate-700">{t.mastery}%</span>
                </div>

                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${t.color} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(100, Math.max(5, t.mastery))}%` }}
                  />
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
        )}
      </div>
    </AppShell>
  </ProtectedRoute>
);
}
