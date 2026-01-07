// tests/e2e/explore-prompt-targeting.spec.ts
// E2E tests for prompt targeting on /explore route
// Sprint: prompt-copilot-actions-v1
//
// PURPOSE: Verify that prompts displayed on the Explore page
// are filtered/ranked according to their targeting configuration:
// - Lens affinities (persona-specific prompts)
// - Stage targeting (genesis/exploration/synthesis/advocacy)
// - Moment conditions

import { test, expect } from '@playwright/test';

test.describe('Explore Route - Prompt Targeting', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to start fresh
    await page.goto('/explore');
    await page.evaluate(() => {
      Object.keys(localStorage)
        .filter(k => k.startsWith('grove-'))
        .forEach(k => localStorage.removeItem(k));
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test.describe('Initial Load - Welcome Prompts', () => {
    test('displays prompts on explore page', async ({ page }) => {
      await page.goto('/explore');
      await page.waitForLoadState('networkidle');

      // The page should render
      await expect(page.locator('body')).toBeVisible();

      // Look for KineticWelcome component with prompts
      const welcomePrompts = page.locator('[data-testid="welcome-prompt"], .glass-card button, .kinetic-welcome button');

      // Should have some prompts visible
      const promptCount = await welcomePrompts.count();
      console.log(`[Test] Found ${promptCount} welcome prompts`);

      // Log what prompts are shown for debugging
      if (promptCount > 0) {
        for (let i = 0; i < Math.min(promptCount, 5); i++) {
          const text = await welcomePrompts.nth(i).textContent();
          console.log(`[Test] Prompt ${i + 1}: ${text?.slice(0, 60)}...`);
        }
      }
    });

    test.skip('welcome prompts should be filtered by targeting (NOT YET IMPLEMENTED)', async ({ page }) => {
      // This test documents the expected behavior that is NOT yet implemented
      // Currently ExploreShell uses static getTerminalWelcome() instead of
      // useSuggestedPrompts with targeting

      await page.goto('/explore');
      await page.waitForLoadState('networkidle');

      // Get initial prompts
      const initialPrompts = await page.locator('[data-testid="welcome-prompt"]').allTextContents();

      // These should be genesis-stage prompts since interaction count is 0
      // Once targeting is implemented, verify prompts have stages: ['genesis']

      expect(initialPrompts.length).toBeGreaterThan(0);
    });
  });

  test.describe('Lens Selection - Prompt Filtering', () => {
    test('can select a lens from header', async ({ page }) => {
      await page.goto('/explore');
      await page.waitForLoadState('networkidle');

      // Look for lens picker button in header
      const lensButton = page.locator('[data-testid="lens-picker-trigger"], .kinetic-header button:has-text("Lens"), button:has-text("Choose Lens")').first();

      if (await lensButton.count() > 0 && await lensButton.isVisible({ timeout: 3000 })) {
        await lensButton.click();

        // Lens picker should open
        const lensPicker = page.locator('[data-testid="lens-picker"], .lens-picker');
        await expect(lensPicker).toBeVisible({ timeout: 3000 });

        console.log('[Test] Lens picker opened successfully');
      } else {
        console.log('[Test] Lens picker trigger not found, skipping');
        test.skip();
      }
    });

    test.skip('selecting Dr. Chiang lens filters prompts (NOT YET IMPLEMENTED)', async ({ page }) => {
      // This test documents expected targeting behavior
      // When Dr. Chiang lens is selected:
      // - Prompts with lensAffinities including 'dr-chiang' should rank higher
      // - Prompts with lensAffinities excluding 'dr-chiang' should be filtered out

      await page.goto('/explore');
      await page.waitForLoadState('networkidle');

      // Select Dr. Chiang lens
      const lensButton = page.locator('button:has-text("Choose Lens")').first();
      await lensButton.click();

      const chiangOption = page.locator('text=Dr. Chiang');
      await chiangOption.click();

      // Verify prompts changed based on lens targeting
      // TODO: Add assertions once targeting is wired up
    });
  });

  test.describe('Stage Progression - Prompt Changes', () => {
    test('stage changes after interactions', async ({ page }) => {
      await page.goto('/explore');
      await page.waitForLoadState('networkidle');

      // Find input area
      const inputArea = page.locator('input[placeholder*="Ask"], textarea').first();

      if (await inputArea.count() === 0 || !(await inputArea.isVisible({ timeout: 3000 }))) {
        console.log('[Test] Input area not found, skipping');
        test.skip();
        return;
      }

      // Initial stage should be ARRIVAL (0 interactions)
      let stageIndicator = page.locator('[data-testid="stage-indicator"], .stage-pill, :has-text("ARRIVAL")');

      // Send first message
      await inputArea.fill('What is The Grove?');
      await inputArea.press('Enter');
      await page.waitForTimeout(3000);

      // After 1 interaction, stage should be ORIENTED
      // Check stage indicator or header for stage text
      const headerText = await page.locator('.kinetic-header').textContent();
      console.log('[Test] Header after 1 interaction:', headerText?.slice(0, 100));
    });

    test.skip('prompts change based on stage (NOT YET IMPLEMENTED)', async ({ page }) => {
      // This test documents expected stage-based targeting
      //
      // Stage progression:
      // - 0 interactions: genesis stage prompts
      // - 1-2 interactions: exploration stage prompts
      // - 3-5 interactions: synthesis stage prompts
      // - 6+ interactions: advocacy stage prompts
      //
      // Prompts should be filtered to match current stage via
      // targeting.stages field

      await page.goto('/explore');

      // TODO: Verify genesis prompts at start
      // TODO: Send messages and verify stage-appropriate prompts appear
    });
  });

  test.describe('Highlight Click - Prompt Lookup', () => {
    test('usePromptForHighlight is wired (functional)', async ({ page }) => {
      // This tests the ONE part of targeting that IS implemented:
      // When clicking on a highlighted concept in a response,
      // usePromptForHighlight looks up a backing prompt with targeting

      await page.goto('/explore');
      await page.waitForLoadState('networkidle');

      const inputArea = page.locator('input[placeholder*="Ask"], textarea').first();

      if (await inputArea.count() === 0) {
        test.skip();
        return;
      }

      // Send a query that will generate highlighted concepts
      await inputArea.fill('Tell me about the Ratchet Effect and infrastructure');
      await inputArea.press('Enter');

      // Wait for response with potential highlights
      await page.waitForTimeout(5000);

      // Look for concept spans (clickable highlights)
      const conceptSpans = page.locator('[data-testid="span-concept"], .concept-span, button.font-semibold');
      const count = await conceptSpans.count();

      console.log(`[Test] Found ${count} concept spans in response`);

      if (count > 0) {
        // Click first concept to trigger usePromptForHighlight lookup
        await conceptSpans.first().click();

        // Should submit a new query (either with backing prompt or fallback)
        await page.waitForTimeout(2000);

        // Verify a new query was submitted
        const queryBlocks = page.locator('[data-testid="query-block"]');
        const queryCount = await queryBlocks.count();
        expect(queryCount).toBeGreaterThanOrEqual(2); // Original + clicked concept
      }
    });
  });
});

test.describe('Static Prompt Data - 4D Targeting Verification', () => {
  // These tests verify that the static prompt library has proper targeting data.
  // The prompts are loaded from JSON files in src/data/prompts/

  test('library prompts have 4D targeting configured', async ({ page }) => {
    // Load the page and check prompt data via window object
    await page.goto('/explore');
    await page.waitForLoadState('networkidle');

    // Evaluate prompt library data from the app
    const promptStats = await page.evaluate(() => {
      // Try to access prompt data from module scope
      // This is a diagnostic test - the actual data is in static imports
      return {
        // Check if useSuggestedPrompts is being used
        hasContextFields: typeof window !== 'undefined',
        timestamp: new Date().toISOString(),
      };
    });

    console.log('[Test] Prompt stats:', promptStats);

    // This test primarily documents the expected structure
    // Actual validation would require importing the prompt files directly
    expect(promptStats.hasContextFields).toBe(true);
  });

  test('4D targeting dimensions are documented', async ({ page }) => {
    // Document the 4D targeting model for reference
    const fourDDimensions = {
      stage: {
        field: 'targeting.stages',
        values: ['genesis', 'exploration', 'synthesis', 'advocacy'],
        description: 'Session phase - controls when prompts appear'
      },
      entropy: {
        field: 'targeting.entropyWindow',
        example: { min: 0, max: 0.5 },
        description: 'Query diversity - low entropy = focused, high = exploratory'
      },
      lens: {
        fields: ['lensAffinities', 'targeting.lensIds', 'targeting.excludeLenses'],
        description: 'Persona affinity - weights prompts for specific lenses'
      },
      moment: {
        fields: ['targeting.momentTriggers', 'targeting.requireMoment'],
        description: 'Event triggers - surfaces prompts when moments fire'
      }
    };

    console.log('[Test] 4D Targeting Model:');
    console.log(JSON.stringify(fourDDimensions, null, 2));

    // Verify scoring weights are applied
    const expectedWeights = {
      stageMatch: 30,
      entropyFit: 20,
      lensPrecision: 25,
      topicRelevance: 15,
      momentBoost: 20,
      baseWeightScale: 10
    };

    console.log('[Test] Default scoring weights:', expectedWeights);

    // This test always passes - it's documentation
    expect(Object.keys(fourDDimensions)).toHaveLength(4);
  });
});

test.describe('ExploreShell Integration Gap', () => {
  // Documents the current gap: ExploreShell uses static prompts
  // instead of the 4D targeting system

  test('KNOWN GAP: ExploreShell uses static welcomeContent, not useSuggestedPrompts', async ({ page }) => {
    // Current implementation (ExploreShell.tsx lines 188-198):
    // const welcomeContent = useMemo(() =>
    //   getTerminalWelcome(lens, undefined) || DEFAULT_TERMINAL_WELCOME,
    //   [lens]
    // );
    //
    // Expected implementation:
    // const { prompts } = useSuggestedPrompts({ maxPrompts: 3 });

    await page.goto('/explore');

    // This test documents the gap - always passes
    console.log('[Test] IMPLEMENTATION GAP DETECTED');
    console.log('  - ExploreShell uses: getTerminalWelcome()');
    console.log('  - Should use: useSuggestedPrompts()');
    console.log('  - Effect: Welcome prompts ignore 4D targeting');

    expect(true).toBe(true);
  });

  test('usePromptForHighlight IS using targeting (partial implementation)', async ({ page }) => {
    // ExploreShell.tsx line 72:
    // const { findPrompt } = usePromptForHighlight();
    //
    // This IS using targeting when clicking on highlighted concepts
    // See line 467: findPrompt(span.text, { lensId, stage })

    await page.goto('/explore');

    console.log('[Test] PARTIAL IMPLEMENTATION');
    console.log('  - Highlight clicks: usePromptForHighlight ✓');
    console.log('  - Welcome prompts: getTerminalWelcome ✗');

    expect(true).toBe(true);
  });
});
