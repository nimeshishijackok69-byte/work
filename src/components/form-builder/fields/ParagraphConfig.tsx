import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type FormField } from '@/lib/forms/schema'
import { Hint, NumberField } from './helpers'

type ParagraphField = Extract<FormField, { type: 'paragraph' }>

export function ParagraphConfig({
  disabled = false,
  field,
  onChange,
}: {
  disabled?: boolean
  field: ParagraphField
  onChange: (field: ParagraphField) => void
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="paragraph-placeholder">Placeholder</Label>
        <Input
          disabled={disabled}
          id="paragraph-placeholder"
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

      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          disabled={disabled}
          helperText="How tall the response area should look in the public form."
          id="paragraph-rows"
          label="Visible rows"
          max={10}
          min={3}
          onChange={(value) =>
            onChange({
              ...field,
              config: {
                ...field.config,
                rows: value ?? 4,
              },
            })
          }
          value={field.config.rows}
        />

        <NumberField
          disabled={disabled}
          helperText="Optional limit for longer responses."
          id="paragraph-max-length"
          label="Maximum characters"
          max={5000}
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
      </div>

      <Hint>Paragraph fields are ideal for written explanations, reflections, and narrative answers.</Hint>
    </div>
  )
}
