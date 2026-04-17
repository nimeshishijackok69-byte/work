import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, Eye, Search, UsersRound } from 'lucide-react'
import { auth } from '@/lib/auth/auth'
import { requireAdminContext } from '@/lib/events/service'
import { formatReviewValue, getEventReviewWorkspaceForAdmin } from '@/lib/reviews/service'
import { reviewWorkspaceQuerySchema } from '@/lib/validations/reviews'
import { PageHeader } from '@/components/layout/PageHeader'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { bulkReviewWorkspaceAction } from './actions'
import { SubmissionReviewCard } from './submission-review-card'

const statusLabels = {
  all: 'All',
  draft: 'Draft',
  submitted: 'Submitted',
  in_review: 'Under review',
  reviewed: 'Awaiting decision',
  advanced: 'Advanced',
  eliminated: 'Eliminated',
} as const

function formatDateTime(value: string | null) {
  if (!value) {
    return 'Not submitted yet'
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function parseSearchParams(rawSearchParams?: Record<string, string | string[] | undefined>) {
  const candidate = {
    page: Array.isArray(rawSearchParams?.page) ? rawSearchParams.page[0] : rawSearchParams?.page,
    limit: 8,
    q: Array.isArray(rawSearchParams?.q) ? rawSearchParams.q[0] : rawSearchParams?.q,
    status: Array.isArray(rawSearchParams?.status) ? rawSearchParams.status[0] : rawSearchParams?.status,
    layer: Array.isArray(rawSearchParams?.layer) ? rawSearchParams.layer[0] : rawSearchParams?.layer,
  }
  const parsed = reviewWorkspaceQuerySchema.safeParse(candidate)

  if (!parsed.success) {
    return {
      layer: undefined,
      limit: 8,
      page: 1,
      q: undefined,
      status: undefined,
    }
  }

  return parsed.data
}

function buildWorkspaceHref(
  eventId: string,
  filters: {
    layer?: number
    page?: number
    q?: string
    status?: string
  }
) {
  const params = new URLSearchParams()

  if (filters.q) {
    params.set('q', filters.q)
  }

  if (filters.status) {
    params.set('status', filters.status)
  }

  if (typeof filters.layer === 'number') {
    params.set('layer', String(filters.layer))
  }

  if (filters.page && filters.page > 1) {
    params.set('page', String(filters.page))
  }

  const query = params.toString()

  return query ? `/admin/events/${eventId}/reviews?${query}` : `/admin/events/${eventId}/reviews`
}

export default async function EventReviewWorkspacePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'admin') {
    redirect('/reviewer')
  }

  const { id } = await params
  const resolvedSearchParams = (await searchParams) ?? {}
  const filters = parseSearchParams(resolvedSearchParams)
  const notice = Array.isArray(resolvedSearchParams.notice)
    ? resolvedSearchParams.notice[0]
    : resolvedSearchParams.notice
  const noticeType = Array.isArray(resolvedSearchParams.noticeType)
    ? resolvedSearchParams.noticeType[0]
    : resolvedSearchParams.noticeType
  const context = await requireAdminContext()
  const workspace = await getEventReviewWorkspaceForAdmin(context, id, filters)

  if (!workspace) {
    notFound()
  }

  const activeReviewers = workspace.reviewers.filter((item) => item.reviewer.is_active)
  const totalPages = Math.max(1, Math.ceil(workspace.total / workspace.limit))
  const selectedStatus = filters.status ?? 'all'
  const bulkFormId = 'bulk-review-form'
  const currentQueryString = new URLSearchParams(
    Object.entries({
      q: filters.q,
      status: filters.status,
      layer: typeof filters.layer === 'number' ? String(filters.layer) : undefined,
      page: String(filters.page),
    }).filter((entry): entry is [string, string] => Boolean(entry[1]))
  ).toString()
  const bulkAction = bulkReviewWorkspaceAction.bind(null, workspace.event.id, currentQueryString)

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

      {notice ? (
        <Card className={noticeType === 'success' ? 'border-emerald-200 bg-emerald-50' : 'border-destructive/20 bg-destructive/10'}>
          <CardContent className={noticeType === 'success' ? 'p-4 text-sm text-emerald-700' : 'p-4 text-sm text-destructive'}>
            {notice}
          </CardContent>
        </Card>
      ) : null}

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
            <p className="mt-2 text-2xl font-semibold text-slate-950">{workspace.counts.submitted}</p>
          </CardContent>
        </Card>
        <Card className="border-white/80 bg-white/95">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">In review</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{workspace.counts.in_review}</p>
          </CardContent>
        </Card>
        <Card className="border-white/80 bg-white/95">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Awaiting decision</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{workspace.counts.reviewed}</p>
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

      <Card className="border-white/80 bg-white/95">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle>Submission management</CardTitle>
              <CardDescription>
                Search, filter, and process review work in bulk for this event.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(statusLabels) as Array<keyof typeof statusLabels>).map((status) => {
                const isActive = selectedStatus === status
                const href = buildWorkspaceHref(workspace.event.id, {
                  ...filters,
                  page: 1,
                  status: status === 'all' ? undefined : status,
                })
                const count = status === 'all' ? workspace.counts.all : workspace.counts[status]

                return (
                  <Link
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition',
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950'
                    )}
                    href={href}
                    key={status}
                  >
                    <span>{statusLabels[status]}</span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs',
                        isActive ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      {count}
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <form className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[1.3fr_0.9fr_0.7fr_auto]" method="get">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900" htmlFor="review-search">
                Search
              </label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <input
                  className="flex h-11 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                  defaultValue={filters.q ?? ''}
                  id="review-search"
                  name="q"
                  placeholder="Search by teacher, school, or submission ID"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900" htmlFor="review-layer">
                Layer
              </label>
              <select
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                defaultValue={filters.layer ? String(filters.layer) : 'all'}
                id="review-layer"
                name="layer"
              >
                <option value="all">All layers</option>
                {workspace.availableLayers.map((layer) => (
                  <option key={layer} value={layer}>
                    Layer {layer}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900" htmlFor="review-status-filter">
                Status
              </label>
              <select
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                defaultValue={filters.status ?? ''}
                id="review-status-filter"
                name="status"
              >
                <option value="">All statuses</option>
                <option value="draft">Draft</option>
                <option value="submitted">Submitted</option>
                <option value="in_review">Under review</option>
                <option value="reviewed">Awaiting decision</option>
                <option value="advanced">Advanced</option>
                <option value="eliminated">Eliminated</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button className={cn(buttonVariants({ size: 'sm' }))} type="submit">
                Apply filters
              </button>
              <Link
                className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
                href={`/admin/events/${workspace.event.id}/reviews`}
              >
                Reset
              </Link>
            </div>
          </form>

          <form action={bulkAction} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 lg:grid-cols-[1.2fr_auto]" id={bulkFormId}>
            <div className="grid gap-4 md:grid-cols-[1fr_auto]">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900" htmlFor="bulk-reviewer">
                  Bulk reviewer assignment
                </label>
                <select
                  className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                  defaultValue=""
                  id="bulk-reviewer"
                  name="reviewer_id"
                >
                  <option value="">Select reviewer for selected submissions</option>
                  {activeReviewers.map((item) => (
                    <option key={item.reviewer.id} value={item.reviewer.id}>
                      {item.reviewer.name} ({item.pendingAssignments} open)
                    </option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <input className="size-4" name="is_override" type="checkbox" />
                <span>Override assignment</span>
              </label>
            </div>

            <div className="flex flex-wrap items-end gap-2">
              <button className={cn(buttonVariants({ size: 'sm' }))} name="intent" type="submit" value="assign">
                Assign selected
              </button>
              <button
                className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
                name="intent"
                type="submit"
                value="advance"
              >
                Advance selected
              </button>
              <button
                className={cn(buttonVariants({ size: 'sm', variant: 'destructive' }))}
                name="intent"
                type="submit"
                value="eliminate"
              >
                Eliminate selected
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {workspace.submissions.length ? (
          <>
            {workspace.submissions.map((item) => (
              <SubmissionReviewCard
                attachments={item.attachments}
                assignmentHistory={item.assignmentHistory.map((entry) => ({
                  id: entry.assignment.id,
                  layer: entry.assignment.layer,
                  reviewerName: entry.reviewer?.name || 'Unknown reviewer',
                  status: entry.assignment.status,
                }))}
                bulkFormId={bulkFormId}
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
                displayStatus={item.displayStatus}
                eventId={workspace.event.id}
                key={item.submission.id}
                layerProgress={item.layerProgress}
                nextAssignableLayer={item.nextAssignableLayer}
                responseDetails={item.responseDetails}
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
            ))}

            <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Showing page {workspace.page} of {totalPages} for {workspace.total} submission
                {workspace.total === 1 ? '' : 's'}.
              </p>
              <div className="flex items-center gap-2">
                {workspace.page > 1 ? (
                  <Link
                    className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
                    href={buildWorkspaceHref(workspace.event.id, {
                      ...filters,
                      page: workspace.page - 1,
                    })}
                  >
                    Previous
                  </Link>
                ) : null}
                {workspace.page < totalPages ? (
                  <Link
                    className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
                    href={buildWorkspaceHref(workspace.event.id, {
                      ...filters,
                      page: workspace.page + 1,
                    })}
                  >
                    Next
                  </Link>
                ) : null}
              </div>
            </div>
          </>
        ) : (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>No submissions match these filters</CardTitle>
              <CardDescription>
                Adjust the search or filters, or wait for more teacher responses to arrive for this event.
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
