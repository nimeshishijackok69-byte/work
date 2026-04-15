import { randomBytes } from 'node:crypto'
import { auth } from '@/lib/auth/auth'
import type { FormSchema } from '@/lib/forms/schema'
import { normalizeFormSchema } from '@/lib/forms/schema'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  defaultGradeConfig,
  type EventCreateValues,
  type EventListQueryValues,
  type EventUpdateValues,
} from '@/lib/validations/events'
import type { Database } from '@/types/database'

type SupabaseAdminClient = ReturnType<typeof createAdminClient>
type AdminProfile = Database['public']['Tables']['admin_profile']['Row']
type EventRow = Database['public']['Tables']['event_master']['Row']
type TransactionInsert = Database['public']['Tables']['transaction_master']['Insert']

export interface AdminContext {
  admin: AdminProfile
  supabase: SupabaseAdminClient
}

export interface EventListResult {
  data: EventRow[]
  total: number
  page: number
  limit: number
}

export interface EventStatusCounts {
  all: number
  draft: number
  published: number
  closed: number
}

export class AdminAccessError extends Error {
  constructor(message = 'Only admins can perform this action.') {
    super(message)
    this.name = 'AdminAccessError'
  }
}

export class EventNotFoundError extends Error {
  constructor(message = 'Event not found.') {
    super(message)
    this.name = 'EventNotFoundError'
  }
}

export class EventDraftRequiredError extends Error {
  constructor(message = 'This event is no longer editable because it is not in draft.') {
    super(message)
    this.name = 'EventDraftRequiredError'
  }
}

export class EventPublishError extends Error {
  constructor(message = 'This event cannot be published yet.') {
    super(message)
    this.name = 'EventPublishError'
  }
}

export class EventStatusTransitionError extends Error {
  constructor(message = 'This status transition is not allowed.') {
    super(message)
    this.name = 'EventStatusTransitionError'
  }
}

export async function requireAdminContext(): Promise<AdminContext> {
  const session = await auth()

  if (!session?.user || session.user.role !== 'admin') {
    throw new AdminAccessError()
  }

  const supabase = createAdminClient()
  const { data: admin, error } = await supabase
    .from('admin_profile')
    .select('*')
    .eq('auth_user_id', session.user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    console.error('[EVENTS] Failed to load admin profile', error)
    throw new Error('Unable to verify your admin profile.')
  }

  if (!admin) {
    throw new AdminAccessError('Admin profile not found.')
  }

  return { admin, supabase }
}

export async function listEventsForAdmin(
  context: AdminContext,
  options: EventListQueryValues
): Promise<EventListResult> {
  const { admin, supabase } = context
  const { limit, page, status } = options
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('event_master')
    .select('*', { count: 'exact' })
    .eq('created_by', admin.id)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('[EVENTS] Failed to list events', error)
    throw new Error('Unable to load events right now.')
  }

  return {
    data: data ?? [],
    total: count ?? 0,
    page,
    limit,
  }
}

export async function getEventStatusCountsForAdmin(
  context: AdminContext
): Promise<EventStatusCounts> {
  const { admin, supabase } = context

  const countForStatus = async (status?: EventRow['status']) => {
    let query = supabase
      .from('event_master')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', admin.id)

    if (status) {
      query = query.eq('status', status)
    }

    const { count, error } = await query

    if (error) {
      console.error('[EVENTS] Failed to load event counts', error)
      throw new Error('Unable to load event counts right now.')
    }

    return count ?? 0
  }

  const [all, draft, published, closed] = await Promise.all([
    countForStatus(),
    countForStatus('draft'),
    countForStatus('published'),
    countForStatus('closed'),
  ])

  return { all, draft, published, closed }
}

