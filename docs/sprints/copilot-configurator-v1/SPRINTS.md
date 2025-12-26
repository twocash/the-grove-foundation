# Sprint Breakdown: Copilot Configurator v1

**Sprint:** copilot-configurator-v1  
**Total Estimate:** 6-8 hours  
**Epics:** 5

---

## Epic 1: Core Infrastructure (2 hours)

### Story 1.1: Type Definitions

**Task:** Create `src/core/copilot/schema.ts` with all TypeScript interfaces.

**Includes:**
- CopilotMessage interface
- ParsedIntent types
- JsonPatch types (aligned with fast-json-patch)
- ValidationResult types
- ModelConfig interface
- CopilotState interface

**Tests:** TypeScript compilation (no runtime tests needed for types)

**Acceptance:**
- [ ] All types exported from index.ts
- [ ] No TypeScript errors

---

### Story 1.2: Intent Parser

**Task:** Create `src/core/copilot/parser.ts` with pattern-based intent extraction.

**Includes:**
- INTENT_PATTERNS array with regex patterns
- parseIntent() function
- Support for: SET_FIELD, UPDATE_FIELD, ADD_TAG, REMOVE_TAG, TOGGLE_FAVORITE

**Tests:**
```typescript
describe('parseIntent', () => {
  it('parses SET_FIELD', () => ...);
  it('parses ADD_TAG', () => ...);
  it('returns UNKNOWN for gibberish', () => ...);
});
```

**Acceptance:**
- [ ] All defined patterns recognized
- [ ] Unknown input returns UNKNOWN type
- [ ] Unit tests pass

---

### Story 1.3: Patch Generator

**Task:** Create `src/core/copilot/patch-generator.ts`.

**Includes:**
- FIELD_PATH_MAP for field → JSON path resolution
- generatePatch() function
- getValueAtPath() helper
- applyModifier() for UPDATE_FIELD (placeholder for MVP)

**Tests:**
```typescript
describe('generatePatch', () => {
  it('generates replace for SET_FIELD', () => ...);
  it('generates add for ADD_TAG', () => ...);
});
```

**Acceptance:**
- [ ] Correct patch operations for each intent type
- [ ] Paths resolve correctly

---

### Story 1.4: Validator

**Task:** Create `src/core/copilot/validator.ts`.

**Includes:**
- validatePatch() function
- Check for valid paths
- Check for type mismatches
- Check for required fields

**Tests:**
```typescript
describe('validatePatch', () => {
  it('accepts valid path', () => ...);
  it('rejects invalid path', () => ...);
});
```

**Acceptance:**
- [ ] Invalid paths caught
- [ ] Clear error messages

---

### Story 1.5: Simulator & Suggestions

**Task:** Create `src/core/copilot/simulator.ts` and `suggestions.ts`.

**Includes:**
- RESPONSE_TEMPLATES object
- simulateResponse() async function with delay
- SUGGESTIONS_BY_TYPE configuration
- getSuggestionsForType() function

**Acceptance:**
- [ ] Responses feel natural
- [ ] Delay is randomized (500-1500ms)
- [ ] Suggestions exist for each object type

---

### Build Gate 1

```bash
npm run build
npm test -- --testPathPattern=copilot
```

All core infrastructure compiles and unit tests pass.

---

## Epic 2: UI Components (2 hours)

### Story 2.1: Styling Tokens

**Task:** Add `--copilot-*` tokens to `globals.css`.

**Includes:**
- Background colors
- Border colors
- Message colors (assistant vs user)
- Button colors
- Diff colors (add/remove)
- Model indicator colors

**Acceptance:**
- [ ] Tokens defined in :root
- [ ] No hardcoded colors in Copilot components

---

### Story 2.2: CopilotMessage Component

**Task:** Create `src/shared/inspector/CopilotMessage.tsx`.

**Includes:**
- Props: message, onApply?, onRetry?
- Avatar (bot vs user icon)
- Timestamp display
- Conditional DiffPreview rendering
- Conditional action buttons

**Acceptance:**
- [ ] Assistant messages left-aligned
- [ ] User messages right-aligned
- [ ] Diff preview shows when patch present

---

### Story 2.3: DiffPreview Component

**Task:** Create `src/shared/inspector/DiffPreview.tsx`.

**Includes:**
- Props: patch, object
- Red strikethrough for removals
- Green text for additions
- Monospace font styling

**Acceptance:**
- [ ] Visual matches mockup
- [ ] Handles multi-operation patches

---

### Story 2.4: SuggestedActions Component

**Task:** Create `src/shared/inspector/SuggestedActions.tsx`.

**Includes:**
- Props: suggestions, onSelect
- Clickable chip styling
- Hover states

**Acceptance:**
- [ ] Chips render inline
- [ ] Click triggers onSelect with template

