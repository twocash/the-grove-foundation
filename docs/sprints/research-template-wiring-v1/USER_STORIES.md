# User Stories, Acceptance Criteria & E2E Tests v2.0 Review

**Sprint:** S21-RL - Research Template Wiring (Simplified)
**Parent Epic:** Research Lifecycle v1 (RL)
**Phase:** Story Extraction + Acceptance Criteria + E2E Test Specs
**Status:** Draft for Review

---

## Critical Observations

### 1. Gap is Well-Defined and Minimal

The specification clearly identifies a single gap: **templates exist but aren't wired to execution**. The inventory tables show exactly what works vs. what's missing. No ambiguity.

### 2. Pattern Already Exists (ReviseForm.tsx)

The proposed implementation mirrors an **existing, working pattern** in the codebase:
- `ReviseForm.tsx` uses `useOutputTemplateData()` hook
- Filters by `agentType === 'writer'` - we filter by `agentType === 'research'`
- Badge pattern: `{name}{isDefault ? ' (Default)' : ''}{source === 'system-seed' ? ' • System' : ''}`

**Risk mitigation:** This isn't speculative design - it's pattern reuse.

### 3. Provenance Solution is Zero-Cost

PM review identified that provenance fields add ~5 lines since we're already loading the template to get `systemPrompt`. This is **accidental provenance** - a DEX win.

---

## Proposed v1.0 Simplifications

| Spec Feature | v1.0 Approach | Rationale |
|--------------|---------------|-----------|
| Config field mapping (numeric params) | Defer to S22 | systemPrompt is sufficient for behavioral differentiation |
| Template analytics | Defer | Provenance fields enable future analytics without blocking |
| Custom template creation | Defer | System-seeded templates cover primary use cases |
| Template preview/comparison | Defer | Dropdown with descriptions sufficient for v1.0 |

---

## Epic 1: Schema & Data Layer

### US-RL001: Add templateId field to ResearchSprout schema

**As a** system architect
**I want to** store the selected template ID on each ResearchSprout
**So that** we have provenance of which research style shaped this investigation

**INVEST Assessment:**
- **I**ndependent: Yes - schema change only, no UI dependencies
- **N**egotiable: No - required for provenance chain
- **V**aluable: Yes - DEX Pillar III compliance
- **E**stimable: Yes - ~3 lines in schema file
- **S**mall: Yes - single field addition
- **T**estable: Yes - type guard can verify field presence

**Acceptance Criteria:**

```gherkin
Scenario: ResearchSprout schema includes templateId
  Given the ResearchSprout schema definition
  When I create a new ResearchSprout
  Then the schema should accept an optional templateId field of type string
  And the CreateResearchSproutInput should include optional templateId

Scenario: Existing sprouts without templateId remain valid
  Given a legacy ResearchSprout without templateId field
  When the type guard isResearchSprout() validates it
  Then it should pass validation (templateId is optional)
```

**E2E Test Specification:**

```typescript
// tests/e2e/research-template-wiring/schema.spec.ts

import { test, expect } from '@playwright/test';

test.describe('US-RL001: ResearchSprout Schema', () => {
  // Note: Schema tests are unit tests, not E2E
  // E2E verification happens through integration tests below
});
```

**Visual Verification Points:** N/A (schema change, no UI)

**Traceability:** Spec section "Missing Details Resolved" - "Template selection storage"

---

### US-RL002: Add provenance fields to PipelineResult

**As a** researcher reviewing completed research
**I want to** see which template was used for this research
**So that** I can understand why results differ between research runs

**INVEST Assessment:**
- **I**ndependent: Yes - can be added without UI changes
- **N**egotiable: Yes - field structure is flexible
- **V**aluable: Yes - enables research reproducibility
- **E**stimable: Yes - ~5 lines
- **S**mall: Yes - single object addition
- **T**estable: Yes - can verify fields present in result

**Acceptance Criteria:**

