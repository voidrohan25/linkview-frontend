import { NextResponse } from 'next/server';
import { evaluateAIInterviewAnswer } from '@/lib/ai';
import { interviewStore, InterviewSessionRecord } from '@/lib/interviewStore';

export interface InterviewSession {
  id: string;
  track: string;
  difficulty: string;
  currentTurn: number;
  totalTurns: number;
  currentQuestion: string;
  history: Array<{
    turn: number;
    question: string;
    studentAnswer: string;
    feedback: string;
    score: number;
  }>;
  finalFeedback?: {
    overallScore: number;
    strengths: string[];
    improvements: string[];
    summary: string;
  };
}

// In-memory legacy fallback store for unit test compatibility
const interviewTracksStore: Record<string, string[]> = {
  java: [
    'How does the Java Garbage Collector differentiate between unreachable objects and softly reachable objects?',
    'Can you explain the internal working of ConcurrentHashMap in Java 8 compared to earlier versions?',
    'What happens when a deadlock occurs in Java threads and how would you diagnose it in a live production environment?',
  ],
  python: [
    'Explain how Python manages memory using the Global Interpreter Lock (GIL) and reference counting.',
    'What are generators in Python and how do they optimize memory when processing large datasets?',
    'How do decorators work under the hood in Python?',
  ],
  dsa: [
    'Given an array of integers, how would you find the subarray with the largest sum in O(n) time?',
    'What is the difference between Dijkstra algorithm and the Bellman-Ford algorithm for negative edge weights?',
    'How does a Bloom filter work and what are its trade-offs regarding false positives?',
  ],
  sql: [
    'Explain the difference between clustered and non-clustered indexes and how they impact B-Tree disk I/O.',
    'How would you detect and resolve query performance bottlenecks caused by missing indexes or Cartesian products?',
    'Explain ACID transaction isolation levels: Read Committed vs Repeatable Read vs Serializable.',
  ],
  react: [
    'How does the React Fiber reconciler schedule high-priority user interactions vs background re-renders?',
    'Explain the mechanics of custom hooks and how memory closures can lead to stale state bugs.',
    'When would you choose Next.js Server Components over client-side hydration for large data tables?',
  ],
  fullstack: [
    'Walk me through the lifecycle of an HTTP/2 or HTTP/3 request from DNS resolution through reverse proxy down to database execution.',
    'How do you design a robust distributed idempotency key mechanism for payment processing APIs?',
    'What strategies do you adopt for handling distributed session invalidation across microservices?',
  ],
  communication: [
    'Please give me a concise 90-second professional elevator pitch introducing your technical background and key strengths.',
    'Describe a situation where a critical software defect was identified right before launch. How did you communicate with stakeholders and resolve it under pressure?',
    'Where do you envision your technical engineering contributions 2 to 3 years from today?',
  ],
  hr: [
    'Tell me about a challenging technical hurdle you encountered in a team project and how you resolved it.',
    'How do you prioritize deadlines when managing multiple conflicting project milestones?',
    'Describe an instance where you had to adapt quickly to an unfamiliar codebase or toolchain.',
  ],
};

const activeSessions: Record<string, any> = {};

