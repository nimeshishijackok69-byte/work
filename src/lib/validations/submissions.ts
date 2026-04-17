import { z } from 'zod'
import type { FormField, FormSchema } from '@/lib/forms/schema'

const trimmedString = z.string().trim()

/* ------------------------------------------------------------------ */
/*  Teacher info schema                                               */
/* ------------------------------------------------------------------ */

export const teacherInfoSchema = z.object({
  name: trimmedString.min(1, 'Your name is required.').max(200),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .email('Enter a valid email address.'),
  phone: trimmedString.max(20).optional().or(z.literal('')),
  school_name: trimmedString.max(300).optional().or(z.literal('')),
})

export type TeacherInfoValues = z.infer<typeof teacherInfoSchema>

/* ------------------------------------------------------------------ */
/*  Dynamic form response validation                                  */
/* ------------------------------------------------------------------ */

/**
 * Build a Zod schema dynamically from the event's `form_schema` definition
 * so that every required field, option-membership, maxLength, etc. is
 * validated server-side before we accept a submission.
 */
export function buildFormResponseSchema(formSchema: FormSchema) {
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const field of formSchema.fields) {
    if (field.type === 'section_header') continue

    shape[field.id] = buildFieldValidator(field)
  }

  return z.object(shape)
}

function buildFieldValidator(field: FormField): z.ZodTypeAny {
  switch (field.type) {
    case 'short_answer': {
      let schema = z.string().trim()
      if (field.validation?.maxLength) {
        schema = schema.max(field.validation.maxLength, `Maximum ${field.validation.maxLength} characters.`)
      }
      return field.required
        ? schema.min(1, `${field.label} is required.`)
        : schema.optional().or(z.literal(''))
    }

    case 'paragraph': {
      let schema = z.string().trim()
      if (field.validation?.maxLength) {
        schema = schema.max(field.validation.maxLength, `Maximum ${field.validation.maxLength} characters.`)
      }
      return field.required
        ? schema.min(1, `${field.label} is required.`)
        : schema.optional().or(z.literal(''))
    }

    case 'multiple_choice': {
      const schema = z.enum(field.config.options as [string, ...string[]])
      return field.required
        ? schema
        : schema.optional().or(z.literal(''))
    }

    case 'checkboxes': {
      const schema = z
        .array(z.enum(field.config.options as [string, ...string[]]))
      return field.required
        ? schema.min(1, `Select at least one option for ${field.label}.`)
        : schema.optional().default([])
    }

    case 'dropdown': {
      const schema = z.enum(field.config.options as [string, ...string[]])
      return field.required
        ? schema
        : schema.optional().or(z.literal(''))
    }

    case 'file_upload': {
      // File uploads are validated separately via the storage layer.
      // Here we just track the metadata array.
      const schema = z.array(
        z.object({
          file_url: z.string().min(1),
          file_name: z.string().min(1),
          file_size: z.number().int().min(0),
        })
      )
      return field.required
        ? schema.min(1, `Upload at least one file for ${field.label}.`)
        : schema.optional().default([])
    }

    case 'linear_scale': {
      const schema = z.coerce
        .number()
        .int()
        .min(field.config.min)
        .max(field.config.max)
      return field.required
        ? schema
        : schema.optional().nullable()
    }

    case 'multiple_choice_grid': {
      // { "Row 1": "Column A", "Row 2": "Column B", … }
      const rowSchema = z.enum(field.config.columns as [string, ...string[]])
      const schema = z.record(z.string(), field.required ? rowSchema : rowSchema.optional().or(z.literal('')))
      return schema
    }

    case 'checkbox_grid': {
      // { "Row 1": ["Column A", "Column B"], … }
      const colSchema = z.array(z.enum(field.config.columns as [string, ...string[]]))
      const schema = z.record(
        z.string(),
        field.required ? colSchema.min(1, `Select at least one option per row.`) : colSchema.optional().default([])
      )
      return schema
    }

    case 'date': {
      const schema = z.string().trim()
      return field.required
        ? schema.min(1, `${field.label} is required.`)
        : schema.optional().or(z.literal(''))
    }

    case 'time': {
      const schema = z.string().trim()
      return field.required
        ? schema.min(1, `${field.label} is required.`)
        : schema.optional().or(z.literal(''))
    }

    default:
      return z.unknown().optional()
  }
}

/* ------------------------------------------------------------------ */
/*  Submission request schema                                         */
/* ------------------------------------------------------------------ */

export const submissionRequestSchema = z.object({
  slug: z.string().trim().min(1, 'Form slug is required.'),
  teacherInfo: teacherInfoSchema,
  formData: z.record(z.string(), z.unknown()),
  isDraft: z.boolean().default(false),
})

export type SubmissionRequestValues = z.infer<typeof submissionRequestSchema>

export const draftUpdateRequestSchema = z.object({
  draftToken: z.string().trim().min(1, 'Draft token is required.'),
  formData: z.record(z.string(), z.unknown()),
  teacherInfo: teacherInfoSchema.optional(),
})

export type DraftUpdateRequestValues = z.infer<typeof draftUpdateRequestSchema>
