import { FormField } from '@/lib/forms/schema'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CheckSquare, Circle, Scale, Calendar, Clock3 } from 'lucide-react'

// Common props for each field component
export interface FieldRendererProps {
  field: FormField
  value: any
  onChange: (value: any) => void
  error?: string
}

export function ShortAnswerField({ field, value, onChange }: FieldRendererProps) {
  if (field.type !== 'short_answer') return null
  return (
    <Input
      placeholder={field.config?.placeholder || 'Type your answer'}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      maxLength={field.validation?.maxLength}
    />
  )
}

export function ParagraphField({ field, value, onChange }: FieldRendererProps) {
  if (field.type !== 'paragraph') return null
  return (
    <Textarea
      placeholder={field.config?.placeholder || 'Write your response'}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      rows={field.config?.rows ?? 4}
      maxLength={field.validation?.maxLength}
      className="resize-none"
    />
  )
}

export function MultipleChoiceField({ field, value, onChange }: FieldRendererProps) {
  if (field.type !== 'multiple_choice') return null
  return (
    <div className="space-y-3">
      {field.config.options.map((option) => (
        <label key={option} className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer">
          <input
            type="radio"
            name={field.id}
            value={option}
            checked={value === option}
            onChange={(e) => onChange(e.target.value)}
            className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-600"
          />
          <span>{option}</span>
        </label>
      ))}
    </div>
  )
}

export function CheckboxesField({ field, value = [], onChange }: FieldRendererProps) {
  if (field.type !== 'checkboxes') return null
  const selectedValues = Array.isArray(value) ? value : []

  const handleToggle = (option: string) => {
    if (selectedValues.includes(option)) {
      onChange(selectedValues.filter((v: string) => v !== option))
    } else {
      onChange([...selectedValues, option])
    }
  }

  return (
    <div className="space-y-3">
      {field.config.options.map((option) => (
        <label key={option} className="flex items-center gap-3 text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            name={field.id}
            value={option}
            checked={selectedValues.includes(option)}
            onChange={() => handleToggle(option)}
            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-600"
          />
          <span>{option}</span>
        </label>
      ))}
    </div>
  )
}

export function DropdownField({ field, value, onChange }: FieldRendererProps) {
  if (field.type !== 'dropdown') return null
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
    >
      <option value="" disabled>Choose an option</option>
      {field.config.options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}

export function LinearScaleField({ field, value, onChange }: FieldRendererProps) {
  if (field.type !== 'linear_scale') return null

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 sm:gap-4 justify-between max-w-2xl px-2">
        <span className="text-sm text-slate-600 self-end mb-2">{field.config.minLabel}</span>
        
        {Array.from({ length: field.config.max - field.config.min + 1 }).map((_, i) => {
          const val = field.config.min + i
          return (
            <label key={val} className="flex flex-col items-center gap-2 cursor-pointer">
              <span className="text-sm font-medium text-slate-700">{val}</span>
              <input
                type="radio"
                name={field.id}
                value={val}
                checked={Number(value) === val}
                onChange={() => onChange(val)}
                className="w-5 h-5 text-blue-600 border-slate-300 focus:ring-blue-600"
              />
            </label>
          )
        })}

        <span className="text-sm text-slate-600 self-end mb-2">{field.config.maxLabel}</span>
      </div>
    </div>
  )
}

export function MultipleChoiceGridField({ field, value = {}, onChange }: FieldRendererProps) {
  if (field.type !== 'multiple_choice_grid') return null

  const handleRowChange = (row: string, col: string) => {
    onChange({ ...value, [row]: col })
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr>
            <th className="p-2 min-w-[120px]"></th>
            {field.config.columns.map((col) => (
              <th key={col} className="p-2 text-sm font-medium text-slate-600 text-center min-w-[80px]">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {field.config.rows.map((row) => (
            <tr key={row} className="border-t border-slate-200 even:bg-slate-50">
              <td className="p-2 text-sm text-slate-700">{row}</td>
              {field.config.columns.map((col) => (
                <td key={col} className="p-2 text-center">
                  <input
                    type="radio"
                    name={`${field.id}_${row}`}
                    value={col}
                    checked={value[row] === col}
                    onChange={() => handleRowChange(row, col)}
                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-600 cursor-pointer"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function CheckboxGridField({ field, value = {}, onChange }: FieldRendererProps) {
  if (field.type !== 'checkbox_grid') return null

  const handleRowChange = (row: string, col: string) => {
    const rowValues = Array.isArray(value[row]) ? value[row] : []
    if (rowValues.includes(col)) {
      onChange({ ...value, [row]: rowValues.filter((c: string) => c !== col) })
    } else {
      onChange({ ...value, [row]: [...rowValues, col] })
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr>
            <th className="p-2 min-w-[120px]"></th>
            {field.config.columns.map((col) => (
              <th key={col} className="p-2 text-sm font-medium text-slate-600 text-center min-w-[80px]">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {field.config.rows.map((row) => (
            <tr key={row} className="border-t border-slate-200 even:bg-slate-50">
              <td className="p-2 text-sm text-slate-700">{row}</td>
              {field.config.columns.map((col) => {
                const rowValues = Array.isArray(value[row]) ? value[row] : []
                return (
                  <td key={col} className="p-2 text-center">
                    <input
                      type="checkbox"
                      name={`${field.id}_${row}`}
                      value={col}
                      checked={rowValues.includes(col)}
                      onChange={() => handleRowChange(row, col)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-600 cursor-pointer"
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function DateField({ field, value, onChange }: FieldRendererProps) {
  if (field.type !== 'date') return null
  return (
    <div className="relative max-w-[200px]">
      <Input
        type="date"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10"
      />
      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>
  )
}

export function TimeField({ field, value, onChange }: FieldRendererProps) {
  if (field.type !== 'time') return null
  return (
    <div className="relative max-w-[150px]">
      <Input
        type="time"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10"
      />
      <Clock3 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>
  )
}

// NOTE: FileUploadField and SectionHeader intentionally separate or handled differently
// as SectionHeader is purely presentational, and FileUpload needs specific state management
