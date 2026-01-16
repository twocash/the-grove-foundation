# Product Brief: S5-SL-LifecycleEngine v1.0

**Sprint:** S5-SL-LifecycleEngine
**Epic:** Knowledge as Observable System (Declarative Lifecycle)
**Phase:** Phase 1 - Lifecycle Engine + Config Schema
**Status:** ✅ Ready for Development (UX Chief Approved)
**Date:** 2026-01-15

---

## Executive Summary

Transform the tier badge system from hardcoded TypeScript to declarative Supabase configuration, enabling operators to customize lifecycle models via Bedrock ExperienceConsole without code deployment.

**Core Innovation:** Lifecycle behavior driven by config, not code. Operators can define custom tier metaphors (botanical, academic, creative) and the system adapts automatically.

---

## Strategic Context

### The Bigger Picture (Epic Vision)

This sprint is **Phase 1** of a 7-phase journey to transform Grove from knowledge capture tool into a **living knowledge system** where:
- Quality emerges from observable usage patterns
- AI agents participate in curation
- Groves federate in a decentralized knowledge economy

**Phase 1 Goal:** Make lifecycle progression declarative, unlocking future phases:
- Phase 3: Auto-advancement based on usage signals
- Phase 5: Cross-grove federation via tier mapping
- Phase 6: AI-generated lifecycle models

### Why This Matters (DEX Alignment)

| DEX Pillar | How This Sprint Delivers |
|------------|-------------------------|
| **Declarative Sovereignty** | Lifecycle behavior in Supabase config, not code. Operators tune via UI. |
| **Capability Agnosticism** | Any AI model can use lifecycle rules. Schema validates, prevents hallucinations. |
| **Provenance as Infrastructure** | Every lifecycle change tracked with createdBy, modifiedAt. Full audit trail. |
| **Organic Scalability** | New lifecycle models = new config rows. No code changes required. |

---

## What We're Building

### Primary Deliverable

**Lifecycle Configuration System** in Bedrock ExperienceConsole:
1. **LifecycleConfigCard** - Grid view showing all lifecycle models
2. **LifecycleConfigEditor** - Inspector for editing tier definitions
3. **SINGLETON enforcement** - Only one active model at a time
4. **Live preview** - Real-time TierBadge rendering as you edit
5. **Supabase storage** - `lifecycle_configs` table with JSONB payload

### User Stories

**As an Operator, I want to:**
- View all available lifecycle models (botanical, academic, custom)
- Edit tier labels and emojis for custom models
- Create new lifecycle models with 2-10 tiers
- Activate a model (switches atomically, invalidates cache)
- See live preview of TierBadge changes before saving

**As a System, I must:**
- Protect default botanical model (read-only)
- Enforce SINGLETON (one active model only)
- Validate all stage mappings before save
- Handle orphaned mappings (tier deletion)
- Invalidate cache on activation

---

## Architecture (v1.0 Compliant)

### Storage Pattern (ADR-001)

**✅ Correct: Supabase**
```typescript
// Table: lifecycle_configs
{
  id: UUID,
  meta: JSONB,     // { status, createdBy, modifiedAt }
  payload: JSONB,  // LifecycleConfigPayload (see schema below)
  created_at: TIMESTAMPTZ
}
```

**❌ Incorrect: GCS** (deprecated pattern, frozen for legacy)

### UI Location (ADR-006)

**✅ Correct: Bedrock ExperienceConsole**
```
/bedrock/consoles/ExperienceConsole
├── LifecycleConfigCard.tsx
├── LifecycleConfigEditor.tsx
└── types/lifecycle-config.types.ts
```

**❌ Incorrect: Foundation RealityTuner** (frozen zone)

### Data Access (ADR-004)

**✅ Correct: useGroveData hook**
```typescript
const { data, isLoading } = useGroveData('lifecycle-config');
```

**❌ Incorrect: Direct GCS fetch** (v1.0 uses GroveDataProvider)

### SINGLETON Pattern (ADR-008)

