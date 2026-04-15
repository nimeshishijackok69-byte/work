import { z } from 'zod'

export const testEmailTemplateSchema = z.enum([
  'submission-confirmation',
  'reviewer-assignment',
])

export const testEmailSchema = z.object({
  template: testEmailTemplateSchema.default('submission-confirmation'),
  to: z.email().optional(),
})

export type TestEmailValues = z.infer<typeof testEmailSchema>
