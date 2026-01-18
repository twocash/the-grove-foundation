# Sprint Breakdown: bedrock-foundation-v1

**Sprint:** bedrock-foundation-v1  
**Duration:** 20 days (4 weeks)  
**Branch:** `bedrock`  

---

## Epic 1: Types & Infrastructure

**Duration:** Days 1-2  
**Goal:** Define data contracts before any implementation.

### Story 1.1: Create Console Configuration Types

**Task:** Define TypeScript types for console configuration.

**Files:**
- CREATE `src/bedrock/types/console.types.ts`

**Types to define:**
- `ConsoleConfig`
- `MetricConfig`
- `NavItemConfig`
- `CollectionViewConfig`
- `SortOption`
- `FilterOption`
- `CopilotConfig`
- `CopilotAction`

**Tests:** TypeScript compilation verifies types.

---

### Story 1.2: Create Copilot Types

**Task:** Define types for Copilot context protocol.

**Files:**
- CREATE `src/bedrock/types/copilot.types.ts`

**Types to define:**
- `CopilotContext`
- `PatchOperation`
- `ObjectSchema`

**Tests:** TypeScript compilation verifies types.

---

### Story 1.3: Create Lens Types

**Task:** Define Lens payload and filter types.

**Files:**
- CREATE `src/bedrock/types/lens.ts`

**Types to define:**
- `LensCategory`
- `FilterOperator`
- `LensFilter`
- `LensPayload`
- `Lens` (GroveObject<LensPayload>)

**Tests:** TypeScript compilation verifies types.

---

### Story 1.4: Create Collection View Types

**Task:** Define types for useCollectionView hook.

**Files:**
- CREATE `src/bedrock/patterns/collection-view.types.ts`

**Types to define:**
- `CollectionViewState`
- `FilterValue`
- `UseCollectionViewOptions`
- `CollectionViewReturn`

**Tests:** TypeScript compilation verifies types.

---

### Story 1.5: Extend GroveObjectType

**Task:** Ensure 'lens' is in GroveObjectType union.

**Files:**
- EXTEND `src/core/schema/grove-object.ts`

**Tests:** TypeScript compilation verifies types.

---

### Build Gate: Epic 1

```bash
npx tsc --noEmit  # All types compile
```

---

## Epic 2: Data Layer

**Duration:** Days 3-5  
**Goal:** Build and test hooks before any UI.

### Story 2.1: Implement GroveApi

**Task:** Create REST client with GroveObject envelope handling.

**Files:**
- CREATE `src/bedrock/patterns/GroveApi.ts`

**Methods:**
- `list<T>(objectType, params)`
- `get<T>(objectType, id)`
- `create<T>(objectType, payload, meta?)`
- `patch<T>(objectType, id, operations)`
- `delete(objectType, id)`

**Tests:**
- CREATE `tests/unit/GroveApi.test.ts`
- Test envelope wrapping/unwrapping
- Test error handling
- Test pagination params

---

### Story 2.2: Implement useCollectionView

**Task:** Create hook for filter/sort/favorite logic.

**Files:**
- CREATE `src/bedrock/patterns/useCollectionView.ts`

**Features:**
- Search across configured fields
- Filter by any field with all operators
- Sort ascending/descending
- Favorites with localStorage persistence
- Nav filter combination

**Tests:**
- CREATE `tests/unit/useCollectionView.test.ts`
- Test search filtering
- Test each filter operator
- Test sort combinations
- Test favorite persistence
- Test filter combination logic

---

### Story 2.3: Implement usePatchHistory

**Task:** Create hook for undo/redo via inverse patches.

**Files:**
- CREATE `src/bedrock/patterns/usePatchHistory.ts`

**Features:**
- Apply patch with inverse generation
- Undo returns inverse patch
- Redo returns forward patch
- Max history limit (50)
- Clear on object change

**Tests:**
- CREATE `tests/unit/usePatchHistory.test.ts`
- Test inverse generation for 'replace'
- Test inverse generation for 'add'
- Test inverse generation for 'remove'
- Test undo/redo flow
- Test history limit

