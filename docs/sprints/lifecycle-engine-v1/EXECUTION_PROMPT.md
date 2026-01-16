# Execution Prompt: S5-SL-LifecycleEngine v1

## Developer Activation

```
You are acting as DEVELOPER for sprint: lifecycle-engine-v1.

CRITICAL: Execute using the Grove Execution Protocol skill.
Run: /grove-execution-protocol

This sprint implements the Lifecycle Engine - externalizing tier configuration
from hardcoded TypeScript to Supabase via the v1.0 ExperienceConsole pattern.
```

---

## Quick Context

| Field | Value |
|-------|-------|
| **Sprint** | S5-SL-LifecycleEngine v1 |
| **Domain** | Bedrock ExperienceConsole |
| **Pattern** | Supabase + GroveDataProvider + Polymorphic Factory |
| **Effort** | 5-7 days |
| **Stories** | 12 (see USER_STORIES.md) |
| **Epics** | 7 |

---

## Attention Anchor

**Re-read before every major decision:**

- **We are building:** Declarative lifecycle config stored in Supabase, editable via ExperienceConsole
- **Success looks like:** Operators edit tier labels/emojis without code deploy; TierBadge reads from config
- **We are NOT:** Building auto-advancement (Phase 3), json-render (Phase 4+), modifying Foundation (FROZEN)
- **Architecture:** Supabase + ExperienceConsole (NOT GCS + RealityTuner)

---

## Execution Protocol

**MANDATORY:** Use the Grove Execution Protocol skill for all implementation work.

```bash
# Invoke the protocol
/grove-execution-protocol
```

The protocol enforces:
- Strangler fig compliance (Foundation is FROZEN)
- Atomic execution with build gates
- Visual verification via Playwright screenshots
- Status updates to `.agent/status/current/`

---

## Sprint Artifacts (Read These)

| Artifact | Purpose | Priority |
|----------|---------|----------|
| `SPEC.md` | Goals, ACs, Live Status | **Read First** |
| `USER_STORIES.md` | Gherkin acceptance criteria | **Reference Often** |
| `DECISIONS.md` | ADRs (8 decisions) | Constraints |
| `SPRINTS.md` | Epic/story breakdown | Execution Order |
| `MIGRATION_MAP.md` | File-by-file changes | Implementation Guide |
| `ARCHITECTURE.md` | Schema, data flow | Design Reference |

---

## Epic Execution Order

Execute epics sequentially. Each has a build gate.

### Epic 1: Schema Definition
**Files:** `src/core/schema/lifecycle-config.ts`, `src/core/schema/index.ts`
**Build Gate:** `npm run build`
**Commit:** `feat(schema): add LifecycleConfigPayload types`

### Epic 2: Data Provider Integration
**Files:** `src/core/data/grove-data-provider.ts`, `src/core/data/adapters/supabase-adapter.ts`
**Build Gate:** `npm run build`
**Commit:** `feat(data): add lifecycle-config to GroveDataProvider`

### Epic 3: Supabase Migration
**Files:** `supabase/migrations/YYYYMMDDHHMMSS_create_lifecycle_configs.sql`
**Build Gate:** `npx supabase db push` + verify query
**Commit:** `feat(db): create lifecycle_configs table`

### Epic 4: Experience Type Registry
**Files:** `src/bedrock/types/experience.types.ts`
**Build Gate:** `npm run build`
**Commit:** `feat(bedrock): register lifecycle-config in ExperienceConsole`

### Epic 5: Console Components
**Files:**
- `src/bedrock/consoles/ExperienceConsole/cards/LifecycleConfigCard.tsx`
- `src/bedrock/consoles/ExperienceConsole/editors/LifecycleConfigEditor.tsx`
- `src/bedrock/consoles/ExperienceConsole/hooks/useLifecycleConfigData.ts`
- `src/bedrock/consoles/ExperienceConsole/component-registry.ts`
- `src/bedrock/consoles/ExperienceConsole/hook-registry.ts`
**Build Gate:** `npm run build && npm test`
**Commit:** `feat(bedrock): add LifecycleConfigCard and LifecycleConfigEditor`

### Epic 6: Consumer Hook
**Files:**
- `src/surface/hooks/useLifecycleConfig.ts`
- `tests/unit/useLifecycleConfig.test.ts`
**Build Gate:** `npm run build && npm test`
**Commit:** `feat(hooks): add useLifecycleConfig hook`

### Epic 7: TierBadge Migration
**Files:**
- `src/surface/components/TierBadge/TierBadge.tsx`
- `src/surface/components/TierBadge/stageTierMap.ts`
**Build Gate:** `npm run build && npx playwright test tests/e2e/tier-progression.spec.ts`
**Commit:** `refactor(TierBadge): read from lifecycle config`

---

## Key Code Patterns

### Pattern 1: LifecycleConfigPayload Schema

