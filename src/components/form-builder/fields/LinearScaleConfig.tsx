import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type FormField } from '@/lib/forms/schema'
import { Hint, NumberField } from './helpers'

type LinearScaleField = Extract<FormField, { type: 'linear_scale' }>

export function LinearScaleConfig({
  disabled = false,
  field,
  onChange,
}: {
  disabled?: boolean
  field: LinearScaleField
  onChange: (field: LinearScaleField) => void
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          disabled={disabled}
          id="linear-scale-min"
          label="Minimum value"
          max={9}
          min={0}
          onChange={(value) =>
            onChange({
              ...field,
              config: {
                ...field.config,
                min: value ?? 0,
              },
            })
          }
          value={field.config.min}
        />

        <NumberField
          disabled={disabled}
          id="linear-scale-max"
          label="Maximum value"
          max={10}
          min={1}
          onChange={(value) =>
            onChange({
              ...field,
              config: {
                ...field.config,
                max: value ?? 1,
              },
            })
          }
          value={field.config.max}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="linear-scale-min-label">Minimum label</Label>
          <Input
            disabled={disabled}
            id="linear-scale-min-label"
            onChange={(event) =>
              onChange({
                ...field,
                config: {
                  ...field.config,
                  minLabel: event.target.value,
                },
              })
            }
            value={field.config.minLabel ?? ''}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="linear-scale-max-label">Maximum label</Label>
          <Input
            disabled={disabled}
            id="linear-scale-max-label"
            onChange={(event) =>
              onChange({
                ...field,
                config: {
                  ...field.config,
                  maxLabel: event.target.value,
                },
              })
            }
            value={field.config.maxLabel ?? ''}
          />
        </div>
      </div>

      <Hint>Linear scales work well for ratings, rubrics, and confidence checks.</Hint>
    </div>
  )
}
