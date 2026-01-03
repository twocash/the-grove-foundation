# Execution Prompt: prompt-schema-rationalization-v1

**Sprint:** prompt-schema-rationalization-v1  
**Created:** 2026-01-03  
**For:** Claude Code CLI

---

## Context

You are implementing a schema rationalization sprint for the Grove Terminal's PromptWorkshop console. This sprint eliminates redundancy between `meta` and `payload` fields in the Prompt schema, adds Copilot actions (required by Bedrock Contract Article III), and documents wizard unification for a future sprint.

## Pre-Implementation Checklist

Before writing any code:

1. Read the sprint artifacts in order:
   - `docs/sprints/prompt-schema-rationalization-v1/REPO_AUDIT.md`
   - `docs/sprints/prompt-schema-rationalization-v1/SPEC.md`
   - `docs/sprints/prompt-schema-rationalization-v1/ARCHITECTURE.md`
   - `docs/sprints/prompt-schema-rationalization-v1/MIGRATION_MAP.md`
   - `docs/sprints/prompt-schema-rationalization-v1/SPRINTS.md`

2. Read the referenced contracts and patterns:
   - `docs/contracts/BEDROCK-SPRINT-CONTRACT.md`
   - `PROJECT_PATTERNS.md`

3. Read the reference implementation:
   - `src/bedrock/consoles/LensWorkshop/LensCopilotActions.ts` (Copilot pattern)

4. Examine current implementation:
   - `src/core/schema/prompt.ts`
   - `src/bedrock/consoles/PromptWorkshop/*`

---

## Implementation Order

Execute epics in this order. Complete each epic's build gate before proceeding.

### Epic 1: Schema Rationalization

**Files to modify:**
- `src/core/schema/prompt.ts`

**Changes:**

```typescript
// 1. Add type aliases
export type PromptVariant = 'default' | 'glow' | 'subtle' | 'urgent';
export type PromptSource = 'library' | 'generated' | 'user';
export type SequenceType = 'journey' | 'briefing' | 'wizard' | 'tour' | 'research' | 'faq' | string;

// 2. Update PromptSequence - add optional stats
export interface PromptSequence {
  groupType: SequenceType;
  groupId: string;
  order: number;
  titleOverride?: string;
  bridgeAfter?: string;
  successCriteria?: SuccessCriteria;
  stats?: PromptStats;  // NEW
}

// 3. Add WizardStepConfig
export interface WizardChoice {
  value: string;
  label: string;
  icon?: string;
  next?: string;
}

export interface InputValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

export interface ConditionalNext {
  if: string;
  then: string;
}

export interface WizardStepConfig {
  stepType: 'consent' | 'choice' | 'text' | 'generation' | 'selection' | 'confirmation';
  choices?: WizardChoice[];
  inputKey?: string;
  validation?: InputValidation;
  nextConditions?: ConditionalNext[];
  defaultNext?: string;
}

// 4. Update PromptPayload - REMOVE redundant fields, ADD wizardConfig
export interface PromptPayload {
  // REMOVED: label, description, icon, tags (now in meta only)
  
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
  wizardConfig?: WizardStepConfig;  // NEW
}

// 5. Add comment pointing to wizard documentation
/**
 * WizardStepConfig enables prompts to function as wizard steps.
 * See: src/core/schema/wizard-integration.md for unification plan.
 */
```

**Build gate:**
```bash
npm run typecheck
```

---

### Epic 2: Component Updates

**Files to modify:**
- `src/bedrock/consoles/PromptWorkshop/PromptCard.tsx`
- `src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx`
- `src/bedrock/consoles/PromptWorkshop/usePromptData.ts`
- `src/bedrock/consoles/PromptWorkshop/PromptWorkshop.config.ts`

**PromptCard.tsx changes:**
```typescript
// Replace all instances of:
prompt.payload.label       → prompt.meta.title
prompt.payload.description → prompt.meta.description
prompt.payload.icon        → prompt.meta.icon
prompt.payload.tags        → prompt.meta.tags
```

**PromptEditor.tsx changes:**
```typescript
// 1. Add handleMetaChange function
const handleMetaChange = (field: keyof GroveObjectMeta, value: unknown) => {
  if (readonly) return;
  onUpdate([{ op: 'replace', path: `/meta/${field}`, value }]);
};

// 2. Update Content tab fields to use handleMetaChange for:
// - title (was label)
// - description
// - icon
// - tags
```

**usePromptData.ts changes:**
```typescript
// Update createDefaultPrompt - remove payload.label, payload.description, etc.
export function createDefaultPrompt(): GroveObject<PromptPayload> {
  const now = new Date().toISOString();
  return {
    meta: {
      id: `prompt-${Date.now()}`,
      type: 'prompt',
      title: 'New Prompt',
      description: '',
      icon: 'chat',
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      tags: [],
    },
    payload: {
      executionPrompt: '',
      topicAffinities: [],
      lensAffinities: [],
      targeting: {},
      baseWeight: 50,
      stats: { impressions: 0, selections: 0, completions: 0, avgEntropyDelta: 0, avgDwellMs: 0 },
      source: 'user',
      variant: 'default',
    },
  };
}
```

