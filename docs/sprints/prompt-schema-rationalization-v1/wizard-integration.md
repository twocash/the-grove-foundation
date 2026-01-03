# Wizard Integration: Unification Strategy

**Document:** wizard-integration.md  
**Location:** src/core/schema/  
**Created:** 2026-01-03  
**Status:** Planning (for future sprint)  
**Related Sprint:** prompt-schema-rationalization-v1

---

## Executive Summary

This document provides a comprehensive guide for unifying the Declarative Wizard Engine (Pattern 10) with the Prompt schema. The goal is to enable wizard steps to be managed as prompts within PromptWorkshop, providing a single console for all contextual content while preserving the wizard engine's flow control capabilities.

**Core Insight:** Prompts are the atomic unit of contextual content. Wizards are sequences of prompts with flow control.

---

## Current State

### Pattern 10: Declarative Wizard Engine

**Location:** `src/core/wizard/` (if implemented) or `src/data/wizards/`

**Current schema:**

```typescript
// Current wizard schema (separate from prompts)
interface WizardSchema {
  id: string;
  title: string;
  description?: string;
  steps: WizardStep[];
  onComplete?: (results: WizardResults) => void;
}

interface WizardStep {
  id: string;
  type: 'consent' | 'choice' | 'text' | 'generation' | 'selection' | 'confirmation';
  title: string;
  content: string;  // The prompt/question
  
  // Type-specific configuration
  choices?: { value: string; label: string; icon?: string }[];
  inputKey?: string;
  validation?: { required?: boolean; minLength?: number; maxLength?: number };
  
  // Flow control
  next?: string;
  nextConditions?: { if: string; then: string }[];
}

interface WizardResults {
  [stepId: string]: unknown;
}
```

**Current usage:** Custom Lens Creator, potential onboarding flows

### Prompt Schema (After Rationalization)

**Location:** `src/core/schema/prompt.ts`

```typescript
interface PromptPayload {
  executionPrompt: string;
  systemContext?: string;
  variant?: PromptVariant;
  topicAffinities: TopicAffinity[];
  lensAffinities: LensAffinity[];
  targeting: PromptTargeting;
  baseWeight: number;
  sequences?: PromptSequence[];
  stats: PromptStats;
  source: PromptSource;
  generatedFrom?: GenerationContext;
  cooldownMs?: number;
  maxShows?: number;
  wizardConfig?: WizardStepConfig;  // ← Integration point
}

interface WizardStepConfig {
  stepType: 'consent' | 'choice' | 'text' | 'generation' | 'selection' | 'confirmation';
  choices?: WizardChoice[];
  inputKey?: string;
  validation?: InputValidation;
  nextConditions?: ConditionalNext[];
  defaultNext?: string;
}
```

---

## Unification Architecture

### Principle: Content is Sovereign, Flow is Metadata

**Current (Separate):**
```
WizardSchema
├── steps[]
│   ├── step.content (the prompt text)
│   ├── step.type
│   └── step.nextConditions
```

**Unified:**
```
PromptWorkshop (single console)
├── Prompt objects
│   ├── meta (title, description, tags)
│   ├── payload.executionPrompt (the content)
│   ├── payload.sequences[{ groupType: 'wizard', groupId: 'custom-lens' }]
│   └── payload.wizardConfig (step behavior)
```

### How It Works

1. **Wizard steps become prompts** with `wizardConfig` populated
2. **Sequence membership** (`groupType: 'wizard'`) identifies wizard prompts
3. **Order** determined by `sequences[].order` field
4. **Flow control** defined in `wizardConfig.nextConditions`
5. **WizardEngine** loads prompts by sequence, executes flow

---

## Migration Path

### Phase 1: Schema Ready (This Sprint ✓)

**Completed:**
- `WizardStepConfig` added to PromptPayload
- `SequenceType` accepts 'wizard' (and any string)
- Sequence-scoped stats for wizard analytics

**No implementation changes.** Just schema preparation.

### Phase 2: Wizard Loader Adapter (Future Sprint)

**Goal:** WizardEngine can load wizard definition from prompts.

**Implementation:**