```gherkin
Scenario: PipelineResult includes template provenance
  Given a research pipeline execution with templateId
  When the pipeline completes successfully
  Then the PipelineResult should include:
    | Field | Type | Description |
    | template.id | string | Template UUID |
    | template.name | string | Human-readable name |
    | template.version | number | Template version |
    | template.source | enum | 'system-seed' or 'user-created' or 'forked' |

Scenario: PipelineResult handles missing template gracefully
  Given a research pipeline execution without templateId
  When the pipeline completes
  Then the template field should be undefined
  And the pipeline should not fail
```

**E2E Test Specification:**

```typescript
// tests/e2e/research-template-wiring/provenance.spec.ts

test.describe('US-RL002: Pipeline Provenance', () => {
  test('pipeline result includes template provenance', async ({ page, request }) => {
    // Arrange: Create sprout with template selection
    // This will be tested via integration with US-RL005

    // Assert: Verify provenance in result
    // Checked via API response inspection
  });
});
```

**Visual Verification Points:** N/A (data layer, no UI)

**Traceability:** Spec section "UX Chief Review" - "Provenance as Infrastructure" + PM "Provenance Solution"

---

## Epic 2: Backend API

### US-RL003: Add systemPrompt parameter to /api/research/deep

**As a** research execution engine
**I want to** pass a systemPrompt to the Claude API call
**So that** different templates produce meaningfully different research behavior

**INVEST Assessment:**
- **I**ndependent: Yes - API change, independent of UI
- **N**egotiable: Yes - parameter name is flexible
- **V**aluable: Yes - core value proposition of sprint
- **E**stimable: Yes - ~10 lines in server.js
- **S**mall: Yes - single parameter addition
- **T**estable: Yes - can verify API accepts and uses parameter

**Acceptance Criteria:**

```gherkin
Scenario: API accepts systemPrompt parameter
  Given the /api/research/deep endpoint
  When I POST with body { query: "test", systemPrompt: "Be thorough" }
  Then the request should succeed with status 200
  And the systemPrompt should be passed to Claude API

Scenario: API works without systemPrompt (backward compatible)
  Given the /api/research/deep endpoint
  When I POST with body { query: "test" } (no systemPrompt)
  Then the request should succeed with status 200
  And Claude should use default behavior

Scenario: Different systemPrompts produce different behavior
  Given the /api/research/deep endpoint
  When I POST with Deep Dive systemPrompt (exhaustive exploration)
  And I POST with Quick Scan systemPrompt (rapid overview)
  Then the Deep Dive response should have more detailed findings
  And the Quick Scan response should complete faster
```

**E2E Test Specification:**

```typescript
// tests/e2e/research-template-wiring/api.spec.ts

test.describe('US-RL003: Research API systemPrompt', () => {
  test('API accepts and uses systemPrompt', async ({ request }) => {
    const response = await request.post('/api/research/deep', {
      data: {
        query: 'What are distributed AI infrastructure patterns?',
        systemPrompt: 'You are a thorough academic researcher. Explore exhaustively.'
      }
    });

    expect(response.ok()).toBeTruthy();
    const result = await response.json();
    expect(result.findings).toBeDefined();
  });

  test('API backward compatible without systemPrompt', async ({ request }) => {
    const response = await request.post('/api/research/deep', {
      data: { query: 'Test query' }
    });

    expect(response.ok()).toBeTruthy();
  });
});
```

**Visual Verification Points:** N/A (API, no UI)

**Traceability:** Spec section "Changes Required" - "1. server.js"

---

### US-RL004: Pass systemPrompt through research-execution-engine

**As a** research execution engine
**I want to** forward the systemPrompt from pipeline to API call
**So that** template selection affects actual Claude behavior

**INVEST Assessment:**
- **I**ndependent: Yes - internal plumbing
- **N**egotiable: Yes - implementation approach flexible
- **V**aluable: Yes - required for end-to-end flow
- **E**stimable: Yes - ~5 lines
- **S**mall: Yes - parameter threading
- **T**estable: Yes - can verify parameter reaches API

