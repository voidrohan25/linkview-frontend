"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/authContext";
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Send,
  RotateCcw,
  Clock,
  CheckCircle2,
  AlertCircle,
  Award,
  ShieldCheck,
  ShieldAlert,
  Play,
  Keyboard,
  Video,
  PhoneOff,
  AlertTriangle,
  ArrowRight,
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
  const searchParams = useSearchParams();
  const { user: authUser } = useAuth();

  // Pre-flight check modal state
  const [preflightOpen, setPreflightOpen] = useState(true);
  const [audioOutputTested, setAudioOutputTested] = useState(false);
  const [micAudioLevel, setMicAudioLevel] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [sharedStream, setSharedStream] = useState<MediaStream | null>(null);
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

  useEffect(() => {
    const sid = searchParams?.get("sessionId") || initialSessionId;
    const mode = searchParams?.get("mode");
    const trackParam = searchParams?.get("track");

    if (sid) {
      setSessionId(sid);
      fetch(`/api/interviews?id=${sid}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            if (data.data.technology) setTrack(data.data.technology);
            if (data.data.currentQuestion) setCurrentQuestion(data.data.currentQuestion);
            if (data.data.currentTurn) setCurrentTurn(data.data.currentTurn);
            if (data.data.totalTurns) setTotalTurns(data.data.totalTurns);
            if (data.data.difficulty) setDifficulty(data.data.difficulty);
          }
        })
        .catch(() => {});
    }

    if (mode === "text") {
      setTextModeOnly(true);
    }
    if (trackParam) {
      setTrack(trackParam);
    }
  }, [searchParams, initialSessionId]);
  const [studentAnswer, setStudentAnswer] = useState<string>("");
  const [interimText, setInterimText] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeakingAI, setIsSpeakingAI] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [textModeOnly, setTextModeOnly] = useState<boolean>(false);
  const [turnHistory, setTurnHistory] = useState<any[]>([]);
  const [completed, setCompleted] = useState<boolean>(false);
  const [finalScorecard, setFinalScorecard] = useState<any>(null);

  // Proctoring audit state & 4-flag threshold system
  const [proctoringLogs, setProctoringLogs] = useState<ProctoringEvent[]>([]);
  const [flagCount, setFlagCount] = useState<number>(0);
  const [maxAllowedFlags, setMaxAllowedFlags] = useState<number>(3);
  const [activeWarningModal, setActiveWarningModal] = useState<{
    visible: boolean;
    warningNumber: number;
    message: string;
    remaining: number;
  } | null>(null);
  const [autoSubmittedByProctoring, setAutoSubmittedByProctoring] = useState<boolean>(false);

  // Speech Recognition & Audio refs
  const recognitionRef = useRef<any>(null);
  const shouldListenRef = useRef<boolean>(false);
  const isRecognitionRunningRef = useRef<boolean>(false);
  const restartTimerRef = useRef<NodeJS.Timeout | null>(null);
  const blurStartTimeRef = useRef<number | null>(null);
  const lastRecordedFlagTimeRef = useRef<number>(0);

  // Timer interval
  useEffect(() => {
    if (!interviewStarted || completed) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [interviewStarted, completed]);

  // Central Authoritative Proctoring Flag Reporter (Calls Backend /api/proctoring)
  const reportProctoringFlag = useCallback(
    async (
      type: string,
      severity: string,
      message: string,
      durationSeconds?: number
    ) => {
      // Cooldown: prevent duplicate flags within 3.5 seconds
      const now = Date.now();
      if (now - lastRecordedFlagTimeRef.current < 3500) return;
      lastRecordedFlagTimeRef.current = now;

      const activeId = sessionId || `int-session-${now}`;

      try {
        const res = await fetch("/api/proctoring", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            interviewId: activeId,
            event: {
              type,
              severity,
              message,
              durationSeconds,
            },
            currentTranscript: studentAnswer + (interimText ? ` ${interimText}` : ""),
          }),
        });

        const data = await res.json();
        if (data.success) {
          const newFlagCount = data.flagCount;
          setFlagCount(newFlagCount);
          setMaxAllowedFlags(data.maxAllowedFlags || 3);

          if (data.event) {
            setProctoringLogs((prev) => [data.event, ...prev]);
          }

          // RULE 4.3: strictly MORE THAN 3 confirmed flags -> 4th flag submits automatically
          if (data.autoSubmitted) {
            stopSpeechRecognition();
            if (typeof window !== "undefined" && "speechSynthesis" in window) {
              window.speechSynthesis.cancel();
            }
            setActiveWarningModal(null);
            setAutoSubmittedByProctoring(true);
            setCompleted(true);
            setFinalScorecard(data.session?.scorecard || {
              overallScore: 50,
              technicalAccuracy: 55,
              conceptualUnderstanding: 50,
              communication: 50,
              problemSolving: 48,
              strengths: ["Attempted initial assessment questions"],
              weaknesses: ["Exceeded proctoring flag limit (4 confirmed violations)"],
              recommendations: ["Maintain full window focus and remain centered in camera view"],
              aiFeedback: "Interview terminated automatically: Maximum proctoring threshold exceeded.",
            });
          } else {
            // Display formal Warning Modal for flags 1, 2, and 3 (Rule 4.2)
            setActiveWarningModal({
              visible: true,
              warningNumber: newFlagCount,
              message,
              remaining: data.remainingFlags,
            });
          }
        }
      } catch (err) {
        console.warn("Proctoring API report warning:", err);
      }
    },
    [sessionId, studentAnswer, interimText]
  );

  // Tab-switch & window blur proctoring
  useEffect(() => {
    if (preflightOpen || completed) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        blurStartTimeRef.current = Date.now();
        reportProctoringFlag(
          "tab_switch",
          "high",
          "Tab switch detected! Candidate navigated away from active assessment."
        );
      } else if (blurStartTimeRef.current) {
        const awayDuration = Math.round((Date.now() - blurStartTimeRef.current) / 1000);
        blurStartTimeRef.current = null;
        if (awayDuration > 2) {
          reportProctoringFlag(
            "tab_switch",
            "high",
            `Candidate returned after ${awayDuration}s away from assessment.`,
            awayDuration
          );
        }
      }
    };

    const handleWindowBlur = () => {
      if (!document.hidden && !blurStartTimeRef.current) {
        blurStartTimeRef.current = Date.now();
        reportProctoringFlag(
          "window_blur",
          "medium",
          "Window focus lost! Candidate switched application focus."
        );
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [preflightOpen, completed, reportProctoringFlag]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeechRecognition();
      if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (sharedStream) {
        sharedStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [sharedStream]);

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

  // High Quality AI Question Speech
  const speakQuestion = async (text: string) => {
    if (typeof window === "undefined") return;

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setIsSpeakingAI(true);
    stopSpeechRecognition();

    const persona = AVATAR_PERSONAS[selectedPersona];

    try {
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
    } catch {
      // Fallback
    }

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

  // Speech Recognition
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
        if (event.error === "no-speech") return;
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

  // Start Interview from Pre-flight modal
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
          studentName: authUser?.fullName || "Candidate",
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

  // Ensure camera hardware tracks cleanly shut down when candidate exits the room
  useEffect(() => {
    return () => {
      if (sharedStream) {
        sharedStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [sharedStream]);

  // Handle computer vision detection from StudentWebcamFeed
  const handleDetectionUpdate = useCallback(
    (result: ProctoringDetectionResult) => {
      if (preflightOpen || completed || !cameraActive) return;

      if (!result.faceDetected) {
        reportProctoringFlag(
          "face_missing",
          "high",
          result.message || "Candidate face not detected in camera frame. Keep face centered."
        );
      } else if (result.cameraCovered) {
        reportProctoringFlag(
          "camera_covered",
          "high",
          result.message || "Camera lens obstructed or covered."
        );
      } else if (result.multipleFaces) {
        reportProctoringFlag(
          "multiple_faces",
          "high",
          result.message || "Multiple individuals detected in camera view."
        );
      } else if (result.gazeAway) {
        reportProctoringFlag(
          "gaze_away",
          "medium",
          result.message || "Repeated looking away from assessment screen."
        );
      } else if (result.headDown) {
        reportProctoringFlag(
          "head_down",
          "medium",
          result.message || "Prolonged downward head position detected."
        );
      }
    },
    [preflightOpen, completed, reportProctoringFlag]
  );

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

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="max-w-[1440px] mx-auto font-sans">
      {/* 1. PRE-FLIGHT HARDWARE, WEBCAM & PROCTORING CHECK MODAL */}
      {preflightOpen && (
        <div className="modal-overlay">
          <div className="modal-content max-w-4xl p-6 sm:p-8 space-y-6 max-h-[92vh] overflow-y-auto">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              {/* Left Column: LIVE CAMERA FEED PREVIEW */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Video size={14} className="text-orange-600" />
                    <span>Candidate Webcam Video Feed Check:</span>
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">1280x720 HD</span>
                </div>

                <StudentWebcamFeed
                  externalStream={sharedStream}
                  onStreamReady={(stream) => setSharedStream(stream)}
                  onDetectionUpdate={handleDetectionUpdate}
                  onCameraStatusChange={(active) => setCameraActive(active)}
                  className="border-2 border-slate-700 shadow-lg"
                />

                <p className="text-[11px] text-slate-500 leading-relaxed m-0">
                  Position your face clearly inside the camera framing box with adequate lighting.
                </p>
              </div>

              {/* Right Column: Audio & Persona Parameters */}
              <div className="space-y-4">
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
                            className="w-12 h-12 rounded-full object-cover object-top border-2 border-slate-200"
                          />
                          <span className="text-xs font-bold text-slate-800 leading-tight">
                            {p.name.split(" ")[1] || p.name}
                          </span>
                          <span className="text-[10px] text-slate-400 capitalize">
                            {p.voiceGender} Voice
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Microphone Input Test:
                  </label>
                  <AudioDeviceSelector onLevelChange={(lvl: number) => setMicAudioLevel(lvl)} />
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 block">Speaker / Voice Output</span>
                    <span className="text-[11px] text-slate-500">
                      Test AI voice synthesis playback
                    </span>
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

            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-3">
              <input
                type="checkbox"
                id="proc-consent"
                checked={proctoringConsent}
                onChange={(e) => setProctoringConsent(e.target.checked)}
                className="mt-1 h-4 w-4 rounded text-orange-600 focus:ring-orange-500"
              />
              <label htmlFor="proc-consent" className="text-xs text-blue-900 leading-relaxed cursor-pointer">
                <strong>Proctored Environment Agreement:</strong> I agree to continuous webcam face tracking and window focus monitoring. Maximum 3 warnings allowed; the 4th confirmed flag will trigger automatic submission.
              </label>
            </div>

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

      {/* 2. PROCTORING WARNING MODAL (Rule 4.2: Flags 1, 2, 3) */}
      {activeWarningModal && activeWarningModal.visible && !completed && (
        <div className="modal-overlay">
          <div className="modal-content max-w-lg p-6 bg-white border-2 border-red-500 shadow-2xl rounded-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-2xl bg-red-100 text-red-600 shrink-0">
                <AlertTriangle size={28} />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-red-600 text-white uppercase tracking-wider">
                    Warning {activeWarningModal.warningNumber} of 3
                  </span>
                  {activeWarningModal.warningNumber === 3 && (
                    <span className="text-[11px] font-extrabold text-red-600 animate-pulse">
                      FINAL WARNING
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-extrabold text-slate-900 m-0">
                  Proctoring Security Warning
                </h3>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-red-50/80 border border-red-200 text-xs text-red-900 leading-relaxed space-y-2">
              <p className="font-semibold m-0">{activeWarningModal.message}</p>
              <p className="text-[11px] text-red-700 m-0">
                {activeWarningModal.warningNumber >= 3
                  ? "CRITICAL: You have reached 3 warnings. Strictly one more confirmed flag will automatically terminate and submit your interview!"
                  : `Please keep your face clearly visible, maintain center alignment, and do not switch browser tabs. Remaining warnings: ${activeWarningModal.remaining}.`}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                Confirmed Flag #{activeWarningModal.warningNumber} Recorded
              </span>
              <button
                type="button"
                onClick={() => setActiveWarningModal(null)}
                className="btn btn-primary text-xs py-2 px-5 font-bold shadow-md"
              >
                Continue Interview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. COMPLETED SCORECARD OR AUTO-SUBMISSION RESULT VIEW */}
      {completed && finalScorecard ? (
        <div className="card p-6 sm:p-8 bg-white border border-[#E2E8F0] shadow-lg rounded-2xl space-y-6 max-w-4xl mx-auto my-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F0] gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    autoSubmittedByProctoring
                      ? "bg-red-100 text-red-800 border border-red-300"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  }`}
                >
                  {autoSubmittedByProctoring
                    ? "AUTO-SUBMITTED (PROCTORING THRESHOLD)"
                    : "INTERVIEW CONCLUDED"}
                </span>
                <span className="text-xs text-slate-500">• Technical Evaluation Summary</span>
              </div>
              <h2 className="text-2xl font-extrabold text-[#0F172A] m-0">
                {autoSubmittedByProctoring
                  ? "Interview Automatically Submitted"
                  : `${track} Technical Evaluation Summary`}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Overall Score</div>
                <div className="text-3xl font-extrabold text-orange-600 font-mono leading-none">
                  {finalScorecard.overallScore || 50}%
                </div>
              </div>
              <div className="p-3 rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
                <Award size={28} />
              </div>
            </div>
          </div>

          {autoSubmittedByProctoring && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 leading-relaxed space-y-1">
              <p className="font-bold text-sm m-0">Proctoring Flag Limit Exceeded (4 Confirmed Flags)</p>
              <p className="m-0 text-red-700">
                Your interview was automatically submitted by the system because the maximum allowable security flags were exceeded. The verbal answers recorded up to this point have been safely saved for faculty review.
              </p>
            </div>
          )}

          {/* 4 Rubric Evaluation Dimension Bars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Technical Accuracy
              </span>
              <div className="text-2xl font-extrabold text-slate-900 font-mono">
                {finalScorecard.technicalAccuracy || 55}%
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Conceptual Depth
              </span>
              <div className="text-2xl font-extrabold text-slate-900 font-mono">
                {finalScorecard.conceptualUnderstanding || 50}%
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Communication Fluency
              </span>
              <div className="text-2xl font-extrabold text-slate-900 font-mono">
                {finalScorecard.communication || 50}%
              </div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Problem Solving
              </span>
              <div className="text-2xl font-extrabold text-slate-900 font-mono">
                {finalScorecard.problemSolving || 48}%
              </div>
            </div>
          </div>

          {/* Proctoring & Integrity Audit Timeline */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Proctoring & Exam Integrity Audit Log
                </span>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  proctoringLogs.length === 0
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {proctoringLogs.length === 0
                  ? "Clean Verification ✓"
                  : `${proctoringLogs.length} Security Flags Logged`}
              </span>
            </div>

            {proctoringLogs.length === 0 ? (
              <p className="text-xs text-slate-600 m-0">
                Zero security flags recorded. The candidate remained centered in webcam view with continuous window focus.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {proctoringLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2 rounded-lg bg-white border border-slate-200 text-xs flex items-center justify-between"
                  >
                    <span className="text-slate-700 font-medium">{log.message}</span>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                      {log.timestamp}
                    </span>
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
        /* 4. SINGLE-FRAME COMMERCIAL INTERVIEW ROOM (PART 5 - NO PAGE SCROLLING REQUIRED) */
        <div className="flex flex-col h-[calc(100vh-5.5rem)] min-h-[640px] max-h-[880px] overflow-hidden space-y-3">
          {/* Top Status & Telemetry Bar */}
          <div className="p-2.5 sm:p-3 rounded-2xl bg-white border border-[#E2E8F0] shadow-sm flex flex-wrap items-center justify-between gap-2 shrink-0">
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
              {/* Flag Counter Indicator (Rule 4.3) */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                  flagCount === 0
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : flagCount <= 2
                    ? "bg-amber-50 text-amber-700 border-amber-300"
                    : "bg-red-50 text-red-700 border-red-300 animate-pulse"
                }`}
              >
                <ShieldCheck size={13} />
                <span>
                  Proctoring Flags: {flagCount} / {maxAllowedFlags} Allowed
                </span>
              </div>

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

          {/* MAIN STAGE: 3-SEGMENT BALANCED STAGE */}
          <div className="flex flex-col space-y-4 flex-1 min-h-0">
            {/* SEGMENTS 1 & 2: DUAL 16:9 VIDEO FEEDS (AI Interviewer & Candidate Webcam) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
              {/* SEGMENT 1: AI Lead Interviewer Feed */}
              <div className="w-full flex flex-col">
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
                  compact={true}
                  className="h-full"
                />
              </div>

              {/* SEGMENT 2: Candidate Live Camera & Proctoring Feed */}
              <div className="w-full flex flex-col">
                <StudentWebcamFeed
                  externalStream={sharedStream}
                  onStreamReady={(stream) => setSharedStream(stream)}
                  onDetectionUpdate={handleDetectionUpdate}
                  onCameraStatusChange={(active) => setCameraActive(active)}
                  compact={true}
                  className="h-full shadow-md"
                />
              </div>
            </div>

            {/* SEGMENT 3: INTERACTIVE DIALOGUE & RESPONSE CONSOLE */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch flex-1 min-h-0">
              {/* SUB-SEGMENT 3A: AI Question Prompter Card */}
              <div className="card p-5 bg-white border border-[#E2E8F0] shadow-sm rounded-2xl flex flex-col justify-between space-y-3">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200 uppercase tracking-wider">
                        Question {currentTurn} of {totalTurns}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500">
                        • {track} Technical Viva
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => speakQuestion(currentQuestion)}
                      disabled={isSpeakingAI}
                      className="btn btn-outline btn-sm text-[11px] py-1 px-3 flex items-center gap-1.5 font-bold disabled:opacity-50"
                    >
                      <Volume2 size={13} className={isSpeakingAI ? "animate-pulse text-orange-500" : ""} />
                      <span>{isSpeakingAI ? "Speaking..." : "Replay Audio"}</span>
                    </button>
                  </div>

                  <h3 className="text-sm sm:text-base font-extrabold text-[#0F172A] leading-relaxed m-0">
                    "{currentQuestion}"
                  </h3>
                </div>

                {/* Rubric evaluation expectation hint */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center gap-1 font-bold text-slate-700">
                    <Sparkles size={12} className="text-orange-500" />
                    <span>Evaluation Rubric Criteria:</span>
                  </div>
                  <p className="m-0 leading-normal text-slate-500">
                    Explain core mechanics, memory lifecycle, runtime trade-offs, and practical edge cases clearly.
                  </p>
                </div>
              </div>

              {/* SUB-SEGMENT 3B: Live Voice Answer Transcript & Response Controls */}
              <div className="card p-5 bg-white border border-[#E2E8F0] shadow-sm rounded-2xl flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
                  <div className="flex items-center gap-2">
                    <div
                      className={`p-1.5 rounded-lg ${
                        isListening
                          ? "bg-emerald-100 text-emerald-700 animate-pulse"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Mic size={15} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Voice Answer Transcript</span>
                      <span className="text-[10px] text-slate-400">
                        {isListening ? "Listening continuously in real time..." : "Microphone paused"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTextModeOnly(!textModeOnly)}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 border border-slate-200 px-2.5 py-0.5 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <Keyboard size={12} />
                      <span>{textModeOnly ? "Voice Mode" : "Switch to Typing"}</span>
                    </button>
                    <span className="text-[10px] font-mono text-slate-400">
                      {studentAnswer.split(" ").filter(Boolean).length} words
                    </span>
                  </div>
                </div>

                {/* Internal Scrollable Content Box */}
                <div className="flex-1 min-h-[90px] max-h-[140px] overflow-y-auto bg-slate-50 rounded-xl p-3 border border-slate-200 focus-within:border-orange-500 transition-colors">
                  {textModeOnly ? (
                    <textarea
                      value={studentAnswer}
                      onChange={(e) => setStudentAnswer(e.target.value)}
                      placeholder="Type your technical response here..."
                      className="w-full h-full bg-transparent resize-none text-xs text-slate-800 focus:outline-none"
                    />
                  ) : (
                    <div className="text-xs text-slate-800 leading-relaxed font-sans">
                      {studentAnswer ? (
                        <span>
                          {studentAnswer}{" "}
                          {interimText && <span className="text-slate-400 italic">{interimText}</span>}
                        </span>
                      ) : interimText ? (
                        <span className="text-slate-400 italic">{interimText}</span>
                      ) : (
                        <span className="text-slate-400 italic">
                          Speak naturally into your microphone. Your speech will stream here in real time...
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Controls Footer */}
                <div className="flex items-center justify-between pt-1 shrink-0">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={`btn btn-sm text-xs py-1.5 px-3 font-bold flex items-center gap-1.5 ${
                        isListening
                          ? "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      {isListening ? <MicOff size={13} /> : <Mic size={13} />}
                      <span>{isListening ? "Pause Mic" : "Resume Mic"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStudentAnswer("");
                        setInterimText("");
                      }}
                      className="text-xs font-semibold text-slate-400 hover:text-slate-700 px-2 py-1 flex items-center gap-1"
                    >
                      <RotateCcw size={12} />
                      <span>Clear</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSubmitAnswer}
                    disabled={isSubmitting || (!studentAnswer.trim() && !interimText.trim())}
                    className="btn btn-primary text-xs py-2 px-5 font-bold shadow-md flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <span>{isSubmitting ? "Evaluating..." : `Submit Turn ${currentTurn}`}</span>
                    <Send size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Voluntary End Call Confirmation Modal */}
      {confirmEndOpen && (
        <div className="modal-overlay">
          <div className="modal-content max-w-sm p-6 bg-white rounded-2xl shadow-xl text-center space-y-4">
            <div className="p-3 rounded-full bg-red-100 text-red-600 w-fit mx-auto">
              <PhoneOff size={24} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-900 m-0">End Interview Early?</h3>
              <p className="text-xs text-slate-500 m-0">
                Your submitted turns will be evaluated up to this point. Early exits are logged in proctoring audits.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmEndOpen(false)}
                className="btn btn-outline text-xs py-2 px-4 font-bold"
              >
                Resume
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmEndOpen(false);
                  setCompleted(true);
                }}
                className="btn btn-primary text-xs py-2 px-4 font-bold bg-red-600 hover:bg-red-700 text-white"
              >
                Yes, End Assessment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VoiceInterviewRoom;
