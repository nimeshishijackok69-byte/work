import { NextResponse } from 'next/server'
import { uploadFile, FileTooLargeError, FileTypeNotAllowedError } from '@/lib/storage/storage'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const eventId = formData.get('eventId') as string | null
    const submissionId = formData.get('submissionId') as string | null
    const maxFileSize = formData.get('maxFileSize') as string | null
    const allowedFileTypes = formData.get('allowedFileTypes') as string | null

    if (!file || !eventId || !submissionId) {
      return NextResponse.json(
        { error: 'File, event ID, and submission ID are required.' },
        { status: 400 }
      )
    }

    const uploaded = await uploadFile(eventId, submissionId, file, {
      maxFileSize: maxFileSize ? parseInt(maxFileSize, 10) : undefined,
      allowedFileTypes: allowedFileTypes ? JSON.parse(allowedFileTypes) : undefined,
    })

    return NextResponse.json({ file: uploaded })
  } catch (error) {
    if (error instanceof FileTooLargeError) {
      return NextResponse.json({ error: error.message }, { status: 413 })
    }
    if (error instanceof FileTypeNotAllowedError) {
      return NextResponse.json({ error: error.message }, { status: 415 })
    }

    console.error('[API] POST /api/upload', error)
    return NextResponse.json({ error: 'File upload failed.' }, { status: 500 })
  }
}
