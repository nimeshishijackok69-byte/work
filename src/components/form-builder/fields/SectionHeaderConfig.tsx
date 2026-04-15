import { type FormField } from '@/lib/forms/schema'
import { Hint } from './helpers'

type SectionHeaderField = Extract<FormField, { type: 'section_header' }>

export function SectionHeaderConfig({
  field,
}: {
  disabled?: boolean
  field: SectionHeaderField
  onChange: (field: SectionHeaderField) => void
}) {
  return (
    <div className="space-y-4">
      <Hint>
        Section headers break long forms into clear steps. Keep the title short and use the description
        to set context for the questions that follow.
      </Hint>
      {field.description ? (
        <p className="text-xs leading-5 text-slate-500">
          Teachers will see this helper copy directly under the section title.
        </p>
      ) : null}
    </div>
  )
}
