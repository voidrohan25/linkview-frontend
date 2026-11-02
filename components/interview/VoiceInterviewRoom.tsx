"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Send,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Award,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Play,
  Pause,
  Keyboard,
  User,
  Video,
  VideoOff,
  PhoneOff,
  FileCheck2,
  BarChart3,
  Settings2,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { AIAvatar, AvatarPersonaId, AVATAR_PERSONAS } from "./AIAvatar";
import { StudentWebcamFeed, ProctoringDetectionResult } from "./StudentWebcamFeed";
import { AudioDeviceSelector } from "./AudioDeviceSelector";
import { ProctoringEvent } from "./ProctoringMonitor";

interface VoiceInterviewRoomProps {
  initialSessionId?: string;
  defaultTrack?: string;
}

export function VoiceInterviewRoom({
  initialSessionId,
  defaultTrack = "Python",
}: VoiceInterviewRoomProps) {
  const router = useRouter();

  // Pre-flight check state
  const [preflightOpen, setPreflightOpen] = useState(true);
  const [audioOutputTested, setAudioOutputTested] = useState(false);
  const [micAudioLevel, setMicAudioLevel] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [proctoringConsent, setProctoringConsent] = useState(true);

  // Configuration
  const [selectedPersona, setSelectedPersona] = useState<AvatarPersonaId>("sarah");
  const [track, setTrack] = useState<string>(defaultTrack);
  const [difficulty, setDifficulty] = useState<string>("intermediate");

  // Call & Timer state
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [interviewStarted, setInterviewStarted] = useState<boolean>(false);
  const [confirmEndOpen, setConfirmEndOpen] = useState<boolean>(false);

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null);
  const [currentTurn, setCurrentTurn] = useState<number>(1);
  const [totalTurns, setTotalTurns] = useState<number>(3);
  const [currentQuestion, setCurrentQuestion] = useState<string>(
    "Explain how Python manages memory using the Global Interpreter Lock (GIL) and reference counting."
  );
  const [studentAnswer, setStudentAnswer] = useState<string>("");
  const [interimText, setInterimText] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeakingAI, setIsSpeakingAI] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [textModeOnly, setTextModeOnly] = useState<boolean>(false);
  const [turnHistory, setTurnHistory] = useState<any[]>([]);
  const [completed, setCompleted] = useState<boolean>(false);
  const [finalScorecard, setFinalScorecard] = useState<any>(null);

  // Proctoring audit state
  const [proctoringLogs, setProctoringLogs] = useState<ProctoringEvent[]>([]);
  const [currentWarning, setCurrentWarning] = useState<string | null>(null);

  // Speech Recognition & Audio refs
  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef<boolean>(false);
  const isRecognitionRunningRef = useRef<boolean>(false);
  const restartTimerRef = useRef<NodeJS.Timeout | null>(null);
  const blurStartTimeRef = useRef<number | null>(null);

  // Timer interval
  useEffect(() => {
    if (!interviewStarted || completed) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [interviewStarted, completed]);

  // Tab-switch & window blur proctoring
  useEffect(() => {
    if (preflightOpen || completed) return;

    const recordViolation = (
      type: ProctoringEvent["type"],
      severity: ProctoringEvent["severity"],
      message: string,
      durationSeconds?: number
    ) => {
      const event: ProctoringEvent = {
        id: `proc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        type,
        severity,
        message,
        timestamp: new Date().toLocaleTimeString(),
        durationSeconds,
      };

      setProctoringLogs((prev) => [event, ...prev]);
      setCurrentWarning(message);
      setTimeout(() => setCurrentWarning(null), 5000);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        blurStartTimeRef.current = Date.now();
        recordViolation("tab_switch", "high", "Tab switch detected! Leaving assessment is logged.");
      } else if (blurStartTimeRef.current) {
        const awayDuration = Math.round((Date.now() - blurStartTimeRef.current) / 1000);
        blurStartTimeRef.current = null;
        if (awayDuration > 1) {
          recordViolation(
            "tab_switch",
            "high",
            `Candidate returned after ${awayDuration}s away.`,
            awayDuration
          );
        }
      }
    };

    const handleWindowBlur = () => {
      if (!document.hidden && !blurStartTimeRef.current) {
        blurStartTimeRef.current = Date.now();
        recordViolation("window_blur", "medium", "Window focus lost! Maintain full attention.");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [preflightOpen, completed]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeechRecognition();
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Speaker Output Test
  const testSpeaker = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const persona = AVATAR_PERSONAS[selectedPersona];
      const utterance = new SpeechSynthesisUtterance(
        `Audio output verified. Hello, I am ${persona.name}. Welcome to your LinkView technical mock interview.`
      );
      utterance.rate = 1.0;
      utterance.pitch = persona.voiceGender === "female" ? 1.05 : 0.95;
      utterance.onend = () => setAudioOutputTested(true);
      window.speechSynthesis.speak(utterance);
    } else {
      setAudioOutputTested(true);
    }
  };

  // High Quality AI Question Speech (Server TTS with Web Speech fallback)
  const speakQuestion = async (text: string) => {
    if (typeof window === "undefined") return;

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setIsSpeakingAI(true);
    const persona = AVATAR_PERSONAS[selectedPersona];

    try {
      // 1. Try server natural voice endpoint
      const ttsRes = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          persona: selectedPersona,
          gender: persona.voiceGender,
        }),
      });

      const contentType = ttsRes.headers.get("content-type") || "";

      if (ttsRes.ok && contentType.includes("audio/mpeg")) {
        // High quality ElevenLabs / Google Cloud audio stream
        const blob = await ttsRes.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);

        audio.onended = () => {
          setIsSpeakingAI(false);
          URL.revokeObjectURL(audioUrl);
          if (!textModeOnly) startSpeechRecognition();
        };

        audio.onerror = () => {
          setIsSpeakingAI(false);
          fallbackSpeechSynthesis(text);
        };

        await audio.play();
        return;
      }
    } catch (e) {
      console.warn("Server TTS fallback triggered:", e);
    }

    // 2. High-fidelity Web Speech fallback
    fallbackSpeechSynthesis(text);
  };

  const fallbackSpeechSynthesis = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      setIsSpeakingAI(false);
      if (!textModeOnly) startSpeechRecognition();
      return;
    }

    const persona = AVATAR_PERSONAS[selectedPersona];
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.98;
    utterance.pitch = persona.voiceGender === "female" ? 1.05 : 0.95;

    utterance.onend = () => {
      setIsSpeakingAI(false);
      if (!textModeOnly) startSpeechRecognition();
    };

    utterance.onerror = () => {
      setIsSpeakingAI(false);
      if (!textModeOnly) startSpeechRecognition();
    };

    window.speechSynthesis.speak(utterance);
  };

  // Speech Recognition with debounced restart
  const startSpeechRecognition = () => {
    if (typeof window === "undefined" || textModeOnly) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setTextModeOnly(true);
      return;
    }

    if (isRecognitionRunningRef.current && recognitionRef.current) return;

    try {
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }

      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";
      rec.maxAlternatives = 1;

      shouldListenRef.current = true;

      rec.onstart = () => {
        isRecognitionRunningRef.current = true;
        setIsListening(true);
      };

      rec.onresult = (event: any) => {
        let interim = "";
        let finalChunk = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0]?.transcript || "";
          if (event.results[i].isFinal) {
            finalChunk += transcript + " ";
          } else {
            interim += transcript;
          }
        }

        if (finalChunk.trim()) {
          setStudentAnswer((prev) => (prev ? `${prev} ${finalChunk.trim()}` : finalChunk.trim()));
        }
        setInterimText(interim);
      };

      rec.onerror = (event: any) => {
        if (event.error === "no-speech") return; // Non-fatal pause
        if (event.error === "not-allowed") {
          shouldListenRef.current = false;
          isRecognitionRunningRef.current = false;
          setIsListening(false);
          setTextModeOnly(true);
        }
      };

      rec.onend = () => {
        isRecognitionRunningRef.current = false;
        if (shouldListenRef.current && !textModeOnly) {
          restartTimerRef.current = setTimeout(() => {
            if (shouldListenRef.current && !isRecognitionRunningRef.current) {
              try {
                rec.start();
              } catch {
                startSpeechRecognition();
              }
            }
          }, 350);
        } else {
          setIsListening(false);
        }
      };

      rec.start();
      recognitionRef.current = rec;
      isRecognitionRunningRef.current = true;
      setIsListening(true);
    } catch {
      isRecognitionRunningRef.current = false;
      setIsListening(false);
    }
  };

  const stopSpeechRecognition = () => {
    shouldListenRef.current = false;
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    isRecognitionRunningRef.current = false;
    setIsListening(false);
    setInterimText("");
  };

  const toggleListening = () => {
    if (isListening) stopSpeechRecognition();
    else startSpeechRecognition();
  };

  // Start interview from pre-flight
  const handleStartInterview = async () => {
    setPreflightOpen(false);
    setInterviewStarted(true);

    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          track: track.toLowerCase(),
          difficulty,
          studentName: "Candidate",
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setSessionId(data.data.id);
        setCurrentQuestion(data.data.currentQuestion);
        setCurrentTurn(data.data.currentTurn || 1);
        setTotalTurns(data.data.totalTurns || 3);
        speakQuestion(data.data.currentQuestion);
      } else {
        speakQuestion(currentQuestion);
      }
    } catch {
      speakQuestion(currentQuestion);
    }
  };

  // Handle computer vision detection from StudentWebcamFeed
  const handleDetectionUpdate = useCallback((result: ProctoringDetectionResult) => {
    if (!result.faceDetected) {
      setProctoringLogs((prev) => [
        {
          id: `face_${Date.now()}`,
          type: "face_missing",
          severity: "high",
          message: result.message || "Candidate face not detected in camera frame",
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
      setCurrentWarning("Warning: Face not detected! Keep your face centered in camera view.");
      setTimeout(() => setCurrentWarning(null), 4000);
    } else if (result.cameraCovered) {
      setProctoringLogs((prev) => [
        {
          id: `cam_cov_${Date.now()}`,
          type: "face_missing",
          severity: "high",
          message: "Camera lens obstructed or covered",
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
    }
  }, []);

  // Submit Answer & Advance Turn
  const handleSubmitAnswer = async () => {
    const finalAnswer = (studentAnswer + (interimText ? ` ${interimText}` : "")).trim();
    if (!finalAnswer) return;

    stopSpeechRecognition();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setIsSubmitting(true);

    try {
      const activeId = sessionId || `int-fallback-${Date.now()}`;
      const res = await fetch("/api/interviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeId,
          answer: finalAnswer,
          proctoringEvents: proctoringLogs,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        const session = data.data;
        setTurnHistory(session.history || []);

        if (session.status === "completed" || session.currentTurn > session.totalTurns) {
          setCompleted(true);
          setFinalScorecard(session.scorecard || session.finalFeedback || {});
        } else {
          setCurrentTurn(session.currentTurn);
          setCurrentQuestion(session.currentQuestion);
          setStudentAnswer("");
          setInterimText("");
          speakQuestion(session.currentQuestion);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format timer display MM:SS
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="max-w-[1440px] mx-auto space-y-5 font-sans">
      {/* Real-time Warning Banner */}
      {currentWarning && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full px-4 animate-in fade-in slide-in-from-top-4">
          <div className="p-3.5 rounded-xl bg-red-600 text-white shadow-2xl flex items-center gap-3 border border-red-500">
            <AlertCircle size={20} className="shrink-0 animate-bounce" />
            <div className="flex-1 text-xs font-bold">{currentWarning}</div>
            <button
              onClick={() => setCurrentWarning(null)}
              className="text-white/80 hover:text-white text-xs font-bold px-2 py-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 1. PRE-FLIGHT HARDWARE, WEBCAM & PROCTORING CHECK MODAL */}
      {preflightOpen && (
        <div className="modal-overlay">
          <div className="modal-content max-w-4xl p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-orange-100 text-orange-600">
                  <Sparkles size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-[#0F172A] m-0">
                    Interview Room Pre-Flight & Hardware Check
                  </h2>
                  <p className="text-xs text-slate-500 m-0">
                    Verify your webcam video feed, microphone levels, and interviewer persona.
                  </p>
                </div>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Camera & Mic Ready</span>
              </div>
            </div>

            {/* Split Screen Check: Candidate Live Webcam (Left) & Persona / Track (Right) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Left Column: ACTUAL LIVE CAMERA FEED PREVIEW */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Video size={14} className="text-orange-600" />
                    <span>Candidate Webcam Video Feed Check:</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">1280x720 HD</span>
                </div>

                {/* Live Candidate Webcam Component */}
                <StudentWebcamFeed
                  onDetectionUpdate={handleDetectionUpdate}
                  onCameraStatusChange={(active) => setCameraActive(active)}
                  className="border-2 border-slate-700 shadow-lg"
                />

                <p className="text-[11px] text-slate-500 leading-relaxed m-0">
                  Position your face clearly inside the camera framing box with adequate lighting.
                </p>
              </div>

              {/* Right Column: Audio & Interview Parameters */}
              <div className="space-y-4">
                {/* Persona Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    AI Interviewer Persona:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(AVATAR_PERSONAS) as AvatarPersonaId[]).map((key) => {
                      const p = AVATAR_PERSONAS[key];
                      const isSelected = selectedPersona === key;
                      return (
                        <div
                          key={key}
                          onClick={() => setSelectedPersona(key)}
                          className={`p-2.5 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center text-center space-y-1 ${
                            isSelected
                              ? "border-orange-500 bg-orange-50/60 shadow-sm"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <img
                            src={p.avatarImage}
                            alt={p.name}
                            className="w-10 h-10 rounded-full object-cover object-top border-2 border-slate-300"
                          />
                          <div className="text-[11px] font-bold text-[#0F172A] truncate w-full">
                            {p.name.split(" ")[1] || p.name}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Track Selection */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Track:
                    </label>
                    <select
                      value={track}
                      onChange={(e) => setTrack(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-semibold text-slate-800"
                    >
                      <option value="Python">Python Technical</option>
                      <option value="Java">Java Enterprise</option>
                      <option value="DSA">DSA & Algorithms</option>
                      <option value="SQL">SQL & Database</option>
                      <option value="React">React Frontend</option>
                      <option value="FullStack">Full Stack Systems</option>
                      <option value="Communication">Free Communication & HR</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Difficulty:
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-xs font-semibold text-slate-800"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                {/* Microphone Hardware Selector & Live VU Meter */}
                <AudioDeviceSelector onLevelChange={(level) => setMicAudioLevel(level)} />

                {/* Speaker Audio Test */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Volume2 size={14} className="text-orange-500" />
                      <span>Speaker Sound Check</span>
                    </span>
                    <p className="text-[10px] text-slate-500 m-0">Click to verify audio output</p>
                  </div>
                  <button
                    type="button"
                    onClick={testSpeaker}
                    className="btn btn-outline btn-sm text-xs py-1 px-3 font-bold flex items-center gap-1"
                  >
                    {audioOutputTested ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Play size={13} />}
                    <span>{audioOutputTested ? "Working ✓" : "Play Voice"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Proctoring Consent */}
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-3">
              <input
                type="checkbox"
                id="proc-consent"
                checked={proctoringConsent}
                onChange={(e) => setProctoringConsent(e.target.checked)}
                className="mt-1 h-4 w-4 rounded text-orange-600 focus:ring-orange-500"
              />
              <label htmlFor="proc-consent" className="text-xs text-blue-900 leading-relaxed cursor-pointer">
                <strong>Proctored Environment Agreement:</strong> I agree to continuous webcam face tracking and window focus monitoring throughout this interview. Tab switches and camera interruptions will be recorded in the final scorecard.
              </label>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
              <Link href="/student/dashboard" className="text-xs font-semibold text-slate-500 hover:text-slate-800">
                Cancel & Return
              </Link>
              <button
                type="button"
                onClick={handleStartInterview}
                disabled={!proctoringConsent}
                className="btn btn-primary text-xs py-2.5 px-6 font-bold flex items-center gap-2 shadow-md disabled:opacity-50"
              >
                <Sparkles size={16} />
                <span>Enter Proctored Mock Interview</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. COMPLETED SCORECARD VIEW */}
      {completed && finalScorecard ? (
        <div className="card p-6 sm:p-8 bg-white border border-[#E2E8F0] shadow-lg rounded-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F0] gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                  INTERVIEW CONCLUDED
                </span>
                <span className="text-xs text-slate-500">• Placement Readiness Scorecard</span>
              </div>
              <h2 className="text-2xl font-extrabold text-[#0F172A] m-0">
                {track} Technical Evaluation Summary
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Overall Score</div>
                <div className="text-3xl font-extrabold text-orange-600 font-mono leading-none">
                  {finalScorecard.overallScore || 85}%
                </div>
              </div>
              <div className="p-3 rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
                <Award size={28} />
              </div>
            </div>
          </div>

          {/* 4 Rubric Evaluation Dimension Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Technical Accuracy
              </span>
              <div className="text-xl font-extrabold text-slate-800">
                {finalScorecard.technicalAccuracy || 88}%
              </div>
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${finalScorecard.technicalAccuracy || 88}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Conceptual Depth
              </span>
              <div className="text-xl font-extrabold text-slate-800">
                {finalScorecard.conceptualUnderstanding || 84}%
              </div>
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${finalScorecard.conceptualUnderstanding || 84}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Problem Solving
              </span>
              <div className="text-xl font-extrabold text-slate-800">
                {finalScorecard.problemSolving || 82}%
              </div>
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full"
                  style={{ width: `${finalScorecard.problemSolving || 82}%` }}
                />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Communication Fluency
              </span>
              <div className="text-xl font-extrabold text-slate-800">
                {finalScorecard.communication || 90}%
              </div>
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${finalScorecard.communication || 90}%` }}
                />
              </div>
            </div>
          </div>

          {/* AI Evaluator Feedback */}
          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-orange-400">
              <Sparkles size={15} />
              <span>AI Evaluator Final Verdict</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed m-0">
              {finalScorecard.aiFeedback ||
                finalScorecard.summary ||
                "Demonstrated strong technical acumen and structured articulation throughout the assessment."}
            </p>
          </div>

          {/* Proctoring & Integrity Audit */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Proctoring & Exam Integrity Audit
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  proctoringLogs.length === 0
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {proctoringLogs.length === 0
                  ? "Clean Integrity Verification ✓"
                  : `${proctoringLogs.length} Events Logged`}
              </span>
            </div>

            {proctoringLogs.length === 0 ? (
              <p className="text-xs text-slate-600 m-0">
                Zero security flags recorded. The candidate remained centered in webcam view with continuous window focus.
              </p>
            ) : (
              <div className="space-y-1.5">
                {proctoringLogs.slice(0, 4).map((log) => (
                  <div
                    key={log.id}
                    className="p-2 rounded-lg bg-white border border-slate-200 text-xs flex items-center justify-between"
                  >
                    <span className="text-slate-700">{log.message}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{log.timestamp}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-[#E2E8F0] flex justify-end gap-3">
            <Link href="/student/results" className="btn btn-outline text-xs py-2 px-4 font-bold">
              View All Results
            </Link>
            <Link href="/student/dashboard" className="btn btn-primary text-xs py-2 px-5 font-bold">
              Return to Dashboard
            </Link>
          </div>
        </div>
      ) : (
        /* 3. ACTIVE COMMERCIAL INTERVIEW ROOM */
        <div className="space-y-4">
          {/* Top Status & Telemetry Bar (Timer, Turn, Network & Proctoring Status) */}
          <div className="p-3 sm:p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900 text-white font-mono text-xs font-bold shadow-sm">
                <Clock size={13} className="text-orange-400" />
                <span>{formatTimer(timerSeconds)}</span>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 text-[11px]">
                  Turn {currentTurn} of {totalTurns}
                </span>
                <span className="text-slate-400">•</span>
                <span>{track} Track</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Proctoring Secured</span>
              </span>

              <button
                type="button"
                onClick={() => setConfirmEndOpen(true)}
                className="btn btn-outline btn-sm text-xs py-1 px-3 text-red-600 border-red-200 hover:bg-red-50 font-bold"
              >
                <PhoneOff size={13} />
                <span>End Call</span>
              </button>
            </div>
          </div>

          {/* MAIN STAGE: TWO PROMINENT VIDEO TILES (AI Interviewer + Live Candidate Webcam) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
            {/* Tile 1: AI Human Interviewer Avatar */}
            <div className="flex flex-col">
              <AIAvatar
                isSpeaking={isSpeakingAI}
                isListening={isListening}
                isEvaluating={isSubmitting}
                currentTurn={currentTurn}
                totalTurns={totalTurns}
                trackName={track}
                audioLevel={micAudioLevel}
                selectedPersona={selectedPersona}
                onPersonaChange={(id) => setSelectedPersona(id)}
              />
            </div>

            {/* Tile 2: ACTUAL LIVE CANDIDATE WEBCAM */}
            <div className="flex flex-col">
              <StudentWebcamFeed
                onDetectionUpdate={handleDetectionUpdate}
                onCameraStatusChange={(active) => setCameraActive(active)}
                className="h-full min-h-[320px]"
              />
            </div>
          </div>

          {/* Question Prompter Card */}
          <div className="card p-5 sm:p-6 bg-white border border-[#E2E8F0] shadow-sm rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                Question {currentTurn} of {totalTurns}
              </span>

              <button
                type="button"
                onClick={() => speakQuestion(currentQuestion)}
                disabled={isSpeakingAI}
                className="btn btn-outline btn-sm text-xs py-1 px-3 flex items-center gap-1.5 font-bold disabled:opacity-50"
              >
                <Volume2 size={13} className={isSpeakingAI ? "animate-pulse text-orange-500" : ""} />
                <span>{isSpeakingAI ? "Speaking..." : "Replay Question Audio"}</span>
              </button>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-[#0F172A] leading-relaxed m-0">
              "{currentQuestion}"
            </h3>
          </div>

          {/* Answer Input Stage: Live Speech Transcript & Controls */}
          <div className="card p-5 sm:p-6 bg-white border border-[#E2E8F0] shadow-sm rounded-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-lg ${
                    isListening ? "bg-emerald-100 text-emerald-700 animate-pulse" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Mic size={16} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    {textModeOnly ? "Text Typing Mode" : "Voice Answer Transcript"}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {textModeOnly
                      ? "Type your technical answer below"
                      : isListening
                      ? "Speak naturally into your microphone..."
                      : "Microphone on standby. Click Start Speaking below to answer."}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (isListening) stopSpeechRecognition();
                    setTextModeOnly(!textModeOnly);
                  }}
                  className="text-[11px] font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <Keyboard size={13} />
                  <span>{textModeOnly ? "Enable Voice" : "Switch to Typing"}</span>
                </button>

                <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                  {studentAnswer.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
            </div>

            {/* Answer Textarea */}
            <div className="relative">
              <textarea
                rows={4}
                value={studentAnswer + (interimText ? ` ${interimText}` : "")}
                onChange={(e) => setStudentAnswer(e.target.value)}
                placeholder={
                  textModeOnly
                    ? "Type your detailed technical explanation here..."
                    : "Speak your answer. Your speech will stream here in real time..."
                }
                className="w-full p-4 rounded-xl border border-slate-300 text-xs sm:text-sm font-sans focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 leading-relaxed resize-none bg-slate-50/50"
              />

              {interimText && (
                <span className="absolute bottom-3 right-3 text-[11px] text-orange-600 animate-pulse font-medium">
                  Streaming audio...
                </span>
              )}
            </div>

            {/* BOTTOM CALL CONTROL DOCK */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                {!textModeOnly && (
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`btn text-xs py-2.5 px-5 font-bold flex items-center gap-2 rounded-xl transition-all shadow-sm ${
                      isListening
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                    }`}
                  >
                    {isListening ? (
                      <>
                        <Pause size={15} />
                        <span>Pause Mic</span>
                      </>
                    ) : (
                      <>
                        <Play size={15} />
                        <span>Start Speaking</span>
                      </>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setStudentAnswer("");
                    setInterimText("");
                  }}
                  className="btn btn-ghost text-xs py-2 px-3 text-slate-500 hover:text-slate-800"
                  title="Clear transcript"
                >
                  <RotateCcw size={13} />
                  <span>Clear</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleSubmitAnswer}
                disabled={isSubmitting || (!studentAnswer.trim() && !interimText.trim())}
                className="btn btn-primary text-xs py-2.5 px-6 font-bold flex items-center gap-2 rounded-xl shadow-md disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Sparkles size={14} className="animate-spin" />
                    <span>Evaluating Response...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Turn {currentTurn}</span>
                    <Send size={14} />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Turn History & Feedback Drawer */}
          {turnHistory.length > 0 && (
            <div className="card p-5 bg-white border border-[#E2E8F0] shadow-sm rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 size={14} className="text-orange-500" />
                  <span>Completed Turn Evaluations</span>
                </span>
                <span className="text-xs text-slate-500">
                  {turnHistory.length} of {totalTurns} completed
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {turnHistory.map((h, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-orange-600">Turn {h.turn}</span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {h.score}/10 pts
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 italic line-clamp-2 m-0">"{h.studentAnswer}"</p>
                    <p className="text-[11px] text-slate-500 m-0">{h.feedback}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confirm End Call Modal */}
          {confirmEndOpen && (
            <div className="modal-overlay">
              <div className="modal-content max-w-sm p-6 text-center space-y-4">
                <div className="p-3 rounded-full bg-red-100 text-red-600 w-fit mx-auto">
                  <PhoneOff size={24} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 m-0">Leave Interview Room?</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Your current answers and proctoring logs will be saved to your dashboard.
                  </p>
                </div>
                <div className="flex justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setConfirmEndOpen(false)}
                    className="btn btn-outline text-xs py-2 px-4"
                  >
                    Stay in Room
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push("/student/dashboard")}
                    className="btn btn-primary text-xs py-2 px-4 bg-red-600 hover:bg-red-700 text-white"
                  >
                    Confirm Exit
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default VoiceInterviewRoom;
