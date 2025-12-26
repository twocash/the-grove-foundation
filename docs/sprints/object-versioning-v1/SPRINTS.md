# Sprint Plan: Object Versioning v1

**Sprint:** `object-versioning-v1`  
**Estimated Effort:** 6-7 hours  
**Date:** 2024-12-26

---

## Epic Overview

| Epic | Scope | Effort | Gate |
|------|-------|--------|------|
| 1 | Core Schema & Interface | 1.5h | Types compile |
| 2 | Storage Implementation | 2h | Unit tests pass |
| 3 | Copilot Integration | 1h | Apply creates version |
| 4 | UI Components | 1h | Version indicator renders |
| 5 | Inspector Wiring | 1h | End-to-end persistence |
| 6 | Testing & QA | 0.5h | All tests green |

---

## Epic 1: Core Schema & Interface

**Goal:** Define types and interfaces for the versioning system.

### Story 1.1: Create versioning schema types

**Task:** Create `src/core/versioning/schema.ts` with:
- `HybridModelId` type alias
- `VersionActor` interface
- `VersionSource` interface
- `ObjectVersion` interface
- `StoredObject` interface
- `getActorLabel()` helper
- `getModelLabel()` helper

**Files:** `src/core/versioning/schema.ts` (new, ~80 lines)

### Story 1.2: Create store interface

**Task:** Create `src/core/versioning/store.ts` with:
- `ListVersionsOptions` interface
- `VersionedObjectStore` interface
- Singleton accessor functions

**Files:** `src/core/versioning/store.ts` (new, ~40 lines)

### Story 1.3: Create utility functions

**Task:** Create `src/core/versioning/utils.ts` with:
- `generateUUID()` (crypto.randomUUID with fallback)
- `formatRelativeTime()` (ISO to "2 min ago")
- `generateChangeMessage()` (patch to description)

**Files:** `src/core/versioning/utils.ts` (new, ~30 lines)

### Build Gate

```bash
npm run build   # TypeScript compiles without errors
```

---

## Epic 2: Storage Implementation

**Goal:** Implement IndexedDB + localStorage storage layer.

### Story 2.1: Create localStorage cache

**Task:** Create `src/core/versioning/cache.ts` with:
- `getCached()` - Read from cache
- `setCache()` - Write to cache
- `clearCache()` - Clear single object
- `clearAllCache()` - Clear all versioned objects

**Files:** `src/core/versioning/cache.ts` (new, ~40 lines)

### Story 2.2: Create IndexedDB implementation

**Task:** Create `src/core/versioning/indexeddb.ts` with:
- `IndexedDBVersionStore` class implementing `VersionedObjectStore`
- Database initialization with schema
- All interface methods:
  - `initialize()`
  - `get()`
  - `getVersion()`
  - `listVersions()`
  - `applyPatch()`
  - `importObject()`
  - `pruneVersions()` - 50 version limit (MVP)
  - `clear()`
- Cache integration on reads and writes

**Files:** `src/core/versioning/indexeddb.ts` (new, ~180 lines)

### Story 2.3: Create module index

**Task:** Create `src/core/versioning/index.ts` with:
- Re-exports of all public types and functions
- Initialize default store instance

**Files:** `src/core/versioning/index.ts` (new, ~15 lines)

### Story 2.4: Unit tests for storage

**Task:** Create `src/core/versioning/__tests__/store.test.ts` with:
- Version creation test
- Ordinal increment test
- Pruning test (over 50 versions)
- Cache coherence test
- Import creates v1 test

**Files:** `src/core/versioning/__tests__/store.test.ts` (new, ~100 lines)

### Build Gate

```bash
npm run build   # Compiles
npm test -- --grep versioning   # Storage unit tests pass
```

---

## Epic 3: Copilot Integration

**Goal:** Create version records when user applies patches.

### Story 3.1: Modify useCopilot hook

**Task:** Update `src/shared/inspector/hooks/useCopilot.ts`:
- Import versioning store
- Import engagement session
- In `applyPatch()`:
  - Find triggering user message (for intent)
  - Call `store.applyPatch()` with actor and source
  - Update confirmation message with version ordinal
  - Make function async

**Files:** `src/shared/inspector/hooks/useCopilot.ts` (~25 lines changed)

### Story 3.2: Update onApplyPatch callback signature

**Task:** Update `ObjectInspector.tsx` and consumers:
- Change `onApplyPatch(patch)` to `onApplyPatch(patch, version?)`
- Handle optional version parameter in parent components

