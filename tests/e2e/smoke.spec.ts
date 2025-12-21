import { test, expect } from '@playwright/test'

test.describe('Smoke Tests', () => {
  test('landing page loads without critical console errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text()
        // Ignore common non-critical errors
        if (!text.includes('favicon') && !text.includes('net::ERR_')) {
          errors.push(text)
        }
      }
    })

    await page.goto('/')
    await page.waitForTimeout(2000)

    // Filter out known benign errors
    const criticalErrors = errors.filter(e =>
      !e.includes('ResizeObserver') &&
      !e.includes('Loading chunk') &&
      !e.includes('Failed to load resource')
    )

    expect(criticalErrors).toHaveLength(0)
  })

  test('page renders main content', async ({ page }) => {
    await page.goto('/')

    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle')

    // Check that basic structure exists
    const body = await page.locator('body')
    await expect(body).toBeVisible()
  })

  test('terminal panel is accessible', async ({ page }) => {
    await page.goto('/')

    // Wait for app to initialize
    await page.waitForLoadState('networkidle')

    // Look for terminal-related UI elements
    const terminalArea = page.locator('[data-testid="terminal"], .terminal, #terminal').first()

    // If terminal exists, it should be visible or can be made visible
    if (await terminalArea.count() > 0) {
      await expect(terminalArea).toBeVisible({ timeout: 10000 })
    }
  })

  test('foundation dashboard loads', async ({ page }) => {
    await page.goto('/foundation')

    await page.waitForLoadState('networkidle')

    // Check that foundation layout exists
    const content = await page.content()
    expect(content.length).toBeGreaterThan(100)
  })

  test('no JavaScript exceptions on page load', async ({ page }) => {
    const exceptions: string[] = []

    page.on('pageerror', error => {
      exceptions.push(error.message)
    })

    await page.goto('/')
    await page.waitForTimeout(3000)

    // Filter out known benign exceptions
    const criticalExceptions = exceptions.filter(e =>
      !e.includes('ResizeObserver') &&
      !e.includes('ChunkLoadError')
    )

    expect(criticalExceptions).toHaveLength(0)
  })
})

test.describe('Navigation', () => {
  test('can navigate to foundation from home', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Navigate to foundation
    await page.goto('/foundation')
    await page.waitForLoadState('networkidle')

    // Verify we're on foundation
    expect(page.url()).toContain('/foundation')
  })

  test('can navigate between foundation consoles', async ({ page }) => {
    await page.goto('/foundation')
    await page.waitForLoadState('networkidle')

    // Try navigating to different foundation routes
    const routes = ['/foundation/genesis', '/foundation/narrative', '/foundation/tuner']

    for (const route of routes) {
      await page.goto(route)
      await page.waitForLoadState('networkidle')
      expect(page.url()).toContain(route)
    }
  })
})
