# Migration Map: prompt-schema-rationalization-v1

**Sprint:** prompt-schema-rationalization-v1  
**Created:** 2026-01-03

---

## Overview

This migration removes redundant fields from `PromptPayload` and consolidates display fields into `GroveObjectMeta`.

---

## Schema Migration

### Fields Moved: payload → meta

| Old Path | New Path | Notes |
|----------|----------|-------|
| `payload.label` | `meta.title` | Required field |
| `payload.description` | `meta.description` | Optional |
| `payload.icon` | `meta.icon` | Optional |
| `payload.tags` | `meta.tags` | Array, defaults to [] |

### Fields Added

| Path | Type | Default | Notes |
|------|------|---------|-------|
| `payload.wizardConfig` | WizardStepConfig? | undefined | Optional, for wizard steps |
| `payload.sequences[].stats` | PromptStats? | undefined | Optional, sequence-scoped |

### Fields Unchanged

All other payload fields remain in place:
- `executionPrompt`
- `systemContext`
- `variant`
- `topicAffinities`
- `lensAffinities`
- `targeting`
- `baseWeight`
- `sequences` (structure updated, see below)
- `stats`
- `source`
- `generatedFrom`
- `cooldownMs`
- `maxShows`

---

## Code Changes

### src/core/schema/prompt.ts

```typescript
// REMOVE these fields from PromptPayload:
- label: string;
- description?: string;
- icon?: string;
- tags: string[];

// ADD these types:
+ type PromptVariant = 'default' | 'glow' | 'subtle' | 'urgent';
+ type PromptSource = 'library' | 'generated' | 'user';
+ type SequenceType = 'journey' | 'briefing' | 'wizard' | 'tour' | 'research' | 'faq' | string;

// UPDATE PromptSequence:
  interface PromptSequence {
    groupType: SequenceType;
    groupId: string;
    order: number;
    titleOverride?: string;
    bridgeAfter?: string;
    successCriteria?: SuccessCriteria;
+   stats?: PromptStats;  // NEW: sequence-scoped analytics
  }

// ADD WizardStepConfig:
+ interface WizardStepConfig {
+   stepType: 'consent' | 'choice' | 'text' | 'generation' | 'selection' | 'confirmation';
+   choices?: WizardChoice[];
+   inputKey?: string;
+   validation?: InputValidation;
+   nextConditions?: ConditionalNext[];
+   defaultNext?: string;
+ }

// ADD wizardConfig to PromptPayload:
  interface PromptPayload {
    // ... existing fields ...
+   wizardConfig?: WizardStepConfig;
  }
```

### src/bedrock/consoles/PromptWorkshop/PromptCard.tsx

```typescript
// CHANGE: Read display fields from meta instead of payload

// OLD:
- <h3>{prompt.payload.label}</h3>
- <p>{prompt.payload.description}</p>
- <span>{prompt.payload.icon}</span>

// NEW:
+ <h3>{prompt.meta.title}</h3>
+ <p>{prompt.meta.description}</p>
+ <span>{prompt.meta.icon}</span>
```

### src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx

```typescript
// CHANGE: Update field paths for meta fields

// OLD:
- handleFieldChange('label', value)
- handleFieldChange('description', value)

// NEW (Content tab - meta fields):
+ handleMetaChange('title', value)
+ handleMetaChange('description', value)

// ADD: handleMetaChange function
+ const handleMetaChange = (field: string, value: unknown) => {
+   if (readonly) return;
+   onUpdate([{ op: 'replace', path: `/meta/${field}`, value }]);
+ };
```

### src/bedrock/consoles/PromptWorkshop/usePromptData.ts

```typescript
// UPDATE: createDefaultPrompt

export function createDefaultPrompt(defaults?: Partial<PromptPayload>): GroveObject<PromptPayload> {
  const now = new Date().toISOString();

  return {
    meta: {
      id: `prompt-${Date.now()}`,
      type: 'prompt',
-     title: defaults?.label || 'New Prompt',
+     title: 'New Prompt',  // No longer in payload
-     description: defaults?.description,
-     icon: defaults?.icon || 'chat',
+     description: undefined,
+     icon: 'chat',
      status: 'draft',
      createdAt: now,
      updatedAt: now,
-     tags: defaults?.tags || [],
+     tags: [],
    },
    payload: {
-     label: 'New Prompt',
      executionPrompt: '',
-     tags: [],
      topicAffinities: [],
      lensAffinities: [],
      targeting: {},
      baseWeight: 50,
      stats: {
        impressions: 0,
        selections: 0,
        completions: 0,
        avgEntropyDelta: 0,
        avgDwellMs: 0,
      },
      source: 'user',
      variant: 'default',
      ...defaults,
    },
  };
}
```

