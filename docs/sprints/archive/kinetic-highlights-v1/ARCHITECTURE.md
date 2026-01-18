# Architecture: kinetic-highlights-v1

**Sprint:** kinetic-highlights-v1  
**Version:** 1.0  
**Created:** 2025-01-05

---

## 1. System Overview

### Unified Exploration Node Model

```
                    EXPLORATION NODES
                    (PromptObject)
                          │
          ┌───────────────┼───────────────┐
          │               │               │
     surfaces:       surfaces:       surfaces:
    ['suggestion']  ['highlight']   ['journey']
          │               │               │
          ▼               ▼               ▼
    ┌─────────┐     ┌─────────┐     ┌─────────┐
    │ Prompt  │     │ Kinetic │     │ Journey │
    │ Suggest │     │Highlight│     │  Step   │
    └─────────┘     └─────────┘     └─────────┘
```

One object type, multiple rendering surfaces. The `surfaces` field controls where a prompt can appear.

### Highlight Flow

```
User Clicks Highlight
        │
        ▼
┌───────────────────┐
│ handleConceptClick │
│   (ExploreShell)   │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│findPromptForHighlight│
│   (lookup.ts)     │
└─────────┬─────────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
 Found      Not Found
    │           │
    ▼           ▼
executionPrompt  Fallback
    │           │
    └─────┬─────┘
          │
          ▼
┌───────────────────┐
│     submit()      │
│ (with rich prompt)│
└───────────────────┘
```

---

## 2. Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ SURFACE LAYER                                               │
│ ExploreShell.tsx                                            │
│   └─ handleConceptClick() → uses lookup hook                │
│ KineticRenderer → ResponseObject → RhetoricRenderer         │
│   └─ ConceptSpan.tsx (renders clickable highlight)          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ ADAPTER LAYER                                               │
│ hooks/usePromptForHighlight.ts                              │
│   └─ findPrompt(spanText, context) → PromptObject | null    │
│   └─ loads prompts with surfaces.includes('highlight')      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ CORE LAYER                                                  │
│ context-fields/lookup.ts (NEW)                              │
│   └─ findPromptForHighlight()                               │
│   └─ canRenderOnSurface()                                   │
│ context-fields/types.ts                                     │
│   └─ PromptSurface, HighlightTrigger types                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│ BEDROCK LAYER                                               │
│ PromptObject storage (JSON files)                           │
│   └─ surfaces: ['highlight', 'suggestion']                  │
│   └─ highlightTriggers: [{ text, matchMode }]               │
│ PromptWorkshop admin UI                                     │
│   └─ Highlight trigger editor                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Type Definitions

### 3.1 Core Types

**File:** `src/core/context-fields/types.ts`

Add after PromptProvenance section:

```typescript
// ============================================================================
// PROMPT SURFACES (Multi-context rendering)
// Sprint: kinetic-highlights-v1
// ============================================================================

/**
 * Where a prompt can be rendered
 * - suggestion: Standard prompt suggestions panel
 * - highlight: Clickable concepts in kinetic text
 * - journey: Steps in guided journeys
 * - followup: Contextual follow-up suggestions
 */
export type PromptSurface = 'suggestion' | 'highlight' | 'journey' | 'followup';

/**
 * Match mode for highlight triggers
 * - exact: Text must match exactly (case-insensitive by default)
 * - contains: Trigger text appears anywhere in span
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
  /** Whether matching is case-sensitive (default: false) */
  caseSensitive?: boolean;
}

/**
 * Default surfaces for prompts without explicit surfaces field
 */
export const DEFAULT_PROMPT_SURFACES: PromptSurface[] = ['suggestion'];
```

### 3.2 PromptObject Extension

**File:** `src/core/context-fields/types.ts`

Add to PromptObject interface:

```typescript
export interface PromptObject {
  // ... existing fields (id, label, executionPrompt, etc.) ...
  
  // === Sprint: exploration-node-unification-v1 ===
  provenance: PromptProvenance;
  embedding?: number[];
  
  // === Sprint: kinetic-highlights-v1 ===
  
  /** Where this prompt can appear (default: ['suggestion']) */
  surfaces?: PromptSurface[];
  
  /** For highlight surface: text patterns that trigger this prompt */
  highlightTriggers?: HighlightTrigger[];
}
```

### 3.3 Helper Functions

**File:** `src/core/context-fields/types.ts`

Add after interfaces:

```typescript
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

---

## 4. Lookup Module

### 4.1 Core Lookup Function

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
 * 
 * Priority:
 * 1. Exact match on trigger text
 * 2. Contains match on trigger text
 * 3. Context-aware affinity scoring
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
  
  // Priority 3: Context-aware (if context provided)
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
    
    // Lens affinity
    if (context.lensId) {
      const lensAffinity = prompt.lensAffinities?.find(a => a.lensId === context.lensId);
      if (lensAffinity) score += lensAffinity.weight * 10;
    }
    
    // Stage targeting
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

### 4.2 Export from Index

**File:** `src/core/context-fields/index.ts`

Add exports:

```typescript
// Lookup (Sprint: kinetic-highlights-v1)
export {
  findPromptForHighlight,
  getHighlightPrompts,
  hasMatchingPrompt,
  type HighlightLookupContext,
} from './lookup';

// Types
export type { PromptSurface, HighlightMatchMode, HighlightTrigger } from './types';
export { DEFAULT_PROMPT_SURFACES, canRenderOnSurface, getPromptSurfaces } from './types';
```

---

## 5. React Hook

### 5.1 usePromptForHighlight Hook

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
  /** Find a prompt for the given highlight text */
  findPrompt: (spanText: string, context?: HighlightLookupContext) => PromptObject | null;
  /** All prompts that can appear as highlights */
  highlightPrompts: PromptObject[];
  /** Whether prompts are loaded */
  isReady: boolean;
}

export function usePromptForHighlight(): UsePromptForHighlightResult {
  // Get all prompts from the data hook
  const { prompts, isLoading } = usePromptData();
  
  // Filter to highlight-capable prompts
  const highlightPrompts = useMemo(() => {
    return getHighlightPrompts(prompts);
  }, [prompts]);
  
  // Lookup function
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

### 5.2 Export from Hooks Index

**File:** `src/explore/hooks/index.ts`

Add:

```typescript
export { usePromptForHighlight } from './usePromptForHighlight';
```

---

## 6. ExploreShell Integration

### 6.1 Import Updates

**File:** `src/surface/components/KineticStream/ExploreShell.tsx`

Add import:

```typescript
import { usePromptForHighlight } from '@explore/hooks/usePromptForHighlight';
```

### 6.2 Hook Usage

In component body, add:

```typescript
// Sprint: kinetic-highlights-v1 - Look up backing prompts for highlights
const { findPrompt, isReady: highlightsReady } = usePromptForHighlight();
```

### 6.3 Updated handleConceptClick

Replace existing handler:

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
    // Fallback: enhanced surface text (better than raw, not as good as curated)
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

## 7. Prompt Workshop Updates

### 7.1 Highlight Triggers Editor

**File:** `src/bedrock/consoles/PromptWorkshop/HighlightTriggersEditor.tsx` (NEW)

```typescript
// src/bedrock/consoles/PromptWorkshop/HighlightTriggersEditor.tsx
// Editor for highlight trigger patterns
// Sprint: kinetic-highlights-v1

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
      
      {/* Existing triggers */}
      <div className="flex flex-wrap gap-2">
        {triggers.map((trigger, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-[var(--glass-subtle)] text-[var(--glass-text-primary)]"
          >
            <span className="text-[var(--glass-text-muted)]">
              {trigger.matchMode === 'exact' ? '=' : '~'}
            </span>
            {trigger.text}
            {!disabled && (
              <button
                onClick={() => removeTrigger(i)}
                className="ml-1 text-[var(--glass-text-muted)] hover:text-red-400"
              >
                ×
              </button>
            )}
          </span>
        ))}
      </div>
      
      {/* Add new trigger */}
      {!disabled && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="e.g. distributed ownership"
            className="flex-1 px-3 py-2 rounded bg-[var(--glass-input)] text-[var(--glass-text-primary)] text-sm"
            onKeyDown={(e) => e.key === 'Enter' && addTrigger()}
          />
          <select
            value={newMode}
            onChange={(e) => setNewMode(e.target.value as HighlightMatchMode)}
            className="px-3 py-2 rounded bg-[var(--glass-input)] text-[var(--glass-text-primary)] text-sm"
          >
            <option value="exact">Exact</option>
            <option value="contains">Contains</option>
          </select>
          <button
            onClick={addTrigger}
            className="px-3 py-2 rounded bg-[var(--neon-green)] text-black text-sm font-medium"
          >
            Add
          </button>
        </div>
      )}
      
      <p className="text-xs text-[var(--glass-text-muted)]">
        Triggers determine which highlighted text activates this prompt. 
        "Exact" requires full match; "Contains" matches substrings.
      </p>
    </div>
  );
}

export default HighlightTriggersEditor;
```

### 7.2 Surface Selector

**File:** `src/bedrock/consoles/PromptWorkshop/SurfaceSelector.tsx` (NEW)

```typescript
// src/bedrock/consoles/PromptWorkshop/SurfaceSelector.tsx
// Multi-select for prompt surfaces
// Sprint: kinetic-highlights-v1

