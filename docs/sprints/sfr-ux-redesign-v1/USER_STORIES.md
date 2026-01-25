# User Stories, Acceptance Criteria & E2E Tests v2.0 Review

**Sprint:** S23-SFR - Sprout Finishing Room UX Redesign
**Codename:** sfr-ux-redesign-v1
**Phase:** Story Extraction + Acceptance Criteria + E2E Test Specs
**Status:** Ready for User Review

---

## Critical Observations

### 1. Phase 2 is "One-Way Commitment"

The spec states "One-way commitment - no undo button" for Phase 2. This means once the user clicks "Generate Artifact," there's no going back to Phase 1. The only failure recovery is error toast returning to Phase 1.

**Recommendation:** Ensure the "Generate Artifact" button has clear affordance that this is a commitment action. Consider confirmation for first-time users (feature flag controlled).

### 2. Dependencies Must Complete First

The spec depends on:
- **S21-RL**: ✅ Complete (research API returns prose)
- **S22-WP**: 🚧 In Progress (writer panel piping)

**Recommendation:** S22-WP must merge before S23-SFR begins implementation.

### 3. promptSnapshot is Critical but Novel

The `promptSnapshot` field captures the exact merged systemPrompt at generation time. This is a new concept not currently in the codebase and needs careful implementation.

**Recommendation:** Add promptSnapshot to Artifact schema before sprint starts.

---

## Proposed v1.0 Simplifications

| Spec Feature | v1.0 Approach | Rationale |
|--------------|---------------|-----------|
| Edit history | Defer | Single-edit tracking sufficient for MVP |
| Export to PDF/Notion | Defer to v1.1 | Markdown copy is sufficient for v1.0 |
| Collaboration | Defer | Single-user only for MVP |
| Version limit | Defer | No cap needed initially |

---

## Epic 1: Core Layout System

### US-SFR001: Phase 1 Three-Column Layout

**As a** user opening a fresh sprout
**I want to** see a three-column layout (20% / 55% / 25%)
**So that** I can review research, read content, and select output style simultaneously

**INVEST Assessment:**
- **I**ndependent: Yes - foundational layout, no dependencies
- **N**egotiable: Yes - proportions are configurable
- **V**aluable: Yes - core user experience
- **E**stimable: Yes - 4-6 hours
- **S**mall: Yes - single layout concern
- **T**estable: Yes - measurable column widths

**Acceptance Criteria:**

```gherkin
Scenario: Fresh sprout displays Phase 1 layout
  Given I have a sprout with zero artifacts
  When I open the Sprout Finishing Room modal
  Then I should see a three-column grid
  And the left column should be approximately 20% width
  And the center column should be approximately 55% width
  And the right column should be approximately 25% width
```

**E2E Test Specification:**

```typescript
test('US-SFR001: Phase 1 three-column layout', async ({ page }) => {
  // Seed a fresh sprout with research but no artifacts
  await page.addInitScript(() => {
    localStorage.setItem('grove-test-sprout', JSON.stringify({
      id: 'test-sprout-001',
      synthesis: 'Research content about NVIDIA Rubin platform...',
      evidence: [
        { url: 'https://nvidia.com/rubin', title: 'NVIDIA Rubin', domain: 'nvidia.com' },
        { url: 'https://techcrunch.com/rubin', title: 'Rubin Analysis', domain: 'techcrunch.com' },
      ],
      artifacts: [], // Empty = Phase 1
    }));
  });

  // Navigate to explore with sprout modal
  await page.goto('/explore?sprout=test-sprout-001');

  // Wait for modal to be fully visible
  await page.waitForSelector('[data-testid="sfr-modal"]');

  // Assert three columns visible
  await expect(page.locator('[data-testid="sfr-left-column"]')).toBeVisible();
  await expect(page.locator('[data-testid="sfr-center-column"]')).toBeVisible();
  await expect(page.locator('[data-testid="sfr-right-column"]')).toBeVisible();

  // Verify column proportions (within 5% tolerance)
  const container = page.locator('[data-testid="sfr-grid"]');
  const containerBox = await container.boundingBox();
  const leftBox = await page.locator('[data-testid="sfr-left-column"]').boundingBox();
  const centerBox = await page.locator('[data-testid="sfr-center-column"]').boundingBox();
  const rightBox = await page.locator('[data-testid="sfr-right-column"]').boundingBox();

  expect(leftBox.width / containerBox.width).toBeCloseTo(0.20, 1);
  expect(centerBox.width / containerBox.width).toBeCloseTo(0.55, 1);
  expect(rightBox.width / containerBox.width).toBeCloseTo(0.25, 1);

  // Visual Verification
  await expect(page).toHaveScreenshot('phase1-three-column-layout.png');
});
```

**Visual Verification Points:**

| State | Screenshot | Required Evidence |
|-------|------------|-------------------|
| Initial | `phase1-three-column-layout.png` | Three distinct columns visible. Left column shows source count badge (e.g., "12 sources"). Center column shows research prose with visible text. Right column shows at least 2 template cards (e.g., "Blog Post", "Vision Paper"). |

**Traceability:** Spec section "Phase 1: Review & Configure"

---

### US-SFR002: Phase 3 Rail + Editor Layout

**As a** user with existing artifacts
**I want to** see a focused editor with minimal sidebars
**So that** I can focus on writing without distraction

**INVEST Assessment:**
- **I**ndependent: Yes - separate from Phase 1 layout
- **N**egotiable: Yes - rail width configurable
- **V**aluable: Yes - core writing experience
- **E**stimable: Yes - 4-6 hours
- **S**mall: Yes - single layout concern
- **T**estable: Yes - measurable dimensions

**Acceptance Criteria:**

```gherkin
Scenario: Sprout with artifacts displays Phase 3 layout
  Given I have a sprout with one or more artifacts
  When I open the Sprout Finishing Room modal
  Then I should see a three-region layout
  And the left rail should be exactly 50px wide
  And the center editor should fill remaining space
  And the right rail should be exactly 50px wide

Scenario: Rails show collapsed state
  Given I am in Phase 3 layout
  When I look at the left rail
  Then I should see an icon with badge (source count)
  And I should see a rotated "SOURCES" label
  And the content should fit in 50px width
```

**E2E Test Specification:**

```typescript
test('US-SFR002: Phase 3 rail + editor layout', async ({ page }) => {
  // Seed a sprout WITH artifacts (triggers Phase 3)
  await page.addInitScript(() => {
    localStorage.setItem('grove-test-sprout', JSON.stringify({
      id: 'test-sprout-002',
      synthesis: 'Research content...',
      evidence: [
        { url: 'https://nvidia.com/rubin', title: 'NVIDIA Rubin', domain: 'nvidia.com' },
      ],
      artifacts: [{
        id: 'artifact-001',
        templateId: 'ot-seed-blog',
        content: '# Strategic Outlook\n\nThe Rubin platform represents...',
        version: 1,
        generatedAt: '2026-01-24T10:00:00Z',
      }],
    }));
  });

  await page.goto('/explore?sprout=test-sprout-002');
  await page.waitForSelector('[data-testid="sfr-modal"]');

  // Assert rail layout
  const leftRail = page.locator('[data-testid="sfr-left-rail"]');
  const rightRail = page.locator('[data-testid="sfr-right-rail"]');
  const editor = page.locator('[data-testid="sfr-editor-panel"]');

  await expect(leftRail).toBeVisible();
  await expect(rightRail).toBeVisible();
  await expect(editor).toBeVisible();

  // Verify rail widths
  const leftBox = await leftRail.boundingBox();
  const rightBox = await rightRail.boundingBox();
  expect(leftBox.width).toBe(50);
  expect(rightBox.width).toBe(50);

  // Verify rail content
  await expect(leftRail.locator('[data-testid="source-badge"]')).toContainText('1');
  await expect(leftRail.locator('[data-testid="rail-label"]')).toContainText('SOURCES');

  // Visual Verification
  await expect(page).toHaveScreenshot('phase3-rail-editor-layout.png');
});
```

**Visual Verification Points:**

| State | Screenshot | Required Evidence |
|-------|------------|-------------------|
| Initial | `phase3-rail-editor-layout.png` | Two 50px rails on edges (dark background). Left rail shows sprout icon + badge "1" + rotated "SOURCES" text. Center shows full-width editor with tab bar visible. Right rail shows config icon + rotated "STYLE" text. Editor contains article text (not empty, not loading). |

**Traceability:** Spec section "Phase 3: Production (Zen Mode)"

---

## Epic 2: Phase 1 - Reading Room

### US-SFR003: Trust Signals Display

**As a** user reviewing research
**I want to** see source quality indicators
**So that** I can assess the credibility of the research

**INVEST Assessment:**
- **I**ndependent: Yes - uses evidence[] data
- **N**egotiable: Yes - signal types can vary
- **V**aluable: Yes - builds user confidence
- **E**stimable: Yes - 2-4 hours
- **S**mall: Yes - single component
- **T**estable: Yes - specific data displayed

