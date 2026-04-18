import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { PageHeader } from '@/components/layout/PageHeader'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export default async function AdminPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'admin') {
    redirect('/reviewer')
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <PageHeader
        actions={
          <>
            <Link className={cn(buttonVariants({ variant: 'default', size: 'lg' }))} href="/admin/events">
              View events
            </Link>
            <Link
              className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))}
              href="/admin/reviewers"
            >
              Manage reviewers
            </Link>
          </>
        }
        description="Your core workspace is fully configured. Use the navigation to manage forms, review pipelines, and monitor submissions."
        eyebrow="Admin Dashboard"
        title={`Welcome back, ${session.user.name ?? 'Admin'}.`}
      />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.95fr]">
        <Card className="border-primary/10 bg-white/95">
          <CardHeader>
            <CardTitle>System Capabilities</CardTitle>
            <CardDescription>
              Manage the end-to-end evaluation flow from form creation to final decisions.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">Events Workspace</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Design forms, publish drafts, and track incoming submissions across active windows.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">Reviewer Tools</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Onboard evaluators, allocate submission assignments across stages, and review decisions.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">Analytics Data</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Visualize submission funnel health, tracking bottlenecks and scorer metrics.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-950 text-slate-50 shadow-xl shadow-slate-950/15">
          <CardHeader>
            <CardTitle className="text-slate-50">Quick Status Reference</CardTitle>
            <CardDescription className="text-slate-300">
              The status of connected modules in your deployment structure.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Database Cluster</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">Supabase Connected</p>
              </div>
              <div className="size-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">Auth Core</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">NextAuth Secure Mode</p>
              </div>
              <div className="size-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
