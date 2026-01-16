# Sprint Breakdown: S5-SL-LifecycleEngine

## Epic Overview

| Epic | Stories | Effort | Critical Path |
|------|---------|--------|---------------|
| Epic 1: Schema Definition | 2 | S | Yes |
| Epic 2: Data Provider Integration | 2 | S | Yes |
| Epic 3: Supabase Migration | 1 | S | Yes |
| Epic 4: Experience Type Registry | 2 | S | Yes |
| Epic 5: Console Components | 4 | M | Yes |
| Epic 6: Consumer Hook | 2 | S | No |
| Epic 7: TierBadge Migration | 3 | S | No |

---

## Epic 1: Schema Definition

### Attention Checkpoint
Before starting this epic, verify:
- [ ] SPEC.md Live Status shows correct phase
- [ ] Build passes before changes
- [ ] Goal alignment confirmed: Define TypeScript interfaces for lifecycle config

### Story 1.1: Create lifecycle-config.ts

**As a** Developer
**I want to** define TypeScript interfaces for lifecycle configuration
**So that** the config schema is type-safe and documented

**Acceptance Criteria:**
```gherkin
Scenario: Interfaces compile without error
  Given I create src/core/schema/lifecycle-config.ts
  When I define LifecycleConfigPayload, LifecycleModel, TierDefinition, StageTierMapping
  Then TypeScript compiles without error
  And DEFAULT_LIFECYCLE_CONFIG_PAYLOAD contains botanical model
```

**Tests:**
- Build: `npm run build` passes

### Story 1.2: Export from schema index

**As a** Developer
**I want to** export lifecycle types from schema index
**So that** other modules can import cleanly

**Acceptance Criteria:**
```gherkin
Scenario: Types exportable via @core/schema
  Given lifecycle-config.ts is created
  When I add export to src/core/schema/index.ts
  Then I can import { LifecycleConfigPayload } from '@core/schema'
```

### Build Gate
```bash
npm run build
```

---

## Epic 2: Data Provider Integration

### Attention Checkpoint
Before starting this epic, verify:
- [ ] Epic 1 complete (types defined)
- [ ] SPEC.md Live Status updated
- [ ] Goal alignment confirmed: Add lifecycle-config to GroveDataProvider routing

### Story 2.1: Add to GroveObjectType

**As a** Developer
**I want to** add 'lifecycle-config' to GroveObjectType union
**So that** the data provider knows this type exists

**Acceptance Criteria:**
```gherkin
Scenario: Type is valid GroveObjectType
  Given I update src/core/data/grove-data-provider.ts
  When I add 'lifecycle-config' to GroveObjectType union
  Then TypeScript compiles without error
```

**File:** `src/core/data/grove-data-provider.ts`

### Story 2.2: Add to SupabaseAdapter mappings

**As a** Developer
**I want to** add lifecycle-config routing to SupabaseAdapter
**So that** queries route to the correct table

**Acceptance Criteria:**
```gherkin
Scenario: Adapter maps to lifecycle_configs table
  Given I update src/core/data/adapters/supabase-adapter.ts
  When I add 'lifecycle-config': 'lifecycle_configs' to TABLE_MAP
  And I add 'lifecycle-config' to JSONB_META_TYPES
  Then TypeScript compiles without error
```

**File:** `src/core/data/adapters/supabase-adapter.ts`

### Build Gate
```bash
npm run build
```

---

## Epic 3: Supabase Migration

### Attention Checkpoint
Before starting this epic, verify:
- [ ] Epic 2 complete (adapter configured)
- [ ] SPEC.md Live Status updated
- [ ] Goal alignment confirmed: Create database table

### Story 3.1: Create lifecycle_configs table

**As a** Developer
**I want to** create the lifecycle_configs table in Supabase
**So that** config can be persisted

**Acceptance Criteria:**
```gherkin
Scenario: Table exists with RLS policies
  Given I create supabase/migrations/YYYYMMDDHHMMSS_create_lifecycle_configs.sql
  When I run npx supabase db push
  Then Table lifecycle_configs exists
  And RLS policies allow public read, authenticated write
  And Default botanical config is seeded
```

### Build Gate
```bash
npx supabase db push
# Verify: SELECT * FROM lifecycle_configs;
```

---

## Epic 4: Experience Type Registry

