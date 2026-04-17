import { auth } from '@/lib/auth/auth'
import { sendReviewerAssignmentEmail } from '@/lib/email/resend'
import { getEventForAdmin, type AdminContext } from '@/lib/events/service'
import { normalizeFormSchema } from '@/lib/forms/schema'
import { createNotification } from '@/lib/notifications/service'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeGradeConfig } from '@/lib/validations/events'
import type { Database, Json } from '@/types/database'

type SupabaseAdminClient = ReturnType<typeof createAdminClient>
type ReviewerRow = Database['public']['Tables']['reviewer_master']['Row']
type SubmissionRow = Database['public']['Tables']['submission']['Row']
type AssignmentRow = Database['public']['Tables']['review_assignment']['Row']
type ReviewRow = Database['public']['Tables']['review']['Row']
type EventRow = Database['public']['Tables']['event_master']['Row']
type TeacherRow = Database['public']['Tables']['user_master']['Row']
type TransactionInsert = Database['public']['Tables']['transaction_master']['Insert']

export interface ReviewerContext {
  reviewer: ReviewerRow
  supabase: SupabaseAdminClient
}

export interface ReviewerListItem {
  reviewer: ReviewerRow
  completedAssignments: number
  pendingAssignments: number
  totalAssignments: number
  recentAssignments: ReviewerAssignmentHistoryItem[]
}

export interface ReviewerAssignmentHistoryItem {
  assignmentId: string
  assignedAt: string
  completedAt: string | null
  eventId: string
  eventTitle: string
  layer: number
  status: string
  submissionId: string
  submissionNumber: number
}

export interface AdminSubmissionReviewRecord {
  review: ReviewRow
  reviewer: ReviewerRow | null
}

export interface AdminSubmissionAssignmentRecord {
  assignment: AssignmentRow
  reviewer: ReviewerRow | null
}

export interface AdminEventSubmissionRecord {
  submission: SubmissionRow
  teacher: TeacherRow | null
  currentLayerAssignments: AdminSubmissionAssignmentRecord[]
  currentLayerReviews: AdminSubmissionReviewRecord[]
  assignmentHistory: AdminSubmissionAssignmentRecord[]
  nextAssignableLayer: number | null
  displayStatus: ReviewWorkspaceStatus
  layerProgress: SubmissionLayerProgress[]
  responseDetails: SubmissionResponseItem[]
  attachments: SubmissionAttachmentItem[]
}

export interface EventReviewWorkspace {
  event: EventRow
  reviewers: ReviewerListItem[]
  submissions: AdminEventSubmissionRecord[]
  availableLayers: number[]
  counts: Record<ReviewWorkspaceStatus | 'all', number>
  page: number
  limit: number
  total: number
}

export interface EventReviewWorkspaceQuery {
  layer?: number
  limit: number
  page: number
  q?: string
  status?: ReviewWorkspaceStatus
}

export type ReviewWorkspaceStatus =
  | 'draft'
  | 'submitted'
  | 'in_review'
  | 'reviewed'
  | 'advanced'
  | 'eliminated'

export interface ReviewerAssignmentListItem {
  assignment: AssignmentRow
  event: EventRow | null
  submission: SubmissionRow | null
  teacher: TeacherRow | null
  review: ReviewRow | null
  displayStatus: ReviewerAssignmentStatus
}

export interface ReviewerAssignmentDetail {
  assignment: AssignmentRow
  event: EventRow
  submission: SubmissionRow
  teacher: TeacherRow | null
  previousReviews: ReviewRow[]
  submittedReview: ReviewRow | null
}

export interface ReviewerAssignmentsListResult {
  assignments: ReviewerAssignmentListItem[]
  availableEvents: Array<{ id: string; title: string }>
  availableLayers: number[]
  counts: Record<ReviewerAssignmentStatus | 'all', number>
  limit: number
  page: number
  total: number
}

export interface ReviewerAssignmentsQuery {
  event_id?: string
  layer?: number
  limit: number
  page: number
  q?: string
  status?: ReviewerAssignmentStatus
}

export type ReviewerAssignmentStatus = 'pending' | 'in_progress' | 'completed'

export interface CreateReviewerInput {
  department?: string
  email: string
  name: string
  password: string
  phone?: string
  specialization?: string
}

export interface UpdateReviewerInput {
  department?: string
  email: string
  name: string
  password?: string
  phone?: string
  specialization?: string
}

export interface AssignReviewInput {
  assignments: Array<{
    is_override?: boolean
    layer: number
    reviewer_id: string
    submission_id: string
  }>
  event_id: string
}

export interface SubmitReviewInput {
  assignment_id: string
  grade?: string
  notes?: string
  score?: number
}

export interface AdvanceSubmissionsInput {
  advance: string[]
  eliminate: string[]
  event_id: string
  layer: number
}

export interface SubmissionLayerProgress {
  completedAssignments: number
  isCurrentLayer: boolean
  layer: number
  reviewValues: string[]
  totalAssignments: number
}

export interface SubmissionResponseItem {
  label: string
  type: string
  value: string
}

export interface SubmissionAttachmentItem {
  fileName: string
  fileUrl: string
}

export class ReviewerAccessError extends Error {
  constructor(message = 'Only reviewers can perform this action.') {
    super(message)
    this.name = 'ReviewerAccessError'
  }
}

export class ReviewerNotFoundError extends Error {
  constructor(message = 'Reviewer not found.') {
    super(message)
    this.name = 'ReviewerNotFoundError'
  }
}

export class ReviewAssignmentNotFoundError extends Error {
  constructor(message = 'Review assignment not found.') {
    super(message)
    this.name = 'ReviewAssignmentNotFoundError'
  }
}

export class ReviewValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ReviewValidationError'
  }
}

export class ReviewWorkflowError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ReviewWorkflowError'
  }
}

