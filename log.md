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
- Added the Resend email service wrapper with runtime env validation and shared send helpers in `src/lib/email/resend.ts`.
- Created reusable email templates for teacher submission confirmations and reviewer assignment notifications (using React `.tsx` and fallback text streams).
- Added a development-only `GET/POST /api/test-email` route for inspecting config state and sending sample emails.
- Updated README.md with comprehensive project documentation and local email testing instructions.

**Validation**:
- Ran `npm run type-check`
- Ran `npm run lint`

## [2026-04-15] fix | Auth Edge Runtime Compatibility Fix

**Actor**: AI Agent
**Changes**:
- Fixed NextAuth v5 Edge runtime compatibility issues.
- Added `session: { strategy: 'jwt' }` and `secret` to auth config.
- Updated `next.config.ts` with experimental allowedOrigins for server actions.

**Issue**: "There was a problem with the server configuration" error on Vercel login.
**Root Cause**: Missing required JWT session strategy and secret for Edge runtime.

**Validation**:
- Ran `npm run type-check` — passed
- Ran `npm run lint` — passed


## [2026-04-15] fix | Email Smoke Test Completed

**Actor**: AI Agent
**Changes**:
- Installed `@react-email/render` so Resend can render the React-based email templates during live sends.
- Updated local environment configuration with credentials.
- Verified the development-only `/api/test-email` route with live sends.

**Validation**:
- Sent a live test email successfully via `POST /api/test-email`.

## [2026-04-15] feat | Session 2.1 Completed: Event CRUD Foundation

**Actor**: AI Agent
**Changes**:
- Added shared event validation and service modules covering admin authorization and event listing.
- Implemented `GET /api/events` and `POST /api/events` with admin-only access and body validation.
- Replaced the `/admin/events` placeholder with a real event workspace for draft event creation.
- Added reusable `Textarea` UI primitive and a server-action-based create-event form.

**Validation**:
- Ran `npm run build` — passed.

## [2026-04-15] feat | Session 2.3 Completed: Form Builder Core Infrastructure

**Actor**: AI Agent
**Changes**:
- Added a shared typed form-schema model covering all 12 PRD field types.
- Created the Zustand-powered form builder state store with dnd-kit-backed reordering support.
- Built the new admin builder route at `/admin/events/[id]/builder` with a three-panel layout.
- Added persistence through `GET/PUT /api/events/[id]/form-schema`.
- Installed `@dnd-kit` dependencies for drag-and-drop support.

**Validation**:
- Ran `npm run type-check` — passed.

## [2026-04-15] feat | Session 2.2 Completed: Event Detail, Edit & Status Management

**Actor**: AI Agent
**Changes**:
- Added `eventUpdateSchema` and payload extractors for partial event updates.
- Added event lifecycle services: `updateEventForAdmin`, `deleteEventForAdmin`, `publishEventForAdmin`, `closeEventForAdmin`, and `getSubmissionCountForEvent`.
- Implemented `GET/PUT/DELETE /api/events/[id]` and `POST /api/events/[id]/status` API routes for granular event operations.
- Created `/admin/events/[id]` detail page combining event configurations, statistics (field count, layer depth, submissions), and action areas.
- Built `EventEditForm` for drafting events and `EventStatusActions` to control lifecycle (draft -> published -> closed).
- Linked event list cards to their detail view for better navigation.
- Fixed a pre-existing email issue relating to `sendReviewerAssignmentEmail`.

**Validation**:
- Ran `npm run type-check` — passed.

## [2026-04-15] chore | GitHub Progress Sync & Merge Conflict Resolution

**Actor**: AI Agent
**Changes**:
- Synced local progress with GitHub and resolved merge conflicts across project docs, event management, form builder, and email setup.
- Reconciled overlapping work so the event CRUD workspace, form builder infrastructure, test email route, validation helpers, and environment template updates all landed together.
- Preserved the append-only project history in `.ai/log.md` while integrating the parallel streams of work.

## [2026-04-15] fix | Email Template Configuration Cleanup

**Actor**: AI Agent
**Changes**:
- Removed the legacy duplicate reviewer assignment email sender implementation and kept reviewer-assignment delivery flowing through the shared `sendEmail()` path in `src/lib/email/resend.ts`.
- Tightened the reviewer-assignment email contract so the recipient address is explicit and the test-email route uses the current template prop shape.
- Reduced duplicate email template configuration and cleaned up strict typing around the development email smoke-test flow.

