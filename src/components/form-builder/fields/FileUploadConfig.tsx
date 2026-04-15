import { type FormField } from '@/lib/forms/schema'
import { Hint, NumberField, TextListEditor, ToggleRow } from './helpers'

type FileUploadField = Extract<FormField, { type: 'file_upload' }>

export function FileUploadConfig({
  disabled = false,
  field,
  onChange,
}: {
  disabled?: boolean
  field: FileUploadField
  onChange: (field: FileUploadField) => void
}) {
  return (
    <div className="space-y-4">
      <ToggleRow
        checked={field.config.multiple}
        disabled={disabled}
        label="Allow multiple files"
        onChange={(multiple) =>
          onChange({
            ...field,
            config: {
              ...field.config,
              multiple,
              maxFiles: multiple ? Math.max(field.config.maxFiles, 2) : 1,
            },
          })
        }
      />

      <NumberField
        disabled={disabled}
        helperText="Maximum number of files a teacher can attach."
        id="file-upload-max-files"
        label="Maximum files"
        max={20}
        min={1}
        onChange={(value) =>
          onChange({
            ...field,
            config: {
              ...field.config,
              maxFiles: value ?? 1,
            },
          })
        }
        value={field.config.maxFiles}
      />

      <TextListEditor
        disabled={disabled}
        helperText="Optional list of accepted MIME types or extensions, one per line."
        id="file-upload-types"
        label="Allowed file types"
        onChange={(allowedTypes) =>
          onChange({
            ...field,
            config: {
              ...field.config,
              allowedTypes,
            },
          })
        }
        placeholder={'application/pdf\nimage/png\n.docx'}
        values={field.config.allowedTypes}
      />

      <Hint>File uploads will still respect the event-level size limit and storage pipeline when public uploads are added.</Hint>
    </div>
  )
}
