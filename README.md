# FormFlow

Multi-layer form & review management system for 30,000+ schools.

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

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Docker (for local Supabase)
- Supabase account (free tier works)
- Resend account (free tier works)

### 1. Clone and Install

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
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here-generate-with-openssl-rand-base64-32

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Resend
RESEND_API_KEY=re_your-api-key
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

#### Generating NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

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

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Test Email Service

To test email sending, use the test endpoint:

```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "type": "submission-confirmation",
    "teacherName": "John Doe",
    "teacherEmail": "your-email@example.com",
    "schoolName": "Test School",
    "eventTitle": "Test Event",
    "submissionDate": "2026-04-14",
    "submissionNumber": 1
  }'
```

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run type-check   # Run TypeScript type checking
npm run lint         # Run ESLint
npm run test         # Run unit tests
npm run test:e2e     # Run end-to-end tests
```

## Database Commands

```bash
npx supabase start          # Start local Supabase
npx supabase stop           # Stop local Supabase
npx supabase db reset       # Reset database and apply migrations
npx supabase migration new <name>  # Create new migration
npx supabase db push        # Push migrations to remote Supabase
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

## Development Workflow

1. Read `.ai/context.md` for project overview
2. Read `.ai/agents.md` for coding conventions
3. Read `.ai/prd.md` for feature requirements
4. Read relevant on-demand context files (`.ai/db-schema.md`, `.ai/api.md`, etc.)
5. Implement following all conventions
6. Run `npm run type-check` and `npm run lint`
7. Commit with conventional commit message
8. Update `.ai/log.md`

## License

MIT
