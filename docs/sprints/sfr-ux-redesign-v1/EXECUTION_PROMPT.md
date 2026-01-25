# S23-SFR: Sprout Finishing Room UX Redesign - Execution Contract

**Sprint:** sfr-ux-redesign-v1
**Alias:** S23-SFR
**Status:** Execution Contract for Claude Code CLI
**Protocol:** Grove Execution Protocol v1.5
**Baseline:** `main` (post S22-WP)
**Date:** 2026-01-24

---

## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | Phase 0 - Ready for Execution |
| **Status** | :dart: Ready |
| **Blocking Issues** | S22-WP must merge first |
| **Last Updated** | 2026-01-24 |
| **Next Action** | Begin Phase 1 after S22-WP merge |

---

## Attention Anchor

**We are building:** The Sprout Finishing Room - a three-phase UX that transforms raw research into polished artifacts through a "Reading Room" (Phase 1), "Curtain Pull" transition (Phase 2), and "Zen Mode" editor (Phase 3).

**Success looks like:** User opens a sprout, reviews research with trust signals, selects a Writer template, clicks Generate, sees the curtain pull animation, and lands in a focused editor with rails and drawers for context access.

---

## Reference Documents

| Document | Location | Purpose |
|----------|----------|---------|
| **Strategic Spec** | `docs/sprints/sfr-ux-redesign-v1/PLAN.md` | Full design rationale, DEX compliance, component hierarchy |
| **User Stories** | `docs/sprints/sfr-ux-redesign-v1/USER_STORIES.md` | 19 stories, 23 E2E tests, 26 screenshots |
| **Template Seeds** | `data/seeds/output-templates.json` | Source of truth for Writer/Research templates |
| **json-render Guide** | `docs/JSON_RENDER_PATTERN_GUIDE.md` | Required pattern for data display |

---

## Hard Constraints

### Strangler Fig Compliance

```
FROZEN ZONE - DO NOT TOUCH
├── /terminal route
├── /foundation route (except Foundation consoles)
├── src/surface/components/Terminal/*
└── src/workspace/* (legacy GroveWorkspace)

ACTIVE BUILD ZONE - WHERE WE WORK
├── /explore route
├── /bedrock route
├── src/explore/*
├── src/bedrock/*
├── src/surface/components/modals/SproutFinishingRoom/*  <- PRIMARY
└── src/core/schema/*
```

**Any file edit in FROZEN ZONE = sprint failure. No exceptions.**

### DEX Compliance Matrix

| Feature | Declarative | Agnostic | Provenance | Scalable |
|---------|-------------|----------|------------|----------|
| Layout Config | :white_check_mark: JSON config for column proportions | :white_check_mark: No model-specific code | N/A | :white_check_mark: Tokens |
| Template Loading | :white_check_mark: Seeds file | :white_check_mark: Works with any LLM | N/A | :white_check_mark: Add via JSON |
| Artifact Schema | :white_check_mark: Zod schema | :white_check_mark: Model-agnostic | :white_check_mark: promptSnapshot, templateId | :white_check_mark: Version tabs |
| Phase Machine | :white_check_mark: State config | :white_check_mark: Model-agnostic | :white_check_mark: Tracks transitions | :white_check_mark: Extensible states |

---

## Execution Architecture

### Phase 1: Core Layout System (4-6 hours)

Establish the two fundamental layouts: Phase 1 three-column and Phase 3 rails+editor.

| Sub-Phase | Deliverable | Gate |
|-----------|-------------|------|
| **1a** | SFR Grid Container with CSS Grid | Build passes |
| **1b** | Phase 1 Three-Column Layout (20%/55%/25%) | Column proportions verified |
| **1c** | Phase 3 Rails+Editor Layout (50px/1fr/50px) | Rail widths = 50px |
| **1d** | Layout Config Hook (`useSFRLayout`) | Config from JSON |

**User Stories:** US-SFR001, US-SFR002

**Screenshot Gates:**
- `phase1-three-column-layout.png` - Three columns visible, proper proportions
- `phase3-rail-editor-layout.png` - 50px rails, rotated labels, editor center

**E2E Test:** `tests/e2e/sfr-ux-redesign/layout.spec.ts`

---

### Phase 2: Reading Room Components (6-8 hours)

Build the Phase 1 content: Trust Signals, Research Display, Template Selector, Notes.

