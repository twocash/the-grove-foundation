# User Stories, Acceptance Criteria & E2E Tests v2.0 Review

**Sprint:** Controller/Preset Architecture Epic
**Codename:** self-evident-objects
**Phase:** Story Extraction + Acceptance Criteria + E2E Test Specs
**Status:** Ready for Development

---

## Critical Observations

### 1. Design Brief Over-Engineering (RESOLVED)

The original Design Brief proposed three new components (ControllerCard, PresetPicker, ControllerSection) that were **rejected** by UX Chief review.

**Resolution:** Per `UX_STRATEGIC_DECISION.md`, only ONE new component is needed:
- `ActivePresetIndicator` - Small header chip with dropdown

All other UI uses existing patterns (OutputTemplateCard, OutputTemplateEditor).

### 2. Scope Clarification: Console Integration Sprint Only

The epic spans 5 sprints (S21-S25). This user story set covers **S23-CP-Console** only:
- Preset cards/editors (fork from existing)
- ActivePresetIndicator (new component)
- Controller hook integration

Schema (S21) and Engine (S22) are prerequisites. Migration (S24) and Federation (S25) are future.

### 3. Existing Pattern Reuse is Mandatory

**CRITICAL:** PresetCard and PresetEditor MUST fork from OutputTemplateCard/Editor, not create new patterns. The fork-to-customize flow is already implemented.

---

## Proposed v1.0 Simplifications

| Spec Feature | v1.0 Approach | Rationale |
|--------------|---------------|-----------|
| ControllerCard component | REJECTED | Use existing card grid with status badges |
| PresetPicker overlay | REJECTED | Grid + editor IS the picker |
| ControllerSection header | REJECTED | Existing console header suffices |
| Pinned Presets quick-switch | DEFER to v1.1 | Focus on core selection flow first |
| Controller settings modal | REJECTED | Selection is the only setting needed |
| Import flow UI | DEFER to S25 | Federation is a later sprint |

---

## Epic 1: Preset Display

### US-CP001: View Preset Cards in Grid

**As a** Cultivator (admin user)
**I want to** see Preset objects displayed as cards in the Experience Console grid
**So that** I can browse and select from available behavioral configurations

**INVEST Assessment:**
- **I**ndependent: Yes - can be developed after schema exists
- **N**egotiable: Yes - card layout can adjust
- **V**aluable: Yes - core visibility feature
- **E**stimable: Yes - fork from OutputTemplateCard
- **S**mall: Yes - single component fork
- **T**estable: Yes - cards render with correct data

**Acceptance Criteria:**

```gherkin
Scenario: Preset cards display in console grid
  Given I am viewing the Experience Console
  And there are 3 Prompt Presets in the system
  When I filter to show "Prompt Presets"
  Then I should see 3 cards in the grid
  And each card should display:
    | Element | Location |
    | Source badge (if not user-created) | Top-left |
    | Preset name | Center |
    | Description preview | Below name |
    | Status badge (Active/Draft/Archived) | Footer |

Scenario: Source badges display correctly
  Given I have Presets with different sources
  When I view the Preset cards
  Then source badges should display:
    | Source | Badge | Color |
    | system-seed | SYSTEM | Gray |
    | forked | FORKED | Blue |
    | imported | IMPORTED | Violet |
    | user-created | (none) | N/A |

Scenario: Active Preset is visually distinguished
  Given a Prompt Preset is set as active in the Controller
  When I view the Preset cards
  Then the active Preset card should show a green "Active" status badge
  And other Presets should show "Draft" or "Archived" badges
```

**E2E Test Specification:**

