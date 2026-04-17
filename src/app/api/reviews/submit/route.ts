import { NextResponse } from 'next/server'
import { requireReviewerContext, ReviewAssignmentNotFoundError, ReviewValidationError, ReviewWorkflowError, submitReviewForReviewer } from '@/lib/reviews/service'
import { submitReviewSchema } from '@/lib/validations/reviews'

export async function POST(request: Request) {
  try {
    const context = await requireReviewerContext()
    const body = await request.json()
    const parsed = submitReviewSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid review payload.',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const review = await submitReviewForReviewer(context, parsed.data)

    return NextResponse.json(
      {
        data: review,
        message: 'Review submitted successfully.',
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof ReviewAssignmentNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    if (error instanceof ReviewValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (error instanceof ReviewWorkflowError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }

    console.error('[API_REVIEWS_SUBMIT]', error)
    return NextResponse.json({ error: 'Unable to submit the review right now.' }, { status: 500 })
  }
}
