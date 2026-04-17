import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
  ArrowLeft,
  BarChart3,
  Download,
  FileStack,
  Gauge,
  Layers3,
  Star,
  Trophy,
  Users,
} from 'lucide-react'
import { auth } from '@/lib/auth/auth'
import { requireAdminContext } from '@/lib/events/service'
import {
  AnalyticsAccessError,
  getEventAnalyticsSummary,
} from '@/lib/analytics/service'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/PageHeader'
import { SubmissionsOverTimeChart } from '@/components/analytics/SubmissionsOverTimeChart'
import { AvgScoreByLayerChart } from '@/components/analytics/AvgScoreByLayerChart'
import { ReviewStatusDonut } from '@/components/analytics/ReviewStatusDonut'
import { ReviewerWorkloadChart } from '@/components/analytics/ReviewerWorkloadChart'

interface MetricCardProps {
  accent: string
  icon: React.ReactNode
  label: string
  value: string | number
  hint?: string
}

function MetricCard({ accent, hint, icon, label, value }: MetricCardProps) {
  return (
    <Card className="border-white/80 bg-white/95">
      <CardContent className="flex items-start gap-4 p-5">
        <div
          aria-hidden
          className={cn(
            'flex size-12 shrink-0 items-center justify-center rounded-2xl',
            accent
          )}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
          {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
        </div>
      </CardContent>
    </Card>
  )
}

export default async function EventAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'admin') {
    redirect('/reviewer')
  }

  const { id } = await params
  const context = await requireAdminContext()

  let summary
  try {
    summary = await getEventAnalyticsSummary(context, id)
  } catch (error) {
    if (error instanceof AnalyticsAccessError) {
      notFound()
    }

    throw error
  }

  const { event, totals } = summary
  const reviewCompletionRate = (() => {
    const totalAssignments = summary.reviewCompletionByLayer.reduce(
      (sum, entry) => sum + entry.totalAssignments,
      0
    )
    const completed = summary.reviewCompletionByLayer.reduce(
      (sum, entry) => sum + entry.completed,
      0
    )

    if (!totalAssignments) return 0
    return Math.round((completed / totalAssignments) * 1000) / 10
  })()

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <PageHeader
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Link
              className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
              href={`/admin/events/${event.id}`}
            >
              <ArrowLeft className="size-4" />
              Back to event
            </Link>
            <a
              className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
              href={`/api/analytics/${event.id}/export?type=submissions`}
            >
              <Download className="size-4" />
              Export submissions
            </a>
            <a
              className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
              href={`/api/analytics/${event.id}/export?type=reviews`}
            >
              <Download className="size-4" />
              Export reviews
            </a>
          </div>
        }
        breadcrumbs={[
          { href: '/admin', label: 'Dashboard' },
          { href: '/admin/events', label: 'Events' },
          { href: `/admin/events/${event.id}`, label: event.title },
          { label: 'Analytics' },
        ]}
        description="Event-scoped metrics. No cross-event data leaks into this view."
        eyebrow="Analytics"
        title={`${event.title} analytics`}
      />

      {/* Key metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          accent="bg-blue-100 text-blue-600"
          icon={<FileStack className="size-5" />}
          label="Submissions"
          value={totals.submitted}
          hint={`${totals.drafts} in draft`}
        />
        <MetricCard
          accent="bg-amber-100 text-amber-600"
          icon={<Layers3 className="size-5" />}
          label="In review"
          value={totals.inReview}
          hint={`${totals.reviewed} awaiting decision`}
        />
        <MetricCard
          accent="bg-emerald-100 text-emerald-600"
          icon={<Gauge className="size-5" />}
          label="Review completion"
          value={`${reviewCompletionRate}%`}
          hint={`${totals.advanced} advanced, ${totals.eliminated} eliminated`}
        />
        <MetricCard
          accent="bg-violet-100 text-violet-600"
          icon={<Users className="size-5" />}
          label="Active reviewers"
          value={summary.reviewerWorkload.length}
          hint={`${totals.reviewers} reviewers in platform`}
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <Card className="border-white/80 bg-white/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="size-5 text-slate-500" />
              Submission rate
            </CardTitle>
            <CardDescription>Submitted responses over time, grouped by day.</CardDescription>
          </CardHeader>
          <CardContent>
            <SubmissionsOverTimeChart data={summary.submissionsOverTime} />
          </CardContent>
        </Card>

        <Card className="border-white/80 bg-white/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="size-5 text-slate-500" />
              Review status breakdown
            </CardTitle>
            <CardDescription>How submissions are distributed across the pipeline.</CardDescription>
          </CardHeader>
          <CardContent>
            <ReviewStatusDonut data={summary.submissionsByStatus} />
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="border-white/80 bg-white/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="size-5 text-slate-500" />
              Average score per layer
            </CardTitle>
            <CardDescription>
              {event.scoring_type === 'numeric'
                ? `Mean reviewer score (out of ${event.max_score}) at each review layer.`
                : 'Numeric averaging is disabled for grade-based events. Use the reviews export for grade detail.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AvgScoreByLayerChart data={summary.avgScoreByLayer} maxScore={event.max_score} />
          </CardContent>
        </Card>

        <Card className="border-white/80 bg-white/95">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5 text-slate-500" />
              Reviewer workload
            </CardTitle>
            <CardDescription>Top reviewers by assignment load for this event.</CardDescription>
          </CardHeader>
          <CardContent>
            <ReviewerWorkloadChart data={summary.reviewerWorkload} />
          </CardContent>
        </Card>
      </div>

      {/* Review completion by layer table */}
      <Card className="border-white/80 bg-white/95">
        <CardHeader>
          <CardTitle>Review completion by layer</CardTitle>
          <CardDescription>
            Track how close each review layer is to completion, including pending and in-progress
            assignments.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                <th className="py-3 pr-4">Layer</th>
                <th className="py-3 pr-4">Total assignments</th>
                <th className="py-3 pr-4">Completed</th>
                <th className="py-3 pr-4">In progress</th>
                <th className="py-3 pr-4">Pending</th>
                <th className="py-3 pr-4">Completion rate</th>
              </tr>
            </thead>
            <tbody>
              {summary.reviewCompletionByLayer.map((entry) => (
                <tr className="border-b border-slate-100 last:border-b-0" key={entry.layer}>
                  <td className="py-3 pr-4 font-semibold text-slate-950">Layer {entry.layer}</td>
                  <td className="py-3 pr-4 text-slate-700">{entry.totalAssignments}</td>
                  <td className="py-3 pr-4 text-emerald-600">{entry.completed}</td>
                  <td className="py-3 pr-4 text-sky-600">{entry.inProgress}</td>
                  <td className="py-3 pr-4 text-amber-600">{entry.pending}</td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-40 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{ width: `${Math.min(100, entry.completionRate)}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-600">
                        {entry.completionRate}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Top rated leaderboard */}
      <Card className="border-white/80 bg-white/95">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="size-5 text-amber-500" />
            Top rated submissions
          </CardTitle>
          <CardDescription>
            Highest-scoring submissions across all review layers for this event.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {summary.topRated.length ? (
            <ol className="space-y-3">
              {summary.topRated.map((entry, index) => (
                <li
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  key={entry.submissionId}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className={cn(
                        'flex size-10 items-center justify-center rounded-full text-sm font-bold',
                        index === 0
                          ? 'bg-amber-100 text-amber-700'
                          : index === 1
                          ? 'bg-slate-200 text-slate-700'
                          : index === 2
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-white text-slate-600 ring-1 ring-slate-200'
                      )}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-950">{entry.teacherName}</p>
                      <p className="text-xs text-slate-500">
                        {entry.schoolName || 'No school provided'} · Submission #
                        {entry.submissionNumber} · Reached layer {entry.layer}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-semibold text-slate-950">
                        {entry.avgScore.toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-500">
                        avg · {entry.reviewCount} review{entry.reviewCount === 1 ? '' : 's'}
                      </p>
                    </div>
                    <Link
                      className={cn(buttonVariants({ size: 'sm', variant: 'outline' }))}
                      href={`/admin/events/${event.id}/reviews?q=${entry.submissionId.slice(0, 8)}`}
                    >
                      Inspect
                    </Link>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
              No numeric reviews scored yet. Once reviewers score submissions, the leaderboard will
              populate.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