**✅ Correct: ExperienceConsole factory**
```typescript
// component-registry.ts
'lifecycle-config': {
  allowMultipleActive: false,  // Factory enforces automatically
}
```

**❌ Incorrect: Manual enforcement** (factory handles it)

---

## Schema Definition

### Core Types

```typescript
// src/core/schema/lifecycle-config.ts

export interface LifecycleConfigPayload {
  version: string;           // "1.0.0"
  activeModelId: string;     // "botanical"
  models: LifecycleModel[];
}

export interface LifecycleModel {
  id: string;                // "botanical" | "academic" | custom
  name: string;              // "Botanical Growth"
  description: string;
  isEditable: boolean;       // false for system models
  tiers: TierDefinition[];
  mappings: StageTierMapping[];
}

export interface TierDefinition {
  id: string;                // "seed" | "sprout" | custom
  emoji: string;             // "🌰"
  label: string;             // "Seed"
  order: number;             // 0, 1, 2, ...
  description?: string;
}

export interface StageTierMapping {
  stage: SproutStage;        // "tender" | "rooting" | ...
  tierId: string;            // References TierDefinition.id
  description?: string;
}

// All 6 sprout stages (from schema)
export type SproutStage =
  | 'tender'      // Just created
  | 'rooting'     // Establishing connections
  | 'sprouting'   // Active development
  | 'established' // Core structure solidified
  | 'flourishing' // Mature and productive
  | 'mature';     // Part of knowledge network
```

### Supabase Row (GroveObject)

```typescript
interface GroveObject<T> {
  id: string;
  meta: {
    status: 'active' | 'draft' | 'archived';
    createdBy: string;
    createdAt: string;
    modifiedAt: string;
  };
  payload: T;  // LifecycleConfigPayload
}
```

---

## Component Specifications

### 1. LifecycleConfigCard (Grid View)

**Pattern:** Follows FeatureFlagCard structure

**Visual Elements:**
- 1px status bar (green/amber/gray)
- Icon using highest tier emoji
- Title + model ID (mono)
- Description preview (2 lines)
- Tier emoji strip (horizontal, max 8)
- State badges (system/custom, tier count)
- Status badge (active/draft/archived)
- Favorite star (top-right)

**States:**
- **Active:** Green status bar, "Active ✓" badge, pulse animation
- **Draft:** Amber status bar, "Draft" badge
- **Archived:** Gray status bar, "Archived" badge, 70% opacity

**Data:**
```typescript
interface CardProps {
  config: GroveObject<LifecycleConfigPayload>;
  isSelected: boolean;
  onSelect: () => void;
}
```

---

### 2. LifecycleConfigEditor (Inspector Panel)

**Pattern:** Follows FeatureFlagEditor + SystemPromptEditor structure

**Sections (7 total):**

1. **Status Banner** (conditional)
   - Active: Green pulsing banner "Active Lifecycle Model"
   - Draft: Amber banner "Draft — Active: [current active name]"
   - Archived: Gray banner "Archived Model — Restore as Draft"

2. **Header**
   - Icon (highest tier emoji) + Title + ID
   - Status badge (active/draft/archived)

3. **Model Metadata**
   - Name: BufferedInput (editable if custom, read-only if system)
   - Description: Textarea (same rules)
   - ID: Read-only mono text
   - Editable: Badge (🔒 System | ✏️ Custom)

4. **Tier Definitions**
   - Table: Emoji | Label | Order | Actions
   - System models: Read-only with lock icons
   - Custom models: Emoji picker, inline edit, drag-to-reorder
   - "Add Tier" button (disabled if >=10 tiers)
   - Delete icon per row (disabled if <=2 tiers)

5. **Live Preview** (NEW ✨)
   - Real-time TierBadge rendering
   - Size selector (sm/md/lg)
   - Updates instantly on emoji/label change
   - Label displayed below each badge

6. **Stage-to-Tier Mappings**
   - Table: Stage | Tier | Description
   - Dropdown per stage (all 6 stages required)
   - Validation error if unmapped
   - Auto-update tier options when tiers added/removed

