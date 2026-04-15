import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type FormField } from '@/lib/forms/schema'
import { Hint, NumberField } from './helpers'

type ShortAnswerField = Extract<FormField, { type: 'short_answer' }>

export function ShortAnswerConfig({
  disabled = false,
  field,
  onChange,
}: {
  disabled?: boolean
  field: ShortAnswerField
  onChange: (field: ShortAnswerField) => void
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="short-answer-placeholder">Placeholder</Label>
        <Input
          disabled={disabled}
          id="short-answer-placeholder"
          onChange={(event) =>
            onChange({
              ...field,
              config: {
                ...field.config,
                placeholder: event.target.value,
              },
            })
          }
          value={field.config.placeholder ?? ''}
        />
      </div>

      <NumberField
        disabled={disabled}
        helperText="Optional limit for short responses."
        id="short-answer-max-length"
        label="Maximum characters"
        max={500}
        min={1}
        onChange={(value) =>
          onChange({
            ...field,
            validation: value
              ? {
                  maxLength: value,
                }
              : undefined,
          })
        }
        placeholder="No limit"
        value={field.validation?.maxLength}
      />

      <Hint>Short answer fields are best for names, codes, or one-line prompts with a clear response.</Hint>
    </div>
  )
}
