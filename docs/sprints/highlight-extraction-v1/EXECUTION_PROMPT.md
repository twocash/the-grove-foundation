# Execution Prompt — highlight-extraction-v1

## Context

This sprint extends the extraction pipeline to auto-generate backing prompts for kinetic highlights. The system will detect Grove-specific concepts in documents and generate rich backing prompts that guide exploration when users click highlighted terms.

**Recursive validation:** This sprint closes the loop — Grove documentation teaches the system to guide exploration of Grove concepts.

## Attention Anchoring Protocol

Before any major decision, re-read:
1. SPEC.md Live Status block
2. SPEC.md Attention Anchor block

After every 10 tool calls:
- Check: Am I still pursuing the stated goal?
- If uncertain: Re-read SPEC.md Goals and Acceptance Criteria

Before committing:
- Verify: Does this change satisfy Acceptance Criteria?

## Documentation

Sprint documentation in `docs/sprints/highlight-extraction-v1/`:
- `REPO_AUDIT.md` — Current extraction pipeline state
- `SPEC.md` — Goals, acceptance criteria, DEX compliance
- `ARCHITECTURE.md` — System design, data structures
- `MIGRATION_MAP.md` — File-by-file changes with code
- `DECISIONS.md` — 10 ADRs including testing strategy
- `STORIES.md` — 5 epics, 30 story points

## Repository Intelligence

**Key locations:**
- Extraction pipeline: `src/core/extraction/`
- Context field types: `src/core/context-fields/types.ts`
- Prompt Workshop: `src/bedrock/consoles/PromptWorkshop/`
- Existing highlight prompts: `src/data/prompts/highlights.prompts.json`

**Dependencies:**
- kinetic-highlights-v1: COMPLETE ✅
- exploration-node-unification-v1: COMPLETE ✅

## DEX Compliance Rules

- NO hardcoded thresholds — use EXTRACTION_CONFIG
- Core concepts in JSON registry, not code
- Generation template is declarative
- NO new `handle*` callbacks for domain logic
- Test behavior, not implementation

---

## Execution Order

### Phase 1: Core Concept Registry (Epic 1)

#### Step 1.1: Create Extraction Config

```bash
# Create the extraction config file
cat > src/core/extraction/config.ts << 'EOF'
/**
 * Extraction configuration - DEX compliant
 * All thresholds are mutable without code changes
 * 
 * @sprint highlight-extraction-v1
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
EOF
```

#### Step 1.2: Create Core Concepts Registry

```bash
# Create directory if needed
mkdir -p src/data/concepts

# Create the core concepts registry
cat > src/data/concepts/groveCoreConcepts.json << 'EOF'
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
EOF
```

**Verify Phase 1:**
```bash
npm run build
node -e "console.log(require('./src/data/concepts/groveCoreConcepts.json').concepts.length + ' concepts loaded')"
```

---

### Phase 2: Concept Detection (Epic 2)

#### Step 2.1: Create Concept Detection Module

Create `src/core/extraction/conceptDetection.ts`:

```typescript
/**
 * Concept detection for highlight extraction
 * @sprint highlight-extraction-v1
 */
import { EXTRACTION_CONFIG } from './config';
import type { HighlightTrigger } from '@core/context-fields/types';

// Type for core concepts from registry
export interface CoreConcept {
  term: string;
  category: string;
  priority: number;
  definition: string;
}

// Type for detected concept
export interface DetectedConcept {
  term: string;
  frequency: number;
  semanticWeight: number;
  groveSpecificity: number;
  suggestedTriggers: HighlightTrigger[];
  confidence: number;
  contextExcerpt: string;
  definition: string;
}

// Import core concepts - adjust path as needed for your build setup
import coreConceptsData from '@data/concepts/groveCoreConcepts.json';

/**
 * Detect highlightable Grove concepts in a document
 */
export async function detectConcepts(
  documentText: string,
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
  
  for (const concept of coreConcepts) {
    const termLower = concept.term.toLowerCase();
    const textLower = documentText.toLowerCase();
    
    // Count frequency with word boundary awareness
    const regex = new RegExp(
      `\\b${termLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
      'gi'
    );
    const matches = documentText.match(regex) || [];
    const frequency = matches.length;
    
    if (frequency === 0) continue;
    
    // Calculate confidence score
    const groveSpecificity = 1.0; // In registry = Grove-specific
    const priorityBoost = concept.priority === 1 ? 0.1 : 0;
    const frequencyScore = Math.min(frequency / 5, 1.0) * 0.3;
    
    const confidence = Math.min(
      groveSpecificity * 0.5 + frequencyScore + priorityBoost + config.coreConceptBoost,
      1.0
    );
    
    if (confidence < minConfidence) continue;
    
    // Extract context excerpt around first occurrence
    const firstMatch = textLower.indexOf(termLower);
    const excerptStart = Math.max(0, firstMatch - 150);
    const excerptEnd = Math.min(documentText.length, firstMatch + concept.term.length + 150);
    let contextExcerpt = documentText.slice(excerptStart, excerptEnd);
    
    // Clean up excerpt
    if (excerptStart > 0) contextExcerpt = '...' + contextExcerpt;
    if (excerptEnd < documentText.length) contextExcerpt = contextExcerpt + '...';
    
    detectedConcepts.push({
      term: concept.term,
      frequency,
      semanticWeight: 0.8, // Placeholder for embedding-based scoring
      groveSpecificity,
      suggestedTriggers: [
        { text: concept.term, matchMode: 'exact' as const }
      ],
      confidence,
      contextExcerpt,
      definition: concept.definition,
    });
  }
  
  // Sort by confidence descending, limit results
  return detectedConcepts
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, maxConcepts);
}

