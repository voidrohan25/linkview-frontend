import { NextResponse } from 'next/server';
import { SUPER_ADMIN_EMAILS } from '@/lib/supabase';
import { findTrainerByEmail, acceptTrainerInvitation, getAllTrainers } from '@/lib/usersStore';

// Maintained for backwards compatibility
export const registeredTrainersStore = getAllTrainers();

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Check if email is one of the 2 fixed Super Admin Gmail IDs
    if (SUPER_ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(normalizedEmail)) {
      return NextResponse.json({
        success: true,
        role: 'super_admin',
        email: normalizedEmail,
        fullName: 'Super Administrator',
        redirectTo: '/admin/dashboard',
      });
    }

    // 2. Check if email has been registered or invited by Super Admin as a Trainer
    const trainer = findTrainerByEmail(normalizedEmail);
    if (trainer && trainer.status !== 'suspended') {
      // If was in 'invited' state, mark as accepted/active
      if (trainer.status === 'invited') {
        acceptTrainerInvitation({ email: normalizedEmail });
      }

      return NextResponse.json({
        success: true,
        role: 'trainer',
        email: normalizedEmail,
        fullName: trainer.fullName,
        batchCodes: trainer.batchCodes,
        redirectTo: '/trainer/dashboard',
      });
    }

    // 3. Otherwise, user is a Student (enrolled via batch code or self-registering)
    return NextResponse.json({
      success: true,
      role: 'student',
      email: normalizedEmail,
      fullName: normalizedEmail.split('@')[0],
      redirectTo: '/student/dashboard',
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
