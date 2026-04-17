import { describe, it, expect } from 'vitest'
import {
  defaultGradeConfig,
  eventCreateSchema,
  eventUpdateSchema,
  gradeConfigSchema,
  normalizeGradeConfig,
} from '@/lib/validations/events'

function futureIsoDate(offsetDays = 30) {
  return new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000).toISOString()
}

function pastIsoDate(offsetDays = 30) {
  return new Date(Date.now() - offsetDays * 24 * 60 * 60 * 1000).toISOString()
}

describe('validations/events — gradeConfigSchema', () => {
  it('accepts the default grade config', () => {
    const parsed = gradeConfigSchema.safeParse([...defaultGradeConfig])
    expect(parsed.success).toBe(true)
  })

  it('rejects overlapping ranges', () => {
    const overlapping = [
      { label: 'A', min: 80, max: 100 },
      { label: 'B', min: 70, max: 85 }, // overlaps with A
    ]
    const parsed = gradeConfigSchema.safeParse(overlapping)
    expect(parsed.success).toBe(false)
  })

  it('rejects a range where max < min', () => {
    const parsed = gradeConfigSchema.safeParse([{ label: 'A', min: 90, max: 10 }])
    expect(parsed.success).toBe(false)
  })

  it('rejects empty arrays', () => {
    const parsed = gradeConfigSchema.safeParse([])
    expect(parsed.success).toBe(false)
  })
})

describe('validations/events — normalizeGradeConfig', () => {
  it('returns defaults for invalid input', () => {
    const result = normalizeGradeConfig(undefined)
    expect(result).toHaveLength(defaultGradeConfig.length)
    expect(result[0].label).toBe('A')
  })

  it('returns a fresh copy (does not mutate defaults)', () => {
    const result = normalizeGradeConfig(undefined)
    result[0].label = 'Z'
    const second = normalizeGradeConfig(undefined)
    expect(second[0].label).toBe('A')
  })
})

describe('validations/events — eventCreateSchema', () => {
  const basePayload = {
    title: 'Annual Teacher Awards 2026',
    description: 'Submissions for the 2026 cycle.',
    review_layers: 2,
    scoring_type: 'numeric' as const,
    max_score: 100,
    expiration_date: futureIsoDate(),
    teacher_fields: ['name', 'email', 'school_name'],
  }

  it('accepts a valid numeric-scored payload', () => {
    const parsed = eventCreateSchema.safeParse(basePayload)
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.grade_config).toBeNull()
      expect(parsed.data.max_score).toBe(100)
    }
  })

  it('rejects titles shorter than 3 characters', () => {
    const parsed = eventCreateSchema.safeParse({ ...basePayload, title: 'ab' })
    expect(parsed.success).toBe(false)
  })

  it('rejects expiration dates in the past', () => {
    const parsed = eventCreateSchema.safeParse({
      ...basePayload,
      expiration_date: pastIsoDate(),
    })
    expect(parsed.success).toBe(false)
  })

  it('rejects payloads missing required teacher fields (email)', () => {
    const parsed = eventCreateSchema.safeParse({
      ...basePayload,
      teacher_fields: ['name'],
    })
    expect(parsed.success).toBe(false)
  })

  it('attaches default grade_config when scoring_type=grade and none provided', () => {
    const parsed = eventCreateSchema.safeParse({
      ...basePayload,
      scoring_type: 'grade',
      grade_config: undefined,
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(Array.isArray(parsed.data.grade_config)).toBe(true)
      expect(parsed.data.grade_config).toHaveLength(defaultGradeConfig.length)
    }
  })

  it('normalizes and dedupes teacher_fields in canonical order', () => {
    const parsed = eventCreateSchema.safeParse({
      ...basePayload,
      teacher_fields: ['phone', 'email', 'email', 'name'],
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      // Canonical order is name, email, school_name, phone
      expect(parsed.data.teacher_fields).toEqual(['name', 'email', 'phone'])
    }
  })

  it('rejects review_layers > 10', () => {
    const parsed = eventCreateSchema.safeParse({ ...basePayload, review_layers: 11 })
    expect(parsed.success).toBe(false)
  })
})

describe('validations/events — eventUpdateSchema', () => {
  it('accepts a partial update with just a title', () => {
    const parsed = eventUpdateSchema.safeParse({ title: 'Updated title' })
    expect(parsed.success).toBe(true)
  })

  it('rejects updates that remove the email teacher field', () => {
    const parsed = eventUpdateSchema.safeParse({
      teacher_fields: ['name', 'phone'],
    })
    expect(parsed.success).toBe(false)
  })

  it('rejects past expiration dates on update', () => {
    const parsed = eventUpdateSchema.safeParse({
      expiration_date: pastIsoDate(),
    })
    expect(parsed.success).toBe(false)
  })
})
