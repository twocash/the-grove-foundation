# Migration Map: bedrock-foundation-v1

**Sprint:** bedrock-foundation-v1  
**Version:** 1.0  
**Date:** December 30, 2024  

---

## Overview

This is a **greenfield build**, not a migration. We create new files in `src/bedrock/` without touching `src/foundation/`. The "migration" is the execution sequence for creating files.

**Strangler Fig Pattern:** Bedrock exists alongside Foundation. Once feature-complete, Foundation is deprecated (future sprint).

---

## Execution Sequence

### Phase 1: Types & Infrastructure (Days 1-2)

**Goal:** Define data contracts before any UI.

| # | Action | File | Notes |
|---|--------|------|-------|
| 1.1 | CREATE | `src/bedrock/types/console.types.ts` | ConsoleConfig, MetricConfig, etc. |
| 1.2 | CREATE | `src/bedrock/types/copilot.types.ts` | CopilotContext, CopilotAction, PatchOp |
| 1.3 | CREATE | `src/bedrock/types/lens.ts` | LensPayload, Lens, FilterOperator |
| 1.4 | CREATE | `src/bedrock/patterns/collection-view.types.ts` | CollectionViewState, FilterValue |
| 1.5 | EXTEND | `src/core/schema/grove-object.ts` | Add 'lens' to GroveObjectType if missing |

**Verification:**
```bash
npx tsc --noEmit  # Types compile
```

### Phase 2: Data Layer (Days 3-5)

**Goal:** Build hooks that power everything. Test before UI.

| # | Action | File | Notes |
|---|--------|------|-------|
| 2.1 | CREATE | `src/bedrock/patterns/GroveApi.ts` | REST client with GroveObject envelope |
| 2.2 | CREATE | `src/bedrock/patterns/useCollectionView.ts` | Filter/sort/favorite hook |
| 2.3 | CREATE | `src/bedrock/patterns/usePatchHistory.ts` | Undo/redo via inverse patches |
| 2.4 | CREATE | `tests/unit/GroveApi.test.ts` | Unit tests |
| 2.5 | CREATE | `tests/unit/useCollectionView.test.ts` | Unit tests |
| 2.6 | CREATE | `tests/unit/usePatchHistory.test.ts` | Unit tests |

**Verification:**
```bash
npm test -- --testPathPattern=unit  # All unit tests pass
```

### Phase 3: Primitives (Days 6-8)

**Goal:** Build shell components. Render empty structure.

| # | Action | File | Notes |
|---|--------|------|-------|
| 3.1 | CREATE | `src/bedrock/primitives/StatCard.tsx` | Single metric display |
| 3.2 | CREATE | `src/bedrock/primitives/MetricsRow.tsx` | Horizontal stat container |
| 3.3 | CREATE | `src/bedrock/primitives/ConsoleHeader.tsx` | Title + description + action |
| 3.4 | CREATE | `src/bedrock/primitives/BedrockNav.tsx` | Navigation from config |
| 3.5 | CREATE | `src/bedrock/primitives/BedrockInspector.tsx` | Right panel shell |
| 3.6 | CREATE | `src/bedrock/primitives/BedrockLayout.tsx` | Three-column shell |
| 3.7 | CREATE | `src/bedrock/context/BedrockUIContext.tsx` | Selection state |

**Verification:**
```bash
# Manual: Navigate to /bedrock, see empty shell with header
```

### Phase 4: Collection Components (Days 9-11)

**Goal:** Display objects in grid with filter/sort/favorite.

| # | Action | File | Notes |
|---|--------|------|-------|
| 4.1 | CREATE | `src/bedrock/components/FavoriteToggle.tsx` | Star button |
| 4.2 | CREATE | `src/bedrock/components/ViewModeToggle.tsx` | Grid/list switcher |
| 4.3 | CREATE | `src/bedrock/components/FilterBar.tsx` | Search + filters + sort |
| 4.4 | CREATE | `src/bedrock/components/EmptyState.tsx` | No results display |
| 4.5 | CREATE | `src/bedrock/components/ObjectCard.tsx` | Base card component |
| 4.6 | CREATE | `src/bedrock/components/ObjectGrid.tsx` | Card grid layout |
| 4.7 | CREATE | `src/bedrock/components/ObjectList.tsx` | List layout alternative |

