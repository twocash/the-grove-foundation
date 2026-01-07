# ARCHITECTURE.md - prompt-refinement-v1

> **Sprint**: prompt-refinement-v1
> **Created**: 2026-01-06
> **Patterns Extended**: GroveObject Model, Bedrock Copilot, Module Shell

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        PromptWorkshop Console                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌───────────────┐  ┌────────────────────┐  ┌────────────────────┐ │
│  │   Navigation  │  │      Content       │  │     Inspector      │ │
│  │               │  │                    │  │                    │ │
│  │  ReviewQueue  │  │    PromptGrid      │  │  SourceContext     │ │
│  │  - Pending    │  │    (all prompts)   │  │  (collapsible)     │ │
│  │  - Selection  │  │                    │  │                    │ │
│  │  - Shortcuts  │  │                    │  │  PromptEditor      │ │
│  │               │  │                    │  │  - Identity        │ │
│  │  BatchActions │  │                    │  │  - Execution       │ │
│  │  - Approve    │  │                    │  │  - Targeting       │ │
│  │  - Reject     │  │                    │  │  - QA Results      │ │
│  │  - QA Check   │  │                    │  │                    │ │
│  └───────────────┘  └────────────────────┘  └────────────────────┘ │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Copilot QA Layer                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │  /qa-check  │  │/make-compelling│  │ /fix-prompt │  │/find-related│ │
│  │             │  │             │  │             │  │             │ │
│  │  Validates  │  │  Transform  │  │   Apply     │  │   Cross-    │ │
│  │  quality    │  │   title     │  │   fixes     │  │  reference  │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │
│                           │                                          │
│                           ▼                                          │
│                  ┌─────────────────┐                                │
│                  │  Source Context │                                │
│                  │  Consultation   │                                │
│                  └─────────────────┘                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Pattern Extensions

### 2.1 GroveObject Model Extension

**Pattern**: `src/core/schema/grove-object.ts`
**Extension**: Add QA-related fields to PromptPayload

```typescript
// src/core/schema/prompt.ts - ADDITIONS

export interface PromptPayload {
  // ... existing fields ...

  // === Epic 3: Structured Execution Prompt ===
  
  /** What the user implicitly wants to learn */
  userIntent?: string;
  
  /** How to frame the response (from interestingBecause) */
  conceptAngle?: string;
  
  /** Optional next questions for exploration */
  suggestedFollowups?: string[];

  // === Epic 3: QA Metadata ===
  
  /** Last QA check score (0-100) */
  qaScore?: number;
  
  /** ISO timestamp of last QA check */
  qaLastChecked?: string;
  
  /** Issues identified by QA check */
  qaIssues?: QAIssue[];
}

export interface QAIssue {
  type: 'missing_context' | 'ambiguous_intent' | 'too_broad' | 'too_narrow' | 'source_mismatch';
  description: string;
  suggestedFix: string;
  autoFixAvailable: boolean;
  severity: 'error' | 'warning' | 'info';
}
```

### 2.2 Bedrock Copilot Extension

**Pattern**: `src/bedrock/context/BedrockCopilotContext.tsx`
**Extension**: Add QA-specific action handlers

