# Architecture: prompt-schema-rationalization-v1

**Sprint:** prompt-schema-rationalization-v1  
**Status:** Planning  
**Created:** 2026-01-03

---

## Architectural Overview

This sprint enforces the GroveObject contract by eliminating redundancy between `meta` and `payload` in the Prompt schema. It also documents the path to wizard unification without implementing it.

```
┌─────────────────────────────────────────────────────────────────────┐
│                        GroveObject<PromptPayload>                   │
├─────────────────────────────────────────────────────────────────────┤
│ meta: GroveObjectMeta                                               │
│   ├── id, type ('prompt')                                           │
│   ├── title (display label)         ← CANONICAL for display        │
│   ├── description (subtitle)        ← CANONICAL for display        │
│   ├── icon, color                   ← CANONICAL for display        │
│   ├── tags[]                        ← CANONICAL for filtering      │
│   ├── status, favorite                                              │
│   └── createdAt, updatedAt, createdBy (provenance)                  │
├─────────────────────────────────────────────────────────────────────┤
│ payload: PromptPayload                                              │
│   ├── executionPrompt (AI instruction)                              │
│   ├── systemContext (optional system message)                       │
│   ├── variant (presentation style)                                  │
│   ├── topicAffinities[], lensAffinities[] (relevance)               │
│   ├── targeting (when to surface)                                   │
│   ├── sequences[] (optional sequence membership)                    │
│   ├── stats (analytics)                                             │
│   ├── source, generatedFrom (provenance)                            │
│   └── wizardConfig? (optional wizard step behavior)                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## DEX Compliance

### Declarative Sovereignty

**How domain experts can modify behavior:**

- Display fields (title, description, icon, tags) editable via PromptEditor
- Targeting rules configurable without code changes
- Sequence membership via JSON patch operations
- New sequence types accepted via string type

**No hardcoded prompt behavior.** All conditional surfacing driven by `targeting` and `affinities` fields.

### Capability Agnosticism

**How this works regardless of model:**

- Prompt schema is a data contract, not tied to any model
- Copilot actions generate patches that any UI can apply
- Relevance scoring algorithm is model-independent
- Stats tracking works with any execution engine

### Provenance

**How we track attribution:**

| Field | Purpose |
|-------|---------|
| `meta.createdAt` | When created |
| `meta.updatedAt` | When last modified |
| `meta.createdBy` | Human or AI attribution |
| `payload.source` | Origin: library, generated, user |
| `payload.generatedFrom` | AI generation context if applicable |
| `sequences[].stats` | Performance per sequence context |

### Organic Scalability

**How this grows without restructuring:**

- `SequenceType` accepts any string, not just predefined values
- `wizardConfig` is optional, doesn't affect non-wizard prompts
- New targeting criteria can be added without schema changes
- New affinity types can be added to arrays

---

## Key Design Decisions

### Decision 1: Meta vs Payload Separation

**Principle:** Meta handles identity and display. Payload handles behavior.

| Category | Location | Rationale |
|----------|----------|-----------|
| Title/description | meta | Common to all GroveObjects |
| Icon/color | meta | Display concern |
| Tags | meta | Filtering concern |
| Execution content | payload | Prompt-specific |
| Targeting rules | payload | Prompt-specific |
| Sequence membership | payload | Prompt-specific |

### Decision 2: Sequence-Scoped Stats

**Problem:** A prompt in multiple sequences has combined stats. Can't compare performance across sequences.

**Solution:** Optional `stats` field in each sequence membership:

```typescript
sequences: [{
  groupType: 'briefing',
  groupId: 'chiang',
  order: 3,
  stats: {
    impressions: 45,
    selections: 38,
    completions: 32,
    avgEntropyDelta: 0.15,
    avgDwellMs: 12500
  }
}]
```

**Trade-off:** Duplicates stats structure, but enables sequence comparison without separate analytics infrastructure.

### Decision 3: Variant → Color Derivation

**Problem:** How to determine `meta.color` from `payload.variant`?

**Solution:** Derive at read time, not storage:

```typescript
const VARIANT_COLORS: Record<PromptVariant, string> = {
  default: '#526F8A',  // slate
  glow: '#00FFCC',     // neon cyan
  subtle: '#9C9285',   // stone
  urgent: '#D95D39',   // clay
};

