# Execution Prompt: exploration-node-unification-v1

**Sprint:** exploration-node-unification-v1  
**Created:** 2025-01-05  
**Handoff:** Ready for execution

---

## Context

You are implementing the **Exploration Node Unification** sprint for Grove Foundation. This sprint extends the PromptObject with provenance tracking, creates an extraction pipeline, activates hybrid search, and updates the Prompt Workshop UI.

### Strategic Decision

**Questions and Prompts are the same object.** Both are navigation primitives with labels, execution context, and affinities. The only difference is provenance (where they came from). This sprint unifies them.

### Key Files

```
C:\GitHub\the-grove-foundation\
├── src/core/context-fields/types.ts    → PromptObject type (EXTEND)
├── src/core/context-fields/scoring.ts  → Scoring (EXTEND)
├── src/data/prompts/*.json             → Prompt files (ADD provenance)
├── lib/knowledge/search.js             → Search (MODIFY)
├── server.js                           → API (ADD endpoint)
└── src/bedrock/consoles/PromptWorkshop/ → UI (EXTEND)
```

---

## Pre-Execution Verification

```bash
cd C:\GitHub\the-grove-foundation

# 1. Verify clean state
git status

# 2. Verify build works
npm run build

# 3. Verify server starts
npm run dev  # In separate terminal
```

---

## Epic 1: Type Foundation

### Story 1.1: Add PromptProvenance Type

**File:** `src/core/context-fields/types.ts`

**Action:** Add after line ~95 (before PromptObject interface)

```typescript
// ============================================================================
// PROVENANCE (Exploration Node Source Tracking)
// Sprint: exploration-node-unification-v1
// ============================================================================

/**
 * Provenance type - where the prompt originated
 */
export type ProvenanceType = 'authored' | 'extracted' | 'generated' | 'submitted';

/**
 * Review status for non-authored prompts
 */
export type ReviewStatus = 'pending' | 'approved' | 'rejected';

/**
 * Provenance tracking for exploration nodes
 */
export interface PromptProvenance {
  type: ProvenanceType;
  reviewStatus: ReviewStatus;
  reviewedAt?: number;
  reviewedBy?: string;
  // Authored
  authorId?: string;
  authorName?: string;
  // Extracted
  sourceDocIds?: string[];
  sourceDocTitles?: string[];
  extractedAt?: number;
  extractionModel?: string;
  extractionConfidence?: number;
  // Generated
  gapAnalysisId?: string;
  generationReason?: string;
  coverageGap?: { stage?: string; lens?: string; topic?: string };
}

/**
 * Default provenance for authored prompts
 */
export const AUTHORED_PROVENANCE: PromptProvenance = {
  type: 'authored',
  reviewStatus: 'approved',
  authorId: 'system',
  authorName: 'Grove Team',
};

/**
 * Create provenance for extracted prompt
 */
export function createExtractedProvenance(
  sourceDocIds: string[],
  sourceDocTitles: string[],
  confidence: number,
  model: string = 'gemini-2.0-flash'
): PromptProvenance {
  return {
    type: 'extracted',
    reviewStatus: 'pending',
    sourceDocIds,
    sourceDocTitles,
    extractedAt: Date.now(),
    extractionModel: model,
    extractionConfidence: confidence,
  };
}
```

### Story 1.2: Extend PromptObject

**File:** `src/core/context-fields/types.ts`

**Action:** Add to PromptObject interface (after `maxShows?` field, before closing brace)

```typescript
  // === NEW: Sprint exploration-node-unification-v1 ===
  
  /** Provenance tracking - where this prompt came from */
  provenance: PromptProvenance;
  
  /** Embedding for similarity matching (optional) */
  embedding?: number[];
```

### Story 1.3: Update Exports

**File:** `src/core/context-fields/index.ts`

**Action:** Add exports for new types

```typescript
export type { ProvenanceType, ReviewStatus, PromptProvenance } from './types';
export { AUTHORED_PROVENANCE, createExtractedProvenance } from './types';
```

### Story 1.4: Backfill Prompt JSON Files

For each prompt in `base.prompts.json`, `wayne-turner.prompts.json`, and `dr-chiang.prompts.json`, add:

```json
"provenance": {
  "type": "authored",
  "reviewStatus": "approved",
  "authorId": "system",
  "authorName": "Grove Team"
}
```

**Example transformation:**

Before:
```json
{
  "id": "turner-hook-infrastructure-of-thought",
  "objectType": "prompt",
  "status": "active",
  "source": "library"
}
```

