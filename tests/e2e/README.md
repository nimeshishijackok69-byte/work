# End-to-end tests

These tests are scaffolded with [Playwright](https://playwright.dev) and are
designed to be safe to run against any running Next.js instance (local dev,
preview, or production) without touching real user data.

## Prerequisites

1. Install browser binaries (only needed once per machine):

   ```bash
   npx playwright install --with-deps chromium
   ```

2. Make sure the app can reach Supabase — either via a local `.env.local`
   that mirrors `.env.example`, or via project env vars in Vercel.

## Running

- **Local dev (auto-starts `npm run dev`):**

  ```bash
  npm run test:e2e
  ```

- **Against an existing deployment:**

  ```bash
  PLAYWRIGHT_BASE_URL=https://your-preview.vercel.app \
  PLAYWRIGHT_SKIP_WEBSERVER=1 \
  npm run test:e2e
  ```

- **Interactive UI mode (great for debugging):**

  ```bash
  npm run test:e2e:ui
  ```

## What's covered

| Spec                         | What it verifies                                                    |
| ---------------------------- | ------------------------------------------------------------------- |
| `smoke.spec.ts`              | Public shell routes render, auth gate redirects from `/admin`.      |
| `submission-validation.spec` | `/api/submissions` rejects anonymous and malformed payloads (4xx).  |

## What's intentionally *not* covered

Full admin / reviewer / participant flows require seeded Supabase accounts
and are better exercised with the manual checklists in
`.ai/execution-guide.md` or the seed script in `scripts/seed-demo.ts`.
