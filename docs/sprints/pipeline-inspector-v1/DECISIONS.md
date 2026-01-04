# Decisions: pipeline-inspector-v1
**Date:** 2025-01-03
**Sprint:** pipeline-inspector-v1

This document consolidates all architectural decisions for this sprint using ADR format.

---

## ADR-001: Knowledge Commons Unification

**Status:** ACCEPTED  
**Date:** 2025-01-03

### Context
Grove has two parallel systems for ingesting knowledge: Document Pipeline (uploaded content) and Sprout System (captured outputs). Both independently developed tier terminology and lifecycle concepts.

### Decision
Unify both systems under Knowledge Commons architecture with canonical tier names: `seed`, `sprout`, `sapling`, `tree`, `grove`.

### Consequences
- **Positive:** Unified mental model, simpler codebase, future-proof for Grove tier
- **Negative:** Requires migration to fix UI tier values
- **Neutral:** Database schema already correct; only UI needs fixing

### Full ADR
See: `ADR-001-knowledge-commons-unification.md`

---

## ADR-002: Quality Through Use, Not Gatekeeping

**Status:** ACCEPTED  
**Date:** 2025-01-03

### Context
Traditional document management requires editorial review before publication. This creates bottlenecks and doesn't leverage organic quality signals from actual use.

### Decision
Quality emerges from demonstrated utility:
- `utility_score` computed automatically from retrieval patterns
- Tier promotion criteria are *suggestions*, not gates
- Humans can promote/demote at any time regardless of metrics
- No code enforces requirements for tier changes

### Consequences
- **Positive:** Faster ingestion, organic curation, no editorial bottleneck
- **Negative:** Low-quality content may persist at higher tiers
- **Mitigation:** Utility score naturally surfaces high-value content; manual curation always possible

### Implementation
```typescript
// ✓ CORRECT - suggest, don't gate
const suggestions = [];
if (!document.keywords?.length) {
  suggestions.push('Consider adding keywords');
}
// User can still promote despite suggestions

// ❌ PROHIBITED - gatekeeping
if (!document.keywords || document.keywords.length < 5) {
  throw new Error('Cannot promote: needs 5 keywords');
}
```

---

## ADR-003: Copilot Preview Requirement

**Status:** ACCEPTED  
**Date:** 2025-01-03

### Context
AI-generated content (keywords, summaries, entities) may contain errors. Applying without review could corrupt document metadata.

### Decision
All AI extraction commands MUST show preview before applying:
1. AI generates suggestions
2. User sees preview with option to edit
3. User explicitly confirms to apply
4. System saves only after confirmation

### Consequences
- **Positive:** User maintains control, errors caught before save, builds trust
- **Negative:** Extra click for each extraction
- **Mitigation:** Compound `enrich` command batches all extractions into single preview

### Exception
Action commands (`promote`, `re-embed`) don't need preview since they're deterministic operations with clear semantics.

---

## ADR-004: Utility Score Formula

**Status:** ACCEPTED  
**Date:** 2025-01-03

### Context
Need a formula that:
- Rewards documents that are retrieved frequently
- Values query diversity (documents answering many different questions)
- Is resistant to gaming
- Produces reasonable ranges for UI display

### Decision
```
utility_score = ln(retrieval_count + 1) × (1 + 0.1 × unique_query_count)
```

### Rationale
- **Logarithmic base:** Prevents runaway scores for very popular documents
- **+1 offset:** Handles zero retrievals gracefully
- **Query diversity factor:** Documents answering many different questions score higher
- **0.1 coefficient:** Query diversity is secondary to raw retrieval count

### Expected Ranges
| Retrievals | Query Diversity | Utility Score |
|------------|-----------------|---------------|
| 0 | 0 | 0.0 |
| 10 | 3 | 2.4 × 1.3 = 3.1 |
| 100 | 10 | 4.6 × 2.0 = 9.2 |
| 1000 | 20 | 6.9 × 3.0 = 20.7 |

