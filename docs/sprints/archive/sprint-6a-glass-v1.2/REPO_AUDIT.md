# Sprint 6A + Quantum Glass v1.2
## REPO_AUDIT.md

**Date:** 2025-12-25
**Sprint:** Sprint 6A (Analytics) + Quantum Glass v1.2 (Visual Unification)
**Repository:** C:\GitHub\the-grove-foundation

---

## Executive Summary

Two parallel workstreams in one sprint:

**Sprint 6A — Analytics & Tuning (~2-3 hours)**
- Wire funnel events that already exist but aren't fully connected
- Isolate tuning parameters in `constants.ts`
- Enable data-driven optimization

**Quantum Glass v1.2 — Remaining Views (~4-5 hours)**
- Terminal/chat interface styling
- Inspector content panels
- Sprout and Diary views
- Complete visual unification across all screens

**Total Estimated Effort:** 6-8 hours

---

## Current State

### Analytics Infrastructure
**File:** `utils/funnelAnalytics.ts` (343 lines)
- ✅ Core tracking functions exist
- ✅ Session management implemented
- ✅ Local storage batching works
- ✅ Cognitive Bridge events defined
- ⚠️ Some events imported but may not fire correctly

### Tuning Parameters
**Files:** `constants.ts` (530 lines), `src/core/engagement/config.ts` (31 lines)
- ⚠️ ENTROPY_CONFIG exists in TWO places (duplication)
- `constants.ts` has detailed config (thresholds, limits, scoring)
- `src/core/engagement/config.ts` has minimal config
- Need to consolidate to single source of truth

### Quantum Glass Design System
**File:** `styles/globals.css` (1103 lines)
- ✅ Core tokens defined (--glass-*, --neon-*)
- ✅ .glass-panel, .glass-card, .glass-viewport classes
- ✅ Status badges, buttons, text utilities
- ✅ Card utilities from v1.1 sprint
- ⚠️ Terminal/chat components not yet styled
- ⚠️ Inspector content uses old tokens

### Views Requiring Glass Update

| View | File | Current State | Work Needed |
|------|------|--------------|-------------|
| Terminal Chat | `components/Terminal.tsx` | Light mode defaults, old tokens | Message bubbles, input, header |
| Inspector Content | `src/workspace/Inspector.tsx` | Glass frame, old content | Inner panels, metadata |
| Diary List | `src/explore/DiaryList.tsx` | Partial glass | Complete card pattern |
| Diary Inspector | `src/explore/DiaryInspector.tsx` | Old styling | Glass tokens |
| Sprout Grid | `src/cultivate/SproutGrid.tsx` | Partial glass | Complete card pattern |
| Sprout Inspector | `src/cultivate/SproutInspector.tsx` | Old styling | Glass tokens |

---

## File Inventory

### Analytics (Sprint 6A)
```
utils/funnelAnalytics.ts      # Main analytics module
constants.ts                  # Has ENTROPY_CONFIG (detailed)
src/core/engagement/config.ts # Has ENTROPY_CONFIG (minimal) - REMOVE
components/Terminal.tsx       # Where events should fire
hooks/useEngagementBridge.ts  # Bridge events
```

### Quantum Glass v1.2
```
styles/globals.css            # Token definitions
components/Terminal.tsx       # ~1475 lines, needs glass styling
components/Terminal/          # Sub-components
src/workspace/Inspector.tsx   # Inspector wrapper
src/explore/DiaryList.tsx
src/explore/DiaryInspector.tsx
src/cultivate/SproutGrid.tsx
src/cultivate/SproutInspector.tsx
```

---

## Dependencies

- No new packages required
- No schema changes
- No API changes
- CSS-only changes for v1.2
- JS changes only for analytics wiring

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Terminal styling breaks layout | Low | Medium | Test at multiple viewport sizes |
| Analytics events not firing | Medium | Low | Add console.log in dev mode |
| Inspector content regression | Low | Low | Visual diff before/after |
| Duplication of ENTROPY_CONFIG | Resolved | N/A | Consolidate to constants.ts |

---

## Success Metrics

### Sprint 6A (Analytics)
- [ ] `bridge_shown`, `bridge_accepted`, `bridge_dismissed` fire correctly
- [ ] `getAnalyticsReport()` shows event counts
- [ ] Single ENTROPY_CONFIG in `constants.ts`
- [ ] No duplicate config files

### Quantum Glass v1.2
- [ ] Terminal chat uses glass tokens
- [ ] Message bubbles follow glass design
- [ ] Inspector content matches inspector frame
- [ ] Diary and Sprout views unified
- [ ] No light-mode defaults leaking through
