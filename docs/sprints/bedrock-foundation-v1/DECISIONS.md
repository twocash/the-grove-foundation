# Architectural Decision Records: bedrock-foundation-v1

**Sprint:** bedrock-foundation-v1  
**Version:** 1.0  
**Date:** December 30, 2024  

---

## ADR-001: Strangler Fig Pattern for Foundation Replacement

### Status
**Accepted**

### Context
The existing Foundation surface (`src/foundation/`) has grown organically with patterns that predate the GroveObject model and current DEX standards. Refactoring in place would risk breaking existing functionality and require extensive testing of legacy code.

### Decision
Implement Bedrock as a parallel system that coexists with Foundation. Once Bedrock achieves feature parity, deprecate and remove Foundation.

### Consequences
**Positive:**
- Zero risk to existing functionality
- Clean-room implementation follows current standards
- Can compare behaviors side-by-side during transition
- No pressure to migrate all features at once

**Negative:**
- Temporary code duplication (two admin surfaces)
- Must maintain both during transition
- Routes must not conflict

### Alternatives Considered
1. **In-place refactor** — Rejected: Too risky, hard to test incrementally
2. **Big bang rewrite** — Rejected: Blocks all other work until complete
3. **Feature flags** — Rejected: Adds complexity without isolation benefits

---

## ADR-002: REST API with GroveObject Envelopes

### Status
**Accepted**

### Context
Bedrock needs API endpoints for CRUD operations on lenses (and future object types). Options include REST, GraphQL, and tRPC.

### Decision
Use REST endpoints with standardized GroveObject response envelopes. Create a `GroveApi` class that handles envelope wrapping/unwrapping.

### Consequences
**Positive:**
- Consistent with existing `server.js` patterns
- No new build dependencies
- Simple to debug (curl, browser tools)
- GroveObject envelope provides consistent structure

**Negative:**
- No automatic type inference (unlike tRPC)
- Manual envelope handling required

### Alternatives Considered
1. **GraphQL** — Rejected: Overkill for current needs, adds Apollo complexity
2. **tRPC** — Rejected: Build chain overhead, server.js not set up for it

### Response Envelope Format
```typescript
interface ApiResponse<T> {
  data: T;
  meta: { count?, page?, pageSize?, totalPages? };
}
```

---

## ADR-003: Optimistic UI Without WebSockets

### Status
**Accepted**

### Context
Users expect immediate feedback when editing. Real-time collaboration (multiple users editing simultaneously) was considered.

### Decision
Implement optimistic UI updates using the Patch pattern. Apply changes locally immediately, then sync with server. No WebSocket infrastructure.

### Consequences
**Positive:**
- Perceived instant response
- No WebSocket infrastructure to maintain
- No CRDT/OT complexity
- Works offline with pending sync

**Negative:**
- No true real-time collaboration
- Conflicts must be resolved on revalidation

### Alternatives Considered
1. **WebSockets + CRDT** — Rejected: Massive complexity for uncertain benefit
2. **Polling** — Rejected: Inefficient, still not real-time
3. **Server-Sent Events** — Rejected: One-way, doesn't help with edits

### Implementation
```
User edits field
  → Apply to local state (instant)
  → Send PATCH to server (async)
  → Revalidate response (confirm or rollback)
```

---

## ADR-004: Mandatory Undo/Redo via Inverse Patches

### Status
**Accepted**

### Context
Bedrock is a "Workshop" tool where users configure system behavior. Mistakes are inevitable. Recovery is essential.

### Decision
Implement undo/redo using inverse patch stack. Every edit (manual or Copilot) generates a patch and its inverse. Undo applies inverse; redo reapplies forward.

### Consequences
**Positive:**
- Undo is essentially free (patch pattern already in place)
- Works for both manual edits and Copilot changes
- Consistent experience across all consoles

**Negative:**
- Memory overhead for history stack
- Must limit history depth

### Implementation
```typescript
interface PatchHistoryEntry {
  forward: PatchOperation[];
  inverse: PatchOperation[];
  timestamp: number;
  source: 'user' | 'copilot';
}
```

### Alternatives Considered
1. **No undo** — Rejected: Unacceptable for workshop tool
2. **Full state snapshots** — Rejected: Memory intensive
3. **Database-level undo** — Rejected: Too coarse, UI-unfriendly

---

## ADR-005: Console Configuration as Declarative JSON

### Status
**Accepted**

### Context
Each Bedrock console (Lens Workshop, Knowledge Garden, Journey Studio) shares structural patterns but differs in navigation, metrics, filters, and Copilot actions.

### Decision
Define console configuration as a TypeScript object (compile-time) that declaratively specifies navigation, metrics, filters, sorts, and Copilot actions. The console shell interprets this configuration.

### Consequences
**Positive:**
- DEX Declarative Sovereignty compliance
- New consoles require minimal code
- Configuration is self-documenting
- Easy to audit/compare console configs