---

### Build Gate 2

```bash
npm run build
# Components compile in isolation
```

---

## Epic 3: State Management (1.5 hours)

### Story 3.1: useCopilot Hook

**Task:** Create `src/shared/inspector/hooks/useCopilot.ts`.

**Includes:**
- useReducer for state management
- sendMessage() async function
- applyPatch() function
- rejectPatch() function
- toggleCollapse() function
- Session storage for collapse state

**State Shape:**
```typescript
{
  messages: CopilotMessage[];
  isProcessing: boolean;
  isCollapsed: boolean;
  currentModel: ModelConfig;
}
```

**Acceptance:**
- [ ] Messages accumulate correctly
- [ ] Processing state toggles during send
- [ ] Collapse state persists in session

---

### Story 3.2: CopilotPanel Container

**Task:** Create `src/shared/inspector/CopilotPanel.tsx`.

**Includes:**
- Header with title, badge, collapse toggle
- MessageHistory (scrollable)
- InputArea with textarea and buttons
- Footer with model indicator
- Wire to useCopilot hook

**Acceptance:**
- [ ] Full interaction flow works
- [ ] Collapse/expand animates smoothly
- [ ] Input clears after send

---

### Build Gate 3

```bash
npm run build
npm test
# Hook and panel work in isolation
```

---

## Epic 4: Integration (1 hour)

### Story 4.1: InspectorPanel Extension

**Task:** Modify `src/shared/layout/InspectorPanel.tsx`.

**Changes:**
- Add bottomPanel prop
- Render fixed at bottom
- Maintain existing layout

**Acceptance:**
- [ ] Existing inspectors unchanged
- [ ] bottomPanel renders when provided

---

### Story 4.2: ObjectInspector Integration

**Task:** Modify `src/shared/inspector/ObjectInspector.tsx`.

**Changes:**
- Add local object state for mutations
- Wire CopilotPanel with onApplyPatch
- Install fast-json-patch

**Acceptance:**
- [ ] CopilotPanel visible in inspector
- [ ] Applying patch updates JSON display
- [ ] No visual regressions

---

### Story 4.3: Dependency Installation

**Task:** Add fast-json-patch to project.

```bash
npm install fast-json-patch
```

**Acceptance:**
- [ ] Package installed
- [ ] Import works in patch-generator.ts

---

### Build Gate 4

```bash
npm install
npm run build
npm test
npx playwright test
```

Full integration working.

---

## Epic 5: Polish & Testing (1.5 hours)

### Story 5.1: Unit Tests

**Task:** Write unit tests for parser, validator, patch-generator.

**Coverage:**
- parser.ts: 90%+
- validator.ts: 90%+
- patch-generator.ts: 80%+

**Acceptance:**
- [ ] Tests in `tests/unit/copilot/`
- [ ] All tests pass

---

### Story 5.2: E2E Test

**Task:** Write Playwright test for copilot flow.

```typescript
test('copilot edit flow', async ({ page }) => {
  // Navigate to inspector
  // Send message
  // Verify diff preview
  // Click apply
  // Verify object updated
});
```

**Acceptance:**
- [ ] Test in `tests/e2e/copilot.spec.ts`
- [ ] Test passes

---

### Story 5.3: Manual QA

**Task:** Execute manual QA checklist.

**Checklist:**
- [ ] Panel renders in Journey inspector
- [ ] Panel renders in Lens inspector
- [ ] Collapse/expand works
- [ ] "Set title to X" works
- [ ] "Add tag Y" works
- [ ] Diff preview matches change
- [ ] Apply updates JSON
- [ ] Model indicator shows
- [ ] Suggestions appear
- [ ] Clicking suggestion populates input

---

### Story 5.4: Documentation

**Task:** Update DEVLOG.md with completion notes.

**Acceptance:**
- [ ] All stories marked complete
- [ ] Metrics recorded
- [ ] Retrospective notes added

---

### Build Gate 5 (Final)

```bash
npm run build
npm test
npx playwright test
# All tests pass, no regressions
```

---

## Dependency Graph

```
Epic 1 (Core)
    ↓
Epic 2 (UI Components)
    ↓
Epic 3 (State Management)
    ↓
Epic 4 (Integration)
    ↓
Epic 5 (Polish)
```

Each epic depends on the previous. Build gates ensure stability between phases.

---

## Time Estimates

| Epic | Estimate | Cumulative |
|------|----------|------------|
| Epic 1: Core | 2h | 2h |
| Epic 2: UI | 2h | 4h |
| Epic 3: State | 1.5h | 5.5h |
| Epic 4: Integration | 1h | 6.5h |
| Epic 5: Polish | 1.5h | 8h |

**Total:** 6-8 hours depending on debugging time.
