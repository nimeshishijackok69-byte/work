'use server'

import { revalidatePath } from 'next/cache'
import { requireAdminContext } from '@/lib/events/service'
import {
  advanceSubmissionsForAdmin,
  assignReviewsForAdmin,
  ReviewValidationError,
  ReviewWorkflowError,
} from '@/lib/reviews/service'

export interface ReviewWorkspaceActionState {
  message?: string
  success?: boolean
}

export async function assignReviewerAction(
  eventId: string,
  submissionId: string,
  defaultLayer: number,
  _previousState: ReviewWorkspaceActionState | undefined,
  formData: FormData
): Promise<ReviewWorkspaceActionState> {
  try {
    const reviewerId = String(formData.get('reviewer_id') || '')
    const isOverride = formData.get('is_override') === 'on'

    if (!reviewerId) {
      return { message: 'Select a reviewer before assigning.' }
    }

    const context = await requireAdminContext()
    await assignReviewsForAdmin(context, {
      event_id: eventId,
      assignments: [
        {
          submission_id: submissionId,
          reviewer_id: reviewerId,
          layer: defaultLayer,
          is_override: isOverride,
        },
      ],
    })

    revalidatePath(`/admin/events/${eventId}/reviews`)
    revalidatePath('/admin/reviewers')
    revalidatePath('/reviewer')

    return {
      message: 'Reviewer assigned successfully.',
      success: true,
    }
  } catch (error) {
    if (error instanceof ReviewValidationError || error instanceof ReviewWorkflowError) {
      return { message: error.message }
    }

    console.error('[ASSIGN_REVIEWER_ACTION]', error)
    return { message: 'Unable to assign the reviewer right now.' }
  }
}

export async function decideSubmissionAction(
  eventId: string,
  submissionId: string,
  layer: number,
  decision: 'advance' | 'eliminate',
  _previousState: ReviewWorkspaceActionState | undefined
): Promise<ReviewWorkspaceActionState> {
  try {
    const context = await requireAdminContext()
    await advanceSubmissionsForAdmin(context, {
      event_id: eventId,
      layer,
      advance: decision === 'advance' ? [submissionId] : [],
      eliminate: decision === 'eliminate' ? [submissionId] : [],
    })

    revalidatePath(`/admin/events/${eventId}/reviews`)

    return {
      message: decision === 'advance' ? 'Submission advanced to the next layer.' : 'Submission eliminated from the review funnel.',
      success: true,
    }
  } catch (error) {
    if (error instanceof ReviewValidationError || error instanceof ReviewWorkflowError) {
      return { message: error.message }
    }

    console.error('[DECIDE_SUBMISSION_ACTION]', error)
    return { message: 'Unable to update the submission decision right now.' }
  }
}