## [2026-04-15] feat | Sessions 2.4-2.5 Completed: Form Builder Field Configuration

**Actor**: AI Agent
**Changes**:
- Extended the form schema model so short-answer and paragraph fields can persist builder-specific configuration like placeholders, visible rows, and optional character limits.
- Replaced the temporary all-in-one field settings logic with dedicated field config components under `src/components/form-builder/fields/` for all 12 field types.
- Completed the builder editing experience for basic fields: Short Answer, Paragraph, Dropdown, Date, Time, and Section Header.
- Completed the builder editing experience for complex fields: Multiple Choice, Checkboxes, Linear Scale, Multiple Choice Grid, Checkbox Grid, and File Upload.
- Upgraded the form builder canvas previews so each field type better reflects its configured teacher-facing behavior inside the admin builder.
- Cleaned up pre-existing unused-symbol warnings in admin event pages while validating the builder changes.

**Validation**:
- Ran `npm run type-check` â€” passed.
- Ran `npm run lint` â€” passed.

## [2026-04-15] feat | Form Builder Preview & Grade Configuration

**Actor**: AI Agent
**Changes**:
- Implemented form preview with autosave functionality.
- Added grade configuration UI for events with grade-based scoring (configurable grade labels and ranges).
- Completed field-specific configuration for all 12 field types in the form builder.

**Git Commits**:
- 33bb483 "Implement field-specific form builder configuration"
- 4ccb508 "Add form preview autosave and grade configuration"

**Validation**:
- Ran 
pm run type-check � passed.

## [2026-04-16] fix | Supabase Local Seed/Auth Schema Compatibility

**Actor**: AI Agent
**Changes**:
- Diagnosed local Supabase startup/login breakage caused by `supabase/seed.sql` referencing legacy `auth.users` columns (`app_metadata`, `user_metadata`) that may not exist in newer local stacks.
- Reworked `supabase/seed.sql` to detect auth metadata column variants at runtime and insert into either legacy (`app_metadata` / `user_metadata`) or current (`raw_app_meta_data` / `raw_user_meta_data`) columns.
- Updated seed bootstrap admin credentials to match documented local defaults: `admin@formflow.com` / `admin123`.
- Replaced empty seeded password with a valid bcrypt hash using `crypt(..., gen_salt('bf'))` so Supabase `signInWithPassword()` can authenticate correctly.
- Added README troubleshooting guidance for `db reset --debug`, schema mismatch root cause, and local verification steps.

## [2026-04-17] fix | Local Auth/Event Validation Stability

**Actor**: AI Agent
**Changes**:
- Tightened event validation behavior in `src/lib/validations/events.ts` to avoid local Zod crashes during event workflows.
- Followed up on the localhost Supabase/GoTrue instability with additional seed and troubleshooting adjustments in `supabase/seed.sql`.
- Added dedicated troubleshooting documentation in `SUPABASE_FIX_DOCUMENTATION.md` to capture the root cause and local recovery steps.

## [2026-04-17] feat | Session 3 Completed: Teacher Form Submission

**Actor**: AI Agent
**Changes**:
- Implemented the public form route family under `src/app/form/[slug]/*`, including the live form page, draft resume page, success page, and missing-form handling.
- Added teacher submission APIs for public form loading, draft persistence, draft resumption, final submission, and file upload handling.
- Built the public-form component set to render teacher info fields, all configured form fields, file uploads, and closed-form states.
- Extended `src/lib/submissions/service.ts`, `src/lib/storage/storage.ts`, and `src/lib/validations/submissions.ts` to support draft tokens, re-submission-safe submission creation, and runtime form validation.
- Added draft resume email delivery and completed the teacher submission confirmation flow through the shared email layer.

**Git Commits**:
- `a773971` "17-04-2026 complete phase 3 by opus and gemini 3.1"

## [2026-04-17] chore | Project Log Relocated

**Actor**: AI Agent
**Changes**:
- Moved the project evolution log from `.ai/log.md` to the repository root as `log.md`.
- Kept the append-only history intact while updating the repository layout so the log lives in a single visible location.

**Git Commits**:
- `7cbc3d3` "changed the loication of log md"

## [2026-04-17] feat | Session 4.1 Completed: Review Workflow Foundation

