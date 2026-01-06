# Architecture — highlight-extraction-v1

## Overview

Extend the extraction pipeline with a two-phase process: (1) detect highlightable concepts in documents, (2) generate backing prompts for each concept. The architecture maintains DEX compliance by keeping concept definitions in JSON, generation templates declarative, and thresholds configurable.

## System Diagram

```
                                    ┌─────────────────────────┐
                                    │  groveCoreConcepts.json │
                                    │  (canonical registry)   │
                                    └───────────┬─────────────┘
                                                │
                                                ▼
┌──────────────┐     ┌─────────────────────────────────────────────────┐
│              │     │            CONCEPT DETECTION                     │
│  RAG Document│────▶│  detectConcepts(doc, coreConceptRegistry)        │
│              │     │                                                  │
└──────────────┘     │  1. Extract candidate terms (NLP/frequency)      │
                     │  2. Score Grove-specificity (registry match)     │
                     │  3. Score semantic weight (embedding similarity) │
                     │  4. Filter by confidence threshold (0.7)         │
                     │  5. Return ranked DetectedConcept[]              │
                     └───────────────────────┬─────────────────────────┘
                                             │
                                             ▼
                     ┌─────────────────────────────────────────────────┐
                     │            PROMPT GENERATION                     │
                     │  generateHighlightPrompts(concepts, docContext)  │
                     │                                                  │
                     │  For each concept:                               │
                     │  1. Build context from document excerpt          │
                     │  2. Apply Emily Short template                   │
                     │  3. Generate executionPrompt + systemContext     │
                     │  4. Populate highlightTriggers from term         │
                     │  5. Set surfaces: ['highlight', 'suggestion']    │
                     │  6. Attach provenance with extractionMethod      │
                     └───────────────────────┬─────────────────────────┘
                                             │
                                             ▼
                     ┌─────────────────────────────────────────────────┐
                     │            DEDUPLICATION                         │
                     │  mergeHighlightPrompts(newPrompts, existing)     │
                     │                                                  │
                     │  1. Check trigger overlap with existing prompts  │
                     │  2. If duplicate: keep newer, higher confidence  │
                     │  3. If variant: keep both (different contexts)   │
                     │  4. Return merged PromptObject[]                 │
                     └───────────────────────┬─────────────────────────┘
                                             │
                                             ▼
                     ┌─────────────────────────────────────────────────┐
                     │            REVIEW WORKFLOW                       │
                     │  Prompt Workshop (Exploration Nodes)             │
                     │                                                  │
                     │  - Filter by surface: 'highlight'                │
                     │  - Filter by provenance: 'extracted'             │
                     │  - Display highlightTriggers in detail view      │
                     │  - Approve/reject with bulk actions              │
                     └───────────────────────┬─────────────────────────┘
                                             │
                                             ▼
                     ┌─────────────────────────────────────────────────┐
                     │            LOOKUP INTEGRATION                    │
                     │  findPromptForHighlight() (existing)             │
                     │                                                  │
                     │  - Approved extracted prompts join library       │
                     │  - Lookup finds by trigger match                 │
                     │  - Higher confidence prompts rank first          │
                     └─────────────────────────────────────────────────┘
```

## DEX Stack Design

### Configuration Layer

All behavior-defining parameters live in declarative config:

```typescript
// src/core/extraction/config.ts
export const EXTRACTION_CONFIG = {
  highlight: {
    confidenceThreshold: 0.7,
    coreConceptBoost: 0.2,
    maxConceptsPerDoc: 15,
    minTermLength: 3,
  }
};
```

```json
// src/data/concepts/groveCoreConcepts.json
{
  "concepts": [
    { "term": "distributed ownership", "category": "infrastructure", "priority": 1 },
    { "term": "hybrid architecture", "category": "architecture", "priority": 1 },
    { "term": "credit economy", "category": "economics", "priority": 1 }
  ]
}
```

### Engine Layer

Pure functions that interpret config:

- `detectConcepts()` — Reads registry, applies thresholds
- `generateHighlightPrompt()` — Applies template to concept
- `mergeHighlightPrompts()` — Deduplicates by trigger overlap

### Behavior Layer

User-visible outcomes:

- Extracted prompts appear in Workshop with "extracted" badge
- Approving prompt makes it available for highlight lookup
- Clicking highlight uses extracted backing prompt

## Data Structures

### DetectedConcept

```typescript
/**
 * A concept detected in a document for potential highlight backing
 */
interface DetectedConcept {
  /** The term as it appears in the document */
  term: string;
  
  /** How often the term appears */
  frequency: number;
  
  /** Semantic similarity to Grove core concepts (0-1) */
  semanticWeight: number;
  
  /** Is this a Grove-specific term? (registry match) */
  groveSpecificity: number;
  
  /** Suggested triggers for this concept */
  suggestedTriggers: HighlightTrigger[];
  
  /** Overall confidence score (0-1) */
  confidence: number;
  
  /** Document excerpt providing context */
  contextExcerpt: string;
}
```

### Extended PromptProvenance

```typescript
interface PromptProvenance {
  // ... existing fields ...
  
  /** 
   * Method used for extraction
   * @added highlight-extraction-v1
   */
  extractionMethod?: 'general' | 'highlight-concept-detection';
}
```

### HighlightExtractionResult

