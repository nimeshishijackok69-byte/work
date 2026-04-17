import { NextResponse } from 'next/server'
import { normalizeFormSchema } from '@/lib/forms/schema'
import {
  createDraftSubmission,
  findOrCreateTeacher,
  FormClosedError,
  getPublicEvent,
  submitForm,
} from '@/lib/submissions/service'
import { createAdminClient } from '@/lib/supabase/admin'
import { submissionRequestSchema, buildFormResponseSchema } from '@/lib/validations/submissions'

/* ------------------------------------------------------------------ */
/*  Simple in-memory rate limiter                                     */
/* ------------------------------------------------------------------ */

const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute
const RATE_LIMIT_MAX = 10 // max 10 submissions per IP per minute

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  entry.count += 1
  return entry.count > RATE_LIMIT_MAX
}

/* ------------------------------------------------------------------ */
/*  POST /api/submissions                                             */
/* ------------------------------------------------------------------ */

export async function POST(request: Request) {
  try {
    // Rate limiting
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded?.split(',')[0]?.trim() ?? 'unknown'
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Too many submissions. Please wait a moment before trying again.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const parsed = submissionRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid submission data.', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { slug, teacherInfo, formData, isDraft } = parsed.data

    // Load event
    const event = await getPublicEvent(slug)
    if (!event) {
      return NextResponse.json({ error: 'Form not found or no longer accepting submissions.' }, { status: 404 })
    }

    // Validate form data against schema (skip for drafts — allow partial data)
    if (!isDraft) {
      const formSchema = normalizeFormSchema(event.form_schema)
      const responseSchema = buildFormResponseSchema(formSchema)
      const responseValidation = responseSchema.safeParse(formData)

      if (!responseValidation.success) {
        return NextResponse.json(
          { error: 'Please fix the errors in your form.', details: responseValidation.error.flatten() },
          { status: 400 }
        )
      }
    }

    // Find or create teacher
    const supabase = createAdminClient()
    const teacher = await findOrCreateTeacher(supabase, event.id, teacherInfo)

    if (isDraft) {
      const { submission, draftToken } = await createDraftSubmission(
        event.id,
        teacher.id,
        formData
      )

      try {
        const { sendDraftResumeEmail } = await import('@/lib/email/resend')
        
        // Use standard window.location logic for determining the origin if available, 
        // otherwise rely on vercel env vars or fallback to localhost
        const host = request.headers.get('host') || 'localhost:3000'
        const protocol = host.includes('localhost') ? 'http' : 'https'
        const appUrl = `${protocol}://${host}`
        
        await sendDraftResumeEmail({
          to: teacherInfo.email,
          eventTitle: event.title,
          resumeLink: `${appUrl}/form/${slug}/draft?token=${draftToken}`,
          teacherName: teacherInfo.name,
        })
      } catch (e) {
        console.error('[API] Failed to send draft resume email', e)
        // do not fail draft creation if email fails
      }

      return NextResponse.json({
        submissionId: submission.id,
        draftToken,
        status: 'draft',
      })
    }

    // Final submission
    const submission = await submitForm(
      event.id,
      teacher.id,
      formData,
      { ...teacherInfo, eventTitle: event.title } as never,
      undefined
    )

    // Re-send confirmation email with event title
    // (the service sends it but without title; let's fix that inline)
    try {
      const { sendSubmissionConfirmationEmail } = await import('@/lib/email/resend')
      await sendSubmissionConfirmationEmail({
        to: teacherInfo.email,
        eventTitle: event.title,
        submissionReference: submission.id.slice(0, 8).toUpperCase(),
        submittedAtLabel: new Intl.DateTimeFormat('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date(submission.submitted_at ?? Date.now())),
        teacherName: teacherInfo.name,
      })
    } catch {
      // Email failure should not block submission
    }

    return NextResponse.json({
      submissionId: submission.id,
      status: 'submitted',
      submissionNumber: submission.submission_number,
      reference: submission.id.slice(0, 8).toUpperCase(),
    })
  } catch (error) {
    if (error instanceof FormClosedError) {
      return NextResponse.json({ error: error.message }, { status: 410 })
    }

    console.error('[API] POST /api/submissions', error)
    return NextResponse.json({ error: 'Unable to process your submission.' }, { status: 500 })
  }
}
