# Migration Map: Versioned Collection Refactor

**Sprint:** versioned-collection-refactor-v1
**Date:** 2025-12-26
**Author:** Claude Opus 4.5

## Execution Order

```
Epic 1: Core Infrastructure
    ├── 1.1 Create merge-config.ts
    └── 1.2 Export from versioning index

Epic 2: Generic Hook
    ├── 2.1 Create useVersionedCollection.ts
    └── 2.2 Add unit tests

Epic 3: Event System
    ├── 3.1 Add onInspectorClosed to WorkspaceUIContext
    └── 3.2 Update closeInspector to emit event

Epic 4: Migrate Consumers
    ├── 4.1 Update LensPicker to use generic hook
    ├── 4.2 Update JourneyList to use generic hook
    └── 4.3 Delete old hooks

Epic 5: Verification
    ├── 5.1 Run all tests
    └── 5.2 Manual testing
```

## File Changes

### CREATE

| File | Epic | Purpose |
|------|------|---------|
| `src/core/versioning/merge-config.ts` | 1.1 | Declarative merge configuration |
| `hooks/useVersionedCollection.ts` | 2.1 | Generic hook |
| `tests/unit/versioning/collection.test.ts` | 2.2 | Unit tests |

### MODIFY

| File | Epic | Changes |
|------|------|---------|
| `src/core/versioning/index.ts` | 1.2 | Export `MERGE_CONFIGS`, `MergeConfig` |
| `src/workspace/WorkspaceUIContext.tsx` | 3.1-3.2 | Add event emission |
| `src/explore/LensPicker.tsx` | 4.1 | Use generic hook, remove effect |
| `src/explore/JourneyList.tsx` | 4.2 | Use generic hook, remove effect |

### DELETE

| File | Epic | Reason |
|------|------|--------|
| `hooks/useVersionedPersonas.ts` | 4.3 | Replaced by generic |
| `hooks/useVersionedJourneys.ts` | 4.3 | Replaced by generic |

## Rollback Plan

Each epic is independently revertible:

```bash
# Rollback Epic 4 (if consumers break)
git revert HEAD~3  # Reverts 4.1, 4.2, 4.3

# Rollback Epic 3 (if events break)
git revert HEAD~2  # Reverts 3.1, 3.2

# Rollback Epic 2 (if hook breaks)
git revert HEAD~2  # Reverts 2.1, 2.2

# Full rollback
git reset --hard HEAD~8
```

## Dependency Graph

```
merge-config.ts (1.1)
        ↓
versioning/index.ts (1.2)
        ↓
useVersionedCollection.ts (2.1) ← tests (2.2)
        ↓
WorkspaceUIContext.tsx (3.1, 3.2)
        ↓
LensPicker.tsx (4.1)
JourneyList.tsx (4.2)
        ↓
Delete old hooks (4.3)
```

## Build Gates

After each epic:

```bash
# Must pass
npm run build    # Compiles
npm test         # 196+ tests pass
```

After Epic 4 (full migration):

```bash
# Full verification
npm run build && npm test
```
