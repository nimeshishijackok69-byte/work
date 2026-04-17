'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import {
  Bell,
  CheckCheck,
  ClipboardCheck,
  FileStack,
  Info,
  Loader2,
  Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface NotificationItem {
  id: string
  recipient_id: string
  recipient_type: 'admin' | 'reviewer'
  title: string
  message: string
  type: 'assignment' | 'submission' | 'review_complete' | 'system'
  action_url: string | null
  is_read: boolean
  created_at: string
  metadata?: Record<string, unknown>
}

interface NotificationsResponse {
  data: NotificationItem[]
  total: number
  page: number
  limit: number
  unread_count: number
}

const fetcher = async (url: string): Promise<NotificationsResponse> => {
  const res = await fetch(url, { cache: 'no-store' })

  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`)
  }

  return (await res.json()) as NotificationsResponse
}

function formatRelative(value: string) {
  const date = new Date(value)
  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.round(diffMs / 60_000)

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`

  const diffHours = Math.round(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.round(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`

  return date.toLocaleDateString('en-IN', { dateStyle: 'medium' })
}

function iconForType(type: NotificationItem['type']) {
  switch (type) {
    case 'assignment':
      return <ClipboardCheck className="size-4" />
    case 'submission':
      return <FileStack className="size-4" />
    case 'review_complete':
      return <Star className="size-4" />
    default:
      return <Info className="size-4" />
  }
}

function accentForType(type: NotificationItem['type']) {
  switch (type) {
    case 'assignment':
      return 'bg-sky-100 text-sky-600'
    case 'submission':
      return 'bg-blue-100 text-blue-600'
    case 'review_complete':
      return 'bg-amber-100 text-amber-600'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

export function NotificationBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const { data, error, isLoading, mutate } = useSWR<NotificationsResponse>(
    '/api/notifications?limit=10',
    fetcher,
    {
      refreshInterval: 45_000,
      revalidateOnFocus: true,
    }
  )

  const unreadCount = data?.unread_count ?? 0
  const notifications = data?.data ?? []

  useEffect(() => {
    if (!open) return

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const markAsRead = useCallback(
    async (id: string) => {
      setBusyId(id)
      try {
        const res = await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })

        if (!res.ok) {
          throw new Error(`Request failed: ${res.status}`)
        }

        await mutate()
      } catch (err) {
        console.error('[NotificationBell] mark as read failed', err)
      } finally {
        setBusyId(null)
      }
    },
    [mutate]
  )

  const markAllAsRead = useCallback(async () => {
    setBulkBusy(true)
    try {
      const res = await fetch('/api/notifications/read-all', { method: 'POST' })

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`)
      }

      await mutate()
    } catch (err) {
      console.error('[NotificationBell] mark all as read failed', err)
    } finally {
      setBulkBusy(false)
    }
  }, [mutate])

  const handleItemClick = useCallback(
    async (item: NotificationItem) => {
      if (!item.is_read) {
        await markAsRead(item.id)
      }

      setOpen(false)

      if (item.action_url) {
        router.push(item.action_url)
      }
    },
    [markAsRead, router]
  )

  return (
    <div className="relative" ref={containerRef}>
      <Button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={
          unreadCount > 0
            ? `Notifications (${unreadCount} unread)`
            : 'Notifications'
        }
        className="relative"
        onClick={() => setOpen((current) => !current)}
        size="icon-sm"
        type="button"
        variant="outline"
      >
        <Bell className="size-4" />
        {unreadCount > 0 ? (
          <span
            aria-hidden
            className="absolute -right-1 -top-1 flex min-w-[1.125rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold leading-none text-white"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div
          className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-950/15"
          role="dialog"
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-950">Notifications</p>
              <p className="text-xs text-slate-500">
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : 'You are all caught up.'}
              </p>
            </div>
            <Button
              aria-label="Mark all notifications as read"
              disabled={bulkBusy || unreadCount === 0}
              onClick={markAllAsRead}
              size="xs"
              type="button"
              variant="ghost"
            >
              {bulkBusy ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <CheckCheck className="size-3" />
              )}
              Mark all read
            </Button>
          </div>

          <div className="max-h-[24rem] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-slate-500">
                <Loader2 className="size-4 animate-spin" />
                Loading notifications...
              </div>
            ) : error ? (
              <div className="px-4 py-10 text-center text-sm text-destructive">
                Unable to load notifications right now.
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  <Bell className="size-5" />
                </div>
                <p className="text-sm font-semibold text-slate-950">No notifications yet</p>
                <p className="mt-1 text-xs text-slate-500">
                  We&apos;ll let you know when something needs your attention.
                </p>
              </div>
            ) : (
              <ul>
                {notifications.map((item) => {
                  const isBusy = busyId === item.id

                  return (
                    <li className="border-b border-slate-100 last:border-b-0" key={item.id}>
                      <button
                        className={cn(
                          'flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50',
                          !item.is_read && 'bg-primary/5'
                        )}
                        onClick={() => handleItemClick(item)}
                        type="button"
                      >
                        <span
                          aria-hidden
                          className={cn(
                            'mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl',
                            accentForType(item.type)
                          )}
                        >
                          {iconForType(item.type)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span
                              className={cn(
                                'truncate text-sm',
                                item.is_read ? 'font-medium text-slate-700' : 'font-semibold text-slate-950'
                              )}
                            >
                              {item.title}
                            </span>
                            {!item.is_read ? (
                              <span aria-hidden className="size-2 shrink-0 rounded-full bg-primary" />
                            ) : null}
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-slate-600">
                            {item.message}
                          </span>
                          <span className="mt-1 block text-[11px] text-slate-400">
                            {formatRelative(item.created_at)}
                          </span>
                        </span>
                        {isBusy ? (
                          <Loader2 className="size-3 animate-spin text-slate-400" />
                        ) : null}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-slate-200 bg-slate-50 px-4 py-2 text-right">
            <Link
              className="text-xs font-semibold text-primary hover:underline"
              href="/notifications"
              onClick={() => setOpen(false)}
            >
              View all notifications
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  )
}
