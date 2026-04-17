'use client'

import { Input } from '@/components/ui/input'

function getLabel(field: string) {
  switch (field) {
    case 'name':
      return 'Full name'
    case 'email':
      return 'Email address'
    case 'phone':
      return 'Phone number'
    case 'school_name':
      return 'School name'
    default:
      return field
  }
}

function getPlaceholder(field: string) {
  switch (field) {
    case 'name':
      return 'Your full name'
    case 'email':
      return 'you@school.edu'
    case 'phone':
      return '+91 98765 43210'
    case 'school_name':
      return 'Your school name'
    default:
      return ''
  }
}

function getType(field: string) {
  switch (field) {
    case 'email':
      return 'email'
    case 'phone':
      return 'tel'
    default:
      return 'text'
  }
}

export function TeacherInfoFields({
  teacherFields,
  values,
  errors,
  onChange,
}: {
  teacherFields: string[]
  values: Record<string, string>
  errors: Record<string, string | undefined>
  onChange: (field: string, value: string) => void
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">Your details</h2>
      <p className="mt-1 text-sm text-slate-500">
        Please provide your information before filling out the form.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {teacherFields.map((field) => {
          const isRequired = field === 'name' || field === 'email'

          return (
            <div className="space-y-1.5" key={field}>
              <label
                className="flex items-center gap-1 text-sm font-medium text-slate-700"
                htmlFor={`teacher-${field}`}
              >
                {getLabel(field)}
                {isRequired && (
                  <span className="text-rose-500">*</span>
                )}
              </label>
              <Input
                id={`teacher-${field}`}
                name={field}
                onChange={(e) => onChange(field, e.target.value)}
                placeholder={getPlaceholder(field)}
                required={isRequired}
                type={getType(field)}
                value={values[field] ?? ''}
              />
              {errors[field] && (
                <p className="text-xs text-rose-600">{errors[field]}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
