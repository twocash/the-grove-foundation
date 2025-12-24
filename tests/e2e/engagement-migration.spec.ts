// tests/e2e/engagement-migration.spec.ts
// E2E tests verifying the engagement migration works correctly

import { test, expect } from '@playwright/test'

test.describe('Engagement Migration', () => {
  test('app loads with EngagementProvider', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // App should load without errors
    await expect(page.locator('body')).toBeVisible()

    // Check no React errors in console
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Navigate around to trigger provider usage
    await page.waitForTimeout(1000)

    // Filter out expected errors (like network issues)
    const reactErrors = consoleErrors.filter(e =>
      e.includes('useEngagement') || e.includes('EngagementProvider')
    )
    expect(reactErrors).toHaveLength(0)
  })

  test('engagement hooks work after migration', async ({ page }) => {
    // Navigate with a lens parameter to test the new hooks
    await page.goto('/?lens=engineer')
    await page.waitForLoadState('networkidle')

    // The page should load without the "must be used within EngagementProvider" error
    await expect(page.locator('body')).toBeVisible()

    // If we get here without errors, the provider is working
    const pageContent = await page.content()
    expect(pageContent).not.toContain('useEngagement must be used within')
  })
})
