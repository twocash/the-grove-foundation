# Architectural Decision Record: Knowledge Commons Unification
## ADR-001: Document Pipeline & Sprout System Convergence

**Status:** ACCEPTED  
**Date:** 2025-01-03  
**Deciders:** Grove Foundation Architecture Team  
**Sprint:** pipeline-inspector-v1

---

## Context

Grove has two parallel systems for ingesting knowledge:

1. **Document Pipeline** (PipelineMonitor) - External content uploaded to RAG corpus
2. **Sprout System** (Terminal) - LLM outputs captured by users

Both systems independently developed tier terminology and lifecycle concepts. This ADR formalizes their unification under the Knowledge Commons architecture.

### Current State Analysis

**Document Pipeline (001_kinetic_pipeline.sql):**
```sql
tier TEXT NOT NULL DEFAULT 'sapling'
  CHECK (tier IN ('seed', 'sprout', 'sapling', 'tree', 'grove'))
```

**Document Pipeline UI (DocumentsView.tsx):**
```tsx
<option value="seedling">Seedling</option>
<option value="sapling">Sapling</option>
<option value="oak">Oak</option>
```

**Sprout System (Grove_Sprout_System_Architecture.docx):**
```
Seed → Sprout → Sapling → Tree → Grove
```

**Problem:** The UI uses non-canonical tier names (`seedling`, `oak`) that don't match either the database schema or the Sprout System architecture.

---

## Decision

### 1. Canonical Tier Lifecycle

All Grove content follows the botanical lifecycle defined in the Sprout System:

| Tier | Meaning | Retrieval Eligibility | Quality Signal |
|------|---------|----------------------|----------------|
| **Seed** | Raw content, minimal metadata | Excluded | None |
| **Sprout** | Captured with provenance | Excluded | Pending review |
| **Sapling** | Validated, enriched | Included | Community validated |
| **Tree** | Knowledge Commons integration | Included (prioritized) | High utility |
| **Grove** | Network-wide adoption | Included (highest priority) | Network consensus |

### 2. Two Paths, One Commons

```
┌─────────────────────────────────────────────────────────────────┐
│                      KNOWLEDGE COMMONS                          │
│                    (Tree + Grove tiers)                         │
│                                                                 │
│  "The recursion closes: Trees shape future Seeds,              │
│   which can become new Sprouts."                                │
└─────────────────────────────────────────────────────────────────┘
                ▲                              ▲
                │                              │
    ┌───────────┴───────────┐      ┌──────────┴──────────┐
    │   DOCUMENT PIPELINE   │      │    SPROUT SYSTEM    │
    │   (uploaded content)  │      │  (captured outputs) │
    │                       │      │                     │
    │  • PDF, MD, TXT, DOCX │      │  • Terminal /sprout │
    │  • External knowledge │      │  • LLM responses    │
    │  • Research, refs     │      │  • User discoveries │
    │  • Provenance: source │      │  • Provenance: full │
    └───────────────────────┘      └─────────────────────┘
```

Both tracks:
- Use identical tier names and semantics
- Follow the same promotion criteria (suggested, not enforced)
- Contribute to the same retrieval corpus
- Participate in the attribution economy

### 3. Quality Through Use, Not Gatekeeping

Per Knowledge Commons philosophy (Grove_Knowledge_Commons_Deep_Dive.docx):

> "Innovations become available immediately upon publication, with quality signals accumulating through adoption and community feedback rather than pre-publication gatekeeping."

**Implementation:**
- Track retrieval frequency and query diversity
- Compute utility_score automatically from usage patterns
- Promotion criteria are *suggested*, not *gates*
- Humans retain full authority to promote/demote at any time

### 4. Attribution Chain Symmetry

Documents and Sprouts both participate in attribution:

```typescript
// Shared attribution fields
interface AttributionChain {
  derived_from: UUID[];      // Parent content (docs or sprouts)
  derivatives: UUID[];       // Children (auto-populated)
  cited_by_sprouts: UUID[];  // When terminal sprouts reference this
}
```

When a Sprout cites a Document (via RAG context), the Document's `cited_by_sprouts` array updates, creating measurable influence.

---

## Consequences

### Positive

1. **Unified mental model** - One lifecycle for all knowledge
2. **Simpler codebase** - Shared components, types, patterns
3. **Attribution clarity** - Cross-track attribution works naturally
4. **Future-proof** - Grove tier (network adoption) applies to both

### Negative

1. **Migration required** - Fix tier values in existing data
2. **UI updates** - Change filter options to canonical names
3. **Documentation** - Update all references to old tier names

### Neutral

1. **Database schema already correct** - Only UI needs fixing
2. **Sprout System unchanged** - It defined the canonical model

---

## Implementation Requirements

### Immediate (This Sprint)

1. **Fix UI tier options** in DocumentsView.tsx:
   ```tsx
   // FROM:
   <option value="seedling">Seedling</option>
   <option value="oak">Oak</option>
   
   // TO:
   <option value="seed">Seed</option>
   <option value="sprout">Sprout</option>
   <option value="sapling">Sapling</option>
   <option value="tree">Tree</option>
   <option value="grove">Grove</option>
   ```

2. **Add attribution fields** to documents table (migration 004)

3. **Add utility tracking** to documents table (migration 004)

### Future (Sprout Integration Sprint)

1. **Link Sprouts to Documents** via cited_by relationship
2. **Unified retrieval** that searches both tables
3. **Cross-track attribution** in Knowledge Commons UI

---

## Compliance Verification

Any code touching tiers MUST use these exact strings:

```typescript
const CANONICAL_TIERS = ['seed', 'sprout', 'sapling', 'tree', 'grove'] as const;
type Tier = typeof CANONICAL_TIERS[number];
```

**Prohibited strings:** `seedling`, `oak`, `published`, `archived`, or any other tier name.

---

## References

- Grove_Sprout_System_Architecture.docx (canonical lifecycle definition)
- Grove_Knowledge_Commons_Deep_Dive.docx (quality through use philosophy)
- 001_kinetic_pipeline.sql (database schema)
- DocumentsView.tsx (current UI, needs fix)
