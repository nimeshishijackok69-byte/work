import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Bell,
  CheckCheck,
  ClipboardCheck,
  FileStack,
  Info,
  Star,
} from 'lucide-react'
import { auth } from '@/lib/auth/auth'
import { PageHeader } from '@/components/layout/PageHeader'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  listNotificationsForRecipient,
  requireNotificationRecipient,
} from '@/lib/notifications/service'
import { notificationListQuerySchema } from '@/lib/validations/notifications'
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from './actions'

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function IconForType({ type }: { type: string }) {
  if (type === 'assignment') return <ClipboardCheck className="size-5" />
  if (type === 'submission') return <FileStack className="size-5" />
  if (type === 'review_complete') return <Star className="size-5" />
  return <Info className="size-5" />
}

function accentForType(type: string) {
  if (type === 'assignment') return 'bg-sky-100 text-sky-600'
  if (type === 'submission') return 'bg-blue-100 text-blue-600'
  if (type === 'review_complete') return 'bg-amber-100 text-amber-600'
  return 'bg-slate-100 text-slate-600'
}

function parseSearchParams(raw?: Record<string, string | string[] | undefined>) {
  const candidate = {
    page: Array.isArray(raw?.page) ? raw?.page[0] : raw?.page,
    limit: 20,
    is_read: Array.isArray(raw?.is_read) ? raw?.is_read[0] : raw?.is_read,
  }

  const parsed = notificationListQuerySchema.safeParse(candidate)

  if (!parsed.success) {
    return { page: 1, limit: 20, is_read: undefined as boolean | undefined }
  }

  return parsed.data
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const filters = parseSearchParams(await searchParams)
  const context = await requireNotificationRecipient()
  const result = await listNotificationsForRecipient(context, filters)
  const totalPages = Math.max(1, Math.ceil(result.total / result.limit))

  const filterHref = (next: { page?: number; is_read?: boolean | undefined }) => {
    const params = new URLSearchParams()
    if (next.is_read === true) params.set('is_read', 'true')
    if (next.is_read === false) params.set('is_read', 'false')
    if (next.page && next.page > 1) params.set('page', String(next.page))

    const query = params.toString()
    return query ? `/notifications?${query}` : '/notifications'
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader
        actions={
          <form action={markAllNotificationsReadAction}>
            <button
              className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
              disabled={result.unreadCount === 0}
              type="submit"
            >
              <CheckCheck className="size-4" />
              Mark all read
            </button>
          </form>
        }
        breadcrumbs={[
          { href: session.user.role === 'admin' ? '/admin' : '/reviewer', label: 'Dashboard' },
          { label: 'Notifications' },
        ]}
        description="Everything we&apos;ve flagged for your account, from new assignments to completed review layers."
        eyebrow="Inbox"
        title="Notifications"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-white/80 bg-white/95">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Unread</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{result.unreadCount}</p>
          </CardContent>
        </Card>
        <Card className="border-white/80 bg-white/95">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Total on this page</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{result.data.length}</p>
          </CardContent>
        </Card>
        <Card className="border-white/80 bg-white/95">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Lifetime total</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{result.total}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/80 bg-white/95">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <CardTitle>All notifications</CardTitle>
              <CardDescription>
                Click an item to open the related workspace. Read items stay in your history.
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'All', value: undefined },
                { label: 'Unread', value: false },
                { label: 'Read', value: true },
              ].map((option) => {
                const isActive = filters.is_read === option.value

                return (
                  <Link
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition',
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-950'
                    )}
                    href={filterHref({ is_read: option.value })}
                    key={option.label}
                  >
                    {option.label}
                  </Link>
                )
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {result.data.length ? (
            <ul className="divide-y divide-slate-100">
              {result.data.map((item) => (
                <li className="py-3" key={item.id}>
                  <div
                    className={cn(
                      'flex items-start gap-4 rounded-2xl p-3 transition',
                      !item.is_read && 'bg-primary/5'
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-xl',
                        accentForType(item.type)
                      )}
                    >
                      <IconForType type={item.type} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className={cn(
                            'text-sm',
                            item.is_read ? 'font-medium text-slate-700' : 'font-semibold text-slate-950'
                          )}
                        >
                          {item.title}
                        </p>
                        {!item.is_read ? (
                          <span
                            aria-label="unread"
                            className="inline-flex size-2 rounded-full bg-primary"
                          />
                        ) : null}
                        <span className="text-xs text-slate-400">{formatDateTime(item.created_at)}</span>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{item.message}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {item.action_url ? (
                          <Link
                            className={cn(buttonVariants({ size: 'xs' }))}
                            href={item.action_url}
                          >
                            Open
                          </Link>
                        ) : null}
                        {!item.is_read ? (
                          <form action={markNotificationReadAction}>
                            <input name="id" type="hidden" value={item.id} />
                            <button
                              className={cn(buttonVariants({ size: 'xs', variant: 'outline' }))}
                              type="submit"
                            >
                              Mark read
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-white text-slate-500">
                <Bell className="size-5" />
              </div>
              <p className="text-base font-semibold text-slate-950">No notifications match this filter</p>
              <p className="text-sm text-slate-500">
                Adjust the filter above or wait for new activity on your events and assignments.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Showing page {result.page} of {totalPages} · {result.total} notification
              {result.total === 1 ? '' : 's'}
            </p>
            <div className="flex items-center gap-2">
              {result.page > 1 ? (
                <Link
                  className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
                  href={filterHref({ is_read: filters.is_read, page: result.page - 1 })}
                >
                  Previous
                </Link>
              ) : null}
              {result.page < totalPages ? (
                <Link
                  className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
                  href={filterHref({ is_read: filters.is_read, page: result.page + 1 })}
                >
                  Next
                </Link>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
