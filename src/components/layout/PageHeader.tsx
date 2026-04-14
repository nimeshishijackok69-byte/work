import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  href?: string
  label: string
}

interface PageHeaderProps {
  actions?: React.ReactNode
  breadcrumbs?: BreadcrumbItem[]
  description?: string
  eyebrow?: string
  title: string
}

export function PageHeader({
  actions,
  breadcrumbs,
  description,
  eyebrow,
  title,
}: PageHeaderProps) {
  return (
    <header className="rounded-[2rem] border border-slate-200/80 bg-white/90 p-6 shadow-sm shadow-slate-950/5 sm:p-8">
      {breadcrumbs?.length ? (
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1

            return (
              <div className="flex items-center gap-2" key={`${item.label}-${index}`}>
                {item.href && !isLast ? (
                  <Link className="transition hover:text-slate-900" href={item.href}>
                    {item.label}
                  </Link>
                ) : (
                  <span className={cn(isLast && 'font-medium text-slate-900')}>{item.label}</span>
                )}

                {!isLast ? <ChevronRight className="size-4 text-slate-400" /> : null}
              </div>
            )
          })}
        </nav>
      ) : null}

      <div className={cn('flex flex-col gap-5', breadcrumbs?.length ? 'mt-5' : '')}>
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            {eyebrow ? (
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/80">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-3 text-base leading-7 text-slate-600 sm:text-lg">{description}</p>
            ) : null}
          </div>

          {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
        </div>
      </div>
    </header>
  )
}
