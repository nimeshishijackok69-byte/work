import { AdminAccessError, requireAdminContext } from '@/lib/events/service'
import {
  AnalyticsAccessError,
  getEventExportCsv,
} from '@/lib/analytics/service'
import { analyticsExportQuerySchema } from '@/lib/validations/analytics'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params
    const url = new URL(request.url)
    const parsed = analyticsExportQuerySchema.safeParse({
      type: url.searchParams.get('type') ?? 'submissions',
    })

    if (!parsed.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid export type.',
          details: parsed.error.flatten().fieldErrors,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const context = await requireAdminContext()
    const { filename, csv } = await getEventExportCsv(context, eventId, parsed.data.type)

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    if (error instanceof AdminAccessError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (error instanceof AnalyticsAccessError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.error('[API_ANALYTICS_EXPORT]', error)
    return new Response(
      JSON.stringify({ error: 'Unable to prepare the export right now.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
