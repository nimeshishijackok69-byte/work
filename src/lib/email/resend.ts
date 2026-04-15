import 'server-only'

import { createElement, type ReactNode } from 'react'
import { Resend } from 'resend'
import { z } from 'zod'
import {
  getReviewerAssignmentText,
  ReviewerAssignmentEmail,
  type ReviewerAssignmentEmailProps,
} from './templates/reviewer-assignment'
import {
  getSubmissionConfirmationText,
  SubmissionConfirmationEmail,
  type SubmissionConfirmationEmailProps,
} from './templates/submission-confirmation'

const emailEnvSchema = z.object({
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required.'),
  RESEND_FROM_EMAIL: z.string().min(1, 'RESEND_FROM_EMAIL is required.'),
  RESEND_REPLY_TO_EMAIL: z.email().optional().or(z.literal('')),
  RESEND_TEST_EMAIL: z.email().optional().or(z.literal('')),
})

interface SendEmailOptions {
  react: ReactNode
  replyTo?: string | string[]
  subject: string
  text: string
  to: string | string[]
}

export interface EmailConfigurationState {
  errors: string[]
  fromEmail?: string
  isConfigured: boolean
  replyToEmail?: string
  testEmail?: string
}

interface EmailConfig {
  RESEND_API_KEY: string
  RESEND_FROM_EMAIL: string
  RESEND_REPLY_TO_EMAIL?: string
  RESEND_TEST_EMAIL?: string
}

let resendClient: Resend | null = null

export function getEmailConfigurationState(): EmailConfigurationState {
  const parsed = emailEnvSchema.safeParse({
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    RESEND_REPLY_TO_EMAIL: process.env.RESEND_REPLY_TO_EMAIL,
    RESEND_TEST_EMAIL: process.env.RESEND_TEST_EMAIL,
  })

  if (!parsed.success) {
    return {
      errors: parsed.error.issues.map((issue) => issue.message),
      isConfigured: false,
    }
  }

  const replyToEmail = parsed.data.RESEND_REPLY_TO_EMAIL || undefined
  const testEmail = parsed.data.RESEND_TEST_EMAIL || undefined

  return {
    errors: [],
    fromEmail: parsed.data.RESEND_FROM_EMAIL,
    isConfigured: true,
    replyToEmail,
    testEmail,
  }
}

function getEmailConfig(): EmailConfig {
  const parsed = emailEnvSchema.safeParse({
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    RESEND_REPLY_TO_EMAIL: process.env.RESEND_REPLY_TO_EMAIL,
    RESEND_TEST_EMAIL: process.env.RESEND_TEST_EMAIL,
  })

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => issue.message).join(' ')
    throw new Error(`Email configuration is incomplete. ${issues}`)
  }

  return {
    RESEND_API_KEY: parsed.data.RESEND_API_KEY,
    RESEND_FROM_EMAIL: parsed.data.RESEND_FROM_EMAIL,
    RESEND_REPLY_TO_EMAIL: parsed.data.RESEND_REPLY_TO_EMAIL || undefined,
    RESEND_TEST_EMAIL: parsed.data.RESEND_TEST_EMAIL || undefined,
  }
}

function getResendClient() {
  const { RESEND_API_KEY } = getEmailConfig()

  if (!resendClient) {
    resendClient = new Resend(RESEND_API_KEY)
  }

  return resendClient
}

export async function sendEmail({ react, replyTo, subject, text, to }: SendEmailOptions) {
  try {
    const config = getEmailConfig()
    const resend = getResendClient()

    const { data, error } = await resend.emails.send({
      from: config.RESEND_FROM_EMAIL,
      react,
      replyTo: replyTo ?? config.RESEND_REPLY_TO_EMAIL,
      subject,
      text,
      to,
    })

    if (error) {
      throw new Error(error.message)
    }

    if (!data?.id) {
      throw new Error('Resend did not return an email identifier.')
    }

    return data
  } catch (error) {
    console.error('[EMAIL_SEND]', error)
    throw error instanceof Error ? error : new Error('Unable to send email.')
  }
}

export async function sendSubmissionConfirmationEmail(
  options: SubmissionConfirmationEmailProps & { to: string | string[] }
) {
  return sendEmail({
    react: createElement(SubmissionConfirmationEmail, options),
    subject: `Submission received: ${options.eventTitle}`,
    text: getSubmissionConfirmationText(options),
    to: options.to,
  })
}

export async function sendReviewerAssignmentEmail(
  options: ReviewerAssignmentEmailProps & { to: string | string[] }
) {
  return sendEmail({
    react: createElement(ReviewerAssignmentEmail, options),
    subject: `New review assignment: ${options.eventTitle}`,
    text: getReviewerAssignmentText(options),
    to: options.to,
  })
}