```typescript
// tests/e2e/controller-preset/preset-display.spec.ts

test.describe('Preset Card Display', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/bedrock');
    // Filter to Prompt Presets
    await page.click('[data-testid="filter-prompt-preset"]');
  });

  test('US-CP001: displays preset cards with correct elements', async ({ page }) => {
    // Assert cards render
    await expect(page.locator('[data-testid="preset-card"]')).toHaveCount(3);

    // Assert source badge on system-seed
    await expect(page.locator('[data-testid="source-badge-SYSTEM"]').first()).toBeVisible();

    // Visual Verification
    await expect(page).toHaveScreenshot('preset-grid-populated.png');
  });

  test('US-CP001: active preset shows green status badge', async ({ page }) => {
    const activeCard = page.locator('[data-testid="preset-card"]:has([data-testid="status-active"])');
    await expect(activeCard).toBeVisible();

    // Visual Verification
    await expect(activeCard).toHaveScreenshot('preset-card-active.png');
  });
});
```

**Visual Verification Points:**
| State | Screenshot | Description |
|-------|------------|-------------|
| Grid populated | `preset-grid-populated.png` | Multiple cards with various sources |
| Active card | `preset-card-active.png` | Card with green Active badge |
| System-seed card | `preset-card-system.png` | Card with SYSTEM badge |

**Traceability:** Design Brief Section 4.1 "Console Grid View", UX Decision "Preset Cards"

---

### US-CP002: View Preset Editor in Inspector

**As a** Cultivator
**I want to** click a Preset card to open its details in the inspector panel
**So that** I can view and edit the Preset configuration

**INVEST Assessment:**
- **I**ndependent: Yes - requires cards but self-contained
- **N**egotiable: Yes - section order flexible
- **V**aluable: Yes - enables editing
- **E**stimable: Yes - fork from OutputTemplateEditor
- **S**mall: Yes - single component fork
- **T**estable: Yes - inspector opens with correct data

**Acceptance Criteria:**

```gherkin
Scenario: Clicking card opens inspector
  Given I am viewing the Preset grid
  When I click on a Preset card
  Then the inspector panel should open on the right
  And it should display the Preset editor

Scenario: Editor shows correct sections
  Given I have opened a Preset in the inspector
  Then I should see the following sections:
    | Section | Contents |
    | Header | Icon, name, version, source label |
    | Basic Information | Name, description, agent type |
    | System Prompt | The prompt text (main content) |
    | Provenance | Source, forked from, version |
    | Metadata | Created/updated dates, ID |

Scenario: System-seed Preset shows fork banner
  Given I click on a system-seed Preset card
  When the inspector opens
  Then I should see a blue banner at the top
  And the banner should say "System Template (Read-Only)"
  And the banner should have a "Fork to Customize" button
  And all editable fields should be disabled
```

**E2E Test Specification:**

```typescript
test.describe('Preset Editor', () => {
  test('US-CP002: clicking card opens inspector', async ({ page }) => {
    await page.goto('/bedrock');
    await page.click('[data-testid="filter-prompt-preset"]');

    // Click first card
    await page.click('[data-testid="preset-card"]');

    // Assert inspector opens
    await expect(page.locator('[data-testid="inspector-panel"]')).toBeVisible();

    // Visual Verification
    await expect(page).toHaveScreenshot('preset-editor-open.png');
  });

  test('US-CP002: system-seed shows fork banner', async ({ page }) => {
    await page.goto('/bedrock');
    await page.click('[data-testid="filter-prompt-preset"]');

    // Click system-seed card
    await page.click('[data-testid="preset-card"]:has([data-testid="source-badge-SYSTEM"])');

    // Assert fork banner
    await expect(page.locator('[data-testid="system-seed-banner"]')).toBeVisible();
    await expect(page.locator('text=Fork to Customize')).toBeVisible();

    // Visual Verification
    await expect(page).toHaveScreenshot('preset-editor-system-seed.png');
  });
});
```

**Visual Verification Points:**
| State | Screenshot | Description |
|-------|------------|-------------|
| Editor open | `preset-editor-open.png` | Inspector with Preset details |
| System-seed | `preset-editor-system-seed.png` | Blue banner, disabled fields |
| User-created | `preset-editor-editable.png` | All fields enabled |

**Traceability:** Design Brief Section 2.2 "Editor Pattern", Section 6 "Fork-to-Customize Flow"

---

## Epic 2: Preset Actions

### US-CP003: Fork System-Seed Preset

