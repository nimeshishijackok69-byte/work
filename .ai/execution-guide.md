# FormFlow — Execution Guide

> **How to actually build this project with an AI coding agent, one session at a time.**

---

## The Core Problem

LLMs have limited context windows. If you dump the entire project into one conversation, the AI starts hallucinating, forgetting rules, and writing inconsistent code. The solution: **small, focused sessions** where the AI reads only what it needs, does one thing well, and logs what it did.

## The Solution: Session-Based Development

```
┌──────────────────────────────────────────────────┐
│                  .ai/ Directory                   │
│  (Persistent Memory — survives between sessions) │
│                                                   │
│  context.md  agents.md  prd.md  db-schema.md     │
│  api.md  components.md  review-system.md         │
│  log.md  index.md  execution-guide.md            │
└──────────────┬───────────────────────────────────┘
               │
    ┌──────────▼──────────┐
    │   Session 1.1       │──→ git commit
    │   (One focused task)│──→ update log.md
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │   Session 1.2       │──→ git commit
    │   (One focused task)│──→ update log.md
    └──────────┬──────────┘
               │
    ┌──────────▼──────────┐
    │   Session 1.3       │──→ git commit
    │   (One focused task)│──→ update log.md
    └─────────────────────┘
```

---

## How Each Session Works

### Step 1: Prime (Start of every session)

Copy-paste this **Prime Command** at the start of every new conversation:

```
Read these files in order to understand the project:
1. .ai/index.md (quick overview of all docs)
2. .ai/context.md (tech stack, architecture)
3. .ai/agents.md (coding rules and conventions)
4. .ai/log.md (what has been done so far)

Then check git log -n 10 for recent changes.

After reading, tell me:
- What phase we're on
- What session comes next
- A summary of what you understand

Do NOT write any code yet.
```

### Step 2: Focus (Tell the AI what to build)

After the AI primes itself, tell it which session to work on:

```
We're working on Session 1.3: Configure NextAuth.js.
Read .ai/api.md (auth section) and .ai/db-schema.md (admin_profile, reviewer_master tables).
Then plan what files you need to create/modify before writing any code.
```

### Step 3: Implement (AI writes code)

The AI writes code for ONLY that one session. If it tries to do more, stop it.

### Step 4: Validate (Check the work)

Every session ends with validation:
- `npm run type-check` (no TypeScript errors)
- `npm run lint` (no lint errors)
- Manual testing in the browser (if applicable)
- AI writes what was validated

### Step 5: Commit & Log (Persist progress)

```
Commit the changes with a conventional commit message.
Then append an entry to .ai/log.md documenting what was done.
```

This log entry IS the LLM's memory for the next session.

---

## Session Breakdown by Phase

Below is every session for every phase. Each session is designed to be **completable in a single AI conversation** without context overflow.

---

## Phase 1: Foundation & Auth (6 sessions)

### Session 1.1: Initialize Next.js Project
**Read**: `context.md`, `agents.md`
**Do**:
- Run `npx create-next-app@latest ./ --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"`
- Install dependencies:
  ```
  npm install @supabase/supabase-js @supabase/ssr next-auth@beta
  npm install @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react
  npm install zustand react-hook-form @hookform/resolvers zod
  npm install resend
  npm install -D @types/node
  ```
- Initialize shadcn/ui: `npx shadcn@latest init`
- Set up folder structure (empty dirs: `src/lib/supabase/`, `src/lib/auth/`, `src/lib/storage/`, `src/lib/email/`, `src/hooks/`, `src/stores/`, `src/types/`)
- Create `.env.example` with all env var names
- Create `.gitignore` with `.env.local`, `node_modules`, `.next`
- Verify `npm run dev` works — see Next.js default page
**Validate**: `npm run build` passes, dev server starts on port 3000
**Commit**: `chore(init): initialize next.js project with core dependencies`

---

