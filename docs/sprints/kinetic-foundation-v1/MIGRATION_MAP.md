# Kinetic Foundation v1.0 — Migration Map

**Sprint:** `kinetic-foundation-v1`  
**Date:** December 24, 2024

---

## Migration Overview

This sprint follows an **additive migration strategy**: new code is added alongside existing code, then existing code is refactored to consume from new modules. No deletions until all consumers migrate.

```
Phase 1: Create new types & registry (no breaking changes)
Phase 2: Create new components (no breaking changes)
Phase 3: Refactor NarrativeArchitect (internal change, API stable)
Phase 4: Update useNarrativeSchema (internal change, API stable)
```

---

## File-by-File Change Plan

### Phase 1: DEX Type System

#### CREATE: `src/core/schema/dex.ts`
**Purpose:** Define DEX object model with kinetic metadata  
**Dependencies:** None  
**Tests:** `tests/unit/core/schema/dex.test.ts`

```typescript
// Exports:
export type DEXObjectType
export interface DEXObject
export interface DEXJourney extends DEXObject
export interface DEXNode extends DEXObject
export interface DEXHub extends DEXObject
export interface DEXLens extends DEXObject
export interface DEXCard extends DEXObject
export interface DEXVersionEntry
```

#### CREATE: `src/core/schema/index.ts`
**Purpose:** Barrel export for schema types  
**Action:** Add `export * from './dex'`

---

### Phase 2: DEX Registry

#### CREATE: `src/core/registry/DEXRegistry.tsx`
**Purpose:** React context provider for registry state  
**Dependencies:** `src/core/schema/dex.ts`  
**Tests:** `tests/unit/core/registry/DEXRegistry.test.ts`

```typescript
// Exports:
export const DEXRegistryProvider: React.FC<{ children: ReactNode }>
export const DEXRegistryContext: React.Context<DEXRegistryContextValue>
```

#### CREATE: `src/core/registry/useDEXRegistry.ts`
**Purpose:** Hook for consuming registry  
**Dependencies:** `DEXRegistry.tsx`

```typescript
// Exports:
export function useDEXRegistry(): DEXRegistryContextValue
export function useDEXJourneys(): { journeys: DEXJourney[]; getJourney: (id: string) => DEXJourney | null }
export function useDEXNodes(): { nodes: DEXNode[]; getNode: (id: string) => DEXNode | null }
export function useDEXHubs(): { hubs: DEXHub[]; getHub: (id: string) => DEXHub | null }
export function useDEXLenses(): { lenses: DEXLens[]; getLens: (id: string) => DEXLens | null }
```

#### CREATE: `src/core/registry/index.ts`
**Purpose:** Barrel export  

```typescript
export * from './DEXRegistry'
export * from './useDEXRegistry'
```

---

### Phase 3: Shared Components

#### CREATE: `src/shared/SegmentedControl.tsx`
**Purpose:** Generic toggle control (extracted from NarrativeArchitect ViewToggle)  
**Dependencies:** None (pure component)  
**Tests:** `tests/unit/shared/SegmentedControl.test.tsx`

**Extracted from:** NarrativeArchitect.tsx lines 45-95 (ViewToggle)

#### CREATE: `src/shared/ObjectList.tsx`
**Purpose:** Generic list with selection state (extracted from JourneyList/PersonaList)  
**Dependencies:** None (pure component)  
**Tests:** `tests/unit/shared/ObjectList.test.tsx`

**Extracted from:** NarrativeArchitect.tsx lines 97-142 (JourneyList), lines 230-265 (PersonaList)

#### CREATE: `src/shared/ObjectGrid.tsx`
**Purpose:** Generic grid with cards (extracted from NodeGrid/CardGrid)  
**Dependencies:** `EmptyState`, `StatusBadge`  
**Tests:** `tests/unit/shared/ObjectGrid.test.tsx`

**Extracted from:** NarrativeArchitect.tsx lines 144-228 (NodeGrid), lines 267-320 (CardGrid)

#### MODIFY: `src/shared/index.ts`
**Action:** Add exports for new components

```diff
+ export { SegmentedControl } from './SegmentedControl';
+ export { ObjectList } from './ObjectList';
+ export { ObjectGrid } from './ObjectGrid';
```

---

### Phase 4: NarrativeArchitect Migration

#### MODIFY: `src/foundation/consoles/NarrativeArchitect.tsx`
**Current:** 571 lines with inline ViewToggle, JourneyList, PersonaList, NodeGrid, CardGrid  
**Target:** ~450 lines using imported components

