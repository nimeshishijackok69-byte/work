import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { FormBuilder } from '@/components/form-builder/FormBuilder'
import { PageHeader } from '@/components/layout/PageHeader'
import { buttonVariants } from '@/components/ui/button'
import { normalizeFormSchema } from '@/lib/forms/schema'
import { getEventForAdmin, requireAdminContext } from '@/lib/events/service'
import { cn } from '@/lib/utils'

export default async function EventBuilderPage({
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

  const context = await requireAdminContext()
  const { id } = await params
  const event = await getEventForAdmin(context, id)

  if (!event) {
    notFound()
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <PageHeader
        actions={
          <>
            <Link className={cn(buttonVariants({ variant: 'outline', size: 'lg' }))} href="/admin/events">
              Back to events
            </Link>
            <span
              className={cn(
                'inline-flex items-center rounded-full border px-3 py-2 text-sm font-medium uppercase tracking-[0.16em]',
                event.status === 'draft'
                  ? 'border-amber-200 bg-amber-50 text-amber-700'
                  : event.status === 'published'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : 'border-slate-300 bg-slate-100 text-slate-700'
              )}
            >
              {event.status}
            </span>
          </>
        }
        breadcrumbs={[
          { href: '/admin', label: 'Dashboard' },
          { href: '/admin/events', label: 'Events' },
          { label: 'Builder' },
        ]}
        description="Build the draft form structure here. This foundation includes the shared schema model, field palette, sortable canvas, and draft-saving pipeline."
        eyebrow="Admin"
        title={`${event.title} builder`}
      />

      <FormBuilder
        eventDescription={event.description}
        eventId={event.id}
        eventStatus={event.status}
        eventTitle={event.title}
        expirationDate={event.expiration_date}
        initialSchema={normalizeFormSchema(event.form_schema)}
        reviewLayers={event.review_layers}
        scoringType={event.scoring_type}
        shareSlug={event.share_slug}
        teacherFields={event.teacher_fields}
        updatedAt={event.updated_at}
      />
    </div>
  )
}
