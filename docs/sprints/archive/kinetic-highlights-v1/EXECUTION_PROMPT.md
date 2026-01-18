# Execution Prompt: kinetic-highlights-v1

**Sprint:** kinetic-highlights-v1  
**Created:** 2025-01-05  
**Depends On:** exploration-node-unification-v1 (must be complete first)

---

## Context

You are implementing the **Kinetic Highlights** sprint for Grove Foundation. This sprint connects clickable highlights in kinetic text to rich backing prompts, enabling curated exploration rather than raw text passthrough.

### Key Insight

**Highlights ARE prompts** rendered on a different surface. The unified PromptObject model (from exploration-node-unification-v1) now needs `surfaces` and `highlightTriggers` to serve this context.

### Key Files

```
C:\GitHub\the-grove-foundation\
├── src/core/context-fields/types.ts     → Add surface types (EXTEND)
├── src/core/context-fields/lookup.ts    → Lookup function (NEW)
├── src/core/context-fields/index.ts     → Export new functions
├── src/explore/hooks/usePromptForHighlight.ts → React hook (NEW)
├── src/surface/components/KineticStream/ExploreShell.tsx → Handler (MODIFY)
├── src/data/prompts/highlights.prompts.json → Sample prompts (NEW)
├── src/data/prompts/index.ts            → Import highlights
└── src/bedrock/consoles/PromptWorkshop/ → UI components (NEW/EXTEND)
```

---

## Pre-Execution Verification

```bash
cd C:\GitHub\the-grove-foundation

# 1. Verify clean state
git status

# 2. Verify exploration-node-unification-v1 is complete
# (PromptProvenance type should exist in types.ts)

# 3. Verify build works
npm run build

# 4. Verify server starts
npm run dev
```

---

## Epic 1: Type Foundation

### Story 1.1: Add Surface Types

**File:** `src/core/context-fields/types.ts`

**Action:** Add after PromptProvenance section

```typescript
// ============================================================================
// PROMPT SURFACES (Multi-context rendering)
// Sprint: kinetic-highlights-v1
// ============================================================================

/**
 * Where a prompt can be rendered
 */
export type PromptSurface = 'suggestion' | 'highlight' | 'journey' | 'followup';

/**
 * Match mode for highlight triggers
 */
export type HighlightMatchMode = 'exact' | 'contains';

/**
 * Text pattern that triggers a prompt in highlight context
 */
export interface HighlightTrigger {
  /** Text that activates this prompt */
  text: string;
  /** How to match the text */
  matchMode: HighlightMatchMode;
  /** Case sensitivity (default: false) */
  caseSensitive?: boolean;
}

/**
 * Default surfaces when not specified
 */
export const DEFAULT_PROMPT_SURFACES: PromptSurface[] = ['suggestion'];

/**
 * Check if a prompt can render on a given surface
 */
export function canRenderOnSurface(
  prompt: PromptObject, 
  surface: PromptSurface
): boolean {
  const surfaces = prompt.surfaces ?? DEFAULT_PROMPT_SURFACES;
  return surfaces.includes(surface);
}

/**
 * Get all surfaces a prompt can render on
 */
export function getPromptSurfaces(prompt: PromptObject): PromptSurface[] {
  return prompt.surfaces ?? DEFAULT_PROMPT_SURFACES;
}
```

### Story 1.2: Extend PromptObject

**File:** `src/core/context-fields/types.ts`

**Action:** Add to PromptObject interface (after `embedding` field)

```typescript
  // === Sprint: kinetic-highlights-v1 ===
  
  /** Where this prompt can appear (default: ['suggestion']) */
  surfaces?: PromptSurface[];
  
  /** For highlight surface: text patterns that trigger this prompt */
  highlightTriggers?: HighlightTrigger[];
```

---

## Epic 2: Lookup Logic

### Story 2.1: Create Lookup Module

**File:** `src/core/context-fields/lookup.ts` (NEW)