**Acceptance Criteria:**

```gherkin
Scenario: callClaudeDeepResearch accepts systemPrompt
  Given the callClaudeDeepResearch function
  When called with query and systemPrompt parameters
  Then the systemPrompt should be included in the API request body

Scenario: systemPrompt flows from pipeline config to API
  Given a PipelineConfig with researchConfig.systemPrompt
  When executeResearchPipeline is called
  Then the systemPrompt should reach the /api/research/deep endpoint
```

**E2E Test Specification:**

```typescript
// tests/e2e/research-template-wiring/execution-engine.spec.ts

test.describe('US-RL004: Execution Engine systemPrompt', () => {
  // Integration test - verified through full pipeline execution
  // See US-RL005 for end-to-end test
});
```

**Visual Verification Points:** N/A (internal plumbing)

**Traceability:** Spec section "Changes Required" - "2. research-execution-engine.ts"

---

### US-RL005: Load template and extract systemPrompt in pipeline

**As a** research pipeline
**I want to** load the selected template by ID and extract its systemPrompt
**So that** the correct research style is applied to execution

**INVEST Assessment:**
- **I**ndependent: Yes - pipeline internal logic
- **N**egotiable: Yes - loading strategy flexible
- **V**aluable: Yes - connects template selection to execution
- **E**stimable: Yes - ~20 lines
- **S**mall: Yes - single function addition
- **T**estable: Yes - can verify template loaded and used

**Acceptance Criteria:**

```gherkin
Scenario: Pipeline loads template by ID
  Given a ResearchSprout with templateId "deep-dive-001"
  When executeResearchPipeline is called
  Then the pipeline should load the template from output_templates
  And extract the systemPrompt from template.payload.systemPrompt

Scenario: Pipeline uses default template when none specified
  Given a ResearchSprout without templateId
  When executeResearchPipeline is called
  Then the pipeline should find the template with isDefault: true
  And use its systemPrompt

Scenario: Pipeline handles missing template gracefully
  Given a ResearchSprout with templateId "nonexistent-id"
  When executeResearchPipeline is called
  Then the pipeline should log a warning
  And fall back to default template

Scenario: Pipeline includes provenance in result
  Given a successful pipeline execution with templateId
  When the pipeline returns PipelineResult
  Then result.template should contain { id, name, version, source }
```

**E2E Test Specification:**

```typescript
// tests/e2e/research-template-wiring/pipeline.spec.ts

test.describe('US-RL005: Pipeline Template Loading', () => {
  test('pipeline executes with Deep Dive template', async ({ page }) => {
    // Navigate to explore
    await page.goto('/explore');

    // Create sprout with Deep Dive selection
    // (Requires US-RL006 UI to be complete)

    // Verify execution uses Deep Dive behavior
    // Check result provenance includes template info
  });
});
```

**Visual Verification Points:** N/A (pipeline logic)

**Traceability:** Spec section "Changes Required" - "3. research-pipeline.ts"

---

## Epic 3: User Interface

### US-RL006: Add Research Style selector to GardenInspector ConfirmationView

**As a** researcher initiating a sprout
**I want to** select a research style (Quick Scan, Deep Dive, Academic Review, Trend Analysis) with clear descriptions
**So that** I can make an informed decision about how thoroughly or quickly the AI explores my topic

**INVEST Assessment:**
- **I**ndependent: Yes - can be developed with mock data
- **N**egotiable: Yes - dropdown vs. cards vs. radio buttons
- **V**aluable: Yes - primary user-facing feature
- **E**stimable: Yes - ~40 lines (pattern exists, adds progressive disclosure)
- **S**mall: Yes - single component addition
- **T**estable: Yes - can verify selector renders, shows description, and emits selection

**UI Pattern:** Progressive Disclosure
- Dropdown shows template name + provenance badge
- Hint text below dropdown shows `template.payload.description`
- Hint updates dynamically when selection changes

**Acceptance Criteria:**

