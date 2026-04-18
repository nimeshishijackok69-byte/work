'use client'

import { useEffect } from 'react'
import {
  Calendar,
  CheckSquare,
  ChevronDown,
  Circle,
  Clock3,
  FileText,
  Link2,
  Scale,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { fieldTypeLabels, type FormField } from '@/lib/forms/schema'

function formatDateTime(value: string | null) {
  if (!value) {
    return 'No deadline'
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function getTeacherFields(value: unknown) {
  if (!Array.isArray(value)) {
    return ['name', 'email', 'school_name']
  }

  return value.filter((field): field is string => typeof field === 'string')
}

function getTeacherFieldLabel(field: string) {
  switch (field) {
    case 'school_name':
      return 'School name'
    default:
      return field.charAt(0).toUpperCase() + field.slice(1)
  }
}

function TeacherInfoPreview({ teacherFields }: { teacherFields: string[] }) {
  return (
    <Card className="border-slate-200 bg-white">
      <CardHeader>
        <CardTitle className="text-base">Teacher details</CardTitle>
        <CardDescription>
          These details appear above the form questions on the public submission page.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        {teacherFields.map((field) => (
          <div className="space-y-2" key={field}>
            <p className="text-sm font-medium text-slate-900">{getTeacherFieldLabel(field)}</p>
            <Input
              disabled
              placeholder={
                field === 'email'
                  ? 'teacher@school.edu'
                  : field === 'phone'
                    ? '+91 98765 43210'
                    : field === 'school_name'
                      ? 'Example Public School'
                      : 'Teacher name'
              }
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function FieldPreviewBody({ field }: { field: FormField }) {
  switch (field.type) {
    case 'short_answer':
      return (
        <div className="space-y-2">
          <Input disabled placeholder={field.config.placeholder || 'Type your answer'} />
          {field.validation?.maxLength ? (
            <p className="text-xs text-slate-500">Maximum {field.validation.maxLength} characters</p>
          ) : null}
        </div>
      )
    case 'paragraph':
      return (
        <div className="space-y-2">
          <Textarea
            className="resize-none"
            disabled
            placeholder={field.config.placeholder || 'Write your response'}
            rows={field.config.rows}
          />
          {field.validation?.maxLength ? (
            <p className="text-xs text-slate-500">Maximum {field.validation.maxLength} characters</p>
          ) : null}
        </div>
      )
    case 'multiple_choice':
      return (
        <div className="space-y-3">
          {field.config.options.map((option, optionIndex) => (
            <label className="flex items-center gap-3 text-sm text-slate-600" key={optionIndex}>
              <Circle className="size-4" />
              <span>{option}</span>
            </label>
          ))}
        </div>
      )
    case 'checkboxes':
      return (
        <div className="space-y-3">
          {field.config.options.map((option, optionIndex) => (
            <label className="flex items-center gap-3 text-sm text-slate-600" key={optionIndex}>
              <CheckSquare className="size-4" />
              <span>{option}</span>
            </label>
          ))}
        </div>
      )
    case 'dropdown':
      return (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
          <span>Choose an option</span>
          <ChevronDown className="size-4" />
        </div>
      )
    case 'file_upload':
      return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
          <p className="font-medium text-slate-700">
            {field.config.multiple ? `Upload up to ${field.config.maxFiles} files` : 'Upload one file'}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {field.config.allowedTypes.length
              ? `Allowed types: ${field.config.allowedTypes.join(', ')}`
              : 'File type validation will use the event defaults.'}
          </p>
        </div>
      )
    case 'linear_scale':
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            <Scale className="size-4" />
            <span>Scale</span>
          </div>
          <div className="grid gap-2 sm:grid-cols-5">
            {Array.from({ length: field.config.max - field.config.min + 1 }, (_, index) => {
              const value = field.config.min + index

              return (
                <div
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-center text-sm text-slate-600"
                  key={value}
                >
                  {value}
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{field.config.minLabel ?? 'Low'}</span>
            <span>{field.config.maxLabel ?? 'High'}</span>
          </div>
        </div>
      )
    case 'multiple_choice_grid':
    case 'checkbox_grid': {
      const Icon = field.type === 'multiple_choice_grid' ? Circle : CheckSquare

      return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div
            className="grid border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"
            style={{
              gridTemplateColumns: `160px repeat(${Math.max(field.config.columns.length, 1)}, minmax(0, 1fr))`,
            }}
          >
            <span>Rows</span>
            {field.config.columns.map((column) => (
              <span key={column}>{column}</span>
            ))}
          </div>
          {field.config.rows.map((row) => (
            <div
              className="grid items-center border-b border-slate-100 px-4 py-3 text-sm text-slate-600 last:border-b-0"
              key={row}
              style={{
                gridTemplateColumns: `160px repeat(${Math.max(field.config.columns.length, 1)}, minmax(0, 1fr))`,
              }}
            >
              <span>{row}</span>
              {field.config.columns.map((column) => (
                <span className="flex items-center justify-center" key={`${row}-${column}`}>
                  <Icon className="size-4" />
                </span>
              ))}
            </div>
          ))}
        </div>
      )
    }
    case 'date':
      return (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
          <Calendar className="size-4" />
          <span>Select a date</span>
        </div>
      )
    case 'time':
      return (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
          <Clock3 className="size-4" />
          <span>Select a time</span>
        </div>
      )
    case 'section_header':
      return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <FileText className="size-4" />
            <span>Section header</span>
          </div>
          {field.description ? (
            <p className="mt-3 text-sm leading-6 text-slate-600">{field.description}</p>
          ) : null}
        </div>
      )
  }
}

function QuestionPreview({ field, index }: { field: FormField; index: number }) {
  const isSectionHeader = field.type === 'section_header'

  return (
    <Card className="border-slate-200 bg-white">
      <CardContent className="space-y-4 p-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
              {isSectionHeader ? `Section ${index + 1}` : `Question ${index + 1}`}
            </span>
            <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">
              {fieldTypeLabels[field.type]}
            </span>
            {field.required ? (
              <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700">
                Required
              </span>
            ) : null}
          </div>

          <div>
            <h3 className="text-lg font-semibold text-slate-950">{field.label}</h3>
            {field.description && field.type !== 'section_header' ? (
              <p className="mt-2 text-sm leading-6 text-slate-600">{field.description}</p>
            ) : null}
          </div>
        </div>

        <FieldPreviewBody field={field} />
      </CardContent>
    </Card>
  )
}

export function FormPreview({
  eventTitle,
  eventDescription,
  expirationDate,
  fields,
  isOpen,
  onClose,
  shareSlug,
  teacherFields,
}: {
  eventTitle: string
  eventDescription: string | null
  expirationDate: string | null
  fields: FormField[]
  isOpen: boolean
  onClose: () => void
  shareSlug: string
  teacherFields: unknown
}) {
  const teacherFieldList = getTeacherFields(teacherFields)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4">
      <div className="absolute inset-0" onClick={onClose} />
      <div aria-labelledby="form-preview-title" aria-modal="true" className="relative flex h-full max-h-[min(920px,100%)] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-slate-100 shadow-2xl" role="dialog">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Full preview</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950" id="form-preview-title">{eventTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This is the current teacher-facing draft before publish.
            </p>
          </div>
          <Button onClick={onClose} size="icon-sm" type="button" variant="outline">
            <X className="size-4" />
          </Button>
        </div>

        <div className="overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          <div className="mx-auto space-y-6">
            <Card className="border-slate-200 bg-white">
              <CardHeader className="gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                    Draft form
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">
                    <Link2 className="size-3.5" />
                    {shareSlug}
                  </span>
                  <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">
                    {fields.length} item{fields.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div>
                  <CardTitle>{eventTitle}</CardTitle>
                  <CardDescription>
                    {eventDescription || 'Add event guidance to help teachers understand the submission expectations.'}
                  </CardDescription>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <span className="font-medium text-slate-900">Deadline:</span> {formatDateTime(expirationDate)}
                </div>
              </CardHeader>
            </Card>

            <TeacherInfoPreview teacherFields={teacherFieldList} />

            {fields.length ? (
              fields.map((field, index) => (
                <QuestionPreview field={field} index={index} key={field.id} />
              ))
            ) : (
              <Card className="border-slate-200 bg-white">
                <CardContent className="p-8 text-center text-sm text-slate-600">
                  Add at least one field to preview the teacher-facing form.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
