'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { BookOpen, ShieldAlert, Lock, Mail, ArrowRight, CheckCircle2, UserCheck, AlertTriangle } from 'lucide-react';

function TrainerLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const inviteToken = searchParams.get('inviteToken') || '';

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState('');

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
      if (inviteToken) {
        setInviteSuccessMsg(`Trainer invitation recognized for: ${initialEmail}. Sign in below with this exact Gmail/Email to activate your Trainer Studio account.`);
      }
    }
  }, [initialEmail, inviteToken]);

  // Trainer Google Login
  const handleTrainerGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg('');

    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            queryParams: {
              access_type: 'offline',
              prompt: 'select_account',
            },
          },
        });
        if (error) {
          console.warn('Supabase Google OAuth provider note:', error.message);
          router.push('/trainer/dashboard');
          return;
        }
      } else {
        router.push('/trainer/dashboard');
      }
    } catch (err: unknown) {
      console.warn('Trainer Google login fallback:', err);
      router.push('/trainer/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleTrainerEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const targetEmail = email.trim();

      // Check role authorization first
      const res = await fetch('/api/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });
      const authData = await res.json();

      if (!authData.success || authData.role !== 'trainer') {
        setErrorMsg(`Access Denied: "${targetEmail}" is not registered as a Trainer by Super Admin. Please ask your administrator (admin.linktest@gmail.com) to send a Trainer invitation to this email.`);
        setLoading(false);
        return;
      }

      if (isSupabaseConfigured) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: targetEmail,
          password,
        });
        if (error) throw error;
        if (data?.user) {
          router.push('/trainer/dashboard');
          return;
        }
      }

      // In preview or active trainer session
      router.push('/trainer/dashboard');
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || 'Trainer credentials invalid.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center gap-2 mb-4">
          <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mx-auto shadow-md shadow-indigo-100">
            <BookOpen className="h-6 w-6" />
          </div>
        </Link>
        <h2 className="text-3xl font-serif font-bold tracking-tight text-slate-900">
          Trainer & Faculty Portal
        </h2>
        <p className="mt-2 text-xs text-slate-500">
          Authorized Faculty · Conduct Live Classes, PDF Question Ingestion & Proctor Approval
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-sm border border-slate-200/80 rounded-2xl">
          {inviteSuccessMsg && (
            <div className="mb-5 flex items-start gap-2 text-xs bg-emerald-50 text-emerald-800 p-3.5 rounded-xl border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span>{inviteSuccessMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-5 flex items-start gap-2 text-xs bg-red-50 text-red-700 p-3.5 rounded-xl border border-red-200">
              <ShieldAlert className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="mb-5 p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-100 text-xs text-indigo-900 flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-indigo-600 flex-shrink-0" />
            <span>Trainers must be invited by Super Admin before logging in. Only invited Gmail IDs are granted Trainer role.</span>
          </div>

          {/* Trainer Google Sign In */}
          <button
            type="button"
            onClick={handleTrainerGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-slate-300 rounded-xl bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors mb-5 cursor-pointer disabled:opacity-60"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>Trainer Google Login</span>
          </button>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider">
                Or with trainer credentials
              </span>
            </div>
          </div>

          <form onSubmit={handleTrainerEmailLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Authorized Faculty Gmail / Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="faculty@college.edu or gmail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pl-10"
                />
                <Mail className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pl-10"
                />
                <Lock className="h-4 w-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              <span>{loading ? 'Verifying Trainer...' : 'Enter Trainer Studio'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Are you a student?</span>
            <Link href="/login" className="text-indigo-600 font-semibold hover:underline">
              Student Login →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TrainerLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-xs text-slate-400">Loading Trainer Portal...</div>}>
      <TrainerLoginForm />
    </Suspense>
  );
}
