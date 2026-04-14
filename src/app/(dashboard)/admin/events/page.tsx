import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function AdminEventsPage() {
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
          { label: 'Events' },
        ]}
        description="This placeholder route keeps the new admin navigation live until Session 2.1 wires in full event CRUD."
        eyebrow="Admin"
        title="Events workspace"
      />

      <Card>
        <CardHeader>
          <CardTitle>Event management comes next</CardTitle>
          <CardDescription>
            The shell route is ready for event listing, create flow, publish controls, and share link management.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-950">List events</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Show status, expiration, and review-layer configuration per event.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-950">Create events</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Add titles, descriptions, scoring type, review depth, and shareable slugs.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-950">Prepare the builder</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              This route provides the anchor for the form builder work in the next phase.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
