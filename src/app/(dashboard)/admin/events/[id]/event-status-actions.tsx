'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  Globe,
  LoaderCircle,
  Lock,
  Trash2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  publishEventAction,
  closeEventAction,
  deleteEventAction,
  type EventActionState,
} from './actions'

interface EventStatusActionsProps {
  eventId: string
  eventTitle: string
  expirationDate: string | null
  status: string
  formFieldCount: number
  shareUrl: string
}

function formatDate(value: string | null) {
  if (!value) {
    return 'No deadline'
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function EventStatusActions({
  eventId,
  eventTitle,
  expirationDate,
  status,
  formFieldCount,
  shareUrl,
}: EventStatusActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<EventActionState | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showPublishConfirm, setShowPublishConfirm] = useState(false)

  async function handlePublish() {
    startTransition(async () => {
      const res = await publishEventAction(eventId)
      setResult(res)
      setShowPublishConfirm(false)

      if (res.success) {
        router.refresh()
      }
    })
  }

  async function handleClose() {
    startTransition(async () => {
      const res = await closeEventAction(eventId)
      setResult(res)

      if (res.success) {
        router.refresh()
      }
    })
  }

  async function handleDelete() {
    startTransition(async () => {
      const res = await deleteEventAction(eventId)

      if (res?.message) {
        setResult(res)
        setShowDeleteConfirm(false)
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Status transition card */}
      <Card className="border-white/80 bg-white/95">
        <CardHeader className="space-y-2">
          <CardTitle className="flex items-center gap-2">
            {status === 'draft' && <Globe className="size-5 text-amber-500" />}
            {status === 'published' && <Lock className="size-5 text-emerald-500" />}
            {status === 'closed' && <Lock className="size-5 text-slate-400" />}
            Event lifecycle
          </CardTitle>
          <CardDescription>
            {status === 'draft' &&
              'This event is in draft mode. Publish it when the form is ready to start accepting submissions.'}
            {status === 'published' &&
              'This event is live. Teachers can submit responses via the share link. Close it to stop accepting new submissions.'}
            {status === 'closed' &&
              'This event is closed. No new submissions are accepted. Existing data is preserved.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status flow visualization */}
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                status === 'draft'
                  ? 'border border-amber-200 bg-amber-100 text-amber-700'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              Draft
            </div>
            <div className="h-px flex-1 bg-slate-300" />
            <div
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                status === 'published'
                  ? 'border border-emerald-200 bg-emerald-100 text-emerald-700'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              Published
            </div>
            <div className="h-px flex-1 bg-slate-300" />
            <div
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                status === 'closed'
                  ? 'border border-slate-300 bg-slate-200 text-slate-700'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              Closed
            </div>
          </div>

          {/* Action buttons */}
          {status === 'draft' && (
            <div className="space-y-3">
              <Button
                className="h-11 w-full text-sm font-semibold"
                disabled={isPending || formFieldCount === 0}
                onClick={() => setShowPublishConfirm(true)}
              >
                {isPending ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" />
                    Publishing…
                  </>
                ) : (
                  <>
                    <Globe className="size-4" />
                    Publish event
                  </>
                )}
              </Button>
              {formFieldCount === 0 && (
                <p className="text-center text-sm text-amber-600">
                  Add at least one form field in the builder before publishing.
                </p>
              )}
            </div>
          )}

          {status === 'published' && (
            <Button
              className="h-11 w-full text-sm font-semibold"
              disabled={isPending}
              onClick={handleClose}
              variant="outline"
            >
              {isPending ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" />
                  Closing…
                </>
              ) : (
                <>
                  <Lock className="size-4" />
                  Close event
                </>
              )}
            </Button>
          )}

          {/* Feedback messages */}
          {result?.message && (
            <div
              className={
                result.success
                  ? 'rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700'
                  : 'rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive'
              }
            >
              {result.message}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger zone */}
      {status === 'draft' && (
        <Card className="border-destructive/20 bg-white/95">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-5" />
              Danger zone
            </CardTitle>
            <CardDescription>
              Permanently delete this draft event. This cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {showDeleteConfirm ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-destructive">
                  Are you sure? This will permanently delete the event and all its data.
                </p>
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    disabled={isPending}
                    onClick={handleDelete}
                    variant="destructive"
                  >
                    {isPending ? (
                      <>
                        <LoaderCircle className="size-4 animate-spin" />
                        Deleting…
                      </>
                    ) : (
                      <>
                        <Trash2 className="size-4" />
                        Yes, delete
                      </>
                    )}
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={isPending}
                    onClick={() => setShowDeleteConfirm(false)}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                className="h-11 w-full text-sm font-semibold"
                onClick={() => setShowDeleteConfirm(true)}
                variant="outline"
              >
                <Trash2 className="size-4" />
                Delete this event
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {showPublishConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4">
          <div className="absolute inset-0" onClick={() => setShowPublishConfirm(false)} />
          <Card className="relative w-full max-w-2xl border-white/10 bg-white shadow-2xl">
            <CardHeader className="gap-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle>Publish this event?</CardTitle>
                  <CardDescription>
                    Publishing will make the teacher form live and lock the draft builder/settings.
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setShowPublishConfirm(false)}
                  size="icon-sm"
                  type="button"
                  variant="outline"
                >
                  <X className="size-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-950">{eventTitle}</p>
                <div className="mt-3 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
                  <div>
                    <span className="font-medium text-slate-900">Form items:</span> {formFieldCount}
                  </div>
                  <div>
                    <span className="font-medium text-slate-900">Deadline:</span> {formatDate(expirationDate)}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-sm font-medium text-emerald-900">Share link that will go live</p>
                <code className="mt-2 block rounded-xl border border-emerald-200 bg-white px-3 py-2 text-xs text-slate-700">
                  {shareUrl}
                </code>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  className="flex-1"
                  disabled={isPending}
                  onClick={() => setShowPublishConfirm(false)}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button className="flex-1" disabled={isPending} onClick={handlePublish} type="button">
                  {isPending ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Globe className="size-4" />
                      Confirm publish
                    </>
                  )}
                </Button>
              </div>

              <p className="text-sm leading-6 text-slate-500">
                Once published, this share URL becomes the live teacher submission link.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
