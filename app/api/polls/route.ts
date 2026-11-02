import { NextResponse } from 'next/server';
import { liveClassState } from '@/app/api/live-classes/route';

// POST: Student answers live in-class push MCQ
export async function POST(req: Request) {
  try {
    const { pollId, answer } = await req.json();

    if (!liveClassState.activePoll || !liveClassState.activePoll.isOpen) {
      return NextResponse.json({ success: false, error: 'Poll is closed' }, { status: 400 });
    }

    const currentCount = liveClassState.activePoll.responsesCount[answer] || 0;
    liveClassState.activePoll.responsesCount[answer] = currentCount + 1;

    return NextResponse.json({
      success: true,
      message: 'Live poll response recorded',
      isCorrect: answer === liveClassState.activePoll.correctAnswer,
      correctAnswer: liveClassState.activePoll.correctAnswer,
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