### Session 1.2: Supabase Setup & Database Migration
**Read**: `db-schema.md`
**Do**:
- Run `npx supabase init` in the project root
- Create migration file with ALL 9 tables (copy SQL from db-schema.md):
  - `admin_profile`, `event_master`, `user_master`, `submission`
  - `reviewer_master`, `review_assignment`, `review`, `transaction_master`, `notification`
- Include all indexes, constraints, and the `fn_update_timestamp()` trigger
- Create `src/lib/supabase/client.ts` (browser client)
- Create `src/lib/supabase/server.ts` (server-side client using cookies)
- Create `src/lib/supabase/admin.ts` (service role client for admin ops)
- Create `src/types/database.ts` with TypeScript types matching all tables
- Create `supabase/seed.sql` with one admin user for development
**Validate**: `npx supabase start` works, `npx supabase db reset` applies migration without errors, types compile
**Commit**: `feat(db): create database schema with all 9 tables and supabase clients`

---

### Session 1.3: NextAuth.js Configuration
**Read**: `api.md` (auth section), `db-schema.md` (admin_profile, reviewer_master)
**Do**:
- Create `src/lib/auth/auth.config.ts` — NextAuth configuration
- Set up Credentials provider (email + password)
- Create auth callbacks: `signIn`, `jwt`, `session` (include role in session)
- Create `src/app/api/auth/[...nextauth]/route.ts`
- Create `src/lib/auth/auth.ts` — `auth()` helper for server components
- Create `src/middleware.ts` — protect `/admin/*` and `/reviewer/*` routes
- Create `src/types/next-auth.d.ts` — extend NextAuth types with `role`
- Password hashing utility (`bcryptjs` — install it)
**Validate**: TypeScript compiles, middleware redirects unauthenticated users to `/login`
**Commit**: `feat(auth): configure nextauth with credentials provider and role-based middleware`

---

### Session 1.4: Auth Pages (Login & Register)
**Read**: `components.md` (design system, layout)
**Do**:
- Install shadcn components: `button`, `input`, `card`, `label`, `toast`
- Create `src/app/(auth)/login/page.tsx` — Login form (email + password)
- Create `src/app/(auth)/layout.tsx` — Centered auth layout
- Create `src/app/api/auth/register/route.ts` — Admin registration endpoint
- Style login page with the design system (Inter font, indigo primary, clean card layout)
- Add error handling (wrong password, user not found)
- Add loading states during auth
- After login: redirect admin → `/admin`, reviewer → `/reviewer`
**Validate**: Can register admin via API, can login, redirects work, error states show
**Commit**: `feat(auth): build login page and registration endpoint`

---

### Session 1.5: Base Layout (Shell, Sidebar, Header)
**Read**: `components.md` (layout components, page routes)
**Do**:
- Create `src/components/layout/AppShell.tsx` — wrapper with sidebar + main
- Create `src/components/layout/Sidebar.tsx` — nav links (different for admin vs reviewer)
- Create `src/components/layout/Header.tsx` — user name, avatar, logout button, notification bell placeholder
- Create `src/components/layout/PageHeader.tsx` — page title + breadcrumb + action buttons
- Create `src/app/(dashboard)/layout.tsx` — wraps admin+reviewer in AppShell
- Create `src/app/(dashboard)/admin/page.tsx` — Admin dashboard placeholder
- Create `src/app/(dashboard)/reviewer/page.tsx` — Reviewer dashboard placeholder
- Admin sidebar links: Dashboard, Events, Reviewers
- Reviewer sidebar links: Dashboard (assignments)
- Make sidebar collapsible, responsive (hidden on mobile, toggle button)
**Validate**: Login as admin → see admin shell, login as reviewer → see reviewer shell, sidebar collapses, looks polished
**Commit**: `feat(layout): build app shell with role-based sidebar and header`

---

