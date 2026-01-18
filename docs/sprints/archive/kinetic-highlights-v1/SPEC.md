# Specification: kinetic-highlights-v1

**Sprint:** kinetic-highlights-v1  
**Version:** 1.0  
**Created:** 2025-01-05  
**Depends On:** exploration-node-unification-v1

---

## 1. Overview

### Problem Statement

Kinetic highlights (clickable concepts in AI responses) pass raw surface text to the LLM instead of curated, context-rich prompts. This produces generic responses rather than engaging exploration.

**Current flow:**
```
User clicks "distributed ownership" → LLM receives "distributed ownership" → Generic explanation
```

**Desired flow:**
```
User clicks "distributed ownership" → Lookup backing prompt → LLM receives rich executionPrompt → Engaging, targeted response
```

### Goal

Extend the unified PromptObject model to serve highlights, enabling curated prompts behind clickable concepts in kinetic text.

---

## 2. Functional Requirements

### FR-001: PromptObject Surface Field (Must)

Add `surfaces` field to PromptObject indicating where it can render.

```typescript
type PromptSurface = 'suggestion' | 'highlight' | 'journey' | 'followup';

interface PromptObject {
  // ... existing ...
  surfaces?: PromptSurface[];  // Default: ['suggestion']
}
```

### FR-002: PromptObject Highlight Triggers (Must)

Add `highlightTriggers` field for text-to-prompt mapping.

```typescript
interface HighlightTrigger {
  text: string;
  matchMode: 'exact' | 'contains';
  caseSensitive?: boolean;
}

interface PromptObject {
  // ... existing ...
  highlightTriggers?: HighlightTrigger[];
}
```

### FR-003: Highlight Lookup Function (Must)

Create function to find prompt for highlighted text.

```typescript
function findPromptForHighlight(
  spanText: string,
  prompts: PromptObject[],
  context?: { lens?: string; stage?: string }
): PromptObject | null;
```

Priority:
1. Exact match on trigger text
2. Contains match on trigger text
3. Affinity scoring with context (lens/stage)

### FR-004: ExploreShell Integration (Must)

Update `handleConceptClick` to use backing prompt.

```typescript
const handleConceptClick = useCallback((span: RhetoricalSpan, sourceId: string) => {
  const backingPrompt = findPromptForHighlight(span.text, prompts, context);
  
  submit(span.text, {
    pivot: pivotContext,
    executionPrompt: backingPrompt?.executionPrompt,  // NEW
    systemContext: backingPrompt?.systemContext,      // NEW
  });
}, [...]);
```

### FR-005: Prompt Workshop Highlight Editor (Should)

Add UI for managing highlight triggers in PromptEditor.

- Display existing triggers as chips
- Add new trigger with text + match mode
- Delete triggers
- Preview matching behavior

### FR-006: Surface Filter in Prompt Workshop (Should)

Add filter option for prompt surfaces in admin UI.

```typescript
{
  field: 'surfaces',
  label: 'Surface',
  type: 'multi-select',
  options: ['suggestion', 'highlight', 'journey', 'followup'],
}
```

### FR-007: Sample Highlight Prompts (Must)

Author backing prompts for core Grove concepts:

| Trigger Text | Topic |
|-------------|-------|
| distributed ownership | infrastructure-bet |
| hybrid architecture | architecture |
| credit economy | economics |
| local inference | architecture |
| efficiency tax | economics |
| knowledge commons | community |
| capability propagation | ratchet-thesis |
| epistemic independence | philosophy |
| AI villages | vision |
| gardener | roles |

Minimum 10 concepts with full executionPrompt + systemContext.

### FR-008: Fallback Behavior (Must)

When no backing prompt found, use enhanced surface text:

```typescript
const fallbackPrompt = `Tell me more about "${spanText}" in the context of what we've been discussing.`;
```

Better than raw text, but not as good as curated prompt.

---

## 3. Data Model

### 3.1 Type Extensions

**File:** `src/core/context-fields/types.ts`

```typescript
// ============================================================================
// PROMPT SURFACES (Multi-context rendering)
// Sprint: kinetic-highlights-v1
// ============================================================================

export type PromptSurface = 'suggestion' | 'highlight' | 'journey' | 'followup';

export interface HighlightTrigger {
  /** Text that activates this prompt */
  text: string;
  /** How to match: exact or substring */
  matchMode: 'exact' | 'contains';
  /** Case sensitivity (default: false) */
  caseSensitive?: boolean;
}

// Add to PromptObject interface:
export interface PromptObject {
  // ... existing fields ...
  
  // === NEW: Sprint kinetic-highlights-v1 ===
  
  /** Where this prompt can appear (default: ['suggestion']) */
  surfaces?: PromptSurface[];
  
  /** For highlight surface: text patterns that trigger this prompt */
  highlightTriggers?: HighlightTrigger[];
}
```

### 3.2 Default Values

```typescript
// When surfaces not specified, default to suggestion only
const DEFAULT_SURFACES: PromptSurface[] = ['suggestion'];