// GET: Retrieve interview data by ID, role, or list
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const role = searchParams.get('role');
    const email = searchParams.get('email');

    if (id) {
      const interview = interviewStore.getInterviewById(id) || activeSessions[id];
      if (!interview) {
        return NextResponse.json({ success: false, error: 'Interview not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: interview });
    }

    if (role === 'admin') {
      return NextResponse.json({ success: true, data: interviewStore.getAdminStats() });
    }

    if (role === 'trainer') {
      return NextResponse.json({ success: true, data: interviewStore.getTrainerDashboard() });
    }

    if (role === 'student') {
      return NextResponse.json({ success: true, data: interviewStore.getStudentDashboard(email || undefined) });
    }

    return NextResponse.json({
      success: true,
      data: {
        interviews: interviewStore.getInterviews(),
        students: interviewStore.getStudents(),
        trainers: interviewStore.getTrainers(),
        batches: interviewStore.getBatches(),
        questionBank: interviewStore.getQuestionBank(),
      },
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Start an AI interview session OR Schedule new interview
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Check if this is a scheduling request from Trainer/Admin
    if (body.action === 'schedule') {
      const scheduled = interviewStore.scheduleInterview(body);
      return NextResponse.json({ success: true, data: scheduled });
    }

    // Check if this is a trainer review / remarks approval
    if (body.action === 'approve_scorecard') {
      const updated = interviewStore.addTrainerRemarks(body.interviewId, body.remarks, body.approved);
      return NextResponse.json({ success: true, data: updated });
    }

    // Standard session start (compatible with test_api_endpoints.mjs)
    const { track = 'dsa', difficulty = 'medium', studentName, batchName } = body;
    const sessionId = `ai-int-${Date.now()}`;
    const normalizedTrack = track.toLowerCase();
    const questions = interviewTracksStore[normalizedTrack] || interviewTracksStore.dsa;

    const session = {
      id: sessionId,
      track: normalizedTrack,
      difficulty,
      studentName: studentName || 'Candidate',
      batchName: batchName || 'Placement Cohort',
      currentTurn: 1,
      totalTurns: questions.length,
      currentQuestion: questions[0],
      history: [] as any[],
      proctoringEvents: [] as any[],
    };

    activeSessions[sessionId] = session;

    // Also register in interviewStore
    interviewStore.scheduleInterview({
      id: sessionId,
      technology: track.toUpperCase(),
      difficulty: difficulty as any,
      durationMinutes: 30,
      questionCount: questions.length,
    });

    return NextResponse.json({ success: true, data: session });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Submit student response & get AI evaluation with follow-up
export async function PUT(req: Request) {
  try {
    const { sessionId, answer, proctoringEvents = [] } = await req.json();
    let session = activeSessions[sessionId] || interviewStore.getInterviewById(sessionId);

    if (!session) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    const currentTurn = session.currentTurn;
    const normalizedTrack = (session.track || session.technology || 'dsa').toLowerCase();
    const questions = interviewTracksStore[normalizedTrack] || interviewTracksStore.dsa;

    if (proctoringEvents && Array.isArray(proctoringEvents) && proctoringEvents.length > 0) {
      session.proctoringEvents = proctoringEvents;
    }

    // 1. Evaluate with LLM or Semantic Rubric Engine
    const matchingQ = interviewStore.getQuestionBank().find(
      (q) =>
        q.question.toLowerCase().includes(session.currentQuestion.slice(0, 30).toLowerCase()) ||
        session.currentQuestion.toLowerCase().includes(q.question.slice(0, 30).toLowerCase())
    );
    const expectedKeypoints = matchingQ?.expectedKeypoints || [];

    const evaluation = await evaluateAIInterviewAnswer(
      session.currentQuestion,
      answer,
      normalizedTrack,
      expectedKeypoints
    );

    const score = evaluation.score;
    const feedback = evaluation.feedback;

    const turnData = {
      turn: currentTurn,
      question: session.currentQuestion,
      studentAnswer: answer,
      feedback,
      score,
      evaluationDetails: {
        technicalAccuracy: evaluation.technicalAccuracy,
        conceptualDepth: evaluation.conceptualDepth,
        communication: evaluation.communication,
      },
    };

    session.history.push(turnData);

    let nextQuestion: string | undefined = undefined;
    if (currentTurn < session.totalTurns) {
      session.currentTurn += 1;
      if (session.customQuestions && session.customQuestions.length >= session.currentTurn) {
        nextQuestion = session.customQuestions[session.currentTurn - 1];
      } else {
        nextQuestion = questions[session.currentTurn - 1] || questions[questions.length - 1];
      }
      session.currentQuestion = nextQuestion;
    } else {
      // Completed session - Authoritative Multi-Turn Rubric Aggregation
      const history = session.history || [];
      const historyLen = Math.max(1, history.length);

      const avg = Math.round(
        (history.reduce((a: number, b: any) => a + (Number(b.score) || 0), 0) / historyLen) * 10
      );

      const avgTechnical = Math.round(
        history.reduce((a: number, b: any) => a + (Number(b.evaluationDetails?.technicalAccuracy) || (Number(b.score) || 5) * 10), 0) / historyLen
      );
      const avgConceptual = Math.round(
        history.reduce((a: number, b: any) => a + (Number(b.evaluationDetails?.conceptualDepth) || (Number(b.score) || 5) * 9.5), 0) / historyLen
      );
      const avgCommunication = Math.round(
        history.reduce((a: number, b: any) => a + (Number(b.evaluationDetails?.communication) || 75), 0) / historyLen
      );
      const avgProblemSolving = Math.round(
        history.reduce((a: number, b: any) => a + (Number(b.evaluationDetails?.completeness) || (Number(b.score) || 5) * 9), 0) / historyLen
      );

      const events = session.proctoringEvents || [];
      const tabSwitches = events.filter((e: any) => e.type === 'tab_switch').length;
      const faceMissing = events.filter((e: any) => e.type === 'face_missing').length;
      const totalFlags = events.length;

      let riskLevel: 'clean' | 'low' | 'medium' | 'high' = 'clean';
      if (tabSwitches >= 2 || faceMissing >= 2 || totalFlags >= 4) {
        riskLevel = 'high';
      } else if (totalFlags >= 2) {
        riskLevel = 'medium';
      } else if (totalFlags > 0) {
        riskLevel = 'low';
      }

      session.status = 'completed';
      session.finalFeedback = {
        overallScore: avg,
        strengths: evaluation.strengths,
        improvements: evaluation.weaknesses,
        summary: `Technical assessment completed with an overall score of ${avg}%. Candidate demonstrated structured conceptual thinking.`,
      };

      session.scorecard = {
        overallScore: avg,
        technicalAccuracy: avgTechnical,
        conceptualUnderstanding: avgConceptual,
        communication: avgCommunication,
        problemSolving: avgProblemSolving,
        strengths: evaluation.strengths,
        weaknesses: evaluation.weaknesses,
        recommendations: evaluation.recommendations,
        aiFeedback: evaluation.feedback,
        evaluatedAt: new Date().toISOString(),
        proctoringSummary: {
          totalFlags,
          tabSwitches,
          faceMissingCount: faceMissing,
          riskLevel,
        },
      };
    }

    // Sync back to interviewStore if found
    interviewStore.updateInterviewTurn(session.id, answer, score, feedback, nextQuestion, session.scorecard);

    return NextResponse.json({ success: true, data: session });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Delete an interview session (Admin, Trainer, or Student cleanup)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Interview ID is required' }, { status: 400 });
    }

    const success = interviewStore.deleteInterview(id);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Interview session not found or already deleted' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Interview ${id} deleted successfully`,
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
