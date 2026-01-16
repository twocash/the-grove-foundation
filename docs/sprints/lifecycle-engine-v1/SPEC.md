# Specification: S5-SL-LifecycleEngine

## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | Phase 7: User Stories |
| **Status** | 🟡 In Progress |
| **Blocking Issues** | None |
| **Last Updated** | 2026-01-15T12:00:00Z |
| **Next Action** | Generate user stories with acceptance criteria |
| **Attention Anchor** | Supabase + ExperienceConsole pattern (NOT GCS/Foundation) |
| **Design Status** | ✅ UX Chief Approved with Corrections |

---

## Attention Anchor

**Re-read this block before every major decision.**

- **We are building:** A declarative lifecycle engine that reads tier configuration from Supabase via GroveDataProvider
- **Success looks like:** Operators can edit tier labels/emojis in Bedrock ExperienceConsole without code deploy
- **We are NOT:** Building auto-advancement logic (Phase 3), json-render integration (Phase 4+)
- **Current phase:** User Stories
- **Next action:** Generate user stories with Gherkin acceptance criteria
- **Architecture:** Supabase + ExperienceConsole (NOT GCS + Foundation - those are frozen/deprecated)

---

## Executive Summary

Transform the tier badge system from hardcoded TypeScript to declarative configuration stored in Supabase via GroveDataProvider. This enables operators to customize lifecycle models through the Bedrock ExperienceConsole without code deployment, following the v1.0 pattern established by feature-flag, research-agent-config, and writer-agent-config.

---

## Goals

### Primary Goal
Externalize tier configuration to Supabase via GroveDataProvider, enabling operator customization via Bedrock ExperienceConsole.

### Secondary Goals
1. Support multiple lifecycle models (botanical, academic, research, creative)
2. Preserve existing tier display behavior as default config (seeded botanical model)
3. Integrate lifecycle-config as new experience type in ExperienceConsole
4. Prepare schema for Phase 3 auto-advancement rules (defer implementation)

---

## Non-Goals

- **Auto-advancement logic** - That's Phase 3
- **json-render integration** - That's Phase 4+ (defer to build substrate first)
- **Tier filtering in GardenTray** - Different track
- **Custom icons/animations** - Beyond scope, future enhancement
- **Breaking existing tier display** - Must maintain backward compatibility
- **Modifying Foundation layer** - FROZEN per Bedrock Addendum
- **GCS storage** - Deprecated for new config types per ADR-001

---

## Acceptance Criteria

### AC-1: LifecycleConfigPayload Schema
- [ ] TypeScript interface defined in `src/core/schema/lifecycle-config.ts`
- [ ] Supports tier definitions (id, label, emoji, order)
- [ ] Supports stage-to-tier mappings
- [ ] Supports multiple lifecycle models with `isEditable` flag
- [ ] Includes `DEFAULT_LIFECYCLE_CONFIG_PAYLOAD` with botanical model
- [ ] Exported from `src/core/schema/index.ts`

### AC-2: Supabase Storage via GroveDataProvider
- [ ] `lifecycle-config` added to `GroveObjectType` union
- [ ] `lifecycle_configs` table created in Supabase
- [ ] JSONB meta+payload pattern (listed in `JSONB_META_TYPES`)
- [ ] RLS policies allow public read, authenticated write
- [ ] Default botanical config seeded on migration

### AC-3: ExperienceConsole Integration
- [ ] `lifecycle-config` registered in `EXPERIENCE_TYPE_REGISTRY`
- [ ] `LifecycleConfigCard` displays model name, tier count, status
- [ ] `LifecycleConfigEditor` allows tier/mapping editing
- [ ] `useLifecycleConfigData` hook provides CRUD operations
- [ ] Components registered in component-registry.ts
- [ ] SINGLETON pattern enforced (one active config)

### AC-4: Config-Driven TierBadge
- [ ] `useLifecycleConfig()` hook reads active model from Supabase
- [ ] TierBadge reads emoji/label from config instead of hardcoded values
- [ ] `stageTierMap()` reads mappings from active model
- [ ] Fallback to `FALLBACK_TIER_CONFIG` if config unavailable
- [ ] No visual regression (E2E tests pass)

### AC-5: Multiple Lifecycle Models
- [ ] Schema supports `models[]` array within single config
- [ ] Botanical model seeded with `isEditable: false` (system model)
- [ ] Editor shows locked state for system models
- [ ] Custom models support 2-10 tiers with emoji/label editing
- [ ] Config specifies `activeModelId` for tier resolution

---

## Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Tier config externalization | Supabase + GroveDataProvider | Add `lifecycle-config` to GroveObjectType |
| JSONB storage | feature-flag, research-agent-config | Use meta+payload pattern |
| Admin editing | ExperienceConsole polymorphic factory | Add LifecycleConfigCard/Editor |
| Hook-based access | useGroveData pattern | Create useLifecycleConfigData hook |
| Consumer access | useFeatureFlags pattern | Create useLifecycleConfig hook |

## New Patterns Proposed

