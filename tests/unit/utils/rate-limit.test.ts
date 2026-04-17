import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  checkRateLimit,
  getClientIp,
  __resetRateLimitStoreForTests,
} from '@/lib/utils/rate-limit'

describe('utils/rate-limit — checkRateLimit', () => {
  beforeEach(() => {
    __resetRateLimitStoreForTests()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-17T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows requests up to the configured max', () => {
    for (let i = 0; i < 5; i += 1) {
      const result = checkRateLimit({
        bucket: 'test',
        identifier: '1.1.1.1',
        max: 5,
        windowMs: 60_000,
      })
      expect(result.allowed).toBe(true)
    }
  })

  it('blocks the request that exceeds the max', () => {
    for (let i = 0; i < 5; i += 1) {
      checkRateLimit({ bucket: 'test', identifier: '1.1.1.1', max: 5, windowMs: 60_000 })
    }
    const result = checkRateLimit({
      bucket: 'test',
      identifier: '1.1.1.1',
      max: 5,
      windowMs: 60_000,
    })
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('resets after the window expires', () => {
    for (let i = 0; i < 5; i += 1) {
      checkRateLimit({ bucket: 'test', identifier: '1.1.1.1', max: 5, windowMs: 60_000 })
    }
    expect(
      checkRateLimit({ bucket: 'test', identifier: '1.1.1.1', max: 5, windowMs: 60_000 }).allowed
    ).toBe(false)

    // Advance past the window
    vi.advanceTimersByTime(61_000)

    expect(
      checkRateLimit({ bucket: 'test', identifier: '1.1.1.1', max: 5, windowMs: 60_000 }).allowed
    ).toBe(true)
  })

  it('isolates buckets and identifiers', () => {
    for (let i = 0; i < 5; i += 1) {
      checkRateLimit({ bucket: 'A', identifier: '1.1.1.1', max: 5, windowMs: 60_000 })
    }
    expect(
      checkRateLimit({ bucket: 'B', identifier: '1.1.1.1', max: 5, windowMs: 60_000 }).allowed
    ).toBe(true)
    expect(
      checkRateLimit({ bucket: 'A', identifier: '2.2.2.2', max: 5, windowMs: 60_000 }).allowed
    ).toBe(true)
  })
})

describe('utils/rate-limit — getClientIp', () => {
  it('reads the first x-forwarded-for value', () => {
    const request = new Request('http://localhost/', {
      headers: { 'x-forwarded-for': '10.0.0.1, 10.0.0.2' },
    })
    expect(getClientIp(request)).toBe('10.0.0.1')
  })

  it('falls back to x-real-ip', () => {
    const request = new Request('http://localhost/', {
      headers: { 'x-real-ip': '10.0.0.99' },
    })
    expect(getClientIp(request)).toBe('10.0.0.99')
  })

  it('returns "unknown" when no header is present', () => {
    const request = new Request('http://localhost/')
    expect(getClientIp(request)).toBe('unknown')
  })
})
