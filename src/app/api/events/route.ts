import { NextResponse } from 'next/server'
import {
  AdminAccessError,
  createEventForAdmin,
  listEventsForAdmin,
  requireAdminContext,
} from '@/lib/events/service'
import {
  eventCreateSchema,
  eventListQuerySchema,
  getEventListPayloadFromSearchParams,
} from '@/lib/validations/events'

export async function GET(request: Request) {
  try {
    const context = await requireAdminContext()
    const query = eventListQuerySchema.safeParse(
      getEventListPayloadFromSearchParams(new URL(request.url).searchParams)
    )

    if (!query.success) {
      return NextResponse.json(
        {
          error: 'Invalid events query.',
          details: query.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const result = await listEventsForAdmin(context, query.data)

    return NextResponse.json({
      data: result.data,
      total: result.total,
      page: result.page,
    })
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    console.error('[API_EVENTS][GET]', error)
    return NextResponse.json({ error: 'Unable to load events right now.' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireAdminContext()
    const body = await request.json()
    const validatedFields = eventCreateSchema.safeParse(body)

    if (!validatedFields.success) {
      return NextResponse.json(
        {
          error: 'Invalid event payload.',
          details: validatedFields.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const event = await createEventForAdmin(context, validatedFields.data)

    return NextResponse.json(
      {
        data: event,
        message: 'Event created successfully.',
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    console.error('[API_EVENTS][POST]', error)
    return NextResponse.json({ error: 'Unable to create the event right now.' }, { status: 500 })
  }
}