```typescript
// src/bedrock/consoles/PromptWorkshop/PromptQAActions.ts

import type { CopilotActionResult } from '../../types/copilot.types';
import type { GroveObject } from '@core/schema/grove-object';
import type { PromptPayload, QAIssue } from '@core/schema/prompt';

export interface QAContext {
  prompt: GroveObject<PromptPayload>;
  sourceDocument?: {
    id: string;
    title: string;
    extractedPassage: string;
    fullContext?: string;
  };
}

export const QA_ACTIONS = {
  'qa-check': {
    id: 'qa-check',
    trigger: '/qa-check',
    description: 'Run quality assessment on prompt',
    handler: qaCheckHandler,
  },
  'make-compelling': {
    id: 'make-compelling',
    trigger: '/make-compelling',
    description: 'Transform title to compelling topic phrase',
    handler: makeCompellingHandler,
  },
  'fix-prompt': {
    id: 'fix-prompt',
    trigger: '/fix-prompt',
    description: 'Apply suggested fixes from QA check',
    handler: fixPromptHandler,
  },
  'find-related': {
    id: 'find-related',
    trigger: '/find-related',
    description: 'Find related prompts in knowledge base',
    handler: findRelatedHandler,
  },
};

async function qaCheckHandler(context: QAContext): Promise<CopilotActionResult> {
  const { prompt, sourceDocument } = context;
  
  // Build assessment prompt
  const assessmentPrompt = buildQAAssessmentPrompt(prompt, sourceDocument);
  
  // Call LLM for assessment
  const result = await callCopilotLLM(assessmentPrompt);
  
  // Parse and return structured result
  return {
    success: true,
    message: `QA Score: ${result.score}/100`,
    operations: [
      { op: 'replace', path: '/payload/qaScore', value: result.score },
      { op: 'replace', path: '/payload/qaLastChecked', value: new Date().toISOString() },
      { op: 'replace', path: '/payload/qaIssues', value: result.issues },
    ],
  };
}
```

### 2.3 Module Shell Extension

**Pattern**: `src/bedrock/patterns/module-shell.tsx`
**Extension**: Add batch selection UI to contextual features slot

```typescript
// Existing ModuleShell has contextualFeatures prop
// We populate it with batch actions when selection active

interface BatchActionsProps {
  selectedCount: number;
  onApproveAll: () => void;
  onRejectAll: () => void;
  onQACheckAll: () => void;
  onClearSelection: () => void;
}

function BatchActions({ selectedCount, ...handlers }: BatchActionsProps) {
  if (selectedCount === 0) return null;
  
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-surface-subtle">
      <span className="text-sm text-muted">{selectedCount} selected</span>
      <Button size="sm" variant="success" onClick={handlers.onApproveAll}>
        Approve All
      </Button>
      <Button size="sm" variant="danger" onClick={handlers.onRejectAll}>
        Reject All
      </Button>
      <Button size="sm" variant="secondary" onClick={handlers.onQACheckAll}>
        QA Check All
      </Button>
      <Button size="sm" variant="ghost" onClick={handlers.onClearSelection}>
        Clear
      </Button>
    </div>
  );
}
```

---

## 3. Component Architecture

### 3.1 New Components

```
src/bedrock/consoles/PromptWorkshop/
├── components/
│   ├── SourceContextSection.tsx   # Collapsible source display
│   ├── QAResultsSection.tsx       # QA issues display
│   ├── BatchActions.tsx           # Batch action bar
│   └── TitleSuggestions.tsx       # Title options modal
├── hooks/
│   ├── usePromptSelection.ts      # Selection state
│   ├── useSourceContext.ts        # Source doc fetching
│   └── useQACheck.ts              # QA action wrapper
└── utils/
    └── TitleTransforms.ts         # Title transformation logic
```

### 3.2 SourceContextSection

```typescript
// src/bedrock/consoles/PromptWorkshop/components/SourceContextSection.tsx

import { InspectorSection } from '../../patterns/inspector-section';
import { useSourceContext } from '../hooks/useSourceContext';

interface Props {
  promptId: string;
  documentId?: string;
}

export function SourceContextSection({ promptId, documentId }: Props) {
  const { data, isLoading, error } = useSourceContext(promptId, documentId);
  
  if (!documentId) {
    return (
      <InspectorSection title="Source Context" collapsible defaultCollapsed>
        <p className="text-muted text-sm">No source document linked</p>
      </InspectorSection>
    );
  }
  
  return (
    <InspectorSection title="Source Context" collapsible defaultCollapsed>
      {isLoading && <LoadingSpinner />}
      {error && <ErrorMessage error={error} />}
      {data && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{data.title}</span>
            <a href={`/foundation/pipeline?doc=${documentId}`} className="text-xs text-link">
              View Document →
            </a>
          </div>
          <blockquote className="border-l-2 border-accent pl-3 text-sm text-muted">
            {data.extractedPassage}
          </blockquote>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>Confidence: {(data.confidence * 100).toFixed(0)}%</span>
            <span>•</span>
            <span>Extracted: {formatDate(data.extractedAt)}</span>
          </div>
        </div>
      )}
    </InspectorSection>
  );
}
```