export async function requireReviewerContext(): Promise<ReviewerContext> {
  const session = await auth()

  if (!session?.user || session.user.role !== 'reviewer') {
    throw new ReviewerAccessError()
  }

  const supabase = createAdminClient()
  const { data: reviewer, error } = await supabase
    .from('reviewer_master')
    .select('*')
    .eq('auth_user_id', session.user.id)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    console.error('[REVIEWS] Failed to load reviewer profile', error)
    throw new Error('Unable to verify your reviewer profile.')
  }

  if (!reviewer) {
    throw new ReviewerAccessError('Reviewer profile not found.')
  }

  return {
    reviewer: reviewer as ReviewerRow,
    supabase,
  }
}

export async function listReviewersForAdmin(
  context: AdminContext
): Promise<ReviewerListItem[]> {
  const { supabase } = context
  const [reviewersResult, assignmentsResult] = await Promise.all([
    supabase.from('reviewer_master').select('*').order('created_at', { ascending: false }),
    supabase.from('review_assignment').select('*').order('assigned_at', { ascending: false }),
  ])

  if (reviewersResult.error) {
    console.error('[REVIEWS] Failed to load reviewers', reviewersResult.error)
    throw new Error('Unable to load reviewers right now.')
  }

  if (assignmentsResult.error) {
    console.error('[REVIEWS] Failed to load reviewer assignments', assignmentsResult.error)
    throw new Error('Unable to load reviewer history right now.')
  }

  const reviewers = ((reviewersResult.data as ReviewerRow[] | null) ?? []).filter(Boolean)
  const assignments = (assignmentsResult.data as AssignmentRow[] | null) ?? []
  const assignmentsByReviewer = groupBy(assignments, (assignment) => assignment.reviewer_id)
  const eventMap = await loadEventsByIds(
    supabase,
    assignments.map((assignment) => assignment.event_id)
  )
  const submissionMap = await loadSubmissionsByIds(
    supabase,
    assignments.map((assignment) => assignment.submission_id)
  )

  return reviewers.map((reviewer) => {
    const reviewerAssignments = assignmentsByReviewer.get(reviewer.id) ?? []
    const completedAssignments = reviewerAssignments.filter(
      (assignment) => assignment.status === 'completed'
    ).length
    const pendingAssignments = reviewerAssignments.filter((assignment) =>
      ['pending', 'in_progress'].includes(assignment.status)
    ).length

    return {
      reviewer,
      completedAssignments,
      pendingAssignments,
      totalAssignments: reviewerAssignments.length,
      recentAssignments: reviewerAssignments.slice(0, 5).map((assignment) => ({
        assignmentId: assignment.id,
        assignedAt: assignment.assigned_at,
        completedAt: assignment.completed_at,
        eventId: assignment.event_id,
        eventTitle: eventMap.get(assignment.event_id)?.title || 'Untitled event',
        layer: assignment.layer,
        status: assignment.status,
        submissionId: assignment.submission_id,
        submissionNumber: submissionMap.get(assignment.submission_id)?.submission_number ?? 0,
      })),
    }
  })
}

export async function createReviewerForAdmin(
  context: AdminContext,
  input: CreateReviewerInput
): Promise<ReviewerRow> {
  const { supabase } = context

  const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      name: input.name,
      role: 'reviewer',
    },
  })

  if (createUserError || !createdUser.user) {
    console.error('[REVIEWS] Failed to create reviewer auth user', createUserError)
    throw new ReviewValidationError(createUserError?.message ?? 'Unable to create the reviewer.')
  }

  const reviewerProfile: Database['public']['Tables']['reviewer_master']['Insert'] = {
    auth_user_id: createdUser.user.id,
    department: input.department ?? null,
    email: input.email,
    name: input.name,
    phone: input.phone ?? null,
    specialization: input.specialization ?? null,
  }

  const { data, error } = await supabase
    .from('reviewer_master')
    .insert(reviewerProfile as never)
    .select('*')
    .single()

  if (error || !data) {
    await supabase.auth.admin.deleteUser(createdUser.user.id)
    console.error('[REVIEWS] Failed to create reviewer profile', error)
    throw new Error('Unable to create the reviewer profile.')
  }

  return data as ReviewerRow
}

export async function setReviewerActiveStateForAdmin(
  context: AdminContext,
  reviewerId: string,
  isActive: boolean
): Promise<ReviewerRow> {
  const { supabase } = context

  const { data, error } = await supabase
    .from('reviewer_master')
    .update({ is_active: isActive } as never)
    .eq('id', reviewerId)
    .select('*')
    .maybeSingle()

  if (error) {
    console.error('[REVIEWS] Failed to update reviewer status', error)
    throw new Error('Unable to update the reviewer status right now.')
  }

  if (!data) {
    throw new ReviewerNotFoundError()
  }

  return data as ReviewerRow
}

export async function updateReviewerForAdmin(
  context: AdminContext,
  reviewerId: string,
  input: UpdateReviewerInput
): Promise<ReviewerRow> {
  const { supabase } = context
  const existingReviewerQuery = await supabase
    .from('reviewer_master')
    .select('*')
    .eq('id', reviewerId)
    .maybeSingle<ReviewerRow>()

  if (existingReviewerQuery.error) {
    console.error('[REVIEWS] Failed to load reviewer for update', existingReviewerQuery.error)
    throw new Error('Unable to update the reviewer right now.')
  }

  const existingReviewer = existingReviewerQuery.data
  if (!existingReviewer) {
    throw new ReviewerNotFoundError()
  }

  const authUpdatePayload: Parameters<typeof supabase.auth.admin.updateUserById>[1] = {
    email: input.email,
    user_metadata: {
      name: input.name,
      role: 'reviewer',
    },
  }

  if (input.password) {
    authUpdatePayload.password = input.password
  }

  const { error: authUpdateError } = await supabase.auth.admin.updateUserById(
    existingReviewer.auth_user_id,
    authUpdatePayload
  )

  if (authUpdateError) {
    console.error('[REVIEWS] Failed to update reviewer auth user', authUpdateError)
    throw new ReviewValidationError(authUpdateError.message || 'Unable to update the reviewer login.')
  }

  const reviewerUpdate: Database['public']['Tables']['reviewer_master']['Update'] = {
    department: input.department ?? null,
    email: input.email,
    name: input.name,
    phone: input.phone ?? null,
    specialization: input.specialization ?? null,
  }

  const { data, error } = await supabase
    .from('reviewer_master')
    .update(reviewerUpdate as never)
    .eq('id', reviewerId)
    .select('*')
    .maybeSingle()

  if (error) {
    console.error('[REVIEWS] Failed to update reviewer profile', error)
    throw new Error('Unable to update the reviewer profile right now.')
  }

  if (!data) {
    throw new ReviewerNotFoundError()
  }

  return data as ReviewerRow
}

