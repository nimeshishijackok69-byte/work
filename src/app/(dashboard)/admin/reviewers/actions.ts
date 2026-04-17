'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminContext } from '@/lib/events/service'
import {
  createReviewerForAdmin,
  ReviewValidationError,
  ReviewerNotFoundError,
  setReviewerActiveStateForAdmin,
} from '@/lib/reviews/service'
import { reviewerCreateSchema } from '@/lib/validations/reviews'

export interface ReviewerActionState {
  errors?: {
    department?: string[]
    email?: string[]
    name?: string[]
    password?: string[]
    phone?: string[]
    specialization?: string[]
  }
  message?: string
  success?: boolean
}

export async function createReviewerAction(
  _previousState: ReviewerActionState | undefined,
  formData: FormData
): Promise<ReviewerActionState> {
  try {
    const parsed = reviewerCreateSchema.safeParse({
      email: formData.get('email'),
      password: formData.get('password'),
      name: formData.get('name'),
      phone: formData.get('phone'),
      department: formData.get('department'),
      specialization: formData.get('specialization'),
    })

    if (!parsed.success) {
      return {
        errors: parsed.error.flatten().fieldErrors,
        message: 'Please fix the highlighted fields and try again.',
      }
    }

    const context = await requireAdminContext()
    await createReviewerForAdmin(context, parsed.data)

    revalidatePath('/admin/reviewers')

    return {
      message: 'Reviewer account created successfully.',
      success: true,
    }
  } catch (error) {
    if (error instanceof ReviewValidationError) {
      return { message: error.message }
    }

    console.error('[REVIEWER_CREATE_ACTION]', error)
    return { message: 'Unable to create the reviewer right now.' }
  }
}

export async function toggleReviewerActiveAction(reviewerId: string, isActive: boolean) {
  try {
    const context = await requireAdminContext()
    await setReviewerActiveStateForAdmin(context, reviewerId, isActive)
    revalidatePath('/admin/reviewers')
  } catch (error) {
    if (error instanceof ReviewerNotFoundError) {
      return
    }

    console.error('[REVIEWER_TOGGLE_ACTION]', error)
  }
}
