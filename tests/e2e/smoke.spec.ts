import { test, expect } from '@playwright/test'

/**
 * Smoke tests verify the public shell renders without exceptions and that
 * key unauthenticated routes respond with expected shell content.
 *
 * These tests intentionally do not touch Supabase / the database — they are
 * safe to run against any preview or production deployment and give us a
 * fast signal during CI and post-deploy checks.
 */
test.describe('public shell', () => {
  test('home renders hero and call to action', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Aventus|Event|Review/i)
    // The marketing shell should surface the sign-in CTA for unauthenticated users.
    await expect(page.getByRole('link', { name: /sign in|log in/i }).first()).toBeVisible()
  })

  test('login page renders credential form', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })

  test('register page renders account form', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByLabel(/name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
  })

  test('protected dashboard redirects anonymous visitors to login', async ({ page }) => {
    const response = await page.goto('/admin')
    // The proxy/middleware should bounce us to /login (either 3xx or client redirect).
    await expect(page).toHaveURL(/\/login/)
    expect(response?.status() ?? 0).toBeLessThan(500)
  })
})
