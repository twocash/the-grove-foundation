# Sprint Breakdown: sprout-declarative-v1

**Sprint:** sprout-declarative-v1  
**Duration:** 5 Epics  
**Date:** December 30, 2024  

---

## Epic Overview

| Epic | Name | Stories | Focus |
|------|------|---------|-------|
| 1 | Declarative Foundation | 4 | JSON configs, schema extension, bug fix |
| 2 | Multi-Action Selection | 3 | ActionMenu, MagneticPill integration |
| 3 | Research Manifest Card | 4 | Capture UI, stage badges |
| 4 | Prompt Generation | 3 | Template engine, preview modal |
| 5 | Testing & Polish | 3 | E2E tests, visual baselines |

---

## Epic 1: Declarative Foundation

**Goal:** Extract hardcoded config to JSON, extend schema with stages and research manifest.

### Story 1.1: Create JSON Config Files

**Context:** Actions, stages, and purposes currently hardcoded. Extract to declarative JSON.

**Task:** Create `data/selection-actions.json`, `data/sprout-stages.json`, `data/research-purposes.json` with corresponding JSON schemas.

**Files:**
- CREATE: `data/selection-actions.json`
- CREATE: `data/selection-actions.schema.json`
- CREATE: `data/sprout-stages.json`
- CREATE: `data/sprout-stages.schema.json`
- CREATE: `data/research-purposes.json`
- CREATE: `data/research-purposes.schema.json`

**Acceptance:**
- [ ] All JSON files valid against schemas
- [ ] TypeScript can import JSON with type inference

### Story 1.2: Extend Sprout Schema

**Context:** Sprout needs `stage` field (8 values) and optional `researchManifest`.

**Task:** Add `SproutStage`, `ResearchManifest`, `ResearchPurpose`, `ResearchClue` types to `sprout.ts`.

**Files:**
- MODIFY: `src/core/schema/sprout.ts`

**Acceptance:**
- [ ] `SproutStage` type has 8 values
- [ ] `ResearchManifest` interface defined
- [ ] `Sprout` interface extended with `stage` and `researchManifest?`
- [ ] `status` field marked `@deprecated`

### Story 1.3: Storage Migration v2 → v3

**Context:** Existing sprouts need `stage` field derived from `status`.

**Task:** Add `migrateStorageToV3` function, update storage loading.

**Files:**
- MODIFY: `src/lib/storage/sprout-storage.ts`
- MODIFY: `src/core/schema/sprout.ts` (add migration)

**Acceptance:**
- [ ] Existing sprouts load with `stage` field
- [ ] `status: 'sprout'` → `stage: 'tender'`
- [ ] `status: 'sapling'` → `stage: 'rooting'`
- [ ] `status: 'tree'` → `stage: 'established'`

### Story 1.4: Fix MagneticPill Scale Bug

**Context:** Scale calculation inverted — increases when cursor moves away.

**Task:** Fix distance calculation in MagneticPill magnetic effect.

**Files:**
- MODIFY: `src/surface/components/KineticStream/Capture/components/MagneticPill.tsx`

**Acceptance:**
- [ ] Scale increases as cursor approaches pill
- [ ] Scale returns to 1.0 when cursor leaves magnetic range
- [ ] Manual visual verification passes

### Build Gate

```bash
npm run build          # Compiles
npm test               # Unit tests pass
npm run lint           # No lint errors
```

---

## Epic 2: Multi-Action Selection

**Goal:** MagneticPill opens ActionMenu, user selects action type.

### Story 2.1: Create useSelectionActions Hook

**Context:** Engine that loads action config and resolves available actions.

**Task:** Create hook that reads `selection-actions.json` and provides action list.

**Files:**
- CREATE: `src/surface/components/KineticStream/Capture/hooks/useSelectionActions.ts`

**Acceptance:**
- [ ] Hook returns `actions` array from config
- [ ] Each action has `id`, `label`, `icon`, `captureCard`
- [ ] Hook provides `getActionById(id)` helper

### Story 2.2: Create ActionMenu Component

**Context:** Floating menu showing available capture actions.

**Task:** Build ActionMenu that renders action options from config.