7. **Metadata** (collapsed by default)
   - Created: Date + user
   - Modified: Date + user
   - Last Activated: Date (if applicable)

**Footer Actions** (state-dependent):
- **Active:** Save | Duplicate
- **Draft:** Save | Activate | Duplicate | Delete
- **Archived:** Restore as Draft | Duplicate | Delete

---

### 3. Empty State

**Scenario:** No lifecycle configs exist (seed failed)

**Display:**
- Centered icon (🌲) + "No Lifecycle Configurations Found"
- "Seed Default Model" recovery button (admin-only)
- Subtext: "Contact admin if this persists"

**Recovery Action:**
- Creates default botanical model with 5 tiers
- Sets status to 'active'
- Redirects to editor

---

## Interactive Behaviors

### Emoji Picker

**Trigger:** Click emoji cell in tier table

**UI:**
- Popover overlay positioned above cell
- Grid of emojis (8x6, scrollable)
- Search bar at top
- "Recent" section
- Click emoji → updates immediately
- Click outside → closes picker

**Validation:**
- Only valid Unicode emoji allowed
- Invalid characters → revert to previous
- Duplicate emoji → allowed (no restriction)

---

### Drag-to-Reorder Tiers

**Trigger:** Drag handle icon in tier table

**UI:**
- Cursor changes to grab hand
- Row opacity 50% while dragging
- Blue drop zone indicator
- Ghost preview follows cursor
- Drop → rows reorder, order recalculates

**Validation:**
- Order field updates automatically (0, 1, 2, ...)
- Cannot drag if system model (locked)
- Cannot save with non-sequential order

---

### Tier Deletion (Orphan Handling)

**Scenario:** User deletes a tier with stage mappings

**Flow:**
1. Click delete icon on tier row
2. Confirmation modal:
   ```
   Delete "Sapling" tier?

   ⚠️ 2 stages are mapped to this tier:
   - established
   - flourishing

   Deleting will unmap these stages. You must remap them before saving.

   [Cancel] [Delete Tier]
   ```
3. On confirm:
   - Delete tier from tiers array
   - Remove mappings for that tierId
   - Show validation error: "2 stages not mapped"
   - Save button disabled until remapped

---

### Activation Flow (SINGLETON)

**Trigger:** Click "Activate This Model" in draft editor

**Flow:**
1. Confirmation modal:
   ```
   Activate "Academic Peer Review"?

   This will:
   • Archive current active: "Botanical Growth"
   • Activate "Academic Peer Review" as new lifecycle model
   • Update all tier badges immediately

   [Cancel] [Activate]
   ```
2. On confirm:
   - ExperienceConsole factory handles SINGLETON logic:
     - Set current active → archived
     - Set selected draft → active
     - Update payload.activeModelId
   - Invalidate cache (Redis + React Query)
   - Show success toast
   - Editor banner updates to green "Active Lifecycle Model"

---

## Validation Rules

### Tier Count
- **Min:** 2 tiers
- **Max:** 10 tiers
- **UI:** Disable "Add Tier" at 10, disable "Delete" at 2
- **Error:** "Minimum 2 tiers required" | "Maximum 10 tiers allowed"

### Stage Mappings
- **Rule:** All 6 sprout stages must be mapped
- **UI:** Red border on unmapped stage dropdowns
- **Error:** "3 stages not mapped: tender, rooting, sprouting"
- **Save:** Disabled until all mapped

### Tier IDs
- **Rule:** No duplicate tier IDs within a model
- **UI:** Red border on duplicate ID fields
- **Error:** "Duplicate tier ID: 'draft'"

### Tier Order
- **Rule:** Must be sequential 0, 1, 2, ...
- **UI:** Auto-recalculate on drag-to-reorder
- **Warning:** "Tier order should be sequential starting at 0"

### Mapping Validity
- **Rule:** All mappings must reference existing tier IDs
- **UI:** Red border on invalid mapping rows
- **Error:** "Some mappings reference non-existent tiers"
- **Fix:** Auto-remove invalid mappings on tier deletion (with confirmation)

---

## Data Hooks

### Consumer Hook (Active Model Only)

