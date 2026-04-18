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
    <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 has-[:disabled]:hover:border-slate-200 has-[:disabled]:hover:bg-slate-50">
      <span className="relative inline-flex">
        <input
          checked={checked}
          className="peer sr-only"
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          type="checkbox"
        />
        <span className="block h-6 w-10 rounded-full border border-slate-300 bg-slate-200 transition peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-4 peer-focus-visible:ring-primary/15" />
        <span className="absolute left-0.5 top-0.5 block size-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
      </span>
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

/**
 * TextListEditor uses local state for the raw textarea value so that
 * the user can freely type, press Enter, and delete lines without the
 * textarea collapsing. Parsed (trimmed, non-empty) values are emitted
 * on **blur** only — not on every keystroke.
 */
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
  // Keep a local draft so the user's newlines/blanks aren't stripped mid-type.
  const [draft, setDraft] = React.useState(() => values.join('\n'))
  const isFocused = React.useRef(false)

  // Sync from parent when the parent values change externally (e.g. field switch)
  // but ONLY while the textarea is NOT focused, to avoid clobbering mid-edit text.
  React.useEffect(() => {
    if (!isFocused.current) {
      setDraft(values.join('\n'))
    }
  }, [values])

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        disabled={disabled}
        id={id}
        onChange={(event) => setDraft(event.target.value)}
        onFocus={() => {
          isFocused.current = true
        }}
        onBlur={() => {
          isFocused.current = false
          const parsed = parseLines(draft)
          // Ensure at least one option survives
          onChange(parsed.length ? parsed : values)
          // Re-sync draft to cleaned values
          const cleaned = parsed.length ? parsed : values
          setDraft(cleaned.join('\n'))
        }}
        placeholder={placeholder}
        value={draft}
      />
      {helperText ? <p className="text-xs leading-5 text-slate-500">{helperText}</p> : null}
    </div>
  )
}