| Sub-Phase | Deliverable | Gate |
|-----------|-------------|------|
| **2a** | TrustSignals component (left column) | Shows source count, domains, recency |
| **2b** | ResearchContent component (center) | Prose with citations, scrollable |
| **2c** | OutputStyleSelector (right column) | 4 cards from seeds, single-select |
| **2d** | NotesTextarea (sticky footer) | Text entry, persists across template switches |
| **2e** | GenerateArtifactButton | Primary CTA, triggers Phase 2 |

**User Stories:** US-SFR003, US-SFR004, US-SFR005, US-SFR006, US-SFR007

**Screenshot Gates:**
- `trust-signals-populated.png` - "4 sources", "3 domains", recency badges
- `research-content-with-citations.png` - H2 styled, [1][2] citations visible
- `style-selector-default.png` - Blog Post selected by default
- `style-selector-vision-selected.png` - Selection change visible
- `notes-textarea-filled.png` - User text visible, Vision selected
- `generate-button-ready.png` - Primary button enabled

**E2E Test:** `tests/e2e/sfr-ux-redesign/phase1-reading-room.spec.ts`

---

### Phase 3: Phase Transition System (4-6 hours)

Implement the Curtain Pull animation and state machine.

| Sub-Phase | Deliverable | Gate |
|-----------|-------------|------|
| **3a** | Phase State Machine (IDLE → PHASE_1 → PHASE_2 → PHASE_3) | State transitions work |
| **3b** | Curtain Pull CSS Animation (400ms, cubic-bezier) | Columns animate to rails |
| **3c** | Error Recovery (API fail → return to Phase 1) | Error toast, state restored |
| **3d** | Reduced Motion Support | Instant transition when prefers-reduced-motion |

**User Stories:** US-SFR008, US-SFR009

**Screenshot Gates:**
- `curtain-pull-mid-animation.png` - Columns in intermediate state
- `curtain-pull-complete.png` - Final Phase 3 layout
- `generation-error-phase1.png` - Error toast, back to Phase 1

**E2E Test:** `tests/e2e/sfr-ux-redesign/phase-transition.spec.ts`

---

### Phase 4: Zen Mode Components (8-10 hours)

Build the Phase 3 focused writing environment with drawers.

| Sub-Phase | Deliverable | Gate |
|-----------|-------------|------|
| **4a** | Left Rail with badge and rotated label | Icon + badge + "SOURCES" |
| **4b** | Left Drawer (350px overlay) | Research prose + source list |
| **4c** | Right Rail with icon | Config icon + "STYLE" label |
| **4d** | Right Drawer (300px overlay) | "Generate New Version" header, templates, notes |
| **4e** | Tab Bar for artifact versions | Multiple tabs, active state, "+ New" |
| **4f** | Editor Panel with skeleton loading | Skeleton → content transition |

**User Stories:** US-SFR010, US-SFR011, US-SFR012, US-SFR013

**Screenshot Gates:**
- `left-drawer-research-open.png` - 350px drawer, research content, shadow
- `left-drawer-closed.png` - 50px rail only, badge visible
- `right-drawer-generate-options.png` - 300px, "Generate New Version", 4 cards
- `tab-bar-3-versions-initial.png` - 3 tabs, first active
- `tab-bar-vision-selected.png` - Second tab active after click
- `editor-skeleton-loading.png` - Pulsing gray lines
- `editor-content-loaded.png` - Real content visible

**E2E Test:** `tests/e2e/sfr-ux-redesign/phase3-zen-mode.spec.ts`

---

### Phase 5: Provenance Capture (2-3 hours)

Implement the promptSnapshot field for artifact reproducibility.

| Sub-Phase | Deliverable | Gate |
|-----------|-------------|------|
| **5a** | Artifact schema includes promptSnapshot | Zod schema updated |
| **5b** | Generation captures merged prompt | API logs show snapshot |
| **5c** | Snapshot stored with artifact | Field populated in state |

**User Stories:** US-SFR014

**Gate:** Data verification via E2E test (no screenshot - data inspection)

**E2E Test:** `tests/e2e/sfr-ux-redesign/version-management.spec.ts`

---

### Phase 6: Persistence & Actions (4-5 hours)

Implement Save to Nursery and auto-save on edit.

