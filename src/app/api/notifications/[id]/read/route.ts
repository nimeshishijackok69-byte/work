import { NextResponse } from 'next/server'
import {
  NotificationAccessError,
  NotificationNotFoundError,
  markNotificationAsRead,
  requireNotificationRecipient,
} from '@/lib/notifications/service'

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const context = await requireNotificationRecipient()
    const notification = await markNotificationAsRead(context, id)

    return NextResponse.json({ data: notification })
  } catch (error) {
    if (error instanceof NotificationAccessError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }

    if (error instanceof NotificationNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    console.error('[API_NOTIFICATIONS_READ]', error)
    return NextResponse.json(
      { error: 'Unable to update notification right now.' },
      { status: 500 }
    )
  }
}
