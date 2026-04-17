import { getEventForAdmin, type AdminContext } from '@/lib/events/service'
import type { Database } from '@/types/database'

type EventRow = Database['public']['Tables']['event_master']['Row']
type SubmissionRow = Database['public']['Tables']['submission']['Row']
type AssignmentRow = Database['public']['Tables']['review_assignment']['Row']
type ReviewRow = Database['public']['Tables']['review']['Row']
type TeacherRow = Database['public']['Tables']['user_master']['Row']
type ReviewerRow = Database['public']['Tables']['reviewer_master']['Row']

export class AnalyticsAccessError extends Error {
  constructor(message = 'Unable to load analytics for this event.') {
    super(message)
    this.name = 'AnalyticsAccessError'
  }
}

export interface EventAnalyticsSummary {
  event: EventRow
  totals: {
    submissions: number
    submitted: number
    drafts: number
    inReview: number
    reviewed: number
    advanced: number
    eliminated: number
    reviewers: number
  }
  submissionsByStatus: Array<{ status: string; count: number }>
  submissionsByLayer: Array<{ layer: number; count: number }>
  submissionsOverTime: Array<{ date: string; count: number }>
  reviewCompletionByLayer: Array<{
    layer: number
    totalAssignments: number
    completed: number
    pending: number
    inProgress: number
    completionRate: number
  }>
  avgScoreByLayer: Array<{
    layer: number
    avgScore: number | null
    minScore: number | null
    maxScore: number | null
    reviewCount: number
  }>
  topRated: Array<{
    submissionId: string
    submissionNumber: number
    teacherName: string
    schoolName: string
    layer: number
    avgScore: number
    reviewCount: number
  }>
  reviewerWorkload: Array<{
    reviewerId: string
    reviewerName: string
    totalAssignments: number
    completed: number
    pending: number
    inProgress: number
  }>
}

export interface SubmissionsOverTimeOptions {
  from?: string
  to?: string
  interval?: 'day' | 'week' | 'month'
}

/**
 * Ensures the current admin owns the event, then returns the event row.
 * Throws AnalyticsAccessError if not found / not owned.
 */
async function requireOwnedEvent(context: AdminContext, eventId: string): Promise<EventRow> {
  const event = await getEventForAdmin(context, eventId)

  if (!event) {
    throw new AnalyticsAccessError('Event not found or you do not have access to it.')
  }

  return event
}

/* ------------------------------------------------------------------ */
/*  Main summary                                                       */
/* ------------------------------------------------------------------ */

