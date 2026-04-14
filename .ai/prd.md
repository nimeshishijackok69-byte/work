# FormFlow — Product Requirements Document (PRD)

> **Version**: 1.0
> **Last Updated**: 2026-04-14
> **Status**: Planning

---

## Executive Summary

FormFlow is a multi-layer form & review management system serving 30,000+ schools. Admins create forms (like Google Forms), share a public link with Teachers, and manage a configurable review pipeline where Reviewers evaluate submissions across sequential layers (R1 → R2 → R3...) — each layer acting as a funnel that narrows down submissions.

---

## Phase Breakdown

### Phase 1: Project Foundation & Authentication
**Goal**: Set up the project, database, and authentication so Admins and Reviewers can log in.

**Scope**:
- [ ] Initialize Next.js 14+ project with App Router, TypeScript, Tailwind CSS
- [ ] Install and configure core dependencies (shadcn/ui, Zustand, React Hook Form, Zod, dnd-kit, Recharts)
- [ ] Set up Supabase project (local development with Docker + remote project)
- [ ] Create initial database migration with all master tables (see `db-schema.md`)
- [ ] Configure NextAuth.js v5 with credentials provider (email/password)
- [ ] Implement Admin registration and login flow
- [ ] Implement Reviewer registration and login flow (Admin creates reviewer accounts)
- [ ] Build protected route middleware (role-based: admin vs. reviewer)
- [ ] Create base layout with sidebar navigation (admin view vs. reviewer view)
- [ ] Set up `.env.local` with all required environment variables
- [ ] Set up Resend for transactional emails