### Session 1.6: Environment & Email Setup
**Read**: `context.md` (Resend), `agents.md` (env variables)
**Do**:
- Create `src/lib/email/resend.ts` — Resend client initialization
- Create `src/lib/email/templates/` — email template functions:
  - `submission-confirmation.tsx` — template for teacher submission confirmation
  - `reviewer-assignment.tsx` — template for reviewer when assigned a form
- Create a test API route `src/app/api/test-email/route.ts` (dev only)
- Create `.env.local` from `.env.example` with real values (guide the user)
- Document in README.md how to set up env vars
**Validate**: Test email sends successfully via test route, templates render correctly
**Commit**: `feat(email): set up resend email service with templates`

---

### 🎯 Phase 1 Checkpoint
After Sessions 1.1–1.6, validate the full phase:
- [ ] `npm run build` succeeds
- [ ] Admin can register → login → see dashboard shell
- [ ] Reviewer can login → see reviewer shell
- [ ] Unauthenticated users redirected to login
- [ ] Sidebar shows correct links per role
- [ ] Database has all 9 tables with indexes
- [ ] Email test works

---

## Phase 2: Event Management & Form Builder (7 sessions)

### Session 2.1: Event CRUD — Backend
**Read**: `api.md` (event routes), `db-schema.md` (event_master)
**Do**: Event API routes (create, read, update, delete, publish, close). Zod validation schemas. Server-side helpers.

### Session 2.2: Event Management — UI
**Read**: `components.md` (dashboard components)
**Do**: Event list page, event creation form, event cards, status badges. Connect to API routes.

### Session 2.3: Form Builder — Core Infrastructure
**Read**: `components.md` (form builder), `prd.md` (form schema shape)
**Do**: Zustand store for form builder. FormBuilder shell (3-panel layout). FieldPalette with all 12 field type buttons. dnd-kit setup for drag-and-drop.

### Session 2.4: Form Builder — Basic Fields
**Read**: `components.md` (form builder fields)
**Do**: Config panels + preview for: Short Answer, Paragraph, Dropdown, Date, Time, Section Header. Field reordering with dnd-kit.

### Session 2.5: Form Builder — Complex Fields
**Read**: `components.md` (form builder fields)
**Do**: Config panels + preview for: Multiple Choice, Checkboxes, Linear Scale, MC Grid, Checkbox Grid, File Upload. These have nested config (options, rows, columns, scales).

### Session 2.6: Form Builder — Preview & Save
**Read**: `api.md` (form schema routes)
**Do**: Full form preview modal. Auto-save draft. Publish flow (confirm dialog → generates share link). Form expiration date picker.

### Session 2.7: Grade Configuration
**Read**: `db-schema.md` (grade_config), `review-system.md` (scoring)
**Do**: Grade config UI for events using grade scoring. Define grade labels and ranges. Validate ranges don't overlap.

---

## Phase 3: Teacher Form Submission (5 sessions)

### Session 3.1: Public Form Page — Rendering
**Read**: `components.md` (form renderer), `api.md` (public form routes)
**Do**: `/form/[slug]` route. Form renderer for all 12 field types. Expired form banner.

### Session 3.2: File Upload System
**Read**: `api.md` (upload routes), `db-schema.md` (storage buckets)
**Do**: Storage abstraction layer. Upload API route. Drag-and-drop file zone. Progress bar. 20MB validation. Supabase Storage integration.

### Session 3.3: Draft Save & Resume
**Read**: `api.md` (draft routes)
**Do**: Draft save API. Auto-save every 30s. Draft token generation. Email with resume link. Resume from token.

### Session 3.4: Form Submission & Confirmation
**Read**: `api.md` (submit route), `db-schema.md` (submission, user_master, transaction_master)
**Do**: Submit API (validate all required fields, create records in user_master, submission, transaction_master). Confirmation email via Resend. Success page. Re-submission logic.

### Session 3.5: Rate Limiting & Polish
**Do**: Rate limiting on public endpoints. Input sanitization. Error states. Mobile responsiveness for form page.

---

