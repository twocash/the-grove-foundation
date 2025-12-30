# Sprint Plan: kinetic-stream-rendering-v1

**Branch:** kinetic-stream-feature  
**Estimated Duration:** 10-12 hours  
**Dependencies:** Sprint 1 (kinetic-stream-schema-v1) must be complete

---

## Epic Overview

| Epic | Description | Stories | Estimate |
|------|-------------|---------|----------|
| 1 | Component Structure | 3 | 1.5h |
| 2 | Token Extensions | 1 | 0.5h |
| 3 | SpanRenderer | 2 | 2h |
| 4 | Block Components | 4 | 2.5h |
| 5 | StreamRenderer | 2 | 1.5h |
| 6 | TerminalChat Integration | 2 | 2h |
| 7 | Testing & Validation | 3 | 2h |

**Total:** 17 stories, ~12 hours

---

## Epic 1: Component Structure

**Goal:** Create directory structure and barrel exports.

### Story 1.1: Create Stream Directory

**Task:** Create `components/Terminal/Stream/` directory with subdirectory for blocks.

```bash
mkdir -p components/Terminal/Stream/blocks
```

**Estimate:** 5 min  
**Build Gate:** Directory exists

---

### Story 1.2: Create Barrel Export

**Task:** Create `components/Terminal/Stream/index.ts` with all exports.

```typescript
// components/Terminal/Stream/index.ts
export { StreamRenderer } from './StreamRenderer';
export { SpanRenderer } from './SpanRenderer';
export { QueryBlock } from './blocks/QueryBlock';
export { ResponseBlock } from './blocks/ResponseBlock';
export { NavigationBlock } from './blocks/NavigationBlock';
export { SystemBlock } from './blocks/SystemBlock';
export type { StreamRendererProps } from './StreamRenderer';
export type { SpanRendererProps } from './SpanRenderer';
```

**Estimate:** 15 min  
**Build Gate:** `npm run typecheck` passes (with stub files)

---

### Story 1.3: Extract MarkdownRenderer

**Task:** Extract `MarkdownRenderer` and `parseInline` from TerminalChat.tsx to separate file.

**Create:** `components/Terminal/MarkdownRenderer.tsx`

**Changes:**
1. Copy `parseInline` function
2. Copy `MarkdownRenderer` component
3. Add exports
4. Update imports in TerminalChat.tsx

**Estimate:** 30 min  
**Build Gate:** 
```bash
npm run typecheck
npm run build
```

---

## Epic 2: Token Extensions

**Goal:** Add CSS tokens for span styling.

### Story 2.1: Add Chat Span Tokens

**Task:** Add `--chat-concept-*`, `--chat-action-*`, `--chat-entity-*` tokens to globals.css.

**Modify:** `src/app/globals.css`

```css
:root {
  /* Chat Span Tokens */
  --chat-concept-text: theme('colors.grove.clay');
  --chat-concept-bg: transparent;
  --chat-concept-bg-hover: rgba(186, 110, 64, 0.1);
  --chat-action-text: theme('colors.primary');
  --chat-action-bg: transparent;
  --chat-entity-text: theme('colors.slate.600');
}

.dark {
  --chat-concept-bg-hover: rgba(186, 110, 64, 0.2);
  --chat-entity-text: theme('colors.slate.300');
}
```

**Estimate:** 30 min  
**Build Gate:** 
```bash
npm run build
# No CSS errors
```

---

## Epic 3: SpanRenderer

**Goal:** Build the core span rendering logic.

### Story 3.1: Implement SpanRenderer

**Task:** Create `SpanRenderer.tsx` with index-based span highlighting.

**Create:** `components/Terminal/Stream/SpanRenderer.tsx`

**Key Features:**
- Accept content string and RhetoricalSpan[]
- Sort spans by startIndex
- Split content by indices
- Wrap spans in SpanElement
- Handle bounds checking

**Estimate:** 1h  
**Build Gate:** 
```bash
npm run typecheck
```

---

### Story 3.2: Implement SpanElement

**Task:** Create private SpanElement component within SpanRenderer module.

**Features:**
- Style mapping by span type (concept, action, entity)
- Click handler for interactive spans
- Aria labels for accessibility
- Token-based styling

**Estimate:** 30 min  
**Build Gate:**
```bash
npm run typecheck
```

---

## Epic 4: Block Components

**Goal:** Create type-specific rendering blocks.

### Story 4.1: Implement QueryBlock

**Task:** Create `blocks/QueryBlock.tsx` for user messages.

**Features:**
- Right-aligned bubble
- "You" label
- Primary background color
- Strip --verbose flag from display

**Estimate:** 30 min  
**Build Gate:** `npm run typecheck`

---

### Story 4.2: Implement ResponseBlock

**Task:** Create `blocks/ResponseBlock.tsx` for AI responses.

**Features:**
- Left-aligned bubble
- "The Grove" label
- Conditional SpanRenderer vs MarkdownRenderer
- Loading state with LoadingIndicator
- Streaming cursor when isGenerating
- Suggested paths rendering

**Estimate:** 1h  
**Build Gate:** `npm run typecheck`

---

### Story 4.3: Implement NavigationBlock

**Task:** Create `blocks/NavigationBlock.tsx` for journey forks.

**Features:**
- Centered or left-aligned
- Intro text
- SuggestionChip for each path
- Path click handler

**Estimate:** 30 min  
**Build Gate:** `npm run typecheck`