```typescript
// src/core/context-fields/lookup.ts
// Prompt lookup by highlight text
// Sprint: kinetic-highlights-v1

import type { PromptObject, HighlightTrigger } from './types';
import { canRenderOnSurface } from './types';

export interface HighlightLookupContext {
  lensId?: string;
  stage?: string;
}

/**
 * Find the best prompt for a highlighted text span
 */
export function findPromptForHighlight(
  spanText: string,
  prompts: PromptObject[],
  context?: HighlightLookupContext
): PromptObject | null {
  // Filter to highlight-capable prompts with triggers
  const highlightPrompts = prompts.filter(p => 
    canRenderOnSurface(p, 'highlight') && 
    p.highlightTriggers?.length
  );
  
  if (highlightPrompts.length === 0) {
    return null;
  }
  
  // Priority 1: Exact match
  const exactMatch = findByMatchMode(highlightPrompts, spanText, 'exact');
  if (exactMatch) return exactMatch;
  
  // Priority 2: Contains match
  const containsMatch = findByMatchMode(highlightPrompts, spanText, 'contains');
  if (containsMatch) return containsMatch;
  
  // Priority 3: Context-aware affinity
  if (context?.lensId || context?.stage) {
    return findByAffinity(highlightPrompts, context);
  }
  
  return null;
}

function findByMatchMode(
  prompts: PromptObject[],
  spanText: string,
  mode: 'exact' | 'contains'
): PromptObject | null {
  for (const prompt of prompts) {
    for (const trigger of prompt.highlightTriggers!) {
      if (trigger.matchMode !== mode) continue;
      
      const span = trigger.caseSensitive ? spanText : spanText.toLowerCase();
      const text = trigger.caseSensitive ? trigger.text : trigger.text.toLowerCase();
      
      if (mode === 'exact' && span === text) {
        return prompt;
      }
      if (mode === 'contains' && span.includes(text)) {
        return prompt;
      }
    }
  }
  return null;
}

function findByAffinity(
  prompts: PromptObject[],
  context: HighlightLookupContext
): PromptObject | null {
  let bestPrompt: PromptObject | null = null;
  let bestScore = 0;
  
  for (const prompt of prompts) {
    let score = 0;
    
    if (context.lensId) {
      const lensAffinity = prompt.lensAffinities?.find(a => a.lensId === context.lensId);
      if (lensAffinity) score += lensAffinity.weight * 10;
    }
    
    if (context.stage) {
      const hasStage = prompt.targeting?.stages?.includes(context.stage as any);
      if (hasStage) score += 5;
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestPrompt = prompt;
    }
  }
  
  return bestPrompt;
}

/**
 * Get all prompts that can render as highlights
 */
export function getHighlightPrompts(prompts: PromptObject[]): PromptObject[] {
  return prompts.filter(p => canRenderOnSurface(p, 'highlight'));
}

/**
 * Check if any prompt matches a highlight trigger
 */
export function hasMatchingPrompt(
  spanText: string,
  prompts: PromptObject[]
): boolean {
  return findPromptForHighlight(spanText, prompts) !== null;
}
```

### Story 2.2: Export from Index

**File:** `src/core/context-fields/index.ts`

**Action:** Add exports

```typescript
// Lookup (Sprint: kinetic-highlights-v1)
export {
  findPromptForHighlight,
  getHighlightPrompts,
  hasMatchingPrompt,
  type HighlightLookupContext,
} from './lookup';

// Surface types (Sprint: kinetic-highlights-v1)
export type { PromptSurface, HighlightMatchMode, HighlightTrigger } from './types';
export { DEFAULT_PROMPT_SURFACES, canRenderOnSurface, getPromptSurfaces } from './types';
```

### Story 2.3: Create React Hook

**File:** `src/explore/hooks/usePromptForHighlight.ts` (NEW)

