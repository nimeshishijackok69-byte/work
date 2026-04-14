import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
  pages: {
    signIn: '/login', // specify login page
  },
  providers: [
    // Leave array empty, we will inject Credentials in auth.ts
    // to avoid Edge compatibility issues with Node APIs on middleware
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnAdmin = nextUrl.pathname.startsWith('/admin')
      const isOnReviewer = nextUrl.pathname.startsWith('/reviewer')

      if (isOnAdmin) {
        if (isLoggedIn && auth.user.role === 'admin') return true
        return false // Redirect unauthenticated or wrong role to login
      }
      
      if (isOnReviewer) {
        if (isLoggedIn && auth.user.role === 'reviewer') return true
        return false // Redirect unauthenticated or wrong role to login
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
  }
} satisfies NextAuthConfig
