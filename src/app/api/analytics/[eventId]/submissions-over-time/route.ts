import { NextResponse } from 'next/server'
import { AdminAccessError, requireAdminContext } from '@/lib/events/service'
import {
  AnalyticsAccessError,
  getSubmissionsOverTimeForEvent,
} from '@/lib/analytics/service'
import { submissionsOverTimeQuerySchema } from '@/lib/validations/analytics'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const url = new URL(request.url)
    const parsed = submissionsOverTimeQuerySchema.safeParse({
      from: url.searchParams.get('from') ?? undefined,
      to: url.searchParams.get('to') ?? undefined,
      interval: url.searchParams.get('interval') ?? undefined,
    })

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid analytics query.',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const context = await requireAdminContext()
    const data = await getSubmissionsOverTimeForEvent(context, eventId, {
      from: parsed.data.from,
      to: parsed.data.to,
      interval: parsed.data.interval ?? 'day',
    })

    return NextResponse.json({ data })
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    if (error instanceof AnalyticsAccessError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    console.error('[API_ANALYTICS_SUBMISSIONS_OVER_TIME]', error)
    return NextResponse.json(
      { error: 'Unable to load submissions over time right now.' },
      { status: 500 }
    )
  }
}
