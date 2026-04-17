import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight, BarChart3, CalendarRange, Link2 } from 'lucide-react'
import { auth } from '@/lib/auth/auth'
import { PageHeader } from '@/components/layout/PageHeader'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  getEventStatusCountsForAdmin,
  listEventsForAdmin,
  requireAdminContext,
} from '@/lib/events/service'

function formatDate(value: string | null) {
  if (!value) return 'No deadline'

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
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

export default async function AdminAnalyticsHubPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'admin') {
    redirect('/reviewer')
  }

  const context = await requireAdminContext()
  const [eventsResult, counts] = await Promise.all([
    listEventsForAdmin(context, { page: 1, limit: 50, status: undefined }),
    getEventStatusCountsForAdmin(context),
  ])

  const publishedOrClosed = eventsResult.data.filter((event) =>
    ['published', 'closed'].includes(event.status)
  )
  const draftEvents = eventsResult.data.filter((event) => event.status === 'draft')

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <PageHeader
        breadcrumbs={[
          { href: '/admin', label: 'Dashboard' },
          { label: 'Analytics' },
        ]}
        description="Pick an event to see per-event submission metrics, reviewer workload, and layer scoring."
        eyebrow="Admin"
        title="Analytics hub"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-white/80 bg-white/95">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Total events</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{counts.all}</p>
          </CardContent>
        </Card>
        <Card className="border-white/80 bg-white/95">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Published</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{counts.published}</p>
          </CardContent>
        </Card>
        <Card className="border-white/80 bg-white/95">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Closed</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{counts.closed}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/80 bg-white/95">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="size-5 text-slate-500" />
            Pick an event for analytics
          </CardTitle>
          <CardDescription>
            Analytics are strictly event-scoped. Choose an event to open its dedicated metrics view.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {publishedOrClosed.length ? (
            publishedOrClosed.map((event) => (
              <Link
                className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-primary/30 hover:bg-white hover:shadow-md lg:flex-row lg:items-center lg:justify-between"
                href={`/admin/events/${event.id}/analytics`}
                key={event.id}
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.16em]',
                        getStatusClasses(event.status)
                      )}
                    >
                      {event.status}
                    </span>
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                      {event.scoring_type === 'numeric' ? 'Numeric' : 'Grade'}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600">
                      <Link2 className="size-3 text-slate-400" />
                      {event.share_slug}
                    </span>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-950 group-hover:text-primary">
                      {event.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      {event.description || 'No description provided.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <CalendarRange className="size-3 text-slate-400" />
                      Deadline {formatDate(event.expiration_date)}
                    </span>
                    <span>{event.review_layers} review layer{event.review_layers === 1 ? '' : 's'}</span>
                  </div>
                </div>
                <span
                  aria-hidden
                  className={cn(buttonVariants({ size: 'sm' }), 'pointer-events-none')}
                >
                  View analytics
                  <ArrowRight className="size-4" />
                </span>
              </Link>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="text-base font-semibold text-slate-900">No events ready for analytics</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Publish a draft event to start collecting submissions and reviewer activity. Analytics
                become available immediately once data exists.
              </p>
              <Link
                className={cn(buttonVariants({ size: 'sm' }), 'mt-4 inline-flex')}
                href="/admin/events"
              >
                Manage events
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {draftEvents.length ? (
        <Card className="border-amber-200 bg-amber-50/60">
          <CardHeader>
            <CardTitle>{draftEvents.length} draft event{draftEvents.length === 1 ? '' : 's'} still unpublished</CardTitle>
            <CardDescription className="text-amber-800">
              Draft events don&apos;t collect submissions yet, so analytics will remain empty until you publish.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {draftEvents.map((event) => (
              <Link
                className="rounded-full border border-amber-200 bg-white px-3 py-1.5 text-sm font-medium text-amber-800 transition hover:border-amber-300 hover:bg-amber-100"
                href={`/admin/events/${event.id}`}
                key={event.id}
              >
                {event.title}
              </Link>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