**Negative:**
- TypeScript object, not runtime JSON (can't hot-reload)
- Must restart dev server for config changes

### Alternatives Considered
1. **Runtime JSON files** — Rejected: Harder to type-check, adds loading complexity
2. **Hardcoded per console** — Rejected: Violates Declarative Sovereignty
3. **Database-stored config** — Rejected: Overkill, no clear benefit

### Example
```typescript
export const lensWorkshopConfig: ConsoleConfig = {
  id: 'lens-workshop',
  title: 'Lens Workshop',
  navigation: [...],
  metrics: [...],
  collectionView: {...},
  copilot: {...},
};
```

---

## ADR-006: Copilot as Enhancement, Not Requirement

### Status
**Accepted**

### Context
Copilot provides natural language editing ("set description to X"). However, Copilot depends on external API (Gemini), which may be unavailable.

### Decision
Copilot enhances the editing experience but is not required. All functionality is accessible via traditional form controls. Copilot panel shows "unavailable" when API is unreachable.

### Consequences
**Positive:**
- DEX Capability Agnosticism compliance
- System works offline or without API
- Copilot failures don't break editing

**Negative:**
- Must maintain two editing paths (form + Copilot)
- Copilot features can't be exclusive

### Implementation
```
Copilot available → Show panel with input
Copilot unavailable → Show "Copilot unavailable" message
All edits → Work through same patch mechanism
```

---

## ADR-007: LensFilter Operator Expansion

### Status
**Accepted**

### Context
Initial spec included basic operators: `equals`, `contains`, `in`, `not`. Real-world filtering needs date ranges and existence checks.

### Decision
Expand `FilterOperator` type to include:
- `range` — For dates and numbers: `{ min?, max? }`
- `exists` — Field has a value
- `not_exists` — Field is null/empty

### Consequences
**Positive:**
- Handles date filtering (e.g., "modified this week")
- Handles number ranges (e.g., "priority 1-3")
- Supports optional field presence checks

**Negative:**
- More complex filter evaluation logic
- Value type varies by operator

### Full Operator List
```typescript
type FilterOperator = 
  | 'equals' | 'not_equals'
  | 'contains' | 'not_contains'
  | 'in' | 'not_in'
  | 'range'
  | 'exists' | 'not_exists';
```

---

## ADR-008: Favorites in localStorage with Optional Server Sync

### Status
**Accepted**

### Context
Users want to mark frequently-used lenses as favorites. Storage options include localStorage only, server only, or hybrid.

### Decision
Store favorites in localStorage (fast, works offline) with optional background sync to server user profile when authenticated.

### Consequences
**Positive:**
- Instant read/write
- Works without authentication
- Leverages existing `user-preferences.ts` pattern

**Negative:**
- Favorites don't sync across devices by default
- Must implement sync separately if needed

### Implementation
```typescript
// Uses existing pattern
const FAVORITES_KEY = 'bedrock:lens-workshop:favorites';
localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]));
```

---

## ADR-009: Test Strategy — Data Layer Before UI

### Status
**Accepted**

### Context
The sprint creates both hooks (logic) and components (UI). Testing order matters for confidence.

### Decision
Build and unit test the data layer (`useCollectionView`, `usePatchHistory`, `GroveApi`) before any UI components. Hooks should have 90%+ test coverage before wiring to components.

### Consequences
**Positive:**
- Bugs caught early in isolation
- UI development is confident (logic proven)
- Faster debugging (smaller surface area)

**Negative:**
- Can't see visual progress initially
- May discover UI integration issues late

### Test Priority Order
1. Unit tests for hooks
2. Integration tests for console
3. E2E tests for user flows
4. Visual regression baselines

---

## ADR-010: No Foundation Imports (ESLint Enforcement)

### Status
**Accepted**

### Context
The strangler fig pattern requires strict boundary between Bedrock and Foundation. Accidental imports would create coupling.

### Decision
Add ESLint rule to block any import from `src/foundation/` in `src/bedrock/` files.

### Consequences
**Positive:**
- Automatic enforcement
- Catches violations in IDE
- CI gate for PRs

**Negative:**
- Cannot share any Foundation code (even if useful)
- Must reimplement anything needed

### Implementation
```javascript
// .eslintrc.js
{
  rules: {
    'no-restricted-imports': ['error', {
      patterns: [{
        group: ['**/foundation/**'],
        message: 'Bedrock must not import from Foundation (strangler fig boundary)'
      }]
    }]
  }
}
```

---

## Summary Table

| ADR | Decision | DEX Pillar |
|-----|----------|------------|
| 001 | Strangler fig pattern | Organic Scalability |
| 002 | REST + GroveObject envelopes | Provenance |
| 003 | Optimistic UI, no WebSockets | Capability Agnosticism |
| 004 | Mandatory undo/redo | — |
| 005 | Declarative console config | Declarative Sovereignty |
| 006 | Copilot as enhancement | Capability Agnosticism |
| 007 | Expanded filter operators | — |
| 008 | localStorage + optional sync | — |
| 009 | Test data layer first | — |
| 010 | ESLint blocks Foundation imports | — |

---

**Proceed to SPRINTS.md.**
