import type { NextConfig } from 'next'

/**
 * Security response headers applied to every route.
 *
 * CSP is intentionally pragmatic:
 *   - `unsafe-inline` is required for Next.js injected styles & the dev
 *     overlay.  Moving to nonces is a future-phase improvement.
 *   - Supabase origins are whitelisted for API + storage.
 *   - Vercel Analytics / Speed Insights endpoints are whitelisted.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const supabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : ''
const supabaseWildcard = '*.supabase.co'

const cspDirectives: Array<[string, string[]]> = [
  ['default-src', ["'self'"]],
  [
    'script-src',
    [
      "'self'",
      "'unsafe-inline'",
      "'unsafe-eval'",
      'https://va.vercel-scripts.com',
    ],
  ],
  ['style-src', ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com']],
  ['img-src', ["'self'", 'data:', 'blob:', `https://${supabaseWildcard}`]],
  ['font-src', ["'self'", 'data:', 'https://fonts.gstatic.com']],
  [
    'connect-src',
    [
      "'self'",
      supabaseOrigin,
      `https://${supabaseWildcard}`,
      `wss://${supabaseWildcard}`,
      'https://vitals.vercel-insights.com',
      'https://va.vercel-scripts.com',
    ].filter(Boolean),
  ],
  ['frame-ancestors', ["'none'"]],
  ['base-uri', ["'self'"]],
  ['form-action', ["'self'"]],
  ['object-src', ["'none'"]],
  ['upgrade-insecure-requests', []],
]

const contentSecurityPolicy = cspDirectives
  .map(([directive, values]) =>
    values.length > 0 ? `${directive} ${values.join(' ')}` : directive
  )
  .join('; ')

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
]

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ['*.vercel.app', 'localhost:3000'],
    },
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
