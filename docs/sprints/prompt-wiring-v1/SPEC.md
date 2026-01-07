# SPEC.md - prompt-wiring-v1

> **Sprint**: prompt-wiring-v1
> **Created**: 2026-01-06
> **Status**: 📋 SPECIFICATION

---

## ATTENTION ANCHOR

```
┌─────────────────────────────────────────────────────────────────┐
│ WE ARE BUILDING: Wiring for existing prompt utilities          │
│                                                                 │
│ SUCCESS LOOKS LIKE:                                             │
│   • /make-compelling generates title variants                   │
│   • /suggest-targeting analyzes and suggests stages             │
│   • Extraction auto-populates targeting.stages                  │
│   • Refine button shows surgical edit, not full replace         │
│                                                                 │
│ WE ARE NOT:                                                     │
│   • Writing new utility functions (they exist)                  │
│   • Redesigning UI (wiring only)                                │
│   • Adding new features (connecting existing ones)              │
│                                                                 │
│ CURRENT PHASE: Specification                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Domain Contract

**Applicable contract:** Bedrock Sprint Contract
**Contract version:** 1.0
**Additional requirements:** Copilot integration mandate, DEX compliance

---

## Epic Specifications

### Epic 1: Refine Button UX Fix

**Goal**: Change from full replacement to surgical edit with user confirmation.

#### Problem
Current `generateCopilotStarterPrompt()` outputs:
```
set execution to Specifically, I keep seeing that AI capabilities...
```
This **replaces** the entire execution prompt, even when fixing one aspect.

#### Solution Options

**Option A: Prepend Command** (Recommended)
Add new command type `prepend {field} with {value}`:
```typescript
// In copilot-commands.ts
'prepend execution with: Given the context of the Grove vision,'
```
User sees: "Will prepend: 'Given the context...' to existing prompt"

**Option B: Diff Preview**
Show before/after in Copilot response, user confirms:
```
Before: "I keep seeing that AI capabilities..."
After:  "Given the context of the Grove vision, I keep seeing..."
[Apply] [Edit] [Cancel]
```

**Decision**: Option A (simpler, fits existing command pattern)

#### Implementation

1. Add `prepend` command to `copilot-commands.ts`
2. Update `generateCopilotStarterPrompt()` to use prepend format
3. Copilot parser handles prepend as merge, not replace

---

### Epic 2: Wire /make-compelling Action

**Goal**: Connect TitleTransforms.ts to Copilot action.

#### Current State
- `TitleTransforms.generateVariants(title, 3)` exists
- "Make compelling" suggestion exists in UI
- No handler connects them

#### Implementation

Add to `PromptCopilotActions.ts`:
```typescript
import { generateVariants } from '@core/utils/TitleTransforms';

// In action handler for 'make-compelling' or similar
async function handleMakeCompelling(prompt: PromptPayload) {
  const variants = generateVariants(prompt.meta.title, 3);
  
  return {
    message: `Here are 3 title variants:\n\n` +
      variants.map((v, i) => 
        `${i+1}. **${v.title}**\n   Format: ${v.format}`
      ).join('\n\n') +
      `\n\nTo apply one, say "set title to [chosen title]"`,
    suggestions: variants.map(v => ({
      label: v.title,
      template: `set title to ${v.title}`,
    })),
  };
}
```

#### Acceptance
- User types `/make-compelling`
- Copilot returns 3 title options
- User can click suggestion to apply

---

### Epic 3: Wire /suggest-targeting Action

**Goal**: Connect TargetingInference.ts to new Copilot action.

#### Implementation

Add to `PromptCopilotActions.ts`:
```typescript
import { inferTargetingFromSalience } from '@bedrock/.../utils/TargetingInference';

async function handleSuggestTargeting(prompt: PromptPayload) {
  const suggestion = inferTargetingFromSalience(
    prompt.payload.salienceDimensions || [],
    prompt.payload.interestingBecause
  );
  
  return {
    message: `**Targeting Suggestion**\n\n` +
      `**Stages:** ${suggestion.suggestedStages.join(' → ')}\n\n` +
      `**Reasoning:** ${suggestion.reasoning}\n\n` +
      `**Lens Affinities:**\n` +
      suggestion.lensAffinities.slice(0, 3).map(l => 
        `- ${l.lensId}: ${(l.weight * 100).toFixed(0)}% — ${l.reasoning}`
      ).join('\n') +
      `\n\nTo apply, say "set stages to ${suggestion.suggestedStages.join(', ')}"`,
    suggestions: [
      {
        label: 'Apply suggested stages',
        template: `set stages to ${suggestion.suggestedStages.join(', ')}`,
      },
    ],
  };
}
```

#### Acceptance
- User types `/suggest-targeting`
- Copilot analyzes prompt's salience dimensions
- Returns suggested stages with reasoning
- User can apply with one click

---

### Epic 4: Wire Extraction Pipeline

**Goal**: Auto-populate targeting.stages during extraction.

#### Current Flow
```
Document → Extract Concepts → Create Prompts → Save to DB
                                    ↓
                           targeting.stages = [] (empty!)
```

#### New Flow
```
Document → Extract Concepts → inferTargetingFromSalience() → Create Prompts → Save
                                    ↓
                           targeting.stages = ['genesis', 'exploration']
```

#### Implementation Location

In `server.js`, extraction endpoint (around line 3200-3400):

```javascript
// After extracting prompt data, before saving
import { inferTargetingFromSalience } from './src/bedrock/.../TargetingInference';

// In extraction handler:
const targeting = inferTargetingFromSalience(
  extractedPrompt.salienceDimensions || [],
  extractedPrompt.interestingBecause
);

const promptToSave = {
  ...extractedPrompt,
  payload: {
    ...extractedPrompt.payload,
    targeting: {
      stages: targeting.suggestedStages,
      // Preserve any existing targeting fields
      ...extractedPrompt.payload.targeting,
    }
  }
};
```

#### Acceptance
- Extract prompts from a document
- New prompts have `targeting.stages` populated
- Stages are reasonable based on content

---

## Data Flow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                     WIRING CONNECTIONS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TitleTransforms.ts ──────────┬───► /make-compelling action     │
│                               │                                 │
│  TargetingInference.ts ───────┼───► /suggest-targeting action   │
│                               │                                 │
│                               └───► Extraction pipeline         │
│                                                                 │
│  copilot-commands.ts ─────────────► 'prepend' command           │
│                                                                 │
│  PromptQAActions.ts ──────────────► Updated starter prompts     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## DEX Compliance Matrix

| Principle | How This Sprint Satisfies |
|-----------|---------------------------|
| Declarative Sovereignty | Targeting inference uses config-driven stage maps |
| Capability Agnosticism | Works with any LLM (utilities are deterministic) |
| Provenance | Suggestions include reasoning explaining why |
| Organic Scalability | New salience types can extend inference without code change |

---

## Testing Requirements

| Test | Type | Verifies |
|------|------|----------|
| `/make-compelling` returns variants | E2E | Epic 2 |
| `/suggest-targeting` returns stages | E2E | Epic 3 |
| Extraction populates stages | Integration | Epic 4 |
| Prepend command merges correctly | Unit | Epic 1 |

---

## Out of Scope

- Batch operations (separate sprint)
- Source filter alignment (cosmetic, defer)
- Edit versioning (complex, defer)
- Structured execution fields (userIntent, etc.) - defer