```typescript
// hooks/useLifecycleConfig.ts
import { useGroveData } from './useGroveData';

export function useLifecycleConfig() {
  const { data, isLoading, error } = useGroveData('lifecycle-config');

  if (!data?.length) return DEFAULT_LIFECYCLE_CONFIG_PAYLOAD;

  const active = data.find(c => c.meta.status === 'active');
  return active?.payload ?? DEFAULT_LIFECYCLE_CONFIG_PAYLOAD;
}

// Usage in TierBadge:
const config = useLifecycleConfig();
const activeModel = config.models.find(m => m.id === config.activeModelId);
const tier = activeModel?.tiers.find(t => t.id === props.tier);
```

### Admin Hook (Full CRUD)

```typescript
// hooks/useLifecycleConfigCRUD.ts
import { useGroveData } from './useGroveData';

export function useLifecycleConfigCRUD() {
  const crud = useGroveData('lifecycle-config');

  return {
    // Queries
    configs: crud.data || [],
    activeConfig: crud.data?.find(c => c.meta.status === 'active'),
    isLoading: crud.isLoading,
    error: crud.error,

    // Mutations
    create: async (model: Partial<LifecycleModel>) => {
      const payload: LifecycleConfigPayload = {
        version: '1.0.0',
        activeModelId: 'botanical', // Default active
        models: [model as LifecycleModel]
      };
      return crud.create({ status: 'draft' }, payload);
    },

    update: async (configId: string, patches: PatchOperation[]) => {
      return crud.update(configId, patches);
    },

    activate: async (configId: string) => {
      // Factory handles SINGLETON logic automatically
      return crud.update(configId, [
        { op: 'replace', path: '/meta/status', value: 'active' }
      ]);
    },

    archive: async (configId: string) => {
      return crud.update(configId, [
        { op: 'replace', path: '/meta/status', value: 'archived' }
      ]);
    },

    delete: crud.delete,
  };
}
```

---

## Supabase Migration

```sql
-- supabase/migrations/006_lifecycle_configs.sql

CREATE TABLE lifecycle_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta JSONB NOT NULL,           -- { status, createdBy, createdAt, modifiedAt }
  payload JSONB NOT NULL,        -- LifecycleConfigPayload
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_lifecycle_configs_status
  ON lifecycle_configs ((meta->>'status'));

CREATE INDEX idx_lifecycle_configs_created_by
  ON lifecycle_configs ((meta->>'createdBy'));

CREATE INDEX idx_lifecycle_configs_active_model
  ON lifecycle_configs ((payload->>'activeModelId'));

-- RLS Policies (admin-only for Phase 1)
ALTER TABLE lifecycle_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access" ON lifecycle_configs
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Trigger for updated_at
CREATE TRIGGER lifecycle_configs_updated_at
  BEFORE UPDATE ON lifecycle_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed default botanical model
INSERT INTO lifecycle_configs (meta, payload) VALUES (
  '{
    "status": "active",
    "createdBy": "system",
    "createdAt": "2026-01-15T00:00:00Z",
    "modifiedAt": "2026-01-15T00:00:00Z"
  }',
  '{
    "version": "1.0.0",
    "activeModelId": "botanical",
    "models": [
      {
        "id": "botanical",
        "name": "Botanical Growth",
        "description": "Default lifecycle model for sprout tier progression",
        "isEditable": false,
        "tiers": [
          { "id": "seed", "emoji": "🌰", "label": "Seed", "order": 0 },
          { "id": "sprout", "emoji": "🌱", "label": "Sprout", "order": 1 },
          { "id": "sapling", "emoji": "🌿", "label": "Sapling", "order": 2 },
          { "id": "tree", "emoji": "🌳", "label": "Tree", "order": 3 },
          { "id": "grove", "emoji": "🌲", "label": "Grove", "order": 4 }
        ],
        "mappings": [
          { "stage": "tender", "tierId": "seed" },
          { "stage": "rooting", "tierId": "seed" },
          { "stage": "sprouting", "tierId": "sprout" },
          { "stage": "established", "tierId": "sapling" },
          { "stage": "flourishing", "tierId": "tree" },
          { "stage": "mature", "tierId": "grove" }
        ]
      }
    ]
  }'
);
```

