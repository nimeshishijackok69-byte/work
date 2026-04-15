import { type FormField } from '@/lib/forms/schema'
import { Hint } from './helpers'

type DateField = Extract<FormField, { type: 'date' }>

export function DateConfig({
  field,
}: {
  disabled?: boolean
  field: DateField
  onChange: (field: DateField) => void
}) {
  return (
    <div className="space-y-4">
      <Hint>
        This field uses the browser&apos;s native date picker on the public form. Use the label and
        description to clarify the expected date.
      </Hint>
      {field.description ? (
        <p className="text-xs leading-5 text-slate-500">
          Current helper copy: <span className="font-medium text-slate-700">{field.description}</span>
        </p>
      ) : null}
    </div>
  )
}
