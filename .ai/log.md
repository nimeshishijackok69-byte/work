# FormFlow — Project Evolution Log

> **Append-only.** Every coding session, feature completion, and notable event gets logged here.
> Format: `## [YYYY-MM-DD] action | Description`

---

## [2026-04-14] init | AI Layer Created

**Actor**: AI Agent (planning session)
**Changes**:
- Created `.ai/` directory with full project AI Layer
- Files created: `context.md`, `agents.md`, `prd.md`, `db-schema.md`, `api.md`, `components.md`, `review-system.md`, `log.md`, `index.md`
- Established tech stack: Next.js 14+ / TypeScript / Supabase / NextAuth.js / Tailwind CSS / shadcn/ui / Resend
- Defined 8-phase implementation plan (~5 week timeline)
- Designed 9-table database schema with RLS policies
- Documented 30+ API endpoints
- Mapped full component hierarchy (~60 components across 6 categories)
- Documented review pipeline state machine and business rules

**Decisions**:
- Stack confirmed viable for 30K+ school scale
- Supabase Storage for now, designed for Azure Blob Storage migration
- Sequential review layers (not parallel) — each layer is a funnel
- Admin-controlled layer advancement (not automatic)
- No score aggregation across layers
- Single admin role (no super-admin for V1)

## [2026-04-14] init | Session 1.1 Completed: Initialize Next.js Project

**Actor**: AI Agent
**Changes**:
- Initialized Next.js 14+ App Router project with TypeScript and Tailwind CSS
- Installed core dependencies: Supabase, NextAuth.js, shadcn/ui, Zustand, React Hook Form, Resend, etc.
- Initialized shadcn/ui configuration
- Created designated directory structure (`src/lib/*`, `src/hooks`, `src/stores`, etc.)
- Created `.env.example` template based on requirements
- Verified successful production build (`npm run build`)
- Configured git and committed the initial state

## [2026-04-14] feat | Session 1.2 Completed: Supabase Setup & Database Migration

**Actor**: AI Agent
**Changes**:
- Initialized local Supabase using `npx supabase init`
- Created `20260414133826_initial_schema.sql` migration containing the full 9-tables DB schema with all RLS policies, indexing, and function triggers.
- Configured three Next.js native SSR clients for various contexts: `client.ts` (browser), `server.ts` (server actions), and `admin.ts` (service role).
- Implemented `database.ts` strict typings based on the DB schema.
- Built a default `seed.sql` for the primary system admin to easily log in locally.
- Added and ran `npm run type-check` (successfully tested types against Next.js 15+ Async cookies pattern).

## [2026-04-14] feat | Session 1.3 Completed: NextAuth.js Configuration

**Actor**: AI Agent
**Changes**:
- Integrated NextAuth v5 using credentials matching to Supabase's `auth.users`.
- Authored custom `auth.ts` leveraging Supabase service role `signInWithPassword()` for reliable verifications.
- Extended NextAuth types in TypeScript to persist specific properties (`role` and `id`) in JWT state.
- Formed the middleware guard `middleware.ts` to actively redirect unwanted access flows on `/admin/*` and `/reviewer/*`.
- Handled Next.js types configuration to suppress generics collisions when fetching NextAuth roles.

## [2026-04-14] feat | Session 1.4 Completed: Auth Pages (Login & Register)

**Actor**: AI Agent
**Changes**:
- Built the public auth route group with a centered auth layout and a production-oriented login screen.
- Added a server-side login action with Zod validation, inline error states, and loading feedback for credentials sign-in.
- Implemented `POST /api/auth/register` to support first-admin bootstrap when no admin exists and admin-created reviewer/admin accounts afterward.
- Added shared auth validation schemas plus the missing UI primitives (`input`, `card`, `label`, `toast`) used by the new auth screens.
- Replaced the default landing page with session-aware redirects and created protected placeholder pages for `/admin` and `/reviewer` so role-based login lands on valid routes.
- Refined the root app branding/theme to match the FormFlow design direction and tightened auth typing to remove `any` usage.