```typescript
// src/core/wizard/loadWizardFromPrompts.ts

import { supabase } from '@/lib/supabase';
import type { GroveObject } from '@/core/schema/grove-object';
import type { PromptPayload } from '@/core/schema/prompt';

interface LoadedWizard {
  id: string;
  title: string;
  description?: string;
  steps: WizardStep[];
}

export async function loadWizardFromPrompts(wizardId: string): Promise<LoadedWizard> {
  // 1. Fetch prompts in this wizard sequence
  const { data: prompts } = await supabase
    .from('prompts')
    .select('*')
    .contains('payload->sequences', [{ groupType: 'wizard', groupId: wizardId }]);

  if (!prompts || prompts.length === 0) {
    throw new Error(`No prompts found for wizard: ${wizardId}`);
  }

  // 2. Sort by sequence order
  const sorted = prompts.sort((a, b) => {
    const seqA = a.payload.sequences?.find(s => s.groupType === 'wizard' && s.groupId === wizardId);
    const seqB = b.payload.sequences?.find(s => s.groupType === 'wizard' && s.groupId === wizardId);
    return (seqA?.order ?? 0) - (seqB?.order ?? 0);
  });

  // 3. Convert to wizard steps
  const steps: WizardStep[] = sorted.map(prompt => ({
    id: prompt.meta.id,
    type: prompt.payload.wizardConfig?.stepType || 'text',
    title: prompt.meta.title,
    content: prompt.payload.executionPrompt,
    choices: prompt.payload.wizardConfig?.choices,
    inputKey: prompt.payload.wizardConfig?.inputKey,
    validation: prompt.payload.wizardConfig?.validation,
    next: prompt.payload.wizardConfig?.defaultNext,
    nextConditions: prompt.payload.wizardConfig?.nextConditions,
  }));

  // 4. Derive wizard metadata from first prompt or sequence config
  return {
    id: wizardId,
    title: `Wizard: ${wizardId}`, // Could be stored elsewhere
    description: undefined,
    steps,
  };
}
```

**WizardEngine changes:**

```typescript
// src/core/wizard/WizardEngine.ts

export class WizardEngine {
  private steps: WizardStep[];
  private currentStepIndex: number = 0;
  private results: WizardResults = {};

  // NEW: Load from prompts
  static async fromPrompts(wizardId: string): Promise<WizardEngine> {
    const wizard = await loadWizardFromPrompts(wizardId);
    return new WizardEngine(wizard);
  }

  // EXISTING: Load from static schema (backward compatible)
  static fromSchema(schema: WizardSchema): WizardEngine {
    return new WizardEngine(schema);
  }

  // ... rest of engine unchanged
}
```

### Phase 3: PromptEditor Wizard Tab (Future Sprint)

**Goal:** Edit wizard-specific config in PromptWorkshop.

**Implementation:**

Add "Wizard" tab to PromptEditor when `wizardConfig` is present:

```typescript
// src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx

// In tabs array:
const tabs = [
  { id: 'content', label: 'Content', icon: 'article' },
  { id: 'targeting', label: 'Targeting', icon: 'target' },
  { id: 'sequences', label: 'Sequences', icon: 'route' },
  // NEW: Conditional wizard tab
  ...(prompt.payload.wizardConfig ? [{ id: 'wizard', label: 'Wizard Step', icon: 'auto_fix' }] : []),
  { id: 'stats', label: 'Stats', icon: 'analytics' },
];

// Wizard tab content:
{activeTab === 'wizard' && prompt.payload.wizardConfig && (
  <WizardStepEditor
    config={prompt.payload.wizardConfig}
    onChange={(config) => handlePayloadChange('wizardConfig', config)}
    readonly={readonly}
  />
)}
```

**WizardStepEditor component:**

```typescript
// src/bedrock/consoles/PromptWorkshop/WizardStepEditor.tsx

interface WizardStepEditorProps {
  config: WizardStepConfig;
  onChange: (config: WizardStepConfig) => void;
  readonly?: boolean;
}

export function WizardStepEditor({ config, onChange, readonly }: WizardStepEditorProps) {
  return (
    <div className="space-y-4">
      {/* Step Type Selector */}
      <SelectField
        label="Step Type"
        value={config.stepType}
        options={[
          { value: 'consent', label: 'Consent' },
          { value: 'choice', label: 'Choice' },
          { value: 'text', label: 'Text Input' },
          { value: 'generation', label: 'AI Generation' },
          { value: 'selection', label: 'Selection' },
          { value: 'confirmation', label: 'Confirmation' },
        ]}
        onChange={(v) => onChange({ ...config, stepType: v })}
        disabled={readonly}
      />

      {/* Conditional fields based on stepType */}
      {config.stepType === 'choice' && (
        <ChoicesEditor
          choices={config.choices || []}
          onChange={(choices) => onChange({ ...config, choices })}
          readonly={readonly}
        />
      )}

      {config.stepType === 'text' && (
        <>
          <TextField
            label="Input Key"
            value={config.inputKey || ''}
            onChange={(v) => onChange({ ...config, inputKey: v })}
            disabled={readonly}
          />
          <ValidationEditor
            validation={config.validation}
            onChange={(v) => onChange({ ...config, validation: v })}
            readonly={readonly}
          />
        </>
      )}

      {/* Flow Control */}
      <FlowControlEditor
        nextConditions={config.nextConditions}
        defaultNext={config.defaultNext}
        onChange={(next) => onChange({ ...config, ...next })}
        readonly={readonly}
      />
    </div>
  );
}
```

