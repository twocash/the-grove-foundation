# Migration Map: exploration-node-unification-v1

**Sprint:** exploration-node-unification-v1  
**Version:** 1.0  
**Created:** 2025-01-05

---

## 1. Overview

This sprint extends existing patterns rather than replacing them. The migration is additive with minimal breaking changes.

### Migration Scope

| Component | Migration Type | Risk |
|-----------|---------------|------|
| PromptObject type | Extend (add field) | Low |
| Prompt JSON files | Add provenance field | Low |
| search.js | Modify (use hybrid) | Medium |
| scoring.ts | Extend (add function) | Low |
| PromptWorkshop UI | Extend (add badge) | Low |
| server.js | Add endpoint | Low |

---

## 2. Type Extensions

### 2.1 PromptProvenance Type

**File:** `src/core/context-fields/types.ts`

**Action:** ADD after line ~95 (before PromptObject)

```typescript
// ============================================================================
// PROVENANCE (Exploration Node Source Tracking)
// Sprint: exploration-node-unification-v1
// ============================================================================

export type ProvenanceType = 'authored' | 'extracted' | 'generated' | 'submitted';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface PromptProvenance {
  type: ProvenanceType;
  reviewStatus: ReviewStatus;
  reviewedAt?: number;
  reviewedBy?: string;
  authorId?: string;
  authorName?: string;
  sourceDocIds?: string[];
  sourceDocTitles?: string[];
  extractedAt?: number;
  extractionModel?: string;
  extractionConfidence?: number;
  gapAnalysisId?: string;
  generationReason?: string;
  coverageGap?: { stage?: string; lens?: string; topic?: string };
}

export const AUTHORED_PROVENANCE: PromptProvenance = {
  type: 'authored',
  reviewStatus: 'approved',
  authorId: 'system',
  authorName: 'Grove Team',
};
```

### 2.2 PromptObject Extension

**File:** `src/core/context-fields/types.ts`

**Action:** ADD to PromptObject interface (after `maxShows?`)

```typescript
  // === NEW: Sprint exploration-node-unification-v1 ===
  provenance: PromptProvenance;
  embedding?: number[];
```

---

## 3. JSON File Updates

### 3.1 Backfill Strategy

Add `provenance` field to all 66 existing prompts across 3 files.

**Template for authored prompts:**
```json
"provenance": {
  "type": "authored",
  "reviewStatus": "approved",
  "authorId": "system",
  "authorName": "Grove Team"
}
```

### 3.2 Files to Update

| File | Prompt Count | Action |
|------|-------------|--------|
| `src/data/prompts/base.prompts.json` | 23 | Add provenance to each |
| `src/data/prompts/wayne-turner.prompts.json` | 21 | Add provenance to each |
| `src/data/prompts/dr-chiang.prompts.json` | 22 | Add provenance to each |

### 3.3 Validation Script

After backfill, verify with:
```bash
# Check all prompts have provenance
node -e "
  const prompts = require('./src/data/prompts').libraryPrompts;
  const missing = prompts.filter(p => !p.provenance);
  console.log('Missing provenance:', missing.length);
  console.log('Total:', prompts.length);
"
```

---

## 4. Search Integration

### 4.1 Activate Hybrid Search

**File:** `lib/knowledge/search.js`

**Action:** MODIFY `searchDocuments` function (line ~47)

**Before:**
```javascript
const { data, error } = await supabaseAdmin.rpc('search_documents', {
  query_embedding: `[${queryEmbedding.join(',')}]`,
  match_count: limit,
  match_threshold: threshold,
});
```

**After:**
```javascript
// Default to hybrid search
const useHybrid = options.useHybrid !== false;

if (useHybrid) {
  // Extract keywords from query
  const keywords = query.toLowerCase()
    .split(/\s+/)
    .filter(w => w.length > 2)
    .slice(0, 10);
  
  const { data, error } = await supabaseAdmin.rpc('search_documents_hybrid', {
    query_embedding: `[${queryEmbedding.join(',')}]`,
    query_keywords: keywords,
    match_count: limit,
    match_threshold: threshold,
    track_retrievals: true,
    freshness_decay_days: 30,
  });
  
  if (error) throw new Error(`Hybrid search failed: ${error.message}`);
  
  return (data || []).map(row => ({
    id: row.id,
    title: row.title,
    content: row.content,
    snippet: row.content?.slice(0, 200) + '...',
    similarity: row.similarity,
    keywordScore: row.keyword_score,
    utilityBoost: row.utility_boost,
    freshnessBoost: row.freshness_boost,
    finalScore: row.final_score,
  }));
}

// Fallback to pure vector
const { data, error } = await supabaseAdmin.rpc('search_documents', {...});
```

### 4.2 Verify Hybrid Search Deployed

Before integration, verify:
```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'search_documents_hybrid';
```

---

## 5. Scoring Extension

### 5.1 Add Provenance Modifier

**File:** `src/core/context-fields/scoring.ts`

**Action:** ADD function (after existing scoring functions)

```typescript
/**
 * Apply provenance-based score modifiers
 * Sprint: exploration-node-unification-v1
 */
export function applyProvenanceModifier(
  baseScore: number,
  prompt: PromptObject,
  context: { retrievedDocIds?: string[] } = {}
): number {
  let score = baseScore;
  const provenance = prompt.provenance;
  
  if (!provenance) {
    return score + 10; // Legacy prompt
  }
  
  switch (provenance.type) {
    case 'authored':
      score += 10;
      break;
    case 'extracted':
      if (context.retrievedDocIds && provenance.sourceDocIds) {
        const isRelevant = provenance.sourceDocIds.some(id => 
          context.retrievedDocIds!.includes(id)
        );
        if (isRelevant) score += 25;
      }
      if (provenance.reviewStatus === 'pending') score *= 0.8;
      else if (provenance.reviewStatus === 'rejected') score *= 0.3;
      break;
    case 'generated':
      if (provenance.reviewStatus !== 'approved') score *= 0.5;
      break;
    case 'submitted':
      if (provenance.reviewStatus === 'pending') score *= 0.7;
      break;
  }
  
  return score;
}
```

