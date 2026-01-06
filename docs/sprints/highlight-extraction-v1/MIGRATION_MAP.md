# Migration Map — highlight-extraction-v1

## Overview

This sprint adds concept detection and highlight prompt generation to the extraction pipeline. Changes are additive—existing extraction continues to work while highlight extraction runs in parallel.

---

## Files to Create

### `src/core/extraction/config.ts`

**Purpose:** Declarative configuration for extraction thresholds
**Depends on:** Nothing
**Tests:** Unit tests validate config structure

```typescript
/**
 * Extraction configuration - DEX compliant
 * All thresholds are mutable without code changes
 */
export const EXTRACTION_CONFIG = {
  highlight: {
    /** Minimum confidence to extract highlight prompt (0-1) */
    confidenceThreshold: 0.7,
    
    /** Boost applied to terms in core concepts registry */
    coreConceptBoost: 0.2,
    
    /** Maximum concepts to extract per document */
    maxConceptsPerDoc: 15,
    
    /** Minimum term length to consider */
    minTermLength: 3,
    
    /** Model for generation */
    model: 'gemini-2.0-flash',
  }
};

export type ExtractionConfig = typeof EXTRACTION_CONFIG;
```

---

### `src/data/concepts/groveCoreConcepts.json`

**Purpose:** Canonical registry of Grove-specific terms
**Depends on:** Nothing
**Tests:** Validation tests check structure

```json
{
  "version": "1.0",
  "description": "Core Grove concepts for highlight extraction",
  "concepts": [
    { "term": "distributed ownership", "category": "infrastructure", "priority": 1, "definition": "Ownership of AI compute and model weights distributed across personal devices rather than centralized data centers" },
    { "term": "hybrid architecture", "category": "architecture", "priority": 1, "definition": "Local 7B models for routine cognition, cloud APIs for pivotal moments requiring frontier capability" },
    { "term": "credit economy", "category": "economics", "priority": 1, "definition": "Agents earn credits by solving problems, spend credits on cloud compute access" },
    { "term": "efficiency tax", "category": "economics", "priority": 1, "definition": "Small portion of efficiency gains from adopted innovations flows back as credits to originators" },
    { "term": "capability propagation", "category": "ratchet-thesis", "priority": 1, "definition": "Frontier AI capabilities migrate to consumer hardware on predictable timelines" },
    { "term": "ratchet thesis", "category": "ratchet-thesis", "priority": 1, "definition": "AI capability doubling every 7 months with 21-month lag to consumer hardware" },
    { "term": "AI villages", "category": "vision", "priority": 1, "definition": "3-12 agents on a personal computer developing specializations and relationships" },
    { "term": "exploration architecture", "category": "architecture", "priority": 1, "definition": "Infrastructure that makes guided exploration productive regardless of individual capability" },
    { "term": "knowledge commons", "category": "community", "priority": 2, "definition": "Shared repository of innovations across the Grove network" },
    { "term": "epistemic independence", "category": "philosophy", "priority": 2, "definition": "Freedom from Big Tech gatekeepers in access to AI capability" },
    { "term": "trellis architecture", "category": "architecture", "priority": 2, "definition": "Structural framework supporting DEX stack standards" },
    { "term": "gardener", "category": "roles", "priority": 2, "definition": "Human who shapes agent environment without controlling every outcome" },
    { "term": "local inference", "category": "architecture", "priority": 2, "definition": "Running AI models on personal hardware for privacy and cost efficiency" },
    { "term": "pivotal moments", "category": "architecture", "priority": 2, "definition": "Decision points requiring frontier capability accessed via cloud" },
    { "term": "agent diaries", "category": "engagement", "priority": 2, "definition": "Ongoing logs of agent experiences, thoughts, and relationships" }
  ]
}
```

---

### `src/core/extraction/conceptDetection.ts`

**Purpose:** Detect highlightable concepts in documents
**Depends on:** `config.ts`, `groveCoreConcepts.json`
**Tests:** `tests/unit/conceptDetection.test.ts`

