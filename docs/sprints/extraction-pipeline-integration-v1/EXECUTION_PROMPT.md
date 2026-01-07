# Execution Prompt: Extraction Pipeline Integration

**Sprint:** extraction-pipeline-integration-v1  
**Handoff Date:** January 6, 2026  
**Estimated Time:** 4-5 hours

---

## Context

You are implementing prompt extraction integration into Pipeline Monitor. The prototype sprint created manual extraction in Prompt Workshop (wrong location). This sprint moves extraction to where it belongs: the document processing pipeline.

**Key Changes:**
1. Delete ExtractionModal from Prompt Workshop
2. Add `extract-prompts` command to Pipeline Monitor Copilot
3. Enhance extraction prompt with stage classification and rich systemContext
4. Add bulk extraction capability
5. Create API endpoint

---

## Pre-Execution Verification

```bash
cd C:\GitHub\the-grove-foundation

# Verify clean state
git status

# Verify build works
npm run build

# Verify files exist
ls src/bedrock/consoles/PromptWorkshop/ExtractionModal.tsx
ls src/bedrock/consoles/PipelineMonitor/document-copilot.config.ts
ls src/services/extraction/extractionPrompt.ts
```

---

## Epic 1: Clean Up Prototype

### Task 1.1: Delete ExtractionModal

```bash
rm src/bedrock/consoles/PromptWorkshop/ExtractionModal.tsx
```

### Task 1.2: Update PromptWorkshopWithExtraction.tsx

Replace entire file with:

```typescript
// src/bedrock/consoles/PromptWorkshop/PromptWorkshopWithReview.tsx
// PromptWorkshop with Review Queue sidebar
// Sprint: extraction-pipeline-integration-v1 (moved extraction to Pipeline Monitor)

import React, { useState, useCallback } from 'react';
import { PromptWorkshop } from './index';
import { ReviewQueue } from './ReviewQueue';
import { usePromptData } from './usePromptData';
import { GlassButton } from '../../primitives/GlassButton';
import type { GroveObject } from '@core/schema/grove-object';
import type { PromptPayload } from '@core/schema/prompt';

/**
 * PromptWorkshop with Review Queue sidebar.
 * 
 * Extraction now happens in Pipeline Monitor. This wrapper provides:
 * - Review Queue sidebar for managing extracted prompts awaiting approval
 */
export function PromptWorkshopWithReview() {
  const [showReviewQueue, setShowReviewQueue] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const {
    reviewQueue,
    approveExtracted,
    rejectExtracted,
  } = usePromptData();

  const handleSelectReviewItem = useCallback((prompt: GroveObject<PromptPayload>) => {
    setSelectedId(prompt.meta.id);
  }, []);

  const pendingCount = reviewQueue.length;

  return (
    <div className="flex h-full">
      {/* Main Workshop Area */}
      <div className="flex-1 flex flex-col relative">
        {/* Review Queue Toggle */}
        {pendingCount > 0 && (
          <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--glass-border)] bg-[var(--glass-panel)]/30">
            <GlassButton
              variant={showReviewQueue ? 'primary' : 'secondary'}
              size="sm"
              icon="pending_actions"
              onClick={() => setShowReviewQueue(!showReviewQueue)}
            >
              Review Queue ({pendingCount})
            </GlassButton>

            <div className="text-xs text-[var(--glass-text-muted)]">
              <span className="material-symbols-outlined text-sm align-middle mr-1">info</span>
              Extracted prompts pending review
            </div>
          </div>
        )}

        {/* Original PromptWorkshop */}
        <div className="flex-1 overflow-hidden">
          <PromptWorkshop />
        </div>
      </div>

      {/* Review Queue Sidebar */}
      {showReviewQueue && pendingCount > 0 && (
        <div className="w-80 border-l border-[var(--glass-border)] bg-[var(--glass-solid)] flex flex-col">
          <ReviewQueue
            prompts={reviewQueue}
            onApprove={approveExtracted}
            onReject={rejectExtracted}
            onSelect={handleSelectReviewItem}
            selectedId={selectedId || undefined}
          />
        </div>
      )}
    </div>
  );
}

// Keep old export name for backwards compatibility
export const PromptWorkshopWithExtraction = PromptWorkshopWithReview;

export default PromptWorkshopWithReview;
```

