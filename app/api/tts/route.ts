import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { text, persona = 'sarah', gender = 'female' } = await req.json();

    if (!text) {
      return NextResponse.json({ success: false, error: 'Text is required for TTS' }, { status: 400 });
    }

    // 1. Check for ElevenLabs API Key
    const elevenLabsKey = process.env.ELEVENLABS_API_KEY;
    if (elevenLabsKey && !elevenLabsKey.includes('placeholder')) {
      // High-quality conversational voice IDs
      const voiceId =
        gender === 'male'
          ? process.env.ELEVENLABS_MALE_VOICE_ID || 'pNInz6obpgDQGcFmaJgB' // Adam
          : process.env.ELEVENLABS_FEMALE_VOICE_ID || '21m00Tcm4TlvDq8ikWAM'; // Rachel

      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': elevenLabsKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.15,
            use_speaker_boost: true,
          },
        }),
      });

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer();
        return new NextResponse(audioBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Length': audioBuffer.byteLength.toString(),
          },
        });
      }
    }

    // 2. Check for Google Cloud Text-to-Speech API
    const googleTTSKey = process.env.GOOGLE_TTS_API_KEY || process.env.GEMINI_API_KEY;
    if (googleTTSKey && process.env.GOOGLE_TTS_ENABLED === 'true') {
      const gVoiceName = gender === 'male' ? 'en-US-Journey-D' : 'en-US-Journey-F';
      const gRes = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleTTSKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: { text },
            voice: { languageCode: 'en-US', name: gVoiceName },
            audioConfig: { audioEncoding: 'MP3', speakingRate: 0.98, pitch: 0.0 },
          }),
        }
      );

      if (gRes.ok) {
        const data = await gRes.json();
        if (data.audioContent) {
          const audioBuffer = Buffer.from(data.audioContent, 'base64');
          return new NextResponse(audioBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'audio/mpeg',
              'Content-Length': audioBuffer.byteLength.toString(),
            },
          });
        }
      }
    }

    // 3. Fallback: Browser Web Speech API metadata instructions
    return NextResponse.json({
      success: true,
      mode: 'browser_speech',
      text,
      rate: 0.96,
      pitch: gender === 'female' ? 1.05 : 0.95,
      voiceGender: gender,
      message: 'High-quality natural browser speech synthesis configuration active',
    });
  } catch (err: unknown) {
    const error = err as Error;
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
