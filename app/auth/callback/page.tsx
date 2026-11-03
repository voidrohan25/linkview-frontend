'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, AlertCircle } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Verifying Google credentials and resolving account role...');
  const [error, setError] = useState('');

  useEffect(() => {
    async function handleAuth() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (session?.user?.email) {
          const email = session.user.email;
          const fullName =
            session.user.user_metadata?.full_name ||
            session.user.user_metadata?.name ||
            email.split("@")[0];

          if (typeof window !== "undefined") {
            localStorage.setItem(
              "linktest_current_user",
              JSON.stringify({
                id: session.user.id,
                email: email,
                fullName: fullName,
                role: "student",
              })
            );
            localStorage.setItem("linktest_current_role", "student");
          }

          const res = await fetch('/api/auth/me', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
          const authData = await res.json();
          if (authData.success) {
            if (authData.user && typeof window !== "undefined") {
              localStorage.setItem("linktest_current_user", JSON.stringify({
                ...authData.user,
                fullName: authData.user.fullName || fullName,
              }));
              localStorage.setItem("linktest_current_role", authData.role || "student");
            }
            router.push(authData.redirectTo);
          } else {
            router.push('/student/dashboard');
          }
        } else {
          // If no active session detected, redirect to student login
          router.push('/login');
        }
      } catch (err: unknown) {
        const e = err as Error;
        setError(e.message || 'Authentication callback failed.');
      }
    }

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans p-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-md w-full text-center space-y-4">
        <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
          <ShieldCheck className="h-6 w-6 animate-pulse" />
        </div>
        <h3 className="text-lg font-serif font-bold text-slate-900">Link Test Authentication</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          {error ? (
            <span className="text-rose-600 flex items-center justify-center gap-1">
              <AlertCircle className="h-4 w-4" /> {error}
            </span>
          ) : (
            status
          )}
        </p>
      </div>
    </div>
  );
}