---

## Registry Integration

### Component Registry

```typescript
// src/bedrock/config/component-registry.ts

import { LifecycleConfigCard } from '../consoles/ExperienceConsole/LifecycleConfigCard';
import { LifecycleConfigEditor } from '../consoles/ExperienceConsole/LifecycleConfigEditor';

export const EXPERIENCE_TYPE_REGISTRY = {
  // ... existing entries (feature-flag, system-prompt, etc.)

  'lifecycle-config': {
    label: 'Lifecycle Config',
    pluralLabel: 'Lifecycle Configs',
    description: 'Tier progression models for sprout lifecycle',
    card: LifecycleConfigCard,
    editor: LifecycleConfigEditor,
    icon: 'forest',
    allowMultipleActive: false,  // SINGLETON enforcement
    defaultSort: { field: 'status', direction: 'desc' }, // Active first
    filters: [
      { field: 'status', label: 'Status', options: ['active', 'draft', 'archived'] },
      { field: 'isEditable', label: 'Type', options: ['System', 'Custom'] }
    ]
  },
};
```

### Hook Registry

```typescript
// src/bedrock/config/hook-registry.ts

import { useLifecycleConfigCRUD } from '../../hooks/useLifecycleConfigCRUD';

export const HOOK_REGISTRY = {
  // ... existing hooks
  'lifecycle-config': useLifecycleConfigCRUD,
};
```

### GroveData Provider

```typescript
// lib/grove-data-provider.ts

export type GroveObjectType =
  | 'feature-flag'
  | 'system-prompt'
  | 'research-agent-config'
  | 'writer-agent-config'
  | 'lifecycle-config';  // NEW

// lib/supabase-adapter.ts

const TABLE_MAP: Record<GroveObjectType, string> = {
  'feature-flag': 'feature_flags',
  'system-prompt': 'system_prompts',
  'research-agent-config': 'research_agent_configs',
  'writer-agent-config': 'writer_agent_configs',
  'lifecycle-config': 'lifecycle_configs',  // NEW
};

const JSONB_META_TYPES: GroveObjectType[] = [
  'feature-flag',
  'system-prompt',
  'research-agent-config',
  'writer-agent-config',
  'lifecycle-config',  // NEW
];
```

---

## Cache Invalidation

### On Activation

```typescript
// After activating a lifecycle model

// 1. Server-side Redis cache
await redis.del('lifecycle-config:active');

// 2. Client-side React Query cache
queryClient.invalidateQueries(['lifecycle-config']);

// 3. Global tier config cache
await fetch('/api/cache/invalidate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'tier-config' })
});
```

**Result:** All TierBadge components across `/explore` and `/bedrock` reload with new active model.

---

## json-render Strategy (Phase 4+)

### Phase 1: Basic Live Preview

```tsx
// LifecycleConfigEditor.tsx - Tier Definitions section

<div className="mt-4 p-4 rounded-lg bg-[var(--glass-surface)]">
  <div className="flex items-center gap-3">
    {model.tiers
      .sort((a, b) => a.order - b.order)
      .map(tier => (
        <div key={tier.id} className="flex flex-col items-center gap-1">
          <TierBadge tier={tier.id} size={previewSize} />
          <span className="text-xs text-[var(--glass-text-muted)]">
            {tier.label}
          </span>
        </div>
      ))
    }
  </div>
</div>
```

**Benefit:** Instant visual feedback on emoji/label changes.

---

### Phase 4+: json-render Enhancement

**When to implement:** After Phase 1 proves value, add for:
- Template gallery (visualize botanical/academic/creative)
- Visual tier flow diagrams
- AI-generated lifecycle models (catalog constrains output)
- Cross-grove tier mapping UI

**File Structure:**
```
src/bedrock/consoles/ExperienceConsole/json-render/
├── lifecycle-catalog.ts       # Zod schemas
├── lifecycle-registry.tsx     # React components
├── lifecycle-transform.ts     # Config → RenderTree
└── Renderer.tsx               # Reuse from SFR
```

