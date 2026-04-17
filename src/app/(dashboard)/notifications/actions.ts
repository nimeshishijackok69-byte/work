'use server'

import { revalidatePath } from 'next/cache'
import {
  NotificationAccessError,
  NotificationNotFoundError,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  requireNotificationRecipient,
} from '@/lib/notifications/service'

export async function markNotificationReadAction(formData: FormData): Promise<void> {
  try {
    const id = String(formData.get('id') ?? '')

    if (!id) {
      return
    }

    const context = await requireNotificationRecipient()
    await markNotificationAsRead(context, id)
  } catch (error) {
    if (error instanceof NotificationAccessError) {
      console.error('[MARK_NOTIFICATION_READ]', error.message)
      return
    }

    if (error instanceof NotificationNotFoundError) {
      console.error('[MARK_NOTIFICATION_READ]', error.message)
      return
    }

    console.error('[MARK_NOTIFICATION_READ]', error)
  } finally {
    revalidatePath('/notifications')
  }
}

export async function markAllNotificationsReadAction(): Promise<void> {
  try {
    const context = await requireNotificationRecipient()
    await markAllNotificationsAsRead(context)
  } catch (error) {
    if (error instanceof NotificationAccessError) {
      console.error('[MARK_ALL_NOTIFICATIONS_READ]', error.message)
      return
    }

    console.error('[MARK_ALL_NOTIFICATIONS_READ]', error)
  } finally {
    revalidatePath('/notifications')
  }
}
