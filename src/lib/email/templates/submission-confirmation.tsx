import { EmailShell } from './EmailShell'

export interface SubmissionConfirmationEmailProps {
  eventTitle: string
  submissionReference: string
  submittedAtLabel: string
  supportEmail?: string
  teacherName: string
}

export function SubmissionConfirmationEmail({
  eventTitle,
  submissionReference,
  submittedAtLabel,
  supportEmail,
  teacherName,
}: SubmissionConfirmationEmailProps) {
  return (
    <EmailShell
      previewText={`Your submission for ${eventTitle} has been received.`}
      title="Submission received"
    >
      <p style={{ margin: '0 0 16px' }}>Hi {teacherName},</p>
      <p style={{ margin: '0 0 16px' }}>
        Thanks for submitting your response for <strong>{eventTitle}</strong>. Your entry has
        been recorded and is now ready for the next step in the FormFlow process.
      </p>
      <p style={{ margin: '0 0 16px' }}>
        <strong>Reference:</strong> {submissionReference}
        <br />
        <strong>Submitted:</strong> {submittedAtLabel}
      </p>
      <p style={{ margin: '0 0 16px' }}>
        You can safely keep this email for your records. If you need support, reply to this email
        or contact {supportEmail ?? 'the FormFlow admin team'}.
      </p>
    </EmailShell>
  )
}

export function getSubmissionConfirmationText({
  eventTitle,
  submissionReference,
  submittedAtLabel,
  supportEmail,
  teacherName,
}: SubmissionConfirmationEmailProps) {
  return [
    `Hi ${teacherName},`,
    '',
    `Thanks for submitting your response for ${eventTitle}.`,
    `Reference: ${submissionReference}`,
    `Submitted: ${submittedAtLabel}`,
    '',
    `If you need support, contact ${supportEmail ?? 'the FormFlow admin team'}.`,
  ].join('\n')
}