**Actor**: AI Agent
**Changes**:
- Added the shared Phase 4 review domain in `src/lib/reviews/service.ts`, covering reviewer auth context loading, reviewer creation, reviewer activation toggles, assignment creation, review submission, advancement/elimination decisions, notification writes, and reviewer assignment emails.
- Added review validation schemas in `src/lib/validations/reviews.ts` for reviewer creation, assignment payloads, review submission, and admin advancement decisions.
- Replaced the reviewer-management placeholder with a working admin screen for creating reviewers, viewing workload, and toggling reviewer activity.
- Added the admin event review workspace at `src/app/(dashboard)/admin/events/[id]/reviews`, including per-submission reviewer assignment, current-layer review visibility, and admin advance/eliminate actions.
- Replaced the reviewer dashboard placeholder with a live assignment queue and added the reviewer assignment detail flow for viewing submission data, continuity from prior reviews, and score/grade submission.
- Implemented the documented review APIs: `POST /api/reviews/assign`, `POST /api/reviews/submit`, and `POST /api/reviews/advance`.
- Linked the event detail page into the new review workspace so the Phase 4 flow is reachable from the existing admin event surface.

**Validation**:
- Ran `tsc --noEmit` via `npm.cmd run type-check` — passed.
- Ran `eslint` via `npm.cmd run lint` — passed.

## [2026-04-17] feat | Phase 4 remaining completed by Trae

**Actor**: AI Agent
**Changes**:
- Finished Phase 4: Review Workflow Implementation completely.
- Added deeper `reviews/actions.ts` and `reviewers/actions.ts` integrations.
- Built out the `(dashboard)/admin/events/[id]/reviews/page.tsx` and unified the workflow steps.
- Implemented `submission-review-card.tsx` and `reviewer-edit-form.tsx`.
- Finalized reviewer dashboard capabilities in `(dashboard)/reviewer/page.tsx`.
- Extensive updates to `src/lib/reviews/service.ts` for handling full layer review flow and advancement state machine.
- Expanded `validations/reviews.ts` for newly introduced forms.
- This closed out Session 4.2 through Session 4.6.

## [2026-04-17] feat | Phase 5 & 6 Completed: Analytics and Notifications

**Actor**: AI Agents (v0 & Vercel bot)
**Changes**:
- Built Phase 5 Backend: Added API routes for Analytics such as `/api/analytics/[eventId]/summary/route.ts`, submissions-over-time, and CSV export.
- Built Phase 5 UI: Created the comprehensive dashboard at `admin/events/[id]/analytics/page.tsx` with Recharts (AvgScoreByLayerChart, ReviewStatusDonut, ReviewerWorkloadChart, SubmissionsOverTimeChart).
- Built Phase 6 Backend: Implemented notification services, and `get/read/read-all` API routes at `/api/notifications/*`.
- Built Phase 6 UI: Implemented the `NotificationBell.tsx` component and the main `notifications/page.tsx` dashboard.
- Defined validations for analytics and notifications (`src/lib/validations/analytics.ts` and `src/lib/validations/notifications.ts`).
- Integrated the features seamlessly into the core layout (`Header.tsx` and `navigation.ts`).
- Fully merged PR for Analytics layout and notification system.

## [2026-04-17] feat | Phase 7 Completed: Testing, Security Hardening & Polish