| Sub-Phase | Deliverable | Gate |
|-----------|-------------|------|
| **6a** | Save to Nursery button | Visible in Phase 3 actions |
| **6b** | Save API integration | POST /api/nursery/save works |
| **6c** | Success toast on save | Green toast appears |
| **6d** | Auto-save on edit (2s debounce) | Edits preserved across tab switch |

**User Stories:** US-SFR015, US-SFR016

**Screenshot Gates:**
- `save-to-nursery-success.png` - Green toast, button state change
- `auto-save-edit-preserved.png` - "EDITED" content visible after tab switch

**E2E Test:** `tests/e2e/sfr-ux-redesign/persistence.spec.ts`

---

### Phase 7: Mobile Responsive (3-4 hours)

Implement mobile layout that skips Phase 1.

| Sub-Phase | Deliverable | Gate |
|-----------|-------------|------|
| **7a** | useMediaQuery for mobile detection | < 768px detected |
| **7b** | Mobile skips to Phase 3 layout | No three-column on mobile |
| **7c** | Fresh sprout opens right drawer | "Blind launch" prevention |

**User Stories:** US-SFR017

**Screenshot Gates:**
- `mobile-fresh-sprout-drawer-open.png` - 375px viewport, Phase 3, drawer open

**E2E Test:** `tests/e2e/sfr-ux-redesign/mobile.spec.ts`

---

### Phase 8: Accessibility (4-5 hours)

Implement keyboard navigation and ARIA labels.

| Sub-Phase | Deliverable | Gate |
|-----------|-------------|------|
| **8a** | Keyboard navigation (Tab, Arrow, Enter, Escape) | All interactions work |
| **8b** | Focus management (drawer → rail return) | Focus returns on Escape |
| **8c** | ARIA labels on rails, drawers, tabs | aria-label, aria-expanded, role |
| **8d** | Color contrast verification | AA compliance verified |

**User Stories:** US-SFR018, US-SFR019

**Screenshot Gates:**
- `keyboard-escape-focus-rail.png` - Focus ring on rail button
- `keyboard-tab-navigation.png` - Second tab focused and active

**E2E Test:** `tests/e2e/sfr-ux-redesign/accessibility.spec.ts`

---

## DEX Compliance Gates (Per Phase)

After each phase, verify:

```
[ ] DECLARATIVE SOVEREIGNTY
    Can behavior be changed via config, not code?
    - Layout proportions in sfr-layout.json
    - Templates from output-templates.json
    - Animation timing configurable

[ ] CAPABILITY AGNOSTICISM
    Does it work regardless of which model executes?
    - Same components in Phase 1 and Phase 3 drawers
    - Editor accepts any model output
    - No Claude-specific code paths

[ ] PROVENANCE AS INFRASTRUCTURE
    Does every object track how it came to exist?
    - promptSnapshot captures exact generation prompt
    - templateId, templateVersion tracked
    - generatedAt timestamp

[ ] ORGANIC SCALABILITY
    Does structure enable growth without redesign?
    - Tab bar scrolls for many versions
    - Card grid scrolls for many templates
    - Drawer content can grow
```

---

## Success Criteria

### Sprint Complete When:

- [ ] All 8 phases completed with verification gates
- [ ] All 19 user stories implemented
- [ ] All 23 E2E tests passing
- [ ] All 26 screenshots captured and verified
- [ ] DEX compliance gates pass (4/4 pillars)
- [ ] Zero critical console errors in E2E tests
- [ ] Build and lint pass (`npm run build && npm run lint`)
- [ ] Code-simplifier applied to all modified files
- [ ] REVIEW.html complete with all screenshots
- [ ] User notified with REVIEW.html path

### Sprint Failed If:

- :x: Any FROZEN ZONE file modified
- :x: Any phase completed without screenshot evidence
- :x: DEX compliance gate fails
- :x: E2E test created without console monitoring
- :x: Critical console errors detected in E2E tests
- :x: Templates hardcoded instead of loaded from seeds
- :x: promptSnapshot not captured on generation
- :x: Phase 1 columns visible on mobile

---

## Test File Structure

