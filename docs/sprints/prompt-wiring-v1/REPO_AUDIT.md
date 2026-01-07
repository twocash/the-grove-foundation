# REPO_AUDIT.md - prompt-wiring-v1

> **Sprint**: prompt-wiring-v1
> **Audited**: 2026-01-06

---

## Existing Files to Wire (Not Modify)

| File | Purpose | Lines | Status |
|------|---------|-------|--------|
| `src/core/utils/TitleTransforms.ts` | Title transformation utilities | 327 | ✅ Complete, needs wiring |
| `src/bedrock/.../utils/TargetingInference.ts` | Stage inference from salience | 313 | ✅ Complete, needs wiring |

---

## Files to Modify

| File | Purpose | Change Type |
|------|---------|-------------|
| `src/core/copilot/PromptQAActions.ts` | QA action handlers | Modify `generateCopilotStarterPrompt()` |
| `src/core/copilot/copilot-commands.ts` | Command parser | Add `prepend execution with` command |
| `src/core/copilot/PromptCopilotActions.ts` | Copilot action registry | Wire `/make-compelling`, add `/suggest-targeting` |
| `server.js` | Extraction endpoint | Call `inferTargetingFromSalience()` |

---

## Key Functions Already Implemented

### TitleTransforms.ts
```typescript
transformTitle(title, { format: 'question' }) → "What is X?"
transformTitle(title, { format: 'exploration' }) → "Explore X"
generateVariants(title, 3) → [{format, title}, ...]
detectTitleFormat(title) → 'concept' | 'question' | ...
toConceptName(title) → "X" (strips prefixes)
```

### TargetingInference.ts
```typescript
inferTargetingFromSalience(dimensions[], interestingBecause?) → {
  suggestedStages: PromptStage[],
  lensAffinities: LensAffinitySuggestion[],
  reasoning: string
}
getAvailableStagesForLens(lensId) → PromptStage[]
getStageCharacteristics(stage) → StageCharacteristics
```

### PromptQAActions.ts (to modify)
```typescript
generateCopilotStarterPrompt(issue, currentPrompt) → string
// Currently: "set execution to [prefix][prompt]"
// Needs: Better UX for surgical edits
```

---

## Copilot Command Structure

Current command format in `copilot-commands.ts`:
```typescript
// Field setters
'set {field} to {value}'
'change {field} to {value}'

// Need to add:
'prepend {field} with {value}'
```

---

## Extraction Pipeline Location

Server.js extraction endpoint (around line 3200-3400):
- Receives document, extracts concepts
- Creates prompt records
- **Gap**: Does not call `inferTargetingFromSalience()`

---

## Test Files

| Test | Purpose | Status |
|------|---------|--------|
| `tests/unit/TitleTransforms.test.ts` | Title transformation | ❓ Check if exists |
| `tests/e2e/prompt-workshop.spec.ts` | E2E prompt flows | ✅ Exists |

---

## Console Configuration

From `PromptWorkshop.config.ts`:
- Console ID: `'prompts'`
- Field mappings in `copilot-commands.ts` need this ID

---

## No Files to Create

This sprint wires existing code. No new files except sprint artifacts.
