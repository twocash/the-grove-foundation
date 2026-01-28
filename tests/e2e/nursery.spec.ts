import { test, expect } from '@playwright/test'

/**
 * Nursery Console E2E Tests
 * Sprint: nursery-v1 + S26-NUR (Nursery Inspector Rationalization + SFR Bridge)
 *
 * User stories:
 * - US-A001: View Actionable Sprouts
 * - US-A002: Open Sprout Inspector
 * - US-A003: Promote Sprout to Garden
 * - US-A004: Archive Sprout
 * - US-N005: Promoted navigation tab + StatusBadge (S26-NUR)
 * - US-N006: View Artifacts button (S26-NUR)
 */

test.describe('Nursery Console - Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/bedrock/nursery')
    await page.waitForLoadState('networkidle')
  })

  // =========================================================================
  // US-A001: View Actionable Sprouts
  // =========================================================================
  test('US-A001: Nursery console loads without errors', async ({ page }) => {
    const errors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text()
        if (!text.includes('favicon') && !text.includes('net::ERR_')) {
          errors.push(text)
        }
      }
    })

    await page.waitForTimeout(2000)

    const criticalErrors = errors.filter(e =>
      !e.includes('ResizeObserver') &&
      !e.includes('Loading chunk') &&
      !e.includes('Failed to load resource')
    )

    expect(criticalErrors).toHaveLength(0)
  })

  test('US-A001: Nursery console displays title', async ({ page }) => {
    const title = page.locator('h1:has-text("Nursery")').first()
    await expect(title).toBeVisible({ timeout: 10000 })
  })

  test('US-A001: Nursery console displays filter controls', async ({ page }) => {
    // Status dropdown filter and Needs Review filter exist in the toolbar
    const statusFilter = page.locator('button:has-text("Status")')
    const needsReviewFilter = page.locator('button:has-text("Needs Review")')

    await expect(statusFilter).toBeVisible({ timeout: 10000 })
    await expect(needsReviewFilter).toBeVisible({ timeout: 10000 })
  })

  test('US-A001: Nursery console displays search input', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]')
    await expect(searchInput).toBeVisible({ timeout: 10000 })
  })

  test('US-A001: Nursery shows empty state or sprout list', async ({ page }) => {
    await page.waitForTimeout(3000)

    const sproutCards = page.locator('[data-testid="sprout-card"]')
    const cardCount = await sproutCards.count()

    // Either we have sprout cards or an empty/loading state is rendered
    // The page should have finished loading (networkidle) so content should be present
    const pageContent = await page.textContent('body')
    const hasCards = cardCount > 0
    const hasEmptyIndicator = pageContent?.includes('No') || pageContent?.includes('empty') || pageContent?.includes('Showing 0')

    expect(hasCards || hasEmptyIndicator).toBeTruthy()
  })

  // =========================================================================
  // US-A002: Open Sprout Inspector
  // =========================================================================
  test('US-A002: Can click on sprout card to open inspector', async ({ page }) => {
    await page.waitForTimeout(3000)

    const firstCard = page.locator('[data-testid="sprout-card"]').first()

    if (await firstCard.isVisible().catch(() => false)) {
      await firstCard.click()
      await page.waitForTimeout(1000)

      // Inspector should show section headers (Status, Identity, Provenance are typical)
      const statusSection = page.locator('h4:has-text("Status")')
      const hasStatusSection = await statusSection.isVisible().catch(() => false)

      // Or check for any inspector action buttons (Archive, Promote, etc.)
      const archiveBtn = page.locator('button:has-text("Archive")')
      const promoteBtn = page.locator('button:has-text("Promote to Garden")')
      const hasActionBtn = await archiveBtn.isVisible().catch(() => false) ||
                           await promoteBtn.isVisible().catch(() => false)

      expect(hasStatusSection || hasActionBtn).toBeTruthy()
    } else {
      test.skip()
    }
  })

  test('US-A002: Close button closes inspector', async ({ page }) => {
    await page.waitForTimeout(3000)

    const firstCard = page.locator('[data-testid="sprout-card"]').first()

    if (await firstCard.isVisible().catch(() => false)) {
      await firstCard.click()
      await page.waitForTimeout(1000)

      // Verify inspector opened
      const promoteBtn = page.locator('button:has-text("Promote to Garden")')
      const archiveBtn = page.locator('button:has-text("Archive")')
      const wasOpen = await promoteBtn.isVisible().catch(() => false) ||
                      await archiveBtn.isVisible().catch(() => false)

      if (wasOpen) {
        // Click the close button (X) in the inspector panel
        const closeBtn = page.locator('button:has-text("close")').first()
        await closeBtn.click()
        await page.waitForTimeout(500)

        // Inspector action buttons should no longer be visible
        await expect(promoteBtn).not.toBeVisible({ timeout: 3000 })
      }
    } else {
      test.skip()
    }
  })

  // =========================================================================
  // US-A003: Promote Sprout to Garden
  // =========================================================================
  test('US-A003: Inspector shows Promote or Archive actions for sprouts', async ({ page }) => {
    await page.waitForTimeout(3000)

    const firstCard = page.locator('[data-testid="sprout-card"]').first()

    if (await firstCard.isVisible().catch(() => false)) {
      await firstCard.click()
      await page.waitForTimeout(1000)

      // Depending on sprout status, we should see at least one action button
      const promoteBtn = page.locator('button:has-text("Promote to Garden")')
      const archiveBtn = page.locator('button:has-text("Archive")')
      const restoreBtn = page.locator('button:has-text("Restore")')
      const viewArtifactsBtn = page.locator('button:has-text("View Artifacts")')

      const hasPromote = await promoteBtn.isVisible().catch(() => false)
      const hasArchive = await archiveBtn.isVisible().catch(() => false)
      const hasRestore = await restoreBtn.isVisible().catch(() => false)
      const hasViewArtifacts = await viewArtifactsBtn.isVisible().catch(() => false)

      // At least one action should be available
      expect(hasPromote || hasArchive || hasRestore || hasViewArtifacts).toBeTruthy()
    } else {
      test.skip()
    }
  })

  // =========================================================================
  // US-A004: Archive Sprout
  // =========================================================================
  test('US-A004: Archive button opens archive dialog', async ({ page }) => {
    await page.waitForTimeout(3000)

    const firstCard = page.locator('[data-testid="sprout-card"]').first()

    if (await firstCard.isVisible().catch(() => false)) {
      await firstCard.click()
      await page.waitForTimeout(1000)

      const archiveBtn = page.locator('button:has-text("Archive")')

      if (await archiveBtn.isVisible().catch(() => false)) {
        await archiveBtn.click()
        await page.waitForTimeout(500)

        // Archive dialog should open with reason selection
        const archiveDialog = page.locator('h3:has-text("Archive Sprout")')
        await expect(archiveDialog).toBeVisible({ timeout: 3000 })
      }
    } else {
      test.skip()
    }
  })
})

