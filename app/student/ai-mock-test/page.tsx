'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { 
  Sparkles, 
  Brain, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Award, 
  BookOpen, 
  RefreshCw 
} from 'lucide-react';
import { GeneratedQuestion } from '@/app/api/ai-mock-test/route';

export default function AiMockTestPage() {
  const [topic, setTopic] = useState('dsa');
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [activeTest, setActiveTest] = useState<{
    id: string;
    title: string;
    durationMinutes: number;
    questions: GeneratedQuestion[];
  } | null>(null);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [isCompleted, setIsCompleted] = useState(false);

  // Generate dynamic test
  const handleGenerateTest = async () => {
    setLoading(true);
    setIsCompleted(false);
    setUserAnswers({});
    setCurrentIndex(0);

    try {
      const res = await fetch('/api/ai-mock-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, difficulty, questionCount: 3 }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveTest(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (qId: string, opt: string) => {
    if (isCompleted) return;
    setUserAnswers({ ...userAnswers, [qId]: opt });
  };

  const calculateScore = () => {
    if (!activeTest) return { score: 0, total: 0, correct: 0 };
    let correct = 0;
    activeTest.questions.forEach((q) => {
      if (userAnswers[q.id] === q.correctAnswer) correct++;
    });
    return {
      score: correct * 10,
      total: activeTest.questions.length * 10,
      correct,
    };
  };

  return (
    <AppShell role="student" userName="Rahul Sharma">
      <div className="max-w-4xl mx-auto space-y-8 font-sans">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="h-4 w-4" />
            <span>AI Dynamic Assessment Generator</span>
          </div>
          <h2 className="text-3xl font-serif font-bold text-slate-900">
            Instant AI Mock Test
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Generates a unique customized question paper calibrated to test your exact conceptual depth, time pressure, and edge-case mastery.
          </p>
        </div>

        {/* Generator Controls */}
        {!activeTest && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-slate-800">Configure Your Adaptive Practice</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Select Focus Topic
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'dsa', name: 'Data Structures & Algorithms', desc: 'Trees, DP, Greedy & Search' },
                    { id: 'java', name: 'Java & Concurrency', desc: 'JVM, Threads, G1 GC & Collections' },
                    { id: 'python', name: 'Python Internals', desc: 'GIL, Generators, Memory & Iterators' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTopic(t.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        topic === t.id
                          ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-200 font-semibold'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <p className="text-sm text-slate-900 font-bold">{t.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Target Difficulty
                </label>
                <div className="flex gap-3">
                  {['easy', 'medium', 'hard'].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider capitalize transition-all ${
                        difficulty === d
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleGenerateTest}
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>{loading ? 'Synthesizing Test Paper...' : 'Generate AI Test Paper'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Live Active Test Screen */}
        {activeTest && !isCompleted && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 text-xs text-slate-500">
              <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
                {activeTest.title}
              </span>
              <span>Question {currentIndex + 1} of {activeTest.questions.length}</span>
            </div>

            {/* Current Question */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-indigo-600">
                  Topic: {activeTest.questions[currentIndex].topic}
                </span>
                <span className="text-xs text-slate-400">Marks: +10</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 leading-relaxed mb-6">
                {activeTest.questions[currentIndex].prompt}
              </h3>

              <div className="space-y-3">
                {activeTest.questions[currentIndex].options.map((opt, optIdx) => {
                  const isSelected = userAnswers[activeTest.questions[currentIndex].id] === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => handleSelectOption(activeTest.questions[currentIndex].id, opt)}
                      className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold ring-1 ring-indigo-500'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span className="h-6 w-6 rounded-md bg-white border border-slate-200 flex items-center justify-center text-xs text-slate-500 font-bold">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{opt}</span>
                      </span>
                      {isSelected && <CheckCircle2 className="h-5 w-5 text-indigo-600 flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation and Submit */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((c) => Math.max(0, c - 1))}
                className="px-4 py-2 text-xs font-semibold text-slate-700 rounded-xl border border-slate-200 disabled:opacity-40"
              >
                Previous
              </button>

              {currentIndex < activeTest.questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex((c) => c + 1)}
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 shadow"
                >
                  Next Question
                </button>
              ) : (
                <button
                  onClick={() => setIsCompleted(true)}
                  className="px-6 py-2.5 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow flex items-center gap-2"
                >
                  <span>Submit & View AI Score</span>
                  <Award className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Completed Score & AI Explanations */}
        {activeTest && isCompleted && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-6 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-2xl">
                  <Award className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Assessment Completed</h3>
                  <p className="text-xs text-slate-500">
                    Accuracy: {((calculateScore().correct / activeTest.questions.length) * 100).toFixed(0)}%
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs uppercase font-bold text-slate-400">Total Score</span>
                <p className="text-3xl font-bold text-emerald-600 font-mono">
                  {calculateScore().score} / {calculateScore().total}
                </p>
              </div>
            </div>

            {/* Question by Question Detailed Breakdown */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900">Detailed AI Answer Key & Conceptual Rationale</h4>
              {activeTest.questions.map((q, idx) => {
                const userAns = userAnswers[q.id];
                const isCorrect = userAns === q.correctAnswer;
                return (
                  <div
                    key={q.id}
                    className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">Q{idx + 1}: {q.prompt}</span>
                      <span className={`font-semibold px-2 py-0.5 rounded ${
                        isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {isCorrect ? '+10 Marks (Correct)' : '0 Marks (Incorrect)'}
                      </span>
                    </div>

                    <div className="text-xs space-y-1">
                      <p className="text-slate-600">
                        <strong className="text-slate-700">Your Answer:</strong> {userAns || '(Unanswered)'}
                      </p>
                      <p className="text-emerald-700 font-medium">
                        <strong>Correct Answer:</strong> {q.correctAnswer}
                      </p>
                    </div>

                    <div className="pt-2 text-xs text-slate-600 bg-white p-3 rounded-lg border border-slate-100 leading-relaxed">
                      <strong className="text-slate-800">AI Explanation:</strong> {q.explanation}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActiveTest(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold text-xs shadow hover:bg-slate-800 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Generate Another Mock Test</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
