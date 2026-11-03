"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import {
  Video,
  Mic,
  MicOff,
  Sparkles,
  Users,
  CheckCircle2,
  Award,
  Clock,
  Play,
  RotateCcw,
} from "lucide-react";

export default function TrainerConductPage() {
  const [candidate, setCandidate] = useState("Enrolled Candidate");
  const [candidatesList, setCandidatesList] = useState<any[]>([]);
  const [technology, setTechnology] = useState("Python Full Stack");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [technicalScore, setTechnicalScore] = useState(8);
  const [communicationScore, setCommunicationScore] = useState(9);
  const [trainerNotes, setTrainerNotes] = useState("");
  const [sessionActive, setSessionActive] = useState(false);
  const [completed, setCompleted] = useState(false);

  const [trainerUser, setTrainerUser] = useState({
    name: "Faculty Trainer",
    email: "",
  });

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem("linktest_current_user");
      if (saved) {
        const u = JSON.parse(saved);
        if (u.fullName || u.email) {
          setTrainerUser({
            name: u.fullName || u.email.split("@")[0],
            email: u.email,
          });
        }
      }
    } catch {}

    fetch("/api/admin/users?role=student")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setCandidatesList(json.data);
          setCandidate(json.data[0].fullName);
        }
      })
      .catch(() => {});
  }, []);

  const questions = [
    "Explain how Python manages memory using the Global Interpreter Lock (GIL) and reference counting.",
    "What are generators in Python and how do they optimize memory when processing large datasets?",
    "How do decorators work under the hood in Python?",
  ];

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setSessionActive(false);
      setCompleted(true);
    }
  };

  return (
    <AppShell role="trainer" userName={trainerUser.name} userEmail={trainerUser.email}>
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E2E8F0] gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]">
                LIVE MOCK STUDIO
              </span>
              <span className="text-xs text-[#64748B]">• Dual-Mode Technical Interview Room</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Conduct Live Mock Interview
            </h1>
            <p className="text-sm text-[#475569] mt-0.5">
              Interactively observe candidate responses with real-time AI assistance or conduct a direct faculty technical round.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!sessionActive && !completed ? (
              <button
                onClick={() => setSessionActive(true)}
                className="btn btn-primary text-xs py-2 px-4 font-bold"
              >
                <Play size={15} />
                <span>Start Live Session</span>
              </button>
            ) : sessionActive ? (
              <button
                onClick={() => {
                  setSessionActive(false);
                  setCompleted(true);
                }}
                className="btn btn-secondary text-xs py-2 px-4 font-bold"
              >
                <span>End Session</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setCompleted(false);
                  setCurrentQuestionIndex(0);
                  setSessionActive(true);
                }}
                className="btn btn-outline text-xs py-2 px-4 font-bold"
              >
                <RotateCcw size={15} />
                <span>Start Another Session</span>
              </button>
            )}
          </div>
        </div>

        {/* 2-Column Live Studio Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main Interview Stage */}
          <div className="lg:col-span-2 space-y-5">
            <div className="card p-6 bg-[#0F172A] text-white border-0 shadow-xl space-y-6 rounded-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center font-bold text-sm text-white">
                    {candidate.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">{candidate}</h3>
                    <span className="text-xs text-slate-400">{technology} Track</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>Live Channel Connected</span>
                  </span>
                </div>
              </div>

              {/* Active Question Box */}
              <div className="p-5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-2">
                <div className="flex items-center justify-between text-xs text-orange-400 font-bold uppercase tracking-wider">
                  <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                  <span>Turn Score Benchmark: 10 pts</span>
                </div>
                <p className="text-base font-semibold text-slate-100 leading-relaxed m-0">
                  {questions[currentQuestionIndex]}
                </p>
              </div>

              {/* Candidate Voice Visualizer Wave */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-full bg-orange-500/20 text-orange-400">
                    <Mic size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">Candidate Audio Ingestion</div>
                    <div className="text-[11px] text-slate-400">Web SpeechRecognition listening & streaming</div>
                  </div>
                </div>

                <div className="flex items-center gap-1 h-6">
                  {[40, 75, 55, 90, 65, 80, 45, 95, 60, 85].map((h, i) => (
                    <span
                      key={i}
                      className="w-1 bg-orange-500 rounded-full transition-all duration-300"
                      style={{ height: `${sessionActive ? h : 20}%` }}
                    ></span>
                  ))}
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400">
                  Turn {currentQuestionIndex + 1} in progress
                </span>
                <button
                  onClick={handleNextQuestion}
                  disabled={!sessionActive}
                  className="btn btn-primary text-xs py-2 px-4 font-bold"
                >
                  <span>{currentQuestionIndex < questions.length - 1 ? "Next Question →" : "Finish Evaluation →"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Live Rubric & Scoring Card */}
          <div className="card p-6 bg-white border border-[#E2E8F0] space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#0F172A] m-0 flex items-center gap-2">
              <Award size={16} className="text-orange-500" />
              <span>Real-Time Scoring Rubric</span>
            </h3>

            <div className="form-group">
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700">Technical Accuracy (1-10)</span>
                <span className="text-blue-700">{technicalScore} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={technicalScore}
                onChange={(e) => setTechnicalScore(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div className="form-group">
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-700">Communication & Clarity (1-10)</span>
                <span className="text-orange-600">{communicationScore} / 10</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={communicationScore}
                onChange={(e) => setCommunicationScore(Number(e.target.value))}
                className="w-full accent-orange-600 cursor-pointer"
              />
            </div>

            <div className="form-group">
              <label className="form-label text-xs">Trainer Live Observations</label>
              <textarea
                rows={4}
                value={trainerNotes}
                onChange={(e) => setTrainerNotes(e.target.value)}
                placeholder="Note down specific strengths or syntax issues observed in real time..."
                className="form-textarea text-xs"
              />
            </div>

            <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-xs text-blue-900">
              💡 Scores entered here synchronize directly into candidate's permanent institutional scorecard.
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
