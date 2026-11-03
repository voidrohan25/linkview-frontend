import { NextResponse } from 'next/server';
import { SUPER_ADMIN_EMAILS } from '@/lib/supabase';
import {
  findTrainerByEmail,
  acceptTrainerInvitation,
  getAllTrainers,
  getOrCreateGoogleUser,
  ADMIN_EMAILS,
} from '@/lib/usersStore';

// Maintained for backwards compatibility
export const registeredTrainersStore = getAllTrainers();

export async function POST(req: Request) {
  try {
    const { email, fullName, avatarUrl } = await req.json();
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check if email is one of the fixed Super Admin Gmail IDs or ADMIN_EMAILS
    const allAdminEmails = [...SUPER_ADMIN_EMAILS, ...ADMIN_EMAILS].map((e) => e.toLowerCase());
    if (allAdminEmails.includes(normalizedEmail)) {
      const adminUser = getOrCreateGoogleUser({
        email: normalizedEmail,
        fullName: fullName || 'Super Administrator',
        avatarUrl,
      });

      return NextResponse.json({
        success: true,
        role: 'super_admin',
        user: adminUser,
        email: normalizedEmail,
        fullName: adminUser.fullName,
        redirectTo: '/admin/dashboard',
      });
    }

    // 2. Check if email has been registered or invited by Super Admin as a Trainer
    const trainer = findTrainerByEmail(normalizedEmail);
    if (trainer && trainer.status !== 'suspended') {
      if (trainer.status === 'invited') {
        acceptTrainerInvitation({ email: normalizedEmail });
      }

      return NextResponse.json({
        success: true,
        role: 'trainer',
        user: {
          id: trainer.id,
          fullName: trainer.fullName,
          email: trainer.email,
          role: 'trainer',
          batchCodes: trainer.batchCodes,
        },
        email: normalizedEmail,
        fullName: trainer.fullName,
        batchCodes: trainer.batchCodes,
        redirectTo: '/trainer/dashboard',
      });
    }

    // 3. Otherwise, user is strictly a Student (STRICT REQUIREMENT)
    // Register or retrieve from usersStore so they appear on Admin panel immediately
    const studentUser = getOrCreateGoogleUser({
      email: normalizedEmail,
      fullName: fullName || normalizedEmail.split('@')[0],
      avatarUrl,
    });

    return NextResponse.json({
      success: true,
      role: 'student',
      user: studentUser,
      email: normalizedEmail,
      fullName: studentUser.fullName,
      redirectTo: '/student/dashboard',
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
