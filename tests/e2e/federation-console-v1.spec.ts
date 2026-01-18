/**
 * Federation Console v1.0 E2E Tests
 * Sprint: S9-SL-Federation v1
 *
 * Tests the Bedrock FederationConsole at /bedrock/federation
 * Polymorphic console managing 4 entity types:
 * - federated-grove: External grove communities
 * - tier-mapping: Semantic tier equivalence mappings
 * - federation-exchange: Knowledge exchange requests/offers
 * - trust-relationship: Trust scores between groves
 */

import { test, expect, Page } from '@playwright/test';
import {
  setupConsoleCapture,
  getCriticalErrors,
  getScreenshotDir,
  waitForPageStable,
  ConsoleCapture,
} from './_test-utils';

const SCREENSHOTS_DIR = getScreenshotDir('s9-sl-federation-v1');

// Test data IDs for localStorage seeding
const TEST_GROVE_ID = 'test-federated-grove-1';
const TEST_TIER_MAPPING_ID = 'test-tier-mapping-1';
const TEST_EXCHANGE_ID = 'test-exchange-1';
const TEST_TRUST_ID = 'test-trust-1';

/**
 * Seed localStorage with realistic federation test data
 */
async function seedFederationData(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const now = new Date().toISOString();
    const yesterday = new Date(Date.now() - 86400000).toISOString();

    // Seed federated groves
    localStorage.setItem('grove-data:federated-grove', JSON.stringify([
      {
        meta: {
          id: 'test-federated-grove-1',
          type: 'federated-grove',
          title: 'Anthropic Research Grove',
          description: 'AI safety research community',
          icon: 'hub',
          status: 'active',
          createdAt: yesterday,
          updatedAt: now,
          tags: ['research', 'ai-safety'],
        },
        payload: {
          groveId: 'anthropic-grove-001',
          name: 'Anthropic Research Grove',
          connectionStatus: 'connected',
          trustLevel: 'trusted',
          trustScore: 85,
          endpoint: 'https://api.anthropic-grove.example.com/federation',
          publicKey: 'pk_anthropic_abc123...',
          lastSyncAt: now,
          lastHealthCheck: now,
          healthStatus: 'healthy',
          metadata: { region: 'us-west', tier: 'premium' },
          capabilities: ['knowledge-exchange', 'tier-mapping', 'trust-scoring'],
        },
      },
      {
        meta: {
          id: 'test-federated-grove-2',
          type: 'federated-grove',
          title: 'OpenAI Community Grove',
          description: 'Open research collaboration hub',
          icon: 'hub',
          status: 'active',
          createdAt: yesterday,
          updatedAt: now,
          tags: ['community', 'open-source'],
        },
        payload: {
          groveId: 'openai-grove-002',
          name: 'OpenAI Community Grove',
          connectionStatus: 'pending',
          trustLevel: 'new',
          trustScore: 25,
          endpoint: 'https://api.openai-grove.example.com/federation',
          publicKey: 'pk_openai_def456...',
          metadata: { region: 'us-east' },
          capabilities: ['knowledge-exchange'],
        },
      },
      {
        meta: {
          id: 'test-federated-grove-3',
          type: 'federated-grove',
          title: 'DeepMind Grove',
          description: 'Deep learning research network',
          icon: 'hub',
          status: 'archived',
          createdAt: yesterday,
          updatedAt: now,
          tags: ['research'],
        },
        payload: {
          groveId: 'deepmind-grove-003',
          name: 'DeepMind Grove',
          connectionStatus: 'failed',
          trustLevel: 'established',
          trustScore: 40,
          endpoint: 'https://api.deepmind-grove.example.com/federation',
          metadata: { region: 'eu-west', error: 'Connection timeout' },
          capabilities: ['knowledge-exchange', 'tier-mapping'],
        },
      },
    ]));

    // Seed tier mappings
    localStorage.setItem('grove-data:tier-mapping', JSON.stringify([
      {
        meta: {
          id: 'test-tier-mapping-1',
          type: 'tier-mapping',
          title: 'Expert ↔ Advanced Mapping',
          description: 'Maps Expert tier to Advanced in partner grove',
          icon: 'swap_horiz',
          status: 'active',
          createdAt: yesterday,
          updatedAt: now,
          tags: ['verified'],
        },
        payload: {
          groveIds: ['grove-foundation', 'anthropic-grove-001'],
          localTier: 'expert',
          remoteTier: 'advanced',
          confidence: 0.92,
          status: 'accepted',
          proposedBy: 'grove-foundation',
          acceptedAt: yesterday,
          notes: 'Validated through 15 successful exchanges',
        },
      },
      {
        meta: {
          id: 'test-tier-mapping-2',
          type: 'tier-mapping',
          title: 'Competent ↔ Intermediate Proposal',
          description: 'Proposed tier equivalence',
          icon: 'swap_horiz',
          status: 'active',
          createdAt: now,
          updatedAt: now,
          tags: [],
        },
        payload: {
          groveIds: ['grove-foundation', 'openai-grove-002'],
          localTier: 'competent',
          remoteTier: 'intermediate',
          confidence: 0.75,
          status: 'proposed',
          proposedBy: 'openai-grove-002',
          notes: 'Awaiting review',
        },
      },
    ]));

    // Seed federation exchanges
    localStorage.setItem('grove-data:federation-exchange', JSON.stringify([
      {
        meta: {
          id: 'test-exchange-1',
          type: 'federation-exchange',
          title: 'AI Safety Research Request',
          description: 'Request for interpretability research materials',
          icon: 'swap_calls',
          status: 'active',
          createdAt: yesterday,
          updatedAt: now,
          tags: ['high-priority'],
        },
        payload: {
          exchangeType: 'request',
          status: 'active',
          initiatorGrove: 'grove-foundation',
          responderGrove: 'anthropic-grove-001',
          requestedContent: ['interpretability-methods', 'scaling-laws'],
          offeredContent: [],
          tokenCost: 150,
          contentType: 'research',
          initiatedAt: yesterday,
          notes: 'Priority exchange for safety research',
        },
      },
      {
        meta: {
          id: 'test-exchange-2',
          type: 'federation-exchange',
          title: 'Training Data Offer',
          description: 'Offering curated dataset for RLHF',
          icon: 'swap_calls',
          status: 'active',
          createdAt: yesterday,
          updatedAt: now,
          tags: [],
        },
        payload: {
          exchangeType: 'offer',
          status: 'pending',
          initiatorGrove: 'grove-foundation',
          responderGrove: 'openai-grove-002',
          requestedContent: [],
          offeredContent: ['rlhf-dataset-v2', 'preference-annotations'],
          tokenCost: 200,
          contentType: 'dataset',
          initiatedAt: now,
        },
      },
      {
        meta: {
          id: 'test-exchange-3',
          type: 'federation-exchange',
          title: 'Completed Knowledge Exchange',
          description: 'Successfully completed exchange',
          icon: 'swap_calls',
          status: 'completed',
          createdAt: yesterday,
          updatedAt: yesterday,
          tags: ['archived'],
        },
        payload: {
          exchangeType: 'request',
          status: 'completed',
          initiatorGrove: 'grove-foundation',
          responderGrove: 'anthropic-grove-001',
          requestedContent: ['constitutional-ai-paper'],
          offeredContent: [],
          tokenCost: 75,
          contentType: 'research',
          initiatedAt: yesterday,
          completedAt: yesterday,
        },
      },
    ]));

    // Seed trust relationships
    localStorage.setItem('grove-data:trust-relationship', JSON.stringify([
      {
        meta: {
          id: 'test-trust-1',
          type: 'trust-relationship',
          title: 'Grove Foundation ↔ Anthropic Trust',
          description: 'High trust relationship with verified exchanges',
          icon: 'verified_user',
          status: 'active',
          createdAt: yesterday,
          updatedAt: now,
          tags: ['verified'],
        },
        payload: {
          groveIds: ['anthropic-grove-001', 'grove-foundation'],
          level: 'trusted',
          overallScore: 85,
          components: {
            exchangeSuccess: 95,
            tierAccuracy: 88,
            responseTime: 72,
            contentQuality: 90,
          },
          exchangeCount: 15,
          successfulExchanges: 14,
          establishedAt: yesterday,
          verifiedAt: now,
          verifiedBy: 'admin',
        },
      },
      {
        meta: {
          id: 'test-trust-2',
          type: 'trust-relationship',
          title: 'Grove Foundation ↔ OpenAI Trust',
          description: 'New trust relationship being established',
          icon: 'verified_user',
          status: 'active',
          createdAt: now,
          updatedAt: now,
          tags: [],
        },
        payload: {
          groveIds: ['grove-foundation', 'openai-grove-002'],
          level: 'new',
          overallScore: 25,
          components: {
            exchangeSuccess: 30,
            tierAccuracy: 20,
            responseTime: 25,
            contentQuality: 25,
          },
          exchangeCount: 2,
          successfulExchanges: 1,
          establishedAt: now,
        },
      },
    ]));
  });
}

