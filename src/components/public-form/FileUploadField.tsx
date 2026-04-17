import { useRef, useState } from 'react'
import { FormField } from '@/lib/forms/schema'
import { FieldRendererProps } from './FormFields'
import { Upload, X, File as FileIcon, Loader2 } from 'lucide-react'

interface UploadedFileDisplay {
  file_url: string
  file_name: string
  file_size: number
}

export function FileUploadField({ 
  field, 
  value = [], 
  onChange,
  eventId,
  submissionId
}: FieldRendererProps & { eventId: string; submissionId: string }) {
  if (field.type !== 'file_upload') return null

  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  
  const files: UploadedFileDisplay[] = Array.isArray(value) ? value : []
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    
    setIsUploading(true)
    setUploadError(null)
    
    try {
      const file = e.target.files[0]
      const formData = new FormData()
      formData.append('file', file)
      formData.append('eventId', eventId)
      formData.append('submissionId', submissionId)
      
      if (field.config.maxFiles) {
        // Just send configuration to API to double check
      }
      
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed')
      }
      
      onChange([...files, {
        file_url: data.file.file_url,
        file_name: data.file.file_name,
        file_size: data.file.file_size
      }])
    } catch (err: any) {
      setUploadError(err.message)
    } finally {
      setIsUploading(false)
      // reset input
      e.target.value = ''
    }
  }
  
  const handleRemove = (index: number) => {
    const newFiles = [...files]
    newFiles.splice(index, 1)
    onChange(newFiles)
  }

  return (
    <div className="space-y-4">
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, i) => (
            <div key={i} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50">
              <div className="flex items-center gap-3 overflow-hidden">
                <FileIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <div className="truncate">
                  <p className="text-sm font-medium text-slate-700 truncate">{file.file_name}</p>
                  <p className="text-xs text-slate-500">{(file.file_size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => handleRemove(i)}
                className="p-1 text-slate-400 hover:text-rose-500 rounded flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {(!field.config.multiple && files.length > 0) ? null : (
        files.length >= (field.config.maxFiles || 1) ? null : (
          <div>
            <label className="flex flex-col items-center justify-center w-full min-h-32 px-4 py-6 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="flex flex-col items-center justify-center space-y-2">
                {isUploading ? (
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                ) : (
                  <Upload className="w-6 h-6 text-slate-500" />
                )}
                <p className="text-sm font-medium text-slate-700">
                  {isUploading ? 'Uploading...' : 'Click to select a file'}
                </p>
                <p className="text-xs text-slate-500">
                  {field.config.allowedTypes?.length ? `Allowed: ${field.config.allowedTypes.join(', ')}` : 'Any file type'}
                </p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                onChange={handleFileChange}
                disabled={isUploading}
                accept={field.config.allowedTypes?.join(',')}
              />
            </label>
            {uploadError && <p className="mt-2 text-sm text-rose-500">{uploadError}</p>}
          </div>
        )
      )}
    </div>
  )
}
