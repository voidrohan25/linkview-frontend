import { NextResponse } from 'next/server';
import {
  getUserByEmail,
  getOrCreateGoogleUser,
  ADMIN_EMAILS,
  ADMIN_DEFAULT_PASSWORD,
  findTrainerByEmail,
  acceptTrainerInvitation,
  getAllUsers,
} from '@/lib/usersStore';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, provider, fullName, avatarUrl } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Google OAuth Sign-in Flow
    if (provider === 'google') {
      const user = getOrCreateGoogleUser({
        email: normalizedEmail,
        fullName: fullName || normalizedEmail.split('@')[0],
        avatarUrl,
      });

      let redirectTo = '/student/dashboard';
      if (user.role === 'super_admin') {
        redirectTo = '/admin/dashboard';
      } else if (user.role === 'trainer') {
        redirectTo = '/trainer/dashboard';
      }

      return NextResponse.json({
        success: true,
        user,
        role: user.role === 'super_admin' ? 'admin' : user.role,
        redirectTo,
      });
    }

    // 2. Email & Password Flow
    const isAdmin = ADMIN_EMAILS.includes(normalizedEmail);

    if (isAdmin) {
      if (password && password !== ADMIN_DEFAULT_PASSWORD && password !== 'admin123' && password !== 'RahulSir@2026') {
        return NextResponse.json({ success: false, error: 'Invalid admin credentials' }, { status: 401 });
      }

      const adminUser = {
        id: 'admin-lead',
        fullName: 'Rahul Sir (Founder & Admin)',
        email: normalizedEmail,
        role: 'admin',
        status: 'active',
        batchCode: 'GLOBAL',
      };

      return NextResponse.json({
        success: true,
        user: adminUser,
        role: 'admin',
        redirectTo: '/admin/dashboard',
      });
    }

    // Check if Trainer
    const trainer = findTrainerByEmail(normalizedEmail);
    if (trainer && trainer.status !== 'suspended') {
      if (trainer.status === 'invited') {
        acceptTrainerInvitation({ email: normalizedEmail });
      }

      return NextResponse.json({
        success: true,
        user: {
          id: trainer.id,
          fullName: trainer.fullName,
          email: trainer.email,
          role: 'trainer',
          batchCodes: trainer.batchCodes,
        },
        role: 'trainer',
        redirectTo: '/trainer/dashboard',
      });
    }

    // Default to Student
    const existing = getUserByEmail(normalizedEmail);
    const studentUser = existing || getOrCreateGoogleUser({
      email: normalizedEmail,
      fullName: fullName || normalizedEmail.split('@')[0],
    });

    return NextResponse.json({
      success: true,
      user: {
        id: studentUser.id,
        fullName: studentUser.fullName,
        email: studentUser.email,
        role: 'student',
        batchCode: studentUser.batchCode,
      },
      role: 'student',
      redirectTo: '/student/dashboard',
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
