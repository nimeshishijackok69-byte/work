import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ReviewerPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'reviewer') {
    redirect('/admin')
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <PageHeader
        description="Your review workspace now has the same persistent shell as admin routes, with room for assignment queues and scoring tools."
        eyebrow="Reviewer Dashboard"
        title={`Welcome back, ${session.user.name ?? 'Reviewer'}.`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Assignment workspace</CardTitle>
            <CardDescription>
              This shell is ready to host pending review lists, filtering controls, and the scoring experience.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">Clear route separation</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Reviewers stay inside a focused workspace with only the tools relevant to assigned evaluations.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">Future review flows</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Assignment lists, submission viewers, and scoring panels can drop into this layout without rework.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/10 bg-primary/5">
          <CardHeader>
            <CardTitle>Phase 1 status</CardTitle>
            <CardDescription>Authentication and the shared dashboard shell are now connected.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-7 text-slate-700">
              The next major reviewer-facing milestone is the review dashboard and evaluation interface in Phase 4.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
