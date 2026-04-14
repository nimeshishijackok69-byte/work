# FormFlow — API Routes

> **On-Demand Context**: Read this file before working on API endpoints.

---

## Base URL

- **Local**: `http://localhost:3000/api`
- **Production**: `https://formflow.vercel.app/api`

## Authentication

All routes except those marked `[PUBLIC]` require a valid NextAuth session.
Admin routes require `role = 'admin'`. Reviewer routes require `role = 'reviewer'`.

## Response Shape

All responses follow this shape:
```typescript
// Success
{ data: T, message?: string }

// Error
{ error: string, details?: unknown }
```

---

## Auth Routes

### `POST /api/auth/[...nextauth]`
NextAuth.js catch-all route. Handles login, logout, session, CSRF.

### `POST /api/auth/register`
**Admin only.** Creates a new admin or reviewer account.
```typescript
Body: {
  email: string
  password: string
  name: string
  role: 'admin' | 'reviewer'
  phone?: string
  department?: string       // reviewer only
  specialization?: string   // reviewer only
}
Response: { data: { id: string, email: string, role: string } }
```

---

## Event Routes

### `GET /api/events`
**Admin only.** List all events created by the authenticated admin.
```typescript
Query: { page?: number, limit?: number, status?: 'draft' | 'published' | 'closed' }
Response: { data: EventMaster[], total: number, page: number }
```

### `POST /api/events`
**Admin only.** Create a new event.
```typescript
Body: {
  title: string
  description?: string
  review_layers: number
  scoring_type: 'numeric' | 'grade'
  grade_config?: GradeConfigItem[]
  max_score?: number
  expiration_date?: string // ISO 8601
  teacher_fields?: string[]
}
Response: { data: EventMaster }
```

### `GET /api/events/[id]`
**Admin / Assigned Reviewer.** Get event details.
```typescript
Response: { data: EventMaster }
```

### `PATCH /api/events/[id]`
**Admin only.** Update event details/form schema.
```typescript
Body: Partial<EventMaster>
Response: { data: EventMaster }
```

### `POST /api/events/[id]/publish`
**Admin only.** Publish event (makes form accessible via share link).
```typescript
Response: { data: { share_slug: string, share_url: string } }
```

### `POST /api/events/[id]/close`
**Admin only.** Close event (no new submissions).
```typescript
Response: { data: EventMaster }
```

### `DELETE /api/events/[id]`
**Admin only.** Delete event (only if draft, no submissions).
```typescript
Response: { message: "Event deleted" }
```

---

## Form Schema Routes

### `GET /api/events/[id]/form-schema`
**Admin.** Get form schema for the event.
```typescript
Response: { data: FormSchema }
```

### `PUT /api/events/[id]/form-schema`
**Admin only.** Update form schema (full replace, only when event is draft).
```typescript
Body: { fields: FormField[] }
Response: { data: FormSchema }
```

---

## Public Form Routes

### `GET /api/form/[slug]` `[PUBLIC]`
Get published form by share slug (teacher-facing).
```typescript
Response: {
  data: {
    event_id: string
    title: string
    description: string
    form_schema: FormSchema
    teacher_fields: string[]
    expiration_date: string | null
    is_expired: boolean
  }
}
```

### `POST /api/form/[slug]/submit` `[PUBLIC]`
Submit a form response.
```typescript
Body: {
  teacher_info: { name: string, email: string, school_name?: string, phone?: string }
  form_data: Record<string, any>
  file_attachments: FileAttachment[]
}
Response: { data: { submission_id: string }, message: "Submission successful" }
```

### `POST /api/form/[slug]/draft` `[PUBLIC]`
Save form as draft (creates or updates).
```typescript
Body: {
  email: string  // Used to generate draft token
  teacher_info: Partial<TeacherInfo>
  form_data: Record<string, any>
  file_attachments: FileAttachment[]
}
Response: { data: { draft_token: string, message: "Draft saved" } }
```

### `GET /api/form/draft/[token]` `[PUBLIC]`
Retrieve saved draft by token.
```typescript
Response: {
  data: {
    teacher_info: TeacherInfo
    form_data: Record<string, any>
    file_attachments: FileAttachment[]
    event: { title: string, form_schema: FormSchema }
  }
}
```

---

## Submission Routes

### `GET /api/submissions`
**Admin only.** List submissions for an event.
```typescript
Query: {
  event_id: string          // REQUIRED
  page?: number
  limit?: number
  status?: 'draft' | 'submitted'
  review_status?: 'pending' | 'in_review' | 'reviewed' | 'advanced' | 'eliminated'
  layer?: number
  search?: string           // Search by teacher name or school
}
Response: { data: SubmissionWithTeacher[], total: number, page: number }
```

