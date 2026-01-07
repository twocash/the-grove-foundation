# ARCHITECTURE.md - copilot-suggestions-hotfix-v1

> **Sprint**: copilot-suggestions-hotfix-v1
> **Created**: 2026-01-06

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    SUGGESTIONS FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  User types: /make-compelling                                   │
│              ↓                                                  │
│  PromptCopilotActions.ts                                        │
│    → generateVariants() or API call                             │
│    → Returns { message, suggestions: [...] }                    │
│              ↓                                                  │
│  console-factory.tsx                                            │
│    → Passes result to BedrockCopilot                            │
│              ↓                                                  │
│  BedrockCopilot.tsx                                             │
│    → Stores suggestions in CopilotMessage                       │
│    → Renders clickable buttons                                  │
│              ↓                                                  │
│  User clicks button                                             │
│    → setInput(suggestion.template)                              │
│    → User presses Enter                                         │
│    → Command executes normally                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| `PromptCopilotActions.ts` | Generate suggestions array with label/template/icon |
| `console-factory.types.ts` | Define type contract for suggestions |
| `BedrockCopilot.tsx` | Render and handle clicks on suggestions |

---

## Type Hierarchy

```typescript
// Core type (already exists)
interface SuggestedAction {
  label: string;      // Button text
  template: string;   // Command to populate
  icon?: string;      // Material icon name
}

// Action result (adding suggestions)
interface CopilotActionResult {
  success: boolean;
  message: string;
  operations?: PatchOperation[];
  suggestions?: SuggestedAction[];  // NEW
}

// Message storage (adding suggestions)
interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  suggestions?: SuggestedAction[];  // NEW
}
```

---

## Interaction Pattern

```
┌──────────────────────────────────────────────────────┐
│ BedrockCopilot                                       │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │ Assistant message                              │  │
│  │ "Here are 3 title suggestions:"                │  │
│  │                                                │  │
│  │  ┌──────────────┐ ┌──────────────┐            │  │
│  │  │ ✨ Title A   │ │ ✨ Title B   │            │  │
│  │  └──────────────┘ └──────────────┘            │  │
│  │  ┌──────────────┐                             │  │
│  │  │ ✨ Title C   │                             │  │
│  │  └──────────────┘                             │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │ > set title to Title A                    [↵] │  │
│  └────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

Click → Populate input → User confirms → Execute

---

## Design Decisions

### Why populate input instead of auto-execute?

1. **User control** - User sees exactly what will happen
2. **Editable** - User can modify before executing
3. **Consistent** - Same pattern as typing commands
4. **Safe** - No accidental changes

### Why use existing SuggestedAction type?

1. **Already defined** in `@core/copilot/schema`
2. **Matches pattern** from inspector suggestions
3. **No new types** needed

---

## Styling

Uses existing CSS variables:
- `--neon-green` for suggestion buttons
- `--glass-border` for separator
- Rounded pill shape for compact display
