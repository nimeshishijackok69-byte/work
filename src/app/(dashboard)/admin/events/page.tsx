import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CalendarClock, ChevronRight, FileStack, Layers3, Link2 } from 'lucide-react'
import { auth } from '@/lib/auth/auth'
import { PageHeader } from '@/components/layout/PageHeader'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  getEventStatusCountsForAdmin,
  listEventsForAdmin,
  requireAdminContext,
} from '@/lib/events/service'
import { cn } from '@/lib/utils'
import { eventListQuerySchema } from '@/lib/validations/events'
import { EventCreateForm } from './event-create-form'

const statusLabels = {
  all: 'All events',
  draft: 'Draft',
  published: 'Published',
  closed: 'Closed',
} as const

type StatusKey = keyof typeof statusLabels

function formatDate(value: string | null) {
  if (!value) {
    return 'No deadline'
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getStatusClasses(status: string) {
  switch (status) {
    case 'published':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'closed':
      return 'border-slate-300 bg-slate-100 text-slate-700'
    default:
      return 'border-amber-200 bg-amber-50 text-amber-700'
  }
}

function formatTeacherFields(value: unknown) {
  if (!Array.isArray(value)) {
    return 'Not configured'
  }

  return value
    .filter((field): field is string => typeof field === 'string')
    .map((field) => field.replaceAll('_', ' '))
    .join(', ')
}

function parseSearchParams(rawSearchParams?: Record<string, string | string[] | undefined>) {
  const candidate = {
    page: Array.isArray(rawSearchParams?.page) ? rawSearchParams.page[0] : rawSearchParams?.page,
    limit: 12,
    status: Array.isArray(rawSearchParams?.status)
      ? rawSearchParams.status[0]
      : rawSearchParams?.status,
  }

  const parsed = eventListQuerySchema.safeParse(candidate)

  if (!parsed.success) {
    return {
      page: 1,
      limit: 12,
      status: undefined,
    }
  }

  return parsed.data
}

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'admin') {
    redirect('/reviewer')
  }

  const context = await requireAdminContext()
  const filters = parseSearchParams(await searchParams)
  const [eventsResult, counts] = await Promise.all([
    listEventsForAdmin(context, filters),
    getEventStatusCountsForAdmin(context),
  ])
  const selectedStatus = (filters.status ?? 'all') as StatusKey
  const totalPages = Math.max(1, Math.ceil(eventsResult.total / eventsResult.limit))

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <PageHeader
        actions={
          <a className={cn(buttonVariants({ size: 'lg' }))} href="#create-event">
            Create event
          </a>
        }
        breadcrumbs={[
          { href: '/admin', label: 'Dashboard' },
          { label: 'Events' },
        ]}
        description="Event CRUD is now live for the metadata layer. Create draft events, review their share links, and prepare the form builder workspace."
        eyebrow="Admin"
        title="Events workspace"
      />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_1.45fr]">
        <div id="create-event">
          <EventCreateForm />
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-950 text-slate-50 shadow-xl shadow-slate-950/15">
            <CardHeader>
              <CardTitle className="text-slate-50">What Session 2.1 unlocked</CardTitle>
              <CardDescription className="text-slate-300">
                We now have real event records, status tracking, audit logging, and share-link generation.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">Draft lifecycle</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Every new event starts in draft so the builder can evolve safely.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">Stable metadata</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Review depth, scoring model, deadlines, and teacher fields are stored now.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">Next build target</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  The form builder can plug into these draft events next without reworking event setup.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/80 bg-white/95">
            <CardHeader className="gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <CardTitle>Event inventory</CardTitle>
                  <CardDescription>
                    Browse the events you own and track which ones are still in setup.
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(statusLabels) as StatusKey[]).map((status) => {
                    const isActive = selectedStatus === status
                    const href = status === 'all' ? '/admin/events' : `/admin/events?status=${status}`
                    const count = status === 'all' ? counts.all : counts[status]

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
            <CardContent className="space-y-4">
              {eventsResult.data.length ? (
                <>
                  {eventsResult.data.map((event) => (
                    <div
                      className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-5"
                      key={event.id}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={cn(
                                'rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em]',
                                getStatusClasses(event.status)
                              )}
                            >
                              {event.status}
                            </span>
                            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                              {event.scoring_type === 'numeric' ? 'Numeric scoring' : 'Grade scoring'}
                            </span>
                          </div>

                          <div>
                            <h2 className="text-xl font-semibold text-slate-950">{event.title}</h2>
                            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                              {event.description ||
                                'No description added yet. This draft is ready for builder setup.'}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
                          <p className="font-medium text-slate-900">Share slug reserved</p>
                          <p className="mt-1 inline-flex items-center gap-2">
                            <Link2 className="size-4 text-slate-400" />
                            <code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
                              {event.share_slug}
                            </code>
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 md:grid-cols-3">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                            <Layers3 className="size-4 text-slate-400" />
                            Review layers
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {event.review_layers} stage{event.review_layers === 1 ? '' : 's'} configured
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                            <CalendarClock className="size-4 text-slate-400" />
                            Deadline
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {formatDate(event.expiration_date)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                            <FileStack className="size-4 text-slate-400" />
                            Teacher fields
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {formatTeacherFields(event.teacher_fields)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                    <p>
                      Showing page {eventsResult.page} of {totalPages} for {eventsResult.total} event
                      {eventsResult.total === 1 ? '' : 's'}.
                    </p>
                    <div className="flex items-center gap-2">
                      {eventsResult.page > 1 ? (
                        <Link
                          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                          href={
                            selectedStatus === 'all'
                              ? `/admin/events?page=${eventsResult.page - 1}`
                              : `/admin/events?status=${selectedStatus}&page=${eventsResult.page - 1}`
                          }
                        >
                          Previous
                        </Link>
                      ) : null}
                      {eventsResult.page < totalPages ? (
                        <Link
                          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }))}
                          href={
                            selectedStatus === 'all'
                              ? `/admin/events?page=${eventsResult.page + 1}`
                              : `/admin/events?status=${selectedStatus}&page=${eventsResult.page + 1}`
                          }
                        >
                          Next
                          <ChevronRight className="size-4" />
                        </Link>
                      ) : null}
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <p className="text-base font-semibold text-slate-900">
                    No {selectedStatus === 'all' ? '' : selectedStatus + ' '}events yet
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Create the first draft event to lock in metadata, generate its share slug, and prepare for the builder.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
