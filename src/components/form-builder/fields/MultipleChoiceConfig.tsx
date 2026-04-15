import { type FormField } from '@/lib/forms/schema'
import { Hint, TextListEditor } from './helpers'

type MultipleChoiceField = Extract<FormField, { type: 'multiple_choice' }>

export function MultipleChoiceConfig({
  disabled = false,
  field,
  onChange,
}: {
  disabled?: boolean
  field: MultipleChoiceField
  onChange: (field: MultipleChoiceField) => void
}) {
  return (
    <div className="space-y-4">
      <TextListEditor
        disabled={disabled}
        helperText="Use one line per option."
        id="multiple-choice-options"
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

      <Hint>Teachers will be able to choose exactly one option for this question.</Hint>
    </div>
  )
}
