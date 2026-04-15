import * as React from 'react'
import { CircleAlert } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function parseLines(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm leading-6 text-sky-700">
      <div className="flex items-start gap-2">
        <CircleAlert className="mt-1 size-4 shrink-0" />
        <div>{children}</div>
      </div>
    </div>
  )
}

export function ToggleRow({
  checked,
  disabled = false,
  label,
  onChange,
}: {
  checked: boolean
  disabled?: boolean
  label: string
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
      <input
        checked={checked}
        className="size-4"
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <span>{label}</span>
    </label>
  )
}

export function NumberField({
  disabled = false,
  helperText,
  id,
  label,
  max,
  min,
  onChange,
  placeholder,
  value,
}: {
  disabled?: boolean
  helperText?: string
  id: string
  label: string
  max?: number
  min?: number
  onChange: (value: number | undefined) => void
  placeholder?: string
  value?: number
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        disabled={disabled}
        id={id}
        max={max}
        min={min}
        onChange={(event) => {
          const nextValue = event.target.value.trim()
          onChange(nextValue ? Number(nextValue) : undefined)
        }}
        placeholder={placeholder}
        type="number"
        value={value ?? ''}
      />
      {helperText ? <p className="text-xs leading-5 text-slate-500">{helperText}</p> : null}
    </div>
  )
}

export function TextListEditor({
  disabled = false,
  helperText,
  id,
  label,
  onChange,
  placeholder,
  values,
}: {
  disabled?: boolean
  helperText?: string
  id: string
  label: string
  onChange: (values: string[]) => void
  placeholder?: string
  values: string[]
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        disabled={disabled}
        id={id}
        onChange={(event) => onChange(parseLines(event.target.value))}
        placeholder={placeholder}
        value={values.join('\n')}
      />
      {helperText ? <p className="text-xs leading-5 text-slate-500">{helperText}</p> : null}
    </div>
  )
}
