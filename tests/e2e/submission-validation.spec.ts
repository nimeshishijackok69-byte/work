import { test, expect } from '@playwright/test'

/**
 * Submission API validation — exercises the POST /api/submissions contract
 * without any authenticated session.  We rely on the unauthenticated 401 so
 * this test remains DB-agnostic.
 */
test.describe('submissions api', () => {
  test('rejects unauthenticated submission with 401', async ({ request }) => {
    const response = await request.post('/api/submissions', {
      data: {
        event_id: '00000000-0000-0000-0000-000000000000',
        title: 'Test Submission',
        abstract: 'x'.repeat(100),
      },
    })
    expect([401, 403]).toContain(response.status())
  })

  test('rejects malformed payload with 4xx', async ({ request }) => {
    const response = await request.post('/api/submissions', {
      data: { nonsense: true },
    })
    expect(response.status()).toBeGreaterThanOrEqual(400)
    expect(response.status()).toBeLessThan(500)
  })
})
