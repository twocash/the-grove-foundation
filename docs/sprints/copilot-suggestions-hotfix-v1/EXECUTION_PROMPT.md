# EXECUTION_PROMPT.md - copilot-suggestions-hotfix-v1

> **Sprint**: copilot-suggestions-hotfix-v1
> **Created**: 2026-01-06
> **For**: Claude Code or fresh context window

---

## ATTENTION ANCHOR

```
┌─────────────────────────────────────────────────────────────────┐
│ HOTFIX: Add clickable suggestions to Copilot actions           │
│                                                                 │
│ PROBLEM: /make-compelling and /suggest-targeting return text   │
│          telling users to "copy the full title" instead of     │
│          clickable buttons                                      │
│                                                                 │
│ FIX: Wire up suggestions array through type system and UI      │
│                                                                 │
│ FILES: 3 total                                                  │
│ SCOPE: ~50 lines changed                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Context

The `prompt-wiring-v1` sprint SPEC defined clickable suggestions but implementation only returned text. The `SuggestedAction` type already exists in `@core/copilot/schema.ts`:

```typescript
export interface SuggestedAction {
  label: string;
  template: string;
  icon?: string;
}
```

---

## Execution Steps

### Step 1: Update console-factory.types.ts

**File**: `src/bedrock/patterns/console-factory.types.ts`

1. Add import at top (around line 3):
```typescript
import type { SuggestedAction } from '@core/copilot/schema';
```

2. Add field to CopilotActionResult interface (around line 85):
```typescript
export interface CopilotActionResult {
  success: boolean;
  message: string;
  operations?: PatchOperation[];
  suggestions?: SuggestedAction[];  // ADD THIS
}
```

**Verify**: `npm run typecheck`

---

### Step 2: Update BedrockCopilot.tsx

**File**: `src/bedrock/primitives/BedrockCopilot.tsx`

1. Add import (around line 8):
```typescript
import type { SuggestedAction } from '../../core/copilot/schema';
```

2. Update CopilotMessage interface (around line 14):
```typescript
interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  suggestions?: SuggestedAction[];
}
```

3. Update ActionResult interface (around line 24):
```typescript
interface ActionResult {
  success: boolean;
  message: string;
  operations?: PatchOperation[];
  suggestions?: SuggestedAction[];
}
```

4. Capture suggestions in handleSubmit (find where assistantMsg is created, around line 135):
```typescript
const assistantMsg: CopilotMessage = {
  id: crypto.randomUUID(),
  role: 'assistant',
  content: result.message,
  suggestions: result.suggestions,  // ADD THIS
};
```

5. Render suggestions after message content. Find the assistant message rendering (around line 225) and add after `{message.content}`:

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

**Verify**: `npm run typecheck`

---

### Step 3: Update PromptCopilotActions.ts

**File**: `src/bedrock/consoles/PromptWorkshop/PromptCopilotActions.ts`

#### 3a. Update make-compelling handler

Find the `case 'make-compelling':` block (around line 343).

**API Success Path** - Replace the return statement after `const aiVariants = data.variants`:
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

**API Error Fallback** (around line 355) - Replace return:
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

**Network Error Fallback** (around line 390) - Replace return:
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

#### 3b. Update suggest-targeting handler

Find the `case 'suggest-targeting':` block (around line 245).

**API Success Path** (around line 302) - Add suggestions to return:
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

**API Error Fallback** (around line 275) - Add suggestions to return:
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

**Network Error Fallback** (around line 330) - Add suggestions to return:
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

**Verify**: `npm run typecheck && npm run build`

---

### Step 4: Manual Testing

1. Start dev server: `npm run dev`
2. Navigate to Prompt Workshop
3. Select a prompt
4. Type `/make-compelling` and press Enter
5. **Verify**: 3 clickable buttons appear
6. Click a title button
7. **Verify**: Input shows `set title to {title}`
8. Press Enter
9. **Verify**: Title updates
10. Type `/suggest-targeting` and press Enter
11. **Verify**: Apply button appears
12. Click Apply
13. **Verify**: Input shows `set stages to ...`

---

## Success Criteria

- [ ] `npm run typecheck` passes
- [ ] `npm run build` succeeds
- [ ] `/make-compelling` shows 3 clickable suggestions
- [ ] `/suggest-targeting` shows 1 clickable suggestion
- [ ] Clicking populates input with template
- [ ] Enter executes the command

---

## Update DEVLOG

After completion, update `docs/sprints/copilot-suggestions-hotfix-v1/DEVLOG.md`:
- Mark stories complete
- Note any issues encountered
- Record actual time spent
