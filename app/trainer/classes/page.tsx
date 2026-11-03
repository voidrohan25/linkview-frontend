'use client';

import React, { useEffect, useState, useRef } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/lib/authContext';
import { 
  Video, 
  Mic, 
  Camera, 
  Users, 
  BarChart2, 
  Clock, 
  Radio, 
  Send, 
  CheckCircle2,
  Sparkles,
  Wifi,
  ShieldCheck
} from 'lucide-react';
import { LiveClassSession } from '@/app/api/live-classes/route';

export default function TrainerClassesPage() {
  const [session, setSession] = useState<LiveClassSession | null>(null);
  const [cameraReqSent, setCameraReqSent] = useState(false);
  const [liveKitInfo, setLiveKitInfo] = useState<{ isConfigured: boolean; wsUrl: string; token: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const fetchSession = () => {
    fetch('/api/live-classes')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setSession(res.data);
      });
  };

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 12000);

    // Fetch LiveKit WebRTC credentials
    fetch('/api/live-classes/token?room=live-dsa-class-1&identity=trainer-kulkarni&role=trainer')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setLiveKitInfo(res.data);
      })
      .catch((err) => console.error('LiveKit token fetch failed:', err));

    return () => clearInterval(interval);
  }, []);

  // Request students to enable webcams
  const handleRequestCamera = async () => {
    try {
      await fetch('/api/live-classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request_camera' }),
      });
      setCameraReqSent(true);
      setTimeout(() => setCameraReqSent(false), 5000);
      fetchSession();
    } catch (err) {
      console.error(err);
    }
  };

  const { user: authUser } = useAuth();

  return (
    <ProtectedRoute allowedRoles={["trainer"]}>
      <AppShell role="trainer" userName={authUser?.fullName || "Faculty Trainer"} userEmail={authUser?.email}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-rose-600 text-xs font-bold uppercase tracking-wider mb-1">
              <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse"></span>
              <span>Live Broadcast Studio</span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-slate-900">
              {session?.title || 'Data Structures & Algorithms Live Class'}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-900 text-white">
              {session?.attendeesCount || 142} Students Connected
            </span>
            <button
              onClick={handleRequestCamera}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow transition-colors cursor-pointer"
            >
              <Camera className="h-4 w-4" />
              <span>Request Student Cameras</span>
            </button>
          </div>
        </div>

        {/* LiveKit Cloud Status Pill */}
        <div className="flex items-center justify-between p-3 rounded-xl border text-xs bg-white shadow-sm">
          <div className="flex items-center gap-2">
            <Wifi className={`h-4 w-4 ${liveKitInfo?.isConfigured ? 'text-emerald-600' : 'text-indigo-600'}`} />
            <span className="font-semibold text-slate-800">LiveKit WebRTC Media Server:</span>
            {liveKitInfo?.isConfigured ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                LiveKit Cloud Connected · {liveKitInfo.wsUrl}
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-indigo-50 text-indigo-700 border border-indigo-200">
                Ready · Add LIVEKIT_API_KEY in Vercel to route WebRTC media through cloud servers
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 font-mono">Room: live-dsa-class-1</span>
        </div>

        {cameraReqSent && (
          <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl text-xs text-indigo-900 font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-indigo-600" />
            <span>Opt-in camera activation request dispatched to connected students.</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Classroom Screen */}
          <div className="lg:col-span-8 bg-slate-950 rounded-2xl border border-slate-800 p-4 overflow-hidden text-white flex flex-col justify-between shadow-2xl min-h-[460px]">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-3 border-b border-slate-800">
              <span className="font-mono text-emerald-400 flex items-center gap-2">
                <Radio className="h-4 w-4 animate-pulse text-rose-500" /> 1080p 60fps HD SFU Broadcast
              </span>
              <span>Audio: Active (Studio Mic)</span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="h-20 w-20 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <Video className="h-10 w-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-100">Live Stage: Data Structures & System Design</h3>
                <p className="text-xs text-slate-400 mt-1">
                  SFU room adapter active. Live media bandwidth separated from app web servers.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400">
              <span>Interactive Controls: Microphone On · Screen Share Ready</span>
              <span className="bg-rose-600/20 text-rose-400 px-2.5 py-1 rounded-md font-mono text-[11px] font-bold">
                Live Session Active
              </span>
            </div>
          </div>

          {/* Right Panel: Live In-Class Poll Telemetry */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-indigo-600" />
                <span>Live In-Lecture MCQ Poll</span>
              </h3>
              <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Live Polling
              </span>
            </div>

            {session?.activePoll ? (
              <div className="space-y-4">
                <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                  {session.activePoll.question}
                </p>

                <div className="space-y-2.5 text-xs">
                  {session.activePoll.options.map((opt) => {
                    const count = session.activePoll?.responsesCount[opt] || 0;
                    const total = Object.values(session.activePoll?.responsesCount || {}).reduce((a, b) => a + b, 0) || 1;
                    const pct = Math.round((count / total) * 100);
                    const isCorrect = opt === session.activePoll?.correctAnswer;

                    return (
                      <div key={opt} className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className={isCorrect ? 'font-bold text-emerald-700' : 'text-slate-600'}>
                            {opt} {isCorrect && '✓'}
                          </span>
                          <span className="font-mono text-slate-400">{count} ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${isCorrect ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">No active poll in session.</p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  </ProtectedRoute>
);
}
