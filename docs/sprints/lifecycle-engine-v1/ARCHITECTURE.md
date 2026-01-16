# Architecture: S5-SL-LifecycleEngine

## Overview

This document defines the target architecture for the Lifecycle Engine - a declarative configuration system for sprout lifecycle management. The engine reads lifecycle rules from **Supabase** via the GroveDataProvider pattern (v1.0), enabling operators to customize tier behavior without code deployment.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FOUNDATION                                   │
│                                                                      │
│    ┌─────────────────────────────────────────────────────────────┐  │
│    │                    Reality Tuner                             │  │
│    │    ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────┐    │  │
│    │    │  Flags  │ │ Routing │ │Settings │ │  Lifecycle   │    │  │
│    │    └────┬────┘ └────┬────┘ └────┬────┘ └──────┬───────┘    │  │
│    └─────────┼──────────┼───────────┼──────────────┼────────────┘  │
│              │          │           │              │                │
└──────────────┼──────────┼───────────┼──────────────┼────────────────┘
               │          │           │              │
               ▼          ▼           ▼              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SUPABASE (v1.0 Pattern)                         │
│                                                                      │
│   GroveDataProvider → SupabaseAdapter                               │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │  lifecycle_configs (new table)                                │  │
│   │  ├── id: uuid                                                 │  │
│   │  ├── meta: jsonb  (GroveObject meta)                          │  │
│   │  ├── payload: jsonb (InformationLifecycleConfig)              │  │
│   │  ├── created_at: timestamp                                    │  │
│   │  └── updated_at: timestamp                                    │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│   Existing tables: feature_flags, lenses, journeys, hubs, etc.      │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     CLIENT-SIDE DATA ACCESS                          │
│                                                                      │
│   useGroveData('lifecycle-config')                                   │
│   ├── GroveDataProvider.list('lifecycle-config')                    │
│   ├── SupabaseAdapter.list() → lifecycle_configs table              │
│   └── Returns GroveObject<InformationLifecycleConfig>[]             │
│                                                                      │
│   Active config: provider.get('lifecycle-config', 'default')        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       SURFACE LAYER                                  │
│                                                                      │
│   ┌─────────────────────────────────────────────────────────────┐  │
│   │              NarrativeEngineContext                          │  │
│   │   globalSettings.lifecycleConfig → useLifecycleConfig()     │  │
│   └─────────────────────────────────────────────────────────────┘  │
│               │                                                      │
│   ┌───────────┴───────────┐                                         │
│   ▼                       ▼                                         │
│   ┌─────────────┐  ┌─────────────────────┐                         │
│   │  TierBadge  │  │   stageTierMap()    │                         │
│   │  (renders)  │  │   (reads mapping)   │                         │
│   └─────────────┘  └─────────────────────┘                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Data Schema

### InformationLifecycleConfig (Root)

```typescript
// src/core/schema/lifecycle-config.ts

export interface InformationLifecycleConfig {
  /** Schema version for migrations */
  version: '1.0';

  /** Currently active lifecycle model ID */
  activeModelId: string;

  /** Available lifecycle models */
  models: LifecycleModel[];

  /** Changelog for audit trail */
  changelog?: LifecycleChangelogEntry[];
}
```

### LifecycleModel

```typescript
export interface LifecycleModel {
  /** Unique identifier (e.g., 'botanical', 'academic', 'creative') */
  id: string;

  /** Human-readable name */
  name: string;

  /** Description for operators */
  description: string;

  /** Is this model editable by operators? System models = false */
  isEditable: boolean;

  /** Ordered tier definitions */
  tiers: TierDefinition[];

  /** Stage-to-tier mappings */
  mappings: StageTierMapping[];
}
```

### TierDefinition

```typescript
export interface TierDefinition {
  /** Tier identifier (e.g., 'seed', 'sprout') */
  id: string;

  /** Display label */
  label: string;

  /** Emoji indicator */
  emoji: string;

  /** Sort order (lower = earlier in lifecycle) */
  order: number;

  /** Optional description for tooltips */
  description?: string;

  /** Optional color hint for theming */
  colorHint?: string;
}
```

