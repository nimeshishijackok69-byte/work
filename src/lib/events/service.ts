import { randomBytes } from 'node:crypto'
import { auth } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  defaultGradeConfig,
  type EventCreateValues,
  type EventListQueryValues,
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
