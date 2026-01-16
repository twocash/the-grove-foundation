# Migration Map: S5-SL-LifecycleEngine

## Overview

This document maps the file-by-file changes required to implement the Lifecycle Engine using the **v1.0 pattern** (Supabase + ExperienceConsole factory).

**Pattern Reference:** The lifecycle-config type follows the same pattern as `feature-flag`, `research-agent-config`, and other JSONB_META_TYPES in the ExperienceConsole.

---

## Epic 1: Schema Definition

### Create Files

| File | Action | Description |
|------|--------|-------------|
| `src/core/schema/lifecycle-config.ts` | CREATE | TypeScript interfaces and default payload |

### Modify Files

| File | Lines | Change |
|------|-------|--------|
| `src/core/schema/index.ts` | EOF | Export lifecycle-config types |

### Schema Content

```typescript
// src/core/schema/lifecycle-config.ts
import type { SproutStage } from './sprout';

export interface TierDefinition {
  id: string;           // 'seed' | 'sprout' | 'sapling' | 'tree' | 'grove'
  label: string;        // "Seed"
  emoji: string;        // "🌰"
  order: number;        // 0, 1, 2, 3, 4
  description?: string;
}

export interface StageTierMapping {
  stage: SproutStage;   // 'tender' | 'rooting' | ...
  tierId: string;       // 'seed' | 'sprout' | ...
}

export interface LifecycleModel {
  id: string;           // 'botanical' | 'academic' | custom
  name: string;         // "Botanical Growth"
  description: string;
  isEditable: boolean;  // System models = false
  tiers: TierDefinition[];
  mappings: StageTierMapping[];
}

export interface LifecycleConfigPayload {
  version: string;
  activeModelId: string;
  models: LifecycleModel[];
}

export const DEFAULT_LIFECYCLE_CONFIG_PAYLOAD: LifecycleConfigPayload = {
  version: '1.0',
  activeModelId: 'botanical',
  models: [
    {
      id: 'botanical',
      name: 'Botanical Growth',
      description: 'Natural growth metaphor from seed to grove',
      isEditable: false,
      tiers: [
        { id: 'seed', label: 'Seed', emoji: '🌰', order: 0 },
        { id: 'sprout', label: 'Sprout', emoji: '🌱', order: 1 },
        { id: 'sapling', label: 'Sapling', emoji: '🌿', order: 2 },
        { id: 'tree', label: 'Tree', emoji: '🌳', order: 3 },
        { id: 'grove', label: 'Grove', emoji: '🌲', order: 4 },
      ],
      mappings: [
        { stage: 'tender', tierId: 'seed' },
        { stage: 'rooting', tierId: 'seed' },
        { stage: 'established', tierId: 'sapling' },
        { stage: 'verified', tierId: 'tree' },
        { stage: 'published', tierId: 'grove' },
      ],
    },
  ],
};
```

---

## Epic 2: Data Provider Integration

### Modify Files

| File | Lines | Change |
|------|-------|--------|
| `src/core/data/grove-data-provider.ts` | GroveObjectType | Add `'lifecycle-config'` to union |
| `src/core/data/adapters/supabase-adapter.ts` | TABLE_MAP | Add `'lifecycle-config': 'lifecycle_configs'` |
| `src/core/data/adapters/supabase-adapter.ts` | JSONB_META_TYPES | Add `'lifecycle-config'` to Set |

### grove-data-provider.ts Changes

```typescript
// Add to GroveObjectType union
export type GroveObjectType =
  | 'lens'
  | 'journey'
  // ... existing types ...
  | 'copilot-style'
  | 'lifecycle-config';  // NEW
```

### supabase-adapter.ts Changes

```typescript
// Add to TABLE_MAP
const TABLE_MAP: Record<GroveObjectType, string> = {
  // ... existing mappings ...
  'lifecycle-config': 'lifecycle_configs',  // NEW
};

// Add to JSONB_META_TYPES
const JSONB_META_TYPES = new Set<GroveObjectType>([
  'feature-flag',
  'research-agent-config',
  'writer-agent-config',
  'copilot-style',
  'document',
  'lifecycle-config',  // NEW
]);
```

---

## Epic 3: Supabase Migration

### Create Files

| File | Action | Description |
|------|--------|-------------|
| `supabase/migrations/YYYYMMDDHHMMSS_create_lifecycle_configs.sql` | CREATE | Database table |

### Migration SQL