**Files:**
- CREATE: `src/surface/components/KineticStream/Capture/components/ActionMenu.tsx`

**Acceptance:**
- [ ] Renders action cards from config
- [ ] Keyboard navigation (arrow keys, enter)
- [ ] Click selects action, calls `onSelect(actionId)`
- [ ] ESC closes menu

### Story 2.3: Integrate ActionMenu with MagneticPill

**Context:** Pill click opens ActionMenu instead of directly opening card.

**Task:** Wire MagneticPill → ActionMenu → appropriate CaptureCard.

**Files:**
- MODIFY: `src/surface/components/KineticStream/Capture/components/MagneticPill.tsx`
- MODIFY: `src/surface/components/KineticStream/Capture/index.ts` (orchestration)

**Acceptance:**
- [ ] Pill click shows ActionMenu
- [ ] "Plant Sprout" action opens SproutCaptureCard
- [ ] "Research Directive" action opens ResearchManifestCard (Story 3.1)
- [ ] Single action available → skip menu, open card directly

### Build Gate

```bash
npm run build
npm test
npx playwright test tests/e2e/sprout-capture.spec.ts
```

---

## Epic 3: Research Manifest Card

**Goal:** UI for capturing research intent with purpose, clues, and directions.

### Story 3.1: Create ResearchManifestCard Component

**Context:** Form for research capture with purpose selector, clue list, direction list.

**Task:** Build ResearchManifestCard with all input fields.

**Files:**
- CREATE: `src/surface/components/KineticStream/Capture/components/ResearchManifestCard.tsx`

**Acceptance:**
- [ ] Shows selected text preview
- [ ] Purpose selector (5 options from config)
- [ ] Clue list with type selector and add/remove
- [ ] Direction list with add/remove
- [ ] Tags input (reuse from SproutCaptureCard)
- [ ] "Save Draft" creates sprout with `stage: 'rooting'`

### Story 3.2: Add Stage Badges to SproutCard

**Context:** Cards should show current stage with appropriate icon/color.

**Task:** Add StageBadge component, wire to SproutCard.

**Files:**
- MODIFY: `src/surface/components/KineticStream/Capture/components/SproutCard.tsx`
- MODIFY: `src/app/globals.css` (stage tokens)

**Acceptance:**
- [ ] Badge shows stage icon and color from config
- [ ] All 8 stages render correctly
- [ ] Badge tooltip shows stage name

### Story 3.3: Research Sprout Display in Tray

**Context:** Research sprouts should show manifest summary, edit action.

**Task:** Extend SproutCard to show research indicator, add edit button.

**Files:**
- MODIFY: `src/surface/components/KineticStream/Capture/components/SproutCard.tsx`
- MODIFY: `src/surface/components/KineticStream/Capture/components/SproutTray.tsx`

**Acceptance:**
- [ ] Research sprouts show 🔬 indicator
- [ ] Clue count displayed
- [ ] Click opens ResearchManifestCard in edit mode
- [ ] Tray can filter by stage (future: toggle)

### Story 3.4: Stage Transition Validation

**Context:** Not all stage transitions are valid (defined in config).

**Task:** Add transition validation, UI for valid transitions only.

**Files:**
- CREATE: `src/lib/stage-transitions.ts`
- MODIFY: `src/surface/components/KineticStream/Capture/components/SproutCard.tsx`

**Acceptance:**
- [ ] `canTransition(from, to)` validates against config
- [ ] Invalid transitions throw error
- [ ] UI only shows valid next stages

### Build Gate

```bash
npm run build
npm test
npx playwright test tests/e2e/sprout-capture.spec.ts
```

---

## Epic 4: Prompt Generation

**Goal:** Generate research prompts from manifest, copy to clipboard.

### Story 4.1: Create Prompt Template

**Context:** Handlebars template for research prompt generation.

**Task:** Create template file with all manifest fields.

**Files:**
- CREATE: `data/research-prompt-template.md`

