import { NextResponse } from 'next/server'
import { requireAdminContext } from '@/lib/events/service'
import { advanceSubmissionsForAdmin, ReviewValidationError, ReviewWorkflowError } from '@/lib/reviews/service'
import { advanceReviewsSchema } from '@/lib/validations/reviews'

export async function POST(request: Request) {
  try {
    const context = await requireAdminContext()
    const body = await request.json()
    const parsed = advanceReviewsSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid advancement payload.',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    await advanceSubmissionsForAdmin(context, parsed.data)

    return NextResponse.json({
      message: 'Submission decisions applied successfully.',
    })
  } catch (error) {
    if (error instanceof ReviewValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (error instanceof ReviewWorkflowError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }

    console.error('[API_REVIEWS_ADVANCE]', error)
    return NextResponse.json({ error: 'Unable to update submission decisions right now.' }, { status: 500 })
  }
}
