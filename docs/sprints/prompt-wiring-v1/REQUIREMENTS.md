# REQUIREMENTS.md - prompt-wiring-v1

> **Sprint**: prompt-wiring-v1
> **Created**: 2026-01-06
> **Parent Sprint**: prompt-refinement-v1 (partial completion)

---

## Problem Statement

Sprint `prompt-refinement-v1` created several utility modules that were never wired to the UI or extraction pipeline:

| Module | Purpose | Current State |
|--------|---------|---------------|
| `TitleTransforms.ts` | Transform concepts to exploration prompts | ✅ File exists, ❌ Not wired |
| `TargetingInference.ts` | Infer stages from salience | ✅ File exists, ❌ Not wired |
| `generateCopilotStarterPrompt()` | Populate Copilot on Fix click | ✅ Works, ❌ UX problem |

Additionally, the "Refine" button flow has a UX problem: clicking Fix for ONE issue **replaces the entire execution prompt** rather than making a surgical edit.

---

## User Stories

### US-1: As an operator, I want the Refine button to suggest edits, not overwrite my prompt
**Current**: Clicking "Refine" generates `set execution to [prefix][entire prompt]` - replaces everything
**Desired**: Show what's changing, let me approve or modify before applying
**Acceptance**: User sees before/after or can choose to prepend vs replace

### US-2: As an operator, I want `/make-compelling` to generate title variants
**Current**: "Make compelling" suggestion exists but does nothing useful
**Desired**: Typing `/make-compelling` generates 3 title options using TitleTransforms
**Acceptance**: Copilot returns formatted list of title variants to choose from

### US-3: As an operator, I want extracted prompts to have target stages pre-set
**Current**: Extracted prompts have empty `targeting.stages` array
**Desired**: Extraction pipeline calls `inferTargetingFromSalience()` and populates stages
**Acceptance**: New extractions have reasonable default stages based on salience

### US-4: As an operator, I want `/suggest-targeting` to analyze a prompt
**Current**: No such action exists
**Desired**: Typing `/suggest-targeting` analyzes prompt and suggests stages + lens affinities
**Acceptance**: Copilot returns structured targeting suggestion with reasoning

---

## Scope

### In Scope
- Wire existing `TitleTransforms.ts` to Copilot actions
- Wire existing `TargetingInference.ts` to extraction + Copilot
- Fix Refine button UX (surgical edit, not full replacement)
- Add `/suggest-targeting` Copilot action

### Out of Scope
- New extraction pipeline work (exists)
- Batch operations (separate sprint)
- Testing infrastructure (exists)
- UI redesign (cosmetic only if needed)

---

## Success Criteria

| Criterion | Metric |
|-----------|--------|
| Title generation works | `/make-compelling` returns 3 variants |
| Targeting auto-populated | New extractions have ≥1 stage set |
| Refine UX improved | User can see/modify edit before applying |
| No regressions | Existing QA check still works |

---

## Dependencies

| Dependency | Status |
|------------|--------|
| `TitleTransforms.ts` | ✅ Exists |
| `TargetingInference.ts` | ✅ Exists |
| `PromptQAActions.ts` | ✅ Exists |
| Copilot infrastructure | ✅ Working |
| Extraction pipeline | ✅ Working |