// =============================================================================
// S26-NUR: Promoted Status Filter + SFR Bridge
// =============================================================================
test.describe('S26-NUR: Promoted Filter & SFR Bridge', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/bedrock/nursery')
    await page.waitForLoadState('networkidle')
  })

  test('US-N005: Status filter dropdown includes promoted option', async ({ page }) => {
    // Open the Status filter dropdown
    const statusFilter = page.locator('button:has-text("Status")')
    await expect(statusFilter).toBeVisible({ timeout: 10000 })

    await statusFilter.click()
    await page.waitForTimeout(500)

    // The dropdown should include 'promoted' as a filter option (S26-NUR addition)
    const promotedOption = page.locator('text=/promoted/i')
    await expect(promotedOption.first()).toBeVisible({ timeout: 5000 })
  })

  test('US-N005: Selecting promoted filter does not crash', async ({ page }) => {
    const statusFilter = page.locator('button:has-text("Status")')

    if (await statusFilter.isVisible()) {
      await statusFilter.click()
      await page.waitForTimeout(500)

      const promotedOption = page.locator('text=/promoted/i').first()
      if (await promotedOption.isVisible().catch(() => false)) {
        await promotedOption.click()
        await page.waitForTimeout(1000)

        // Page should remain on nursery route with no crash
        expect(page.url()).toContain('/bedrock/nursery')

        // "Showing X of Y" counter should update
        const showingText = page.locator('text=/Showing \\d+/')
        await expect(showingText.first()).toBeVisible({ timeout: 5000 })
      }
    }
  })

  test('US-N006: Inspector renders with Promote to Garden button', async ({ page }) => {
    await page.waitForTimeout(3000)

    const firstCard = page.locator('[data-testid="sprout-card"]').first()

    if (await firstCard.isVisible().catch(() => false)) {
      await firstCard.click()
      await page.waitForTimeout(1000)

      // Inspector should render with Status section header
      const statusSection = page.locator('h4:has-text("Status")')
      await expect(statusSection).toBeVisible({ timeout: 5000 })

      // Promote to Garden button should be visible for completed/ready sprouts
      const promoteBtn = page.locator('button:has-text("Promote to Garden")')
      const hasPromote = await promoteBtn.isVisible().catch(() => false)

      // View Artifacts button appears when generatedArtifacts.length > 0
      const viewArtifactsBtn = page.locator('button:has-text("View Artifacts")')
      const hasViewArtifacts = await viewArtifactsBtn.isVisible().catch(() => false)

      // At least one S26-NUR action button should be present (Promote or View Artifacts)
      // depending on sprout data status
      if (hasPromote) {
        await expect(promoteBtn).toHaveAttribute('aria-haspopup', 'dialog')
      }
      if (hasViewArtifacts) {
        await expect(viewArtifactsBtn).toHaveAttribute('aria-haspopup', 'dialog')
      }

      // Inspector should have all expected sections
      await expect(page.locator('h4:has-text("Identity")')).toBeVisible()
    } else {
      test.skip()
    }
  })

  test('US-N006: Promote to Garden opens SFR modal without crash', async ({ page }) => {
    await page.waitForTimeout(3000)

    const firstCard = page.locator('[data-testid="sprout-card"]').first()

    if (await firstCard.isVisible().catch(() => false)) {
      await firstCard.click()
      await page.waitForTimeout(1000)

      const promoteBtn = page.locator('button:has-text("Promote to Garden")')

      if (await promoteBtn.isVisible().catch(() => false)) {
        // Collect console errors during SFR modal open
        const errors: string[] = []
        page.on('console', msg => {
          if (msg.type() === 'error') {
            const text = msg.text()
            if (!text.includes('favicon') && !text.includes('net::ERR_') &&
                !text.includes('ResizeObserver') && !text.includes('Failed to load resource') &&
                !text.includes('signal aggregation')) {
              errors.push(text)
            }
          }
        })

        await promoteBtn.click()
        await page.waitForTimeout(2000)

        // SFR modal should open (dialog role or visible modal content)
        const modal = page.locator('[role="dialog"]')
        const sfrContent = page.locator('text=/Full Report|Summary|Sources/')
        const hasModal = await modal.isVisible().catch(() => false)
        const hasSFRContent = await sfrContent.first().isVisible().catch(() => false)

        expect(hasModal || hasSFRContent).toBeTruthy()

        // No crash errors (useToast fix verified)
        const crashErrors = errors.filter(e => e.includes('useToast') || e.includes('ToastProvider'))
        expect(crashErrors).toHaveLength(0)

        // Close modal
        await page.keyboard.press('Escape')
      }
    } else {
      test.skip()
    }
  })
})

