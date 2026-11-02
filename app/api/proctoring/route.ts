import { NextResponse } from 'next/server';
import { interviewStore } from '@/lib/interviewStore';

// POST: Record proctoring flag event and enforce 4-flag auto-submission threshold
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { interviewId, event, currentTranscript } = body;

    if (!interviewId) {
      return NextResponse.json(
        { success: false, error: 'Interview session ID is required' },
        { status: 400 }
      );
    }

    if (!event || !event.type || !event.message) {
      return NextResponse.json(
        { success: false, error: 'Valid proctoring event payload is required' },
        { status: 400 }
      );
    }

    // Server-authoritative atomic flag recording & threshold evaluation
    const result = interviewStore.recordProctoringFlag(
      interviewId,
      {
        type: event.type,
        severity: event.severity || 'high',
        message: event.message,
        durationSeconds: event.durationSeconds,
      },
      currentTranscript
    );

    return NextResponse.json({
      success: true,
      autoSubmitted: result.autoSubmitted,
      flagCount: result.flagCount,
      maxAllowedFlags: result.maxAllowedFlags,
      remainingFlags: result.remainingFlags,
      event: result.event,
      session: result.session,
      message: result.message,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Proctoring event processing error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET: Retrieve proctoring audit log for Admin & Trainer review
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const interviewId = searchParams.get('interviewId');

    if (!interviewId) {
      return NextResponse.json(
        { success: false, error: 'interviewId query parameter is required' },
        { status: 400 }
      );
    }

    const session = interviewStore.getInterviewById(interviewId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Interview session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        interviewId: session.id,
        studentName: session.studentName,
        technology: session.technology,
        status: session.status,
        submissionReason: session.submissionReason || 'normal',
        autoSubmittedAt: session.autoSubmittedAt,
        flagCount: session.flagCount || 0,
        maxAllowedFlags: session.maxAllowedFlags || 3,
        proctoringEvents: session.proctoringEvents || [],
        scorecard: session.scorecard,
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