### StageTierMapping

```typescript
import type { SproutStage } from './sprout';

export interface StageTierMapping {
  /** Source stage from SproutStage union */
  stage: SproutStage;

  /** Target tier ID from TierDefinition */
  tierId: string;
}
```

### LifecycleChangelogEntry

```typescript
export interface LifecycleChangelogEntry {
  /** ISO timestamp */
  timestamp: string;

  /** What changed */
  action: 'model_created' | 'model_updated' | 'model_deleted' | 'active_model_changed';

  /** Model ID affected */
  modelId: string;

  /** Optional details */
  details?: string;
}
```

---

## Default Configuration

### Botanical Model (System Default)

```json
{
  "version": "1.0",
  "activeModelId": "botanical",
  "models": [
    {
      "id": "botanical",
      "name": "Botanical Growth",
      "description": "Natural growth metaphor from seed to grove",
      "isEditable": false,
      "tiers": [
        { "id": "seed", "label": "Seed", "emoji": "🌰", "order": 0, "description": "Newly captured, untested" },
        { "id": "sprout", "label": "Sprout", "emoji": "🌱", "order": 1, "description": "Growing, accumulating context" },
        { "id": "sapling", "label": "Sapling", "emoji": "🌿", "order": 2, "description": "Promoted to Knowledge Commons" },
        { "id": "tree", "label": "Tree", "emoji": "🌳", "order": 3, "description": "Validated and interconnected" },
        { "id": "grove", "label": "Grove", "emoji": "🌲", "order": 4, "description": "Core knowledge, extensively referenced" }
      ],
      "mappings": [
        { "stage": "tender", "tierId": "seed" },
        { "stage": "rooting", "tierId": "seed" },
        { "stage": "branching", "tierId": "sprout" },
        { "stage": "hardened", "tierId": "sprout" },
        { "stage": "grafted", "tierId": "sprout" },
        { "stage": "dormant", "tierId": "sprout" },
        { "stage": "established", "tierId": "sapling" },
        { "stage": "withered", "tierId": "seed" }
      ]
    }
  ]
}
```

---

## File Structure

### New Files

```
src/core/schema/
├── lifecycle-config.ts      ← TypeScript interfaces + GroveObject payload
└── index.ts                 ← Export lifecycle types

src/core/data/
├── grove-data-provider.ts   ← Add 'lifecycle-config' to GroveObjectType
├── adapters/
│   └── supabase-adapter.ts  ← Add TABLE_MAP['lifecycle-config']
└── defaults.ts              ← Add DEFAULT_LIFECYCLE_CONFIG

supabase/migrations/
└── 0XX_lifecycle_configs.sql ← Create lifecycle_configs table

src/surface/hooks/
└── useLifecycleConfig.ts    ← React hook using useGroveData()

src/foundation/consoles/
└── RealityTuner.tsx         ← Extended with Lifecycle tab
```

### Modified Files

```
src/core/data/
├── grove-data-provider.ts   ← Add 'lifecycle-config' to GroveObjectType
└── adapters/supabase-adapter.ts ← Add TABLE_MAP entry + JSONB_META_TYPES

src/surface/components/TierBadge/
├── TierBadge.config.ts      ← Fallback only, reads from hook
├── stageTierMap.ts          ← Reads from config
└── TierBadge.tsx            ← Uses useLifecycleConfig()

src/foundation/consoles/
└── RealityTuner.tsx         ← Add Lifecycle tab
```

---

## Data Flow

### Load Flow (Supabase v1.0 Pattern)