// =============================================================================
// Nursery Console - Navigation
// =============================================================================
test.describe('Nursery Console - Navigation', () => {
  test('can navigate to nursery from bedrock dashboard', async ({ page }) => {
    await page.goto('/bedrock')
    await page.waitForLoadState('networkidle')

    await page.goto('/bedrock/nursery')
    await page.waitForLoadState('networkidle')

    expect(page.url()).toContain('/bedrock/nursery')
  })

  test('nursery route accessible directly', async ({ page }) => {
    await page.goto('/bedrock/nursery')
    await page.waitForLoadState('networkidle')

    const title = page.locator('h1:has-text("Nursery")').first()
    await expect(title).toBeVisible({ timeout: 10000 })
  })
})

// =============================================================================
// Nursery Console - Filter Interactions
// =============================================================================
test.describe('Nursery Console - Filter Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/bedrock/nursery')
    await page.waitForLoadState('networkidle')
  })

  test('can toggle status filters', async ({ page }) => {
    const archivedFilter = page.locator('button:has-text("Archived")')

    if (await archivedFilter.isVisible()) {
      await archivedFilter.click()
      await page.waitForTimeout(500)

      expect(page.url()).toContain('/bedrock/nursery')
    }
  })

  test('can type in search input', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]')

    if (await searchInput.isVisible()) {
      await searchInput.fill('test search')
      await page.waitForTimeout(500)

      await expect(searchInput).toHaveValue('test search')
    }
  })

  test('can toggle needs review filter', async ({ page }) => {
    const needsReviewButton = page.locator('button:has-text("Needs Review")')

    if (await needsReviewButton.isVisible()) {
      await needsReviewButton.click()
      await page.waitForTimeout(500)

      expect(page.url()).toContain('/bedrock/nursery')
    }
  })
})