```gherkin
# === CORE SELECTOR ===

Scenario: Research Style selector appears in confirmation view
  Given I am on the GardenInspector confirmation view
  When the view renders with available templates
  Then I should see a "Research Style" dropdown
  And it should be positioned between Title and Instructions fields
  And it should show "Quick Scan (Default) • System" as initial selection

Scenario: Dropdown shows all active research templates with provenance
  Given active research templates exist in output_templates
  When I click the Research Style dropdown
  Then I should see all templates with agentType='research' and status='active'
  And each option should display: {name}{isDefault ? ' (Default)' : ''}{source === 'system-seed' ? ' • System' : ''}

# === INFORMED DECISION (Progressive Disclosure) ===

Scenario: Description hint shows trade-off for default selection
  Given I am on the GardenInspector confirmation view
  And "Quick Scan" is the default selection
  When the view renders
  Then I should see a hint below the dropdown showing "Rapid research overview with limited depth"
  So that I understand the trade-off before starting research

Scenario: Description hint updates when selection changes
  Given "Quick Scan" is selected with hint "Rapid research overview with limited depth"
  When I select "Deep Dive" from the dropdown
  Then the hint should update to "Exhaustive research exploration with maximum branching depth"
  So that I can compare approaches before committing

Scenario: User can compare templates by cycling through options
  Given I am reviewing research style options
  When I cycle through each template option
  Then I should see the following descriptions:
    | Template | Description |
    | Quick Scan | Rapid research overview with limited depth |
    | Deep Dive | Exhaustive research exploration with maximum branching depth |
    | Academic Review | Scholarly literature review with citation emphasis |
    | Trend Analysis | Trend-focused research emphasizing temporal patterns |

# === PROVENANCE VISIBILITY ===

Scenario: System-seeded templates show provenance badge
  Given the system has seeded research templates
  When I view the dropdown options
  Then each system-seeded template should display "• System" suffix
  So that I know this is a Grove-provided template

Scenario: User-created templates are visually distinguished
  Given a user has created a custom research template
  When I view the dropdown options
  Then the user-created template should NOT display "• System" suffix
  And the default system template should still show "(Default) • System"

# === PERSISTENCE ===

Scenario: Template selection persists through confirmation
  Given I select "Deep Dive" from the Research Style dropdown
  When I click "Start Research"
  Then the sprout should be created with templateId matching "Deep Dive"

Scenario: Selector is disabled during processing
  Given the confirmation view is in processing state
  When I view the Research Style dropdown
  Then it should be disabled and show reduced opacity
```

**E2E Test Specification:**