```sql
-- Create lifecycle_configs table for lifecycle engine
-- Pattern: JSONB meta+payload (same as feature_flags, research_agent_configs)

CREATE TABLE IF NOT EXISTS lifecycle_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta JSONB NOT NULL DEFAULT '{}',
  payload JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add RLS policies
ALTER TABLE lifecycle_configs ENABLE ROW LEVEL SECURITY;

-- Public read access (like feature_flags)
CREATE POLICY "Allow public read access" ON lifecycle_configs
  FOR SELECT USING (true);

-- Auth required for write
CREATE POLICY "Allow authenticated insert" ON lifecycle_configs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update" ON lifecycle_configs
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete" ON lifecycle_configs
  FOR DELETE USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX idx_lifecycle_configs_meta_status ON lifecycle_configs ((meta->>'status'));
CREATE INDEX idx_lifecycle_configs_meta_type ON lifecycle_configs ((meta->>'type'));
CREATE INDEX idx_lifecycle_configs_updated_at ON lifecycle_configs (updated_at DESC);

-- Trigger for updated_at
CREATE TRIGGER update_lifecycle_configs_updated_at
  BEFORE UPDATE ON lifecycle_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Seed default botanical config
INSERT INTO lifecycle_configs (meta, payload) VALUES (
  '{
    "id": "botanical-default",
    "title": "Botanical Growth",
    "description": "Natural growth metaphor from seed to grove",
    "status": "active",
    "type": "lifecycle-config",
    "icon": "eco",
    "createdAt": "2026-01-15T00:00:00Z",
    "updatedAt": "2026-01-15T00:00:00Z"
  }',
  '{
    "version": "1.0",
    "activeModelId": "botanical",
    "models": [{
      "id": "botanical",
      "name": "Botanical Growth",
      "description": "Natural growth metaphor from seed to grove",
      "isEditable": false,
      "tiers": [
        {"id": "seed", "label": "Seed", "emoji": "🌰", "order": 0},
        {"id": "sprout", "label": "Sprout", "emoji": "🌱", "order": 1},
        {"id": "sapling", "label": "Sapling", "emoji": "🌿", "order": 2},
        {"id": "tree", "label": "Tree", "emoji": "🌳", "order": 3},
        {"id": "grove", "label": "Grove", "emoji": "🌲", "order": 4}
      ],
      "mappings": [
        {"stage": "tender", "tierId": "seed"},
        {"stage": "rooting", "tierId": "seed"},
        {"stage": "established", "tierId": "sapling"},
        {"stage": "verified", "tierId": "tree"},
        {"stage": "published", "tierId": "grove"}
      ]
    }]
  }'
);
```

---

## Epic 4: Experience Type Registry

### Modify Files

| File | Lines | Change |
|------|-------|--------|
| `src/bedrock/types/experience.types.ts` | EXPERIENCE_TYPE_REGISTRY | Add `lifecycle-config` entry |
| `src/bedrock/types/experience.types.ts` | ExperiencePayloadMap | Add `lifecycle-config` mapping |

### Registry Entry

```typescript
// Add import at top
import type { LifecycleConfigPayload } from '@core/schema/lifecycle-config';
import { DEFAULT_LIFECYCLE_CONFIG_PAYLOAD } from '@core/schema/lifecycle-config';

// Add to EXPERIENCE_TYPE_REGISTRY
'lifecycle-config': {
  type: 'lifecycle-config',
  label: 'Lifecycle Config',
  icon: 'eco',
  description: 'Configure information lifecycle: tiers, stages, metaphors',
  defaultPayload: DEFAULT_LIFECYCLE_CONFIG_PAYLOAD,
  wizardId: undefined, // Simple form, no wizard
  editorComponent: 'LifecycleConfigEditor',
  allowMultipleActive: false, // SINGLETON: One active config
  routePath: '/bedrock/experience',
  color: '#2F5C3B', // grove-forest
  // Polymorphic console support
  cardComponent: 'LifecycleConfigCard',
  dataHookName: 'useLifecycleConfigData',
  searchFields: ['meta.title', 'meta.description'],
  metrics: [
    { id: 'active', label: 'Active', icon: 'check_circle', query: 'count(where: status=active)', typeFilter: 'lifecycle-config' },
  ],
  filters: [
    { field: 'payload.activeModelId', label: 'Active Model', type: 'select', options: ['botanical', 'academic', 'creative', 'custom'] },
  ],
  sortOptions: [
    { field: 'payload.version', label: 'Version', direction: 'desc' },
  ],
} satisfies ExperienceTypeDefinition<LifecycleConfigPayload>,

// Add to ExperiencePayloadMap
export interface ExperiencePayloadMap {
  // ... existing ...
  'lifecycle-config': LifecycleConfigPayload;
}
```

