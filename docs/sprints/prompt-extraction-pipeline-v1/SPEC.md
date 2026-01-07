# Sprint: prompt-extraction-pipeline-v1

**Version:** 1.0  
**Date:** January 5, 2026  
**Author:** Jim Calhoun + Claude  
**Status:** Draft  
**Domain Contract:** Bedrock Sprint Contract v1.0

---

## The Thesis

> *"It is very easy to pour 10,000 bowls of plain oatmeal, with each oat being in a different position and each bowl essentially unique, but it is very hard to make these differences matter to an audience."*  
> — Emily Short

The extraction pipeline is not a content mill. It's a gardening system.

Grove has extensive documentation — white papers, deep dives, research notes, advisory council analyses. These documents contain concepts that should become kinetic highlights. But extraction without curation produces oatmeal. The goal is to grow a garden of prompts that feel *salient* — each one earning its place by connecting the user's curiosity to multiple aspects of Grove's world model.

---

## Architectural Position

### What We're Building

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROMPT LIFECYCLE                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                               │
│  │   Authored   │  Hand-crafted seed prompts                    │
│  │   (JSON)     │  source: 'library'                            │
│  └──────────────┘  25 prompts, high quality                     │
│         │                                                        │
│         │ Strangler fig: remains canonical                       │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │  Extracted   │  AI-generated candidates     ◄── THIS SPRINT  │
│  │  (Data Layer)│  source: 'extracted'                          │
│  └──────────────┘  Awaiting review                              │
│         │                                                        │
│         │ Human review in Prompt Workshop                        │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │   Curated    │  Approved by gardener                         │
│  │  (Data Layer)│  source: 'curated'                            │
│  └──────────────┘  Full CRUD, organic growth                    │
│         │                                                        │
│         │ Usage telemetry feeds back                             │
│         ▼                                                        │
│  ┌──────────────┐                                               │
│  │   Insights   │  What resonates → better extraction           │
│  └──────────────┘                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Why Not Push Approved Prompts Back to JSON?

The JSON files contain **seed prompts** — hand-authored, version-controlled, shipped with the app. This is the Foundation's direct contribution.

The data layer contains **grown prompts** — extracted, reviewed, curated through usage. This is the system learning to sustain itself.

**"Foundation becomes obsolete"** means the extraction pipeline should eventually produce better prompts than we author manually. When that happens, the JSON files become bootstrap scaffolding, not ongoing maintenance burden.

---

## DEX Compliance Matrix

| Principle | Implementation |
|-----------|----------------|
| **Declarative Sovereignty** | Extraction rules are configuration, not code. Source documents, extraction criteria, and review thresholds live in declarative schemas. |
| **Capability Agnosticism** | Extraction works with any LLM capable of structured output. Default: Claude API. Fallback: Gemini. Future: local models when capable. |
| **Provenance as Infrastructure** | Every extracted prompt tracks: source document, extraction timestamp, model used, reviewer, approval timestamp, modification history. |
| **Organic Scalability** | System grows through usage. No deployment required to add prompts. New documents automatically become extraction candidates. |

---

## Advisory Council Alignment

### Park (Weight 10) — Technical Feasibility

> *"Extraction quality depends on LLM capability. This is a cloud operation."*

Extraction requires sophisticated understanding of:
- What concepts in a document would confuse a newcomer
- What question a curious user would actually ask
- How to phrase guidance that helps without prescribing

**Decision:** Extraction uses cloud API (Claude), not local models. Quality gates quantity.

### Short (Weight 8) — Salience Over Volume

> *"Salience — how many aspects of the world model a piece of text reflects."*

