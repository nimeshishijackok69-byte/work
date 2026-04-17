import { describe, it, expect } from 'vitest'
import { validateServerEnv, assertServerEnv } from '@/lib/env'

const validEnv = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://project.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key-placeholder',
  SUPABASE_SERVICE_ROLE_KEY: 'service-role-key-placeholder',
  NEXTAUTH_SECRET: 'this-is-a-long-enough-secret-value',
  NEXTAUTH_URL: 'http://localhost:3000',
} as unknown as NodeJS.ProcessEnv

describe('lib/env — validateServerEnv', () => {
  it('accepts a complete environment', () => {
    const result = validateServerEnv(validEnv)
    expect(result.ok).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('reports missing supabase url', () => {
    const result = validateServerEnv({
      ...validEnv,
      NEXT_PUBLIC_SUPABASE_URL: 'not-a-url',
    } as unknown as NodeJS.ProcessEnv)
    expect(result.ok).toBe(false)
    expect(result.errors.join(' ')).toContain('NEXT_PUBLIC_SUPABASE_URL')
  })

  it('reports short NEXTAUTH_SECRET', () => {
    const result = validateServerEnv({
      ...validEnv,
      NEXTAUTH_SECRET: 'short',
    } as unknown as NodeJS.ProcessEnv)
    expect(result.ok).toBe(false)
    expect(result.errors.join(' ')).toContain('NEXTAUTH_SECRET')
  })

  it('treats NEXTAUTH_URL as optional', () => {
    const { NEXTAUTH_URL: _omit, ...rest } = validEnv as unknown as Record<string, string>
    void _omit
    const result = validateServerEnv(rest as unknown as NodeJS.ProcessEnv)
    expect(result.ok).toBe(true)
  })
})

describe('lib/env — assertServerEnv', () => {
  it('throws with a helpful message when env is broken', () => {
    expect(() =>
      assertServerEnv({ ...validEnv, NEXTAUTH_SECRET: '' } as unknown as NodeJS.ProcessEnv)
    ).toThrow(/misconfigured/)
  })

  it('is a no-op when env is valid', () => {
    expect(() => assertServerEnv(validEnv)).not.toThrow()
  })
})
