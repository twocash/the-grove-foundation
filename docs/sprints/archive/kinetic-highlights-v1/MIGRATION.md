# Migration Map: kinetic-highlights-v1

**Sprint:** kinetic-highlights-v1  
**Version:** 1.0  
**Created:** 2025-01-05

---

## 1. Overview

This sprint extends existing patterns with minimal breaking changes. All modifications are additive.

### Migration Scope

| Component | Migration Type | Risk |
|-----------|---------------|------|
| PromptObject type | Extend (add fields) | Low |
| Core lookup function | NEW | Low |
| React hook | NEW | Low |
| ExploreShell handler | Modify (add logic) | Medium |
| Prompt Workshop UI | Extend (add components) | Low |
| Prompt data files | NEW file + extend index | Low |

---

## 2. Type Extensions

### 2.1 PromptSurface and HighlightTrigger Types

**File:** `src/core/context-fields/types.ts`

**Action:** ADD after PromptProvenance section (after exploration-node-unification types)

```typescript
// ============================================================================
// PROMPT SURFACES (Multi-context rendering)
// Sprint: kinetic-highlights-v1
// ============================================================================

export type PromptSurface = 'suggestion' | 'highlight' | 'journey' | 'followup';

export type HighlightMatchMode = 'exact' | 'contains';

export interface HighlightTrigger {
  text: string;
  matchMode: HighlightMatchMode;
  caseSensitive?: boolean;
}

export const DEFAULT_PROMPT_SURFACES: PromptSurface[] = ['suggestion'];

export function canRenderOnSurface(
  prompt: PromptObject, 
  surface: PromptSurface
): boolean {
  const surfaces = prompt.surfaces ?? DEFAULT_PROMPT_SURFACES;
  return surfaces.includes(surface);
}

export function getPromptSurfaces(prompt: PromptObject): PromptSurface[] {
  return prompt.surfaces ?? DEFAULT_PROMPT_SURFACES;
}
```

### 2.2 PromptObject Extension

**File:** `src/core/context-fields/types.ts`

**Action:** ADD to PromptObject interface (after embedding field from exploration-node-unification)

```typescript
  // === Sprint: kinetic-highlights-v1 ===
  
  /** Where this prompt can appear (default: ['suggestion']) */
  surfaces?: PromptSurface[];
  
  /** For highlight surface: text patterns that trigger this prompt */
  highlightTriggers?: HighlightTrigger[];
```

---

## 3. New Files

### 3.1 Lookup Module

**File:** `src/core/context-fields/lookup.ts` (NEW)

See ARCHITECTURE.md Section 4.1 for full implementation.

### 3.2 React Hook

**File:** `src/explore/hooks/usePromptForHighlight.ts` (NEW)

See ARCHITECTURE.md Section 5.1 for full implementation.

### 3.3 UI Components

**Files:** 
- `src/bedrock/consoles/PromptWorkshop/SurfaceSelector.tsx` (NEW)
- `src/bedrock/consoles/PromptWorkshop/HighlightTriggersEditor.tsx` (NEW)

See ARCHITECTURE.md Section 7 for implementations.

### 3.4 Highlight Prompts Data

**File:** `src/data/prompts/highlights.prompts.json` (NEW)

Template:
```json
{
  "prompts": [
    {
      "id": "highlight-{concept-slug}",
      "objectType": "prompt",
      "created": 1736121600000,
      "modified": 1736121600000,
      "author": "system",
      "label": "{Question form}",
      "description": "Backing prompt for '{trigger text}' highlight",
      "executionPrompt": "{Rich first-person curious question}",
      "systemContext": "{LLM instruction}",
      "tags": ["highlight", "core-concept"],
      "topicAffinities": [],
      "lensAffinities": [{ "lensId": "base", "weight": 1.0 }],
      "targeting": { "stages": ["exploration", "synthesis"] },
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
        { "text": "{trigger text}", "matchMode": "exact" }
      ]
    }
  ]
}
```

---

## 4. Modified Files

### 4.1 Core Index Export

**File:** `src/core/context-fields/index.ts`

**Action:** ADD exports

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

### 4.2 Explore Hooks Index

**File:** `src/explore/hooks/index.ts`

