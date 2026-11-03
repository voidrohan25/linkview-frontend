import { NextResponse } from 'next/server';
import { interviewStore } from '@/lib/interviewStore';
import { updateUserBatch, getAllUsers } from '@/lib/usersStore';

// GET all batches
export async function GET() {
  try {
    const batches = interviewStore.getBatches();
    const users = getAllUsers();

    // Dynamically calculate enrolled students for each batch
    const enriched = batches.map((b) => {
      const enrolled = users.filter(
        (u) => u.batchCode?.toUpperCase() === b.code.toUpperCase() || (b.students && b.students.includes(u.email))
      );
      return {
        ...b,
        studentCount: enrolled.length > 0 ? enrolled.length : b.studentCount || 0,
        enrolledStudents: enrolled.map((s) => ({
          id: s.id,
          fullName: s.fullName,
          email: s.email,
        })),
      };
    });

    return NextResponse.json({ success: true, data: enriched });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST create batch, assign trainer, add students
export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name || !body.code) {
      return NextResponse.json({ success: false, error: 'Batch Name and Batch Code are required' }, { status: 400 });
    }

    const code = body.code.trim().toUpperCase();
    const technology = body.technology || 'Python Full Stack';
    const trainerName = body.trainerName || 'Rahul Sir (Lead Faculty)';
    const studentEmails: string[] = Array.isArray(body.students) ? body.students : [];

    const created = interviewStore.addBatch({
      name: body.name.trim(),
      code,
      technology,
      trainerName,
      students: studentEmails,
    });

    // Automatically assign enrolled students to this batch code in usersStore
    if (studentEmails.length > 0) {
      studentEmails.forEach((email) => {
        updateUserBatch(email, code);
      });
    }

    return NextResponse.json({
      success: true,
      data: created,
      message: `Batch ${code} created with trainer ${trainerName} and ${studentEmails.length} students enrolled.`,
    }, { status: 201 });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE delete batch
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Batch ID or Code is required' }, { status: 400 });
    }

    const deleted = interviewStore.deleteBatch(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Batch not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Batch ${id} deleted successfully` });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
