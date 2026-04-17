import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, Search } from 'lucide-react'
import { auth } from '@/lib/auth/auth'
import { PageHeader } from '@/components/layout/PageHeader'
import { listAssignmentsForReviewer, requireReviewerContext } from '@/lib/reviews/service'
import { reviewerAssignmentsQuerySchema } from '@/lib/validations/reviews'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const statusLabels = {
  all: 'All',
  pending: 'Pending',
  in_progress: 'In progress',
  completed: 'Completed',
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
    limit: 10,
    q: Array.isArray(rawSearchParams?.q) ? rawSearchParams.q[0] : rawSearchParams?.q,
    status: Array.isArray(rawSearchParams?.status) ? rawSearchParams.status[0] : rawSearchParams?.status,
    layer: Array.isArray(rawSearchParams?.layer) ? rawSearchParams.layer[0] : rawSearchParams?.layer,
    event_id: Array.isArray(rawSearchParams?.event_id)
      ? rawSearchParams?.event_id[0]
      : rawSearchParams?.event_id,
  }
  const parsed = reviewerAssignmentsQuerySchema.safeParse(candidate)

  if (!parsed.success) {
    return {
      event_id: undefined,
      layer: undefined,
      limit: 10,
      page: 1,
      q: undefined,
      status: undefined,
    }
  }

  return parsed.data
}

function buildReviewerHref(
  filters: {
    event_id?: string
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

  if (filters.event_id) {
    params.set('event_id', filters.event_id)
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

  return query ? `/reviewer?${query}` : '/reviewer'
}

export default async function ReviewerPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'reviewer') {
    redirect('/admin')
  }

  const filters = parseSearchParams(await searchParams)
  const context = await requireReviewerContext()
  const assignmentResult = await listAssignmentsForReviewer(context, filters)
  const totalPages = Math.max(1, Math.ceil(assignmentResult.total / assignmentResult.limit))
  const selectedStatus = filters.status ?? 'all'

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <PageHeader
        description="Review only the submissions assigned to you, then score them layer by layer with full continuity from your previous reviews."
        eyebrow="Reviewer Dashboard"
        title={`Welcome back, ${session.user.name ?? 'Reviewer'}.`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-white/80 bg-white/95">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Open assignments</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">
              {assignmentResult.counts.pending + assignmentResult.counts.in_progress}
            </p>
          </CardContent>
        </Card>
        <Card className="border-white/80 bg-white/95">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Completed reviews</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{assignmentResult.counts.completed}</p>
          </CardContent>
        </Card>
        <Card className="border-white/80 bg-white/95">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">All assignments</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{assignmentResult.counts.all}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-white/80 bg-white/95 lg:col-span-2">
          <CardHeader>
            <CardTitle>Assignment queue</CardTitle>
            <CardDescription>
              Open an assignment to inspect the submission, review your prior-layer notes, and submit a score.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <form className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 lg:grid-cols-[1.15fr_1fr_0.75fr_0.75fr_auto]" method="get">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900" htmlFor="reviewer-search">
                  Search
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    className="flex h-11 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                    defaultValue={filters.q ?? ''}
                    id="reviewer-search"
                    name="q"
                    placeholder="Search event, teacher, or assignment"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900" htmlFor="reviewer-event-filter">
                  Event
                </label>
                <select
                  className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                  defaultValue={filters.event_id ?? ''}
                  id="reviewer-event-filter"
                  name="event_id"
                >
                  <option value="">All events</option>
                  {assignmentResult.availableEvents.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900" htmlFor="reviewer-layer-filter">
                  Layer
                </label>
                <select
                  className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                  defaultValue={filters.layer ? String(filters.layer) : ''}
                  id="reviewer-layer-filter"
                  name="layer"
                >
                  <option value="">All layers</option>
                  {assignmentResult.availableLayers.map((layer) => (
                    <option key={layer} value={layer}>
                      Layer {layer}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-900" htmlFor="reviewer-status-filter">
                  Status
                </label>
                <select
                  className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                  defaultValue={filters.status ?? ''}
                  id="reviewer-status-filter"
                  name="status"
                >
                  <option value="">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="flex items-end gap-2">
                <button className={cn(buttonVariants({ size: 'sm' }))} type="submit">
                  Apply
                </button>
                <Link className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))} href="/reviewer">
                  Reset
                </Link>
              </div>
            </form>

            <div className="flex flex-wrap gap-2">
              {(Object.keys(statusLabels) as Array<keyof typeof statusLabels>).map((status) => {
                const isActive = selectedStatus === status

                return (
                  <Link
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition',
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950'
                    )}
                    href={buildReviewerHref({
                      ...filters,
                      page: 1,
                      status: status === 'all' ? undefined : status,
                    })}
                    key={status}
                  >
                    <span>{statusLabels[status]}</span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs',
                        isActive ? 'bg-white/15 text-white' : 'bg-slate-100 text-slate-600'
                      )}
                    >
                      {status === 'all' ? assignmentResult.counts.all : assignmentResult.counts[status]}
                    </span>
                  </Link>
                )
              })}
            </div>

            {assignmentResult.assignments.length ? (
              assignmentResult.assignments.map((item) => (
                <div
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  key={item.assignment.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {item.event?.title || 'Untitled event'}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Layer {item.assignment.layer} ·{' '}
                        {(item.teacher?.name || item.teacher?.email || 'Unknown teacher').trim()}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Submitted {formatDateTime(item.submission?.submitted_at || null)}
                      </p>
                    </div>

                    <span
                      className={
                        item.displayStatus === 'completed'
                          ? 'inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700'
                          : item.displayStatus === 'in_progress'
                            ? 'inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700'
                          : 'inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700'
                      }
                    >
                      {item.displayStatus.replaceAll('_', ' ')}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-slate-600">
                      {item.review
                        ? 'Review submitted and saved.'
                        : 'Ready for scoring and reviewer notes.'}
                    </p>
                    <Link
                      className={cn(buttonVariants({ size: 'sm' }))}
                      href={`/reviewer/assignments/${item.assignment.id}`}
                    >
                      {item.review ? 'View review' : 'Open assignment'}
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                No assignments match the current filters yet.
              </div>
            )}

            <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
              <p>
                Showing page {assignmentResult.page} of {totalPages} for {assignmentResult.total} assignment
                {assignmentResult.total === 1 ? '' : 's'}.
              </p>
              <div className="flex items-center gap-2">
                {assignmentResult.page > 1 ? (
                  <Link
                    className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
                    href={buildReviewerHref({
                      ...filters,
                      page: assignmentResult.page - 1,
                    })}
                  >
                    Previous
                  </Link>
                ) : null}
                {assignmentResult.page < totalPages ? (
                  <Link
                    className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
                    href={buildReviewerHref({
                      ...filters,
                      page: assignmentResult.page + 1,
                    })}
                  >
                    Next
                  </Link>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/10 bg-primary/5">
          <CardHeader>
            <CardTitle>Review flow</CardTitle>
            <CardDescription>Each assignment belongs to a single event and a single review layer.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-7 text-slate-700">
              Submit one score or grade per assignment. If you receive the same submission again in a later layer, your earlier reviews stay visible as read-only continuity notes.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
