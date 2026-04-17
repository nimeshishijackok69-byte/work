'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface AvgScoreByLayerChartProps {
  data: Array<{
    layer: number
    avgScore: number | null
    minScore: number | null
    maxScore: number | null
    reviewCount: number
  }>
  maxScore: number
}

const BAR_COLORS = ['#4F46E5', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

export function AvgScoreByLayerChart({ data, maxScore }: AvgScoreByLayerChartProps) {
  const hasData = data.some((entry) => entry.avgScore !== null)

  if (!hasData) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
        No numeric reviews yet. Once reviewers submit scores, the layer averages will appear here.
      </div>
    )
  }

  const formatted = data.map((entry) => ({
    ...entry,
    layerLabel: `Layer ${entry.layer}`,
    avgValue: entry.avgScore ?? 0,
  }))

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer height="100%" width="100%">
        <BarChart data={formatted} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="hsl(214 32% 91%)" strokeDasharray="4 4" vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="layerLabel"
            stroke="hsl(215 16% 47%)"
            tickLine={false}
            tickMargin={10}
          />
          <YAxis
            axisLine={false}
            domain={[0, maxScore]}
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
            formatter={(_value, _name, ctx) => {
              const entry = (ctx?.payload ?? {}) as (typeof formatted)[number]
              if (entry.avgScore == null) {
                return ['No scores yet', 'Average']
              }
              return [
                `${entry.avgScore.toFixed(2)} / ${maxScore} (${entry.reviewCount} review${entry.reviewCount === 1 ? '' : 's'})`,
                'Average',
              ]
            }}
          />
          <Bar dataKey="avgValue" radius={[8, 8, 0, 0]}>
            {formatted.map((entry, index) => (
              <Cell fill={BAR_COLORS[index % BAR_COLORS.length]} key={entry.layer} />
            ))}
            <LabelList
              dataKey="avgScore"
              fill="hsl(222 47% 11%)"
              fontSize={12}
              fontWeight={600}
              formatter={(value) => {
                const num = typeof value === 'number' ? value : Number(value)
                return value == null || Number.isNaN(num) ? 'No data' : num.toFixed(1)
              }}
              position="top"
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
