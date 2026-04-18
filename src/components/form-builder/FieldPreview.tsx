import {
  Calendar,
  CheckSquare,
  ChevronDown,
  Circle,
  Clock3,
  Copy,
  FileText,
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
      return (
        <div className="space-y-2">
          <Input disabled placeholder={field.config.placeholder || 'Teacher response'} />
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
            placeholder={field.config.placeholder || 'Teacher response'}
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
          {field.config.options.slice(0, 5).map((option, optionIndex) => (
            <label className="flex items-center gap-3 text-sm text-slate-600" key={optionIndex}>
              <Circle className="size-4" />
              <span>{option}</span>
            </label>
          ))}
          {field.config.options.length > 5 ? (
            <p className="text-xs text-slate-500">+{field.config.options.length - 5} more options</p>
          ) : null}
        </div>
      )
    case 'checkboxes':
      return (
        <div className="space-y-3">
          {field.config.options.slice(0, 5).map((option, optionIndex) => (
            <label className="flex items-center gap-3 text-sm text-slate-600" key={optionIndex}>
              <CheckSquare className="size-4" />
              <span>{option}</span>
            </label>
          ))}
          {field.config.options.length > 5 ? (
            <p className="text-xs text-slate-500">+{field.config.options.length - 5} more options</p>
          ) : null}
        </div>
      )
    case 'dropdown':
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
            <span>Choose an option</span>
            <ChevronDown className="size-4" />
          </div>
          <p className="text-xs text-slate-500">{field.config.options.length} options configured</p>
        </div>
      )
    case 'file_upload':
      return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
          <div className="flex items-center gap-2 font-medium text-slate-700">
            <Upload className="size-4" />
            <span>
              {field.config.multiple ? `Allow up to ${field.config.maxFiles} files` : 'Allow one file'}
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
            <span>{field.config.minLabel ?? 'Min label'}</span>
            <span>{field.config.maxLabel ?? 'Max label'}</span>
          </div>
        </div>
      )
    case 'multiple_choice_grid': {
      const previewColumns = field.config.columns.slice(0, 3)

      return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div
            className="grid border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"
            style={{
              gridTemplateColumns: `160px repeat(${previewColumns.length || 1}, minmax(0, 1fr))`,
            }}
          >
            <span>Rows</span>
            {previewColumns.map((column) => (
              <span key={column}>{column}</span>
            ))}
          </div>
          {field.config.rows.slice(0, 3).map((row) => (
            <div
              className="grid items-center border-b border-slate-100 px-4 py-3 text-sm text-slate-600 last:border-b-0"
              key={row}
              style={{
                gridTemplateColumns: `160px repeat(${previewColumns.length || 1}, minmax(0, 1fr))`,
              }}
            >
              <span>{row}</span>
              {previewColumns.map((column) => (
                <span className="flex items-center justify-center" key={`${row}-${column}`}>
                  <Circle className="size-4" />
                </span>
              ))}
            </div>
          ))}
          {field.config.columns.length > previewColumns.length ? (
            <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
              +{field.config.columns.length - previewColumns.length} more columns in the full grid
            </div>
          ) : null}
        </div>
      )
    }
    case 'checkbox_grid': {
      const previewColumns = field.config.columns.slice(0, 3)

      return (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div
            className="grid border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500"
            style={{
              gridTemplateColumns: `160px repeat(${previewColumns.length || 1}, minmax(0, 1fr))`,
            }}
          >
            <span>Rows</span>
            {previewColumns.map((column) => (
              <span key={column}>{column}</span>
            ))}
          </div>
          {field.config.rows.slice(0, 3).map((row) => (
            <div
              className="grid items-center border-b border-slate-100 px-4 py-3 text-sm text-slate-600 last:border-b-0"
              key={row}
              style={{
                gridTemplateColumns: `160px repeat(${previewColumns.length || 1}, minmax(0, 1fr))`,
              }}
            >
              <span>{row}</span>
              {previewColumns.map((column) => (
                <span className="flex items-center justify-center" key={`${row}-${column}`}>
                  <CheckSquare className="size-4" />
                </span>
              ))}
            </div>
          ))}
          {field.config.columns.length > previewColumns.length ? (
            <div className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
              +{field.config.columns.length - previewColumns.length} more columns in the full grid
            </div>
          ) : null}
        </div>
      )
    }
    case 'date':
      return (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
          <Calendar className="size-4" />
          <span>Choose a date from the calendar picker</span>
        </div>
      )
    case 'time':
      return (
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
          <Clock3 className="size-4" />
          <span>Choose a time of day</span>
        </div>
      )
    case 'section_header':
      return (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <FileText className="size-4" />
            <span>Teacher-facing section header</span>
          </div>
          <div className="mt-4 border-t border-slate-200 pt-4">
            <h4 className="text-base font-semibold text-slate-900">{field.label}</h4>
            {field.description ? (
              <p className="mt-2 text-sm leading-6 text-slate-600">{field.description}</p>
            ) : (
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Add a short description to orient teachers before the next group of questions.
              </p>
            )}
          </div>
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
  const isSectionHeader = field.type === 'section_header'

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
              {field.description ? (
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{field.description}</p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isReadOnly ? <DragHandle {...dragHandleProps} /> : null}
            <Button
              disabled={isReadOnly}
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
              disabled={isReadOnly}
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
