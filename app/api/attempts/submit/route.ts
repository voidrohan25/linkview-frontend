import { NextResponse } from 'next/server';
import { attemptsStore } from '@/app/api/attempts/route';
import { activeTestsStore } from '@/server/repositories/testRepository';
import { calculateAttemptScore } from '@/server/scoring/engine';

export async function POST(req: Request) {
  try {
    const { attemptId } = await req.json();

    const attempt = attemptsStore.find((a) => a.id === attemptId);
    if (!attempt) {
      return NextResponse.json({ success: false, error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.state === 'submitted' || attempt.state === 'auto_submitted') {
      return NextResponse.json({ success: true, data: attempt, message: 'Already submitted' });
    }

    const test = activeTestsStore.find((t) => t.id === attempt.testId);
    if (!test) {
      return NextResponse.json({ success: false, error: 'Associated test not found' }, { status: 404 });
    }

    // Server-Side Evaluation: Fetch original answer keys from secure server repository
    const evaluations = test.questions.map((q) => ({
      questionId: q.id,
      type: q.type,
      studentAnswer: attempt.answers[q.id],
      correctAnswer: q.correctAnswer,
      marks: q.marks,
      negativeMarks: q.negativeMarks,
    }));

    const result = calculateAttemptScore(evaluations);

    attempt.state = 'submitted';
    attempt.score = result.totalScore;
    attempt.maxScore = result.maxScore;

    return NextResponse.json({
      success: true,
      data: {
        attemptId: attempt.id,
        state: attempt.state,
        score: result.totalScore,
        maxScore: result.maxScore,
        correctCount: result.correctCount,
        incorrectCount: result.incorrectCount,
        unansweredCount: result.unansweredCount,
        breakdown: result.perQuestionBreakdown,
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