Then rename the file:
```bash
mv src/bedrock/consoles/PromptWorkshop/PromptWorkshopWithExtraction.tsx src/bedrock/consoles/PromptWorkshop/PromptWorkshopWithReview.tsx
```

### Task 1.3: Update index.ts

In `src/bedrock/consoles/PromptWorkshop/index.ts`, replace the extraction exports section:

**Find:**
```typescript
// Sprint: prompt-extraction-pipeline-v1 - Review queue for extracted prompts
export { ReviewQueue } from './ReviewQueue';
export { ExtractionModal } from './ExtractionModal';
export { PromptWorkshopWithExtraction } from './PromptWorkshopWithExtraction';
```

**Replace with:**
```typescript
// Sprint: extraction-pipeline-integration-v1 - Review queue (extraction moved to Pipeline Monitor)
export { ReviewQueue } from './ReviewQueue';
export { PromptWorkshopWithReview, PromptWorkshopWithExtraction } from './PromptWorkshopWithReview';
```

### Build Gate
```bash
npm run build
npm run typecheck
```

---

## Epic 2: Pipeline Monitor Copilot Integration

### Task 2.1: Add Command Definition

In `src/bedrock/consoles/PipelineMonitor/document-copilot.config.ts`:

**Find the COMMANDS array and add this entry after 'find-related':**

```typescript
  // Prompt extraction (Sprint: extraction-pipeline-integration-v1)
  {
    id: 'extract-prompts',
    pattern: /^extract\s*prompts?$/i,
    description: 'Extract kinetic highlight prompts from document content',
    requiresDocument: true,
    handler: 'handleExtractPrompts',
    preview: true,
  },
```

**In buildDocumentCopilot function, add to quickActions array:**

```typescript
{ id: 'extract-prompts', label: 'Prompts', icon: 'auto_awesome', command: 'extract prompts' },
```

### Task 2.2: Add Document Tracking Fields

In `src/bedrock/consoles/PipelineMonitor/types.ts`:

**Find the Document interface and add these fields after `enrichment_model?`:**

```typescript
  // Prompt extraction tracking (Sprint: extraction-pipeline-integration-v1)
  promptsExtracted?: boolean;
  promptExtractionAt?: string;
  promptExtractionCount?: number;
```

### Task 2.3: Implement Handler

In `src/bedrock/consoles/PipelineMonitor/copilot-handlers.ts`:

**Add import at top:**
```typescript
import { extractPromptsFromDocument } from '@services/extraction';
```

**Add handler function before the dispatcher:**

```typescript
// =============================================================================
// Prompt Extraction Handler (Sprint: extraction-pipeline-integration-v1)
// =============================================================================

export async function handleExtractPrompts(
  ctx: HandlerContext
): Promise<CopilotResult> {
  try {
    if (!ctx.document.content) {
      return {
        preview: false,
        message: 'Document has no content to extract from.',
        error: 'No content',
      };
    }

    // Call extraction service
    const result = await extractPromptsFromDocument(
      ctx.document.id,
      ctx.document.title,
      ctx.document.content
    );

    if (result.concepts.length === 0) {
      return {
        preview: false,
        message: 'No suitable concepts found in this document. The extraction requires concepts with multi-dimensional salience.',
      };
    }

    // Preview mode - show what was extracted
    const summary = result.concepts.map(c => 
      `• **${c.concept}** (${c.targetStages.join(', ')}) - ${c.confidence.toFixed(2)} confidence`
    ).join('\n');

    if (ctx.onPreview) {
      ctx.onPreview({ extracted: result.concepts });
    }

    return {
      preview: true,
      data: result,
      message: `Extracted ${result.concepts.length} prompt candidates:\n\n${summary}\n\nApply to save as draft prompts?`,
    };
  } catch (error) {
    return {
      preview: false,
      message: `Extraction failed: ${(error as Error).message}`,
      error: (error as Error).message,
    };
  }
}
```

