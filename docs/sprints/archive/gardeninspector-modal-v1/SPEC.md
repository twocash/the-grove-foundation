# GardenInspector Modal Redesign v1 - Execution Contract

**Codename:** `gardeninspector-modal-v1`
**Status:** Execution Contract for Claude Code CLI
**Protocol:** Grove Execution Protocol v1.5
**Baseline:** `main` (post bedrock-ui-compact-v1)
**Date:** 2026-01-17
**Notion:** https://www.notion.so/2ec780a78eef811483ded7150e5407f5

---

## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | Phase 1 - Audit & Analysis |
| **Status** | 🚀 Ready to Execute |
| **Blocking Issues** | None |
| **Last Updated** | 2026-01-17 |
| **Next Action** | Audit CSS variable compilation |

---

## Attention Anchor

**We are building:** A properly styled "New Research Sprout" modal on `/explore` that matches the Quantum Glass dark theme used elsewhere in Bedrock/Explore.

**Success looks like:** Modal renders with consistent dark theme, readable text (WCAG AA), working Material Symbols icons, and proper form field styling.

---

## Problem Statement

The GardenInspector modal on `/explore` has inconsistent styling:
- ConfirmationView uses `bg-slate-800`, `text-white`, `border-slate-600` (standard Tailwind)
- Header and other sections use Quantum Glass variables (`bg-glass-solid`, `text-glass-text-primary`)
- This creates visual inconsistency within the same component
- Material Symbols icons sometimes render as text fallback

**Root Cause Analysis:**
1. Mixed styling approach - some sections use Tailwind colors, others use CSS variables
2. The standard Tailwind approach (`bg-slate-800`) actually WORKS reliably
3. CSS variables defined in `tailwind.config.ts` as `glass.*` tokens work for some but not all usages
4. Need to standardize on ONE working approach

---

## Hard Constraints

### Strangler Fig Compliance

```
FROZEN ZONE — DO NOT TOUCH
├── /terminal route
├── /foundation route
├── src/surface/components/Terminal/*
└── src/workspace/*

ACTIVE BUILD ZONE — WHERE WE WORK
├── /explore route ← This sprint works here
├── src/explore/* ← GardenInspector lives here
└── tailwind.config.ts (color tokens)
```

**Any file edit in FROZEN ZONE = sprint failure. No exceptions.**

### DEX Compliance Matrix

| Feature | Declarative | Agnostic | Provenance | Scalable |
|---------|-------------|----------|------------|----------|
| Modal styling | ✅ CSS tokens | ✅ No model | N/A | ✅ Reusable |
| Form inputs | ✅ Tailwind | ✅ No model | N/A | ✅ Standard |

---

## Execution Architecture

### Phase 1: Audit & Analysis (30 min)

**Objective:** Understand current state, identify all styling issues

| Sub-phase | Deliverable | Gate |
|-----------|-------------|------|
| 1a | Screenshot current modal state | Visual evidence |
| 1b | List all `text-glass-*`, `bg-glass-*` usages | Audit table |
| 1c | Verify Material Symbols loading | Console check |
| 1d | Document working vs broken patterns | Analysis complete |

### Phase 2: Standardize Color Approach (45 min)

**Objective:** Pick ONE approach and apply consistently

| Sub-phase | Deliverable | Gate |
|-----------|-------------|------|
| 2a | Decision: Tailwind palette vs CSS vars | Document rationale |
| 2b | Update ConfirmationView styling | Build passes |
| 2c | Update form inputs (text, textarea) | Visual verification |
| 2d | Update buttons (confirm, cancel) | Visual verification |

### Phase 3: Polish & Verify (30 min)

**Objective:** Ensure all states work correctly

| Sub-phase | Deliverable | Gate |
|-----------|-------------|------|
| 3a | Empty state styling | Screenshot |
| 3b | Loading state styling | Screenshot |
| 3c | Error state styling | Screenshot |
| 3d | Focus states & accessibility | Keyboard test |

### Phase 4: E2E & Completion (15 min)

**Objective:** Final verification and documentation

| Sub-phase | Deliverable | Gate |
|-----------|-------------|------|
| 4a | E2E test with console monitoring | Zero critical errors |
| 4b | REVIEW.html with all screenshots | Complete |
| 4c | Final commit | Clean build |

---

## Files to Modify

| File | Changes | Risk |
|------|---------|------|
| `src/explore/GardenInspector.tsx` | Standardize colors | Low |
| `tailwind.config.ts` | Verify glass tokens (if needed) | Low |
| `styles/globals.css` | Verify CSS vars (if needed) | Low |

**Expected new files:**
- `docs/sprints/gardeninspector-modal-v1/screenshots/*.png`
- `docs/sprints/gardeninspector-modal-v1/DEVLOG.md`
- `docs/sprints/gardeninspector-modal-v1/REVIEW.html`

---

## Acceptance Criteria

From Notion:

1. ✅ Modal renders with dark theme matching Bedrock consoles
2. ✅ All text is readable (WCAG AA contrast minimum)
3. ✅ Material Symbols icons render correctly
4. ✅ Form inputs have visible borders and focus states
5. ✅ Buttons have proper hover/active states
6. ✅ No console errors related to styling

---

## Success Criteria

### Sprint Complete When:
- [ ] All phases completed with verification
- [ ] All DEX compliance gates pass
- [ ] All screenshots captured in `docs/sprints/gardeninspector-modal-v1/screenshots/`
- [ ] REVIEW.html complete with all sections
- [ ] E2E test with console monitoring passes
- [ ] Zero critical console errors
- [ ] Build and lint pass
- [ ] User notified with REVIEW.html path

### Sprint Failed If:
- ❌ Any FROZEN ZONE file modified
- ❌ Any phase without screenshot evidence
- ❌ E2E test not created or missing console monitoring
- ❌ Critical console errors detected in E2E tests
- ❌ REVIEW.html not created or incomplete

---

## Test Routes

| Route | Purpose |
|-------|---------|
| `http://localhost:3007/explore` | Main test route |

**CRITICAL:** Test at `/explore`, NOT `/` or `/terminal`

---

*This contract is binding. Deviation requires explicit human approval.*
