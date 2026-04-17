import type { LucideIcon } from 'lucide-react'
import {
  BarChart3,
  Bell,
  CalendarRange,
  ClipboardCheck,
  LayoutDashboard,
  UsersRound,
} from 'lucide-react'

export type DashboardRole = 'admin' | 'reviewer'

export interface DashboardNavItem {
  description: string
  href: string
  icon: LucideIcon
  title: string
}

const ADMIN_NAVIGATION: DashboardNavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    description: 'Track event activity and upcoming work.',
    icon: LayoutDashboard,
  },
  {
    title: 'Events',
    href: '/admin/events',
    description: 'Create, publish, and manage event forms.',
    icon: CalendarRange,
  },
  {
    title: 'Reviewers',
    href: '/admin/reviewers',
    description: 'Manage reviewer accounts and workloads.',
    icon: UsersRound,
  },
  {
    title: 'Analytics',
    href: '/admin/analytics',
    description: 'Per-event submission and review metrics.',
    icon: BarChart3,
  },
  {
    title: 'Notifications',
    href: '/notifications',
    description: 'Inbox of assignment and review updates.',
    icon: Bell,
  },
]

const REVIEWER_NAVIGATION: DashboardNavItem[] = [
  {
    title: 'Dashboard',
    href: '/reviewer',
    description: 'Review assigned submissions and next actions.',
    icon: ClipboardCheck,
  },
  {
    title: 'Notifications',
    href: '/notifications',
    description: 'Your assignment and review inbox.',
    icon: Bell,
  },
]

export function getNavigationForRole(role: DashboardRole): DashboardNavItem[] {
  return role === 'admin' ? ADMIN_NAVIGATION : REVIEWER_NAVIGATION
}

export function getRoleLabel(role: DashboardRole) {
  return role === 'admin' ? 'Admin workspace' : 'Reviewer workspace'
}

export function isNavigationItemActive(pathname: string, href: string) {
  if (pathname === href) {
    return true
  }

  if (href === '/admin' || href === '/reviewer') {
    return false
  }

  return pathname.startsWith(`${href}/`)
}

export function getActiveNavigationItem(pathname: string, role: DashboardRole) {
  return getNavigationForRole(role).find((item) => isNavigationItemActive(pathname, item.href))
}