**Template Structure:**
```handlebars
# Research Request: {{purpose.label}}

## Seed Insight
> {{seed}}

## Research Purpose
{{purpose.promptFraming}}

## Clues to Follow
{{#each clues}}
- [{{type}}] {{value}}{{#if note}} — {{note}}{{/if}}
{{/each}}

## Research Directions
{{#each directions}}
{{@index}}. {{this}}
{{/each}}

## Provenance
- Lens: {{provenance.lens.name}}
- Journey: {{provenance.journey.name}}
- Captured: {{capturedAt}}
```

**Acceptance:**
- [ ] Template renders all manifest fields
- [ ] Empty sections handled gracefully
- [ ] Output is copy-paste ready

### Story 4.2: Create Prompt Generator

**Context:** Engine that renders template with manifest data.

**Task:** Build `generateResearchPrompt(sprout)` function.

**Files:**
- CREATE: `src/lib/prompt-generator.ts`

**Acceptance:**
- [ ] Function accepts Sprout with researchManifest
- [ ] Returns rendered prompt string
- [ ] Updates sprout.researchManifest.promptGenerated
- [ ] Handles missing optional fields

### Story 4.3: Create PromptPreviewModal

**Context:** Show generated prompt, provide copy button.

**Task:** Build modal with prompt display and clipboard action.

**Files:**
- CREATE: `src/surface/components/KineticStream/Capture/components/PromptPreviewModal.tsx`

**Acceptance:**
- [ ] Modal shows formatted prompt
- [ ] "Copy to Clipboard" button works
- [ ] Success toast on copy
- [ ] "Close" returns to manifest card
- [ ] Sprout stage advances to 'branching'

### Build Gate

```bash
npm run build
npm test
npx playwright test tests/e2e/sprout-research.spec.ts
```

---

## Epic 5: Testing & Polish

**Goal:** Comprehensive E2E tests, visual baselines, documentation.

### Story 5.1: E2E Test Suite

**Context:** Full flow tests for both action types.

**Task:** Create Playwright tests for sprout and research flows.

**Files:**
- CREATE: `tests/e2e/sprout-research.spec.ts`

**Test Cases:**
- [ ] Plant Sprout: select → pill → menu → card → confirm → tray
- [ ] Research Directive: select → pill → menu → manifest → save → tray
- [ ] Add Clue: open manifest → add clue → save → verify
- [ ] Generate Prompt: open manifest → generate → copy → stage change
- [ ] Stage Badge: verify all 8 stages render correctly

**Acceptance:**
- [ ] All test cases pass
- [ ] Tests run in CI

### Story 5.2: Visual Baselines

**Context:** Capture screenshots for regression testing.

**Task:** Add visual baseline tests for new components.

**Files:**
- CREATE: `tests/e2e/sprout-visual-baseline.spec.ts`
- CREATE: `tests/e2e/sprout-visual-baseline.spec.ts-snapshots/`

**Baselines:**
- [ ] ActionMenu (2 actions)
- [ ] ResearchManifestCard (empty)
- [ ] ResearchManifestCard (with data)
- [ ] PromptPreviewModal
- [ ] SproutCard (each stage)

**Acceptance:**
- [ ] Baselines captured
- [ ] Visual regression tests pass

### Story 5.3: Documentation Update

**Context:** Update PROJECT_PATTERNS.md with new pattern details.

**Task:** Add research manifest pattern to Pattern 11.

**Files:**
- MODIFY: `PROJECT_PATTERNS.md`

**Acceptance:**
- [ ] Pattern 11 updated with research manifest extension
- [ ] JSON config files documented
- [ ] Stage lifecycle documented

### Build Gate (Final)

```bash
npm run build
npm test
npx playwright test
npx playwright test tests/e2e/*-baseline.spec.ts
npm run lint
```

---

## Sprint Summary

| Epic | Stories | Est. Effort |
|------|---------|-------------|
| 1. Declarative Foundation | 4 | 3 hours |
| 2. Multi-Action Selection | 3 | 2 hours |
| 3. Research Manifest Card | 4 | 4 hours |
| 4. Prompt Generation | 3 | 2 hours |
| 5. Testing & Polish | 3 | 2 hours |
| **Total** | **17** | **13 hours** |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-30 | Jim + Claude | Initial sprint breakdown |
