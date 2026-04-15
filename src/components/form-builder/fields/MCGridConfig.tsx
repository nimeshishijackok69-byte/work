import { type FormField } from '@/lib/forms/schema'
import { Hint, TextListEditor } from './helpers'

type MultipleChoiceGridField = Extract<FormField, { type: 'multiple_choice_grid' }>

export function MCGridConfig({
  disabled = false,
  field,
  onChange,
}: {
  disabled?: boolean
  field: MultipleChoiceGridField
  onChange: (field: MultipleChoiceGridField) => void
}) {
  return (
    <div className="space-y-4">
      <TextListEditor
        disabled={disabled}
        helperText="Each row becomes a statement or category to evaluate."
        id="mc-grid-rows"
        label="Rows"
        onChange={(rows) =>
          onChange({
            ...field,
            config: {
              ...field.config,
              rows: rows.length ? rows : ['Row 1'],
            },
          })
        }
        placeholder={'Quality\nTimeliness\nCommunication'}
        values={field.config.rows}
      />

      <TextListEditor
        disabled={disabled}
        helperText="Teachers choose exactly one column in each row."
        id="mc-grid-columns"
        label="Columns"
        onChange={(columns) =>
          onChange({
            ...field,
            config: {
              ...field.config,
              columns: columns.length ? columns : ['Column 1'],
            },
          })
        }
        placeholder={'Poor\nFair\nGood\nExcellent'}
        values={field.config.columns}
      />

      <Hint>Use multiple choice grids when each row should allow only one selected rating.</Hint>
    </div>
  )
}
