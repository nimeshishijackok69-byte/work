# FormFlow

Multi-layer form & review management system for 30,000+ schools.

FormFlow is a multi-layer form and review management system built with Next.js App Router, Supabase, and Resend.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL 15+)
- **Auth**: NextAuth.js v5
- **Email**: Resend
- **Styling**: Tailwind CSS + shadcn/ui
- **Forms**: React Hook Form + Zod
- **State**: Zustand
- **Charts**: Recharts
- **Deployment**: Vercel

## Setup

### Prerequisites

- Node.js 18+ installed
- Docker (for local Supabase)
- Supabase account (free tier works)
- Resend account (free tier works)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in the required values:

```env
# NextAuth
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here-generate-with-openssl-rand-base64-32

# Resend
RESEND_API_KEY=re_your-api-key
RESEND_FROM_EMAIL=FormFlow <onboarding@resend.dev>
RESEND_REPLY_TO_EMAIL=
RESEND_TEST_EMAIL=
```

#### Getting Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Navigate to Project Settings → API
3. Copy the URL, anon key, and service role key
4. For local development, run `npx supabase start` after initializing

#### Getting Resend API Key

1. Go to [resend.com](https://resend.com) and sign up
2. Navigate to API Keys
3. Create a new API key and copy it

### 3. Set Up Local Supabase

```bash
# Initialize Supabase locally
npx supabase init

# Start local Supabase (requires Docker)
npx supabase start

# Apply database migrations
npx supabase db reset

# Seed with initial admin user
# The seed.sql file creates an admin with email: admin@formflow.com, password: admin123
```

### Supabase Startup Troubleshooting

If local startup fails during migration/seed, run a full reset with debug logs:

```bash
npx.cmd -y supabase@latest db reset --debug
```

Common failure:
- `ERROR: column "app_metadata" of relation "users" does not exist (SQLSTATE 42703)`

Cause:
- Different Supabase Auth versions expose metadata columns as either:
  - `app_metadata` / `user_metadata` (older)
  - `raw_app_meta_data` / `raw_user_meta_data` (current)

Resolution in this project:
- `supabase/seed.sql` now detects the available metadata column names at runtime and inserts into the correct columns.
- The seed also writes a valid bcrypt password hash (`crypt(..., gen_salt('bf'))`) so `signInWithPassword()` works locally.

Verification checklist:
- `npx.cmd -y supabase@latest start` completes without seed errors.
- `docker ps` shows Supabase service containers running.
- Login works with seeded credentials: `admin@formflow.com` / `admin123`.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Email Testing

Session 1.6 adds a development-only route at `/api/test-email`.

- `GET /api/test-email` returns configuration status and the available templates.
- `POST /api/test-email` sends a sample email using the selected template.

Example request:

```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d "{\"template\":\"submission-confirmation\",\"to\":\"you@example.com\"}"
```

You can also omit `to` if `RESEND_TEST_EMAIL` is set in `.env.local`.

## Available Scripts

```bash
npm run dev           # Start development server
npm run build         # Build for production
npm run start         # Start production server
npm run type-check    # TypeScript type checking
npm run lint          # ESLint
npm run test          # Run unit tests (Vitest) once
npm run test:watch    # Run unit tests in watch mode
npm run test:coverage # Run unit tests with coverage report
npm run test:e2e      # Run Playwright end-to-end tests
npm run test:e2e:ui   # Run Playwright with the UI runner
```

## Testing

### Unit tests (Vitest)

```bash
npm run test
```

Tests live under `tests/unit/` and cover the Zod validation schemas, the
form-renderer schema normaliser, the in-memory rate limiter, and the
environment-variable validator.

### End-to-end tests (Playwright)

```bash
npx playwright install --with-deps   # first time only
npm run test:e2e
```

The Playwright config boots the Next.js dev server automatically and runs
against `http://localhost:3000`. See `tests/e2e/README.md` for notes on
writing new specs.

## Deployment Runbook

### 1. Provision Supabase

1. Create a new Supabase project and note the project ref, anon key, and
   service-role key.
2. Apply the schema migrations located in `supabase/migrations/` in
   chronological order (via the Supabase dashboard SQL editor, the
   Supabase CLI, or the Supabase MCP).
3. Create the `uploads` storage bucket if file uploads are used.

### 2. Configure the Vercel project

Set the following environment variables in the Vercel dashboard (all
environments unless noted):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only service-role key |
| `NEXTAUTH_URL` | Full site URL (e.g. `https://formflow.vercel.app`) |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM_EMAIL` | Verified sender (e.g. `FormFlow <noreply@yourdomain>`) |
| `RESEND_REPLY_TO_EMAIL` | Optional reply-to |
| `RESEND_TEST_EMAIL` | Optional, development only |

### 3. Bootstrap the first admin

After the database schema is in place, create the initial admin account:

```bash
node --env-file=.env.local scripts/bootstrap-admin.mjs \
  --email=you@yourdomain.com \
  --password='a-strong-password' \
  --name='Your Name'
```

The script is idempotent: re-running it updates the profile instead of
creating duplicates.

### 4. Deploy

Push to the connected Git branch and let Vercel build. Vercel Analytics
and Speed Insights are wired up in `src/app/layout.tsx`; enable them in
the Vercel project dashboard.

### 5. Post-deploy smoke test

1. Sign in at `/login` with the bootstrap credentials.
2. Create an event and publish its form.
3. Submit the form anonymously from an incognito window.
4. Confirm the submission confirmation email arrives via Resend.
5. Assign a reviewer and complete one review from the reviewer account.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth pages (login, register)
│   ├── (dashboard)/       # Protected routes (admin, reviewer)
│   ├── form/[slug]/       # Public form page
│   └── api/               # API routes
├── components/             # React components
│   ├── ui/                # shadcn/ui components
│   ├── form-builder/      # Admin form builder
│   ├── form-renderer/     # Teacher-facing form
│   ├── review/            # Reviewer components
│   └── layout/            # Layout components
├── lib/                   # Utilities
│   ├── supabase/          # Supabase clients
│   ├── auth/              # NextAuth config
│   ├── email/             # Email templates & Resend
│   ├── storage/           # File storage abstraction
│   └── validations/       # Zod schemas
├── hooks/                 # Custom React hooks
├── stores/                # Zustand stores
└── types/                 # TypeScript types
```

## User Roles

### Admin
- Full system access
- Creates events and builds forms
- Manages reviewers and assignments
- Views analytics

### Reviewer
- Evaluates assigned submissions
- Scores and adds notes
- Sees only their assignments

### Teacher
- No account required
- Fills forms via public link
- Receives confirmation emails

## License

MIT
