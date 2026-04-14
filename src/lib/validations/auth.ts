import { z } from 'zod'

const trimmedString = z.string().trim()

export const loginSchema = z.object({
  email: z.email({ error: 'Enter a valid email address.' }).trim(),
  password: trimmedString.min(1, 'Password is required.'),
})

export const registerSchema = z
  .object({
    email: z.email({ error: 'Enter a valid email address.' }).trim(),
    password: trimmedString
      .min(8, 'Password must be at least 8 characters long.')
      .regex(/[A-Za-z]/, 'Password must include at least one letter.')
      .regex(/[0-9]/, 'Password must include at least one number.'),
    name: trimmedString.min(2, 'Name must be at least 2 characters long.'),
    role: z.enum(['admin', 'reviewer']).default('admin'),
    phone: trimmedString.max(30, 'Phone number is too long.').optional().or(z.literal('')),
    department: trimmedString
      .max(120, 'Department name is too long.')
      .optional()
      .or(z.literal('')),
    specialization: trimmedString
      .max(120, 'Specialization is too long.')
      .optional()
      .or(z.literal('')),
  })
  .transform((values) => ({
    ...values,
    phone: values.phone || undefined,
    department: values.department || undefined,
    specialization: values.specialization || undefined,
  }))

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>
