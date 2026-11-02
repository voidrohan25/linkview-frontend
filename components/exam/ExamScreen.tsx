'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  Camera, 
  AlertTriangle 
} from 'lucide-react';

interface Question {
  id: string;
  prompt: string;
  options: string[];
  marks: number;
}

interface TestData {
  id: string;
  title: string;
  durationMinutes: number;
  approvalRequired: boolean;
  proctoringEnabled: boolean;
  maxFlags: number;
  questions: Question[];
}

interface Attempt {
  id: string;
  state: 'awaiting_approval' | 'in_progress' | 'submitted' | 'auto_submitted';
  deadlineAt?: string;
  flagsCount: number;
  answers: Record<string, string>;
}

export default function ExamScreen({ testId }: { testId: string }) {
  const router = useRouter();
  const [test, setTest] = useState<TestData | null>(null);
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flags, setFlags] = useState(0);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'offline'>('saved');
  const [cameraActive, setCameraActive] = useState(false);
  const [warningMsg, setWarningMsg] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  // 1. Fetch Test Information
  useEffect(() => {
    fetch('/api/tests')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data.length > 0) {
          const found = res.data.find((t: TestData) => t.id === testId) || res.data[0];
          setTest(found);
        }
      });
  }, [testId]);

  // Submit assessment authoritative helper
  const handleFinalSubmit = useCallback(async () => {
    if (!attempt) return;
    setSaveStatus('saving');
    try {
      const res = await fetch('/api/attempts/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId: attempt.id }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/student/results?attemptId=${attempt.id}`);
      }
    } catch (err) {
      console.error('Error submitting exam:', err);
    }
  }, [attempt, router]);

  // Report proctoring event to server authoritative count
  const reportProctorFlag = useCallback(async (type: string) => {
    if (!attempt || attempt.state !== 'in_progress') return;
    try {
      const res = await fetch('/api/attempts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: attempt.id,
          flagEvent: { type, time: new Date().toISOString() },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFlags(data.data.flagsCount);
        if (data.autoSubmitted) {
          alert('Proctoring violation limit reached (5 flags). Exam auto-submitted.');
          router.push(`/student/results?attemptId=${attempt.id}`);
        } else {
          setWarningMsg(`Warning: Proctor flag recorded (${type}). Keep test tab focused.`);
          setTimeout(() => setWarningMsg(''), 5000);
        }
      }
    } catch {
      // transient network handling
    }
  }, [attempt, router]);

  // Request exam attempt activation
  const handleStartExam = async () => {
    if (!test) return;
    const res = await fetch('/api/attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ testId: test.id }),
    });
    const data = await res.json();
    if (data.success) {
      setAttempt(data.data);
      if (data.data.answers) setAnswers(data.data.answers);
      if (data.data.flagsCount) setFlags(data.data.flagsCount);
    }
  };

  // Poll for trainer approval if awaiting approval
  useEffect(() => {
    if (!attempt || attempt.state !== 'awaiting_approval') return;
    const interval = setInterval(async () => {
      const res = await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testId: test?.id }),
      });
      const data = await res.json();
      if (data.success && data.data.state === 'in_progress') {
        setAttempt(data.data);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [attempt, test]);

  // 2. Camera feed activation for local presence verification
  useEffect(() => {
    if (attempt?.state === 'in_progress' && test?.proctoringEnabled) {
      navigator.mediaDevices
        ?.getUserMedia({ video: true })
        .then((stream) => {
          setCameraActive(true);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(() => {
          setCameraActive(false);
          reportProctorFlag('camera_denied');
        });
    }
  }, [attempt?.state, test?.proctoringEnabled, reportProctorFlag]);

  // 3. Tab Visibility & Window Blur Detection (Debounced proctoring signal)
  useEffect(() => {
    if (!attempt || attempt.state !== 'in_progress') return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        reportProctorFlag('tab_hidden');
      }
    };

    const handleBlur = () => {
      reportProctorFlag('window_blur');
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [attempt, reportProctorFlag]);

  // 4. Server-Authoritative Timer Countdown
  useEffect(() => {
    if (!attempt || attempt.state !== 'in_progress' || !attempt.deadlineAt) return;

    const tick = () => {
      const diff = Math.max(0, Math.floor((new Date(attempt.deadlineAt!).getTime() - Date.now()) / 1000));
      setTimeLeft(diff);
      if (diff === 0) {
        handleFinalSubmit();
      }
    };

    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [attempt, handleFinalSubmit]);

  // 5. Debounced Autosave Answer Helper
  const selectOption = async (qId: string, opt: string) => {
    const updated = { ...answers, [qId]: opt };
    setAnswers(updated);
    setSaveStatus('saving');

    try {
      await fetch('/api/attempts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: attempt?.id,
          answers: { [qId]: opt },
        }),
      });
      setSaveStatus('saved');
    } catch {
      setSaveStatus('offline');
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!test) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans text-slate-500">
        Loading assessment parameters...
      </div>
    );
  }

  // Pre-Test / Awaiting Approval Screen
  if (!attempt || attempt.state === 'awaiting_approval') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-6">
          <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-serif font-bold text-slate-900">{test.title}</h2>
            <p className="text-sm text-slate-500 mt-1">Duration: {test.durationMinutes} minutes · Total Marks: 40</p>
          </div>

          <div className="text-left bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs text-slate-600 space-y-2">
            <p className="font-semibold text-slate-800">Examination Rules & Proctoring:</p>
            <p>• Server-authoritative timer locks at scheduled deadline.</p>
            <p>• Answers are continuously autosaved on selection.</p>
            <p>• 5 proctoring violations (tab switches / camera obscuration) trigger auto-submission.</p>
          </div>

          {!attempt ? (
            <button
              onClick={handleStartExam}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow transition-colors"
            >
              Request to Start Examination
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 text-amber-600 font-semibold text-sm animate-pulse">
                <Clock className="h-4 w-4" />
                <span>Waiting for Trainer Approval...</span>
              </div>
              <p className="text-xs text-slate-400">
                Your trainer has been notified. This screen will automatically start your exam once approved.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentQ = test.questions[currentIndex];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Test Engine Header */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <span className="font-serif font-bold text-base text-slate-900 truncate max-w-xs sm:max-w-md">
            {test.title}
          </span>
          <span className="text-xs px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 font-semibold">
            Q {currentIndex + 1} of {test.questions.length}
          </span>
        </div>

        <div className="flex items-center gap-6">
          {/* Autosave status indicator */}
          <div className="flex items-center gap-1.5 text-xs">
            {saveStatus === 'saved' && (
              <span className="text-emerald-600 flex items-center gap-1 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5" /> All answers saved
              </span>
            )}
            {saveStatus === 'saving' && (
              <span className="text-slate-400 animate-pulse font-medium">Saving answer...</span>
            )}
            {saveStatus === 'offline' && (
              <span className="text-amber-600 font-medium">Connection interrupted</span>
            )}
          </div>

          {/* Violations Indicator */}
          <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border border-amber-200 bg-amber-50 text-amber-800">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Flags: {flags}/5</span>
          </div>

          {/* Official Countdown Timer */}
          <div className="flex items-center gap-2 bg-slate-900 text-white px-3.5 py-1.5 rounded-xl font-mono text-sm font-bold shadow-sm">
            <Clock className="h-4 w-4 text-indigo-400" />
            <span>{timeLeft !== null ? formatTime(timeLeft) : '--:--'}</span>
          </div>

          <button
            onClick={handleFinalSubmit}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Submit Exam</span>
          </button>
        </div>
      </header>

      {/* Warning banner */}
      {warningMsg && (
        <div className="bg-rose-50 border-b border-rose-200 px-6 py-2.5 text-xs text-rose-800 font-semibold flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 flex-shrink-0" />
          <span>{warningMsg}</span>
        </div>
      )}

      {/* Main Examination View */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Question Panel */}
        <div className="lg:col-span-8 flex flex-col justify-between bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 pb-4 border-b border-slate-100 mb-6">
              <span className="font-semibold text-slate-700">Question {currentIndex + 1}</span>
              <span>Marks: +{currentQ.marks} · Negative: -2</span>
            </div>

            <h3 className="text-lg font-semibold text-slate-900 leading-relaxed mb-8">
              {currentQ.prompt}
            </h3>

            {/* Answer Options */}
            <div className="space-y-3">
              {currentQ.options.map((opt, i) => {
                const isSelected = answers[currentQ.id] === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => selectOption(currentQ.id, opt)}
                    className={`w-full text-left px-5 py-4 rounded-xl border text-sm font-medium transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 text-slate-800'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="h-6 w-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-xs text-slate-500 font-bold">
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span>{opt}</span>
                    </span>
                    {isSelected && <CheckCircle2 className="h-5 w-5 text-indigo-600 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-8 border-t border-slate-100 mt-8">
            <button
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((c) => Math.max(0, c - 1))}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>

            <button
              disabled={currentIndex === test.questions.length - 1}
              onClick={() => setCurrentIndex((c) => Math.min(test.questions.length - 1, c + 1))}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-40 transition-colors"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Right Side: Question Grid & Proctoring Stream */}
        <div className="lg:col-span-4 space-y-6">
          {/* Webcam Proctoring Thumbnail */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
              <span className="flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5 text-indigo-600" /> Proctoring Monitor
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                cameraActive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
              }`}>
                {cameraActive ? 'Active' : 'Unverified'}
              </span>
            </div>
            <div className="aspect-video bg-slate-950 rounded-xl overflow-hidden relative flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {!cameraActive && (
                <p className="text-[11px] text-slate-400 absolute text-center px-4">
                  Camera feed required by proctoring policy
                </p>
              )}
            </div>
          </div>

          {/* Question Palette / Navigator */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
              Question Navigator
            </h4>
            <div className="grid grid-cols-4 gap-2">
              {test.questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isCurrent = idx === currentIndex;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-xl font-bold text-xs flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200'
                        : isAnswered
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span> Answered
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-300"></span> Unanswered
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
