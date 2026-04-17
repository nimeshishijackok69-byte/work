import { NextResponse } from 'next/server'
import {
  NotificationAccessError,
  markAllNotificationsAsRead,
  requireNotificationRecipient,
} from '@/lib/notifications/service'

export async function POST() {
  try {
    const context = await requireNotificationRecipient()
    const updated = await markAllNotificationsAsRead(context)

    return NextResponse.json({
      data: { updated },
      message: updated ? `Marked ${updated} notification${updated === 1 ? '' : 's'} as read.` : 'No unread notifications.',
    })
  } catch (error) {
    if (error instanceof NotificationAccessError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    console.error('[API_NOTIFICATIONS_READ_ALL]', error)
    return NextResponse.json(
      { error: 'Unable to update notifications right now.' },
      { status: 500 }
    )
  }
}