**Acceptance Criteria**:
- Admin can sign up, log in, see admin dashboard shell
- Reviewer can log in (account created by admin), see reviewer dashboard shell
- Unauthenticated users are redirected to login
- Role-based routing works (admin can't access reviewer routes and vice versa)

**Estimated Effort**: 2-3 days

---

### Phase 2: Event Management & Form Builder
**Goal**: Admins can create Events and build custom forms with all Google Forms field types.

**Scope**:
- [ ] CRUD for Events (create, read, update, delete)
  - Event title, description, review layer count, scoring type (numeric/grade), expiration date
  - Event status: draft → published → closed
  - Auto-generate shareable link slug on creation
- [ ] Form Builder UI (drag-and-drop, similar to Google Forms)
  - Supported field types:
    - **Short Answer** (single-line text input)
    - **Paragraph** (multi-line textarea)
    - **Multiple Choice** (radio buttons, single select)
    - **Checkboxes** (multi-select)
    - **Dropdown** (single select from list)
    - **File Upload** (max 20MB, multiple files supported)
    - **Linear Scale** (configurable min/max, labels)
    - **Multiple Choice Grid** (rows × columns, radio per row)
    - **Checkbox Grid** (rows × columns, checkbox per row)
    - **Date** (date picker)
    - **Time** (time picker)
    - **Section Header** (visual divider with title and description)
  - Each field supports: label, description, required toggle, validation rules
  - Drag-and-drop reordering of fields
  - Duplicate / delete fields
  - Form preview mode (see form as teacher would see it)
- [ ] Save form as draft (Admin can come back and continue editing)
- [ ] Publish form (locks structure, generates shareable link)
- [ ] Form expiration date enforcement
- [ ] Grade configuration UI (if scoring type = grade: define grade labels and ranges)

**Form Schema Storage** (JSONB in `event_master.form_schema`):
```json
{
  "fields": [
    {
      "id": "uuid",
      "type": "short_answer",
      "label": "School Name",
      "description": "Enter your school's full name",
      "required": true,
      "validation": { "maxLength": 200 }
    },
    {
      "id": "uuid",
      "type": "linear_scale",
      "label": "Rate your experience",
      "required": true,
      "config": {
        "min": 1,
        "max": 10,
        "minLabel": "Poor",
        "maxLabel": "Excellent"
      }
    },
    {
      "id": "uuid",
      "type": "multiple_choice_grid",
      "label": "Evaluate the following",
      "required": true,
      "config": {
        "rows": ["Quality", "Timeliness", "Communication"],
        "columns": ["Poor", "Fair", "Good", "Excellent"]
      }
    }
  ]
}
```

**Acceptance Criteria**:
- Admin can create an event with all metadata
- Admin can build a form using all 12 field types via drag-and-drop
- Form preview matches what teachers will see
- Form can be saved as draft and resumed later
- Published form generates a working shareable link
- Expired forms show "Form closed" message

**Estimated Effort**: 5-7 days

---

### Phase 3: Teacher Form Submission
**Goal**: Teachers can access the shared link, fill out the form, save progress, and submit.

**Scope**:
- [ ] Public form page at `/form/[slug]`
  - No authentication required
  - Renders form from `event_master.form_schema`
  - Shows event title, description, and deadline
  - Shows "Form closed" if expired
- [ ] Teacher info collection (name, email, school, phone — configurable per event)
- [ ] Form rendering for all 12 field types
  - Client-side validation matching field requirements
  - File upload with progress indicator, 20MB limit, file type validation
  - Files stored via storage abstraction layer
- [ ] Draft save functionality
  - Teacher enters email → system generates a unique token
  - Teacher can resume draft via token link sent to email
  - Draft auto-saves periodically (every 30s of inactivity)
  - Draft data stored in `submission` table with status = 'draft'
- [ ] Form submission
  - Final validation (all required fields filled)
  - Creates `submission` record with status = 'submitted'
  - Creates `user_master` record with teacher info
  - Creates `transaction_master` entry for submission event
  - Sends confirmation email to teacher via Resend
- [ ] Re-submission support
  - If teacher submits again from same email, creates NEW submission (does not overwrite)
  - Previous submissions preserved with incrementing `submission_number`
  - Admin can see all submissions from the same teacher
- [ ] Rate limiting (prevent spam submissions)

**Acceptance Criteria**:
- Teacher can open form link without any login
- All 12 field types render and validate correctly
- Files upload successfully with progress feedback
- Teacher can save draft and resume later via email link
- Submission creates all necessary database records
- Teacher receives confirmation email
- Re-submission creates new record, doesn't overwrite

**Estimated Effort**: 4-5 days

---

### Phase 4: Review System
**Goal**: Admins can assign submissions to reviewers; reviewers can evaluate submissions across configurable layers.

**Scope**:
- [ ] Admin: Submission management dashboard
  - View all submissions per event (paginated, searchable)
  - Filter by status (draft, submitted, under_review, reviewed)
  - View submission details and attached files
- [ ] Admin: Reviewer management
  - Create / edit / deactivate reviewer accounts
  - View reviewer workload and assignment history
- [ ] Admin: Review assignment
  - Assign submissions to reviewers for specific layers
  - Bulk assignment (assign multiple submissions to a reviewer at once)
  - Admin override: grant reviewer access to additional submissions
  - Assignment creates `review_assignment` records
  - Triggers notification to assigned reviewer
- [ ] Reviewer: Assignment dashboard
  - See only submissions assigned to them
  - Filter by event, layer, status (pending, in_progress, completed)
  - Clear indicators of which layer they're reviewing
- [ ] Reviewer: Evaluation interface
  - View full submission (all field responses + files)
  - Score submission (out of 100 OR letter grade, per event config)
  - Add notes/comments
  - Reviewer continuity: if reviewing same submission across layers, show their previous review
  - Submit review → creates `review` record, updates `transaction_master`
- [ ] Layer advancement logic
  - R1 reviews complete → Admin decides which submissions advance to R2
  - Admin selects advancing submissions → assigns to R2 reviewers
  - Repeat for R3, R4... (configurable per event)
  - Non-advancing submissions marked as "eliminated at Layer N"
- [ ] Review status tracking
  - Each submission tracks: current layer, review status per layer
  - Admin can see review progress across all layers

**Acceptance Criteria**:
- Admin can assign submissions to specific reviewers for specific layers
- Reviewer sees only their assignments
- Reviewer can score/grade and add notes
- Reviewer can see their own previous-layer scores for continuity
- Layer advancement is admin-controlled (not automatic)
- Admin can override assignments
- Full audit trail in transaction_master

**Estimated Effort**: 6-8 days

---

### Phase 5: Admin Analytics Dashboard
**Goal**: Admin can view per-event analytics without cross-event contamination.

**Scope**:
- [ ] Event-level dashboard with these metrics:
  - **Submission Rate**: total submissions, submissions over time (line chart)
  - **Review Completion**: % of submissions reviewed per layer, reviewer workload distribution
  - **Top Rated**: highest-scoring submissions per layer (leaderboard)
  - **Average Score**: mean score per layer for the event (bar chart)
- [ ] Dashboard filters: date range, layer, reviewer
- [ ] Event selector in admin dashboard (can only view one event's analytics at a time)
- [ ] Real-time data updates (Supabase Realtime subscription or polling)
- [ ] Export capability: download submission data as CSV

**Acceptance Criteria**:
- Admin can select an event and see all 4 metric categories
- Charts render correctly with real data
- No cross-event data leakage (Event A data never appears in Event B dashboard)
- CSV export works for submissions and reviews

**Estimated Effort**: 3-4 days

---

### Phase 6: Notifications System
**Goal**: Users receive timely notifications about actions that affect them.

**Scope**:
- [ ] In-app notification center (bell icon in header)
  - Notification list with read/unread status
  - Click notification → navigate to relevant page
- [ ] Email notifications via Resend:
  - **Teacher**: Form submission confirmation
  - **Reviewer**: New assignment notification (form assigned for review)
  - **Reviewer**: Reminder for pending reviews (optional, admin-triggered)
  - **Admin**: Summary of new submissions (optional digest)
- [ ] Notification storage in `notification` table
- [ ] Mark as read / mark all as read
- [ ] Notification preferences (future: per-user settings)

**Acceptance Criteria**:
- Reviewer gets email + in-app notification when assigned a form
- Teacher gets confirmation email on submission
- Notification bell shows unread count
- Clicking notification navigates to the right page

**Estimated Effort**: 2-3 days

---

### Phase 7: Testing, Polish & Performance
**Goal**: Ensure the application is production-ready at 30K+ scale.

**Scope**:
- [ ] Unit tests for critical business logic (review layer advancement, form validation, scoring)
- [ ] E2E tests with Playwright for critical flows:
  - Admin creates event + form → publishes
  - Teacher fills form → submits
  - Admin assigns submission → Reviewer scores it
  - Admin views analytics
- [ ] Performance testing:
  - Database query optimization (EXPLAIN ANALYZE on complex queries)
  - Add database indexes where slow
  - Connection pooling configuration
  - Pagination for all list endpoints
- [ ] Error handling audit
  - Every API endpoint has proper error responses
  - User-facing error messages are helpful
  - Sentry integration for production error tracking
- [ ] Accessibility audit (WCAG 2.1 AA compliance)
- [ ] Mobile responsiveness check
- [ ] Security hardening:
  - RLS policies on all tables
  - Input sanitization
  - Rate limiting on public endpoints
  - CORS configuration
  - CSP headers

**Estimated Effort**: 3-4 days

---

### Phase 8: Deployment
**Goal**: Deploy to Vercel with production Supabase.

**Scope**:
- [ ] Set up Vercel project and connect GitHub repo
- [ ] Configure environment variables on Vercel
- [ ] Set up production Supabase project
  - Apply all migrations to production database
  - Configure RLS policies
  - Set up Supabase Storage buckets
- [ ] DNS / custom domain setup (later)
- [ ] Set up Vercel Analytics
- [ ] Set up Sentry for error monitoring
- [ ] Create admin seed data (first admin account)
- [ ] Smoke test all flows in production
- [ ] Document deployment runbook in README

**Estimated Effort**: 1-2 days

---

## Total Estimated Timeline

| Phase | Effort     | Cumulative |
| ----- | ---------- | ---------- |
| 1     | 2-3 days   | ~3 days    |
| 2     | 5-7 days   | ~10 days   |
| 3     | 4-5 days   | ~15 days   |
| 4     | 6-8 days   | ~22 days   |
| 5     | 3-4 days   | ~26 days   |
| 6     | 2-3 days   | ~29 days   |
| 7     | 3-4 days   | ~33 days   |
| 8     | 1-2 days   | ~35 days   |

**Total: ~5 weeks** for a production-ready V1.

---

## Out of Scope (V1)

- Conditional form logic (show/hide questions)
- Form templates library
- Super-admin / admin hierarchy
- Bulk CSV reviewer import
- Webhook integrations
- Mobile app
- Multi-language (i18n)
- Automatic layer advancement (always admin-controlled)
- Score aggregation across layers
- Azure deployment (planned V2)
