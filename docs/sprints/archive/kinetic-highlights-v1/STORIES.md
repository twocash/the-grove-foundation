# Sprint Stories: kinetic-highlights-v1

**Sprint:** kinetic-highlights-v1  
**Version:** 1.0  
**Created:** 2025-01-05  
**Depends On:** exploration-node-unification-v1  
**Estimated Effort:** 21 points (~2 days)

---

## Epic 1: Type Foundation (4 points)

Extend PromptObject with surfaces and highlight trigger support.

### Story 1.1: Add Surface Types (2 points)

**Task:** Add surface-related types to `src/core/context-fields/types.ts`

**Implementation:**
1. Add `PromptSurface` type union
2. Add `HighlightMatchMode` type
3. Add `HighlightTrigger` interface
4. Add `DEFAULT_PROMPT_SURFACES` constant
5. Add `canRenderOnSurface()` helper
6. Add `getPromptSurfaces()` helper

**Acceptance Criteria:**
- [ ] Types compile without errors
- [ ] Helpers work correctly
- [ ] Export from index.ts

---

### Story 1.2: Extend PromptObject (2 points)

**Task:** Add surfaces and highlightTriggers fields to PromptObject

**Implementation:**
1. Add `surfaces?: PromptSurface[]` field
2. Add `highlightTriggers?: HighlightTrigger[]` field
3. Verify existing prompts still work (optional fields)

**Acceptance Criteria:**
- [ ] Fields added to interface
- [ ] Existing code compiles
- [ ] Build passes

---

### Build Gate: Epic 1

```bash
npm run build
```

---

## Epic 2: Lookup Logic (5 points)

Create core lookup function and React hook.

### Story 2.1: Create Lookup Module (3 points)

**Task:** Create `src/core/context-fields/lookup.ts`

**Implementation:**
1. Create `findPromptForHighlight()` function
2. Implement exact match logic
3. Implement contains match logic
4. Implement affinity fallback
5. Create `getHighlightPrompts()` helper
6. Create `hasMatchingPrompt()` helper
7. Export from index

**Acceptance Criteria:**
- [ ] Exact match works
- [ ] Contains match works
- [ ] Returns null when no match
- [ ] Case-insensitive by default

**Tests:**
```typescript
// Exact match
const prompt = findPromptForHighlight('distributed ownership', prompts);
expect(prompt?.id).toBe('highlight-distributed-ownership');

// Contains match
const prompt2 = findPromptForHighlight('about distributed ownership of AI', prompts);
expect(prompt2).not.toBeNull();

// No match
const prompt3 = findPromptForHighlight('random text', prompts);
expect(prompt3).toBeNull();
```

---

### Story 2.2: Create React Hook (2 points)

**Task:** Create `src/explore/hooks/usePromptForHighlight.ts`

**Implementation:**
1. Create hook that uses `usePromptData`
2. Memoize highlight prompts filter
3. Wrap `findPromptForHighlight` in callback
4. Return `{ findPrompt, highlightPrompts, isReady }`
5. Export from hooks index

**Acceptance Criteria:**
- [ ] Hook loads prompts
- [ ] findPrompt function works
- [ ] isReady tracks loading state

---

### Build Gate: Epic 2

```bash
npm run build
# Manual test in console:
# import { usePromptForHighlight } from '@explore/hooks';
```

---

## Epic 3: ExploreShell Integration (4 points)

Wire lookup into click handler.

### Story 3.1: Update handleConceptClick (4 points)

**Task:** Modify ExploreShell to use prompt lookup on highlight clicks

**Implementation:**
1. Import `usePromptForHighlight` hook
2. Add hook usage in component
3. Update `handleConceptClick` to:
   - Call `findPrompt(span.text, context)`
   - If found: use `executionPrompt` and `systemContext`
   - If not found: use enhanced fallback prompt
4. Verify submit receives correct parameters

**Acceptance Criteria:**
- [ ] Hook imported and used
- [ ] Lookup called on click
- [ ] Rich prompt sent when match found
- [ ] Fallback sent when no match
- [ ] Display text still shows surface text

**Test Flow:**
1. Click highlight with backing prompt → rich response
2. Click highlight without backing prompt → fallback (enhanced)

---

### Build Gate: Epic 3

