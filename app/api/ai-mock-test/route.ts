import { NextResponse } from 'next/server';
import { generateAIQuestions, AIQuestion } from '@/lib/ai';

export interface GeneratedQuestion {
  id: string;
  prompt: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
}

// Built-in curated question generation bank per topic & difficulty
const questionBank: Record<string, GeneratedQuestion[]> = {
  java: [
    {
      id: 'g-j1',
      prompt: 'What happens if two threads simultaneously call a synchronized method on different instances of the same class?',
      options: [
        'They block each other because the lock is per-class',
        'They execute concurrently because the intrinsic lock is per-instance',
        'JVM throws an IllegalMonitorStateException',
        'One thread waits until the first thread finishes',
      ],
      correctAnswer: 'They execute concurrently because the intrinsic lock is per-instance',
      explanation: 'Synchronized instance methods acquire the monitor lock of "this" instance. Two distinct objects possess separate monitor locks.',
      difficulty: 'medium',
      topic: 'Java Concurrency',
    },
    {
      id: 'g-j2',
      prompt: 'Which Garbage Collector was made the default in OpenJDK 9+ designed for large heaps with low pause targets?',
      options: ['Serial GC', 'Parallel GC', 'G1 (Garbage-First) GC', 'ZGC'],
      correctAnswer: 'G1 (Garbage-First) GC',
      explanation: 'G1 GC divides heap memory into equal regions and prioritizes regions with the most garbage, making it default since Java 9.',
      difficulty: 'medium',
      topic: 'JVM Internals',
    },
    {
      id: 'g-j3',
      prompt: 'What is the consequence of failing to override hashCode() when overriding equals() in a Java class used in HashMaps?',
      options: [
        'Compilation error',
        'Equal objects may land in different hash buckets and cannot be retrieved correctly',
        'NullPointerException when calling map.get()',
        'StackOverflowError during hashing',
      ],
      correctAnswer: 'Equal objects may land in different hash buckets and cannot be retrieved correctly',
      explanation: 'Equal objects must return the exact same hashCode. Otherwise, HashMap computes different bucket indices.',
      difficulty: 'hard',
      topic: 'Java Collections',
    },
  ],
  dsa: [
    {
      id: 'g-d1',
      prompt: 'Given an array with both positive and negative integers, which algorithm finds the maximum subarray sum in O(n) time?',
      options: ['Floyd-Warshall Algorithm', 'Kadane Algorithm', 'Kruskal Algorithm', 'Dijkstra Algorithm'],
      correctAnswer: 'Kadane Algorithm',
      explanation: 'Kadane algorithm maintains max_ending_here and max_so_far in a single linear pass.',
      difficulty: 'medium',
      topic: 'Dynamic Programming',
    },
    {
      id: 'g-d2',
      prompt: 'What is the tight worst-case time complexity of inserting n items into an initially empty self-balancing AVL Tree?',
      options: ['O(n)', 'O(n log n)', 'O(n^2)', 'O(log n)'],
      correctAnswer: 'O(n log n)',
      explanation: 'Each insertion takes O(log n) height traversal plus constant rotations. For n elements, total time is O(n log n).',
      difficulty: 'hard',
      topic: 'Trees & Graphs',
    },
    {
      id: 'g-d3',
      prompt: 'Which data structure can evaluate mathematical expressions in Reverse Polish Notation (RPN) in linear time?',
      options: ['Queue', 'Stack', 'PriorityQueue', 'Trie'],
      correctAnswer: 'Stack',
      explanation: 'Operands are pushed onto the stack, and encountering an operator pops the top two operands and evaluates.',
      difficulty: 'easy',
      topic: 'Stacks & Queues',
    },
  ],
  python: [
    {
      id: 'g-p1',
      prompt: 'What is the primary technical role of the Global Interpreter Lock (GIL) in standard CPython?',
      options: [
        'To speed up CPU-bound multithreaded calculation',
        'To prevent race conditions in CPython memory management and reference counts',
        'To compile bytecode into machine instructions ahead-of-time',
        'To prevent recursion limit exceptions',
      ],
      correctAnswer: 'To prevent race conditions in CPython memory management and reference counts',
      explanation: 'The GIL synchronizes access to Python objects, preventing multiple native threads from concurrently executing Python bytecode.',
      difficulty: 'medium',
      topic: 'Python Internals',
    },
    {
      id: 'g-p2',
      prompt: 'How does a Python generator function fundamentally differ from a standard function that returns a list?',
      options: [
        'Generators can only return integers',
        'Generators yield values lazily on demand without allocating the full list in memory',
        'Generators run in separate background processes',
        'Generators are deprecated in Python 3',
      ],
      correctAnswer: 'Generators yield values lazily on demand without allocating the full list in memory',
      explanation: 'Yield produces an iterator that generates elements on request, providing O(1) auxiliary space.',
      difficulty: 'easy',
      topic: 'Generators & Iterators',
    },
  ],
};

// POST: Dynamically generate an AI mock test customized for the student
export async function POST(req: Request) {
  try {
    const { topic = 'dsa', questionCount = 3, difficulty = 'medium' } = await req.json();

    // 1. Attempt dynamic live LLM generation if AI API key is configured
    let selectedQuestions: GeneratedQuestion[] | null = null;
    const aiGenerated = await generateAIQuestions(topic, Number(questionCount), difficulty);
    if (aiGenerated && aiGenerated.length > 0) {
      selectedQuestions = aiGenerated;
    }

    // 2. Fall back to curated deterministic question bank
    if (!selectedQuestions || selectedQuestions.length === 0) {
      const pool = questionBank[topic] || questionBank.dsa;
      selectedQuestions = pool.slice(0, Number(questionCount));
    }

    const testId = `ai-mock-${Date.now()}`;
    const generatedTest = {
      id: testId,
      title: `AI Personalized Assessment: ${topic.toUpperCase()} Mastery`,
      topic,
      difficulty,
      durationMinutes: selectedQuestions.length * 10,
      totalMarks: selectedQuestions.length * 10,
      questions: selectedQuestions,
    };

    return NextResponse.json({ success: true, data: generatedTest });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
