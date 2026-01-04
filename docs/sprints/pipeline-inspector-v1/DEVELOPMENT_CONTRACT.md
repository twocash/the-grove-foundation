# Pipeline Inspector Development Contract
## Sprint: pipeline-inspector-v1

**Version:** 1.0  
**Status:** BINDING FOR THIS SPRINT  
**Effective:** January 3, 2025  
**Architectural Authority:** ADR-001-knowledge-commons-unification.md

---

## Preamble

This contract governs all development in the pipeline-inspector-v1 sprint. It enforces alignment with the Knowledge Commons architecture and prevents drift from canonical patterns.

**Violation of this contract blocks merge.**

---

## Article I: Tier Terminology Compliance

### Section 1.1: Canonical Tiers

The ONLY valid tier values are:

```typescript
const CANONICAL_TIERS = ['seed', 'sprout', 'sapling', 'tree', 'grove'] as const;
```

### Section 1.2: Prohibited Terms

These terms MUST NOT appear in code, UI, or documentation:

| Prohibited | Canonical Replacement |
|------------|----------------------|
| `seedling` | `seed` |
| `oak` | `tree` |
| `published` | `tree` or `grove` |
| `archived` | Use `status` field instead |
| `draft` | `seed` or `sprout` |

### Section 1.3: Verification Command

Before any commit, run:
```bash
grep -rn "seedling\|\"oak\"\|'oak'" src/bedrock/consoles/PipelineMonitor/
# Must return empty
```

---

## Article II: Quality Through Use

### Section 2.1: No Gatekeeping Tier Changes

Code MUST NOT enforce tier requirements for promotion. This is wrong:

```typescript
// ❌ PROHIBITED - gatekeeping
if (!document.keywords || document.keywords.length < 5) {
  throw new Error('Cannot promote: needs 5 keywords');
}
```

This is correct:

```typescript
// ✓ CORRECT - suggest, don't gate
const suggestions = [];
if (!document.keywords?.length) {
  suggestions.push('Consider adding keywords for better retrieval');
}
// User can still promote despite suggestions
```

### Section 2.2: Utility Score Computation

The utility_score MUST be:
1. **Computed automatically** from retrieval patterns
2. **Read-only in UI** (cannot be manually set)
3. **Formula-based:**
   ```
   utility_score = ln(retrieval_count + 1) × (1 + 0.1 × unique_query_count)
   ```

### Section 2.3: Promotion Criteria Display

UI MAY display promotion suggestions but MUST NOT block actions:

```tsx
// ✓ CORRECT - informational
<PromotionSuggestions tier={doc.tier} stats={doc.stats} />
<Button onClick={handlePromote}>Promote to {nextTier}</Button>

// ❌ PROHIBITED - blocking
<Button onClick={handlePromote} disabled={!meetsRequirements}>
  Promote to {nextTier}
</Button>
```

---

## Article III: Provenance Requirements

### Section 3.1: Every Document Has Provenance

All documents MUST track their origin:

```typescript
interface DocumentProvenance {
  source_context: {
    uploadedBy?: string;      // Session or user ID
    uploadSession?: string;   // Session identifier
    originalPath?: string;    // File path if local
    sourceUrl?: string;       // URL if fetched
    capturedFrom?: string;    // 'upload' | 'api' | 'migration'
  };
  created_at: string;         // ISO timestamp
}
```

### Section 3.2: Attribution Chain Fields

Documents MUST include:

```typescript
interface AttributionChain {
  derived_from?: UUID[];      // Parent documents
  derivatives?: UUID[];       // Child documents (auto-populated)
  cited_by_sprouts?: UUID[];  // Sprouts that reference this
}
```

### Section 3.3: Enrichment Tracking

When AI enrichment runs, MUST track:

```typescript
interface EnrichmentRecord {
  enriched_at: string;        // ISO timestamp
  enriched_by: 'copilot' | 'manual' | 'bulk';
  enrichment_model?: string;  // Model used (e.g., 'claude-3-sonnet')
}
```

---

## Article IV: Copilot Behavior

### Section 4.1: Extraction Commands Show Previews

All AI extraction commands MUST:
1. Show results before applying
2. Allow user to edit/reject
3. Never auto-save without confirmation

```typescript
// ✓ CORRECT flow
const keywords = await copilot.extractKeywords(doc.content);
const approved = await showPreviewDialog(keywords);
if (approved) {
  await updateDocument({ keywords: approved });
}
```

### Section 4.2: Compound Commands Batch Confirmation

The `enrich` compound command MUST:
1. Run all extractions
2. Present combined preview
3. Allow selective acceptance

### Section 4.3: Promotion Commands Require Tier Name

```
✓ "promote to sapling"
✓ "promote to tree"
✗ "promote" (ambiguous - reject or ask for clarification)
```

---

## Article V: Database Schema

### Section 5.1: Migration File Location

```
supabase/migrations/004_document_enrichment.sql
```

### Section 5.2: Required Columns

The migration MUST add these columns:

| Column | Type | Default | Nullable |
|--------|------|---------|----------|
| keywords | TEXT[] | NULL | Yes |
| summary | TEXT | NULL | Yes |
| document_type | TEXT | NULL | Yes |
| named_entities | JSONB | '{}' | No |
| questions_answered | TEXT[] | NULL | Yes |
| temporal_class | TEXT | 'evergreen' | No |
| retrieval_count | INTEGER | 0 | No |
| retrieval_queries | TEXT[] | NULL | Yes |
| last_retrieved_at | TIMESTAMPTZ | NULL | Yes |
| utility_score | FLOAT | 0 | No |
| editorial_notes | TEXT | NULL | Yes |
| derived_from | UUID[] | NULL | Yes |
| derivatives | UUID[] | NULL | Yes |
| cited_by_sprouts | UUID[] | NULL | Yes |
| enriched_at | TIMESTAMPTZ | NULL | Yes |
| enriched_by | TEXT | NULL | Yes |
| enrichment_model | TEXT | NULL | Yes |

### Section 5.3: Required Indexes

```sql
CREATE INDEX documents_keywords_idx ON documents USING gin(keywords);
CREATE INDEX documents_temporal_class_idx ON documents(temporal_class);
CREATE INDEX documents_utility_score_idx ON documents(utility_score DESC);
```

### Section 5.4: Tier Fix in Migration

The migration MUST fix existing data:

```sql
UPDATE documents SET tier = 'seed' WHERE tier = 'seedling';
UPDATE documents SET tier = 'tree' WHERE tier = 'oak';
```

---

## Article VI: UI Component Boundaries

### Section 6.1: New Components Allowed

This sprint MAY create:

| Component | Purpose | Location |
|-----------|---------|----------|
| TagArray | Keyword chip management | src/bedrock/primitives/ |
| GroupedChips | Entity categorization | src/bedrock/primitives/ |
| UtilityBar | Usage signal display | src/bedrock/primitives/ |
| StarRating | Quality rating input | src/bedrock/primitives/ |

### Section 6.2: Existing Components to Use

| Component | From | Use For |
|-----------|------|---------|
| InspectorPanel | src/shared/layout/ | Document inspector shell |
| InspectorSection | src/shared/layout/ | Collapsible sections |
| BedrockCopilot | src/bedrock/primitives/ | AI assistance |
| GlassStatusBadge | src/bedrock/primitives/ | Tier/status display |

### Section 6.3: Console Factory Integration

PipelineMonitor MUST integrate with console-factory pattern:

```typescript
// In console-factory.tsx
case 'pipeline-monitor':
  return {
    inspectorConfig: buildDocumentInspector(selectedObject),
    copilotConfig: buildDocumentCopilot(selectedObject),
  };
```

---

## Article VII: Retrieval Enhancement Boundaries

### Section 7.1: Hybrid Search Optional

Enhanced retrieval (keyword + vector + quality) is OPTIONAL for this sprint. The existing vector search continues to work.

### Section 7.2: If Implementing Hybrid Search

The search function MUST:
1. Fall back to pure vector if keywords empty
2. Never exclude documents solely for lacking keywords
3. Weight quality as multiplier, not filter

```sql
-- Correct: quality as weight
similarity * (1 + utility_score * 0.1) AS final_score

-- Prohibited: quality as filter
WHERE utility_score > 0.5  -- ❌ Gatekeeping
```

---

## Article VIII: Test Requirements

### Section 8.1: Tier Terminology Tests

```typescript
describe('Tier Terminology Compliance', () => {
  it('uses only canonical tier values', () => {
    const tiers = ['seed', 'sprout', 'sapling', 'tree', 'grove'];
    // Verify all tier selects use these values
  });
  
  it('rejects non-canonical tier values', () => {
    expect(() => setTier('seedling')).toThrow();
    expect(() => setTier('oak')).toThrow();
  });
});
```

### Section 8.2: Copilot Preview Tests

```typescript
describe('Copilot Extraction', () => {
  it('shows preview before saving keywords', async () => {
    const result = await copilot.process('extract keywords');
    expect(result.requiresConfirmation).toBe(true);
    expect(result.preview).toBeDefined();
  });
});
```

---

## Article IX: Definition of Done

### Section 9.1: Feature Checklist

Before marking any feature complete:

- [ ] Uses canonical tier names only
- [ ] No gatekeeping on tier promotion
- [ ] Provenance fields populated
- [ ] Copilot commands show previews
- [ ] Utility score read-only
- [ ] Tests pass
- [ ] ADR-001 compliance verified

### Section 9.2: Sprint Completion Checklist

Before marking sprint complete:

- [ ] Migration 004 created and tested
- [ ] UI tier options fixed
- [ ] Inspector integrated with console-factory
- [ ] Copilot commands functional
- [ ] Documentation updated
- [ ] No prohibited tier terms in codebase

---

## Article X: Architectural Review Triggers

These situations require architectural review before proceeding:

1. Proposing tier values outside canonical set
2. Implementing quality gates (not suggestions)
3. Creating Sprout↔Document direct coupling
4. Modifying retrieval ranking formula
5. Adding new attribution chain relationships

---

## Signatures

By commencing work on this sprint, contributors agree to this contract.

**Effective Date:** January 3, 2025  
**Version:** 1.0  
**Authority:** ADR-001-knowledge-commons-unification.md

---

*This contract ensures the Pipeline Inspector aligns with Knowledge Commons architecture. Deviations create technical debt and architectural drift. When in doubt, consult ADR-001.*
