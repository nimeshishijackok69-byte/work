import { NextResponse } from 'next/server'
import {
  AdminAccessError,
  EventDraftRequiredError,
  EventNotFoundError,
  getEventForAdmin,
  requireAdminContext,
  updateEventFormSchemaForAdmin,
} from '@/lib/events/service'
import { formSchemaSchema, normalizeFormSchema } from '@/lib/forms/schema'

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

    return NextResponse.json({
      data: normalizeFormSchema(event.form_schema),
      event: {
        id: event.id,
        status: event.status,
        title: event.title,
        updated_at: event.updated_at,
      },
    })
  } catch (error) {
    const response = toErrorResponse(error)

    if (response) {
      return response
    }

    console.error('[API_EVENT_FORM_SCHEMA][GET]', error)
    return NextResponse.json({ error: 'Unable to load the form schema right now.' }, { status: 500 })
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
    const parsed = formSchemaSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid form schema payload.',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const event = await updateEventFormSchemaForAdmin(context, id, parsed.data)

    return NextResponse.json({
      data: normalizeFormSchema(event.form_schema),
      event: {
        id: event.id,
        status: event.status,
        title: event.title,
        updated_at: event.updated_at,
      },
      message: 'Form schema saved.',
    })
  } catch (error) {
    const response = toErrorResponse(error)

    if (response) {
      return response
    }

    console.error('[API_EVENT_FORM_SCHEMA][PUT]', error)
    return NextResponse.json({ error: 'Unable to save the form schema right now.' }, { status: 500 })
  }
}
