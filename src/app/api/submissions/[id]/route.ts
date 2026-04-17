import { NextResponse } from 'next/server'
import { updateDraftSubmission, getDraftByToken } from '@/lib/submissions/service'
import { draftUpdateRequestSchema } from '@/lib/validations/submissions'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = draftUpdateRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid update data.', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { draftToken, formData } = parsed.data

    // Verify the draft belongs to this ID
    const draft = await getDraftByToken(draftToken)
    if (!draft || draft.id !== id) {
      return NextResponse.json({ error: 'Draft not found or expired.' }, { status: 404 })
    }

    const updated = await updateDraftSubmission(draftToken, formData)

    return NextResponse.json({
      submissionId: updated.id,
      status: 'draft',
    })
  } catch (error) {
    console.error('[API] PUT /api/submissions/[id]', error)
    return NextResponse.json({ error: 'Unable to update your draft.' }, { status: 500 })
  }
}
