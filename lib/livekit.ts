import { AccessToken } from 'livekit-server-sdk';

export interface TokenRequestParams {
  room: string;
  identity: string;
  name?: string;
  role: 'trainer' | 'student';
}

export interface TokenResponse {
  token: string;
  wsUrl: string;
  isConfigured: boolean;
  room: string;
}

export function isLiveKitConfigured(): boolean {
  return Boolean(
    process.env.LIVEKIT_API_KEY &&
    process.env.LIVEKIT_API_SECRET &&
    process.env.LIVEKIT_WS_URL &&
    !process.env.LIVEKIT_API_KEY.includes('your-')
  );
}

export async function generateLiveKitToken(params: TokenRequestParams): Promise<TokenResponse> {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const wsUrl = process.env.LIVEKIT_WS_URL || 'wss://your-project.livekit.cloud';

  const configured = isLiveKitConfigured();

  if (!configured || !apiKey || !apiSecret) {
    // Return a structured development fallback token
    return {
      token: `mock_livekit_token_${params.role}_${params.identity}_${Date.now()}`,
      wsUrl,
      isConfigured: false,
      room: params.room,
    };
  }

  const isTrainer = params.role === 'trainer';

  const at = new AccessToken(apiKey, apiSecret, {
    identity: params.identity,
    name: params.name || params.identity,
    ttl: '4h',
  });

  at.addGrant({
    room: params.room,
    roomJoin: true,
    canPublish: isTrainer, // Trainer can broadcast by default; students publish when requested
    canSubscribe: true,
    canPublishData: true,
  });

  const token = await at.toJwt();

  return {
    token,
    wsUrl,
    isConfigured: true,
    room: params.room,
  };
}
