'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { LoaderCircle, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { submitReviewAction, type SubmitReviewActionState } from './actions'

interface ReviewSubmitFormProps {
  assignmentId: string
  existingGrade: string | null
  existingNotes: string | null
  existingScore: number | null
  gradeOptions: string[]
  isSubmitted: boolean
  maxScore: number
  scoringType: string
}

const initialState: SubmitReviewActionState = {}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button disabled={pending} type="submit">
      {pending ? (
        <>
          <LoaderCircle className="size-4 animate-spin" />
          Submitting review...
        </>
      ) : (
        <>
          Submit review
          <Send className="size-4" />
        </>
      )}
    </Button>
  )
}

export function ReviewSubmitForm({
  assignmentId,
  existingGrade,
  existingNotes,
  existingScore,
  gradeOptions,
  isSubmitted,
  maxScore,
  scoringType,
}: ReviewSubmitFormProps) {
  const boundAction = submitReviewAction.bind(null, assignmentId)
  const [state, formAction] = useActionState(boundAction, initialState)
  const formState = state ?? initialState

  return (
    <Card className="border-primary/10 bg-white/95">
      <CardHeader>
        <CardTitle>{isSubmitted ? 'Submitted review' : 'Submit your review'}</CardTitle>
        <CardDescription>
          {isSubmitted
            ? 'This assignment is complete. The score and notes remain read-only for audit history.'
            : 'Add one score or grade plus any notes the admin should see before the next decision.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          {scoringType === 'grade' ? (
            <div className="space-y-2">
              <Label htmlFor="grade">Grade</Label>
              <select
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                defaultValue={existingGrade || ''}
                disabled={isSubmitted}
                id="grade"
                name="grade"
              >
                <option disabled value="">
                  Select grade
                </option>
                {gradeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="score">Score</Label>
              <Input
                defaultValue={existingScore ?? ''}
                disabled={isSubmitted}
                id="score"
                max={maxScore}
                min={0}
                name="score"
                step="0.01"
                type="number"
              />
              <p className="text-sm text-slate-500">Allowed range: 0 to {maxScore}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              defaultValue={existingNotes ?? ''}
              disabled={isSubmitted}
              id="notes"
              name="notes"
              placeholder="Share strengths, risks, or rationale for your score."
              rows={8}
            />
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

          {isSubmitted ? null : <SubmitButton />}
        </form>
      </CardContent>
    </Card>
  )
}
