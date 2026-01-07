# ARCHITECTURE.md - prompt-wiring-v1

> **Sprint**: prompt-wiring-v1
> **Created**: 2026-01-06

---

## System Context

This sprint connects existing modules without introducing new architectural patterns.

```
┌─────────────────────────────────────────────────────────────────┐
│                      PROMPT WORKSHOP                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Inspector  │    │   Copilot    │    │  Extraction  │      │
│  │   (Editor)   │◄───┤   Actions    │    │   Pipeline   │      │
│  └──────────────┘    └──────┬───────┘    └──────┬───────┘      │
│                             │                   │               │
│                             ▼                   ▼               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    UTILITY MODULES                        │  │
│  │  ┌─────────────────┐    ┌────────────────────────┐       │  │
│  │  │ TitleTransforms │    │  TargetingInference    │       │  │
│  │  └─────────────────┘    └────────────────────────┘       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Relationships

### Current State (Broken)
```
TitleTransforms.ts ──── (no connection) ──── Copilot
TargetingInference.ts ── (no connection) ──── Extraction
```

### Target State (Wired)
```
TitleTransforms.ts ────► PromptCopilotActions ────► /make-compelling
TargetingInference.ts ──► PromptCopilotActions ────► /suggest-targeting
TargetingInference.ts ──► server.js extraction ────► Auto-populate stages
copilot-commands.ts ────► 'prepend' parser ────────► Surgical edits
```

---

## Module Responsibilities

### TitleTransforms.ts (Existing)
- Pure utility, no side effects
- Transforms concept names to user-facing prompts
- Exports: `transformTitle()`, `generateVariants()`, `detectTitleFormat()`

### TargetingInference.ts (Existing)
- Pure utility, no side effects
- Infers stages from salience dimensions
- Exports: `inferTargetingFromSalience()`, `getAvailableStagesForLens()`

### PromptCopilotActions.ts (To Wire)
- Copilot action handlers
- **Add**: Handler for `/make-compelling` using TitleTransforms
- **Add**: Handler for `/suggest-targeting` using TargetingInference

### copilot-commands.ts (To Extend)
- Command parser for Copilot input
- **Add**: `prepend {field} with {value}` command pattern

### server.js (To Extend)
- Extraction pipeline
- **Add**: Call to `inferTargetingFromSalience()` during prompt creation

---

## Data Flow: /make-compelling

```
User types "/make-compelling"
         │
         ▼
┌─────────────────────────┐
│ Copilot Parser          │
│ Matches 'make-compelling'│
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ handleMakeCompelling()  │
│ Gets current title      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ TitleTransforms         │
│ .generateVariants(3)    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Format response         │
│ Return 3 options        │
└───────────┬─────────────┘
            │
            ▼
      User sees options
```

---

## Data Flow: /suggest-targeting

```
User types "/suggest-targeting"
         │
         ▼
┌─────────────────────────┐
│ Copilot Parser          │
│ Matches 'suggest-target'│
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ handleSuggestTargeting()│
│ Gets salience dimensions│
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ TargetingInference      │
│ .inferFromSalience()    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Format response         │
│ Return stages + reasons │
└───────────┬─────────────┘
            │
            ▼
      User sees suggestion
```

---

## Data Flow: Extraction Auto-Targeting

```
Document uploaded
         │
         ▼
┌─────────────────────────┐
│ Extraction Pipeline     │
│ Extract concepts        │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ For each concept:       │
│ inferTargetingFromSal() │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Create prompt record    │
│ targeting.stages = [...]│
└───────────┬─────────────┘
            │
            ▼
      Save to Supabase
```

---

## No New Patterns

This sprint introduces NO new architectural patterns:
- Uses existing Copilot action dispatch
- Uses existing command parser structure
- Uses existing extraction pipeline
- Uses existing utility module pattern

**Pattern compliance**: EXTEND, not CREATE.