**As a** Cultivator
**I want to** fork a system-seed Preset to create my own customizable version
**So that** I can modify the configuration while preserving the original

**INVEST Assessment:**
- **I**ndependent: Yes - core action
- **N**egotiable: No - fork flow is defined
- **V**aluable: Yes - primary customization mechanism
- **E**stimable: Yes - OutputTemplateEditor already implements this
- **S**mall: Yes - single action
- **T**estable: Yes - new object created with correct metadata

**Acceptance Criteria:**

```gherkin
Scenario: Fork creates new Preset
  Given I am viewing a system-seed Preset in the inspector
  When I click "Fork to Customize"
  Then a new Preset should be created with:
    | Field | Value |
    | name | "My {original name}" |
    | source | "forked" |
    | forkedFromId | {original Preset ID} |
    | status | "draft" |
  And the inspector should switch to the new Preset
  And all fields should be editable

Scenario: Fork handles name collision
  Given a Preset named "My Default Grove Prompt" already exists
  When I fork the "Default Grove Prompt" system-seed
  Then the new Preset should be named "My Default Grove Prompt (2)"

Scenario: Forked Preset shows provenance
  Given I have forked a system-seed Preset
  When I view the Provenance section
  Then I should see "Forked From: {original name}"
  And I should see the FORKED source badge
```

**E2E Test Specification:**

```typescript
test.describe('Fork Preset', () => {
  test('US-CP003: fork creates new preset with correct metadata', async ({ page }) => {
    await page.goto('/bedrock');
    await page.click('[data-testid="filter-prompt-preset"]');

    // Click system-seed card
    await page.click('[data-testid="preset-card"]:has([data-testid="source-badge-SYSTEM"])');

    // Click fork button
    await page.click('text=Fork to Customize');

    // Assert new preset is selected
    await expect(page.locator('[data-testid="inspector-title"]')).toContainText('My');
    await expect(page.locator('[data-testid="source-label"]')).toContainText('Forked');

    // Assert fields are editable
    await expect(page.locator('[data-testid="name-input"]')).toBeEnabled();

    // Visual Verification
    await expect(page).toHaveScreenshot('preset-after-fork.png');
  });
});
```

**Visual Verification Points:**
| State | Screenshot | Description |
|-------|------------|-------------|
| After fork | `preset-after-fork.png` | New preset selected, FORKED badge |
| Fork loading | `preset-fork-loading.png` | Spinner during fork |

**Traceability:** Design Brief Section 6 "Fork-to-Customize Flow", Vision Paper Section 2.2

---

### US-CP004: Publish Draft Preset

**As a** Cultivator
**I want to** publish a draft Preset to make it available for selection
**So that** the configuration can be used by the system

**INVEST Assessment:**
- **I**ndependent: Yes
- **N**egotiable: Yes
- **V**aluable: Yes - activates configuration
- **E**stimable: Yes - existing pattern
- **S**mall: Yes
- **T**estable: Yes

**Acceptance Criteria:**

```gherkin
Scenario: Publish changes status to active
  Given I am editing a draft Preset
  And I have saved my changes
  When I click "Publish Template"
  Then the Preset status should change to "active"
  And the card should show a green "Active" badge

Scenario: Cannot publish with unsaved changes
  Given I am editing a draft Preset
  And I have unsaved changes
  Then the "Publish Template" button should be disabled
  And hovering should show tooltip "Save changes before publishing"
```

**E2E Test Specification:**

```typescript
test('US-CP004: publish changes status to active', async ({ page }) => {
  // Navigate to draft preset
  await page.goto('/bedrock');
  await page.click('[data-testid="preset-card"]:has([data-testid="status-draft"])');

  // Click publish
  await page.click('text=Publish Template');

  // Assert status changed
  await expect(page.locator('[data-testid="status-badge"]')).toContainText('Active');

  // Visual Verification
  await expect(page).toHaveScreenshot('preset-after-publish.png');
});
```

**Traceability:** Design Brief Section 2.2 "Editor Pattern" footer actions

---