**Action:** ADD export

```typescript
export { usePromptForHighlight } from './usePromptForHighlight';
```

### 4.3 ExploreShell.tsx

**File:** `src/surface/components/KineticStream/ExploreShell.tsx`

**Action 1:** ADD import

```typescript
import { usePromptForHighlight } from '@explore/hooks/usePromptForHighlight';
```

**Action 2:** ADD hook usage (in component body)

```typescript
// Sprint: kinetic-highlights-v1 - Look up backing prompts for highlights
const { findPrompt, isReady: highlightsReady } = usePromptForHighlight();
```

**Action 3:** REPLACE handleConceptClick

See ARCHITECTURE.md Section 6.3 for updated handler.

### 4.4 Prompt Data Index

**File:** `src/data/prompts/index.ts`

**Action:** ADD import and merge

```typescript
import highlightPrompts from './highlights.prompts.json';

export const libraryPrompts: PromptObject[] = [
  ...basePrompts.prompts,
  ...wayneTurnerPrompts.prompts,
  ...drChiangPrompts.prompts,
  ...highlightPrompts.prompts,  // NEW
];
```

### 4.5 PromptEditor.tsx

**File:** `src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx`

**Action 1:** ADD imports

```typescript
import { SurfaceSelector } from './SurfaceSelector';
import { HighlightTriggersEditor } from './HighlightTriggersEditor';
```

**Action 2:** ADD to form (in appropriate location)

```tsx
{/* Sprint: kinetic-highlights-v1 - Surfaces and Triggers */}
<div className="space-y-4">
  <SurfaceSelector
    surfaces={prompt.surfaces ?? ['suggestion']}
    onChange={(surfaces) => updatePrompt({ surfaces })}
    disabled={isReadOnly}
  />
  
  {prompt.surfaces?.includes('highlight') && (
    <HighlightTriggersEditor
      triggers={prompt.highlightTriggers ?? []}
      onChange={(triggers) => updatePrompt({ highlightTriggers: triggers })}
      disabled={isReadOnly}
    />
  )}
</div>
```

### 4.6 PromptWorkshop.config.ts

**File:** `src/bedrock/consoles/PromptWorkshop/PromptWorkshop.config.ts`

**Action:** ADD to filterOptions array

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

## 5. Migration Checklist

### Phase 1: Type Foundation
- [ ] Add PromptSurface type to types.ts
- [ ] Add HighlightTrigger interface to types.ts
- [ ] Add surfaces field to PromptObject
- [ ] Add highlightTriggers field to PromptObject
- [ ] Add helper functions (canRenderOnSurface, etc.)
- [ ] Export from index.ts

### Phase 2: Lookup Logic
- [ ] Create lookup.ts with findPromptForHighlight
- [ ] Create usePromptForHighlight hook
- [ ] Export from respective index files
- [ ] Unit test lookup function

### Phase 3: ExploreShell Integration
- [ ] Add hook import to ExploreShell
- [ ] Add hook usage in component
- [ ] Update handleConceptClick handler
- [ ] Test click → prompt lookup → submit flow

### Phase 4: Data Content
- [ ] Create highlights.prompts.json
- [ ] Author 10+ core concept prompts
- [ ] Update prompts index to import
- [ ] Verify prompts load correctly

### Phase 5: Admin UI
- [ ] Create SurfaceSelector component
- [ ] Create HighlightTriggersEditor component
- [ ] Integrate into PromptEditor
- [ ] Add surface filter to config
- [ ] Visual test in Prompt Workshop

### Phase 6: Verification
- [ ] Build passes: `npm run build`
- [ ] Manual test: click highlight → rich response
- [ ] Manual test: Prompt Workshop editing
- [ ] Manual test: surface filter

---

## 6. Rollback Plan

If issues arise:

1. **Type changes:** Safe to leave (optional fields)
2. **Lookup module:** Delete lookup.ts, remove imports
3. **ExploreShell:** Revert to previous handleConceptClick (one file)
4. **Data file:** Remove highlights.prompts.json import
5. **UI components:** Remove imports from PromptEditor

All changes are isolated. Rollback is straightforward.

---

*Migration map complete. Ready for STORIES.md generation.*