**Files:** 
- `src/shared/inspector/ObjectInspector.tsx` (~5 lines)
- Type definitions as needed

### Build Gate

```bash
npm run build   # Compiles
# Manual test: Apply patch in Copilot, check console for version creation
```

---

## Epic 4: UI Components

**Goal:** Display version information in the inspector.

### Story 4.1: Create VersionIndicator component

**Task:** Create `src/shared/inspector/VersionIndicator.tsx`:
- Props: ordinal, lastModifiedAt, lastModifiedBy
- Render format: "v{N} • Modified {time} via {actor}"
- Handle null state: "Draft • Unsaved"
- Disabled "View History" button with tooltip

**Files:** `src/shared/inspector/VersionIndicator.tsx` (new, ~50 lines)

### Story 4.2: Create useVersionedObject hook

**Task:** Create `src/shared/inspector/hooks/useVersionedObject.ts`:
- Parameters: objectId, initialObject
- Load from versioned store on mount
- Auto-import if not found
- Return: object, version, loading, error, applyPatch
- Handle async operations properly

**Files:** `src/shared/inspector/hooks/useVersionedObject.ts` (new, ~60 lines)

### Build Gate

```bash
npm run build   # Compiles
# Manual test: VersionIndicator renders in Storybook or isolated test
```

---

## Epic 5: Inspector Wiring

**Goal:** Connect versioning throughout the inspector flow.

### Story 5.1: Add VersionIndicator to ObjectInspector

**Task:** Update `src/shared/inspector/ObjectInspector.tsx`:
- Import VersionIndicator
- Add version prop to component interface
- Render VersionIndicator in header area
- Pass version data to indicator

**Files:** `src/shared/inspector/ObjectInspector.tsx` (~15 lines changed)

### Story 5.2: Update JourneyInspector

**Task:** Update `src/explore/JourneyInspector.tsx`:
- Import useVersionedObject
- Replace direct object usage with versioned hook
- Pass version to ObjectInspector
- Handle loading state
- Wire applyPatch to versioned store

**Files:** `src/explore/JourneyInspector.tsx` (~20 lines changed)

### Story 5.3: Update LensInspector

**Task:** Update `src/explore/LensInspector.tsx`:
- Same changes as JourneyInspector
- Import useVersionedObject
- Wire versioning through to ObjectInspector

**Files:** `src/explore/LensInspector.tsx` (~20 lines changed)

### Build Gate

```bash
npm run build   # Compiles
npm test        # All tests pass
# Manual test: Version indicator visible in inspector
```

---

## Epic 6: Testing & QA

**Goal:** Verify end-to-end functionality and edge cases.

### Story 6.1: Integration test for persistence

**Task:** Create E2E test or manual test checklist:
- [ ] Open journey inspector
- [ ] Modify via Copilot
- [ ] Apply patch
- [ ] Verify version indicator shows v2
- [ ] Refresh page
- [ ] Verify changes persisted
- [ ] Verify version indicator shows v2

### Story 6.2: Edge case testing

**Task:** Test edge cases:
- [ ] First load (should create v1)
- [ ] 50+ versions (should prune oldest)
- [ ] IndexedDB unavailable (graceful fallback)
- [ ] Multiple tabs (last-write-wins)
- [ ] SSR safety (no window errors)

### Story 6.3: Code review checklist

**Task:** Verify:
- [ ] All files have appropriate JSDoc comments
- [ ] MVP limitations documented in code
- [ ] A2UI compatibility notes in architecture
- [ ] No hardcoded values without constants
- [ ] Error handling for storage operations

### Build Gate

```bash
npm run build       # Compiles
npm test            # All tests pass
npx playwright test # E2E tests pass (if applicable)
```

---

## Final Verification

```bash
# Full build pipeline
npm run build
npm test
npm run lint

# Manual QA
# 1. Open inspector, apply edit, verify v2
# 2. Refresh, verify persistence
# 3. Check console for errors
# 4. Test with DevTools → Application → IndexedDB
```

---

## Definition of Done

- [ ] Objects modified via Copilot persist across refresh
- [ ] Version indicator displays correctly
- [ ] 50-version limit enforced with auto-prune
- [ ] Baseline import creates v1
- [ ] All unit tests pass
- [ ] Code documented with MVP notes
- [ ] No TypeScript errors
- [ ] No console errors in happy path

---

*Canonical location: `docs/sprints/object-versioning-v1/SPRINTS.md`*
