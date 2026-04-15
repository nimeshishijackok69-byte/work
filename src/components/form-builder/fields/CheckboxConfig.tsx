import { type FormField } from '@/lib/forms/schema'
import { Hint, TextListEditor } from './helpers'

type CheckboxField = Extract<FormField, { type: 'checkboxes' }>

export function CheckboxConfig({
  disabled = false,
  field,
  onChange,
}: {
  disabled?: boolean
  field: CheckboxField
  onChange: (field: CheckboxField) => void
}) {
  return (
    <div className="space-y-4">
      <TextListEditor
        disabled={disabled}
        helperText="Use one line per option."
        id="checkbox-options"
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

      <Hint>Checkboxes allow teachers to choose multiple answers instead of only one.</Hint>
    </div>
  )
}
