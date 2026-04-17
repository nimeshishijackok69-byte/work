import { randomBytes } from 'node:crypto'
import { normalizeFormSchema } from '@/lib/forms/schema'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSubmissionConfirmationEmail } from '@/lib/email/resend'
import type { TeacherInfoValues } from '@/lib/validations/submissions'
import type { Database } from '@/types/database'

type SupabaseAdminClient = ReturnType<typeof createAdminClient>
type EventRow = Database['public']['Tables']['event_master']['Row']
type SubmissionRow = Database['public']['Tables']['submission']['Row']
type TransactionInsert = Database['public']['Tables']['transaction_master']['Insert']

export class FormNotFoundError extends Error {
  constructor(message = 'Form not found.') {
    super(message)
    this.name = 'FormNotFoundError'
  }
}

export class FormClosedError extends Error {
  constructor(message = 'This form is no longer accepting submissions.') {
    super(message)
    this.name = 'FormClosedError'
  }
}

export class DraftNotFoundError extends Error {
  constructor(message = 'Draft not found or expired.') {
    super(message)
    this.name = 'DraftNotFoundError'
  }
}

export class DraftTokenExpiredError extends Error {
  constructor(message = 'This draft link has expired. Please start a new submission.') {
    super(message)
    this.name = 'DraftTokenExpiredError'
  }
}

/* ------------------------------------------------------------------ */
/*  Public event loading                                              */
/* ------------------------------------------------------------------ */

export interface PublicEvent {
  id: string
  title: string
  description: string | null
  form_schema: ReturnType<typeof normalizeFormSchema>
  teacher_fields: string[]
  expiration_date: string | null
  share_slug: string
  max_file_size: number
  allowed_file_types: string[]
  status: string
}

export async function getPublicEvent(slug: string): Promise<PublicEvent | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('event_master')
    .select('id, title, description, form_schema, teacher_fields, expiration_date, share_slug, max_file_size, allowed_file_types, status')
    .eq('share_slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (error) {
    console.error('[SUBMISSIONS] Failed to load public event', error)
    return null
  }

  if (!data) return null

  const event = data as EventRow

  // Check expiration
  if (event.expiration_date) {
    const expirationDate = new Date(event.expiration_date)
    if (expirationDate.getTime() <= Date.now()) {
      return null
    }
  }

  return {
    id: event.id,
    title: event.title,
    description: event.description,
    form_schema: normalizeFormSchema(event.form_schema),
    teacher_fields: parseTeacherFields(event.teacher_fields),
    expiration_date: event.expiration_date,
    share_slug: event.share_slug,
    max_file_size: event.max_file_size,
    allowed_file_types: event.allowed_file_types,
    status: event.status,
  }
}

/**
 * Same as getPublicEvent but also returns closed/expired events
 * so the UI can show an appropriate "form closed" message.
 */
export async function getPublicEventWithStatus(slug: string): Promise<
  | { found: true; open: true; event: PublicEvent }
  | { found: true; open: false; title: string; reason: 'closed' | 'expired' }
  | { found: false }
> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('event_master')
    .select('id, title, description, form_schema, teacher_fields, expiration_date, share_slug, max_file_size, allowed_file_types, status')
    .eq('share_slug', slug)
    .maybeSingle()

  if (error || !data) {
    return { found: false }
  }

  const event = data as EventRow

  if (event.status === 'draft') {
    return { found: false }
  }

  if (event.status === 'closed') {
    return { found: true, open: false, title: event.title, reason: 'closed' }
  }

  if (event.expiration_date) {
    const expirationDate = new Date(event.expiration_date)
    if (expirationDate.getTime() <= Date.now()) {
      return { found: true, open: false, title: event.title, reason: 'expired' }
    }
  }

  return {
    found: true,
    open: true,
    event: {
      id: event.id,
      title: event.title,
      description: event.description,
      form_schema: normalizeFormSchema(event.form_schema),
      teacher_fields: parseTeacherFields(event.teacher_fields),
      expiration_date: event.expiration_date,
      share_slug: event.share_slug,
      max_file_size: event.max_file_size,
      allowed_file_types: event.allowed_file_types,
      status: event.status,
    },
  }
}

/* ------------------------------------------------------------------ */
/*  Teacher management                                                */
/* ------------------------------------------------------------------ */

export async function findOrCreateTeacher(
  supabase: SupabaseAdminClient,
  eventId: string,
  info: TeacherInfoValues
) {
  // Check if teacher already exists for this event
  const { data: existing } = await supabase
    .from('user_master')
    .select('*')
    .eq('event_id', eventId)
    .eq('email', info.email)
    .maybeSingle()

  if (existing) {
    return existing as Database['public']['Tables']['user_master']['Row']
  }

  const { data: created, error } = await supabase
    .from('user_master')
    .insert({
      event_id: eventId,
      name: info.name,
      email: info.email,
      phone: info.phone || null,
      school_name: info.school_name || null,
    } as never)
    .select('*')
    .single()

  if (error || !created) {
    console.error('[SUBMISSIONS] Failed to create teacher record', error)
    throw new Error('Unable to save your information.')
  }

  return created as Database['public']['Tables']['user_master']['Row']
}

/* ------------------------------------------------------------------ */
/*  Draft operations                                                  */
/* ------------------------------------------------------------------ */

function generateDraftToken(): string {
  return randomBytes(32).toString('hex')
}

function getDraftTokenExpiry(): string {
  const expiry = new Date()
  expiry.setDate(expiry.getDate() + 7) // 7-day expiry
  return expiry.toISOString()
}

