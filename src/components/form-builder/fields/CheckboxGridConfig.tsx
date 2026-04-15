import { type FormField } from '@/lib/forms/schema'
import { Hint, TextListEditor } from './helpers'

type CheckboxGridField = Extract<FormField, { type: 'checkbox_grid' }>

export function CheckboxGridConfig({
  disabled = false,
  field,
  onChange,
}: {
  disabled?: boolean
  field: CheckboxGridField
  onChange: (field: CheckboxGridField) => void
}) {
  return (
    <div className="space-y-4">
      <TextListEditor
        disabled={disabled}
        helperText="Each row becomes a statement or category to evaluate."
        id="checkbox-grid-rows"
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
        placeholder={'Support provided\nResources available\nFollow-up completed'}
        values={field.config.rows}
      />

      <TextListEditor
        disabled={disabled}
        helperText="Teachers can select multiple columns in a row if needed."
        id="checkbox-grid-columns"
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
        placeholder={'Yes\nPartially\nNot yet'}
        values={field.config.columns}
      />

      <Hint>Use checkbox grids when each row may need more than one selected column.</Hint>
    </div>
  )
}
