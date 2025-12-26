# Architecture: Copilot Configurator v1

**Sprint:** copilot-configurator-v1  
**Version:** 1.0

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Object Inspector                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  META Section (existing)                                             │   │
│  │  └─ JSON fields with syntax highlighting                            │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  PAYLOAD Section (existing)                                          │   │
│  │  └─ Type-specific JSON fields                                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  CopilotPanel (NEW)                                    [Collapsible] │   │
│  │  ├─ Header: "✨ Copilot Configurator" [Beta] [▼]                    │   │
│  │  ├─ MessageHistory                                                   │   │
│  │  │   ├─ CopilotMessage (assistant)                                  │   │
│  │  │   │   └─ SuggestedActions / DiffPreview                          │   │
│  │  │   └─ CopilotMessage (user)                                       │   │
│  │  ├─ InputArea                                                        │   │
│  │  │   ├─ Textarea                                                    │   │
│  │  │   └─ [History] [Send]                                            │   │
│  │  └─ Footer: ● Model: Local 7B (Simulated)                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

```
User Input                    Copilot Core                    UI Update
    │                              │                              │
    ▼                              │                              │
"set title to X"                   │                              │
    │                              │                              │
    └──────────────────────────────▶                              │
                              IntentParser                        │
                                   │                              │
                                   ▼                              │
                         { intent: SET_FIELD,                     │
                           field: 'title',                        │
                           value: 'X' }                           │
                                   │                              │
                                   ▼                              │
                           PatchGenerator                         │
                                   │                              │
                                   ▼                              │
                         [{ op: 'replace',                        │
                            path: '/meta/title',                  │
                            value: 'X' }]                         │
                                   │                              │
                                   ▼                              │
                            Validator                             │
                                   │                              │
                         ┌─────────┴─────────┐                    │
                         │                   │                    │
                       Valid              Invalid                 │
                         │                   │                    │
                         ▼                   ▼                    │
                    DiffPreview         ErrorMessage              │
                         │                   │                    │
                         └───────────────────┴────────────────────▶
                                                          MessageHistory
                                                                  │
                                                   User clicks [Apply]
                                                                  │
                                                                  ▼
                                                          applyPatch()
                                                                  │
                                                                  ▼
                                                       Object Updated
                                                       JSON re-renders
```

---

## Core Types

### src/core/copilot/schema.ts

```typescript
// Message types
export type MessageRole = 'user' | 'assistant' | 'system';

export interface CopilotMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  patch?: JsonPatch;           // If message proposes a change
  patchStatus?: 'pending' | 'applied' | 'rejected';
  suggestions?: SuggestedAction[];
}

// Intent parsing
export type IntentType =
  | 'SET_FIELD'
  | 'UPDATE_FIELD'
  | 'ADD_TAG'
  | 'REMOVE_TAG'
  | 'TOGGLE_FAVORITE'
  | 'UNKNOWN';

export interface ParsedIntent {
  type: IntentType;
  field?: string;              // Target field path
  value?: unknown;             // New value (if applicable)
  modifier?: string;           // "shorter", "more mysterious", etc.
  confidence: number;          // 0-1 confidence score
}

// JSON Patch (RFC 6902)
export interface JsonPatchOperation {
  op: 'add' | 'remove' | 'replace' | 'move' | 'copy' | 'test';
  path: string;
  value?: unknown;
  from?: string;
}

export type JsonPatch = JsonPatchOperation[];

// Suggested actions
export interface SuggestedAction {
  label: string;               // Display text
  template: string;            // Input template when clicked
  icon?: string;               // Optional icon
}

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  path: string;
  message: string;
  code: 'INVALID_PATH' | 'TYPE_MISMATCH' | 'REQUIRED_FIELD' | 'INVALID_VALUE';
}

// Model configuration
export interface ModelConfig {
  id: string;
  name: string;                // Display name
  type: 'simulated' | 'local' | 'api';
  latencyMs: [number, number]; // Min/max response time
}

// Copilot state
export interface CopilotState {
  messages: CopilotMessage[];
  isProcessing: boolean;
  isCollapsed: boolean;
  currentModel: ModelConfig;
  pendingPatch: JsonPatch | null;
}
```

---

## Component Architecture

### Component Hierarchy