**Validation**:
- Ran `npm run type-check`
- Ran `npm run lint`

## [2026-04-14] feat | Session 1.5 Completed: Base Layout (Shell, Sidebar, Header)

**Actor**: AI Agent
**Changes**:
- Built the shared dashboard shell for authenticated routes with a new `(dashboard)` layout wrapping admin and reviewer pages.
- Added reusable layout primitives: `AppShell`, `Sidebar`, `Header`, `PageHeader`, plus centralized role-based navigation config.
- Implemented responsive sidebar behavior with mobile drawer support, desktop collapse state, active-route highlighting, notification placeholder, and session-aware user header.
- Added a server logout action and connected it to the dashboard header.
- Refreshed the admin and reviewer placeholder pages to use the new shared shell and added placeholder admin routes for `/admin/events` and `/admin/reviewers` so sidebar navigation lands on valid pages.

**Validation**:
- Ran `npm run type-check`
- Ran `npm run lint`

## [2026-04-15] feat | Session 1.6 Completed: Environment & Email Setup

**Actor**: AI Agent
**Changes**:
- Added the Resend email service wrapper with runtime env validation and shared send helpers.
- Created reusable email templates for teacher submission confirmations and reviewer assignment notifications.
- Added a development-only `GET/POST /api/test-email` route for inspecting config state and sending sample emails.
- Added `.env.example`, created a local `.env.local`, and updated `.gitignore` so the template stays committed while secrets remain local.
- Replaced the deprecated `src/middleware.ts` convention with `src/proxy.ts` to match Next.js 16 guidance.
- Rewrote `README.md` with project-specific setup and local email testing instructions.

**Validation**:
- Ran `npm run type-check`
- Ran `npm run lint`
- Ran `npm run build`

## [2026-04-15] fix | Email Smoke Test Completed

**Actor**: AI Agent
**Changes**:
- Installed `@react-email/render` so Resend can render the React-based email templates during live sends.
- Updated local environment configuration with the provided Supabase credentials and a dedicated test-recipient email address.
- Verified the development-only `/api/test-email` route by sending a live submission-confirmation email through Resend.

**Validation**:
- Ran `npm run type-check`
- Ran `npm run lint`
- Sent a live test email successfully via `POST /api/test-email`

## [2026-04-15] feat | Session 2.1 Completed: Event CRUD Foundation

**Actor**: AI Agent
**Changes**:
- Added shared event validation and service modules covering admin authorization, event listing, event creation, share-slug generation, and transaction logging.
- Implemented `GET /api/events` and `POST /api/events` with admin-only access, query/body validation, and PRD-aligned response shapes.
- Replaced the `/admin/events` placeholder with a real event workspace that includes draft event creation, status filters, pagination, and event inventory cards.
- Added a reusable `Textarea` UI primitive and a server-action-based create-event form following Next.js 16 server mutation patterns.
- Updated the admin dashboard copy so the next milestone now points at the form builder instead of the previously pending event CRUD step.

**Validation**:
- Ran `npm run type-check`
- Ran `npm run lint`
- Ran `npm run build`

## [2026-04-15] feat | Session 2.3 Completed: Form Builder Core Infrastructure

**Actor**: AI Agent
**Changes**:
- Added a shared typed form-schema model covering all 12 PRD field types plus helper factories for default draft questions and safe schema normalization.
- Created the Zustand-powered form builder state store with field selection, duplication, removal, and dnd-kit-backed reordering support.
- Built the new admin builder route at `/admin/events/[id]/builder` with a three-panel layout: field palette, sortable canvas, and config panel.
- Added first-pass draft schema persistence through `GET/PUT /api/events/[id]/form-schema`, including admin ownership checks, draft-only mutation rules, and audit logging.
- Updated the events workspace so each event card links directly into the builder.
- Installed the missing `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities` dependencies required by the builder foundation.

**Validation**:
- Ran `npm run type-check`
- Ran `npm run lint`
- Ran `npm run build`
