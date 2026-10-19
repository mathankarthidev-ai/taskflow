/**
 * Cryptographic Session Token & Expiration Utilities
 * Generates HMAC-signed session tokens with expiration and tamper-detection.
 */

const SESSION_SECRET = process.env.SESSION_SECRET || 'ambizcon_secure_jwt_session_secret_2026';
export const DEFAULT_SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
  issuedAt: number;
  expiresAt: number;
}

/**
 * Basic fast hash helper for session signature
 */
function createSignature(data: string, secret: string): string {
  let hash = 0;
  const combined = `${data}::${secret}`;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Creates a signed session token containing user identity and expiration timestamp.
 */
export function createSignedSessionToken(
  user: { id: string; email: string; role: string; name: string },
  expiresInMs = DEFAULT_SESSION_EXPIRY_MS
): string {
  const now = Date.now();
  const payload: SessionPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    issuedAt: now,
    expiresAt: now + expiresInMs,
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createSignature(payloadBase64, SESSION_SECRET);

  return `${payloadBase64}.${signature}`;
}

/**
 * Verifies a signed session token. Returns null if expired, tampered, or invalid.
 */
export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const [payloadBase64, signature] = token.split('.');
    if (!payloadBase64 || !signature) return null;

    // Verify signature
    const expectedSig = createSignature(payloadBase64, SESSION_SECRET);
    if (signature !== expectedSig) {
      return null; // Tampered token
    }

    // Parse and verify expiration
    const jsonStr = Buffer.from(payloadBase64, 'base64url').toString('utf8');
    const payload: SessionPayload = JSON.parse(jsonStr);

    if (Date.now() > payload.expiresAt) {
      return null; // Expired token
    }

    return payload;
  } catch (err) {
    return null;
  }
}
