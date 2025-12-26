# Architectural Decision Records: Object Versioning v1

**Sprint:** `object-versioning-v1`  
**Date:** 2024-12-26

---

## ADR-006: Version Retention Limit

### Context
Version history can grow unbounded. We need to balance history depth against storage limits and query performance.

### Decision
**50 versions per object (MVP limitation)**

When version count exceeds 50, prune oldest versions automatically.

### Rationale
- IndexedDB has per-origin quota limits (~50MB minimum, often more)
- 50 versions provides meaningful undo history
- Pruning is automatic and transparent
- Can be increased in future sprints

### Consequences
- Code comments document this as MVP limitation
- `pruneVersions()` called automatically after each write
- Future sprint can add configurable retention policies

---

## ADR-007: Baseline Import Strategy

### Context
When loading an object for the first time (no stored version exists), we need a consistent starting point for the version chain.

### Decision
**Auto-create "v1 - System Import" version**

```typescript
const baselineVersion: ObjectVersion = {
  versionId: generateUUID(),
  objectId: object.meta.id,
  ordinal: 1,
  actor: { type: 'system', model: null },
  source: { type: 'import' },
  patch: [], // Empty patch - represents initial state
  message: 'Initial import from system configuration',
  previousVersionId: null
};
```

### Rationale
- Ensures unbroken provenance chain from first load
- Every object has at least one version
- Consistent with DEX Pillar III (Provenance as Infrastructure)
- Distinguishes imported content from user modifications

### Consequences
- First load triggers async write to IndexedDB
- Loading states needed in UI during import
- All objects gain version history over time

---

## ADR-008: Actor Model Identifier Taxonomy

### Context
Need to track which layer of the hybrid architecture processed each change. UI should show friendly labels while backend uses programmatic identifiers.

### Decision
**Use `hybrid-local` and `hybrid-cloud` as routing parameters**

| Programmatic ID | UI Label | When Used |
|-----------------|----------|-----------|
| `hybrid-local` | "Local 7B (Simulated)" | Current simulated local model |
| `hybrid-cloud` | "Cloud API" | Future cloud routing |

### Rationale
- Future-proof: Same taxonomy works when real local models ship
- Clear separation: backend identifiers vs. UI labels
- Extensible: Can add `hybrid-edge`, `hybrid-custom`, etc.
- Consistent with Grove's hybrid architecture thesis

### Consequences
- `getActorModelLabel()` function translates IDs to UI strings
- Analytics can aggregate by model tier
- Routing logic (future) can key off these identifiers

---

## ADR-009: Session ID Source

### Context
Version records include `source.sessionId` for grouping related changes. Need to decide how to generate/obtain session IDs.

### Decision
**Use existing engagement session ID**

```typescript
import { getSessionId } from '../../core/engagement/persistence';

const source: VersionSource = {
  type: 'copilot',
  sessionId: getSessionId(), // Reuse engagement session
  intent: userInput
};
```

### Rationale
- Consistency: Same session across engagement events and versioning
- Prepares for user management: session → user mapping comes later
- Reduces complexity: No new session generation logic
- Analytics alignment: Version changes tied to engagement sessions

### Consequences
- Versioning depends on engagement module
- Session continuity matches engagement session lifecycle
- User management sprint will add user ID to session context

---

## ADR-010: Optimistic UI for Apply

### Context
When user clicks "Apply" on a Copilot patch, should we:
a) Wait for persist success before confirming, or
b) Confirm immediately and persist async?

### Decision
**Confirm immediately (optimistic UI) for MVP**

```typescript
// Show confirmation immediately
dispatch({ type: 'ADD_MESSAGE', message: confirmMessage });

// Persist async (fire and forget for MVP)
store.applyPatch(objectId, patch, actor, source)
  .catch(error => {
    // TODO: Future robustness - show error, allow retry
    console.error('Version persist failed:', error);
  });
```

### Rationale
- Better UX: Immediate feedback feels responsive
- Simplicity: MVP doesn't need error recovery UI
- Common pattern: Many apps use optimistic updates
- Low risk: Browser storage rarely fails

### Consequences
- Code comments note persist-wait as future option
- Error handling is minimal (console.error)
- Future sprint may add:
  - Persist failure notification
  - Retry mechanism
  - Pending indicator during persist

---

## ADR-011: Storage Layer Architecture

### Context
Need to persist version records reliably while maintaining fast read performance.

### Decision
**IndexedDB (authoritative) + localStorage (cache)**

```
Write: IndexedDB → localStorage cache update
Read: localStorage cache → IndexedDB fallback
```

### Rationale
- IndexedDB: Structured data, indexes for queries, larger quota
- localStorage: Synchronous reads, simpler API, cache only
- Hybrid: Fast reads via cache, reliable writes to IndexedDB
- SSR-safe: Both guarded with `typeof window` checks

### Consequences
- Two storage systems to manage
- Cache invalidation on writes (update cache after IndexedDB)
- Fallback path if IndexedDB unavailable (localStorage-only mode)
- Migration path to future backends via interface abstraction

---

## ADR-012: Service Layer Abstraction (A2UI Compatibility)

### Context
Future sprint will implement InspectorSurface abstraction for A2UI compatibility. Current versioning implementation should not block this.

### Decision
**All persistence logic in VersionedObjectStore interface, not React components**

```typescript
// CORRECT: Service interface
interface VersionedObjectStore {
  applyPatch(objectId, patch, actor, source): Promise<ObjectVersion>;
}

// React hook is thin wrapper
function useVersionedObject(objectId) {
  const store = getVersionedObjectStore();
  return { applyPatch: store.applyPatch.bind(store, objectId) };
}

// WRONG: Persistence in component
function useCopilot() {
  // Don't call IndexedDB directly from here
}
```

### Rationale
- Service layer is renderer-agnostic
- Same `VersionedObjectStore` can back A2UI or React
- Testing: Can mock store without rendering components
- Separation of concerns: Storage ≠ UI state

### Consequences
- Components receive store via context or module import
- Store instance is singleton (module-level)
- Future `InspectorSurface` will consume same store interface
- No persistence logic in hooks (only coordination)

---

## Decision Summary

| ADR | Decision | Key Consequence |
|-----|----------|-----------------|
| ADR-006 | 50 version limit | Auto-prune oldest versions |
| ADR-007 | Auto-import v1 | Every object has version chain |
| ADR-008 | hybrid-local/cloud IDs | UI labels separate from backend IDs |
| ADR-009 | Use engagement session | Versions grouped with engagement |
| ADR-010 | Optimistic UI | Confirm immediately, persist async |
| ADR-011 | IndexedDB + localStorage | Fast reads, reliable writes |
| ADR-012 | Service layer abstraction | A2UI-compatible architecture |

---

*Canonical location: `docs/sprints/object-versioning-v1/DECISIONS.md`*