import React from 'react';
import type { PromptSurface } from '@core/context-fields/types';

interface Props {
  surfaces: PromptSurface[];
  onChange: (surfaces: PromptSurface[]) => void;
  disabled?: boolean;
}

const ALL_SURFACES: { value: PromptSurface; label: string; description: string }[] = [
  { value: 'suggestion', label: 'Suggestion', description: 'Prompt suggestions panel' },
  { value: 'highlight', label: 'Highlight', description: 'Clickable kinetic text' },
  { value: 'journey', label: 'Journey', description: 'Guided journey steps' },
  { value: 'followup', label: 'Follow-up', description: 'Contextual follow-ups' },
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
      <label className="text-sm font-medium text-[var(--glass-text-primary)]">
        Surfaces
      </label>
      <div className="flex flex-wrap gap-2">
        {ALL_SURFACES.map(({ value, label, description }) => (
          <button
            key={value}
            onClick={() => toggle(value)}
            disabled={disabled}
            title={description}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              surfaces.includes(value)
                ? 'bg-[var(--neon-green)] text-black'
                : 'bg-[var(--glass-subtle)] text-[var(--glass-text-muted)] hover:text-[var(--glass-text-primary)]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default SurfaceSelector;
```

### 7.3 PromptEditor Integration

**File:** `src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx`

Add imports and integrate components:

```typescript
import { SurfaceSelector } from './SurfaceSelector';
import { HighlightTriggersEditor } from './HighlightTriggersEditor';

// In the editor form, add:

{/* Surfaces */}
<SurfaceSelector
  surfaces={prompt.surfaces ?? ['suggestion']}
  onChange={(surfaces) => updatePrompt({ surfaces })}
  disabled={isReadOnly}
/>

{/* Highlight Triggers (show when highlight surface selected) */}
{prompt.surfaces?.includes('highlight') && (
  <HighlightTriggersEditor
    triggers={prompt.highlightTriggers ?? []}
    onChange={(triggers) => updatePrompt({ highlightTriggers: triggers })}
    disabled={isReadOnly}
  />
)}
```

### 7.4 Filter Addition

**File:** `src/bedrock/consoles/PromptWorkshop/PromptWorkshop.config.ts`

Add to filterOptions:

```typescript
{
  field: 'surfaces',
  label: 'Surface',
  type: 'multi-select',
  options: [
    { value: 'suggestion', label: 'Suggestion' },
    { value: 'highlight', label: 'Highlight' },
    { value: 'journey', label: 'Journey' },
    { value: 'followup', label: 'Follow-up' },
  ],
  defaultValue: [],
},
```

---

## 8. Data Files

### 8.1 Sample Highlight Prompts

**File:** `src/data/prompts/highlights.prompts.json` (NEW)

Create new file with 10+ core concept prompts. Example structure:

```json
{
  "prompts": [
    {
      "id": "highlight-distributed-ownership",
      "objectType": "prompt",
      "surfaces": ["highlight", "suggestion"],
      "highlightTriggers": [
        { "text": "distributed ownership", "matchMode": "exact" }
      ],
      "label": "What does distributed ownership mean?",
      "executionPrompt": "...",
      "systemContext": "...",
      "provenance": { "type": "authored", "reviewStatus": "approved" }
    }
  ]
}
```

### 8.2 Prompt Index Update

**File:** `src/data/prompts/index.ts`

Add import and merge:

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

## 9. File Summary

### New Files

| File | Purpose |
|------|---------|
| `src/core/context-fields/lookup.ts` | Core lookup function |
| `src/explore/hooks/usePromptForHighlight.ts` | React hook |
| `src/bedrock/consoles/PromptWorkshop/SurfaceSelector.tsx` | Surface picker |
| `src/bedrock/consoles/PromptWorkshop/HighlightTriggersEditor.tsx` | Trigger editor |
| `src/data/prompts/highlights.prompts.json` | Sample highlight prompts |

### Modified Files

| File | Change |
|------|--------|
| `src/core/context-fields/types.ts` | Add surfaces, triggers types |
| `src/core/context-fields/index.ts` | Export new types/functions |
| `src/surface/components/KineticStream/ExploreShell.tsx` | Use lookup in click handler |
| `src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx` | Add UI components |
| `src/bedrock/consoles/PromptWorkshop/PromptWorkshop.config.ts` | Add surface filter |
| `src/data/prompts/index.ts` | Import highlight prompts |

---

*Architecture complete. Ready for DECISIONS.md generation.*
