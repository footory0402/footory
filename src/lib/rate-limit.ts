// In-memory rate limiter (single-server environment)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  windowMs: number,
  max: number
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= max) {
    return {
      allowed: false,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    };
  }

  entry.count++;
  return { allowed: true };
}
