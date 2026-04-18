import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
  BarChart3,
  CalendarClock,
  ClipboardCopy,
  ExternalLink,
  FileStack,
  Layers3,
  Link2,
  Pencil,
  Star,
} from 'lucide-react'
import { auth } from '@/lib/auth/auth'
import {
  getEventForAdmin,
  getSubmissionCountForEvent,
  requireAdminContext,
} from '@/lib/events/service'
import { normalizeFormSchema } from '@/lib/forms/schema'
import { cn, getBaseUrl } from '@/lib/utils'
import { normalizeGradeConfig } from '@/lib/validations/events'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/PageHeader'
import { EventEditForm } from './event-edit-form'
import { EventStatusActions } from './event-status-actions'
import { ShareLinkCopy } from './share-link-copy'

function formatDate(value: string | null) {
  if (!value) return 'No deadline'

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatRelativeDate(value: string) {
  const d = new Date(value)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`

  const diffHours = Math.floor(diffMins / 60)

  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.floor(diffHours / 24)

  if (diffDays < 7) return `${diffDays}d ago`

  return formatDate(value)
}

function formatTeacherFields(value: unknown) {
  if (!Array.isArray(value)) return 'Not configured'

  return value
    .filter((field): field is string => typeof field === 'string')
    .map((field) => field.replaceAll('_', ' '))
    .join(', ')
}

function formatGradeBands(value: unknown) {
  return normalizeGradeConfig(value)
    .map((grade) => `${grade.label} (${grade.min}-${grade.max})`)
    .join(' • ')
}

export default async function EventDetailPage({
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
  const event = await getEventForAdmin(context, id)

  if (!event) {
    notFound()
  }

  const formSchema = normalizeFormSchema(event.form_schema)
  const fieldCount = formSchema.fields.length
  const submissionCount = await getSubmissionCountForEvent(context, id)
  const isDraft = event.status === 'draft'
  const isPublished = event.status === 'published'
  const shareUrl = `${getBaseUrl()}/form/${event.share_slug}`

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <PageHeader
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Link
              className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
              href={`/admin/events/${event.id}/builder`}
            >
              <Pencil className="size-4" />
              {isDraft ? 'Open builder' : 'View form'}
            </Link>
            <Link
              className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
              href={`/admin/events/${event.id}/reviews`}
            >
              <Layers3 className="size-4" />
              Review workspace
            </Link>
            <Link
              className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
              href={`/admin/events/${event.id}/analytics`}
            >
              <BarChart3 className="size-4" />
              Analytics
            </Link>
            <Link
              className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
              href="/admin/events"
            >
              ← Back to events
            </Link>
          </div>
        }
        breadcrumbs={[
          { href: '/admin', label: 'Dashboard' },
          { href: '/admin/events', label: 'Events' },
          { label: event.title },
        ]}
        description={event.description || 'No description added yet.'}
        eyebrow="Event detail"
        title={event.title}
      />

      {/* Status + stats bar */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-white/80 bg-white/95">
          <CardContent className="flex items-center gap-4 p-5">
            <div
              className={cn(
                'flex size-12 items-center justify-center rounded-2xl',
                event.status === 'draft' && 'bg-amber-100',
                event.status === 'published' && 'bg-emerald-100',
                event.status === 'closed' && 'bg-slate-100'
              )}
            >
              {event.status === 'draft' && <Pencil className="size-5 text-amber-600" />}
              {event.status === 'published' && <Star className="size-5 text-emerald-600" />}
              {event.status === 'closed' && <Star className="size-5 text-slate-500" />}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Status</p>
              <p
                className={cn(
                  'mt-0.5 text-lg font-semibold capitalize',
                  event.status === 'draft' && 'text-amber-700',
                  event.status === 'published' && 'text-emerald-700',
                  event.status === 'closed' && 'text-slate-700'
                )}
              >
                {event.status}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/80 bg-white/95">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-100">
              <FileStack className="size-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Form fields</p>
              <p className="mt-0.5 text-lg font-semibold text-slate-900">
                {fieldCount} {fieldCount === 1 ? 'field' : 'fields'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/80 bg-white/95">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-violet-100">
              <Layers3 className="size-5 text-violet-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Review layers</p>
              <p className="mt-0.5 text-lg font-semibold text-slate-900">
                {event.review_layers} {event.review_layers === 1 ? 'stage' : 'stages'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/80 bg-white/95">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-100">
              <ClipboardCopy className="size-5 text-rose-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Submissions</p>
              <p className="mt-0.5 text-lg font-semibold text-slate-900">{submissionCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Share link banner (always visible) */}
      <Card
        className={cn(
          'shadow-lg',
          isPublished
            ? 'border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50'
            : 'border-slate-200 bg-white/95'
        )}
      >
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Link2 className="size-4 text-slate-400" />
              {isPublished ? 'Live share link' : 'Share link (reserved)'}
            </p>
            <p className="text-sm text-slate-600">
              {isPublished
                ? 'Teachers can submit responses using this link.'
                : 'This link will become active once the event is published.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <code className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
              {shareUrl}
            </code>
            <ShareLinkCopy url={shareUrl} />
            {isPublished && (
              <Link
                className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
                href={`/form/${event.share_slug}`}
                target="_blank"
              >
                <ExternalLink className="size-4" />
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main content grid */}
      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        {/* Left column: details + edit form */}
        <div className="space-y-6">
          {/* Event configuration summary */}
          <Card className="border-white/80 bg-white/95">
            <CardHeader>
              <CardTitle>Event configuration</CardTitle>
              <CardDescription>
                Current metadata and settings for this event.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                    <Layers3 className="size-4 text-slate-400" />
                    Review layers
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {event.review_layers} stage{event.review_layers === 1 ? '' : 's'} configured
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                    <Star className="size-4 text-slate-400" />
                    Scoring type
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {event.scoring_type === 'numeric'
                      ? `Numeric (max ${event.max_score})`
                      : 'Letter grade'}
                  </p>
                  {event.scoring_type === 'grade' ? (
                    <p className="mt-2 text-xs leading-5 text-slate-500">
                      {formatGradeBands(event.grade_config)}
                    </p>
                  ) : null}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                    <CalendarClock className="size-4 text-slate-400" />
                    Deadline
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {formatDate(event.expiration_date)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="inline-flex items-center gap-2 text-sm font-medium text-slate-900">
                    <FileStack className="size-4 text-slate-400" />
                    Teacher fields
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {formatTeacherFields(event.teacher_fields)}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-900">Timeline</p>
                <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-600">
                  <span>Created {formatRelativeDate(event.created_at)}</span>
                  <span>Updated {formatRelativeDate(event.updated_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edit form (draft only) */}
          {isDraft && <EventEditForm event={event} />}
        </div>

        {/* Right column: status actions */}
        <div className="space-y-6">
          <EventStatusActions
            eventId={event.id}
            eventTitle={event.title}
            expirationDate={event.expiration_date}
            formFieldCount={fieldCount}
            shareUrl={shareUrl}
            status={event.status}
          />
        </div>
      </div>
    </div>
  )
}