After:
```json
{
  "id": "turner-hook-infrastructure-of-thought",
  "objectType": "prompt",
  "status": "active",
  "source": "library",
  "provenance": {
    "type": "authored",
    "reviewStatus": "approved",
    "authorId": "system",
    "authorName": "Grove Team"
  }
}
```

**Verify:**
```bash
npm run build
```

---

## Epic 2: Extraction Pipeline

### Story 2.1: Create Extraction Module

```bash
mkdir -p src/core/extraction
```

**File:** `src/core/extraction/types.ts`

```typescript
// src/core/extraction/types.ts
// Sprint: exploration-node-unification-v1

import type { Stage } from '../context-fields/types';

export interface RawExtractedPrompt {
  label: string;
  executionPrompt: string;
  systemContext: string;
  stages: string[];
  lenses: string[];
  topics: string[];
  confidence: number;
}

export interface ExtractionContext {
  documentId: string;
  title: string;
  content: string;
  tier: string;
  namedEntities: {
    people: string[];
    organizations: string[];
    concepts: string[];
    technologies: string[];
  };
}

export interface ExtractionResult {
  documentId: string;
  documentTitle: string;
  prompts: import('../context-fields/types').PromptObject[];
  raw: RawExtractedPrompt[];
  metadata: {
    extractedAt: number;
    model: string;
    documentTier: string;
    promptCount: number;
  };
}

export const TIER_TO_STAGES: Record<string, Stage[]> = {
  seed: ['genesis'],
  sprout: ['genesis', 'exploration'],
  sapling: ['exploration', 'synthesis'],
  tree: ['synthesis', 'advocacy'],
  grove: ['advocacy'],
};
```

**File:** `src/core/extraction/index.ts`

```typescript
// src/core/extraction/index.ts
export * from './types';
```

### Story 2.2: Add Server Extraction Endpoint

**File:** `server.js`

**Action:** Add after the enrichment endpoints (around line 3660)

```javascript
// ============================================================================
// Prompt Extraction API
// Sprint: exploration-node-unification-v1
// ============================================================================

app.post('/api/prompts/extract', async (req, res) => {
  try {
    const { documentId, title, content, tier, namedEntities } = req.body;
    
    if (!documentId || !content) {
      return res.status(400).json({ error: 'documentId and content required' });
    }
    
    console.log(`[Extract] Processing: ${title || documentId}`);
    
    const prompt = `You are extracting exploration prompts from a Grove knowledge document.

DOCUMENT:
Title: ${title || 'Untitled'}
Content: ${content.slice(0, 4000)}
Tier: ${tier || 'sapling'}
Named Entities: ${JSON.stringify(namedEntities || {})}

EXTRACTION RULES:

1. MOLECULAR INDEPENDENCE: Each prompt must stand completely alone.
   - Never assume the reader has seen other prompts
   - No "following up on..." or "building on..."
   - Each prompt is a valid entry point to this topic

2. DUAL FORM: Each prompt needs:
   - LABEL: Simple question for UI (10-15 words max)
   - EXECUTION_PROMPT: First-person curious question with context
   - SYSTEM_CONTEXT: Rich instruction for LLM (persona, framing)

3. STAGE TARGETING based on tier:
   - seed → genesis (curiosity)
   - sprout → genesis/exploration (mechanics)
   - sapling → exploration/synthesis (implications)
   - tree → synthesis/advocacy (action)

4. Return JSON array with 5-8 prompts:
[
  {
    "label": "Simple question here?",
    "executionPrompt": "First-person curious question...",
    "systemContext": "LLM instruction about framing...",
    "stages": ["genesis", "exploration"],
    "lenses": ["base"],
    "topics": ["infrastructure-bet"],
    "confidence": 0.9
  }
]`;

    const result = await genai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json', temperature: 0.4 },
    });
    
    let rawPrompts = [];
    try {
      const text = result.text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      rawPrompts = JSON.parse(text);
    } catch (parseErr) {
      console.error('[Extract] Parse error:', parseErr.message);
      return res.status(500).json({ error: 'Failed to parse extraction' });
    }
    
    const now = Date.now();
    const prompts = rawPrompts.map((raw, index) => ({
      id: `extracted-${documentId.slice(0, 8)}-${index}-${now}`,
      objectType: 'prompt',
      created: now,
      modified: now,
      author: 'extracted',
      label: raw.label,
      description: `Extracted from: ${title}`,
      executionPrompt: raw.executionPrompt,
      systemContext: raw.systemContext,
      tags: ['extracted', tier || 'sapling', ...(raw.topics || []).slice(0, 3)],
      topicAffinities: (raw.topics || []).map((t, i) => ({ topicId: t, weight: 1.0 - i * 0.1 })),
      lensAffinities: (raw.lenses || []).map((l, i) => ({ lensId: l, weight: 1.0 - i * 0.15 })),
      targeting: { stages: raw.stages?.length ? raw.stages : ['exploration'] },
      baseWeight: Math.round((raw.confidence || 0.7) * 80),
      stats: { impressions: 0, selections: 0, completions: 0, avgEntropyDelta: 0, avgDwellAfter: 0 },
      status: 'active',
      source: 'generated',
      provenance: {
        type: 'extracted',
        reviewStatus: 'pending',
        sourceDocIds: [documentId],
        sourceDocTitles: [title],
        extractedAt: now,
        extractionModel: 'gemini-2.0-flash',
        extractionConfidence: raw.confidence || 0.7,
      },
    }));
    
    console.log(`[Extract] Extracted ${prompts.length} prompts from ${title}`);
    
    res.json({
      documentId,
      documentTitle: title,
      prompts,
      raw: rawPrompts,
      metadata: { extractedAt: now, model: 'gemini-2.0-flash', documentTier: tier, promptCount: prompts.length },
    });
  } catch (error) {
    console.error('[Extract] Error:', error);
    res.status(500).json({ error: error.message });
  }
});
```