```typescript
import { EXTRACTION_CONFIG } from './config';
import coreConceptsData from '@data/concepts/groveCoreConcepts.json';
import type { HighlightTrigger } from '@core/context-fields/types';

export interface CoreConcept {
  term: string;
  category: string;
  priority: number;
  definition: string;
}

export interface DetectedConcept {
  term: string;
  frequency: number;
  semanticWeight: number;
  groveSpecificity: number;
  suggestedTriggers: HighlightTrigger[];
  confidence: number;
  contextExcerpt: string;
}

/**
 * Detect highlightable concepts in a document
 */
export async function detectConcepts(
  documentText: string,
  documentTitle: string,
  options: {
    minConfidence?: number;
    maxConcepts?: number;
  } = {}
): Promise<DetectedConcept[]> {
  const config = EXTRACTION_CONFIG.highlight;
  const minConfidence = options.minConfidence ?? config.confidenceThreshold;
  const maxConcepts = options.maxConcepts ?? config.maxConceptsPerDoc;
  
  const coreConcepts: CoreConcept[] = coreConceptsData.concepts;
  const detectedConcepts: DetectedConcept[] = [];
  
  // Check each core concept against document
  for (const concept of coreConcepts) {
    const termLower = concept.term.toLowerCase();
    const textLower = documentText.toLowerCase();
    
    // Count frequency
    const regex = new RegExp(termLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = documentText.match(regex) || [];
    const frequency = matches.length;
    
    if (frequency === 0) continue;
    
    // Calculate confidence
    const groveSpecificity = 1.0; // It's in the registry
    const priorityBoost = concept.priority === 1 ? 0.1 : 0;
    const frequencyScore = Math.min(frequency / 5, 1.0) * 0.3; // Max out at 5 mentions
    
    const confidence = Math.min(
      groveSpecificity * 0.5 + frequencyScore + priorityBoost + config.coreConceptBoost,
      1.0
    );
    
    if (confidence < minConfidence) continue;
    
    // Extract context excerpt
    const firstMatch = textLower.indexOf(termLower);
    const excerptStart = Math.max(0, firstMatch - 100);
    const excerptEnd = Math.min(documentText.length, firstMatch + concept.term.length + 100);
    const contextExcerpt = documentText.slice(excerptStart, excerptEnd);
    
    detectedConcepts.push({
      term: concept.term,
      frequency,
      semanticWeight: 0.8, // Placeholder - could use embeddings
      groveSpecificity,
      suggestedTriggers: [
        { text: concept.term, matchMode: 'exact' as const }
      ],
      confidence,
      contextExcerpt,
    });
  }
  
  // Sort by confidence and limit
  return detectedConcepts
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, maxConcepts);
}
```

---

### `src/core/extraction/highlightPromptGenerator.ts`

**Purpose:** Generate backing prompts from detected concepts
**Depends on:** `conceptDetection.ts`, Gemini API
**Tests:** `tests/unit/highlightGenerator.test.ts`

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { DetectedConcept } from './conceptDetection';
import type { PromptObject, PromptProvenance, HighlightTrigger } from '@core/context-fields/types';
import { EXTRACTION_CONFIG } from './config';

const HIGHLIGHT_PROMPT_TEMPLATE = `
You are generating a backing prompt for a clickable concept in educational content about Grove, a distributed AI infrastructure project.

CONCEPT: {{concept}}
DOCUMENT EXCERPT: {{excerpt}}
GROVE DEFINITION: {{definition}}

Generate a prompt that a curious user might think when clicking this term. The prompt should:

1. Express genuine curiosity or confusion about what it means
2. Ask a specific question the document context can answer
3. Use conversational first-person voice
4. Be 2-4 sentences maximum

BAD: "Tell me about {{concept}}."
BAD: "What is {{concept}}?"
GOOD: "I keep seeing '{{concept}}' and it sounds important, but I'm not sure what it actually means. Can you help me understand?"

Respond with JSON only, no markdown:
{
  "executionPrompt": "...",
  "systemContext": "User clicked '{{concept}}' in kinetic text. [Guidance for LLM]"
}
`;

