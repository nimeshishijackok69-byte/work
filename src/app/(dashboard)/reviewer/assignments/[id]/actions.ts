'use server'

import { revalidatePath } from 'next/cache'
import { requireReviewerContext, ReviewValidationError, ReviewWorkflowError, submitReviewForReviewer } from '@/lib/reviews/service'
import { submitReviewSchema } from '@/lib/validations/reviews'

export interface SubmitReviewActionState {
  message?: string
  success?: boolean
}

export async function submitReviewAction(
  assignmentId: string,
  _previousState: SubmitReviewActionState | undefined,
  formData: FormData
): Promise<SubmitReviewActionState> {
  try {
    const parsed = submitReviewSchema.safeParse({
      assignment_id: assignmentId,
      score: formData.get('score'),
      grade: formData.get('grade'),
      notes: formData.get('notes'),
    })

    if (!parsed.success) {
      return {
        message: parsed.error.issues[0]?.message || 'Please check the review form and try again.',
      }
    }

    const context = await requireReviewerContext()
    await submitReviewForReviewer(context, parsed.data)

    revalidatePath(`/reviewer/assignments/${assignmentId}`)
    revalidatePath('/reviewer')
    revalidatePath('/admin/reviewers')

    return {
      message: 'Review submitted successfully.',
      success: true,
    }
  } catch (error) {
    if (error instanceof ReviewValidationError || error instanceof ReviewWorkflowError) {
      return { message: error.message }
    }

    console.error('[SUBMIT_REVIEW_ACTION]', error)
    return { message: 'Unable to submit the review right now.' }
  }
}
