import { z } from 'zod'
import { registerSchema } from '@/lib/validations/auth'

const uuid = z.string().uuid('Use a valid identifier.')

export const reviewerCreateSchema = registerSchema
  .pick({
    department: true,
    email: true,
    name: true,
    password: true,
    phone: true,
    specialization: true,
  })
  .transform((values) => values)

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

export type ReviewerCreateValues = z.infer<typeof reviewerCreateSchema>
export type AssignReviewsValues = z.infer<typeof assignReviewsSchema>
export type SubmitReviewValues = z.infer<typeof submitReviewSchema>
export type AdvanceReviewsValues = z.infer<typeof advanceReviewsSchema>
