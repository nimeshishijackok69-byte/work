'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  AdminAccessError,
  EventDraftRequiredError,
  EventNotFoundError,
  EventPublishError,
  EventStatusTransitionError,
  closeEventForAdmin,
  deleteEventForAdmin,
  publishEventForAdmin,
  requireAdminContext,
  updateEventForAdmin,
} from '@/lib/events/service'
import {
  eventUpdateSchema,
  getEventUpdatePayloadFromFormData,
} from '@/lib/validations/events'

export interface EventActionState {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
}

export async function updateEventAction(
  eventId: string,
  _previousState: EventActionState | undefined,
  formData: FormData
): Promise<EventActionState> {
  try {
    const payload = getEventUpdatePayloadFromFormData(formData)
    const parsed = eventUpdateSchema.safeParse(payload)

    if (!parsed.success) {
      return {
        errors: parsed.error.flatten().fieldErrors,
        message: 'Please fix the highlighted fields and try again.',
      }
    }

    const context = await requireAdminContext()
    await updateEventForAdmin(context, eventId, parsed.data)

    revalidatePath(`/admin/events/${eventId}`)
    revalidatePath('/admin/events')

    return {
      message: 'Event updated successfully.',
      success: true,
    }
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return { message: error.message }
    }

    if (error instanceof EventDraftRequiredError) {
      return { message: error.message }
    }

    if (error instanceof EventNotFoundError) {
      return { message: error.message }
    }

    console.error('[EVENT_UPDATE_ACTION]', error)
    return { message: 'Unable to update the event right now. Please try again.' }
  }
}

export async function publishEventAction(eventId: string): Promise<EventActionState> {
  try {
    const context = await requireAdminContext()
    await publishEventForAdmin(context, eventId)

    revalidatePath(`/admin/events/${eventId}`)
    revalidatePath('/admin/events')

    return {
      message: 'Event published! Teachers can now submit responses via the share link.',
      success: true,
    }
  } catch (error) {
    if (error instanceof EventPublishError) {
      return { message: error.message }
    }

    if (error instanceof EventStatusTransitionError) {
      return { message: error.message }
    }

    if (error instanceof AdminAccessError) {
      return { message: error.message }
    }

    console.error('[EVENT_PUBLISH_ACTION]', error)
    return { message: 'Unable to publish the event right now.' }
  }
}

export async function closeEventAction(eventId: string): Promise<EventActionState> {
  try {
    const context = await requireAdminContext()
    await closeEventForAdmin(context, eventId)

    revalidatePath(`/admin/events/${eventId}`)
    revalidatePath('/admin/events')

    return {
      message: 'Event closed. No new submissions will be accepted.',
      success: true,
    }
  } catch (error) {
    if (error instanceof EventStatusTransitionError) {
      return { message: error.message }
    }

    if (error instanceof AdminAccessError) {
      return { message: error.message }
    }

    console.error('[EVENT_CLOSE_ACTION]', error)
    return { message: 'Unable to close the event right now.' }
  }
}

export async function deleteEventAction(eventId: string): Promise<EventActionState> {
  try {
    const context = await requireAdminContext()
    await deleteEventForAdmin(context, eventId)

    revalidatePath('/admin/events')
  } catch (error) {
    if (error instanceof EventDraftRequiredError) {
      return { message: error.message }
    }

    if (error instanceof AdminAccessError) {
      return { message: error.message }
    }

    console.error('[EVENT_DELETE_ACTION]', error)
    return { message: 'Unable to delete the event right now.' }
  }

  redirect('/admin/events')
}
