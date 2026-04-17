import { createAdminClient } from '@/lib/supabase/admin'

const BUCKET_NAME = 'form-uploads'
const DEFAULT_MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

export class FileTooLargeError extends Error {
  constructor(maxSize: number) {
    super(`File exceeds the maximum allowed size of ${Math.round(maxSize / 1024 / 1024)}MB.`)
    this.name = 'FileTooLargeError'
  }
}

export class FileTypeNotAllowedError extends Error {
  constructor(allowedTypes: string[]) {
    super(`File type is not allowed. Accepted types: ${allowedTypes.join(', ')}`)
    this.name = 'FileTypeNotAllowedError'
  }
}

export interface UploadedFile {
  file_url: string
  file_name: string
  file_size: number
  storage_path: string
}

/**
 * Upload a file to Supabase Storage via the storage abstraction layer.
 * Designed to be swappable for Azure Blob Storage in the future.
 */
export async function uploadFile(
  eventId: string,
  submissionId: string,
  file: File,
  options?: {
    maxFileSize?: number
    allowedFileTypes?: string[]
  }
): Promise<UploadedFile> {
  const maxSize = options?.maxFileSize ?? DEFAULT_MAX_FILE_SIZE
  const allowedTypes = options?.allowedFileTypes ?? []

  // Validate file size
  if (file.size > maxSize) {
    throw new FileTooLargeError(maxSize)
  }

  // Validate file type
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
    throw new FileTypeNotAllowedError(allowedTypes)
  }

  const supabase = createAdminClient()
  const fileId = crypto.randomUUID()
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
  const storagePath = `${eventId}/${submissionId}/${fileId}_${sanitizedName}`

  const fileBuffer = Buffer.from(await file.arrayBuffer())

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, fileBuffer, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    console.error('[STORAGE] Upload failed', error)
    throw new Error('File upload failed. Please try again.')
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath)

  return {
    file_url: urlData.publicUrl,
    file_name: file.name,
    file_size: file.size,
    storage_path: storagePath,
  }
}

/**
 * Get a signed URL for a file (for private buckets).
 */
export async function getSignedUrl(
  storagePath: string,
  expiresInSeconds = 3600
): Promise<string> {
  const supabase = createAdminClient()

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, expiresInSeconds)

  if (error || !data?.signedUrl) {
    console.error('[STORAGE] Failed to create signed URL', error)
    throw new Error('Unable to access the file.')
  }

  return data.signedUrl
}

/**
 * Delete a file from storage.
 */
export async function deleteFile(storagePath: string): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([storagePath])

  if (error) {
    console.error('[STORAGE] Delete failed', error)
  }
}
