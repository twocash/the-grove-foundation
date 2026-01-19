# Developer Execution Prompt: S15-BD-FederationEditors-v1

## Mission

Refactor all 4 Federation Console editors to use the factory pattern established in ExperienceConsole. Transform unusable scaffolds into production-ready inspector panels.

---

## Your Contract

```
You are acting as DEVELOPER for: S15-BD-FederationEditors-v1

MISSION: Refactor Federation editors to match factory pattern with
         InspectorSection, BufferedInput, and shared components.

SPEC: docs/sprints/s15-bd-federation-editors-v1/SPEC.md
VISION: docs/sprints/s9-sl-federation-v1/INSPECTOR_PANEL_UX_VISION.md
CONTRACT: docs/BEDROCK_SPRINT_CONTRACT.md (Article XI)

EXECUTION PROTOCOL:
1. Create shared components (StatusBanner, GroveConnectionDiagram, ProgressScoreBar)
2. Refactor each editor using shared components
3. Run E2E tests after each editor: npx playwright test --grep "US-F0"
4. Capture screenshots for visual QA
5. Verify accessibility per US-FE-009 checklist

DONE CRITERIA:
- All 4 editors use InspectorSection, InspectorDivider
- All 4 editors use BufferedInput for text fields
- All 4 editors have footer action pattern (Save, Duplicate, Delete)
- 35/35 E2E tests pass
- Screenshots in docs/sprints/s15-bd-federation-editors-v1/screenshots/
- Article XI checklist complete in SPEC.md

Write status to: .agent/status/current/{NNN}-{timestamp}-developer.md
Template: .agent/status/ENTRY_TEMPLATE.md
```

---

## Phase Execution Order

### Phase 1: Foundation (Day 1 - Morning)

**Goal:** Create shared components for use across all editors.

#### Task 1.1: StatusBanner Component

**File:** `src/bedrock/components/StatusBanner.tsx`

```typescript
// Interface from SPEC.md
interface StatusBannerProps {
  status: 'connected' | 'disconnected' | 'pending' | 'failed' | 'active' | 'inactive';
  label?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}
```

**Requirements:**
- Colored background based on status (green/amber/red/gray)
- Pulsing dot indicator
- Optional action buttons on right side
- Test ID: `status-banner`

#### Task 1.2: GroveConnectionDiagram Component

**File:** `src/bedrock/components/GroveConnectionDiagram.tsx`

```typescript
interface GroveConnectionDiagramProps {
  sourceGrove: string;
  targetGrove: string;
  sourceLabel?: string;
  targetLabel?: string;
  onSourceChange?: (value: string) => void;
  onTargetChange?: (value: string) => void;
  readonly?: boolean;
  icon?: React.ReactNode;
  className?: string;
}
```

**Requirements:**
- Visual diagram: [Source Icon + Input] ↔ [Target Icon + Input]
- Stacks vertically on mobile (sm: breakpoint)
- Test ID: `grove-connection-diagram`, `source-grove`, `target-grove`

#### Task 1.3: ProgressScoreBar Component

**File:** `src/bedrock/components/ProgressScoreBar.tsx`

```typescript
interface ProgressScoreBarProps {
  value: number;
  showValue?: boolean;
  markers?: Array<{ position: number; label: string }>;
  gradient?: { from: string; to: string };
  height?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

**Requirements:**
- Filled bar proportional to value (0-100)
- Gradient colors (default: green → cyan)
- Optional markers below bar
- Test ID: `progress-score-bar`

**Verify Phase 1:**
```bash
# Ensure components compile
npm run build