**Catalog Example:**
```typescript
// lifecycle-catalog.ts

export const LifecycleCatalog = {
  components: {
    TierDefinition: {
      props: z.object({
        id: z.string(),
        emoji: z.string(),
        label: z.string(),
        order: z.number(),
      })
    },
    TransitionRule: {
      props: z.object({
        from: z.string(),
        to: z.string(),
        condition: z.enum(['manual', 'auto', 'threshold']),
      })
    },
    AdvancementCriteria: {
      props: z.object({
        metric: z.string(),
        operator: z.enum(['gte', 'lte', 'eq']),
        threshold: z.number(),
      })
    }
  }
} as const;
```

**Registry Example:**
```tsx
// lifecycle-registry.tsx

export const LifecycleRegistry = {
  TierDefinition: ({ element }) => (
    <div className="tier-card">
      <span className="text-3xl">{element.props.emoji}</span>
      <span className="font-medium">{element.props.label}</span>
    </div>
  ),

  TransitionRule: ({ element }) => (
    <div className="flex items-center gap-2">
      <TierBadge tier={element.props.from} />
      <span>→</span>
      <TierBadge tier={element.props.to} />
      {element.props.condition === 'auto' && (
        <span className="badge">Auto</span>
      )}
    </div>
  ),
};
```

**Strategic Value:**
- AI can generate valid lifecycle models using catalog (no hallucinations)
- Visual diff tool for comparing models
- Template gallery for inspiration
- Cross-grove tier mapping UI

**Defer to Phase 4:** Focus Phase 1 on core CRUD + basic preview. Add json-render when building advanced features.

---

## Acceptance Criteria

### AC-1: Supabase Storage
- ✅ `lifecycle_configs` table created with JSONB payload
- ✅ Indexes on status, createdBy, activeModelId
- ✅ RLS policies (admin-only access)
- ✅ Seed migration creates default botanical model
- ✅ GroveDataProvider registered for 'lifecycle-config'

### AC-2: ExperienceConsole Integration
- ✅ LifecycleConfigCard displays in grid
- ✅ Status bar colors match active/draft/archived
- ✅ Tier emoji preview strip renders
- ✅ System vs custom badge accurate
- ✅ Card click opens LifecycleConfigEditor

### AC-3: Editor Functionality
- ✅ Name/description editable for custom models, read-only for system
- ✅ Tier table: emoji picker, inline label edit, drag-to-reorder (custom only)
- ✅ Stage-to-tier mapping dropdowns update on tier changes
- ✅ Live preview shows real-time TierBadge rendering
- ✅ Validation errors display with red borders + error text
- ✅ Save disabled if validation fails

### AC-4: SINGLETON Enforcement
- ✅ Only one config can have status='active'
- ✅ Activating draft archives current active
- ✅ Confirmation modal shows current active will be archived
- ✅ ExperienceConsole factory handles SINGLETON logic
- ✅ Cache invalidation triggers on activation

### AC-5: Validation Rules
- ✅ Cannot save with <2 or >10 tiers
- ✅ Cannot save with unmapped stages
- ✅ Orphaned mapping handling (confirm + unmap on tier delete)
- ✅ Tier order auto-recalculates on drag
- ✅ Duplicate tier IDs prevented

### AC-6: TierBadge Integration
- ✅ TierBadge reads from active lifecycle config
- ✅ stageTierMap() uses active model mappings
- ✅ Fallback to defaults if config unavailable
- ✅ Cache invalidation updates all TierBadge instances

---

## Testing Strategy

### Unit Tests

