# Migration Map: bedrock-event-integration-v1

**Sprint:** bedrock-event-integration-v1  
**Date:** January 4, 2026

---

## Pre-Sprint State

### Committed (Sprint 2)

```
src/core/events/hooks/
├── context.tsx           ✅ Keep unchanged
├── provider.tsx          ✅ Keep unchanged  
├── useGroveEvents.ts     ✅ Keep unchanged
├── useDispatch.ts        ✅ Keep unchanged
├── useEventHelpers.ts    ✅ Keep unchanged
├── useSession.ts         ✅ Keep unchanged
├── useContextState.ts    ✅ Keep unchanged
├── useTelemetry.ts       ✅ Keep unchanged
├── useMomentContext.ts   ✅ Keep unchanged
├── useStream.ts          ✅ Keep unchanged
└── index.ts              ✅ Keep unchanged
```

### Uncommitted WIP (Sprint 3 partial)

```
src/core/events/hooks/
├── ExploreEventProvider.tsx   ✅ Keep (correct)
└── useEventBridge.ts          ❌ Discard and rewrite

data/narratives-schema.ts      ✅ Keep changes (feature flag)
src/core/config/defaults.ts    ✅ Keep changes (feature flag)
src/core/events/hooks/index.ts ⚠️ Modify (after rewrite)
```

---

## Files to Create

| File | Purpose | Lines (est.) |
|------|---------|--------------|
| `src/core/events/hooks/useLegacyBridge.ts` | Legacy translation | ~80 |
| `tests/unit/events/integration.test.tsx` | Integration tests | ~150 |
| `docs/sprints/bedrock-event-hooks-v1/DECISIONS.md` | Sprint 2 docs | ~100 |

---

## Files to Modify

### src/core/events/hooks/useEventBridge.ts

**Action:** Delete and recreate

**Before (current WIP):**
```typescript
// Creates events directly - WRONG
dispatch({
  type: 'RESPONSE_COMPLETED',
  queryId,
  responseLength,  // Invalid field
  hubId
});
```

**After (correct pattern):**
```typescript
// Delegates to typed helpers - CORRECT
if (isEnabled && isProviderAvailable) {
  typedEmit.responseCompleted(responseId, queryId, hasNavigation, spanCount, hubId);
}
legacy.onResponseCompleted(hubId);
```

### src/core/events/hooks/index.ts

**Before (current WIP):**
```typescript
export {
  ExploreEventProvider,
  useIsEventSystemEnabled,
  GROVE_EVENT_SYSTEM_FLAG
} from './ExploreEventProvider';

export {
  useEventBridge,
  useSafeEventBridge
} from './useEventBridge';
export type { EventBridgeAPI, EventBridgeEmit } from './useEventBridge';
```

**After:**
```typescript
// Integration Layer (Sprint: bedrock-event-integration-v1)
export {
  ExploreEventProvider,
  useIsEventSystemEnabled,
  GROVE_EVENT_SYSTEM_FLAG
} from './ExploreEventProvider';

export {
  useEventBridge,
  useSafeEventBridge
} from './useEventBridge';
export type { EventBridgeAPI, EventBridgeEmit } from './useEventBridge';

export { useLegacyBridge } from './useLegacyBridge';
export type { LegacyBridgeAPI } from './useLegacyBridge';
```

### docs/sprints/bedrock-event-hooks-v1/SPEC.md

**Add DEX compliance matrix retroactively:**

```markdown
## DEX Compliance Matrix (Retroactive)

### Feature: React Event Hooks

| Test | Pass/Fail | Evidence |
|------|-----------|----------|
| Declarative Sovereignty | ✅ | Hooks consume schema-defined types |
| Capability Agnosticism | ✅ | No LLM calls |
| Provenance as Infrastructure | ✅ | MetricAttribution base enforced |
| Organic Scalability | ✅ | Union types, pure projections |

**Blocking issues:** None.
```

---

## Files Unchanged

| File | Reason |
|------|--------|
| All Sprint 1 files | Already complete |
| All Sprint 2 hooks (except index) | Already correct |
| `ExploreEventProvider.tsx` | Already correct |
| Feature flag additions | Already correct |

---

## Git Operations

### Step 1: Stage preserved changes

```bash
git add data/narratives-schema.ts
git add src/core/config/defaults.ts
git add src/core/events/hooks/ExploreEventProvider.tsx
```

### Step 2: Discard WIP useEventBridge

```bash
git checkout -- src/core/events/hooks/useEventBridge.ts
git checkout -- src/core/events/hooks/index.ts
```

### Step 3: Create new files

```bash
# useLegacyBridge.ts (new)
# useEventBridge.ts (rewritten)
# integration.test.tsx (new)
```

### Step 4: Update index

```bash
git add src/core/events/hooks/index.ts
```

### Step 5: Commit

```bash
git add -A
git commit -m "feat(events): bedrock-event-integration-v1 - thin bridge pattern

Integration layer for explore routes:
- ExploreEventProvider with feature flag
- useEventBridge thin routing (delegates to useEventHelpers)
- useLegacyBridge for backward compat
- Integration tests

Fixes schema violations in previous WIP.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

---

## Dependency Graph

```
Sprint 1: bedrock-event-architecture-v1
    │
    ├── types.ts ────────────────────────┐
    ├── schema.ts ───────────────────────┤
    ├── projections/ ────────────────────┤
    └── store.ts ────────────────────────┤
                                         │
Sprint 2: bedrock-event-hooks-v1         │
    │                                    │
    ├── context.tsx ─────────────────────┤
    ├── provider.tsx ────────────────────┤
    └── useEventHelpers.ts ──────────────┤
                                         │
Sprint 3: bedrock-event-integration-v1   │
    │                                    │
    ├── ExploreEventProvider.tsx ─────── depends on provider.tsx
    ├── useEventBridge.ts ────────────── depends on useEventHelpers.ts
    └── useLegacyBridge.ts ───────────── standalone (legacy system)
```

---

## Rollback Plan

If Sprint 3 causes issues:

1. **Feature flag default is `false`** — No user impact
2. **Disable via URL:** `?grove-events=false`
3. **Git revert:** `git revert <commit>`
4. **Legacy system unchanged** — Fallback automatic

---

*Migration map documented for Foundation Loop Phase 4*
