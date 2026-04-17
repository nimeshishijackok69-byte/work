#!/usr/bin/env node
/**
 * scripts/bootstrap-admin.mjs
 *
 * One-time bootstrap for a fresh Supabase project:
 *   1. Creates an auth user (email + password)
 *   2. Inserts the matching admin_profile row
 *
 * Usage:
 *   node --env-file=.env.local scripts/bootstrap-admin.mjs
 *
 * Required env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional env (CLI args override):
 *   BOOTSTRAP_ADMIN_EMAIL     (default: admin@formflow.com)
 *   BOOTSTRAP_ADMIN_PASSWORD  (default: admin123 -- CHANGE IN PROD)
 *   BOOTSTRAP_ADMIN_NAME      (default: Super Admin)
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. ' +
      'Run with: node --env-file=.env.local scripts/bootstrap-admin.mjs'
  )
  process.exit(1)
}

// Very small arg parser: --email=foo --password=bar --name="Full Name"
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...rest] = a.replace(/^--/, '').split('=')
    return [k, rest.join('=')]
  })
)

const email = args.email || process.env.BOOTSTRAP_ADMIN_EMAIL || 'admin@formflow.com'
const password = args.password || process.env.BOOTSTRAP_ADMIN_PASSWORD || 'admin123'
const name = args.name || process.env.BOOTSTRAP_ADMIN_NAME || 'Super Admin'

if (password === 'admin123') {
  console.warn(
    '[bootstrap-admin] WARNING: using default password "admin123". ' +
      'Pass --password=... for production.'
  )
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  console.log(`[bootstrap-admin] Creating auth user for ${email}...`)

  // Try to create. If it already exists, look it up instead.
  let authUserId

  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  })

  if (createErr) {
    const msg = createErr.message || ''
    const alreadyExists =
      msg.toLowerCase().includes('already registered') ||
      msg.toLowerCase().includes('already exists') ||
      createErr.status === 422
    if (!alreadyExists) {
      console.error('[bootstrap-admin] Failed to create auth user:', createErr)
      process.exit(1)
    }
    console.log('[bootstrap-admin] Auth user already exists, looking it up...')
    const { data: list, error: listErr } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    })
    if (listErr) {
      console.error('[bootstrap-admin] Failed to list users:', listErr)
      process.exit(1)
    }
    const match = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (!match) {
      console.error('[bootstrap-admin] Could not find existing user for', email)
      process.exit(1)
    }
    authUserId = match.id
  } else {
    authUserId = created.user.id
  }

  console.log('[bootstrap-admin] Upserting admin_profile for', authUserId)
  const { error: profileErr } = await supabase.from('admin_profile').upsert(
    {
      auth_user_id: authUserId,
      email,
      name,
      role: 'admin',
      is_active: true,
    },
    { onConflict: 'email' }
  )

  if (profileErr) {
    console.error('[bootstrap-admin] Failed to upsert admin_profile:', profileErr)
    process.exit(1)
  }

  console.log('[bootstrap-admin] Done. Login with:')
  console.log('   email    :', email)
  console.log('   password :', password)
}

main().catch((err) => {
  console.error('[bootstrap-admin] Unexpected error:', err)
  process.exit(1)
})
