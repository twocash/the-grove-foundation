# Repository Audit: Versioned Collection Refactor

**Sprint:** versioned-collection-refactor-v1
**Date:** 2025-12-26
**Author:** Claude Opus 4.5

## Executive Summary

The current versioning integration for collections (personas, journeys) violates DRY and DEX principles by duplicating nearly identical hooks. This audit identifies the pattern violations and proposes consolidation.

## Current State Analysis

### Files Under Review

| File | Purpose | Lines | Issues |
|------|---------|-------|--------|
| `hooks/useVersionedPersonas.ts` | Merge schema personas with IndexedDB overrides | 118 | Duplicate pattern |
| `hooks/useVersionedJourneys.ts` | Merge schema journeys with IndexedDB overrides | 115 | Duplicate pattern |
| `src/explore/LensPicker.tsx` | Display persona cards | 400 | Imperative refresh effect |
| `src/explore/JourneyList.tsx` | Display journey cards | 300 | Imperative refresh effect |
| `src/shared/inspector/hooks/useVersionedObject.ts` | Single object versioning | 165 | Good pattern (reusable) |

### Pattern Violations Identified

#### 1. DRY Violation: Duplicate Hooks

```typescript
// useVersionedPersonas.ts - Lines 45-68
async function loadVersionedOverrides() {
  const store = await getVersionedObjectStore();
  const overrides = new Map<string, StoredObject>();
  for (const persona of schemaPersonas) {
    const stored = await store.get(persona.id);
    if (stored && stored.versionCount > 0) {
      overrides.set(persona.id, stored);
    }
  }
  // ...
}

// useVersionedJourneys.ts - Lines 45-68 (NEARLY IDENTICAL)
async function loadVersionedOverrides() {
  const store = await getVersionedObjectStore();
  const overrides = new Map<string, StoredObject>();
  for (const journey of schemaJourneys) {
    const stored = await store.get(journey.id);
    if (stored && stored.versionCount > 0) {
      overrides.set(journey.id, stored);
    }
  }
  // ...
}
```

**Violation:** Two hooks with 90%+ code similarity.

#### 2. DEX Violation: Hardcoded Merge Logic

```typescript
// useVersionedPersonas.ts - Lines 87-106
return {
  ...schemaPersona,
  publicLabel: (versionedMeta.title as string) || schemaPersona.publicLabel,
  description: (versionedMeta.description as string) || schemaPersona.description,
  icon: (versionedMeta.icon as string) || schemaPersona.icon,
  color: (versionedPayload.color as string) || schemaPersona.color,
  // ... hardcoded field mappings
};
```

**Violation:** The merge logic is hardcoded per entity type instead of being declaratively configured.

#### 3. Imperative Refresh Pattern

```typescript
// LensPicker.tsx - Lines 224-230
const inspectorOpen = workspaceUI?.inspector?.isOpen ?? false;
useEffect(() => {
  if (!inspectorOpen) {
    refreshPersonas();
  }
}, [inspectorOpen, refreshPersonas]);
```

**Issues:**
- Fires on mount (when `inspectorOpen` starts `false`)
- Imperative effect instead of event-driven
- Duplicated in JourneyList.tsx

#### 4. Unstable Dependency Workaround

```typescript
// useVersionedPersonas.ts - Lines 34-35
const personaIds = useMemo(() => schemaPersonas.map(p => p.id).join(','), [schemaPersonas]);
// ...
}, [personaIds, refreshKey]); // Workaround for unstable array reference
```

**Issue:** Root cause is `getEnabledPersonas()` returning new array each call.

## Existing Patterns to Leverage

### 1. Generic Store Interface (Good Pattern)

```typescript
// src/core/versioning/store.ts
export interface VersionedObjectStore {
  get(objectId: string): Promise<StoredObject | null>;
  applyPatch(...): Promise<ObjectVersion>;
  importObject(...): Promise<ObjectVersion>;
}
```

This is already capability-agnostic and reusable.

### 2. WorkspaceUIContext Events (Potential Pattern)

```typescript
// src/workspace/WorkspaceUIContext.tsx
interface WorkspaceUIContextValue {
  inspector: InspectorState;
  openInspector(mode: InspectorMode): void;
  closeInspector(): void;  // Could emit event here
}
```

Could add an event system for inspector lifecycle.

### 3. Object Type Registry (Missing Pattern)

The codebase lacks a registry mapping object types to their merge strategies:

```typescript
// MISSING: Should exist
const OBJECT_MERGE_CONFIGS: Record<GroveObjectType, MergeConfig> = {
  lens: { ... },
  journey: { ... },
  card: { ... },
};
```

## DEX Compliance Gaps

| DEX Principle | Current State | Gap |
|---------------|---------------|-----|
| Declarative Sovereignty | Merge logic in code | Should be in config |
| Capability Agnosticism | Hooks are type-specific | Should be generic |
| Provenance | Good (versioning tracks actor) | OK |
| Organic Scalability | Adding new types requires new hooks | Should auto-extend |

## Technical Debt

1. **High:** Two hooks (personas, journeys) should be one generic
2. **Medium:** Refresh effect runs on mount unnecessarily
3. **Medium:** `getEnabledPersonas()` returns unstable reference
4. **Low:** No event system for inspector lifecycle

## Recommended Changes

1. Create `useVersionedCollection<T>()` generic hook
2. Add `MergeConfig` type for declarative field mappings
3. Add `onInspectorClosed` event to WorkspaceUIContext
4. Fix `getEnabledPersonas()` to return stable reference (memoized)

## Files to Create

| File | Purpose |
|------|---------|
| `hooks/useVersionedCollection.ts` | Generic hook replacing both specific hooks |
| `src/core/versioning/merge-config.ts` | Declarative merge configuration |

## Files to Modify

| File | Change |
|------|--------|
| `hooks/useVersionedPersonas.ts` | Delete (replaced by generic) |
| `hooks/useVersionedJourneys.ts` | Delete (replaced by generic) |
| `src/explore/LensPicker.tsx` | Use generic hook, event-driven refresh |
| `src/explore/JourneyList.tsx` | Use generic hook, event-driven refresh |
| `src/workspace/WorkspaceUIContext.tsx` | Add inspector lifecycle events |

## Test Coverage

| Area | Current Coverage | Gap |
|------|------------------|-----|
| `useVersionedPersonas` | None | Need unit tests |
| `useVersionedJourneys` | None | Need unit tests |
| `useVersionedObject` | None | Need unit tests |
| Merge logic | None | Need unit tests for field mapping |
