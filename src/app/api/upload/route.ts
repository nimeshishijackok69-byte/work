import { NextResponse } from 'next/server'
import { uploadFile, FileTooLargeError, FileTypeNotAllowedError } from '@/lib/storage/storage'
import { checkRateLimit, getClientIp } from '@/lib/utils/rate-limit'
import { logger } from '@/lib/utils/logger'

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request)
    const rate = checkRateLimit({
      bucket: 'uploads',
      identifier: ip,
      max: 30,
      windowMs: 60_000,
    })
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'Too many uploads. Please wait before uploading again.' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } }
      )
    }

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

    logger.error('upload.post_failed', error)
    return NextResponse.json({ error: 'File upload failed.' }, { status: 500 })
  }
}