# Capture component screenshots (manual or Storybook)
```

---

### Phase 2: GroveEditor Refactor (Day 1 - Afternoon)

**File:** `src/bedrock/consoles/FederationConsole/GroveEditor.tsx`

**Reference:** `INSPECTOR_PANEL_UX_VISION.md` → GroveEditor Wireframe

#### Structure

```
<div data-testid="grove-editor">
  <StatusBanner status={connectionStatus} ... />

  <div className="flex-1 overflow-y-auto">
    <InspectorSection title="Identity">
      - Grove Name (BufferedInput)
      - Description (BufferedTextarea)
      - Grove ID (readonly badge)
    </InspectorSection>

    <InspectorDivider />

    <InspectorSection title="Connection">
      - Status (select)
      - Connection Status (select)
      - Endpoint (BufferedInput)
      - Trust Score (ProgressScoreBar)
    </InspectorSection>

    <InspectorDivider />

    <InspectorSection title="Technical" collapsible>
      - Tier System Name (BufferedInput)
      - Tiers List (custom list component)
      - Capabilities (pill/tag input)
    </InspectorSection>

    <InspectorDivider />

    <InspectorSection title="Statistics" collapsible>
      - 4 stat cards (readonly)
    </InspectorSection>
  </div>

  <FooterActions onSave={...} onDelete={...} onDuplicate={...} />
</div>
```

**Verify:**
```bash
npx playwright test --grep "US-F003\|US-F004\|US-F005" --project=e2e
```

---

### Phase 3: TierMappingEditor Refactor (Day 2 - Morning)

**File:** `src/bedrock/consoles/FederationConsole/TierMappingEditor.tsx`

**Reference:** `INSPECTOR_PANEL_UX_VISION.md` → TierMappingEditor Wireframe

#### Structure

```
<div data-testid="tier-mapping-editor">
  <Header with status badge />

  <div className="flex-1 overflow-y-auto">
    <InspectorSection title="Grove Pair">
      - GroveConnectionDiagram (source → target)
    </InspectorSection>

    <InspectorDivider />

    <InspectorSection title="Status & Confidence">
      - Mapping Status (select)
      - Confidence Score (ProgressScoreBar with slider)
    </InspectorSection>

    <InspectorDivider />

    <InspectorSection title="Tier Equivalences">
      - Equivalence rows (source → target with type badge)
      - Add mapping form
    </InspectorSection>

    <InspectorDivider />

    <InspectorSection title="Validation" collapsible>
      - Validated At, Validated By (readonly)
    </InspectorSection>
  </div>

  <FooterActions ... />
</div>
```

**Verify:**
```bash
npx playwright test --grep "US-F006\|US-F007" --project=e2e
```

---

### Phase 4: ExchangeEditor Refactor (Day 2 - Afternoon)

**File:** `src/bedrock/consoles/FederationConsole/ExchangeEditor.tsx`

**Reference:** `INSPECTOR_PANEL_UX_VISION.md` → ExchangeEditor Wireframe

#### Structure

```
<div data-testid="exchange-editor">
  <StatusBanner status={exchangeStatus} actions={ApproveReject if pending} />
  <Header with token badge />

  <div className="flex-1 overflow-y-auto">
    <InspectorSection title="Exchange Type">
      - Direction (select)
      - Content Type (select)
      - Token Cost Preview (ProgressScoreBar variant)
    </InspectorSection>

    <InspectorDivider />

    <InspectorSection title="Grove Parties">
      - GroveConnectionDiagram (requesting ↔ providing)
    </InspectorSection>

    <InspectorDivider />

    <InspectorSection title="Content Details">
      - Search Query (BufferedTextarea)
      - Content ID (BufferedInput)
    </InspectorSection>

    <InspectorDivider />

    <InspectorSection title="Tier Mapping" collapsible>
      - Source/Mapped tier fields
    </InspectorSection>

    <InspectorDivider />

    <InspectorSection title="Status">
      - Current Status (select)
      - Final Token Value (number input)
    </InspectorSection>

    <InspectorDivider />

    <InspectorSection title="Timeline" collapsible>
      - Vertical timeline component
    </InspectorSection>
  </div>

  <FooterActions ... />