function getPromptColor(prompt: Prompt): string {
  return prompt.meta.color || VARIANT_COLORS[prompt.payload.variant || 'default'];
}
```

This allows color override via `meta.color` while providing sensible defaults.

### Decision 4: SequenceType as String

**Problem:** Hard-coded union type prevents new sequence types without schema changes.

**Solution:** Type definition accepts string:

```typescript
type SequenceType = 'journey' | 'briefing' | 'wizard' | 'tour' | 'research' | 'faq' | string;
```

**Config maintains known types:**

```typescript
// PromptWorkshop.config.ts
export const SEQUENCE_TYPE_CONFIG: Record<string, SequenceTypeConfig> = {
  journey: { label: 'Journey', icon: 'route', color: '#2F5C3B' },
  briefing: { label: 'Briefing', icon: 'article', color: '#526F8A' },
  wizard: { label: 'Wizard', icon: 'auto_fix', color: '#E0A83B' },
  tour: { label: 'Tour', icon: 'map', color: '#7EA16B' },
  research: { label: 'Research', icon: 'science', color: '#6B4B56' },
  faq: { label: 'FAQ', icon: 'help', color: '#9C9285' },
  // Unknown types get default styling
};

function getSequenceConfig(type: string): SequenceTypeConfig {
  return SEQUENCE_TYPE_CONFIG[type] || { 
    label: type, 
    icon: 'category', 
    color: '#526F8A' 
  };
}
```

### Decision 5: Wizard Config Structure

**Problem:** Pattern 10 (Declarative Wizard Engine) has separate schema. Future unification needs groundwork.

**Solution:** Add optional `wizardConfig` to PromptPayload:

```typescript
interface WizardStepConfig {
  stepType: 'consent' | 'choice' | 'text' | 'generation' | 'selection' | 'confirmation';
  
  // For 'choice' steps
  choices?: {
    value: string;
    label: string;
    icon?: string;
    next?: string;  // Step ID to go to
  }[];
  
  // For 'text' steps
  inputKey?: string;  // Key to store input
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  
  // For branching
  nextConditions?: {
    if: string;       // Expression: "motivation === 'worried'"
    then: string;     // Step ID
  }[];
  defaultNext?: string;
}
```

**This sprint:** Document only, don't implement wizard integration.

---

## Component Architecture

### PromptCopilotActions

Following LensCopilotActions pattern:

```typescript
// src/bedrock/consoles/PromptWorkshop/PromptCopilotActions.ts

export interface PromptCopilotContext {
  consoleId: 'prompt-workshop';
  selectedPrompt: Prompt | null;
  prompts: Prompt[];
  sequences: SequenceDefinition[];
}

export interface CopilotActionResult {
  success: boolean;
  message: string;
  operations?: PatchOperation[];
  suggestedPrompt?: Partial<PromptPayload>;
  testResults?: RelevanceTestResult[];
}

// Action handlers
export function parseSetCommand(input: string): PatchOperation[] | null;
export function suggestPrompt(context: PromptCopilotContext): Partial<PromptPayload>;
export function suggestTargeting(prompt: Prompt): PromptTargeting;
export function validatePrompt(prompt: Prompt): ValidationResult;
export function testRelevance(prompt: Prompt, context: TestContext): RelevanceTestResult[];
export async function handleCopilotAction(
  actionId: string,
  context: PromptCopilotContext,
  userInput?: string
): Promise<CopilotActionResult>;
```

### Migration Script

```typescript
// scripts/migrate-prompts-v2.ts

interface MigrationResult {
  total: number;
  migrated: number;
  skipped: number;
  errors: string[];
}

function isOldFormat(prompt: any): boolean {
  return 'label' in prompt.payload;
}

