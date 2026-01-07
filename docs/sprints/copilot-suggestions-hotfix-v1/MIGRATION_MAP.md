# MIGRATION_MAP.md - copilot-suggestions-hotfix-v1

> **Sprint**: copilot-suggestions-hotfix-v1
> **Created**: 2026-01-06

---

## Change Summary

| File | Change Type | Lines Added | Lines Modified |
|------|-------------|-------------|----------------|
| `console-factory.types.ts` | Add field | ~2 | 0 |
| `BedrockCopilot.tsx` | Add types + UI | ~25 | ~3 |
| `PromptCopilotActions.ts` | Add suggestions | ~20 | ~6 |
| **Total** | | ~47 | ~9 |

---

## File 1: console-factory.types.ts

**Location**: `src/bedrock/patterns/console-factory.types.ts`
**Change**: Add import + field

### Before (~line 1-5):
```typescript
import type { GroveObject } from '@core/schema/grove-object';
import type { PatchOperation } from '../types/copilot.types';
```

### After:
```typescript
import type { GroveObject } from '@core/schema/grove-object';
import type { PatchOperation } from '../types/copilot.types';
import type { SuggestedAction } from '@core/copilot/schema';
```

### Before (~line 83):
```typescript
export interface CopilotActionResult {
  success: boolean;
  message: string;
  operations?: PatchOperation[];
}
```

### After:
```typescript
export interface CopilotActionResult {
  success: boolean;
  message: string;
  operations?: PatchOperation[];
  suggestions?: SuggestedAction[];
}
```

---

## File 2: BedrockCopilot.tsx

**Location**: `src/bedrock/primitives/BedrockCopilot.tsx`
**Changes**: Import, types, capture, render

### Add Import (~line 8):
```typescript
import type { SuggestedAction } from '../../core/copilot/schema';
```

### Update CopilotMessage (~line 14):
```typescript
interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  suggestions?: SuggestedAction[];
}
```

### Update ActionResult (~line 24):
```typescript
interface ActionResult {
  success: boolean;
  message: string;
  operations?: PatchOperation[];
  suggestions?: SuggestedAction[];
}
```

### Update handleSubmit (~line 135):
```typescript
const assistantMsg: CopilotMessage = {
  id: crypto.randomUUID(),
  role: 'assistant',
  content: result.message,
  suggestions: result.suggestions,
};
```

### Add Suggestions UI (~after line 225):
Insert after `{message.content}` inside the assistant message span:

```tsx
{message.suggestions && message.suggestions.length > 0 && (
  <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-[var(--glass-border)]">
    {message.suggestions.map((s, i) => (
      <button
        key={i}
        onClick={() => {
          setInput(s.template);
          inputRef.current?.focus();
        }}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px]
                   bg-[var(--neon-green)]/10 text-[var(--neon-green)] 
                   border border-[var(--neon-green)]/20
                   hover:bg-[var(--neon-green)]/20 hover:border-[var(--neon-green)]/40
                   transition-colors cursor-pointer"
      >
        {s.icon && (
          <span className="material-symbols-outlined text-xs">{s.icon}</span>
        )}
        {s.label}
      </button>
    ))}
  </div>
)}
```

---

## File 3: PromptCopilotActions.ts

**Location**: `src/bedrock/consoles/PromptWorkshop/PromptCopilotActions.ts`
**Changes**: Update return statements in make-compelling and suggest-targeting

### make-compelling API Success (~line 373):

**Before:**
```typescript
return {
  success: true,
  message: `Here are 3 AI-generated title suggestions:\n\n` +
    aiVariants.map(...).join('\n\n') +
    `\n\nCopy the full title, e.g.:\nset title to ${aiVariants[0]?.title}`,
};
```

**After:**
```typescript
return {
  success: true,
  message: `Here are 3 AI-generated title suggestions:`,
  suggestions: aiVariants.map((v: { title: string; format: string }) => ({
    label: v.title.length > 40 ? v.title.slice(0, 37) + '...' : v.title,
    template: `set title to ${v.title}`,
    icon: 'auto_awesome',
  })),
};
```

### make-compelling Fallback Paths (~line 355, ~line 390):

**After (both):**
```typescript
return {
  success: true,
  message: `Title suggestions (basic transforms):`,
  suggestions: fallbackVariants.map(v => ({
    label: v.title.length > 40 ? v.title.slice(0, 37) + '...' : v.title,
    template: `set title to ${v.title}`,
    icon: 'auto_awesome',
  })),
};
```

### suggest-targeting API Success (~line 302):

**Before:**
```typescript
return {
  success: true,
  message: `**AI Targeting Applied ✓**\n\n...`,
  operations,
};
```

**After:**
```typescript
return {
  success: true,
  message: `**AI Targeting Suggestion**\n\n` +
    `**Stages:** ${stageList}\n` +
    `_${data.stageReasoning || ''}_\n\n` +
    `**Lens Affinities:** ${lensIds.join(', ')}`,
  operations,
  suggestions: [
    {
      label: `Apply: ${stageList}`,
      template: `set stages to ${suggestedStages.join(', ')}`,
      icon: 'target',
    },
  ],
};
```

### suggest-targeting Fallback Paths (~line 275, ~line 330):

**After (both):**
```typescript
return {
  success: true,
  message: `**Targeting Suggestion** (rule-based)\n\n` +
    `**Stages:** ${stageList}\n` +
    `**Reasoning:** ${fallbackSuggestion.reasoning}`,
  operations,
  suggestions: [
    {
      label: `Apply: ${stageList}`,
      template: `set stages to ${fallbackSuggestion.suggestedStages.join(', ')}`,
      icon: 'target',
    },
  ],
};
```

---

## Verification Steps

1. `npm run typecheck` - No errors
2. `npm run build` - Builds successfully
3. Manual test `/make-compelling` - Shows buttons
4. Manual test `/suggest-targeting` - Shows button
5. Click button - Populates input
6. Press Enter - Command executes
