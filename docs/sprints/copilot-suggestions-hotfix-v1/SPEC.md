# SPEC.md - copilot-suggestions-hotfix-v1

> **Sprint**: copilot-suggestions-hotfix-v1
> **Created**: 2026-01-06
> **Status**: 📋 SPECIFICATION

---

## ATTENTION ANCHOR

```
┌─────────────────────────────────────────────────────────────────┐
│ WE ARE FIXING: Missing clickable suggestions in Copilot        │
│                                                                 │
│ SUCCESS LOOKS LIKE:                                             │
│   • /make-compelling shows 3 clickable title buttons            │
│   • /suggest-targeting shows "Apply" button                     │
│   • Clicking populates input, user presses Enter to apply       │
│                                                                 │
│ WE ARE NOT:                                                     │
│   • Changing any other Copilot behavior                         │
│   • Adding new features                                         │
│   • Modifying backend APIs                                      │
│                                                                 │
│ SCOPE: 3 files, ~50 lines changed                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Epic 1: Type System Update

**Goal**: Add suggestions field to action result types

### 1.1 Update console-factory.types.ts

```typescript
import type { SuggestedAction } from '@core/copilot/schema';

export interface CopilotActionResult {
  success: boolean;
  message: string;
  operations?: PatchOperation[];
  suggestions?: SuggestedAction[];  // ADD
}
```

---

## Epic 2: BedrockCopilot UI

**Goal**: Render clickable suggestions after messages

### 2.1 Update Local Types

```typescript
// Add import at top
import type { SuggestedAction } from '../../core/copilot/schema';

// Update CopilotMessage interface (~line 14)
interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  suggestions?: SuggestedAction[];  // ADD
}

// Update ActionResult interface (~line 24)
interface ActionResult {
  success: boolean;
  message: string;
  operations?: PatchOperation[];
  suggestions?: SuggestedAction[];  // ADD
}
```

### 2.2 Capture Suggestions in handleSubmit

In the `handleSubmit` function, after getting result from action:

```typescript
// Add assistant response (~line 135)
const assistantMsg: CopilotMessage = {
  id: crypto.randomUUID(),
  role: 'assistant',
  content: result.message,
  suggestions: result.suggestions,  // ADD THIS LINE
};
```

### 2.3 Render Suggestions

After the message content rendering (~line 225), add suggestion buttons:

```tsx
{message.role === 'assistant' && (
  <span className="inline-block px-3 py-2 rounded-lg bg-[var(--glass-solid)] text-[var(--glass-text-secondary)] max-w-[80%] text-left whitespace-pre-wrap">
    {message.content}
    {/* ADD SUGGESTIONS RENDERING */}
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
  </span>
)}
```

---

## Epic 3: Action Handler Updates

**Goal**: Return suggestions arrays from handlers

### 3.1 Update make-compelling Handler

In `PromptCopilotActions.ts`, update the `make-compelling` case:

**API Success Path (~line 373):**
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

**Fallback Paths (API error & network error):**
```typescript
return {
  success: true,
  message: `(Fallback) Title suggestions:`,
  suggestions: fallbackVariants.map(v => ({
    label: v.title.length > 40 ? v.title.slice(0, 37) + '...' : v.title,
    template: `set title to ${v.title}`,
    icon: 'auto_awesome',
  })),
};
```

### 3.2 Update suggest-targeting Handler

**API Success Path (~line 302):**
```typescript
return {
  success: true,
  message: `**AI Targeting Applied ✓**\n\n...`,
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

**Fallback Paths:**
```typescript
return {
  success: true,
  message: `(Fallback) Suggested stages: ${stageList}`,
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

## Visual Design

```
┌─────────────────────────────────────────────┐
│ Here are 3 AI-generated title suggestions:  │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ ✨ What drives the Observer Dynamic?    │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ ✨ Exploring the Observer Dynamic       │ │
│ └─────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────┐ │
│ │ ✨ The Observer Dynamic: A Deep Dive    │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

Clicking a button populates input with `set title to {full title}`.

---

## Acceptance Criteria

| Test | Expected |
|------|----------|
| Type `/make-compelling` | See 3 clickable buttons |
| Click title button | Input shows `set title to {title}` |
| Press Enter | Title updates |
| Type `/suggest-targeting` | See "Apply" button |
| Click Apply | Input shows `set stages to genesis, exploration` |
