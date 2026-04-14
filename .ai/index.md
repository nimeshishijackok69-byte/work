# FormFlow — AI Layer Index

> **Content-oriented catalog** of every document in the `.ai/` wiki.
> The AI agent reads this first to find relevant pages, then drills into them.

---

## Core Documents

| File | Summary | Last Updated |
| ---- | ------- | ------------ |
| [context.md](./context.md) | Project overview, tech stack (Next.js + Supabase + Vercel), user roles (Admin, Reviewer, Teacher), scale requirements (30K+ schools), architecture principles | 2026-04-14 |
| [agents.md](./agents.md) | **Global agent rules** — loaded every session. Project structure, coding conventions (TypeScript strict, naming, error handling), terminal commands, commit convention, on-demand context file mapping, PIV loop workflow | 2026-04-14 |
| [prd.md](./prd.md) | Product Requirements Document with 8 phases: (1) Foundation & Auth, (2) Event & Form Builder, (3) Teacher Submission, (4) Review System, (5) Analytics, (6) Notifications, (7) Testing & Polish, (8) Deployment. ~5 week timeline | 2026-04-14 |
| [execution-guide.md](./execution-guide.md) | **Session-based development workflow.** 32 atomic sessions across 8 phases, each completable in one AI conversation. Includes Prime Command template, session workflow (Prime → Focus → Implement → Validate → Commit), and tips | 2026-04-14 |

## On-Demand Context

| File | Summary | Read When... | Last Updated |
| ---- | ------- | ------------ | ------------ |
| [db-schema.md](./db-schema.md) | 9-table database schema: admin_profile, event_master, user_master, submission, reviewer_master, review_assignment, review, transaction_master, notification. Includes ER diagram, column specs, indexes, RLS policies, storage buckets | Working on database, migrations, queries | 2026-04-14 |
| [api.md](./api.md) | 30+ API endpoints across auth, events, forms, submissions, reviews, analytics, notifications. Request/response shapes, auth requirements, query params | Working on API routes or data fetching | 2026-04-14 |
| [components.md](./components.md) | Design system (colors, typography, spacing), ~60 components across 6 categories (layout, UI, form-builder, form-renderer, review, dashboard), page routes, Zustand stores, UX patterns | Working on UI, components, pages | 2026-04-14 |
| [review-system.md](./review-system.md) | Review pipeline state machine, sequential funnel model, submission states, 6 business rules (sequential layers, assignment rules, reviewer continuity, scoring, admin-controlled advancement, admin override), edge cases | Working on review pipeline, layer logic, scoring | 2026-04-14 |

## Project Tracking

| File | Summary | Last Updated |
| ---- | ------- | ------------ |
| [log.md](./log.md) | Chronological, append-only record of project evolution. Tracks every coding session, feature completion, decision, and notable event | 2026-04-14 |

---

## Quick Reference

**Tech Stack**: Next.js 14+ · TypeScript · Supabase · NextAuth.js v5 · Tailwind CSS · shadcn/ui · Zustand · React Hook Form + Zod · dnd-kit · Recharts · Resend · Vercel

**Database**: 9 tables in Supabase PostgreSQL with RLS policies on all tables

**User Roles**: Admin (full access) · Reviewer (evaluate assigned forms) · Teacher (no account, fills form via link)

**Scale Target**: 30,000+ schools, terabytes of file storage potential

**Current Phase**: Phase 1 — Project Foundation & Authentication (not started)
