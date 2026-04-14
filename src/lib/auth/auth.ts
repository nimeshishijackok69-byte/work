import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { authConfig } from './auth.config'
import { createAdminClient } from '@/lib/supabase/admin'

export const { auth, signIn, signOut, handlers } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        // 1. Authenticate against Supabase Auth
        const supabase = createAdminClient()
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: credentials.email as string,
          password: credentials.password as string,
        })

        if (authError || !authData.user) {
          console.error('[NEXT_AUTH] Supabase Auth Error:', authError?.message)
          return null
        }

        const userId = authData.user.id

        // 2. Fetch the user's role from admin_profile or reviewer_master based on auth_user_id
        const { data: adminProfileData } = await supabase
          .from('admin_profile')
          .select('*')
          .eq('auth_user_id', userId)
          .single()

        const adminProfile = adminProfileData as any

        if (adminProfile && adminProfile.is_active) {
          return {
            id: userId,
            email: adminProfile.email,
            name: adminProfile.name,
            role: adminProfile.role,
          }
        }

        const { data: reviewerProfileData } = await supabase
          .from('reviewer_master')
          .select('*')
          .eq('auth_user_id', userId)
          .single()

        const reviewerProfile = reviewerProfileData as any

        if (reviewerProfile && reviewerProfile.is_active) {
          return {
            id: userId,
            email: reviewerProfile.email,
            name: reviewerProfile.name,
            role: 'reviewer',
          }
        }

        console.error('[NEXT_AUTH] User not found in custom profile tables or inactive')
        return null
      },
    }),
  ],
})
