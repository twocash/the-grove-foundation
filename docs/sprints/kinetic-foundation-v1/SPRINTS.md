# Kinetic Foundation v1.0 — Sprint Breakdown

**Sprint:** `kinetic-foundation-v1`  
**Date:** December 24, 2024  
**Estimated Effort:** 2-3 focused sessions

---

## Epic Overview

| Epic | Description | Stories | Risk |
|------|-------------|---------|------|
| Epic 1 | DEX Type System | 3 | Low |
| Epic 2 | DEX Registry | 4 | Medium |
| Epic 3 | Shared Components | 4 | Low |
| Epic 4 | NarrativeArchitect Migration | 3 | Medium |
| Epic 5 | Hook Migration | 2 | Low |

---

## Epic 1: DEX Type System

**Goal:** Create foundation types for all DEX objects  
**Risk:** Low — Pure types, no runtime behavior  
**Dependencies:** None

### Story 1.1: Create DEXObject base interface
**Task:** Define `src/core/schema/dex.ts` with base interface and type definitions

**Acceptance:**
- [ ] `DEXObject` interface with identity, display, lifecycle, kinetic fields
- [ ] `DEXObjectType` union type
- [ ] `DEXVersionEntry` interface for evolution history
- [ ] `DEXCaptureContext` interface for entropy/provenance tracking
- [ ] JSDoc comments on all exports

**Tests:**
- Unit: `tests/unit/core/schema/dex.test.ts`
  - Type guards work correctly
  - Version entry structure validates

### Story 1.2: Create extended DEX types
**Task:** Define Journey, Node, Hub, Lens, Card types extending DEXObject

**Acceptance:**
- [ ] `DEXJourney extends DEXObject` with navigation fields
- [ ] `DEXNode extends DEXObject` with content/navigation fields
- [ ] `DEXHub extends DEXObject` with routing fields
- [ ] `DEXLens extends DEXObject` with behavior fields
- [ ] `DEXCard extends DEXObject` for V2.0 compatibility

**Tests:**
- Unit: Type assignability tests

### Story 1.3: Create barrel export
**Task:** Create `src/core/schema/index.ts` with exports

**Acceptance:**
- [ ] All DEX types exported from `@core/schema`
- [ ] Existing schema exports preserved

### Build Gate
```bash
npm run build              # Compiles without errors
npx tsc --noEmit           # Type check passes
npm test                   # Unit tests pass
```

---

## Epic 2: DEX Registry

**Goal:** Create centralized object store with CRUD and subscriptions  
**Risk:** Medium — Core infrastructure, must be correct  
**Dependencies:** Epic 1

### Story 2.1: Create registry context and provider
**Task:** Define `src/core/registry/DEXRegistry.tsx`

**Acceptance:**
- [ ] `DEXRegistryContext` created
- [ ] `DEXRegistryProvider` wraps children
- [ ] Internal state structure for all object types
- [ ] Reducer handles HYDRATE, UPDATE, DELETE actions

**Tests:**
- Unit: Provider renders children
- Unit: Context throws outside provider

### Story 2.2: Implement read operations
**Task:** Implement `get`, `getAll`, `filter` methods

**Acceptance:**
- [ ] `get<T>(type, id)` returns object or null
- [ ] `getAll<T>(type)` returns array of objects
- [ ] `filter<T>(type, predicate)` returns filtered array
- [ ] All methods are memoized appropriately

**Tests:**
- Unit: Get returns correct object
- Unit: GetAll returns all objects of type
- Unit: Filter applies predicate correctly

### Story 2.3: Implement write operations
**Task:** Implement `update`, `delete`, `create` methods

**Acceptance:**
- [ ] `update(type, id, updates)` merges updates
- [ ] `delete(type, id)` removes object
- [ ] `create(type, partial)` generates id, adds timestamps
- [ ] All writes trigger re-render

**Tests:**
- Unit: Update merges correctly
- Unit: Delete removes object
- Unit: Create generates valid id

