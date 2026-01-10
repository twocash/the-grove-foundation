# DECISIONS: System Prompt Versioning v1

**Sprint:** system-prompt-versioning-v1  
**Date:** January 10, 2026

---

## Decision Log

### D-001: Append-Only for Active Prompts Only

**Context:**  
We need versioning for SystemPrompt objects. The question is whether ALL saves create new versions, or only saves to the active prompt.

**Options Considered:**

| Option | Pros | Cons |
|--------|------|------|
| A. All saves create versions | Complete history for everything | Massive record growth for draft iterations |
| B. Only active saves create versions | Focused history, manageable growth | Draft history lost |
| C. Configurable per-save | Maximum flexibility | UI complexity, user confusion |

**Decision:** Option B - Only active prompt saves create new versions

**Rationale:**
- Draft edits are exploratory; users don't expect history there
- Active prompt changes are "production deployments" - these matter
- Aligns with existing `createVersion()` pattern (explicit fork action)
- Matches mental model: "deploying a new version to production"

**Consequences:**
- Draft prompts continue using mutation (simpler, expected)
- Only the "Save & Activate" action on active prompts triggers versioning
- Future: Could add "Save Draft as Version" if needed

---

### D-002: Create-Then-Archive Order

**Context:**  
The saveAndActivate operation has two database writes. Which order?

**Options Considered:**

| Option | Pros | Cons |
|--------|------|------|
| A. Archive first, then create | Old version safe before new exists | Creates gap where no active exists |
| B. Create first, then archive | New version exists before old disappears | Brief moment with 2 actives |

**Decision:** Option B - Create first, then archive

**Rationale:**
- **Data safety**: If create fails, nothing is lost
- **User experience**: Better to have 2 actives briefly than 0
- **Recovery**: Duplicate active is easy to fix; missing active is harder
- **Server behavior**: Server takes first active it finds (non-breaking)

**Consequences:**
- In rare failure cases, may have 2 active prompts
- Need admin tooling (or manual Supabase fix) for edge cases
- Server's `fetchActiveSystemPrompt()` uses `LIMIT 1` so it's safe

---

### D-003: Pass Changes as Object, Not Patches

**Context:**  
The editor has been applying patches to local state. Should `saveAndActivate` receive patches or the final state?

**Options Considered:**

| Option | Pros | Cons |
|--------|------|------|
| A. Pass patch array | Consistent with update() interface | Must reconstruct final state in hook |
| B. Pass final payload | Simple merge | Inconsistent with update() pattern |
| C. Pass delta object (only changed fields) | Clean, minimal | Must extract delta from editor state |

**Decision:** Option C - Pass delta object (changed fields only)

**Rationale:**
- Editor already knows which fields changed (via hasChanges tracking)
- Simpler than patch reconstruction
- Hook spreads delta over existing payload
- Cleaner API: `saveAndActivate(prompt, { identity: "new value" })`

**Consequences:**
- Editor must extract changed fields from local state
- Hook merges: `{ ...currentPrompt.payload, ...pendingChanges }`
- More intuitive than patch operations for this use case

---

### D-004: Refetch After Create (Not Optimistic Update)

**Context:**  
After creating new version, how should UI update?

**Options Considered:**

| Option | Pros | Cons |
|--------|------|------|
| A. Optimistic update | Instant UI response | Complex state management, potential desync |
| B. Refetch all prompts | Simple, guaranteed correct | Brief flash/delay |
| C. Return created object, update locally | Fast, minimal network | Metrics may be stale |

**Decision:** Option B - Refetch all prompts

**Rationale:**
- Console already has refetch pattern
- Metrics (Total/Archived/Active counts) need recalculation
- List view needs to show new record and archived old record
- Simplest implementation, most reliable

**Consequences:**
- Brief loading state after save
- All counts guaranteed accurate
- No complex state reconciliation needed

---

### D-005: No Transaction Wrapper

**Context:**  
Should we wrap create + archive in a transaction?

**Options Considered:**

| Option | Pros | Cons |
|--------|------|------|
| A. Supabase RPC function | Atomic operation | Requires migration, more complex |
| B. Client-side ordered operations | Simple, no migration | Not atomic |
| C. Edge function with transaction | Atomic, flexible | Infrastructure change |

**Decision:** Option B - Client-side ordered operations

**Rationale:**
- Low frequency operation (admins only, occasional)
- Failure case is recoverable (duplicate active is visible, fixable)
- No schema/infrastructure changes needed
- Matches existing patterns in codebase

**Consequences:**
- Rare edge case of duplicate actives
- Document recovery procedure
- Consider RPC in future if frequency increases

---

### D-006: Keep Version in Payload, Not Meta

**Context:**  
The `version` field lives in `payload`. Should it move to `meta` for consistency?

**Options Considered:**

| Option | Pros | Cons |
|--------|------|------|
| A. Move to meta | Consistent with other meta fields | Breaking change, migration needed |
| B. Keep in payload | No changes needed | Slight inconsistency |
| C. Add to both | Maximum flexibility | Duplication |

**Decision:** Option B - Keep version in payload

**Rationale:**
- Schema already exists with version in payload
- No migration needed
- version is type-specific (not all GroveObjects need it)
- previousVersionId is also in payload (keep them together)

**Consequences:**
- Access pattern: `prompt.payload.version`
- Future object types can choose where to put versioning

---

### D-007: Editor Detects Active Status Locally

**Context:**  
How should the editor know to call `saveAndActivate` vs regular save?

**Options Considered:**

| Option | Pros | Cons |
|--------|------|------|
| A. Parent passes different onSave callback | Clean separation | Parent must know editor internals |
| B. Editor checks prompt.meta.status | Simple, local decision | Editor needs status awareness |
| C. Add explicit prop: isVersionedSave | Most explicit | Extra prop complexity |

**Decision:** Option B - Editor checks status locally

**Rationale:**
- Editor already has full prompt object
- Status is part of meta, always available
- Simple conditional: `if (status === 'active') { saveAndActivate() } else { onSave() }`
- No prop drilling needed

**Consequences:**
- Editor must receive `saveAndActivate` function as prop
- Editor handles the branch logic internally
- Parent stays simple

---

## Summary

| ID | Decision | Impact |
|----|----------|--------|
| D-001 | Append-only for active only | Limits scope, manageable growth |
| D-002 | Create-then-archive order | Safe failure mode |
| D-003 | Pass changes as object | Clean API |
| D-004 | Refetch after create | Reliable state |
| D-005 | No transaction wrapper | Simple, recoverable |
| D-006 | Keep version in payload | No migration |
| D-007 | Editor detects status | Local decision |

---

*Decisions complete. Proceed to MIGRATION_MAP.md*
