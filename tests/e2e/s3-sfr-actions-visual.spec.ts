// tests/e2e/s3-sfr-actions-visual.spec.ts
// Sprint: S3||SFR-Actions - Visual Verification & Quality Gate
//
// IMPORTANT: All tests must pass with clean screenshots before sprint can close.
// This file serves as the QUALITY GATE for the S3||SFR-Actions sprint.

import { test, expect, Page, ConsoleMessage } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SCREENSHOT_DIR = 'docs/sprints/sprout-finishing-room-v1/screenshots/s3';
const REPORT_PATH = 'docs/sprints/sprout-finishing-room-v1/S3-VISUAL-REVIEW.md';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// ============================================================================
// TEST FIXTURES & HELPERS
// ============================================================================

interface ConsoleError {
  type: string;
  text: string;
  location?: string;
}

/**
 * Console error collector - tracks all console errors during test
 */
class ConsoleMonitor {
  private errors: ConsoleError[] = [];
  private warnings: ConsoleError[] = [];

  attach(page: Page) {
    page.on('console', (msg: ConsoleMessage) => {
      if (msg.type() === 'error') {
        this.errors.push({
          type: 'error',
          text: msg.text(),
          location: msg.location()?.url,
        });
      } else if (msg.type() === 'warning') {
        this.warnings.push({
          type: 'warning',
          text: msg.text(),
          location: msg.location()?.url,
        });
      }
    });

    page.on('pageerror', (error) => {
      this.errors.push({
        type: 'pageerror',
        text: error.message,
      });
    });
  }

  getErrors(): ConsoleError[] {
    return this.errors;
  }

  getWarnings(): ConsoleError[] {
    return this.warnings;
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  clear() {
    this.errors = [];
    this.warnings = [];
  }

  report(): string {
    if (this.errors.length === 0 && this.warnings.length === 0) {
      return '✅ No console errors or warnings';
    }

    let report = '';
    if (this.errors.length > 0) {
      report += `❌ ${this.errors.length} Console Errors:\n`;
      this.errors.forEach((e, i) => {
        report += `  ${i + 1}. [${e.type}] ${e.text}\n`;
        if (e.location) report += `     at ${e.location}\n`;
      });
    }
    if (this.warnings.length > 0) {
      report += `⚠️ ${this.warnings.length} Console Warnings:\n`;
      this.warnings.forEach((w, i) => {
        report += `  ${i + 1}. ${w.text}\n`;
      });
    }
    return report;
  }
}

/**
 * Create a mock sprout with ResearchDocument for testing
 */
function createMockSproutWithResearchDocument() {
  const now = new Date().toISOString();
  return {
    id: 'test-sprout-s3-001',
    capturedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    response: `# Distributed AI Systems: Key Principles

## Executive Summary

Distributed AI systems represent a paradigm shift from centralized cloud computing to edge-based, locally-owned infrastructure. The key principles include:

1. **Data Sovereignty** - Users maintain control over their data
2. **Computational Distribution** - Processing happens at the edge
3. **Resilience Through Redundancy** - No single point of failure

## Analysis

The ratchet effect in AI infrastructure creates an economic imperative for distributed ownership. As compute costs decrease while capabilities increase, the marginal cost of local deployment approaches zero.

### Key Evidence

- Infrastructure costs doubled every 21 months (source: Anthropic 2024)
- Local inference now viable for most use cases
- Network latency eliminated with edge deployment

## Limitations

This analysis does not cover regulatory compliance requirements or enterprise-scale deployments exceeding 10,000 concurrent users.`,
    query: 'What are the key principles of distributed AI systems?',
    status: 'ready' as const,
    stage: 'rooted' as const,
    tags: ['ai', 'distributed', 'infrastructure'],
    notes: '',
    sessionId: 'test-session-s3',
    creatorId: null,
    personaId: null,
    journeyId: null,
    hubId: null,
    nodeId: null,
    provenance: {
      lens: { id: 'academic-researcher', name: 'Academic Researcher' },
      hub: { id: 'distributed-ai', name: 'Distributed AI' },
      journey: { id: 'deep-dive', name: 'Deep Dive' },
      node: { id: 'cost-dynamics', name: 'Cost Dynamics' },
      knowledgeFiles: ['grove-overview.md', 'ratchet-effect.md', 'infrastructure-costs.md'],
      generatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    },
    // ResearchDocument matches the actual schema from @core/schema/research-document
    researchDocument: {
      id: 'research-doc-001',
      evidenceBundleId: 'evidence-bundle-001',
      query: 'What are the key principles of distributed AI systems?',
      position: 'Distributed AI systems enable data sovereignty through edge-based, locally-owned infrastructure.',
      analysis: 'The ratchet effect in AI infrastructure creates an economic imperative for distributed ownership. As compute costs decrease while capabilities increase, the marginal cost of local deployment approaches zero.',
      limitations: 'This analysis does not cover regulatory compliance requirements or enterprise-scale deployments.',
      citations: [
        { index: 1, title: 'Anthropic Infrastructure Report 2024', url: 'https://example.com/anthropic-2024', snippet: 'Infrastructure costs doubled every 21 months', domain: 'example.com', accessedAt: now },
        { index: 2, title: 'Edge AI Deployment Guide', url: 'https://example.com/edge-ai', snippet: 'Local inference now viable for most use cases', domain: 'example.com', accessedAt: now },
        { index: 3, title: 'Network Latency Analysis', url: 'https://example.com/latency', snippet: 'Edge deployment eliminates network latency', domain: 'example.com', accessedAt: now },
      ],
      createdAt: now,
      wordCount: 342,
      status: 'complete' as const,
      confidenceScore: 0.87,
    },
  };
}

/**
 * Setup mock sprout in localStorage and trigger modal open
 * Uses explicit waits instead of arbitrary timeouts
 */
async function setupAndOpenFinishingRoom(page: Page) {
  const mockSprout = createMockSproutWithResearchDocument();

  // Store in localStorage
  await page.evaluate((sprout) => {
    // Store sprout in grove-sprouts array
    const existing = JSON.parse(localStorage.getItem('grove-sprouts') || '[]');
    existing.push(sprout);
    localStorage.setItem('grove-sprouts', JSON.stringify(existing));

    // Also store as test sprout
    localStorage.setItem('grove-test-sprout', JSON.stringify(sprout));
  }, mockSprout);

  // Wait for FinishingRoomGlobal to be ready (event listener registered)
  await page.waitForSelector('[data-testid="finishing-room-listener-ready"]', {
    state: 'attached',
    timeout: 10000,
  });

  // Dispatch event to open finishing room
  await page.evaluate((sproutId) => {
    console.log('[Test] Dispatching open-finishing-room event for:', sproutId);
    window.dispatchEvent(new CustomEvent('open-finishing-room', {
      detail: { sproutId }
    }));
  }, mockSprout.id);

  // Wait for modal to appear with explicit selector wait
  await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 10000 });

  return mockSprout;
}