```typescript
// src/core/schema/lifecycle-config.ts
export interface LifecycleConfigPayload {
  activeModelId: string;
  models: LifecycleModel[];
}

export interface LifecycleModel {
  id: string;
  name: string;
  description?: string;
  isEditable: boolean;  // false for system models
  tiers: TierDefinition[];
  mappings: StageTierMapping[];
}

export interface TierDefinition {
  id: string;
  label: string;
  emoji: string;
  order: number;
}

export interface StageTierMapping {
  stage: SproutStage;
  tierId: string;
}

export const DEFAULT_LIFECYCLE_CONFIG_PAYLOAD: LifecycleConfigPayload = {
  activeModelId: 'botanical',
  models: [{
    id: 'botanical',
    name: 'Botanical Growth',
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
      // ... complete mappings
    ]
  }]
};
```

### Pattern 2: EXPERIENCE_TYPE_REGISTRY Entry

```typescript
// src/bedrock/types/experience.types.ts
'lifecycle-config': {
  type: 'lifecycle-config',
  label: 'Lifecycle Config',
  icon: 'timeline',
  cardComponent: 'LifecycleConfigCard',
  editorComponent: 'LifecycleConfigEditor',
  dataHookName: 'useLifecycleConfigData',
  routePath: '/bedrock/experience',
  allowMultipleActive: false,  // SINGLETON
  defaultPayload: DEFAULT_LIFECYCLE_CONFIG_PAYLOAD,
  metrics: [
    { key: 'models', label: 'Models', format: (p) => p.models?.length || 0 },
    { key: 'tiers', label: 'Tiers', format: (p) => p.models?.[0]?.tiers?.length || 0 },
  ],
}
```

### Pattern 3: Supabase Migration

```sql
-- supabase/migrations/YYYYMMDDHHMMSS_create_lifecycle_configs.sql
CREATE TABLE lifecycle_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta JSONB NOT NULL DEFAULT '{}',
  payload JSONB NOT NULL DEFAULT '{}'
);

-- RLS policies
ALTER TABLE lifecycle_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON lifecycle_configs
  FOR SELECT USING (true);

CREATE POLICY "Authenticated write" ON lifecycle_configs
  FOR ALL USING (auth.role() = 'authenticated');

-- Seed default botanical config
INSERT INTO lifecycle_configs (meta, payload) VALUES (
  '{"status": "active", "createdAt": "2026-01-15T00:00:00Z"}',
  -- Full DEFAULT_LIFECYCLE_CONFIG_PAYLOAD as JSON
);
```

### Pattern 4: useLifecycleConfig Consumer Hook

```typescript
// src/surface/hooks/useLifecycleConfig.ts
import { useGroveData } from '@core/data';
import { DEFAULT_LIFECYCLE_CONFIG_PAYLOAD } from '@core/schema';

export function useLifecycleConfig() {
  const { objects, isLoading, error } = useGroveData('lifecycle-config');

  const activeConfig = objects?.find(o => o.meta?.status === 'active');
  const payload = activeConfig?.payload ?? DEFAULT_LIFECYCLE_CONFIG_PAYLOAD;
  const activeModel = payload.models.find(m => m.id === payload.activeModelId);

  const getTierForStage = useCallback((stage: SproutStage) => {
    const mapping = activeModel?.mappings.find(m => m.stage === stage);
    return mapping?.tierId ?? FALLBACK_STAGE_TO_TIER[stage];
  }, [activeModel]);

  const getTierDefinition = useCallback((tierId: string) => {
    return activeModel?.tiers.find(t => t.id === tierId) ?? FALLBACK_TIER_CONFIG[tierId];
  }, [activeModel]);

  return {
    isLoaded: !isLoading && !error,
    activeModel,
    getTierForStage,
    getTierDefinition,
  };
}
```

---

## Verification Commands

```bash
# After each epic
npm run build

# After Epic 5 & 6
npm test

# After Epic 7 (final verification)
npm run build && npm test && npx playwright test tests/e2e/tier-progression.spec.ts

# Manual verification
# Navigate to /bedrock/experience
# Filter by type = lifecycle-config
# Verify card displays, editor opens, edits save
```

---

## FROZEN Zones (Do Not Touch)

Per Bedrock Addendum, these are FROZEN:

- `src/foundation/*` - All Foundation code
- `src/components/Terminal/*` - Legacy Terminal
- `pages/TerminalPage.tsx` - Legacy page

**Work only in:**
- `src/core/*` - Schema, data layer
- `src/bedrock/*` - Console components
- `src/surface/hooks/*` - Consumer hooks
- `src/surface/components/TierBadge/*` - Migration target

---

## Status Updates

Write status to: `.agent/status/current/{NNN}-{timestamp}-developer.md`
Template: `.agent/status/ENTRY_TEMPLATE.md`

Update after each epic completion with:
- Epic completed
- Build gate result
- Commit hash
- Any blockers

---

## Success Criteria

Sprint complete when:
- [ ] All 7 epics complete with passing build gates
- [ ] 12 user stories verified via Gherkin ACs
- [ ] E2E tests pass: `tier-progression.spec.ts`
- [ ] Manual verification: ExperienceConsole shows lifecycle-config type
- [ ] TierBadge displays from Supabase config (with fallback)
- [ ] No visual regression

---

## On Completion

1. Update SPEC.md Live Status to "✅ Complete"
2. Write COMPLETE status entry
3. Notify sprintmaster for Notion sync

---

*Execution Prompt for S5-SL-LifecycleEngine v1.0*
*Pattern: Supabase + ExperienceConsole factory*
*Protocol: Grove Execution Protocol*
