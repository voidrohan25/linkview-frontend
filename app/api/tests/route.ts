import { NextResponse } from 'next/server';
import { activeTestsStore } from '@/server/repositories/testRepository';

export async function GET() {
  // Sanitize questions to avoid sending correct answers to the student client bundle!
  const sanitizedTests = activeTestsStore.map((test) => ({
    ...test,
    questions: test.questions.map(({ correctAnswer: _discard, ...safeQ }) => safeQ),
  }));

  return NextResponse.json({ success: true, data: sanitizedTests });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newTest = {
      id: `test-${Date.now()}`,
      title: body.title || 'Untitled Assessment',
      batchId: body.batchId || 'b1-java-mastery',
      batchName: body.batchName || 'Default Batch',
      durationMinutes: Number(body.durationMinutes) || 30,
      totalMarks: Number(body.totalMarks) || 20,
      approvalRequired: Boolean(body.approvalRequired),
      proctoringEnabled: Boolean(body.proctoringEnabled),
      maxFlags: Number(body.maxFlags) || 5,
      questions: body.questions || [],
    };

    activeTestsStore.unshift(newTest);
    return NextResponse.json({ success: true, data: newTest }, { status: 201 });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
