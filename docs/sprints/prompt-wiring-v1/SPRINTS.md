# SPRINTS.md - prompt-wiring-v1

> **Sprint**: prompt-wiring-v1
> **Total Points**: 13
> **Estimated Time**: 3-4 hours

---

## Epic 1: Refine Button UX Fix (5 pts)

### Story 1.1: Add prepend command pattern (2 pts)
**File**: `src/core/copilot/copilot-commands.ts`

**Task**:
- Add regex pattern for `prepend {field} with {value}`
- Handler returns `{ type: 'prepend', field, value }`
- Copilot executor handles prepend by concatenating value + existing

**Tests**:
- Unit: Pattern matches valid inputs
- Unit: Pattern rejects invalid inputs

**Verification**:
```bash
# Type in Copilot: "prepend execution with: Test prefix"
# Should show message about prepending, not replacing
```

### Story 1.2: Update generateCopilotStarterPrompt (1 pt)
**File**: `src/core/copilot/PromptQAActions.ts`

**Task**:
- Change return format from `set execution to X` to `prepend execution with: X`
- Keep issue-type-specific prefixes

**Verification**:
```bash
# Run QA check
# Click "Refine" button
# Copilot input should show "prepend execution with: Given the context..."
```

### Story 1.3: Handle prepend in Copilot executor (2 pts)
**File**: Copilot command executor (find correct file)

**Task**:
- When command type is 'prepend', merge value with existing
- Format: `newValue + ' ' + existingValue`
- Show confirmation message

**Verification**:
```bash
# After prepend command executes
# Check execution prompt has prefix added, not replaced
```

---

## Epic 2: Wire /make-compelling (3 pts)

### Story 2.1: Add handleMakeCompelling handler (2 pts)
**File**: `src/core/copilot/PromptCopilotActions.ts`

**Task**:
- Import `generateVariants` from TitleTransforms
- Create handler function
- Return formatted message with 3 variants
- Include clickable suggestions

**Tests**:
- Unit: Handler returns expected format
- E2E: `/make-compelling` shows variants

**Verification**:
```bash
# Open prompt in Inspector
# Type "/make-compelling" in Copilot
# See 3 title variants with Apply buttons
```

### Story 2.2: Register action (1 pt)
**File**: `src/core/copilot/PromptCopilotActions.ts`

**Task**:
- Add to ACTION_REGISTRY or equivalent
- Match trigger: 'make-compelling', 'make compelling', 'compelling title'

**Verification**:
```bash
# All trigger phrases should invoke the handler
```

---

## Epic 3: Wire /suggest-targeting (3 pts)

### Story 3.1: Add handleSuggestTargeting handler (2 pts)
**File**: `src/core/copilot/PromptCopilotActions.ts`

**Task**:
- Import `inferTargetingFromSalience` from TargetingInference
- Create handler function
- Return suggested stages with reasoning
- Include clickable "Apply" suggestion

**Tests**:
- Unit: Handler returns expected format
- E2E: `/suggest-targeting` shows stages

**Verification**:
```bash
# Open prompt with salienceDimensions populated
# Type "/suggest-targeting" in Copilot
# See stages, reasoning, lens affinities
```

### Story 3.2: Register action (1 pt)
**File**: `src/core/copilot/PromptCopilotActions.ts`

**Task**:
- Add to ACTION_REGISTRY
- Match triggers: 'suggest-targeting', 'suggest targeting', 'suggest stages'

---

## Epic 4: Wire Extraction Pipeline (2 pts)

### Story 4.1: Add inference to extraction (2 pts)
**File**: `server.js`

**Task**:
- Locate extraction endpoint (around line 3200-3400)
- Dynamic import TargetingInference
- Call `inferTargetingFromSalience()` for each extracted prompt
- Merge inferred stages into prompt.payload.targeting

**Tests**:
- Integration: Extract document, verify stages populated

**Verification**:
```bash
# Upload/extract a document
# Check new prompts in Prompt Workshop
# targeting.stages should not be empty
```

---

## Build Gates

After each epic:
```bash
npm run build           # TypeScript compiles
npm run dev             # Server starts
# Manual: Test specific behavior
```

After all epics:
```bash
npm run build
npm test
npx playwright test tests/e2e/prompt-workshop.spec.ts
```

---

## Story Point Summary

| Epic | Stories | Points |
|------|---------|--------|
| Epic 1: Refine UX | 3 | 5 |
| Epic 2: /make-compelling | 2 | 3 |
| Epic 3: /suggest-targeting | 2 | 3 |
| Epic 4: Extraction | 1 | 2 |
| **Total** | **8** | **13** |

---

## Execution Order

1. Epic 1 (Refine UX) - Unblocks user testing
2. Epic 2 (/make-compelling) - Independent, quick win
3. Epic 3 (/suggest-targeting) - Independent, quick win
4. Epic 4 (Extraction) - Requires testing with real documents

Can parallelize Epics 2 & 3 if desired.