export async function generateHighlightPrompt(
  concept: DetectedConcept,
  documentContext: {
    docId: string;
    docTitle: string;
    fullText: string;
  },
  groveDefinition: string,
  apiKey: string
): Promise<PromptObject> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: EXTRACTION_CONFIG.highlight.model });
  
  const prompt = HIGHLIGHT_PROMPT_TEMPLATE
    .replace(/{{concept}}/g, concept.term)
    .replace(/{{excerpt}}/g, concept.contextExcerpt)
    .replace(/{{definition}}/g, groveDefinition);
  
  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  
  // Parse JSON response
  const parsed = JSON.parse(responseText.replace(/```json\n?|\n?```/g, ''));
  
  const provenance: PromptProvenance = {
    type: 'extracted',
    reviewStatus: 'pending',
    sourceDocIds: [documentContext.docId],
    sourceDocTitles: [documentContext.docTitle],
    extractedAt: Date.now(),
    extractionModel: EXTRACTION_CONFIG.highlight.model,
    extractionConfidence: concept.confidence,
    extractionMethod: 'highlight-concept-detection',
  };
  
  return {
    id: `highlight-extracted-${concept.term.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    objectType: 'prompt',
    created: Date.now(),
    modified: Date.now(),
    author: 'system',
    label: `What is ${concept.term}?`,
    description: `Auto-extracted backing prompt for '${concept.term}'`,
    executionPrompt: parsed.executionPrompt,
    systemContext: parsed.systemContext,
    tags: ['highlight', 'extracted', concept.term.toLowerCase().replace(/\s+/g, '-')],
    topicAffinities: [],
    lensAffinities: [{ lensId: 'base', weight: 1.0 }],
    targeting: { stages: ['exploration', 'synthesis'] },
    baseWeight: 60 + Math.round(concept.confidence * 20),
    stats: { impressions: 0, selections: 0, completions: 0, avgEntropyDelta: 0, avgDwellAfter: 0 },
    status: 'active',
    source: 'generated',
    provenance,
    surfaces: ['highlight', 'suggestion'],
    highlightTriggers: concept.suggestedTriggers,
  };
}
```

---

### `src/core/extraction/triggerMerge.ts`

**Purpose:** Deduplicate prompts with overlapping triggers
**Depends on:** `types.ts`
**Tests:** `tests/unit/triggerMerge.test.ts`

```typescript
import type { PromptObject } from '@core/context-fields/types';

export type MergeStrategy = 'favor-newer' | 'favor-higher-confidence' | 'keep-all';

/**
 * Check if two prompts have overlapping triggers
 */
function hasOverlappingTriggers(a: PromptObject, b: PromptObject): boolean {
  const aTriggers = a.highlightTriggers?.map(t => t.text.toLowerCase()) || [];
  const bTriggers = b.highlightTriggers?.map(t => t.text.toLowerCase()) || [];
  
  return aTriggers.some(t => bTriggers.includes(t));
}

/**
 * Merge new prompts with existing, handling duplicates
 */
export function mergeHighlightPrompts(
  newPrompts: PromptObject[],
  existingPrompts: PromptObject[],
  strategy: MergeStrategy = 'favor-newer'
): PromptObject[] {
  if (strategy === 'keep-all') {
    return [...existingPrompts, ...newPrompts];
  }
  
  const result = [...existingPrompts];
  
  for (const newPrompt of newPrompts) {
    const existingIndex = result.findIndex(existing => 
      hasOverlappingTriggers(existing, newPrompt)
    );
    
    if (existingIndex === -1) {
      // No overlap, add new prompt
      result.push(newPrompt);
    } else {
      // Overlap found, apply strategy
      const existing = result[existingIndex];
      
      if (strategy === 'favor-newer') {
        // Replace with newer
        result[existingIndex] = newPrompt;
      } else if (strategy === 'favor-higher-confidence') {
        const existingConf = existing.provenance?.extractionConfidence ?? 0;
        const newConf = newPrompt.provenance?.extractionConfidence ?? 0;
        
        if (newConf > existingConf) {
          result[existingIndex] = newPrompt;
        }
        // Otherwise keep existing
      }
    }
  }
  
  return result;
}
```

---

## Files to Modify

### `src/core/context-fields/types.ts`

**Lines:** After PromptProvenance definition
**Change Type:** Add extractionMethod field

**Before:**
```typescript
export interface PromptProvenance {
  type: ProvenanceType;
  reviewStatus: ReviewStatus;
  // ... existing fields ...
  extractionConfidence?: number;
}
```

**After:**
```typescript
export interface PromptProvenance {
  type: ProvenanceType;
  reviewStatus: ReviewStatus;
  // ... existing fields ...
  extractionConfidence?: number;
  
  /**
   * Method used for extraction
   * @added highlight-extraction-v1
   */
  extractionMethod?: 'general' | 'highlight-concept-detection';
}
```

---

### `src/bedrock/consoles/PromptWorkshop/PromptFilters.tsx`

**Change Type:** Add surface filter dropdown

**Add after provenance filter:**
```typescript
// Surface filter
<select
  value={filters.surface || 'all'}
  onChange={(e) => onFilterChange({ ...filters, surface: e.target.value })}
  className="..."
>
  <option value="all">All Surfaces</option>
  <option value="suggestion">Suggestions</option>
  <option value="highlight">Highlights</option>
  <option value="journey">Journeys</option>
  <option value="followup">Follow-ups</option>
</select>
```

---

### `src/bedrock/consoles/PromptWorkshop/PromptCard.tsx`

**Change Type:** Display highlight triggers

**Add in card detail section:**
```typescript
{prompt.highlightTriggers && prompt.highlightTriggers.length > 0 && (
  <div className="mt-2">
    <span className="text-xs text-gray-500">Triggers: </span>
    {prompt.highlightTriggers.map((t, i) => (
      <span key={i} className="inline-block bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded mr-1">
        {t.text} ({t.matchMode})
      </span>
    ))}
  </div>
)}
```

---

## Files to Delete

None.

---

## Test Changes

### Tests to Create

| Test File | Tests | Verifies |
|-----------|-------|----------|
| `tests/unit/conceptDetection.test.ts` | 5+ tests | Term detection, confidence scoring, threshold filtering |
| `tests/unit/highlightGenerator.test.ts` | 3+ tests | Prompt generation, provenance attachment |
| `tests/unit/triggerMerge.test.ts` | 4+ tests | Merge strategies, overlap detection |

### Tests to Update

| Test File | Change | Reason |
|-----------|--------|--------|
| `tests/e2e/prompt-workshop.spec.ts` | Add surface filter tests | New filter functionality |

---

## Execution Order

1. Create `src/data/concepts/groveCoreConcepts.json`
2. Verify: JSON validates
3. Create `src/core/extraction/config.ts`
4. Verify: TypeScript compiles
5. Create `src/core/extraction/conceptDetection.ts`
6. Create `tests/unit/conceptDetection.test.ts`
7. Verify: `npm test -- conceptDetection`
8. Create `src/core/extraction/highlightPromptGenerator.ts`
9. Create `tests/unit/highlightGenerator.test.ts`
10. Verify: `npm test -- highlightGenerator`
11. Create `src/core/extraction/triggerMerge.ts`
12. Create `tests/unit/triggerMerge.test.ts`
13. Verify: `npm test -- triggerMerge`
14. Modify `src/core/context-fields/types.ts` (add extractionMethod)
15. Modify `src/bedrock/consoles/PromptWorkshop/PromptFilters.tsx`
16. Modify `src/bedrock/consoles/PromptWorkshop/PromptCard.tsx`
17. Verify: `npm run build && npm test`
18. Run E2E tests: `npx playwright test prompt-workshop`

## Build Gates

After each phase:
```bash
npm run build
npm test
npx playwright test
```

## Rollback Plan

### If extraction quality is poor:
1. Increase `confidenceThreshold` in config.ts
2. No code changes needed

### Full rollback:
```bash
git checkout HEAD -- src/core/extraction/
git checkout HEAD -- src/data/concepts/
git checkout HEAD -- src/bedrock/consoles/PromptWorkshop/
```

## Verification Checklist

- [ ] All unit tests pass
- [ ] E2E tests pass
- [ ] Workshop shows surface filter
- [ ] Workshop shows trigger badges
- [ ] Extraction from test doc produces prompts
- [ ] Extracted prompts have correct provenance