### US-CP005: Archive Active Preset

**As a** Cultivator
**I want to** archive an active Preset that I no longer need
**So that** it's removed from active selection without being deleted

**INVEST Assessment:**
- **I**ndependent: Yes
- **N**egotiable: Yes
- **V**aluable: Yes
- **E**stimable: Yes
- **S**mall: Yes
- **T**estable: Yes

**Acceptance Criteria:**

```gherkin
Scenario: Archive changes status to archived
  Given I am viewing an active user-created Preset
  When I click "Archive"
  Then the Preset status should change to "archived"
  And the card should show a gray "Archived" badge

Scenario: Cannot archive system-seed
  Given I am viewing a system-seed Preset
  Then no Archive option should be available
```

**E2E Test Specification:**

```typescript
test('US-CP005: archive changes status to archived', async ({ page }) => {
  await page.goto('/bedrock');
  await page.click('[data-testid="preset-card"]:has([data-testid="status-active"]):not(:has([data-testid="source-badge-SYSTEM"]))');

  await page.click('text=Archive');

  await expect(page.locator('[data-testid="status-badge"]')).toContainText('Archived');

  // Visual Verification
  await expect(page).toHaveScreenshot('preset-after-archive.png');
});
```

**Traceability:** Design Brief Section 2.2 "Editor Pattern"

---

## Epic 3: Active Preset Indicator

### US-CP006: Display Active Preset in Header

**As a** Cultivator
**I want to** see which Preset is currently active at a glance in the console header
**So that** I know the current system configuration without scrolling

**INVEST Assessment:**
- **I**ndependent: Yes - can be built after Controller hook exists
- **N**egotiable: Yes - visual details flexible
- **V**aluable: Yes - key visibility feature per UX decision
- **E**stimable: Yes - small component
- **S**mall: Yes - ~50 lines
- **T**estable: Yes - indicator shows correct preset

**Acceptance Criteria:**

```gherkin
Scenario: Active indicator displays in header
  Given a Prompt Preset is active
  When I view the Prompt Presets console
  Then I should see an ActivePresetIndicator in the header
  And it should show:
    | Element | Value |
    | Green pulsing dot | Indicating "active" |
    | Label | "Active:" |
    | Preset name | e.g., "Default Grove" |
    | Source badge | If system-seed or forked |
    | Chevron | Indicating dropdown |

Scenario: Indicator shows loading state
  Given a Preset switch is in progress
  When I view the indicator
  Then the green dot should be replaced with a spinner
```

**E2E Test Specification:**

```typescript
test.describe('ActivePresetIndicator', () => {
  test('US-CP006: displays active preset in header', async ({ page }) => {
    await page.goto('/bedrock');
    await page.click('[data-testid="filter-prompt-preset"]');

    // Assert indicator visible
    const indicator = page.locator('[data-testid="active-preset-indicator"]');
    await expect(indicator).toBeVisible();

    // Assert shows preset name
    await expect(indicator).toContainText('Default Grove');

    // Assert green dot
    await expect(indicator.locator('[data-testid="active-dot"]')).toHaveCSS('background-color', 'rgb(34, 197, 94)');

    // Visual Verification
    await expect(indicator).toHaveScreenshot('active-indicator-normal.png');
  });
});
```

**Visual Verification Points:**
| State | Screenshot | Description |
|-------|------------|-------------|
| Normal | `active-indicator-normal.png` | Green dot, name, chevron |
| Hover | `active-indicator-hover.png` | Highlighted background |
| Loading | `active-indicator-loading.png` | Spinner replacing dot |

**Traceability:** UX Strategic Decision "ActivePresetIndicator" specification

---

### US-CP007: Quick-Switch via Indicator Dropdown

**As a** Cultivator
**I want to** click the ActivePresetIndicator to switch between Presets quickly
**So that** I can change configuration without scrolling through the grid

**INVEST Assessment:**
- **I**ndependent: Yes
- **N**egotiable: Yes - could start with scroll-to-active
- **V**aluable: Yes - power user efficiency
- **E**stimable: Yes
- **S**mall: Yes
- **T**estable: Yes