export async function getEventAnalyticsSummary(
  context: AdminContext,
  eventId: string
): Promise<EventAnalyticsSummary> {
  const event = await requireOwnedEvent(context, eventId)
  const { supabase } = context

  const [submissionsResult, assignmentsResult, reviewsResult, teachersResult, reviewersResult] =
    await Promise.all([
      supabase
        .from('submission')
        .select('*')
        .eq('event_id', eventId)
        .order('submitted_at', { ascending: true, nullsFirst: false }),
      supabase.from('review_assignment').select('*').eq('event_id', eventId),
      supabase.from('review').select('*').eq('event_id', eventId),
      supabase.from('user_master').select('*').eq('event_id', eventId),
      supabase.from('reviewer_master').select('*'),
    ])

  if (submissionsResult.error) {
    console.error('[ANALYTICS] Failed to load submissions', submissionsResult.error)
    throw new Error('Unable to load submission analytics.')
  }

  if (assignmentsResult.error) {
    console.error('[ANALYTICS] Failed to load assignments', assignmentsResult.error)
    throw new Error('Unable to load review assignment analytics.')
  }

  if (reviewsResult.error) {
    console.error('[ANALYTICS] Failed to load reviews', reviewsResult.error)
    throw new Error('Unable to load review analytics.')
  }

  if (teachersResult.error) {
    console.error('[ANALYTICS] Failed to load teachers', teachersResult.error)
    throw new Error('Unable to load teacher analytics.')
  }

  if (reviewersResult.error) {
    console.error('[ANALYTICS] Failed to load reviewers', reviewersResult.error)
    throw new Error('Unable to load reviewer analytics.')
  }

  const submissions = (submissionsResult.data as SubmissionRow[] | null) ?? []
  const assignments = (assignmentsResult.data as AssignmentRow[] | null) ?? []
  const reviews = (reviewsResult.data as ReviewRow[] | null) ?? []
  const teachers = new Map(
    ((teachersResult.data as TeacherRow[] | null) ?? []).map((teacher) => [teacher.id, teacher])
  )
  const reviewersById = new Map(
    ((reviewersResult.data as ReviewerRow[] | null) ?? []).map((reviewer) => [
      reviewer.id,
      reviewer,
    ])
  )

  const submittedSubmissions = submissions.filter((submission) => submission.status === 'submitted')
  const draftSubmissions = submissions.filter((submission) => submission.status === 'draft')

  const totals = {
    submissions: submissions.length,
    submitted: submittedSubmissions.length,
    drafts: draftSubmissions.length,
    inReview: submittedSubmissions.filter((submission) => submission.review_status === 'in_review')
      .length,
    reviewed: submittedSubmissions.filter((submission) => submission.review_status === 'reviewed')
      .length,
    advanced: submittedSubmissions.filter((submission) => submission.review_status === 'advanced')
      .length,
    eliminated: submittedSubmissions.filter(
      (submission) => submission.review_status === 'eliminated'
    ).length,
    reviewers: reviewersById.size,
  }

  const submissionsByStatus = buildSubmissionsByStatus(submittedSubmissions)
  const submissionsByLayer = buildSubmissionsByLayer(submittedSubmissions, event.review_layers)
  const submissionsOverTime = buildSubmissionsOverTime(submittedSubmissions, { interval: 'day' })
  const reviewCompletionByLayer = buildReviewCompletionByLayer(assignments, event.review_layers)
  const avgScoreByLayer = buildAvgScoreByLayer(reviews, event.review_layers)
  const topRated = buildTopRated(submittedSubmissions, reviews, teachers)
  const reviewerWorkload = buildReviewerWorkload(assignments, reviewersById)

  return {
    event,
    totals,
    submissionsByStatus,
    submissionsByLayer,
    submissionsOverTime,
    reviewCompletionByLayer,
    avgScoreByLayer,
    topRated,
    reviewerWorkload,
  }
}

/* ------------------------------------------------------------------ */
/*  Submissions over time (standalone — supports date range filters)   */
/* ------------------------------------------------------------------ */

export async function getSubmissionsOverTimeForEvent(
  context: AdminContext,
  eventId: string,
  options: SubmissionsOverTimeOptions = {}
): Promise<Array<{ date: string; count: number }>> {
  await requireOwnedEvent(context, eventId)
  const { supabase } = context

  let query = supabase
    .from('submission')
    .select('submitted_at, status')
    .eq('event_id', eventId)
    .eq('status', 'submitted')

  if (options.from) {
    query = query.gte('submitted_at', options.from)
  }

  if (options.to) {
    query = query.lte('submitted_at', options.to)
  }

  const { data, error } = await query

  if (error) {
    console.error('[ANALYTICS] Failed to load submissions over time', error)
    throw new Error('Unable to load submissions over time.')
  }

  const rows = (data as Array<{ submitted_at: string | null }> | null) ?? []
  const submissions = rows
    .filter((row): row is { submitted_at: string } => Boolean(row.submitted_at))
    .map((row) => ({ submitted_at: row.submitted_at })) as Array<Pick<SubmissionRow, 'submitted_at'>>

  return buildSubmissionsOverTime(
    submissions as SubmissionRow[],
    { interval: options.interval ?? 'day' }
  )
}

/* ------------------------------------------------------------------ */
/*  CSV Export                                                         */
/* ------------------------------------------------------------------ */

export type AnalyticsExportType = 'submissions' | 'reviews'

