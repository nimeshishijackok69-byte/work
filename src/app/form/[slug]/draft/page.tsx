import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPublicEventWithStatus } from '@/lib/submissions/service'
import { PublicFormShell } from '@/components/public-form/PublicFormShell'
import { FormClosedMessage } from '@/components/public-form/FormClosedMessage'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ token?: string }>
}

export const metadata: Metadata = {
  title: 'Resume Draft | FormFlow',
}

export default async function DraftResumePage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { token } = await searchParams

  if (!token) {
    notFound()
  }

  // Load the draft logic is similar to the API route
  // But we fetch it server side
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('submission')
    .select('*')
    .eq('draft_token', token)
    .eq('status', 'draft')
    .maybeSingle()

  const draft = data as Database['public']['Tables']['submission']['Row'] | null


  if (!draft) {
    return (
      <div className="flex flex-col items-center py-20 text-center">
        <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-rose-50">
          <span className="text-2xl">⚠️</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Draft link expired</h1>
        <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
          This draft link has expired or the form has already been submitted. Please return to the
          original form link to start a new submission or view your closed form.
        </p>
      </div>
    )
  }

  // Load teacher
  const { data: teacher } = await supabase
    .from('user_master')
    .select('name, email, phone, school_name')
    .eq('id', draft.user_id)
    .single()

  const result = await getPublicEventWithStatus(slug)

  if (!result.found) {
    notFound()
  }

  if (!result.open) {
    return (
      <FormClosedMessage
        title={result.title}
        reason={result.reason}
      />
    )
  }

  const { event } = result

  return (
    <>
      <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm text-sm text-blue-800">
        <p className="font-medium">You are resuming a saved draft.</p>
        <p className="mt-1 opacity-90">Your previous answers have been restored. Any new changes will auto-save.</p>
      </div>
      
      <PublicFormShell
        eventId={event.id}
        title={event.title}
        description={event.description}
        slug={event.share_slug}
        fields={event.form_schema.fields}
        teacherFields={event.teacher_fields}
        expirationDate={event.expiration_date}
        maxFileSize={event.max_file_size}
        allowedFileTypes={event.allowed_file_types}
        initialDraftToken={token}
        initialTeacherInfo={teacher ?? {}}
        initialFormData={draft.form_data as Record<string, any>}
      />
    </>
  )
}