**In executeCommand switch statement, add case:**

```typescript
    case 'extract-prompts':
      return handleExtractPrompts(ctx);
```

### Build Gate
```bash
npm run build
npm run typecheck
```

---

## Epic 3: Enhanced Extraction Engine

### Task 3.1: Update Types

In `src/services/extraction/types.ts`, update the ExtractedConcept interface:

```typescript
// src/services/extraction/types.ts
// Types for prompt extraction pipeline
// Sprint: extraction-pipeline-integration-v1

import type { Stage } from '@core/context-fields/types';

/**
 * Valid topic categories for extraction mapping
 */
export const TOPIC_CATEGORIES = [
  'infrastructure',
  'architecture', 
  'economics',
  'ratchet-thesis',
  'vision',
  'community',
  'philosophy',
  'roles',
  'engagement',
] as const;

export type TopicCategory = typeof TOPIC_CATEGORIES[number];

/**
 * Extracted concept from document analysis
 */
export interface ExtractedConcept {
  // Identity
  concept: string;
  label: string;
  
  // Content
  executionPrompt: string;
  systemContext: string;
  
  // Targeting (NEW)
  targetStages: Stage[];
  stageReasoning: string;
  topicCategory: TopicCategory;
  
  // Quality metrics
  confidence: number;
  salienceDimensions: string[];
  interestingBecause: string;
  
  // Source tracking
  sourcePassage: string;
}

/**
 * Extraction result from a single document
 */
export interface ExtractionResult {
  documentId: string;
  documentTitle: string;
  concepts: ExtractedConcept[];
  extractedAt: string;
  model: string;
}

/**
 * Configuration for extraction
 */
export interface ExtractionConfig {
  confidenceThreshold?: number;
  maxConcepts?: number;
  stages?: Stage[];
}
```

### Task 3.2: Rewrite Extraction Prompt

Replace entire contents of `src/services/extraction/extractionPrompt.ts`:

```typescript
// src/services/extraction/extractionPrompt.ts
// The intellectual core of the extraction pipeline
// Sprint: extraction-pipeline-integration-v1

import { TOPIC_CATEGORIES } from './types';

export function buildExtractionPrompt(
  documentContent: string,
  documentTitle: string,
  existingTriggers: string[]
): string {
  const topicList = TOPIC_CATEGORIES.join(', ');
  
  return `# Kinetic Highlight Extraction Task

You are analyzing Grove documentation to identify concepts that should become **kinetic highlights** — clickable phrases that launch guided exploration.

## Source Document
**Title:** ${documentTitle}

${documentContent}

## Existing Triggers (Skip These)
${existingTriggers.length > 0 ? existingTriggers.join(', ') : 'None yet'}

---

## Stage Classification Guide

For each concept, determine which stage(s) the generated question is appropriate for:

### GENESIS (first encounter)
- User has never seen this term before
- Question form: "What is X?", "What does X mean?"
- User tone: Slightly lost, needs grounding
- Example: "I keep seeing 'distributed ownership' mentioned, but what does that actually mean?"

### EXPLORATION (understanding mechanics)
- User knows the term exists, wants to understand how it works
- Question form: "How does X work?", "Why does X matter?"
- User tone: Curious, building mental model
- Example: "How does the credit economy actually function? What happens when an agent earns credits?"

### SYNTHESIS (applying knowledge)
- User understands the concept, wants to use it
- Question form: "How do I implement X?", "How does X connect to Y?"
- User tone: Practical, integrating with their work
- Example: "How would I actually set up distributed ownership in my organization?"

