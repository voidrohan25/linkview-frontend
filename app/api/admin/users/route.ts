import { NextResponse } from 'next/server';
import {
  getAllUsers,
  addPlatformUser,
  updatePlatformUserStatus,
  createTrainerInvitation,
  promoteStudentToTrainer,
  demoteTrainerToStudent,
  updateUserBatch,
  deleteUser,
  syncUsers,
  PlatformUser,
} from '@/lib/usersStore';

export type { PlatformUser };

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '25', 10);
  const search = (searchParams.get('search') || '').toLowerCase();
  const role = searchParams.get('role') || 'all';

  let filtered = getAllUsers();

  if (search) {
    filtered = filtered.filter(
      (u) =>
        u.fullName.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        (u.batchCode && u.batchCode.toLowerCase().includes(search))
    );
  }

  if (role !== 'all') {
    filtered = filtered.filter((u) => u.role === role);
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const paginatedData = filtered.slice(startIndex, startIndex + limit);

  return NextResponse.json({
    success: true,
    data: paginatedData,
    users: paginatedData,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.email) {
      return NextResponse.json({ success: false, error: 'Email address is required' }, { status: 400 });
    }

    const role = body.role === 'trainer' ? 'trainer' : 'student';
    const fullName = body.fullName || (role === 'trainer' ? 'Faculty Instructor' : 'Student Examinee');
    const batchCode = body.batchCode || 'JAVA2026';

    const origin = req.headers.get('origin') || 'http://localhost:3000';

    if (role === 'trainer') {
      const { user, trainer, inviteLink, inviteToken } = createTrainerInvitation({
        fullName,
        email: body.email,
        batchCode,
        baseUrl: origin,
      });

      return NextResponse.json(
        {
          success: true,
          data: user,
          trainer,
          inviteLink,
          inviteToken,
          message: `Trainer invitation generated for ${body.email}. They can now accept and login as Trainer with this Gmail ID.`,
        },
        { status: 201 }
      );
    }

    const newUser = addPlatformUser({
      fullName,
      email: body.email.trim().toLowerCase(),
      role: 'student',
      status: 'active',
      batchCode,
    });

    return NextResponse.json({ success: true, data: newUser }, { status: 201 });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { userId, action, status, batchCodes, users: incomingUsers } = body;

    if (action === 'sync_users' && Array.isArray(incomingUsers)) {
      const merged = syncUsers(incomingUsers);
      return NextResponse.json({ success: true, message: 'Users synchronized successfully', data: merged });
    }

    if (action === 'promote_to_trainer') {
      const success = promoteStudentToTrainer(userId, batchCodes || []);
      if (!success) {
        return NextResponse.json({ success: false, error: 'User not found or cannot be promoted' }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'User successfully promoted to Trainer' });
    }

    if (action === 'demote_to_student') {
      const success = demoteTrainerToStudent(userId);
      if (!success) {
        return NextResponse.json({ success: false, error: 'User not found or cannot be demoted' }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'User successfully demoted to Student' });
    }

    if (action === 'update_batch' || body.batchCode) {
      const updated = updateUserBatch(userId, body.batchCode);
      if (!updated) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: updated, message: `Batch updated to ${body.batchCode}` });
    }

    if (status) {
      const user = updatePlatformUserStatus(userId, status);
      if (!user) {
        return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: user });
    }

    return NextResponse.json({ success: false, error: 'Invalid action or parameters' }, { status: 400 });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Delete a student or trainer from the institution roster
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const success = deleteUser(userId);
    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'User not found or cannot be deleted (e.g. protected Super Admin account)',
      }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: `User ${userId} deleted successfully` });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
