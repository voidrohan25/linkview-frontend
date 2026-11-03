import { NextResponse } from 'next/server';
import { interviewStore } from '@/lib/interviewStore';
import { attemptsStore } from '@/app/api/attempts/route';
import { activeTestsStore } from '@/server/repositories/testRepository';

// GET list of pending mock interview start requests & tests awaiting trainer approval
export async function GET() {
  const pendingInterviews = interviewStore.getPendingApprovals();
  const pendingAttempts = attemptsStore.filter((a) => a.state === 'awaiting_approval');

  return NextResponse.json({
    success: true,
    data: {
      pendingInterviews,
      pendingAttempts,
      totalPending: pendingInterviews.length + pendingAttempts.length,
    },
    // Backwards compatibility for legacy lists
    pendingRequests: pendingInterviews,
  });
}

// POST trainer decision or student start request
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, interviewId, trainerName, reason, attemptId } = body;

    // 1. Student action: Request permission to start a scheduled AI mock interview
    if (action === 'request_start' && interviewId) {
      const interview = interviewStore.requestInterviewApproval(interviewId);
      if (!interview) {
        return NextResponse.json({ success: false, error: 'Interview session not found' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        message: 'Interview access request submitted to trainer. Waiting for live approval.',
        data: interview,
      });
    }

    // 2. Trainer action: Approve student request to start interview
    if (action === 'approve_start' && interviewId) {
      const interview = interviewStore.approveInterview(interviewId, trainerName || 'Faculty Lead');
      if (!interview) {
        return NextResponse.json({ success: false, error: 'Interview session not found' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        message: `Candidate ${interview.studentName} approved to start ${interview.technology} mock interview.`,
        data: interview,
      });
    }

    // 3. Trainer action: Reject student request
    if (action === 'reject_start' && interviewId) {
      const interview = interviewStore.rejectInterview(interviewId, trainerName || 'Faculty Lead', reason);
      if (!interview) {
        return NextResponse.json({ success: false, error: 'Interview session not found' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        message: `Attempt request declined.`,
        data: interview,
      });
    }

    // 4. Legacy written test attempt approvals
    if (attemptId) {
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
        attempt.state = 'auto_submitted';
        return NextResponse.json({
          success: true,
          message: 'Attempt request rejected',
          data: attempt,
        });
      }
    }

    return NextResponse.json({ success: false, error: 'Invalid action or missing parameters' }, { status: 400 });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