```
1. Component mounts (e.g., TierBadge, RealityTuner)
   │
2. useLifecycleConfig() hook is called
   │
3. Hook uses useGroveData('lifecycle-config')
   │
4. GroveDataProvider routes to SupabaseAdapter
   │
5. SupabaseAdapter.list('lifecycle-config'):
   ├── Query: SELECT * FROM lifecycle_configs WHERE status = 'active'
   ├── Return: GroveObject<InformationLifecycleConfig>[]
   └── Fallback: getDefaults('lifecycle-config') if empty
   │
6. useLifecycleConfig() extracts active model:
   ├── activeModel: LifecycleModel
   ├── getTierForStage(stage): TierDefinition
   └── allModels: LifecycleModel[]
   │
7. TierBadge reads from hook instead of hardcoded config
```

### Save Flow (Supabase v1.0 Pattern)

```
1. Operator edits lifecycle config in Reality Tuner
   │
2. Click "Save Changes"
   │
3. useGroveData() triggers:
   └── provider.update('lifecycle-config', id, patches)
   │
4. SupabaseAdapter.update():
   ├── Fetch current object
   ├── Apply JSON Patch operations
   ├── UPDATE lifecycle_configs SET payload = $1, updated_at = NOW()
   └── Return updated GroveObject
   │
5. Realtime subscription triggers refresh
   │
6. All subscribed components receive updated config
```

---

## Hook API

### useLifecycleConfig()

```typescript
// src/surface/hooks/useLifecycleConfig.ts

import { useGroveData } from '@core/data/hooks/useGroveData';
import type { InformationLifecycleConfig, LifecycleModel, TierDefinition } from '@core/schema/lifecycle-config';
import type { SproutStage } from '@core/schema/sprout';
import { DEFAULT_LIFECYCLE_CONFIG } from '@core/data/defaults';

interface UseLifecycleConfigReturn {
  /** Currently active lifecycle model */
  activeModel: LifecycleModel | null;

  /** All available models */
  allModels: LifecycleModel[];

  /** Get tier definition for a sprout stage */
  getTierForStage: (stage: SproutStage) => TierDefinition | null;

  /** Get tier by ID */
  getTierById: (tierId: string) => TierDefinition | null;

  /** Is config loaded? */
  isLoaded: boolean;

  /** Loading state */
  isLoading: boolean;
}

export function useLifecycleConfig(): UseLifecycleConfigReturn {
  // Use GroveDataProvider pattern
  const { data, isLoading } = useGroveData<InformationLifecycleConfig>('lifecycle-config');

  // Extract config from first GroveObject (or use default)
  const config = data?.[0]?.payload ?? DEFAULT_LIFECYCLE_CONFIG;
  const activeModel = config?.models.find(m => m.id === config.activeModelId) ?? null;

  const getTierForStage = useCallback((stage: SproutStage) => {
    if (!activeModel) return null;
    const mapping = activeModel.mappings.find(m => m.stage === stage);
    if (!mapping) return null;
    return activeModel.tiers.find(t => t.id === mapping.tierId) ?? null;
  }, [activeModel]);

  const getTierById = useCallback((tierId: string) => {
    return activeModel?.tiers.find(t => t.id === tierId) ?? null;
  }, [activeModel]);

  return {
    activeModel,
    allModels: config?.models ?? [],
    getTierForStage,
    getTierById,
    isLoaded: !!config && !isLoading,
    isLoading
  };
}
```

---

## ExperienceConsole Integration (v1.0 Pattern)

### Lifecycle Config in ExperienceConsole

