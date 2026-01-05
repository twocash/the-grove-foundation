# Architecture Decisions: exploration-node-unification-v1

**Sprint:** exploration-node-unification-v1  
**Version:** 1.0  
**Created:** 2025-01-05

---

## ADR-001: Unified Prompt Model with Provenance

### Context

The original sprint design proposed separate Question and Prompt objects:
- **Questions**: Extracted from documents, simple labels
- **Prompts**: Authored manually, rich execution context

This creates parallel systems with duplicate infrastructure.

### Decision

**Unify Questions and Prompts into a single PromptObject with provenance tracking.**

Both are navigation primitives—suggestions for exploration. The only difference is where they came from (provenance).

### Consequences

**Positive:**
- Single type, single scoring system, single admin UI
- New provenance types (submitted, generated) slot in cleanly
- DEX compliant: declarative, extensible, provenance-tracked
- Prompt Workshop already handles the pattern

**Negative:**
- Existing JSON files need provenance field added
- Extraction must produce full PromptObjects, not simple strings

### Status: ACCEPTED

---

## ADR-002: Provenance as First-Class Field

### Context

Could track provenance as:
1. Separate metadata table with foreign key
2. Field on PromptObject itself
3. Derived from existing `source` field

### Decision

**Add `provenance: PromptProvenance` field directly to PromptObject.**

The `source` field maps to provenance type:
- `source: 'library'` → `provenance.type: 'authored'`
- `source: 'generated'` → `provenance.type: 'generated'`
- `source: 'user'` → `provenance.type: 'submitted'`

### Consequences

**Positive:**
- Provenance travels with prompt (no joins)
- Can include rich metadata (sourceDocIds, confidence, reviewStatus)
- Backward compatible (existing prompts get default provenance)

**Negative:**
- Larger object size
- Must backfill existing prompts

### Status: ACCEPTED

---

## ADR-003: Review Workflow for Non-Authored Prompts

### Context

Extracted and generated prompts may have quality issues. Options:
1. Auto-approve everything
2. All extracted prompts start as drafts (hidden)
3. Visible but with reduced scoring weight

### Decision

**Non-authored prompts start with `reviewStatus: 'pending'` and get reduced scoring weight until approved.**

- `pending`: 80% weight for extracted, 50% for generated
- `approved`: Full weight
- `rejected`: 30% weight (effectively hidden)

### Consequences

**Positive:**
- Prompts visible immediately (no blocking queue)
- Quality issues self-correct via reduced surfacing
- Human review optional but encouraged

**Negative:**
- Some low-quality prompts may surface briefly
- Need UI to mark approved/rejected

### Status: ACCEPTED

---

## ADR-004: UI Label "Exploration Nodes"

### Context

The Prompt Workshop manages prompts, but conceptually these are "exploration nodes"—navigation primitives in the knowledge graph.

### Decision

**Display "Exploration Nodes" in the center header area of Prompt Workshop, while keeping "Prompts" as the technical term and "+New Prompt" as the action.**

- Header breadcrumb: "Exploration Nodes"
- Button: "+New Prompt"
- Object type: `PromptObject`
- Console route: `/bedrock/prompts`

### Consequences

**Positive:**
- Communicates strategic vision to users
- Technical consistency maintained
- No route changes needed

**Negative:**
- Slight terminology mismatch (UI vs code)

### Status: ACCEPTED

---

## ADR-005: Hybrid Search Activation

### Context

`search_documents_hybrid` SQL function exists but isn't wired. Options:
1. Keep pure vector search (current)
2. Switch all searches to hybrid
3. Make hybrid optional with flag

### Decision

**Default to hybrid search, with `useHybrid: true` as default option.**

Hybrid adds:
- Keyword matching (25% weight)
- Utility boost (15% weight)  
- Freshness boost (10% weight)
- Temporal weighting

### Consequences

**Positive:**
- Better retrieval quality
- Keyword matching helps with exact terms
- Freshness rewards recent content

**Negative:**
- Slightly more compute per search
- Need to verify SQL function is deployed

