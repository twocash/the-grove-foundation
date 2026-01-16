# Architecture Decision Records: S5-SL-LifecycleEngine

## ADR Index

| ID | Title | Status |
|----|-------|--------|
| ADR-001 | Storage Pattern: Supabase via GroveDataProvider | ACCEPTED |
| ADR-002 | Multiple Models vs Single Model | ACCEPTED |
| ADR-003 | System Models Protected | ACCEPTED |
| ADR-004 | Hook-Based Access | ACCEPTED |
| ADR-005 | Fallback Strategy | ACCEPTED |
| ADR-006 | ExperienceConsole Integration (Not Foundation) | ACCEPTED |
| ADR-007 | Stage-to-Tier Mapping Flexibility | ACCEPTED |

---

## ADR-001: Storage Pattern

### Context
Lifecycle configuration needs storage. The codebase has two patterns:

1. **Legacy (server.js):** GCS file loading for narratives, feature-flags
2. **v1.0 (bedrock):** Supabase via GroveDataProvider + SupabaseAdapter

### Decision
**Use v1.0 pattern: Supabase via GroveDataProvider.**

The config is stored in a `lifecycle_configs` table with JSONB `meta` + `payload` columns, accessed through `GroveDataProvider.list('lifecycle-config')`.

### Rationale
- v1.0 is the canonical pattern for new config types
- Consistent with feature-flag, research-agent-config, writer-agent-config
- Real-time updates via Supabase subscriptions (future)
- Already integrated with ExperienceConsole factory
- No need to modify legacy server.js code

### Consequences
- Must add to `GroveObjectType` union in grove-data-provider.ts
- Must add to `TABLE_MAP` and `JSONB_META_TYPES` in supabase-adapter.ts
- Must create Supabase migration for new table

---

## ADR-002: Multiple Models vs Single Model

### Context
Should the config support multiple lifecycle models (botanical, academic, creative) or just one?

### Decision
**Support multiple models with one active.**

The config contains an array of `LifecycleModel` objects and an `activeModelId` field that points to the currently active model.

### Rationale
- Enables A/B testing different lifecycle metaphors
- Operators can experiment without destroying existing config
- Aligns with Phase 3 vision of multiple advancement strategies
- Minimal added complexity (array vs single object)

### Consequences
- UI must handle model selection
- Each sprout uses the active model at time of display (not time of capture)

---

## ADR-003: System Models Protected

### Context
Should operators be able to edit the default "botanical" model?

### Decision
**System models are read-only. Operators create custom models.**

The default "botanical" model has `isEditable: false`. Operators who want different labels must create a new model. This new model can be set as active.

### Rationale
- Protects default experience from accidental changes
- Ensures new deployments have consistent defaults
- Custom models are explicitly operator-owned
- Reduces risk of "broken" default state

### Consequences
- UI must show edit restrictions for system models
- Operators need "Create Model" functionality

---

## ADR-004: Hook-Based Access

### Context
How should components access lifecycle config?

Options:
1. Direct import from config file (current approach)
2. React context/hook via GroveDataProvider
3. Props drilling

### Decision
**Use React hook `useLifecycleConfig()` via GroveDataProvider.**

Components call `useLifecycleConfig()` which internally uses `useGroveData('lifecycle-config')` to fetch from Supabase.

### Rationale
- Consistent with existing v1.0 patterns (useGroveData, useFeatureFlags)
- Automatically updates when config changes via Supabase subscriptions
- Centralizes fallback logic
- Type-safe with TypeScript

### Consequences
- Components must be within GroveDataProvider (already required)
- Hook adds minimal overhead (React Query caching)

---

## ADR-005: Fallback Strategy

### Context
What happens if lifecycle config fails to load from Supabase?

### Decision
**Multi-layer fallback.**

1. **useLifecycleConfig():** If no active config in Supabase, use `DEFAULT_LIFECYCLE_CONFIG_PAYLOAD`
2. **TierBadge:** If hook returns null, use `FALLBACK_TIER_CONFIG`
3. **stageTierMap():** If model not provided, use `FALLBACK_STAGE_TO_TIER`

### Rationale
- System must never break due to config failure
- Current hardcoded behavior preserved as ultimate fallback
- Each layer handles its own failure gracefully

### Consequences
- Need to maintain fallback constants alongside schema
- May display default config briefly during load

---

## ADR-006: ExperienceConsole Integration (Not Foundation)

### Context
Where should lifecycle editing UI live?

Options:
1. Add tab to Foundation RealityTuner (FROZEN - legacy)
2. Add to Bedrock ExperienceConsole (v1.0 pattern)
3. New standalone console

### Decision
**Add to Bedrock ExperienceConsole via type registry.**

Lifecycle-config is registered in `EXPERIENCE_TYPE_REGISTRY` with its own Card and Editor components. The ExperienceConsole's polymorphic factory handles rendering.

### Rationale
- **Foundation layer is FROZEN** - no modifications allowed
- ExperienceConsole is the canonical v1.0 pattern for config types
- Polymorphic factory automatically handles CRUD, filtering, search
- Consistent with feature-flag, research-agent-config, etc.
- Singleton pattern support built into factory

### Consequences
- Must create LifecycleConfigCard.tsx and LifecycleConfigEditor.tsx
- Must register in component-registry.ts and hook-registry.ts
- Must update useUnifiedExperienceData.ts to include new hook

---

## ADR-007: Stage-to-Tier Mapping Flexibility

### Context
Should operators be able to define custom stages, or only remap existing stages to tiers?

### Decision
**Remap only. Stages are schema-defined.**

`SproutStage` is a TypeScript union defined in schema. Operators can only change which tier a stage maps to, not create new stages.

### Rationale
- Stages have semantic meaning in the codebase (research workflow)
- Creating custom stages would require schema migration
- Tier flexibility is sufficient for display customization
- Keeps scope manageable

### Consequences
- Operators who want new stages need schema change (future sprint)
- Clear separation: stages = workflow, tiers = display

---

## ADR-008: SINGLETON Pattern for Active Config

### Context
How many lifecycle configs can be active simultaneously?

### Decision
**SINGLETON: One active config per grove.**

The `allowMultipleActive: false` setting in the registry entry means only one lifecycle-config can have `status: 'active'` at a time. The ExperienceConsole factory's singleton pattern handles activation (archive current, activate new).

### Rationale
- Avoids ambiguity about which model is active
- Matches pattern for research-agent-config, writer-agent-config
- Factory already handles archive-first activation
- Drafts can be created and tested before activating

### Consequences
- UI shows activate/archive/restore-as-draft actions
- Only one row in Supabase should have `meta.status = 'active'`

---

*Architecture decisions for S5-SL-LifecycleEngine v1.0*
*Pattern: Supabase + ExperienceConsole factory*
*Foundation Loop v2*