**Acceptance Criteria:**

```gherkin
Scenario: Trust signals show source count
  Given I have a sprout with 12 evidence sources
  When I view Phase 1 layout
  Then the left column should display "12 sources"

Scenario: Trust signals show domain diversity
  Given I have sources from nvidia.com, techcrunch.com, and wikipedia.org
  When I view Trust Signals
  Then I should see 3 unique domains listed

Scenario: Trust signals show recency
  Given I have sources with page_age data
  When I view Trust Signals
  Then I should see "3 weeks ago", "1 day ago" indicators
```

**E2E Test Specification:**

```typescript
test('US-SFR003: Trust signals show source metrics', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('grove-test-sprout', JSON.stringify({
      id: 'test-sprout-003',
      synthesis: 'Research about AI chips...',
      evidence: [
        { url: 'https://nvidia.com/rubin', title: 'NVIDIA Rubin', domain: 'nvidia.com', page_age: '1 day ago' },
        { url: 'https://techcrunch.com/ai', title: 'AI Analysis', domain: 'techcrunch.com', page_age: '3 weeks ago' },
        { url: 'https://wikipedia.org/rubin', title: 'Rubin Wiki', domain: 'wikipedia.org', page_age: null },
        { url: 'https://nvidia.com/specs', title: 'Rubin Specs', domain: 'nvidia.com', page_age: '2 days ago' },
      ],
      artifacts: [],
    }));
  });

  await page.goto('/explore?sprout=test-sprout-003');
  await page.waitForSelector('[data-testid="sfr-modal"]');

  const trustSignals = page.locator('[data-testid="trust-signals"]');

  // Verify source count
  await expect(trustSignals.locator('[data-testid="source-count"]')).toContainText('4');

  // Verify domain diversity (3 unique: nvidia.com, techcrunch.com, wikipedia.org)
  await expect(trustSignals.locator('[data-testid="domain-count"]')).toContainText('3');

  // Verify recency indicators visible
  await expect(trustSignals.locator('[data-testid="recency-list"]')).toContainText('1 day ago');
  await expect(trustSignals.locator('[data-testid="recency-list"]')).toContainText('3 weeks ago');

  // Visual Verification
  await expect(page).toHaveScreenshot('trust-signals-populated.png');
});
```

**Visual Verification Points:**

| State | Screenshot | Required Evidence |
|-------|------------|-------------------|
| Populated | `trust-signals-populated.png` | Left column shows: "4 sources" with icon, "3 domains" text, list of domains (nvidia.com, techcrunch.com, wikipedia.org), recency timeline showing "1 day ago", "2 days ago", "3 weeks ago" badges |

**Traceability:** Spec section "Goal 1: Can I Trust This Research?"

---

### US-SFR004: Research Content Display

**As a** user reviewing research
**I want to** read the full research prose
**So that** I can understand what Claude found

**INVEST Assessment:**
- **I**ndependent: Yes - uses synthesis field
- **N**egotiable: Yes - rendering options vary
- **V**aluable: Yes - core content display
- **E**stimable: Yes - 3-5 hours
- **S**mall: Yes - single rendering concern
- **T**estable: Yes - content visible and formatted

**Acceptance Criteria:**

```gherkin
Scenario: Research prose displays at optimal reading width
  Given I have a sprout with synthesis content
  When I view the center column in Phase 1
  Then the prose should be 65-75 characters per line
  And inline citations [1], [2] should be visible
  And markdown headers should be styled

Scenario: Long research is scrollable
  Given I have research content exceeding viewport height
  When I scroll the center column
  Then additional content should be revealed
  And the left and right columns should remain fixed
```

**E2E Test Specification:**

```typescript
test('US-SFR004: Research content displays with citations', async ({ page }) => {
  const longResearch = `
## Executive Summary

NVIDIA's Rubin platform represents a significant advancement in AI computing infrastructure [1]. The platform introduces six new chips designed for next-generation workloads [2].

## Key Findings

The Vera Rubin CPU architecture combines ARM-based processing with custom accelerators [3]. Industry analysts project availability in late 2026 [4].

### Performance Metrics

Early benchmarks suggest 10x improvement in inference throughput compared to Blackwell [5]. Power efficiency gains of 40% make edge deployment feasible [6].
  `;

  await page.addInitScript((research) => {
    localStorage.setItem('grove-test-sprout', JSON.stringify({
      id: 'test-sprout-004',
      synthesis: research,
      evidence: [
        { url: 'https://nvidia.com/1', title: 'Source 1' },
        { url: 'https://nvidia.com/2', title: 'Source 2' },
      ],
      artifacts: [],
    }));
  }, longResearch);

  await page.goto('/explore?sprout=test-sprout-004');
  await page.waitForSelector('[data-testid="sfr-modal"]');

  const researchContent = page.locator('[data-testid="research-content"]');

  // Verify prose is visible
  await expect(researchContent).toContainText('Executive Summary');
  await expect(researchContent).toContainText('NVIDIA');
  await expect(researchContent).toContainText('Rubin platform');

  // Verify citations are visible
  await expect(researchContent).toContainText('[1]');
  await expect(researchContent).toContainText('[2]');

  // Verify markdown headers are styled (h2 should have specific styling)
  const h2 = researchContent.locator('h2');
  await expect(h2.first()).toHaveCSS('font-weight', '700'); // bold

  // Visual Verification
  await expect(page).toHaveScreenshot('research-content-with-citations.png');
});
```

**Visual Verification Points:**

| State | Screenshot | Required Evidence |
|-------|------------|-------------------|
| Populated | `research-content-with-citations.png` | Center column shows formatted markdown with: "Executive Summary" as styled h2 header, visible body text mentioning "NVIDIA" and "Rubin", inline citations [1] [2] [3] visible in the text, "Key Findings" as another styled h2, readable prose at comfortable width (not edge-to-edge) |

**Traceability:** Spec section "Phase 1: Review & Configure" center column

---

### US-SFR005: Output Style Selector (Phase 1)

**As a** user preparing to generate
**I want to** choose an output style from a card grid
**So that** I can select the appropriate voice and format

**INVEST Assessment:**
- **I**ndependent: Yes - loads from template seeds
- **N**egotiable: Yes - card design flexible
- **V**aluable: Yes - key decision point
- **E**stimable: Yes - 4-6 hours
- **S**mall: Yes - single selection concern
- **T**estable: Yes - selection state changes

**Acceptance Criteria:**

```gherkin
Scenario: Template cards load from seed data
  Given output-templates.json contains 4 writer templates
  When I view the right column in Phase 1
  Then I should see 4 template cards
  And cards should show: "Blog Post", "Vision Paper", "Higher Ed Policy", "Engineering / Architecture"

Scenario: Single selection behavior
  Given no template is selected
  When I click "Vision Paper" card
  Then "Vision Paper" should be selected (highlighted)
  And other cards should be unselected

Scenario: Default template is pre-selected
  Given "Blog Post" is marked isDefault: true
  When I open Phase 1 for a fresh sprout
  Then "Blog Post" card should be pre-selected
```

**E2E Test Specification:**

```typescript
test('US-SFR005: Output style selector shows templates from seeds', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('grove-test-sprout', JSON.stringify({
      id: 'test-sprout-005',
      synthesis: 'Research content...',
      evidence: [{ url: 'https://example.com', title: 'Source' }],
      artifacts: [],
    }));
  });

  await page.goto('/explore?sprout=test-sprout-005');
  await page.waitForSelector('[data-testid="sfr-modal"]');

  const styleSelector = page.locator('[data-testid="output-style-selector"]');

  // Verify all 4 writer templates are visible
  await expect(styleSelector.locator('[data-testid="template-card"]')).toHaveCount(4);

  await expect(styleSelector).toContainText('Blog Post');
  await expect(styleSelector).toContainText('Vision Paper');
  await expect(styleSelector).toContainText('Higher Ed Policy');
  await expect(styleSelector).toContainText('Engineering / Architecture');

  // Verify default selection (Blog Post)
  const blogCard = styleSelector.locator('[data-testid="template-card-ot-seed-blog"]');
  await expect(blogCard).toHaveAttribute('data-selected', 'true');

  // Click Vision Paper and verify selection changes
  const visionCard = styleSelector.locator('[data-testid="template-card-ot-seed-vision"]');
  await visionCard.click();

  await expect(visionCard).toHaveAttribute('data-selected', 'true');
  await expect(blogCard).toHaveAttribute('data-selected', 'false');

  // Visual Verification - after selection change
  await expect(page).toHaveScreenshot('style-selector-vision-selected.png');
});
```

**Visual Verification Points:**

