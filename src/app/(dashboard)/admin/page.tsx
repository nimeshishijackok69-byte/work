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
        description="Your dashboard shell is ready. Event management, reviewer setup, and analytics modules now have a shared frame to grow into."
        eyebrow="Admin Dashboard"
        title={`Welcome back, ${session.user.name ?? 'Admin'}.`}
      />

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.95fr]">
        <Card className="border-primary/10 bg-white/95">
          <CardHeader>
            <CardTitle>What this shell unlocks</CardTitle>
            <CardDescription>
              Session 1.5 establishes the shared dashboard frame that future admin tools will reuse.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">Events workspace</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Event CRUD and the form builder can now land in a persistent admin shell.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">Reviewer tools</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Reviewer management gets a dedicated navigation target and room for workload views.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-950">Shared navigation</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                The responsive sidebar and header keep admin routes consistent across sessions.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-950 text-slate-50 shadow-xl shadow-slate-950/15">
          <CardHeader>
            <CardTitle className="text-slate-50">Next build target</CardTitle>
            <CardDescription className="text-slate-300">
              Session 2.1 can focus on event APIs without rebuilding dashboard chrome.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">Ready now</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Protected admin routes, role-aware navigation, logout flow, and dashboard scaffolding.
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">Coming next</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Event CRUD backend, validation schemas, and the first real data surfaces.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
