import { type FormField } from '@/lib/forms/schema'
import { Hint, TextListEditor } from './helpers'

type DropdownField = Extract<FormField, { type: 'dropdown' }>

export function DropdownConfig({
  disabled = false,
  field,
  onChange,
}: {
  disabled?: boolean
  field: DropdownField
  onChange: (field: DropdownField) => void
}) {
  return (
    <div className="space-y-4">
      <TextListEditor
        disabled={disabled}
        helperText="Use one line per option."
        id="dropdown-options"
        label="Options"
        onChange={(options) =>
          onChange({
            ...field,
            config: {
              options: options.length ? options : ['Option 1'],
            },
          })
        }
        placeholder={'Option 1\nOption 2\nOption 3'}
        values={field.config.options}
      />

      <Hint>Dropdowns keep longer option lists compact in the teacher-facing form.</Hint>
    </div>
  )
}
