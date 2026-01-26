# S23-SFR v1.0: Writer Pipeline Completion - Execution Contract

**Sprint:** sfr-ux-redesign-v1 (v1.0 rescoped)
**Alias:** S23-SFR-v1
**Status:** Execution Contract for Claude Code CLI
**Protocol:** Grove Execution Protocol v1.5
**Baseline:** `feat/sfr-ux-redesign-v1` (post Phase 0 CSS migration)
**Date:** 2026-01-25

---

## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | Phase 1 - Ready for Execution |
| **Status** | Executing |
| **Blocking Issues** | None |
| **Last Updated** | 2026-01-25 |
| **Next Action** | Read code files, implement Change 1 |

---

## Attention Anchor

**We are building:** Completing the Writer Pipeline so generated documents appear in the center column (DocumentViewer) as version tabs, with prominent Save to Nursery action.

**Success looks like:** User opens sprout, sees research in center. Selects template in right panel, clicks Generate. Generated document appears as new tab in center column. User reviews, clicks Save to Nursery. Can generate more versions as additional tabs.

---

## Risk Context

The original S23-SFR spec envisioned an 8-phase, 35-47 hour rebuild. After Phase 0 (CSS migration), we descoped to 4 targeted changes that complete the existing Writer Pipeline without restructuring the modal.

**Why descoped:**
- The existing SFR modal has working functionality from S21-RL and S22-WP
- A full rebuild risks regressing all of that
- The gap is small: generated docs route to preview card in sidebar instead of center column
- Strangler fig principle: incremental improvement, not rewrite

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
├── src/surface/components/modals/SproutFinishingRoom/*  <- PRIMARY
├── src/explore/*
└── src/core/schema/*
```

**Any file edit in FROZEN ZONE = sprint failure. No exceptions.**

### Regression Prevention

- Feature flag controls new routing behavior
- Existing tab structure preserved, new tabs added alongside
- WriterPanel continues to work as-is, just routes output differently
- No changes to ProvenancePanel (left column)
- No changes to research display pipeline

### DEX Compliance Matrix

| Feature | Declarative | Agnostic | Provenance | Scalable |
|---------|-------------|----------|------------|----------|
| Doc routing to center | Config flag | Any model output | N/A | Yes |
| Version tabs | Dynamic from state | Model-agnostic | templateId tracked | Scroll for many |
| Save to Nursery | Button placement | Works with any doc | Provenance preserved | N/A |
| New Version flow | Template from seeds | Any model | New snapshot per gen | Tab bar grows |

---

## Execution Architecture

### Phase 1: Route Generated Docs to Center Column

| Sub-Phase | Deliverable | Gate |
|-----------|-------------|------|
| **1a** | Read all target files, understand current data flow | Knowledge confirmed |
| **1b** | Add `generatedDocuments` state to SproutFinishingRoom | State accessible |
| **1c** | Pass generated doc from ActionPanel up to SFR, down to DocumentViewer | Data flows correctly |
| **1d** | DocumentViewer renders generated doc as new tab | Tab visible after generation |

**Screenshot Gates:**
- `v1/01-generated-doc-in-center.png` - Generated doc visible in center column

---

### Phase 2: Artifact Version Tabs

| Sub-Phase | Deliverable | Gate |
|-----------|-------------|------|
| **2a** | Refactor DocumentViewer tabs from static to dynamic | Research tab always present |
| **2b** | Each generated doc gets its own tab | Multiple version tabs visible |
| **2c** | Tab switching shows correct content | Content changes on tab click |

**Screenshot Gates:**
- `v1/02-multiple-version-tabs.png` - Two+ version tabs visible
- `v1/03-tab-switching.png` - Different content after tab switch

---

### Phase 3: Prominent Save to Nursery

| Sub-Phase | Deliverable | Gate |
|-----------|-------------|------|
| **3a** | Save to Nursery button visible when viewing generated doc | Button in center column |
| **3b** | Success feedback on save | Toast or button state change |

**Screenshot Gates:**
- `v1/04-save-button-visible.png` - Save to Nursery visible in center view
- `v1/05-save-success.png` - Success feedback visible

---

### Phase 4: New Version Generation Flow

| Sub-Phase | Deliverable | Gate |
|-----------|-------------|------|
| **4a** | After generation, right panel resets for new version | Template selector re-enabled |
| **4b** | New generation creates new tab (doesn't overwrite) | Second tab appears |
| **4c** | Feature flag wraps all changes | Flag off = original behavior |

**Screenshot Gates:**
- `v1/06-new-version-tab.png` - Second generated doc as new tab

---

## Success Criteria

### Sprint Complete When:
- [ ] All 4 phases completed with screenshot evidence
- [ ] Generated documents render in center column
- [ ] Multiple version tabs work
- [ ] Save to Nursery accessible from center view
- [ ] New version creates new tab
- [ ] Feature flag controls new behavior
- [ ] DEX compliance gates pass
- [ ] Zero critical console errors
- [ ] Build and lint pass (`npm run build && npm run lint`)
- [ ] E2E test with console monitoring passes
- [ ] REVIEW.html complete
- [ ] User notified with REVIEW.html path

### Sprint Failed If:
- Any FROZEN ZONE file modified
- Any phase without screenshot evidence
- Existing research display broken
- WriterPanel stops functioning
- ProvenancePanel modified

---

## Component Change Map

```
SproutFinishingRoom (adds generatedDocuments state, passes to DocViewer)
├── ProvenancePanel        (NO CHANGES)
├── DocumentViewer         (MODIFIED: dynamic tabs, renders generated docs)
│   ├── Research tab       (existing, unchanged)
│   └── Version tabs       (NEW: one per generated doc)
├── ActionPanel            (MODIFIED: routes output up via callback)
│   └── WriterPanel        (MODIFIED: removes preview card, signals completion)
└── FinishingRoomStatus    (NO CHANGES)
```

---

*This contract is binding. Deviation requires explicit human approval.*
*Execute per Grove Execution Protocol v1.5*
