import { NextResponse } from 'next/server'
import {
  AdminAccessError,
  EventNotFoundError,
  EventPublishError,
  EventStatusTransitionError,
  publishEventForAdmin,
  closeEventForAdmin,
  requireAdminContext,
} from '@/lib/events/service'

function toErrorResponse(error: unknown) {
  if (error instanceof AdminAccessError) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }

  if (error instanceof EventNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  if (error instanceof EventPublishError) {
    return NextResponse.json({ error: error.message }, { status: 422 })
  }

  if (error instanceof EventStatusTransitionError) {
    return NextResponse.json({ error: error.message }, { status: 409 })
  }

  return null
}

/**
 * POST /api/events/[id]/status
 * Body: { action: 'publish' | 'close' }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAdminContext()
    const { id } = await params
    const body = await request.json()
    const action = body?.action

    if (action !== 'publish' && action !== 'close') {
      return NextResponse.json(
        { error: 'Invalid action. Use "publish" or "close".' },
        { status: 400 }
      )
    }

    let event

    if (action === 'publish') {
      event = await publishEventForAdmin(context, id)
    } else {
      event = await closeEventForAdmin(context, id)
    }

    return NextResponse.json({
      data: event,
      message: action === 'publish'
        ? 'Event published successfully. Teachers can now submit responses.'
        : 'Event closed. No new submissions will be accepted.',
    })
  } catch (error) {
    const response = toErrorResponse(error)

    if (response) {
      return response
    }

    console.error('[API_EVENT_STATUS][POST]', error)
    return NextResponse.json(
      { error: 'Unable to update the event status right now.' },
      { status: 500 }
    )
  }
}