```typescript
/**
 * Result of highlight extraction from a document
 */
interface HighlightExtractionResult {
  /** Document that was processed */
  sourceDocId: string;
  sourceDocTitle: string;
  
  /** Concepts detected */
  conceptsDetected: number;
  conceptsAboveThreshold: number;
  
  /** Prompts generated */
  promptsGenerated: PromptObject[];
  
  /** Prompts merged/deduplicated */
  promptsMerged: number;
  
  /** Processing metadata */
  processingTimeMs: number;
  extractionModel: string;
}
```

## File Organization

```
src/
├── core/
│   └── extraction/
│       ├── config.ts                    # EXTRACTION_CONFIG (new)
│       ├── conceptDetection.ts          # detectConcepts() (new)
│       ├── highlightPromptGenerator.ts  # generateHighlightPrompt() (new)
│       ├── triggerMerge.ts              # mergeHighlightPrompts() (new)
│       └── documentExtractor.ts         # (modify) integrate highlight extraction
│
├── data/
│   └── concepts/
│       └── groveCoreConcepts.json       # Core concepts registry (new)
│
├── bedrock/
│   └── consoles/
│       └── PromptWorkshop/
│           ├── PromptCard.tsx           # (modify) show triggers
│           ├── PromptFilters.tsx        # (modify) add surface filter
│           └── PromptDetailView.tsx     # (modify) trigger display
│
└── tests/
    ├── unit/
    │   ├── conceptDetection.test.ts     # (new)
    │   └── highlightGenerator.test.ts   # (new)
    └── e2e/
        └── prompt-workshop.spec.ts      # (modify) surface filter tests
```

## API Contracts

### detectConcepts()

```typescript
/**
 * Detect highlightable concepts in a document
 */
async function detectConcepts(
  document: RAGDocument,
  options?: {
    coreConceptRegistry?: CoreConcept[];
    minConfidence?: number;
    maxConcepts?: number;
  }
): Promise<DetectedConcept[]>;
```

### generateHighlightPrompt()

```typescript
/**
 * Generate a backing prompt for a detected concept
 */
async function generateHighlightPrompt(
  concept: DetectedConcept,
  documentContext: {
    docId: string;
    docTitle: string;
    fullText: string;
  },
  options?: {
    model?: string;
  }
): Promise<PromptObject>;
```

### mergeHighlightPrompts()

```typescript
/**
 * Merge new prompts with existing, handling duplicates
 */
function mergeHighlightPrompts(
  newPrompts: PromptObject[],
  existingPrompts: PromptObject[],
  strategy: 'favor-newer' | 'favor-higher-confidence' | 'keep-all'
): PromptObject[];
```

## Emily Short Template

The generation prompt follows the context → confusion → question pattern:

```typescript
const HIGHLIGHT_PROMPT_TEMPLATE = `
You are generating a backing prompt for a clickable concept in educational content about Grove, a distributed AI infrastructure project.

CONCEPT: {{concept}}
DOCUMENT EXCERPT: {{excerpt}}
GROVE CONTEXT: {{groveDefinition}}

Generate a prompt that a curious user might think when clicking this term. The prompt should:

1. Acknowledge they clicked this specific term (but don't say "I clicked on...")
2. Express genuine curiosity or confusion about what it means
3. Ask a specific question the document context can answer
4. Use conversational first-person voice
5. Be 2-4 sentences maximum

BAD: "Tell me about distributed ownership."
BAD: "What is distributed ownership?"
GOOD: "I keep seeing 'distributed ownership' and it sounds important, but I'm not sure what's actually being distributed. Is it the AI models? The servers? Help me understand what I'd actually own."

Respond with JSON only:
{
  "executionPrompt": "...",
  "systemContext": "User clicked '{{concept}}' in kinetic text. [Guidance for LLM on how to answer]",
  "suggestedTriggers": [
    { "text": "{{concept}}", "matchMode": "exact" }
  ]
}
`;
```

## Test Architecture

### Test Categories

| Category | Location | Purpose |
|----------|----------|---------|
| Unit | `tests/unit/` | Concept detection, prompt generation |
| Integration | `tests/integration/` | Full extraction pipeline |
| E2E | `tests/e2e/` | Workshop UI with surface filters |

### Behavior Tests Needed

| User Action | Expected Outcome | Test File |
|-------------|------------------|-----------|
| Extract from doc | Prompts generated with triggers | `highlightExtraction.test.ts` |
| Filter by surface | Only highlight prompts shown | `prompt-workshop.spec.ts` |
| View prompt detail | Triggers displayed | `prompt-workshop.spec.ts` |
| Approve extracted prompt | Available in lookup | `highlightExtraction.test.ts` |

## Integration Points

### With Existing Extraction Pipeline

```typescript
// documentExtractor.ts
export async function extractPromptsFromDocument(doc: RAGDocument): Promise<PromptObject[]> {
  // Existing extraction...
  const generalPrompts = await extractGeneralPrompts(doc);
  
  // NEW: Highlight extraction
  const concepts = await detectConcepts(doc);
  const highlightPrompts = await Promise.all(
    concepts.map(c => generateHighlightPrompt(c, doc))
  );
  
  // Merge and deduplicate
  return mergeHighlightPrompts(highlightPrompts, generalPrompts, 'favor-newer');
}
```

### With Lookup Function

No changes needed — `findPromptForHighlight()` already queries the prompt library. Extracted prompts with `reviewStatus: 'approved'` automatically become available.

### With Prompt Workshop

Add surface filter alongside existing provenance filter. Display `highlightTriggers` in detail view using existing component patterns.
