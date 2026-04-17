import { FormField } from '@/lib/forms/schema'
import {
  ShortAnswerField,
  ParagraphField,
  MultipleChoiceField,
  CheckboxesField,
  DropdownField,
  LinearScaleField,
  MultipleChoiceGridField,
  CheckboxGridField,
  DateField,
  TimeField,
} from './FormFields'
import { FileUploadField } from './FileUploadField'

export function FormFieldRenderer({
  field,
  value,
  onChange,
  error,
  eventId,
  submissionId
}: {
  field: FormField
  value: any
  onChange: (value: any) => void
  error?: string
  eventId: string
  submissionId: string
}) {
  const props = { field, value, onChange, error }

  return (
    <div className="w-full">
      {(() => {
        switch (field.type) {
          case 'short_answer':
            return <ShortAnswerField {...props} />
          case 'paragraph':
            return <ParagraphField {...props} />
          case 'multiple_choice':
            return <MultipleChoiceField {...props} />
          case 'checkboxes':
            return <CheckboxesField {...props} />
          case 'dropdown':
            return <DropdownField {...props} />
          case 'linear_scale':
            return <LinearScaleField {...props} />
          case 'multiple_choice_grid':
            return <MultipleChoiceGridField {...props} />
          case 'checkbox_grid':
            return <CheckboxGridField {...props} />
          case 'date':
            return <DateField {...props} />
          case 'time':
            return <TimeField {...props} />
          case 'file_upload':
            return <FileUploadField {...props} eventId={eventId} submissionId={submissionId} />
          default:
            return null
        }
      })()}
      
      {error && (
        <p className="mt-2 text-sm text-rose-600">{error}</p>
      )}
    </div>
  )
}
