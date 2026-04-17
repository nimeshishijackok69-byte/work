import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { listReviewersForAdmin, type ReviewerListItem } from '@/lib/reviews/service'
import { requireAdminContext } from '@/lib/events/service'
import { toggleReviewerActiveAction } from './actions'
import { ReviewerCreateForm } from './reviewer-create-form'
import { ReviewerEditForm } from './reviewer-edit-form'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
  }).format(new Date(value))
}

function ReviewerCard({ item }: { item: ReviewerListItem }) {
  const toggleAction = toggleReviewerActiveAction.bind(null, item.reviewer.id, !item.reviewer.is_active)

  return (
    <Card className="border-white/80 bg-white/95">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{item.reviewer.name}</CardTitle>
            <CardDescription>{item.reviewer.email}</CardDescription>
          </div>
          <span
            className={
              item.reviewer.is_active
                ? 'inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700'
                : 'inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600'
            }
          >
            {item.reviewer.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Pending</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{item.pendingAssignments}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Completed</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{item.completedAssignments}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Total</p>
            <p className="mt-2 text-2xl font-semibold text-slate-950">{item.totalAssignments}</p>
          </div>
        </div>

        <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
          <p>
            <span className="font-semibold text-slate-900">Department:</span>{' '}
            {item.reviewer.department || 'Not provided'}
          </p>
          <p>
            <span className="font-semibold text-slate-900">Specialization:</span>{' '}
            {item.reviewer.specialization || 'Not provided'}
          </p>
          <p>
            <span className="font-semibold text-slate-900">Phone:</span>{' '}
            {item.reviewer.phone || 'Not provided'}
          </p>
          <p>
            <span className="font-semibold text-slate-900">Created:</span> {formatDate(item.reviewer.created_at)}
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-950">Edit reviewer profile</p>
              <p className="mt-1 text-sm text-slate-500">
                Update contact details, specialization, or rotate the temporary password.
              </p>
            </div>
            <ReviewerEditForm reviewer={item.reviewer} />
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-slate-950">Recent assignment history</p>
              <p className="mt-1 text-sm text-slate-500">
                Latest review queue activity for this reviewer.
              </p>
            </div>

            {item.recentAssignments.length ? (
              <div className="grid gap-3">
                {item.recentAssignments.map((assignment) => (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={assignment.assignmentId}>
                    <p className="text-sm font-semibold text-slate-950">{assignment.eventTitle}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Submission #{assignment.submissionNumber || 'N/A'} · Layer {assignment.layer}
                    </p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {assignment.status.replaceAll('_', ' ')}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Assigned {formatDate(assignment.assignedAt)}
                      {assignment.completedAt ? ` · Completed ${formatDate(assignment.completedAt)}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                No assignment history yet for this reviewer.
              </div>
            )}

            <form action={toggleAction}>
              <Button type="submit" variant={item.reviewer.is_active ? 'destructive' : 'outline'}>
                {item.reviewer.is_active ? 'Deactivate reviewer' : 'Reactivate reviewer'}
              </Button>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default async function AdminReviewersPage() {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  if (session.user.role !== 'admin') {
    redirect('/reviewer')
  }

  const context = await requireAdminContext()
  const reviewers = await listReviewersForAdmin(context)

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <PageHeader
        breadcrumbs={[
          { href: '/admin', label: 'Dashboard' },
          { label: 'Reviewers' },
        ]}
        description="Create reviewer accounts, toggle access, and keep an eye on review workload before assigning submissions."
        eyebrow="Admin"
        title="Reviewer management"
      />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.35fr]">
        <ReviewerCreateForm />

        <Card className="border-white/80 bg-white/95">
          <CardHeader>
            <CardTitle>Team workload</CardTitle>
            <CardDescription>
              Reviewers stay available for assignment while active. Deactivated reviewers cannot log in or receive new work.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Total reviewers</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{reviewers.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Active</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {reviewers.filter((item) => item.reviewer.is_active).length}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Open assignments</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">
                {reviewers.reduce((sum, item) => sum + item.pendingAssignments, 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        {reviewers.length ? (
          reviewers.map((item) => <ReviewerCard item={item} key={item.reviewer.id} />)
        ) : (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>No reviewers yet</CardTitle>
              <CardDescription>
                Create the first reviewer account to start assigning submissions in the review workflow.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>
    </div>
  )
}