### Phase 4: Wizard Sequence View (Future Sprint)

**Goal:** Visualize wizard flow in PromptWorkshop.

**Option A: Inline in Sequences Tab**

When filtering by a wizard sequence, show visual flow:

```
┌─────────────────────────────────────────────────┐
│ Wizard: custom-lens                              │
│                                                  │
│ ┌───────┐   ┌───────┐   ┌───────┐   ┌─────────┐ │
│ │Step 1 │──▶│Step 2 │──▶│Step 3 │──▶│Complete │ │
│ │Consent│   │Choice │   │Text   │   │Confirm  │ │
│ └───────┘   └───┬───┘   └───────┘   └─────────┘ │
│                 │                                │
│                 ▼ (if choice === 'worried')      │
│             ┌───────┐                            │
│             │Step 2b│                            │
│             │Reassur│                            │
│             └───────┘                            │
└─────────────────────────────────────────────────┘
```

**Option B: Separate Wizard View Console**

Create WizardWorkshop console that:
- Lists wizards (derived from sequence groupType: 'wizard')
- Shows visual flow diagram
- Links to prompts in PromptWorkshop for editing

**Recommendation:** Option A for MVP. The flat-with-filter pattern works, and adding a flow visualization within the Sequences tab maintains consistency.

### Phase 5: Wizard Analytics (Future Sprint)

**Goal:** Track wizard completion rates, drop-off points.

**Using sequence-scoped stats:**

```typescript
// Each prompt in wizard has:
sequences: [{
  groupType: 'wizard',
  groupId: 'custom-lens',
  order: 2,
  stats: {
    impressions: 1250,    // Times this step was shown
    selections: 1180,     // Times user completed this step
    completions: 1100,    // Times user reached next step
    avgDwellMs: 45000,    // Time spent on this step
  }
}]
```

**Derived metrics:**

| Metric | Calculation |
|--------|-------------|
| Wizard start rate | Step 1 impressions / page views |
| Step completion rate | step[n].selections / step[n].impressions |
| Wizard completion rate | Final step completions / Step 1 impressions |
| Drop-off point | First step where completion rate < threshold |
| Avg wizard duration | Sum of step avgDwellMs |

---

## Example: Custom Lens Wizard as Prompts

### Current (Separate Schema)

```json
{
  "id": "custom-lens-wizard",
  "title": "Create Your AI Perspective",
  "steps": [
    {
      "id": "motivation",
      "type": "choice",
      "title": "What brings you here?",
      "content": "Let's start by understanding what you're looking for...",
      "choices": [
        { "value": "curious", "label": "Just curious about AI" },
        { "value": "worried", "label": "Concerned about AI impact" },
        { "value": "professional", "label": "Professional interest" }
      ],
      "nextConditions": [
        { "if": "motivation === 'worried'", "then": "reassurance" }
      ],
      "next": "interests"
    },
    {
      "id": "reassurance",
      "type": "text",
      "title": "We hear you",
      "content": "It's completely valid to have concerns..."
    }
  ]
}
```

### Unified (Prompts with WizardConfig)

