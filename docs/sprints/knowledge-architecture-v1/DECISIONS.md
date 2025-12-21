# Architectural Decisions — Knowledge Architecture Rationalization

## ADR-001: Separation Strategy

**Status:** Accepted

**Date:** 2025-12-21

**Context:**
`narratives.json` contains 8 distinct concerns in 773 lines. This makes the file difficult to understand, maintain, and extend. The conflation violates separation of concerns and prevents the architecture from being self-documenting.

**Options Considered:**

### Option A: Keep Single File, Add Comments
- **Description:** Add section comments and a README explaining structure
- **Pros:** No migration risk, minimal code changes
- **Cons:** Doesn't solve conflation, comments drift from code, still 773 lines

### Option B: Split by Domain (Chosen)
- **Description:** Create separate files for exploration, knowledge, presentation, infrastructure
- **Pros:** Each file has single purpose, easier to maintain, enables validation
- **Cons:** More files to manage, server.js needs updated loading logic

### Option C: Split by Edit Frequency  
- **Description:** Separate "stable" config from "frequently edited" content
- **Pros:** Reduces churn in critical files
- **Cons:** Doesn't match conceptual model, confusing organization

**Decision:**
Option B — Split by domain. The conceptual separation (exploration vs. knowledge vs. presentation vs. infrastructure) matches how people think about the system and enables proper validation per domain.

**Consequences:**
- Server.js will load from multiple files instead of one
- Need backward-compat shim for gradual migration
- Each domain can evolve independently
- Schema validation becomes possible per-domain

---

## ADR-002: Hub Definition Reconciliation

**Status:** Accepted

**Date:** 2025-12-21

**Context:**
Two hub concepts exist:
1. `globalSettings.topicHubs` — Array with `priority`, `expertFraming`, `keyPoints`
2. `hubs` — Object with `path`, `primaryFile`, `tags`

Both define overlapping hubs (ratchet-effect, infrastructure-bet) with different schemas.

**Options Considered:**

### Option A: Keep Both, Document Difference
- **Pros:** No migration, works today
- **Cons:** Confusing, maintenance burden, schema drift

### Option B: Merge into `hubs`, Deprecate `topicHubs` (Chosen)
- **Pros:** Single source of truth, clear schema
- **Cons:** May lose `expertFraming`/`keyPoints` if not migrated

### Option C: Merge into `topicHubs`, Deprecate `hubs`
- **Pros:** Keeps prompt engineering metadata
- **Cons:** Array structure less ergonomic than keyed object

**Decision:**
Option B — The `hubs` object with keyed IDs is the canonical structure. Any useful fields from `topicHubs` (like `expertFraming`) will be migrated as optional fields on `Hub`. The `topicHubs` array will be removed after migration.

**Consequences:**
- `globalSettings.topicHubs` removed from schema
- `expertFraming` and `keyPoints` added as optional fields on Hub (if valuable)
- Discovery Mode routing uses `hubs[].tags` exclusively
- One place to define hub metadata

---

## ADR-003: Hub Path Standardization

**Status:** Accepted

**Date:** 2025-12-21

**Context:**
Current hub paths are inconsistent:
```
meta-philosophy      → hubs/meta-philosophy/
translation-emergence → knowledge/           # Different!
```

**Options Considered:**

### Option A: Allow Flexible Paths
- **Pros:** Maximum flexibility for file organization
- **Cons:** No predictability, harder tooling, confusing convention

### Option B: Enforce `hubs/{id}/` Pattern (Chosen)
- **Pros:** Predictable, toolable, self-documenting
- **Cons:** Requires moving `translation-emergence` content

### Option C: Use Content Hash Paths
- **Pros:** Content-addressed, immutable
- **Cons:** Over-engineering, hard to navigate manually

**Decision:**
Option B — All hubs use `hubs/{hub-id}/` as their path. The `translation-emergence` hub will be migrated to `hubs/translation-emergence/`. This creates a predictable file organization that can be validated automatically.

**Consequences:**
- `translation-emergence` content must move in GCS
- Hub tooling can assume path = `hubs/${id}/`
- New hubs automatically follow convention
- GCS bucket becomes navigable

