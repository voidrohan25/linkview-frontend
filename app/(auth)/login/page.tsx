"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Lock, Mail, ShieldAlert, Sparkles, CheckCircle2, ShieldCheck, UserCheck, KeyRound, RotateCcw } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { useAuth } from "@/lib/authContext";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithPassword, loginWithGoogleEmail, status, role } = useAuth();

  const initialTab = searchParams.get("role") === "admin" ? "admin" : "candidate";
  const [activeTab, setActiveTab] = useState<"candidate" | "admin">(initialTab);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleInputEmail, setGoogleInputEmail] = useState("");

  // Auto redirect if already verified in active session
  useEffect(() => {
    if (status === "READY" && role) {
      if (role === "admin") {
        const adminToken = typeof window !== "undefined" ? sessionStorage.getItem("linktest_admin_token") : null;
        if (adminToken === "linktest_admin_valid_token_2026") {
          router.replace("/admin/dashboard");
        }
      } else {
        router.replace(`/${role}/dashboard`);
      }
    }
  }, [status, role, router]);

  const performLogin = async (loginEmail: string, loginPassword?: string, isGoogle = false) => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (isGoogle) {
        const res = await loginWithGoogleEmail(loginEmail);
        router.push(res.redirectTo);
      } else {
        const res = await loginWithPassword(loginEmail, loginPassword);
        router.push(res.redirectTo);
      }
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
    if (activeTab === "admin" && !password.trim()) {
      setError("Please enter the fixed admin password (e.g. RahulSir@2026)");
      return;
    }
    performLogin(email, password, false);
  };

  const handleFillAdminCredentials = () => {
    setEmail("rahul.sir@linktest.io");
    setPassword("RahulSir@2026");
    setError(null);
  };

  const handleClearAllStorage = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch {}
      setSuccessMsg("All browser session cache purged. You can now test a completely clean sign-in.");
      setTimeout(() => {
        window.location.href = "/login";
      }, 800);
    }
  };

  const handleGoogleSignInClick = async () => {
    setError(null);
    if (isSupabaseConfigured) {
      try {
        setLoading(true);
        const { error: oauthErr } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
            queryParams: {
              access_type: "offline",
              prompt: "select_account",
            },
          },
        });
        if (oauthErr) {
          console.warn("Supabase OAuth note:", oauthErr.message);
          setGoogleModalOpen(true);
        }
      } catch (err) {
        console.warn("OAuth fallback note:", err);
        setGoogleModalOpen(true);
      } finally {
        setLoading(false);
      }
    } else {
      setGoogleModalOpen(true);
    }
  };

  const handleGoogleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleInputEmail.trim()) return;
    setGoogleModalOpen(false);
    performLogin(googleInputEmail.trim(), undefined, true);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6"
      style={{
        background: "radial-gradient(circle at 50% 15%, rgba(249, 115, 22, 0.08) 0%, #0F172A 100%)",
      }}
    >
      <div className="card max-w-[480px] w-full p-8 sm:p-10 bg-white border border-[#E2E8F0] shadow-2xl rounded-2xl space-y-6">
        {/* Brand Identity Header */}
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-[#EA580C] to-[#F97316] flex items-center justify-center font-extrabold text-white text-2xl mx-auto shadow-md">
            L
          </div>
          <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
            Link<span className="text-[#F97316]">Test</span>
          </h1>
          <p className="text-xs text-[#64748B] font-medium">
            Next-Gen AI Mock Interview & Diagnostic Evaluation Platform
          </p>
        </div>

        {/* Portal Mode Selector */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-bold border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setActiveTab("candidate");
              setError(null);
            }}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === "candidate"
                ? "bg-white text-slate-900 shadow-sm border border-slate-200/60 font-extrabold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <UserCheck size={14} className={activeTab === "candidate" ? "text-orange-600" : "text-slate-400"} />
            <span>Candidate Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("admin");
              setError(null);
              if (!email) {
                setEmail("rahul.sir@linktest.io");
                setPassword("RahulSir@2026");
              }
            }}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === "admin"
                ? "bg-white text-purple-900 shadow-sm border border-slate-200/60 font-extrabold"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <KeyRound size={14} className={activeTab === "admin" ? "text-purple-600" : "text-slate-400"} />
            <span>Admin Console</span>
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <ShieldAlert size={16} className="shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ================= CANDIDATE MODE ================= */}
        {activeTab === "candidate" && (
          <div className="space-y-4">
            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleSignInClick}
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

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                or candidate email
              </span>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="form-group space-y-1">
                <label className="form-label text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Mail size={13} className="text-slate-400" />
                  <span>Candidate Email</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="candidate@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input text-xs w-full py-2.5 px-3 rounded-xl border border-slate-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full text-xs py-2.5 font-bold shadow-md justify-center rounded-xl bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
              >
                <span>{loading ? "Authenticating..." : "Sign In to Candidate Portal"}</span>
                <ArrowRight size={14} />
              </button>
            </form>
          </div>
        )}

        {/* ================= ADMIN FIXED CREDENTIALS MODE ================= */}
        {activeTab === "admin" && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 text-xs text-purple-900 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold flex items-center gap-1.5 text-purple-950">
                  <ShieldCheck size={15} className="text-purple-700" />
                  Fixed Credentials Enforced
                </span>
                <button
                  type="button"
                  onClick={handleFillAdminCredentials}
                  className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-200 hover:bg-purple-300 text-purple-900 transition-colors"
                >
                  ⚡ Auto-Fill Credentials
                </button>
              </div>
              <p className="text-[11px] text-purple-800 leading-relaxed m-0">
                Email: <code className="font-mono font-bold bg-white px-1 py-0.5 rounded">rahul.sir@linktest.io</code><br />
                Password: <code className="font-mono font-bold bg-white px-1 py-0.5 rounded">RahulSir@2026</code>
              </p>
            </div>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="form-group space-y-1">
                <label className="form-label text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Mail size={13} className="text-slate-400" />
                  <span>Admin Email</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="rahul.sir@linktest.io"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input text-xs w-full py-2.5 px-3 rounded-xl border border-slate-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <div className="form-group space-y-1">
                <label className="form-label text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Lock size={13} className="text-slate-400" />
                  <span>Fixed Admin Password</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="RahulSir@2026"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input text-xs font-mono w-full py-2.5 px-3 rounded-xl border border-slate-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full text-xs py-2.5 font-bold shadow-md justify-center rounded-xl bg-purple-700 hover:bg-purple-800 text-white flex items-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
              >
                <span>{loading ? "Verifying Fixed Credentials..." : "Authenticate as Administrator"}</span>
                <ArrowRight size={14} />
              </button>
            </form>
          </div>
        )}

        {/* Clean Storage / Session Reset Button */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={13} className="text-emerald-600" />
            <span>Strict 3-Role Authorization</span>
          </div>

          <button
            type="button"
            onClick={handleClearAllStorage}
            className="text-slate-500 hover:text-red-600 flex items-center gap-1 font-semibold transition-colors"
            title="Purge localStorage and sessionStorage cache"
          >
            <RotateCcw size={11} />
            <span>Clear Session Cache</span>
          </button>
        </div>
      </div>

      {/* Clean Modal for Google Sign-In Fallback */}
      {googleModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content max-w-sm p-6 bg-white rounded-2xl shadow-2xl space-y-4">
            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-slate-900 m-0">Sign in with Google</h3>
              <p className="text-xs text-slate-500 m-0">
                Enter your Google Account email. All new candidate accounts securely enter with Candidate privileges.
              </p>
            </div>

            <form onSubmit={handleGoogleModalSubmit} className="space-y-3">
              <input
                type="email"
                required
                placeholder="you@gmail.com"
                value={googleInputEmail}
                onChange={(e) => setGoogleInputEmail(e.target.value)}
                className="w-full text-xs py-2.5 px-3 rounded-xl border border-slate-300 focus:border-orange-500 focus:outline-none"
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setGoogleModalOpen(false)}
                  className="btn btn-outline text-xs py-2 px-3 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-xs py-2 px-4 font-bold"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0F172A] text-white">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