## Phase 4: Review System (6 sessions)

### Session 4.1: Submission Management (Admin)
**Read**: `api.md` (submission routes), `components.md` (SubmissionTable)
**Do**: Submissions list page per event. Paginated data table. Status filters. Search. View submission detail.

### Session 4.2: Reviewer Management (Admin)
**Read**: `api.md` (reviewer routes), `components.md` (ReviewerTable)
**Do**: Reviewer CRUD pages. Create reviewer (creates auth account). Workload overview.

### Session 4.3: Review Assignment (Admin)
**Read**: `review-system.md` (assignment rules), `api.md` (assign route)
**Do**: Assignment matrix UI. Bulk select submissions. Assign to reviewer at specific layer. Override flag. Triggers notification.

### Session 4.4: Reviewer Dashboard & Evaluation UI
**Read**: `review-system.md` (reviewer dashboard queries), `components.md` (review components)
**Do**: Reviewer assignment list. Filter by event, layer, status. Review interface (submission viewer + scoring panel). Numeric score input + grade selector.

### Session 4.5: Reviewer Continuity & Review Submission
**Read**: `review-system.md` (continuity rule, submit flow)
**Do**: Previous review banner. Submit review API. Update assignment status. Transaction logging. Check if all layer reviews complete.

### Session 4.6: Layer Advancement
**Read**: `review-system.md` (advancement logic, state machine)
**Do**: Admin layer advancement UI. Select submissions to advance/eliminate. API for bulk advance/eliminate. Status updates.

---

## Phase 5: Analytics Dashboard (2 sessions)

### Session 5.1: Analytics Backend
**Read**: `api.md` (analytics routes), `db-schema.md` (query patterns)
**Do**: Analytics API endpoints. Aggregate queries (submission rates, review completion, avg scores, top rated). CSV export.

### Session 5.2: Analytics UI
**Read**: `components.md` (analytics components)
**Do**: Charts (Recharts): submission timeline, review completion bars, score distribution. Stat cards. Top rated leaderboard. Filters.

---

## Phase 6: Notifications (2 sessions)

### Session 6.1: Notification System Backend
**Read**: `api.md` (notification routes), `db-schema.md` (notification table)
**Do**: Notification creation helpers. API routes (list, mark read). Trigger notifications on assignment.

### Session 6.2: Notification UI
**Read**: `components.md` (NotificationCenter)
**Do**: Bell icon with unread count. Dropdown notification list. Mark as read. Click to navigate.

---

## Phase 7: Testing & Polish (3 sessions)

### Session 7.1: Unit Tests
**Do**: Set up Vitest. Test review logic, form validation, scoring, layer advancement.

### Session 7.2: E2E Tests
**Do**: Set up Playwright. Test critical flows: create event → submit form → assign → review → advance.

### Session 7.3: Performance & Security Audit
**Do**: Database query analysis. Add missing indexes. RLS policy audit. CSP headers. Error handling sweep.

---

## Phase 8: Deployment (1 session)

### Session 8.1: Deploy to Vercel
**Do**: Create Vercel project. Push env vars. Deploy. Create production Supabase. Smoke test.

---

## Total: ~32 sessions across 8 phases

Each session = one focused AI conversation lasting 15-45 minutes.
You can do 2-4 sessions per day comfortably.

---

## Tips for Effective Sessions

1. **One session = one commit.** Don't try to squeeze two sessions into one conversation.
2. **If the AI goes off-track**, stop it immediately. Say "Stop. Re-read `.ai/agents.md` rule #X."
3. **If you find a bug**, don't just fix it — update the relevant `.ai/` file so the AI never makes that mistake again.
4. **Keep `.ai/log.md` updated.** It's the cheapest, most effective way to give the next session context about what happened.
5. **Fresh context windows.** Start a NEW conversation for each session. Don't continue in a stale context.
6. **Validate before committing.** Every session ends with `npm run type-check && npm run lint`.
