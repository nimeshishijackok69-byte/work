import { type FormField } from '@/lib/forms/schema'
import { Hint } from './helpers'

type TimeField = Extract<FormField, { type: 'time' }>

export function TimeConfig({
  field,
}: {
  disabled?: boolean
  field: TimeField
  onChange: (field: TimeField) => void
}) {
  return (
    <div className="space-y-4">
      <Hint>
        This field uses the browser&apos;s native time picker. Use the label and description to explain
        the expected timezone or preferred time format if needed.
      </Hint>
      {field.description ? (
        <p className="text-xs leading-5 text-slate-500">
          Current helper copy: <span className="font-medium text-slate-700">{field.description}</span>
        </p>
      ) : null}
    </div>
  )
}