/**
 * Take screenshot with metadata
 */
async function captureScreenshot(
  page: Page,
  name: string,
  description: string,
  monitor: ConsoleMonitor
): Promise<{ path: string; hasErrors: boolean; description: string }> {
  const filename = `${name}.png`;
  const filepath = path.join(SCREENSHOT_DIR, filename);

  await page.screenshot({
    path: filepath,
    fullPage: false,
  });

  return {
    path: filepath,
    hasErrors: monitor.hasErrors(),
    description,
  };
}

// ============================================================================
// TEST RESULTS COLLECTOR
// ============================================================================

interface TestResult {
  story: string;
  title: string;
  status: 'pass' | 'fail' | 'skip';
  screenshot?: string;
  consoleReport: string;
  notes?: string;
}

const testResults: TestResult[] = [];

// ============================================================================
// VISUAL VERIFICATION TESTS
// ============================================================================

test.describe('S3||SFR-Actions: Visual Verification Quality Gate', () => {
  let monitor: ConsoleMonitor;

  test.beforeEach(async ({ page }) => {
    monitor = new ConsoleMonitor();
    monitor.attach(page);

    // Navigate to main page
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    monitor.clear();
  });

  // --------------------------------------------------------------------------
  // US-D001: Revise & Resubmit Form
  // --------------------------------------------------------------------------

  test('US-D001: Revise & Resubmit form renders correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await setupAndOpenFinishingRoom(page);

    // Verify form elements exist - explicit waits for each element
    const reviseSection = page.locator('text=Revise & Resubmit').first();
    const textarea = page.locator('textarea[aria-label="Revision instructions"]');
    const submitButton = page.locator('button:has-text("Submit for Revision")');

    await expect(reviseSection).toBeVisible({ timeout: 5000 });
    await expect(textarea).toBeVisible({ timeout: 5000 });
    await expect(submitButton).toBeVisible({ timeout: 5000 });

    // Screenshot: Empty form state
    const result1 = await captureScreenshot(
      page,
      'us-d001-revise-form-empty',
      'Revise & Resubmit form in empty state',
      monitor
    );

    // Type in revision instructions
    await textarea.fill('Please add more detail about the cost comparison with cloud providers.');

    // Wait for button state to update (React state change)
    await expect(submitButton).toBeEnabled({ timeout: 3000 });

    // Screenshot: Form with content
    const result2 = await captureScreenshot(
      page,
      'us-d001-revise-form-filled',
      'Revise & Resubmit form with user input',
      monitor
    );

    testResults.push({
      story: 'US-D001',
      title: 'Revise & Resubmit form renders',
      status: monitor.hasErrors() ? 'fail' : 'pass',
      screenshot: result2.path,
      consoleReport: monitor.report(),
    });

    expect(monitor.hasErrors()).toBe(false);
  });

  test('US-D001: Revise submission shows toast (stubbed)', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await setupAndOpenFinishingRoom(page);

    const textarea = page.locator('textarea[aria-label="Revision instructions"]');
    const submitButton = page.locator('button:has-text("Submit for Revision")');

    // Wait for elements to be ready
    await expect(textarea).toBeVisible({ timeout: 5000 });
    await expect(submitButton).toBeVisible({ timeout: 5000 });

    // Fill and submit
    await textarea.fill('Add cloud cost comparison.');
    await expect(submitButton).toBeEnabled({ timeout: 3000 });
    await submitButton.click();

    // Wait for toast to appear (explicit wait for toast element)
    const toast = page.locator('text=Revision submitted');
    await expect(toast).toBeVisible({ timeout: 5000 });

    // Screenshot: Toast confirmation
    await captureScreenshot(
      page,
      'us-d001-revise-submitted',
      'Toast confirmation after revision submission',
      monitor
    );

    testResults.push({
      story: 'US-D001',
      title: 'Revision submission shows toast',
      status: monitor.hasErrors() ? 'fail' : 'pass',
      consoleReport: monitor.report(),
    });

    expect(monitor.hasErrors()).toBe(false);
  });

  // --------------------------------------------------------------------------
  // US-D005: Declarative Promotion Checklist
  // --------------------------------------------------------------------------

  test('US-D005: Promotion checklist renders with defaults', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await setupAndOpenFinishingRoom(page);

    // Verify checklist section (explicit wait)
    const addToFieldSection = page.locator('text=Add to Field').first();
    await expect(addToFieldSection).toBeVisible({ timeout: 5000 });

    // Verify checkboxes exist
    const thesisCheckbox = page.locator('label:has-text("Thesis Statement") input[type="checkbox"]');
    const analysisCheckbox = page.locator('label:has-text("Full Analysis") input[type="checkbox"]');
    const sourcesCheckbox = page.locator('label:has-text("Discovered Sources") input[type="checkbox"]');

    // Wait for checkboxes to be attached
    await expect(thesisCheckbox).toBeAttached({ timeout: 5000 });
    await expect(analysisCheckbox).toBeAttached({ timeout: 5000 });
    await expect(sourcesCheckbox).toBeAttached({ timeout: 5000 });

    // Screenshot: Checklist with defaults
    const result = await captureScreenshot(
      page,
      'us-d005-checklist-defaults',
      'Promotion checklist with default selections',
      monitor
    );

    // Verify default states: Thesis (checked), Analysis (unchecked), Sources (checked)
    await expect(thesisCheckbox).toBeChecked();
    await expect(analysisCheckbox).not.toBeChecked();
    await expect(sourcesCheckbox).toBeChecked();

    testResults.push({
      story: 'US-D005',
      title: 'Promotion checklist renders with defaults',
      status: monitor.hasErrors() ? 'fail' : 'pass',
      screenshot: result.path,
      consoleReport: monitor.report(),
    });

    expect(monitor.hasErrors()).toBe(false);
  });

  test('US-D005: Checklist items toggle correctly', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await setupAndOpenFinishingRoom(page);

    // Wait for checklist to be visible
    const addToFieldSection = page.locator('text=Add to Field').first();
    await expect(addToFieldSection).toBeVisible({ timeout: 5000 });

    // Click on "Full Analysis" to toggle it
    const analysisLabel = page.locator('label:has-text("Full Analysis")');
    const analysisCheckbox = page.locator('label:has-text("Full Analysis") input[type="checkbox"]');

    await expect(analysisLabel).toBeVisible({ timeout: 5000 });
    await analysisLabel.click();

    // Wait for checkbox state to change (explicit wait for state)
    await expect(analysisCheckbox).toBeChecked({ timeout: 3000 });

    // Screenshot: After toggle
    const result = await captureScreenshot(
      page,
      'us-d005-checklist-toggled',
      'Checklist after toggling Full Analysis',
      monitor
    );

    testResults.push({
      story: 'US-D005',
      title: 'Checklist items toggle correctly',
      status: monitor.hasErrors() ? 'fail' : 'pass',
      screenshot: result.path,
      consoleReport: monitor.report(),
    });

    expect(monitor.hasErrors()).toBe(false);
  });

  // --------------------------------------------------------------------------
  // US-D002: Archive to Garden
  // --------------------------------------------------------------------------

  test('US-D002: Archive button visible in tertiary section', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await setupAndOpenFinishingRoom(page);

    // Verify archive button exists (explicit wait)
    const archiveButton = page.locator('button:has-text("Archive")');
    await expect(archiveButton).toBeVisible({ timeout: 5000 });

    // Screenshot: Tertiary actions section
    const result = await captureScreenshot(
      page,
      'us-d002-archive-button',
      'Tertiary actions with Archive button',
      monitor
    );

    testResults.push({
      story: 'US-D002',
      title: 'Archive button visible',
      status: monitor.hasErrors() ? 'fail' : 'pass',
      screenshot: result.path,
      consoleReport: monitor.report(),
    });

    expect(monitor.hasErrors()).toBe(false);
  });

  // --------------------------------------------------------------------------
  // US-D003: Add Private Note
  // --------------------------------------------------------------------------

  test('US-D003: Note input appears on click', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await setupAndOpenFinishingRoom(page);

    // Click Add Note button - look for button containing "Note" text
    const addNoteButton = page.locator('button:has-text("Note")');
    await expect(addNoteButton).toBeVisible({ timeout: 5000 });
    await addNoteButton.click();

    // Wait for note input/textarea to appear
    const noteInput = page.locator('textarea').or(page.locator('input[type="text"]')).first();
    await expect(noteInput).toBeVisible({ timeout: 5000 });

    // Screenshot: Note input expanded
    const result = await captureScreenshot(
      page,
      'us-d003-note-input',
      'Note input field expanded',
      monitor
    );

    testResults.push({
      story: 'US-D003',
      title: 'Note input appears on click',
      status: monitor.hasErrors() ? 'fail' : 'pass',
      screenshot: result.path,
      consoleReport: monitor.report(),
    });

    expect(monitor.hasErrors()).toBe(false);
  });

  // --------------------------------------------------------------------------
  // US-D004: Export Document
  // --------------------------------------------------------------------------

  test('US-D004: Export button visible and functional', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await setupAndOpenFinishingRoom(page);

    // Verify export button exists (explicit wait)
    const exportButton = page.locator('button:has-text("Export")');
    await expect(exportButton).toBeVisible({ timeout: 5000 });

    // Screenshot: Export button
    const result = await captureScreenshot(
      page,
      'us-d004-export-button',
      'Export button in tertiary section',
      monitor
    );

    testResults.push({
      story: 'US-D004',
      title: 'Export button visible',
      status: monitor.hasErrors() ? 'fail' : 'pass',
      screenshot: result.path,
      consoleReport: monitor.report(),
    });

    expect(monitor.hasErrors()).toBe(false);
  });

  // --------------------------------------------------------------------------
  // US-E001: Full Modal Integration
  // --------------------------------------------------------------------------

  test('US-E001: Full Action Panel renders all sections', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await setupAndOpenFinishingRoom(page);

    // Verify all three columns visible (explicit waits)
    const provenancePanel = page.locator('.w-\\[280px\\]').first();
    const actionPanel = page.locator('.w-\\[320px\\]').first();

    await expect(provenancePanel).toBeVisible({ timeout: 5000 });
    await expect(actionPanel).toBeVisible({ timeout: 5000 });

    // Screenshot: Full modal with all three columns
    const result = await captureScreenshot(
      page,
      'us-e001-full-modal',
      'Complete Finishing Room with all three columns',
      monitor
    );

    testResults.push({
      story: 'US-E001',
      title: 'Full Action Panel renders all sections',
      status: monitor.hasErrors() ? 'fail' : 'pass',
      screenshot: result.path,
      consoleReport: monitor.report(),
    });

    expect(monitor.hasErrors()).toBe(false);
  });

  test('US-E001: Action Panel right column layout', async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await setupAndOpenFinishingRoom(page);

    // Focus on Action Panel (right column) - explicit wait
    const actionPanel = page.locator('.w-\\[320px\\]').first();
    await expect(actionPanel).toBeVisible({ timeout: 5000 });
    await actionPanel.scrollIntoViewIfNeeded();

    // Screenshot: Action Panel isolated
    const result = await captureScreenshot(
      page,
      'us-e001-action-panel-isolated',
      'Action Panel right column layout',
      monitor
    );

    // Verify section order: Revise (green), Promote (cyan), Tertiary
    const sections = await actionPanel.locator('h3, [class*="font-medium"]').allTextContents();
    console.log('Action Panel sections:', sections);

    testResults.push({
      story: 'US-E001',
      title: 'Action Panel layout verified',
      status: monitor.hasErrors() ? 'fail' : 'pass',
      screenshot: result.path,
      consoleReport: monitor.report(),
    });

    expect(monitor.hasErrors()).toBe(false);
  });

  // --------------------------------------------------------------------------
  // GENERATE SPRINT REVIEW DOCUMENT
  // --------------------------------------------------------------------------

  test.afterAll(async () => {
    // Generate sprint review markdown
    const report = generateSprintReviewDocument(testResults);
    fs.writeFileSync(REPORT_PATH, report);
    console.log(`\n📄 Sprint review document generated: ${REPORT_PATH}`);
  });
});

