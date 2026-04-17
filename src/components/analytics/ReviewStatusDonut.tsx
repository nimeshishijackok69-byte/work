'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

interface ReviewStatusDonutProps {
  data: Array<{ status: string; count: number }>
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_review: 'Under review',
  reviewed: 'Awaiting decision',
  advanced: 'Advanced',
  eliminated: 'Eliminated',
}

const STATUS_COLORS: Record<string, string> = {
  pending: '#94A3B8',
  in_review: '#0EA5E9',
  reviewed: '#F59E0B',
  advanced: '#10B981',
  eliminated: '#EF4444',
}

export function ReviewStatusDonut({ data }: ReviewStatusDonutProps) {
  const enriched = data
    .filter((entry) => entry.count > 0)
    .map((entry) => ({
      ...entry,
      label: STATUS_LABELS[entry.status] ?? entry.status.replaceAll('_', ' '),
      color: STATUS_COLORS[entry.status] ?? '#64748B',
    }))

  const total = enriched.reduce((sum, entry) => sum + entry.count, 0)

  if (!enriched.length) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
        No review activity yet. Once submissions enter the pipeline you&apos;ll see a breakdown.
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 md:flex-row md:items-center md:gap-6">
      <div className="relative h-56 w-56 shrink-0">
        <ResponsiveContainer height="100%" width="100%">
          <PieChart>
            <Tooltip
              contentStyle={{
                border: '1px solid hsl(214 32% 91%)',
                borderRadius: 12,
                boxShadow: '0 10px 30px -10px rgba(15,23,42,0.15)',
                padding: '10px 14px',
              }}
              formatter={(value: number, _name, ctx) => {
                const entry = (ctx?.payload ?? {}) as (typeof enriched)[number]
                const pct = total ? Math.round((value / total) * 100) : 0
                return [`${value} (${pct}%)`, entry.label]
              }}
            />
            <Pie
              data={enriched}
              dataKey="count"
              innerRadius={58}
              nameKey="label"
              outerRadius={86}
              paddingAngle={2}
              stroke="#FFFFFF"
              strokeWidth={2}
            >
              {enriched.map((entry) => (
                <Cell fill={entry.color} key={entry.status} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-semibold text-slate-950">{total}</span>
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            Submissions
          </span>
        </div>
      </div>
      <ul className="flex flex-col gap-2 text-sm">
        {enriched.map((entry) => {
          const pct = total ? Math.round((entry.count / total) * 100) : 0

          return (
            <li className="flex items-center gap-3" key={entry.status}>
              <span
                aria-hidden
                className="size-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="font-medium text-slate-950">{entry.label}</span>
              <span className="text-slate-500">
                · {entry.count} ({pct}%)
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
