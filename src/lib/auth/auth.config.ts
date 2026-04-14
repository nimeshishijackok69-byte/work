import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnAdmin = nextUrl.pathname.startsWith('/admin')
      const isOnReviewer = nextUrl.pathname.startsWith('/reviewer')

      if (isOnAdmin) {
        if (isLoggedIn && auth.user.role === 'admin') return true
        return false
      }

      if (isOnReviewer) {
        if (isLoggedIn && auth.user.role === 'reviewer') return true
        return false
      }

      return true
    },
    jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      return token
    },
    session({ session, token }) {
      if (session.user && token) {
        session.user.role = token.role as string
        session.user.id = token.id as string
      }
      return session
    }
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
} satisfies NextAuthConfig