| State | Screenshot | Required Evidence |
|-------|------------|-------------------|
| Default | `style-selector-default.png` | Right column shows 4 stacked cards: Blog Post (highlighted/selected), Vision Paper, Higher Ed Policy, Engineering/Architecture. Each card shows title and brief description. Blog Post has visual selected state (border, background color, or checkmark). |
| After Selection | `style-selector-vision-selected.png` | "Vision Paper" card is now highlighted/selected. "Blog Post" is no longer selected. Selection change is visually obvious (different background or border). |

**Traceability:** Spec section "Goal 2: What Should This Become?"

---

### US-SFR006: Notes Textarea

**As a** user generating content
**I want to** add context notes
**So that** the AI includes my specific perspective or requirements

**INVEST Assessment:**
- **I**ndependent: Yes - standalone input
- **N**egotiable: Yes - placement flexible
- **V**aluable: Yes - personalization
- **E**stimable: Yes - 2-3 hours
- **S**mall: Yes - single input
- **T**estable: Yes - text entry works

**Acceptance Criteria:**

```gherkin
Scenario: Notes textarea is accessible
  Given I am in Phase 1 layout
  When I look at the right column
  Then I should see a textarea labeled "Additional Context" or similar
  And the textarea should be positioned below template cards (sticky footer)

Scenario: Notes are preserved
  Given I have entered notes "Focus on enterprise adoption"
  When I switch between templates
  Then my notes should still be present
```

**E2E Test Specification:**

```typescript
test('US-SFR006: Notes textarea captures user context', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('grove-test-sprout', JSON.stringify({
      id: 'test-sprout-006',
      synthesis: 'Research content...',
      evidence: [{ url: 'https://example.com', title: 'Source' }],
      artifacts: [],
    }));
  });

  await page.goto('/explore?sprout=test-sprout-006');
  await page.waitForSelector('[data-testid="sfr-modal"]');

  const notesTextarea = page.locator('[data-testid="notes-textarea"]');

  // Verify textarea exists and is empty
  await expect(notesTextarea).toBeVisible();
  await expect(notesTextarea).toHaveValue('');

  // Enter notes
  await notesTextarea.fill('Focus on enterprise adoption and ROI metrics. Target audience: CTOs.');

  // Verify text was captured
  await expect(notesTextarea).toHaveValue('Focus on enterprise adoption and ROI metrics. Target audience: CTOs.');

  // Switch template selection
  const visionCard = page.locator('[data-testid="template-card-ot-seed-vision"]');
  await visionCard.click();

  // Notes should still be present
  await expect(notesTextarea).toHaveValue('Focus on enterprise adoption and ROI metrics. Target audience: CTOs.');

  // Visual Verification
  await expect(page).toHaveScreenshot('notes-textarea-filled.png');
});
```

**Visual Verification Points:**

| State | Screenshot | Required Evidence |
|-------|------------|-------------------|
| Filled | `notes-textarea-filled.png` | Right column shows: 4 template cards above, "Vision Paper" selected (not Blog Post), textarea below cards showing "Focus on enterprise adoption and ROI metrics. Target audience: CTOs." fully visible, textarea has label like "Additional Context" or "Notes" |

**Traceability:** Spec section "OutputStyleSelector + NotesTextarea"

---

### US-SFR007: Generate Artifact Button

**As a** user ready to create
**I want to** click a clear "Generate" button
**So that** the AI transforms research into my chosen format

**INVEST Assessment:**
- **I**ndependent: Yes - triggers phase transition
- **N**egotiable: Yes - button text flexible
- **V**aluable: Yes - core action
- **E**stimable: Yes - 2-3 hours
- **S**mall: Yes - single button
- **T**estable: Yes - click triggers generation

**Acceptance Criteria:**

```gherkin
Scenario: Generate button is prominently displayed
  Given I am in Phase 1 with a template selected
  When I look at the modal footer
  Then I should see a "Generate Artifact" button (or similar)
  And the button should be visually prominent (primary color)

Scenario: Generate button requires template selection
  Given no template is selected
  When I look at the Generate button
  Then it should be disabled

Scenario: Clicking Generate starts transition
  Given I have selected "Vision Paper" template
  And I have entered notes
  When I click "Generate Artifact"
  Then Phase 2 animation should begin
  And a loading state should appear
```

**E2E Test Specification:**

```typescript
test('US-SFR007: Generate button triggers Phase 2 transition', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('grove-test-sprout', JSON.stringify({
      id: 'test-sprout-007',
      synthesis: 'Research about NVIDIA Rubin platform...',
      evidence: [{ url: 'https://nvidia.com', title: 'NVIDIA', domain: 'nvidia.com' }],
      artifacts: [],
    }));
  });

  // Mock the generation API
  await page.route('/api/research/write', async route => {
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        content: '# Vision for AI Infrastructure\n\nThe NVIDIA Rubin platform...',
        templateId: 'ot-seed-vision',
        promptSnapshot: 'Transform research into a forward-looking vision...',
      }),
    });
  });

  await page.goto('/explore?sprout=test-sprout-007');
  await page.waitForSelector('[data-testid="sfr-modal"]');

  const generateBtn = page.locator('[data-testid="generate-button"]');

  // Verify button is visible and enabled (default template selected)
  await expect(generateBtn).toBeVisible();
  await expect(generateBtn).toBeEnabled();
  await expect(generateBtn).toContainText(/Generate|Create/i);

  // Screenshot BEFORE clicking
  await expect(page).toHaveScreenshot('generate-button-ready.png');

  // Click generate
  await generateBtn.click();

  // Verify loading/transition state
  await expect(page.locator('[data-testid="phase-2-transition"]')).toBeVisible();

  // Wait for transition to complete
  await page.waitForSelector('[data-testid="sfr-editor-panel"]', { timeout: 5000 });

  // Verify we're now in Phase 3
  await expect(page.locator('[data-testid="sfr-left-rail"]')).toBeVisible();

  // Screenshot AFTER transition
  await expect(page).toHaveScreenshot('after-generate-phase3.png');
});
```

**Visual Verification Points:**

| State | Screenshot | Required Evidence |
|-------|------------|-------------------|
| Ready | `generate-button-ready.png` | Footer shows prominent "Generate Artifact" button in primary color (green or blue). Button is clearly clickable (not grayed out). Template is selected above (e.g., "Blog Post" highlighted). |
| After Transition | `after-generate-phase3.png` | Layout has changed to Phase 3: two 50px rails visible, center shows editor with content, tab bar shows "Blog Post V1" tab. No Phase 1 three-column layout visible. |

**Traceability:** Spec section "Phase 2: The Shift (The Commitment)"

---

## Epic 3: Phase Transition

### US-SFR008: Curtain Pull Animation

**As a** user generating content
**I want to** see a smooth transition animation
**So that** I understand I'm entering a focused writing mode

**INVEST Assessment:**
- **I**ndependent: Yes - animation layer
- **N**egotiable: Yes - timing/easing adjustable
- **V**aluable: Yes - UX polish
- **E**stimable: Yes - 4-6 hours
- **S**mall: Yes - animation system
- **T**estable: Yes - animation completes

**Acceptance Criteria:**

```gherkin
Scenario: Columns animate to rails
  Given I click "Generate Artifact"
  When Phase 2 begins
  Then left column (20%) should animate to 50px
  And right column (25%) should animate to 50px
  And center column should expand to fill space
  And animation should take approximately 400ms

Scenario: Animation respects reduced motion preference
  Given my system prefers reduced motion
  When Phase 2 begins
  Then transition should be instant (no animation)
```

**E2E Test Specification:**

```typescript
test('US-SFR008: Curtain pull animation executes smoothly', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('grove-test-sprout', JSON.stringify({
      id: 'test-sprout-008',
      synthesis: 'Research content...',
      evidence: [{ url: 'https://example.com', title: 'Source' }],
      artifacts: [],
    }));
  });

  await page.route('/api/research/write', async route => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        content: '# Generated Content\n\nThis is the artifact...',
        templateId: 'ot-seed-blog',
      }),
    });
  });

  await page.goto('/explore?sprout=test-sprout-008');
  await page.waitForSelector('[data-testid="sfr-modal"]');

  // Capture Phase 1 layout dimensions
  const gridBefore = await page.locator('[data-testid="sfr-grid"]').boundingBox();
  const leftBefore = await page.locator('[data-testid="sfr-left-column"]').boundingBox();

  // Click generate
  await page.locator('[data-testid="generate-button"]').click();

  // Wait for animation to be in progress (check for transition class)
  await expect(page.locator('[data-testid="sfr-grid"]')).toHaveClass(/transitioning|animating/);

  // Screenshot MID-ANIMATION (100ms into 400ms animation)
  await page.waitForTimeout(100);
  await expect(page).toHaveScreenshot('curtain-pull-mid-animation.png');

  // Wait for animation complete
  await page.waitForSelector('[data-testid="sfr-left-rail"]');

  // Verify final dimensions
  const leftRail = await page.locator('[data-testid="sfr-left-rail"]').boundingBox();
  expect(leftRail.width).toBe(50);

  // Screenshot POST-ANIMATION
  await expect(page).toHaveScreenshot('curtain-pull-complete.png');
});

test('US-SFR008: Reduced motion skips animation', async ({ page }) => {
  // Emulate reduced motion preference
  await page.emulateMedia({ reducedMotion: 'reduce' });

  await page.addInitScript(() => {
    localStorage.setItem('grove-test-sprout', JSON.stringify({
      id: 'test-sprout-008b',
      synthesis: 'Research content...',
      evidence: [{ url: 'https://example.com', title: 'Source' }],
      artifacts: [],
    }));
  });

  await page.route('/api/research/write', async route => {
    await route.fulfill({ status: 200, body: JSON.stringify({ content: '# Content' }) });
  });

  await page.goto('/explore?sprout=test-sprout-008b');
  await page.waitForSelector('[data-testid="sfr-modal"]');

  const startTime = Date.now();
  await page.locator('[data-testid="generate-button"]').click();
  await page.waitForSelector('[data-testid="sfr-left-rail"]');
  const endTime = Date.now();

  // Transition should be near-instant (< 100ms)
  expect(endTime - startTime).toBeLessThan(200);
});
```

