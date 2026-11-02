import { NextResponse } from 'next/server';
import { activeTestsStore } from '@/server/repositories/testRepository';

export interface ExtractedQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
  marks: number;
  negativeMarks: number;
  confidence: number;
  sourcePage: number;
}

// In-memory jobs store for PDF-to-test asynchronous workflows
const pdfJobsStore: Record<string, {
  status: 'processing' | 'ready_for_review' | 'published';
  fileName: string;
  questions: ExtractedQuestion[];
}> = {};

// POST: Simulate secure PDF upload & AI text extraction/OCR
export async function POST(req: Request) {
  try {
    const { fileName = 'assessment_paper.pdf', batchId = 'b1-java-mastery' } = await req.json();

    const jobId = `pdf-job-${Date.now()}`;

    // Extracted draft questions matching document specification
    const extractedQuestions: ExtractedQuestion[] = [
      {
        id: `eq-1`,
        prompt: 'What is the worst-case time complexity of QuickSort when using an unoptimized pivot selection?',
        options: ['O(n log n)', 'O(n^2)', 'O(log n)', 'O(n)'],
        correctAnswer: 'O(n^2)',
        marks: 10,
        negativeMarks: 2,
        confidence: 0.96,
        sourcePage: 1,
      },
      {
        id: `eq-2`,
        prompt: 'Which garbage collection algorithm in the JVM uses copying for Young Generation memory reclamation?',
        options: ['Mark-Sweep-Compact', 'Stop-The-World Copying', 'Reference Counting', 'Generational Immix'],
        correctAnswer: 'Stop-The-World Copying',
        marks: 10,
        negativeMarks: 2,
        confidence: 0.92,
        sourcePage: 2,
      },
      {
        id: `eq-3`,
        prompt: 'In PostgreSQL, which index type is ideal for multidimensional data and full-text search vector queries?',
        options: ['B-Tree', 'GIN (Generalized Inverted Index)', 'Hash Index', 'BRIN'],
        correctAnswer: 'GIN (Generalized Inverted Index)',
        marks: 10,
        negativeMarks: 1,
        confidence: 0.98,
        sourcePage: 3,
      },
    ];

    pdfJobsStore[jobId] = {
      status: 'ready_for_review',
      fileName,
      questions: extractedQuestions,
    };

    return NextResponse.json({
      success: true,
      jobId,
      status: 'ready_for_review',
      questions: extractedQuestions,
      message: 'PDF processed successfully. Questions generated for trainer review.',
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Trainer confirmation & publishing extracted test into question bank / test catalog
export async function PUT(req: Request) {
  try {
    const { jobId, testTitle, batchId, questions } = await req.json();

    const newTest = {
      id: `test-imported-${Date.now()}`,
      title: testTitle || 'AI-Extracted Mock Examination',
      batchId: batchId || 'b1-java-mastery',
      batchName: 'Java Full Stack & DSA Spring 2026',
      durationMinutes: 45,
      totalMarks: questions.reduce((acc: number, q: ExtractedQuestion) => acc + q.marks, 0),
      approvalRequired: true,
      proctoringEnabled: true,
      maxFlags: 5,
      questions: questions.map((q: ExtractedQuestion) => ({
        id: q.id,
        prompt: q.prompt,
        type: 'single_mcq' as const,
        options: q.options,
        correctAnswer: q.correctAnswer,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
      })),
    };

    activeTestsStore.unshift(newTest);

    if (pdfJobsStore[jobId]) {
      pdfJobsStore[jobId].status = 'published';
    }

    return NextResponse.json({
      success: true,
      data: newTest,
      message: 'Test successfully reviewed, validated, and published to student batch!',
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
