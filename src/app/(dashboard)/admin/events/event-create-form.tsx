'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { CalendarClock, LoaderCircle, PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createEventAction, type CreateEventFormState } from './actions'

const initialState: CreateEventFormState = {}

/** Produces a `datetime-local`-compatible string for the current minute. */
function getNowForInput() {
  const d = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null
  }

  return <p className="text-sm text-destructive">{errors[0]}</p>
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button className="h-11 w-full text-sm font-semibold" disabled={pending} type="submit">
      {pending ? (
        <>
          <LoaderCircle className="size-4 animate-spin" />
          Creating event...
        </>
      ) : (
        <>
          Create draft event
          <PlusCircle className="size-4" />
        </>
      )}
    </Button>
  )
}

const selectClassName =
  'flex h-11 w-full appearance-none rounded-lg border border-input bg-background px-3 py-2 pr-10 text-sm shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15'

function SelectChevron() {
  return (
    <svg
      className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function EventCreateForm() {
  const [state, formAction] = useActionState(createEventAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const formState = state ?? initialState

  useEffect(() => {
    if (formState.success) {
      formRef.current?.reset()
    }
  }, [formState.success])

  return (
    <Card className="border-primary/10 bg-white/95">
      <CardHeader className="space-y-2">
        <CardTitle>Create a new event</CardTitle>
        <CardDescription>
          Start with the event metadata and publish flow foundation. The form builder will plug into
          this draft in the next step.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5" noValidate ref={formRef}>
          <div className="space-y-2">
            <Label htmlFor="title">Event title</Label>
            <Input id="title" name="title" placeholder="Annual School Excellence Awards 2026" />
            <FieldError errors={formState.errors?.title} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Share what this event is for, who should submit, and any special instructions."
              rows={5}
            />
            <FieldError errors={formState.errors?.description} />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="review_layers">Review layers</Label>
              <Input
                defaultValue="1"
                id="review_layers"
                max={10}
                min={1}
                name="review_layers"
                type="number"
              />
              <p className="text-sm leading-6 text-slate-500">
                Configure how many reviewer stages this event should support.
              </p>
              <FieldError errors={formState.errors?.review_layers} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_score">Maximum score</Label>
              <Input
                defaultValue="100"
                id="max_score"
                max={1000}
                min={1}
                name="max_score"
                type="number"
              />
              <p className="text-sm leading-6 text-slate-500">
                Used for numeric scoring. Grade-based events keep a 100-point internal scale.
              </p>
              <FieldError errors={formState.errors?.max_score} />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="scoring_type">Scoring type</Label>
              <div className="relative">
                <select
                  className={selectClassName}
                  defaultValue="numeric"
                  id="scoring_type"
                  name="scoring_type"
                >
                  <option value="numeric">Numeric score</option>
                  <option value="grade">Letter grade</option>
                </select>
                <SelectChevron />
              </div>
              <p className="text-sm leading-6 text-slate-500">
                Grade-based events start with a default A-F scale that we can customize in the next session.
              </p>
              <FieldError errors={formState.errors?.scoring_type} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiration_date">Expiration date</Label>
              <div className="relative">
                <CalendarClock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  className="pl-10"
                  id="expiration_date"
                  min={getNowForInput()}
                  name="expiration_date"
                  step="60"
                  type="datetime-local"
                />
              </div>
              <p className="text-sm leading-6 text-slate-500">
                Leave blank if the event should stay open until you close it manually.
              </p>
              <FieldError errors={formState.errors?.expiration_date} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Teacher info to collect</Label>
              <p className="text-sm leading-6 text-slate-500">
                Name and email stay on so draft recovery and confirmations work. Add the extra fields you need now.
              </p>
            </div>

            <input name="teacher_fields" type="hidden" value="name" />
            <input name="teacher_fields" type="hidden" value="email" />

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-slate-100">
                <input
                  className="mt-1 size-4 rounded border-slate-300 accent-primary"
                  defaultChecked
                  name="teacher_fields"
                  type="checkbox"
                  value="school_name"
                />
                <span className="space-y-1">
                  <span className="block text-sm font-medium text-slate-900">School name</span>
                  <span className="block text-sm leading-6 text-slate-500">
                    Helpful for admin sorting and later analytics.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-slate-100">
                <input
                  className="mt-1 size-4 rounded border-slate-300 accent-primary"
                  name="teacher_fields"
                  type="checkbox"
                  value="phone"
                />
                <span className="space-y-1">
                  <span className="block text-sm font-medium text-slate-900">Phone number</span>
                  <span className="block text-sm leading-6 text-slate-500">
                    Use this when admins need a secondary contact channel.
                  </span>
                </span>
              </label>
            </div>

            <FieldError errors={formState.errors?.teacher_fields} />
          </div>

          {formState.message ? (
            <div
              className={
                formState.success
                  ? 'rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700'
                  : 'rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive'
              }
            >
              {formState.message}
            </div>
          ) : null}

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  )
}
