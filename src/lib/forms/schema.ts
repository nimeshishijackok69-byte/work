import { z } from 'zod'

const trimmedString = z.string().trim()

export const fieldTypeSchema = z.enum([
  'short_answer',
  'paragraph',
  'multiple_choice',
  'checkboxes',
  'dropdown',
  'file_upload',
  'linear_scale',
  'multiple_choice_grid',
  'checkbox_grid',
  'date',
  'time',
  'section_header',
])

export type FieldType = z.infer<typeof fieldTypeSchema>

const baseFieldSchema = z.object({
  id: trimmedString.min(1),
  label: trimmedString.min(1).max(200),
  description: trimmedString.max(1000).optional(),
  required: z.boolean().default(false),
})

const optionListSchema = z.array(trimmedString.min(1)).min(1)
const gridValuesSchema = z.array(trimmedString.min(1)).min(1)

const shortAnswerFieldSchema = baseFieldSchema.extend({
  type: z.literal('short_answer'),
})

const paragraphFieldSchema = baseFieldSchema.extend({
  type: z.literal('paragraph'),
})

const multipleChoiceFieldSchema = baseFieldSchema.extend({
  type: z.literal('multiple_choice'),
  config: z.object({
    options: optionListSchema,
  }),
})

const checkboxesFieldSchema = baseFieldSchema.extend({
  type: z.literal('checkboxes'),
  config: z.object({
    options: optionListSchema,
  }),
})

const dropdownFieldSchema = baseFieldSchema.extend({
  type: z.literal('dropdown'),
  config: z.object({
    options: optionListSchema,
  }),
})

const fileUploadFieldSchema = baseFieldSchema.extend({
  type: z.literal('file_upload'),
  config: z.object({
    multiple: z.boolean().default(false),
    maxFiles: z.number().int().min(1).max(20).default(1),
    allowedTypes: z.array(trimmedString.min(1)).default([]),
  }),
})

const linearScaleFieldSchema = baseFieldSchema.extend({
  type: z.literal('linear_scale'),
  config: z
    .object({
      min: z.number().int().min(0).max(9).default(1),
      max: z.number().int().min(1).max(10).default(5),
      minLabel: trimmedString.max(60).optional(),
      maxLabel: trimmedString.max(60).optional(),
    })
    .refine((value) => value.max > value.min, {
      message: 'Linear scale max must be greater than min.',
      path: ['max'],
    }),
})

const multipleChoiceGridFieldSchema = baseFieldSchema.extend({
  type: z.literal('multiple_choice_grid'),
  config: z.object({
    rows: gridValuesSchema,
    columns: gridValuesSchema,
  }),
})

const checkboxGridFieldSchema = baseFieldSchema.extend({
  type: z.literal('checkbox_grid'),
  config: z.object({
    rows: gridValuesSchema,
    columns: gridValuesSchema,
  }),
})

const dateFieldSchema = baseFieldSchema.extend({
  type: z.literal('date'),
})

const timeFieldSchema = baseFieldSchema.extend({
  type: z.literal('time'),
})

const sectionHeaderFieldSchema = z.object({
  id: trimmedString.min(1),
  type: z.literal('section_header'),
  label: trimmedString.min(1).max(200),
  description: trimmedString.max(1000).optional(),
  required: z.literal(false).default(false),
})

export const formFieldSchema = z.discriminatedUnion('type', [
  shortAnswerFieldSchema,
  paragraphFieldSchema,
  multipleChoiceFieldSchema,
  checkboxesFieldSchema,
  dropdownFieldSchema,
  fileUploadFieldSchema,
  linearScaleFieldSchema,
  multipleChoiceGridFieldSchema,
  checkboxGridFieldSchema,
  dateFieldSchema,
  timeFieldSchema,
  sectionHeaderFieldSchema,
])

export const formSchemaSchema = z.object({
  fields: z.array(formFieldSchema).default([]),
})

export type FormField = z.infer<typeof formFieldSchema>
export type FormSchema = z.infer<typeof formSchemaSchema>

