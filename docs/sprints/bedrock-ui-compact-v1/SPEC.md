# Bedrock Compact Mode Execution Contract

**Codename:** `bedrock-ui-compact-v1`
**Status:** Execution Contract for Claude Code CLI
**Protocol:** Grove Execution Protocol v1.5
**Baseline:** `main` (branch: feat/epic4-multimodel-v1)
**Date:** 2026-01-17

---

## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | Phase 1 - Context State |
| **Status** | Executing |
| **Blocking Issues** | None |
| **Last Updated** | 2026-01-17 |
| **Next Action** | Add metricsBarVisible to BedrockUIContext |

---

## Attention Anchor

**We are building:** A metrics bar toggle and tighter StatCard styling for Bedrock consoles

**Success looks like:** Operators can hide/show metrics bar via toggle in nav footer, preference persists to localStorage, StatCards are visually tighter (~64px vs ~80px height)

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
├── /bedrock route ✅
├── src/bedrock/* ✅
└── src/core/schema/*
```

All work in this sprint is in `/src/bedrock/` — fully within ACTIVE BUILD ZONE.

### DEX Compliance Matrix

| Feature | Declarative | Agnostic | Provenance | Scalable |
|---------|-------------|----------|------------|----------|
| Metrics Toggle | ✅ localStorage key | ✅ Pure UI | ✅ N/A | ✅ Pattern reusable |
| StatCard Sizing | ✅ Tailwind classes | ✅ Pure UI | ✅ N/A | ✅ Component-based |

---

## User Stories (from USER_STORIES.md)

| ID | Title | Priority | Status |
|----|-------|----------|--------|
| US-BUC001 | Toggle Metrics Bar Visibility | P0 | Pending |
| US-BUC002 | Toggle Accessibility Compliance | P0 | Pending |
| US-BUC003 | Respect Motion Preferences | P1 | Pending |
| US-BUC004 | Tighter StatCard Dimensions | P1 | Pending |

---

## Execution Architecture

### Phase 1: Context State (US-BUC001 foundation)
- Add `metricsBarVisible` state to BedrockUIContext
- Add `setMetricsBarVisible` action
- Implement localStorage persistence
- **Gate:** Build passes, state accessible via hook

### Phase 2: Console Factory Integration (US-BUC001)
- Add conditional render for MetricsRow
- Destructure state from useBedrockUI
- **Gate:** Metrics row conditionally renders

### Phase 3: MetricsToggle Component (US-BUC001, US-BUC002, US-BUC003)
- Create new component at `src/bedrock/components/MetricsToggle.tsx`
- Include accessibility (focus states, keyboard support)
- Respect `prefers-reduced-motion`
- **Gate:** Component exists and functions

### Phase 4: Nav Integration (US-BUC001)
- Wire MetricsToggle into BedrockWorkspace nav footer
- **Gate:** Toggle visible and functional in UI

### Phase 5: StatCard Styling (US-BUC004)
- Reduce padding: `p-4` → `px-4 py-3`
- Reduce gap: `gap-4` → `gap-3`
- Reduce icon: `w-12 h-12` → `w-10 h-10`
- Reduce icon size: `text-2xl` → `text-xl`
- **Gate:** Visual verification of tighter cards

### Phase 6: Visual Verification
- Start dev server
- Capture screenshots of all features
- Verify localStorage persistence
- **Gate:** Screenshots in `screenshots/` folder

### Phase 7: Sprint Completion
- Create REVIEW.html
- Run code-simplifier
- Final commit
- **Gate:** All files committed, user notified

---

## Success Criteria

### Sprint Complete When:
- [x] All phases completed with verification
- [x] All DEX compliance gates pass
- [x] All screenshots captured
- [x] REVIEW.html complete
- [x] Build and lint pass
- [x] User notified with REVIEW.html path

### Sprint Failed If:
- Any FROZEN ZONE file modified
- Any phase without screenshot evidence
- DEX compliance test fails
- User handoff without REVIEW.html

---

## Files to Modify

| File | Change | Risk |
|------|--------|------|
| `src/bedrock/context/BedrockUIContext.tsx` | Add state | Low |
| `src/bedrock/patterns/console-factory.tsx` | Add conditional | Low |
| `src/bedrock/components/MetricsToggle.tsx` | NEW FILE | None |
| `src/bedrock/BedrockWorkspace.tsx` | Wire toggle | Low |
| `src/bedrock/primitives/StatCard.tsx` | Adjust spacing | Low |

---

*This contract is binding. Deviation requires explicit human approval.*
