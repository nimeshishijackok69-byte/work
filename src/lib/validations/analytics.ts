import { z } from 'zod'

const isoDate = z
  .string()
  .trim()
  .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), 'Use a valid ISO date.')
  .transform((value) => (value ? new Date(value).toISOString() : undefined))

export const submissionsOverTimeQuerySchema = z.object({
  from: isoDate.optional(),
  to: isoDate.optional(),
  interval: z
    .preprocess(
      (value) => (value === '' || value === null ? undefined : value),
      z.enum(['day', 'week', 'month']).default('day')
    )
    .optional(),
})

export const analyticsExportQuerySchema = z.object({
  type: z.enum(['submissions', 'reviews']),
})

export type SubmissionsOverTimeQueryValues = z.infer<typeof submissionsOverTimeQuerySchema>
export type AnalyticsExportQueryValues = z.infer<typeof analyticsExportQuerySchema>