**Changes:**
1. Remove inline ViewToggle → Import `SegmentedControl`
2. Remove inline JourneyList → Import `ObjectList`
3. Remove inline PersonaList → Import `ObjectList`
4. Remove inline NodeGrid → Import `ObjectGrid`
5. Remove inline CardGrid → Import `ObjectGrid`
6. Keep: Metrics row, save logic, inspector integration

**Diff Preview:**
```diff
- // Inline ViewToggle component
- const ViewToggle = ({ ... }) => { ... }
+ import { SegmentedControl, ObjectList, ObjectGrid } from '../../shared';

  // In render:
- <ViewToggle options={...} value={viewMode} onChange={setViewMode} />
+ <SegmentedControl options={...} value={viewMode} onChange={setViewMode} />

- <div className="space-y-1">
-   {allJourneys.map(journey => (
-     <div key={journey.id} ...>
-       ...
-     </div>
-   ))}
- </div>
+ <ObjectList
+   items={allJourneys}
+   selectedId={selectedJourneyId}
+   activeInspectorId={inspector.mode.type === 'journey' ? inspector.mode.journeyId : null}
+   onSelect={handleJourneyClick}
+   getItemProps={(j) => ({ id: j.id, label: j.title, count: nodeCount, status: j.status })}
+ />
```

---

### Phase 5: Hook Migration

#### MODIFY: `src/foundation/hooks/useNarrativeSchema.ts`
**Current:** 337 lines, direct GCS fetch, inline state management  
**Target:** Facade over DEXRegistry (same API, different internals)

**Strategy:** Keep existing public API, delegate internally to registry

```typescript
// Before: Direct state management
const [journeys, setJourneys] = useState<Record<string, Journey>>({});

// After: Delegate to registry
const { getAll, update, create, delete: remove } = useDEXRegistry();
const journeys = useMemo(() => getAll<DEXJourney>('journey'), [getAll]);
```

**Public API Unchanged:**
- `allJourneys`, `allNodes`, `allCards`, `allPersonas`
- `getJourney(id)`, `getNode(id)`, `getCard(id)`, `getPersona(id)`
- `updateCard()`, `deleteCard()`, `createCard()`
- `save()`, `loading`, `saving`, `status`

---

## Execution Order

```
Epic 1: DEX Types
├── Create src/core/schema/dex.ts
├── Create src/core/schema/index.ts
├── Write unit tests
└── Build gate: npm test

Epic 2: DEX Registry
├── Create src/core/registry/DEXRegistry.tsx
├── Create src/core/registry/useDEXRegistry.ts
├── Create src/core/registry/index.ts
├── Write unit tests
└── Build gate: npm test

Epic 3: Shared Components
├── Create src/shared/SegmentedControl.tsx
├── Create src/shared/ObjectList.tsx
├── Create src/shared/ObjectGrid.tsx
├── Update src/shared/index.ts
├── Write unit tests
└── Build gate: npm test

Epic 4: NarrativeArchitect Migration
├── Import new components
├── Replace inline ViewToggle with SegmentedControl
├── Replace inline JourneyList with ObjectList
├── Replace inline PersonaList with ObjectList
├── Replace inline NodeGrid with ObjectGrid
├── Replace inline CardGrid with ObjectGrid
├── Verify inspector integration works
└── Build gate: npm test && npx playwright test

Epic 5: Hook Migration
├── Wrap useNarrativeSchema with DEXRegistry
├── Keep public API stable
├── Verify save/load cycle works
└── Build gate: Full test suite
```

---

## Rollback Plan

Each epic is independently rollback-able:

| Epic | Rollback Action |
|------|-----------------|
| Epic 1 | Delete `src/core/schema/dex.ts` |
| Epic 2 | Delete `src/core/registry/` |
| Epic 3 | Delete new components, revert `src/shared/index.ts` |
| Epic 4 | Revert NarrativeArchitect.tsx to previous commit |
| Epic 5 | Revert useNarrativeSchema.ts to previous commit |

**Git Strategy:** One commit per story, squash merge per epic

---

## Verification Matrix

| File | Unit Test | E2E Test | Manual Check |
|------|-----------|----------|--------------|
| `dex.ts` | Type validation | — | — |
| `DEXRegistry.tsx` | CRUD operations | — | — |
| `useDEXRegistry.ts` | Hook behavior | — | — |
| `SegmentedControl.tsx` | Render, click | — | Visual |
| `ObjectList.tsx` | Render, select | — | Visual |
| `ObjectGrid.tsx` | Render, select, search | — | Visual |
| `NarrativeArchitect.tsx` | — | Inspector flow | Full walkthrough |
| `useNarrativeSchema.ts` | — | Save/load cycle | Save, refresh, verify |
