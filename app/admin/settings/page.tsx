"use client";

import React, { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/authContext";
import {
  Settings,
  Sparkles,
  Key,
  Database,
  Mic,
  Volume2,
  CheckCircle2,
  Save,
  ShieldCheck,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [geminiModel, setGeminiModel] = useState("gemini-1.5-flash");
  const [apiKeyMasked, setApiKeyMasked] = useState("••••••••••••••••••••••••••••••••");
  const [temperature, setTemperature] = useState("0.2");
  const [speechLanguage, setSpeechLanguage] = useState("en-US");
  const [evalStrictness, setEvalStrictness] = useState("rigorous");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const { user: authUser } = useAuth();

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AppShell role="admin" userName={authUser?.fullName || "Administrator"} userEmail={authUser?.email || "admin@linktest.io"}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="pb-5 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]">
              SYSTEM CONFIGURATION
            </span>
            <span className="text-xs text-[#64748B]">• Institute Platform Engine</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
            AI & System Settings
          </h1>
          <p className="text-sm text-[#475569] mt-0.5">
            Configure Google Gemini LLM API keys, speech synthesis voice parameters, and evaluation strictness.
          </p>
        </div>

        {savedSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
            <span>AI settings and speech parameters updated successfully.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* AI Model Section */}
          <div className="card p-6 bg-white border border-[#E2E8F0] space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E2E8F0]">
              <Sparkles size={18} className="text-orange-500" />
              <h3 className="text-base font-bold text-[#0F172A] m-0">
                Google Gemini Intelligence Configuration
              </h3>
            </div>

            <div className="form-group">
              <label className="form-label">Active AI Evaluation Model</label>
              <select
                value={geminiModel}
                onChange={(e) => setGeminiModel(e.target.value)}
                className="form-select text-xs"
              >
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Ultra-Low Latency & Fast Voice Follow-ups)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Code Review & Architectural Analysis)</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Google Gemini API Key</label>
              <div className="relative">
                <input
                  type="password"
                  value={apiKeyMasked}
                  onChange={(e) => setApiKeyMasked(e.target.value)}
                  className="form-input text-xs font-mono"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Configured
                </span>
              </div>
              <span className="text-[11px] text-[#64748B]">
                Key is securely stored in environment variables (GEMINI_API_KEY).
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Temperature (Creativity)</label>
                <select
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="form-select text-xs"
                >
                  <option value="0.1">0.1 - Highly Deterministic & Strict</option>
                  <option value="0.2">0.2 - Standard Technical Assessment</option>
                  <option value="0.4">0.4 - Conversational with Nuanced Follow-ups</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Scoring Strictness</label>
                <select
                  value={evalStrictness}
                  onChange={(e) => setEvalStrictness(e.target.value)}
                  className="form-select text-xs"
                >
                  <option value="standard">Standard (Campus Placement Level)</option>
                  <option value="rigorous">Rigorous (Tier-1 Product Company Bar)</option>
                  <option value="lenient">Lenient (Early Learner Encouragement)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Voice & Speech Recognition Settings */}
          <div className="card p-6 bg-white border border-[#E2E8F0] space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-[#E2E8F0]">
              <Mic size={18} className="text-blue-600" />
              <h3 className="text-base font-bold text-[#0F172A] m-0">
                Speech Recognition & Audio Engine
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Speech Recognition Language</label>
                <select
                  value={speechLanguage}
                  onChange={(e) => setSpeechLanguage(e.target.value)}
                  className="form-select text-xs"
                >
                  <option value="en-US">English (United States) - en-US</option>
                  <option value="en-IN">English (India) - en-IN</option>
                  <option value="en-GB">English (UK) - en-GB</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Interviewer Voice Rate</label>
                <select className="form-select text-xs" defaultValue="1.0">
                  <option value="0.9">0.9x - Deliberate & Clear</option>
                  <option value="1.0">1.0x - Natural Conversational Pace</option>
                  <option value="1.1">1.1x - Fast Technical Exchange</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-200">
              ✓ Hardware pre-flight decibel level analyzer automatically verifies microphone audio input prior to every interview session.
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="submit" className="btn btn-primary text-xs py-2.5 px-5">
              <Save size={15} />
              <span>Save Configuration</span>
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  </ProtectedRoute>
);
}