---

### Story 4.4: Implement SystemBlock

**Task:** Create `blocks/SystemBlock.tsx` for status messages.

**Features:**
- Centered pill style
- Error styling for error messages
- Muted styling for info messages

**Estimate:** 30 min  
**Build Gate:** `npm run typecheck`

---

## Epic 5: StreamRenderer

**Goal:** Build the polymorphic dispatcher.

### Story 5.1: Implement StreamRenderer

**Task:** Create `StreamRenderer.tsx` with polymorphic dispatch.

**Features:**
- Accept items[] and currentItem
- Combine for rendering
- Switch on item.type
- Pass handlers to blocks
- data-testid attributes

**Estimate:** 1h  
**Build Gate:** `npm run typecheck`

---

### Story 5.2: Add Cognitive Bridge Injection

**Task:** Add bridge injection point in StreamRenderer.

**Features:**
- Accept bridgeState prop
- Inject CognitiveBridge after matching item
- Pass accept/dismiss handlers

**Estimate:** 30 min  
**Build Gate:** 
```bash
npm run typecheck
npm run build
```

---

## Epic 6: TerminalChat Integration

**Goal:** Wire StreamRenderer to TerminalChat.

### Story 6.1: Add Conditional Rendering

**Task:** Modify TerminalChat to conditionally use StreamRenderer.

**Changes:**
1. Import StreamRenderer
2. Get streamHistory from engagement context
3. Conditional: streamHistory.length > 0 ? StreamRenderer : LegacyChat
4. Pass all required props

**Estimate:** 1h  
**Build Gate:**
```bash
npm run build
npm test
```

---

### Story 6.2: Implement Click Handlers

**Task:** Add handleSpanClick and handlePathClick to TerminalChat.

**Features:**
- handleSpanClick: Expand concept into prompt
- handlePathClick: Navigate or submit as prompt
- Wire to StreamRenderer props

**Estimate:** 1h  
**Build Gate:**
```bash
npx playwright test tests/e2e/terminal-baseline.spec.ts
# No visual regression
```

---

## Epic 7: Testing & Validation

**Goal:** Add comprehensive tests.

### Story 7.1: SpanRenderer Unit Tests

**Task:** Create `tests/unit/SpanRenderer.test.tsx`

**Test Cases:**
- Renders content without spans
- Highlights spans at correct positions
- Calls onSpanClick when clicked
- Handles out-of-bounds indices
- Handles multiple spans

**Estimate:** 45 min  
**Build Gate:**
```bash
npm test -- SpanRenderer.test.tsx
# All passing, ≥90% coverage
```

---

### Story 7.2: StreamRenderer Unit Tests

**Task:** Create `tests/unit/StreamRenderer.test.tsx`

**Test Cases:**
- Renders query items as QueryBlock
- Renders response items as ResponseBlock
- Includes currentItem when provided
- Handles empty items array
- Dispatches unknown types gracefully

**Estimate:** 45 min  
**Build Gate:**
```bash
npm test -- StreamRenderer.test.tsx
# All passing
```

---

### Story 7.3: Visual Regression Baseline

**Task:** Create `tests/e2e/stream-rendering-baseline.spec.ts`

**Test Cases:**
- Capture StreamRenderer baseline
- Verify span styling
- Verify block layouts

**Estimate:** 30 min  
**Build Gate:**
```bash
npx playwright test tests/e2e/stream-rendering-baseline.spec.ts --update-snapshots
npx playwright test
# All passing
```

---

## Commit Sequence

1. `feat(stream): create Stream directory and barrel exports`
2. `refactor(terminal): extract MarkdownRenderer to separate file`
3. `style(tokens): add chat span tokens for concept/action/entity`
4. `feat(stream): implement SpanRenderer with index-based highlighting`
5. `feat(stream): implement QueryBlock for user messages`
6. `feat(stream): implement ResponseBlock with span support`
7. `feat(stream): implement NavigationBlock for path buttons`
8. `feat(stream): implement SystemBlock for status messages`
9. `feat(stream): implement StreamRenderer with polymorphic dispatch`
10. `feat(terminal): integrate StreamRenderer with conditional rendering`
11. `test(stream): add SpanRenderer unit tests`
12. `test(stream): add StreamRenderer unit tests`
13. `test(e2e): add stream rendering visual baseline`

---

## Dependencies Graph

```
Epic 1 (Structure)
    ↓
Epic 2 (Tokens) → Epic 3 (SpanRenderer)
                        ↓
                  Epic 4 (Blocks)
                        ↓
                  Epic 5 (StreamRenderer)
                        ↓
                  Epic 6 (Integration)
                        ↓
                  Epic 7 (Testing)
```

---

## Risk Mitigation

| Risk | Story | Mitigation |
|------|-------|------------|
| Sprint 1 not ready | All | Can stub types; wire when ready |
| Span indices off | 3.1 | Bounds checking; defensive code |
| Visual regression | 6.2 | Fallback to MarkdownRenderer |
| Performance | 3.1 | Memoize SpanRenderer |

---

## Definition of Done

- [ ] All stories complete
- [ ] `npm run build` passes
- [ ] `npm test` passes with ≥80% coverage on new files
- [ ] `npx playwright test` passes
- [ ] Visual baselines captured and committed
- [ ] DEVLOG updated with completion notes
- [ ] Branch ready for merge

---

*Sprint plan approved: [Pending]*
