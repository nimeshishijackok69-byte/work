import { describe, it, expect } from 'vitest'
import {
  createDefaultField,
  duplicateField,
  formSchemaSchema,
  normalizeFormSchema,
  fieldTypeLabels,
} from '@/lib/forms/schema'

describe('forms/schema — createDefaultField', () => {
  const types = Object.keys(fieldTypeLabels) as Array<keyof typeof fieldTypeLabels>

  it.each(types)('creates a valid field for type %s', (type) => {
    const field = createDefaultField(type)
    expect(field.type).toBe(type)
    expect(field.id).toBeTruthy()
    expect(field.label).toBeTruthy()
  })

  it('creates a linear scale with sane defaults', () => {
    const field = createDefaultField('linear_scale')
    if (field.type !== 'linear_scale') throw new Error('wrong type')
    expect(field.config.max).toBeGreaterThan(field.config.min)
  })
})

describe('forms/schema — duplicateField', () => {
  it('returns a field with a new id and appended label', () => {
    const original = createDefaultField('short_answer')
    const copy = duplicateField(original)
    expect(copy.id).not.toEqual(original.id)
    expect(copy.label).toContain('copy')
    expect(copy.type).toEqual(original.type)
  })

  it('does not mutate the original field', () => {
    const original = createDefaultField('multiple_choice')
    const originalSnapshot = JSON.stringify(original)
    duplicateField(original)
    expect(JSON.stringify(original)).toEqual(originalSnapshot)
  })
})

describe('forms/schema — formSchemaSchema validation', () => {
  it('accepts a schema with all 12 field types', () => {
    const types = Object.keys(fieldTypeLabels) as Array<keyof typeof fieldTypeLabels>
    const schema = {
      fields: types.map((type) => createDefaultField(type)),
    }
    const parsed = formSchemaSchema.safeParse(schema)
    expect(parsed.success).toBe(true)
  })

  it('rejects linear_scale where max <= min', () => {
    const schema = {
      fields: [
        {
          id: 'f1',
          type: 'linear_scale',
          label: 'Bad scale',
          required: false,
          config: { min: 5, max: 5 },
        },
      ],
    }
    const parsed = formSchemaSchema.safeParse(schema)
    expect(parsed.success).toBe(false)
  })

  it('rejects multiple_choice with no options', () => {
    const schema = {
      fields: [
        {
          id: 'f1',
          type: 'multiple_choice',
          label: 'Empty options',
          required: false,
          config: { options: [] },
        },
      ],
    }
    const parsed = formSchemaSchema.safeParse(schema)
    expect(parsed.success).toBe(false)
  })
})

describe('forms/schema — normalizeFormSchema', () => {
  it('returns empty fields for invalid input', () => {
    expect(normalizeFormSchema(null)).toEqual({ fields: [] })
    expect(normalizeFormSchema('not-a-schema')).toEqual({ fields: [] })
    expect(normalizeFormSchema({ nope: true })).toEqual({ fields: [] })
  })

  it('returns a deep-clone of valid input', () => {
    const field = createDefaultField('short_answer')
    const input = { fields: [field] }
    const normalized = normalizeFormSchema(input)

    // Mutating the normalized result must not affect the input
    normalized.fields[0].label = 'mutated'
    expect(field.label).not.toBe('mutated')
  })
})
