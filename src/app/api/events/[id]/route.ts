import { NextResponse } from 'next/server'
import {
  AdminAccessError,
  EventDraftRequiredError,
  EventNotFoundError,
  EventPublishError,
  EventStatusTransitionError,
  getEventForAdmin,
  updateEventForAdmin,
  deleteEventForAdmin,
  requireAdminContext,
} from '@/lib/events/service'
import { eventUpdateSchema } from '@/lib/validations/events'

function toErrorResponse(error: unknown) {
  if (error instanceof AdminAccessError) {
    return NextResponse.json({ error: error.message }, { status: 403 })
  }

  if (error instanceof EventNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  if (error instanceof EventDraftRequiredError) {
    return NextResponse.json({ error: error.message }, { status: 409 })
  }

  if (error instanceof EventPublishError) {
    return NextResponse.json({ error: error.message }, { status: 422 })
  }

  if (error instanceof EventStatusTransitionError) {
    return NextResponse.json({ error: error.message }, { status: 409 })
  }

  return null
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAdminContext()
    const { id } = await params
    const event = await getEventForAdmin(context, id)

    if (!event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 })
    }

    return NextResponse.json({ data: event })
  } catch (error) {
    const response = toErrorResponse(error)

    if (response) {
      return response
    }

    console.error('[API_EVENT][GET]', error)
    return NextResponse.json({ error: 'Unable to load the event right now.' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAdminContext()
    const { id } = await params
    const body = await request.json()
    const parsed = eventUpdateSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid event update payload.',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const event = await updateEventForAdmin(context, id, parsed.data)

    return NextResponse.json({
      data: event,
      message: 'Event updated successfully.',
    })
  } catch (error) {
    const response = toErrorResponse(error)

    if (response) {
      return response
    }

    console.error('[API_EVENT][PUT]', error)
    return NextResponse.json({ error: 'Unable to update the event right now.' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const context = await requireAdminContext()
    const { id } = await params

    await deleteEventForAdmin(context, id)

    return NextResponse.json({
      message: 'Event deleted successfully.',
    })
  } catch (error) {
    const response = toErrorResponse(error)

    if (response) {
      return response
    }

    console.error('[API_EVENT][DELETE]', error)
    return NextResponse.json({ error: 'Unable to delete the event right now.' }, { status: 500 })
  }
}