**Prompt 1:**
```json
{
  "meta": {
    "id": "prompt-wizard-lens-motivation",
    "type": "prompt",
    "title": "What brings you here?",
    "description": "First step of Custom Lens wizard",
    "icon": "psychology",
    "tags": ["wizard", "lens", "onboarding"],
    "status": "active"
  },
  "payload": {
    "executionPrompt": "Let's start by understanding what you're looking for. This will help me create an AI perspective that's truly useful for you.",
    "variant": "default",
    "source": "library",
    "sequences": [{
      "groupType": "wizard",
      "groupId": "custom-lens",
      "order": 1
    }],
    "wizardConfig": {
      "stepType": "choice",
      "choices": [
        { "value": "curious", "label": "Just curious about AI", "icon": "explore" },
        { "value": "worried", "label": "Concerned about AI impact", "icon": "warning" },
        { "value": "professional", "label": "Professional interest", "icon": "work" }
      ],
      "nextConditions": [
        { "if": "motivation === 'worried'", "then": "prompt-wizard-lens-reassurance" }
      ],
      "defaultNext": "prompt-wizard-lens-interests"
    },
    "topicAffinities": [],
    "lensAffinities": [],
    "targeting": { "requireMoment": true },
    "baseWeight": 50,
    "stats": { "impressions": 0, "selections": 0, "completions": 0 }
  }
}
```

**Prompt 2 (conditional):**
```json
{
  "meta": {
    "id": "prompt-wizard-lens-reassurance",
    "type": "prompt",
    "title": "We hear you",
    "description": "Reassurance step for concerned users",
    "icon": "support",
    "tags": ["wizard", "lens", "emotional"],
    "status": "active"
  },
  "payload": {
    "executionPrompt": "It's completely valid to have concerns about AI. Many thoughtful people share your perspective. Grove is designed to give you control over how AI shows up in your life...",
    "variant": "subtle",
    "source": "library",
    "sequences": [{
      "groupType": "wizard",
      "groupId": "custom-lens",
      "order": 1.5
    }],
    "wizardConfig": {
      "stepType": "text",
      "defaultNext": "prompt-wizard-lens-interests"
    },
    "topicAffinities": [{ "topic": "ai-safety", "strength": 0.8 }],
    "lensAffinities": [],
    "targeting": { "requireMoment": true },
    "baseWeight": 50,
    "stats": { "impressions": 0, "selections": 0, "completions": 0 }
  }
}
```

---

## DEX Compliance

### Declarative Sovereignty

**Pass:** Wizard behavior configured via `wizardConfig` JSON, not code.

- Domain experts can edit choices, validation, flow without code
- New step types can be added via config
- Flow conditions are declarative expressions

### Capability Agnosticism

**Pass:** Wizard prompts work with any model.

- `stepType: 'generation'` prompts use whatever model is available
- Flow control is model-independent
- Stats tracking works regardless of execution engine

### Provenance

**Pass:** Full attribution chain.

- `meta.createdBy` tracks who created wizard steps
- `generatedFrom` tracks AI-generated steps
- Sequence-scoped stats track per-wizard performance

### Organic Scalability

**Pass:** New wizard types without schema changes.

- `SequenceType` accepts any string
- `stepType` could be extended without schema changes
- New wizards created by adding prompts with new groupId

---

## Console Integration Patterns

### Filtering Wizard Prompts

```typescript
// PromptWorkshop.config.ts
filterOptions: [
  {
    field: 'payload.sequences',
    label: 'Sequence',
    options: [], // Derived dynamically
    customMatcher: (prompt, value) => {
      if (value === 'unsequenced') {
        return !prompt.payload.sequences || prompt.payload.sequences.length === 0;
      }
      // Parse "wizard:custom-lens" format
      const [type, id] = value.split(':');
      return prompt.payload.sequences?.some(
        s => s.groupType === type && s.groupId === id
      );
    },
  },
],
```

### Deriving Wizard List

```typescript
// usePromptData.ts
function deriveWizards(prompts: Prompt[]): WizardSummary[] {
  const wizardMap = new Map<string, WizardSummary>();

  for (const prompt of prompts) {
    for (const seq of prompt.payload.sequences || []) {
      if (seq.groupType === 'wizard') {
        const existing = wizardMap.get(seq.groupId);
        if (existing) {
          existing.stepCount++;
          existing.prompts.push(prompt);
        } else {
          wizardMap.set(seq.groupId, {
            id: seq.groupId,
            label: `Wizard: ${seq.groupId}`,
            stepCount: 1,
            prompts: [prompt],
          });
        }
      }
    }
  }

  return Array.from(wizardMap.values());
}
```

### Creating New Wizard Step