```
ObjectInspector (modified)
├── CollapsibleSection (META)
├── CollapsibleSection (PAYLOAD)
├── CopyButton
└── CopilotPanel (NEW)
    ├── CopilotHeader
    │   ├── Title + Badge
    │   └── CollapseToggle
    ├── MessageHistory
    │   └── CopilotMessage[]
    │       ├── MessageBubble
    │       ├── SuggestedActions?
    │       └── DiffPreview?
    ├── InputArea
    │   ├── Textarea
    │   ├── HistoryButton
    │   └── SendButton
    └── CopilotFooter
        └── ModelIndicator
```

### CopilotPanel.tsx

```typescript
interface CopilotPanelProps {
  object: GroveObject;
  onApplyPatch: (patch: JsonPatch) => void;
}

export function CopilotPanel({ object, onApplyPatch }: CopilotPanelProps) {
  const {
    messages,
    isProcessing,
    isCollapsed,
    currentModel,
    sendMessage,
    applyPatch,
    toggleCollapse,
  } = useCopilot(object);

  if (isCollapsed) {
    return <CollapsedCopilotBar onExpand={toggleCollapse} />;
  }

  return (
    <div className="copilot-panel">
      <CopilotHeader onCollapse={toggleCollapse} />
      <MessageHistory messages={messages} onApply={applyPatch} />
      <InputArea 
        onSend={sendMessage} 
        disabled={isProcessing}
        suggestions={getSuggestionsForType(object.meta.type)}
      />
      <CopilotFooter model={currentModel} isProcessing={isProcessing} />
    </div>
  );
}
```

### useCopilot Hook

```typescript
interface UseCopilotReturn {
  messages: CopilotMessage[];
  isProcessing: boolean;
  isCollapsed: boolean;
  currentModel: ModelConfig;
  sendMessage: (content: string) => Promise<void>;
  applyPatch: (messageId: string) => void;
  rejectPatch: (messageId: string) => void;
  toggleCollapse: () => void;
}

export function useCopilot(object: GroveObject): UseCopilotReturn {
  const [state, dispatch] = useReducer(copilotReducer, initialState);

  const sendMessage = async (content: string) => {
    // 1. Add user message
    dispatch({ type: 'ADD_MESSAGE', role: 'user', content });
    dispatch({ type: 'SET_PROCESSING', value: true });

    // 2. Parse intent
    const intent = parseIntent(content);

    // 3. Generate patch (or error)
    if (intent.type === 'UNKNOWN') {
      dispatch({ 
        type: 'ADD_MESSAGE', 
        role: 'assistant', 
        content: "I didn't understand that. Try something like 'set title to X' or 'add tag Y'."
      });
    } else {
      const patch = generatePatch(intent, object);
      const validation = validatePatch(patch, object.meta.type);

      if (validation.valid) {
        // Simulate processing delay
        await simulateDelay(state.currentModel.latencyMs);
        
        dispatch({
          type: 'ADD_MESSAGE',
          role: 'assistant',
          content: generatePatchDescription(patch),
          patch,
        });
      } else {
        dispatch({
          type: 'ADD_MESSAGE',
          role: 'assistant',
          content: formatValidationErrors(validation.errors),
        });
      }
    }

    dispatch({ type: 'SET_PROCESSING', value: false });
  };

  // ... rest of implementation
}
```

---

## Intent Parser

### Pattern Matching Rules

```typescript
// src/core/copilot/parser.ts

const INTENT_PATTERNS: IntentPattern[] = [
  // SET_FIELD patterns
  {
    regex: /^(set|change|update)\s+(?:the\s+)?(\w+)\s+to\s+['"]?(.+?)['"]?$/i,
    intent: 'SET_FIELD',
    extract: (match) => ({ field: match[2], value: match[3] }),
  },
  {
    regex: /^(?:make|set)\s+(?:the\s+)?(\w+)\s+(shorter|longer|more\s+\w+|less\s+\w+)$/i,
    intent: 'UPDATE_FIELD',
    extract: (match) => ({ field: match[1], modifier: match[2] }),
  },
  // ADD_TAG patterns
  {
    regex: /^add\s+(?:a\s+)?tag\s+['"]?(.+?)['"]?$/i,
    intent: 'ADD_TAG',
    extract: (match) => ({ value: match[1] }),
  },
  // REMOVE_TAG patterns
  {
    regex: /^remove\s+(?:the\s+)?tag\s+['"]?(.+?)['"]?$/i,
    intent: 'REMOVE_TAG',
    extract: (match) => ({ value: match[1] }),
  },
  // TOGGLE_FAVORITE patterns
  {
    regex: /^(mark|set)\s+(?:as\s+)?favorite$/i,
    intent: 'TOGGLE_FAVORITE',
    extract: () => ({ value: true }),
  },
  {
    regex: /^(unmark|remove)\s+(?:from\s+)?favorite$/i,
    intent: 'TOGGLE_FAVORITE',
    extract: () => ({ value: false }),
  },
];

export function parseIntent(input: string): ParsedIntent {
  const normalized = input.trim().toLowerCase();
  
  for (const pattern of INTENT_PATTERNS) {
    const match = normalized.match(pattern.regex);
    if (match) {
      return {
        type: pattern.intent,
        ...pattern.extract(match),
        confidence: 0.9,
      };
    }
  }

  return { type: 'UNKNOWN', confidence: 0 };
}
```

