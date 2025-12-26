# Development Log: route-selection-flow-v1

## Sprint Status

| Phase | Status |
|-------|--------|
| Planning | ✅ Complete |
| Execution | ✅ Complete |
| Verification | ✅ Complete |

## Timeline

### Planning Phase
- **Started:** 2024-12-25
- **Completed:** 2024-12-25
- **Artifacts Created:** 9/9

### Execution Phase
- **Started:** 2024-12-25
- **Completed:** 2024-12-25

---

## Planning Summary

### Problem Identified
Terminal uses inline pickers (WelcomeInterstitial embeds LensGrid, JourneysModal duplicates JourneyList). This violates Pattern 8 (Canonical Source Rendering) and creates:
- Duplicate components with divergent styling
- Complex state management (preview, embedded modes)
- Inconsistent UX across surfaces
- Maintenance burden

### Solution Designed
1. **Route-based selection flow** — Navigation to canonical routes with returnTo params
2. **Module Shell Architecture** — Consistent ModuleHeader across all modules
3. **Flow params** — returnTo, ctaLabel for contextual CTAs
4. **Simplify Terminal** — Remove inline pickers, use navigation

### New Patterns Documented
- **Pattern 8:** Canonical Source Rendering (added to PROJECT_PATTERNS.md)
- **Pattern 9:** Module Shell Architecture (added to PROJECT_PATTERNS.md)

### Key Decisions
1. URL params for flow control only (state in XState)
2. CTA appears after selection when in flow
3. ModuleHeader as new component (not extend CollectionHeader)
4. Fixed position FlowCTA
5. Remove JourneysModal entirely
6. WelcomeInterstitial = copy + single CTA

---

## Execution Notes

### Epic 1: Shared Components
- [x] Story 1.1: Create useFlowParams hook
- [x] Story 1.2: Create FlowCTA component
- [x] Story 1.3: Create ModuleHeader component
- [x] Story 1.4: Update shared exports

### Epic 2: Lenses Route Flow
- [x] Story 2.1: Update LensPicker with flow support
- [x] Story 2.2: Add FlowCTA to LensPicker (ModuleHeader skipped - uses CollectionHeader)

### Epic 3: Journeys Route Flow
- [x] Story 3.1: Update JourneyList with flow support
- [x] Story 3.2: Add FlowCTA to JourneyList (ModuleHeader skipped - uses CollectionHeader)

### Epic 4: Terminal Integration
- [x] Story 4.1: Simplify WelcomeInterstitial (copy + CTA only)
- [x] Story 4.2: Update TerminalFlow props (remove JourneysModal)
- [x] Story 4.3: Update LensBadge for navigation (navigateOnClick prop)
- [x] Story 4.4: Replace JourneysModal with navigation
- [x] Story 4.5: Add navigate command result type
- [x] Story 4.6: Update /journeys command to navigate
- [x] Story 4.7: Add onJourneyClick to TerminalHeader

### Epic 5: Cleanup
- [x] Story 5.1: Delete JourneysModal
- [x] Story 5.2: Remove LensGrid embedded variant (implicit - WelcomeInterstitial no longer uses it)

### Epic 6: Verification
- [x] Story 6.1: Build verification (all phases passed)
- [x] Story 6.2: Bundle size reduced (~4.5KB less)

---

## Blockers Encountered

| Blocker | Resolution | Time Lost |
|---------|------------|-----------|
| None | — | — |

---

## Deviations from Plan

| Planned | Actual | Reason |
|---------|--------|--------|
| Add ModuleHeader to routes | Used existing CollectionHeader | CollectionHeader already provides consistent UX |
| Update TerminalHeader.tsx | Updated Terminal.tsx onJourneyClick | TerminalHeader receives callback, logic in parent |
| Remove LensGrid embedded | Implicit via WelcomeInterstitial simplification | No longer used |

---

## Files Created

| File | Lines | Purpose |
|------|-------|---------|
| src/shared/hooks/useFlowParams.ts | 24 | Flow param parsing from URL |
| src/shared/FlowCTA.tsx | 32 | Fixed position contextual CTA |
| src/shared/ModuleHeader.tsx | 59 | Module shell header (for future use) |

## Files Modified

| File | Change |
|------|--------|
| src/shared/index.ts | Add flow component exports |
| src/explore/LensPicker.tsx | Add useFlowParams, FlowCTA |
| src/explore/JourneyList.tsx | Add useFlowParams, FlowCTA |
| components/Terminal/WelcomeInterstitial.tsx | Simplify to copy + CTA, remove all props |
| components/Terminal/TerminalFlow.tsx | Remove JourneysModal, simplify WelcomeInterstitial |
| components/Terminal/LensBadge.tsx | Add navigateOnClick prop, useNavigate |
| components/Terminal.tsx | Add useNavigate, onJourneyClick, onNavigate to CommandInput |
| components/Terminal/types.ts | Remove showJourneysModal, onCloseJourneysModal |
| components/Terminal/Modals/index.ts | Remove JourneysModal export |
| components/Terminal/CommandInput/CommandRegistry.ts | Add 'navigate' result type |
| components/Terminal/CommandInput/CommandInput.tsx | Add onNavigate prop, handle navigate result |
| components/Terminal/CommandInput/commands/journeys.ts | Return navigate instead of modal |

## Files Deleted

| File | Reason |
|------|--------|
| components/Terminal/Modals/JourneysModal.tsx | Replaced by route navigation |

---

## Final Commits

```
Hash: 9440820
Message: feat: implement route-based selection flow and Module Shell Architecture

BREAKING: WelcomeInterstitial no longer accepts lens props
BREAKING: JourneysModal removed

- Add useFlowParams hook for flow param parsing
- Add FlowCTA component for contextual navigation
- Add ModuleHeader component for consistent module experience
- Update LensPicker with flow support
- Update JourneyList with flow support
- Simplify WelcomeInterstitial to copy + CTA
- Replace JourneysModal with route navigation
- Update /journeys command to navigate instead of modal
- Add navigateOnClick prop to LensBadge
- Add onJourneyClick to TerminalHeader

Implements: Pattern 8 (Canonical Source Rendering)
Implements: Pattern 9 (Module Shell Architecture)
Sprint: route-selection-flow-v1
```

---

## Post-Sprint Notes

### Lessons Learned
- Route-based selection simplifies component complexity significantly
- URL params for flow control keeps XState focused on domain state
- Deleting JourneysModal removed ~100 lines of duplicate code

### Follow-up Tasks
- [ ] Add search to Terminal module (per Pattern 9)
- [ ] Consider adding ModuleHeader to Nodes, Diary, Sprouts views
- [ ] Document flow param pattern in CLAUDE.md
- [ ] Test flow on mobile (FlowCTA fixed positioning)

### Technical Debt Addressed
- Removed inline LensGrid in WelcomeInterstitial
- Removed JourneysModal duplicate (~100 lines)
- Unified command palette navigation pattern
