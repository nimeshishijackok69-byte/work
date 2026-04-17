'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAdminContext } from '@/lib/events/service'
import {
  applySubmissionDecisionBatchForAdmin,
  advanceSubmissionsForAdmin,
  assignReviewsForAdmin,
  ReviewValidationError,
  ReviewWorkflowError,
} from '@/lib/reviews/service'

export interface ReviewWorkspaceActionState {
  message?: string
  success?: boolean
}

function buildWorkspaceRedirectUrl(
  eventId: string,
  currentQueryString: string,
  outcome: { message: string; success: boolean }
) {
  const params = new URLSearchParams(currentQueryString)
  params.delete('notice')
  params.delete('noticeType')
  params.set('notice', outcome.message)
  params.set('noticeType', outcome.success ? 'success' : 'error')
  const search = params.toString()

  return search ? `/admin/events/${eventId}/reviews?${search}` : `/admin/events/${eventId}/reviews`
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

export async function bulkReviewWorkspaceAction(
  eventId: string,
  currentQueryString: string,
  formData: FormData
): Promise<never> {
  const intent = String(formData.get('intent') || '')
  const submissionIds = formData
    .getAll('submission_ids')
    .map((value) => String(value))
    .filter(Boolean)

  if (!submissionIds.length) {
    redirect(
      buildWorkspaceRedirectUrl(eventId, currentQueryString, {
        message: 'Select at least one submission first.',
        success: false,
      })
    )
  }

  if (intent !== 'assign' && intent !== 'advance' && intent !== 'eliminate') {
    redirect(
      buildWorkspaceRedirectUrl(eventId, currentQueryString, {
        message: 'Choose a valid bulk action.',
        success: false,
      })
    )
  }

  if (intent === 'assign' && !String(formData.get('reviewer_id') || '')) {
    redirect(
      buildWorkspaceRedirectUrl(eventId, currentQueryString, {
        message: 'Select a reviewer before assigning submissions.',
        success: false,
      })
    )
  }

  try {
    const context = await requireAdminContext()

    if (intent === 'assign') {
      const reviewerId = String(formData.get('reviewer_id') || '')
      const isOverride = formData.get('is_override') === 'on'
      await assignReviewsForAdmin(context, {
        event_id: eventId,
        assignments: submissionIds.map((submissionId) => ({
          submission_id: submissionId,
          reviewer_id: reviewerId,
          layer: Number(formData.get(`layer_${submissionId}`) || 1),
          is_override: isOverride,
        })),
      })
    } else {
      await applySubmissionDecisionBatchForAdmin(context, eventId, submissionIds, intent)
    }

    revalidatePath(`/admin/events/${eventId}/reviews`)
    revalidatePath('/admin/reviewers')
    revalidatePath('/reviewer')

    redirect(
      buildWorkspaceRedirectUrl(eventId, currentQueryString, {
        message:
          intent === 'assign'
            ? 'Bulk assignment completed successfully.'
            : intent === 'advance'
              ? 'Selected submissions advanced successfully.'
              : 'Selected submissions eliminated successfully.',
        success: true,
      })
    )
  } catch (error) {
    if (error instanceof ReviewValidationError || error instanceof ReviewWorkflowError) {
      redirect(
        buildWorkspaceRedirectUrl(eventId, currentQueryString, {
          message: error.message,
          success: false,
        })
      )
    }

    console.error('[BULK_REVIEW_WORKSPACE_ACTION]', error)
    redirect(
      buildWorkspaceRedirectUrl(eventId, currentQueryString, {
        message: 'Unable to complete the bulk review action right now.',
        success: false,
      })
    )
  }
}
