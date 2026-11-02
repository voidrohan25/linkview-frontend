import { NextResponse } from 'next/server';

export interface LiveClassSession {
  id: string;
  title: string;
  batchId: string;
  batchName: string;
  trainerName: string;
  startedAt: string;
  attendeesCount: number;
  cameraRequestSent: boolean;
  activePoll: {
    id: string;
    question: string;
    options: string[];
    correctAnswer: string;
    isOpen: boolean;
    responsesCount: Record<string, number>;
  } | null;
}

export const liveClassState: LiveClassSession = {
  id: 'live-dsa-class-1',
  title: 'Data Structures & Algorithms: Balanced BSTs and Graphs',
  batchId: 'b1-java-mastery',
  batchName: 'Java Full Stack & DSA Spring 2026',
  trainerName: 'Prof. S. Kulkarni',
  startedAt: new Date().toISOString(),
  attendeesCount: 142,
  cameraRequestSent: false,
  activePoll: {
    id: 'poll-1',
    question: 'Which tree structure guarantees O(log n) worst-case lookup through self-balancing?',
    options: ['Binary Search Tree (Standard)', 'AVL Tree / Red-Black Tree', 'Trie', 'B-Tree only on disk'],
    correctAnswer: 'AVL Tree / Red-Black Tree',
    isOpen: true,
    responsesCount: {
      'AVL Tree / Red-Black Tree': 108,
      'Binary Search Tree (Standard)': 24,
      'Trie': 6,
      'B-Tree only on disk': 4,
    },
  },
};

// GET live session state
export async function GET() {
  return NextResponse.json({ success: true, data: liveClassState });
}

// POST trainer actions (send camera request, push poll)
export async function POST(req: Request) {
  try {
    const { action, pollData } = await req.json();

    if (action === 'request_camera') {
      liveClassState.cameraRequestSent = true;
      return NextResponse.json({
        success: true,
        message: 'Camera enable request dispatched to student participants',
        data: liveClassState,
      });
    }

    if (action === 'push_poll' && pollData) {
      liveClassState.activePoll = {
        id: `poll-${Date.now()}`,
        question: pollData.question,
        options: pollData.options,
        correctAnswer: pollData.correctAnswer,
        isOpen: true,
        responsesCount: {},
      };
      return NextResponse.json({ success: true, data: liveClassState });
    }

    if (action === 'close_poll' && liveClassState.activePoll) {
      liveClassState.activePoll.isOpen = false;
      return NextResponse.json({ success: true, data: liveClassState });
    }

    return NextResponse.json({ success: true, data: liveClassState });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
