import { auth } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database, Json } from '@/types/database'

type SupabaseAdminClient = ReturnType<typeof createAdminClient>
type NotificationRow = Database['public']['Tables']['notification']['Row']
type NotificationInsert = Database['public']['Tables']['notification']['Insert']
type AdminProfile = Database['public']['Tables']['admin_profile']['Row']
type ReviewerRow = Database['public']['Tables']['reviewer_master']['Row']

export type NotificationRecipientType = 'admin' | 'reviewer'

export interface NotificationRecipientContext {
  recipientId: string
  recipientType: NotificationRecipientType
  supabase: SupabaseAdminClient
}

export interface NotificationListOptions {
  is_read?: boolean
  limit: number
  page: number
}

export interface NotificationListResult {
  data: NotificationRow[]
  total: number
  unreadCount: number
  page: number
  limit: number
}

export class NotificationAccessError extends Error {
  constructor(message = 'Sign in to manage notifications.') {
    super(message)
    this.name = 'NotificationAccessError'
  }
}

export class NotificationNotFoundError extends Error {
  constructor(message = 'Notification not found.') {
    super(message)
    this.name = 'NotificationNotFoundError'
  }
}

/* ------------------------------------------------------------------ */
/*  Session → recipient resolution                                     */
/* ------------------------------------------------------------------ */

export async function requireNotificationRecipient(): Promise<NotificationRecipientContext> {
  const session = await auth()

  if (!session?.user) {
    throw new NotificationAccessError()
  }

  const supabase = createAdminClient()

  if (session.user.role === 'admin') {
    const { data, error } = await supabase
      .from('admin_profile')
      .select('*')
      .eq('auth_user_id', session.user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      console.error('[NOTIFICATIONS] Failed to resolve admin recipient', error)
      throw new Error('Unable to load your notifications right now.')
    }

    if (!data) {
      throw new NotificationAccessError('Admin profile not found.')
    }

    return {
      recipientId: (data as AdminProfile).id,
      recipientType: 'admin',
      supabase,
    }
  }

  if (session.user.role === 'reviewer') {
    const { data, error } = await supabase
      .from('reviewer_master')
      .select('*')
      .eq('auth_user_id', session.user.id)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      console.error('[NOTIFICATIONS] Failed to resolve reviewer recipient', error)
      throw new Error('Unable to load your notifications right now.')
    }

    if (!data) {
      throw new NotificationAccessError('Reviewer profile not found.')
    }

    return {
      recipientId: (data as ReviewerRow).id,
      recipientType: 'reviewer',
      supabase,
    }
  }

  throw new NotificationAccessError()
}

/* ------------------------------------------------------------------ */
/*  Queries                                                            */
/* ------------------------------------------------------------------ */

export async function listNotificationsForRecipient(
  context: NotificationRecipientContext,
  options: NotificationListOptions
): Promise<NotificationListResult> {
  const { recipientId, recipientType, supabase } = context
  const { limit, page, is_read } = options
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabase
    .from('notification')
    .select('*', { count: 'exact' })
    .eq('recipient_id', recipientId)
    .eq('recipient_type', recipientType)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (typeof is_read === 'boolean') {
    query = query.eq('is_read', is_read)
  }

  const { data, error, count } = await query

  if (error) {
    console.error('[NOTIFICATIONS] Failed to list notifications', error)
    throw new Error('Unable to load notifications right now.')
  }

  const unreadCount = await countUnreadNotifications(context)

  return {
    data: (data as NotificationRow[] | null) ?? [],
    total: count ?? 0,
    unreadCount,
    page,
    limit,
  }
}

export async function countUnreadNotifications(
  context: NotificationRecipientContext
): Promise<number> {
  const { recipientId, recipientType, supabase } = context

  const { count, error } = await supabase
    .from('notification')
    .select('id', { count: 'exact', head: true })
    .eq('recipient_id', recipientId)
    .eq('recipient_type', recipientType)
    .eq('is_read', false)

  if (error) {
    console.error('[NOTIFICATIONS] Failed to count unread notifications', error)
    return 0
  }

  return count ?? 0
}

/* ------------------------------------------------------------------ */
/*  Mutations                                                          */
/* ------------------------------------------------------------------ */

export async function markNotificationAsRead(
  context: NotificationRecipientContext,
  notificationId: string
): Promise<NotificationRow> {
  const { recipientId, recipientType, supabase } = context

  const { data, error } = await supabase
    .from('notification')
    .update({ is_read: true } as never)
    .eq('id', notificationId)
    .eq('recipient_id', recipientId)
    .eq('recipient_type', recipientType)
    .select('*')
    .maybeSingle()

  if (error) {
    console.error('[NOTIFICATIONS] Failed to mark notification as read', error)
    throw new Error('Unable to update notification right now.')
  }

  if (!data) {
    throw new NotificationNotFoundError()
  }

  return data as NotificationRow
}

export async function markAllNotificationsAsRead(
  context: NotificationRecipientContext
): Promise<number> {
  const { recipientId, recipientType, supabase } = context

  const { data, error } = await supabase
    .from('notification')
    .update({ is_read: true } as never)
    .eq('recipient_id', recipientId)
    .eq('recipient_type', recipientType)
    .eq('is_read', false)
    .select('id')

  if (error) {
    console.error('[NOTIFICATIONS] Failed to mark all notifications as read', error)
    throw new Error('Unable to update notifications right now.')
  }

  return ((data as Array<{ id: string }> | null) ?? []).length
}

/* ------------------------------------------------------------------ */
/*  Write helpers (for other services)                                 */
/* ------------------------------------------------------------------ */

export interface CreateNotificationInput {
  recipientId: string
  recipientType: NotificationRecipientType
  title: string
  message: string
  type: 'assignment' | 'submission' | 'review_complete' | 'system'
  actionUrl?: string | null
  metadata?: Json
}

/**
 * Creates a notification using a provided Supabase admin client. Used by other
 * services (reviews, submissions) that already have a SupabaseAdminClient open.
 */
export async function createNotification(
  supabase: SupabaseAdminClient,
  input: CreateNotificationInput
): Promise<NotificationRow | null> {
  const payload: NotificationInsert = {
    recipient_id: input.recipientId,
    recipient_type: input.recipientType,
    title: input.title,
    message: input.message,
    type: input.type,
    action_url: input.actionUrl ?? null,
    metadata: input.metadata ?? {},
  }

  const { data, error } = await supabase
    .from('notification')
    .insert(payload as never)
    .select('*')
    .single()

  if (error) {
    console.error('[NOTIFICATIONS] Failed to create notification', error)
    return null
  }

  return (data as NotificationRow) ?? null
}
