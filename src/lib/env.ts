import { z } from 'zod'

/**
 * Runtime-safe environment variable validation.
 *
 * We only validate the variables that are actually required at the time
 * the feature is used — this keeps local builds and CI smoke tests from
 * breaking when optional integrations (Resend, Sentry) are not yet wired up.
 */

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL.'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required.'),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, 'SUPABASE_SERVICE_ROLE_KEY is required for server-side writes.'),
  NEXTAUTH_SECRET: z.string().min(16, 'NEXTAUTH_SECRET must be at least 16 characters long.'),
  NEXTAUTH_URL: z
    .string()
    .url('NEXTAUTH_URL must be a valid URL.')
    .optional(),
})

export interface EnvValidationResult {
  ok: boolean
  errors: string[]
}

/**
 * Validate the critical server-side environment variables. Returns a
 * structured result rather than throwing, so call sites can decide how
 * aggressively to react (hard fail in prod, warn in dev).
 */
export function validateServerEnv(env: NodeJS.ProcessEnv = process.env): EnvValidationResult {
  const parsed = serverEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
    NEXTAUTH_SECRET: env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: env.NEXTAUTH_URL,
  })

  if (parsed.success) {
    return { ok: true, errors: [] }
  }

  return {
    ok: false,
    errors: parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`),
  }
}

/**
 * Throws if the server env is misconfigured. Use this in boot-critical
 * paths (e.g. scripts/, long-running workers) where we want a loud failure.
 */
export function assertServerEnv(env: NodeJS.ProcessEnv = process.env): void {
  const result = validateServerEnv(env)
  if (!result.ok) {
    throw new Error(
      `Server environment is misconfigured:\n  - ${result.errors.join('\n  - ')}`
    )
  }
}