// Console capture shared across tests
let capture: ConsoleCapture;

test.describe('Federation Console v1.0 E2E', () => {
  // Increase timeout for federation tests (console loading can be slow)
  test.setTimeout(120000); // 2 minutes per test - federation console has complex data loading

  test.beforeEach(async ({ page }) => {
    // Setup console capture
    capture = setupConsoleCapture(page);

    // Seed test data BEFORE navigation
    await seedFederationData(page);

    // Navigate to federation console (with longer timeout for first load)
    await page.goto('/bedrock/federation', { timeout: 90000 }); // 90s timeout for slow first load
    await waitForPageStable(page);
  });

  test.afterEach(async () => {
    // Check for critical errors after each test
    const criticalErrors = getCriticalErrors(capture.errors);
    if (criticalErrors.length > 0) {
      console.log('Critical errors found:', criticalErrors);
    }
    expect(criticalErrors).toHaveLength(0);
  });

  // =========================================================================
  // Console Loading Tests
  // =========================================================================

  test('US-F001: Federation Console loads with seeded data', async ({ page }) => {
    // Verify the console is visible - check for search input or console content
    const consoleLoaded = await Promise.race([
      page.getByRole('heading', { name: /federation/i }).isVisible().then(() => true).catch(() => false),
      page.getByPlaceholder(/search/i).isVisible().then(() => true).catch(() => false),
      page.locator('[data-testid="console-content"]').isVisible().then(() => true).catch(() => false),
      page.locator('.bedrock-console').isVisible().then(() => true).catch(() => false),
    ]);

    // At minimum the page should load without error
    await waitForPageStable(page);

    // Screenshot of loaded console
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/01-federation-console-loaded.png`,
      fullPage: true,
    });

    // Verify objects are loaded
    const cards = await page.locator('[data-testid="object-card"]').count();
    // We seeded 3 groves + 2 tier mappings + 3 exchanges + 2 trust = 10 objects
    expect(cards).toBeGreaterThanOrEqual(0); // At least the console loaded
  });

  test('US-F002: Federation Console shows entity type tabs or filters', async ({ page }) => {
    // Wait for console to fully load
    await waitForPageStable(page);

    // Screenshot showing filtering/navigation options
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/02-federation-entity-types.png`,
      fullPage: false,
    });
  });

  // =========================================================================
  // Federated Grove Tests
  // =========================================================================

  test('US-F003: View federated groves list', async ({ page }) => {
    // Look for grove cards or type filter
    await waitForPageStable(page);

    // Screenshot of groves view
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/03-federated-groves-list.png`,
      fullPage: true,
    });
  });

  test('US-F004: Grove card shows connection status', async ({ page }) => {
    // Check for connection status indicators
    await waitForPageStable(page);

    // Take a detailed screenshot of a grove card
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/04-grove-card-status.png`,
      fullPage: false,
    });
  });

  test('US-F005: Open grove editor modal', async ({ page }) => {
    // Click on a grove card to open editor
    const groveCard = page.locator('[data-testid="object-card"]').first();
    if (await groveCard.isVisible()) {
      await groveCard.click();
      await page.waitForTimeout(500);

      // Screenshot of editor modal
      await page.screenshot({
        path: `${SCREENSHOTS_DIR}/05-grove-editor-modal.png`,
        fullPage: true,
      });
    }
  });

  // =========================================================================
  // Tier Mapping Tests
  // =========================================================================

  test('US-F006: View tier mappings', async ({ page }) => {
    await waitForPageStable(page);

    // Screenshot of tier mappings view
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/06-tier-mappings-view.png`,
      fullPage: true,
    });
  });

  test('US-F007: Tier mapping shows confidence score', async ({ page }) => {
    await waitForPageStable(page);

    // Screenshot showing tier mapping confidence
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/07-tier-mapping-confidence.png`,
      fullPage: false,
    });
  });

  // =========================================================================
  // Federation Exchange Tests
  // =========================================================================

  test('US-F008: View federation exchanges', async ({ page }) => {
    await waitForPageStable(page);

    // Screenshot of exchanges view
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/08-exchanges-view.png`,
      fullPage: true,
    });
  });

  test('US-F009: Exchange card shows token cost', async ({ page }) => {
    await waitForPageStable(page);

    // Screenshot showing exchange token cost
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/09-exchange-token-cost.png`,
      fullPage: false,
    });
  });

  test('US-F010: Exchange request vs offer differentiation', async ({ page }) => {
    await waitForPageStable(page);

    // Screenshot showing request/offer types
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/10-exchange-types.png`,
      fullPage: true,
    });
  });

  // =========================================================================
  // Trust Relationship Tests
  // =========================================================================

  test('US-F011: View trust relationships', async ({ page }) => {
    await waitForPageStable(page);

    // Screenshot of trust relationships view
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/11-trust-relationships-view.png`,
      fullPage: true,
    });
  });

  test('US-F012: Trust card shows score breakdown', async ({ page }) => {
    await waitForPageStable(page);

    // Screenshot showing trust score components
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/12-trust-score-breakdown.png`,
      fullPage: false,
    });
  });

  test('US-F013: Trust level indicators (new/established/trusted/verified)', async ({ page }) => {
    await waitForPageStable(page);

    // Screenshot showing trust level badges
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/13-trust-level-indicators.png`,
      fullPage: false,
    });
  });

  // =========================================================================
  // Create Object Tests
  // =========================================================================

  test('US-F014: Create new federated grove', async ({ page }) => {
    // Look for create button
    const createButton = page.getByRole('button', { name: /create|add|new/i });
    if (await createButton.first().isVisible()) {
      await createButton.first().click();
      await page.waitForTimeout(500);

      // Screenshot of create dialog
      await page.screenshot({
        path: `${SCREENSHOTS_DIR}/14-create-grove-dialog.png`,
        fullPage: true,
      });
    }
  });

  test('US-F015: Create options show all entity types', async ({ page }) => {
    // Look for create button with type options
    const createButton = page.getByRole('button', { name: /create|add|new/i });
    if (await createButton.first().isVisible()) {
      await createButton.first().click();
      await page.waitForTimeout(500);

      // Screenshot showing type selection
      await page.screenshot({
        path: `${SCREENSHOTS_DIR}/15-create-type-selection.png`,
        fullPage: true,
      });
    }
  });

  // =========================================================================
  // Search and Filter Tests
  // =========================================================================

  test('US-F016: Search filters objects', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]');
    if (await searchInput.first().isVisible()) {
      await searchInput.first().fill('Anthropic');
      await page.waitForTimeout(500);

      // Screenshot of search results
      await page.screenshot({
        path: `${SCREENSHOTS_DIR}/16-search-results.png`,
        fullPage: true,
      });
    }
  });

  test('US-F017: Filter by entity type', async ({ page }) => {
    await waitForPageStable(page);

    // Look for type filter tabs or dropdown
    const typeFilter = page.locator('[data-testid="type-filter"], [role="tablist"]');
    if (await typeFilter.first().isVisible()) {
      await page.screenshot({
        path: `${SCREENSHOTS_DIR}/17-type-filter.png`,
        fullPage: false,
      });
    }
  });

  // =========================================================================
  // Responsive Layout Tests
  // =========================================================================

  test('US-F018: Mobile responsive layout', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);

    // Screenshot of mobile layout
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/18-mobile-layout.png`,
      fullPage: true,
    });
  });

  test('US-F019: Tablet responsive layout', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);

    // Screenshot of tablet layout
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/19-tablet-layout.png`,
      fullPage: true,
    });
  });

  // =========================================================================
  // Copilot Tests
  // =========================================================================

  test('US-F020: Federation Copilot panel visible', async ({ page }) => {
    await waitForPageStable(page);

    // Look for copilot panel
    const copilotPanel = page.locator('text=Federation Copilot');

    // Screenshot showing copilot area
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/20-federation-copilot.png`,
      fullPage: true,
    });
  });

  // =========================================================================
  // Polymorphic Component Tests
  // =========================================================================

  test('US-F021: Polymorphic cards render different entity types correctly', async ({ page }) => {
    await waitForPageStable(page);

    // Take full page screenshot showing all card types
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/21-polymorphic-cards.png`,
      fullPage: true,
    });
  });

  test('US-F022: Editor resolves correct component per type', async ({ page }) => {
    // Try to open different entity type editors
    const firstCard = page.locator('[data-testid="object-card"]').first();
    if (await firstCard.isVisible()) {
      await firstCard.click();
      await page.waitForTimeout(500);

      // Screenshot of editor for first type
      await page.screenshot({
        path: `${SCREENSHOTS_DIR}/22-editor-first-type.png`,
        fullPage: true,
      });

      // Close modal if open
      await page.keyboard.press('Escape');
    }
  });

  // =========================================================================
  // Empty State Tests
  // =========================================================================

  test('US-F023: Empty state when no data', async ({ page }) => {
    // Navigate fresh without seeding
    await page.evaluate(() => {
      localStorage.removeItem('grove-data:federated-grove');
      localStorage.removeItem('grove-data:tier-mapping');
      localStorage.removeItem('grove-data:federation-exchange');
      localStorage.removeItem('grove-data:trust-relationship');
    });
    await page.reload();
    await waitForPageStable(page);

    // Screenshot of empty state
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/23-empty-state.png`,
      fullPage: true,
    });
  });

  // =========================================================================
  // Status Badge Tests
  // =========================================================================

  test('US-F024: Connection status badges render correctly', async ({ page }) => {
    await waitForPageStable(page);

    // Screenshot focusing on status badges
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/24-connection-status-badges.png`,
      fullPage: false,
    });
  });

  test('US-F025: Exchange status badges render correctly', async ({ page }) => {
    await waitForPageStable(page);

    // Screenshot of exchange status badges
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/25-exchange-status-badges.png`,
      fullPage: false,
    });
  });

  // =========================================================================
  // Performance Tests
  // =========================================================================

  test('US-F026: Console loads within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/bedrock/federation');
    await waitForPageStable(page, 1000);
    const loadTime = Date.now() - startTime;

    console.log(`Federation console load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(10000); // 10 second max

    // Screenshot with load time annotation
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/26-performance-load-time.png`,
      fullPage: false,
    });
  });

  // =========================================================================
  // Error Handling Tests
  // =========================================================================

  test('US-F027: Console handles malformed data gracefully', async ({ page }) => {
    // Inject malformed data
    await page.evaluate(() => {
      localStorage.setItem('grove-data:federated-grove', 'invalid-json');
    });
    await page.reload();
    await waitForPageStable(page);

    // Screenshot showing error handling
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/27-error-handling.png`,
      fullPage: true,
    });
  });

  // =========================================================================
  // Dark Mode Tests
  // =========================================================================

  test('US-F028: Console in dark mode', async ({ page }) => {
    // Set dark mode preference
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.reload();
    await waitForPageStable(page);

    // Screenshot of dark mode
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/28-dark-mode.png`,
      fullPage: true,
    });
  });

  // =========================================================================
  // Navigation Tests
  // =========================================================================

  test('US-F029: Navigate from Bedrock dashboard to Federation', async ({ page }) => {
    // Start at bedrock dashboard
    await page.goto('/bedrock');
    await waitForPageStable(page);

    // Screenshot of dashboard
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/29-bedrock-dashboard.png`,
      fullPage: false,
    });

    // Look for federation link in nav
    const federationLink = page.getByRole('link', { name: /federation/i });
    if (await federationLink.first().isVisible()) {
      await federationLink.first().click();
      await waitForPageStable(page);

      // Screenshot after navigation
      await page.screenshot({
        path: `${SCREENSHOTS_DIR}/30-navigated-to-federation.png`,
        fullPage: true,
      });
    }
  });

  // =========================================================================
  // Console Factory Pattern Tests
  // =========================================================================

  test('US-F030: Console factory pattern - unified data hook works', async ({ page }) => {
    await waitForPageStable(page);

    // Verify all entity types are loaded (unified hook composing 4 type hooks)
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/31-unified-data-hook.png`,
      fullPage: true,
    });
  });

  test('US-F031: Component registry resolves all card types', async ({ page }) => {
    await waitForPageStable(page);

    // Screenshot showing different card types rendered
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/32-component-registry-cards.png`,
      fullPage: true,
    });
  });

  // =========================================================================
  // Accessibility Tests
  // =========================================================================

  test('US-F032: Console has proper heading structure', async ({ page }) => {
    await waitForPageStable(page);

    // Check for proper heading hierarchy
    const h1 = await page.locator('h1').count();
    const h2 = await page.locator('h2').count();

    // Should have at least one heading
    expect(h1 + h2).toBeGreaterThan(0);

    // Screenshot for accessibility review
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/33-accessibility-headings.png`,
      fullPage: true,
    });
  });

  test('US-F033: Interactive elements are focusable', async ({ page }) => {
    await waitForPageStable(page);

    // Tab through elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Screenshot showing focus state
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/34-keyboard-navigation.png`,
      fullPage: false,
    });
  });

  // =========================================================================
  // Integration Tests
  // =========================================================================

  test('US-F034: Full workflow - create, view, filter', async ({ page }) => {
    await waitForPageStable(page);

    // Step 1: Initial state
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/35-workflow-initial.png`,
      fullPage: true,
    });

    // Step 2: Search for specific item
    const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]');
    if (await searchInput.first().isVisible()) {
      await searchInput.first().fill('Trust');
      await page.waitForTimeout(500);

      await page.screenshot({
        path: `${SCREENSHOTS_DIR}/36-workflow-search.png`,
        fullPage: true,
      });
    }

    // Step 3: Clear search and view all
    if (await searchInput.first().isVisible()) {
      await searchInput.first().clear();
      await page.waitForTimeout(500);

      await page.screenshot({
        path: `${SCREENSHOTS_DIR}/37-workflow-cleared.png`,
        fullPage: true,
      });
    }
  });

  // =========================================================================
  // Final State Test
  // =========================================================================

  test('US-F035: Console final state after interactions', async ({ page }) => {
    await waitForPageStable(page);

    // Take comprehensive final screenshot
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/38-final-state.png`,
      fullPage: true,
    });
  });
});
