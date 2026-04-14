'use client'

import { useState } from 'react'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import type { DashboardRole } from './navigation'

interface AppShellProps {
  children: React.ReactNode
  role: DashboardRole
  user: {
    email?: string | null
    name?: string | null
  }
}

export function AppShell({ children, role, user }: AppShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.10),transparent_30%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.10),transparent_24%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)]">
      <div className="flex min-h-screen">
        <Sidebar
          collapsed={isSidebarCollapsed}
          mobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
          role={role}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <Header
            isSidebarCollapsed={isSidebarCollapsed}
            onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
            onToggleSidebar={() => setIsSidebarCollapsed((current) => !current)}
            role={role}
            userEmail={user.email}
            userName={user.name}
          />

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