**Actor**: AI Agent (v0)
**Changes**:
- **Testing infrastructure**: Added Vitest with Node environment and a first wave of unit tests (73 passing) covering form-schema normalisation, event/submission/review validators, the in-memory rate limiter, and the env validator. Added `npm run test`, `test:watch`, `test:coverage` scripts.
- **E2E scaffold**: Wired Playwright (`playwright.config.ts`) with a dev-server `webServer` block, a public smoke spec, and a submission-validation spec. Added `npm run test:e2e` scripts and `tests/e2e/README.md`.
- **Bug fix** (discovered by new tests): `reviewerCreateSchema` was chaining `.pick()` after `.transform()` on `registerSchema`, which crashed at runtime whenever an admin created a reviewer. Rebuilt `reviewerCreateSchema` on the shared field schemas and removed the unused `registerSchema` import.
- **Rate limiting**: Extracted the submissions rate limiter into `src/lib/utils/rate-limit.ts` with a reusable `checkRateLimit({ bucket, identifier, max, windowMs })` helper and `getClientIp`. Applied it to `/api/submissions` (10/min), `/api/auth/register` (5/min), and `/api/upload` (30/min); all return `Retry-After` headers.
- **Security headers**: Hardened `next.config.ts` with a production Content-Security-Policy (Supabase origins allow-listed), `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and a restrictive `Permissions-Policy`.
- **Env validation**: Added `src/lib/env.ts` with a Zod-validated `getServerEnv()` / `getPublicEnv()` cached lookup so missing/misconfigured env vars fail loudly at boot instead of deep in a request.
- **Structured logger**: Added `src/lib/utils/logger.ts` (`logger.info/warn/error/debug`) and migrated the register/submissions/upload routes off of ad-hoc `console.error` calls.
- **Performance indexes**: Added `supabase/migrations/20260417000000_performance_indexes.sql` for event sorting/expiration, per-event submission sorting, per-reviewer review history, unread-notification counts, and per-event transactions. Pre-existing Recharts tooltip-formatter and Supabase `maybeSingle` typings were repaired so `npm run type-check` now passes cleanly.

**Validation**:
- `npm run test` — 6 files, 73 tests passing.
- `npm run type-check` — passed.

## [2026-04-17] feat | Phase 8 Completed: Deployment Prep

**Actor**: AI Agent (v0)
**Changes**:
- **Bootstrap script**: Added `scripts/bootstrap-admin.mjs`, an idempotent Node script that upserts the first admin Supabase Auth user + `admin_master` profile from CLI flags (`--email`, `--password`, `--name`) or env vars.
- **Env template**: Expanded `.env.example` with Resend test/reply variables, commented `NEXTAUTH_URL` guidance, and a `APP_ENV` hint for logger output.
- **Analytics wiring**: Installed `@vercel/analytics` and `@vercel/speed-insights` and mounted `<Analytics />` + `<SpeedInsights />` in the root layout. Expanded metadata (title template, keywords, robots, Open Graph) and added a `Viewport` export with light/dark theme colors.
- **Runbook**: Rewrote the README's "Available Scripts" and added a full Deployment Runbook (Supabase provisioning, env vars, first-admin bootstrap, Vercel deploy, and post-deploy smoke test) plus Testing sections for unit and E2E.

**Validation**:
- `npm run test` — 73/73 passing.
- `npm run type-check` — passed.

**Git Commits**:
- `186b601` "feat: setup Vitest and add initial unit tests"
- `b0997f4` "fix: resolve 'registerSchema' '.transform()' issue"
- `f4c1147` "feat: bootstrap production with Supabase admin script"

## [2026-04-17 to 2026-04-19] feat/fix | Event Lifecycle & Recent Updates

**Actor**: Developer
**Changes**:
- Resolved accumulated type errors across validation and form schemas.
- Merged late-phase feature branches (PR #2).
- Finalized event lifecycle management by integrating status transitions directly with the form builder workspace.
- Applied minor ongoing quality-of-life adjustments to documentation.

**Git Commits**:
- `8306a8a` "fix: resolve type errors and update log"
- `70e63f2` "Merge pull request #2"
- `8a2223e` "feat: implement event lifecycle management with status transitions and form builder integration"
- `a4cddc6` "log fix (still not fixed)"
- `ff89f08` "19-04-26"
- `e4e7c83` "little improvements"

## [2026-04-19] fix | Frontend QA Polish & TextListEditor Bugfix

**Actor**: AI Agent
**Changes**:
- **TextListEditor Rewrite**: Fixed critical bug where MCQ/Dropdown/Checkboxes removed empty lines on every keystroke, breaking newline additions. Implemented local `draft` state and on-blur parsing.
- **Expiration Date Enhancements**: Added `min` constraint (current time) and `step="60"` precision to the `datetime-local` inputs in both Event Create and Edit forms.
- **Element Polish**: Styled native `<select>` dropdowns using custom `appearance-none` and a chevron SVG icon. Restyled native checkboxes in 'Teacher info to collect' section to feature an `accent-primary` color.
- **Toggle Switch**: Built a newly styled CSS toggle switch for `ToggleRow`, replacing the default browser checkbox.
- **UI Overflow Fix**: Wrapped `FieldConfigPanel` in `FormBuilder` within a sticky scrollable container to gracefully handle vertically overflowing configurations.
- **Accessibility & Warnings**: Addressed Duplicate React key warnings in `FieldPreview.tsx` and `FormPreview.tsx` by using index-based arrays mapping. Appended correct ARIA tags (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`) to `FormPreview.tsx`.

**Validation**:
- `npx tsc --noEmit` — 0 errors, passed cleanly.
- `npx next build` — Exit code 0, generated correctly without warnings.