export const fieldTypeLabels: Record<FieldType, string> = {
  short_answer: 'Short answer',
  paragraph: 'Paragraph',
  multiple_choice: 'Multiple choice',
  checkboxes: 'Checkboxes',
  dropdown: 'Dropdown',
  file_upload: 'File upload',
  linear_scale: 'Linear scale',
  multiple_choice_grid: 'Multiple choice grid',
  checkbox_grid: 'Checkbox grid',
  date: 'Date',
  time: 'Time',
  section_header: 'Section header',
}

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `field_${Math.random().toString(36).slice(2, 10)}`
}

export function cloneField<T extends FormField>(field: T): T {
  return JSON.parse(JSON.stringify(field)) as T
}

export function cloneFields(fields: FormField[]) {
  return fields.map((field) => cloneField(field))
}

export function createDefaultField(type: FieldType): FormField {
  const id = createId()

  switch (type) {
    case 'short_answer':
      return {
        id,
        type,
        label: 'Untitled short answer',
        description: 'Add a short response prompt.',
        required: false,
      }
    case 'paragraph':
      return {
        id,
        type,
        label: 'Untitled paragraph',
        description: 'Invite a longer written response.',
        required: false,
      }
    case 'multiple_choice':
      return {
        id,
        type,
        label: 'Untitled multiple choice',
        description: 'Choose one option.',
        required: false,
        config: {
          options: ['Option 1', 'Option 2', 'Option 3'],
        },
      }
    case 'checkboxes':
      return {
        id,
        type,
        label: 'Untitled checkbox list',
        description: 'Choose one or more options.',
        required: false,
        config: {
          options: ['Option 1', 'Option 2', 'Option 3'],
        },
      }
    case 'dropdown':
      return {
        id,
        type,
        label: 'Untitled dropdown',
        description: 'Select one option from the list.',
        required: false,
        config: {
          options: ['Option 1', 'Option 2', 'Option 3'],
        },
      }
    case 'file_upload':
      return {
        id,
        type,
        label: 'Upload supporting files',
        description: 'Collect one or more supporting documents.',
        required: false,
        config: {
          multiple: false,
          maxFiles: 1,
          allowedTypes: [],
        },
      }
    case 'linear_scale':
      return {
        id,
        type,
        label: 'Rate on a scale',
        description: 'Use a simple numeric range.',
        required: false,
        config: {
          min: 1,
          max: 5,
          minLabel: 'Low',
          maxLabel: 'High',
        },
      }
    case 'multiple_choice_grid':
      return {
        id,
        type,
        label: 'Untitled multiple choice grid',
        description: 'Choose one option in each row.',
        required: false,
        config: {
          rows: ['Row 1', 'Row 2'],
          columns: ['Column 1', 'Column 2'],
        },
      }
    case 'checkbox_grid':
      return {
        id,
        type,
        label: 'Untitled checkbox grid',
        description: 'Choose one or more options in each row.',
        required: false,
        config: {
          rows: ['Row 1', 'Row 2'],
          columns: ['Column 1', 'Column 2'],
        },
      }
    case 'date':
      return {
        id,
        type,
        label: 'Select a date',
        description: 'Capture a calendar date.',
        required: false,
      }
    case 'time':
      return {
        id,
        type,
        label: 'Select a time',
        description: 'Capture a time of day.',
        required: false,
      }
    case 'section_header':
      return {
        id,
        type,
        label: 'New section',
        description: 'Use section headers to break long forms into clear steps.',
        required: false,
      }
  }
}

export function duplicateField(field: FormField): FormField {
  const clone = cloneField(field)
  clone.id = createId()
  clone.label = `${field.label} copy`
  return clone
}

export function normalizeFormSchema(input: unknown): FormSchema {
  const parsed = formSchemaSchema.safeParse(input)

  if (!parsed.success) {
    return {
      fields: [],
    }
  }

  return {
    fields: cloneFields(parsed.data.fields),
  }
}