### 3.3 usePromptSelection Hook

```typescript
// src/bedrock/consoles/PromptWorkshop/hooks/usePromptSelection.ts

import { useState, useCallback, useEffect } from 'react';

interface SelectionState {
  selectedIds: Set<string>;
  lastSelectedId: string | null;
}

export function usePromptSelection() {
  const [state, setState] = useState<SelectionState>({
    selectedIds: new Set(),
    lastSelectedId: null,
  });

  const select = useCallback((id: string, options?: { shift?: boolean }) => {
    setState((prev) => {
      const newSet = new Set(prev.selectedIds);
      
      if (options?.shift && prev.lastSelectedId) {
        // Range select - handled by parent with visible items
        newSet.add(id);
      } else {
        // Toggle single selection
        if (newSet.has(id)) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
      }
      
      return { selectedIds: newSet, lastSelectedId: id };
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setState({
      selectedIds: new Set(ids),
      lastSelectedId: ids[ids.length - 1] || null,
    });
  }, []);

  const clearSelection = useCallback(() => {
    setState({ selectedIds: new Set(), lastSelectedId: null });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearSelection();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [clearSelection]);

  return {
    selectedIds: state.selectedIds,
    selectedCount: state.selectedIds.size,
    select,
    selectAll,
    clearSelection,
    isSelected: (id: string) => state.selectedIds.has(id),
  };
}
```

---

## 4. Data Flow

### 4.1 QA Check Flow

```
User clicks "QA Check" button
        │
        ▼
┌───────────────────┐
│ useQACheck hook   │
│ - Get prompt data │
│ - Get source ctx  │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ POST /api/prompts │
│     /:id/qa       │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ QA Action Handler │
│ - Build prompt    │
│ - Call LLM        │
│ - Parse result    │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Return QA Result  │
│ - Score           │
│ - Issues[]        │
│ - Suggestions[]   │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ UI Updates        │
│ - Show QA score   │
│ - Display issues  │
│ - Enable fixes    │
└───────────────────┘
```

### 4.2 Batch Operation Flow

```
User selects multiple prompts (Shift+Click or Cmd+A)
        │
        ▼
┌───────────────────┐
│ Selection state   │
│ updates via hook  │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ BatchActions bar  │
│ appears with      │
│ selected count    │
└─────────┬─────────┘
          │
          ▼
User clicks "Approve All"
          │
          ▼
┌───────────────────┐
│ Confirmation      │
│ modal appears     │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ Batch PATCH calls │
│ with progress     │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ UI updates:       │
│ - Cards update    │
│ - Selection clear │
│ - Toast success   │
└───────────────────┘
```

---

## 5. API Architecture

### 5.1 New Endpoints

```typescript
// pages/api/prompts/[id]/qa.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { runQACheck } from '@lib/prompts/qa';
import { getSourceContext } from '@lib/documents/context';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  
  try {
    // Get prompt
    const prompt = await getPromptById(id as string);
    if (!prompt) {
      return res.status(404).json({ error: 'Prompt not found' });
    }
    
    // Get source context if available
    const sourceDocId = prompt.payload.provenance?.sourceDocIds?.[0];
    const sourceContext = sourceDocId 
      ? await getSourceContext(sourceDocId, prompt.id)
      : undefined;
    
    // Run QA check
    const result = await runQACheck(prompt, sourceContext);
    
    // Update prompt with QA results
    await updatePrompt(id as string, {
      qaScore: result.score,
      qaLastChecked: new Date().toISOString(),
      qaIssues: result.issues,
    });
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('QA check failed:', error);
    return res.status(500).json({ error: 'QA check failed' });
  }
}
```

### 5.2 Source Context Endpoint

