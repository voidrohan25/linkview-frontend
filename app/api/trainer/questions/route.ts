import { NextResponse } from 'next/server';
import { interviewStore, QuestionBankItem } from '@/lib/interviewStore';

// GET: Retrieve all questions in the question bank
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tech = searchParams.get('technology');
    const difficulty = searchParams.get('difficulty');
    const search = searchParams.get('search')?.toLowerCase();

    let list = interviewStore.getQuestionBank();

    if (tech && tech !== 'all') {
      list = list.filter((q) => q.technology.toLowerCase() === tech.toLowerCase());
    }

    if (difficulty && difficulty !== 'all') {
      list = list.filter((q) => q.difficulty.toLowerCase() === difficulty.toLowerCase());
    }

    if (search) {
      list = list.filter(
        (q) =>
          q.question.toLowerCase().includes(search) ||
          q.topic.toLowerCase().includes(search) ||
          q.tags.some((t) => t.toLowerCase().includes(search))
      );
    }

    return NextResponse.json({ success: true, data: list, count: list.length });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Manually import single or bulk questions
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Bulk Import (Array of questions)
    if (Array.isArray(body.questions)) {
      if (body.questions.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Empty questions array provided' },
          { status: 400 }
        );
      }

      const imported = interviewStore.addBulkQuestions(body.questions);
      return NextResponse.json(
        {
          success: true,
          message: `Successfully imported ${imported.length} custom interview questions`,
          data: imported,
        },
        { status: 201 }
      );
    }

    // 2. Single Question Manual Entry
    const { technology, topic, difficulty, question, expectedKeypoints, idealAnswer, tags } = body;

    if (!question || !technology) {
      return NextResponse.json(
        { success: false, error: 'Question text and technology track are required' },
        { status: 400 }
      );
    }

    const newQuestion = interviewStore.addQuestion({
      technology,
      topic: topic || 'Custom Topic',
      difficulty: difficulty || 'intermediate',
      question,
      expectedKeypoints: Array.isArray(expectedKeypoints) ? expectedKeypoints : [expectedKeypoints].filter(Boolean),
      idealAnswer: idealAnswer || '',
      tags: tags || [technology, 'CustomTrainerImport'],
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Question successfully added to institute Question Bank',
        data: newQuestion,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Delete a question
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Question ID is required' }, { status: 400 });
    }

    const deleted = interviewStore.deleteQuestion(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Question deleted from bank' });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
