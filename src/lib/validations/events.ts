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

export const gradeConfigItemSchema = z
  .object({
    label: trimmedString
      .min(1, 'Grade label is required.')
      .max(24, 'Keep grade labels under 24 characters.'),
    min: z.coerce
      .number()
      .int()
      .min(0, 'Minimum score cannot be below 0.')
      .max(100, 'Minimum score cannot exceed 100.'),
    max: z.coerce
      .number()
      .int()
      .min(0, 'Maximum score cannot be below 0.')
      .max(100, 'Maximum score cannot exceed 100.'),
  })
  .superRefine((value, ctx) => {
    if (value.max < value.min) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Maximum score must be greater than or equal to minimum score.',
        path: ['max'],
      })
    }
  })

export const gradeConfigSchema = z
  .array(gradeConfigItemSchema)
  .min(1, 'Add at least one grade range.')
  .max(12, 'Use 12 grade ranges or fewer.')
  .superRefine((values, ctx) => {
    const normalized = values
      .map((item, index) => ({ ...item, index }))
      .sort((left, right) => left.min - right.min)

    for (let index = 1; index < normalized.length; index += 1) {
      const previous = normalized[index - 1]
      const current = normalized[index]

      if (current.min <= previous.max) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `This range overlaps with ${previous.label}.`,
          path: [current.index, 'min'],
        })
      }
    }
  })

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

function normalizeGradeConfigInput(value: unknown) {
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

  try {
    return JSON.parse(normalized)
  } catch {
    return value
  }
}

function normalizeTeacherFields(fields: string[]) {
  const unique = Array.from(new Set(fields))
  const ordered = teacherFieldOrder.filter((field) => unique.includes(field))

  return ordered
}

export function normalizeGradeConfig(value: unknown) {
  const parsed = gradeConfigSchema.safeParse(value)

  if (!parsed.success) {
    return defaultGradeConfig.map((item) => ({ ...item }))
  }

  return parsed.data.map((item) => ({ ...item }))
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
    grade_config: z.preprocess(normalizeGradeConfigInput, gradeConfigSchema.optional()),
    max_score: z.coerce
      .number()
      .int()
      .min(1, 'Maximum score must be at least 1.')
      .max(1000, 'Maximum score must be 1000 or less.')
      .optional(),
    expiration_date: z.preprocess(
      normalizeOptionalDate,
      z.string().datetime({ offset: true }).optional()
    ),
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
    grade_config: values.scoring_type === 'grade' ? values.grade_config ?? normalizeGradeConfig(undefined) : null,
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
    grade_config: formData.get('grade_config'),
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

/** Schema for updating event metadata (draft events only). */
export const eventUpdateSchema = z
  .object({
    title: trimmedString.min(3, 'Title must be at least 3 characters long.').optional(),
    description: z
      .preprocess(normalizeOptionalText, trimmedString.max(2000, 'Description is too long.'))
      .optional(),
    review_layers: z.coerce
      .number()
      .int()
      .min(1, 'Use at least 1 review layer.')
      .max(10, 'Use 10 review layers or fewer.')
      .optional(),
    scoring_type: scoringTypeSchema.optional(),
    grade_config: z.preprocess(normalizeGradeConfigInput, gradeConfigSchema.optional()),
    max_score: z.coerce
      .number()
      .int()
      .min(1, 'Maximum score must be at least 1.')
      .max(1000, 'Maximum score must be 1000 or less.')
      .optional(),
    expiration_date: z.preprocess(
      normalizeOptionalDate,
      z.string().datetime({ offset: true }).nullish()
    ),
    teacher_fields: z.array(teacherFieldSchema).optional(),
  })
  .superRefine((values, ctx) => {
    if (values.teacher_fields) {
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
    ...(values.teacher_fields ? { teacher_fields: normalizeTeacherFields(values.teacher_fields) } : {}),
    ...(values.grade_config ? { grade_config: values.grade_config } : {}),
    ...(values.scoring_type === 'numeric' && values.max_score ? { max_score: values.max_score } : {}),
  }))

export function getEventUpdatePayloadFromFormData(formData: FormData) {
  return {
    title: formData.get('title') || undefined,
    description: formData.get('description'),
    review_layers: formData.get('review_layers') || undefined,
    scoring_type: formData.get('scoring_type') || undefined,
    grade_config: formData.get('grade_config') || undefined,
    max_score: formData.get('max_score') || undefined,
    expiration_date: formData.get('expiration_date'),
    teacher_fields: formData.getAll('teacher_fields').length
      ? formData.getAll('teacher_fields')
      : undefined,
  }
}

export type EventCreateValues = z.infer<typeof eventCreateSchema>
export type EventUpdateValues = z.infer<typeof eventUpdateSchema>
export type EventListQueryValues = z.infer<typeof eventListQuerySchema>
export type GradeConfigItem = z.infer<typeof gradeConfigItemSchema>
