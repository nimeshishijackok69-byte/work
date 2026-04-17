'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface SubmissionsOverTimeChartProps {
  data: Array<{ date: string; count: number }>
}

function formatDateLabel(value: string) {
  // Support either YYYY-MM or YYYY-MM-DD keys
  if (/^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split('-')
    return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('en-IN', {
      month: 'short',
      year: 'numeric',
    })
  }

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
}

export function SubmissionsOverTimeChart({ data }: SubmissionsOverTimeChartProps) {
  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
        No submitted responses yet. As teachers submit, a trend line will appear here.
      </div>
    )
  }

  const formatted = data.map((entry) => ({
    ...entry,
    label: formatDateLabel(entry.date),
  }))

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer height="100%" width="100%">
        <AreaChart data={formatted} margin={{ top: 10, right: 24, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="submissionsGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="hsl(221 83% 53%)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="hsl(221 83% 53%)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="hsl(214 32% 91%)" strokeDasharray="4 4" vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="label"
            stroke="hsl(215 16% 47%)"
            tickLine={false}
            tickMargin={10}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            stroke="hsl(215 16% 47%)"
            tickLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              border: '1px solid hsl(214 32% 91%)',
              borderRadius: 12,
              boxShadow: '0 10px 30px -10px rgba(15,23,42,0.15)',
              padding: '10px 14px',
            }}
            formatter={(value) => {
              const numeric = typeof value === 'number' ? value : Number(value) || 0
              return [`${numeric} submission${numeric === 1 ? '' : 's'}`, 'Count']
            }}
            labelFormatter={(label) => label}
          />
          <Area
            dataKey="count"
            fill="url(#submissionsGradient)"
            stroke="hsl(221 83% 53%)"
            strokeWidth={2}
            type="monotone"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
