import { NextResponse } from 'next/server'
import { getPublicEventWithStatus } from '@/lib/submissions/service'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    if (!slug || typeof slug !== 'string') {
      return NextResponse.json({ error: 'Invalid form link.' }, { status: 400 })
    }

    const result = await getPublicEventWithStatus(slug)

    if (!result.found) {
      return NextResponse.json({ error: 'Form not found.' }, { status: 404 })
    }

    if (!result.open) {
      return NextResponse.json(
        {
          error: result.reason === 'expired'
            ? 'This form has passed its deadline and is no longer accepting submissions.'
            : 'This form has been closed by the administrator.',
          title: result.title,
          reason: result.reason,
        },
        { status: 410 }
      )
    }

    return NextResponse.json({
      event: result.event,
    })
  } catch (error) {
    console.error('[API] GET /api/forms/[slug]', error)
    return NextResponse.json({ error: 'Unable to load form.' }, { status: 500 })
  }
}