export async function createEventForAdmin(
  context: AdminContext,
  input: EventCreateValues
): Promise<EventRow> {
  const { admin, supabase } = context
  const shareSlug = await generateUniqueShareSlug(supabase)

  const eventToInsert: Database['public']['Tables']['event_master']['Insert'] = {
    title: input.title,
    description: input.description ?? null,
    form_schema: { fields: [] },
    review_layers: input.review_layers,
    scoring_type: input.scoring_type,
    grade_config: input.scoring_type === 'grade' ? [...defaultGradeConfig] : null,
    max_score: input.max_score,
    status: 'draft',
    share_slug: shareSlug,
    expiration_date: input.expiration_date,
    teacher_fields: input.teacher_fields,
    created_by: admin.id,
  }

  const { data, error } = await supabase
    .from('event_master')
    .insert(eventToInsert as never)
    .select('*')
    .single()
  const event = data as EventRow | null

  if (error || !event) {
    console.error('[EVENTS] Failed to create event', error)
    throw new Error('Unable to create the event.')
  }

  await logTransaction(supabase, {
    action: 'event_created',
    actor_id: admin.id,
    actor_type: 'admin',
    event_id: event.id,
    metadata: {
      review_layers: event.review_layers,
      scoring_type: event.scoring_type,
      share_slug: event.share_slug,
      status: event.status,
      title: event.title,
    },
  })

  return event
}

export async function getEventForAdmin(
  context: AdminContext,
  eventId: string
): Promise<EventRow | null> {
  const { admin, supabase } = context
  const { data, error } = await supabase
    .from('event_master')
    .select('*')
    .eq('id', eventId)
    .eq('created_by', admin.id)
    .maybeSingle()

  if (error) {
    console.error('[EVENTS] Failed to load event', error)
    throw new Error('Unable to load the event right now.')
  }

  return (data as EventRow | null) ?? null
}

export async function updateEventFormSchemaForAdmin(
  context: AdminContext,
  eventId: string,
  formSchema: FormSchema
): Promise<EventRow> {
  const { admin, supabase } = context
  const event = await getEventForAdmin(context, eventId)

  if (!event) {
    throw new EventNotFoundError()
  }

  if (event.status !== 'draft') {
    throw new EventDraftRequiredError()
  }

  const { data, error } = await supabase
    .from('event_master')
    .update({
      form_schema: formSchema,
    } as never)
    .eq('id', eventId)
    .eq('created_by', admin.id)
    .select('*')
    .single()
  const updatedEvent = data as EventRow | null

  if (error || !updatedEvent) {
    console.error('[EVENTS] Failed to update form schema', error)
    throw new Error('Unable to save the form schema right now.')
  }

  await logTransaction(supabase, {
    action: 'form_schema_updated',
    actor_id: admin.id,
    actor_type: 'admin',
    event_id: updatedEvent.id,
    metadata: {
      field_count: formSchema.fields.length,
      status: updatedEvent.status,
    },
  })

  return updatedEvent
}

export async function updateEventForAdmin(
  context: AdminContext,
  eventId: string,
  input: EventUpdateValues
): Promise<EventRow> {
  const { admin, supabase } = context
  const event = await getEventForAdmin(context, eventId)

  if (!event) {
    throw new EventNotFoundError()
  }

  if (event.status !== 'draft') {
    throw new EventDraftRequiredError()
  }

  const updatePayload: Record<string, unknown> = {}

  if (input.title !== undefined) updatePayload.title = input.title
  if (input.description !== undefined) updatePayload.description = input.description || null
  if (input.review_layers !== undefined) updatePayload.review_layers = input.review_layers
  if (input.scoring_type !== undefined) {
    updatePayload.scoring_type = input.scoring_type
    if (input.scoring_type === 'grade' && event.scoring_type !== 'grade') {
      updatePayload.grade_config = [...defaultGradeConfig]
    }
  }
  if (input.max_score !== undefined) updatePayload.max_score = input.max_score
  if (input.expiration_date !== undefined) updatePayload.expiration_date = input.expiration_date
  if (input.teacher_fields !== undefined) updatePayload.teacher_fields = input.teacher_fields

  if (Object.keys(updatePayload).length === 0) {
    return event
  }

  const { data, error } = await supabase
    .from('event_master')
    .update(updatePayload as never)
    .eq('id', eventId)
    .eq('created_by', admin.id)
    .select('*')
    .single()
  const updatedEvent = data as EventRow | null

  if (error || !updatedEvent) {
    console.error('[EVENTS] Failed to update event', error)
    throw new Error('Unable to update the event right now.')
  }

  await logTransaction(supabase, {
    action: 'event_updated',
    actor_id: admin.id,
    actor_type: 'admin',
    event_id: updatedEvent.id,
    metadata: {
      changed_fields: Object.keys(updatePayload),
      status: updatedEvent.status,
    },
  })

  return updatedEvent
}

