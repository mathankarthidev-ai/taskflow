/**
 * In-Memory Sliding-Window API Rate Limiter
 * Protects authentication, chat, and attendance endpoints from brute-force attacks and abuse.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic cleanup of stale IP/client records (every 2 minutes)
const CLEANUP_INTERVAL_MS = 2 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleEntries(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [key, record] of rateLimitStore.entries()) {
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
    if (record.timestamps.length === 0) {
      rateLimitStore.delete(key);
    }
  }
}

export interface RateLimitConfig {
  maxRequests: number; // e.g., 5 requests
  windowSeconds: number; // e.g., in 60 seconds
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Checks and updates rate limit for a given key (e.g., client IP or User ID).
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { maxRequests: 20, windowSeconds: 60 }
): RateLimitResult {
  const windowMs = config.windowSeconds * 1000;
  cleanupStaleEntries(windowMs);

  const now = Date.now();
  const record = rateLimitStore.get(identifier) || { timestamps: [] };

  // Filter timestamps within the current sliding window
  const activeTimestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (activeTimestamps.length >= config.maxRequests) {
    const oldestTimestamp = activeTimestamps[0];
    const resetInSeconds = Math.ceil((oldestTimestamp + windowMs - now) / 1000);

    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetInSeconds: Math.max(1, resetInSeconds),
    };
  }

  // Record this valid request
  activeTimestamps.push(now);
  rateLimitStore.set(identifier, { timestamps: activeTimestamps });

  return {
    success: true,
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - activeTimestamps.length),
    resetInSeconds: config.windowSeconds,
  };
}

/**
 * Helper to extract client identifier (IP address or fallback token) from Request
 */
export function getClientIdentifier(req: Request, prefix = 'api'): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwarded ? forwarded.split(',')[0].trim() : realIp || '127.0.0.1';
  return `${prefix}:${ip}`;
}
