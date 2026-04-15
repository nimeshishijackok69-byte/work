# FormFlow

FormFlow is a multi-layer form and review management system built with Next.js App Router, Supabase, and Resend.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local`.

3. Fill in the required environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=
RESEND_API_KEY=
RESEND_FROM_EMAIL=FormFlow <onboarding@resend.dev>
RESEND_REPLY_TO_EMAIL=
RESEND_TEST_EMAIL=
```

4. Start the local app:

```bash
npm run dev
```

## Email Testing

Session 1.6 adds a development-only route at `/api/test-email`.

- `GET /api/test-email` returns configuration status and the available templates.
- `POST /api/test-email` sends a sample email using the selected template.

Example request:

```bash
curl -X POST http://localhost:3000/api/test-email ^
  -H "Content-Type: application/json" ^
  -d "{\"template\":\"submission-confirmation\",\"to\":\"you@example.com\"}"
```

You can also omit `to` if `RESEND_TEST_EMAIL` is set in `.env.local`.

## Useful Commands

```bash
npm run dev
npm run build
npm run lint
npm run type-check
```
