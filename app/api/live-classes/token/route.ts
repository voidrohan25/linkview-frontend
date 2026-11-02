import { NextResponse } from 'next/server';
import { generateLiveKitToken, isLiveKitConfigured } from '@/lib/livekit';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const room = searchParams.get('room') || 'link-test-live-class';
    const identity = searchParams.get('identity') || `user-${Date.now().toString(36)}`;
    const name = searchParams.get('name') || identity;
    const role = (searchParams.get('role') || 'student') as 'trainer' | 'student';

    const tokenData = await generateLiveKitToken({
      room,
      identity,
      name,
      role,
    });

    return NextResponse.json({
      success: true,
      data: tokenData,
      status: tokenData.isConfigured ? 'livekit_cloud_active' : 'local_preview_mode',
      instructions: !tokenData.isConfigured
        ? 'LiveKit keys not yet detected. Add LIVEKIT_API_KEY, LIVEKIT_API_SECRET, and LIVEKIT_WS_URL to .env.local or Vercel.'
        : 'LiveKit Cloud active.',
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const room = body.room || 'link-test-live-class';
    const identity = body.identity || `user-${Date.now().toString(36)}`;
    const name = body.name || identity;
    const role = (body.role || 'student') as 'trainer' | 'student';

    const tokenData = await generateLiveKitToken({
      room,
      identity,
      name,
      role,
    });

    return NextResponse.json({
      success: true,
      data: tokenData,
      status: tokenData.isConfigured ? 'livekit_cloud_active' : 'local_preview_mode',
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
