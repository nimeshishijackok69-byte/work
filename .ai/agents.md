# FormFlow — Global Agent Rules

> **This file is loaded into every AI coding session.** It contains universal constraints, conventions, and commands. Do NOT put feature-specific context here — use on-demand context files instead.

---

## 🔴 Critical Rules

1. **NEVER modify files in `.ai/` without explicit user permission.** These are the project's source of truth.
2. **NEVER commit `.env.local` or any file containing secrets.**
3. **ALWAYS read the relevant on-demand context file before working on a subsystem** (see On-Demand Context section below).
4. **ALWAYS run `npm run type-check` after making changes to catch TypeScript errors.**
5. **NEVER use `any` type in TypeScript.** Use `unknown` and narrow with type guards if needed.
6. **NEVER skip error handling.** Every async operation must have try/catch with meaningful error messages.
7. **Event Isolation is sacred.** Every database query MUST filter by `event_id`. No cross-event data leakage.

---

## Project Structure

```
work/
├── .ai/                          # AI Layer (DO NOT MODIFY without permission)
│   ├── context.md                # Project overview, tech stack, architecture
│   ├── agents.md                 # THIS FILE — global rules
│   ├── prd.md                    # Product Requirements Document (phases)
│   ├── db-schema.md              # Database schema & RLS policies
│   ├── api.md                    # API routes documentation
│   ├── components.md             # Component architecture & design system
│   ├── review-system.md          # Review pipeline logic & state machine
│   ├── log.md                    # Project evolution log
│   └── index.md                  # Wiki index of all .ai files
├── src/
│   ├── app/
│   │   ├── (auth)/               # Auth pages (login, register)
│   │   ├── (dashboard)/          # Protected routes (admin, reviewer)
│   │   │   ├── admin/
│   │   │   └── reviewer/
│   │   ├── form/[slug]/          # Public form page for teachers
│   │   ├── api/                  # API routes
│   │   ├── layout.tsx
│   │   └── page.tsx              # Landing/redirect page
│   ├── components/
│   │   ├── ui/                   # Base UI (shadcn/ui components)
│   │   ├── form-builder/         # Admin form builder
│   │   ├── form-renderer/        # Teacher-facing form
│   │   ├── review/               # Reviewer components
│   │   └── dashboard/            # Dashboard widgets
│   ├── lib/
│   │   ├── supabase/             # Supabase client & helpers
│   │   │   ├── client.ts         # Browser client
│   │   │   ├── server.ts         # Server client
│   │   │   └── admin.ts          # Service role client
│   │   ├── auth/                 # NextAuth config & providers
│   │   ├── storage/              # File storage abstraction layer
│   │   ├── email/                # Resend email templates & sender
│   │   ├── validations/          # Zod schemas
│   │   └── utils/                # Utility functions
│   ├── hooks/                    # Custom React hooks
│   ├── stores/                   # Zustand stores
│   └── types/                    # TypeScript type definitions
├── supabase/
│   ├── migrations/               # SQL migration files
│   ├── seed.sql                  # Development seed data
│   └── config.toml               # Supabase local config
├── public/                       # Static assets
├── tests/
│   ├── unit/                     # Unit tests
│   └── e2e/                      # End-to-end tests (Playwright)
├── .env.local                    # Environment variables (NEVER COMMIT)
├── .env.example                  # Template for env vars
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## Coding Conventions

### TypeScript
- Strict mode enabled (`"strict": true` in tsconfig)
- Use `interface` for object shapes, `type` for unions/intersections
- Prefix interfaces with descriptive names, NOT `I` prefix (e.g., `EventMaster`, not `IEventMaster`)
- All API responses typed with discriminated unions for success/error
- Use `as const` for literal types and enums stored in DB

### React / Next.js
- Use **Server Components** by default; add `'use client'` only when necessary
- Use **Server Actions** for mutations when possible (form submissions, updates)
- Client components should be as small as possible — extract server parts up
- Use `loading.tsx` and `error.tsx` for every route segment
- Use `Suspense` boundaries around async components

### Naming
- Files: `kebab-case.ts` for utilities, `PascalCase.tsx` for components
- Database columns: `snake_case`
- TypeScript properties: `camelCase`
- Constants: `UPPER_SNAKE_CASE`
- Zustand stores: `use<Name>Store.ts`
- Hooks: `use<Name>.ts`

### Database
- Always use parameterized queries (Supabase client handles this)
- Always apply RLS policies — never bypass unless using admin/service role client
- Every query must include `event_id` filter (event isolation)
- Use database transactions for multi-table operations
- Add indexes on all foreign keys and frequently queried columns

### Error Handling
```typescript
// Pattern for API routes
try {
  // ... operation
  return NextResponse.json({ data: result }, { status: 200 })
} catch (error) {
  console.error('[API_NAME]', error)
  return NextResponse.json(
    { error: 'Human-readable message' },
    { status: 500 }
  )
}
```

### File Storage
- All file operations must go through `src/lib/storage/` abstraction
- Never call Supabase Storage directly from components
- File naming: `{event_id}/{submission_id}/{original_filename_with_uuid}`
- Validate file size (20MB max) and file type on both client and server

---

## Terminal Commands

```bash
# Development
npm run dev                 # Start Next.js dev server (port 3000)
npm run build               # Production build
npm run type-check          # TypeScript check without building
npm run lint                # ESLint check

# Database
npx supabase start          # Start local Supabase (Docker required)
npx supabase stop           # Stop local Supabase
npx supabase db reset       # Reset local DB and apply migrations
npx supabase migration new <name>  # Create new migration file
npx supabase db push        # Push migrations to remote Supabase

# Testing
npm run test                # Run unit tests (Vitest)
npm run test:e2e            # Run e2e tests (Playwright)
npm run test:e2e:ui         # Run Playwright with UI

# Git
git add -A && git commit -m "type(scope): description"  # Conventional commits
```

---

## Commit Convention

Use **Conventional Commits**:
```
feat(form-builder): add linear scale field type
fix(review): correct layer advancement logic
chore(deps): update supabase-js to v2.45
docs(ai): update review-system.md with edge cases
refactor(storage): extract upload logic to abstraction layer
test(api): add submission endpoint tests
```

---

## On-Demand Context Files

**Read these BEFORE working on the relevant subsystem:**

| Working On           | Read First                |
| -------------------- | ------------------------- |
| Database / Migrations | `.ai/db-schema.md`       |
| API Endpoints        | `.ai/api.md`              |
| UI Components        | `.ai/components.md`       |
| Review Pipeline      | `.ai/review-system.md`    |
| Any new feature      | `.ai/prd.md` (find phase) |
| Understanding history | `.ai/log.md`             |

---

## Environment Variables

```env
# .env.local template
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

RESEND_API_KEY=

# Future: Azure Storage
# AZURE_STORAGE_CONNECTION_STRING=
# AZURE_STORAGE_CONTAINER_NAME=
```

---

## Agent Workflow (PIV Loop)

When starting a new coding session:

1. **Prime**: Read `.ai/context.md`, `.ai/prd.md`, and `.ai/log.md`. Check git log for recent changes.
2. **Plan**: Identify the specific phase/feature. Read relevant on-demand context files. Create a plan.
3. **Implement**: Write code following all conventions above. Keep changes small and focused.
4. **Validate**: Run `npm run type-check`, `npm run lint`, and relevant tests. Manually verify in browser.
5. **Commit**: Use conventional commit messages. Update `.ai/log.md` with what was done.
