# Architectural Decisions: prompt-unification-v1

**Decision log with rationale**

---

## ADR-001: Unified Prompt Object Type

**Date:** January 3, 2026  
**Status:** Accepted  
**Deciders:** Jim, Claude

### Context

Grove has multiple content types that surface contextually:
- Journey waypoints (guided sequences)
- Stakeholder briefings (persona-specific)
- Wizard steps (configuration flows)
- Suggested prompts (free exploration)

These are currently separate systems with different schemas and storage.

### Decision

Unify all contextual content into a single **Prompt** object type with:
- Declarative targeting (when to surface)
- Optional sequence membership (ordered collections)
- Lens/topic affinities (relevance weighting)

### Rationale

1. **Same structure:** All types have label, content, targeting, optional ordering
2. **DEX compliance:** Sequences in config, not code
3. **Single console:** One PromptWorkshop manages all content types
4. **Cross-pollination:** Same prompt can appear in journey AND briefing
5. **Unified analytics:** Stats tracked consistently across contexts

### Consequences

**Positive:**
- Simpler mental model
- One data layer, one console, one query pattern
- Domain experts create journeys via metadata

**Negative:**
- Migration of existing content required (future sprint)
- Sequences derived at runtime (minor compute cost)

---

## ADR-002: Sequences Derived from Prompt Metadata

**Date:** January 3, 2026  
**Status:** Accepted  
**Deciders:** Jim, Claude

### Context

Two options for storing sequence information:
1. Separate `sequences` table with prompt references
2. Sequence membership stored in prompt `sequences[]` array

### Decision

Store sequence membership directly in `PromptPayload.sequences[]`. Derive sequence definitions at runtime.

### Rationale

1. **Single source of truth:** Prompt owns its sequence memberships
2. **No orphans:** Deleting prompt automatically removes from sequences
3. **Query simplicity:** One table, GIN index on sequences JSONB
4. **Multi-membership:** Same prompt in multiple sequences naturally
5. **DEX alignment:** Configuration in the object, not external tables

### Consequences

**Positive:**
- Simpler schema (one table)
- No referential integrity concerns
- Natural multi-sequence membership

**Negative:**
- Deriving sequence list requires scanning all prompts
- No sequence-level metadata (title, description) stored separately

**Mitigation:** Cache derived sequences in UI state. For large prompt counts, add materialized view.

---

## ADR-003: Flat Payload with JSONB for Complex Fields

**Date:** January 3, 2026  
**Status:** Accepted  
**Deciders:** Jim, Claude

### Context

Database schema options:
1. Single JSONB `payload` column (like other Grove objects)
2. Flattened columns with JSONB for complex fields
3. Fully normalized with separate tables

### Decision

Hybrid approach: Flatten common query fields (label, status, source), use JSONB for complex nested structures (targeting, sequences, affinities, stats).

### Rationale

1. **Query efficiency:** Filtering by status, source uses B-tree index
2. **Flexibility:** Complex structures evolve without migrations
3. **GIN indexing:** JSONB fields get GIN indexes for containment queries
4. **Pattern consistency:** Similar to other Grove object tables

### Schema

```sql
-- Flat fields (indexed)
label TEXT NOT NULL,
status TEXT DEFAULT 'active',
source TEXT DEFAULT 'library',

-- JSONB fields (GIN indexed)
targeting JSONB DEFAULT '{}',
sequences JSONB DEFAULT '[]',
topic_affinities JSONB DEFAULT '[]',
lens_affinities JSONB DEFAULT '[]',
stats JSONB DEFAULT '{...}',
```

### Consequences

**Positive:**
- Fast equality queries on flat fields
- Flexible evolution of nested structures
- Containment queries on JSONB via GIN

**Negative:**
- Some duplication between type and schema
- JSONB updates require full field replacement

---

## ADR-004: Pure Function Scoring Algorithm

**Date:** January 3, 2026  
**Status:** Accepted  
**Deciders:** Jim, Claude

### Context

How to determine which prompts to surface in free exploration?

### Decision

Implement `scorePrompt(prompt, context)` as a **pure function** with deterministic algorithm. No AI dependency.

### Rationale

1. **Capability Agnosticism:** System works without AI (DEX Pillar II)
2. **Testable:** Pure function with predictable outputs
3. **Fast:** No API calls, runs client-side
4. **Explainable:** Score breakdown can be shown to admins

### Algorithm Components

| Factor | Points | Condition |
|--------|--------|-----------|
| Base weight | 0-100 | `prompt.baseWeight` |
| Stage match | +20 | Stage in targeting.stages |
| Lens match | +30 | Lens in targeting.lensIds |
| Lens affinity | 0-25 | `affinity.weight * 25` |
| Topic affinity | 0-15 | Per matching topic |
| Moment trigger | +40 | Active moment matches |

### Consequences

**Positive:**
- Predictable, testable behavior
- No runtime AI dependency
- Fast client-side execution

**Negative:**
- Less "intelligent" than AI-driven selection
- Manual tuning of weights required

**Future:** AI copilot can suggest targeting improvements based on engagement data.

---

## ADR-005: Follow LensWorkshop Console Pattern

**Date:** January 3, 2026  
**Status:** Accepted  
**Deciders:** Jim, Claude

### Context

How to structure PromptWorkshop console?

### Decision

Follow exact structure of LensWorkshop:

```
src/bedrock/consoles/PromptWorkshop/
├── index.ts
├── PromptWorkshop.tsx
├── PromptWorkshop.config.ts
├── usePromptData.ts
├── prompt-transforms.ts
├── PromptCard.tsx
├── PromptEditor.tsx
├── PromptGrid.tsx
├── PromptInspector.tsx
├── SequenceNav.tsx
└── PromptCopilotActions.ts
```

### Rationale

1. **Proven pattern:** LensWorkshop works, tested
2. **Consistency:** Same structure across consoles
3. **Bedrock Contract:** Satisfies Article II requirements
4. **Onboarding:** Developers learn one pattern

### Consequences

**Positive:**
- Fast implementation (copy and adapt)
- Guaranteed contract compliance
- Consistent developer experience

**Negative:**
- SequenceNav is unique (not in LensWorkshop)
- Some forced structure that may not be optimal

---

## ADR-006: Stats Tracking via Patch Operations

**Date:** January 3, 2026  
**Status:** Accepted  
**Deciders:** Jim, Claude

### Context

How to update prompt statistics (impressions, selections, completions)?

### Decision

Use JSON Patch operations via `useGroveData.update()`:

```typescript
await provider.update('prompt', id, [{
  op: 'replace',
  path: '/payload/stats/impressions',
  value: current + 1
}]);
```

### Rationale

1. **Atomic updates:** Single field updated, not full object
2. **Pattern consistency:** Same as other Grove object updates
3. **Audit trail:** Patches logged for provenance
4. **Conflict handling:** Optimistic updates with retry

### Consequences

**Positive:**
- Minimal data transfer
- Works with existing infrastructure
- Provenance maintained

**Negative:**
- High-frequency updates could cause contention
- No batching for multiple stat updates

**Future:** For high-traffic, consider dedicated stats table or analytics service.

---

## Decision Log

| ADR | Decision | Status |
|-----|----------|--------|
| 001 | Unified Prompt object type | Accepted |
| 002 | Sequences derived from metadata | Accepted |
| 003 | Flat payload with JSONB | Accepted |
| 004 | Pure function scoring | Accepted |
| 005 | Follow LensWorkshop pattern | Accepted |
| 006 | Stats via patch operations | Accepted |