```bash
npm run build
npm run dev
# Manual test: click highlight, verify behavior
```

---

## Epic 4: Content Creation (4 points)

Author backing prompts for core concepts.

### Story 4.1: Create Highlight Prompts File (2 points)

**Task:** Create `src/data/prompts/highlights.prompts.json`

**Implementation:**
1. Create JSON file with prompts array
2. Update `src/data/prompts/index.ts` to import
3. Verify prompts load in libraryPrompts

**Core Concepts to Cover (minimum 10):**

| Concept | Topic Area |
|---------|------------|
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

**Acceptance Criteria:**
- [ ] JSON file valid
- [ ] Index imports file
- [ ] Prompts appear in libraryPrompts

---

### Story 4.2: Author Prompt Content (2 points)

**Task:** Write rich executionPrompt and systemContext for each concept

**Template per prompt:**
```json
{
  "id": "highlight-{slug}",
  "label": "{Simple question}",
  "executionPrompt": "{First-person curious question with context}",
  "systemContext": "{LLM instruction: framing, tone, connections}",
  "surfaces": ["highlight", "suggestion"],
  "highlightTriggers": [{ "text": "{concept}", "matchMode": "exact" }]
}
```

**Quality Criteria:**
- executionPrompt: 50-100 words, first-person, curious
- systemContext: 30-60 words, instruction for LLM
- Triggers: exact match on primary form

**Acceptance Criteria:**
- [ ] 10+ prompts authored
- [ ] Each has executionPrompt
- [ ] Each has systemContext
- [ ] Each has triggers

---

### Build Gate: Epic 4

```bash
npm run build
# Verify prompts load:
node -e "const { libraryPrompts } = require('./src/data/prompts'); console.log('Highlight prompts:', libraryPrompts.filter(p => p.surfaces?.includes('highlight')).length);"
```

---

## Epic 5: Admin UI (4 points)

Update Prompt Workshop for highlight management.

### Story 5.1: Create UI Components (2 points)

**Task:** Create SurfaceSelector and HighlightTriggersEditor components

**Implementation:**
1. Create `SurfaceSelector.tsx` - multi-toggle for surfaces
2. Create `HighlightTriggersEditor.tsx` - chip-based trigger management
3. Style to match Prompt Workshop design

**Acceptance Criteria:**
- [ ] SurfaceSelector shows all 4 surfaces
- [ ] Toggles work correctly
- [ ] TriggersEditor shows chips
- [ ] Can add new triggers
- [ ] Can remove triggers

---

### Story 5.2: Integrate into PromptEditor (2 points)

**Task:** Add surface and trigger UI to PromptEditor

**Implementation:**
1. Import components
2. Add SurfaceSelector to form
3. Conditionally show TriggersEditor when 'highlight' selected
4. Connect to prompt state

**Acceptance Criteria:**
- [ ] Surfaces visible in editor
- [ ] Triggers visible when highlight surface selected
- [ ] Changes update prompt state
- [ ] Can save prompt with triggers

---

### Story 5.3: Add Surface Filter (Bonus)

**Task:** Add surface filter to Prompt Workshop config

**Implementation:**
1. Add filter option to config
2. Implement multi-select filter logic

**Acceptance Criteria:**
- [ ] Can filter by surface
- [ ] Filter combines with other filters

---

### Build Gate: Epic 5

```bash
npm run build
npm run dev
# Visual test: open Prompt Workshop, create/edit prompt with triggers
```

---

## Summary

| Epic | Stories | Points | Focus |
|------|---------|--------|-------|
| 1. Type Foundation | 2 | 4 | Types + helpers |
| 2. Lookup Logic | 2 | 5 | Core lookup + hook |
| 3. ExploreShell | 1 | 4 | Handler integration |
| 4. Content | 2 | 4 | Sample prompts |
| 5. Admin UI | 3 | 4 | Workshop updates |
| **Total** | **10** | **21** | |

---

## Execution Order

**Day 1:**
- Epic 1: Type Foundation (2h)
- Epic 2: Lookup Logic (3h)
- Epic 3: ExploreShell Integration (2h)

**Day 2:**
- Epic 4: Content Creation (3h)
- Epic 5: Admin UI (3h)
- Testing + polish (2h)

---

*Stories complete. Ready for EXECUTION_PROMPT.md generation.*