### ADVOCACY (teaching others)
- User believes in the concept, wants to spread it
- Question form: "How do I explain X to skeptics?", "What's the pitch for X?"
- User tone: Champion, needs talking points
- Example: "How do I explain the efficiency tax to someone who thinks it sounds like socialism?"

Most prompts target 1-2 stages. Assign the stage(s) where the question form feels most natural.

---

## Topic Categories

Map each concept to ONE of these categories:
${topicList}

Choose the category that best captures the concept's primary domain.

---

## Your Task

Identify 3-5 concepts that meet ALL of these criteria:

### 1. Confusion Point
A newcomer encountering this phrase would think: "Wait, what does that actually mean?"

### 2. Multi-Dimensional Salience
The concept connects to multiple aspects:
- Technical (architecture, implementation)
- Economic (value, incentives)
- Philosophical (why this approach)
- Practical (what you get)

A concept touching only ONE dimension is not salient enough.

### 3. Interesting Response Potential
Explaining this concept would make someone lean forward. There's something surprising, counterintuitive, or stakes-laden.

### 4. Not Already Covered
Don't extract concepts matching existing triggers.

---

## Output Format

Respond with ONLY a JSON array. Each object must have these exact fields:

\`\`\`json
[
  {
    "concept": "the exact phrase as it appears in the document",
    "label": "Natural question form as display label",
    "executionPrompt": "I keep seeing 'X' mentioned, but I'm not sure what it actually means. [Continue in curious, slightly confused first-person voice. 2-3 sentences expressing genuine confusion and desire to understand.]",
    "systemContext": "User clicked the 'X' highlight. They are likely at [stage] in their journey. Focus on: [what to emphasize]. Avoid: [what to avoid]. Connect to their likely concern about: [practical worry]. Use concrete examples of: [specific examples]. Tone should be: [warm/technical/urgent as appropriate].",
    "targetStages": ["genesis", "exploration"],
    "stageReasoning": "Why these stages are appropriate for this question",
    "topicCategory": "one of the valid categories",
    "confidence": 0.85,
    "salienceDimensions": ["technical", "economic", "philosophical"],
    "interestingBecause": "What makes the explanation compelling",
    "sourcePassage": "The sentence or paragraph where this concept appears"
  }
]
\`\`\`

---

## systemContext Requirements

The systemContext field is CRITICAL. It guides the LLM that will answer the user's question. Include:

1. **User state**: What stage they're likely at, what they probably know/don't know
2. **What to emphasize**: The key insight that makes this concept click
3. **What to avoid**: Common misconceptions, tangents, or overwhelming detail
4. **Practical connection**: How this connects to their real concerns
5. **Concrete examples**: Specific examples to use in the explanation
6. **Tone guidance**: How warm/technical/urgent the response should be

Example systemContext:
"User clicked 'efficiency tax'. They're likely at exploration stage - they've heard the term but don't understand how it works. Emphasize: this is not a tax paid TO anyone, but a natural sharing of efficiency gains when innovations spread. Avoid: economic jargon, comparisons to government taxation. Connect to: their concern about whether they're 'losing' something. Use examples: open source software improvements that benefit everyone. Tone: warm, demystifying, practical."

---

## Quality Bar

REJECT concepts that are:
- Jargon without substance (impressive-sounding but shallow)
- Too narrow (only interesting to specialists)
- Too broad (requires a dissertation to explain)
- Already well-understood (not actually confusing)
- Single-dimension (only technical OR only philosophical)

Better to extract 2 excellent concepts than 5 mediocre ones. Return an empty array \`[]\` if nothing meets the bar.`;
}
```

### Task 3.3: Update Transformer

In `src/services/extraction/promptExtractor.ts`, update the transformToPromptCandidate function to use new fields:

```typescript
// src/services/extraction/promptExtractor.ts
// Extraction service for prompt generation
// Sprint: extraction-pipeline-integration-v1

import type { GroveObject } from '@core/schema/grove-object';
import type { PromptPayload } from '@core/schema/prompt';
import type { TopicAffinity, PromptProvenance } from '@core/context-fields/types';
import type { ExtractedConcept, ExtractionResult, ExtractionConfig } from './types';
import { buildExtractionPrompt } from './extractionPrompt';
import { generateId } from '@utils/id';

