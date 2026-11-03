import { NextResponse } from 'next/server';
import { SUPER_ADMIN_EMAILS } from '@/lib/supabase';
import {
  findTrainerByEmail,
  acceptTrainerInvitation,
  getAllTrainers,
  getUserByEmail,
  getOrCreateGoogleUser,
  ADMIN_EMAILS,
} from '@/lib/usersStore';

// Maintained for backwards compatibility
export const registeredTrainersStore = getAllTrainers();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    if (!email) {
      return NextResponse.json({ success: false, authenticated: false, user: null });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const allAdminEmails = [...SUPER_ADMIN_EMAILS, ...ADMIN_EMAILS].map((e) => e.toLowerCase());

    if (allAdminEmails.includes(normalizedEmail)) {
      const adminToken = req.headers.get('x-admin-token');
      if (adminToken !== 'linktest_admin_valid_token_2026') {
        return NextResponse.json({
          success: false,
          authenticated: false,
          user: null,
          error: 'Admin session requires fixed credentials verification. Please log in.',
        }, { status: 200 });
      }

      const adminUser = getUserByEmail(normalizedEmail);
      return NextResponse.json({
        success: true,
        authenticated: true,
        role: 'admin',
        normalizedRole: 'admin',
        user: adminUser || { email: normalizedEmail, role: 'admin' },
        redirectTo: '/admin/dashboard',
      });
    }

    const existingUser = getUserByEmail(normalizedEmail);
    if (existingUser) {
      const role = existingUser.role === 'trainer' ? 'trainer' : 'student';
      return NextResponse.json({
        success: true,
        authenticated: true,
        role,
        normalizedRole: role,
        user: existingUser,
        redirectTo: role === 'trainer' ? '/trainer/dashboard' : '/student/dashboard',
      });
    }

    return NextResponse.json({ success: false, authenticated: false, user: null });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { email, fullName, avatarUrl, adminToken: bodyAdminToken } = await req.json();
    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const token = req.headers.get('x-admin-token') || bodyAdminToken;

    // 1. Authoritative Admin check: Fixed Super Admin Gmail IDs or ADMIN_EMAILS
    const allAdminEmails = [...SUPER_ADMIN_EMAILS, ...ADMIN_EMAILS].map((e) => e.toLowerCase());
    if (allAdminEmails.includes(normalizedEmail)) {
      if (token !== 'linktest_admin_valid_token_2026') {
        return NextResponse.json({
          success: false,
          authenticated: false,
          user: null,
          error: 'Admin verification required. Please sign in with fixed credentials.',
        }, { status: 200 });
      }

      const adminUser = getOrCreateGoogleUser({
        email: normalizedEmail,
        fullName: fullName || 'Rahul Sir (Founder & Admin)',
        avatarUrl,
      });

      return NextResponse.json({
        success: true,
        role: 'admin',
        normalizedRole: 'admin',
        user: {
          ...adminUser,
          role: 'admin',
        },
        email: normalizedEmail,
        fullName: adminUser.fullName,
        redirectTo: '/admin/dashboard',
      });
    }

    // 2. Check existing user record in authoritative store
    const existingUser = getUserByEmail(normalizedEmail);
    if (existingUser) {
      if (existingUser.role === 'super_admin') {
        return NextResponse.json({
          success: true,
          role: 'admin',
          normalizedRole: 'admin',
          user: { ...existingUser, role: 'admin' },
          email: normalizedEmail,
          fullName: existingUser.fullName,
          redirectTo: '/admin/dashboard',
        });
      }

      if (existingUser.role === 'trainer') {
        const trainer = findTrainerByEmail(normalizedEmail);
        return NextResponse.json({
          success: true,
          role: 'trainer',
          normalizedRole: 'trainer',
          user: {
            id: existingUser.id,
            fullName: existingUser.fullName,
            email: existingUser.email,
            role: 'trainer',
            batchCodes: trainer?.batchCodes || (existingUser.batchCode ? [existingUser.batchCode] : ['GLOBAL']),
          },
          email: normalizedEmail,
          fullName: existingUser.fullName,
          batchCodes: trainer?.batchCodes || (existingUser.batchCode ? [existingUser.batchCode] : ['GLOBAL']),
          redirectTo: '/trainer/dashboard',
        });
      }
    }

    // 3. Check if email has been registered or invited by Super Admin as a Trainer
    const trainer = findTrainerByEmail(normalizedEmail);
    if (trainer && trainer.status !== 'suspended') {
      if (trainer.status === 'invited') {
        acceptTrainerInvitation({ email: normalizedEmail });
      }

      return NextResponse.json({
        success: true,
        role: 'trainer',
        normalizedRole: 'trainer',
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

    // 4. Otherwise, user is strictly a Student (STRICT REQUIREMENT)
    // Register or retrieve from usersStore so they appear on Admin panel immediately
    const studentUser = getOrCreateGoogleUser({
      email: normalizedEmail,
      fullName: fullName || normalizedEmail.split('@')[0],
      avatarUrl,
    });

    const resolvedRole = studentUser.role === 'trainer' ? 'trainer' : 'student';
    const redirectTo = resolvedRole === 'trainer' ? '/trainer/dashboard' : '/student/dashboard';

    return NextResponse.json({
      success: true,
      role: resolvedRole,
      normalizedRole: resolvedRole,
      user: {
        ...studentUser,
        role: resolvedRole,
      },
      email: normalizedEmail,
      fullName: studentUser.fullName,
      redirectTo,
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