export async function getEventExportCsv(
  context: AdminContext,
  eventId: string,
  type: AnalyticsExportType
): Promise<{ filename: string; csv: string }> {
  const event = await requireOwnedEvent(context, eventId)
  const { supabase } = context

  if (type === 'submissions') {
    const [submissionsResult, teachersResult] = await Promise.all([
      supabase
        .from('submission')
        .select('*')
        .eq('event_id', eventId)
        .order('submitted_at', { ascending: true, nullsFirst: false }),
      supabase.from('user_master').select('*').eq('event_id', eventId),
    ])

    if (submissionsResult.error) {
      console.error('[ANALYTICS] Export submissions failed', submissionsResult.error)
      throw new Error('Unable to export submissions.')
    }

    if (teachersResult.error) {
      console.error('[ANALYTICS] Export teachers failed', teachersResult.error)
      throw new Error('Unable to export submissions.')
    }

    const submissions = (submissionsResult.data as SubmissionRow[] | null) ?? []
    const teachers = new Map(
      ((teachersResult.data as TeacherRow[] | null) ?? []).map((teacher) => [teacher.id, teacher])
    )

    const rows = submissions.map((submission) => {
      const teacher = teachers.get(submission.user_id)

      return {
        submission_id: submission.id,
        submission_number: submission.submission_number,
        teacher_name: teacher?.name ?? '',
        teacher_email: teacher?.email ?? '',
        school_name: teacher?.school_name ?? '',
        phone: teacher?.phone ?? '',
        status: submission.status,
        review_status: submission.review_status,
        current_layer: submission.current_layer,
        eliminated_at_layer: submission.eliminated_at_layer ?? '',
        submitted_at: submission.submitted_at ?? '',
        created_at: submission.created_at,
      }
    })

    const csv = buildCsv(
      [
        'submission_id',
        'submission_number',
        'teacher_name',
        'teacher_email',
        'school_name',
        'phone',
        'status',
        'review_status',
        'current_layer',
        'eliminated_at_layer',
        'submitted_at',
        'created_at',
      ],
      rows
    )

    return {
      filename: `${sanitizeFilename(event.title)}-submissions.csv`,
      csv,
    }
  }

  const [reviewsResult, teachersResult, submissionsResult, reviewersResult] = await Promise.all([
    supabase.from('review').select('*').eq('event_id', eventId),
    supabase.from('user_master').select('*').eq('event_id', eventId),
    supabase.from('submission').select('*').eq('event_id', eventId),
    supabase.from('reviewer_master').select('*'),
  ])

  if (
    reviewsResult.error ||
    teachersResult.error ||
    submissionsResult.error ||
    reviewersResult.error
  ) {
    console.error(
      '[ANALYTICS] Export reviews failed',
      reviewsResult.error ??
        teachersResult.error ??
        submissionsResult.error ??
        reviewersResult.error
    )
    throw new Error('Unable to export reviews.')
  }

  const reviews = (reviewsResult.data as ReviewRow[] | null) ?? []
  const teachers = new Map(
    ((teachersResult.data as TeacherRow[] | null) ?? []).map((teacher) => [teacher.id, teacher])
  )
  const submissions = new Map(
    ((submissionsResult.data as SubmissionRow[] | null) ?? []).map((submission) => [
      submission.id,
      submission,
    ])
  )
  const reviewers = new Map(
    ((reviewersResult.data as ReviewerRow[] | null) ?? []).map((reviewer) => [
      reviewer.id,
      reviewer,
    ])
  )

  const rows = reviews
    .slice()
    .sort((a, b) => a.layer - b.layer || a.reviewed_at.localeCompare(b.reviewed_at))
    .map((review) => {
      const submission = submissions.get(review.submission_id)
      const teacher = submission ? teachers.get(submission.user_id) : undefined
      const reviewer = reviewers.get(review.reviewer_id)

      return {
        review_id: review.id,
        submission_id: review.submission_id,
        submission_number: submission?.submission_number ?? '',
        layer: review.layer,
        score: review.score ?? '',
        grade: review.grade ?? '',
        notes: review.notes ?? '',
        teacher_name: teacher?.name ?? '',
        teacher_email: teacher?.email ?? '',
        school_name: teacher?.school_name ?? '',
        reviewer_name: reviewer?.name ?? '',
        reviewer_email: reviewer?.email ?? '',
        reviewed_at: review.reviewed_at,
      }
    })

  const csv = buildCsv(
    [
      'review_id',
      'submission_id',
      'submission_number',
      'layer',
      'score',
      'grade',
      'notes',
      'teacher_name',
      'teacher_email',
      'school_name',
      'reviewer_name',
      'reviewer_email',
      'reviewed_at',
    ],
    rows
  )

  return {
    filename: `${sanitizeFilename(event.title)}-reviews.csv`,
    csv,
  }
}

