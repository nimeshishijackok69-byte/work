'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { LoaderCircle, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateReviewerAction, type ReviewerActionState } from './actions'

interface ReviewerEditFormProps {
  reviewer: {
    department: string | null
    email: string
    id: string
    name: string
    phone: string | null
    specialization: string | null
  }
}

const initialState: ReviewerActionState = {}

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) {
    return null
  }

  return <p className="text-sm text-destructive">{errors[0]}</p>
}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button disabled={pending} size="sm" type="submit" variant="outline">
      {pending ? (
        <>
          <LoaderCircle className="size-4 animate-spin" />
          Saving...
        </>
      ) : (
        <>
          Save profile
          <Save className="size-4" />
        </>
      )}
    </Button>
  )
}

export function ReviewerEditForm({ reviewer }: ReviewerEditFormProps) {
  const boundAction = updateReviewerAction.bind(null, reviewer.id)
  const [state, formAction] = useActionState(boundAction, initialState)
  const formState = state ?? initialState

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`reviewer-name-${reviewer.id}`}>Full name</Label>
          <Input defaultValue={reviewer.name} id={`reviewer-name-${reviewer.id}`} name="name" />
          <FieldError errors={formState.errors?.name} />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`reviewer-email-${reviewer.id}`}>Email</Label>
          <Input
            defaultValue={reviewer.email}
            id={`reviewer-email-${reviewer.id}`}
            name="email"
            type="email"
          />
          <FieldError errors={formState.errors?.email} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`reviewer-phone-${reviewer.id}`}>Phone</Label>
          <Input defaultValue={reviewer.phone ?? ''} id={`reviewer-phone-${reviewer.id}`} name="phone" />
          <FieldError errors={formState.errors?.phone} />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`reviewer-password-${reviewer.id}`}>New password</Label>
          <Input
            id={`reviewer-password-${reviewer.id}`}
            name="password"
            placeholder="Leave blank to keep current password"
            type="password"
          />
          <FieldError errors={formState.errors?.password} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`reviewer-department-${reviewer.id}`}>Department</Label>
          <Input
            defaultValue={reviewer.department ?? ''}
            id={`reviewer-department-${reviewer.id}`}
            name="department"
          />
          <FieldError errors={formState.errors?.department} />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`reviewer-specialization-${reviewer.id}`}>Specialization</Label>
          <Input
            defaultValue={reviewer.specialization ?? ''}
            id={`reviewer-specialization-${reviewer.id}`}
            name="specialization"
          />
          <FieldError errors={formState.errors?.specialization} />
        </div>
      </div>

      {formState.message ? (
        <div
          className={
            formState.success
              ? 'rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700'
              : 'rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive'
          }
        >
          {formState.message}
        </div>
      ) : null}

      <SubmitButton />
    </form>
  )
}