The lifecycle config follows the **EXPERIENCE_TYPE_REGISTRY** pattern, appearing alongside other experience types (system-prompt, feature-flag, research-agent-config, etc.) in the unified ExperienceConsole.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Experience Console - /bedrock/experience                            │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ [All] [System Prompts] [Feature Flags] [Agent Configs]          ││
│  │      [Copilot Styles] [Lifecycle Models] ← NEW                  ││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  LifecycleConfigCard                                             ││
│  │  ┌─────────────────────────────────────────────────────────┐    ││
│  │  │ 🌱 Botanical Growth                     ACTIVE ✓        │    ││
│  │  │ lifecycle-config                                        │    ││
│  │  │                                                         │    ││
│  │  │ 5 tiers | 8 stage mappings | System model              │    ││
│  │  │                                                         │    ││
│  │  │ Seed 🌰 → Sprout 🌱 → Sapling 🌿 → Tree 🌳 → Grove 🌲   │    ││
│  │  └─────────────────────────────────────────────────────────┘    ││
│  │                                                                  ││
│  │  ┌─────────────────────────────────────────────────────────┐    ││
│  │  │ 📚 Academic Progression                 draft           │    ││
│  │  │ lifecycle-config                                        │    ││
│  │  │                                                         │    ││
│  │  │ 5 tiers | 8 stage mappings | Custom model              │    ││
│  │  │                                                         │    ││
│  │  │ Seed → Note → Draft → Review → Published               │    ││
│  │  └─────────────────────────────────────────────────────────┘    ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
```

### LifecycleConfigEditor (Inspector Panel)

```
┌─────────────────────────────────────────────────────────────────────┐
│  LifecycleConfigEditor                                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Model Name: [Botanical Growth_____________]                        │
│  Description: [Natural growth metaphor from seed to grove]         │
│  Is System Model: [✓] (read-only)                                  │
│                                                                      │
│  ── Tiers ───────────────────────────────────────────────────────  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Order │ ID      │ Emoji │ Label    │ Description            │   │
│  ├───────┼─────────┼───────┼──────────┼────────────────────────┤   │
│  │   0   │ seed    │  🌰   │ Seed     │ Newly captured         │   │
│  │   1   │ sprout  │  🌱   │ Sprout   │ Growing                │   │
│  │   2   │ sapling │  🌿   │ Sapling  │ Promoted to KC         │   │
│  │   3   │ tree    │  🌳   │ Tree     │ Validated              │   │
│  │   4   │ grove   │  🌲   │ Grove    │ Core knowledge         │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ── Stage Mappings ─────────────────────────────────────────────── │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Stage       │ Maps To │                                      │   │
│  ├─────────────┼─────────┤                                      │   │
│  │ tender      │ [seed ▼]│                                      │   │
│  │ rooting     │ [seed ▼]│                                      │   │
│  │ branching   │[sprout▼]│                                      │   │
│  │ established │[sapling▼]│                                     │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  [Duplicate as Custom] [Cancel] [Save]                              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Fallback Strategy

If lifecycle config fails to load:

```typescript
// src/surface/components/TierBadge/TierBadge.config.ts

export const FALLBACK_TIER_CONFIG: Omit<LifecycleModel, 'id' | 'name' | 'description' | 'isEditable'> = {
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
    { stage: 'branching', tierId: 'sprout' },
    { stage: 'hardened', tierId: 'sprout' },
    { stage: 'grafted', tierId: 'sprout' },
    { stage: 'dormant', tierId: 'sprout' },
    { stage: 'established', tierId: 'sapling' },
    { stage: 'withered', tierId: 'seed' },
  ]
};
```

---

## DEX Compliance

| Pillar | Implementation |
|--------|----------------|
| **Declarative Sovereignty** | Lifecycle rules in JSON. Operators edit without code. |
| **Capability Agnosticism** | Config works regardless of AI model. |
| **Provenance** | Changelog tracks model changes. |
| **Organic Scalability** | New models added via config. Schema extensible. |

---

## Future Extensions (Phase 3+)

This schema is designed to support Phase 3 auto-advancement:

```typescript
// Future extension - not in this sprint
interface AdvancementRule {
  fromTierId: string;
  toTierId: string;
  conditions: AdvancementCondition[];
  automatic: boolean;
}

interface AdvancementCondition {
  type: 'time_in_tier' | 'reference_count' | 'manual_promotion' | 'quality_score';
  threshold: number;
}
```

---

*Architecture document for S5-SL-LifecycleEngine*
*Foundation Loop v2*