**Visual Verification Points:**

| State | Screenshot | Required Evidence |
|-------|------------|-------------------|
| Mid-Animation | `curtain-pull-mid-animation.png` | Columns are in intermediate state: left column is between 20% and 50px, right column is between 25% and 50px, center is expanding. Visual "slide" effect visible. |
| Complete | `curtain-pull-complete.png` | Final Phase 3 layout: two thin 50px rails, full-width editor center, content visible in editor. No remnants of Phase 1 columns. |

**Traceability:** Spec section "Phase 2: The Shift" and "The 'Curtain Pull' Effect"

---

### US-SFR009: Phase State Machine

**As a** developer
**I want to** manage phases via state machine
**So that** transitions are predictable and errors are handled

**INVEST Assessment:**
- **I**ndependent: Yes - internal state logic
- **N**egotiable: Yes - implementation details
- **V**aluable: Yes - prevents bugs
- **E**stimable: Yes - 3-4 hours
- **S**mall: Yes - state machine
- **T**estable: Yes - state transitions

**Acceptance Criteria:**

```gherkin
Scenario: Fresh sprout starts in PHASE_1
  Given a sprout with zero artifacts
  When SFR modal opens
  Then internal state should be PHASE_1_REVIEW

Scenario: Existing artifacts start in PHASE_3
  Given a sprout with one or more artifacts
  When SFR modal opens
  Then internal state should be PHASE_3_PRODUCE

Scenario: Error during generation returns to PHASE_1
  Given I am in PHASE_2_SHIFT
  When generation API returns error
  Then state should return to PHASE_1_REVIEW
  And error toast should appear
```

**E2E Test Specification:**

```typescript
test('US-SFR009: Error during generation returns to Phase 1', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('grove-test-sprout', JSON.stringify({
      id: 'test-sprout-009',
      synthesis: 'Research content...',
      evidence: [{ url: 'https://example.com', title: 'Source' }],
      artifacts: [],
    }));
  });

  // Mock API failure
  await page.route('/api/research/write', async route => {
    await route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'Generation failed' }),
    });
  });

  await page.goto('/explore?sprout=test-sprout-009');
  await page.waitForSelector('[data-testid="sfr-modal"]');

  // Click generate
  await page.locator('[data-testid="generate-button"]').click();

  // Wait for error state
  await page.waitForSelector('[data-testid="error-toast"]', { timeout: 3000 });

  // Verify we're back in Phase 1
  await expect(page.locator('[data-testid="sfr-left-column"]')).toBeVisible();
  await expect(page.locator('[data-testid="sfr-center-column"]')).toBeVisible();
  await expect(page.locator('[data-testid="sfr-right-column"]')).toBeVisible();

  // Verify error message
  await expect(page.locator('[data-testid="error-toast"]')).toContainText(/failed|error/i);

  // Screenshot error state
  await expect(page).toHaveScreenshot('generation-error-phase1.png');
});
```

**Visual Verification Points:**

| State | Screenshot | Required Evidence |
|-------|------------|-------------------|
| Error Recovery | `generation-error-phase1.png` | Back to Phase 1 three-column layout. Error toast visible at top or corner showing "Generation failed" or similar message. Generate button is visible and clickable again. User can retry. |

**Traceability:** Spec section "State Machine" diagram

---

## Epic 4: Phase 3 - Zen Mode

### US-SFR010: Left Rail with Research Drawer

**As a** user writing content
**I want to** peek at the original research
**So that** I can fact-check my writing without leaving the editor

**INVEST Assessment:**
- **I**ndependent: Yes - uses synthesis data
- **N**egotiable: Yes - drawer content flexible
- **V**aluable: Yes - critical for accuracy
- **E**stimable: Yes - 4-6 hours
- **S**mall: Yes - single drawer
- **T**estable: Yes - drawer opens/closes

**Acceptance Criteria:**

```gherkin
Scenario: Left rail shows source badge
  Given I am in Phase 3 with 12 sources
  When I look at the left rail
  Then I should see a sprout icon with badge "12"

Scenario: Clicking rail opens drawer
  Given I am in Phase 3
  When I click the left rail
  Then a drawer should slide in from the left
  And it should contain the full research prose
  And it should contain the source list

Scenario: Drawer overlays editor (no reflow)
  Given the left drawer is open
  When I look at the editor content
  Then the editor text should NOT reflow
  And the drawer should float over the editor with shadow
```

**E2E Test Specification:**

```typescript
test('US-SFR010: Left drawer shows research for fact-checking', async ({ page }) => {
  const researchContent = '## Key Findings\n\nNVIDIA Rubin offers 10x performance improvement [1].';

  await page.addInitScript((research) => {
    localStorage.setItem('grove-test-sprout', JSON.stringify({
      id: 'test-sprout-010',
      synthesis: research,
      evidence: [
        { url: 'https://nvidia.com/1', title: 'Source 1', domain: 'nvidia.com' },
        { url: 'https://nvidia.com/2', title: 'Source 2', domain: 'nvidia.com' },
        { url: 'https://techcrunch.com/1', title: 'Source 3', domain: 'techcrunch.com' },
      ],
      artifacts: [{
        id: 'artifact-001',
        content: '# My Article\n\nRubin is amazing...',
        version: 1,
      }],
    }));
  }, researchContent);

  await page.goto('/explore?sprout=test-sprout-010');
  await page.waitForSelector('[data-testid="sfr-modal"]');

  const leftRail = page.locator('[data-testid="sfr-left-rail"]');

  // Verify badge shows 3 sources
  await expect(leftRail.locator('[data-testid="source-badge"]')).toContainText('3');

  // Click rail to open drawer
  await leftRail.click();

  // Verify drawer slides in
  const leftDrawer = page.locator('[data-testid="left-drawer"]');
  await expect(leftDrawer).toBeVisible();

  // Verify research content is present
  await expect(leftDrawer).toContainText('Key Findings');
  await expect(leftDrawer).toContainText('10x performance improvement');

  // Verify sources are listed
  await expect(leftDrawer).toContainText('nvidia.com');
  await expect(leftDrawer).toContainText('techcrunch.com');

  // Verify overlay (editor should still show behind)
  const editor = page.locator('[data-testid="sfr-editor"]');
  await expect(editor).toContainText('My Article');

  // Screenshot with drawer open
  await expect(page).toHaveScreenshot('left-drawer-research-open.png');

  // Close drawer by clicking rail again
  await leftRail.click();
  await expect(leftDrawer).not.toBeVisible();

  // Screenshot with drawer closed
  await expect(page).toHaveScreenshot('left-drawer-closed.png');
});
```

**Visual Verification Points:**

| State | Screenshot | Required Evidence |
|-------|------------|-------------------|
| Drawer Open | `left-drawer-research-open.png` | Left drawer (350px wide) visible sliding from left rail. Drawer shows "Research Reference" header, visible prose text with "Key Findings" and "10x performance", source list below showing "nvidia.com", "techcrunch.com". Editor content visible behind/beside drawer (not reflowed). Shadow on drawer edge. |
| Drawer Closed | `left-drawer-closed.png` | 50px rail visible with icon + badge "3". No drawer visible. Full-width editor showing "My Article". |

**Traceability:** Spec section "Left Drawer content" - PRIMARY: Research text for fact-checking

---

### US-SFR011: Right Rail with Config Drawer

**As a** user wanting to generate another version
**I want to** access style selection without leaving the editor
**So that** I can quickly try different approaches

**INVEST Assessment:**
- **I**ndependent: Yes - separate from left drawer
- **N**egotiable: Yes - drawer content flexible
- **V**aluable: Yes - enables iteration
- **E**stimable: Yes - 4-6 hours
- **S**mall: Yes - single drawer
- **T**estable: Yes - drawer opens/closes