**PromptWorkshop.config.ts changes:**
```typescript
// Update searchFields - remove payload.label (now meta.title)
searchFields: ['meta.title', 'meta.description', 'payload.executionPrompt'],
```

**Build gate:**
```bash
npm run typecheck
npm run dev
# Verify PromptWorkshop loads and displays prompts correctly
```

---

### Epic 3: Copilot Actions

**File to create:**
- `src/bedrock/consoles/PromptWorkshop/PromptCopilotActions.ts`

**Reference:** Copy structure from `src/bedrock/consoles/LensWorkshop/LensCopilotActions.ts`

**Implementation:**

```typescript
import type { GroveObject } from '@/core/schema/grove-object';
import type { PromptPayload, PromptTargeting } from '@/core/schema/prompt';
import type { PatchOperation } from '@/core/types';

export interface PromptCopilotContext {
  consoleId: 'prompt-workshop';
  selectedPrompt: GroveObject<PromptPayload> | null;
  prompts: GroveObject<PromptPayload>[];
}

export interface CopilotActionResult {
  success: boolean;
  message: string;
  operations?: PatchOperation[];
  suggestedPrompt?: Partial<PromptPayload>;
}

// Field path normalization
const FIELD_ALIASES: Record<string, string> = {
  'title': '/meta/title',
  'name': '/meta/title',
  'label': '/meta/title',
  'description': '/meta/description',
  'desc': '/meta/description',
  'icon': '/meta/icon',
  'tags': '/meta/tags',
  'execution': '/payload/executionPrompt',
  'prompt': '/payload/executionPrompt',
  'context': '/payload/systemContext',
  'system': '/payload/systemContext',
  'variant': '/payload/variant',
  'weight': '/payload/baseWeight',
  'status': '/meta/status',
};

export function parseSetCommand(input: string): PatchOperation[] | null {
  // Pattern: "set <field> to <value>"
  const match = input.match(/^set\s+(\w+)\s+to\s+(.+)$/i);
  if (!match) return null;

  const [, field, value] = match;
  const path = FIELD_ALIASES[field.toLowerCase()];
  if (!path) return null;

  let parsedValue: unknown = value;
  
  // Parse numbers
  if (/^\d+$/.test(value)) {
    parsedValue = parseInt(value, 10);
  }
  // Parse arrays (comma-separated)
  else if (field.toLowerCase() === 'tags') {
    parsedValue = value.split(',').map(t => t.trim());
  }

  return [{ op: 'replace', path, value: parsedValue }];
}

export function suggestPrompt(context: PromptCopilotContext): Partial<PromptPayload> {
  return {
    executionPrompt: 'Explore this topic with the user...',
    variant: 'default',
    baseWeight: 50,
    topicAffinities: [],
    lensAffinities: [],
    targeting: {},
  };
}

export function suggestTargeting(prompt: GroveObject<PromptPayload>): PromptTargeting {
  // Suggest targeting based on current prompt content
  return {
    minConfidence: 0.5,
    requireMoment: false,
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validatePrompt(prompt: GroveObject<PromptPayload>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!prompt.meta.title || prompt.meta.title.length === 0) {
    errors.push('Title is required');
  } else if (prompt.meta.title.length > 200) {
    errors.push('Title must be 200 characters or less');
  }

  if (!prompt.payload.executionPrompt || prompt.payload.executionPrompt.length === 0) {
    errors.push('Execution prompt is required');
  }

  if (prompt.payload.baseWeight < 0 || prompt.payload.baseWeight > 100) {
    errors.push('Base weight must be between 0 and 100');
  }

  if (prompt.payload.topicAffinities.length === 0 && prompt.payload.lensAffinities.length === 0) {
    warnings.push('No affinities defined - prompt may not surface contextually');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export async function handleCopilotAction(
  actionId: string,
  context: PromptCopilotContext,
  userInput?: string
): Promise<CopilotActionResult> {
  switch (actionId) {
    case 'suggest-prompt':
      return {
        success: true,
        message: 'Generated prompt suggestion',
        suggestedPrompt: suggestPrompt(context),
      };

    case 'validate':
      if (!context.selectedPrompt) {
        return { success: false, message: 'No prompt selected' };
      }
      const validation = validatePrompt(context.selectedPrompt);
      return {
        success: validation.valid,
        message: validation.valid 
          ? 'Prompt is valid' 
          : `Validation failed: ${validation.errors.join(', ')}`,
      };

    case 'suggest-targeting':
      if (!context.selectedPrompt) {
        return { success: false, message: 'No prompt selected' };
      }
      const targeting = suggestTargeting(context.selectedPrompt);
      return {
        success: true,
        message: 'Generated targeting suggestion',
        operations: [{ op: 'replace', path: '/payload/targeting', value: targeting }],
      };

    default:
      // Try parsing as natural language command
      if (userInput) {
        const ops = parseSetCommand(userInput);
        if (ops) {
          return {
            success: true,
            message: `Applied: ${userInput}`,
            operations: ops,
          };
        }
      }
      return { success: false, message: `Unknown action: ${actionId}` };
  }
}
```