/**
 * Transform extracted concept to PromptObject
 */
export function transformToPromptCandidate(
  concept: ExtractedConcept,
  documentId: string,
  documentTitle: string,
  model: string
): GroveObject<PromptPayload> {
  const now = Date.now();
  const id = generateId('prompt');

  // Build topic affinities from category
  const topicAffinities: TopicAffinity[] = [
    { topicId: concept.topicCategory, weight: 1.0 },
  ];

  // Build provenance
  const provenance: PromptProvenance = {
    type: 'extracted',
    reviewStatus: 'pending',
    sourceDocIds: [documentId],
    sourceDocTitles: [documentTitle],
    extractedAt: now,
    extractionModel: model,
    extractionConfidence: concept.confidence,
  };

  return {
    meta: {
      id,
      type: 'prompt',
      created: now,
      modified: now,
      version: 1,
      status: 'draft',
      author: 'extraction-pipeline',
      title: concept.label,
      tags: ['extracted', 'pending-review', concept.topicCategory],
    },
    payload: {
      label: concept.label,
      description: `Extracted from: ${documentTitle}`,
      executionPrompt: concept.executionPrompt,
      systemContext: concept.systemContext,
      
      // Targeting from stage classification
      targeting: {
        stages: concept.targetStages,
      },
      
      // Topic mapping
      topicAffinities,
      
      // Default lens affinities (base lens)
      lensAffinities: [
        { lensId: 'base', weight: 1.0 },
      ],
      
      // Highlight configuration
      surfaces: ['highlight', 'suggestion'],
      highlightTriggers: [
        { text: concept.concept, matchMode: 'exact' },
        { text: concept.concept.toLowerCase(), matchMode: 'exact' },
      ],
      
      // Provenance
      provenance,
      
      // Default values
      baseWeight: 50,
      stats: {
        impressions: 0,
        selections: 0,
        completions: 0,
        avgEntropyDelta: 0,
        avgDwellAfter: 0,
      },
      source: 'extracted',
    },
  };
}

/**
 * Extract prompts from a document
 */
export async function extractPromptsFromDocument(
  documentId: string,
  documentTitle: string,
  documentContent: string,
  config: ExtractionConfig = {}
): Promise<ExtractionResult> {
  const { confidenceThreshold = 0.7, maxConcepts = 5 } = config;
  
  // Get existing triggers (would come from data layer in production)
  const existingTriggers: string[] = [];
  
  // Build prompt
  const prompt = buildExtractionPrompt(documentContent, documentTitle, existingTriggers);
  
  // Call LLM (implementation depends on your API setup)
  // For now, this is a placeholder - integrate with your actual LLM service
  const response = await callExtractionLLM(prompt);
  
  // Parse response
  let concepts: ExtractedConcept[] = [];
  try {
    const parsed = JSON.parse(response);
    if (Array.isArray(parsed)) {
      concepts = parsed.filter(c => c.confidence >= confidenceThreshold);
    }
  } catch (e) {
    console.error('Failed to parse extraction response:', e);
  }
  
  // Limit results
  concepts = concepts.slice(0, maxConcepts);
  
  return {
    documentId,
    documentTitle,
    concepts,
    extractedAt: new Date().toISOString(),
    model: 'claude-3-5-sonnet', // or whatever model you use
  };
}

/**
 * Placeholder for LLM call - implement based on your API setup
 */
async function callExtractionLLM(prompt: string): Promise<string> {
  // TODO: Integrate with your actual LLM service
  // This could be:
  // - Direct Anthropic API call
  // - Google Gemini API call
  // - Your backend API that proxies to LLM
  
  throw new Error('LLM integration not implemented - see server/api/knowledge/extract-prompts.ts');
}

