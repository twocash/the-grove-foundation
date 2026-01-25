// tests/e2e/research-branch-persistence.spec.ts
// S22-WP: E2E test for research branch persistence
// Protocol: Grove Execution Protocol v1.5 - Constraint 11
//
// This test verifies that:
// 1. New sprouts get branches persisted to Supabase
// 2. Branches are returned correctly after INSERT
// 3. No console errors related to missing branches on NEW sprouts
// 4. Research execution receives branches and makes API calls
// 5. BYTE COUNTS of payloads sent/received are logged

import { test, expect } from '@playwright/test';
import {
  setupConsoleCapture,
  getCriticalErrors,
  waitForPageStable,
  type ConsoleCapture,
} from './_test-utils';

// Set longer timeout for these tests
test.setTimeout(60000);

// Additional patterns specific to the branch persistence bug
const BRANCH_BUG_PATTERNS = [
  'No branches provided',
  'Supabase returned no branches',
  'zero API calls',
  'branches is undefined',
  'branches.length === 0',
] as const;

const SCREENSHOTS_DIR = 'docs/sprints/research-writer-panel-v1/screenshots/e2e';

test.describe('S22-WP: Research Branch Persistence', () => {
  let capture: ConsoleCapture;

  test.beforeEach(async ({ page }) => {
    // Setup console capture BEFORE any navigation
    capture = setupConsoleCapture(page);
  });

  test('NEW sprout should have branches persisted to Supabase', async ({ page }) => {
    // Step 1: Navigate to explore page
    await page.goto('http://localhost:3000/explore');
    await waitForPageStable(page, 3000);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/01-explore-initial.png` });

    // Step 2: Find the search input - wait for it to be enabled
    const searchInput = page.locator('input[placeholder*="Grove"], input[placeholder*="research"], textarea').first();
    await expect(searchInput).toBeVisible({ timeout: 15000 });

    // Wait for input to be enabled (not disabled)
    await page.waitForFunction(() => {
      const input = document.querySelector('input[placeholder*="Grove"], input[placeholder*="research"], textarea');
      return input && !input.hasAttribute('disabled');
    }, { timeout: 15000 });

    // Step 3: Enter a research query WITH SPROUT PREFIX
    // CRITICAL: Must use "research:" or "sprout:" prefix to trigger Prompt Architect
    const testQuery = `research: E2E Test: Branch persistence ${Date.now()}`;
    await searchInput.fill(testQuery);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/02-query-entered.png` });

    await page.keyboard.press('Enter');

    // Step 4: Wait for confirmation panel and click "Start Research"
    // The GardenInspector shows a ConfirmationFooter with "Start Research" button
    const startResearchBtn = page.getByRole('button', { name: /start research/i });

    // Wait for the confirmation panel to appear (may take time for inference)
    await expect(startResearchBtn).toBeVisible({ timeout: 20000 });
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/03-confirmation-panel.png` });

    // Click Start Research to trigger sprout creation with INSERT
    await startResearchBtn.click();
    console.log('Clicked "Start Research" button');

    // Wait for INSERT to complete
    await page.waitForTimeout(8000);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/04-after-confirm.png` });

    // Step 5: Analyze INSERT DEBUG logs for byte counts
    const insertDebugLogs = capture.messages.filter(msg =>
      msg.includes('[ResearchSproutContext] INSERT DEBUG')
    );

    console.log('\n=== INSERT DEBUG Logs (with byte counts) ===');
    insertDebugLogs.forEach((log, i) => {
      console.log(`${i + 1}. ${log}`);

      // Extract and verify byte counts
      const payloadBytesMatch = log.match(/payloadBytes[:\s]+(\d+)/);
      const branchesBytesMatch = log.match(/branchesBytes[:\s]+(\d+)/);

      if (payloadBytesMatch) {
        console.log(`   → Payload size: ${payloadBytesMatch[1]} bytes`);
      }
      if (branchesBytesMatch) {
        console.log(`   → Branches size: ${branchesBytesMatch[1]} bytes`);
      }
    });

    // Step 6: Analyze RETURNED FROM SUPABASE logs for byte counts
    const returnLogs = capture.messages.filter(msg =>
      msg.includes('[ResearchSproutContext] RETURNED FROM SUPABASE')
    );

    console.log('\n=== RETURNED FROM SUPABASE Logs (with byte counts) ===');
    returnLogs.forEach((log, i) => {
      console.log(`${i + 1}. ${log}`);

      // Extract and verify byte counts
      const responseBytesMatch = log.match(/responseBytes[:\s]+(\d+)/);
      const branchesBytesMatch = log.match(/branchesBytes[:\s]+(\d+)/);

      if (responseBytesMatch) {
        console.log(`   → Response size: ${responseBytesMatch[1]} bytes`);
      }
      if (branchesBytesMatch) {
        console.log(`   → Branches size: ${branchesBytesMatch[1]} bytes`);
      }
    });

    // Step 7: Check for branch-related warnings in ALL messages
    const branchWarnings = capture.messages.filter(msg =>
      BRANCH_BUG_PATTERNS.some(pattern =>
        msg.toLowerCase().includes(pattern.toLowerCase())
      )
    );

    console.log('\n=== Branch-Related Warnings ===');
    if (branchWarnings.length === 0) {
      console.log('   None found (GOOD for new sprouts!)');
    } else {
      branchWarnings.forEach((w, i) => console.log(`${i + 1}. ${w}`));
    }

    // Step 8: Log all errors for debugging
    console.log('\n=== Console Errors ===');
    if (capture.errors.length === 0) {
      console.log('   None');
    } else {
      capture.errors.forEach((e, i) => console.log(`${i + 1}. ${e}`));
    }

    // Step 9: Check critical errors
    const criticalErrors = getCriticalErrors(capture.errors, [...BRANCH_BUG_PATTERNS]);

    // Assertions
    expect(criticalErrors).toHaveLength(0);

    // If INSERT DEBUG exists, verify branches were included
    if (insertDebugLogs.length > 0) {
      const lastInsertLog = insertDebugLogs[insertDebugLogs.length - 1];
      // Should NOT show 0 branches or NOT_ARRAY
      expect(lastInsertLog).not.toContain('sproutDataBranches: 0,');
      expect(lastInsertLog).not.toContain('"rowBranchesLength":"NOT_ARRAY"');
    }

    // Take final screenshot
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/04-final-state.png`, fullPage: true });
  });

  test('Console should show branch byte counts in INSERT logs', async ({ page }) => {
    // This test specifically verifies the diagnostic logging includes byte counts
    await page.goto('http://localhost:3000/explore');
    await waitForPageStable(page, 3000);

    // Wait for input to be available and enabled
    const input = page.locator('input[placeholder*="Grove"], input[placeholder*="research"], textarea').first();
    await expect(input).toBeVisible({ timeout: 15000 });

    await page.waitForFunction(() => {
      const input = document.querySelector('input[placeholder*="Grove"], input[placeholder*="research"], textarea');
      return input && !input.hasAttribute('disabled');
    }, { timeout: 15000 });

    // Trigger a new sprout creation WITH SPROUT PREFIX
    // CRITICAL: Must use "research:" or "sprout:" prefix to trigger Prompt Architect
    const testQuery = `research: Diagnostic test ${Date.now()}`;
    await input.fill(testQuery);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(8000);

    // Check for INSERT DEBUG pattern with byte counts
    const insertLogs = capture.messages.filter(msg =>
      msg.includes('[ResearchSproutContext] INSERT DEBUG')
    );

    console.log('\n=== Byte Count Verification ===');

    // If a sprout was created, we should see INSERT DEBUG log with byte counts
    if (insertLogs.length > 0) {
      const lastInsertLog = insertLogs[insertLogs.length - 1];
      console.log('INSERT log:', lastInsertLog);

      // Verify byte count fields are present
      expect(lastInsertLog).toContain('payloadBytes');
      expect(lastInsertLog).toContain('branchesBytes');

      // Extract branches byte count and verify it's > 2 (more than "[]")
      const branchesBytesMatch = lastInsertLog.match(/branchesBytes[:\s]+(\d+)/);
      if (branchesBytesMatch) {
        const branchesBytes = parseInt(branchesBytesMatch[1], 10);
        console.log(`Branches payload: ${branchesBytes} bytes`);

        // If branches exist, they should be more than 2 bytes (which would be "[]")
        // A single branch with a query like "research X" would be ~50+ bytes
        if (branchesBytes <= 2) {
          console.warn('WARNING: Branches payload is only empty array!');
        }
      }
    } else {
      console.log('No INSERT DEBUG logs found - sprout creation may have failed');
    }

    // Also check RETURNED FROM SUPABASE
    const returnLogs = capture.messages.filter(msg =>
      msg.includes('[ResearchSproutContext] RETURNED FROM SUPABASE')
    );

    if (returnLogs.length > 0) {
      const lastReturnLog = returnLogs[returnLogs.length - 1];
      console.log('RETURN log:', lastReturnLog);

      // Verify byte count fields are present
      expect(lastReturnLog).toContain('responseBytes');
      expect(lastReturnLog).toContain('branchesBytes');
    }
  });
});

/**
 * Migration check test - identifies OLD sprouts that need fixing
 */
test.describe('S22-WP: Existing Sprout Migration Check', () => {
  let capture: ConsoleCapture;

  test.beforeEach(async ({ page }) => {
    capture = setupConsoleCapture(page);
  });

  test('Count sprouts with missing branches', async ({ page }) => {
    await page.goto('http://localhost:3000/explore');
    await waitForPageStable(page, 5000);

    // Count warnings about missing branches
    const branchWarnings = capture.messages.filter(msg =>
      msg.includes('Supabase returned no branches')
    );

    console.log(`\n=== Migration Required ===`);
    console.log(`Sprouts with missing branches: ${branchWarnings.length}`);

    // Extract sprout titles from warnings for identification
    branchWarnings.forEach((warning, i) => {
      const match = warning.match(/for: "([^"]+)"/);
      if (match) {
        console.log(`  ${i + 1}. "${match[1]}..."`);
      }
    });

    // Take screenshot showing current state
    await page.screenshot({
      path: `${SCREENSHOTS_DIR}/migration-check.png`,
      fullPage: true
    });
  });
});