**Acceptance Criteria:**

```gherkin
Scenario: Clicking indicator opens dropdown
  Given I am viewing the console with ActivePresetIndicator
  When I click on the indicator
  Then a dropdown should appear below it
  And it should list all active/draft Presets
  And each item should show: name, source badge (if applicable)
  And the current active Preset should have a checkmark

Scenario: Selecting from dropdown switches active
  Given the indicator dropdown is open
  When I click on a different Preset
  Then the Controller.activePresetId should update
  And the dropdown should close
  And the indicator should show the newly selected Preset name
```

**E2E Test Specification:**

```typescript
test.describe('ActivePresetIndicator Dropdown', () => {
  test('US-CP007: clicking opens dropdown', async ({ page }) => {
    await page.goto('/bedrock');
    await page.click('[data-testid="filter-prompt-preset"]');

    // Click indicator
    await page.click('[data-testid="active-preset-indicator"]');

    // Assert dropdown visible
    await expect(page.locator('[data-testid="preset-dropdown"]')).toBeVisible();

    // Visual Verification
    await expect(page).toHaveScreenshot('active-indicator-dropdown-open.png');
  });

  test('US-CP007: selecting switches active preset', async ({ page }) => {
    await page.goto('/bedrock');
    await page.click('[data-testid="filter-prompt-preset"]');
    await page.click('[data-testid="active-preset-indicator"]');

    // Select different preset
    await page.click('[data-testid="dropdown-item"]:nth-child(2)');

    // Assert indicator updated
    await expect(page.locator('[data-testid="active-preset-indicator"]')).not.toContainText('Default Grove');

    // Assert dropdown closed
    await expect(page.locator('[data-testid="preset-dropdown"]')).not.toBeVisible();
  });
});
```

**Visual Verification Points:**
| State | Screenshot | Description |
|-------|------------|-------------|
| Dropdown open | `active-indicator-dropdown-open.png` | List of presets |
| After switch | `active-indicator-after-switch.png` | New name shown |

**Traceability:** UX Strategic Decision "Interaction" section

---

## Epic 4: Controller Integration

### US-CP008: Controller Hook Provides Active Preset

**As a** developer
**I want to** access the active Preset via `useController(type)` hook
**So that** any component can read/write the active configuration

**INVEST Assessment:**
- **I**ndependent: Yes - requires schema
- **N**egotiable: Yes - API details flexible
- **V**aluable: Yes - core infrastructure
- **E**stimable: Yes
- **S**mall: Yes - single hook
- **T**estable: Yes - returns correct data

**Acceptance Criteria:**

```gherkin
Scenario: Hook returns active preset
  Given a PromptController exists with activePresetId set
  When I call useController('prompt')
  Then I should receive:
    | Field | Type |
    | activePreset | GroveObject<PresetPayload> or null |
    | presets | GroveObject<PresetPayload>[] |
    | setActive | (presetId: string) => Promise<void> |
    | loading | boolean |

Scenario: setActive updates controller
  Given I have access to the controller hook
  When I call setActive(newPresetId)
  Then Controller.activePresetId should update
  And the activePreset should reflect the new selection
```

**Traceability:** UX Strategic Decision "Phase 3: Controller Logic"

---

## Deferred to v1.1

### US-CP-D01: Pinned Presets Quick-Switch (DEFERRED)

**Reason:** Focus on core selection flow first. Pins add complexity.

**Original Flow:** Controller shows pinned presets for one-click switching.

**v1.1 Prerequisite:** Core selection flow working and validated.

---

### US-CP-D02: Controller Settings Modal (DEFERRED)

**Reason:** Selection is the only setting needed for v1.0.

**Original Flow:** Gear icon opens modal to manage pins.

**v1.1 Prerequisite:** Need for settings validated by user feedback.

---

### US-CP-D03: Import Flow UI (DEFERRED)

**Reason:** Federation is S25, separate sprint.

**Original Flow:** Import button validates and creates Preset from external source.