---

### Build Gate: Epic 2

```bash
npm test -- --testPathPattern=unit  # All unit tests pass
```

---

## Epic 3: Primitives

**Duration:** Days 6-8  
**Goal:** Build structural components that render empty shell.

### Story 3.1: Create StatCard

**Task:** Single metric display component.

**Files:**
- CREATE `src/bedrock/primitives/StatCard.tsx`

**Props:**
- `label: string`
- `value: string | number`
- `format?: 'number' | 'relative' | 'percentage'`

---

### Story 3.2: Create MetricsRow

**Task:** Horizontal container for stat cards.

**Files:**
- CREATE `src/bedrock/primitives/MetricsRow.tsx`

**Props:**
- `metrics: MetricConfig[]`
- `data: Record<string, any>`

---

### Story 3.3: Create ConsoleHeader

**Task:** Title, description, and primary action button.

**Files:**
- CREATE `src/bedrock/primitives/ConsoleHeader.tsx`

**Props:**
- `title: string`
- `description: string`
- `primaryAction?: { label, icon, onClick }`

---

### Story 3.4: Create BedrockNav

**Task:** Navigation column from config.

**Files:**
- CREATE `src/bedrock/primitives/BedrockNav.tsx`

**Props:**
- `items: NavItemConfig[]`
- `activeId: string`
- `onSelect: (id: string) => void`

---

### Story 3.5: Create BedrockInspector

**Task:** Right panel shell with content slot.

**Files:**
- CREATE `src/bedrock/primitives/BedrockInspector.tsx`

**Props:**
- `open: boolean`
- `onClose: () => void`
- `children: React.ReactNode`

---

### Story 3.6: Create BedrockLayout

**Task:** Three-column shell that composes everything.

**Files:**
- CREATE `src/bedrock/primitives/BedrockLayout.tsx`

**Props:**
- `config: ConsoleConfig`
- `navigation: React.ReactNode`
- `content: React.ReactNode`
- `inspector?: React.ReactNode`
- `inspectorOpen: boolean`

---

### Story 3.7: Create BedrockUIContext

**Task:** Context for selection state.

**Files:**
- CREATE `src/bedrock/context/BedrockUIContext.tsx`

**State:**
- `selectedObjectId: string | null`
- `inspectorOpen: boolean`
- `setSelectedObjectId: (id: string | null) => void`

---

### Build Gate: Epic 3

```bash
npm run build  # Compiles
# Manual: Navigate to test route, see empty shell
```

---

## Epic 4: Collection Components

**Duration:** Days 9-11  
**Goal:** Display objects with filter/sort/favorite.

### Story 4.1: Create FavoriteToggle

**Task:** Star button component.

**Files:**
- CREATE `src/bedrock/components/FavoriteToggle.tsx`

**Props:**
- `isFavorite: boolean`
- `onToggle: () => void`

---

### Story 4.2: Create ViewModeToggle

**Task:** Grid/list switcher.

**Files:**
- CREATE `src/bedrock/components/ViewModeToggle.tsx`

**Props:**
- `mode: 'grid' | 'list'`
- `onChange: (mode: 'grid' | 'list') => void`

---

### Story 4.3: Create FilterBar

**Task:** Search, filters, and sort controls.

**Files:**
- CREATE `src/bedrock/components/FilterBar.tsx`

**Props:**
- `config: CollectionViewConfig`
- `state: CollectionViewState`
- `actions: CollectionViewReturn['actions']`

---

### Story 4.4: Create EmptyState

**Task:** No results display.

**Files:**
- CREATE `src/bedrock/components/EmptyState.tsx`

**Props:**
- `title: string`
- `description: string`
- `action?: { label, onClick }`

---

### Story 4.5: Create ObjectCard

**Task:** Base card component using `--card-*` tokens.

**Files:**
- CREATE `src/bedrock/components/ObjectCard.tsx`

**Props:**
- `object: GroveObject`
- `isSelected: boolean`
- `isFavorite: boolean`
- `onSelect: () => void`
- `onToggleFavorite: () => void`
- `children: React.ReactNode` (content slot)