```typescript
// pages/api/documents/[id]/context.ts

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const { promptId } = req.query; // Optional: get context for specific extraction
  
  try {
    const document = await getDocumentById(id as string);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // If promptId provided, get the specific extracted passage
    let extractedPassage = '';
    let confidence = 0;
    
    if (promptId) {
      const extraction = await getExtractionForPrompt(promptId as string);
      extractedPassage = extraction?.passage || '';
      confidence = extraction?.confidence || 0;
    }
    
    return res.status(200).json({
      id: document.id,
      title: document.title,
      extractedPassage,
      confidence,
      fullContext: document.content?.substring(0, 2000), // First 2000 chars
    });
  } catch (error) {
    console.error('Failed to get document context:', error);
    return res.status(500).json({ error: 'Failed to get context' });
  }
}
```

---

## 6. State Management

### 6.1 Console-Level State

```typescript
// PromptWorkshop manages:
interface PromptWorkshopState {
  // Selection (via usePromptSelection)
  selection: {
    selectedIds: Set<string>;
    lastSelectedId: string | null;
  };
  
  // Inspector (existing)
  inspectedPromptId: string | null;
  
  // Filters (existing)
  statusFilter: 'all' | 'pending' | 'approved' | 'rejected';
  sourceFilter: 'all' | 'extracted' | 'library' | 'generated';
}
```

### 6.2 Copilot Context Extension

```typescript
// Extend BedrockCopilotContext to include QA state
interface CopilotState {
  // ... existing fields ...
  
  // QA-specific
  pendingQAChecks: Set<string>;  // Prompt IDs with running QA
  qaResults: Map<string, QACheckResult>;  // Cached results
}
```

---

## 7. Stage-Depth Mapping (4D Targeting)

### 7.1 Core Principle

Prompts aren't assigned to ONE lens—they're explorable across MANY lenses at different depths. The stage determines response characteristics.

### 7.2 Stage → Response Mapping

```typescript
// src/bedrock/consoles/PromptWorkshop/utils/TargetingInference.ts

import type { PromptStage } from '@core/schema/prompt';
import type { VocabularyLevel, NarrativeStyle } from '@core/schema/narrative';

export const STAGE_DEPTH_MAP: Record<PromptStage, {
  vocabularyLevel: VocabularyLevel;
  narrativeStyle: NarrativeStyle;
  responseLength: 'short' | 'medium' | 'long' | 'comprehensive';
  arcEmphasis: { hook: number; stakes: number; mechanics: number; evidence: number; resolution: number };
}> = {
  genesis: {
    vocabularyLevel: 'accessible',
    narrativeStyle: 'stakes-heavy',
    responseLength: 'short',
    arcEmphasis: { hook: 4, stakes: 3, mechanics: 1, evidence: 1, resolution: 2 },
  },
  exploration: {
    vocabularyLevel: 'technical',
    narrativeStyle: 'mechanics-deep',
    responseLength: 'medium',
    arcEmphasis: { hook: 2, stakes: 2, mechanics: 4, evidence: 2, resolution: 1 },
  },
  synthesis: {
    vocabularyLevel: 'academic',
    narrativeStyle: 'evidence-first',
    responseLength: 'long',
    arcEmphasis: { hook: 1, stakes: 2, mechanics: 3, evidence: 4, resolution: 2 },
  },
  advocacy: {
    vocabularyLevel: 'executive',
    narrativeStyle: 'resolution-oriented',
    responseLength: 'comprehensive',
    arcEmphasis: { hook: 2, stakes: 3, mechanics: 2, evidence: 2, resolution: 4 },
  },
};
```

### 7.3 Lens-Stage Compatibility

Not all lenses support all stages. A "general" lens may only work at Genesis, while "academic" can go deep.

```typescript
export const LENS_STAGE_COMPATIBILITY: Record<string, PromptStage[]> = {
  'general': ['genesis'],
  'executive': ['genesis', 'exploration', 'advocacy'],
  'technical': ['genesis', 'exploration', 'synthesis'],
  'academic': ['genesis', 'exploration', 'synthesis', 'advocacy'],
  'concerned-citizen': ['genesis', 'exploration'],
  // ... other lenses
};

export function getAvailableStagesForLens(lensId: string): PromptStage[] {
  return LENS_STAGE_COMPATIBILITY[lensId] || ['genesis'];
}
```