function migratePrompt(prompt: any): GroveObject<PromptPayload> {
  if (!isOldFormat(prompt)) return prompt;
  
  return {
    meta: {
      ...prompt.meta,
      title: prompt.payload.label || prompt.meta.title,
      description: prompt.payload.description || prompt.meta.description,
      icon: prompt.payload.icon || prompt.meta.icon,
      tags: prompt.payload.tags || prompt.meta.tags || [],
    },
    payload: {
      executionPrompt: prompt.payload.executionPrompt,
      systemContext: prompt.payload.systemContext,
      variant: prompt.payload.variant,
      topicAffinities: prompt.payload.topicAffinities,
      lensAffinities: prompt.payload.lensAffinities,
      targeting: prompt.payload.targeting,
      baseWeight: prompt.payload.baseWeight ?? 50,
      sequences: prompt.payload.sequences,
      stats: prompt.payload.stats,
      source: prompt.payload.source,
      generatedFrom: prompt.payload.generatedFrom,
      cooldownMs: prompt.payload.cooldownMs,
      maxShows: prompt.payload.maxShows,
    },
  };
}
```

---

## File Structure

```
src/core/schema/
├── prompt.ts                    # Updated schema
├── grove-object.ts              # Unchanged
└── wizard-integration.md        # NEW: Unification documentation

src/bedrock/consoles/PromptWorkshop/
├── index.ts                     # Unchanged
├── PromptCard.tsx               # Updated: read from meta
├── PromptEditor.tsx             # Updated: field paths
├── PromptWorkshop.config.ts     # Updated: sequence filter
├── usePromptData.ts             # Updated: createDefaultPrompt
└── PromptCopilotActions.ts      # NEW: Copilot handlers

scripts/
├── seed-prompts.ts              # Updated: new schema
└── migrate-prompts-v2.ts        # NEW: Migration script
```

---

## Integration Points

### With Console Factory

No changes to factory. PromptWorkshop already uses `createBedrockConsole`:

```typescript
export const PromptWorkshop = createBedrockConsole<PromptPayload>({
  config: promptWorkshopConfig,
  useData: usePromptData,
  CardComponent: PromptCard,
  EditorComponent: PromptEditor,
  copilotTitle: 'Prompt Copilot',
  copilotPlaceholder: 'Edit this prompt with AI...',
});
```

### With Supabase

Schema unchanged — payload is JSONB. Migration updates content within JSONB column.

### With Scoring/Suggestions

`src/explore/utils/scorePrompt.ts` and `src/explore/hooks/usePromptSuggestions.ts` read from payload (unchanged fields).

---

## Testing Strategy

### Unit Tests

| Test | Purpose |
|------|---------|
| `prompt.schema.test.ts` | Validate new type definitions |
| `migrate-prompts.test.ts` | Verify migration handles both formats |
| `PromptCopilotActions.test.ts` | Verify action handlers |

### Integration Tests

| Test | Purpose |
|------|---------|
| PromptCard rendering | Verify reads from meta correctly |
| PromptEditor updates | Verify patches apply to correct paths |

### E2E Tests

| Test | Purpose |
|------|---------|
| PromptWorkshop flow | Create, edit, delete prompt |
| Copilot interaction | Natural language commands |

---

## Future Considerations

### Wizard Unification (Future Sprint)

When Pattern 10 (Declarative Wizard Engine) is actively developed:

1. Wizard steps become prompts with `wizardConfig` populated
2. Wizard schema references prompts by ID
3. WizardEngine loads prompts via `usePromptData`
4. Same analytics, same console, different view

See `src/core/schema/wizard-integration.md` for detailed unification guide.

### Sequence First-Class Objects (If Needed)

If users need sequence-level metadata:

1. Create `GroveObject<SequencePayload>`
2. Prompts reference sequences by ID
3. Migration derives Sequence objects from existing prompt data
4. No breaking change to prompt schema

### Cross-Prompt Analytics (Future)

For aggregate insights:

1. Add analytics event stream
2. Track `{ promptId, sequenceType, sequenceId, event, timestamp }`
3. Build analytics dashboard