/**
 * Get core concept by term
 */
export function getCoreConceptDefinition(term: string): string | undefined {
  const concept = coreConceptsData.concepts.find(
    (c: CoreConcept) => c.term.toLowerCase() === term.toLowerCase()
  );
  return concept?.definition;
}
```

#### Step 2.2: Create Unit Tests

Create `tests/unit/conceptDetection.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { detectConcepts, getCoreConceptDefinition } from '@core/extraction/conceptDetection';

describe('detectConcepts', () => {
  const sampleText = `
    The Grove project implements distributed ownership of AI infrastructure.
    Using a hybrid architecture, agents can leverage local inference for routine
    tasks while accessing cloud APIs for pivotal moments. The credit economy
    ensures that distributed ownership benefits all participants.
  `;

  it('detects known Grove concepts', async () => {
    const concepts = await detectConcepts(sampleText);
    expect(concepts.length).toBeGreaterThan(0);
    
    const terms = concepts.map(c => c.term);
    expect(terms).toContain('distributed ownership');
    expect(terms).toContain('hybrid architecture');
  });

  it('returns empty array for text without concepts', async () => {
    const concepts = await detectConcepts('The weather is nice today.');
    expect(concepts).toEqual([]);
  });

  it('respects confidence threshold', async () => {
    const concepts = await detectConcepts(sampleText, { minConfidence: 0.9 });
    for (const concept of concepts) {
      expect(concept.confidence).toBeGreaterThanOrEqual(0.9);
    }
  });

  it('limits to maxConcepts', async () => {
    const concepts = await detectConcepts(sampleText, { maxConcepts: 2 });
    expect(concepts.length).toBeLessThanOrEqual(2);
  });

  it('includes context excerpt', async () => {
    const concepts = await detectConcepts(sampleText);
    for (const concept of concepts) {
      expect(concept.contextExcerpt).toBeTruthy();
      expect(concept.contextExcerpt.toLowerCase()).toContain(concept.term.toLowerCase());
    }
  });

  it('includes trigger suggestions', async () => {
    const concepts = await detectConcepts(sampleText);
    for (const concept of concepts) {
      expect(concept.suggestedTriggers.length).toBeGreaterThan(0);
      expect(concept.suggestedTriggers[0].matchMode).toBe('exact');
    }
  });
});

describe('getCoreConceptDefinition', () => {
  it('returns definition for known concept', () => {
    const def = getCoreConceptDefinition('distributed ownership');
    expect(def).toBeTruthy();
    expect(def).toContain('distributed');
  });

  it('returns undefined for unknown concept', () => {
    const def = getCoreConceptDefinition('unknown concept xyz');
    expect(def).toBeUndefined();
  });
});
```

**Verify Phase 2:**
```bash
npm test -- conceptDetection
```

---

### Phase 3: Prompt Generation (Epic 3)

#### Step 3.1: Create Prompt Generator

Create `src/core/extraction/highlightPromptGenerator.ts`:

```typescript
/**
 * Highlight prompt generation using LLM
 * @sprint highlight-extraction-v1
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { DetectedConcept } from './conceptDetection';
import type { PromptObject, PromptProvenance } from '@core/context-fields/types';
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

BAD EXAMPLES (too generic):
- "Tell me about {{concept}}."
- "What is {{concept}}?"
- "Explain {{concept}} to me."

GOOD EXAMPLE:
"I keep seeing '{{concept}}' and it sounds important, but I'm not sure what it actually means in practice. What would this look like for someone like me?"

Respond with valid JSON only (no markdown, no code fences):
{
  "executionPrompt": "The user's curious thought when clicking...",
  "systemContext": "User clicked '{{concept}}' in kinetic text. [Guidance for LLM on how to answer - mention key points to cover, tone to use, common misconceptions to address]"
}
`;

/**
 * Generate a backing prompt for a detected concept
 */
