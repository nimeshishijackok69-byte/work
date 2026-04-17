import { EmailShell } from './EmailShell'

export interface DraftResumeEmailProps {
  eventTitle: string
  resumeLink: string
  teacherName: string
  supportEmail?: string
}

export function DraftResumeEmail({
  eventTitle,
  resumeLink,
  teacherName,
  supportEmail,
}: DraftResumeEmailProps) {
  return (
    <EmailShell
      previewText={`Resume your draft submission for ${eventTitle}`}
      title="Resume Draft"
    >
      <p style={{ margin: '0 0 16px' }}>Hi {teacherName},</p>
      <p style={{ margin: '0 0 16px' }}>
        You recently started filling out <strong>{eventTitle}</strong> and requested a link to save your
        progress. Your answers have been securely saved.
      </p>
      <p style={{ margin: '24px 0', textAlign: 'center' }}>
        <a
          href={resumeLink}
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            backgroundColor: '#2563eb',
            color: '#ffffff',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: 600,
          }}
        >
          Resume submission
        </a>
      </p>
      <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#64748b' }}>
        Or copy and paste this link into your browser: <br />
        <a href={resumeLink} style={{ color: '#2563eb', wordBreak: 'break-all' }}>
          {resumeLink}
        </a>
      </p>
      <p style={{ margin: '0 0 16px' }}>
        This link is active for 7 days. If you experience any issues, try contacting
        {' '} {supportEmail ?? 'the FormFlow admin team'}.
      </p>
    </EmailShell>
  )
}

export function getDraftResumeText({
  eventTitle,
  resumeLink,
  teacherName,
  supportEmail,
}: DraftResumeEmailProps) {
  return [
    `Hi ${teacherName},`,
    '',
    `You recently started filling out ${eventTitle}. Your progress has been saved.`,
    '',
    `To continue and submit your response, click the link below (valid for 7 days):`,
    resumeLink,
    '',
    `If you experience issues, contact ${supportEmail ?? 'the FormFlow admin team'}.`,
  ].join('\n')
}