---

### Story 4.6: Create ObjectGrid

**Task:** Card grid layout.

**Files:**
- CREATE `src/bedrock/components/ObjectGrid.tsx`

**Props:**
- `children: React.ReactNode` (cards)
- `emptyState?: React.ReactNode`

---

### Story 4.7: Create ObjectList

**Task:** List layout alternative.

**Files:**
- CREATE `src/bedrock/components/ObjectList.tsx`

**Props:**
- `children: React.ReactNode` (rows)
- `emptyState?: React.ReactNode`

---

### Build Gate: Epic 4

```bash
npm run build  # Compiles
# Manual: Grid displays with mock data
```

---

## Epic 5: Lens Workshop Console

**Duration:** Days 12-14  
**Goal:** Wire everything for complete Lens CRUD.

### Story 5.1: Create Lens Workshop Config

**Task:** Define console configuration.

**Files:**
- CREATE `src/bedrock/consoles/LensWorkshop/LensWorkshop.config.ts`

---

### Story 5.2: Create LensCard

**Task:** Lens-specific card content.

**Files:**
- CREATE `src/bedrock/consoles/LensWorkshop/LensCard.tsx`

**Displays:**
- Icon emoji
- Name
- Description (truncated)
- Category badge
- Active/Draft indicator

---

### Story 5.3: Create LensEditor

**Task:** Inspector form for editing.

**Files:**
- CREATE `src/bedrock/consoles/LensWorkshop/LensEditor.tsx`

**Sections:**
- Identity (name, emoji, color)
- Description
- Category
- Filters (list builder)
- Settings (isActive, sortPriority)
- Metadata (read-only)
- Actions (delete, duplicate)

---

### Story 5.4: Create LensGrid

**Task:** Content area implementation.

**Files:**
- CREATE `src/bedrock/consoles/LensWorkshop/LensGrid.tsx`

**Wires:**
- useCollectionView hook
- FilterBar component
- ObjectGrid with LensCards

---

### Story 5.5: Create LensWorkshop Root

**Task:** Console root component.

**Files:**
- CREATE `src/bedrock/consoles/LensWorkshop/LensWorkshop.tsx`
- CREATE `src/bedrock/consoles/LensWorkshop/index.ts`

**Composes:**
- BedrockLayout
- BedrockNav
- LensGrid
- BedrockInspector with LensEditor

---

### Build Gate: Epic 5

```bash
npm run build  # Compiles
npx playwright test tests/e2e/bedrock-crud.spec.ts  # CRUD works
```

---

## Epic 6: Routes

**Duration:** Day 15  
**Goal:** Wire Next.js routes.

### Story 6.1: Create Bedrock Layout

**Task:** Layout wrapper for /bedrock routes.

**Files:**
- CREATE `src/app/bedrock/layout.tsx`

---

### Story 6.2: Create Bedrock Index

**Task:** Redirect /bedrock to /bedrock/lenses.

**Files:**
- CREATE `src/app/bedrock/page.tsx`

---

### Story 6.3: Create Lenses Page

**Task:** Render LensWorkshop.

**Files:**
- CREATE `src/app/bedrock/lenses/page.tsx`

---

### Story 6.4: Create Global Navigation Config

**Task:** Define Bedrock navigation structure.

**Files:**
- CREATE `src/bedrock/config/navigation.ts`

---

### Build Gate: Epic 6

```bash
npm run build  # Compiles
# Manual: /bedrock/lenses renders correctly
```

---

## Epic 7: Copilot Integration

**Duration:** Days 16-18  
**Goal:** AI-assisted editing works.

### Story 7.1: Create Copilot Context

**Task:** Context for Copilot state.

**Files:**
- CREATE `src/bedrock/context/BedrockCopilotContext.tsx`

**State:**
- `pendingPatch: PatchOperation[] | null`
- `isGenerating: boolean`
- `error: string | null`

---

### Story 7.2: Create useBedrockCopilot Hook

**Task:** Hook for Copilot interactions.

**Files:**
- CREATE `src/bedrock/patterns/useBedrockCopilot.ts`