### `GET /api/submissions/[id]`
**Admin / Assigned Reviewer.** Get submission details with form data.
```typescript
Response: {
  data: {
    submission: Submission
    teacher: UserMaster
    event: EventMaster
    reviews: Review[]       // Only for admin; reviewer sees only their own
    file_urls: string[]     // Signed URLs for file downloads
  }
}
```

---

## Reviewer Routes

### `GET /api/reviewers`
**Admin only.** List all reviewers.
```typescript
Query: { page?: number, limit?: number, is_active?: boolean, search?: string }
Response: { data: ReviewerMaster[], total: number }
```

### `POST /api/reviewers`
**Admin only.** Create reviewer account (also creates auth.users entry).
```typescript
Body: { name: string, email: string, password: string, phone?: string, department?: string }
Response: { data: ReviewerMaster }
```

### `PATCH /api/reviewers/[id]`
**Admin only.** Update reviewer profile.

### `DELETE /api/reviewers/[id]`
**Admin only.** Deactivate reviewer (soft delete — sets `is_active = false`).

---

## Review Routes

### `POST /api/reviews/assign`
**Admin only.** Assign submissions to reviewers.
```typescript
Body: {
  event_id: string
  assignments: Array<{
    submission_id: string
    reviewer_id: string
    layer: number
  }>
  is_override?: boolean
}
Response: { data: ReviewAssignment[], notifications_sent: number }
```

### `GET /api/reviews/assignments`
**Reviewer.** Get my assignments.
```typescript
Query: {
  status?: 'pending' | 'in_progress' | 'completed'
  event_id?: string
  layer?: number
}
Response: { data: AssignmentWithDetails[] }
```

### `POST /api/reviews/submit`
**Reviewer.** Submit a review.
```typescript
Body: {
  assignment_id: string
  score?: number         // For numeric scoring
  grade?: string         // For grade scoring
  notes?: string
}
Response: { data: Review }
```

### `GET /api/reviews/history/[submissionId]`
**Reviewer.** Get my previous reviews for a submission (continuity).
```typescript
Response: { data: Review[] }  // Only reviews by the authenticated reviewer
```

### `POST /api/reviews/advance`
**Admin only.** Advance/eliminate submissions after a layer.
```typescript
Body: {
  event_id: string
  layer: number
  advance: string[]      // submission IDs to advance
  eliminate: string[]     // submission IDs to eliminate
}
Response: { data: { advanced: number, eliminated: number } }
```

---

## File Upload Routes

### `POST /api/upload` `[PUBLIC]`
Upload a file (used during form filling).
```typescript
Body: FormData with file
Headers: { Content-Type: multipart/form-data }
Query: { event_id: string }
Response: { data: { file_url: string, file_name: string, file_size: number } }
```
- Validates file size (≤ 20MB)
- Validates file type (if event has `allowed_file_types`)
- Stores via storage abstraction layer

### `GET /api/upload/[fileId]`
**Admin / Assigned Reviewer.** Get signed download URL.
```typescript
Response: { data: { url: string, expires_in: number } }
```

---

## Analytics Routes

### `GET /api/analytics/[eventId]/summary`
**Admin only.** Get event analytics summary.
```typescript
Response: {
  data: {
    total_submissions: number
    submissions_by_status: Record<string, number>
    review_completion_by_layer: Array<{
      layer: number
      total_assignments: number
      completed: number
      pending: number
      completion_rate: number
    }>
    top_rated: Array<{
      submission_id: string
      teacher_name: string
      school_name: string
      avg_score: number
      layer: number
    }>
    avg_score_by_layer: Array<{
      layer: number
      avg_score: number
      min_score: number
      max_score: number
    }>
  }
}
```

### `GET /api/analytics/[eventId]/submissions-over-time`
**Admin only.** Submission trend data for charts.
```typescript
Query: { from?: string, to?: string, interval?: 'day' | 'week' | 'month' }
Response: { data: Array<{ date: string, count: number }> }
```

### `GET /api/analytics/[eventId]/export`
**Admin only.** Export event data as CSV.
```typescript
Query: { type: 'submissions' | 'reviews' }
Response: CSV file download
```

---

## Notification Routes

### `GET /api/notifications`
**Admin / Reviewer.** Get my notifications.
```typescript
Query: { is_read?: boolean, page?: number, limit?: number }
Response: { data: Notification[], unread_count: number }
```

### `PATCH /api/notifications/[id]/read`
**Admin / Reviewer.** Mark notification as read.

### `POST /api/notifications/read-all`
**Admin / Reviewer.** Mark all notifications as read.