```typescript
// src/explore/hooks/usePromptForHighlight.ts
// Hook for looking up prompts for kinetic highlights
// Sprint: kinetic-highlights-v1

import { useCallback, useMemo } from 'react';
import { usePromptData } from '@bedrock/consoles/PromptWorkshop/usePromptData';
import { 
  findPromptForHighlight, 
  getHighlightPrompts,
  type HighlightLookupContext 
} from '@core/context-fields';
import type { PromptObject } from '@core/context-fields/types';

export interface UsePromptForHighlightResult {
  findPrompt: (spanText: string, context?: HighlightLookupContext) => PromptObject | null;
  highlightPrompts: PromptObject[];
  isReady: boolean;
}

export function usePromptForHighlight(): UsePromptForHighlightResult {
  const { prompts, isLoading } = usePromptData();
  
  const highlightPrompts = useMemo(() => {
    return getHighlightPrompts(prompts);
  }, [prompts]);
  
  const findPrompt = useCallback((
    spanText: string, 
    context?: HighlightLookupContext
  ): PromptObject | null => {
    return findPromptForHighlight(spanText, prompts, context);
  }, [prompts]);
  
  return {
    findPrompt,
    highlightPrompts,
    isReady: !isLoading,
  };
}

export default usePromptForHighlight;
```

**File:** `src/explore/hooks/index.ts`

**Action:** Add export

```typescript
export { usePromptForHighlight } from './usePromptForHighlight';
```

---

## Epic 3: ExploreShell Integration

### Story 3.1: Update handleConceptClick

**File:** `src/surface/components/KineticStream/ExploreShell.tsx`

**Action 1:** Add import (near other hook imports)

```typescript
import { usePromptForHighlight } from '@explore/hooks/usePromptForHighlight';
```

**Action 2:** Add hook usage (in component body, near other hooks)

```typescript
// Sprint: kinetic-highlights-v1 - Look up backing prompts for highlights
const { findPrompt } = usePromptForHighlight();
```

**Action 3:** Replace handleConceptClick (around line 452)

Find the existing handler and replace with:

```typescript
// Sprint: kinetic-highlights-v1 - Use backing prompt for highlights
const handleConceptClick = useCallback((span: RhetoricalSpan, sourceId: string) => {
  const pivotContext: PivotContext = {
    sourceResponseId: sourceId,
    sourceText: span.text,
    sourceContext: `User clicked on the concept "${span.text}" to explore it further.`
  };

  // Look up backing prompt for this highlight
  const backingPrompt = findPrompt(span.text, { lensId: lens, stage });
  
  if (backingPrompt) {
    // Use rich prompt - display surface text but execute with rich prompt
    submit(span.text, { 
      pivot: pivotContext, 
      executionPrompt: backingPrompt.executionPrompt,
      systemContext: backingPrompt.systemContext,
      personaBehaviors: effectivePersonaBehaviors 
    });
  } else {
    // Fallback: enhanced surface text
    const fallbackPrompt = `Tell me more about "${span.text}" in the context of what we've been discussing. What is it, why does it matter, and how does it connect to the bigger picture?`;
    submit(span.text, { 
      pivot: pivotContext, 
      executionPrompt: fallbackPrompt,
      personaBehaviors: effectivePersonaBehaviors 
    });
  }
}, [submit, effectivePersonaBehaviors, findPrompt, lens, stage]);
```

---

## Epic 4: Content Creation

### Story 4.1: Create Highlights File

**File:** `src/data/prompts/highlights.prompts.json` (NEW)

```json
{
  "prompts": [
    {
      "id": "highlight-distributed-ownership",
      "objectType": "prompt",
      "created": 1736121600000,
      "modified": 1736121600000,
      "author": "system",
      "label": "What does distributed ownership mean?",
      "description": "Backing prompt for 'distributed ownership' highlight",
      "executionPrompt": "I keep clicking on 'distributed ownership' because it sounds important but I'm not sure what's actually being distributed. Is it the AI models themselves? The servers they run on? The data? Help me understand what distributed ownership of AI infrastructure actually means in practical terms, and why it matters for someone who doesn't want to be locked into a single provider.",
      "systemContext": "The user clicked on 'distributed ownership' in kinetic text. This is a core Grove concept. Explain what's being distributed (compute, models, data sovereignty) and why it matters. Connect to the user's likely concern: avoiding lock-in. Use concrete examples. Don't be preachy about decentralization - focus on practical benefits.",
      "tags": ["highlight", "core-concept", "infrastructure-bet"],
      "topicAffinities": [
        { "topicId": "infrastructure-bet", "weight": 1.0 },
        { "topicId": "architecture", "weight": 0.8 }
      ],
      "lensAffinities": [
        { "lensId": "base", "weight": 1.0 }
      ],
      "targeting": {
        "stages": ["exploration", "synthesis"]
      },
      "baseWeight": 70,
      "stats": { "impressions": 0, "selections": 0, "completions": 0, "avgEntropyDelta": 0, "avgDwellAfter": 0 },
      "status": "active",
      "source": "library",
      "provenance": {
        "type": "authored",
        "reviewStatus": "approved",
        "authorId": "system",
        "authorName": "Grove Team"
      },
      "surfaces": ["highlight", "suggestion"],
      "highlightTriggers": [
        { "text": "distributed ownership", "matchMode": "exact" }
      ]
    },
    {
      "id": "highlight-hybrid-architecture",
      "objectType": "prompt",
      "created": 1736121600000,
      "modified": 1736121600000,
      "author": "system",
      "label": "What is hybrid architecture?",
      "description": "Backing prompt for 'hybrid architecture' highlight",
      "executionPrompt": "I see 'hybrid architecture' mentioned a lot. What exactly is being hybridized here? Is it about running some things locally and some in the cloud? How does Grove decide what goes where, and why does this split matter?",
      "systemContext": "Explain Grove's hybrid local-cloud architecture. Local 7B models handle routine cognition. Cloud APIs handle complex reasoning ('pivotal moments'). This isn't about cost savings - it's about capability matching. Use the 'right-sized intelligence' framing.",
      "tags": ["highlight", "core-concept", "architecture"],
      "topicAffinities": [
        { "topicId": "architecture", "weight": 1.0 }
      ],
      "lensAffinities": [
        { "lensId": "base", "weight": 1.0 }
      ],
      "targeting": {
        "stages": ["exploration", "synthesis"]
      },
      "baseWeight": 70,
      "stats": { "impressions": 0, "selections": 0, "completions": 0, "avgEntropyDelta": 0, "avgDwellAfter": 0 },
      "status": "active",
      "source": "library",
      "provenance": {
        "type": "authored",
        "reviewStatus": "approved",
        "authorId": "system",
        "authorName": "Grove Team"
      },
      "surfaces": ["highlight", "suggestion"],
      "highlightTriggers": [
        { "text": "hybrid architecture", "matchMode": "exact" },
        { "text": "hybrid model", "matchMode": "contains" }
      ]
    }
  ]
}
```

**Add more prompts for:**
- credit economy
- local inference  
- efficiency tax
- knowledge commons
- capability propagation
- epistemic independence
- AI villages
- gardener

### Story 4.2: Update Prompts Index

**File:** `src/data/prompts/index.ts`

**Action:** Add import and merge

```typescript
import highlightPrompts from './highlights.prompts.json';

export const libraryPrompts: PromptObject[] = [
  ...basePrompts.prompts,
  ...wayneTurnerPrompts.prompts,
  ...drChiangPrompts.prompts,
  ...highlightPrompts.prompts,  // NEW
];
```

---

## Epic 5: Admin UI (Optional but Recommended)

### Story 5.1: SurfaceSelector Component

**File:** `src/bedrock/consoles/PromptWorkshop/SurfaceSelector.tsx` (NEW)

```typescript
import React from 'react';
import type { PromptSurface } from '@core/context-fields/types';

interface Props {
  surfaces: PromptSurface[];
  onChange: (surfaces: PromptSurface[]) => void;
  disabled?: boolean;
}

const ALL_SURFACES: { value: PromptSurface; label: string }[] = [
  { value: 'suggestion', label: 'Suggestion' },
  { value: 'highlight', label: 'Highlight' },
  { value: 'journey', label: 'Journey' },
  { value: 'followup', label: 'Follow-up' },
];

