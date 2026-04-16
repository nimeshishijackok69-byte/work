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
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run type-check   # Run TypeScript type checking
npm run lint         # Run ESLint
```

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
