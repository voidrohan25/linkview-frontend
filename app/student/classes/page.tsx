'use client';

import React, { useEffect, useState, useRef } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { 
  Video, 
  Camera, 
  Clock, 
  CheckCircle2, 
  Radio, 
  Users, 
  Send,
  Wifi,
  Sparkles
} from 'lucide-react';
import { LiveClassSession } from '@/app/api/live-classes/route';

export default function StudentClassesPage() {
  const [session, setSession] = useState<LiveClassSession | null>(null);
  const [cameraPrompt, setCameraPrompt] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [pollResult, setPollResult] = useState<{ isCorrect: boolean; correctAnswer: string } | null>(null);
  const [liveKitInfo, setLiveKitInfo] = useState<{ isConfigured: boolean; wsUrl: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const fetchSession = () => {
    fetch('/api/live-classes')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setSession(res.data);
          if (res.data.cameraRequestSent && !cameraEnabled) {
            setCameraPrompt(true);
          }
        }
      });
  };

  useEffect(() => {
    fetchSession();
    const interval = setInterval(fetchSession, 3000);

    // Fetch student LiveKit room token
    fetch('/api/live-classes/token?room=live-dsa-class-1&identity=student-me&role=student')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setLiveKitInfo(res.data);
      })
      .catch((err) => console.error('LiveKit token fetch failed:', err));

    return () => clearInterval(interval);
  }, [cameraEnabled]);

  const handleAcceptCamera = () => {
    navigator.mediaDevices
      ?.getUserMedia({ video: true })
      .then((stream) => {
        setCameraEnabled(true);
        setCameraPrompt(false);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => {
        setCameraPrompt(false);
      });
  };

  const handleAnswerPoll = async (opt: string) => {
    if (!session?.activePoll || selectedAnswer) return;
    setSelectedAnswer(opt);
    try {
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pollId: session.activePoll.id,
          answer: opt,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPollResult({
          isCorrect: data.isCorrect,
          correctAnswer: data.correctAnswer,
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AppShell role="student" userName="Rahul Sharma">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-rose-600 text-xs font-bold uppercase tracking-wider mb-1">
              <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse"></span>
              <span>Interactive Live Lecture</span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-slate-900">
              {session?.title || 'Data Structures & Algorithms Live Class'}
            </h2>
            <p className="text-xs text-slate-500">Instructor: {session?.trainerName || 'Prof. S. Kulkarni'}</p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-900 text-white flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span>{session?.attendeesCount || 142} Examinees In Session</span>
            </span>
          </div>
        </div>

        {/* LiveKit Connection Indicator */}
        <div className="flex items-center justify-between p-3 rounded-xl border text-xs bg-white shadow-sm">
          <div className="flex items-center gap-2">
            <Wifi className={`h-4 w-4 ${liveKitInfo?.isConfigured ? 'text-emerald-600' : 'text-indigo-600'}`} />
            <span className="font-semibold text-slate-800">Media Stream:</span>
            {liveKitInfo?.isConfigured ? (
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-50 text-emerald-700">
                LiveKit Cloud WebRTC Stream · Connected
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-indigo-50 text-indigo-700">
                Interactive High-Fidelity Broadcast Active
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-400 font-mono">1080p SFU</span>
        </div>

        {/* Opt-in Camera Prompt Triggered by Trainer */}
        {cameraPrompt && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div>
                <p className="font-bold">Faculty Camera Presence Check</p>
                <p className="text-[11px] text-amber-700">
                  Prof. S. Kulkarni has requested student video verification for this lecture segment.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCameraPrompt(false)}
                className="px-3 py-1.5 rounded-lg border border-amber-300 text-amber-800 font-semibold cursor-pointer text-xs"
              >
                Dismiss
              </button>
              <button
                onClick={handleAcceptCamera}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold cursor-pointer text-xs shadow"
              >
                Enable Camera
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Classroom Screen */}
          <div className="lg:col-span-8 bg-slate-950 rounded-2xl border border-slate-800 p-4 text-white flex flex-col justify-between shadow-2xl min-h-[440px] relative">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-3 border-b border-slate-800">
              <span className="font-mono text-emerald-400 flex items-center gap-2">
                <Radio className="h-4 w-4 animate-pulse text-rose-500" /> Live Stream In Session
              </span>
              <span>Ultra-Low Latency SFU</span>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="h-16 w-16 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                <Video className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">Live Stage: Data Structures & System Design</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Topic: Self-Balancing Trees (AVL vs Red-Black Trees) & Graph Shortest Paths
                </p>
              </div>
            </div>

            {/* Inset Student Camera Feed when enabled */}
            {cameraEnabled && (
              <div className="absolute bottom-14 right-4 h-28 w-40 rounded-xl overflow-hidden border-2 border-indigo-500 shadow-xl bg-slate-900">
                <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                <span className="absolute bottom-1 left-1 bg-black/60 px-1.5 py-0.5 rounded text-[9px] text-white font-mono">
                  Your Camera (Verified)
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400">
              <span>Status: Connected to Lecture Stage</span>
              <span className="text-emerald-400 font-mono text-[11px]">● Sync Active</span>
            </div>
          </div>

          {/* Right Panel: Interactive Push Poll MCQ */}
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                <span>Live Lecture MCQ</span>
              </h3>
              <span className="text-[10px] uppercase font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                Active
              </span>
            </div>

            {session?.activePoll ? (
              <div className="space-y-4">
                <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                  {session.activePoll.question}
                </p>

                <div className="space-y-2">
                  {session.activePoll.options.map((opt) => {
                    const isSelected = selectedAnswer === opt;
                    const showResult = pollResult !== null;
                    const isCorrect = pollResult?.correctAnswer === opt;

                    return (
                      <button
                        key={opt}
                        disabled={selectedAnswer !== null}
                        onClick={() => handleAnswerPoll(opt)}
                        className={`w-full p-3 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer ${
                          showResult && isCorrect
                            ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold'
                            : showResult && isSelected && !isCorrect
                            ? 'border-red-500 bg-red-50 text-red-900'
                            : isSelected
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {pollResult && (
                  <div className={`p-3 rounded-xl text-xs font-semibold ${
                    pollResult.isCorrect ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                    {pollResult.isCorrect ? '✓ Correct Answer! Well done.' : `✗ Incorrect. Correct answer: ${pollResult.correctAnswer}`}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-6">Waiting for instructor to push next question...</p>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
