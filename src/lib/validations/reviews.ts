import { z } from 'zod'

const uuid = z.string().uuid('Use a valid identifier.')
const trimmedString = z.string().trim()
const emailField = z.email({ error: 'Enter a valid email address.' }).trim()
const nameField = trimmedString.min(2, 'Name must be at least 2 characters long.')
const passwordField = trimmedString
  .min(8, 'Password must be at least 8 characters long.')
  .regex(/[A-Za-z]/, 'Password must include at least one letter.')
  .regex(/[0-9]/, 'Password must include at least one number.')
const phoneField = trimmedString.max(30, 'Phone number is too long.').optional().or(z.literal(''))
const departmentField = trimmedString.max(120, 'Department name is too long.').optional().or(z.literal(''))
const specializationField = trimmedString
  .max(120, 'Specialization is too long.')
  .optional()
  .or(z.literal(''))
const optionalFilterString = z
  .string()
  .trim()
  .max(120)
  .optional()
  .transform((value) => value || undefined)
const optionalLayer = z.preprocess(
  (value) => (value === '' || value === 'all' || value === null ? undefined : value),
  z.coerce.number().int().min(1).max(10).optional()
)
const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(25).default(10),
})

export const reviewerCreateSchema = z
  .object({
    department: departmentField,
    email: emailField,
    name: nameField,
    password: passwordField,
    phone: phoneField,
    specialization: specializationField,
  })
  .transform((values) => ({
    ...values,
    department: values.department || undefined,
    phone: values.phone || undefined,
    specialization: values.specialization || undefined,
  }))

export const reviewerUpdateSchema = z
  .object({
    department: departmentField,
    email: emailField,
    name: nameField,
    password: passwordField.optional().or(z.literal('')),
    phone: phoneField,
    specialization: specializationField,
  })
  .transform((values) => ({
    ...values,
    department: values.department || undefined,
    phone: values.phone || undefined,
    password: values.password || undefined,
    specialization: values.specialization || undefined,
  }))

export const assignReviewsSchema = z.object({
  event_id: uuid,
  assignments: z
    .array(
      z.object({
        submission_id: uuid,
        reviewer_id: uuid,
        layer: z.coerce.number().int().min(1).max(10),
        is_override: z.coerce.boolean().optional(),
      })
    )
    .min(1, 'Add at least one assignment.'),
})

export const submitReviewSchema = z
  .object({
    assignment_id: uuid,
    score: z.coerce.number().min(0).max(1000).optional(),
    grade: z.string().trim().max(40).optional(),
    notes: z.string().trim().max(5000).optional().or(z.literal('')),
  })
  .transform((values) => ({
    ...values,
    grade: values.grade || undefined,
    notes: values.notes || undefined,
  }))

export const advanceReviewsSchema = z.object({
  event_id: uuid,
  layer: z.coerce.number().int().min(1).max(10),
  advance: z.array(uuid).default([]),
  eliminate: z.array(uuid).default([]),
})

export const reviewWorkspaceQuerySchema = paginationSchema.extend({
  q: optionalFilterString,
  status: z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z.enum(['draft', 'submitted', 'in_review', 'reviewed', 'advanced', 'eliminated']).optional()
  ),
  layer: optionalLayer,
})

export const reviewerAssignmentsQuerySchema = paginationSchema.extend({
  q: optionalFilterString,
  event_id: uuid.optional().or(z.literal('')).transform((value) => value || undefined),
  layer: optionalLayer,
  status: z.preprocess(
    (value) => (value === '' || value === null ? undefined : value),
    z.enum(['pending', 'in_progress', 'completed']).optional()
  ),
})

export type ReviewerCreateValues = z.infer<typeof reviewerCreateSchema>
export type ReviewerUpdateValues = z.infer<typeof reviewerUpdateSchema>
export type AssignReviewsValues = z.infer<typeof assignReviewsSchema>
export type SubmitReviewValues = z.infer<typeof submitReviewSchema>
export type AdvanceReviewsValues = z.infer<typeof advanceReviewsSchema>
export type ReviewWorkspaceQueryValues = z.infer<typeof reviewWorkspaceQuerySchema>
export type ReviewerAssignmentsQueryValues = z.infer<typeof reviewerAssignmentsQuerySchema>
