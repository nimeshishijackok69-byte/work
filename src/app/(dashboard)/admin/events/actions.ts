'use server'

import { revalidatePath } from 'next/cache'
import {
  AdminAccessError,
  createEventForAdmin,
  requireAdminContext,
} from '@/lib/events/service'
import { eventCreateSchema, getEventCreatePayloadFromFormData } from '@/lib/validations/events'

export interface CreateEventFormState {
  errors?: {
    title?: string[]
    description?: string[]
    review_layers?: string[]
    scoring_type?: string[]
    max_score?: string[]
    expiration_date?: string[]
    teacher_fields?: string[]
  }
  message?: string
  success?: boolean
}

export async function createEventAction(
  _previousState: CreateEventFormState | undefined,
  formData: FormData
) {
  try {
    const validatedFields = eventCreateSchema.safeParse(getEventCreatePayloadFromFormData(formData))

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Please fix the highlighted fields and try again.',
      } satisfies CreateEventFormState
    }

    const context = await requireAdminContext()
    await createEventForAdmin(context, validatedFields.data)

    revalidatePath('/admin/events')

    return {
      message: 'Event created. You can start shaping the form next.',
      success: true,
    } satisfies CreateEventFormState
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return {
        message: error.message,
      } satisfies CreateEventFormState
    }

    console.error('[EVENT_CREATE_ACTION]', error)
    return {
      message: 'Unable to create the event right now. Please try again.',
    } satisfies CreateEventFormState
  }
}