### Attention Checkpoint
Before starting this epic, verify:
- [ ] Epic 3 complete (table exists)
- [ ] SPEC.md Live Status updated
- [ ] Goal alignment confirmed: Register type in ExperienceConsole

### Story 4.1: Add to EXPERIENCE_TYPE_REGISTRY

**As a** Developer
**I want to** register lifecycle-config in the type registry
**So that** ExperienceConsole discovers it automatically

**Acceptance Criteria:**
```gherkin
Scenario: Type appears in registry
  Given I update src/bedrock/types/experience.types.ts
  When I add lifecycle-config entry with card/editor/hook names
  And I add to ExperiencePayloadMap
  Then getAllExperienceTypes() includes 'lifecycle-config'
  And getExperienceTypeDefinition('lifecycle-config') returns correct metadata
```

**File:** `src/bedrock/types/experience.types.ts`

### Story 4.2: Add to ExperiencePayloadMap

**As a** Developer
**I want to** add type mapping for lifecycle-config payload
**So that** TypeScript can infer correct payload type

**Acceptance Criteria:**
```gherkin
Scenario: Payload type is correct
  Given ExperiencePayloadMap exists
  When I add 'lifecycle-config': LifecycleConfigPayload
  Then TypeScript resolves correct payload type
```

### Build Gate
```bash
npm run build
```

---

## Epic 5: Console Components

### Attention Checkpoint
Before starting this epic, verify:
- [ ] Epic 4 complete (registry entry exists)
- [ ] SPEC.md Live Status updated
- [ ] Goal alignment confirmed: Create Card/Editor/Hook for ExperienceConsole

### Story 5.1: Create LifecycleConfigCard

**As an** Operator
**I want to** see lifecycle configs in the ExperienceConsole grid
**So that** I can browse and select them

**Acceptance Criteria:**
```gherkin
Scenario: Card renders in console grid
  Given LifecycleConfigCard.tsx is created
  When I view ExperienceConsole with type filter = lifecycle-config
  Then Cards display model name, tier count, active status
```

**File:** `src/bedrock/consoles/ExperienceConsole/LifecycleConfigCard.tsx`

### Story 5.2: Create LifecycleConfigEditor

**As an** Operator
**I want to** edit lifecycle config in the inspector panel
**So that** I can modify tiers and mappings

**Acceptance Criteria:**
```gherkin
Scenario: Editor allows model editing
  Given LifecycleConfigEditor.tsx is created
  When I select a lifecycle config card
  Then Inspector shows tier table with emoji/label/order
  And I can edit labels for isEditable models
  And I can add/remove tier mappings
```

**File:** `src/bedrock/consoles/ExperienceConsole/LifecycleConfigEditor.tsx`

### Story 5.3: Create useLifecycleConfigData hook

**As a** Developer
**I want to** fetch lifecycle configs via useGroveData
**So that** the console has CRUD operations

**Acceptance Criteria:**
```gherkin
Scenario: Hook provides CRUD
  Given useLifecycleConfigData.ts is created
  When I call the hook
  Then I get objects, create, update, remove, duplicate functions
  And createTyped creates with correct defaultPayload
```

**File:** `src/bedrock/consoles/ExperienceConsole/useLifecycleConfigData.ts`

### Story 5.4: Register in component/hook registries

**As a** Developer
**I want to** register components and hook
**So that** polymorphic console can resolve them

**Acceptance Criteria:**
```gherkin
Scenario: Registry resolution works
  Given components and hook are imported
  When I add to CARD_COMPONENT_REGISTRY, EDITOR_COMPONENT_REGISTRY, HOOK_REGISTRY
  Then resolveCardComponent('LifecycleConfigCard') returns component
  And resolveEditorComponent('LifecycleConfigEditor') returns component
  And hasDataHook('useLifecycleConfigData') returns true
```

**Files:**
- `src/bedrock/consoles/ExperienceConsole/component-registry.ts`
- `src/bedrock/consoles/ExperienceConsole/hook-registry.ts`
- `src/bedrock/consoles/ExperienceConsole/useUnifiedExperienceData.ts`

### Build Gate
```bash
npm run build && npm test
# Manual: Navigate to /bedrock/experience, verify Lifecycle Config type appears
```

---

## Epic 6: Consumer Hook

