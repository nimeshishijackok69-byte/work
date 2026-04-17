'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { ArrowRight, LoaderCircle, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  assignReviewerAction,
  decideSubmissionAction,
  type ReviewWorkspaceActionState,
} from './actions'

interface SubmissionReviewCardProps {
  currentLayer: number
  currentLayerAssignments: Array<{
    id: string
    isOverride: boolean
    reviewerName: string
    status: string
  }>
  currentLayerReviews: Array<{
    id: string
    notes: string | null
    reviewerName: string
    value: string
  }>
  eventId: string
  nextAssignableLayer: number | null
  reviewers: Array<{
    id: string
    isActive: boolean
    name: string
    pendingAssignments: number
  }>
  reviewLayers: number
  reviewStatus: string
  submissionId: string
  submissionLabel: string
  submittedAtLabel: string
  teacherEmail: string | null
  teacherName: string | null
  teacherSchool: string | null
}

const initialState: ReviewWorkspaceActionState = {}

function SubmitButton({
  children,
  pendingLabel,
  variant = 'default',
}: {
  children: React.ReactNode
  pendingLabel: string
  variant?: 'default' | 'outline' | 'destructive'
}) {
  const { pending } = useFormStatus()

  return (
    <Button disabled={pending} type="submit" variant={variant}>
      {pending ? (
        <>
          <LoaderCircle className="size-4 animate-spin" />
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </Button>
  )
}

function StatusBadge({ reviewStatus }: { reviewStatus: string }) {
  const styles =
    reviewStatus === 'reviewed'
      ? 'border-blue-200 bg-blue-50 text-blue-700'
      : reviewStatus === 'in_review'
        ? 'border-amber-200 bg-amber-50 text-amber-700'
        : reviewStatus === 'advanced'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : reviewStatus === 'eliminated'
            ? 'border-slate-200 bg-slate-100 text-slate-600'
            : 'border-slate-200 bg-slate-50 text-slate-600'

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${styles}`}>
      {reviewStatus.replaceAll('_', ' ')}
    </span>
  )
}

export function SubmissionReviewCard({
  currentLayer,
  currentLayerAssignments,
  currentLayerReviews,
  eventId,
  nextAssignableLayer,
  reviewers,
  reviewLayers,
  reviewStatus,
  submissionId,
  submissionLabel,
  submittedAtLabel,
  teacherEmail,
  teacherName,
  teacherSchool,
}: SubmissionReviewCardProps) {
  const assignAction = assignReviewerAction.bind(
    null,
    eventId,
    submissionId,
    nextAssignableLayer ?? 1
  )
  const advanceAction = decideSubmissionAction.bind(
    null,
    eventId,
    submissionId,
    currentLayer,
    'advance'
  )
  const eliminateAction = decideSubmissionAction.bind(
    null,
    eventId,
    submissionId,
    currentLayer,
    'eliminate'
  )
  const [assignState, assignFormAction] = useActionState(assignAction, initialState)
  const [advanceState, advanceFormAction] = useActionState(advanceAction, initialState)
  const [eliminateState, eliminateFormAction] = useActionState(eliminateAction, initialState)
  const canDecide = reviewStatus === 'reviewed'
  const canAdvance = canDecide && currentLayer < reviewLayers
  const canAssign = nextAssignableLayer !== null

  return (
    <Card className="border-white/80 bg-white/95">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>{submissionLabel}</CardTitle>
            <CardDescription>Submitted {submittedAtLabel}</CardDescription>
          </div>
          <StatusBadge reviewStatus={reviewStatus} />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-3">
          <p>
            <span className="font-semibold text-slate-900">Teacher:</span> {teacherName || 'Unknown'}
          </p>
          <p>
            <span className="font-semibold text-slate-900">Email:</span> {teacherEmail || 'Unknown'}
          </p>
          <p>
            <span className="font-semibold text-slate-900">School:</span> {teacherSchool || 'Not provided'}
          </p>
          <p>
            <span className="font-semibold text-slate-900">Current layer:</span> {currentLayer || 0}
          </p>
          <p>
            <span className="font-semibold text-slate-900">Assignments:</span> {currentLayerAssignments.length}
          </p>
          <p>
            <span className="font-semibold text-slate-900">Completed reviews:</span> {currentLayerReviews.length}
          </p>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.95fr]">
          <div className="space-y-3">
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-900">Current layer assignments</h3>
              <p className="text-sm text-slate-500">
                These reviewers can access this submission in Layer {currentLayer || nextAssignableLayer || 1}.
              </p>
            </div>
            {currentLayerAssignments.length ? (
              <div className="grid gap-3">
                {currentLayerAssignments.map((assignment) => (
                  <div
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"
                    key={assignment.id}
                  >
                    <p className="font-semibold text-slate-950">{assignment.reviewerName}</p>
                    <p className="mt-1 capitalize">Status: {assignment.status.replaceAll('_', ' ')}</p>
                    {assignment.isOverride ? (
                      <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                        Override assignment
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                No reviewers are assigned yet for the active layer.
              </div>
            )}

            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-900">Current layer review results</h3>
              <p className="text-sm text-slate-500">
                Completed reviews stay here until the admin advances or eliminates the submission.
              </p>
            </div>
            {currentLayerReviews.length ? (
              <div className="grid gap-3">
                {currentLayerReviews.map((review) => (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4" key={review.id}>
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-semibold text-slate-950">{review.reviewerName}</p>
                      <p className="text-sm font-semibold text-slate-700">{review.value}</p>
                    </div>
                    {review.notes ? (
                      <p className="mt-2 text-sm leading-6 text-slate-600">{review.notes}</p>
                    ) : (
                      <p className="mt-2 text-sm text-slate-400">No notes added.</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                No completed reviews for the current layer yet.
              </div>
            )}
          </div>

          <div className="space-y-5">
            <Card className="border-slate-200 shadow-none">
              <CardHeader>
                <CardTitle className="text-base">Assign reviewer</CardTitle>
                <CardDescription>
                  Add one reviewer at a time for Layer {nextAssignableLayer ?? currentLayer || 1}.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {canAssign ? (
                  <form action={assignFormAction} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`reviewer-${submissionId}`}>Reviewer</Label>
                      <select
                        className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/15"
                        defaultValue=""
                        id={`reviewer-${submissionId}`}
                        name="reviewer_id"
                      >
                        <option disabled value="">
                          Select a reviewer
                        </option>
                        {reviewers
                          .filter((reviewer) => reviewer.isActive)
                          .map((reviewer) => (
                            <option key={reviewer.id} value={reviewer.id}>
                              {reviewer.name} ({reviewer.pendingAssignments} open)
                            </option>
                          ))}
                      </select>
                    </div>

                    <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                      <input className="mt-1 size-4" name="is_override" type="checkbox" />
                      <span>
                        Mark as override assignment to document that this reviewer was added outside the standard pool.
                      </span>
                    </label>

                    {assignState.message ? (
                      <p
                        className={
                          assignState.success ? 'text-sm text-emerald-700' : 'text-sm text-destructive'
                        }
                      >
                        {assignState.message}
                      </p>
                    ) : null}

                    <SubmitButton pendingLabel="Assigning reviewer...">
                      Assign reviewer
                      <UserPlus className="size-4" />
                    </SubmitButton>
                  </form>
                ) : (
                  <p className="text-sm text-slate-500">
                    This submission is no longer eligible for new assignments.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-none">
              <CardHeader>
                <CardTitle className="text-base">Admin decision</CardTitle>
                <CardDescription>
                  After all reviews for Layer {currentLayer || 1} are complete, move the submission forward or stop it here.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {canAdvance ? (
                  <form action={advanceFormAction}>
                    <SubmitButton pendingLabel="Advancing..." variant="outline">
                      Advance to Layer {currentLayer + 1}
                      <ArrowRight className="size-4" />
                    </SubmitButton>
                  </form>
                ) : canDecide ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    Final-layer reviews are complete. You can eliminate this submission or keep it as a finished finalist.
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                    Decisions unlock once the current layer has finished all assigned reviews.
                  </div>
                )}

                <form action={eliminateFormAction}>
                  <SubmitButton pendingLabel="Eliminating..." variant="destructive">
                    Eliminate submission
                  </SubmitButton>
                </form>

                {advanceState.message ? (
                  <p
                    className={
                      advanceState.success ? 'text-sm text-emerald-700' : 'text-sm text-destructive'
                    }
                  >
                    {advanceState.message}
                  </p>
                ) : null}

                {eliminateState.message ? (
                  <p
                    className={
                      eliminateState.success ? 'text-sm text-emerald-700' : 'text-sm text-destructive'
                    }
                  >
                    {eliminateState.message}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