A prompt for "distributed ownership" should connect to:
- Technical architecture (what's distributed)
- Economic model (why ownership matters)
- Philosophy (alternative to Big Tech)
- Practical benefit (what you actually get)

**Decision:** Extraction prompt demands multi-dimensional salience. Single-dimension concepts are rejected.

### Adams (Weight 8) — Interesting Moments

> *"Drama emerges when different mechanics collide."*

Extracted prompts should lead to *interesting* responses, not just *accurate* ones. The execution prompt should create tension, curiosity, stakes.

**Decision:** Extraction prompt asks: "What would make someone lean forward when reading the response?"

### Asparouhova (Weight 7) — Sustainable Review

> *"Maintainer burnout is real."*

If review becomes a bottleneck, the pipeline fails. The workflow must be:
- Quick to triage (approve/reject in seconds)
- Easy to batch (review 10 at a time)
- Rewarding (see impact of your curation)

**Decision:** Review UI optimized for speed. Bulk actions. Clear quality signals.

---

## The Extraction Prompt

This is the core intellectual artifact. It must be crafted carefully.

```markdown
# Prompt Extraction Task

You are analyzing Grove documentation to identify concepts that should become kinetic highlights — clickable phrases that launch guided exploration.

## Source Document
{document_content}

## Your Task

Identify 3-5 concepts in this document that meet ALL of these criteria:

### 1. Confusion Point
A newcomer encountering this phrase would think: "Wait, what does that actually mean?" or "Why does that matter?"

### 2. Multi-Dimensional Salience  
The concept connects to multiple aspects of Grove's world model:
- Technical (architecture, implementation)
- Economic (value, incentives)
- Philosophical (why this approach)
- Practical (what you get)

A concept touching only ONE dimension is not salient enough.

### 3. Interesting Response Potential
Explaining this concept well would make someone lean forward. There's something surprising, counterintuitive, or stakes-laden about it.

### 4. Not Already Covered
Check the existing highlight triggers: {existing_triggers}
Don't extract concepts already covered.

## Output Format

For each concept, provide:

```json
{
  "concept": "the exact phrase as it appears in the document",
  "whyConfusing": "what makes this unclear to a newcomer",
  "dimensions": ["technical", "economic", "philosophical", "practical"],
  "interestingBecause": "what makes the explanation compelling",
  "userQuestion": "the question a curious user would actually ask — written in first person, slightly confused, genuinely curious",
  "systemGuidance": "instructions for the LLM responding — what to emphasize, what to avoid, how to connect to the user's concern"
}
```

## Quality Bar

Reject concepts that are:
- Jargon without substance (impressive-sounding but shallow)
- Too narrow (only interesting to specialists)
- Too broad (requires a dissertation to explain)
- Already well-understood (not actually confusing)

Better to extract 2 excellent concepts than 5 mediocre ones.
```

---

## Data Model

### Extracted Prompt (before review)

```typescript
interface ExtractedPromptCandidate {
  // Standard GroveObject fields
  meta: {
    id: string;
    type: 'prompt';
    title: string;
    description: string;
    status: 'pending_review';
    createdAt: string;
    updatedAt: string;
    tags: ['extracted', 'pending'];
  };
  
  payload: {
    // Core prompt fields
    executionPrompt: string;      // The user's question
    systemContext: string;        // Guidance for LLM
    
    // Extraction metadata
    source: 'extracted';
    provenance: {
      type: 'extracted';
      sourceDocument: string;     // Document ID or path
      sourceSnippet: string;      // The passage containing the concept
      extractedBy: string;        // Model used (e.g., 'claude-3-opus')
      extractedAt: string;        // ISO timestamp
      extractionBatch: string;    // Batch ID for grouping
      reviewStatus: 'pending' | 'approved' | 'rejected' | 'edited';
      reviewedBy?: string;
      reviewedAt?: string;
      reviewNotes?: string;
    };
    
    // Highlight configuration
    surfaces: ['highlight', 'suggestion'];
    highlightTriggers: HighlightTrigger[];
    
    // Scoring metadata (for review UI)
    extractionConfidence: number;  // 0-1, model's self-assessed confidence
    salienceDimensions: string[];  // Which dimensions it touches
    interestingBecause: string;    // Why this is worth exploring
    
    // Standard prompt fields
    topicAffinities: TopicAffinity[];
    lensAffinities: LensAffinity[];
    targeting: PromptTargeting;
    baseWeight: number;
    stats: PromptStats;
  };
}
```

### Curated Prompt (after approval)

Same structure, but:
- `status: 'active'`
- `source: 'curated'`
- `provenance.reviewStatus: 'approved'`
- Full edit history preserved

---

## User Stories

### Epic 1: Extraction Engine

**Story 1.1:** Extract from single document
```
Given a Grove document (markdown, docx, or PDF)
When I trigger extraction
Then the system produces 3-5 PromptObject candidates
And each candidate has full provenance tracking
And candidates are stored in data layer with source: 'extracted'
```

**Story 1.2:** Batch extraction from document set
```
Given a folder of Grove documents
When I trigger batch extraction
Then each document is processed sequentially
And candidates are grouped by extractionBatch
And progress is reported to UI
```

**Story 1.3:** De-duplication against existing prompts
```
Given existing library + curated prompts
When extraction runs
Then concepts with matching highlightTriggers are skipped
And near-matches are flagged for human review
```

### Epic 2: Review Workflow

**Story 2.1:** Review queue in Prompt Workshop
```
Given extracted prompts with status: 'pending_review'
When I open Prompt Workshop
Then I see a "Review Queue" section
And prompts are sorted by extraction confidence
And I can filter by source document or batch
```

**Story 2.2:** Quick triage actions
```
Given a prompt in review queue
When I click "Approve"
Then source changes to 'curated'
And status changes to 'active'
And it appears in kinetic highlights immediately

When I click "Reject"
Then provenance.reviewStatus changes to 'rejected'
And prompt is hidden from queue (but retained for learning)

When I click "Edit"
Then prompt opens in editor
And I can modify executionPrompt, systemContext, triggers
And changes are tracked in provenance
```

**Story 2.3:** Bulk review
```
Given multiple prompts selected
When I click "Approve Selected"
Then all selected prompts are approved in one action
```

### Epic 3: Extraction UI

**Story 3.1:** Trigger extraction from Prompt Workshop
```
Given Prompt Workshop open
When I click "Extract from Documents"
Then a modal opens with document selection
And I can choose: single document, folder, or "all RAG sources"
And extraction runs with progress indicator
```

**Story 3.2:** Extraction preview
```
Given extraction complete
When results are ready
Then I see candidates with confidence scores
And I can preview each before committing to review queue
And I can discard low-quality candidates before saving
```

---

## Technical Design

### Extraction Service

```typescript
// src/services/extraction/promptExtractor.ts

import { generateStructuredOutput } from '@core/llm/client';
import type { ExtractedPromptCandidate } from '@core/context-fields/types';

interface ExtractionConfig {
  model: 'claude-3-opus' | 'claude-3-sonnet' | 'gemini-pro';
  maxConcepts: number;
  confidenceThreshold: number;
  existingTriggers: string[];
}

export async function extractPromptsFromDocument(
  document: { content: string; id: string; title: string },
  config: ExtractionConfig
): Promise<ExtractedPromptCandidate[]> {
  
  const prompt = buildExtractionPrompt(document.content, config.existingTriggers);
  
  const response = await generateStructuredOutput({
    model: config.model,
    prompt,
    schema: extractionOutputSchema,
  });
  
  return response.concepts
    .filter(c => c.confidence >= config.confidenceThreshold)
    .map(concept => transformToPromptCandidate(concept, document));
}

function transformToPromptCandidate(
  concept: ExtractedConcept,
  source: { id: string; title: string }
): ExtractedPromptCandidate {
  return {
    meta: {
      id: generateUUID(),
      type: 'prompt',
      title: concept.concept,
      description: `Extracted from: ${source.title}`,
      status: 'pending_review',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: ['extracted', 'pending'],
    },
    payload: {
      executionPrompt: concept.userQuestion,
      systemContext: concept.systemGuidance,
      source: 'extracted',
      provenance: {
        type: 'extracted',
        sourceDocument: source.id,
        sourceSnippet: concept.sourcePassage,
        extractedBy: 'claude-3-opus',
        extractedAt: new Date().toISOString(),
        extractionBatch: generateBatchId(),
        reviewStatus: 'pending',
      },
      surfaces: ['highlight', 'suggestion'],
      highlightTriggers: [
        { text: concept.concept, matchMode: 'contains' }
      ],
      extractionConfidence: concept.confidence,
      salienceDimensions: concept.dimensions,
      interestingBecause: concept.interestingBecause,
      // ... standard prompt fields with defaults
    },
  };
}
```

### Integration with usePromptData

```typescript
// Update to src/bedrock/consoles/PromptWorkshop/usePromptData.ts

const mergedObjects = useMemo(() => {
  // Library prompts (JSON) - read only
  const libraryIds = new Set(libraryObjects.map(p => p.meta.id));
  
  // User/extracted/curated prompts from data layer
  const dataLayerPrompts = groveData.objects.filter(p => 
    p.payload.source === 'user' || 
    p.payload.source === 'extracted' ||
    p.payload.source === 'curated'
  );
  
  return [...libraryObjects, ...dataLayerPrompts];
}, [libraryObjects, groveData.objects]);

// Add review queue accessor
const reviewQueue = useMemo(() => {
  return mergedObjects.filter(p => 
    p.payload.source === 'extracted' && 
    p.payload.provenance?.reviewStatus === 'pending'
  );
}, [mergedObjects]);
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/services/extraction/promptExtractor.ts` | Create | Core extraction logic |
| `src/services/extraction/extractionPrompt.ts` | Create | The extraction prompt template |
| `src/services/extraction/types.ts` | Create | Extraction-specific types |
| `src/bedrock/consoles/PromptWorkshop/ReviewQueue.tsx` | Create | Review queue UI component |
| `src/bedrock/consoles/PromptWorkshop/ExtractionModal.tsx` | Create | Trigger extraction UI |
| `src/bedrock/consoles/PromptWorkshop/usePromptData.ts` | Modify | Add review queue accessor |
| `src/core/context-fields/types.ts` | Modify | Add extraction provenance fields |

---

## Build Gates

```bash
# After Epic 1
npm run build
npm test
# Manual: Extract from test document, verify candidate quality

# After Epic 2  
npm run build
npm test
# Manual: Review workflow, approve/reject prompts

# After Epic 3
npm run build
npx playwright test
# E2E: Full extraction → review → curated flow
```

---

## Success Criteria

1. ✅ Extract 3-5 quality prompt candidates from any Grove document
2. ✅ Candidates have full provenance tracking to source
3. ✅ Review queue surfaces pending extractions in Workshop
4. ✅ Approve/reject/edit workflow works smoothly
5. ✅ Approved prompts appear as kinetic highlights immediately
6. ✅ No changes to library prompts (strangler fig maintained)
7. ✅ Extraction runs via cloud API with graceful error handling

---

## Out of Scope

- Automatic approval (human review required for v1)
- Local model extraction (cloud only for quality)
- Extraction from non-text sources (video, audio)
- Feedback loop from telemetry to extraction rules (future sprint)

---

## The Recursion Closes

When this sprint ships:

1. You write a document about Grove
2. The extraction pipeline identifies concepts worth highlighting
3. A gardener reviews and approves
4. Users click those highlights and learn
5. Their engagement tells you what resonates
6. You write better documents
7. → Loop back to step 1

The system teaches itself what to teach.

---

*"Hand-craft 6 seed prompts → extraction pipeline generates candidates → human review gates quality → library grows organically."*

This is organic scalability. This is how the Foundation becomes obsolete.
