import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPublicEventWithStatus } from '@/lib/submissions/service'
import { PublicFormShell } from '@/components/public-form/PublicFormShell'
import { FormClosedMessage } from '@/components/public-form/FormClosedMessage'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const result = await getPublicEventWithStatus(slug)

  if (!result.found) {
    return { title: 'Form Not Found' }
  }

  const title = result.open ? result.event.title : result.title

  return {
    title,
    description: result.open
      ? result.event.description ?? `Submit your response for ${title}`
      : `This form is no longer accepting submissions.`,
  }
}

export default async function PublicFormPage({ params }: PageProps) {
  const { slug } = await params
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
    />
  )
}
