import { NextResponse } from 'next/server'
import { AdminAccessError, requireAdminContext } from '@/lib/events/service'
import {
  AnalyticsAccessError,
  getEventAnalyticsSummary,
} from '@/lib/analytics/service'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const context = await requireAdminContext()
    const summary = await getEventAnalyticsSummary(context, eventId)

    return NextResponse.json({ data: summary })
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }

    if (error instanceof AnalyticsAccessError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    console.error('[API_ANALYTICS_SUMMARY]', error)
    return NextResponse.json(
      { error: 'Unable to load analytics right now.' },
      { status: 500 }
    )
  }
}