</div>
```

**Verify:**
```bash
npx playwright test --grep "US-F008\|US-F009\|US-F010" --project=e2e
```

---

### Phase 5: TrustEditor Refactor (Day 3 - Morning)

**File:** `src/bedrock/consoles/FederationConsole/TrustEditor.tsx`

**Reference:** `INSPECTOR_PANEL_UX_VISION.md` → TrustEditor Wireframe

#### Structure

```
<div data-testid="trust-editor">
  <TrustLevelBanner stars={level} score={score} multiplier={multiplier} />
  <Header with multiplier badge />

  <div className="flex-1 overflow-y-auto">
    <InspectorSection title="Grove Pair">
      - GroveConnectionDiagram
    </InspectorSection>

    <InspectorDivider />

    <InspectorSection title="Overall Trust">
      - Stars + Score + Multiplier display
      - ProgressScoreBar with level markers
    </InspectorSection>

    <InspectorDivider />

    <InspectorSection title="Component Scores">
      - Exchange Success (35%) - slider + ProgressScoreBar
      - Tier Accuracy (25%) - slider + ProgressScoreBar
      - Response Time (15%) - slider + ProgressScoreBar
      - Content Quality (25%) - slider + ProgressScoreBar
    </InspectorSection>

    <InspectorDivider />

    <InspectorSection title="Exchange Statistics" collapsible>
      - Total/Successful inputs + rate display
    </InspectorSection>

    <InspectorDivider />

    <InspectorSection title="Verification" collapsible>
      - Verified By, Verified At
    </InspectorSection>

    <InspectorDivider />

    <InspectorSection title="Recent Activity" collapsible>
      - Activity list
    </InspectorSection>
  </div>

  <FooterActions ... />
</div>
```

**Verify:**
```bash
npx playwright test --grep "US-F011\|US-F012\|US-F013" --project=e2e
```

---

### Phase 6: Quality Pass (Day 3 - Afternoon)

#### 6.1 Accessibility Verification

Per US-FE-009, verify each editor:

- [ ] All inputs have `id`
- [ ] All labels have `htmlFor` matching input `id`
- [ ] Help text linked via `aria-describedby`
- [ ] Required fields have `aria-required="true"`
- [ ] Icon buttons have `aria-label`
- [ ] Tab order is logical
- [ ] Focus visible on all elements

**Test with keyboard only:** Tab through entire form.

#### 6.2 Mobile Responsiveness

Per US-FE-010, verify at 360px width:

```bash
# Run Playwright at mobile viewport
npx playwright test --project=e2e-mobile federation-console-v1.spec.ts
```

- [ ] No horizontal overflow
- [ ] Two-column grids stack
- [ ] Touch targets ≥44px
- [ ] Footer actions accessible

#### 6.3 Full Test Suite

```bash
# Run all Federation tests
npx playwright test federation-console-v1.spec.ts --project=e2e

# Expected: 35 passed
```

#### 6.4 Screenshots

Capture for each editor:
- Default state (object selected)
- With changes pending (Save button active)
- Mobile width (360px)

Save to: `docs/sprints/s15-bd-federation-editors-v1/screenshots/`

---

## Quick Reference

### Import Pattern

```typescript
// Layout primitives
import { InspectorSection, InspectorDivider } from '../../primitives/BedrockInspector';

// Buffered inputs
import { BufferedInput, BufferedTextarea } from '../../primitives/BufferedInput';

// New shared components
import { StatusBanner } from '../../components/StatusBanner';
import { GroveConnectionDiagram } from '../../components/GroveConnectionDiagram';
import { ProgressScoreBar } from '../../components/ProgressScoreBar';
```

### Field Pattern

```typescript
<div>
  <label
    htmlFor="grove-name"
    className="block text-xs text-[var(--glass-text-muted)] mb-1"
  >
    Grove Name
  </label>
  <BufferedInput
    id="grove-name"
    value={payload.name}
    onChange={(v) => patchPayload('name', v)}
    placeholder="My Grove Community"
    aria-describedby="grove-name-help"
    className="w-full px-3 py-2 rounded-lg bg-[var(--glass-solid)]
               border border-[var(--glass-border)] text-[var(--glass-text-primary)]
               placeholder:text-[var(--glass-text-subtle)]
               focus:outline-none focus:border-[var(--neon-cyan)]
               focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
  />
  <p id="grove-name-help" className="text-xs text-[var(--glass-text-muted)] mt-1">
    A descriptive name for this grove
  </p>