None. All requirements met by extending existing v1.0 patterns.

---

## Canonical Source Audit

| Capability Needed | Canonical Home | Current Approach | Recommendation |
|-------------------|----------------|------------------|----------------|
| Tier config | `Supabase lifecycle_configs` | Hardcoded in TierBadge.config.ts | PORT to Supabase |
| Stage-to-tier mapping | `LifecycleConfigPayload.models[].mappings` | Hardcoded in stageTierMap.ts | PORT to config |
| Config editing | ExperienceConsole | N/A (no config exists) | ADD new experience type |
| Config loading | useGroveData('lifecycle-config') | N/A | CREATE via GroveDataProvider |
| Consumer access | useLifecycleConfig() | N/A | CREATE surface-layer hook |

---

## Technical Notes

### Config Structure (Payload)

```typescript
interface LifecycleConfigPayload {
  activeModelId: string;
  models: LifecycleModel[];
}

interface LifecycleModel {
  id: string;           // 'botanical' | 'academic' | custom
  name: string;         // "Botanical Growth"
  description?: string;
  isEditable: boolean;  // false for system models
  tiers: TierDefinition[];
  mappings: StageTierMapping[];
}

interface TierDefinition {
  id: string;           // 'seed' | 'sprout' | 'sapling' | 'tree' | 'grove'
  label: string;        // "Seed"
  emoji: string;        // "🌰"
  order: number;        // 0, 1, 2, 3, 4
  description?: string;
}

interface StageTierMapping {
  stage: SproutStage;   // 'tender' | 'rooting' | 'established' | ...
  tierId: string;       // 'seed' | 'sprout' | 'sapling' | ...
}
```

### Supabase Table Structure

```sql
CREATE TABLE lifecycle_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta JSONB NOT NULL DEFAULT '{}',  -- status, createdAt, updatedAt
  payload JSONB NOT NULL DEFAULT '{}' -- LifecycleConfigPayload
);
```

### Migration Strategy (v1.0 Pattern)

1. Define LifecycleConfigPayload types in `src/core/schema/`
2. Add `lifecycle-config` to GroveObjectType and SupabaseAdapter
3. Create Supabase migration with default botanical config
4. Register in EXPERIENCE_TYPE_REGISTRY
5. Create LifecycleConfigCard/Editor components
6. Create useLifecycleConfigData hook for ExperienceConsole
7. Create useLifecycleConfig consumer hook for Surface
8. Migrate TierBadge to read from hook (with fallback)

---

## DEX Alignment

| Pillar | How This Sprint Supports |
|--------|--------------------------|
| **Declarative Sovereignty** | Tier config in Supabase JSONB, not hardcoded. Operators edit via ExperienceConsole. |
| **Capability Agnosticism** | Same config works regardless of which AI model generated the sprout. |
| **Provenance** | GroveObject tracks createdBy, updatedAt. System vs custom models explicit. |
| **Organic Scalability** | Multiple models supported. Custom models added via UI, no code changes. |

---

## Dependencies

- **S4-SL-TierProgression (COMPLETE)** - Provides TierBadge component to extend
- **Supabase + GroveDataProvider** - v1.0 storage pattern (existing)
- **ExperienceConsole + EXPERIENCE_TYPE_REGISTRY** - v1.0 admin pattern (existing)
- **SupabaseAdapter with JSONB support** - Existing infrastructure

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Config schema changes break display | Low | High | FALLBACK_TIER_CONFIG, type guards |
| Supabase query latency | Low | Medium | useGroveData caching, optimistic updates |
| SINGLETON activation conflicts | Low | Low | Factory pattern handles automatically |
| System model protection bypass | Low | Medium | isEditable check in editor, backend validation |

---

## Effort Estimate

| Epic | Effort | Notes |
|------|--------|-------|
| Epic 1: Schema Definition | S | TypeScript interfaces, exports |
| Epic 2: Data Provider Integration | S | GroveObjectType, SupabaseAdapter |
| Epic 3: Supabase Migration | S | Table creation, RLS, seed data |
| Epic 4: Experience Type Registry | S | Registry entry, PayloadMap |
| Epic 5: Console Components | M | Card, Editor, Hook, Registries |
| Epic 6: Consumer Hook | S | useLifecycleConfig for Surface |
| Epic 7: TierBadge Migration | S | Config-driven display |
| **Total** | **M** (5-7 days) | v1.0 patterns already exist |

---

## UX Chief Approval

**Status:** ✅ APPROVED WITH CORRECTIONS (2026-01-15)

**Critical Corrections Applied:**
- ❌ GCS → ✅ Supabase via GroveDataProvider
- ❌ Foundation RealityTuner → ✅ Bedrock ExperienceConsole
- ❌ Manual SINGLETON → ✅ Factory pattern (automatic)

**Deferred to Phase 4+:**
- json-render integration (build substrate first)

---

*Specification for S5-SL-LifecycleEngine v1.0*
*Pattern: Supabase + ExperienceConsole factory*
*Foundation Loop v2*
