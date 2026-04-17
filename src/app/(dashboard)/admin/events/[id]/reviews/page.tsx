import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Eye, UsersRound } from 'lucide-react'
import { auth } from '@/lib/auth/auth'
import { requireAdminContext } from '@/lib/events/service'
import { formatReviewValue, getEventReviewWorkspaceForAdmin } from '@/lib/reviews/service'
import { PageHeader } from '@/components/layout/PageHeader'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { SubmissionReviewCard } from './submission-review-card'

function formatDateTime(value: string | null) {
  if (!value) {
    return 'Not submitted yet'
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default async function EventReviewWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'admin') {
    redirect('/reviewer')
  }

  const { id } = await params
  const context = await requireAdminContext()
  const workspace = await getEventReviewWorkspaceForAdmin(context, id)

  if (!workspace) {
    notFound()
  }

  const activeReviewers = workspace.reviewers.filter((item) => item.reviewer.is_active)
  const reviewedCount = workspace.submissions.filter(
    (item) => item.submission.review_status === 'reviewed'
  ).length
  const inReviewCount = workspace.submissions.filter(
    (item) => item.submission.review_status === 'in_review'
  ).length

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <PageHeader
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Link
              className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
              href={`/admin/events/${workspace.event.id}`}
            >
              <ArrowLeft className="size-4" />
              Back to event
            </Link>
            <Link className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))} href="/admin/reviewers">
              <UsersRound className="size-4" />
              Manage reviewers
            </Link>
          </div>
        }
        breadcrumbs={[
          { href: '/admin', label: 'Dashboard' },
          { href: '/admin/events', label: 'Events' },
          { href: `/admin/events/${workspace.event.id}`, label: workspace.event.title },
          { label: 'Review workspace' },
        ]}
        description="Assign submissions into sequential review layers, inspect completed scores, and make admin advancement decisions."
        eyebrow="Admin"
        title={`${workspace.event.title} review workspace`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border-white/80 bg-white/95">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Event status</p>
            <p className="mt-2 text-2xl font-semibold capitalize text-slate-950">{workspace.event.status}</p>
          </CardContent>
        </Card>
        <Card className="border-white/80 bg-white/95">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Submitted entries</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{workspace.submissions.length}</p>
          </CardContent>
        </Card>
        <Card className="border-white/80 bg-white/95">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">In review</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{inReviewCount}</p>
          </CardContent>
        </Card>
        <Card className="border-white/80 bg-white/95">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Awaiting decision</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{reviewedCount}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.35fr]">
        <Card className="border-white/80 bg-white/95">
          <CardHeader>
            <CardTitle>Reviewer pool</CardTitle>
            <CardDescription>
              Active reviewers can receive new assignments for this event&apos;s {workspace.event.review_layers}{' '}
              {workspace.event.review_layers === 1 ? 'layer' : 'layers'}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeReviewers.length ? (
              activeReviewers.map((item) => (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={item.reviewer.id}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-950">{item.reviewer.name}</p>
                      <p className="text-sm text-slate-600">{item.reviewer.email}</p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-600">
                      {item.pendingAssignments} open
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {item.reviewer.specialization || item.reviewer.department || 'General reviewer'}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                No active reviewers are available. Add or reactivate a reviewer before assigning submissions.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/80 bg-white/95">
          <CardHeader>
            <CardTitle>Workflow notes</CardTitle>
            <CardDescription>
              This workspace follows the sequential funnel documented for Phase 4.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">Assign by layer</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                New submissions start at Layer 1. Advanced submissions can only be assigned at their current layer.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">Wait for completion</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Admin decisions unlock when all assignments in the active layer are completed.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">Advance manually</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Advancement is never automatic. The admin explicitly decides who moves forward.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {workspace.event.status === 'draft' ? (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle>Publish the event first</CardTitle>
            <CardDescription>
              Draft events can be inspected here, but reviewer assignments only open once the form is published.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <div className="grid gap-6">
        {workspace.submissions.length ? (
          workspace.submissions.map((item) => (
            <SubmissionReviewCard
              currentLayer={item.submission.current_layer}
              currentLayerAssignments={item.currentLayerAssignments.map((entry) => ({
                id: entry.assignment.id,
                isOverride: entry.assignment.is_override,
                reviewerName: entry.reviewer?.name || 'Unknown reviewer',
                status: entry.assignment.status,
              }))}
              currentLayerReviews={item.currentLayerReviews.map((entry) => ({
                id: entry.review.id,
                notes: entry.review.notes,
                reviewerName: entry.reviewer?.name || 'Unknown reviewer',
                value: formatReviewValue(workspace.event, entry.review),
              }))}
              eventId={workspace.event.id}
              key={item.submission.id}
              nextAssignableLayer={item.nextAssignableLayer}
              reviewers={workspace.reviewers.map((entry) => ({
                id: entry.reviewer.id,
                isActive: entry.reviewer.is_active,
                name: entry.reviewer.name,
                pendingAssignments: entry.pendingAssignments,
              }))}
              reviewLayers={workspace.event.review_layers}
              reviewStatus={item.submission.review_status}
              submissionId={item.submission.id}
              submissionLabel={`Submission #${item.submission.submission_number} · ${item.submission.id.slice(0, 8).toUpperCase()}`}
              submittedAtLabel={formatDateTime(item.submission.submitted_at)}
              teacherEmail={item.teacher?.email || null}
              teacherName={item.teacher?.name || null}
              teacherSchool={item.teacher?.school_name || null}
            />
          ))
        ) : (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>No submissions yet</CardTitle>
              <CardDescription>
                Teacher responses will appear here once the published form starts receiving submissions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link className={cn(buttonVariants({ variant: 'outline' }))} href={`/form/${workspace.event.share_slug}`}>
                <Eye className="size-4" />
                Preview public form
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