---

## ADR-004: Required Hub for All Journeys

**Status:** Accepted

**Date:** 2025-12-21

**Context:**
The `architecture` journey has `linkedHubId: null`, meaning it doesn't load Tier 2 context. This either means:
1. The journey is incomplete (missing hub)
2. The journey intentionally uses only default context

Current behavior falls back to Discovery Mode, which may or may not find relevant content.

**Options Considered:**

### Option A: Allow Null LinkedHubId
- **Pros:** Flexible, allows lightweight journeys
- **Cons:** Unpredictable RAG behavior, Discovery Mode dependency

### Option B: Require Hub for All Journeys (Chosen)
- **Pros:** Deterministic RAG, explicit relationships, complete graph
- **Cons:** Must create hub for `architecture` journey

### Option C: Create "Default Hub" for Null Cases
- **Pros:** Deterministic without per-journey hubs
- **Cons:** Conflates "no hub" with "generic hub"

**Decision:**
Option B — Every journey must have a linked hub. Create `technical-architecture` hub for the `architecture` journey. This makes the exploration graph complete and RAG behavior deterministic.

**Consequences:**
- New `technical-architecture` hub required
- Schema validation enforces non-null `hubId`
- Journey creation workflow must specify hub
- RAG behavior becomes fully predictable

---

## ADR-005: Self-Documenting Schema

**Status:** Accepted

**Date:** 2025-12-21

**Context:**
The knowledge architecture powers the Terminal's exploration system, but the architecture itself is not explorable through the Terminal. There's no RAG content explaining how hubs, journeys, and nodes work.

**Options Considered:**

### Option A: Separate Documentation
- **Pros:** Docs don't pollute data files
- **Cons:** Docs drift from implementation, not discoverable in-context

### Option B: Schema as RAG Content (Chosen)
- **Pros:** Self-documenting, discoverable, "code is the docs"
- **Cons:** Requires careful writing to be both accurate and readable

### Option C: Generated Documentation
- **Pros:** Always accurate to schema
- **Cons:** Generated text often unreadable, loses narrative

**Decision:**
Option B — Create `grove-knowledge-ontology.md` that explains the architecture in human-readable prose with TypeScript definitions. Register this file as RAG content so the Terminal can answer questions about its own knowledge system.

**Consequences:**
- New hub: `knowledge-architecture` pointing to ontology doc
- Terminal can explain "how do journeys work?"
- Schema changes require doc updates (enforced by review)
- Recursive meta-architecture achieved

---

## ADR-006: Backward Compatibility Strategy

**Status:** Accepted

**Date:** 2025-12-21

**Context:**
The server currently loads from `narratives.json`. Splitting into multiple files could break existing deployments if the new files aren't present.

**Options Considered:**

### Option A: Hard Cut-Over
- **Pros:** Clean break, no legacy code
- **Cons:** Risky, requires synchronized deploy

### Option B: Fallback to Unified File (Chosen)
- **Pros:** Gradual migration, safe rollback
- **Cons:** More complex loading logic, two code paths

### Option C: Feature Flag Toggle
- **Pros:** Explicit control over switch
- **Cons:** Manual intervention required

**Decision:**
Option B — Server.js will first attempt to load from new file structure. If files are missing, fall back to unified `narratives.json`. This allows gradual migration and safe rollback.

**Consequences:**
- Server.js has conditional loading logic
- `narratives.json` remains as fallback (deprecated)
- Deploy can happen before full migration
- Eventually remove fallback after validation

---

## Quick Reference

| ADR | Decision | Rationale |
|-----|----------|-----------|
| 001 | Split by domain | Matches conceptual model, enables validation |
| 002 | Merge to `hubs`, deprecate `topicHubs` | Single source of truth |
| 003 | Enforce `hubs/{id}/` paths | Predictability, toolability |
| 004 | Require hub for all journeys | Deterministic RAG behavior |
| 005 | Schema as RAG content | Self-documenting architecture |
| 006 | Fallback to unified file | Safe migration path |