### Story 2.4: Implement hydrate/dehydrate
**Task:** Convert between NarrativeSchemaV2 and registry state

**Acceptance:**
- [ ] `hydrate(schema)` populates registry from API response
- [ ] `dehydrate()` converts registry to API format
- [ ] Round-trip preserves all data
- [ ] V2.0 and V2.1 schemas both work

**Tests:**
- Unit: Hydrate populates correctly
- Unit: Dehydrate produces valid schema
- Unit: Round-trip is lossless

### Build Gate
```bash
npm run build
npm test
```

---

## Epic 3: Shared Components

**Goal:** Extract reusable UI components from NarrativeArchitect  
**Risk:** Low — Pure components, isolated changes  
**Dependencies:** None (can parallel with Epic 2)

### Story 3.1: Create SegmentedControl
**Task:** Extract ViewToggle pattern into `src/shared/SegmentedControl.tsx`

**Acceptance:**
- [ ] Generic over option type `<T extends string>`
- [ ] Props: options, value, onChange, size, fullWidth
- [ ] Renders horizontal button group
- [ ] Active state highlighted
- [ ] Foundation design tokens used

**Code Sample:**
```tsx
<SegmentedControl<'journeys' | 'nodes'>
  options={[
    { id: 'journeys', label: 'Journeys', icon: 'map' },
    { id: 'nodes', label: 'Nodes', icon: 'hub' },
  ]}
  value={viewMode}
  onChange={setViewMode}
/>
```

**Tests:**
- Unit: Renders all options
- Unit: Click triggers onChange
- Unit: Active option has correct styling

### Story 3.2: Create ObjectList
**Task:** Extract JourneyList/PersonaList pattern into `src/shared/ObjectList.tsx`

**Acceptance:**
- [ ] Generic over item type `<T>`
- [ ] Props: items, selectedId, activeInspectorId, onSelect, getItemProps
- [ ] Renders vertical list with status indicators
- [ ] Selection and inspector highlighting work
- [ ] Empty state shown when no items

**Code Sample:**
```tsx
<ObjectList
  items={journeys}
  selectedId={selectedJourneyId}
  activeInspectorId={inspectorJourneyId}
  onSelect={handleJourneyClick}
  getItemProps={(j) => ({
    id: j.id,
    label: j.title,
    count: nodeCount,
    status: j.status === 'active' ? 'active' : 'inactive',
  })}
/>
```

**Tests:**
- Unit: Renders items
- Unit: Click triggers onSelect
- Unit: Selected item highlighted
- Unit: Inspector item highlighted differently

### Story 3.3: Create ObjectGrid
**Task:** Extract NodeGrid/CardGrid pattern into `src/shared/ObjectGrid.tsx`

**Acceptance:**
- [ ] Generic over item type `<T>`
- [ ] Props: items, activeInspectorId, searchQuery, onSelect, getCardProps, columns
- [ ] Renders responsive grid of cards
- [ ] Cards show title, subtitle, badges
- [ ] Empty state and search empty state
- [ ] Scrollable with max height

**Code Sample:**
```tsx
<ObjectGrid
  items={filteredNodes}
  activeInspectorId={inspectorNodeId}
  searchQuery={searchQuery}
  onSelect={handleNodeClick}
  getCardProps={(node) => ({
    id: node.id,
    title: node.label,
    subtitle: node.id,
    badges: [{ label: `#${node.sequenceOrder}` }],
  })}
  columns={2}
