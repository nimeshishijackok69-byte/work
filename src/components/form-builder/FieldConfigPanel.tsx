'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { fieldTypeLabels, type FormField } from '@/lib/forms/schema'
import { CheckboxConfig } from './fields/CheckboxConfig'
import { CheckboxGridConfig } from './fields/CheckboxGridConfig'
import { DateConfig } from './fields/DateConfig'
import { DropdownConfig } from './fields/DropdownConfig'
import { FileUploadConfig } from './fields/FileUploadConfig'
import { Hint, ToggleRow } from './fields/helpers'
import { LinearScaleConfig } from './fields/LinearScaleConfig'
import { MCGridConfig } from './fields/MCGridConfig'
import { MultipleChoiceConfig } from './fields/MultipleChoiceConfig'
import { ParagraphConfig } from './fields/ParagraphConfig'
import { SectionHeaderConfig } from './fields/SectionHeaderConfig'
import { ShortAnswerConfig } from './fields/ShortAnswerConfig'
import { TimeConfig } from './fields/TimeConfig'

function renderFieldSpecificConfig(
  field: FormField,
  disabled: boolean,
  onChange: (field: FormField) => void
) {
  switch (field.type) {
    case 'short_answer':
      return <ShortAnswerConfig disabled={disabled} field={field} onChange={onChange} />
    case 'paragraph':
      return <ParagraphConfig disabled={disabled} field={field} onChange={onChange} />
    case 'multiple_choice':
      return <MultipleChoiceConfig disabled={disabled} field={field} onChange={onChange} />
    case 'checkboxes':
      return <CheckboxConfig disabled={disabled} field={field} onChange={onChange} />
    case 'dropdown':
      return <DropdownConfig disabled={disabled} field={field} onChange={onChange} />
    case 'file_upload':
      return <FileUploadConfig disabled={disabled} field={field} onChange={onChange} />
    case 'linear_scale':
      return <LinearScaleConfig disabled={disabled} field={field} onChange={onChange} />
    case 'multiple_choice_grid':
      return <MCGridConfig disabled={disabled} field={field} onChange={onChange} />
    case 'checkbox_grid':
      return <CheckboxGridConfig disabled={disabled} field={field} onChange={onChange} />
    case 'date':
      return <DateConfig disabled={disabled} field={field} onChange={onChange} />
    case 'time':
      return <TimeConfig disabled={disabled} field={field} onChange={onChange} />
    case 'section_header':
      return <SectionHeaderConfig disabled={disabled} field={field} onChange={onChange} />
  }
}

export function FieldConfigPanel({
  isReadOnly = false,
  selectedField,
  onRemoveField,
  onUpdateField,
}: {
  isReadOnly?: boolean
  selectedField: FormField | null
  onRemoveField: (id: string) => void
  onUpdateField: (field: FormField) => void
}) {
  if (!selectedField) {
    return (
      <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-950">Field settings</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Select a field in the canvas to adjust its label, helper copy, and starter configuration.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-slate-950">Field settings</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Fine-tune this field&apos;s content and teacher-facing behavior before you save the draft schema.
        </p>
      </div>

      {isReadOnly ? <Hint>This event is no longer in draft, so the builder is now read-only.</Hint> : null}

      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Field type</p>
        <p className="mt-2 text-sm font-medium text-slate-900">{fieldTypeLabels[selectedField.type]}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="field-label">
          {selectedField.type === 'section_header' ? 'Section title' : 'Question label'}
        </Label>
        <Input
          disabled={isReadOnly}
          id="field-label"
          onChange={(event) => onUpdateField({ ...selectedField, label: event.target.value })}
          value={selectedField.label}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="field-description">Description</Label>
        <Textarea
          disabled={isReadOnly}
          id="field-description"
          onChange={(event) =>
            onUpdateField({
              ...selectedField,
              description: event.target.value,
            })
          }
          value={selectedField.description ?? ''}
        />
      </div>

      {selectedField.type !== 'section_header' ? (
        <ToggleRow
          checked={selectedField.required}
          disabled={isReadOnly}
          label="Require an answer before submission"
          onChange={(required) => onUpdateField({ ...selectedField, required })}
        />
      ) : null}

      {renderFieldSpecificConfig(selectedField, isReadOnly, onUpdateField)}

      <button
        className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isReadOnly}
        onClick={() => onRemoveField(selectedField.id)}
        type="button"
      >
        Remove field
      </button>
    </div>
  )
}
