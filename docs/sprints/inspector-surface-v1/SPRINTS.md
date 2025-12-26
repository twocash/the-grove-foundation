# Sprint Plan: Inspector Surface v1

**Sprint:** `inspector-surface-v1`  
**Prerequisite:** object-versioning-v1  
**Estimated Effort:** 3-4 hours  
**Date:** 2024-12-26

---

## Epic Overview

| Epic | Scope | Effort | Gate |
|------|-------|--------|------|
| 1 | Types & Interface | 0.5h | Types compile |
| 2 | React Implementation | 1h | Unit tests pass |
| 3 | Context & Provider | 0.5h | Provider renders |
| 4 | Wire ObjectInspector | 1h | Inspector works via surface |
| 5 | Wire Parent Inspectors | 0.5h | End-to-end flow |

---

## Epic 1: Types & Interface

**Goal:** Define the InspectorSurface interface and related types.

### Story 1.1: Create types.ts

**Task:** Create `src/shared/inspector/surface/types.ts` with:
- `InspectorAction` discriminated union
- `ActionHandler` type
- `VersionInfo` interface
- `ModelInfo` interface
- `InspectorSurface<T>` interface with full JSDoc

**Files:** `src/shared/inspector/surface/types.ts` (new, ~80 lines)

**Acceptance:**
- All types compile
- JSDoc includes A2UI mapping notes

### Build Gate

```bash
npm run build   # TypeScript compiles
```

---

## Epic 2: React Implementation

**Goal:** Implement ReactInspectorSurface class.

### Story 2.1: Create ReactInspectorSurface

**Task:** Create `src/shared/inspector/surface/ReactInspectorSurface.ts`:
- Class implementing InspectorSurface
- Configuration interface
- State management (dataModel, version, messages, etc.)
- Data model operations (getValue, setValue, setDataModel)
- Action dispatch and subscription
- Versioning operations (applyPatch)
- Lifecycle (initialize, dispose)

**Files:** `src/shared/inspector/surface/ReactInspectorSurface.ts` (new, ~120 lines)

### Story 2.2: Unit tests

**Task:** Create `src/shared/inspector/surface/__tests__/ReactInspectorSurface.test.ts`:
- Test initialization
- Test getValue/setValue
- Test action dispatch
- Test applyPatch

**Files:** `src/shared/inspector/surface/__tests__/ReactInspectorSurface.test.ts` (new, ~60 lines)

### Build Gate

```bash
npm run build
npm test -- --grep InspectorSurface
```

---

## Epic 3: Context & Provider

**Goal:** Create React context for surface injection.

### Story 3.1: Create context.tsx

**Task:** Create `src/shared/inspector/surface/context.tsx`:
- `InspectorSurfaceContext` (internal)
- `InspectorSurfaceProvider` component
- `useInspectorSurface()` hook

**Files:** `src/shared/inspector/surface/context.tsx` (new, ~50 lines)

### Story 3.2: Create index.ts

**Task:** Create `src/shared/inspector/surface/index.ts`:
- Export all public types
- Export provider and hook

**Files:** `src/shared/inspector/surface/index.ts` (new, ~15 lines)

### Build Gate

```bash
npm run build
# Manual: Provider renders without error
```

---

## Epic 4: Wire ObjectInspector

**Goal:** Refactor ObjectInspector to consume surface from context.

### Story 4.1: Refactor ObjectInspector

**Task:** Update `src/shared/inspector/ObjectInspector.tsx`:
- Remove direct hook imports
- Add `useInspectorSurface()` call
- Replace hook usage with surface methods
- Update event handlers to dispatch actions

**Files:** `src/shared/inspector/ObjectInspector.tsx` (~25 lines changed)

### Story 4.2: Verify existing behavior

**Task:** Manual testing:
- [ ] Inspector renders with object data
- [ ] Version indicator displays
- [ ] Copilot messages display
- [ ] Send message works
- [ ] Apply patch works
- [ ] Changes persist

### Build Gate

```bash
npm run build
npm test
# Manual QA checklist above
```

---

## Epic 5: Wire Parent Inspectors

**Goal:** Wrap parent inspectors with provider.

### Story 5.1: Update JourneyInspector

**Task:** Update `src/explore/JourneyInspector.tsx`:
- Import InspectorSurfaceProvider
- Wrap ObjectInspector with provider
- Pass objectId and initialObject to provider

**Files:** `src/explore/JourneyInspector.tsx` (~10 lines changed)

### Story 5.2: Update LensInspector

**Task:** Update `src/explore/LensInspector.tsx`:
- Same changes as JourneyInspector

**Files:** `src/explore/LensInspector.tsx` (~10 lines changed)

### Story 5.3: End-to-end test

**Task:** Manual testing:
- [ ] Open Journey inspector → works
- [ ] Open Lens inspector → works
- [ ] Copilot edit + persist flow → works
- [ ] Page refresh → changes persisted

### Build Gate

```bash
npm run build
npm test
npm run lint
# Manual QA above
```

---

## Final Verification

```bash
# Full build pipeline
npm run build
npm test
npm run lint

# Manual QA
# 1. Open journey inspector
# 2. Send Copilot message
# 3. Apply patch
# 4. Verify changes
# 5. Refresh page
# 6. Verify persistence
```

---

## Definition of Done

- [ ] `InspectorSurface` interface defined with A2UI mapping docs
- [ ] `ReactInspectorSurface` implements interface
- [ ] Context provider works
- [ ] `ObjectInspector` consumes via context
- [ ] Parent inspectors wrap with provider
- [ ] All existing behavior preserved
- [ ] Unit tests pass
- [ ] No TypeScript errors
- [ ] No console errors

---

*Canonical location: `docs/sprints/inspector-surface-v1/SPRINTS.md`*