**Acceptance Criteria:**

```gherkin
Scenario: Right drawer header reinforces immutability
  Given I open the right drawer
  When I look at the header
  Then I should see "Generate New Version"
  And subtext should explain "Changes create V2, not modify V1"

Scenario: Right drawer contains style selector and notes
  Given I open the right drawer
  When I look at the content
  Then I should see template cards (same as Phase 1)
  And I should see notes textarea
```

**E2E Test Specification:**

```typescript
test('US-SFR011: Right drawer shows version generation options', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('grove-test-sprout', JSON.stringify({
      id: 'test-sprout-011',
      synthesis: 'Research content...',
      evidence: [{ url: 'https://example.com', title: 'Source' }],
      artifacts: [{
        id: 'artifact-001',
        templateId: 'ot-seed-blog',
        content: '# Blog Post V1\n\nContent here...',
        version: 1,
      }],
    }));
  });

  await page.goto('/explore?sprout=test-sprout-011');
  await page.waitForSelector('[data-testid="sfr-modal"]');

  const rightRail = page.locator('[data-testid="sfr-right-rail"]');

  // Click to open drawer
  await rightRail.click();

  const rightDrawer = page.locator('[data-testid="right-drawer"]');
  await expect(rightDrawer).toBeVisible();

  // Verify header content
  await expect(rightDrawer.locator('[data-testid="drawer-header"]')).toContainText('Generate New Version');
  await expect(rightDrawer).toContainText(/V2|modify/i);

  // Verify template cards are present
  await expect(rightDrawer.locator('[data-testid="template-card"]')).toHaveCount(4);
  await expect(rightDrawer).toContainText('Blog Post');
  await expect(rightDrawer).toContainText('Vision Paper');

  // Verify notes textarea
  await expect(rightDrawer.locator('[data-testid="notes-textarea"]')).toBeVisible();

  // Screenshot
  await expect(page).toHaveScreenshot('right-drawer-generate-options.png');
});
```

**Visual Verification Points:**

| State | Screenshot | Required Evidence |
|-------|------------|-------------------|
| Drawer Open | `right-drawer-generate-options.png` | Right drawer (300px wide) slides from right rail. Header shows "Generate New Version" with subtext about V2/immutability. 4 template cards visible: Blog Post, Vision Paper, Higher Ed Policy, Engineering/Architecture. Notes textarea visible at bottom. Editor content visible behind drawer. |

**Traceability:** Spec section "Right Drawer" - CRITICAL: Header reinforces "Immutable Artifact" rule

---

### US-SFR012: Tab Bar for Artifact Versions

**As a** user with multiple versions
**I want to** switch between artifacts via tabs
**So that** I can compare and iterate quickly

**INVEST Assessment:**
- **I**ndependent: Yes - manages artifacts[]
- **N**egotiable: Yes - tab design flexible
- **V**aluable: Yes - version management
- **E**stimable: Yes - 4-6 hours
- **S**mall: Yes - tab bar component
- **T**estable: Yes - tab switching works

**Acceptance Criteria:**

```gherkin
Scenario: Tab bar shows all artifacts
  Given I have 3 artifacts: "Blog Post V1", "Vision Paper V1", "Blog Post V2"
  When I view the tab bar
  Then I should see 3 tabs with those labels
  And the active tab should be highlighted

Scenario: Clicking tab switches content
  Given I am viewing "Blog Post V1"
  When I click "Vision Paper V1" tab
  Then the editor should show Vision Paper content
  And "Vision Paper V1" tab should become active

Scenario: New tab button exists
  Given I am in Phase 3
  When I look at the tab bar
  Then I should see a "+ New" button
  And clicking it should open the right drawer
```

**E2E Test Specification:**

```typescript
test('US-SFR012: Tab bar manages multiple artifact versions', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('grove-test-sprout', JSON.stringify({
      id: 'test-sprout-012',
      synthesis: 'Research content...',
      evidence: [{ url: 'https://example.com', title: 'Source' }],
      artifacts: [
        {
          id: 'artifact-001',
          templateId: 'ot-seed-blog',
          content: '# Blog Post V1\n\nThis is the blog version.',
          version: 1,
        },
        {
          id: 'artifact-002',
          templateId: 'ot-seed-vision',
          content: '# Vision Paper V1\n\nThis is the vision version.',
          version: 1,
        },
        {
          id: 'artifact-003',
          templateId: 'ot-seed-blog',
          content: '# Blog Post V2\n\nThis is the revised blog.',
          version: 2,
        },
      ],
    }));
  });

  await page.goto('/explore?sprout=test-sprout-012');
  await page.waitForSelector('[data-testid="sfr-modal"]');

  const tabBar = page.locator('[data-testid="artifact-tab-bar"]');

  // Verify 3 tabs visible
  await expect(tabBar.locator('[data-testid="artifact-tab"]')).toHaveCount(3);

  // Verify tab labels
  await expect(tabBar).toContainText('Blog Post V1');
  await expect(tabBar).toContainText('Vision Paper V1');
  await expect(tabBar).toContainText('Blog Post V2');

  // Verify first tab is active by default
  const firstTab = tabBar.locator('[data-testid="artifact-tab"]').first();
  await expect(firstTab).toHaveAttribute('data-active', 'true');

  // Verify editor shows first artifact content
  const editor = page.locator('[data-testid="sfr-editor"]');
  await expect(editor).toContainText('This is the blog version');

  // Screenshot initial state
  await expect(page).toHaveScreenshot('tab-bar-3-versions-initial.png');

  // Click second tab (Vision Paper)
  const visionTab = tabBar.locator('[data-testid="artifact-tab"]').nth(1);
  await visionTab.click();

  // Verify editor switched to Vision Paper content
  await expect(editor).toContainText('This is the vision version');
  await expect(visionTab).toHaveAttribute('data-active', 'true');
  await expect(firstTab).toHaveAttribute('data-active', 'false');

  // Screenshot after switch
  await expect(page).toHaveScreenshot('tab-bar-vision-selected.png');

  // Verify "+ New" button
  const newBtn = tabBar.locator('[data-testid="new-tab-button"]');
  await expect(newBtn).toBeVisible();
  await expect(newBtn).toContainText('+');
});
```

**Visual Verification Points:**

| State | Screenshot | Required Evidence |
|-------|------------|-------------------|
| Initial | `tab-bar-3-versions-initial.png` | Tab bar shows 3 tabs: "Blog Post V1" (active/highlighted), "Vision Paper V1", "Blog Post V2". "+ New" button visible at end. Editor below shows "Blog Post V1" header and "This is the blog version" text. |
| After Switch | `tab-bar-vision-selected.png` | "Vision Paper V1" tab is now active/highlighted. "Blog Post V1" tab is no longer highlighted. Editor now shows "Vision Paper V1" header and "This is the vision version" text. |

**Traceability:** Spec section "Goal 4: Let Me Try Different Approaches" - Tab Bar

---

### US-SFR013: Editor with Skeleton Loading

**As a** user waiting for generation
**I want to** see a loading state in the editor
**So that** I know the system is working

**INVEST Assessment:**
- **I**ndependent: Yes - loading state
- **N**egotiable: Yes - skeleton design
- **V**aluable: Yes - user feedback
- **E**stimable: Yes - 2-3 hours
- **S**mall: Yes - loading state
- **T**estable: Yes - skeleton appears

**Acceptance Criteria:**

```gherkin
Scenario: Skeleton loader during generation
  Given I click "Generate Artifact"
  When the API is processing
  Then the editor should show skeleton lines
  And the skeleton should pulse/animate

Scenario: Content replaces skeleton
  Given skeleton is showing
  When API returns content
  Then skeleton should fade out
  And content should appear
```

**E2E Test Specification:**

```typescript
test('US-SFR013: Editor shows skeleton during generation', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('grove-test-sprout', JSON.stringify({
      id: 'test-sprout-013',
      synthesis: 'Research content...',
      evidence: [{ url: 'https://example.com', title: 'Source' }],
      artifacts: [],
    }));
  });

  // Mock slow API
  await page.route('/api/research/write', async route => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        content: '# Generated Article\n\nFinal content here.',
      }),
    });
  });

  await page.goto('/explore?sprout=test-sprout-013');
  await page.waitForSelector('[data-testid="sfr-modal"]');

  // Click generate
  await page.locator('[data-testid="generate-button"]').click();

  // Wait for Phase 3 layout to appear
  await page.waitForSelector('[data-testid="sfr-editor-panel"]');

  // Verify skeleton is showing
  const skeleton = page.locator('[data-testid="editor-skeleton"]');
  await expect(skeleton).toBeVisible();

  // Screenshot skeleton state
  await expect(page).toHaveScreenshot('editor-skeleton-loading.png');

  // Wait for content to appear
  await page.waitForSelector('[data-testid="sfr-editor"]');
  await expect(page.locator('[data-testid="sfr-editor"]')).toContainText('Generated Article');

  // Skeleton should be gone
  await expect(skeleton).not.toBeVisible();

  // Screenshot loaded state
  await expect(page).toHaveScreenshot('editor-content-loaded.png');
});
```

