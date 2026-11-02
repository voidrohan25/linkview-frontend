import { NextResponse } from 'next/server';
import { activeTestsStore } from '@/server/repositories/testRepository';
import { calculateAttemptScore } from '@/server/scoring/engine';

export interface ServerAttempt {
  id: string;
  testId: string;
  studentId: string;
  studentName: string;
  state: 'awaiting_approval' | 'in_progress' | 'submitted' | 'auto_submitted';
  requestedAt: string;
  approvedAt?: string;
  startedAt?: string;
  deadlineAt?: string; // Authoritative deadline ISO string
  answers: Record<string, string>;
  flagsCount: number;
  score?: number;
  maxScore?: number;
}

// In-memory persistent attempts store
export const attemptsStore: ServerAttempt[] = [];

// Start request or retrieve attempt
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { testId, studentId = 'std-1', studentName = 'Rahul Sharma' } = body;

    const test = activeTestsStore.find((t) => t.id === testId);
    if (!test) {
      return NextResponse.json({ success: false, error: 'Test not found' }, { status: 404 });
    }

    // Check existing active attempt
    let attempt = attemptsStore.find(
      (a) => a.testId === testId && a.studentId === studentId && (a.state === 'in_progress' || a.state === 'awaiting_approval')
    );

    if (!attempt) {
      const now = new Date();
      if (test.approvalRequired) {
        attempt = {
          id: `att-${Date.now()}`,
          testId,
          studentId,
          studentName,
          state: 'awaiting_approval',
          requestedAt: now.toISOString(),
          answers: {},
          flagsCount: 0,
        };
      } else {
        const deadline = new Date(now.getTime() + test.durationMinutes * 60 * 1000);
        attempt = {
          id: `att-${Date.now()}`,
          testId,
          studentId,
          studentName,
          state: 'in_progress',
          requestedAt: now.toISOString(),
          approvedAt: now.toISOString(),
          startedAt: now.toISOString(),
          deadlineAt: deadline.toISOString(),
          answers: {},
          flagsCount: 0,
        };
      }
      attemptsStore.push(attempt);
    }

    return NextResponse.json({ success: true, data: attempt });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Autosave answers & proctoring flags
export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { attemptId, answers, flagEvent } = body;

    const attempt = attemptsStore.find((a) => a.id === attemptId);
    if (!attempt) {
      return NextResponse.json({ success: false, error: 'Attempt not found' }, { status: 404 });
    }

    // Check if test deadline has expired
    if (attempt.deadlineAt && new Date() > new Date(attempt.deadlineAt)) {
      attempt.state = 'submitted';
    }

    if (attempt.state !== 'in_progress') {
      return NextResponse.json({
        success: false,
        error: `Cannot modify attempt in '${attempt.state}' state`,
      }, { status: 400 });
    }

    // Autosave answer updates
    if (answers) {
      attempt.answers = { ...attempt.answers, ...answers };
    }

    // Handle proctoring flag increment
    if (flagEvent) {
      attempt.flagsCount = (attempt.flagsCount || 0) + 1;
      const test = activeTestsStore.find((t) => t.id === attempt.testId);
      const maxFlags = test?.maxFlags || 5;

      // Automatically submit if violation threshold exceeded!
      if (attempt.flagsCount >= maxFlags) {
        attempt.state = 'auto_submitted';

        // Authoritative scoring on automatic submission
        if (test) {
          const evaluations = test.questions.map((q) => ({
            questionId: q.id,
            type: q.type,
            studentAnswer: attempt.answers[q.id],
            correctAnswer: q.correctAnswer,
            marks: q.marks,
            negativeMarks: q.negativeMarks,
          }));
          const scored = calculateAttemptScore(evaluations);
          attempt.score = scored.totalScore;
          attempt.maxScore = scored.maxScore;
        }

        return NextResponse.json({
          success: true,
          data: attempt,
          autoSubmitted: true,
          message: 'Threshold exceeded. Exam has been automatically submitted.',
        });
      }
    }

    return NextResponse.json({ success: true, data: attempt });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