**Verification:**
```bash
# Manual: Grid displays mock data, filter/sort works
```

### Phase 5: Lens Workshop Console (Days 12-14)

**Goal:** Wire everything together for Lens.

| # | Action | File | Notes |
|---|--------|------|-------|
| 5.1 | CREATE | `src/bedrock/consoles/LensWorkshop/LensWorkshop.config.ts` | Console configuration |
| 5.2 | CREATE | `src/bedrock/consoles/LensWorkshop/LensCard.tsx` | Lens-specific card |
| 5.3 | CREATE | `src/bedrock/consoles/LensWorkshop/LensEditor.tsx` | Inspector form |
| 5.4 | CREATE | `src/bedrock/consoles/LensWorkshop/LensGrid.tsx` | Content area |
| 5.5 | CREATE | `src/bedrock/consoles/LensWorkshop/LensWorkshop.tsx` | Console root |
| 5.6 | CREATE | `src/bedrock/consoles/LensWorkshop/index.ts` | Public exports |

**Verification:**
```bash
# Manual: Full CRUD works, undo/redo works
npx playwright test tests/e2e/bedrock-crud.spec.ts
```

### Phase 6: Routes (Day 15)

**Goal:** Wire Next.js routes.

| # | Action | File | Notes |
|---|--------|------|-------|
| 6.1 | CREATE | `src/app/bedrock/layout.tsx` | Bedrock layout wrapper |
| 6.2 | CREATE | `src/app/bedrock/page.tsx` | Redirect to /bedrock/lenses |
| 6.3 | CREATE | `src/app/bedrock/lenses/page.tsx` | Lens Workshop page |
| 6.4 | CREATE | `src/bedrock/config/navigation.ts` | Global nav structure |

**Verification:**
```bash
# Manual: /bedrock/lenses renders Lens Workshop
```

### Phase 7: Copilot (Days 16-18)

**Goal:** AI-assisted editing.

| # | Action | File | Notes |
|---|--------|------|-------|
| 7.1 | CREATE | `src/bedrock/context/BedrockCopilotContext.tsx` | Copilot state |
| 7.2 | CREATE | `src/bedrock/patterns/useBedrockCopilot.ts` | Copilot hook |
| 7.3 | CREATE | `src/bedrock/primitives/BedrockCopilot.tsx` | Copilot panel UI |
| 7.4 | CREATE | `src/bedrock/consoles/LensWorkshop/LensCopilotActions.ts` | Lens-specific actions |
| 7.5 | UPDATE | `src/bedrock/primitives/BedrockInspector.tsx` | Add Copilot slot |
| 7.6 | UPDATE | `src/bedrock/consoles/LensWorkshop/LensWorkshop.tsx` | Wire Copilot |

**Verification:**
```bash
npx playwright test tests/e2e/bedrock-copilot.spec.ts
```

### Phase 8: Tests & Polish (Days 19-20)

**Goal:** Complete test coverage, handle edge cases.

| # | Action | File | Notes |
|---|--------|------|-------|
| 8.1 | CREATE | `tests/e2e/bedrock-primitives.spec.ts` | Layout renders correctly |
| 8.2 | CREATE | `tests/e2e/bedrock-collection.spec.ts` | Filter/sort/favorite |
| 8.3 | CREATE | `tests/e2e/bedrock-crud.spec.ts` | CRUD operations |
| 8.4 | CREATE | `tests/e2e/bedrock-copilot.spec.ts` | Copilot integration |
| 8.5 | CREATE | `tests/e2e/bedrock-baseline.spec.ts` | Visual regression |
| 8.6 | CREATE | `tests/integration/LensWorkshop.integration.test.ts` | Component integration |