```
tests/e2e/sfr-ux-redesign/
├── layout.spec.ts                # Phase 1 - US-SFR001, US-SFR002
├── phase1-reading-room.spec.ts   # Phase 2 - US-SFR003-007
├── phase-transition.spec.ts      # Phase 3 - US-SFR008, US-SFR009
├── phase3-zen-mode.spec.ts       # Phase 4 - US-SFR010-013
├── version-management.spec.ts    # Phase 5 - US-SFR014
├── persistence.spec.ts           # Phase 6 - US-SFR015, US-SFR016
├── mobile.spec.ts                # Phase 7 - US-SFR017
├── accessibility.spec.ts         # Phase 8 - US-SFR018, US-SFR019
└── fixtures/
    └── test-sprouts.ts           # Shared test data
```

---

## Component Hierarchy

```
SproutFinishingRoom (Modal Container)
├── PhaseController (state machine)
│
├── Phase1Layout (grid-cols-[20%_55%_25%])
│   ├── TrustSignalsColumn
│   │   └── TrustSignals
│   ├── ResearchColumn
│   │   └── ResearchContent
│   └── ConfigColumn
│       ├── OutputStyleSelector
│       └── NotesTextarea
│
├── Phase2Transition (animation controller)
│   └── CurtainPullAnimation
│
└── Phase3Layout (grid-cols-[50px_1fr_50px])
    ├── LeftRail
    │   ├── RailIcon + Badge
    │   ├── RailLabel
    │   └── LeftDrawer
    │       ├── ResearchContent (ReadOnly)
    │       └── TrustSignals
    ├── EditorPanel
    │   ├── TabBar
    │   │   ├── ArtifactTabs
    │   │   ├── NewTabButton
    │   │   └── ActionButtons
    │   └── Editor
    │       └── (skeleton | content)
    └── RightRail
        ├── RailIcon
        ├── RailLabel
        └── RightDrawer
            ├── DrawerHeader
            ├── OutputStyleSelector
            └── NotesTextarea
```

---

## Key Patterns to Follow

### 1. Slot-Based Component Relocation

Same component renders in column OR drawer based on phase:

```typescript
<SlotContainer slot={phase === 1 ? 'right-column' : 'right-drawer'}>
  <OutputStyleSelector
    templates={templates}
    selected={selectedId}
    onSelect={setSelectedId}
  />
</SlotContainer>
```

### 2. Template Loading from Seeds

```typescript
// Load templates declaratively - NEVER hardcode
const templates = useOutputTemplates({ agentType: 'writer' });
```

### 3. Drawer State Management

```typescript
const { leftOpen, rightOpen, toggleLeft, toggleRight, closeAll } = useSFRDrawers();
```

### 4. Phase State Machine

```typescript
type Phase = 'IDLE' | 'PHASE_1_REVIEW' | 'PHASE_2_SHIFT' | 'PHASE_3_PRODUCE';
```

---

## When Stuck

```
CHECKLIST WHEN BLOCKED

[ ] Am I in the right directory? (pwd)
[ ] Am I testing at /explore, not / or /terminal?
[ ] Did I run npm run build?
[ ] Did I run npm run dev?
[ ] Is the dev server running?
[ ] Am I editing a FROZEN ZONE file?
[ ] Did I save screenshots to docs/sprints/sfr-ux-redesign-v1/screenshots/?
[ ] Did I verify screenshot contents (not just existence)?
[ ] Is REVIEW.html updated with latest screenshots?
[ ] Did I run code-simplifier before commit?
[ ] Did I run E2E tests with console monitoring?
[ ] Are there critical console errors to investigate?
[ ] Are templates loading from seeds (not hardcoded)?

If still stuck: Update DEVLOG.md with blocker details
and ask user for guidance.
```

---

## Commit Guidelines

**Branch:** `feat/sfr-ux-redesign-v1`

**Commit Message Format:**
```
feat(S23-SFR): Phase N - {description}

- Sub-phase Na: {what was done}
- Sub-phase Nb: {what was done}

Screenshots: docs/sprints/sfr-ux-redesign-v1/screenshots/
E2E: tests/e2e/sfr-ux-redesign/{file}.spec.ts

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

---

## Dependencies

| Dependency | Status | Blocker |
|------------|--------|---------|
| S22-WP (Writer Panel Piping) | :construction: In Progress | MUST MERGE FIRST |
| Writer Templates in Seeds | :white_check_mark: Complete | 4 writer templates ready |
| Nursery API | :warning: May need updates | Check schema during Phase 6 |

---

*This contract is binding. Deviation requires explicit human approval.*
*Execute per Grove Execution Protocol v1.5*
