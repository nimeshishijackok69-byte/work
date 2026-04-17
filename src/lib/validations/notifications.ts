import { z } from 'zod'

const booleanLike = z.preprocess((value) => {
  if (value === 'true') return true
  if (value === 'false') return false
  return value
}, z.boolean().optional())

export const notificationListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  is_read: booleanLike,
})

export type NotificationListQueryValues = z.infer<typeof notificationListQuerySchema>