### Alternatives Considered
1. **Simple count:** Too easily gamed, no diversity reward
2. **Time-decayed:** Complex, penalizes evergreen content
3. **Normalized percentile:** Requires global computation, expensive

---

## ADR-005: Inspector Field Types

**Status:** ACCEPTED  
**Date:** 2025-01-03

### Context
Inspector needs to render various field types. Need to define supported types and their behavior.

### Decision
Supported field types:

| Type | Render | Edit | Component |
|------|--------|------|-----------|
| `text` | Single line | ✓ | `<input type="text">` |
| `textarea` | Multi-line | ✓ | `<textarea>` |
| `select` | Dropdown | ✓ | `<select>` |
| `badge` | Status chip | ✗ | `GlassStatusBadge` |
| `url` | Clickable link | ✓ | `<input type="url">` |
| `datetime` | Formatted date | ✗ | Formatted display |
| `number` | Numeric | ✗ | Formatted display |
| `count` | Count badge | ✗ | Formatted display |
| `tag-array` | Chip list | ✓ | `TagArray` |
| `grouped-chips` | Categorized chips | ✓ | `GroupedChips` |
| `list` | Bulleted list | ✓ | List with add/remove |
| `links` | Related items | ✓ | Document links |
| `utility-bar` | Progress bar | ✗ | `UtilityBar` |

### Consequences
- **Positive:** Clear contract for inspector renderer
- **Negative:** New field types require component development
- **Mitigation:** Types cover all SPEC requirements; more can be added later

---

## ADR-006: Named Entity Categories

**Status:** ACCEPTED  
**Date:** 2025-01-03

### Context
Need to categorize extracted entities. Categories should be useful for retrieval and browsing without being too granular.

### Decision
Four categories:
1. **People:** Authors, subjects, experts mentioned
2. **Organizations:** Companies, institutions, agencies
3. **Concepts:** Theories, frameworks, methodologies
4. **Technologies:** Tools, platforms, languages, protocols

### Rationale
- Covers most knowledge domains
- Not too many to be overwhelming
- Maps to common research interests
- Easy to explain to users

### Alternatives Considered
1. **More granular (10+ categories):** Too complex for initial release
2. **Fewer (just "people" and "things"):** Loses useful distinctions
3. **Dynamic/custom categories:** Adds complexity, future consideration

---

## ADR-007: Temporal Class Definitions

**Status:** ACCEPTED  
**Date:** 2025-01-03

### Context
Documents age differently. A research paper from 2015 may be foundational; a blog post from 2015 about "current trends" is dated.

### Decision
Four temporal classes:

| Class | Definition | Retrieval Weight |
|-------|------------|------------------|
| `evergreen` | Timeless fundamentals (algorithms, principles) | 1.0× |
| `current` | Recent and actively relevant | 1.0× |
| `dated` | Contains outdated info, may mislead | 0.5× |
| `historical` | Valuable for context, not current practice | 0.7× |

### Detection Signals
- **Dated:** References old versions, "currently" with old dates, deprecated tools
- **Historical:** Explicitly framed as history, founding papers, retrospectives
- **Evergreen:** Principles, algorithms, methodology (no time-specific claims)
- **Current:** Recent dates, "new in v4", current events

### Consequences
- **Positive:** Helps retrieval prioritize relevant content
- **Negative:** Requires either AI classification or manual curation
- **Mitigation:** Default to `evergreen`; Copilot `check freshness` helps classify

---

## Decision Log Summary

| ADR | Decision | Status |
|-----|----------|--------|
| ADR-001 | Canonical tier names (seed/sprout/sapling/tree/grove) | ACCEPTED |
| ADR-002 | Quality through use, not gatekeeping | ACCEPTED |
| ADR-003 | Copilot preview before AI application | ACCEPTED |
| ADR-004 | Utility score = ln(count+1) × diversity_factor | ACCEPTED |
| ADR-005 | Inspector supports 13 field types | ACCEPTED |
| ADR-006 | Four entity categories (people/orgs/concepts/tech) | ACCEPTED |
| ADR-007 | Four temporal classes with retrieval weights | ACCEPTED |
