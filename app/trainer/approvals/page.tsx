"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  CheckCircle2,
  AlertCircle,
  Sparkles,
  MessageSquare,
  Clock,
  User,
  Check,
  X,
  FileCheck2,
  ChevronDown,
} from "lucide-react";

interface EvaluationItem {
  id: string;
  studentName: string;
  studentEmail: string;
  technology: string;
  interviewType: string;
  difficulty: string;
  scheduledAt: string;
  status: string;
  history: Array<{
    turn: number;
    question: string;
    studentAnswer: string;
    feedback: string;
    score: number;
  }>;
  scorecard?: {
    overallScore: number;
    trainerRemarks?: string;
  };
}

export default function TrainerApprovalsPage() {
  const [items, setItems] = useState<EvaluationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<EvaluationItem | null>(null);
  const [remarks, setRemarks] = useState("");
  const [approving, setApproving] = useState(false);
  const [toastMsg, setToastMsg] = useState("");

  const loadData = () => {
    fetch("/api/interviews")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data && data.data.interviews) {
          const list: EvaluationItem[] = data.data.interviews;
          setItems(list);
          const firstPending = list.find((i) => i.status === "pending_evaluation");
          if (firstPending) {
            setSelectedItem(firstPending);
            setRemarks(firstPending.scorecard?.trainerRemarks || "Solid technical grasp. Verified and approved.");
          } else if (list.length > 0) {
            setSelectedItem(list[0]);
            setRemarks(list[0].scorecard?.trainerRemarks || "");
          }
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async () => {
    if (!selectedItem) return;
    setApproving(true);
    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve_scorecard",
          interviewId: selectedItem.id,
          remarks: remarks || "Approved by faculty lead.",
          approved: true,
        }),
      });

      if (res.ok) {
        setToastMsg(`Official scorecard published for ${selectedItem.studentName}!`);
        setTimeout(() => setToastMsg(""), 3500);
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setApproving(false);
    }
  };

  return (
    <AppShell role="trainer" userName="Rahul Sir (Lead Faculty)" userEmail="rahul.sir@linktest.io">
      <div className="max-w-[1400px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E2E8F0] gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
                EVALUATION QUEUE
              </span>
              <span className="text-xs text-[#64748B]">• Candidate Scorecard Verification</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Interview Evaluation & Approval Queue
            </h1>
            <p className="text-sm text-[#475569] mt-0.5">
              Review AI-conducted voice mock transcripts, inspect candidate performance, add faculty remarks, and publish scores.
            </p>
          </div>
        </div>

        {toastMsg && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* 2-Column Layout: Left List & Right Transcript/Review Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left Session Queue */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
              Active Evaluations ({items.length})
            </h3>

            {items.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              const isPending = item.status === "pending_evaluation";
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedItem(item);
                    setRemarks(item.scorecard?.trainerRemarks || "Solid technical foundation. Recommended for client mock round.");
                  }}
                  className={`card p-4 cursor-pointer transition-all ${
                    isSelected
                      ? "border-blue-600 ring-2 ring-blue-500/20 shadow-md"
                      : "border-[#E2E8F0] hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="font-bold text-sm text-[#0F172A]">{item.studentName}</span>
                    {isPending ? (
                      <span className="badge badge-warning text-[10px]">Needs Review</span>
                    ) : item.status === "completed" ? (
                      <span className="badge badge-success text-[10px]">Published</span>
                    ) : (
                      <span className="badge badge-blue text-[10px]">Scheduled</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-600 mb-2">
                    <span className="font-semibold text-blue-700">{item.technology}</span>
                    <span>•</span>
                    <span className="capitalize text-slate-500">{item.difficulty}</span>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Turns: {item.history?.length || 0} recorded
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Inspector & Form */}
          <div className="lg:col-span-2 space-y-5">
            {selectedItem ? (
              <div className="card p-6 bg-white border border-[#E2E8F0] space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F0] gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-extrabold text-[#0F172A] m-0">
                        {selectedItem.studentName}
                      </h2>
                      <span className="text-xs font-mono text-slate-400">({selectedItem.id})</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedItem.studentEmail} • {selectedItem.technology} ({selectedItem.difficulty})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedItem.status === "completed" ? (
                      <span className="badge badge-success text-xs py-1 px-3">
                        Scorecard Published
                      </span>
                    ) : (
                      <span className="badge badge-warning text-xs py-1 px-3">
                        Awaiting Faculty Sign-Off
                      </span>
                    )}
                  </div>
                </div>

                {/* Candidate Turn Transcripts */}
                <div className="space-y-4">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Recorded Audio Answers & AI Turn Evaluation
                  </h3>

                  {selectedItem.history && selectedItem.history.length > 0 ? (
                    selectedItem.history.map((turn) => (
                      <div
                        key={turn.turn}
                        className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-blue-700">
                            Question {turn.turn}
                          </span>
                          <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#FFEDD5] text-[#C2410C] border border-[#FED7AA]">
                            Turn Score: {turn.score} / 10
                          </span>
                        </div>

                        <div className="text-xs font-bold text-slate-900 leading-snug">
                          {turn.question}
                        </div>

                        <div className="p-3 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Candidate Transcript Response:
                          </span>
                          <p className="m-0 italic leading-relaxed">
                            "{turn.studentAnswer}"
                          </p>
                        </div>

                        <div className="text-xs text-slate-600 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                          <span className="font-bold text-blue-900">AI Feedback: </span>
                          <span>{turn.feedback}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-200">
                      No turns recorded yet for this session. Candidate is currently scheduled to take interview.
                    </div>
                  )}
                </div>

                {/* Trainer Authority Remarks & Final Scorecard Approval */}
                <div className="pt-4 border-t border-[#E2E8F0] space-y-3">
                  <div className="flex items-center gap-2 text-slate-800">
                    <MessageSquare size={16} className="text-orange-500" />
                    <label className="text-xs font-bold uppercase tracking-wider">
                      Faculty Lead Remarks & Placement Clearance
                    </label>
                  </div>

                  <textarea
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Add your authoritative faculty assessment, strengths, and recommendations..."
                    className="form-textarea text-xs"
                  />

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={handleApprove}
                      disabled={approving}
                      className="btn btn-primary text-xs py-2 px-5 font-bold"
                    >
                      <Check size={14} />
                      <span>{approving ? "Publishing Scorecard..." : "Approve & Publish Official Scorecard"}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card p-12 text-center text-slate-400">
                Select an interview session from the left queue to inspect turns and publish scores.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
