import { NextResponse } from 'next/server';
import { attemptsStore } from '@/app/api/attempts/route';
import { activeTestsStore } from '@/server/repositories/testRepository';

// GET list of pending start requests
export async function GET() {
  const pending = attemptsStore.filter((a) => a.state === 'awaiting_approval');
  return NextResponse.json({ success: true, data: pending });
}

// POST trainer decision (approve or reject)
export async function POST(req: Request) {
  try {
    const { attemptId, action } = await req.json(); // action: 'approve' | 'reject'

    const attempt = attemptsStore.find((a) => a.id === attemptId);
    if (!attempt) {
      return NextResponse.json({ success: false, error: 'Attempt request not found' }, { status: 404 });
    }

    if (action === 'approve') {
      const test = activeTestsStore.find((t) => t.id === attempt.testId);
      const durationMinutes = test ? test.durationMinutes : 45;
      const now = new Date();
      const deadline = new Date(now.getTime() + durationMinutes * 60 * 1000);

      attempt.state = 'in_progress';
      attempt.approvedAt = now.toISOString();
      attempt.startedAt = now.toISOString();
      attempt.deadlineAt = deadline.toISOString();

      return NextResponse.json({
        success: true,
        message: 'Exam attempt activated',
        data: attempt,
      });
    } else {
      // Reject start
      attempt.state = 'auto_submitted';
      return NextResponse.json({
        success: true,
        message: 'Attempt request rejected',
        data: attempt,
      });
    }
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