```typescript
// tests/e2e/research-template-wiring/ui.spec.ts

import { test, expect } from '@playwright/test';

test.describe('US-RL006: Research Style Selector', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/explore');
    // Trigger sprout creation flow to get to confirmation view
  });

  // === CORE SELECTOR ===

  test('selector renders with default selection and hint', async ({ page }) => {
    // Wait for confirmation view
    await expect(page.locator('[data-testid="research-style-select"]')).toBeVisible();

    // Verify default selection
    const select = page.locator('[data-testid="research-style-select"]');
    await expect(select).toHaveValue(/quick-scan/i);

    // Verify description hint shows for default
    const hint = page.locator('[data-testid="research-style-hint"]');
    await expect(hint).toContainText('Rapid research overview with limited depth');

    // Visual Verification
    await expect(page).toHaveScreenshot('research-style-default.png');
  });

  test('dropdown shows all research templates with provenance badges', async ({ page }) => {
    // Open dropdown
    await page.locator('[data-testid="research-style-select"]').click();

    // Verify options
    const options = page.locator('[data-testid="research-style-select"] option');
    await expect(options).toHaveCount(4); // Quick Scan, Deep Dive, Academic Review, Trend Analysis

    // Verify provenance badges
    await expect(options.first()).toContainText('• System');

    // Visual Verification
    await expect(page).toHaveScreenshot('research-style-expanded.png');
  });

  // === INFORMED DECISION (Progressive Disclosure) ===

  test('hint updates when selection changes - informed decision', async ({ page }) => {
    const hint = page.locator('[data-testid="research-style-hint"]');

    // Initial state: Quick Scan (default)
    await expect(hint).toContainText('Rapid research overview with limited depth');

    // Change to Deep Dive
    await page.locator('[data-testid="research-style-select"]').selectOption({ label: /Deep Dive/i });
    await expect(hint).toContainText('Exhaustive research exploration with maximum branching depth');

    // Visual Verification - Deep Dive selected with updated hint
    await expect(page).toHaveScreenshot('research-style-deep-dive-selected.png');

    // Change to Academic Review
    await page.locator('[data-testid="research-style-select"]').selectOption({ label: /Academic Review/i });
    await expect(hint).toContainText('Scholarly literature review with citation emphasis');

    // Change to Trend Analysis
    await page.locator('[data-testid="research-style-select"]').selectOption({ label: /Trend Analysis/i });
    await expect(hint).toContainText('Trend-focused research emphasizing temporal patterns');
  });

  test('user can compare all templates via cycling', async ({ page }) => {
    const select = page.locator('[data-testid="research-style-select"]');
    const hint = page.locator('[data-testid="research-style-hint"]');

    // Capture all descriptions for comparison
    const expectedDescriptions = [
      { label: /Quick Scan/i, hint: 'Rapid research overview with limited depth' },
      { label: /Deep Dive/i, hint: 'Exhaustive research exploration with maximum branching depth' },
      { label: /Academic Review/i, hint: 'Scholarly literature review with citation emphasis' },
      { label: /Trend Analysis/i, hint: 'Trend-focused research emphasizing temporal patterns' },
    ];

    for (const { label, hint: expectedHint } of expectedDescriptions) {
      await select.selectOption({ label });
      await expect(hint).toContainText(expectedHint);
    }
  });

  // === PERSISTENCE ===

  test('selection persists through sprout creation', async ({ page }) => {
    // Select Deep Dive
    await page.locator('[data-testid="research-style-select"]').selectOption({ label: /Deep Dive/i });

    // Submit
    await page.locator('[data-testid="start-research-btn"]').click();

    // Verify sprout created with correct template (check via API or state)
    // The sprout should have templateId matching the Deep Dive template UUID
  });

  test('selector disabled during processing', async ({ page }) => {
    // Trigger processing state
    await page.locator('[data-testid="start-research-btn"]').click();

    // Verify disabled
    await expect(page.locator('[data-testid="research-style-select"]')).toBeDisabled();

    // Visual Verification
    await expect(page).toHaveScreenshot('research-style-disabled.png');
  });
});
```

**Visual Verification Points:**

| State | Screenshot | Description |
|-------|------------|-------------|
| Default | `research-style-default.png` | Selector shows "Quick Scan (Default) • System" with hint "Rapid research overview..." |
| Expanded | `research-style-expanded.png` | Dropdown open showing all 4 options with "• System" badges |
| Deep Dive Selected | `research-style-deep-dive-selected.png` | Deep Dive selected, hint shows "Exhaustive research exploration..." |
| Disabled | `research-style-disabled.png` | Selector disabled during processing |

**Stitch Wireframes:** Project ID `799743150380166181`
- Wireframe 1: "Human Shaping Form Section" - Default state with Quick Scan and hint
- Wireframe 2: "Human Shaping - Deep Dive Selected" - Shows hint dynamically updating

**Traceability:** Spec section "Changes Required" - "4. GardenInspector.tsx" + "UX Chief Review" (progressive disclosure pattern)

---

## E2E Test Summary

### Test File Structure

```
tests/e2e/research-template-wiring/
├── schema.spec.ts          # US-RL001, US-RL002 (unit test markers)
├── api.spec.ts             # US-RL003
├── execution-engine.spec.ts # US-RL004 (integration markers)
├── pipeline.spec.ts        # US-RL005
├── ui.spec.ts              # US-RL006
└── fixtures/
    └── test-templates.ts   # Mock template data
```

