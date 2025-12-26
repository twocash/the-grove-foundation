# Specification: Versioned Collection Refactor

**Sprint:** versioned-collection-refactor-v1
**Date:** 2025-12-26
**Author:** Claude Opus 4.5

## Problem Statement

The current versioning integration creates duplicate hooks for each collection type (personas, journeys), violating DRY and making the system harder to extend. Adding a new versioned collection (e.g., cards) would require copying ~120 lines of nearly identical code.

## Goals

1. **Single Generic Hook:** Replace `useVersionedPersonas` and `useVersionedJourneys` with one `useVersionedCollection<T>()` hook
2. **Declarative Merge Config:** Field mappings defined in configuration, not hardcoded
3. **Event-Driven Refresh:** Inspector lifecycle emits events instead of imperative effects
4. **Stable Dependencies:** Fix unstable array references in schema hooks

## Non-Goals

- Changing the IndexedDB storage format
- Modifying the `useVersionedObject` hook (already good pattern)
- Adding new object types to versioning
- UI/UX changes to the pickers

## Acceptance Criteria

### AC1: Generic Hook Works for All Types
```typescript
// Should work for any type with { id: string }
const { items: personas } = useVersionedCollection(schemaPersonas, 'lens');
const { items: journeys } = useVersionedCollection(schemaJourneys, 'journey');
```

**Test:** `npm test` passes with new hook tests

### AC2: Declarative Merge Configuration
```typescript
// Merge config defined declaratively
const MERGE_CONFIGS: Record<GroveObjectType, MergeConfig> = {
  lens: {
    metaFields: ['title', 'description', 'icon'],
    payloadFields: ['color', 'toneGuidance', 'narrativeStyle'],
  },
  journey: {
    metaFields: ['title', 'description'],
    payloadFields: ['targetAha', 'estimatedMinutes'],
  },
};
```

**Test:** Can add new object type by adding config entry only

### AC3: Event-Driven Refresh
```typescript
// WorkspaceUIContext emits event
workspaceUI.onInspectorClosed(() => {
  refresh();
});

// No more imperative effects
// REMOVED: useEffect(() => { if (!inspectorOpen) refresh(); }, ...)
```

**Test:** Refresh only fires when inspector actually closes, not on mount

### AC4: Zero Regression
```bash
npm test                    # All 196 tests pass
npm run build              # Compiles without errors
```

## Out of Scope

- Visual regression testing (no UI changes)
- E2E tests (pure refactor, behavior unchanged)
- Changes to production deployment

## Success Metrics

| Metric | Before | After |
|--------|--------|-------|
| Duplicate hook code | 230 lines | 0 lines |
| Hooks for collections | 2 | 1 (generic) |
| Hardcoded merge logic | 2 locations | 0 (config-driven) |
| Imperative refresh effects | 2 | 0 (event-driven) |

## Dependencies

- Existing `getVersionedObjectStore()` singleton
- Existing `StoredObject` type from versioning module
- WorkspaceUIContext for event emission

## Risks

| Risk | Mitigation |
|------|------------|
| Breaking existing functionality | Comprehensive unit tests before changes |
| TypeScript complexity with generics | Keep types simple, avoid over-engineering |
| Event system scope creep | Minimal event API (just `onInspectorClosed`) |
