'use client'

import { CircleAlert } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { type FormField } from '@/lib/forms/schema'

function parseLines(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-700">
      <div className="flex items-start gap-2">
        <CircleAlert className="mt-1 size-4 shrink-0" />
        <div>{children}</div>
      </div>
    </div>
  )
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
  onUpdateField: (id: string, updates: Partial<FormField>) => void
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
          This panel handles the shared editing model for the builder. We can layer richer per-field
          interactions on top of it in the next sessions.
        </p>
      </div>

      {isReadOnly ? <Hint>This event is no longer in draft, so the builder is now read-only.</Hint> : null}

      <div className="space-y-2">
        <Label htmlFor="field-label">
          {selectedField.type === 'section_header' ? 'Section title' : 'Question label'}
        </Label>
        <Input
          disabled={isReadOnly}
          id="field-label"
          onChange={(event) => onUpdateField(selectedField.id, { label: event.target.value })}
          value={selectedField.label}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="field-description">Description</Label>
        <Textarea
          disabled={isReadOnly}
          id="field-description"
          onChange={(event) =>
            onUpdateField(selectedField.id, {
              description: event.target.value,
            })
          }
          value={selectedField.description ?? ''}
        />
      </div>

      {selectedField.type !== 'section_header' ? (
        <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <input
            checked={selectedField.required}
            className="size-4"
            disabled={isReadOnly}
            onChange={(event) =>
              onUpdateField(selectedField.id, {
                required: event.target.checked,
              })
            }
            type="checkbox"
          />
          <span>Require an answer before submission</span>
        </label>
      ) : null}

      {(selectedField.type === 'multiple_choice' ||
        selectedField.type === 'checkboxes' ||
        selectedField.type === 'dropdown') ? (
        <div className="space-y-2">
          <Label htmlFor="field-options">Options</Label>
          <Textarea
            disabled={isReadOnly}
            id="field-options"
            onChange={(event) =>
              onUpdateField(selectedField.id, {
                config: {
                  options: parseLines(event.target.value).length
                    ? parseLines(event.target.value)
                    : ['Option 1'],
                },
              } as Partial<FormField>)
            }
            value={selectedField.config.options.join('\n')}
          />
          <p className="text-xs leading-5 text-slate-500">Use one line per option.</p>
        </div>
      ) : null}

      {selectedField.type === 'linear_scale' ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="scale-min">Minimum value</Label>
            <Input
              disabled={isReadOnly}
              id="scale-min"
              min={0}
              onChange={(event) =>
                onUpdateField(selectedField.id, {
                  config: {
                    ...selectedField.config,
                    min: Number(event.target.value) || 0,
                  },
                } as Partial<FormField>)
              }
              type="number"
              value={selectedField.config.min}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="scale-max">Maximum value</Label>
            <Input
              disabled={isReadOnly}
              id="scale-max"
              min={1}
              onChange={(event) =>
                onUpdateField(selectedField.id, {
                  config: {
                    ...selectedField.config,
                    max: Number(event.target.value) || 1,
                  },
                } as Partial<FormField>)
              }
              type="number"
              value={selectedField.config.max}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="scale-min-label">Minimum label</Label>
            <Input
              disabled={isReadOnly}
              id="scale-min-label"
              onChange={(event) =>
                onUpdateField(selectedField.id, {
                  config: {
                    ...selectedField.config,
                    minLabel: event.target.value,
                  },
                } as Partial<FormField>)
              }
              value={selectedField.config.minLabel ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="scale-max-label">Maximum label</Label>
            <Input
              disabled={isReadOnly}
              id="scale-max-label"
              onChange={(event) =>
                onUpdateField(selectedField.id, {
                  config: {
                    ...selectedField.config,
                    maxLabel: event.target.value,
                  },
                } as Partial<FormField>)
              }
              value={selectedField.config.maxLabel ?? ''}
            />
          </div>
        </div>
      ) : null}

      {(selectedField.type === 'multiple_choice_grid' || selectedField.type === 'checkbox_grid') ? (
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="grid-rows">Rows</Label>
            <Textarea
              disabled={isReadOnly}
              id="grid-rows"
              onChange={(event) =>
                onUpdateField(selectedField.id, {
                  config: {
                    ...selectedField.config,
                    rows: parseLines(event.target.value).length
                      ? parseLines(event.target.value)
                      : ['Row 1'],
                  },
                } as Partial<FormField>)
              }
              value={selectedField.config.rows.join('\n')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="grid-columns">Columns</Label>
            <Textarea
              disabled={isReadOnly}
              id="grid-columns"
              onChange={(event) =>
                onUpdateField(selectedField.id, {
                  config: {
                    ...selectedField.config,
                    columns: parseLines(event.target.value).length
                      ? parseLines(event.target.value)
                      : ['Column 1'],
                  },
                } as Partial<FormField>)
              }
              value={selectedField.config.columns.join('\n')}
            />
          </div>
        </div>
      ) : null}

      {selectedField.type === 'file_upload' ? (
        <div className="grid gap-4">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <input
              checked={selectedField.config.multiple}
              className="size-4"
              disabled={isReadOnly}
              onChange={(event) =>
                onUpdateField(selectedField.id, {
                  config: {
                    ...selectedField.config,
                    multiple: event.target.checked,
                    maxFiles: event.target.checked ? Math.max(selectedField.config.maxFiles, 2) : 1,
                  },
                } as Partial<FormField>)
              }
              type="checkbox"
            />
            <span>Allow multiple files</span>
          </label>
          <div className="space-y-2">
            <Label htmlFor="max-files">Maximum files</Label>
            <Input
              disabled={isReadOnly}
              id="max-files"
              min={1}
              onChange={(event) =>
                onUpdateField(selectedField.id, {
                  config: {
                    ...selectedField.config,
                    maxFiles: Number(event.target.value) || 1,
                  },
                } as Partial<FormField>)
              }
              type="number"
              value={selectedField.config.maxFiles}
            />
          </div>
        </div>
      ) : null}

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