/* ------------------------------------------------------------------ */
/*  Internal builders                                                  */
/* ------------------------------------------------------------------ */

function buildSubmissionsByStatus(submissions: SubmissionRow[]) {
  const counts = new Map<string, number>()

  for (const submission of submissions) {
    counts.set(submission.review_status, (counts.get(submission.review_status) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((left, right) => right.count - left.count)
}

function buildSubmissionsByLayer(submissions: SubmissionRow[], reviewLayers: number) {
  const result: Array<{ layer: number; count: number }> = []

  for (let layer = 1; layer <= reviewLayers; layer += 1) {
    const count = submissions.filter((submission) => submission.current_layer === layer).length
    result.push({ layer, count })
  }

  return result
}

function buildSubmissionsOverTime(
  submissions: SubmissionRow[],
  options: { interval: 'day' | 'week' | 'month' }
) {
  const counts = new Map<string, number>()

  for (const submission of submissions) {
    if (!submission.submitted_at) continue

    const bucketKey = bucketForDate(submission.submitted_at, options.interval)
    counts.set(bucketKey, (counts.get(bucketKey) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((left, right) => left.date.localeCompare(right.date))
}

function bucketForDate(isoDate: string, interval: 'day' | 'week' | 'month') {
  const date = new Date(isoDate)

  if (interval === 'month') {
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
  }

  if (interval === 'week') {
    // ISO week starts on Monday. Snap date to the Monday of its ISO week.
    const weekStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
    const day = weekStart.getUTCDay() || 7 // Sunday becomes 7
    weekStart.setUTCDate(weekStart.getUTCDate() - (day - 1))

    return weekStart.toISOString().slice(0, 10)
  }

  return date.toISOString().slice(0, 10)
}

function buildReviewCompletionByLayer(assignments: AssignmentRow[], reviewLayers: number) {
  const result: EventAnalyticsSummary['reviewCompletionByLayer'] = []

  for (let layer = 1; layer <= reviewLayers; layer += 1) {
    const layerAssignments = assignments.filter((assignment) => assignment.layer === layer)
    const completed = layerAssignments.filter(
      (assignment) => assignment.status === 'completed'
    ).length
    const inProgress = layerAssignments.filter(
      (assignment) => assignment.status === 'in_progress'
    ).length
    const pending = layerAssignments.filter((assignment) => assignment.status === 'pending').length
    const totalAssignments = layerAssignments.length
    const completionRate =
      totalAssignments === 0 ? 0 : Math.round((completed / totalAssignments) * 1000) / 10

    result.push({
      layer,
      totalAssignments,
      completed,
      pending,
      inProgress,
      completionRate,
    })
  }

  return result
}

function buildAvgScoreByLayer(reviews: ReviewRow[], reviewLayers: number) {
  const result: EventAnalyticsSummary['avgScoreByLayer'] = []

  for (let layer = 1; layer <= reviewLayers; layer += 1) {
    const layerReviews = reviews.filter((review) => review.layer === layer)
    const numericScores = layerReviews
      .map((review) => (review.score == null ? null : Number(review.score)))
      .filter((score): score is number => typeof score === 'number' && !Number.isNaN(score))

    if (!numericScores.length) {
      result.push({
        layer,
        avgScore: null,
        minScore: null,
        maxScore: null,
        reviewCount: layerReviews.length,
      })
      continue
    }

    const total = numericScores.reduce((sum, score) => sum + score, 0)
    const avgScore = Math.round((total / numericScores.length) * 100) / 100
    const minScore = Math.min(...numericScores)
    const maxScore = Math.max(...numericScores)

    result.push({
      layer,
      avgScore,
      minScore,
      maxScore,
      reviewCount: layerReviews.length,
    })
  }

  return result
}

function buildTopRated(
  submissions: SubmissionRow[],
  reviews: ReviewRow[],
  teachers: Map<string, TeacherRow>
) {
  const submissionMap = new Map(submissions.map((submission) => [submission.id, submission]))
  const aggregate = new Map<
    string,
    { total: number; count: number; layers: Set<number>; latestLayer: number }
  >()

  for (const review of reviews) {
    if (review.score == null) continue

    const score = Number(review.score)
    if (!Number.isFinite(score)) continue

    const current = aggregate.get(review.submission_id)

    if (current) {
      current.total += score
      current.count += 1
      current.layers.add(review.layer)
      if (review.layer > current.latestLayer) {
        current.latestLayer = review.layer
      }
    } else {
      aggregate.set(review.submission_id, {
        total: score,
        count: 1,
        layers: new Set<number>([review.layer]),
        latestLayer: review.layer,
      })
    }
  }

  const rows = Array.from(aggregate.entries())
    .map(([submissionId, entry]) => {
      const submission = submissionMap.get(submissionId)
      const teacher = submission ? teachers.get(submission.user_id) : undefined
      const avgScore = Math.round((entry.total / entry.count) * 100) / 100

      return {
        submissionId,
        submissionNumber: submission?.submission_number ?? 0,
        teacherName: teacher?.name ?? 'Unknown teacher',
        schoolName: teacher?.school_name ?? '',
        layer: entry.latestLayer,
        avgScore,
        reviewCount: entry.count,
      }
    })
    .sort((left, right) => right.avgScore - left.avgScore)

  return rows.slice(0, 10)
}

function buildReviewerWorkload(
  assignments: AssignmentRow[],
  reviewersById: Map<string, ReviewerRow>
) {
  const aggregate = new Map<
    string,
    { totalAssignments: number; completed: number; pending: number; inProgress: number }
  >()

  for (const assignment of assignments) {
    const current = aggregate.get(assignment.reviewer_id) ?? {
      totalAssignments: 0,
      completed: 0,
      pending: 0,
      inProgress: 0,
    }

    current.totalAssignments += 1

    if (assignment.status === 'completed') {
      current.completed += 1
    } else if (assignment.status === 'in_progress') {
      current.inProgress += 1
    } else {
      current.pending += 1
    }

    aggregate.set(assignment.reviewer_id, current)
  }

  return Array.from(aggregate.entries())
    .map(([reviewerId, entry]) => {
      const reviewer = reviewersById.get(reviewerId)
      return {
        reviewerId,
        reviewerName: reviewer?.name ?? 'Unknown reviewer',
        ...entry,
      }
    })
    .sort((left, right) => right.totalAssignments - left.totalAssignments)
}

/* ------------------------------------------------------------------ */
/*  CSV helpers                                                        */
/* ------------------------------------------------------------------ */

function buildCsv(headers: string[], rows: Array<Record<string, unknown>>) {
  const lines = [headers.join(',')]

  for (const row of rows) {
    lines.push(headers.map((header) => escapeCsvCell(row[header])).join(','))
  }

  return lines.join('\n')
}

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return ''

  const str = typeof value === 'string' ? value : String(value)

  if (/[",\n\r]/.test(str)) {
    return `"${str.replaceAll('"', '""')}"`
  }

  return str
}

function sanitizeFilename(value: string) {
  return (
    value
      .toLowerCase()
      .replaceAll(/[^a-z0-9]+/g, '-')
      .replaceAll(/^-+|-+$/g, '')
      .slice(0, 60) || 'event'
  )
}