---

## Epic 5: Console Components

### Create Files

| File | Action | Description |
|------|--------|-------------|
| `src/bedrock/consoles/ExperienceConsole/LifecycleConfigCard.tsx` | CREATE | Card component |
| `src/bedrock/consoles/ExperienceConsole/LifecycleConfigEditor.tsx` | CREATE | Editor component |
| `src/bedrock/consoles/ExperienceConsole/useLifecycleConfigData.ts` | CREATE | Data hook |

### Modify Files

| File | Lines | Change |
|------|-------|--------|
| `src/bedrock/consoles/ExperienceConsole/component-registry.ts` | CARD_COMPONENT_REGISTRY | Add LifecycleConfigCard |
| `src/bedrock/consoles/ExperienceConsole/component-registry.ts` | EDITOR_COMPONENT_REGISTRY | Add LifecycleConfigEditor |
| `src/bedrock/consoles/ExperienceConsole/hook-registry.ts` | HOOK_REGISTRY | Add useLifecycleConfigData |
| `src/bedrock/consoles/ExperienceConsole/index.ts` | exports | Add lifecycle config exports |
| `src/bedrock/consoles/ExperienceConsole/useUnifiedExperienceData.ts` | hook calls | Add useLifecycleConfigData |

### component-registry.ts Changes

```typescript
// Add imports
import { LifecycleConfigCard } from './LifecycleConfigCard';
import { LifecycleConfigEditor } from './LifecycleConfigEditor';

// Add to CARD_COMPONENT_REGISTRY
export const CARD_COMPONENT_REGISTRY = {
  // ... existing ...
  LifecycleConfigCard,
};

// Add to EDITOR_COMPONENT_REGISTRY
export const EDITOR_COMPONENT_REGISTRY = {
  // ... existing ...
  LifecycleConfigEditor,
};
```

### hook-registry.ts Changes

```typescript
// Add import
import { useLifecycleConfigData } from './useLifecycleConfigData';

// Add to HOOK_REGISTRY
export const HOOK_REGISTRY = {
  // ... existing ...
  useLifecycleConfigData,
};
```

---

## Epic 6: Consumer Hook

### Create Files

| File | Action | Description |
|------|--------|-------------|
| `src/surface/hooks/useLifecycleConfig.ts` | CREATE | Consumer hook for TierBadge |

### Hook Implementation

```typescript
// src/surface/hooks/useLifecycleConfig.ts
import { useMemo, useCallback } from 'react';
import { useGroveData } from '../../bedrock/hooks/useGroveData';
import type { SproutStage } from '@core/schema/sprout';
import type { TierDefinition, LifecycleModel, LifecycleConfigPayload } from '@core/schema/lifecycle-config';
import { DEFAULT_LIFECYCLE_CONFIG_PAYLOAD } from '@core/schema/lifecycle-config';

export interface UseLifecycleConfigReturn {
  activeModel: LifecycleModel | null;
  allModels: LifecycleModel[];
  getTierForStage: (stage: SproutStage) => TierDefinition | null;
  getTierById: (tierId: string) => TierDefinition | null;
  isLoaded: boolean;
  isLoading: boolean;
  error: Error | null;
}

export function useLifecycleConfig(): UseLifecycleConfigReturn {
  const { data, isLoading, error } = useGroveData<LifecycleConfigPayload>('lifecycle-config');

  // Get first active config or use defaults
  const config = useMemo(() => {
    const activeConfig = data?.find(o => o.meta.status === 'active');
    return activeConfig?.payload ?? DEFAULT_LIFECYCLE_CONFIG_PAYLOAD;
  }, [data]);

  // Get active model
  const activeModel = useMemo(() => {
    return config.models.find(m => m.id === config.activeModelId) ?? null;
  }, [config]);

  // Tier lookup by stage
  const getTierForStage = useCallback((stage: SproutStage): TierDefinition | null => {
    if (!activeModel) return null;
    const mapping = activeModel.mappings.find(m => m.stage === stage);
    if (!mapping) return null;
    return activeModel.tiers.find(t => t.id === mapping.tierId) ?? null;
  }, [activeModel]);

  // Tier lookup by ID
  const getTierById = useCallback((tierId: string): TierDefinition | null => {
    if (!activeModel) return null;
    return activeModel.tiers.find(t => t.id === tierId) ?? null;
  }, [activeModel]);

  return {
    activeModel,
    allModels: config.models,
    getTierForStage,
    getTierById,
    isLoaded: !!data && data.length > 0,
    isLoading,
    error,
  };
}
```