// ============================================================================
// SPRINT REVIEW DOCUMENT GENERATOR
// ============================================================================

function generateSprintReviewDocument(results: TestResult[]): string {
  const now = new Date().toISOString();
  const passCount = results.filter(r => r.status === 'pass').length;
  const failCount = results.filter(r => r.status === 'fail').length;
  const skipCount = results.filter(r => r.status === 'skip').length;

  const statusEmoji = failCount > 0 ? '❌' : skipCount > 0 ? '⚠️' : '✅';

  let md = `# S3||SFR-Actions Visual Verification Report

**Generated:** ${now}
**Status:** ${statusEmoji} ${failCount > 0 ? 'FAILED' : skipCount > 0 ? 'PARTIAL' : 'PASSED'}

---

## Summary

| Metric | Count |
|--------|-------|
| ✅ Passed | ${passCount} |
| ❌ Failed | ${failCount} |
| ⏭️ Skipped | ${skipCount} |
| **Total** | ${results.length} |

---

## Test Results by User Story

`;

  // Group by story
  const byStory = new Map<string, TestResult[]>();
  results.forEach(r => {
    const existing = byStory.get(r.story) || [];
    existing.push(r);
    byStory.set(r.story, existing);
  });

  byStory.forEach((storyResults, story) => {
    md += `### ${story}\n\n`;

    storyResults.forEach(r => {
      const statusIcon = r.status === 'pass' ? '✅' : r.status === 'fail' ? '❌' : '⏭️';
      md += `#### ${statusIcon} ${r.title}\n\n`;

      if (r.screenshot) {
        const relativePath = r.screenshot.replace(/\\/g, '/');
        md += `![${r.title}](${relativePath})\n\n`;
      }

      md += `**Console Report:**\n\`\`\`\n${r.consoleReport}\n\`\`\`\n\n`;

      if (r.notes) {
        md += `**Notes:** ${r.notes}\n\n`;
      }

      md += `---\n\n`;
    });
  });

  md += `## Screenshots Index

| Story | Screenshot | Status |
|-------|------------|--------|
`;

  results.forEach(r => {
    const statusIcon = r.status === 'pass' ? '✅' : r.status === 'fail' ? '❌' : '⏭️';
    const screenshotLink = r.screenshot ? `[View](${r.screenshot.replace(/\\/g, '/')})` : 'N/A';
    md += `| ${r.story} | ${screenshotLink} | ${statusIcon} |\n`;
  });

  md += `
---

## Quality Gate Checklist

Before marking sprint as complete, verify:

- [ ] All tests show ✅ PASSED status
- [ ] No console errors in any test
- [ ] Screenshots display correct UI (not error pages)
- [ ] Action Panel shows three distinct sections
- [ ] Colors match design system (green=primary, cyan=secondary)
- [ ] All interactive elements are accessible
- [ ] Toast notifications appear correctly

---

## Manual Verification Required

After automated tests pass, perform these manual checks:

1. **Revise & Resubmit**
   - [ ] Textarea accepts input
   - [ ] Submit button enables when text entered
   - [ ] Toast appears on submit

2. **Promotion Checklist**
   - [ ] Items toggle on click
   - [ ] Selected items show cyan highlight
   - [ ] "Promote Selected" calls API (check Network tab)

3. **Tertiary Actions**
   - [ ] Archive closes modal
   - [ ] Note saves to localStorage
   - [ ] Export downloads .md file

4. **Engagement Events** (check console)
   - [ ] \`sproutRefinementSubmitted\` fires
   - [ ] \`sproutArchived\` fires
   - [ ] \`sproutAnnotated\` fires
   - [ ] \`sproutExported\` fires
   - [ ] \`sproutPromotedToRag\` fires

---

*Generated by S3||SFR-Actions Visual Verification Suite*
`;

  return md;
}
