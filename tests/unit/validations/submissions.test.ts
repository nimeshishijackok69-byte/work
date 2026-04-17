import { describe, it, expect } from 'vitest'
import type { FormSchema } from '@/lib/forms/schema'
import {
  buildFormResponseSchema,
  submissionRequestSchema,
  teacherInfoSchema,
  draftUpdateRequestSchema,
} from '@/lib/validations/submissions'

describe('validations/submissions — teacherInfoSchema', () => {
  it('accepts a minimal valid payload', () => {
    const parsed = teacherInfoSchema.safeParse({
      name: 'Taylor Teacher',
      email: 'taylor@example.com',
      phone: '',
      school_name: '',
    })
    expect(parsed.success).toBe(true)
  })

  it('rejects malformed emails', () => {
    const parsed = teacherInfoSchema.safeParse({
      name: 'Taylor',
      email: 'not-an-email',
    })
    expect(parsed.success).toBe(false)
  })

  it('rejects empty names', () => {
    const parsed = teacherInfoSchema.safeParse({
      name: '',
      email: 'taylor@example.com',
    })
    expect(parsed.success).toBe(false)
  })
})

describe('validations/submissions — buildFormResponseSchema', () => {
  it('enforces required short_answer and paragraph fields', () => {
    const formSchema: FormSchema = {
      fields: [
        {
          id: 'f1',
          type: 'short_answer',
          label: 'School name',
          required: true,
          config: {},
          validation: { maxLength: 50 },
        },
        {
          id: 'f2',
          type: 'paragraph',
          label: 'Description',
          required: false,
          config: { rows: 4 },
        },
      ],
    }
    const responseSchema = buildFormResponseSchema(formSchema)
    const missing = responseSchema.safeParse({ f1: '', f2: 'anything' })
    expect(missing.success).toBe(false)

    const ok = responseSchema.safeParse({ f1: 'Lincoln High', f2: 'Great school' })
    expect(ok.success).toBe(true)
  })

  it('enforces maxLength on short_answer', () => {
    const formSchema: FormSchema = {
      fields: [
        {
          id: 'f1',
          type: 'short_answer',
          label: 'Short',
          required: true,
          config: {},
          validation: { maxLength: 5 },
        },
      ],
    }
    const responseSchema = buildFormResponseSchema(formSchema)
    const parsed = responseSchema.safeParse({ f1: 'too long value' })
    expect(parsed.success).toBe(false)
  })

  it('constrains multiple_choice to configured options', () => {
    const formSchema: FormSchema = {
      fields: [
        {
          id: 'mc1',
          type: 'multiple_choice',
          label: 'Pick one',
          required: true,
          config: { options: ['A', 'B', 'C'] },
        },
      ],
    }
    const responseSchema = buildFormResponseSchema(formSchema)
    expect(responseSchema.safeParse({ mc1: 'Z' }).success).toBe(false)
    expect(responseSchema.safeParse({ mc1: 'A' }).success).toBe(true)
  })

  it('requires at least one option for required checkboxes', () => {
    const formSchema: FormSchema = {
      fields: [
        {
          id: 'cb1',
          type: 'checkboxes',
          label: 'Pick all that apply',
          required: true,
          config: { options: ['Red', 'Green', 'Blue'] },
        },
      ],
    }
    const responseSchema = buildFormResponseSchema(formSchema)
    expect(responseSchema.safeParse({ cb1: [] }).success).toBe(false)
    expect(responseSchema.safeParse({ cb1: ['Red'] }).success).toBe(true)
    expect(responseSchema.safeParse({ cb1: ['Purple'] }).success).toBe(false)
  })

  it('clamps linear_scale values to the configured range', () => {
    const formSchema: FormSchema = {
      fields: [
        {
          id: 'ls1',
          type: 'linear_scale',
          label: 'Rate it',
          required: true,
          config: { min: 1, max: 5 },
        },
      ],
    }
    const responseSchema = buildFormResponseSchema(formSchema)
    expect(responseSchema.safeParse({ ls1: 6 }).success).toBe(false)
    expect(responseSchema.safeParse({ ls1: 0 }).success).toBe(false)
    expect(responseSchema.safeParse({ ls1: 3 }).success).toBe(true)
  })

  it('requires file uploads for required file_upload fields', () => {
    const formSchema: FormSchema = {
      fields: [
        {
          id: 'fu1',
          type: 'file_upload',
          label: 'Resume',
          required: true,
          config: { multiple: false, maxFiles: 1, allowedTypes: [] },
        },
      ],
    }
    const responseSchema = buildFormResponseSchema(formSchema)
    expect(responseSchema.safeParse({ fu1: [] }).success).toBe(false)
    expect(
      responseSchema.safeParse({
        fu1: [{ file_url: 'http://x/y.pdf', file_name: 'y.pdf', file_size: 1024 }],
      }).success
    ).toBe(true)
  })

  it('skips section_header fields (no validator generated)', () => {
    const formSchema: FormSchema = {
      fields: [
        {
          id: 'sec',
          type: 'section_header',
          label: 'Intro',
          required: false,
        },
        {
          id: 'f1',
          type: 'short_answer',
          label: 'Name',
          required: true,
          config: {},
        },
      ],
    }
    const responseSchema = buildFormResponseSchema(formSchema)
    expect(responseSchema.safeParse({ f1: 'Taylor' }).success).toBe(true)
  })
})

describe('validations/submissions — submissionRequestSchema', () => {
  it('defaults isDraft to false when not provided', () => {
    const parsed = submissionRequestSchema.safeParse({
      slug: 'abc12345',
      teacherInfo: { name: 'Taylor', email: 'taylor@example.com' },
      formData: {},
    })
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.isDraft).toBe(false)
    }
  })

  it('rejects empty slugs', () => {
    const parsed = submissionRequestSchema.safeParse({
      slug: '',
      teacherInfo: { name: 'Taylor', email: 'taylor@example.com' },
      formData: {},
    })
    expect(parsed.success).toBe(false)
  })
})

describe('validations/submissions — draftUpdateRequestSchema', () => {
  it('requires draftToken and formData', () => {
    expect(draftUpdateRequestSchema.safeParse({ formData: {} }).success).toBe(false)
    expect(
      draftUpdateRequestSchema.safeParse({ draftToken: 'abc', formData: {} }).success
    ).toBe(true)
  })
})
