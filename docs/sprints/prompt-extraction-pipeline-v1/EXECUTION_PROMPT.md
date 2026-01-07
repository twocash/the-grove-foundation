# Execution Prompt: prompt-extraction-pipeline-v1

**Sprint:** prompt-extraction-pipeline-v1  
**Target:** Claude CLI / Agentic Execution  
**Repository:** C:\GitHub\the-grove-foundation  
**Branch:** Create `feature/prompt-extraction-pipeline-v1`

---

## Context

You are implementing Layer 3 of Grove's exploration architecture: extracting PromptObjects from documentation. This transforms Grove's written content into guided exploration experiences.

### The Core Insight

Grove has ~50 documents explaining concepts like "distributed ownership," "efficiency tax," "Ratchet thesis." Users encounter these terms and wonder what they mean. The extraction pipeline identifies these confusion points and generates prompts that guide understanding.

### Files to Read First

```bash
# Understand existing prompt system
cat src/core/context-fields/types.ts              # PromptObject type
cat src/data/prompts/highlights.prompts.json      # Example prompts (first 100 lines)
cat src/bedrock/consoles/PromptWorkshop/usePromptData.ts  # Data hook

# Understand LLM integration patterns
ls src/services/                                   # Existing service patterns
cat src/core/llm/                                  # If exists, LLM client patterns
```

---

## Epic 1: Extraction Service

### Story 1.1: Create extraction types

**File:** `src/services/extraction/types.ts`

```typescript
// src/services/extraction/types.ts
// Prompt extraction pipeline types

export interface ExtractedConcept {
  concept: string;
  whyConfusing: string;
  dimensions: ('technical' | 'economic' | 'philosophical' | 'practical')[];
  interestingBecause: string;
  userQuestion: string;
  systemGuidance: string;
  sourcePassage: string;
  confidence: number;
}

export interface ExtractionConfig {
  model: 'claude-3-opus' | 'claude-3-sonnet' | 'gemini-pro';
  maxConcepts: number;
  confidenceThreshold: number;
  existingTriggers: string[];
}

export interface ExtractionResult {
  documentId: string;
  documentTitle: string;
  concepts: ExtractedConcept[];
  extractedAt: string;
  model: string;
  batchId: string;
}

export interface ExtractionProvenance {
  type: 'extracted';
  sourceDocument: string;
  sourceSnippet: string;
  extractedBy: string;
  extractedAt: string;
  extractionBatch: string;
  reviewStatus: 'pending' | 'approved' | 'rejected' | 'edited';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}
```

### Story 1.2: Create extraction prompt template

**File:** `src/services/extraction/extractionPrompt.ts`

```typescript
// src/services/extraction/extractionPrompt.ts
// The intellectual core of the extraction pipeline

export function buildExtractionPrompt(
  documentContent: string,
  existingTriggers: string[]
): string {
  return `# Prompt Extraction Task

You are analyzing Grove documentation to identify concepts that should become kinetic highlights — clickable phrases that launch guided exploration.

## Source Document

${documentContent}

## Existing Triggers (Skip These)

${existingTriggers.length > 0 ? existingTriggers.join(', ') : 'None yet'}

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
Don't extract concepts that match existing triggers listed above.

## Output Format

Respond with a JSON array. Each object must have these exact fields:

\`\`\`json
[
  {
    "concept": "the exact phrase as it appears",
    "whyConfusing": "what makes this unclear to a newcomer",
    "dimensions": ["technical", "economic"],
    "interestingBecause": "what makes the explanation compelling",
    "userQuestion": "I keep seeing 'X' mentioned, but I'm not sure what it actually means. [continue in curious, slightly confused first-person voice]",
    "systemGuidance": "User clicked 'X' highlight. [specific guidance for LLM: what to emphasize, what to avoid, how to connect to user's concern]",
    "sourcePassage": "the sentence or paragraph where this concept appears",
    "confidence": 0.85
  }
]
\`\`\`

## Quality Bar

Reject concepts that are:
- Jargon without substance (impressive-sounding but shallow)
- Too narrow (only interesting to specialists)
- Too broad (requires a dissertation to explain)
- Already well-understood (not actually confusing)

Better to extract 2 excellent concepts than 5 mediocre ones. Return an empty array if nothing meets the bar.`;
}
```

### Story 1.3: Create extraction service

**File:** `src/services/extraction/promptExtractor.ts`

```typescript
// src/services/extraction/promptExtractor.ts
// Core extraction logic

