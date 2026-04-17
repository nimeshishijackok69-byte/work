import { NextResponse } from 'next/server'
import { requireAdminContext } from '@/lib/events/service'
import { assignReviewsForAdmin, ReviewValidationError, ReviewWorkflowError } from '@/lib/reviews/service'
import { assignReviewsSchema } from '@/lib/validations/reviews'

export async function POST(request: Request) {
  try {
    const context = await requireAdminContext()
    const body = await request.json()
    const parsed = assignReviewsSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid review assignment payload.',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const assignments = await assignReviewsForAdmin(context, parsed.data)

    return NextResponse.json(
      {
        data: assignments,
        message: 'Assignments created successfully.',
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof ReviewValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (error instanceof ReviewWorkflowError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }

    console.error('[API_REVIEWS_ASSIGN]', error)
    return NextResponse.json({ error: 'Unable to create assignments right now.' }, { status: 500 })
  }
}
