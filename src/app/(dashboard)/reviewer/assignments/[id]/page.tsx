import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { auth } from '@/lib/auth/auth'
import {
  formatReviewValue,
  getReviewerAssignmentDetail,
  getSubmissionResponses,
  requireReviewerContext,
} from '@/lib/reviews/service'
import { normalizeGradeConfig } from '@/lib/validations/events'
import { PageHeader } from '@/components/layout/PageHeader'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Json } from '@/types/database'
import { ReviewSubmitForm } from './review-submit-form'

function formatDateTime(value: string | null) {
  if (!value) {
    return 'Not available'
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function renderValue(value: Json | undefined): string {
  if (value === null || value === undefined) {
    return 'No response'
  }

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return 'Unable to display response'
  }
}

function getFileAttachments(value: Json): Array<{ file_name?: string; file_url?: string }> {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter(
    (item): item is { file_name?: string; file_url?: string } =>
      typeof item === 'object' && item !== null
  )
}

export default async function ReviewerAssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'reviewer') {
    redirect('/admin')
  }

  const { id } = await params
  const context = await requireReviewerContext()
  const detail = await getReviewerAssignmentDetail(context, id)

  if (!detail) {
    notFound()
  }

  const responses = getSubmissionResponses(detail.event, detail.submission)
  const gradeOptions = normalizeGradeConfig(detail.event.grade_config).map((item) => item.label)
  const attachments = getFileAttachments(detail.submission.file_attachments)

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <PageHeader
        actions={
          <Link className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))} href="/reviewer">
            <ArrowLeft className="size-4" />
            Back to queue
          </Link>
        }
        breadcrumbs={[
          { href: '/reviewer', label: 'Dashboard' },
          { label: `Assignment ${detail.assignment.id.slice(0, 8).toUpperCase()}` },
        ]}
        description="Review only the data assigned to you. Earlier-layer notes stay visible as read-only continuity."
        eyebrow="Reviewer"
        title={detail.event.title}
      />

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-white/80 bg-white/95">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Assignment status</p>
            <p className="mt-2 text-2xl font-semibold capitalize text-slate-950">{detail.assignment.status}</p>
          </CardContent>
        </Card>
        <Card className="border-white/80 bg-white/95">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Layer</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{detail.assignment.layer}</p>
          </CardContent>
        </Card>
        <Card className="border-white/80 bg-white/95">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Teacher</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {detail.teacher?.name || detail.teacher?.email || 'Unknown'}
            </p>
          </CardContent>
        </Card>
        <Card className="border-white/80 bg-white/95">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Submitted</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">
              {formatDateTime(detail.submission.submitted_at)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.9fr]">
        <div className="space-y-6">
          <Card className="border-white/80 bg-white/95">
            <CardHeader>
              <CardTitle>Teacher details</CardTitle>
              <CardDescription>Use this metadata to understand who submitted the form before scoring.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
              <p>
                <span className="font-semibold text-slate-900">Name:</span> {detail.teacher?.name || 'Unknown'}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Email:</span> {detail.teacher?.email || 'Unknown'}
              </p>
              <p>
                <span className="font-semibold text-slate-900">School:</span>{' '}
                {detail.teacher?.school_name || 'Not provided'}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Phone:</span> {detail.teacher?.phone || 'Not provided'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/80 bg-white/95">
            <CardHeader>
              <CardTitle>Submission responses</CardTitle>
              <CardDescription>
                Responses are rendered from the published form schema used by the teacher.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {responses.map((response, index) => (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={`${response.label}-${index}`}>
                  <p className="text-sm font-semibold text-slate-950">{response.label}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    {response.type.replaceAll('_', ' ')}
                  </p>
                  <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                    {renderValue(response.value)}
                  </pre>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-white/80 bg-white/95">
            <CardHeader>
              <CardTitle>Uploaded files</CardTitle>
              <CardDescription>Open any teacher attachments referenced in this submission.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {attachments.length ? (
                attachments.map((attachment, index) => (
                  <a
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100"
                    href={attachment.file_url || '#'}
                    key={`${attachment.file_name || 'file'}-${index}`}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {attachment.file_name || 'Open attachment'}
                  </a>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                  No uploaded files are attached to this submission.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <ReviewSubmitForm
            assignmentId={detail.assignment.id}
            existingGrade={detail.submittedReview?.grade || null}
            existingNotes={detail.submittedReview?.notes || null}
            existingScore={detail.submittedReview?.score || null}
            gradeOptions={gradeOptions}
            isSubmitted={Boolean(detail.submittedReview)}
            maxScore={detail.event.max_score}
            scoringType={detail.event.scoring_type}
          />

          <Card className="border-white/80 bg-white/95">
            <CardHeader>
              <CardTitle>Previous reviews</CardTitle>
              <CardDescription>
                If you reviewed this submission in earlier layers, those scores appear here as read-only continuity.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {detail.previousReviews.length ? (
                detail.previousReviews.map((review) => (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={review.id}>
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-slate-950">Layer {review.layer}</p>
                      <p className="text-sm font-semibold text-slate-700">
                        {formatReviewValue(detail.event, review)}
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      Reviewed {formatDateTime(review.reviewed_at)}
                    </p>
                    {review.notes ? (
                      <p className="mt-2 text-sm leading-6 text-slate-600">{review.notes}</p>
                    ) : (
                      <p className="mt-2 text-sm text-slate-400">No notes added.</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                  You do not have any previous-layer reviews for this submission yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