import { buildExtractionPrompt } from './extractionPrompt';
import type { 
  ExtractedConcept, 
  ExtractionConfig, 
  ExtractionResult,
  ExtractionProvenance 
} from './types';
import type { GroveObject, PromptPayload } from '@core/context-fields/types';

// Generate unique IDs
function generateUUID(): string {
  return crypto.randomUUID();
}

function generateBatchId(): string {
  return `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export async function extractPromptsFromDocument(
  document: { content: string; id: string; title: string },
  config: ExtractionConfig,
  apiKey: string
): Promise<ExtractionResult> {
  const prompt = buildExtractionPrompt(document.content, config.existingTriggers);
  const batchId = generateBatchId();
  
  // Call Claude API
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2024-01-01',
    },
    body: JSON.stringify({
      model: config.model === 'claude-3-opus' ? 'claude-3-opus-20240229' : 'claude-3-sonnet-20240229',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Extraction API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.content[0]?.text || '[]';
  
  // Parse JSON from response (handle markdown code blocks)
  const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) || [null, content];
  const concepts: ExtractedConcept[] = JSON.parse(jsonMatch[1] || '[]');

  return {
    documentId: document.id,
    documentTitle: document.title,
    concepts: concepts.filter(c => c.confidence >= config.confidenceThreshold),
    extractedAt: new Date().toISOString(),
    model: config.model,
    batchId,
  };
}

export function transformToPromptCandidate(
  concept: ExtractedConcept,
  source: { id: string; title: string },
  batchId: string,
  model: string
): GroveObject<PromptPayload> {
  const now = new Date().toISOString();
  
  return {
    meta: {
      id: `extracted-${generateUUID()}`,
      type: 'prompt',
      title: concept.concept,
      description: `Extracted from: ${source.title}`,
      icon: 'auto_awesome',
      status: 'draft', // pending_review maps to draft
      createdAt: now,
      updatedAt: now,
      tags: ['extracted', 'pending-review'],
    },
    payload: {
      executionPrompt: concept.userQuestion,
      systemContext: concept.systemGuidance,
      source: 'extracted',
      provenance: {
        type: 'extracted',
        sourceDocument: source.id,
        sourceSnippet: concept.sourcePassage,
        extractedBy: model,
        extractedAt: now,
        extractionBatch: batchId,
        reviewStatus: 'pending',
      } as ExtractionProvenance,
      surfaces: ['highlight', 'suggestion'],
      highlightTriggers: [
        { text: concept.concept, matchMode: 'contains', caseSensitive: false }
      ],
      topicAffinities: [],
      lensAffinities: [{ lensId: 'base', weight: 1.0 }],
      targeting: { stages: ['exploration', 'synthesis'] },
      baseWeight: 50,
      stats: {
        impressions: 0,
        selections: 0,
        completions: 0,
        avgEntropyDelta: 0,
        avgDwellMs: 0,
      },
      // Extraction metadata (non-standard fields)
      extractionConfidence: concept.confidence,
      salienceDimensions: concept.dimensions,
      interestingBecause: concept.interestingBecause,
    },
  };
}
```

### Story 1.4: Create index export

**File:** `src/services/extraction/index.ts`

```typescript
// src/services/extraction/index.ts
export { extractPromptsFromDocument, transformToPromptCandidate } from './promptExtractor';
export { buildExtractionPrompt } from './extractionPrompt';
export type { 
  ExtractedConcept, 
  ExtractionConfig, 
  ExtractionResult,
  ExtractionProvenance 
} from './types';
```

**Verification:**
```bash
npm run build
```

---

## Epic 2: Update Types for Extraction

### Story 2.1: Add extraction provenance to types

**File:** `src/core/context-fields/types.ts`

Find the `PromptProvenance` interface and add extraction fields:

```typescript
export interface PromptProvenance {
  type: 'authored' | 'extracted' | 'generated';
  reviewStatus?: 'pending' | 'approved' | 'rejected' | 'edited';
  authorId?: string;
  authorName?: string;
  createdAt?: number | string;
  
  // Extraction-specific fields
  sourceDocument?: string;
  sourceSnippet?: string;
  extractedBy?: string;
  extractedAt?: string;
  extractionBatch?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  
  // Duplicate tracking (from previous sprint)
  duplicatedFrom?: string;
  duplicatedAt?: string;
}
```

Find the `PromptPayload` interface and add extraction metadata fields:

```typescript
export interface PromptPayload {
  // ... existing fields ...
  
  // Extraction metadata (optional)
  extractionConfidence?: number;
  salienceDimensions?: string[];
  interestingBecause?: string;
}
```

**Verification:**
```bash
npm run build  # Type check
```

---

## Epic 3: Review Queue UI

### Story 3.1: Update usePromptData with review queue

**File:** `src/bedrock/consoles/PromptWorkshop/usePromptData.ts`

Add a `reviewQueue` accessor to the returned object:

```typescript
// Inside usePromptData hook, after mergedObjects useMemo

const reviewQueue = useMemo(() => {
  return mergedObjects.filter(p => 
    p.payload.source === 'extracted' && 
    p.meta.tags?.includes('pending-review')
  );
}, [mergedObjects]);

const curatedPrompts = useMemo(() => {
  return mergedObjects.filter(p => p.payload.source === 'curated');
}, [mergedObjects]);

// Add to return object
return {
  ...groveData,
  objects: mergedObjects,
  reviewQueue,
  curatedPrompts,
  // ... existing methods
};
```

### Story 3.2: Add approve/reject methods

**File:** `src/bedrock/consoles/PromptWorkshop/usePromptData.ts`

Add review workflow methods:

```typescript
const approveExtracted = useCallback(
  async (object: GroveObject<PromptPayload>) => {
    const now = new Date().toISOString();
    const updated = {
      ...object,
      meta: {
        ...object.meta,
        status: 'active' as const,
        tags: object.meta.tags?.filter(t => t !== 'pending-review') || [],
        updatedAt: now,
      },
      payload: {
        ...object.payload,
        source: 'curated' as const,
        provenance: {
          ...object.payload.provenance,
          reviewStatus: 'approved' as const,
          reviewedAt: now,
        },
      },
    };
    return groveData.update(updated);
  },
  [groveData]
);

const rejectExtracted = useCallback(
  async (object: GroveObject<PromptPayload>, notes?: string) => {
    const now = new Date().toISOString();
    const updated = {
      ...object,
      meta: {
        ...object.meta,
        status: 'archived' as const,
        tags: [...(object.meta.tags?.filter(t => t !== 'pending-review') || []), 'rejected'],
        updatedAt: now,
      },
      payload: {
        ...object.payload,
        provenance: {
          ...object.payload.provenance,
          reviewStatus: 'rejected' as const,
          reviewedAt: now,
          reviewNotes: notes,
        },
      },
    };
    return groveData.update(updated);
  },
  [groveData]
);

// Add to return object
return {
  // ... existing
  approveExtracted,
  rejectExtracted,
};
```

### Story 3.3: Create ReviewQueue component

**File:** `src/bedrock/consoles/PromptWorkshop/ReviewQueue.tsx`

```tsx
// src/bedrock/consoles/PromptWorkshop/ReviewQueue.tsx
import React from 'react';
import type { GroveObject, PromptPayload } from '@core/context-fields/types';
import { GlassButton } from '@bedrock/components';

interface ReviewQueueProps {
  prompts: GroveObject<PromptPayload>[];
  onApprove: (prompt: GroveObject<PromptPayload>) => void;
  onReject: (prompt: GroveObject<PromptPayload>) => void;
  onSelect: (prompt: GroveObject<PromptPayload>) => void;
  selectedId?: string;
  loading?: boolean;
}

export const ReviewQueue: React.FC<ReviewQueueProps> = ({
  prompts,
  onApprove,
  onReject,
  onSelect,
  selectedId,
  loading,
}) => {
  if (prompts.length === 0) {
    return (
      <div className="p-4 text-center text-[var(--glass-text-muted)]">
        <span className="material-symbols-outlined text-3xl mb-2 block">inbox</span>
        <p>No prompts pending review</p>
        <p className="text-sm mt-1">Extract from documents to populate the queue</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--glass-border)]">
        <span className="text-sm font-medium text-amber-400">
          Review Queue ({prompts.length})
        </span>
      </div>
      
      {prompts.map((prompt) => {
        const confidence = prompt.payload.extractionConfidence || 0;
        const isSelected = prompt.meta.id === selectedId;
        
        return (
          <div
            key={prompt.meta.id}
            className={`
              p-3 mx-2 rounded-lg cursor-pointer transition-all
              ${isSelected 
                ? 'bg-amber-500/20 border border-amber-500/40' 
                : 'bg-[var(--glass-panel)] hover:bg-[var(--glass-hover)]'
              }
            `}
            onClick={() => onSelect(prompt)}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{prompt.meta.title}</h4>
                <p className="text-xs text-[var(--glass-text-muted)] truncate mt-0.5">
                  {prompt.payload.provenance?.sourceDocument || 'Unknown source'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    confidence > 0.8 ? 'bg-green-500/20 text-green-400' :
                    confidence > 0.6 ? 'bg-amber-500/20 text-amber-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {Math.round(confidence * 100)}% confidence
                  </span>
                  {prompt.payload.salienceDimensions?.slice(0, 2).map(d => (
                    <span key={d} className="text-xs text-[var(--glass-text-muted)]">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); onApprove(prompt); }}
                  disabled={loading}
                  className="p-1 hover:bg-green-500/20 rounded text-green-400"
                  title="Approve"
                >
                  <span className="material-symbols-outlined text-lg">check</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onReject(prompt); }}
                  disabled={loading}
                  className="p-1 hover:bg-red-500/20 rounded text-red-400"
                  title="Reject"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ReviewQueue;
```

### Story 3.4: Integrate ReviewQueue into PromptWorkshop

**File:** `src/bedrock/consoles/PromptWorkshop/PromptWorkshop.tsx` (or main component)

Add a tab or section for the review queue:

```tsx
// Import
import { ReviewQueue } from './ReviewQueue';

// In component, get review methods
const { 
  objects, 
  reviewQueue, 
  approveExtracted, 
  rejectExtracted,
  // ... other methods
} = usePromptData();

// Add UI section (could be a tab, sidebar section, or toggle)
{reviewQueue.length > 0 && (
  <ReviewQueue
    prompts={reviewQueue}
    onApprove={approveExtracted}
    onReject={rejectExtracted}
    onSelect={setSelectedPrompt}
    selectedId={selectedPrompt?.meta.id}
    loading={loading}
  />
)}
```

**Verification:**
```bash
npm run build
npm run dev
# Manually create a test extracted prompt in data layer
# Verify it appears in review queue
# Verify approve/reject work
```

---

## Epic 4: Extraction Trigger UI

### Story 4.1: Create ExtractionModal component

**File:** `src/bedrock/consoles/PromptWorkshop/ExtractionModal.tsx`

```tsx
// src/bedrock/consoles/PromptWorkshop/ExtractionModal.tsx
import React, { useState } from 'react';
import { GlassButton, GlassModal } from '@bedrock/components';
import { 
  extractPromptsFromDocument, 
  transformToPromptCandidate 
} from '@services/extraction';
import type { ExtractionResult } from '@services/extraction';

interface ExtractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingTriggers: string[];
  onExtracted: (prompts: any[]) => Promise<void>;
}

export const ExtractionModal: React.FC<ExtractionModalProps> = ({
  isOpen,
  onClose,
  existingTriggers,
  onExtracted,
}) => {
  const [documentContent, setDocumentContent] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async () => {
    if (!documentContent.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Get API key from environment or config
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('Anthropic API key not configured');
      }

      const extractionResult = await extractPromptsFromDocument(
        {
          content: documentContent,
          id: `doc-${Date.now()}`,
          title: documentTitle || 'Untitled Document',
        },
        {
          model: 'claude-3-sonnet',
          maxConcepts: 5,
          confidenceThreshold: 0.6,
          existingTriggers,
        },
        apiKey
      );
      
      setResult(extractionResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCandidates = async () => {
    if (!result) return;
    
    setLoading(true);
    try {
      const candidates = result.concepts.map(concept =>
        transformToPromptCandidate(
          concept,
          { id: result.documentId, title: result.documentTitle },
          result.batchId,
          result.model
        )
      );
      
      await onExtracted(candidates);
      onClose();
      setResult(null);
      setDocumentContent('');
      setDocumentTitle('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save candidates');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <GlassModal isOpen={isOpen} onClose={onClose} title="Extract Prompts from Document">
      <div className="space-y-4 p-4">
        {!result ? (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Document Title</label>
              <input
                type="text"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="e.g., Grove White Paper Section 3"
                className="w-full p-2 bg-[var(--glass-input)] border border-[var(--glass-border)] rounded"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Document Content</label>
              <textarea
                value={documentContent}
                onChange={(e) => setDocumentContent(e.target.value)}
                placeholder="Paste document content here..."
                rows={12}
                className="w-full p-2 bg-[var(--glass-input)] border border-[var(--glass-border)] rounded font-mono text-sm"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <GlassButton variant="ghost" onClick={onClose}>Cancel</GlassButton>
              <GlassButton 
                variant="primary" 
                onClick={handleExtract}
                disabled={loading || !documentContent.trim()}
              >
                {loading ? 'Extracting...' : 'Extract Concepts'}
              </GlassButton>
            </div>
          </>
        ) : (
          <>
            <div className="text-sm text-[var(--glass-text-muted)]">
              Found {result.concepts.length} concepts in "{result.documentTitle}"
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {result.concepts.map((concept, i) => (
                <div key={i} className="p-3 bg-[var(--glass-panel)] rounded border border-[var(--glass-border)]">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{concept.concept}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      concept.confidence > 0.8 ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {Math.round(concept.confidence * 100)}%
                    </span>
                  </div>
                  <p className="text-sm text-[var(--glass-text-muted)] mt-1">{concept.whyConfusing}</p>
                  <div className="flex gap-1 mt-2">
                    {concept.dimensions.map(d => (
                      <span key={d} className="text-xs bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <GlassButton variant="ghost" onClick={() => setResult(null)}>
                Back
              </GlassButton>
              <GlassButton 
                variant="primary" 
                onClick={handleSaveCandidates}
                disabled={loading || result.concepts.length === 0}
              >
                {loading ? 'Saving...' : `Save ${result.concepts.length} to Review Queue`}
              </GlassButton>
            </div>
          </>
        )}
      </div>
    </GlassModal>
  );
};

export default ExtractionModal;
```

### Story 4.2: Add extraction button to PromptWorkshop

In the main PromptWorkshop component, add a trigger button:

```tsx
// State
const [showExtractionModal, setShowExtractionModal] = useState(false);

// Get existing triggers for de-duplication
const existingTriggers = useMemo(() => {
  return objects.flatMap(p => 
    p.payload.highlightTriggers?.map(t => t.text) || []
  );
}, [objects]);

// Handler for saving extracted prompts
const handleExtracted = async (candidates: GroveObject<PromptPayload>[]) => {
  for (const candidate of candidates) {
    await groveData.create(candidate);
  }
};

// In toolbar/header area
<GlassButton
  variant="secondary"
  onClick={() => setShowExtractionModal(true)}
>
  <span className="material-symbols-outlined mr-1">auto_awesome</span>
  Extract from Document
</GlassButton>

// Modal
<ExtractionModal
  isOpen={showExtractionModal}
  onClose={() => setShowExtractionModal(false)}
  existingTriggers={existingTriggers}
  onExtracted={handleExtracted}
/>
```

**Verification:**
```bash
npm run build
npm run dev
# Click "Extract from Document"
# Paste a Grove doc section
# Verify extraction runs and results display
# Verify saving to review queue works
```

---

## Final Verification

```bash
# Full build
npm run build

# All tests
npm test

# Manual verification flow:
npm run dev

# 1. Open Prompt Workshop
# 2. Click "Extract from Document"
# 3. Paste content from a Grove doc (e.g., white paper section)
# 4. Click "Extract Concepts"
# 5. Verify 3-5 concepts extracted with confidence scores
# 6. Click "Save to Review Queue"
# 7. Verify prompts appear in Review Queue section
# 8. Click approve on one → verify it becomes 'curated' and appears in main list
# 9. Click reject on one → verify it's removed from queue
# 10. Navigate to Terminal → verify approved prompt works as highlight
```

---

## Commit Sequence

```bash
git checkout -b feature/prompt-extraction-pipeline-v1

# Epic 1: Extraction service
git add src/services/extraction/
git commit -m "feat(extraction): add prompt extraction service"

# Epic 2: Types
git add src/core/context-fields/types.ts
git commit -m "feat(types): add extraction provenance fields"

# Epic 3: Review queue
git add src/bedrock/consoles/PromptWorkshop/
git commit -m "feat(workshop): add review queue for extracted prompts"

# Epic 4: Extraction UI
git add src/bedrock/consoles/PromptWorkshop/ExtractionModal.tsx
git commit -m "feat(workshop): add extraction trigger UI"

# Push
git push -u origin feature/prompt-extraction-pipeline-v1
```

---

## Environment Setup

The extraction service requires an Anthropic API key:

```bash
# Add to .env.local
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

If using a different API pattern, adjust `promptExtractor.ts` accordingly.

---

## Troubleshooting

### Extraction returns empty array
- Check API key is valid
- Check document content is substantial enough
- Lower `confidenceThreshold` in config

### Type errors on provenance
- Ensure `ExtractionProvenance` interface is compatible with `PromptProvenance`
- Check optional fields are marked with `?`

### Review queue not showing
- Check `source: 'extracted'` is set correctly
- Check `tags` includes `'pending-review'`
- Verify `usePromptData` filter logic

### Approved prompts not appearing as highlights
- Check `source` changes to `'curated'` on approval
- Check `status` changes to `'active'`
- Verify `surfaces` includes `'highlight'`