export function SurfaceSelector({ surfaces, onChange, disabled }: Props) {
  const toggle = (surface: PromptSurface) => {
    if (surfaces.includes(surface)) {
      onChange(surfaces.filter(s => s !== surface));
    } else {
      onChange([...surfaces, surface]);
    }
  };
  
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-[var(--glass-text-primary)]">Surfaces</label>
      <div className="flex flex-wrap gap-2">
        {ALL_SURFACES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => toggle(value)}
            disabled={disabled}
            className={`px-3 py-1 rounded-full text-sm ${
              surfaces.includes(value)
                ? 'bg-[var(--neon-green)] text-black'
                : 'bg-[var(--glass-subtle)] text-[var(--glass-text-muted)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### Story 5.2: HighlightTriggersEditor Component

**File:** `src/bedrock/consoles/PromptWorkshop/HighlightTriggersEditor.tsx` (NEW)

```typescript
import React, { useState } from 'react';
import type { HighlightTrigger, HighlightMatchMode } from '@core/context-fields/types';

interface Props {
  triggers: HighlightTrigger[];
  onChange: (triggers: HighlightTrigger[]) => void;
  disabled?: boolean;
}

export function HighlightTriggersEditor({ triggers, onChange, disabled }: Props) {
  const [newText, setNewText] = useState('');
  const [newMode, setNewMode] = useState<HighlightMatchMode>('exact');
  
  const addTrigger = () => {
    if (!newText.trim()) return;
    onChange([...triggers, { text: newText.trim(), matchMode: newMode }]);
    setNewText('');
  };
  
  const removeTrigger = (index: number) => {
    onChange(triggers.filter((_, i) => i !== index));
  };
  
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-[var(--glass-text-primary)]">
        Highlight Triggers
      </label>
      
      <div className="flex flex-wrap gap-2">
        {triggers.map((trigger, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-[var(--glass-subtle)]">
            <span className="text-[var(--glass-text-muted)]">
              {trigger.matchMode === 'exact' ? '=' : '~'}
            </span>
            {trigger.text}
            {!disabled && (
              <button onClick={() => removeTrigger(i)} className="ml-1 hover:text-red-400">×</button>
            )}
          </span>
        ))}
      </div>
      
      {!disabled && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="e.g. distributed ownership"
            className="flex-1 px-3 py-2 rounded bg-[var(--glass-input)] text-sm"
            onKeyDown={(e) => e.key === 'Enter' && addTrigger()}
          />
          <select
            value={newMode}
            onChange={(e) => setNewMode(e.target.value as HighlightMatchMode)}
            className="px-3 py-2 rounded bg-[var(--glass-input)] text-sm"
          >
            <option value="exact">Exact</option>
            <option value="contains">Contains</option>
          </select>
          <button onClick={addTrigger} className="px-3 py-2 rounded bg-[var(--neon-green)] text-black text-sm">
            Add
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## Build Gates

After each epic:

```bash
npm run build
npm run dev
# Test the feature
```

---

## Final Verification

```bash
# 1. Build passes
npm run build

# 2. Server starts
npm run dev

# 3. Verify highlight prompts loaded
# Open browser console:
# import { libraryPrompts } from './src/data/prompts';
# console.log(libraryPrompts.filter(p => p.surfaces?.includes('highlight')));

# 4. Manual test
# - Navigate to terminal
# - Get a response with highlighted concepts
# - Click a highlight that has a backing prompt
# - Verify response is richer than raw text
```

---

## Success Criteria

- [ ] PromptObject has surfaces and highlightTriggers fields
- [ ] Lookup function finds prompts by trigger text
- [ ] ExploreShell uses lookup on highlight click
- [ ] 10+ core concepts have backing prompts
- [ ] Click highlight → rich response (not raw text)
- [ ] Build passes, no type errors

---

## DEVLOG

```markdown
## DEVLOG: kinetic-highlights-v1

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
