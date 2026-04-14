import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminReviewersPage() {
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
        breadcrumbs={[
          { href: '/admin', label: 'Dashboard' },
          { label: 'Reviewers' },
        ]}
        description="This route holds the reviewer-management slot so the sidebar stays accurate before the real CRUD tools arrive."
        eyebrow="Admin"
        title="Reviewer management"
      />

      <Card>
        <CardHeader>
          <CardTitle>Reviewer tooling placeholder</CardTitle>
          <CardDescription>
            The shared shell is ready for reviewer creation, status controls, and workload visibility.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-950">Account setup</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Create reviewer identities and connect them to the Supabase auth users created by admins.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-950">Availability tracking</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Surface active status and assignment load before the review workflow is built out.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-950">Assignment prep</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This route will later anchor assignment controls and override workflows in Phase 4.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