export async function getEventReviewWorkspaceForAdmin(
  context: AdminContext,
  eventId: string,
  query: EventReviewWorkspaceQuery
): Promise<EventReviewWorkspace | null> {
  const event = await getEventForAdmin(context, eventId)

  if (!event) {
    return null
  }

  const { supabase } = context
  const [reviewers, submissionsResult, assignmentsResult, reviewsResult] = await Promise.all([
    listReviewersForAdmin(context),
    supabase
      .from('submission')
      .select('*')
      .eq('event_id', eventId)
      .order('submitted_at', { ascending: false, nullsFirst: false }),
    supabase
      .from('review_assignment')
      .select('*')
      .eq('event_id', eventId)
      .order('assigned_at', { ascending: false }),
    supabase
      .from('review')
      .select('*')
      .eq('event_id', eventId)
      .order('reviewed_at', { ascending: false }),
  ])

  if (submissionsResult.error) {
    console.error('[REVIEWS] Failed to load event submissions', submissionsResult.error)
    throw new Error('Unable to load event submissions right now.')
  }

  if (assignmentsResult.error) {
    console.error('[REVIEWS] Failed to load review assignments', assignmentsResult.error)
    throw new Error('Unable to load review assignments right now.')
  }

  if (reviewsResult.error) {
    console.error('[REVIEWS] Failed to load reviews', reviewsResult.error)
    throw new Error('Unable to load review results right now.')
  }

  const submissions = (submissionsResult.data as SubmissionRow[] | null) ?? []
  const assignments = (assignmentsResult.data as AssignmentRow[] | null) ?? []
  const reviews = (reviewsResult.data as ReviewRow[] | null) ?? []

  const teachers = await loadTeachersByIds(
    supabase,
    submissions.map((submission) => submission.user_id)
  )
  const reviewersById = new Map(
    reviewers.map((entry) => [entry.reviewer.id, entry.reviewer] as const)
  )
  const assignmentsBySubmission = groupBy(assignments, (assignment) => assignment.submission_id)
  const reviewsBySubmission = groupBy(reviews, (review) => review.submission_id)

  const submissionRecords = submissions.map((submission) => {
    const submissionAssignments = assignmentsBySubmission.get(submission.id) ?? []
    const submissionReviews = reviewsBySubmission.get(submission.id) ?? []
    const currentLayer = submission.current_layer || 1
    const currentLayerAssignments = submissionAssignments.filter(
      (assignment) => assignment.layer === currentLayer
    )
    const currentLayerReviews = submissionReviews.filter((review) => review.layer === currentLayer)
    const teacher = teachers.get(submission.user_id) ?? null

    return {
      submission,
      teacher,
      currentLayerAssignments: currentLayerAssignments.map((assignment) => ({
        assignment,
        reviewer: reviewersById.get(assignment.reviewer_id) ?? null,
      })),
      currentLayerReviews: currentLayerReviews.map((review) => ({
        review,
        reviewer: reviewersById.get(review.reviewer_id) ?? null,
      })),
      assignmentHistory: submissionAssignments.map((assignment) => ({
        assignment,
        reviewer: reviewersById.get(assignment.reviewer_id) ?? null,
      })),
      displayStatus: getSubmissionDisplayStatus(submission),
      layerProgress: getSubmissionLayerProgress(
        event,
        submission,
        submissionAssignments,
        submissionReviews
      ),
      responseDetails: getSubmissionResponseDetails(event, submission),
      attachments: getSubmissionAttachments(submission.file_attachments),
      nextAssignableLayer: getNextAssignableLayer(submission, event.review_layers),
    }
  })

  const counts = getSubmissionCounts(submissionRecords)
  const filteredSubmissions = submissionRecords.filter((record) =>
    matchesSubmissionFilters(record, query)
  )
  const startIndex = (query.page - 1) * query.limit
  const paginatedSubmissions = filteredSubmissions.slice(startIndex, startIndex + query.limit)

  return {
    event,
    reviewers,
    submissions: paginatedSubmissions,
    availableLayers: getAvailableSubmissionLayers(submissionRecords),
    counts,
    page: query.page,
    limit: query.limit,
    total: filteredSubmissions.length,
  }
}

