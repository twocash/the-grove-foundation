# Development Log: bedrock-event-integration-v1

**Sprint:** bedrock-event-integration-v1  
**Executed:** January 4, 2026  
**Status:** ✅ Complete (with deviation)

---

## Execution Summary

| Metric | Value |
|--------|-------|
| Tests | 180 passing (158 hooks + 22 integration) |
| Files Created | 3 |
| Files Modified | 4 |
| Schema Bugs Fixed | 4 |

---

## What Shipped

### Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `src/core/events/hooks/ExploreEventProvider.tsx` | 96 | Feature flag wrapper |
| `src/core/events/hooks/useEventBridge.ts` | 365 | Dual-mode dispatch |
| `tests/unit/events/integration.test.tsx` | ~200 | Integration tests |

### Files Modified

| File | Changes |
|------|---------|
| `src/core/events/hooks/index.ts` | Added integration exports |
| `src/router/routes.tsx` | Wrapped /explore with provider |
| `data/narratives-schema.ts` | Added feature flag |
| `src/core/config/defaults.ts` | Added feature flag |

---

## Schema Violations Fixed

The pre-execution WIP had critical schema mismatches:

| Issue | Before | After |
|-------|--------|-------|
| Missing event type | `HUB_VISITED` | `HUB_ENTERED` ✅ |
| Missing event type | `SPROUT_CAPTURED` | `INSIGHT_CAPTURED` ✅ |
| Wrong field name | `trigger` | `source` ✅ |
| Missing required fields | `responseLength` only | `responseId`, `hasNavigation`, `spanCount` ✅ |

---

## Deviation from Foundation Loop Design

### Planned (EXECUTION_PROMPT.md)

```
useEventBridge.ts
    │
    ├──► useEventHelpers() (typed emit)
    │
    └──► useLegacyBridge() (isolated file)
```

### Actual Implementation

```
useEventBridge.ts
    │
    ├──► newDispatch() (inline event creation)
    │
    └──► getLegacyBus() (inline async import)
```

### Impact Assessment

| Concern | Impact | Verdict |
|---------|--------|---------|
| Schema compliance | None — events are correct | ✅ OK |
| Test coverage | None — 180 tests pass | ✅ OK |
| Feature flag | Works correctly | ✅ OK |
| Deprecation path | Harder — legacy not isolated | ⚠️ Tech debt |

### Remediation

Created backlog item: `docs/backlog/BACKLOG-001-extract-legacy-bridge.md`

Trigger: Execute when auditing legacy consumers for removal.

---

## Feature Flag Behavior

| State | New System | Legacy | Provider |
|-------|------------|--------|----------|
| `false` (default) | Off | On | Not wrapped |
| `true` | On | On (dual-write) | Wrapped |

### Override Mechanisms

1. **URL param:** `?grove-events=true`
2. **localStorage:** `grove-event-system-override=true`

---

## Test Coverage

```
PASS tests/unit/events/hooks.test.tsx (158 tests)
PASS tests/unit/events/integration.test.tsx (22 tests)

Test Suites: 2 passed
Tests:       180 passed
```

---

## Rollout Plan

| Phase | Action | Status |
|-------|--------|--------|
| 1 | Deploy with flag disabled | Current |
| 2 | Enable for internal testing via URL | Ready |
| 3 | Enable for 10% via admin | Pending |
| 4 | Enable for 100% | Pending |
| 5 | Remove legacy (future sprint) | Backlogged |

---

## Lessons Learned

1. **Execution diverged from spec** — CLI agent created events inline instead of delegating to `useEventHelpers`. Functionally correct but architecturally different.

2. **Schema validation caught bugs** — Original WIP would have failed at runtime. Sprint 1's Zod schemas protected us.

3. **Foundation Loop value confirmed** — The detailed REPO_AUDIT.md identified schema violations before they shipped.

---

## Next Sprint

**kinetic-suggested-prompts-v1** — Now trivial because:
- Event system wired to explore routes
- Projections available via hooks
- Clean consumption pattern established

---

*Log complete. Sprint 3 shipped with acceptable deviation.*
