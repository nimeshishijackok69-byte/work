import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { AppShell } from '@/components/layout/AppShell'
import type { DashboardRole } from '@/components/layout/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const role = session.user.role

  if (role !== 'admin' && role !== 'reviewer') {
    redirect('/login')
  }

  return (
    <AppShell
      role={role as DashboardRole}
      user={{
        email: session.user.email,
        name: session.user.name,
      }}
    >
      {children}
    </AppShell>
  )
}
