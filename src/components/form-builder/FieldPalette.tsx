import {
  AlignLeft,
  Calendar,
  CheckSquare,
  ChevronDownSquare,
  CircleDot,
  Clock3,
  Grid2X2,
  Heading3,
  ListChecks,
  Scale,
  TextCursorInput,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { type FieldType, fieldTypeLabels } from '@/lib/forms/schema'

const fieldOptions: Array<{
  description: string
  icon: React.ComponentType<{ className?: string }>
  type: FieldType
}> = [
  { type: 'short_answer', icon: TextCursorInput, description: 'Single-line text response.' },
  { type: 'paragraph', icon: AlignLeft, description: 'Long-form written response.' },
  { type: 'multiple_choice', icon: CircleDot, description: 'Choose exactly one option.' },
  { type: 'checkboxes', icon: CheckSquare, description: 'Choose one or more options.' },
  { type: 'dropdown', icon: ChevronDownSquare, description: 'Compact select list.' },
  { type: 'file_upload', icon: Upload, description: 'Collect supporting files.' },
  { type: 'linear_scale', icon: Scale, description: 'Rate on a numeric scale.' },
  { type: 'multiple_choice_grid', icon: Grid2X2, description: 'One response per row.' },
  { type: 'checkbox_grid', icon: ListChecks, description: 'Many responses per row.' },
  { type: 'date', icon: Calendar, description: 'Choose a calendar date.' },
  { type: 'time', icon: Clock3, description: 'Choose a time of day.' },
  { type: 'section_header', icon: Heading3, description: 'Break the form into sections.' },
]

export function FieldPalette({
  disabled = false,
  onAddField,
}: {
  disabled?: boolean
  onAddField: (type: FieldType) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">Field palette</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Add the next question type into the draft canvas. Detailed field-by-field polish can build
          on top of this foundation next.
        </p>
      </div>

      <div className="grid gap-2">
        {fieldOptions.map((field) => {
          const Icon = field.icon

          return (
            <Button
              className="h-auto items-start justify-start rounded-2xl border-slate-200 px-4 py-3 text-left"
              disabled={disabled}
              key={field.type}
              onClick={() => onAddField(field.type)}
              type="button"
              variant="outline"
            >
              <span className="flex items-start gap-3">
                <span className="mt-0.5 rounded-xl bg-slate-100 p-2 text-slate-700">
                  <Icon className="size-4" />
                </span>
                <span className="space-y-1">
                  <span className="block text-sm font-semibold text-slate-950">
                    {fieldTypeLabels[field.type]}
                  </span>
                  <span className="block text-xs leading-5 text-slate-500">{field.description}</span>
                </span>
              </span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