**Visual Verification Points:**

| State | Screenshot | Required Evidence |
|-------|------------|-------------------|
| Loading | `editor-skeleton-loading.png` | Editor area shows animated skeleton loader: 4-6 gray pulsing lines of varying widths mimicking text. Tab bar visible showing "Blog Post V1" (or similar). Rails visible at 50px. |
| Loaded | `editor-content-loaded.png` | Editor shows real content: "Generated Article" as h1 header, "Final content here." as paragraph text. No skeleton visible. Content is styled and readable. |

**Traceability:** Spec section "Phase 3 EditorPanel" - skeleton | content

---

## Epic 5: Version Management

### US-SFR014: promptSnapshot Capture

**As a** user generating artifacts
**I want** the exact prompt to be recorded
**So that** I can understand why V1 differed from V2 later

**INVEST Assessment:**
- **I**ndependent: Yes - data capture
- **N**egotiable: No - required for provenance
- **V**aluable: Yes - debugging/reproducibility
- **E**stimable: Yes - 2-3 hours
- **S**mall: Yes - field addition
- **T**estable: Yes - field is populated

**Acceptance Criteria:**

```gherkin
Scenario: promptSnapshot is saved with artifact
  Given I select "Vision Paper" template
  And I enter notes "Focus on enterprise"
  When generation completes
  Then the artifact should have promptSnapshot field
  And it should contain template systemPrompt + user notes
```

**E2E Test Specification:**

```typescript
test('US-SFR014: Artifact includes promptSnapshot for reproducibility', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('grove-test-sprout', JSON.stringify({
      id: 'test-sprout-014',
      synthesis: 'Research content...',
      evidence: [{ url: 'https://example.com', title: 'Source' }],
      artifacts: [],
    }));
  });

  // Capture the request to verify promptSnapshot
  let capturedRequest = null;
  await page.route('/api/research/write', async route => {
    capturedRequest = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      body: JSON.stringify({
        content: '# Vision\n\nContent...',
        templateId: 'ot-seed-vision',
        promptSnapshot: 'Transform research into a forward-looking vision document.\n\nFocus on enterprise adoption.',
      }),
    });
  });

  await page.goto('/explore?sprout=test-sprout-014');
  await page.waitForSelector('[data-testid="sfr-modal"]');

  // Select Vision Paper template
  await page.locator('[data-testid="template-card-ot-seed-vision"]').click();

  // Enter notes
  await page.locator('[data-testid="notes-textarea"]').fill('Focus on enterprise adoption.');

  // Generate
  await page.locator('[data-testid="generate-button"]').click();

  // Wait for completion
  await page.waitForSelector('[data-testid="sfr-editor"]');

  // Verify request included template and notes
  expect(capturedRequest).toBeTruthy();
  expect(capturedRequest.templateId).toBe('ot-seed-vision');
  expect(capturedRequest.userNotes).toBe('Focus on enterprise adoption.');

  // Verify artifact in state has promptSnapshot
  const artifactState = await page.evaluate(() => {
    const sprout = JSON.parse(localStorage.getItem('grove-test-sprout') || '{}');
    return sprout.artifacts?.[0];
  });

  expect(artifactState.promptSnapshot).toContain('forward-looking vision');
  expect(artifactState.promptSnapshot).toContain('enterprise adoption');
});
```

**Visual Verification Points:**

| State | Screenshot | Required Evidence |
|-------|------------|-------------------|
| N/A | (Data verification, no visual) | This story is verified through data inspection, not screenshot. However, a future "Artifact Info" panel could show promptSnapshot. |

**Traceability:** Spec section "Provenance as Infrastructure" - promptSnapshot

---

## Epic 6: Persistence & Actions

### US-SFR015: Save to Nursery

**As a** user with a draft artifact
**I want to** save it to the Nursery
**So that** I can review and promote it later

**INVEST Assessment:**
- **I**ndependent: Yes - save action
- **N**egotiable: Yes - save flow
- **V**aluable: Yes - core lifecycle
- **E**stimable: Yes - 3-4 hours
- **S**mall: Yes - single action
- **T**estable: Yes - save completes

**Acceptance Criteria:**

```gherkin
Scenario: Save button is visible in Phase 3
  Given I am in Phase 3 with an artifact
  When I look at the action buttons
  Then I should see a "Save to Nursery" button (or similar)

Scenario: Clicking Save persists to Nursery
  Given I have edited my artifact
  When I click "Save to Nursery"
  Then a success toast should appear
  And the artifact should be accessible in Nursery view
```

**E2E Test Specification:**

```typescript
test('US-SFR015: Save to Nursery persists artifact', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('grove-test-sprout', JSON.stringify({
      id: 'test-sprout-015',
      synthesis: 'Research content...',
      evidence: [{ url: 'https://example.com', title: 'Source' }],
      artifacts: [{
        id: 'artifact-001',
        templateId: 'ot-seed-blog',
        content: '# My Article\n\nImportant content to save.',
        version: 1,
        status: 'draft',
      }],
    }));
  });

  // Mock save API
  await page.route('/api/nursery/save', async route => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify({ success: true, id: 'nursery-item-001' }),
    });
  });

  await page.goto('/explore?sprout=test-sprout-015');
  await page.waitForSelector('[data-testid="sfr-modal"]');

  // Find and click Save button
  const saveBtn = page.locator('[data-testid="save-to-nursery-button"]');
  await expect(saveBtn).toBeVisible();
  await expect(saveBtn).toContainText(/Save|Nursery/i);

  await saveBtn.click();

  // Verify success toast
  await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
  await expect(page.locator('[data-testid="success-toast"]')).toContainText(/saved|success/i);

  // Screenshot success state
  await expect(page).toHaveScreenshot('save-to-nursery-success.png');
});
```

**Visual Verification Points:**

| State | Screenshot | Required Evidence |
|-------|------------|-------------------|
| Success | `save-to-nursery-success.png` | Green success toast visible (top or corner) showing "Saved to Nursery" or similar. Save button may show checkmark or change to "Saved". Editor still shows content. Phase 3 layout intact. |

**Traceability:** Spec section "Goal 5: Don't Lose My Work" - Save to Nursery

---

### US-SFR016: Auto-Save on Edit

**As a** user editing content
**I want** my changes saved automatically
**So that** I never lose work

**INVEST Assessment:**
- **I**ndependent: Yes - background save
- **N**egotiable: Yes - debounce timing
- **V**aluable: Yes - prevents data loss
- **E**stimable: Yes - 3-4 hours
- **S**mall: Yes - single concern
- **T**estable: Yes - saves trigger

**Acceptance Criteria:**

```gherkin
Scenario: Edits trigger auto-save
  Given I am editing artifact content
  When I stop typing for 2 seconds
  Then the content should auto-save to sprout state

Scenario: Tab switching preserves edits
  Given I have unsaved edits in "Blog Post V1"
  When I click "Vision Paper V1" tab
  And I click back to "Blog Post V1"
  Then my edits should still be present
```

**E2E Test Specification:**

```typescript
test('US-SFR016: Auto-save preserves edits on tab switch', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('grove-test-sprout', JSON.stringify({
      id: 'test-sprout-016',
      synthesis: 'Research content...',
      evidence: [{ url: 'https://example.com', title: 'Source' }],
      artifacts: [
        { id: 'artifact-001', templateId: 'ot-seed-blog', content: '# Blog\n\nOriginal blog.', version: 1 },
        { id: 'artifact-002', templateId: 'ot-seed-vision', content: '# Vision\n\nOriginal vision.', version: 1 },
      ],
    }));
  });

  await page.goto('/explore?sprout=test-sprout-016');
  await page.waitForSelector('[data-testid="sfr-modal"]');

  // Edit blog content
  const editor = page.locator('[data-testid="sfr-editor-textarea"]');
  await editor.fill('# Blog\n\nEDITED blog content.');

  // Wait for debounce
  await page.waitForTimeout(2500);

  // Switch to Vision tab
  await page.locator('[data-testid="artifact-tab"]').nth(1).click();
  await expect(page.locator('[data-testid="sfr-editor"]')).toContainText('Original vision');

  // Switch back to Blog tab
  await page.locator('[data-testid="artifact-tab"]').first().click();

  // Verify edits preserved
  await expect(page.locator('[data-testid="sfr-editor"]')).toContainText('EDITED blog content');

  // Screenshot showing preserved edit
  await expect(page).toHaveScreenshot('auto-save-edit-preserved.png');
});
```

**Visual Verification Points:**

