# Sprint Status: prompt-refinement-v1

> **Date**: 2026-01-06
> **Assessment**: Code exists, wiring incomplete

---

## True Status vs. DEVLOG

| Phase | DEVLOG Says | Actual Reality |
|-------|-------------|----------------|
| Phase 1: Schema | 🔴 Not Started | ✅ Done - QAIssue types exist |
| Phase 2: Hooks | 🔴 Not Started | 🟡 Partial - useSourceContext exists |
| Phase 3: UI Components | 🔴 Not Started | ✅ Done - SourceContext, QAResults exist |
| Phase 4: Integration | 🔴 Not Started | ✅ Done - PromptEditor wired |
| Phase 5: API | 🔴 Not Started | ✅ Done - `/api/prompts/:id/qa-check` works |
| Phase 6: Copilot Actions | 🔴 Not Started | 🟡 Partial - Refine→Copilot works, `/make-compelling` NOT wired |
| Phase 7: Title Transforms | 🔴 Not Started | 🟡 File exists, NOT wired |
| Phase 8: Testing | 🔴 Not Started | 🔴 Not Started |
| Phase 9: 4D Targeting | 🔴 Not Started | 🟡 File exists, NOT wired |

---

## Key Files That Exist But Aren't Wired

| File | Purpose | Wiring Needed |
|------|---------|---------------|
| `src/core/utils/TitleTransforms.ts` | Transform concepts to exploration prompts | Wire to `/make-compelling` action |
| `src/bedrock/.../TargetingInference.ts` | Infer target stages from salience | Wire to extraction + UI |
| `PromptQAActions.ts` | Has "Make compelling" suggestion | Wire to use TitleTransforms |

---

## User Complaints vs. Root Cause

### 1. "Fix overwrites entire prompt, not merge"

**Root cause**: `generateCopilotStarterPrompt()` generates:
```
set execution to Specifically, <original prompt>
```
This REPLACES the entire execution prompt.

**Fix needed**: Change to surgical edit OR change UX to show diff before applying.

**Options**:
- Option A: Use `set execution to` with diff preview before apply
- Option B: Add new command `prepend execution with X` that merges
- Option C: Show before/after in Copilot before user confirms

### 2. "Transform titles into standalone exploration chips"

**Root cause**: `TitleTransforms.ts` exists with:
- `transformTitle(title, { format: 'question' })` → "What is X?"
- `transformTitle(title, { format: 'exploration' })` → "Explore X"
- `generateVariants(title, 3)` → Multiple options

**NOT wired to**:
- Extraction pipeline (should auto-transform on extract)
- `/make-compelling` Copilot action
- UI action button

**Fix needed**: Wire `/make-compelling` → `TitleTransforms.generateVariants()`

### 3. "Map to genesis, etc. target stages"

**Root cause**: `TargetingInference.ts` exists with:
- `inferTargetingFromSalience(dimensions, interestingBecause)`
- Returns suggested stages + lens affinities

**NOT wired to**:
- Extraction pipeline (should auto-set targeting)
- `/suggest-targeting` Copilot action
- UI auto-population

**Fix needed**: 
1. Call `inferTargetingFromSalience()` during extraction
2. Wire `/suggest-targeting` action in Copilot

---

## Priority Fix Order

### P0: Fix Overwrite UX (User's #1 concern)

**Quick fix**: Change from overwrite to prepend for applicable issue types.

In `PromptQAActions.ts`, change `generateCopilotStarterPrompt()`:
```typescript
// OLD (overwrites)
return `set execution to ${hint}${promptStart}${ellipsis}`;

// NEW (instructs to prepend)
return `prepend execution with: ${hint}\n\nOriginal: "${promptStart}${ellipsis}"`;
```

Or add a `prepend execution with` command to copilot-commands.ts.

### P1: Wire TitleTransforms to /make-compelling

Add to `PromptCopilotActions.ts` or handler:
```typescript
import { transformTitle, generateVariants } from '@core/utils/TitleTransforms';

// In /make-compelling handler:
const variants = generateVariants(prompt.meta.title, 3);
return `Here are ${variants.length} title options:\n` +
  variants.map((v, i) => `${i+1}. ${v.title} (${v.format})`).join('\n');
```

### P2: Wire TargetingInference to Extraction

In server.js extraction endpoint (wherever prompts are created):
```typescript
import { inferTargetingFromSalience } from './src/.../TargetingInference';

// After extracting prompt:
const targeting = inferTargetingFromSalience(
  extractedPrompt.salienceDimensions || [],
  extractedPrompt.interestingBecause
);

promptToSave.payload.targeting = {
  stages: targeting.suggestedStages,
  // ... other fields
};
```

### P3: Wire /suggest-targeting Action

Add to Copilot actions:
```typescript
{
  trigger: '/suggest-targeting',
  handler: async (prompt) => {
    const suggestion = inferTargetingFromSalience(
      prompt.payload.salienceDimensions,
      prompt.payload.interestingBecause
    );
    return `Suggested targeting:\n` +
      `Stages: ${suggestion.suggestedStages.join(' → ')}\n` +
      `Reasoning: ${suggestion.reasoning}\n` +
      `Lens affinities:\n` +
      suggestion.lensAffinities.map(l => `  - ${l.lensId}: ${l.weight}`).join('\n');
  }
}
```

---

## Send to Claude CLI

```
Read docs/sprints/prompt-refinement-v1/SPRINT_STATUS.md

Priority order:
1. P0: Fix the overwrite UX - add "prepend execution with" command OR change generateCopilotStarterPrompt to show a merge/diff approach
2. P1: Wire TitleTransforms.ts to the /make-compelling copilot action
3. P2: Wire TargetingInference.ts to extraction pipeline to auto-set stages
4. P3: Add /suggest-targeting copilot action

Start with P0 since user is blocked on it.
```

---

## Files to Modify

| Priority | File | Change |
|----------|------|--------|
| P0 | `src/core/copilot/copilot-commands.ts` | Add `prepend execution with` command |
| P0 | `src/core/copilot/PromptQAActions.ts` | Change starter prompt format |
| P1 | `src/core/copilot/PromptCopilotActions.ts` | Wire `/make-compelling` |
| P2 | `server.js` (extraction section) | Call `inferTargetingFromSalience()` |
| P3 | `src/core/copilot/PromptCopilotActions.ts` | Add `/suggest-targeting` |
