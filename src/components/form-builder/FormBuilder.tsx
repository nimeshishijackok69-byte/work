'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { Clock3, Link2, Save, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type FormSchema } from '@/lib/forms/schema'
import { cn } from '@/lib/utils'
import { getSelectedField, useFormBuilderStore } from '@/stores/useFormBuilderStore'
import { FieldCanvas } from './FieldCanvas'
import { FieldConfigPanel } from './FieldConfigPanel'
import { FieldPalette } from './FieldPalette'

function formatDateTime(value: string | null) {
  if (!value) {
    return 'Not saved yet'
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function FormBuilder({
  eventId,
  eventStatus,
  eventTitle,
  expirationDate,
  initialSchema,
  reviewLayers,
  scoringType,
  shareSlug,
  updatedAt,
}: {
  eventId: string
  eventStatus: string
  eventTitle: string
  expirationDate: string | null
  initialSchema: FormSchema
  reviewLayers: number
  scoringType: string
  shareSlug: string
  updatedAt: string
}) {
  const [feedback, setFeedback] = useState<{
    message: string
    tone: 'error' | 'success'
  } | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState(updatedAt)
  const [isPending, startTransition] = useTransition()
  const fields = useFormBuilderStore((state) => state.fields)
  const selectedFieldId = useFormBuilderStore((state) => state.selectedFieldId)
  const isDirty = useFormBuilderStore((state) => state.isDirty)
  const initialize = useFormBuilderStore((state) => state.initialize)
  const addField = useFormBuilderStore((state) => state.addField)
  const duplicateField = useFormBuilderStore((state) => state.duplicateField)
  const removeField = useFormBuilderStore((state) => state.removeField)
  const reorderFields = useFormBuilderStore((state) => state.reorderFields)
  const selectField = useFormBuilderStore((state) => state.selectField)
  const updateField = useFormBuilderStore((state) => state.updateField)
  const isReadOnly = eventStatus !== 'draft'
  const selectedField = useMemo(
    () => getSelectedField(fields, selectedFieldId),
    [fields, selectedFieldId]
  )

  useEffect(() => {
    initialize(eventId, initialSchema.fields)
  }, [eventId, initialSchema.fields, initialize, updatedAt])

  const handleSave = () => {
    startTransition(() => {
      void (async () => {
        setFeedback(null)

        const response = await fetch(`/api/events/${eventId}/form-schema`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fields,
          }),
        })

        const payload = (await response.json().catch(() => ({}))) as {
          details?: Record<string, string[]>
          error?: string
          event?: {
            updated_at: string
          }
          message?: string
        }

        if (!response.ok) {
          const detailSummary = payload.details
            ? Object.values(payload.details)
                .flat()
                .join(' ')
            : null

          setFeedback({
            tone: 'error',
            message: detailSummary || payload.error || 'Unable to save the draft schema right now.',
          })
          return
        }

        useFormBuilderStore.setState((state) => ({
          ...state,
          fields: state.fields,
          isDirty: false,
        }))

        setLastSavedAt(payload.event?.updated_at ?? new Date().toISOString())
        setFeedback({
          tone: 'success',
          message: payload.message ?? 'Form schema saved.',
        })
      })()
    })
  }

  return (
    <div className="space-y-6">
      <Card className="border-primary/10 bg-white/95">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <CardTitle>{eventTitle}</CardTitle>
              <CardDescription>
                Shape the teacher-facing structure before you move into preview, publish, and public
                rendering.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button disabled={!isDirty || isPending || isReadOnly} onClick={handleSave} type="button">
                <Save className="size-4" />
                {isPending ? 'Saving...' : 'Save draft schema'}
              </Button>
              <Button disabled type="button" variant="outline">
                Preview coming next
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Review flow</p>
            <p className="mt-2 text-sm font-medium text-slate-900">
              {reviewLayers} layer{reviewLayers === 1 ? '' : 's'}
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Scoring model</p>
            <p className="mt-2 text-sm font-medium capitalize text-slate-900">{scoringType}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Share slug</p>
            <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-slate-900">
              <Link2 className="size-4 text-slate-400" />
              <code className="rounded bg-white px-2 py-1 text-xs">{shareSlug}</code>
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Deadline</p>
            <p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-slate-900">
              <Clock3 className="size-4 text-slate-400" />
              <span>{formatDateTime(expirationDate)}</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {isReadOnly ? (
        <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-800">
          <div className="flex items-start gap-3">
            <TriangleAlert className="mt-1 size-4 shrink-0" />
            <p>
              This event is currently <span className="font-semibold">{eventStatus}</span>, so the builder is
              read-only. Save actions are limited to draft events only.
            </p>
          </div>
        </div>
      ) : null}

      {feedback ? (
        <div
          className={cn(
            'rounded-[1.5rem] border px-5 py-4 text-sm',
            feedback.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          )}
        >
          {feedback.message}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[290px_minmax(0,1fr)_340px]">
        <Card className="h-fit bg-white/95">
          <CardContent className="p-5">
            <FieldPalette disabled={isReadOnly} onAddField={addField} />
          </CardContent>
        </Card>

        <Card className="bg-white/95">
          <CardHeader>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <CardTitle>Canvas</CardTitle>
                <CardDescription>
                  Drag to reorder, select a field to edit it, and save whenever the draft structure feels right.
                </CardDescription>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                {fields.length} field{fields.length === 1 ? '' : 's'} | last saved {formatDateTime(lastSavedAt)}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <FieldCanvas
              fields={fields}
              isReadOnly={isReadOnly}
              onAddField={addField}
              onDuplicateField={duplicateField}
              onRemoveField={removeField}
              onReorderFields={reorderFields}
              onSelectField={selectField}
              selectedFieldId={selectedFieldId}
            />
          </CardContent>
        </Card>

        <FieldConfigPanel
          isReadOnly={isReadOnly}
          onRemoveField={removeField}
          onUpdateField={updateField}
          selectedField={selectedField}
        />
      </div>
    </div>
  )
}
