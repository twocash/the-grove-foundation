# Architecture: exploration-node-unification-v1

**Sprint:** exploration-node-unification-v1  
**Version:** 1.0  
**Created:** 2025-01-05

---

## 1. System Overview

### 1.1 Architecture Vision

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         EXPLORATION NODE ARCHITECTURE                        │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        PROMPT STORE (Unified)                         │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │  │  PromptObject[]                                                  │ │   │
│  │  │  - id, label, executionPrompt, systemContext                    │ │   │
│  │  │  - targeting, affinities, stats                                  │ │   │
│  │  │  - provenance: { type, sourceDocIds, reviewStatus, ... }        │ │   │
│  │  └─────────────────────────────────────────────────────────────────┘ │   │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                              ▲                                               │
│          ┌───────────────────┼───────────────────┬─────────────────┐        │
│          │                   │                   │                 │        │
│   ┌──────┴──────┐    ┌───────┴───────┐   ┌──────┴──────┐   ┌──────┴──────┐ │
│   │  AUTHORED   │    │   EXTRACTED   │   │  GENERATED  │   │  SUBMITTED  │ │
│   │  (Manual)   │    │  (From Docs)  │   │ (From Gaps) │   │  (Future)   │ │
│   │             │    │               │   │             │   │             │ │
│   │ JSON files  │    │ Extraction    │   │ Gap         │   │ User        │ │
│   │ in repo     │    │ Pipeline      │   │ Analysis    │   │ Input       │ │
│   └─────────────┘    └───────┬───────┘   └─────────────┘   └─────────────┘ │
│                              │                                               │
│                      ┌───────┴───────┐                                      │
│                      │   DOCUMENTS   │                                      │
│                      │   (RAG)       │                                      │
│                      └───────────────┘                                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Layer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ SURFACE LAYER                                                   │
│ - Terminal (prompt display, selection)                          │
│ - PromptHooks component                                         │
├─────────────────────────────────────────────────────────────────┤
│ ADAPTER LAYER                                                    │
│ - usePromptSuggestions (scoring + surfacing)                    │
│ - PromptWorkshop (admin UI)                                     │
├─────────────────────────────────────────────────────────────────┤
│ CORE LAYER                                                      │
│ - src/core/context-fields/ (types, scoring)                     │
│ - src/core/extraction/ (NEW: extraction pipeline)               │
├─────────────────────────────────────────────────────────────────┤
│ BEDROCK LAYER                                                   │
│ - PromptObject storage (JSON + future DB)                       │
│ - Provenance tracking                                           │
├─────────────────────────────────────────────────────────────────┤
│ SERVER LAYER                                                     │
│ - /api/prompts/extract (extraction endpoint)                    │
│ - /api/knowledge/search (hybrid search)                         │
├─────────────────────────────────────────────────────────────────┤
│ DATA LAYER                                                       │
│ - Supabase: documents, embeddings                               │
│ - JSON: prompt files with provenance                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Type Definitions

### 2.1 PromptProvenance

**File:** `src/core/context-fields/types.ts`

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
  /** Source type */
  type: ProvenanceType;
  
  /** Review workflow */
  reviewStatus: ReviewStatus;
  reviewedAt?: number;
  reviewedBy?: string;
  
  // --- AUTHORED ---
  /** For authored prompts: who wrote it */
  authorId?: string;
  authorName?: string;
  
  // --- EXTRACTED ---
  /** For extracted prompts: source document(s) */
  sourceDocIds?: string[];
  sourceDocTitles?: string[];
  extractedAt?: number;
  extractionModel?: string;
  /** Confidence score from extraction (0-1) */
  extractionConfidence?: number;
  
  // --- GENERATED ---
  /** For generated prompts: why it was created */
  gapAnalysisId?: string;
  generationReason?: string;
  coverageGap?: {
    stage?: string;
    lens?: string;
    topic?: string;
  };
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

### 2.2 Extended PromptObject

**File:** `src/core/context-fields/types.ts` (update existing)