### Attention Checkpoint
Before starting this epic, verify:
- [ ] Epic 5 complete (console components work)
- [ ] SPEC.md Live Status updated
- [ ] Goal alignment confirmed: Surface-layer access hook

### Story 6.1: Create useLifecycleConfig hook

**As a** Component Developer
**I want to** access lifecycle config via React hook
**So that** components can read tier definitions declaratively

**Acceptance Criteria:**
```gherkin
Scenario: Hook returns active model
  Given useLifecycleConfig.ts is created
  When I call useLifecycleConfig()
  Then activeModel contains botanical model
  And getTierForStage('established') returns sapling tier
```

```gherkin
Scenario: Hook handles missing config
  Given no lifecycle_configs in Supabase
  When I call useLifecycleConfig()
  Then isLoaded is false
  And getTierForStage uses DEFAULT_LIFECYCLE_CONFIG_PAYLOAD
```

**File:** `src/surface/hooks/useLifecycleConfig.ts`

### Story 6.2: Unit tests for hook

**As a** Developer
**I want to** test the useLifecycleConfig hook
**So that** fallback behavior is verified

**Tests:**
- Unit: `tests/unit/useLifecycleConfig.test.ts`
  - Returns active model when config loaded
  - Returns null when config missing
  - getTierForStage maps correctly
  - Fallback works when config undefined

### Build Gate
```bash
npm run build && npm test
```

---

## Epic 7: TierBadge Migration

### Attention Checkpoint
Before starting this epic, verify:
- [ ] Epic 6 complete (hook available)
- [ ] SPEC.md Live Status updated
- [ ] Goal alignment confirmed: TierBadge reads from config

### Story 7.1: Migrate TierBadge.tsx

**As a** Developer
**I want to** TierBadge to read from lifecycle config
**So that** tier display is config-driven

**Acceptance Criteria:**
```gherkin
Scenario: TierBadge uses config when available
  Given lifecycle config is loaded
  When TierBadge renders tier="sapling"
  Then Emoji is read from config
  And Label is read from config
```

```gherkin
Scenario: TierBadge falls back to hardcoded
  Given lifecycle config is NOT loaded
  When TierBadge renders tier="sapling"
  Then Emoji falls back to FALLBACK_TIER_CONFIG.emoji.sapling
```

**File:** `src/surface/components/TierBadge/TierBadge.tsx`

### Story 7.2: Migrate stageTierMap.ts

**As a** Developer
**I want to** stageTierMap to read mappings from config
**So that** stage-to-tier conversion is config-driven

**Acceptance Criteria:**
```gherkin
Scenario: stageTierMap uses config mappings
  Given LifecycleModel with custom mappings
  When stageTierMap('established', activeModel) is called
  Then Returns tier from config mapping
```

**File:** `src/surface/components/TierBadge/stageTierMap.ts`

### Story 7.3: No visual regression

**As a** User
**I want to** see the same tier badges as before
**So that** the migration is transparent

**Acceptance Criteria:**
```gherkin
Scenario: Visual regression test
  Given I run E2E tier-progression tests
  When All tests complete
  Then All tests pass
  And Screenshots match previous
```

### Build Gate
```bash
npm run build && npx playwright test tests/e2e/tier-progression.spec.ts
```

---

## Commit Sequence

1. `feat(schema): add LifecycleConfigPayload types` (Epic 1)
2. `feat(data): add lifecycle-config to GroveDataProvider` (Epic 2)
3. `feat(db): create lifecycle_configs table` (Epic 3)
4. `feat(bedrock): register lifecycle-config in ExperienceConsole` (Epic 4)
5. `feat(bedrock): add LifecycleConfigCard and LifecycleConfigEditor` (Epic 5)
6. `feat(hooks): add useLifecycleConfig hook` (Epic 6)
7. `refactor(TierBadge): read from lifecycle config` (Epic 7)

---

## Summary

| Metric | Value |
|--------|-------|
| **Total Stories** | 16 |
| **Critical Path Stories** | 11 |
| **Effort** | M (1 sprint) |
| **New Files** | 6 |
| **Modified Files** | 11 |

---

*Sprint breakdown for S5-SL-LifecycleEngine v1.0*
*Pattern: Supabase + ExperienceConsole factory*
*Foundation Loop v2*
