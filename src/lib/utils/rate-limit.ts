/**
 * Lightweight in-memory sliding-window rate limiter.
 *
 * Good enough for protecting public endpoints from basic abuse inside a
 * single Node.js process. For horizontal deployments, this should be
 * replaced with a Redis-backed implementation (e.g. Upstash). The shape
 * stays the same so only the store needs to change.
 */

export interface RateLimitEntry {
  count: number
  resetAt: number
}

export interface RateLimitOptions {
  /** The logical bucket name (e.g. "submissions", "register"). */
  bucket: string
  /** Unique identity key (e.g. IP address, email). */
  identifier: string
  /** Maximum allowed requests per window. */
  max: number
  /** Window size in milliseconds. */
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  /** Number of remaining requests in the current window. Can be 0. */
  remaining: number
  /** Unix epoch ms when the bucket resets. */
  resetAt: number
  /** If not allowed, how many seconds the caller should wait (ceil). */
  retryAfterSeconds: number
}

const store = new Map<string, RateLimitEntry>()

function purge(now: number) {
  // Drop a handful of expired entries per call to keep memory bounded.
  let inspected = 0
  for (const [key, entry] of store) {
    if (entry.resetAt < now) {
      store.delete(key)
    }
    inspected += 1
    if (inspected > 50) break
  }
}

export function checkRateLimit(options: RateLimitOptions): RateLimitResult {
  const { bucket, identifier, max, windowMs } = options
  const now = Date.now()
  const key = `${bucket}:${identifier}`

  purge(now)

  const existing = store.get(key)

  if (!existing || existing.resetAt <= now) {
    const entry: RateLimitEntry = { count: 1, resetAt: now + windowMs }
    store.set(key, entry)
    return {
      allowed: true,
      remaining: Math.max(0, max - 1),
      resetAt: entry.resetAt,
      retryAfterSeconds: 0,
    }
  }

  existing.count += 1
  const allowed = existing.count <= max
  const remaining = Math.max(0, max - existing.count)
  const retryAfterSeconds = allowed ? 0 : Math.max(1, Math.ceil((existing.resetAt - now) / 1000))

  return {
    allowed,
    remaining,
    resetAt: existing.resetAt,
    retryAfterSeconds,
  }
}

/** Extract a stable-ish client IP from a Next.js Request. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown'
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp.trim()

  return 'unknown'
}

/** Test-only: clear the in-memory store so tests are deterministic. */
export function __resetRateLimitStoreForTests() {
  store.clear()
}
