import { describe, it, expect } from 'vitest'
import {
  advanceReviewsSchema,
  assignReviewsSchema,
  reviewerCreateSchema,
  reviewerUpdateSchema,
  submitReviewSchema,
} from '@/lib/validations/reviews'

const uuidA = '11111111-1111-4111-8111-111111111111'
const uuidB = '22222222-2222-4222-8222-222222222222'
const uuidC = '33333333-3333-4333-8333-333333333333'

describe('validations/reviews — reviewerCreateSchema', () => {
  it('requires password length, letter, and digit', () => {
    expect(
      reviewerCreateSchema.safeParse({
        name: 'Jordan Reviewer',
        email: 'jordan@example.com',
        password: 'short1',
      }).success
    ).toBe(false)

    expect(
      reviewerCreateSchema.safeParse({
        name: 'Jordan Reviewer',
        email: 'jordan@example.com',
        password: 'longpassword',
      }).success
    ).toBe(false)

    expect(
      reviewerCreateSchema.safeParse({
        name: 'Jordan Reviewer',
        email: 'jordan@example.com',
        password: 'longpass123',
      }).success
    ).toBe(true)
  })
})

describe('validations/reviews — reviewerUpdateSchema', () => {
  it('treats empty password as undefined (no change)', () => {
    const parsed = reviewerUpdateSchema.safeParse({
      name: 'Jordan Reviewer',
      email: 'jordan@example.com',
      password: '',
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.password).toBeUndefined()
    }
  })
})

describe('validations/reviews — assignReviewsSchema', () => {
  it('accepts a valid single-assignment payload', () => {
    const parsed = assignReviewsSchema.safeParse({
      event_id: uuidA,
      assignments: [
        { submission_id: uuidB, reviewer_id: uuidC, layer: 1 },
      ],
    })
    expect(parsed.success).toBe(true)
  })

  it('rejects empty assignment arrays', () => {
    const parsed = assignReviewsSchema.safeParse({
      event_id: uuidA,
      assignments: [],
    })
    expect(parsed.success).toBe(false)
  })

  it('rejects non-uuid values', () => {
    const parsed = assignReviewsSchema.safeParse({
      event_id: 'not-a-uuid',
      assignments: [{ submission_id: uuidB, reviewer_id: uuidC, layer: 1 }],
    })
    expect(parsed.success).toBe(false)
  })

  it('clamps layer to range [1, 10]', () => {
    expect(
      assignReviewsSchema.safeParse({
        event_id: uuidA,
        assignments: [{ submission_id: uuidB, reviewer_id: uuidC, layer: 0 }],
      }).success
    ).toBe(false)

    expect(
      assignReviewsSchema.safeParse({
        event_id: uuidA,
        assignments: [{ submission_id: uuidB, reviewer_id: uuidC, layer: 11 }],
      }).success
    ).toBe(false)
  })
})

describe('validations/reviews — submitReviewSchema', () => {
  it('accepts either score or grade', () => {
    expect(
      submitReviewSchema.safeParse({
        assignment_id: uuidA,
        score: 82,
      }).success
    ).toBe(true)

    expect(
      submitReviewSchema.safeParse({
        assignment_id: uuidA,
        grade: 'B',
      }).success
    ).toBe(true)
  })

  it('rejects scores out of bounds', () => {
    expect(
      submitReviewSchema.safeParse({
        assignment_id: uuidA,
        score: -1,
      }).success
    ).toBe(false)

    expect(
      submitReviewSchema.safeParse({
        assignment_id: uuidA,
        score: 10_000,
      }).success
    ).toBe(false)
  })

  it('coerces notes="" to undefined', () => {
    const parsed = submitReviewSchema.safeParse({
      assignment_id: uuidA,
      score: 75,
      notes: '',
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.notes).toBeUndefined()
    }
  })
})

describe('validations/reviews — advanceReviewsSchema', () => {
  it('defaults empty arrays when not provided', () => {
    const parsed = advanceReviewsSchema.safeParse({
      event_id: uuidA,
      layer: 1,
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.advance).toEqual([])
      expect(parsed.data.eliminate).toEqual([])
    }
  })

  it('accepts lists of uuids', () => {
    const parsed = advanceReviewsSchema.safeParse({
      event_id: uuidA,
      layer: 2,
      advance: [uuidB, uuidC],
      eliminate: [],
    })
    expect(parsed.success).toBe(true)
  })
})