### Status: ACCEPTED

---

## ADR-006: Extraction Model

### Context

Which model to use for prompt extraction:
1. GPT-4 (highest quality, expensive)
2. Claude (good quality, moderate cost)
3. Gemini 2.0 Flash (good quality, fast, cheap)

### Decision

**Use Gemini 2.0 Flash for extraction.**

Already used for document enrichment. Consistent with existing pipeline. Fast enough for batch processing.

### Consequences

**Positive:**
- Consistent with existing enrichment
- Cost-effective for batch processing
- Already configured in server.js

**Negative:**
- Quality may vary on complex documents
- Need good prompt engineering

### Status: ACCEPTED

---

## ADR-007: Molecular Independence Enforcement

### Context

Extracted prompts must stand alone. Options:
1. Trust the extraction prompt
2. Post-process to check for dependencies
3. Reject prompts with dependency markers

### Decision

**Enforce via extraction prompt instructions + confidence scoring.**

The extraction prompt explicitly requires molecular independence. Gemini returns a confidence score. Lower confidence prompts get lower weight.

### Consequences

**Positive:**
- Simple implementation
- Quality signal in confidence score
- Human can override by approving

**Negative:**
- Some dependent prompts may slip through
- Confidence interpretation is subjective

### Status: ACCEPTED

---

## ADR-008: Prompt Storage Strategy

### Context

Where to store extracted prompts:
1. In existing JSON files (append)
2. In Supabase database table
3. Hybrid: authored in JSON, extracted in DB

### Decision

**Phase 1: Return extracted prompts from API, store temporarily in memory/local state. Phase 2 (future): Persist to Supabase `prompts` table.**

This sprint focuses on the extraction pipeline and scoring integration. Persistence is a natural follow-on.

### Consequences

**Positive:**
- Faster to implement
- Can iterate on extraction quality before persisting
- No migration needed yet

**Negative:**
- Extracted prompts lost on refresh
- Need to run extraction again
- Future sprint required for persistence

### Status: ACCEPTED (Phase 1)

---

## ADR-009: Source Document Relevance Boost

### Context

When should extracted prompts get boosted in scoring?

### Decision

**Boost extracted prompts +25 points when their source document appears in current search results.**

This creates natural connection: user searches → relevant docs retrieved → prompts from those docs surface.

### Consequences

**Positive:**
- Contextually relevant prompts surface
- Direct connection between RAG and prompts
- Rewards document quality indirectly

**Negative:**
- Requires passing retrievedDocIds through scoring
- Slight complexity in scoring pipeline

### Status: ACCEPTED

---

## ADR-010: Backfill Strategy for Existing Prompts

### Context

66 existing prompts in JSON files need provenance. Options:
1. Add provenance inline in JSON files
2. Generate at load time if missing
3. Migration script to update files

### Decision

**Add `provenance` field to all existing prompts in JSON files with `type: 'authored'`.**

One-time update. Makes the data self-describing. No runtime logic needed.

### Consequences

**Positive:**
- Clean, explicit data
- No conditional logic at load time
- Easy to verify

**Negative:**
- Must update 66 prompts across 3 files
- Git diff will be large

### Status: ACCEPTED

---

## Summary Table

| ADR | Decision | Status |
|-----|----------|--------|
| 001 | Unified prompt model with provenance | ACCEPTED |
| 002 | Provenance as first-class field | ACCEPTED |
| 003 | Review workflow with reduced weight | ACCEPTED |
| 004 | UI label "Exploration Nodes" | ACCEPTED |
| 005 | Default to hybrid search | ACCEPTED |
| 006 | Use Gemini 2.0 Flash for extraction | ACCEPTED |
| 007 | Molecular independence via prompt | ACCEPTED |
| 008 | Memory storage for Phase 1 | ACCEPTED |
| 009 | +25 boost for source doc relevance | ACCEPTED |
| 010 | Backfill provenance in JSON files | ACCEPTED |

---

*Decisions complete. Ready for MIGRATION.md generation.*