// Helper to check if prompt can render on surface
export function canRenderOnSurface(prompt: PromptObject, surface: PromptSurface): boolean {
  const surfaces = prompt.surfaces ?? DEFAULT_SURFACES;
  return surfaces.includes(surface);
}
```

---

## 4. Lookup Algorithm

### 4.1 Match Priority

```typescript
function findPromptForHighlight(
  spanText: string,
  prompts: PromptObject[],
  context?: { lensId?: string; stage?: string }
): PromptObject | null {
  
  // Filter to highlight-capable prompts
  const highlightPrompts = prompts.filter(p => 
    canRenderOnSurface(p, 'highlight') && 
    p.highlightTriggers?.length
  );
  
  // Priority 1: Exact match
  const exactMatch = highlightPrompts.find(p =>
    p.highlightTriggers!.some(t => 
      t.matchMode === 'exact' && 
      matchText(spanText, t.text, t.caseSensitive)
    )
  );
  if (exactMatch) return exactMatch;
  
  // Priority 2: Contains match
  const containsMatch = highlightPrompts.find(p =>
    p.highlightTriggers!.some(t => 
      t.matchMode === 'contains' && 
      containsText(spanText, t.text, t.caseSensitive)
    )
  );
  if (containsMatch) return containsMatch;
  
  // Priority 3: Context-aware scoring (lens/stage affinity)
  if (context) {
    return findBestAffinity(highlightPrompts, context);
  }
  
  return null;
}

function matchText(span: string, trigger: string, caseSensitive?: boolean): boolean {
  if (caseSensitive) return span === trigger;
  return span.toLowerCase() === trigger.toLowerCase();
}

function containsText(span: string, trigger: string, caseSensitive?: boolean): boolean {
  if (caseSensitive) return span.includes(trigger);
  return span.toLowerCase().includes(trigger.toLowerCase());
}
```

---

## 5. Sample Highlight Prompt

Example entry in `base.prompts.json`:

```json
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
    { "lensId": "base", "weight": 1.0 },
    { "lensId": "4B", "weight": 0.9 }
  ],
  "targeting": {
    "stages": ["exploration", "synthesis"]
  },
  "baseWeight": 70,
  "stats": { "impressions": 0, "selections": 0, "completions": 0 },
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
    { "text": "distributed ownership", "matchMode": "exact" },
    { "text": "distribute ownership", "matchMode": "contains" }
  ]
}
```

---

## 6. Integration Points

### 6.1 handleConceptClick Update

**File:** `src/surface/components/KineticStream/ExploreShell.tsx`

```typescript
// Import
import { usePromptForHighlight } from '@explore/hooks/usePromptForHighlight';

// In component
const { findPrompt, prompts } = usePromptForHighlight();

const handleConceptClick = useCallback((span: RhetoricalSpan, sourceId: string) => {
  const pivotContext: PivotContext = {
    sourceResponseId: sourceId,
    sourceText: span.text,
    sourceContext: `User clicked on the concept "${span.text}" to explore it further.`
  };

  // NEW: Look up backing prompt
  const backingPrompt = findPrompt(span.text, { lensId: lens, stage });
  
  if (backingPrompt) {
    // Use rich prompt
    submit(span.text, { 
      pivot: pivotContext, 
      executionPrompt: backingPrompt.executionPrompt,
      systemContext: backingPrompt.systemContext,
      personaBehaviors: effectivePersonaBehaviors 
    });
  } else {
    // Fallback: enhanced surface text
    const fallbackPrompt = `Tell me more about "${span.text}" in the context of what we've been discussing.`;
    submit(span.text, { 
      pivot: pivotContext, 
      executionPrompt: fallbackPrompt,
      personaBehaviors: effectivePersonaBehaviors 
    });
  }
}, [submit, effectivePersonaBehaviors, findPrompt, lens, stage]);
```

### 6.2 Submit Function Update

Ensure `submit()` accepts and uses `executionPrompt` and `systemContext` options.

Check: `src/explore/hooks/useConversation.ts` or wherever submit is defined.

---

## 7. Acceptance Criteria

### AC-001: Type Extensions
- [ ] `PromptSurface` type exported from types.ts
- [ ] `HighlightTrigger` interface exported
- [ ] `surfaces` field added to PromptObject
- [ ] `highlightTriggers` field added to PromptObject
- [ ] `canRenderOnSurface()` helper function exists

### AC-002: Lookup Function
- [ ] `findPromptForHighlight()` exists in core
- [ ] Exact match works correctly
- [ ] Contains match works correctly
- [ ] Returns null when no match
- [ ] Context-aware fallback works

### AC-003: Hook Integration
- [ ] `usePromptForHighlight` hook exists
- [ ] Hook returns findPrompt function
- [ ] Hook loads highlight-capable prompts

### AC-004: ExploreShell Integration
- [ ] handleConceptClick uses lookup
- [ ] Backing prompt's executionPrompt sent to LLM
- [ ] Fallback behavior works when no match

### AC-005: Sample Content
- [ ] At least 10 core concepts have backing prompts
- [ ] Prompts include surfaces: ['highlight']
- [ ] Prompts include highlightTriggers

### AC-006: Admin UI
- [ ] Prompt Workshop shows surface filter
- [ ] PromptEditor shows highlight triggers section
- [ ] Can add/remove triggers

### AC-007: Build & Test
- [ ] Build passes: `npm run build`
- [ ] No type errors
- [ ] Manual test: click highlight → see rich response

---

## 8. Non-Functional Requirements

### NFR-001: Performance

Lookup should be O(n) where n = number of prompts. For current 66 prompts, imperceptible.

### NFR-002: Backward Compatibility

Existing prompts without `surfaces` default to `['suggestion']` behavior. No breaking changes.

### NFR-003: DEX Compliance

- Single PromptObject type serves all surfaces
- No parallel type systems
- Provenance tracked consistently

---

## 9. Out of Scope

| Feature | Reason | Future Sprint |
|---------|--------|---------------|
| Semantic matching | Requires embedding | kinetic-highlights-v2 |
| Auto-extraction | Requires RAG integration | rag-highlight-extraction-v1 |
| Gap-based generation | Requires click analytics | highlight-gap-analysis-v1 |
| Provenance chain UI | Nice to have | exploration-provenance-v1 |

---

*Specification complete. Ready for ARCHITECTURE.md generation.*
