import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRateLimit } from "@/lib/rateLimit";

// Each test uses a unique key to avoid state collision
// since rateLimitMap is module-scoped and persists across tests.
let keyCounter = 0;
function uniqueKey() {
  return `test-${Date.now()}-${keyCounter++}`;
}

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("allows the first request", () => {
    const key = uniqueKey();
    const result = checkRateLimit(key, 60_000, 5);
    expect(result.allowed).toBe(true);
  });

  it("allows up to max requests", () => {
    const key = uniqueKey();
    // Real impl: first call sets count=1, then checks count >= max before incrementing
    // With max=5: calls 1-5 all succeed (counts 1,2,3,4,5), call 6 blocked
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(key, 60_000, 5);
      expect(result.allowed).toBe(true);
    }
    const blocked = checkRateLimit(key, 60_000, 5);
    expect(blocked.allowed).toBe(false);
  });

  it("blocks when count reaches max", () => {
    const key = uniqueKey();
    // Real impl: first call creates entry with count=1, subsequent calls check count >= max before incrementing
    // max=3: call 1 (new, count=1, ok), call 2 (1<3, count->2, ok), call 3 (2<3, count->3, ok), call 4 (3>=3, blocked)
    checkRateLimit(key, 60_000, 3);
    checkRateLimit(key, 60_000, 3);
    checkRateLimit(key, 60_000, 3);
    const result = checkRateLimit(key, 60_000, 3);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("retryAfter is in seconds", () => {
    const key = uniqueKey();
    checkRateLimit(key, 60_000, 1); // count=1
    const result = checkRateLimit(key, 60_000, 1); // blocked
    expect(result.allowed).toBe(false);
    // retryAfter should be <= 60 (seconds, not ms)
    expect(result.retryAfter).toBeLessThanOrEqual(60);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it("resets after window expires", () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);

    const key = uniqueKey();
    checkRateLimit(key, 1_000, 1); // count=1
    const blocked = checkRateLimit(key, 1_000, 1);
    expect(blocked.allowed).toBe(false);

    // Advance time past window
    vi.spyOn(Date, "now").mockReturnValue(now + 1_001);

    const result = checkRateLimit(key, 1_000, 1);
    expect(result.allowed).toBe(true);
  });

  it("tracks different keys independently", () => {
    const keyA = uniqueKey();
    const keyB = uniqueKey();

    checkRateLimit(keyA, 60_000, 1); // count=1
    const blockedA = checkRateLimit(keyA, 60_000, 1);
    expect(blockedA.allowed).toBe(false);

    const allowedB = checkRateLimit(keyB, 60_000, 1);
    expect(allowedB.allowed).toBe(true);
  });
});