export async function generateHighlightPrompt(
  concept: DetectedConcept,
  documentContext: {
    docId: string;
    docTitle: string;
  },
  apiKey: string
): Promise<PromptObject> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ 
    model: EXTRACTION_CONFIG.highlight.model,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 500,
    }
  });
  
  const prompt = HIGHLIGHT_PROMPT_TEMPLATE
    .replace(/{{concept}}/g, concept.term)
    .replace(/{{excerpt}}/g, concept.contextExcerpt)
    .replace(/{{definition}}/g, concept.definition);
  
  const result = await model.generateContent(prompt);
  const responseText = result.response.text();
  
  // Parse JSON response, handling potential markdown fences
  const cleanJson = responseText
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
  
  const parsed = JSON.parse(cleanJson);
  
  // Build provenance
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
  
  // Generate unique ID
  const termSlug = concept.term.toLowerCase().replace(/\s+/g, '-');
  const timestamp = Date.now();
  
  return {
    id: `highlight-extracted-${termSlug}-${timestamp}`,
    objectType: 'prompt',
    created: timestamp,
    modified: timestamp,
    author: 'system',
    label: `What is ${concept.term}?`,
    description: `Auto-extracted backing prompt for '${concept.term}' from ${documentContext.docTitle}`,
    executionPrompt: parsed.executionPrompt,
    systemContext: parsed.systemContext,
    tags: ['highlight', 'extracted', termSlug],
    topicAffinities: [],
    lensAffinities: [{ lensId: 'base', weight: 1.0 }],
    targeting: { stages: ['exploration', 'synthesis'] },
    baseWeight: 60 + Math.round(concept.confidence * 20),
    stats: { 
      impressions: 0, 
      selections: 0, 
      completions: 0, 
      avgEntropyDelta: 0, 
      avgDwellAfter: 0 
    },
    status: 'active',
    source: 'generated',
    provenance,
    surfaces: ['highlight', 'suggestion'],
    highlightTriggers: concept.suggestedTriggers,
  };
}
```

#### Step 3.2: Add Unit Tests

Create `tests/unit/highlightGenerator.test.ts` with mocked API responses.

**Verify Phase 3:**
```bash
npm test -- highlightGenerator
```

---

### Phase 4: Merge Logic & Types (Epic 4)

#### Step 4.1: Create Trigger Merge Module

Create `src/core/extraction/triggerMerge.ts`:

```typescript
/**
 * Merge logic for highlight prompts with overlapping triggers
 * @sprint highlight-extraction-v1
 */
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
 * Merge new prompts with existing, handling duplicates by strategy
 * 
 * @param newPrompts - Newly extracted prompts
 * @param existingPrompts - Existing prompts in library
 * @param strategy - How to handle duplicates
 * @returns Merged array
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
        result[existingIndex] = newPrompt;
      } else if (strategy === 'favor-higher-confidence') {
        const existingConf = existing.provenance?.extractionConfidence ?? 0;
        const newConf = newPrompt.provenance?.extractionConfidence ?? 0;
        
        if (newConf > existingConf) {
          result[existingIndex] = newPrompt;
        }
      }
    }
  }
  
  return result;
}
```

#### Step 4.2: Update Types

Add to `src/core/context-fields/types.ts` in PromptProvenance interface:

```typescript
/**
 * Method used for extraction
 * @added highlight-extraction-v1
 */
extractionMethod?: 'general' | 'highlight-concept-detection';
```

**Verify Phase 4:**
```bash
npm run build
npm test -- triggerMerge
```

---

### Phase 5: Workshop UI (Epic 5)

#### Step 5.1: Add Surface Filter

Modify `src/bedrock/consoles/PromptWorkshop/PromptFilters.tsx` to add surface dropdown.

#### Step 5.2: Display Trigger Badges

Modify `src/bedrock/consoles/PromptWorkshop/PromptCard.tsx` to show highlightTriggers.

**Verify Phase 5:**
```bash
npm run build
npx playwright test prompt-workshop
```

---

## Final Verification

### Build Gate
```bash
npm run build && npm test && npx playwright test
```

### Acceptance Test

Run extraction on `Exploration_Architecture_Validates_Itself.md`:
- Should produce 5+ highlight prompts
- Each should have valid triggers
- Each should appear in Workshop with "extracted" badge

### Success Criteria Checklist
- [ ] `detectConcepts()` identifies Grove terms with confidence
- [ ] `generateHighlightPrompt()` produces Emily Short pattern prompts
- [ ] Extracted prompts have `extractionMethod: 'highlight-concept-detection'`
- [ ] Workshop shows surface filter
- [ ] Workshop displays trigger badges
- [ ] Confidence threshold (0.7) is in config, not hardcoded
- [ ] All tests pass

## Forbidden Actions

- Do NOT hardcode confidence threshold in detection function
- Do NOT test CSS classes or implementation details
- Do NOT create duplicate types (extend existing PromptObject)
- Do NOT bypass human review (all extracted = pending)

## Troubleshooting

### If concept detection finds nothing:
1. Check document contains Grove terminology
2. Verify core concepts registry loaded
3. Lower threshold temporarily to debug

### If generation fails:
1. Check API key is set
2. Verify Gemini model name is correct
3. Check JSON parsing in response

### If Workshop filter breaks:
1. Check filter state management
2. Verify surface field exists on prompts
3. Check filter logic includes undefined handling
