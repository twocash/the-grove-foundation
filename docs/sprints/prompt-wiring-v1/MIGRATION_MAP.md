# MIGRATION_MAP.md - prompt-wiring-v1

> **Sprint**: prompt-wiring-v1
> **Created**: 2026-01-06

---

## Files Modified (In Order)

### Epic 1: Refine Button UX Fix

| Step | File | Change |
|------|------|--------|
| 1.1 | `src/core/copilot/copilot-commands.ts` | Add `prepend` command pattern |
| 1.2 | `src/core/copilot/PromptQAActions.ts` | Update `generateCopilotStarterPrompt()` |

### Epic 2: Wire /make-compelling

| Step | File | Change |
|------|------|--------|
| 2.1 | `src/core/copilot/PromptCopilotActions.ts` | Add import for TitleTransforms |
| 2.2 | `src/core/copilot/PromptCopilotActions.ts` | Add `handleMakeCompelling()` handler |
| 2.3 | `src/core/copilot/PromptCopilotActions.ts` | Register action in ACTION_REGISTRY |

### Epic 3: Wire /suggest-targeting

| Step | File | Change |
|------|------|--------|
| 3.1 | `src/core/copilot/PromptCopilotActions.ts` | Add import for TargetingInference |
| 3.2 | `src/core/copilot/PromptCopilotActions.ts` | Add `handleSuggestTargeting()` handler |
| 3.3 | `src/core/copilot/PromptCopilotActions.ts` | Register action in ACTION_REGISTRY |

### Epic 4: Wire Extraction Pipeline

| Step | File | Change |
|------|------|--------|
| 4.1 | `server.js` | Add import for TargetingInference |
| 4.2 | `server.js` | Call inference in extraction endpoint |
| 4.3 | `server.js` | Merge inferred stages into prompt payload |

---

## Code Snippets

### 1.1: Add prepend command (copilot-commands.ts)

```typescript
// Add to COMMAND_PATTERNS array
{
  pattern: /^prepend\s+(\w+)\s+with[:\s]+(.+)$/i,
  handler: (match, context) => {
    const field = match[1].toLowerCase();
    const value = match[2].trim();
    return {
      type: 'prepend',
      field,
      value,
    };
  },
},
```

### 1.2: Update starter prompt (PromptQAActions.ts)

```typescript
export function generateCopilotStarterPrompt(issue: QAIssue, currentPrompt: string): string {
  const hint = getIssueHint(issue.type);
  
  // Use prepend format instead of full replace
  return `prepend execution with: ${hint}`;
}
```

### 2.2: handleMakeCompelling (PromptCopilotActions.ts)

```typescript
import { generateVariants } from '@core/utils/TitleTransforms';

async function handleMakeCompelling(prompt: PromptPayload): Promise<CopilotResponse> {
  const variants = generateVariants(prompt.meta.title, 3);
  
  return {
    message: `Here are 3 title variants:\n\n` +
      variants.map((v, i) => 
        `${i+1}. **${v.title}**\n   Format: ${v.format}`
      ).join('\n\n') +
      `\n\nTo apply, say "set title to [your choice]"`,
    suggestions: variants.map(v => ({
      label: v.title,
      template: `set title to ${v.title}`,
      icon: 'auto_awesome',
    })),
  };
}
```

### 3.2: handleSuggestTargeting (PromptCopilotActions.ts)

```typescript
import { inferTargetingFromSalience } from '@bedrock/consoles/PromptWorkshop/utils/TargetingInference';

async function handleSuggestTargeting(prompt: PromptPayload): Promise<CopilotResponse> {
  const suggestion = inferTargetingFromSalience(
    prompt.payload.salienceDimensions || [],
    prompt.payload.interestingBecause
  );
  
  const stageList = suggestion.suggestedStages.join(', ');
  
  return {
    message: `**Targeting Suggestion**\n\n` +
      `**Stages:** ${suggestion.suggestedStages.join(' → ')}\n\n` +
      `**Reasoning:** ${suggestion.reasoning}\n\n` +
      `**Lens Affinities:**\n` +
      suggestion.lensAffinities.slice(0, 3).map(l => 
        `- ${l.lensId}: ${(l.weight * 100).toFixed(0)}%`
      ).join('\n'),
    suggestions: [
      {
        label: 'Apply stages',
        template: `set stages to ${stageList}`,
        icon: 'target',
      },
    ],
  };
}
```

### 4.2: Extraction pipeline (server.js)

```javascript
// Near line 3300 in extraction handler
// After: const extractedPrompts = await extractConcepts(document);
// Before: saving to database

const { inferTargetingFromSalience } = await import(
  './src/bedrock/consoles/PromptWorkshop/utils/TargetingInference.js'
);

const promptsWithTargeting = extractedPrompts.map(prompt => {
  const targeting = inferTargetingFromSalience(
    prompt.salienceDimensions || [],
    prompt.interestingBecause
  );
  
  return {
    ...prompt,
    payload: {
      ...prompt.payload,
      targeting: {
        ...prompt.payload?.targeting,
        stages: targeting.suggestedStages,
      }
    }
  };
});

// Use promptsWithTargeting instead of extractedPrompts for save
```

---

## Verification Commands

After each epic:

```bash
# Verify TypeScript compiles
npm run build

# Verify no console errors
npm run dev
# Open browser, check DevTools

# Verify specific behavior (manual)
# Epic 1: Click Refine, see prepend format
# Epic 2: Type /make-compelling, see variants
# Epic 3: Type /suggest-targeting, see stages
# Epic 4: Extract doc, check targeting.stages populated
```

---

## Rollback Plan

All changes are additive. Rollback = remove additions:
- Remove prepend pattern from copilot-commands.ts
- Remove handlers from PromptCopilotActions.ts
- Remove inference call from server.js

No schema changes. No data migrations.