export { buildExtractionPrompt } from './extractionPrompt';
export * from './types';
```

### Build Gate
```bash
npm run build
npm run typecheck
```

---

## Epic 4: Bulk Processing UI

### Task 4.1: Add Bulk Extraction to Toolbar

This task adds a dropdown button to Pipeline Monitor. The exact implementation depends on your current toolbar structure.

In `src/bedrock/consoles/PipelineMonitor/PipelineMonitorWithUpload.tsx`:

**Add state for bulk operations:**
```typescript
const [bulkExtracting, setBulkExtracting] = useState(false);
const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
```

**Add dropdown component to toolbar area:**
```typescript
<div className="flex items-center gap-2">
  <GlassDropdown
    trigger={
      <GlassButton variant="secondary" size="sm" icon="auto_awesome">
        Extract Prompts
      </GlassButton>
    }
  >
    <GlassDropdownItem 
      icon="check_box"
      onClick={() => handleBulkExtract('selected')}
      disabled={selectedDocIds.length === 0}
    >
      From selected ({selectedDocIds.length})
    </GlassDropdownItem>
    <GlassDropdownItem 
      icon="select_all"
      onClick={() => handleBulkExtract('all')}
    >
      From all documents
    </GlassDropdownItem>
    <GlassDropdownItem 
      icon="pending"
      onClick={() => handleBulkExtract('unprocessed')}
    >
      From unprocessed only
    </GlassDropdownItem>
  </GlassDropdown>
</div>
```

**Add handler:**
```typescript
const handleBulkExtract = async (mode: 'selected' | 'all' | 'unprocessed') => {
  setBulkExtracting(true);
  try {
    let docIds: string[];
    
    if (mode === 'selected') {
      docIds = selectedDocIds;
    } else if (mode === 'all') {
      docIds = documents.map(d => d.id);
    } else {
      docIds = documents.filter(d => !d.promptsExtracted).map(d => d.id);
    }
    
    const response = await fetch('/api/knowledge/extract-prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentIds: docIds }),
    });
    
    const result = await response.json();
    
    // Show results notification
    toast.success(`Extracted ${result.stats.promptsExtracted} prompts from ${result.stats.documentsProcessed} documents`);
    
    // Refresh document list to show updated extraction status
    refreshDocuments();
  } catch (error) {
    toast.error(`Extraction failed: ${error.message}`);
  } finally {
    setBulkExtracting(false);
  }
};
```

### Build Gate
```bash
npm run build
npm run typecheck
```

---

## Epic 5: API Endpoint

### Task 5.1: Create API Route

Create `server/api/knowledge/extract-prompts.ts`:

```typescript
// server/api/knowledge/extract-prompts.ts
// API endpoint for bulk prompt extraction
// Sprint: extraction-pipeline-integration-v1

import { defineEventHandler, readBody } from 'h3';
import { extractPromptsFromDocument, transformToPromptCandidate } from '@services/extraction';
import type { ExtractedConcept, ExtractionConfig } from '@services/extraction/types';

interface ExtractRequest {
  documentIds: string[];
  options?: ExtractionConfig & {
    regenerate?: boolean;
  };
}

interface ExtractResponse {
  prompts: any[]; // PromptObjects
  stats: {
    documentsProcessed: number;
    documentsSkipped: number;
    promptsExtracted: number;
    errors: Array<{ documentId: string; error: string }>;
  };
}