**Verification:**
```bash
npm test                    # All tests pass
npx playwright test         # E2E tests pass
```

---

## Files Created (Summary)

### Types (5 files)
- `src/bedrock/types/console.types.ts`
- `src/bedrock/types/copilot.types.ts`
- `src/bedrock/types/lens.ts`
- `src/bedrock/patterns/collection-view.types.ts`
- `src/core/schema/grove-object.ts` (EXTEND)

### Patterns (3 files)
- `src/bedrock/patterns/GroveApi.ts`
- `src/bedrock/patterns/useCollectionView.ts`
- `src/bedrock/patterns/usePatchHistory.ts`

### Context (2 files)
- `src/bedrock/context/BedrockUIContext.tsx`
- `src/bedrock/context/BedrockCopilotContext.tsx`

### Primitives (7 files)
- `src/bedrock/primitives/StatCard.tsx`
- `src/bedrock/primitives/MetricsRow.tsx`
- `src/bedrock/primitives/ConsoleHeader.tsx`
- `src/bedrock/primitives/BedrockNav.tsx`
- `src/bedrock/primitives/BedrockInspector.tsx`
- `src/bedrock/primitives/BedrockLayout.tsx`
- `src/bedrock/primitives/BedrockCopilot.tsx`

### Components (7 files)
- `src/bedrock/components/FavoriteToggle.tsx`
- `src/bedrock/components/ViewModeToggle.tsx`
- `src/bedrock/components/FilterBar.tsx`
- `src/bedrock/components/EmptyState.tsx`
- `src/bedrock/components/ObjectCard.tsx`
- `src/bedrock/components/ObjectGrid.tsx`
- `src/bedrock/components/ObjectList.tsx`

### Console (6 files)
- `src/bedrock/consoles/LensWorkshop/LensWorkshop.config.ts`
- `src/bedrock/consoles/LensWorkshop/LensCard.tsx`
- `src/bedrock/consoles/LensWorkshop/LensEditor.tsx`
- `src/bedrock/consoles/LensWorkshop/LensGrid.tsx`
- `src/bedrock/consoles/LensWorkshop/LensWorkshop.tsx`
- `src/bedrock/consoles/LensWorkshop/index.ts`
- `src/bedrock/consoles/LensWorkshop/LensCopilotActions.ts`

### Routes (4 files)
- `src/app/bedrock/layout.tsx`
- `src/app/bedrock/page.tsx`
- `src/app/bedrock/lenses/page.tsx`
- `src/bedrock/config/navigation.ts`

### Tests (9 files)
- `tests/unit/GroveApi.test.ts`
- `tests/unit/useCollectionView.test.ts`
- `tests/unit/usePatchHistory.test.ts`
- `tests/integration/LensWorkshop.integration.test.ts`
- `tests/e2e/bedrock-primitives.spec.ts`
- `tests/e2e/bedrock-collection.spec.ts`
- `tests/e2e/bedrock-crud.spec.ts`
- `tests/e2e/bedrock-copilot.spec.ts`
- `tests/e2e/bedrock-baseline.spec.ts`

**Total: 44 files**

---

## Files NOT Touched

- `src/foundation/**/*` — Strangler fig boundary
- `src/explore/**/*` — Different surface
- `src/terminal/**/*` — Different surface
- `src/surface/**/*` — User-facing components

---

## Rollback Plan

Since this is greenfield:

1. **Partial rollback:** Delete created files, routes still work (404)
2. **Full rollback:** `git checkout main -- src/bedrock/ src/app/bedrock/`
3. **No risk to existing functionality:** Foundation still works

---

## Dependencies Between Files

```
Types
  └── Patterns (depend on types)
        └── Context (depends on patterns)
              └── Primitives (depend on context)
                    └── Components (depend on primitives)
                          └── Console (composes everything)
                                └── Routes (renders console)
                                      └── Tests (verify everything)
```

**Order matters.** Create in sequence.

---

**Proceed to DECISIONS.md.**
