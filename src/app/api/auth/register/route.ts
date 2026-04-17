import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'
import { registerSchema } from '@/lib/validations/auth'
import { checkRateLimit, getClientIp } from '@/lib/utils/rate-limit'
import { logger } from '@/lib/utils/logger'

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    const rate = checkRateLimit({
      bucket: 'auth-register',
      identifier: ip,
      max: 5,
      windowMs: 60_000,
    })
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many registration attempts. Please wait and try again.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      )
    }

    const body = await request.json()
    const validatedFields = registerSchema.safeParse(body)

    if (!validatedFields.success) {
      return NextResponse.json(
        {
          error: 'Invalid registration payload.',
          details: validatedFields.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const session = await auth()
    const supabase = createAdminClient()

    const { count, error: adminCountError } = await supabase
      .from('admin_profile')
      .select('id', { count: 'exact', head: true })

    if (adminCountError) {
      logger.error('auth.register.count_admins_failed', adminCountError)
      return NextResponse.json(
        { error: 'Unable to verify registration permissions.' },
        { status: 500 }
      )
    }

    const adminCount = count ?? 0
    const isAuthenticatedAdmin = session?.user?.role === 'admin'
    const isBootstrapRegistration = adminCount === 0
    const { department, email, name, password, phone, role, specialization } =
      validatedFields.data

    if (!isAuthenticatedAdmin) {
      if (!isBootstrapRegistration) {
        return NextResponse.json(
          { error: 'Only authenticated admins can create new accounts.' },
          { status: 403 }
        )
      }

      if (role !== 'admin') {
        return NextResponse.json(
          { error: 'The first account created must be an admin account.' },
          { status: 403 }
        )
      }
    }

    const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role,
      },
    })

    if (createUserError || !createdUser.user) {
      logger.error('auth.register.create_user_failed', createUserError)
      return NextResponse.json(
        { error: createUserError?.message ?? 'Unable to create the account.' },
        { status: 400 }
      )
    }

    if (role === 'admin') {
      const adminProfile: Database['public']['Tables']['admin_profile']['Insert'] = {
        auth_user_id: createdUser.user.id,
        email,
        name,
        role: 'admin',
      }

      const { error: insertAdminError } = await supabase
        .from('admin_profile')
        .insert(adminProfile as never)

      if (insertAdminError) {
        await supabase.auth.admin.deleteUser(createdUser.user.id)
        logger.error('auth.register.insert_admin_failed', insertAdminError)
        return NextResponse.json(
          { error: 'Unable to create the admin profile.' },
          { status: 500 }
        )
      }
    } else {
      const reviewerProfile: Database['public']['Tables']['reviewer_master']['Insert'] = {
        auth_user_id: createdUser.user.id,
        department: department ?? null,
        email,
        name,
        phone: phone ?? null,
        specialization: specialization ?? null,
      }

      const { error: insertReviewerError } = await supabase
        .from('reviewer_master')
        .insert(reviewerProfile as never)

      if (insertReviewerError) {
        await supabase.auth.admin.deleteUser(createdUser.user.id)
        logger.error('auth.register.insert_reviewer_failed', insertReviewerError)
        return NextResponse.json(
          { error: 'Unable to create the reviewer profile.' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      {
        data: {
          id: createdUser.user.id,
          email,
          role,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('auth.register.unexpected', error)
    return NextResponse.json(
      { error: 'Something went wrong while creating the account.' },
      { status: 500 }
    )
  }
}