**Test:**
```bash
curl -X POST http://localhost:3001/api/prompts/extract \
  -H "Content-Type: application/json" \
  -d '{"documentId":"test-123","title":"Test Document","content":"Grove is a distributed AI infrastructure project that enables personal AI ownership through local model execution combined with cloud augmentation.","tier":"sapling"}'
```

---

## Epic 3: Hybrid Search Activation

### Story 3.1: Verify SQL Function

```sql
-- Run in Supabase SQL Editor
SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'search_documents_hybrid';
```

If missing, apply migration:
```bash
npx supabase db push
```

### Story 3.2: Update search.js

**File:** `lib/knowledge/search.js`

**Action:** Modify `searchDocuments` function

Find the current implementation and update to use hybrid by default:

```javascript
export async function searchDocuments(query, options = {}) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  const {
    limit = 10,
    threshold = 0.3,
    useHybrid = true,  // NEW: Default to hybrid
  } = options;

  const queryEmbedding = await generateEmbedding(query);
  
  if (useHybrid) {
    // Extract keywords
    const keywords = query.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 2 && !['the', 'and', 'for', 'that', 'this', 'with'].includes(w))
      .slice(0, 10);
    
    const { data, error } = await supabaseAdmin.rpc('search_documents_hybrid', {
      query_embedding: `[${queryEmbedding.join(',')}]`,
      query_keywords: keywords,
      match_count: limit,
      match_threshold: threshold,
      track_retrievals: true,
      freshness_decay_days: 30,
    });
    
    if (error) {
      console.error('[Search] Hybrid search error:', error);
      throw new Error(`Hybrid search failed: ${error.message}`);
    }
    
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

  // Fallback to pure vector (existing code)
  const { data, error } = await supabaseAdmin.rpc('search_documents', {
    query_embedding: `[${queryEmbedding.join(',')}]`,
    match_count: limit,
    match_threshold: threshold,
  });

  if (error) throw new Error(`Search failed: ${error.message}`);

  return (data || []).map(row => ({
    id: row.id,
    title: row.title,
    content: row.content,
    snippet: row.content?.slice(0, 200) + '...',
    similarity: row.similarity,
  }));
}
```

---

## Epic 4: Provenance-Aware Scoring

### Story 4.1: Add Scoring Function

**File:** `src/core/context-fields/scoring.ts`

**Action:** Add function after existing scoring functions

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
  
  // Legacy prompt without provenance
  if (!provenance) {
    return score + 10;
  }
  
  switch (provenance.type) {
    case 'authored':
      score += 10; // Trust boost
      break;
      
    case 'extracted':
      // Boost if source doc was retrieved
      if (context.retrievedDocIds && provenance.sourceDocIds) {
        const isRelevant = provenance.sourceDocIds.some(id => 
          context.retrievedDocIds!.includes(id)
        );
        if (isRelevant) {
          score += 25;
        }
      }
      // Reduce if not reviewed
      if (provenance.reviewStatus === 'pending') {
        score *= 0.8;
      } else if (provenance.reviewStatus === 'rejected') {
        score *= 0.3;
      }
      break;
      
    case 'generated':
      if (provenance.reviewStatus !== 'approved') {
        score *= 0.5;
      }
      break;
      
    case 'submitted':
      if (provenance.reviewStatus === 'pending') {
        score *= 0.7;
      }
      break;
  }
  
  return score;
}
```

---

## Epic 5: Prompt Workshop UI

### Story 5.1: Create ProvenanceBadge Component

**File:** `src/bedrock/consoles/PromptWorkshop/ProvenanceBadge.tsx` (NEW)

```typescript
// src/bedrock/consoles/PromptWorkshop/ProvenanceBadge.tsx
// Sprint: exploration-node-unification-v1