---

## Epic 7: TierBadge Migration

### Modify Files

| File | Lines | Change |
|------|-------|--------|
| `src/surface/components/TierBadge/TierBadge.config.ts` | All | Convert to FALLBACK_ prefix |
| `src/surface/components/TierBadge/stageTierMap.ts` | All | Accept config param, use fallback |
| `src/surface/components/TierBadge/TierBadge.tsx` | ~20-40 | Use useLifecycleConfig() hook |

### TierBadge.config.ts (Fallback)

```typescript
// Rename to FALLBACK constants (used when config unavailable)
export const FALLBACK_TIER_CONFIG = {
  emoji: {
    seed: '🌰',
    sprout: '🌱',
    sapling: '🌿',
    tree: '🌳',
    grove: '🌲',
  },
  labels: {
    seed: 'Seed',
    sprout: 'Sprout',
    sapling: 'Sapling',
    tree: 'Tree',
    grove: 'Grove',
  },
} as const;
```

### TierBadge.tsx Changes

```typescript
import { useLifecycleConfig } from '../../hooks/useLifecycleConfig';
import { FALLBACK_TIER_CONFIG } from './TierBadge.config';

function TierBadge({ tier, stage, ...props }: TierBadgeProps) {
  const { getTierById, getTierForStage, isLoaded } = useLifecycleConfig();

  // If stage provided, resolve tier from stage
  const resolvedTier = stage && isLoaded
    ? getTierForStage(stage)?.id ?? tier
    : tier;

  // Get tier definition or use fallback
  const tierDef = isLoaded ? getTierById(resolvedTier) : null;
  const emoji = tierDef?.emoji ?? FALLBACK_TIER_CONFIG.emoji[resolvedTier];
  const label = tierDef?.label ?? FALLBACK_TIER_CONFIG.labels[resolvedTier];

  // ... rest of render
}
```

### stageTierMap.ts Changes

```typescript
import type { LifecycleModel } from '@core/schema/lifecycle-config';

const FALLBACK_STAGE_TO_TIER: Record<SproutStage, SproutTier> = {
  tender: 'seed',
  rooting: 'seed',
  established: 'sapling',
  verified: 'tree',
  published: 'grove',
};

export function stageTierMap(stage: SproutStage, model?: LifecycleModel): SproutTier {
  if (model) {
    const mapping = model.mappings.find(m => m.stage === stage);
    if (mapping) return mapping.tierId as SproutTier;
  }
  return FALLBACK_STAGE_TO_TIER[stage] ?? 'sprout';
}
```

---

## Execution Order

1. **Epic 1: Schema** - Define types (no runtime impact)
2. **Epic 2: Data Provider** - Wire up adapter routes
3. **Epic 3: Supabase Migration** - Create table with seed data
4. **Epic 4: Experience Type Registry** - Add to polymorphic console registry
5. **Epic 5: Console Components** - Create Card/Editor/Hook
6. **Epic 6: Consumer Hook** - Surface-layer access
7. **Epic 7: TierBadge Migration** - Use config-driven display

Each epic can be verified independently before proceeding.

---

## Rollback Plan

If issues arise:

1. **TierBadge Fallback**: Components always have fallback to `FALLBACK_TIER_CONFIG`
2. **Empty Table**: `useLifecycleConfig` returns defaults if no active config in Supabase
3. **Full Rollback**: Revert TierBadge.tsx to read from `TIER_CONFIG` directly

---

## File Summary

| Epic | Files Created | Files Modified |
|------|---------------|----------------|
| 1 | 1 | 1 |
| 2 | 0 | 2 |
| 3 | 1 | 0 |
| 4 | 0 | 1 |
| 5 | 3 | 4 |
| 6 | 1 | 0 |
| 7 | 0 | 3 |
| **Total** | **6** | **11** |

---

*Migration map for S5-SL-LifecycleEngine v1.0*
*Pattern: Supabase + ExperienceConsole factory*
*Foundation Loop v2*
