'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sparkles, Workflow, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  getNavigationForRole,
  getRoleLabel,
  isNavigationItemActive,
  type DashboardRole,
} from './navigation'

interface SidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  onCloseMobile: () => void
  role: DashboardRole
}

interface SidebarBodyProps extends SidebarProps {
  mobile?: boolean
}

function SidebarBody({ collapsed, mobile = false, onCloseMobile, role }: SidebarBodyProps) {
  const pathname = usePathname()
  const navigation = getNavigationForRole(role)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 px-4 py-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(79,70,229,1),rgba(99,102,241,0.75))] text-white shadow-lg shadow-indigo-950/20">
            <Workflow className="size-5" />
          </div>

          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-base font-semibold tracking-tight text-slate-950">
                FormFlow
              </p>
              <p className="truncate text-sm text-slate-500">{getRoleLabel(role)}</p>
            </div>
          ) : null}
        </div>

        {mobile ? (
          <Button
            aria-label="Close navigation"
            className="shrink-0"
            onClick={onCloseMobile}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-6">
        {!collapsed ? (
          <p className="px-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Navigation
          </p>
        ) : null}

        <nav className={cn('space-y-2', !collapsed && 'mt-4')}>
          {navigation.map((item) => {
            const isActive = isNavigationItemActive(pathname, item.href)
            const Icon = item.icon

            return (
              <Link
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'group flex items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-sm transition',
                  collapsed ? 'justify-center' : 'justify-start',
                  isActive
                    ? 'border-primary/10 bg-primary/10 text-primary shadow-sm shadow-indigo-950/5'
                    : 'text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-950'
                )}
                href={item.href}
                key={item.href}
                onClick={mobile ? onCloseMobile : undefined}
                title={collapsed ? item.title : undefined}
              >
                <span
                  className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-xl transition',
                    isActive
                      ? 'bg-white text-primary shadow-sm'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-slate-900'
                  )}
                >
                  <Icon className="size-4" />
                </span>

                {!collapsed ? (
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{item.title}</span>
                    <span className="mt-1 block truncate text-xs text-slate-500">
                      {item.description}
                    </span>
                  </span>
                ) : null}
              </Link>
            )
          })}
        </nav>
      </div>

      {!collapsed ? (
        <div className="border-t border-slate-200/80 p-4">
          <div className="rounded-3xl bg-slate-950 px-4 py-5 text-slate-50 shadow-lg shadow-slate-950/10">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <Sparkles className="size-4 text-indigo-300" />
              FormFlow v1.0
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Multi-tier evaluation platform for scalable form management and review workflows.
            </p>
          </div>
        </div>
      ) : (
        <div className="border-t border-slate-200/80 p-4">
          <div className="flex justify-center rounded-2xl bg-slate-950 px-0 py-3 text-slate-50 shadow-lg shadow-slate-950/10">
            <Sparkles className="size-4 text-indigo-300" />
          </div>
        </div>
      )}
    </div>
  )
}

export function Sidebar({ collapsed, mobileOpen, onCloseMobile, role }: SidebarProps) {
  return (
    <>
      <div
        aria-hidden={!mobileOpen}
        className={cn(
          'fixed inset-0 z-30 bg-slate-950/45 backdrop-blur-sm transition-opacity lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onCloseMobile}
      />

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-80 max-w-[calc(100vw-1.5rem)] border-r border-slate-200/80 bg-white/95 shadow-2xl shadow-slate-950/15 backdrop-blur transition-transform duration-300 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarBody
          collapsed={false}
          mobile
          mobileOpen={mobileOpen}
          onCloseMobile={onCloseMobile}
          role={role}
        />
      </aside>

      <aside
        className={cn(
          'sticky top-0 hidden h-screen shrink-0 border-r border-slate-200/80 bg-white/90 backdrop-blur lg:block',
          collapsed ? 'w-24' : 'w-80'
        )}
      >
        <SidebarBody
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onCloseMobile={onCloseMobile}
          role={role}
        />
      </aside>
    </>
  )
}