```typescript
/**
 * First-class DEX object for prompts (Exploration Nodes)
 * Extended with provenance tracking
 */
export interface PromptObject {
  id: string;
  objectType: 'prompt';
  created: number;
  modified: number;
  author: 'system' | 'generated' | string;
  
  // Display
  label: string;
  description?: string;
  executionPrompt: string;
  systemContext?: string;
  
  // Visual
  icon?: string;
  variant?: 'default' | 'glow' | 'subtle' | 'urgent';
  
  // Targeting
  tags: string[];
  topicAffinities: TopicAffinity[];
  lensAffinities: LensAffinity[];
  targeting: ContextTargeting;
  baseWeight?: number;
  
  // Analytics
  stats: PromptStats;
  
  // Status
  status: 'draft' | 'active' | 'deprecated';
  source: 'library' | 'generated' | 'user';
  generatedFrom?: GenerationContext;
  
  // Behavior
  cooldown?: number;
  maxShows?: number;
  
  // === NEW: Sprint exploration-node-unification-v1 ===
  
  /** Provenance tracking - where this prompt came from */
  provenance: PromptProvenance;
  
  /** Embedding for similarity matching (optional, computed on demand) */
  embedding?: number[];
}
```

---

## 3. Extraction Pipeline

### 3.1 Module Structure

**New directory:** `src/core/extraction/`

```
src/core/extraction/
├── index.ts              → Barrel export
├── types.ts              → Extraction types
├── prompts.ts            → Gemini prompt templates
├── extract.ts            → Core extraction logic
├── transform.ts          → Raw → PromptObject transform
└── deduplicate.ts        → Similarity-based deduplication
```

### 3.2 Extraction Types

**File:** `src/core/extraction/types.ts`

```typescript
// src/core/extraction/types.ts
// Sprint: exploration-node-unification-v1

import type { Stage } from '../context-fields/types';

/**
 * Raw extraction result from Gemini
 */
export interface RawExtractedPrompt {
  label: string;
  executionPrompt: string;
  systemContext: string;
  stages: string[];
  lenses: string[];
  topics: string[];
  confidence: number;
}

/**
 * Document context for extraction
 */
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

/**
 * Full extraction result
 */
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

/**
 * Stage mapping from document tier
 */
export const TIER_TO_STAGES: Record<string, Stage[]> = {
  seed: ['genesis'],
  sprout: ['genesis', 'exploration'],
  sapling: ['exploration', 'synthesis'],
  tree: ['synthesis', 'advocacy'],
  grove: ['advocacy'],
};

/**
 * Lens inference from entity types
 */
export const ENTITY_TO_LENS: Record<string, string> = {
  // People
  'tech-leader': 'engineer',
  'policymaker': 'policymaker',
  'academic': 'academic',
  'business': 'business',
  // Organizations
  'university': 'academic',
  'company': 'business',
  'government': 'policymaker',
  // Concepts
  'technical': 'engineer',
  'economic': 'business',
  'philosophical': 'base',
};
```

### 3.3 Core Extraction Function

**File:** `src/core/extraction/extract.ts`

```typescript
// src/core/extraction/extract.ts
// Sprint: exploration-node-unification-v1

import type { ExtractionContext, ExtractionResult, RawExtractedPrompt } from './types';
import type { PromptObject } from '../context-fields/types';
import { EXTRACTION_PROMPT } from './prompts';
import { transformToPromptObject } from './transform';

/**
 * Extract prompts from a document
 */
export async function extractPromptsFromDocument(
  ctx: ExtractionContext,
  apiEndpoint: string = '/api/prompts/extract'
): Promise<ExtractionResult> {
  const response = await fetch(apiEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      documentId: ctx.documentId,
      title: ctx.title,
      content: ctx.content,
      tier: ctx.tier,
      namedEntities: ctx.namedEntities,
    }),
  });

  if (!response.ok) {
    throw new Error(`Extraction failed: ${response.status}`);
  }

  const result = await response.json();
  return result as ExtractionResult;
}

/**
 * Build the extraction prompt for Gemini
 */
export function buildExtractionPrompt(ctx: ExtractionContext): string {
  return EXTRACTION_PROMPT
    .replace('${title}', ctx.title)
    .replace('${content}', ctx.content.slice(0, 4000))
    .replace('${tier}', ctx.tier)
    .replace('${entities}', JSON.stringify(ctx.namedEntities));
}
```

### 3.4 Transform Function

