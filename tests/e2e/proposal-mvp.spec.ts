import { test, expect, type Page } from '@playwright/test'

const authenticatedE2EEnabled = process.env.PLAYWRIGHT_RUN_AUTH_FLOW === 'true'

async function navigateToLogin(page: Page): Promise<void> {
  await page.goto('/login')
  await expect(page.getByRole('heading', { name: /proposal ai/i })).toBeVisible()
}

async function navigateToOpportunities(page: Page): Promise<void> {
  await page.getByRole('link', { name: /opportunities/i }).click()
  await expect(page.getByRole('heading', { name: /opportunities/i })).toBeVisible()
}

test.describe('proposal-ai critical path', () => {
  test.beforeEach(async ({ page }) => {
    await navigateToLogin(page)
  })

  test.afterEach(async ({ page }) => {
    await page.context().clearCookies()
  })

  test('shows login page with Google sign in entry point', async ({ page }) => {
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible()
  })

  test('shows opportunities workspace for authenticated user', async ({ page }) => {
    test.skip(
      !authenticatedE2EEnabled,
      'Set PLAYWRIGHT_RUN_AUTH_FLOW=true with authenticated storage state to run protected flow.',
    )

    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    await navigateToOpportunities(page)
    await expect(page.getByRole('button', { name: /sync opportunities/i })).toBeVisible()
  })
})