```typescript
// Validation logic
describe('validateLifecycleModel', () => {
  it('rejects <2 tiers', () => {
    const model = { tiers: [tier1] };
    expect(validate(model).isValid).toBe(false);
  });

  it('rejects >10 tiers', () => {
    const model = { tiers: Array(11).fill(tier1) };
    expect(validate(model).isValid).toBe(false);
  });

  it('rejects unmapped stages', () => {
    const model = { mappings: [{ stage: 'tender', tierId: 'seed' }] };
    expect(validate(model).errors).toContain('5 stages not mapped');
  });
});

// Hook logic
describe('useLifecycleConfig', () => {
  it('returns active model', () => {
    const configs = [
      { meta: { status: 'active' }, payload: { activeModelId: 'botanical' } },
      { meta: { status: 'draft' }, payload: { activeModelId: 'academic' } }
    ];
    const active = useLifecycleConfig(configs);
    expect(active.activeModelId).toBe('botanical');
  });

  it('falls back to default if no active', () => {
    const configs = [];
    const active = useLifecycleConfig(configs);
    expect(active.activeModelId).toBe('botanical');
  });
});
```

### Integration Tests

```typescript
// ExperienceConsole factory
describe('SINGLETON activation', () => {
  it('archives current active when activating draft', async () => {
    const { activateConfig } = useLifecycleConfigCRUD();

    await activateConfig('draft-id');

    // Check current active is now archived
    const configs = await getConfigs();
    const previousActive = configs.find(c => c.meta.id === 'active-id');
    expect(previousActive.meta.status).toBe('archived');
  });

  it('shows confirmation modal when switching active', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm');

    await activateConfig('draft-id');

    expect(confirmSpy).toHaveBeenCalledWith(
      expect.stringContaining('Archive current active')
    );
  });
});

// Cache invalidation
describe('Cache invalidation', () => {
  it('invalidates tier config on activation', async () => {
    const invalidateSpy = jest.spyOn(cache, 'invalidate');

    await activateConfig('draft-id');

    expect(invalidateSpy).toHaveBeenCalledWith('tier-config');
  });
});
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/lifecycle-config.spec.ts

test('activating draft model updates TierBadge', async ({ page }) => {
  // Navigate to ExperienceConsole
  await page.goto('/bedrock/consoles/experience');

  // Filter to lifecycle-config
  await page.getByLabel('Filter by type').selectOption('lifecycle-config');

  // Click draft card
  await page.getByText('Academic Peer Review').click();

  // Click Activate
  await page.getByRole('button', { name: 'Activate This Model' }).click();

  // Confirm modal
  await page.getByRole('button', { name: 'Activate' }).click();

  // Wait for success toast
  await expect(page.getByText('is now active')).toBeVisible();

  // Navigate to explore
  await page.goto('/explore');

  // Verify TierBadge updated (academic model has "draft" tier)
  await expect(page.getByText('📝')).toBeVisible(); // Academic emoji
});

test('cannot save with unmapped stages', async ({ page }) => {
  // Open custom model in editor
  await page.getByText('Custom Lifecycle').click();

  // Delete a tier that has mappings
  await page.getByRole('button', { name: 'Delete tier: Sapling' }).click();

  // Confirm deletion
  await page.getByRole('button', { name: 'Delete Tier' }).click();

  // Verify validation error
  await expect(page.getByText('2 stages not mapped')).toBeVisible();

  // Verify save disabled
  await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();
});
```

---

## Performance Considerations

### Debounced Inputs
- Use BufferedInput (400ms debounce) for name/description
- Prevents race condition where typing loses characters
- Reduces patch operations (fewer API calls)

### Optimistic UI
- Local state updates immediately on edit
- Show loading spinner during save
- Rollback on error with toast notification

### Memoized Preview
```tsx
const previewBadges = useMemo(() => {
  return model.tiers
    .sort((a, b) => a.order - b.order)
    .map(tier => <TierBadge key={tier.id} tier={tier.id} size={previewSize} />);
}, [model.tiers, previewSize]);
```

### Cache Invalidation
- Invalidate on activation (not on every edit)
- Use React Query cache busting
- Server-side Redis invalidation

---

## Success Metrics

### Phase 1 Launch
- ✅ Operators can view all lifecycle models
- ✅ Operators can edit custom model tiers (emoji, label)
- ✅ Operators can create new models (2-10 tiers)
- ✅ Operators can activate models (atomic switch)
- ✅ System models protected from editing
- ✅ All validation rules enforced
- ✅ TierBadge reads from active model