### 5.2 Integrate into scorePrompt

**File:** `src/core/context-fields/scoring.ts`

**Action:** MODIFY `scorePrompt` function to call `applyProvenanceModifier`

```typescript
export function scorePrompt(
  prompt: PromptObject,
  context: ContextState,
  options: { retrievedDocIds?: string[] } = {}
): ScoredPrompt {
  // ... existing scoring logic ...
  
  let finalScore = /* existing calculation */;
  
  // NEW: Apply provenance modifier
  finalScore = applyProvenanceModifier(finalScore, prompt, options);
  
  return { prompt, score: finalScore, matchDetails };
}
```

---

## 6. Server Endpoint

### 6.1 Add Extraction Endpoint

**File:** `server.js`

**Action:** ADD after line ~3660 (after existing enrichment endpoints)

See ARCHITECTURE.md Section 4.1 for full implementation.

**Endpoint:** `POST /api/prompts/extract`

**Request:**
```json
{
  "documentId": "uuid",
  "title": "Document Title",
  "content": "Full document content...",
  "tier": "sapling",
  "namedEntities": { "people": [], "organizations": [], "concepts": [] }
}
```

**Response:**
```json
{
  "documentId": "uuid",
  "documentTitle": "Document Title",
  "prompts": [PromptObject, PromptObject, ...],
  "metadata": { "extractedAt": 1234567890, "model": "gemini-2.0-flash", "promptCount": 6 }
}
```

---

## 7. UI Updates

### 7.1 Header Label

**File:** `src/bedrock/consoles/PromptWorkshop/PromptWorkshop.config.ts` or parent layout

**Action:** Add "Exploration Nodes" label in center header area

The exact location depends on how BedrockLayout implements the center content area. Check:
- `src/bedrock/layouts/BedrockLayout.tsx`
- Or pass via config: `centerLabel: 'Exploration Nodes'`

### 7.2 Provenance Badge Component

**File:** `src/bedrock/consoles/PromptWorkshop/ProvenanceBadge.tsx` (NEW)

See ARCHITECTURE.md Section 7.2 for implementation.

### 7.3 PromptCard Update

**File:** `src/bedrock/consoles/PromptWorkshop/PromptCard.tsx`

**Action:** ADD provenance badge display

```tsx
import { ProvenanceBadge } from './ProvenanceBadge';

// In card JSX, add:
<ProvenanceBadge provenance={prompt.provenance} size="sm" />
```

### 7.4 Filter Addition

**File:** `src/bedrock/consoles/PromptWorkshop/PromptWorkshop.config.ts`

**Action:** ADD to filterOptions array

```typescript
{
  field: 'provenance.type',
  label: 'Provenance',
  type: 'select',
  options: ['authored', 'extracted', 'generated', 'submitted'],
},
```

---

## 8. New Files to Create

| File | Purpose |
|------|---------|
| `src/core/extraction/index.ts` | Barrel export |
| `src/core/extraction/types.ts` | Extraction types |
| `src/core/extraction/prompts.ts` | Gemini prompt template |
| `src/core/extraction/extract.ts` | Core extraction logic |
| `src/core/extraction/transform.ts` | Raw → PromptObject |
| `src/bedrock/consoles/PromptWorkshop/ProvenanceBadge.tsx` | Badge component |

---

## 9. Migration Checklist

### Phase 1: Type Foundation
- [ ] Add PromptProvenance type to types.ts
- [ ] Add provenance field to PromptObject
- [ ] Add AUTHORED_PROVENANCE constant
- [ ] Export new types from index.ts

### Phase 2: Data Backfill
- [ ] Add provenance to base.prompts.json (23 prompts)
- [ ] Add provenance to wayne-turner.prompts.json (21 prompts)
- [ ] Add provenance to dr-chiang.prompts.json (22 prompts)
- [ ] Validate all prompts have provenance

### Phase 3: Extraction Pipeline
- [ ] Create src/core/extraction/ directory
- [ ] Create extraction types and functions
- [ ] Add extraction endpoint to server.js
- [ ] Test extraction on sample document

### Phase 4: Search Integration
- [ ] Verify hybrid search SQL deployed
- [ ] Update search.js to use hybrid
- [ ] Test hybrid search returns enrichment scores

### Phase 5: Scoring Integration
- [ ] Add applyProvenanceModifier function
- [ ] Integrate into scorePrompt
- [ ] Test provenance modifiers work correctly

### Phase 6: UI Updates
- [ ] Add "Exploration Nodes" header label
- [ ] Create ProvenanceBadge component
- [ ] Add badge to PromptCard
- [ ] Add provenance filter to config
- [ ] Test filter works

### Phase 7: Verification
- [ ] Build passes: `npm run build`
- [ ] Tests pass: `npm test`
- [ ] Manual test: extraction endpoint
- [ ] Manual test: hybrid search
- [ ] Manual test: provenance display

---

## 10. Rollback Plan

If issues arise:

1. **Type changes:** Revert types.ts additions
2. **JSON backfill:** Git revert prompt files
3. **Search changes:** Set `useHybrid: false` as default
4. **Server endpoint:** Remove /api/prompts/extract handler
5. **UI changes:** Remove ProvenanceBadge imports

All changes are additive and isolated, making rollback straightforward.

---

*Migration map complete. Ready for STORIES.md generation.*