**v1.1 Prerequisite:** Federation architecture complete.

---

## Open Questions

1. **Filter Behavior:** Should the Preset console default to showing all sources, or filter by default to hide archived? (Recommend: default to Active + Draft)

2. **Empty State:** If no Presets exist for a type (unlikely given system-seeds), what should the empty state show? (Recommend: "No presets. System seeds will be created on first use.")

---

## E2E Test Summary

### Test File Structure

```
tests/e2e/controller-preset/
├── preset-display.spec.ts      # US-CP001, US-CP002
├── preset-actions.spec.ts      # US-CP003, US-CP004, US-CP005
├── active-indicator.spec.ts    # US-CP006, US-CP007
└── fixtures/
    └── preset-seeds.ts         # Test data setup
```

### Screenshot Baselines Required

| Screenshot | Story | State |
|------------|-------|-------|
| `preset-grid-populated.png` | US-CP001 | Grid with multiple cards |
| `preset-card-active.png` | US-CP001 | Card with Active badge |
| `preset-card-system.png` | US-CP001 | Card with SYSTEM badge |
| `preset-editor-open.png` | US-CP002 | Inspector with preset |
| `preset-editor-system-seed.png` | US-CP002 | Fork banner visible |
| `preset-editor-editable.png` | US-CP002 | User preset, fields enabled |
| `preset-after-fork.png` | US-CP003 | New forked preset selected |
| `preset-after-publish.png` | US-CP004 | Active badge shown |
| `preset-after-archive.png` | US-CP005 | Archived badge shown |
| `active-indicator-normal.png` | US-CP006 | Indicator in header |
| `active-indicator-hover.png` | US-CP006 | Hover state |
| `active-indicator-loading.png` | US-CP006 | Loading spinner |
| `active-indicator-dropdown-open.png` | US-CP007 | Dropdown visible |
| `active-indicator-after-switch.png` | US-CP007 | New selection |

### Test Data Requirements

| Test | Required Data | Setup Method |
|------|---------------|--------------|
| US-CP001 | 3 Prompt Presets (system-seed, forked, user) | Seed via API |
| US-CP002 | Same as above | Reuse |
| US-CP003 | 1 system-seed Preset | Seed via API |
| US-CP004 | 1 draft Preset | Create in test |
| US-CP005 | 1 active user-created Preset | Seed via API |
| US-CP006 | Active Controller with Preset | Seed via API |
| US-CP007 | Controller + 3 Presets | Seed via API |

---

## Summary

| Story ID | Title | Priority | Complexity | E2E Tests |
|----------|-------|----------|------------|-----------|
| US-CP001 | View Preset Cards in Grid | P0 | S | 2 |
| US-CP002 | View Preset Editor in Inspector | P0 | S | 2 |
| US-CP003 | Fork System-Seed Preset | P0 | S | 1 |
| US-CP004 | Publish Draft Preset | P0 | S | 1 |
| US-CP005 | Archive Active Preset | P1 | S | 1 |
| US-CP006 | Display Active Preset in Header | P0 | S | 1 |
| US-CP007 | Quick-Switch via Indicator Dropdown | P1 | M | 2 |
| US-CP008 | Controller Hook Provides Active Preset | P0 | S | N/A (unit tests) |

**Total v1.0 Stories:** 8
**Total E2E Tests:** 10
**Visual Verification Points:** 14
**Deferred:** 3

---

## DEX Alignment Verification

| Pillar | How Stories Support |
|--------|---------------------|
| **Declarative Sovereignty** | US-CP003 (Fork) + US-CP004 (Publish) enable non-developers to customize behavior via UI. No code changes needed. |
| **Capability Agnosticism** | Presets work regardless of model. Stories focus on configuration, not execution. |
| **Provenance as Infrastructure** | US-CP001 (Source badges) + US-CP003 (forkedFromId) ensure origin is always visible and tracked. |
| **Organic Scalability** | All stories use existing card/editor patterns. New Preset types will automatically work. |

---

*User Story Refinery v2.0 | Grove Product Pod | January 2026*
