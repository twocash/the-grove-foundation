# EXECUTION_PROMPT.md - prompt-wiring-v1

> **Sprint**: prompt-wiring-v1
> **Handoff Date**: 2026-01-06
> **Estimated Time**: 3-4 hours

---

## Context

You are wiring existing utility modules to the Prompt Workshop UI and extraction pipeline. The code exists but isn't connected. This is a WIRING sprint, not a BUILDING sprint.

**Key files that already exist (DO NOT MODIFY):**
- `src/core/utils/TitleTransforms.ts` - Title transformation utilities
- `src/bedrock/consoles/PromptWorkshop/utils/TargetingInference.ts` - Stage inference

**Files to modify:**
- `src/core/copilot/copilot-commands.ts` - Add prepend command
- `src/core/copilot/PromptQAActions.ts` - Update starter prompt format
- `src/core/copilot/PromptCopilotActions.ts` - Add action handlers
- `server.js` - Wire inference to extraction

---

## Pre-Flight Checklist

```bash
cd C:\GitHub\the-grove-foundation
git checkout bedrock
git pull origin bedrock
npm install
npm run build  # Should pass
npm run dev    # Should start
```

Verify existing files exist:
```bash
# These should exist
cat src/core/utils/TitleTransforms.ts | head -20
cat src/bedrock/consoles/PromptWorkshop/utils/TargetingInference.ts | head -20
```

---

## Epic 1: Refine Button UX Fix

### Story 1.1: Add prepend command pattern

**File**: `src/core/copilot/copilot-commands.ts`

Find the command patterns array (likely named `COMMAND_PATTERNS` or similar). Add:

```typescript
// Add to command patterns
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

### Story 1.2: Update starter prompt format

**File**: `src/core/copilot/PromptQAActions.ts`

Find `generateCopilotStarterPrompt()` function. Change from:

```typescript
// OLD - full replacement
return `set execution to ${hint}${promptStart}${ellipsis}`;
```

To:

```typescript
// NEW - prepend only
return `prepend execution with: ${hint}`;
```

### Story 1.3: Handle prepend in executor

Find where commands are executed (likely in copilot-commands.ts or a handler file). Add case for 'prepend':

```typescript
case 'prepend': {
  const existingValue = getFieldValue(context.object, command.field);
  const newValue = `${command.value} ${existingValue}`.trim();
  return setFieldValue(context.object, command.field, newValue);
}
```

**Verify**:
```bash
npm run build
npm run dev
# Open Prompt Workshop, run QA check, click Refine
# Should see "prepend execution with: ..." not "set execution to ..."
```

---

## Epic 2: Wire /make-compelling

### Story 2.1: Add handler

**File**: `src/core/copilot/PromptCopilotActions.ts`

Add import at top:
```typescript
import { generateVariants } from '@core/utils/TitleTransforms';
```

Add handler function:
```typescript
async function handleMakeCompelling(
  prompt: any,
  context: CopilotContext
): Promise<CopilotResponse> {
  const title = prompt.meta?.title || prompt.payload?.title || 'Untitled';
  const variants = generateVariants(title, 3);
  
  return {
    message: `Here are 3 title variants:\n\n` +
      variants.map((v, i) => 
        `${i+1}. **${v.title}**\n   _Format: ${v.format}_`
      ).join('\n\n') +
      `\n\nTo apply, say "set title to [your choice]"`,
    suggestions: variants.map(v => ({
      label: v.title.slice(0, 40) + (v.title.length > 40 ? '...' : ''),
      template: `set title to ${v.title}`,
      icon: 'auto_awesome',
    })),
  };
}
```

### Story 2.2: Register action

Find the action registry (ACTION_HANDLERS, ACTIONS, or similar). Add:

```typescript
{
  triggers: ['make-compelling', 'make compelling', 'compelling title', 'better title'],
  handler: handleMakeCompelling,
  description: 'Generate compelling title variants',
},
```

**Verify**:
```bash
npm run build
npm run dev
# Open Prompt Workshop, select a prompt
# Type "/make-compelling" in Copilot
# Should see 3 title options
```

---

## Epic 3: Wire /suggest-targeting

### Story 3.1: Add handler

**File**: `src/core/copilot/PromptCopilotActions.ts`

Add import:
```typescript
import { inferTargetingFromSalience } from '@bedrock/consoles/PromptWorkshop/utils/TargetingInference';
```

Add handler:
```typescript
async function handleSuggestTargeting(
  prompt: any,
  context: CopilotContext
): Promise<CopilotResponse> {
  const salience = prompt.payload?.salienceDimensions || [];
  const interesting = prompt.payload?.interestingBecause || '';
  
  const suggestion = inferTargetingFromSalience(salience, interesting);
  const stageList = suggestion.suggestedStages.join(', ');
  
  return {
    message: `**Targeting Suggestion**\n\n` +
      `**Stages:** ${suggestion.suggestedStages.join(' → ')}\n\n` +
      `**Reasoning:** ${suggestion.reasoning}\n\n` +
      `**Lens Affinities:**\n` +
      suggestion.lensAffinities.slice(0, 3).map(l => 
        `- **${l.lensId}**: ${(l.weight * 100).toFixed(0)}% — ${l.reasoning}`
      ).join('\n'),
    suggestions: [
      {
        label: `Apply: ${stageList}`,
        template: `set stages to ${stageList}`,
        icon: 'target',
      },
    ],
  };
}
```

### Story 3.2: Register action

```typescript
{
  triggers: ['suggest-targeting', 'suggest targeting', 'suggest stages', 'what stages'],
  handler: handleSuggestTargeting,
  description: 'Suggest target stages based on content',
},
```

**Verify**:
```bash
npm run build
npm run dev
# Open a prompt that has salienceDimensions
# Type "/suggest-targeting"
# Should see stages and reasoning
```

---

## Epic 4: Wire Extraction Pipeline

### Story 4.1: Add inference to extraction

**File**: `server.js`

Find the extraction endpoint. Search for:
```bash
# Find extraction handler
grep -n "extract" server.js | grep -i "prompt\|concept"
```

In the extraction handler, after prompts are extracted but before saving:

```javascript
// Add dynamic import at handler start
const { inferTargetingFromSalience } = await import(
  './src/bedrock/consoles/PromptWorkshop/utils/TargetingInference.js'
);

// After extraction, before save
const promptsWithTargeting = extractedPrompts.map(prompt => {
  const targeting = inferTargetingFromSalience(
    prompt.salienceDimensions || prompt.payload?.salienceDimensions || [],
    prompt.interestingBecause || prompt.payload?.interestingBecause || ''
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

// Use promptsWithTargeting for database save
```

**Verify**:
```bash
npm run build
npm run dev
# Extract prompts from a document
# Check new prompts have targeting.stages populated
```

---

## Final Verification

```bash
# Full build
npm run build

# Run dev server
npm run dev

# Manual tests:
# 1. Refine button shows "prepend" format
# 2. /make-compelling returns 3 variants
# 3. /suggest-targeting returns stages
# 4. New extractions have stages populated

# Update DEVLOG.md with results
```

---

## Troubleshooting

### Import errors
- Check path aliases in tsconfig.json
- May need relative path instead of alias

### Handler not found
- Check trigger registration
- Console.log in handler to verify it's called

### Prepend not working
- Check command executor handles 'prepend' type
- Verify field name matches schema

### Extraction not populating
- Check dynamic import path (may need .js extension)
- Verify extractedPrompts array name

---

## Done Criteria

- [ ] `prepend execution with:` format works
- [ ] `/make-compelling` returns 3 title variants
- [ ] `/suggest-targeting` returns stages with reasoning
- [ ] New extractions have `targeting.stages` populated
- [ ] No TypeScript errors
- [ ] DEVLOG.md updated
