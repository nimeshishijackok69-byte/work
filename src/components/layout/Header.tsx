'use client'

import { usePathname } from 'next/navigation'
import { Bell, LogOut, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { signOutAction } from '@/lib/auth/actions'
import { Button } from '@/components/ui/button'
import { getActiveNavigationItem, getRoleLabel, type DashboardRole } from './navigation'

interface HeaderProps {
  isSidebarCollapsed: boolean
  onOpenMobileMenu: () => void
  onToggleSidebar: () => void
  role: DashboardRole
  userEmail?: string | null
  userName?: string | null
}

function getUserInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || 'User'
  const parts = source.split(/\s+/).filter(Boolean)

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

export function Header({
  isSidebarCollapsed,
  onOpenMobileMenu,
  onToggleSidebar,
  role,
  userEmail,
  userName,
}: HeaderProps) {
  const pathname = usePathname()
  const activeItem = getActiveNavigationItem(pathname, role)
  const roleLabel = getRoleLabel(role)
  const userInitials = getUserInitials(userName, userEmail)

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-background/80 backdrop-blur-xl">
      <div className="flex h-20 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Button
          aria-label="Open navigation menu"
          className="lg:hidden"
          onClick={onOpenMobileMenu}
          size="icon-sm"
          type="button"
          variant="outline"
        >
          <Menu className="size-4" />
        </Button>

        <Button
          aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden lg:inline-flex"
          onClick={onToggleSidebar}
          size="icon-sm"
          type="button"
          variant="outline"
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </Button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold uppercase tracking-[0.22em] text-primary/70">
            {roleLabel}
          </p>
          <h2 className="truncate text-lg font-semibold tracking-tight text-slate-950">
            {activeItem?.title ?? 'Dashboard'}
          </h2>
        </div>

        <Button
          aria-label="Notifications placeholder"
          className="relative"
          size="icon-sm"
          type="button"
          variant="outline"
        >
          <Bell className="size-4" />
          <span className="absolute right-2 top-2 size-2 rounded-full bg-primary" />
        </Button>

        <div className="hidden min-w-0 items-center gap-3 rounded-2xl border border-slate-200/80 bg-white px-3 py-2 shadow-sm sm:flex">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {userInitials}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950">
              {userName ?? `${role === 'admin' ? 'Admin' : 'Reviewer'} user`}
            </p>
            <p className="truncate text-xs text-slate-500">{userEmail ?? roleLabel}</p>
          </div>
        </div>

        <form action={signOutAction}>
          <Button size="sm" type="submit" variant="outline">
            <LogOut className="size-4" />
            Logout
          </Button>
        </form>
      </div>
    </header>
  )
}
