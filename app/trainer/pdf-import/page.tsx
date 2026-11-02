'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { 
  UploadCloud, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  Trash2, 
  ArrowRight, 
  Check, 
  ShieldCheck 
} from 'lucide-react';

interface ExtractedQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
  marks: number;
  negativeMarks: number;
  confidence: number;
  sourcePage: number;
}

export default function PdfImportPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [testTitle, setTestTitle] = useState('Data Structures & Algorithms Mid-Term Exam');
  const [isUploading, setIsUploading] = useState(false);
  const [questions, setQuestions] = useState<ExtractedQuestion[]>([]);
  const [isPublished, setIsPublished] = useState(false);

  const handleUploadAndExtract = async () => {
    setIsUploading(true);
    try {
      const res = await fetch('/api/pdf-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file ? file.name : 'DSA_Question_Paper_2026.pdf',
          batchId: 'b1-java-mastery',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setQuestions(data.questions);
      }
    } catch (err) {
      console.error('Error processing PDF:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handlePublishTest = async () => {
    try {
      const res = await fetch('/api/pdf-import', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testTitle,
          batchId: 'b1-java-mastery',
          questions,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsPublished(true);
        setTimeout(() => {
          router.push('/student/tests');
        }, 1500);
      }
    } catch (err) {
      console.error('Error publishing test:', err);
    }
  };

  const updateQuestion = (idx: number, field: keyof ExtractedQuestion, val: unknown) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], [field]: val };
    setQuestions(updated);
  };

  return (
    <AppShell role="trainer" userName="Senior Instructor">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="h-4 w-4" />
            <span>AI-Assisted Question Ingestion</span>
          </div>
          <h2 className="text-3xl font-serif font-bold text-slate-900">
            PDF-to-Test Question Generator
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Upload institutional PDF question papers. AI extracts draft questions, answer options, and suggested answer keys for mandatory human review before publishing.
          </p>
        </div>

        {/* Upload Zone */}
        {questions.length === 0 && (
          <div className="bg-white rounded-2xl border-2 border-dashed border-slate-300 p-10 text-center space-y-4 hover:border-indigo-400 transition-colors">
            <div className="h-14 w-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <UploadCloud className="h-7 w-7" />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-base">
                {file ? file.name : 'Upload Question Paper or Syllabus PDF'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports PDF question papers up to 25MB · Automatic OCR enabled for scanned documents
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <input
                type="file"
                accept=".pdf"
                id="pdf-upload"
                className="hidden"
                onChange={(e) => e.target.files && setFile(e.target.files[0])}
              />
              <label
                htmlFor="pdf-upload"
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer transition-colors"
              >
                Choose Local PDF
              </label>

              <button
                onClick={handleUploadAndExtract}
                disabled={isUploading}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                <span>{isUploading ? 'Extracting via AI & OCR...' : 'Process & Generate Draft Questions'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Review & Edit Screen */}
        {questions.length > 0 && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="w-full sm:w-2/3">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Examination Title
                </label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setQuestions([])}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Discard
                </button>
                <button
                  onClick={handlePublishTest}
                  disabled={isPublished}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>{isPublished ? 'Published! Redirecting...' : 'Confirm Review & Publish'}</span>
                </button>
              </div>
            </div>

            {/* List of Draft Questions */}
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div
                  key={q.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500 pb-3 border-b border-slate-100">
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md">
                      Question {idx + 1} · Source Page {q.sourcePage}
                    </span>
                    <span className="text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded">
                      Confidence: {(q.confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Question Prompt</label>
                    <textarea
                      rows={2}
                      value={q.prompt}
                      onChange={(e) => updateQuestion(idx, 'prompt', e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium"
                    />
                  </div>

                  {/* Options */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">Answer Options & Correct Key</label>
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-3">
                        <span className="h-6 w-6 rounded-md bg-slate-100 text-xs font-bold text-slate-600 flex items-center justify-center">
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...q.options];
                            newOpts[optIdx] = e.target.value;
                            updateQuestion(idx, 'options', newOpts);
                          }}
                          className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => updateQuestion(idx, 'correctAnswer', opt)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                            q.correctAnswer === opt
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {q.correctAnswer === opt && <Check className="h-3 w-3" />}
                          <span>{q.correctAnswer === opt ? 'Correct Key' : 'Mark Key'}</span>
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-4">
                      <span>Marks: +{q.marks}</span>
                      <span>Negative Marks: -{q.negativeMarks}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