**File:** `src/core/extraction/transform.ts`

```typescript
// src/core/extraction/transform.ts
// Sprint: exploration-node-unification-v1

import type { RawExtractedPrompt, ExtractionContext } from './types';
import type { PromptObject, Stage, TopicAffinity, LensAffinity } from '../context-fields/types';
import { createExtractedProvenance } from '../context-fields/types';
import { TIER_TO_STAGES } from './types';

/**
 * Transform raw extraction to PromptObject
 */
export function transformToPromptObject(
  raw: RawExtractedPrompt,
  ctx: ExtractionContext,
  index: number
): PromptObject {
  const now = Date.now();
  const id = `extracted-${ctx.documentId.slice(0, 8)}-${index}-${now}`;
  
  // Map stages
  const stages = raw.stages
    .map(s => s.toLowerCase() as Stage)
    .filter(s => ['genesis', 'exploration', 'synthesis', 'advocacy'].includes(s));
  
  // Use tier-based stages if extraction didn't provide valid ones
  const finalStages = stages.length > 0 
    ? stages 
    : TIER_TO_STAGES[ctx.tier] || ['exploration'];
  
  // Build topic affinities
  const topicAffinities: TopicAffinity[] = raw.topics.map((t, i) => ({
    topicId: t,
    weight: 1.0 - (i * 0.1), // Decreasing weight by order
  }));
  
  // Build lens affinities
  const lensAffinities: LensAffinity[] = raw.lenses.map((l, i) => ({
    lensId: l,
    weight: 1.0 - (i * 0.15),
  }));
  
  return {
    id,
    objectType: 'prompt',
    created: now,
    modified: now,
    author: 'extracted',
    
    label: raw.label,
    description: `Extracted from: ${ctx.title}`,
    executionPrompt: raw.executionPrompt,
    systemContext: raw.systemContext,
    
    tags: ['extracted', ctx.tier, ...raw.topics.slice(0, 3)],
    topicAffinities,
    lensAffinities,
    
    targeting: {
      stages: finalStages,
      lensIds: raw.lenses.length > 0 ? raw.lenses : undefined,
    },
    baseWeight: Math.round(raw.confidence * 80), // 0-80 based on confidence
    
    stats: {
      impressions: 0,
      selections: 0,
      completions: 0,
      avgEntropyDelta: 0,
      avgDwellAfter: 0,
    },
    
    status: 'active',
    source: 'generated', // Maps to provenance.type in source field
    
    // NEW: Provenance
    provenance: createExtractedProvenance(
      [ctx.documentId],
      [ctx.title],
      raw.confidence,
      'gemini-2.0-flash'
    ),
  };
}
```

---

## 4. Server Integration

### 4.1 Extraction Endpoint

**File:** `server.js` (add after line ~3660)

```javascript
// ============================================================================
// Prompt Extraction API
// Sprint: exploration-node-unification-v1
// ============================================================================

/**
 * Extract prompts from a document
 * POST /api/prompts/extract
 */
app.post('/api/prompts/extract', async (req, res) => {
  try {
    const { documentId, title, content, tier, namedEntities } = req.body;
    
    if (!documentId || !content) {
      return res.status(400).json({ error: 'documentId and content required' });
    }
    
    console.log(`[Extract] Processing: ${title || documentId}`);
    
    // Build extraction prompt
    const prompt = buildExtractionPromptServer(title, content, tier, namedEntities);
    
    // Call Gemini
    const result = await genai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.4, // Lower for consistency
      },
    });
    
    // Parse response
    let rawPrompts = [];
    try {
      const text = result.text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      rawPrompts = JSON.parse(text);
    } catch (parseErr) {
      console.error('[Extract] Parse error:', parseErr.message);
      return res.status(500).json({ error: 'Failed to parse extraction result' });
    }
    
    console.log(`[Extract] Extracted ${rawPrompts.length} prompts from ${title}`);
    
    // Transform to PromptObjects
    const prompts = rawPrompts.map((raw, index) => 
      transformRawToPrompt(raw, documentId, title, tier, index)
    );
    
    res.json({
      documentId,
      documentTitle: title,
      prompts,
      raw: rawPrompts,
      metadata: {
        extractedAt: Date.now(),
        model: 'gemini-2.0-flash',
        documentTier: tier || 'unknown',
        promptCount: prompts.length,
      },
    });
  } catch (error) {
    console.error('[Extract] Error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Build extraction prompt (server-side)
 */
function buildExtractionPromptServer(title, content, tier, entities) {
  return `You are extracting exploration prompts from a Grove knowledge document.