### 7.4 Inference from Salience

```typescript
export function inferTargetingFromSalience(
  salienceDimensions: string[],
  interestingBecause?: string
): TargetingSuggestion {
  const suggestions: LensAffinitySuggestion[] = [];
  
  // Technical salience → Technical/Academic lenses
  if (salienceDimensions.includes('technical')) {
    suggestions.push({
      lensId: 'technical',
      weight: 0.8,
      reasoning: 'Concept has technical implementation details',
      stagesAvailable: ['genesis', 'exploration', 'synthesis'],
    });
    suggestions.push({
      lensId: 'academic',
      weight: 0.9,
      reasoning: 'Technical depth supports academic exploration',
      stagesAvailable: ['genesis', 'exploration', 'synthesis', 'advocacy'],
    });
  }
  
  // Economic salience → Executive/Family Office lenses
  if (salienceDimensions.includes('economic')) {
    suggestions.push({
      lensId: 'executive',
      weight: 0.7,
      reasoning: 'Economic implications relevant to decision-makers',
      stagesAvailable: ['genesis', 'exploration', 'advocacy'],
    });
  }
  
  // Philosophical salience → Academic/Concerned Citizen lenses
  if (salienceDimensions.includes('philosophical')) {
    suggestions.push({
      lensId: 'academic',
      weight: 0.9,
      reasoning: 'Philosophical depth requires academic treatment',
      stagesAvailable: ['genesis', 'exploration', 'synthesis', 'advocacy'],
    });
    suggestions.push({
      lensId: 'concerned-citizen',
      weight: 0.6,
      reasoning: 'Philosophical implications affect society',
      stagesAvailable: ['genesis', 'exploration'],
    });
  }
  
  // Practical salience → General/Executive lenses
  if (salienceDimensions.includes('practical')) {
    suggestions.push({
      lensId: 'general',
      weight: 0.7,
      reasoning: 'Practical applications accessible to all',
      stagesAvailable: ['genesis'],
    });
  }
  
  // Determine primary stage from complexity
  const primaryStage = salienceDimensions.length >= 3 ? 'synthesis' :
                       salienceDimensions.length >= 2 ? 'exploration' : 'genesis';
  
  return {
    lensAffinities: suggestions,
    primaryStage,
    confidence: Math.min(0.9, 0.5 + (salienceDimensions.length * 0.15)),
  };
}
```

---

## 8. Error Handling

### 7.1 Graceful Degradation

| Scenario | Behavior |
|----------|----------|
| Source document deleted | Show "Source unavailable" in context section |
| QA check fails | Show error toast, allow retry |
| Batch operation partial failure | Show success count + failures, allow retry |
| LLM rate limited | Queue requests, show progress |

### 7.2 Optimistic Updates

```typescript
// When approving a prompt
const optimisticApprove = async (promptId: string) => {
  // 1. Update UI immediately
  updatePromptLocally(promptId, { status: 'approved' });
  
  try {
    // 2. Persist to server
    await patchPrompt(promptId, { 'meta.status': 'approved' });
  } catch (error) {
    // 3. Rollback on failure
    updatePromptLocally(promptId, { status: 'pending' });
    showErrorToast('Failed to approve prompt');
  }
};
```

---

## 8. Security Considerations

### 8.1 Authorization

- All QA endpoints require authenticated session
- Batch operations limited to operator role
- Source context access respects document permissions

### 8.2 Rate Limiting

- QA checks: 10 per minute per user
- Batch operations: 50 items per request
- LLM calls cached for 5 minutes

---

## 9. Performance Considerations

### 9.1 Lazy Loading

- Source context fetched only when Inspector opened
- QA results cached in memory for session
- Batch operations use concurrent requests (max 5)

### 9.2 Optimizations

- Virtual scrolling for large prompt lists (existing)
- Debounced save for editor changes
- Skeleton loaders for async content
