'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { LoaderCircle, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createReviewerAction, type ReviewerActionState } from './actions'

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
    <Button className="h-11 w-full text-sm font-semibold" disabled={pending} type="submit">
      {pending ? (
        <>
          <LoaderCircle className="size-4 animate-spin" />
          Creating reviewer...
        </>
      ) : (
        <>
          Create reviewer
          <UserPlus className="size-4" />
        </>
      )}
    </Button>
  )
}

export function ReviewerCreateForm() {
  const [state, formAction] = useActionState(createReviewerAction, initialState)
  const formRef = useRef<HTMLFormElement>(null)
  const formState = state ?? initialState

  useEffect(() => {
    if (formState.success) {
      formRef.current?.reset()
    }
  }, [formState.success])

  return (
    <Card className="border-primary/10 bg-white/95">
      <CardHeader className="space-y-2">
        <CardTitle>Create reviewer</CardTitle>
        <CardDescription>
          Add reviewer accounts here so admins can assign submissions into the Phase 4 review queue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5" noValidate ref={formRef}>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reviewer-name">Full name</Label>
              <Input id="reviewer-name" name="name" placeholder="Aisha Khan" />
              <FieldError errors={formState.errors?.name} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reviewer-email">Email</Label>
              <Input id="reviewer-email" name="email" placeholder="reviewer@formflow.com" type="email" />
              <FieldError errors={formState.errors?.email} />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reviewer-password">Temporary password</Label>
              <Input id="reviewer-password" name="password" placeholder="At least 8 characters" type="password" />
              <FieldError errors={formState.errors?.password} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reviewer-phone">Phone</Label>
              <Input id="reviewer-phone" name="phone" placeholder="+91 98765 43210" />
              <FieldError errors={formState.errors?.phone} />
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reviewer-department">Department</Label>
              <Input id="reviewer-department" name="department" placeholder="Quality Review Board" />
              <FieldError errors={formState.errors?.department} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reviewer-specialization">Specialization</Label>
              <Input id="reviewer-specialization" name="specialization" placeholder="STEM excellence" />
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
      </CardContent>
    </Card>
  )
}
