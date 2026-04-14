'use server'

import { AuthError } from 'next-auth'
import { signIn } from '@/lib/auth/auth'
import { loginSchema } from '@/lib/validations/auth'

export interface LoginFormState {
  errors?: {
    email?: string[]
    password?: string[]
  }
  message?: string
}

export async function loginAction(
  _previousState: LoginFormState | undefined,
  formData: FormData
) {
  const validatedFields = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Please fix the highlighted fields and try again.',
    } satisfies LoginFormState
  }

  try {
    await signIn('credentials', {
      email: validatedFields.data.email,
      password: validatedFields.data.password,
      redirectTo: '/',
    })
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === 'CredentialsSignin') {
        return {
          message: 'Invalid email or password.',
        } satisfies LoginFormState
      }

      return {
        message: 'Unable to sign in right now. Please try again.',
      } satisfies LoginFormState
    }

    throw error
  }
}