```typescript
// PromptCopilotActions.ts (future)
function createWizardStep(wizardId: string, stepType: WizardStepType): Partial<PromptPayload> {
  return {
    executionPrompt: '',
    variant: 'default',
    source: 'user',
    sequences: [{
      groupType: 'wizard',
      groupId: wizardId,
      order: 999, // Will be reordered
    }],
    wizardConfig: {
      stepType,
      defaultNext: undefined,
    },
    topicAffinities: [],
    lensAffinities: [],
    targeting: { requireMoment: true },
    baseWeight: 50,
    stats: { impressions: 0, selections: 0, completions: 0, avgEntropyDelta: 0, avgDwellMs: 0 },
  };
}
```

---

## Testing Strategy

### Unit Tests

| Test | Purpose |
|------|---------|
| `loadWizardFromPrompts.test.ts` | Verify prompts convert to wizard schema |
| `WizardEngine.fromPrompts.test.ts` | Verify engine runs with prompt-sourced steps |
| `WizardStepEditor.test.tsx` | Verify config editing UI |

### Integration Tests

| Test | Purpose |
|------|---------|
| Edit wizard step in PromptWorkshop | Verify changes persist |
| Run wizard from prompts | Verify flow control works |
| Wizard analytics | Verify sequence-scoped stats record |

### E2E Tests

| Test | Purpose |
|------|---------|
| Complete Custom Lens wizard | Full user flow |
| Create new wizard step | Admin flow |

---

## Migration of Existing Wizards

### Step 1: Export Current Wizard Schema

```typescript
// scripts/export-wizards.ts
const wizards = loadAllWizardSchemas();
for (const wizard of wizards) {
  console.log(JSON.stringify(wizard, null, 2));
}
```

### Step 2: Convert to Prompts

```typescript
// scripts/convert-wizard-to-prompts.ts
function convertWizardToPrompts(wizard: WizardSchema): GroveObject<PromptPayload>[] {
  return wizard.steps.map((step, index) => ({
    meta: {
      id: `prompt-wizard-${wizard.id}-${step.id}`,
      type: 'prompt',
      title: step.title,
      description: `Step ${index + 1} of ${wizard.title}`,
      icon: getIconForStepType(step.type),
      tags: ['wizard', wizard.id],
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    payload: {
      executionPrompt: step.content,
      variant: 'default',
      source: 'library',
      sequences: [{
        groupType: 'wizard',
        groupId: wizard.id,
        order: index + 1,
      }],
      wizardConfig: {
        stepType: step.type,
        choices: step.choices,
        inputKey: step.inputKey,
        validation: step.validation,
        nextConditions: step.nextConditions,
        defaultNext: step.next,
      },
      topicAffinities: [],
      lensAffinities: [],
      targeting: { requireMoment: true },
      baseWeight: 50,
      stats: { impressions: 0, selections: 0, completions: 0, avgEntropyDelta: 0, avgDwellMs: 0 },
    },
  }));
}
```

### Step 3: Seed Prompts

```bash
npx tsx scripts/convert-wizard-to-prompts.ts > wizard-prompts.json
npx tsx scripts/seed-prompts.ts wizard-prompts.json
```

### Step 4: Update WizardEngine Callers

```typescript
// Before
const engine = WizardEngine.fromSchema(customLensWizardSchema);

// After
const engine = await WizardEngine.fromPrompts('custom-lens');
```

---

## Open Questions (For Future Sprint)

1. **Wizard metadata storage:** Where does wizard-level metadata live (title, description)? Options:
   - First prompt in sequence
   - Separate WizardMeta record
   - Derived from sequence groupId

2. **Step reordering UX:** How do users reorder wizard steps?
   - Drag-and-drop in sequence view
   - Order field editing
   - Visual flow editor

3. **Branching complexity:** How complex can `nextConditions` be?
   - Simple equality: `motivation === 'worried'`
   - Boolean logic: `(age > 30) && (experience === 'professional')`
   - External data: `user.hasCompletedOnboarding === false`

4. **Wizard versioning:** How do we handle wizard changes for in-progress users?
   - Complete with old version
   - Force restart with new version
   - Merge where possible

---

## References

- **Sprint:** `docs/sprints/prompt-schema-rationalization-v1/`
- **Pattern 10:** Declarative Wizard Engine (Grove patterns doc)
- **Bedrock Contract:** `docs/contracts/BEDROCK-SPRINT-CONTRACT.md`
- **Console Factory:** `src/bedrock/patterns/console-factory.tsx`
- **Similar Pattern:** Journey waypoints already use prompt sequences

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-03 | Initial document created during prompt-schema-rationalization-v1 sprint |
