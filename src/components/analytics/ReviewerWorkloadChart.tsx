'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface ReviewerWorkloadChartProps {
  data: Array<{
    reviewerId: string
    reviewerName: string
    totalAssignments: number
    completed: number
    pending: number
    inProgress: number
  }>
}

export function ReviewerWorkloadChart({ data }: ReviewerWorkloadChartProps) {
  if (!data.length) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
        No reviewers have been assigned to this event yet.
      </div>
    )
  }

  const formatted = data.slice(0, 8).map((entry) => ({
    ...entry,
    shortName: entry.reviewerName.length > 18 ? `${entry.reviewerName.slice(0, 17)}...` : entry.reviewerName,
  }))

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer height="100%" width="100%">
        <BarChart data={formatted} layout="vertical" margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid horizontal={false} stroke="hsl(214 32% 91%)" strokeDasharray="4 4" />
          <XAxis
            allowDecimals={false}
            axisLine={false}
            stroke="hsl(215 16% 47%)"
            tickLine={false}
            type="number"
          />
          <YAxis
            axisLine={false}
            dataKey="shortName"
            stroke="hsl(215 16% 47%)"
            tickLine={false}
            type="category"
            width={120}
          />
          <Tooltip
            contentStyle={{
              border: '1px solid hsl(214 32% 91%)',
              borderRadius: 12,
              boxShadow: '0 10px 30px -10px rgba(15,23,42,0.15)',
              padding: '10px 14px',
            }}
            cursor={{ fill: 'hsl(210 40% 96%)' }}
          />
          <Legend iconType="circle" wrapperStyle={{ paddingTop: 12 }} />
          <Bar dataKey="completed" fill="#10B981" name="Completed" radius={[0, 6, 6, 0]} stackId="a" />
          <Bar dataKey="inProgress" fill="#0EA5E9" name="In progress" stackId="a" />
          <Bar dataKey="pending" fill="#F59E0B" name="Pending" radius={[0, 6, 6, 0]} stackId="a" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
