import { z } from 'zod'

const trimmedString = z.string().trim()

export const eventStatusSchema = z.enum(['draft', 'published', 'closed'])
export const scoringTypeSchema = z.enum(['numeric', 'grade'])
export const teacherFieldSchema = z.enum(['name', 'email', 'school_name', 'phone'])

export const defaultTeacherFields = ['name', 'email', 'school_name'] as const
const teacherFieldOrder = ['name', 'email', 'school_name', 'phone'] as const

export const defaultGradeConfig = [
  { label: 'A', min: 90, max: 100 },
  { label: 'B', min: 80, max: 89 },
  { label: 'C', min: 70, max: 79 },
  { label: 'D', min: 60, max: 69 },
  { label: 'F', min: 0, max: 59 },
] as const

function normalizeOptionalText(value: unknown) {
  if (typeof value !== 'string') {
    return value
  }

  const normalized = value.trim()
  return normalized.length ? normalized : undefined
}

function normalizeOptionalDate(value: unknown) {
  if (value == null) {
    return undefined
  }

  if (typeof value !== 'string') {
    return value
  }

  const normalized = value.trim()

  if (!normalized) {
    return undefined
  }

  if (/[zZ]|[+-]\d{2}:\d{2}$/.test(normalized)) {
    return normalized
  }

  const parsed = new Date(normalized)

  if (Number.isNaN(parsed.getTime())) {
    return normalized
  }

  return parsed.toISOString()
}

function normalizeTeacherFields(fields: string[]) {
  const unique = Array.from(new Set(fields))
  const ordered = teacherFieldOrder.filter((field) => unique.includes(field))

  return ordered
}

export const eventCreateSchema = z
  .object({
    title: trimmedString.min(3, 'Title must be at least 3 characters long.'),
    description: z
      .preprocess(normalizeOptionalText, trimmedString.max(2000, 'Description is too long.'))
      .optional(),
    review_layers: z.coerce
      .number()
      .int()
      .min(1, 'Use at least 1 review layer.')
      .max(10, 'Use 10 review layers or fewer.'),
    scoring_type: scoringTypeSchema,
    max_score: z.coerce
      .number()
      .int()
      .min(1, 'Maximum score must be at least 1.')
      .max(1000, 'Maximum score must be 1000 or less.')
      .optional(),
    expiration_date: z
      .preprocess(normalizeOptionalDate, z.string().datetime({ offset: true }))
      .optional(),
    teacher_fields: z.array(teacherFieldSchema).default([...defaultTeacherFields]),
  })
  .superRefine((values, ctx) => {
    if (!values.teacher_fields.includes('name')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Teacher name must stay enabled.',
        path: ['teacher_fields'],
      })
    }

    if (!values.teacher_fields.includes('email')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Teacher email must stay enabled.',
        path: ['teacher_fields'],
      })
    }

    if (values.expiration_date) {
      const expirationDate = new Date(values.expiration_date)

      if (expirationDate.getTime() <= Date.now()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Expiration must be in the future.',
          path: ['expiration_date'],
        })
      }
    }
  })
  .transform((values) => ({
    ...values,
    description: values.description ?? undefined,
    expiration_date: values.expiration_date ?? null,
    max_score: values.scoring_type === 'numeric' ? values.max_score ?? 100 : 100,
    teacher_fields: normalizeTeacherFields(values.teacher_fields),
  }))

export const eventListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  status: eventStatusSchema.optional(),
})

export function getEventCreatePayloadFromFormData(formData: FormData) {
  return {
    title: formData.get('title'),
    description: formData.get('description'),
    review_layers: formData.get('review_layers'),
    scoring_type: formData.get('scoring_type'),
    max_score: formData.get('max_score'),
    expiration_date: formData.get('expiration_date'),
    teacher_fields: formData.getAll('teacher_fields'),
  }
}

export function getEventListPayloadFromSearchParams(searchParams: URLSearchParams) {
  return {
    page: searchParams.get('page') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
    status: searchParams.get('status') ?? undefined,
  }
}

export type EventCreateValues = z.infer<typeof eventCreateSchema>
export type EventListQueryValues = z.infer<typeof eventListQuerySchema>