export async function deleteEventForAdmin(
  context: AdminContext,
  eventId: string
): Promise<void> {
  const { admin, supabase } = context
  const event = await getEventForAdmin(context, eventId)

  if (!event) {
    throw new EventNotFoundError()
  }

  if (event.status !== 'draft') {
    throw new EventDraftRequiredError(
      'Only draft events can be deleted. Close the event instead.'
    )
  }

  // Delete related transaction logs first
  await supabase
    .from('transaction_master')
    .delete()
    .eq('event_id', eventId)

  const { error } = await supabase
    .from('event_master')
    .delete()
    .eq('id', eventId)
    .eq('created_by', admin.id)

  if (error) {
    console.error('[EVENTS] Failed to delete event', error)
    throw new Error('Unable to delete the event right now.')
  }
}

export async function publishEventForAdmin(
  context: AdminContext,
  eventId: string
): Promise<EventRow> {
  const { admin, supabase } = context
  const event = await getEventForAdmin(context, eventId)

  if (!event) {
    throw new EventNotFoundError()
  }

  if (event.status !== 'draft') {
    throw new EventStatusTransitionError(
      'Only draft events can be published.'
    )
  }

  // Validate the form has at least one field before publishing
  const formSchema = normalizeFormSchema(event.form_schema)

  if (!formSchema.fields.length) {
    throw new EventPublishError(
      'Add at least one form field before publishing. Open the form builder to get started.'
    )
  }

  const { data, error } = await supabase
    .from('event_master')
    .update({ status: 'published' } as never)
    .eq('id', eventId)
    .eq('created_by', admin.id)
    .select('*')
    .single()
  const publishedEvent = data as EventRow | null

  if (error || !publishedEvent) {
    console.error('[EVENTS] Failed to publish event', error)
    throw new Error('Unable to publish the event right now.')
  }

  await logTransaction(supabase, {
    action: 'event_published',
    actor_id: admin.id,
    actor_type: 'admin',
    event_id: publishedEvent.id,
    metadata: {
      share_slug: publishedEvent.share_slug,
      field_count: formSchema.fields.length,
      review_layers: publishedEvent.review_layers,
    },
  })

  return publishedEvent
}

export async function closeEventForAdmin(
  context: AdminContext,
  eventId: string
): Promise<EventRow> {
  const { admin, supabase } = context
  const event = await getEventForAdmin(context, eventId)

  if (!event) {
    throw new EventNotFoundError()
  }

  if (event.status !== 'published') {
    throw new EventStatusTransitionError(
      'Only published events can be closed.'
    )
  }

  const { data, error } = await supabase
    .from('event_master')
    .update({ status: 'closed' } as never)
    .eq('id', eventId)
    .eq('created_by', admin.id)
    .select('*')
    .single()
  const closedEvent = data as EventRow | null

  if (error || !closedEvent) {
    console.error('[EVENTS] Failed to close event', error)
    throw new Error('Unable to close the event right now.')
  }

  await logTransaction(supabase, {
    action: 'event_closed',
    actor_id: admin.id,
    actor_type: 'admin',
    event_id: closedEvent.id,
    metadata: {
      previous_status: 'published',
    },
  })

  return closedEvent
}

export async function getSubmissionCountForEvent(
  context: AdminContext,
  eventId: string
): Promise<number> {
  const { supabase } = context
  const { count, error } = await supabase
    .from('submission')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)

  if (error) {
    console.error('[EVENTS] Failed to count submissions', error)
    return 0
  }

  return count ?? 0
}

async function logTransaction(supabase: SupabaseAdminClient, input: TransactionInsert) {
  const { error } = await supabase.from('transaction_master').insert(input as never)

  if (error) {
    console.error('[EVENTS] Failed to write transaction log', error)
  }
}

async function generateUniqueShareSlug(supabase: SupabaseAdminClient) {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const slug = buildShareSlug()
    const { count, error } = await supabase
      .from('event_master')
      .select('id', { count: 'exact', head: true })
      .eq('share_slug', slug)

    if (error) {
      console.error('[EVENTS] Failed to verify share slug uniqueness', error)
      throw new Error('Unable to prepare a unique share link.')
    }

    if (!count) {
      return slug
    }
  }

  throw new Error('Unable to generate a unique share link.')
}

function buildShareSlug(length = 8) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const bytes = randomBytes(length)

  return Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('')
}