### Screenshot Baselines Required

| Screenshot | Story | State |
|------------|-------|-------|
| `research-style-default.png` | US-RL006 | Initial load with default selection |
| `research-style-expanded.png` | US-RL006 | Dropdown expanded |
| `research-style-deep-dive-selected.png` | US-RL006 | Deep Dive selected |
| `research-style-disabled.png` | US-RL006 | Disabled during processing |

### Test Data Requirements

| Test | Required Data | Setup Method |
|------|---------------|--------------|
| US-RL006 | 4 research templates seeded | Supabase seed (already exists from S20) |
| US-RL003 | Claude API access | Environment variable |
| US-RL005 | Test sprout | Created via UI or API |

---

## Deferred to v1.1+

### US-RL0XX: Config Field Mapping (DEFERRED to S22)

**Reason:** systemPrompt provides sufficient behavioral differentiation. Numeric config parameters (branchDepth, maxSources) add complexity without proportional value for MVP.

**Original Flow:** Map template fields to ResearchAgentConfig parameters

**v1.1 Prerequisite:** Validate that systemPrompt alone produces meaningful differentiation

---

### US-RL0YY: Template Analytics Dashboard (DEFERRED)

**Reason:** Provenance fields enable this future feature. Ship basic wiring first.

**Original Flow:** Dashboard showing template usage patterns, success rates

**v1.1 Prerequisite:** Accumulate usage data via provenance fields

---

## Open Questions (Resolved)

1. ~~**Tooltip content** — Should the dropdown include a tooltip showing the full template description?~~

   **RESOLVED:** Use **progressive disclosure pattern** instead of tooltip:
   - Dropdown shows: `{name}{isDefault ? ' (Default)' : ''}{source === 'system-seed' ? ' • System' : ''}`
   - Hint text below dropdown shows: `template.payload.description`
   - Hint updates dynamically when selection changes

   **Data source:** `template.payload.description` (confirmed in `data/seeds/output-templates.json`)

2. **Template loading timing** — Should templates be pre-fetched on page load or lazy-loaded when confirmation view opens? (Recommendation: Pre-fetch via useOutputTemplateData in parent)

---

## Summary

| Story ID | Title | Priority | Complexity | E2E Tests |
|----------|-------|----------|------------|-----------|
| US-RL001 | Add templateId to ResearchSprout | P0 | S | 0 (unit) |
| US-RL002 | Add provenance to PipelineResult | P0 | S | 0 (unit) |
| US-RL003 | Add systemPrompt to API | P0 | S | 2 |
| US-RL004 | Pass systemPrompt through engine | P0 | S | 0 (integration) |
| US-RL005 | Load template in pipeline | P0 | M | 1 |
| US-RL006 | Research Style selector UI + Informed Decision | P0 | M | 6 |

**Total v1.0 Stories:** 6
**Total E2E Tests:** 9
**Visual Verification Points:** 4
**Deferred:** 2
**Stitch Wireframes:** 2 (Project ID: `799743150380166181`)

---

## DEX Alignment Verification

| Pillar | How Stories Support |
|--------|---------------------|
| **Declarative Sovereignty** | US-RL005: Template's systemPrompt shapes behavior via database record, not code deployment. Adding a new research style = adding a database row. |
| **Capability Agnosticism** | US-RL003: systemPrompt is model-agnostic instruction text. Works with Claude, Gemini, or local models without API changes. |
| **Provenance as Infrastructure** | US-RL001 + US-RL002: Every sprout records which template shaped it. Every pipeline result includes template provenance. Full audit trail. |
| **Organic Scalability** | US-RL006: UI works for any number of templates. Dropdown pattern scales from 4 to 40 templates without code changes. |

---

## Implementation Order

Recommended execution sequence based on dependencies:

```
1. US-RL001 (Schema) ─────────┐
                              ├─► 3. US-RL005 (Pipeline) ─► 5. US-RL006 (UI)
2. US-RL002 (Provenance) ─────┤
                              │
3. US-RL003 (API) ────────────┤
                              │
4. US-RL004 (Engine) ─────────┘
```

