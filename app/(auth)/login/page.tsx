"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Mail, ShieldAlert, Sparkles, CheckCircle2, ShieldCheck, User, Users } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performLogin = async (loginEmail: string, loginPassword?: string, isGoogle = false) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
          provider: isGoogle ? "google" : "email",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Authentication failed. Please verify credentials.");
      }

      // Persist auth token/user details in localStorage for client state
      if (typeof window !== "undefined") {
        localStorage.setItem("linktest_current_user", JSON.stringify(data.user));
        localStorage.setItem("linktest_current_role", data.role);
      }

      router.push(data.redirectTo || "/student/dashboard");
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || "Failed to authenticate");
      setLoading(false);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    performLogin(email, password, false);
  };

  const handleGoogleSignIn = () => {
    // In production, triggers Supabase / Google OAuth redirect.
    // In local demo/testing, prompts or defaults to a Google student session.
    const googleEmail = prompt(
      "Enter your Google Account email to sign in:\n(Any Gmail ID automatically enters as Student. Admin emails enter as Admin)",
      "student.interviewx@gmail.com"
    );
    if (googleEmail) {
      performLogin(googleEmail, undefined, true);
    }
  };

  // Quick preset helper for development/testing
  const fillPreset = (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setError(null);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6"
      style={{
        background: "radial-gradient(circle at 50% 15%, rgba(249, 115, 22, 0.08) 0%, #0F172A 100%)",
      }}
    >
      <div className="card max-w-[460px] w-full p-8 sm:p-10 bg-white border border-[#E2E8F0] shadow-2xl rounded-2xl space-y-6">
        {/* Brand Identity Header */}
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-[#EA580C] to-[#F97316] flex items-center justify-center font-extrabold text-white text-2xl mx-auto shadow-md">
            L
          </div>
          <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
            Link<span className="text-[#F97316]">Test</span>
          </h1>
          <p className="text-xs text-[#64748B] font-medium">
            AI Mock Interview & Placement Preparation Platform
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
            <Sparkles size={11} className="text-orange-500" />
            <span>Academic Session 2026-27</span>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <ShieldAlert size={16} className="shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* 1. Primary Auth: Continue with Google */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 transition-all shadow-sm active:scale-[0.99] disabled:opacity-50"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </button>

        <div className="text-[11px] text-center text-slate-500">
          All new Google accounts securely enter as <strong className="text-orange-600">Student</strong>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200"></div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            or sign in with institute email
          </span>
          <div className="flex-1 h-px bg-slate-200"></div>
        </div>

        {/* 2. Institute Email / Admin Password Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <div className="form-group space-y-1">
            <label className="form-label text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Mail size={13} className="text-slate-400" />
              <span>Email Address</span>
            </label>
            <input
              type="email"
              required
              placeholder="e.g. rahul.sir@linktest.io or student@college.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input text-xs w-full py-2.5 px-3 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <div className="form-group space-y-1">
            <div className="flex items-center justify-between">
              <label className="form-label text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Lock size={13} className="text-slate-400" />
                <span>Password</span>
              </label>
              <span className="text-[11px] font-semibold text-orange-600 hover:underline cursor-pointer">
                Forgot?
              </span>
            </div>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input text-xs font-mono w-full py-2.5 px-3 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full text-xs py-2.5 font-bold shadow-md justify-center rounded-xl bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
          >
            <span>{loading ? "Authenticating..." : "Sign In to LinkTest"}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        {/* Rapid Test Account Fillers */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block text-center">
            Quick Fill Demo Accounts:
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => fillPreset("rahul.sir@linktest.io", "RahulSir@2026")}
              className="px-2 py-1.5 rounded-lg text-[11px] font-bold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
            >
              Rahul Sir (Admin)
            </button>
            <button
              type="button"
              onClick={() => fillPreset("priya.nambiar@linktest.io", "Trainer@2026")}
              className="px-2 py-1.5 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
            >
              Trainer Priya
            </button>
            <button
              type="button"
              onClick={() => fillPreset("aarav.sharma@linktest.io", "Student@2026")}
              className="px-2 py-1.5 rounded-lg text-[11px] font-bold bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors"
            >
              Student Aarav
            </button>
          </div>
        </div>

        {/* Institutional Contact Footer */}
        <div className="text-center text-[11px] text-slate-500 pt-2 border-t border-slate-100">
          <span>Trainer access requires promotion by </span>
          <strong className="text-slate-800">Rahul Sir (Founder & Admin)</strong>
        </div>
      </div>
    </div>
  );
}