export async function createDraftSubmission(
  eventId: string,
  userId: string,
  formData: Record<string, unknown>
): Promise<{ submission: SubmissionRow; draftToken: string }> {
  const supabase = createAdminClient()
  const draftToken = generateDraftToken()
  const draftTokenExpires = getDraftTokenExpiry()

  const submissionNumber = await getNextSubmissionNumber(supabase, eventId, userId)

  const { data, error } = await supabase
    .from('submission')
    .insert({
      event_id: eventId,
      user_id: userId,
      form_data: formData as never,
      status: 'draft',
      submission_number: submissionNumber,
      draft_token: draftToken,
      draft_token_expires: draftTokenExpires,
    } as never)
    .select('*')
    .single()

  if (error || !data) {
    console.error('[SUBMISSIONS] Failed to create draft', error)
    throw new Error('Unable to save your draft.')
  }

  await logTransaction(supabase, {
    action: 'draft_saved',
    actor_type: 'teacher',
    event_id: eventId,
    submission_id: (data as SubmissionRow).id,
    user_id: userId,
    metadata: { draft_token_expires: draftTokenExpires },
  })

  return { submission: data as SubmissionRow, draftToken }
}

export async function updateDraftSubmission(
  draftToken: string,
  formData: Record<string, unknown>
): Promise<SubmissionRow> {
  const supabase = createAdminClient()

  const draft = await getDraftByToken(draftToken)

  if (!draft) {
    throw new DraftNotFoundError()
  }

  const { data, error } = await supabase
    .from('submission')
    .update({
      form_data: formData as never,
      draft_token_expires: getDraftTokenExpiry(), // Extend expiry on save
    } as never)
    .eq('id', draft.id)
    .eq('status', 'draft')
    .select('*')
    .single()

  if (error || !data) {
    console.error('[SUBMISSIONS] Failed to update draft', error)
    throw new Error('Unable to save your draft.')
  }

  return data as SubmissionRow
}

export async function getDraftByToken(token: string): Promise<SubmissionRow | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('submission')
    .select('*')
    .eq('draft_token', token)
    .eq('status', 'draft')
    .maybeSingle()

  if (error || !data) return null

  const submission = data as SubmissionRow

  // Check expiry
  if (submission.draft_token_expires) {
    const expiry = new Date(submission.draft_token_expires)
    if (expiry.getTime() <= Date.now()) {
      return null
    }
  }

  return submission
}

/* ------------------------------------------------------------------ */
/*  Final submission                                                  */
/* ------------------------------------------------------------------ */

export async function submitForm(
  eventId: string,
  userId: string,
  formData: Record<string, unknown>,
  teacherInfo: TeacherInfoValues,
  existingDraftId?: string
): Promise<SubmissionRow> {
  const supabase = createAdminClient()

  const submittedAt = new Date().toISOString()

  let submission: SubmissionRow

  if (existingDraftId) {
    // Finalize existing draft
    const { data, error } = await supabase
      .from('submission')
      .update({
        form_data: formData as never,
        status: 'submitted',
        submitted_at: submittedAt,
        draft_token: null,
        draft_token_expires: null,
      } as never)
      .eq('id', existingDraftId)
      .eq('user_id', userId)
      .select('*')
      .single()

    if (error || !data) {
      console.error('[SUBMISSIONS] Failed to finalize draft', error)
      throw new Error('Unable to submit your form.')
    }

    submission = data as SubmissionRow
  } else {
    // Create new submission directly
    const submissionNumber = await getNextSubmissionNumber(supabase, eventId, userId)

    const { data, error } = await supabase
      .from('submission')
      .insert({
        event_id: eventId,
        user_id: userId,
        form_data: formData as never,
        status: 'submitted',
        submission_number: submissionNumber,
        submitted_at: submittedAt,
      } as never)
      .select('*')
      .single()

    if (error || !data) {
      console.error('[SUBMISSIONS] Failed to create submission', error)
      throw new Error('Unable to submit your form.')
    }

    submission = data as SubmissionRow
  }

  // Log transaction
  await logTransaction(supabase, {
    action: submission.submission_number > 1 ? 'form_resubmitted' : 'form_submitted',
    actor_type: 'teacher',
    event_id: eventId,
    submission_id: submission.id,
    user_id: userId,
    metadata: {
      submission_number: submission.submission_number,
      submitted_at: submittedAt,
    },
  })

  // Send confirmation email (fire-and-forget)
  sendSubmissionConfirmationEmail({
    to: teacherInfo.email,
    eventTitle: '', // Will be populated by the caller
    submissionReference: `${submission.id.slice(0, 8).toUpperCase()}`,
    submittedAtLabel: new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(submittedAt)),
    teacherName: teacherInfo.name,
  }).catch((err) => {
    console.error('[SUBMISSIONS] Failed to send confirmation email', err)
  })

  return submission
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

async function getNextSubmissionNumber(
  supabase: SupabaseAdminClient,
  eventId: string,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('submission')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('user_id', userId)

  if (error) {
    console.error('[SUBMISSIONS] Failed to count submissions', error)
    return 1
  }

  return (count ?? 0) + 1
}

async function logTransaction(supabase: SupabaseAdminClient, input: TransactionInsert) {
  const { error } = await supabase.from('transaction_master').insert(input as never)

  if (error) {
    console.error('[SUBMISSIONS] Failed to write transaction log', error)
  }
}

function parseTeacherFields(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((field): field is string => typeof field === 'string')
  }

  return ['name', 'email', 'school_name']
}
