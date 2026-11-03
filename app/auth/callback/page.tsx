'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/authContext';
import { ShieldCheck, AlertCircle } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { loginWithGoogleEmail } = useAuth();
  const [status, setStatus] = useState('Verifying Google credentials and resolving authoritative database role...');
  const [error, setError] = useState('');
  const executedRef = useRef(false);

  useEffect(() => {
    if (executedRef.current) return;
    executedRef.current = true;

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

          const avatarUrl =
            session.user.user_metadata?.avatar_url ||
            session.user.user_metadata?.picture ||
            undefined;

          const result = await loginWithGoogleEmail(email, fullName, avatarUrl);
          router.replace(result.redirectTo);
        } else {
          // If no active session detected, redirect to student login
          router.replace('/login');
        }
      } catch (err: unknown) {
        const e = err as Error;
        setError(e.message || 'Authentication callback failed.');
      }
    }

    handleAuth();
  }, [loginWithGoogleEmail, router]);

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
