import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { auth } from '@/lib/auth/auth'
import { PageHeader } from '@/components/layout/PageHeader'
import { listAssignmentsForReviewer, requireReviewerContext } from '@/lib/reviews/service'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

function formatDateTime(value: string | null) {
  if (!value) {
    return 'Not submitted yet'
  }

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export default async function ReviewerPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'reviewer') {
    redirect('/admin')
  }

  const context = await requireReviewerContext()
  const assignments = await listAssignmentsForReviewer(context)
  const openAssignments = assignments.filter((item) => item.assignment.status !== 'completed')
  const completedAssignments = assignments.filter((item) => item.assignment.status === 'completed')

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <PageHeader
        description="Review only the submissions assigned to you, then score them layer by layer with full continuity from your previous reviews."
        eyebrow="Reviewer Dashboard"
        title={`Welcome back, ${session.user.name ?? 'Reviewer'}.`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-white/80 bg-white/95">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Open assignments</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{openAssignments.length}</p>
          </CardContent>
        </Card>
        <Card className="border-white/80 bg-white/95">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Completed reviews</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{completedAssignments.length}</p>
          </CardContent>
        </Card>
        <Card className="border-white/80 bg-white/95">
          <CardContent className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">All assignments</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{assignments.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-white/80 bg-white/95 lg:col-span-2">
          <CardHeader>
            <CardTitle>Assignment queue</CardTitle>
            <CardDescription>
              Open an assignment to inspect the submission, review your prior-layer notes, and submit a score.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {assignments.length ? (
              assignments.map((item) => (
                <div
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  key={item.assignment.id}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {item.event?.title || 'Untitled event'}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Layer {item.assignment.layer} ·{' '}
                        {(item.teacher?.name || item.teacher?.email || 'Unknown teacher').trim()}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Submitted {formatDateTime(item.submission?.submitted_at || null)}
                      </p>
                    </div>

                    <span
                      className={
                        item.assignment.status === 'completed'
                          ? 'inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700'
                          : 'inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700'
                      }
                    >
                      {item.assignment.status.replaceAll('_', ' ')}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-slate-600">
                      {item.review
                        ? 'Review submitted and saved.'
                        : 'Ready for scoring and reviewer notes.'}
                    </p>
                    <Link
                      className={cn(buttonVariants({ size: 'sm' }))}
                      href={`/reviewer/assignments/${item.assignment.id}`}
                    >
                      {item.review ? 'View review' : 'Open assignment'}
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                No assignments yet. New work will appear here when an admin assigns submissions to you.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/10 bg-primary/5">
          <CardHeader>
            <CardTitle>Review flow</CardTitle>
            <CardDescription>Each assignment belongs to a single event and a single review layer.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-7 text-slate-700">
              Submit one score or grade per assignment. If you receive the same submission again in a later layer, your earlier reviews stay visible as read-only continuity notes.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
