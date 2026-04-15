'use client'

import { useActionState, useEffect, useRef } from 'react'
import { CalendarClock, LoaderCircle, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateEventAction, type EventActionState } from './actions'

interface EventEditFormProps {
  event: {
    id: string
    title: string
    description: string | null
    review_layers: number
    scoring_type: string
    max_score: number
    expiration_date: string | null
    teacher_fields: unknown
  }
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null
  }

  return <p className="text-sm text-destructive">{errors[0]}</p>
}

function formatDateForInput(isoDate: string | null) {
  if (!isoDate) return ''

  try {
    const d = new Date(isoDate)
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return ''
  }
}

function getTeacherFieldsArray(value: unknown): string[] {
  if (!Array.isArray(value)) return ['name', 'email']
  return value.filter((f): f is string => typeof f === 'string')
}

export function EventEditForm({ event }: EventEditFormProps) {
  const boundAction = updateEventAction.bind(null, event.id)
  const [state, formAction, isPending] = useActionState(boundAction, undefined)
  const formState = state ?? ({} as EventActionState)
  const successRef = useRef<HTMLDivElement>(null)

  const teacherFields = getTeacherFieldsArray(event.teacher_fields)

  useEffect(() => {
    if (formState.success && successRef.current) {
      successRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [formState.success])

  return (
    <Card className="border-primary/10 bg-white/95">
      <CardHeader className="space-y-2">
        <CardTitle>Edit event metadata</CardTitle>
        <CardDescription>
          Update the event configuration while it&apos;s still in draft. Publishing will lock
          these settings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Event title</Label>
            <Input
              defaultValue={event.title}
              id="edit-title"
              name="title"
              placeholder="Annual School Excellence Awards 2026"
            />
            <FieldError errors={formState.errors?.title} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              defaultValue={event.description ?? ''}
              id="edit-description"
              name="description"
              placeholder="Share what this event is for, who should submit, and any special instructions."
              rows={4}
            />
            <FieldError errors={formState.errors?.description} />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-review-layers">Review layers</Label>
              <Input
                defaultValue={event.review_layers}
                id="edit-review-layers"
                max={10}
                min={1}
                name="review_layers"
                type="number"
              />
              <FieldError errors={formState.errors?.review_layers} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-max-score">Maximum score</Label>
              <Input
                defaultValue={event.max_score}
                id="edit-max-score"
                max={1000}
                min={1}
                name="max_score"
                type="number"
              />
              <FieldError errors={formState.errors?.max_score} />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="edit-scoring-type">Scoring type</Label>
              <select
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                defaultValue={event.scoring_type}
                id="edit-scoring-type"
                name="scoring_type"
              >
                <option value="numeric">Numeric score</option>
                <option value="grade">Letter grade</option>
              </select>
              <FieldError errors={formState.errors?.scoring_type} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-expiration">Expiration date</Label>
              <div className="relative">
                <CalendarClock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  className="pl-10"
                  defaultValue={formatDateForInput(event.expiration_date)}
                  id="edit-expiration"
                  name="expiration_date"
                  type="datetime-local"
                />
              </div>
              <FieldError errors={formState.errors?.expiration_date} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Teacher info to collect</Label>
              <p className="text-sm leading-6 text-slate-500">
                Name and email are always required. Toggle the optional fields below.
              </p>
            </div>

            <input name="teacher_fields" type="hidden" value="name" />
            <input name="teacher_fields" type="hidden" value="email" />

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <input
                  className="mt-1 size-4"
                  defaultChecked={teacherFields.includes('school_name')}
                  name="teacher_fields"
                  type="checkbox"
                  value="school_name"
                />
                <span className="space-y-1">
                  <span className="block text-sm font-medium text-slate-900">School name</span>
                  <span className="block text-sm leading-6 text-slate-500">
                    Helpful for admin sorting and analytics.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <input
                  className="mt-1 size-4"
                  defaultChecked={teacherFields.includes('phone')}
                  name="teacher_fields"
                  type="checkbox"
                  value="phone"
                />
                <span className="space-y-1">
                  <span className="block text-sm font-medium text-slate-900">Phone number</span>
                  <span className="block text-sm leading-6 text-slate-500">
                    Secondary contact channel for admins.
                  </span>
                </span>
              </label>
            </div>

            <FieldError errors={formState.errors?.teacher_fields} />
          </div>

          {formState.message ? (
            <div
              ref={formState.success ? successRef : undefined}
              className={
                formState.success
                  ? 'rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700'
                  : 'rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive'
              }
            >
              {formState.message}
            </div>
          ) : null}

          <Button
            className="h-11 w-full text-sm font-semibold"
            disabled={isPending}
            type="submit"
          >
            {isPending ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="size-4" />
                Save changes
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
