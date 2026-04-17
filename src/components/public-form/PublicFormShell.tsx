'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FormField } from '@/lib/forms/schema'
import { TeacherInfoFields } from './TeacherInfoFields'
import { FormFieldRenderer } from './FormFieldRenderer'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Loader2, Link2, FileText } from 'lucide-react'

// Basic random ID generator since we don't have uuid setup securely in the browser here
function generateId() {
  return Math.random().toString(36).substring(2, 12) + Date.now().toString(36)
}

export function PublicFormShell({
  eventId,
  title,
  description,
  slug,
  fields,
  teacherFields,
  expirationDate,
  maxFileSize,
  allowedFileTypes,
  initialDraftToken = null,
  initialTeacherInfo = {},
  initialFormData = {},
}: {
  eventId: string
  title: string
  description: string | null
  slug: string
  fields: FormField[]
  teacherFields: string[]
  expirationDate: string | null
  maxFileSize: number
  allowedFileTypes: string[]
  initialDraftToken?: string | null
  initialTeacherInfo?: Record<string, string>
  initialFormData?: Record<string, any>
}) {
  const router = useRouter()
  const [draftToken, setDraftToken] = useState<string | null>(initialDraftToken)
  const [draftSubmissionId, setDraftSubmissionId] = useState<string | null>(null)
  
  // Create a somewhat stable submissionId to use for file uploads before we create the actual draft
  const defaultSubmissionId = useRef(generateId())
  
  const [teacherInfo, setTeacherInfo] = useState<Record<string, string>>(initialTeacherInfo)
  const [teacherErrors, setTeacherErrors] = useState<Record<string, string>>({})
  
  const [formData, setFormData] = useState<Record<string, any>>(initialFormData)
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'' | 'Saving...' | 'Draft saved' | 'Error saving'>('')
  const lastSavedData = useRef({ teacherInfo, formData })
  
  // Separate into questions and sections for rendering
  const sections = fields.reduce<{ type: 'section'; field: FormField; items: FormField[] }[]>(
    (acc, field) => {
      if (field.type === 'section_header') {
        acc.push({ type: 'section', field, items: [] })
      } else {
        if (acc.length === 0) {
          // If no section header yet, create a default one
          acc.push({ 
            type: 'section', 
            field: { id: 'default', type: 'section_header', label: '', required: false }, 
            items: [field] 
          })
        } else {
          acc[acc.length - 1].items.push(field)
        }
      }
      return acc
    },
    []
  )

  const handleTeacherChange = (field: string, value: string) => {
    setTeacherInfo(prev => ({ ...prev, [field]: value }))
    // Clear error
    if (teacherErrors[field]) {
      setTeacherErrors(prev => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }))
    // Clear error
    if (formErrors[fieldId]) {
      setFormErrors(prev => {
        const next = { ...prev }
        delete next[fieldId]
        return next
      })
    }
  }

  const saveDraft = useCallback(async () => {
    // Only save draft if we have an email
    if (!teacherInfo.email || teacherInfo.email.trim() === '') {
      return
    }

    // Check if data actually changed
    const currentDataStr = JSON.stringify({ teacherInfo, formData })
    const lastDataStr = JSON.stringify(lastSavedData.current)
    if (currentDataStr === lastDataStr) {
      return
    }

    setSaveStatus('Saving...')
    lastSavedData.current = { teacherInfo, formData }

    try {
      if (draftToken) {
        // Update existing draft
        const res = await fetch(`/api/submissions/${draftSubmissionId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            draftToken,
            formData,
            teacherInfo,
          })
        })
        if (!res.ok) throw new Error('Update failed')
      } else {
        // Create new draft
        const res = await fetch(`/api/submissions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug,
            teacherInfo,
            formData,
            isDraft: true
          })
        })
        if (!res.ok) throw new Error('Create failed')
        const data = await res.json()
        setDraftToken(data.draftToken)
        setDraftSubmissionId(data.submissionId)
        
        // Notify user about draft link
        // In a real app we'd display this visually or let them know an email was sent
      }
      setSaveStatus('Draft saved')
      setTimeout(() => setSaveStatus(''), 3000)
    } catch (e) {
      setSaveStatus('Error saving')
      // Reset lastSavedData so it tries again
      lastSavedData.current = { teacherInfo: {}, formData: {} }
    }
  }, [teacherInfo, formData, draftToken, draftSubmissionId, slug])

  // Autosave effect (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      saveDraft()
    }, 5000) // 5 seconds of inactivity
    return () => clearTimeout(timer)
  }, [teacherInfo, formData, saveDraft])

  const validateLocal = () => {
    let isValid = true
    const newTeacherErrors: Record<string, string> = {}
    const newFormErrors: Record<string, string> = {}

    // Teacher fields
    if (teacherFields.includes('name') && (!teacherInfo.name || teacherInfo.name.trim() === '')) {
      newTeacherErrors.name = 'Your name is required'
      isValid = false
    }
    if (teacherFields.includes('email') && (!teacherInfo.email || teacherInfo.email.trim() === '')) {
      newTeacherErrors.email = 'Email is required'
      isValid = false
    }

    // Form fields
    fields.forEach(field => {
      if (field.type === 'section_header') return
      
      if (field.required) {
        const val = formData[field.id]
        if (
          val === undefined || 
          val === null || 
          val === '' || 
          (Array.isArray(val) && val.length === 0) ||
          (typeof val === 'object' && Object.keys(val).length === 0)
        ) {
          newFormErrors[field.id] = 'This field is required'
          isValid = false
        }
      }
    })

    setTeacherErrors(newTeacherErrors)
    setFormErrors(newFormErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateLocal()) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setIsSubmitting(true)
    setSaveStatus('')

    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          teacherInfo,
          formData,
          isDraft: false
        })
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.details) {
          // Flatten backend validation errors
          if (data.details.fieldErrors) {
            setFormErrors(data.details.fieldErrors)
          }
          throw new Error('Please fix the errors in the form.')
        }
        throw new Error(data.error || 'Submission failed')
      }

      // Success
      router.push(`/form/${slug}/success?ref=${data.reference}&title=${encodeURIComponent(title)}`)
    } catch (err: any) {
      alert(err.message)
      setIsSubmitting(false)
    }
  }

  return (
    <form className="space-y-6 pb-20" onSubmit={handleSubmit} noValidate>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
        {saveStatus && (
          <span className="text-sm font-medium text-slate-500 animate-pulse">{saveStatus}</span>
        )}
      </div>
      
      {description && (
        <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
          {description}
        </p>
      )}

      <TeacherInfoFields 
        teacherFields={teacherFields} 
        values={teacherInfo} 
        errors={teacherErrors} 
        onChange={handleTeacherChange} 
      />

      {sections.map((section, idx) => (
        <div key={section.field.id || idx} className="space-y-6">
          {section.field.label && (
            <div className="pt-8 pb-4 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                {section.field.label}
              </h2>
              {section.field.description && (
                <p className="mt-2 text-sm text-slate-600">{section.field.description}</p>
              )}
            </div>
          )}

          {section.items.map((field, index) => (
            <Card key={field.id} className={`overflow-hidden border-slate-200 ${formErrors[field.id] ? 'border-rose-300 ring-1 ring-rose-300' : ''}`}>
              <CardHeader className="bg-white pb-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-base font-semibold leading-normal flex items-start gap-2">
                      <span className="text-slate-900">{field.label}</span>
                      {field.required && <span className="text-rose-500 mt-1">*</span>}
                    </CardTitle>
                    {field.description && (
                      <CardDescription className="text-sm">
                        {field.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 pb-6 px-6 bg-white">
                <FormFieldRenderer 
                  field={field} 
                  value={formData[field.id]} 
                  onChange={(val) => handleFieldChange(field.id, val)}
                  error={formErrors[field.id]}
                  eventId={eventId}
                  submissionId={draftSubmissionId || defaultSubmissionId.current}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      ))}

      <div className="pt-6 flex items-center justify-between border-t border-slate-200">
        <p className="text-sm text-slate-500">
          {draftToken ? (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Draft saved to email link
            </span>
          ) : (
            'Draft will auto-save once you enter your email'
          )}
        </p>

        <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Response'
          )}
        </Button>
      </div>
    </form>
  )
}