export async function assignReviewsForAdmin(
  context: AdminContext,
  input: AssignReviewInput
): Promise<AssignmentRow[]> {
  const event = await getEventForAdmin(context, input.event_id)

  if (!event) {
    throw new ReviewWorkflowError('Event not found.')
  }

  if (event.status !== 'published') {
    throw new ReviewWorkflowError('Assignments can only be created for published events.')
  }

  if (!input.assignments.length) {
    throw new ReviewValidationError('Add at least one assignment.')
  }

  const { admin, supabase } = context
  const submissionIds = unique(input.assignments.map((assignment) => assignment.submission_id))
  const reviewerIds = unique(input.assignments.map((assignment) => assignment.reviewer_id))
  const layers = Array.from(new Set(input.assignments.map((assignment) => assignment.layer)))

  const [submissionResult, reviewerResult, existingResult] = await Promise.all([
    supabase.from('submission').select('*').in('id', submissionIds).eq('event_id', event.id),
    supabase
      .from('reviewer_master')
      .select('*')
      .in('id', reviewerIds)
      .eq('is_active', true),
    supabase
      .from('review_assignment')
      .select('*')
      .in('submission_id', submissionIds)
      .in('reviewer_id', reviewerIds)
      .in('layer', layers),
  ])

  if (submissionResult.error) {
    console.error('[REVIEWS] Failed to load submissions for assignment', submissionResult.error)
    throw new Error('Unable to prepare assignments right now.')
  }

  if (reviewerResult.error) {
    console.error('[REVIEWS] Failed to load reviewers for assignment', reviewerResult.error)
    throw new Error('Unable to prepare assignments right now.')
  }

  if (existingResult.error) {
    console.error('[REVIEWS] Failed to load existing assignments', existingResult.error)
    throw new Error('Unable to verify duplicate assignments right now.')
  }

  const submissionsById = new Map(
    (((submissionResult.data as SubmissionRow[] | null) ?? []).map((submission) => [
      submission.id,
      submission,
    ]) as Array<[string, SubmissionRow]>)
  )
  const reviewersById = new Map(
    (((reviewerResult.data as ReviewerRow[] | null) ?? []).map((reviewer) => [
      reviewer.id,
      reviewer,
    ]) as Array<[string, ReviewerRow]>)
  )
  const existingKeys = new Set(
    (((existingResult.data as AssignmentRow[] | null) ?? []).map((assignment) =>
      buildAssignmentKey(assignment.submission_id, assignment.reviewer_id, assignment.layer)
    ))
  )

  for (const assignment of input.assignments) {
    const submission = submissionsById.get(assignment.submission_id)

    if (!submission) {
      throw new ReviewValidationError('One or more selected submissions were not found.')
    }

    if (!reviewersById.has(assignment.reviewer_id)) {
      throw new ReviewValidationError('One or more selected reviewers are inactive or unavailable.')
    }

    if (assignment.layer < 1 || assignment.layer > event.review_layers) {
      throw new ReviewValidationError(
        `Event only supports review layers 1 through ${event.review_layers}.`
      )
    }

    if (submission.status !== 'submitted') {
      throw new ReviewValidationError('Only submitted entries can be assigned for review.')
    }

    if (submission.review_status === 'eliminated') {
      throw new ReviewValidationError('Eliminated submissions cannot receive new assignments.')
    }

    const expectedLayer = submission.current_layer > 0 ? submission.current_layer : 1

    if (assignment.layer !== expectedLayer) {
      throw new ReviewWorkflowError(
        `Submission ${submission.id.slice(0, 8).toUpperCase()} is only eligible for layer ${expectedLayer}.`
      )
    }

    if (existingKeys.has(buildAssignmentKey(submission.id, assignment.reviewer_id, assignment.layer))) {
      throw new ReviewValidationError('That reviewer is already assigned to this submission at that layer.')
    }
  }

  const assignmentRows: Database['public']['Tables']['review_assignment']['Insert'][] =
    input.assignments.map((assignment) => ({
      event_id: event.id,
      submission_id: assignment.submission_id,
      reviewer_id: assignment.reviewer_id,
      layer: assignment.layer,
      is_override: assignment.is_override ?? false,
      assigned_by: admin.id,
      status: 'pending',
    }))

  const { data, error } = await supabase
    .from('review_assignment')
    .insert(assignmentRows as never)
    .select('*')

  if (error || !data) {
    console.error('[REVIEWS] Failed to create review assignments', error)
    throw new Error('Unable to create the review assignments right now.')
  }

  const createdAssignments = data as AssignmentRow[]
  const submissionsToUpdate = new Map<string, number>()

  for (const assignment of input.assignments) {
    submissionsToUpdate.set(assignment.submission_id, assignment.layer)
  }

  await Promise.all(
    Array.from(submissionsToUpdate.entries()).map(([submissionId, layer]) =>
      supabase
        .from('submission')
        .update({
          current_layer: layer,
          review_status: 'in_review',
        } as never)
        .eq('id', submissionId)
        .eq('event_id', event.id)
    )
  )

  await Promise.all(
    createdAssignments.map((assignment) =>
      logTransaction(supabase, {
        action: assignment.is_override ? 'assignment_override' : `reviewer_assigned_r${assignment.layer}`,
        actor_id: admin.id,
        actor_type: 'admin',
        event_id: assignment.event_id,
        submission_id: assignment.submission_id,
        metadata: {
          layer: assignment.layer,
          reviewer_id: assignment.reviewer_id,
        },
      })
    )
  )

  await createAssignmentNotificationsAndEmails(
    supabase,
    event,
    createdAssignments,
    reviewersById,
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reviewer`
  )

  return createdAssignments
}

export async function listAssignmentsForReviewer(
  context: ReviewerContext,
  query: ReviewerAssignmentsQuery
): Promise<ReviewerAssignmentsListResult> {
  const { reviewer, supabase } = context
  const { data, error } = await supabase
    .from('review_assignment')
    .select('*')
    .eq('reviewer_id', reviewer.id)
    .order('assigned_at', { ascending: false })

  if (error) {
    console.error('[REVIEWS] Failed to load reviewer assignments', error)
    throw new Error('Unable to load your assignments right now.')
  }

  const assignments = (data as AssignmentRow[] | null) ?? []
  const eventIds = unique(assignments.map((assignment) => assignment.event_id))
  const submissionIds = unique(assignments.map((assignment) => assignment.submission_id))

  const [events, submissions, reviews] = await Promise.all([
    loadEventsByIds(supabase, eventIds),
    loadSubmissionsByIds(supabase, submissionIds),
    loadSubmittedReviewsByAssignmentIds(
      supabase,
      assignments.map((assignment) => assignment.id)
    ),
  ])

  const teachers = await loadTeachersByIds(
    supabase,
    Array.from(submissions.values()).map((submission) => submission.user_id)
  )

  const records = assignments.map((assignment) => {
    const submission = submissions.get(assignment.submission_id) ?? null

    return {
      assignment,
      event: events.get(assignment.event_id) ?? null,
      submission,
      teacher: submission ? teachers.get(submission.user_id) ?? null : null,
      review: reviews.get(assignment.id) ?? null,
      displayStatus: normalizeReviewerAssignmentStatus(assignment.status),
    }
  })

  const filteredAssignments = records.filter((record) => matchesReviewerAssignmentFilters(record, query))
  const startIndex = (query.page - 1) * query.limit
  const paginatedAssignments = filteredAssignments.slice(startIndex, startIndex + query.limit)

  return {
    assignments: paginatedAssignments,
    availableEvents: Array.from(events.values())
      .map((event) => ({ id: event.id, title: event.title }))
      .sort((left, right) => left.title.localeCompare(right.title)),
    availableLayers: Array.from(
      new Set(records.map((record) => record.assignment.layer).filter((layer) => layer > 0))
    ).sort((left, right) => left - right),
    counts: getReviewerAssignmentCounts(records),
    limit: query.limit,
    page: query.page,
    total: filteredAssignments.length,
  }
}

export async function getReviewerAssignmentDetail(
  context: ReviewerContext,
  assignmentId: string
): Promise<ReviewerAssignmentDetail | null> {
  const { reviewer, supabase } = context
  const { data, error } = await supabase
    .from('review_assignment')
    .select('*')
    .eq('id', assignmentId)
    .eq('reviewer_id', reviewer.id)
    .maybeSingle()

  if (error) {
    console.error('[REVIEWS] Failed to load reviewer assignment', error)
    throw new Error('Unable to load the assignment right now.')
  }

  if (!data) {
    return null
  }

  const assignment = await markAssignmentInProgressIfNeeded(supabase, data as AssignmentRow, reviewer.id)
  const [event, submission, submittedReview, previousReviews] = await Promise.all([
    loadEventById(supabase, assignment.event_id),
    loadSubmissionById(supabase, assignment.submission_id),
    loadReviewByAssignmentId(supabase, assignment.id),
    loadPreviousReviewsForReviewer(
      supabase,
      assignment.submission_id,
      reviewer.id,
      assignment.layer
    ),
  ])

  if (!event || !submission) {
    throw new Error('The assignment is missing related data.')
  }

  const teachers = await loadTeachersByIds(supabase, [submission.user_id])

  return {
    assignment,
    event,
    submission,
    teacher: teachers.get(submission.user_id) ?? null,
    previousReviews,
    submittedReview,
  }
}

export async function submitReviewForReviewer(
  context: ReviewerContext,
  input: SubmitReviewInput
): Promise<ReviewRow> {
  const { reviewer, supabase } = context
  const detail = await getReviewerAssignmentDetail(context, input.assignment_id)

  if (!detail) {
    throw new ReviewAssignmentNotFoundError()
  }

  if (detail.assignment.status === 'completed' || detail.submittedReview) {
    throw new ReviewWorkflowError('This review has already been submitted.')
  }

  const payload = buildReviewPayload(detail.event, input)
  const reviewedAt = new Date().toISOString()

  const { data, error } = await supabase
    .from('review')
    .insert({
      assignment_id: detail.assignment.id,
      event_id: detail.assignment.event_id,
      submission_id: detail.assignment.submission_id,
      reviewer_id: reviewer.id,
      layer: detail.assignment.layer,
      notes: payload.notes,
      score: payload.score,
      grade: payload.grade,
      reviewed_at: reviewedAt,
    } as never)
    .select('*')
    .single()

  if (error || !data) {
    console.error('[REVIEWS] Failed to submit review', error)
    throw new Error('Unable to submit the review right now.')
  }

  await supabase
    .from('review_assignment')
    .update({
      completed_at: reviewedAt,
      status: 'completed',
    } as never)
    .eq('id', detail.assignment.id)
    .eq('reviewer_id', reviewer.id)

  const { count: incompleteCount, error: incompleteError } = await supabase
    .from('review_assignment')
    .select('id', { count: 'exact', head: true })
    .eq('submission_id', detail.assignment.submission_id)
    .eq('layer', detail.assignment.layer)
    .in('status', ['pending', 'in_progress'])

  if (incompleteError) {
    console.error('[REVIEWS] Failed to check assignment completion state', incompleteError)
  }

  await supabase
    .from('submission')
    .update({
      review_status: (incompleteCount ?? 0) === 0 ? 'reviewed' : 'in_review',
    } as never)
    .eq('id', detail.assignment.submission_id)

  await logTransaction(supabase, {
    action: `review_completed_r${detail.assignment.layer}`,
    actor_id: reviewer.id,
    actor_type: 'reviewer',
    event_id: detail.assignment.event_id,
    submission_id: detail.assignment.submission_id,
    metadata: {
      assignment_id: detail.assignment.id,
      grade: payload.grade,
      layer: detail.assignment.layer,
      score: payload.score,
    },
  })

  // If this was the last outstanding review at this layer, ping the event's admin.
  if ((incompleteCount ?? 0) === 0 && detail.event.created_by) {
    await createNotification(supabase, {
      recipientId: detail.event.created_by,
      recipientType: 'admin',
      title: 'Submission awaiting decision',
      message: `All layer ${detail.assignment.layer} reviews are complete for ${detail.event.title}.`,
      type: 'review_complete',
      actionUrl: `/admin/events/${detail.event.id}/reviews?status=reviewed`,
      metadata: {
        event_id: detail.event.id,
        submission_id: detail.assignment.submission_id,
        layer: detail.assignment.layer,
      },
    })
  }

  return data as ReviewRow
}

export async function advanceSubmissionsForAdmin(
  context: AdminContext,
  input: AdvanceSubmissionsInput
): Promise<void> {
  const event = await getEventForAdmin(context, input.event_id)

  if (!event) {
    throw new ReviewWorkflowError('Event not found.')
  }

  if (input.layer < 1 || input.layer > event.review_layers) {
    throw new ReviewValidationError(
      `Event only supports review layers 1 through ${event.review_layers}.`
    )
  }

  const advanceIds = unique(input.advance)
  const eliminateIds = unique(input.eliminate)

  if (!advanceIds.length && !eliminateIds.length) {
    throw new ReviewValidationError('Select at least one submission to advance or eliminate.')
  }

  const overlap = advanceIds.find((submissionId) => eliminateIds.includes(submissionId))

  if (overlap) {
    throw new ReviewValidationError('A submission cannot be advanced and eliminated at the same time.')
  }

  if (advanceIds.length && input.layer >= event.review_layers) {
    throw new ReviewWorkflowError('Submissions in the final layer cannot be advanced further.')
  }

  const { admin, supabase } = context
  const targetIds = [...advanceIds, ...eliminateIds]

  const [submissionResult, assignmentResult] = await Promise.all([
    supabase.from('submission').select('*').eq('event_id', event.id).in('id', targetIds),
    supabase
      .from('review_assignment')
      .select('*')
      .eq('event_id', event.id)
      .eq('layer', input.layer)
      .in('submission_id', targetIds),
  ])

  if (submissionResult.error) {
    console.error('[REVIEWS] Failed to load submissions for advancement', submissionResult.error)
    throw new Error('Unable to update submission decisions right now.')
  }

  if (assignmentResult.error) {
    console.error('[REVIEWS] Failed to load assignments for advancement', assignmentResult.error)
    throw new Error('Unable to update submission decisions right now.')
  }

  const submissions = (submissionResult.data as SubmissionRow[] | null) ?? []
  const assignmentsBySubmission = groupBy(
    (assignmentResult.data as AssignmentRow[] | null) ?? [],
    (assignment) => assignment.submission_id
  )

  if (submissions.length !== targetIds.length) {
    throw new ReviewValidationError('One or more selected submissions were not found.')
  }

  for (const submission of submissions) {
    if (submission.current_layer !== input.layer || submission.review_status !== 'reviewed') {
      throw new ReviewWorkflowError(
        `Submission ${submission.id.slice(0, 8).toUpperCase()} is not ready for an admin decision at layer ${input.layer}.`
      )
    }

    const layerAssignments = assignmentsBySubmission.get(submission.id) ?? []

    if (!layerAssignments.length || layerAssignments.some((assignment) => assignment.status !== 'completed')) {
      throw new ReviewWorkflowError('All reviews in the current layer must be complete before advancing.')
    }
  }

  await Promise.all([
    ...advanceIds.map((submissionId) =>
      supabase
        .from('submission')
        .update({
          current_layer: input.layer + 1,
          eliminated_at_layer: null,
          review_status: 'advanced',
        } as never)
        .eq('id', submissionId)
        .eq('event_id', event.id)
    ),
    ...eliminateIds.map((submissionId) =>
      supabase
        .from('submission')
        .update({
          eliminated_at_layer: input.layer,
          review_status: 'eliminated',
        } as never)
        .eq('id', submissionId)
        .eq('event_id', event.id)
    ),
  ])

  await Promise.all([
    ...advanceIds.map((submissionId) =>
      logTransaction(supabase, {
        action: `submission_advanced_r${input.layer + 1}`,
        actor_id: admin.id,
        actor_type: 'admin',
        event_id: event.id,
        submission_id: submissionId,
        metadata: {
          from_layer: input.layer,
          to_layer: input.layer + 1,
        },
      })
    ),
    ...eliminateIds.map((submissionId) =>
      logTransaction(supabase, {
        action: `submission_eliminated_r${input.layer}`,
        actor_id: admin.id,
        actor_type: 'admin',
        event_id: event.id,
        submission_id: submissionId,
        metadata: {
          layer: input.layer,
        },
      })
    ),
  ])
}

export async function applySubmissionDecisionBatchForAdmin(
  context: AdminContext,
  eventId: string,
  submissionIds: string[],
  decision: 'advance' | 'eliminate'
): Promise<void> {
  const uniqueSubmissionIds = unique(submissionIds)

  if (!uniqueSubmissionIds.length) {
    throw new ReviewValidationError('Select at least one submission first.')
  }

  const { supabase } = context
  const { data, error } = await supabase
    .from('submission')
    .select('*')
    .eq('event_id', eventId)
    .in('id', uniqueSubmissionIds)

  if (error) {
    console.error('[REVIEWS] Failed to load submissions for bulk decision', error)
    throw new Error('Unable to update the selected submissions right now.')
  }

  const submissions = (data as SubmissionRow[] | null) ?? []

  if (submissions.length !== uniqueSubmissionIds.length) {
    throw new ReviewValidationError('One or more selected submissions were not found.')
  }

  const submissionsByLayer = groupBy(submissions, (submission) => String(submission.current_layer))

  for (const [layerKey, layerSubmissions] of submissionsByLayer.entries()) {
    const layer = Number(layerKey)
    await advanceSubmissionsForAdmin(context, {
      event_id: eventId,
      layer,
      advance: decision === 'advance' ? layerSubmissions.map((submission) => submission.id) : [],
      eliminate: decision === 'eliminate' ? layerSubmissions.map((submission) => submission.id) : [],
    })
  }
}

function buildReviewPayload(event: EventRow, input: SubmitReviewInput) {
  const notes = input.notes?.trim() || null

  if (event.scoring_type === 'grade') {
    const grade = input.grade?.trim()
    const allowedGrades = normalizeGradeConfig(event.grade_config).map((item) => item.label)

    if (!grade) {
      throw new ReviewValidationError('Select a grade before submitting the review.')
    }

    if (!allowedGrades.includes(grade)) {
      throw new ReviewValidationError('Select one of the configured grade labels.')
    }

    return {
      grade,
      notes,
      score: null,
    }
  }

  if (typeof input.score !== 'number' || Number.isNaN(input.score)) {
    throw new ReviewValidationError('Enter a numeric score before submitting the review.')
  }

  if (input.score < 0 || input.score > event.max_score) {
    throw new ReviewValidationError(`Scores must stay between 0 and ${event.max_score}.`)
  }

  return {
    grade: null,
    notes,
    score: input.score,
  }
}

function getNextAssignableLayer(submission: SubmissionRow, reviewLayers: number) {
  if (submission.status !== 'submitted' || submission.review_status === 'eliminated') {
    return null
  }

  if (submission.current_layer === 0) {
    return 1
  }

  if (submission.current_layer > reviewLayers) {
    return null
  }

  return submission.current_layer
}

async function createAssignmentNotificationsAndEmails(
  supabase: SupabaseAdminClient,
  event: EventRow,
  assignments: AssignmentRow[],
  reviewersById: Map<string, ReviewerRow>,
  reviewUrl: string
) {
  const assignmentsByReviewer = groupBy(assignments, (assignment) => assignment.reviewer_id)

  await Promise.all(
    Array.from(assignmentsByReviewer.entries()).map(async ([reviewerId, reviewerAssignments]) => {
      const reviewer = reviewersById.get(reviewerId)

      if (!reviewer) {
        return
      }

      const layer = reviewerAssignments[0]?.layer ?? 1

      await createNotification(supabase, {
        recipientId: reviewer.id,
        recipientType: 'reviewer',
        title: 'New review assignment',
        message: `You have ${reviewerAssignments.length} new assignment${reviewerAssignments.length === 1 ? '' : 's'} for ${event.title}.`,
        type: 'assignment',
        actionUrl: '/reviewer',
        metadata: {
          event_id: event.id,
          layer,
        },
      })

      sendReviewerAssignmentEmail({
        to: reviewer.email,
        assignmentCount: reviewerAssignments.length,
        eventTitle: event.title,
        layerName: `Layer ${layer}`,
        reviewerName: reviewer.name,
        reviewUrl,
      }).catch((error) => {
        console.error('[REVIEWS] Failed to send reviewer assignment email', error)
      })
    })
  )
}

async function loadTeachersByIds(
  supabase: SupabaseAdminClient,
  teacherIds: string[]
): Promise<Map<string, TeacherRow>> {
  const uniqueIds = unique(teacherIds)

  if (!uniqueIds.length) {
    return new Map()
  }

  const { data, error } = await supabase.from('user_master').select('*').in('id', uniqueIds)

  if (error) {
    console.error('[REVIEWS] Failed to load teacher records', error)
    return new Map()
  }

  return new Map(((data as TeacherRow[] | null) ?? []).map((teacher) => [teacher.id, teacher]))
}

async function loadEventsByIds(
  supabase: SupabaseAdminClient,
  eventIds: string[]
): Promise<Map<string, EventRow>> {
  const uniqueIds = unique(eventIds)

  if (!uniqueIds.length) {
    return new Map()
  }

  const { data, error } = await supabase.from('event_master').select('*').in('id', uniqueIds)

  if (error) {
    console.error('[REVIEWS] Failed to load events', error)
    return new Map()
  }

  return new Map(((data as EventRow[] | null) ?? []).map((event) => [event.id, event]))
}

async function loadEventById(
  supabase: SupabaseAdminClient,
  eventId: string
): Promise<EventRow | null> {
  const { data, error } = await supabase.from('event_master').select('*').eq('id', eventId).maybeSingle()

  if (error) {
    console.error('[REVIEWS] Failed to load event', error)
    return null
  }

  return (data as EventRow | null) ?? null
}

async function loadSubmissionsByIds(
  supabase: SupabaseAdminClient,
  submissionIds: string[]
): Promise<Map<string, SubmissionRow>> {
  const uniqueIds = unique(submissionIds)

  if (!uniqueIds.length) {
    return new Map()
  }

  const { data, error } = await supabase.from('submission').select('*').in('id', uniqueIds)

  if (error) {
    console.error('[REVIEWS] Failed to load submissions', error)
    return new Map()
  }

  return new Map(((data as SubmissionRow[] | null) ?? []).map((submission) => [submission.id, submission]))
}

async function loadSubmissionById(
  supabase: SupabaseAdminClient,
  submissionId: string
): Promise<SubmissionRow | null> {
  const { data, error } = await supabase.from('submission').select('*').eq('id', submissionId).maybeSingle()

  if (error) {
    console.error('[REVIEWS] Failed to load submission', error)
    return null
  }

  return (data as SubmissionRow | null) ?? null
}

async function loadReviewByAssignmentId(
  supabase: SupabaseAdminClient,
  assignmentId: string
): Promise<ReviewRow | null> {
  const { data, error } = await supabase
    .from('review')
    .select('*')
    .eq('assignment_id', assignmentId)
    .maybeSingle()

  if (error) {
    console.error('[REVIEWS] Failed to load submitted review', error)
    return null
  }

  return (data as ReviewRow | null) ?? null
}

async function loadSubmittedReviewsByAssignmentIds(
  supabase: SupabaseAdminClient,
  assignmentIds: string[]
): Promise<Map<string, ReviewRow>> {
  const uniqueIds = unique(assignmentIds)

  if (!uniqueIds.length) {
    return new Map()
  }

  const { data, error } = await supabase
    .from('review')
    .select('*')
    .in('assignment_id', uniqueIds)

  if (error) {
    console.error('[REVIEWS] Failed to load submitted reviews', error)
    return new Map()
  }

  return new Map(((data as ReviewRow[] | null) ?? []).map((review) => [review.assignment_id, review]))
}

async function loadPreviousReviewsForReviewer(
  supabase: SupabaseAdminClient,
  submissionId: string,
  reviewerId: string,
  currentLayer: number
): Promise<ReviewRow[]> {
  const { data, error } = await supabase
    .from('review')
    .select('*')
    .eq('submission_id', submissionId)
    .eq('reviewer_id', reviewerId)
    .lt('layer', currentLayer)
    .order('layer', { ascending: true })

  if (error) {
    console.error('[REVIEWS] Failed to load previous reviews', error)
    return []
  }

  return (data as ReviewRow[] | null) ?? []
}

async function logTransaction(supabase: SupabaseAdminClient, input: TransactionInsert) {
  const { error } = await supabase.from('transaction_master').insert(input as never)

  if (error) {
    console.error('[REVIEWS] Failed to write transaction log', error)
  }
}

async function markAssignmentInProgressIfNeeded(
  supabase: SupabaseAdminClient,
  assignment: AssignmentRow,
  reviewerId: string
) {
  if (assignment.status !== 'pending') {
    return assignment
  }

  const { error } = await supabase
    .from('review_assignment')
    .update({
      status: 'in_progress',
    } as never)
    .eq('id', assignment.id)
    .eq('reviewer_id', reviewerId)
    .eq('status', 'pending')

  if (error) {
    console.error('[REVIEWS] Failed to mark assignment in progress', error)
    return assignment
  }

  await logTransaction(supabase, {
    action: `review_started_r${assignment.layer}`,
    actor_id: reviewerId,
    actor_type: 'reviewer',
    event_id: assignment.event_id,
    submission_id: assignment.submission_id,
    metadata: {
      assignment_id: assignment.id,
      layer: assignment.layer,
    },
  })

  return {
    ...assignment,
    status: 'in_progress',
  }
}

function normalizeReviewerAssignmentStatus(status: string): ReviewerAssignmentStatus {
  if (status === 'completed') {
    return 'completed'
  }

  if (status === 'in_progress') {
    return 'in_progress'
  }

  return 'pending'
}

function getSubmissionDisplayStatus(submission: SubmissionRow): ReviewWorkspaceStatus {
  if (submission.status === 'draft') {
    return 'draft'
  }

  if (submission.review_status === 'in_review') {
    return 'in_review'
  }

  if (submission.review_status === 'reviewed') {
    return 'reviewed'
  }

  if (submission.review_status === 'advanced') {
    return 'advanced'
  }

  if (submission.review_status === 'eliminated') {
    return 'eliminated'
  }

  return 'submitted'
}

function getSubmissionCounts(records: AdminEventSubmissionRecord[]) {
  return records.reduce<Record<ReviewWorkspaceStatus | 'all', number>>(
    (counts, record) => {
      counts.all += 1
      counts[record.displayStatus] += 1
      return counts
    },
    {
      all: 0,
      advanced: 0,
      draft: 0,
      eliminated: 0,
      in_review: 0,
      reviewed: 0,
      submitted: 0,
    }
  )
}

function getReviewerAssignmentCounts(records: ReviewerAssignmentListItem[]) {
  return records.reduce<Record<ReviewerAssignmentStatus | 'all', number>>(
    (counts, record) => {
      counts.all += 1
      counts[record.displayStatus] += 1
      return counts
    },
    {
      all: 0,
      completed: 0,
      in_progress: 0,
      pending: 0,
    }
  )
}

function getAvailableSubmissionLayers(records: AdminEventSubmissionRecord[]) {
  return Array.from(
    new Set(records.map((record) => record.submission.current_layer).filter((layer) => layer > 0))
  ).sort((left, right) => left - right)
}

function matchesSubmissionFilters(
  record: AdminEventSubmissionRecord,
  query: EventReviewWorkspaceQuery
) {
  if (query.status && record.displayStatus !== query.status) {
    return false
  }

  if (query.layer && record.submission.current_layer !== query.layer) {
    return false
  }

  if (!query.q) {
    return true
  }

  const searchTerm = query.q.toLowerCase()
  const searchableParts = [
    record.submission.id,
    String(record.submission.submission_number),
    record.teacher?.name,
    record.teacher?.email,
    record.teacher?.school_name,
  ]

  return searchableParts.some((part) => part?.toLowerCase().includes(searchTerm))
}

function matchesReviewerAssignmentFilters(
  record: ReviewerAssignmentListItem,
  query: ReviewerAssignmentsQuery
) {
  if (query.status && record.displayStatus !== query.status) {
    return false
  }

  if (query.layer && record.assignment.layer !== query.layer) {
    return false
  }

  if (query.event_id && record.assignment.event_id !== query.event_id) {
    return false
  }

  if (!query.q) {
    return true
  }

  const searchTerm = query.q.toLowerCase()
  const searchableParts = [
    record.assignment.id,
    record.event?.title,
    record.teacher?.name,
    record.teacher?.email,
    record.teacher?.school_name,
    record.submission ? String(record.submission.submission_number) : undefined,
  ]

  return searchableParts.some((part) => part?.toLowerCase().includes(searchTerm))
}

function getSubmissionLayerProgress(
  event: EventRow,
  submission: SubmissionRow,
  assignments: AssignmentRow[],
  reviews: ReviewRow[]
): SubmissionLayerProgress[] {
  const assignmentsByLayer = groupBy(assignments, (assignment) => String(assignment.layer))
  const reviewsByLayer = groupBy(reviews, (review) => String(review.layer))

  return Array.from({ length: event.review_layers }, (_, index) => {
    const layer = index + 1
    const layerAssignments = assignmentsByLayer.get(String(layer)) ?? []
    const layerReviews = reviewsByLayer.get(String(layer)) ?? []

    return {
      completedAssignments: layerAssignments.filter((assignment) => assignment.status === 'completed').length,
      isCurrentLayer: submission.current_layer === layer,
      layer,
      reviewValues: layerReviews.map((review) => formatReviewValue(event, review)),
      totalAssignments: layerAssignments.length,
    }
  })
}

function getSubmissionResponseDetails(
  event: EventRow,
  submission: SubmissionRow
): SubmissionResponseItem[] {
  return getSubmissionResponses(event, submission).map((response) => ({
    label: response.label,
    type: response.type,
    value: renderJsonValue(response.value),
  }))
}

function getSubmissionAttachments(value: Json): SubmissionAttachmentItem[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .filter(
      (item): item is { file_name?: string; file_url?: string } =>
        typeof item === 'object' && item !== null
    )
    .map((item) => ({
      fileName: item.file_name || 'Open attachment',
      fileUrl: item.file_url || '#',
    }))
}

function renderJsonValue(value: Json | undefined): string {
  if (value === null || value === undefined) {
    return 'No response'
  }

  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return 'Unable to display response'
  }
}

function buildAssignmentKey(submissionId: string, reviewerId: string, layer: number) {
  return `${submissionId}:${reviewerId}:${layer}`
}

function groupBy<T>(values: T[], getKey: (value: T) => string) {
  const map = new Map<string, T[]>()

  for (const value of values) {
    const key = getKey(value)
    const current = map.get(key)

    if (current) {
      current.push(value)
    } else {
      map.set(key, [value])
    }
  }

  return map
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)))
}

export function formatReviewValue(event: EventRow, review: ReviewRow) {
  return event.scoring_type === 'grade' ? review.grade || 'No grade' : review.score?.toFixed(2) || 'No score'
}

export function getSubmissionResponses(
  event: EventRow,
  submission: SubmissionRow
): Array<{ label: string; type: string; value: Json | undefined }> {
  const schema = normalizeFormSchema(event.form_schema)
  const values = isRecord(submission.form_data) ? submission.form_data : {}

  return schema.fields.map((field) => ({
    label: field.label,
    type: field.type,
    value: values[field.id],
  }))
}

function isRecord(value: unknown): value is Record<string, Json | undefined> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