import type { PromptProvenance, ProvenanceType } from '@core/context-fields/types';

interface ProvenanceBadgeProps {
  provenance?: PromptProvenance;
  size?: 'sm' | 'md';
}

const PROVENANCE_CONFIG: Record<ProvenanceType, { icon: string; label: string; color: string }> = {
  authored: { icon: '📝', label: 'Authored', color: '#526F8A' },
  extracted: { icon: '📄', label: 'Extracted', color: '#7EA16B' },
  generated: { icon: '🤖', label: 'Generated', color: '#E0A83B' },
  submitted: { icon: '👤', label: 'Submitted', color: '#9C7BC0' },
};

export function ProvenanceBadge({ provenance, size = 'sm' }: ProvenanceBadgeProps) {
  const type = provenance?.type ?? 'authored';
  const config = PROVENANCE_CONFIG[type];
  const showReview = provenance && type !== 'authored' && provenance.reviewStatus !== 'approved';
  
  return (
    <div className="flex items-center gap-1">
      <span 
        className={size === 'sm' ? 'text-xs' : 'text-sm'}
        style={{ color: config.color }}
      >
        {config.icon} {config.label}
      </span>
      {showReview && (
        <span className="text-xs text-amber-500">
          {provenance!.reviewStatus === 'pending' ? '⏳' : '❌'}
        </span>
      )}
    </div>
  );
}

export default ProvenanceBadge;
```

### Story 5.2: Add Badge to PromptCard

**File:** `src/bedrock/consoles/PromptWorkshop/PromptCard.tsx`

**Action:** Import and add badge

```typescript
import { ProvenanceBadge } from './ProvenanceBadge';

// In the card JSX, add near the top or in footer:
<ProvenanceBadge provenance={prompt.provenance} size="sm" />
```

### Story 5.3: Add Provenance Filter

**File:** `src/bedrock/consoles/PromptWorkshop/PromptWorkshop.config.ts`

**Action:** Add to filterOptions array

```typescript
{
  field: 'provenance.type',
  label: 'Provenance',
  type: 'select',
  options: ['authored', 'extracted', 'generated', 'submitted'],
},
```

### Story 5.4: Add Header Label

Find where the console header is rendered and add "Exploration Nodes" label in the center area, to the left of the "+New Prompt" button.

---

## Build Gates

After each epic, verify:

```bash
# Build
npm run build

# Tests (if applicable)
npm test

# Manual verification
npm run dev
# Visit http://localhost:3000/bedrock/prompts
```

---

## Final Verification

```bash
# 1. Build passes
npm run build

# 2. Tests pass
npm test

# 3. Server starts
npm run dev

# 4. Verify extraction endpoint
curl -X POST http://localhost:3001/api/prompts/extract \
  -H "Content-Type: application/json" \
  -d '{"documentId":"test","title":"Test","content":"Sample content...","tier":"sapling"}'

# 5. Visual verification
# - Open http://localhost:3000/bedrock/prompts
# - Verify "Exploration Nodes" in header
# - Verify provenance badges on cards
# - Verify filter dropdown works
```

---

## Troubleshooting

### Build Errors

**"Property 'provenance' does not exist"**
- Ensure PromptProvenance type is defined before PromptObject
- Check imports in files using PromptObject

**"Cannot find module '@core/context-fields/types'"**
- Verify tsconfig paths include @core alias
- Check index.ts exports

### Runtime Errors

**"search_documents_hybrid does not exist"**
- Run: `npx supabase db push`
- Verify migration 005 applied

**Extraction returns empty array**
- Check Gemini API key configured
- Verify content length (< 4000 chars sent)
- Check server logs for parse errors

---

## Success Criteria

- [ ] All 66 prompts have provenance field
- [ ] Extraction endpoint returns valid PromptObjects
- [ ] Hybrid search active and returning enrichment scores
- [ ] Provenance scoring applied correctly
- [ ] "Exploration Nodes" visible in header
- [ ] Badges display on prompt cards
- [ ] Provenance filter works
- [ ] Build passes, no type errors

---

## DEVLOG

Document progress and issues encountered during execution.

```markdown
## DEVLOG: exploration-node-unification-v1

### [Date] Epic 1

**Status:** 
**Notes:**

### [Date] Epic 2

**Status:**
**Notes:**

...
```

---

*Execution prompt complete. Ready for handoff.*