</div>
```

### Footer Pattern

```typescript
<div className="px-4 py-3 border-t border-[var(--glass-border)] space-y-3">
  <button
    disabled={!hasChanges}
    onClick={onSave}
    className="w-full px-4 py-2.5 rounded-lg bg-[var(--neon-cyan)]
               text-[var(--glass-void)] font-medium
               hover:bg-[var(--neon-cyan)]/90
               disabled:opacity-50 disabled:cursor-not-allowed"
  >
    Save Changes
  </button>
  <div className="flex items-center gap-2">
    <button
      onClick={onDuplicate}
      className="flex-1 px-4 py-2 rounded-lg border border-[var(--glass-border)]
                 text-[var(--glass-text-secondary)] hover:bg-[var(--glass-elevated)]"
    >
      <span className="material-symbols-outlined text-sm mr-1">content_copy</span>
      Duplicate
    </button>
    <button
      onClick={onDelete}
      className="flex-1 px-4 py-2 rounded-lg border border-red-500/30
                 text-red-400 hover:bg-red-500/10"
    >
      <span className="material-symbols-outlined text-sm mr-1">delete</span>
      Delete
    </button>
  </div>
</div>
```

---

## Debug Protocol

### If E2E Test Fails

1. Run headed mode:
   ```bash
   npx playwright test --grep "US-F007" --headed --debug
   ```

2. Check for console errors

3. Verify test IDs match:
   - `data-testid="grove-editor"`
   - `data-testid="inspector-section"`
   - `data-testid="status-banner"`

4. Check component renders at test viewport

### If Mobile Layout Breaks

1. Open browser dev tools at 360px width
2. Check for horizontal scrollbar
3. Verify grid uses `sm:grid-cols-2` (stacks on mobile)
4. Check touch target sizes

---

## Completion Checklist

Before marking sprint COMPLETE:

### Article XI Checklist (Update in SPEC.md)

- [ ] Uses `InspectorPanel` as outer shell
- [ ] Uses `InspectorSection` for all field groups
- [ ] Uses `InspectorDivider` between sections
- [ ] Standard padding applied
- [ ] No inline style overrides for spacing
- [ ] Identity section present
- [ ] Configuration section present
- [ ] Metadata section (collapsed by default)
- [ ] Maximum 6 fields per section
- [ ] All fields have visible labels
- [ ] Required fields marked
- [ ] Complex data uses appropriate pattern
- [ ] Timestamps formatted
- [ ] Tested at 360px width
- [ ] No horizontal overflow
- [ ] Save button visible when changes exist
- [ ] Delete action present

### Visual QA

- [ ] Screenshots in `screenshots/` directory
- [ ] All 4 editors captured
- [ ] Mobile screenshots included

### Tests

- [ ] 35/35 E2E tests pass
- [ ] No console errors during test run

---

## Status Entry Template

```yaml
---
timestamp: 2026-01-XX
sprint: s15-bd-federation-editors-v1
status: IN_PROGRESS
agent: developer
branch: main
heartbeat: 2026-01-XX
severity: INFO
phase: Phase N - Description
---

## {timestamp} | S15-BD-FederationEditors | Phase N

**Agent:** Developer
**Status:** IN_PROGRESS
**Summary:** {What was done}

**Editors Refactored:** {list}
**Tests Passing:** {count}/35
**Screenshots:** {count}

**Next:** Phase N+1
```

---

*Execute faithfully. The wireframes are your source of truth.*
