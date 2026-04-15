import {
  Calendar,
  CheckSquare,
  ChevronDown,
  Circle,
  Clock3,
  Copy,
  Grid2X2,
  Scale,
  Trash2,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { fieldTypeLabels, type FormField } from '@/lib/forms/schema'
import { cn } from '@/lib/utils'
import { DragHandle } from './DragHandle'

function PreviewBody({ field }: { field: FormField }) {
  switch (field.type) {
    case 'short_answer':
      return <Input disabled placeholder="Teacher response" />
    case 'paragraph':
      return <Textarea disabled placeholder="Teacher response" />
    case 'multiple_choice':
      return (
        <div className="space-y-3">
          {field.config.options.map((option) => (
            <label className="flex items-center gap-3 text-sm text-slate-600" key={option}>
              <Circle className="size-4" />
              <span>{option}</span>
            </label>
          ))}
        </div>
      )
    case 'checkboxes':
      return (
        <div className="space-y-3">
          {field.config.options.map((option) => (
            <label className="flex items-center gap-3 text-sm text-slate-600" key={option}>
              <CheckSquare className="size-4" />
              <span>{option}</span>
            </label>
          ))}
        </div>
      )
    case 'dropdown':
      return (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
          <span>{field.config.options[0] ?? 'Option 1'}</span>
          <ChevronDown className="size-4" />
        </div>
      )
    case 'file_upload':
      return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
          <div className="flex items-center gap-2 font-medium text-slate-700">
            <Upload className="size-4" />
            <span>
              {field.config.multiple
                ? `Allow up to ${field.config.maxFiles} files`
                : 'Allow one file'}
            </span>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {field.config.allowedTypes.length
              ? `Allowed types: ${field.config.allowedTypes.join(', ')}`
              : 'Allowed file types will inherit the event defaults for now.'}
          </p>
        </div>
      )
    case 'linear_scale':
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            <Scale className="size-4" />
            <span>Scale preview</span>
          </div>
          <div className="grid grid-cols-5 gap-2">
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
            <span>{field.config.minLabel ?? 'Min label'}</span>
            <span>{field.config.maxLabel ?? 'Max label'}</span>
          </div>
        </div>
      )
    case 'multiple_choice_grid':
    case 'checkbox_grid':
      return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="grid grid-cols-[160px_repeat(2,minmax(0,1fr))] border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            <span>Rows</span>
            {field.config.columns.slice(0, 2).map((column) => (
              <span key={column}>{column}</span>
            ))}
          </div>
          {field.config.rows.slice(0, 3).map((row) => (
            <div
              className="grid grid-cols-[160px_repeat(2,minmax(0,1fr))] items-center border-b border-slate-100 px-4 py-3 text-sm text-slate-600 last:border-b-0"
              key={row}
            >
              <span>{row}</span>
              {field.config.columns.slice(0, 2).map((column) => (
                <span className="flex items-center justify-center" key={`${row}-${column}`}>
                  {field.type === 'multiple_choice_grid' ? (
                    <Circle className="size-4" />
                  ) : (
                    <CheckSquare className="size-4" />
                  )}
                </span>
              ))}
            </div>
          ))}
        </div>
      )
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
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-500">
          <div className="flex items-center gap-2 font-medium text-slate-700">
            <Grid2X2 className="size-4" />
            <span>Section break</span>
          </div>
          <p className="mt-2 leading-6">
            Teachers will see this as a visual divider before the next group of questions.
          </p>
        </div>
      )
  }
}

export function FieldPreview({
  field,
  index,
  isSelected,
  isReadOnly,
  dragHandleProps,
  onDuplicate,
  onRemove,
  onSelect,
}: {
  field: FormField
  index: number
  isSelected: boolean
  isReadOnly: boolean
  dragHandleProps?: React.ComponentProps<'button'>
  onDuplicate: () => void
  onRemove: () => void
  onSelect: () => void
}) {
  return (
    <div
      className={cn(
        'rounded-[1.75rem] border bg-white p-5 shadow-sm transition',
        isSelected
          ? 'border-primary shadow-lg shadow-primary/10 ring-4 ring-primary/10'
          : 'border-slate-200/80 hover:border-slate-300'
      )}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect()
        }
      }}
      role="button"
      tabIndex={0}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                Question {index + 1}
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
              {field.description ? (
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{field.description}</p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isReadOnly ? <DragHandle {...dragHandleProps} /> : null}
            <Button
              onClick={(event) => {
                event.stopPropagation()
                onDuplicate()
              }}
              size="icon-sm"
              type="button"
              variant="outline"
            >
              <Copy className="size-4" />
            </Button>
            <Button
              onClick={(event) => {
                event.stopPropagation()
                onRemove()
              }}
              size="icon-sm"
              type="button"
              variant="outline"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>

        <PreviewBody field={field} />
      </div>
    </div>
  )
}