### Phase 4+ (Future)
- ✅ json-render catalog for visual editor
- ✅ Template gallery (botanical/academic/creative previews)
- ✅ AI-generated lifecycle models (catalog-constrained)
- ✅ Cross-grove tier mapping UI

---

## Timeline Estimate

| Phase | Duration | Tasks |
|-------|----------|-------|
| Supabase Migration | 0.5 days | Create table, seed default, test locally |
| Hook Implementation | 1 day | useLifecycleConfig + useLifecycleConfigCRUD |
| Component Dev | 2-3 days | Card + Editor (reuse patterns) |
| Registry Integration | 0.5 days | Add to EXPERIENCE_TYPE_REGISTRY |
| Validation Logic | 1 day | Frontend + backend rules |
| Testing | 1-2 days | Unit + integration + E2E |
| **Total** | **5-7 days** | From handoff to production |

---

## Dependencies

### Technical
- ✅ Supabase setup (already configured)
- ✅ ExperienceConsole factory (already built)
- ✅ GroveDataProvider (already exists)
- ✅ TierBadge component (already exists)
- ✅ BufferedInput primitive (already exists)

### Organizational
- ✅ UX Chief approval (received)
- ✅ Design deliverables (complete)
- ⏳ Developer assignment (pending sprintmaster)

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| SINGLETON race condition | Low | High | Use Supabase transactions, optimistic UI rollback |
| Cache invalidation timing | Medium | Medium | Aggressive invalidation + cache busting headers |
| Orphaned mapping confusion | Medium | Low | Clear confirmation modal with stage names |
| System model accidental edit | Low | High | Read-only UI enforcement + backend validation |

---

## Deliverables Checklist

### Design Files (✅ Complete)
- ✅ DESIGN_WIREFRAMES.md (600 lines)
- ✅ DESIGN_DECISIONS.md (450 lines)
- ✅ SAMPLE_LIFECYCLE_CONFIG.json (350 lines)
- ✅ RENDER_JSON_TEST.md (300 lines)
- ✅ DESIGN_HANDOFF.md (400 lines)
- ✅ UX_CHIEF_APPROVAL.md (this sprint)

### Architecture Files (✅ Complete)
- ✅ DECISIONS.md (ADRs 1-8)
- ✅ SPEC.md (corrected for Supabase)
- ✅ PRODUCT_BRIEF_FINAL.md (this document)

### Implementation Files (⏳ Pending)
- ⏳ Supabase migration: `006_lifecycle_configs.sql`
- ⏳ Core schema: `src/core/schema/lifecycle-config.ts`
- ⏳ Hook: `hooks/useLifecycleConfig.ts`
- ⏳ Hook: `hooks/useLifecycleConfigCRUD.ts`
- ⏳ Card: `src/bedrock/consoles/ExperienceConsole/LifecycleConfigCard.tsx`
- ⏳ Editor: `src/bedrock/consoles/ExperienceConsole/LifecycleConfigEditor.tsx`
- ⏳ Registry: Update `component-registry.ts` and `hook-registry.ts`
- ⏳ Provider: Update `grove-data-provider.ts` and `supabase-adapter.ts`

---

## Handoff to Sprintmaster

**Status:** ✅ Ready for packaging

**Next Steps:**
1. Sprintmaster creates EXECUTION_PROMPT.md
2. Sprintmaster packages deliverables for developer
3. Developer implements following v1.0 patterns
4. QA validates SINGLETON enforcement
5. Deploy to staging → production

**Critical Reminders for Developer:**
- ✅ Use Supabase (not GCS) - ADR-001
- ✅ Use ExperienceConsole (not RealityTuner) - ADR-006
- ✅ Use useGroveData pattern - ADR-004
- ✅ Let factory enforce SINGLETON - ADR-008
- ✅ json-render is Phase 4+ (not Phase 1)

---

*Product Brief for S5-SL-LifecycleEngine v1.0*
*UX Chief Approved | Architecture Corrected | Ready for Development*