### src/bedrock/consoles/PromptWorkshop/PromptWorkshop.config.ts

```typescript
// UPDATE: searchFields paths

collectionView: {
- searchFields: ['meta.title', 'meta.description', 'payload.label', 'payload.executionPrompt'],
+ searchFields: ['meta.title', 'meta.description', 'payload.executionPrompt'],

// ADD: sequence filter option
  filterOptions: [
    // ... existing filters ...
+   {
+     field: 'payload.sequences',
+     label: 'Sequence',
+     options: [], // Populated dynamically from derived sequences
+     multiple: false,
+   },
  ],
}
```

---

## Data Migration

### Migration Script Location

`scripts/migrate-prompts-v2.ts`

### Migration Logic

```typescript
async function migratePrompts(): Promise<MigrationResult> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  // 1. Fetch all prompts
  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('*');
  
  if (error) throw error;
  
  const results: MigrationResult = {
    total: prompts.length,
    migrated: 0,
    skipped: 0,
    errors: [],
  };
  
  // 2. Migrate each prompt
  for (const prompt of prompts) {
    try {
      if (!isOldFormat(prompt)) {
        results.skipped++;
        continue;
      }
      
      const migrated = migratePrompt(prompt);
      
      const { error: updateError } = await supabase
        .from('prompts')
        .update({
          title: migrated.meta.title,
          description: migrated.meta.description,
          icon: migrated.meta.icon,
          tags: migrated.meta.tags,
          payload: migrated.payload,
        })
        .eq('id', prompt.id);
      
      if (updateError) {
        results.errors.push(`${prompt.id}: ${updateError.message}`);
      } else {
        results.migrated++;
      }
    } catch (e) {
      results.errors.push(`${prompt.id}: ${e.message}`);
    }
  }
  
  return results;
}
```

### Rollback Strategy

1. Before migration, export current data:
   ```bash
   npx supabase db dump --data-only > backup-prompts-$(date +%Y%m%d).sql
   ```

2. If rollback needed:
   ```bash
   psql $DATABASE_URL < backup-prompts-YYYYMMDD.sql
   ```

---

## Testing Migration

### Local Test

```bash
# 1. Run migration in dry-run mode
npm run migrate:prompts -- --dry-run

# 2. Verify output shows expected changes

# 3. Run actual migration
npm run migrate:prompts

# 4. Verify data
npm run dev
# Open PromptWorkshop, verify all prompts display correctly
```

### Verification Queries

```sql
-- Count prompts with old format (should be 0 after migration)
SELECT COUNT(*) 
FROM prompts 
WHERE payload->>'label' IS NOT NULL;

-- Count prompts with new format (should match total)
SELECT COUNT(*) 
FROM prompts 
WHERE title IS NOT NULL;

-- Verify no data loss
SELECT COUNT(*) FROM prompts;
-- Should be 57
```

---

## Deployment Order

1. **Deploy schema changes** (types only, backward compatible)
2. **Deploy component changes** (can read both formats)
3. **Run migration script** (convert data)
4. **Verify in production**
5. **Remove old-format handling code** (optional cleanup)

---

## Affected Consumers

### Direct Consumers

| File | Change Required |
|------|-----------------|
| `PromptCard.tsx` | Read from meta |
| `PromptEditor.tsx` | Update paths |
| `usePromptData.ts` | Update createDefaultPrompt |
| `scorePrompt.ts` | No change (reads payload) |
| `usePromptSuggestions.ts` | No change (reads payload) |

### Indirect Consumers

| System | Impact |
|--------|--------|
| Supabase queries | None (JSONB) |
| Console factory | None (generic) |
| Inspector | None (reads meta.title) |
