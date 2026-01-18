# Repository Audit: kinetic-highlights-v1

**Sprint:** kinetic-highlights-v1  
**Version:** 1.0  
**Created:** 2025-01-05  
**Depends On:** exploration-node-unification-v1

---

## 1. Strategic Context

### The Pattern We Keep Discovering

Exploration nodes are navigation primitives with:
- **Surface form**: What users see (label, highlighted text, journey step)
- **Execution form**: What LLM processes (rich executionPrompt with context)

| Surface | What User Sees | What LLM Gets | Status |
|---------|---------------|---------------|--------|
| Prompt suggestion | "What's at stake?" | Rich executionPrompt | ✅ Working |
| Kinetic highlight | "distributed ownership" | **span.text only** | ❌ Gap |
| Journey step | "Understand economics" | Rich executionPrompt | ✅ Working |
| Fork navigation | "Tell me more" | queryPayload | ✅ Working |

**The Problem:** Kinetic highlights pass raw surface text to LLM instead of curated prompts.

### DEX-Trellis Alignment

**Anti-pattern to avoid:** Creating parallel `KineticHighlight` type.

**Correct approach:** Extend PromptObject with `surfaces` and `highlightTriggers` fields. One system serves all rendering contexts.

---

## 2. Current State: Kinetic Highlight System

### 2.1 RhetoricalSpan Type

**File:** `src/core/schema/stream.ts` (lines 77-90)

```typescript
export type RhetoricalSpanType =
  | 'concept'  // Bold phrases
  | 'action'   // Arrow prompts
  | 'entity';  // Named entities

export interface RhetoricalSpan {
  id: string;
  text: string;                    // ← Surface form (what user sees)
  type: RhetoricalSpanType;
  startIndex: number;
  endIndex: number;
  conceptId?: string;              // ← Unused! Could link to prompt
  confidence?: number;
}
```

**Observation:** `conceptId` field exists but is never populated or used.

### 2.2 ConceptSpan Component

**File:** `src/surface/components/KineticStream/ActiveRhetoric/ConceptSpan.tsx`

Simple clickable span that:
1. Renders `span.text` with highlight styling
2. Calls `onClick(span)` when clicked

**No lookup logic.** Just passes the span through.

### 2.3 RhetoricRenderer Component  

**File:** `src/surface/components/KineticStream/ActiveRhetoric/RhetoricRenderer.tsx`

Takes content + spans, injects ConceptSpan components at the right positions.

**No prompt awareness.** Just rendering.

### 2.4 ResponseObject Integration

**File:** `src/surface/components/KineticStream/Stream/blocks/ResponseObject.tsx`

```typescript
{hasSpans(item) ? (
  <RhetoricRenderer
    content={item.content}
    spans={item.parsedSpans}
    onSpanClick={onConceptClick}  // ← Passes click up
  />
) : ...}
```

### 2.5 ExploreShell Click Handler

**File:** `src/surface/components/KineticStream/ExploreShell.tsx` (lines 452-461)

```typescript
const handleConceptClick = useCallback((span: RhetoricalSpan, sourceId: string) => {
  const pivotContext: PivotContext = {
    sourceResponseId: sourceId,
    sourceText: span.text,
    sourceContext: `User clicked on the concept "${span.text}" to explore it further.`
  };

  // THE GAP: Uses span.text directly instead of looking up rich prompt
  submit(span.text, { pivot: pivotContext, personaBehaviors: effectivePersonaBehaviors });
}, [submit, effectivePersonaBehaviors]);
```

**This is the injection point.** Instead of `submit(span.text, ...)`, we need:
```typescript
const backingPrompt = lookupPromptForHighlight(span);
submit(span.text, { 
  pivot: pivotContext, 
  executionPrompt: backingPrompt?.executionPrompt  // ← NEW
});
```

---

## 3. Current State: PromptObject System

### 3.1 PromptObject Type

**File:** `src/core/context-fields/types.ts` (lines 105-143)

```typescript
interface PromptObject {
  id: string;
  objectType: 'prompt';
  label: string;                 // Surface form (what user sees)
  executionPrompt: string;       // What LLM processes
  systemContext?: string;        // Rich LLM instruction
  topicAffinities: Affinity[];
  lensAffinities: Affinity[];
  targeting: { stages: Stage[] };
  baseWeight: number;
  // ... more fields
  
  // AFTER exploration-node-unification-v1:
  provenance: PromptProvenance;  // NEW
}
```

### 3.2 What's Missing for Highlights

PromptObject needs:

```typescript
interface PromptObject {
  // ... existing ...
  
  /** Where this prompt can appear */
  surfaces?: PromptSurface[];    // NEW: ['suggestion', 'highlight', 'journey']
  
  /** For highlight surface: trigger text patterns */
  highlightTriggers?: HighlightTrigger[];  // NEW
}

type PromptSurface = 'suggestion' | 'highlight' | 'journey' | 'followup';

interface HighlightTrigger {
  text: string;           // The text that activates this prompt
  matchMode: 'exact' | 'contains' | 'semantic';
  threshold?: number;     // For semantic matching
}
```

---

## 4. Gap Analysis

### Gap 1: RhetoricalSpan Has No Prompt Link

**Current:** Span has `text` but no connection to PromptObject.

**Needed:** Either:
- Populate `conceptId` field with prompt ID, or
- Look up prompt by matching `span.text` against `highlightTriggers`

### Gap 2: PromptObject Has No Surface/Trigger Fields

**Current:** Prompts only appear as suggestions.

**Needed:** Add `surfaces` and `highlightTriggers` fields to PromptObject.

### Gap 3: No Lookup Hook

**Current:** No function to find prompt for a highlight.

**Needed:** `usePromptForHighlight(spanText: string): PromptObject | null`

### Gap 4: ExploreShell Uses Raw Text

**Current:** `submit(span.text, ...)`

**Needed:** `submit(span.text, { executionPrompt: backingPrompt.executionPrompt, ... })`

### Gap 5: No Highlight Extraction in RAG

**Current:** RAG returns documents, concepts extracted for display only.

**Needed:** When concepts are extracted, look up or generate backing prompts.

### Gap 6: No Admin UI for Highlight Prompts

**Current:** Prompt Workshop manages suggestions only.

**Needed:** Add highlight trigger editor to Prompt Workshop.

---

## 5. Files to Modify

### Core Types (Layer: Bedrock)

| File | Change |
|------|--------|
| `src/core/context-fields/types.ts` | Add `surfaces`, `highlightTriggers` to PromptObject |

### Prompt Lookup (Layer: Core)

| File | Change |
|------|--------|
| `src/core/context-fields/lookup.ts` | NEW: `findPromptForHighlight()` function |
| `src/explore/hooks/usePromptForHighlight.ts` | NEW: Hook for component use |

### Kinetic Integration (Layer: Surface)

| File | Change |
|------|--------|
| `src/surface/components/KineticStream/ExploreShell.tsx` | Use lookup in handleConceptClick |
| `src/surface/components/KineticStream/ActiveRhetoric/ConceptSpan.tsx` | Optional: show tooltip with prompt label |

### Prompt Workshop (Layer: Bedrock Admin)

| File | Change |
|------|--------|
| `src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx` | Add highlight triggers editor |
| `src/bedrock/consoles/PromptWorkshop/PromptWorkshop.config.ts` | Add surface filter |

### Data Files

| File | Change |
|------|--------|
| `src/data/prompts/base.prompts.json` | Add highlightTriggers to select prompts |

---

## 6. Integration with exploration-node-unification-v1

This sprint **extends** the unified prompt model:

| Field | exploration-node-unification-v1 | kinetic-highlights-v1 |
|-------|--------------------------------|----------------------|
| provenance | ✅ Added | Uses existing |
| surfaces | - | ✅ NEW |
| highlightTriggers | - | ✅ NEW |

**Dependency:** Must complete exploration-node-unification-v1 first so provenance exists.

---

## 7. Provenance for Highlights

Highlights have provenance like any exploration node:

| Type | Source | Example |
|------|--------|---------|
| authored | Human wrote prompt with triggers | "distributed ownership" → curated explanation |
| extracted | RAG identifies key concept | Document about Grove → extract core concepts |
| generated | Gap analysis | Frequently clicked text with no backing prompt |
| emergent | User behavior | Click patterns reveal important concepts |

---

## 8. Scope Boundaries

### In Scope

1. Extend PromptObject with surfaces and highlightTriggers
2. Create lookup hook for highlight → prompt
3. Wire ExploreShell to use lookup
4. Add highlight editor to Prompt Workshop
5. Author sample highlights for core concepts

### Out of Scope (Future)

1. Automatic extraction during RAG (future sprint)
2. Semantic matching for fuzzy highlights (future sprint)
3. Highlight generation from gap analysis (future sprint)
4. Provenance chain visualization (future sprint)

---

## 9. Success Metrics

1. User clicks "distributed ownership" → LLM gets rich prompt, not raw text
2. Prompt Workshop shows highlight triggers
3. Build passes with extended PromptObject
4. At least 10 core concepts have backing prompts

---

*Audit complete. Ready for SPEC.md generation.*
