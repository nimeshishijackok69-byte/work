import { NextResponse } from 'next/server'
import {
  getEmailConfigurationState,
  sendReviewerAssignmentEmail,
  sendSubmissionConfirmationEmail,
} from '@/lib/email/resend'
import { testEmailSchema } from '@/lib/validations/email'

export const dynamic = 'force-dynamic'

function ensureDevelopmentOnly() {
  if (process.env.NODE_ENV === 'development') {
    return null
  }

  return NextResponse.json({ error: 'Not found.' }, { status: 404 })
}

export async function GET() {
  const blockedResponse = ensureDevelopmentOnly()

  if (blockedResponse) {
    return blockedResponse
  }

  const configuration = getEmailConfigurationState()

  return NextResponse.json({
    data: {
      configured: configuration.isConfigured,
      errors: configuration.errors,
      fromEmail: configuration.fromEmail ?? null,
      templates: ['submission-confirmation', 'reviewer-assignment'],
      testEmail: configuration.testEmail ?? null,
    },
    message: 'Use POST to trigger a development test email.',
  })
}

export async function POST(request: Request) {
  const blockedResponse = ensureDevelopmentOnly()

  if (blockedResponse) {
    return blockedResponse
  }

  try {
    const body = await request.json()
    const validatedFields = testEmailSchema.safeParse(body)

    if (!validatedFields.success) {
      return NextResponse.json(
        {
          error: 'Invalid test email payload.',
          details: validatedFields.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const configuration = getEmailConfigurationState()

    if (!configuration.isConfigured) {
      return NextResponse.json(
        {
          error: 'Email configuration is incomplete.',
          details: configuration.errors,
        },
        { status: 503 }
      )
    }

    const recipient = validatedFields.data.to ?? configuration.testEmail

    if (!recipient) {
      return NextResponse.json(
        {
          error: 'Provide a `to` email address or set RESEND_TEST_EMAIL in .env.local.',
        },
        { status: 400 }
      )
    }

    const template = validatedFields.data.template

    const result =
      template === 'reviewer-assignment'
        ? await sendReviewerAssignmentEmail({
            assignmentCount: 3,
            dueDateLabel: 'Friday at 5:00 PM',
            eventTitle: 'District Excellence Awards',
            layerName: 'Layer R1',
            reviewUrl: 'http://localhost:3000/reviewer',
            reviewerName: 'Jordan Reviewer',
            to: recipient,
          })
        : await sendSubmissionConfirmationEmail({
            eventTitle: 'District Excellence Awards',
            submissionReference: 'FF-DEV-2026-0001',
            submittedAtLabel: new Date().toLocaleString('en-IN', {
              dateStyle: 'medium',
              timeStyle: 'short',
            }),
            supportEmail: configuration.replyToEmail,
            teacherName: 'Taylor Teacher',
            to: recipient,
          })

    return NextResponse.json({
      data: {
        emailId: result.id,
        template,
        to: recipient,
      },
      message: 'Test email sent successfully.',
    })
  } catch (error) {
    console.error('[TEST_EMAIL_ROUTE]', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unable to send the test email.',
      },
      { status: 500 }
    )
  }
}