| State | Screenshot | Required Evidence |
|-------|------------|-------------------|
| Preserved | `auto-save-edit-preserved.png` | "Blog Post V1" tab is active. Editor shows "EDITED blog content" (not "Original blog"). This proves the edit was preserved across tab switch. |

**Traceability:** Spec section "Aggressive State Persistence"

---

## Epic 7: Mobile Responsive

### US-SFR017: Mobile Uses Phase 3 Layout

**As a** mobile user
**I want** the focused layout immediately
**So that** the interface fits my screen

**INVEST Assessment:**
- **I**ndependent: Yes - responsive behavior
- **N**egotiable: Yes - breakpoint
- **V**aluable: Yes - mobile support
- **E**stimable: Yes - 2-3 hours
- **S**mall: Yes - layout switch
- **T**estable: Yes - viewport test

**Acceptance Criteria:**

```gherkin
Scenario: Mobile viewport skips Phase 1
  Given I am on a device with viewport < 768px
  And I have a fresh sprout with no artifacts
  When I open the SFR modal
  Then I should see Phase 3 layout (rails + editor)
  And the right drawer should open automatically
```

**E2E Test Specification:**

```typescript
test('US-SFR017: Mobile shows Phase 3 with drawer open for fresh sprout', async ({ page }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });

  await page.addInitScript(() => {
    localStorage.setItem('grove-test-sprout', JSON.stringify({
      id: 'test-sprout-017',
      synthesis: 'Research content...',
      evidence: [{ url: 'https://example.com', title: 'Source' }],
      artifacts: [], // Fresh sprout
    }));
  });

  await page.goto('/explore?sprout=test-sprout-017');
  await page.waitForSelector('[data-testid="sfr-modal"]');

  // Should NOT see Phase 1 columns
  await expect(page.locator('[data-testid="sfr-left-column"]')).not.toBeVisible();
  await expect(page.locator('[data-testid="sfr-center-column"]')).not.toBeVisible();
  await expect(page.locator('[data-testid="sfr-right-column"]')).not.toBeVisible();

  // Should see Phase 3 rails
  await expect(page.locator('[data-testid="sfr-left-rail"]')).toBeVisible();
  await expect(page.locator('[data-testid="sfr-right-rail"]')).toBeVisible();

  // Right drawer should be open by default (for fresh sprout)
  await expect(page.locator('[data-testid="right-drawer"]')).toBeVisible();

  // Template cards visible in drawer
  await expect(page.locator('[data-testid="right-drawer"]')).toContainText('Blog Post');

  // Screenshot mobile initial state
  await expect(page).toHaveScreenshot('mobile-fresh-sprout-drawer-open.png');
});
```

**Visual Verification Points:**

| State | Screenshot | Required Evidence |
|-------|------------|-------------------|
| Mobile Fresh | `mobile-fresh-sprout-drawer-open.png` | Mobile viewport (375px width). No three-column layout. Rails visible at edges. Right drawer is OPEN, showing template cards (Blog Post, Vision Paper, etc.) and notes textarea. Editor area visible behind drawer (may be empty). Header shows hamburger menu or simplified nav. |

**Traceability:** Spec section "Mobile Responsive Strategy" - "Blind Launch" Prevention

---

## Epic 8: Accessibility

### US-SFR018: Keyboard Navigation

**As a** keyboard user
**I want** to navigate the SFR with keyboard
**So that** I can use the feature without a mouse

**INVEST Assessment:**
- **I**ndependent: Yes - a11y layer
- **N**egotiable: Yes - key bindings
- **V**aluable: Yes - accessibility
- **E**stimable: Yes - 4-6 hours
- **S**mall: Yes - navigation concern
- **T**estable: Yes - key presses work

**Acceptance Criteria:**

```gherkin
Scenario: Tab cycles through interactive elements in Phase 1
  Given I am in Phase 1 layout
  When I press Tab repeatedly
  Then focus should move through: Trust Signals → Research → Template Cards → Notes → Generate

Scenario: Arrow keys navigate tabs in Phase 3
  Given I am focused on the tab bar
  When I press Right Arrow
  Then focus should move to the next tab
  And pressing Enter should activate that tab

Scenario: Escape closes open drawer
  Given the left drawer is open
  When I press Escape
  Then the drawer should close
  And focus should return to the rail button
```

**E2E Test Specification:**

```typescript
test('US-SFR018: Escape closes drawer and returns focus to rail', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('grove-test-sprout', JSON.stringify({
      id: 'test-sprout-018',
      synthesis: 'Research content...',
      evidence: [{ url: 'https://example.com', title: 'Source' }],
      artifacts: [{
        id: 'artifact-001',
        content: '# Content',
        version: 1,
      }],
    }));
  });

  await page.goto('/explore?sprout=test-sprout-018');
  await page.waitForSelector('[data-testid="sfr-modal"]');

  const leftRail = page.locator('[data-testid="sfr-left-rail"]');
  const leftDrawer = page.locator('[data-testid="left-drawer"]');

  // Click rail to open drawer
  await leftRail.click();
  await expect(leftDrawer).toBeVisible();

  // Press Escape
  await page.keyboard.press('Escape');

  // Drawer should close
  await expect(leftDrawer).not.toBeVisible();

  // Focus should be on rail button
  const railButton = leftRail.locator('button');
  await expect(railButton).toBeFocused();

  // Screenshot showing focus on rail
  await expect(page).toHaveScreenshot('keyboard-escape-focus-rail.png');
});

test('US-SFR018: Arrow keys navigate artifact tabs', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('grove-test-sprout', JSON.stringify({
      id: 'test-sprout-018b',
      synthesis: 'Research...',
      evidence: [{ url: 'https://example.com', title: 'Source' }],
      artifacts: [
        { id: 'a1', templateId: 'ot-seed-blog', content: '# Blog', version: 1 },
        { id: 'a2', templateId: 'ot-seed-vision', content: '# Vision', version: 1 },
        { id: 'a3', templateId: 'ot-seed-higher-ed', content: '# Higher Ed', version: 1 },
      ],
    }));
  });

  await page.goto('/explore?sprout=test-sprout-018b');
  await page.waitForSelector('[data-testid="sfr-modal"]');

  // Focus first tab
  const firstTab = page.locator('[data-testid="artifact-tab"]').first();
  await firstTab.focus();

  // Arrow right to second tab
  await page.keyboard.press('ArrowRight');

  const secondTab = page.locator('[data-testid="artifact-tab"]').nth(1);
  await expect(secondTab).toBeFocused();

  // Press Enter to activate
  await page.keyboard.press('Enter');

  // Verify second tab is now active
  await expect(secondTab).toHaveAttribute('data-active', 'true');
  await expect(page.locator('[data-testid="sfr-editor"]')).toContainText('Vision');

  // Screenshot showing keyboard-activated tab
  await expect(page).toHaveScreenshot('keyboard-tab-navigation.png');
});
```

**Visual Verification Points:**

| State | Screenshot | Required Evidence |
|-------|------------|-------------------|
| Focus on Rail | `keyboard-escape-focus-rail.png` | Left drawer is closed. Rail button has visible focus indicator (ring, outline, or glow). Editor is visible. |
| Tab Navigation | `keyboard-tab-navigation.png` | "Vision Paper V1" tab is active (visually selected). The tab has a visible focus indicator. Editor shows Vision content. Second tab is both focused AND selected. |

**Traceability:** Spec section "Accessibility Specifications" - Keyboard Navigation

---

### US-SFR019: ARIA Labels

**As a** screen reader user
**I want** proper ARIA labels on interactive elements
**So that** I understand what each element does

**INVEST Assessment:**
- **I**ndependent: Yes - a11y labels
- **N**egotiable: Yes - label text
- **V**aluable: Yes - accessibility
- **E**stimable: Yes - 2-3 hours
- **S**mall: Yes - label addition
- **T**estable: Yes - ARIA attributes exist

**Acceptance Criteria:**

```gherkin
Scenario: Rail buttons have descriptive labels
  Given I inspect the left rail button
  Then it should have aria-label "Toggle research sources panel"
  And it should have aria-expanded reflecting drawer state

Scenario: Tab bar has proper roles
  Given I inspect the tab bar
  Then it should have role="tablist"
  And each tab should have role="tab" and aria-selected
```

**E2E Test Specification:**