**Build gate:**
```bash
npm run typecheck
npm test -- --grep "CopilotActions"
```

---

### Epic 4: Data Migration

**File to create:**
- `scripts/migrate-prompts-v2.ts`

**Implementation:**

```typescript
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY!;

interface MigrationResult {
  total: number;
  migrated: number;
  skipped: number;
  errors: string[];
}

function isOldFormat(prompt: any): boolean {
  return prompt.payload && 'label' in prompt.payload;
}

function migratePrompt(prompt: any): any {
  if (!isOldFormat(prompt)) return prompt;

  const { label, description, icon, tags, ...restPayload } = prompt.payload;

  return {
    ...prompt,
    meta: {
      ...prompt.meta,
      title: label || prompt.meta.title || 'Untitled',
      description: description || prompt.meta.description,
      icon: icon || prompt.meta.icon || 'chat',
      tags: tags || prompt.meta.tags || [],
    },
    payload: restPayload,
  };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  console.log(dryRun ? 'DRY RUN MODE' : 'LIVE MIGRATION');

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('*');

  if (error) {
    console.error('Failed to fetch prompts:', error);
    process.exit(1);
  }

  const results: MigrationResult = {
    total: prompts.length,
    migrated: 0,
    skipped: 0,
    errors: [],
  };

  for (const prompt of prompts) {
    if (!isOldFormat(prompt)) {
      results.skipped++;
      console.log(`SKIP: ${prompt.id} (already new format)`);
      continue;
    }

    const migrated = migratePrompt(prompt);

    if (dryRun) {
      console.log(`WOULD MIGRATE: ${prompt.id}`);
      console.log(`  title: ${prompt.payload.label} → meta.title`);
      results.migrated++;
      continue;
    }

    const { error: updateError } = await supabase
      .from('prompts')
      .update({
        meta: migrated.meta,
        payload: migrated.payload,
      })
      .eq('id', prompt.id);

    if (updateError) {
      results.errors.push(`${prompt.id}: ${updateError.message}`);
      console.error(`ERROR: ${prompt.id}:`, updateError.message);
    } else {
      results.migrated++;
      console.log(`MIGRATED: ${prompt.id}`);
    }
  }

  console.log('\n--- RESULTS ---');
  console.log(`Total: ${results.total}`);
  console.log(`Migrated: ${results.migrated}`);
  console.log(`Skipped: ${results.skipped}`);
  console.log(`Errors: ${results.errors.length}`);

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach(e => console.log(`  - ${e}`));
  }
}

main().catch(console.error);
```

**Also update:** `scripts/seed-prompts.ts` to use new schema format (no payload.label, etc.)

**Build gate:**
```bash
npx tsx scripts/migrate-prompts-v2.ts --dry-run
# Review output
npx tsx scripts/migrate-prompts-v2.ts
# Verify in PromptWorkshop
```

---

### Epic 5: Wizard Documentation

**File to create:**
- `src/core/schema/wizard-integration.md`

See detailed content below. This is the MOST IMPORTANT deliverable for future discoverability.

**Files to add comments:**
- `src/core/schema/prompt.ts` - Add JSDoc on WizardStepConfig
- `src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx` - Add TODO for wizard tab

**Build gate:**
```bash
# Search for references
grep -r "wizard-integration.md" src/
# Should find at least 2 references
```

---

## Success Criteria

After completing all epics:

- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
- [ ] PromptWorkshop loads with no console errors
- [ ] All 57 prompts display correctly
- [ ] Create/edit/delete prompt works
- [ ] Copilot panel appears in inspector
- [ ] `parseSetCommand("set title to Hello")` returns correct patch
- [ ] `wizard-integration.md` exists and is comprehensive

---

## Prohibited Actions

- Do NOT modify `BedrockLayout`, `createBedrockConsole`, or other shared patterns
- Do NOT add new navigation items or console tabs
- Do NOT implement actual wizard unification (document only)
- Do NOT change Supabase table structure (payload is JSONB, flexible)
- Do NOT remove existing prompt functionality

---

## Completion

When all build gates pass and success criteria are met:

1. Create `docs/sprints/prompt-schema-rationalization-v1/DEV_LOG.md` with:
   - Summary of changes made
   - Any deviations from plan
   - Issues encountered and resolutions
   - Test results

2. Commit with message: `feat(prompt): rationalize schema, add copilot actions, document wizard unification`

3. Update sprint status in SPRINTS.md to "Complete"
