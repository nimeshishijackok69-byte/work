# FormFlow — Multi-Layer Form & Review Management System

## Project Overview

FormFlow is a centralized platform for creating, distributing, and multi-tier evaluating custom forms. Built on **Next.js 14+ (App Router)**, **Supabase**, and deployed on **Vercel**, it supports three user roles with fundamentally different interaction models.

---

## Tech Stack

| Layer            | Technology                  | Why                                                              |
| ---------------- | --------------------------- | ---------------------------------------------------------------- |
| **Framework**    | Next.js 14+ (App Router)    | SSR, API routes, middleware, React Server Components             |
| **Language**     | TypeScript (strict mode)    | Type safety across the entire stack                              |
| **Database**     | Supabase (PostgreSQL 15+)   | RLS, Realtime, Edge Functions, Storage — all in one              |
| **Auth**         | NextAuth.js v5 (Auth.js)    | Flexible auth for Admin & Reviewer login                        |
| **File Storage** | Supabase Storage (→ Azure Blob later) | Start integrated, migrate to Azure Blob Storage when shipping to Azure |
| **Email**        | Resend                      | Transactional emails at scale (30K+ schools), Vercel-native     |
| **Styling**      | Tailwind CSS v3             | Rapid UI development, consistent design tokens                  |
| **UI Library**   | shadcn/ui                   | Accessible, composable, customizable components                 |
| **Forms**        | React Hook Form + Zod       | Performant forms with schema validation                         |
| **State**        | Zustand                     | Lightweight client state for form builder                       |
| **Drag & Drop**  | dnd-kit                     | Form builder drag-and-drop functionality                        |
| **Charts**       | Recharts                    | Admin analytics dashboard                                       |
| **Deployment**   | Vercel                      | Auto-scaling, edge network, preview deployments                 |
| **Monitoring**   | Vercel Analytics + Sentry   | Performance monitoring and error tracking                       |

---

## User Roles

### 1. Admin
- **Has an account** — logs into the platform
- **Full system access**: create events, build forms, manage reviewers, view all data
- Creates shareable form links (like Google Forms / Microsoft Forms)
- Configures review layers, scoring types, and form expiration
- Can override reviewer assignments
- Views analytics per event (submission rates, review completion, top-rated, avg scores)
- Single admin role (no super-admin hierarchy for now)

### 2. Reviewer
- **Has an account** — logs into the platform
- **Single purpose**: evaluate and score submitted forms
- Can only see forms assigned to them
- Reviews sequentially by layer (R1 → R2 → R3...)
- If assigned across multiple layers, can see their own previous scores/notes
- Receives notifications when new forms are assigned
- Scores out of 100 OR letter grades (configured per event by Admin)

### 3. Teacher (User)
- **No account** — cannot log into the platform
- Receives a shared link (one link per event, like Google Forms)
- Fills out the form, can save partial progress (draft)
- Submits directly to the database
- Receives email confirmation on submission
- **Cannot edit** after submission, but **can re-submit** (creates a new submission)

---

## Scale Requirements

- **30,000+ schools** receiving forms per event
- Potentially **30,000+ concurrent form submissions** during peak periods
- Multiple events running simultaneously
- Multiple review layers with potentially hundreds of reviewers
- File storage: up to 30K × multiple files × 20MB = **terabytes potential**

### Scale Mitigations
- Supabase Pro plan (100K+ MAU, connection pooling via Supavisor)
- Proper database indexing on all foreign keys and query columns
- Server-side pagination everywhere
- Lazy loading for heavy components
- Vercel Edge Network for CDN/static assets
- Resend for bulk email (not Supabase's built-in email)
- File upload size limit: **20MB per file**
- Design storage abstraction layer for Azure Blob Storage migration

---

## Architecture Principles

1. **Event Isolation**: Each event is a completely isolated unit. No cross-event data leakage in queries or UI.
2. **Sequential Review Pipeline**: Reviews are layered (R1 → R2 → R3...). A submission must pass through layer N before reaching layer N+1. Each successive layer is a funnel — fewer submissions advance.
3. **Audit Everything**: The Transaction Master logs every lifecycle event with timestamps and actor identity.
4. **Storage Abstraction**: All file operations go through an abstraction layer so we can swap Supabase Storage for Azure Blob Storage without touching business logic.
5. **Form Schema as Data**: Form definitions are stored as JSONB, enabling the Admin to build any form structure without schema changes.
6. **Progressive Enhancement**: Core form submission works without JavaScript; enhanced features (drag-and-drop builder, real-time updates) layer on top.

---

## Future Considerations (Not in V1)

- Azure deployment (Azure App Service + Azure DB for PostgreSQL + Azure Blob Storage)
- Super-admin role hierarchy
- Conditional form logic (show/hide questions based on answers)
- Form templates library
- Bulk reviewer assignment via CSV upload
- Webhook integrations
- Mobile app (React Native)
- Multi-language support (i18n)
