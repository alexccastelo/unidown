type Bucket = { tokens: number; updatedAt: number };

const buckets = new Map<string, Bucket>();
const CAPACITY = 10;
const REFILL_PER_MS = 10 / 60_000;

export function allow(key: string, now = Date.now()): boolean {
  const bucket = buckets.get(key) ?? { tokens: CAPACITY, updatedAt: now };
  const elapsed = now - bucket.updatedAt;
  const refilled = Math.min(CAPACITY, bucket.tokens + elapsed * REFILL_PER_MS);
  if (refilled < 1) {
    buckets.set(key, { tokens: refilled, updatedAt: now });
    return false;
  }
  buckets.set(key, { tokens: refilled - 1, updatedAt: now });
  return true;
}

export function clientKey(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "local";
}