export default defineEventHandler(async (event): Promise<ExtractResponse> => {
  const body = await readBody<ExtractRequest>(event);
  const { documentIds, options = {} } = body;
  
  const stats = {
    documentsProcessed: 0,
    documentsSkipped: 0,
    promptsExtracted: 0,
    errors: [] as Array<{ documentId: string; error: string }>,
  };
  
  const allPrompts: any[] = [];
  
  // Process each document
  for (const docId of documentIds) {
    try {
      // Fetch document from database
      const doc = await fetchDocument(docId);
      
      if (!doc) {
        stats.errors.push({ documentId: docId, error: 'Document not found' });
        continue;
      }
      
      // Skip if already processed (unless regenerate)
      if (doc.promptsExtracted && !options.regenerate) {
        stats.documentsSkipped++;
        continue;
      }
      
      // Extract prompts
      const result = await extractPromptsFromDocument(
        doc.id,
        doc.title,
        doc.content || '',
        options
      );
      
      // Transform to PromptObjects and save
      for (const concept of result.concepts) {
        const promptObj = transformToPromptCandidate(
          concept,
          doc.id,
          doc.title,
          result.model
        );
        
        // Save to prompts data layer
        await savePrompt(promptObj);
        allPrompts.push(promptObj);
        stats.promptsExtracted++;
      }
      
      // Update document tracking
      await updateDocument(doc.id, {
        promptsExtracted: true,
        promptExtractionAt: new Date().toISOString(),
        promptExtractionCount: result.concepts.length,
      });
      
      stats.documentsProcessed++;
    } catch (error) {
      stats.errors.push({ 
        documentId: docId, 
        error: (error as Error).message 
      });
    }
  }
  
  return {
    prompts: allPrompts,
    stats,
  };
});

// Placeholder functions - implement based on your data layer
async function fetchDocument(id: string) {
  // TODO: Implement based on your database
  throw new Error('Not implemented');
}

async function savePrompt(prompt: any) {
  // TODO: Implement based on your prompts data layer
  throw new Error('Not implemented');
}

async function updateDocument(id: string, updates: any) {
  // TODO: Implement based on your database
  throw new Error('Not implemented');
}
```

### Build Gate
```bash
npm run build
npm run typecheck
```

---

## Final Verification

### Checklist

- [ ] Epic 1: Clean Up
  - [ ] ExtractionModal.tsx deleted
  - [ ] PromptWorkshopWithReview.tsx updated
  - [ ] index.ts exports cleaned up
  - [ ] Build passes

- [ ] Epic 2: Copilot Integration
  - [ ] extract-prompts command defined
  - [ ] Document tracking fields added
  - [ ] Handler implemented
  - [ ] Build passes

- [ ] Epic 3: Enhanced Extraction
  - [ ] Types updated with stages/topics
  - [ ] Extraction prompt rewritten
  - [ ] Transformer uses new fields
  - [ ] Build passes

- [ ] Epic 4: Bulk Processing
  - [ ] Dropdown added to toolbar
  - [ ] Multi-select works
  - [ ] Bulk handler calls API
  - [ ] Build passes

- [ ] Epic 5: API
  - [ ] Endpoint created
  - [ ] Document tracking updated
  - [ ] Build passes

### Manual Testing

1. Open Pipeline Monitor
2. Select a document
3. Type "extract prompts" in Copilot
4. Verify extraction preview shows stages and systemContext
5. Apply extraction
6. Open Prompt Workshop
7. Verify extracted prompts in Review Queue
8. Approve a prompt
9. Navigate to Terminal
10. Verify approved prompt works as kinetic highlight

### Commands
```bash
npm run build
npm run typecheck
npm test
npm run dev
# Then test in browser
```

---

## Notes for Execution Agent

1. **LLM Integration**: The `callExtractionLLM` function is a placeholder. Implement based on your existing LLM service integration (likely in server/ directory).

2. **Data Layer Integration**: The `fetchDocument`, `savePrompt`, and `updateDocument` functions in the API endpoint are placeholders. Implement based on your Supabase or other data layer.

3. **UI Components**: If `GlassDropdown` and `GlassDropdownItem` don't exist, you may need to create them or use an alternative dropdown implementation.

4. **Toast Notifications**: The bulk handler uses `toast.success/error`. Ensure you have a toast library imported.

5. **Type Imports**: Adjust import paths based on your actual project structure (the `@services`, `@core`, `@utils` aliases may differ).

---

**Sprint artifacts location:** `docs/sprints/extraction-pipeline-integration-v1/`

**After completion:** Update SPRINTS.md progress tracking and commit all changes.