---

## Patch Generator

### Field Path Mapping

```typescript
// src/core/copilot/patch-generator.ts

const FIELD_PATH_MAP: Record<string, string> = {
  // Meta fields
  'title': '/meta/title',
  'description': '/meta/description',
  'icon': '/meta/icon',
  'color': '/meta/color',
  'status': '/meta/status',
  'favorite': '/meta/favorite',
  
  // Common payload fields (type-agnostic)
  'duration': '/payload/estimatedMinutes',
  'time': '/payload/estimatedMinutes',
  'minutes': '/payload/estimatedMinutes',
};

export function generatePatch(
  intent: ParsedIntent,
  object: GroveObject
): JsonPatch {
  switch (intent.type) {
    case 'SET_FIELD': {
      const path = FIELD_PATH_MAP[intent.field!] || `/meta/${intent.field}`;
      return [{ op: 'replace', path, value: intent.value }];
    }
    
    case 'UPDATE_FIELD': {
      // For modifiers like "shorter", "more mysterious"
      // In MVP, generate placeholder; real model would rewrite
      const path = FIELD_PATH_MAP[intent.field!] || `/meta/${intent.field}`;
      const currentValue = getValueAtPath(object, path);
      const newValue = applyModifier(currentValue, intent.modifier!);
      return [{ op: 'replace', path, value: newValue }];
    }
    
    case 'ADD_TAG': {
      return [{ op: 'add', path: '/meta/tags/-', value: intent.value }];
    }
    
    case 'REMOVE_TAG': {
      const tags = object.meta.tags || [];
      const index = tags.indexOf(intent.value as string);
      if (index === -1) return [];
      return [{ op: 'remove', path: `/meta/tags/${index}` }];
    }
    
    case 'TOGGLE_FAVORITE': {
      return [{ op: 'replace', path: '/meta/favorite', value: intent.value }];
    }
    
    default:
      return [];
  }
}
```

---

## Simulated Model Responses

### Response Templates

```typescript
// src/core/copilot/simulator.ts

const RESPONSE_TEMPLATES = {
  SET_FIELD: (field: string, value: unknown) =>
    `I've drafted a change to set **${field}** to "${value}". How does this look?`,
  
  UPDATE_FIELD: (field: string, modifier: string, oldValue: string, newValue: string) =>
    `I've made the ${field} ${modifier}. Here's the change:`,
  
  ADD_TAG: (tag: string) =>
    `I'll add the tag "${tag}" to this object.`,
  
  REMOVE_TAG: (tag: string) =>
    `I'll remove the tag "${tag}" from this object.`,
  
  TOGGLE_FAVORITE: (isFavorite: boolean) =>
    isFavorite 
      ? `I'll mark this as a favorite. ⭐`
      : `I'll remove this from favorites.`,
  
  APPLIED: () =>
    `✓ Changes applied successfully.`,
  
  ERROR_UNKNOWN: () =>
    `I didn't quite understand that. Try something like:\n` +
    `• "Set title to 'New Title'"\n` +
    `• "Add tag 'important'"\n` +
    `• "Make description shorter"`,
  
  ERROR_VALIDATION: (errors: ValidationError[]) =>
    `I can't make that change:\n` +
    errors.map(e => `• ${e.message}`).join('\n'),
};

export async function simulateResponse(
  intent: ParsedIntent,
  patch: JsonPatch,
  config: ModelConfig
): Promise<string> {
  // Random delay within configured range
  const [min, max] = config.latencyMs;
  const delay = min + Math.random() * (max - min);
  await new Promise(resolve => setTimeout(resolve, delay));

  // Return appropriate template
  return RESPONSE_TEMPLATES[intent.type]?.(...extractArgs(intent)) 
    || RESPONSE_TEMPLATES.ERROR_UNKNOWN();
}
```

---

## Diff Preview Component

```typescript
// src/shared/inspector/DiffPreview.tsx