**Functions:**
- `generatePatch(input: string, context: CopilotContext)`
- `validatePatch(patch: PatchOperation[], schema: ObjectSchema)`
- `formatPreview(patch: PatchOperation[], object: GroveObject)`

---

### Story 7.3: Create BedrockCopilot Component

**Task:** Copilot panel UI.

**Files:**
- CREATE `src/bedrock/primitives/BedrockCopilot.tsx`

**UI:**
- Input field
- Generate button
- Patch preview (diff view)
- Apply/Reject buttons
- Model indicator
- Error display

---

### Story 7.4: Create Lens Copilot Actions

**Task:** Lens-specific action handlers.

**Files:**
- CREATE `src/bedrock/consoles/LensWorkshop/LensCopilotActions.ts`

**Actions:**
- `edit-field` — "set X to Y"
- `validate` — Check config validity
- `duplicate` — Create copy

---

### Story 7.5: Wire Copilot to Inspector

**Task:** Add Copilot slot to BedrockInspector.

**Files:**
- UPDATE `src/bedrock/primitives/BedrockInspector.tsx`
- UPDATE `src/bedrock/consoles/LensWorkshop/LensWorkshop.tsx`

---

### Build Gate: Epic 7

```bash
npx playwright test tests/e2e/bedrock-copilot.spec.ts  # Copilot works
```

---

## Epic 8: Tests & Polish

**Duration:** Days 19-20  
**Goal:** Complete coverage, handle edge cases.

### Story 8.1: Create Primitives E2E Test

**Task:** Verify layout renders correctly.

**Files:**
- CREATE `tests/e2e/bedrock-primitives.spec.ts`

---

### Story 8.2: Create Collection E2E Test

**Task:** Verify filter/sort/favorite.

**Files:**
- CREATE `tests/e2e/bedrock-collection.spec.ts`

---

### Story 8.3: Create CRUD E2E Test

**Task:** Verify create, read, update, delete.

**Files:**
- CREATE `tests/e2e/bedrock-crud.spec.ts`

---

### Story 8.4: Create Copilot E2E Test

**Task:** Verify Copilot integration.

**Files:**
- CREATE `tests/e2e/bedrock-copilot.spec.ts`

---

### Story 8.5: Create Visual Baseline Test

**Task:** Capture visual regression baselines.

**Files:**
- CREATE `tests/e2e/bedrock-baseline.spec.ts`

---

### Story 8.6: Create Integration Test

**Task:** Component integration tests.

**Files:**
- CREATE `tests/integration/LensWorkshop.integration.test.ts`

---

### Story 8.7: Add ESLint Rule

**Task:** Block Foundation imports.

**Files:**
- UPDATE `.eslintrc.js`

---

### Story 8.8: Polish Empty States

**Task:** Handle all empty/error states.

**Files:**
- Various component updates

---

### Story 8.9: Polish Loading States

**Task:** Add skeleton loaders.

**Files:**
- Various component updates

---

### Story 8.10: Add Keyboard Navigation

**Task:** Arrow keys, Enter, Escape.

**Files:**
- Various component updates

---

### Build Gate: Epic 8 (Final)

```bash
npm test                    # All unit tests pass
npx playwright test         # All E2E tests pass
npm run lint               # No Foundation imports
npm run build              # Production build succeeds
```

---

## Sprint Summary

| Epic | Duration | Stories | Focus |
|------|----------|---------|-------|
| 1 | Days 1-2 | 5 | Types & Infrastructure |
| 2 | Days 3-5 | 3 | Data Layer (hooks) |
| 3 | Days 6-8 | 7 | Primitives |
| 4 | Days 9-11 | 7 | Collection Components |
| 5 | Days 12-14 | 5 | Lens Workshop Console |
| 6 | Day 15 | 4 | Routes |
| 7 | Days 16-18 | 5 | Copilot Integration |
| 8 | Days 19-20 | 10 | Tests & Polish |

**Total:** 46 stories across 8 epics

---

**Proceed to EXECUTION_PROMPT.md.**