**Critical Path:** US-RL001 → US-RL005 → US-RL006

---

## Appendix: Code Pattern Reference

### ReviseForm.tsx Pattern (Source of Truth)

```typescript
// From: src/surface/components/modals/SproutFinishingRoom/components/ReviseForm.tsx

// 1. Load templates
const { objects: templates, loading: templatesLoading } = useOutputTemplateData();

// 2. Filter by agent type
const writerTemplates = useMemo(() => {
  return templates.filter(
    (t) => t.payload.agentType === 'writer' && t.payload.status === 'active'
  );
}, [templates]);

// 3. Find default
const defaultTemplate = useMemo(() => {
  return writerTemplates.find((t) => t.payload.isDefault);
}, [writerTemplates]);

// 4. Auto-select default
React.useEffect(() => {
  if (!selectedTemplateId && defaultTemplate) {
    setSelectedTemplateId(defaultTemplate.meta.id);
  }
}, [selectedTemplateId, defaultTemplate]);

// 5. Render dropdown with badge pattern
<select value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)}>
  {writerTemplates.map((template) => (
    <option key={template.meta.id} value={template.meta.id}>
      {template.payload.name}
      {template.payload.isDefault ? ' (Default)' : ''}
      {template.payload.source === 'system-seed' ? ' • System' : ''}
    </option>
  ))}
</select>
```

### GardenInspector Integration Point

The Research Style selector will be added to `ConfirmationView` in Zone 3 (Human Shaping), between the Title input (line 371-389) and Instructions textarea (line 392-414):

```
Zone 3: Human Shaping
├── Title input           (existing, lines 371-389)
├── Research Style select (NEW, US-RL006)
│   ├── <select> dropdown  - Shows name + provenance badge
│   └── <p> hint text      - Shows template.payload.description (dynamic)
└── Instructions textarea (existing, lines 392-414)
```

### Progressive Disclosure Pattern (NEW - US-RL006)

```typescript
// Updated pattern based on ReviseForm.tsx + description hint

// 1. Track selected template for description lookup
const selectedTemplate = useMemo(() => {
  return researchTemplates.find((t) => t.meta.id === selectedTemplateId);
}, [researchTemplates, selectedTemplateId]);

// 2. Render dropdown + description hint
<div>
  <label className="block text-xs font-medium text-[var(--glass-text-muted)] mb-1.5">
    Research Style
  </label>

  {/* Dropdown with provenance badges */}
  <select
    data-testid="research-style-select"
    value={selectedTemplateId}
    onChange={(e) => setSelectedTemplateId(e.target.value)}
    className="w-full p-2 text-sm bg-[var(--glass-panel)] border border-[var(--glass-border)] rounded-lg"
  >
    {researchTemplates.map((template) => (
      <option key={template.meta.id} value={template.meta.id}>
        {template.payload.name}
        {template.payload.isDefault ? ' (Default)' : ''}
        {template.payload.source === 'system-seed' ? ' • System' : ''}
      </option>
    ))}
  </select>

  {/* Progressive disclosure: description hint (from template.payload.description) */}
  {selectedTemplate && (
    <p
      data-testid="research-style-hint"
      className="mt-1.5 text-xs text-[var(--glass-text-muted)] italic"
    >
      {selectedTemplate.payload.description}
    </p>
  )}
</div>
```

### Template Description Data Source

From `data/seeds/output-templates.json`:

| Template | `payload.name` | `payload.description` |
|----------|----------------|----------------------|
| ot-seed-quick-scan | Quick Scan | Rapid research overview with limited depth |
| ot-seed-deep-dive | Deep Dive | Exhaustive research exploration with maximum branching depth |
| ot-seed-academic | Academic Review | Scholarly literature review with citation emphasis |
| ot-seed-trends | Trend Analysis | Trend-focused research emphasizing temporal patterns |