DOCUMENT:
Title: ${title || 'Untitled'}
Content: ${content.slice(0, 4000)}
Tier: ${tier || 'sapling'}
Named Entities: ${JSON.stringify(entities || {})}

EXTRACTION RULES:

1. MOLECULAR INDEPENDENCE: Each prompt must stand completely alone.
   - Never assume the reader has seen other prompts
   - No "following up on..." or "building on..."
   - Each prompt is a valid entry point to this topic
   - A reader selecting this prompt knows NOTHING else

2. DUAL FORM: Each prompt needs two versions:
   - LABEL: Simple question for UI (10-15 words max)
   - EXECUTION_PROMPT: First-person question with curiosity and specificity
   - SYSTEM_CONTEXT: Rich instruction for LLM (persona awareness, framing)

3. STAGE TARGETING based on tier:
   - seed → genesis (curiosity)
   - sprout → genesis/exploration (mechanics)
   - sapling → exploration/synthesis (implications)
   - tree → synthesis/advocacy (action)

4. LENS INFERENCE from entities:
   - Technical → engineer
   - Policy/governance → policymaker
   - Economic → business
   - Academic → academic
   - General → base

Return JSON array with 5-8 prompts:
[
  {
    "label": "Simple question here?",
    "executionPrompt": "First-person curious question with context...",
    "systemContext": "Instruction for LLM about framing and ending...",
    "stages": ["genesis", "exploration"],
    "lenses": ["base"],
    "topics": ["infrastructure-bet"],
    "confidence": 0.9
  }
]`;
}

/**
 * Transform raw extraction to PromptObject (server-side)
 */
function transformRawToPrompt(raw, docId, docTitle, tier, index) {
  const now = Date.now();
  const id = `extracted-${docId.slice(0, 8)}-${index}-${now}`;
  
  const stages = (raw.stages || ['exploration']).filter(s => 
    ['genesis', 'exploration', 'synthesis', 'advocacy'].includes(s.toLowerCase())
  );
  
  return {
    id,
    objectType: 'prompt',
    created: now,
    modified: now,
    author: 'extracted',
    label: raw.label,
    description: `Extracted from: ${docTitle}`,
    executionPrompt: raw.executionPrompt,
    systemContext: raw.systemContext,
    tags: ['extracted', tier || 'sapling', ...(raw.topics || []).slice(0, 3)],
    topicAffinities: (raw.topics || []).map((t, i) => ({ topicId: t, weight: 1.0 - i * 0.1 })),
    lensAffinities: (raw.lenses || []).map((l, i) => ({ lensId: l, weight: 1.0 - i * 0.15 })),
    targeting: {
      stages: stages.length > 0 ? stages : ['exploration'],
      lensIds: raw.lenses?.length > 0 ? raw.lenses : undefined,
    },
    baseWeight: Math.round((raw.confidence || 0.7) * 80),
    stats: { impressions: 0, selections: 0, completions: 0, avgEntropyDelta: 0, avgDwellAfter: 0 },
    status: 'active',
    source: 'generated',
    provenance: {
      type: 'extracted',
      reviewStatus: 'pending',
      sourceDocIds: [docId],
      sourceDocTitles: [docTitle],
      extractedAt: now,
      extractionModel: 'gemini-2.0-flash',
      extractionConfidence: raw.confidence || 0.7,
    },
  };
}
```

---

## 5. Hybrid Search Integration

### 5.1 Update search.js

**File:** `lib/knowledge/search.js` (modify searchDocuments function)

