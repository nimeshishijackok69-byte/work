import { NextResponse } from 'next/server'
import {
  NotificationAccessError,
  listNotificationsForRecipient,
  requireNotificationRecipient,
} from '@/lib/notifications/service'
import { notificationListQuerySchema } from '@/lib/validations/notifications'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const parsed = notificationListQuerySchema.safeParse({
      page: url.searchParams.get('page') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      is_read: url.searchParams.get('is_read') ?? undefined,
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid notification query.', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const context = await requireNotificationRecipient()
    const result = await listNotificationsForRecipient(context, parsed.data)

    return NextResponse.json({
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      unread_count: result.unreadCount,
    })
  } catch (error) {
    if (error instanceof NotificationAccessError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    console.error('[API_NOTIFICATIONS_LIST]', error)
    return NextResponse.json(
      { error: 'Unable to load notifications right now.' },
      { status: 500 }
    )
  }
}
