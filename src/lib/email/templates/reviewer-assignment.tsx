import { EmailShell } from './EmailShell'

export interface ReviewerAssignmentEmailProps {
  assignmentCount: number
  dueDateLabel?: string
  eventTitle: string
  layerName: string
  reviewerName: string
  reviewUrl?: string
}

export function ReviewerAssignmentEmail({
  assignmentCount,
  dueDateLabel,
  eventTitle,
  layerName,
  reviewerName,
  reviewUrl,
}: ReviewerAssignmentEmailProps) {
  const assignmentLabel = assignmentCount === 1 ? 'submission' : 'submissions'

  return (
    <EmailShell
      ctaHref={reviewUrl}
      ctaLabel={reviewUrl ? 'Open review queue' : undefined}
      previewText={`You have ${assignmentCount} new ${assignmentLabel} for ${eventTitle}.`}
      title="New review assignment"
    >
      <p style={{ margin: '0 0 16px' }}>Hi {reviewerName},</p>
      <p style={{ margin: '0 0 16px' }}>
        You have been assigned <strong>{assignmentCount}</strong> new {assignmentLabel} for{' '}
        <strong>{eventTitle}</strong>.
      </p>
      <p style={{ margin: '0 0 16px' }}>
        <strong>Layer:</strong> {layerName}
        <br />
        <strong>Status:</strong> Ready for review
        {dueDateLabel ? (
          <>
            <br />
            <strong>Suggested due date:</strong> {dueDateLabel}
          </>
        ) : null}
      </p>
      <p style={{ margin: '0 0 16px' }}>
        Head into FormFlow when you are ready to score these submissions and add notes for the
        admin team.
      </p>
    </EmailShell>
  )
}

export function getReviewerAssignmentText({
  assignmentCount,
  dueDateLabel,
  eventTitle,
  layerName,
  reviewerName,
  reviewUrl,
}: ReviewerAssignmentEmailProps) {
  const assignmentLabel = assignmentCount === 1 ? 'submission' : 'submissions'

  return [
    `Hi ${reviewerName},`,
    '',
    `You have ${assignmentCount} new ${assignmentLabel} for ${eventTitle}.`,
    `Layer: ${layerName}`,
    `Status: Ready for review`,
    dueDateLabel ? `Suggested due date: ${dueDateLabel}` : null,
    reviewUrl ? `Open queue: ${reviewUrl}` : null,
  ]
    .filter((line): line is string => Boolean(line))
    .join('\n')
}