interface DiffPreviewProps {
  patch: JsonPatch;
  object: GroveObject;
}

export function DiffPreview({ patch, object }: DiffPreviewProps) {
  const diffs = patch.map(op => {
    const currentValue = getValueAtPath(object, op.path);
    
    return {
      path: op.path,
      op: op.op,
      oldValue: op.op === 'add' ? null : currentValue,
      newValue: op.op === 'remove' ? null : op.value,
    };
  });

  return (
    <div className="diff-preview font-mono text-xs bg-slate-950 rounded-lg p-3 mt-2">
      {diffs.map((diff, i) => (
        <div key={i} className="space-y-1">
          {diff.oldValue !== null && (
            <div className="flex gap-2 text-red-400 line-through opacity-60">
              <span>-</span>
              <span>"{truncate(String(diff.oldValue), 60)}"</span>
            </div>
          )}
          {diff.newValue !== null && (
            <div className="flex gap-2 text-green-400">
              <span>+</span>
              <span>"{truncate(String(diff.newValue), 60)}"</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

---

## Styling Tokens

### New `--copilot-*` Namespace

```css
/* globals.css addition */

:root {
  /* Copilot panel */
  --copilot-bg: rgba(15, 23, 42, 0.95);
  --copilot-border: rgba(99, 102, 241, 0.3);
  --copilot-header-bg: linear-gradient(to right, rgba(67, 56, 202, 0.4), rgba(15, 23, 42, 1));
  
  /* Messages */
  --copilot-msg-assistant-bg: rgba(67, 56, 202, 0.2);
  --copilot-msg-assistant-border: rgba(99, 102, 241, 0.2);
  --copilot-msg-user-bg: rgba(51, 65, 85, 1);
  --copilot-msg-user-border: rgba(71, 85, 105, 1);
  
  /* Actions */
  --copilot-btn-primary: rgb(79, 70, 229);
  --copilot-btn-primary-hover: rgb(99, 102, 241);
  --copilot-btn-secondary: rgba(51, 65, 85, 1);
  
  /* Diff */
  --copilot-diff-add: rgb(74, 222, 128);
  --copilot-diff-remove: rgb(248, 113, 113);
  
  /* Model indicator */
  --copilot-model-ready: rgb(34, 197, 94);
  --copilot-model-processing: rgb(251, 191, 36);
}
```

---

## DEX Compliance

### Declarative Sovereignty

- Intent patterns defined in array, not hardcoded switches
- Field mappings in configuration object
- Response templates externalized

### Capability Agnosticism

- `ModelConfig` interface abstracts model details
- Same flow works with simulated, local, or API models
- Only `simulateDelay` changes between implementations

### Provenance

- All messages timestamped
- Patch operations include source
- Applied changes could log: `{ source: 'copilot', model: 'local-7b-simulated', timestamp }`

### Organic Scalability

- New intent patterns = add to array
- New object types = add field mappings
- New suggestions = extend by type

---

## Testing Strategy

### Unit Tests

```typescript
// Intent parser
describe('parseIntent', () => {
  it('parses SET_FIELD intent', () => {
    expect(parseIntent("set title to 'New Title'")).toMatchObject({
      type: 'SET_FIELD',
      field: 'title',
      value: 'New Title',
    });
  });
  
  it('returns UNKNOWN for gibberish', () => {
    expect(parseIntent('asdfasdf')).toMatchObject({
      type: 'UNKNOWN',
    });
  });
});

// Patch generator
describe('generatePatch', () => {
  it('generates replace operation for SET_FIELD', () => {
    const intent = { type: 'SET_FIELD', field: 'title', value: 'New' };
    const patch = generatePatch(intent, mockObject);
    expect(patch).toEqual([
      { op: 'replace', path: '/meta/title', value: 'New' }
    ]);
  });
});
```

### E2E Tests

```typescript
describe('Copilot Panel', () => {
  it('shows diff preview and applies change', async () => {
    await page.goto('/explore/journeys');
    await page.click('[data-testid="journey-card"]');
    
    // Copilot should be visible in inspector
    await expect(page.locator('.copilot-panel')).toBeVisible();
    
    // Send a message
    await page.fill('[data-testid="copilot-input"]', "set title to 'Test'");
    await page.click('[data-testid="copilot-send"]');
    
    // Wait for response
    await expect(page.locator('.diff-preview')).toBeVisible();
    
    // Apply the change
    await page.click('[data-testid="copilot-apply"]');
    
    // Verify change reflected
    await expect(page.locator('.json-string')).toContainText('Test');
  });
});
```