```javascript
/**
 * Search documents using hybrid scoring (UPDATED)
 * Sprint: exploration-node-unification-v1
 */
export async function searchDocuments(query, options = {}) {
  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    throw new Error('Supabase not configured');
  }

  const {
    limit = 10,
    threshold = 0.3,
    useHybrid = true, // NEW: Default to hybrid
  } = options;

  const queryEmbedding = await generateEmbedding(query);
  
  // Use hybrid search if enabled
  if (useHybrid) {
    return searchDocumentsHybrid(query, options);
  }

  // Fallback to pure vector (legacy)
  const { data, error } = await supabaseAdmin.rpc('search_documents', {
    query_embedding: `[${queryEmbedding.join(',')}]`,
    match_count: limit,
    match_threshold: threshold,
  });

  if (error) {
    throw new Error(`Search failed: ${error.message}`);
  }

  return (data || []).map(row => ({
    id: row.id,
    title: row.title,
    content: row.content,
    snippet: row.content.slice(0, 200) + '...',
    similarity: row.similarity,
  }));
}
```

---

## 6. Scoring Integration

### 6.1 Provenance-Aware Scoring

**File:** `src/core/context-fields/scoring.ts` (add function)

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
    // Legacy prompt without provenance - treat as authored
    return score + 10;
  }
  
  switch (provenance.type) {
    case 'authored':
      // Human curated = trust boost
      score += 10;
      break;
      
    case 'extracted':
      // Boost if source document was just retrieved
      if (context.retrievedDocIds && provenance.sourceDocIds) {
        const isRelevant = provenance.sourceDocIds.some(id => 
          context.retrievedDocIds!.includes(id)
        );
        if (isRelevant) {
          score += 25; // Direct relevance boost
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
      // Lower trust until approved
      if (provenance.reviewStatus !== 'approved') {
        score *= 0.5;
      }
      break;
      
    case 'submitted':
      // User submitted - moderate trust
      if (provenance.reviewStatus === 'pending') {
        score *= 0.7;
      }
      break;
  }
  
  return score;
}
```

---

## 7. Prompt Workshop Updates

### 7.1 Config Update

**File:** `src/bedrock/consoles/PromptWorkshop/PromptWorkshop.config.ts`

```typescript
// Add to filterOptions array
{
  field: 'provenance.type',
  label: 'Provenance',
  type: 'select',
  options: ['authored', 'extracted', 'generated', 'submitted'],
},
{
  field: 'provenance.reviewStatus',
  label: 'Review Status',
  type: 'select',
  options: ['pending', 'approved', 'rejected'],
},
```

### 7.2 Provenance Badge Component

**File:** `src/bedrock/consoles/PromptWorkshop/ProvenanceBadge.tsx` (new)

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
  if (!provenance) {
    // Legacy prompt - default to authored
    return <span className="text-xs text-[#526F8A]">📝 Authored</span>;
  }
  
  const config = PROVENANCE_CONFIG[provenance.type];
  const showReview = provenance.type !== 'authored' && provenance.reviewStatus !== 'approved';
  
  return (
    <div className="flex items-center gap-1">
      <span 
        className={`${size === 'sm' ? 'text-xs' : 'text-sm'}`}
        style={{ color: config.color }}
      >
        {config.icon} {config.label}
      </span>
      {showReview && (
        <span className="text-xs text-amber-500">
          {provenance.reviewStatus === 'pending' ? '⏳' : '❌'}
        </span>
      )}
    </div>
  );
}
```

---

## 8. Data Flow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXTRACTION FLOW                               │
│                                                                  │
│  Document (in RAG)                                               │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────┐                                            │
│  │ POST /api/      │                                            │
│  │ prompts/extract │                                            │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │ Gemini 2.0      │ → Raw JSON extraction                      │
│  │ Flash           │                                            │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │ Transform       │ → PromptObject[] with provenance            │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │ Return to       │ → Store or display                         │
│  │ caller          │                                            │
│  └─────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    RETRIEVAL FLOW                                │
│                                                                  │
│  User Query                                                      │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────┐                                            │
│  │ Hybrid Search   │ → Documents + enrichment scores             │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │ Load All        │ → All PromptObjects (authored + extracted)  │
│  │ Prompts         │                                            │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │ Score with      │ → Provenance modifiers applied             │
│  │ Context         │ → Source doc relevance boost               │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │ Surface Top     │ → Display to user                          │
│  │ Prompts         │                                            │
│  └─────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

*Architecture complete. Ready for DECISIONS.md generation.*