/>
```

**Tests:**
- Unit: Renders grid of cards
- Unit: Click triggers onSelect
- Unit: Empty state shown when no items
- Unit: Search empty state shown when filtered to empty

### Story 3.4: Update shared exports
**Task:** Add new components to `src/shared/index.ts`

**Acceptance:**
- [ ] SegmentedControl exported
- [ ] ObjectList exported
- [ ] ObjectGrid exported

### Build Gate
```bash
npm run build
npm test
```

---

## Epic 4: NarrativeArchitect Migration

**Goal:** Update NarrativeArchitect to use extracted components  
**Risk:** Medium — Modifying production code  
**Dependencies:** Epic 3

### Story 4.1: Replace ViewToggle with SegmentedControl
**Task:** Import and use SegmentedControl in NarrativeArchitect

**Acceptance:**
- [ ] Inline ViewToggle removed
- [ ] SegmentedControl imported from shared
- [ ] View switching works identically
- [ ] Visual appearance unchanged

**Tests:**
- E2E: View toggle switches between journeys and nodes

### Story 4.2: Replace JourneyList/PersonaList with ObjectList
**Task:** Replace inline list components with ObjectList

**Acceptance:**
- [ ] Inline JourneyList removed
- [ ] Inline PersonaList removed
- [ ] ObjectList used for both
- [ ] Selection and inspector highlighting work
- [ ] Node counts display correctly

**Tests:**
- E2E: Click journey opens inspector
- E2E: Click persona filters cards

### Story 4.3: Replace NodeGrid/CardGrid with ObjectGrid
**Task:** Replace inline grid components with ObjectGrid

**Acceptance:**
- [ ] Inline NodeGrid removed
- [ ] Inline CardGrid removed
- [ ] ObjectGrid used for both
- [ ] Badges display correctly
- [ ] Search filtering works
- [ ] Inspector selection highlighting works

**Tests:**
- E2E: Click node opens inspector
- E2E: Search filters nodes

### Build Gate
```bash
npm run build
npm test
npx playwright test tests/e2e/foundation/
```

---

## Epic 5: Hook Migration

**Goal:** Update useNarrativeSchema to delegate to DEXRegistry  
**Risk:** Low — Internal refactor, API unchanged  
**Dependencies:** Epic 2, Epic 4

### Story 5.1: Wrap App with DEXRegistryProvider
**Task:** Add registry provider to app root

**Acceptance:**
- [ ] DEXRegistryProvider wraps FoundationWorkspace
- [ ] Registry initializes correctly
- [ ] No visual changes

### Story 5.2: Refactor useNarrativeSchema
**Task:** Delegate internal state to DEXRegistry

**Acceptance:**
- [ ] Public API unchanged
- [ ] Internal state delegated to registry
- [ ] Load/save cycle works
- [ ] GitHub sync works
- [ ] All existing tests pass

**Tests:**
- E2E: Load narrative data
- E2E: Save to production
- E2E: Inspector flows work

### Build Gate (Final)
```bash
npm run build
npm test
npx playwright test
```

---

## Commit Sequence

```
feat: add DEX type system (Epic 1)
  - src/core/schema/dex.ts
  - src/core/schema/index.ts
  - tests/unit/core/schema/dex.test.ts

feat: add DEX registry (Epic 2)
  - src/core/registry/DEXRegistry.tsx
  - src/core/registry/useDEXRegistry.ts
  - src/core/registry/index.ts
  - tests/unit/core/registry/DEXRegistry.test.ts

feat: add shared components (Epic 3)
  - src/shared/SegmentedControl.tsx
  - src/shared/ObjectList.tsx
  - src/shared/ObjectGrid.tsx
  - tests/unit/shared/*.test.tsx

refactor: NarrativeArchitect uses shared components (Epic 4)
  - src/foundation/consoles/NarrativeArchitect.tsx

refactor: useNarrativeSchema delegates to DEXRegistry (Epic 5)
  - src/foundation/hooks/useNarrativeSchema.ts
  - App wrapper update
```

---

## Definition of Done

- [ ] All unit tests pass
- [ ] All E2E tests pass
- [ ] Build succeeds
- [ ] No TypeScript errors
- [ ] NarrativeArchitect works identically
- [ ] Inspector flows work
- [ ] Save to Production works
- [ ] Code has JSDoc comments
- [ ] DEVLOG.md updated with execution notes