```typescript
test('US-SFR019: ARIA labels are present and correct', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('grove-test-sprout', JSON.stringify({
      id: 'test-sprout-019',
      synthesis: 'Research content...',
      evidence: [{ url: 'https://example.com', title: 'Source' }],
      artifacts: [
        { id: 'a1', content: '# Blog', version: 1 },
        { id: 'a2', content: '# Vision', version: 1 },
      ],
    }));
  });

  await page.goto('/explore?sprout=test-sprout-019');
  await page.waitForSelector('[data-testid="sfr-modal"]');

  // Check left rail button ARIA
  const leftRailBtn = page.locator('[data-testid="sfr-left-rail"] button');
  await expect(leftRailBtn).toHaveAttribute('aria-label', /research|sources/i);
  await expect(leftRailBtn).toHaveAttribute('aria-expanded', 'false');

  // Open drawer and verify aria-expanded changes
  await leftRailBtn.click();
  await expect(leftRailBtn).toHaveAttribute('aria-expanded', 'true');

  // Check drawer ARIA
  const leftDrawer = page.locator('[data-testid="left-drawer"]');
  await expect(leftDrawer).toHaveAttribute('aria-label', /research|reference/i);

  // Check tab bar roles
  const tabBar = page.locator('[data-testid="artifact-tab-bar"]');
  await expect(tabBar).toHaveAttribute('role', 'tablist');

  const tabs = page.locator('[data-testid="artifact-tab"]');
  await expect(tabs.first()).toHaveAttribute('role', 'tab');
  await expect(tabs.first()).toHaveAttribute('aria-selected', 'true');
  await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'false');
});
```

**Visual Verification Points:**

| State | Screenshot | Required Evidence |
|-------|------------|-------------------|
| N/A | (Attribute verification, no visual) | ARIA labels are verified via attribute inspection, not screenshots. Accessibility audits tools can generate reports. |

**Traceability:** Spec section "Accessibility Specifications" - ARIA Labels table

---

## Deferred to v1.1

### US-SFR0XX: Export to Multiple Formats (DEFERRED)

**Reason:** Markdown copy is sufficient for v1.0. PDF and Notion export add complexity.

**Original Flow:** User clicks Export → chooses format (Markdown, PDF, Notion) → downloads/publishes

**v1.1 Prerequisite:** Define export format requirements based on user feedback

---

### US-SFR0XX: Artifact Collaboration (DEFERRED)

**Reason:** Multi-user editing requires significant backend infrastructure

**Original Flow:** Multiple users view/edit same sprout simultaneously

**v1.1 Prerequisite:** Real-time sync infrastructure, permission model

---

## Open Questions

1. **Export Formats** — v1.0 uses "Copy as Markdown". Should v1.1 add PDF export, or is Notion integration preferred?

2. **Version Limit** — Spec asks if we should cap versions per sprout. Defer decision until we see usage patterns.

3. **Edit History** — `editHistory[]` field is marked optional. Should v1.1 implement full undo/redo?

---

## Summary

| Story ID | Title | Priority | Complexity | E2E Tests |
|----------|-------|----------|------------|-----------|
| US-SFR001 | Phase 1 Three-Column Layout | P0 | M | 1 |
| US-SFR002 | Phase 3 Rail + Editor Layout | P0 | M | 1 |
| US-SFR003 | Trust Signals Display | P0 | S | 1 |
| US-SFR004 | Research Content Display | P0 | S | 1 |
| US-SFR005 | Output Style Selector | P0 | M | 1 |
| US-SFR006 | Notes Textarea | P1 | S | 1 |
| US-SFR007 | Generate Artifact Button | P0 | S | 1 |
| US-SFR008 | Curtain Pull Animation | P1 | M | 2 |
| US-SFR009 | Phase State Machine | P0 | M | 1 |
| US-SFR010 | Left Rail with Research Drawer | P0 | M | 2 |
| US-SFR011 | Right Rail with Config Drawer | P0 | M | 1 |
| US-SFR012 | Tab Bar for Artifact Versions | P0 | M | 2 |
| US-SFR013 | Editor with Skeleton Loading | P1 | S | 2 |
| US-SFR014 | promptSnapshot Capture | P0 | S | 1 |
| US-SFR015 | Save to Nursery | P0 | S | 1 |
| US-SFR016 | Auto-Save on Edit | P1 | M | 1 |
| US-SFR017 | Mobile Uses Phase 3 Layout | P1 | S | 1 |
| US-SFR018 | Keyboard Navigation | P1 | M | 2 |
| US-SFR019 | ARIA Labels | P1 | S | 1 |

**Total v1.0 Stories:** 19
**Total E2E Tests:** 23
**Visual Verification Screenshots:** 26
**Deferred:** 2

---

## E2E Test Summary

### Test File Structure

```
tests/e2e/sfr-ux-redesign/
├── layout.spec.ts          # US-SFR001, US-SFR002
├── phase1-reading-room.spec.ts  # US-SFR003, US-SFR004, US-SFR005, US-SFR006, US-SFR007
├── phase-transition.spec.ts     # US-SFR008, US-SFR009
├── phase3-zen-mode.spec.ts      # US-SFR010, US-SFR011, US-SFR012, US-SFR013
├── version-management.spec.ts   # US-SFR014
├── persistence.spec.ts          # US-SFR015, US-SFR016
├── mobile.spec.ts               # US-SFR017
├── accessibility.spec.ts        # US-SFR018, US-SFR019
└── fixtures/
    └── test-sprouts.ts
```

### Screenshot Baselines Required

| Screenshot | Story | Evidence Required |
|------------|-------|-------------------|
| `phase1-three-column-layout.png` | US-SFR001 | 3 columns with 20/55/25 proportions, left shows sources, center shows prose, right shows 4 template cards |
| `phase3-rail-editor-layout.png` | US-SFR002 | 50px rails, editor with content, tab bar visible, "SOURCES" rotated label |
| `trust-signals-populated.png` | US-SFR003 | "4 sources", "3 domains" badges, domain list, recency indicators |
| `research-content-with-citations.png` | US-SFR004 | H2 headers styled, inline [1][2] citations visible, readable prose |
| `style-selector-default.png` | US-SFR005 | 4 cards, Blog Post selected by default |
| `style-selector-vision-selected.png` | US-SFR005 | Vision Paper now selected, Blog deselected |
| `notes-textarea-filled.png` | US-SFR006 | Vision selected, textarea shows "Focus on enterprise..." |
| `generate-button-ready.png` | US-SFR007 | Green/blue primary button, template selected above |
| `after-generate-phase3.png` | US-SFR007 | Phase 3 layout, tab bar with "Blog Post V1" |
| `curtain-pull-mid-animation.png` | US-SFR008 | Columns in intermediate width state |
| `curtain-pull-complete.png` | US-SFR008 | Final Phase 3 layout |
| `generation-error-phase1.png` | US-SFR009 | Back to Phase 1, error toast visible |
| `left-drawer-research-open.png` | US-SFR010 | 350px drawer, research text, source list, shadow |
| `left-drawer-closed.png` | US-SFR010 | 50px rail, badge "3", no drawer |
| `right-drawer-generate-options.png` | US-SFR011 | 300px drawer, "Generate New Version" header, 4 cards |
| `tab-bar-3-versions-initial.png` | US-SFR012 | 3 tabs, first active, "+ New" button |
| `tab-bar-vision-selected.png` | US-SFR012 | Second tab active, editor shows Vision content |
| `editor-skeleton-loading.png` | US-SFR013 | Pulsing gray lines, tab bar visible |
| `editor-content-loaded.png` | US-SFR013 | Real content visible, no skeleton |
| `save-to-nursery-success.png` | US-SFR015 | Green success toast, Save button updated |
| `auto-save-edit-preserved.png` | US-SFR016 | Blog tab active, "EDITED" content visible |
| `mobile-fresh-sprout-drawer-open.png` | US-SFR017 | 375px viewport, Phase 3, right drawer open |
| `keyboard-escape-focus-rail.png` | US-SFR018 | Drawer closed, focus ring on rail button |
| `keyboard-tab-navigation.png` | US-SFR018 | Second tab focused+active, Vision content |

### Test Data Requirements

| Test | Required Data | Setup Method |
|------|---------------|--------------|
| All tests | Sprout with synthesis + evidence | localStorage seeding via addInitScript |
| Phase 3 tests | Sprout with 1+ artifacts | artifacts[] array in seed |
| Multi-version tests | Sprout with 2-3 artifacts | Multiple artifact objects |
| API tests | Mocked /api/research/write | page.route() mock |
| Error tests | API returning 500 | page.route() with error response |

---

## DEX Alignment Verification

| Pillar | How Stories Support |
|--------|---------------------|
| **Declarative Sovereignty** | Templates loaded from seeds (US-SFR005). Layout config in JSON (US-SFR001, US-SFR002). Animation timing configurable (US-SFR008). |
| **Capability Agnosticism** | Same OutputStyleSelector works in Phase 1 column and Phase 3 drawer (US-SFR005, US-SFR011). Editor accepts any model output. |
| **Provenance as Infrastructure** | promptSnapshot captures exact generation context (US-SFR014). Artifact includes templateId, generatedAt, modelId. |
| **Organic Scalability** | Tab bar scrolls for many versions (US-SFR012). Card grid scrolls for many templates. Drawer can grow content. |

---

*User Stories extracted 2026-01-24*
*Sprint: S23-SFR (sfr-ux-redesign-v1)*
*Ready for User Review*
