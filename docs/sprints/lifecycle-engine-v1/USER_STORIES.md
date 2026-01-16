# User Stories & Acceptance Criteria: S5-SL-LifecycleEngine

**Sprint:** S5-SL-LifecycleEngine v1
**Codename:** Lifecycle Engine
**Phase:** Story Extraction + Acceptance Criteria
**Status:** Ready for Review

---

## Critical Observations

### 1. Architecture Correction Applied

The original spec referenced GCS storage and Foundation RealityTuner. Per UX Chief review, this has been corrected to:
- **Storage:** Supabase via GroveDataProvider (v1.0 pattern)
- **UI:** Bedrock ExperienceConsole (Foundation is FROZEN)

**Impact:** All stories now reference correct patterns.

### 2. System Model Protection

The default "botanical" model must be protected from editing. Stories include explicit acceptance criteria for `isEditable: false` enforcement.

### 3. SINGLETON Pattern

Only one lifecycle config can be active at a time. The factory pattern handles this automatically, but stories verify the behavior.

---

## Proposed v1.0 Simplifications

| Spec Feature | v1.0 Approach | Rationale |
|--------------|---------------|-----------|
| json-render preview | Defer to Phase 4+ | Build core value first |
| Dynamic tier count | Fixed 2-10 tiers | Simpler validation |
| Auto-advancement rules | Defer to Phase 3 | Schema ready, logic deferred |
| Custom tier icons | Emoji only | Reduces complexity |

---

## Epic 1: Schema Definition

### US-L001: Define LifecycleConfigPayload Types

**As a** Developer
**I want to** define TypeScript interfaces for lifecycle configuration
**So that** the config schema is type-safe and documented

**INVEST Assessment:**
- **I**ndependent: Yes — pure types, no dependencies
- **N**egotiable: Yes — interface structure can evolve
- **V**aluable: Yes — foundation for all other work
- **E**stimable: Yes — 2-4 hours
- **S**mall: Yes — single file
- **T**estable: Yes — TypeScript compilation

**Acceptance Criteria:**

```gherkin
Scenario: Schema types compile without error
  Given I create src/core/schema/lifecycle-config.ts
  When I define LifecycleConfigPayload, LifecycleModel, TierDefinition, StageTierMapping
  Then TypeScript compiles without error
  And all types are exported

Scenario: Default config matches botanical model
  Given DEFAULT_LIFECYCLE_CONFIG_PAYLOAD is defined
  When I inspect the default config
  Then activeModelId is "botanical"
  And models array contains exactly one model
  And botanical model has 5 tiers (seed, sprout, sapling, tree, grove)
  And botanical model has isEditable = false

Scenario: Types are importable via @core/schema
  Given lifecycle-config.ts is created
  When I add export to src/core/schema/index.ts
  Then I can import { LifecycleConfigPayload } from '@core/schema'
```

**Traceability:** AC-1: LifecycleConfigPayload Schema

---

## Epic 2: Data Provider Integration

### US-L002: Add lifecycle-config to GroveObjectType

**As a** Developer
**I want to** register lifecycle-config as a GroveObjectType
**So that** the data provider recognizes this type

**INVEST Assessment:**
- **I**ndependent: Yes — depends only on US-L001
- **N**egotiable: Yes — type name flexible
- **V**aluable: Yes — enables data layer routing
- **E**stimable: Yes — 1 hour
- **S**mall: Yes — single line addition
- **T**estable: Yes — TypeScript compilation

**Acceptance Criteria:**

```gherkin
Scenario: Type is valid GroveObjectType
  Given I update src/core/data/grove-data-provider.ts
  When I add 'lifecycle-config' to GroveObjectType union
  Then TypeScript compiles without error
  And GroveDataProvider.list('lifecycle-config') is valid

Scenario: Adapter maps to correct table
  Given I update src/core/data/adapters/supabase-adapter.ts
  When I add 'lifecycle-config': 'lifecycle_configs' to TABLE_MAP
  And I add 'lifecycle-config' to JSONB_META_TYPES
  Then queries route to lifecycle_configs table
  And meta+payload pattern is used
```

**Traceability:** AC-2: Supabase Storage via GroveDataProvider

---

## Epic 3: Supabase Migration

### US-L003: Create lifecycle_configs Table

**As a** Developer
**I want to** create the Supabase table for lifecycle configs
**So that** configuration can be persisted

**INVEST Assessment:**
- **I**ndependent: Yes — depends only on US-L002
- **N**egotiable: No — table structure is fixed
- **V**aluable: Yes — enables persistence
- **E**stimable: Yes — 2-4 hours
- **S**mall: Yes — single migration file
- **T**estable: Yes — Supabase query verification

**Acceptance Criteria:**

```gherkin
Scenario: Table exists with correct structure
  Given I create migration file create_lifecycle_configs.sql
  When I run npx supabase db push
  Then table lifecycle_configs exists
  And column id is UUID PRIMARY KEY
  And column meta is JSONB NOT NULL
  And column payload is JSONB NOT NULL

Scenario: RLS policies are configured
  Given the table is created
  When I apply RLS policies
  Then public can SELECT
  And authenticated users can INSERT, UPDATE, DELETE
  And anon cannot modify

Scenario: Default config is seeded
  Given the migration completes
  When I query SELECT * FROM lifecycle_configs
  Then exactly one row exists
  And meta.status = 'active'
  And payload.activeModelId = 'botanical'
  And payload.models[0].isEditable = false
```

**Traceability:** AC-2: Supabase Storage via GroveDataProvider

---

## Epic 4: Experience Type Registry

### US-L004: Register in EXPERIENCE_TYPE_REGISTRY

**As a** Developer
**I want to** register lifecycle-config in the type registry
**So that** ExperienceConsole discovers it automatically

**INVEST Assessment:**
- **I**ndependent: Yes — parallel to Epic 5
- **N**egotiable: Yes — metadata flexible
- **V**aluable: Yes — enables console discovery
- **E**stimable: Yes — 1-2 hours
- **S**mall: Yes — registry entry
- **T**estable: Yes — getAllExperienceTypes()

**Acceptance Criteria:**

```gherkin
Scenario: Type appears in registry
  Given I update src/bedrock/types/experience.types.ts
  When I add lifecycle-config entry with:
    | Field | Value |
    | type | lifecycle-config |
    | label | Lifecycle Config |
    | icon | timeline |
    | cardComponent | LifecycleConfigCard |
    | editorComponent | LifecycleConfigEditor |
    | dataHookName | useLifecycleConfigData |
    | allowMultipleActive | false |
  Then getAllExperienceTypes() includes 'lifecycle-config'
  And getExperienceTypeDefinition('lifecycle-config') returns correct metadata

Scenario: Payload type is mapped
  Given ExperiencePayloadMap exists
  When I add 'lifecycle-config': LifecycleConfigPayload
  Then TypeScript resolves correct payload type
  And editor receives typed payload
```

**Traceability:** AC-3: ExperienceConsole Integration

---

## Epic 5: Console Components

### US-L005: Create LifecycleConfigCard

**As an** Operator
**I want to** see lifecycle configs in the ExperienceConsole grid
**So that** I can browse and select them

**INVEST Assessment:**
- **I**ndependent: Yes — parallel to US-L006
- **N**egotiable: Yes — visual design flexible
- **V**aluable: Yes — enables discovery
- **E**stimable: Yes — 4-6 hours
- **S**mall: Yes — single component
- **T**estable: Yes — visual verification

**Acceptance Criteria:**

```gherkin
Scenario: Card renders in console grid
  Given LifecycleConfigCard.tsx is created
  When I view ExperienceConsole with type filter = lifecycle-config
  Then card displays model name (e.g., "Botanical Growth")
  And card displays tier count (e.g., "5 tiers")
  And card displays status badge (active/draft/archived)
  And card displays tier emoji preview (e.g., 🌰🌱🌿🌳🌲)

Scenario: Card shows system vs custom distinction
  Given a system model with isEditable = false
  When I view the card
  Then a "System" badge is visible
  And the card cannot be deleted

Scenario: Card is clickable
  Given the card is rendered
  When I click the card
  Then the inspector panel opens with LifecycleConfigEditor
```

**Traceability:** AC-3: ExperienceConsole Integration

---

### US-L006: Create LifecycleConfigEditor

**As an** Operator
**I want to** edit lifecycle config in the inspector panel
**So that** I can modify tiers and mappings

**INVEST Assessment:**
- **I**ndependent: Yes — parallel to US-L005
- **N**egotiable: Yes — form layout flexible
- **V**aluable: Yes — core editing capability
- **E**stimable: Yes — 8-12 hours
- **S**mall: Yes — single component (complex)
- **T**estable: Yes — form interaction tests

**Acceptance Criteria:**

```gherkin
Scenario: Editor displays model metadata
  Given a lifecycle config is selected
  When the LifecycleConfigEditor renders
  Then model name is displayed (editable for custom, read-only for system)
  And description is displayed
  And isEditable badge shows "System" or "Custom"

Scenario: Tier table is editable for custom models
  Given a custom model with isEditable = true
  When I view the tier table
  Then I can edit emoji via emoji picker
  And I can edit label inline
  And I can drag rows to reorder (updates order value)
  And I cannot add/remove tiers (fixed 2-10)

Scenario: Tier table is locked for system models
  Given a system model with isEditable = false
  When I view the tier table
  Then emoji column shows values but picker is disabled
  And label column shows values but is read-only
  And drag-to-reorder is disabled
  And a lock icon indicates protected status

Scenario: Stage mapping table works
  Given the editor is open
  When I view the stage-to-tier mapping section
  Then all stages are listed (tender, rooting, established, etc.)
  And each stage has a dropdown to select tier
  And changing dropdown updates the mapping

Scenario: Validation prevents invalid config
  Given I am editing a custom model
  When I try to set duplicate emoji across tiers
  Then validation error is shown
  And save button is disabled
  When I try to leave a tier without emoji
  Then validation error is shown
  And save button is disabled
```

**Traceability:** AC-3: ExperienceConsole Integration

---

### US-L007: Create useLifecycleConfigData Hook

**As a** Developer
**I want to** fetch lifecycle configs via useGroveData
**So that** the console has CRUD operations

**INVEST Assessment:**
- **I**ndependent: Yes — depends only on Epic 2
- **N**egotiable: Yes — hook API flexible
- **V**aluable: Yes — data layer for console
- **E**stimable: Yes — 2-4 hours
- **S**mall: Yes — single hook file
- **T**estable: Yes — hook testing

**Acceptance Criteria:**

```gherkin
Scenario: Hook provides CRUD operations
  Given useLifecycleConfigData.ts is created
  When I call the hook in a component
  Then I get objects (list of configs)
  And I get create function
  And I get update function
  And I get remove function
  And I get duplicate function

Scenario: createTyped uses correct default
  Given I call createTyped()
  When the function executes
  Then a new config is created with DEFAULT_LIFECYCLE_CONFIG_PAYLOAD
  And meta.status is 'draft'
```

**Traceability:** AC-3: ExperienceConsole Integration

---

### US-L008: Register Components in Registries

**As a** Developer
**I want to** register components and hook in the console registries
**So that** polymorphic resolution works

**INVEST Assessment:**
- **I**ndependent: Yes — depends on US-L005, US-L006, US-L007
- **N**egotiable: No — registry format fixed
- **V**aluable: Yes — enables polymorphic rendering
- **E**stimable: Yes — 1 hour
- **S**mall: Yes — imports and registry entries
- **T**estable: Yes — resolution functions

**Acceptance Criteria:**

```gherkin
Scenario: Component registry resolution works
  Given components are imported in component-registry.ts
  When I add LifecycleConfigCard to CARD_COMPONENT_REGISTRY
  And I add LifecycleConfigEditor to EDITOR_COMPONENT_REGISTRY
  Then resolveCardComponent('LifecycleConfigCard') returns the component
  And resolveEditorComponent('LifecycleConfigEditor') returns the component

Scenario: Hook registry resolution works
  Given useLifecycleConfigData is imported in hook-registry.ts
  When I add it to HOOK_REGISTRY
  Then hasDataHook('useLifecycleConfigData') returns true
  And useUnifiedExperienceData includes lifecycle-config data
```

**Traceability:** AC-3: ExperienceConsole Integration

---

## Epic 6: Consumer Hook

### US-L009: Create useLifecycleConfig Hook

**As a** Component Developer
**I want to** access lifecycle config via React hook
**So that** components can read tier definitions declaratively

**INVEST Assessment:**
- **I**ndependent: Yes — depends on Epic 3
- **N**egotiable: Yes — API design flexible
- **V**aluable: Yes — enables TierBadge migration
- **E**stimable: Yes — 4-6 hours
- **S**mall: Yes — single hook with utilities
- **T**estable: Yes — unit tests

**Acceptance Criteria:**

```gherkin
Scenario: Hook returns active model when config loaded
  Given lifecycle config exists in Supabase
  And meta.status = 'active'
  When I call useLifecycleConfig()
  Then isLoaded is true
  And activeModel contains the botanical model
  And getTierForStage('established') returns correct tier

Scenario: Hook handles missing config gracefully
  Given no lifecycle_configs in Supabase
  When I call useLifecycleConfig()
  Then isLoaded is false
  And activeModel is null
  And getTierForStage uses FALLBACK_STAGE_TO_TIER

Scenario: getTierDefinition resolves correctly
  Given active model is loaded
  When I call getTierDefinition('sapling')
  Then I get { id: 'sapling', emoji: '🌿', label: 'Sapling', order: 2 }

Scenario: Hook memoizes expensive lookups
  Given multiple renders occur
  When I call getTierForStage repeatedly with same stage
  Then the same object reference is returned
```

**Traceability:** AC-4: Config-Driven TierBadge

---

### US-L010: Unit Tests for useLifecycleConfig

**As a** Developer
**I want to** test the useLifecycleConfig hook
**So that** fallback behavior is verified

**INVEST Assessment:**
- **I**ndependent: Yes — parallel to US-L009
- **N**egotiable: Yes — test approach flexible
- **V**aluable: Yes — ensures reliability
- **E**stimable: Yes — 2-4 hours
- **S**mall: Yes — test file
- **T**estable: Yes — by definition

**Acceptance Criteria:**

```gherkin
Scenario: Tests cover all hook behaviors
  Given tests/unit/useLifecycleConfig.test.ts exists
  When I run npm test
  Then all tests pass:
    | Test Case |
    | Returns active model when config loaded |
    | Returns null when config missing |
    | getTierForStage maps correctly |
    | Fallback works when config undefined |
    | Memoization prevents unnecessary recalculation |
```

**Traceability:** AC-4: Config-Driven TierBadge

---

## Epic 7: TierBadge Migration

### US-L011: Migrate TierBadge to Config-Driven

**As a** User
**I want to** see tier badges that reflect the active lifecycle config
**So that** operators can customize my experience

**INVEST Assessment:**
- **I**ndependent: Yes — depends on Epic 6
- **N**egotiable: No — must maintain visual compatibility
- **V**aluable: Yes — delivers user value
- **E**stimable: Yes — 4-6 hours
- **S**mall: Yes — limited changes
- **T**estable: Yes — E2E visual regression

**Acceptance Criteria:**

```gherkin
Scenario: TierBadge uses config when available
  Given lifecycle config is loaded
  And active model has tier sapling with emoji 🌿 and label "Sapling"
  When TierBadge renders tier="sapling"
  Then emoji displayed is 🌿
  And label displayed is "Sapling"

Scenario: TierBadge falls back when config unavailable
  Given lifecycle config is NOT loaded (loading or error)
  When TierBadge renders tier="sapling"
  Then emoji falls back to FALLBACK_TIER_CONFIG.emoji.sapling
  And label falls back to FALLBACK_TIER_CONFIG.label.sapling
  And no error is thrown

Scenario: stageTierMap uses config mappings
  Given active model maps 'established' to 'sapling'
  When stageTierMap('established', activeModel) is called
  Then returns 'sapling'
```

**Traceability:** AC-4: Config-Driven TierBadge

---

### US-L012: No Visual Regression

**As a** User
**I want to** see the same tier badges as before
**So that** the migration is transparent

**INVEST Assessment:**
- **I**ndependent: Yes — depends on US-L011
- **N**egotiable: No — must match exactly
- **V**aluable: Yes — ensures quality
- **E**stimable: Yes — 2-4 hours
- **S**mall: Yes — test execution
- **T**estable: Yes — visual comparison

**Acceptance Criteria:**

```gherkin
Scenario: E2E tests pass without changes
  Given I run npx playwright test tests/e2e/tier-progression.spec.ts
  When all tests complete
  Then all tests pass
  And no visual differences in screenshots

Scenario: Garden view shows correct tiers
  Given I have sprouts with various stages
  When I view the garden
  Then each sprout shows correct tier emoji
  And each sprout shows correct tier label
  And tier ordering is correct (seed → sprout → sapling → tree → grove)
```

**Traceability:** AC-4: Config-Driven TierBadge

---

## Deferred to Future Phases

### US-L0XX: Auto-Advancement Rules (DEFERRED - Phase 3)

**Reason:** Schema supports advancement rules but implementation is Phase 3

**Original Flow:** Sprouts automatically advance tiers based on configurable criteria

**Phase 3 Prerequisite:** Lifecycle Engine v1 complete

---

### US-L0XX: json-render Integration (DEFERRED - Phase 4+)

**Reason:** Build core value first, enhance visualization later

**Original Flow:** Live preview with json-render catalog

**Phase 4+ Prerequisite:** Core editing workflow proven

---

## Open Questions

1. **Model Duplication:** When duplicating a system model, should the copy inherit all mappings? *(Recommendation: Yes)*

2. **Tier Limit:** Should custom models support more than 10 tiers? *(Recommendation: No for v1.0, revisit if needed)*

3. **Stage Addition:** If new stages are added to SproutStage, how should existing configs handle them? *(Recommendation: Default to lowest tier)*

---

## Summary

| Story ID | Title | Priority | Complexity |
|----------|-------|----------|------------|
| US-L001 | Define LifecycleConfigPayload Types | P0 | S |
| US-L002 | Add lifecycle-config to GroveObjectType | P0 | S |
| US-L003 | Create lifecycle_configs Table | P0 | S |
| US-L004 | Register in EXPERIENCE_TYPE_REGISTRY | P0 | S |
| US-L005 | Create LifecycleConfigCard | P0 | M |
| US-L006 | Create LifecycleConfigEditor | P0 | L |
| US-L007 | Create useLifecycleConfigData Hook | P0 | S |
| US-L008 | Register Components in Registries | P0 | S |
| US-L009 | Create useLifecycleConfig Hook | P0 | M |
| US-L010 | Unit Tests for useLifecycleConfig | P1 | S |
| US-L011 | Migrate TierBadge to Config-Driven | P0 | M |
| US-L012 | No Visual Regression | P0 | S |

**Total v1.0 Stories:** 12
**Deferred:** 2

---

## DEX Alignment Verification

| Pillar | How Stories Support |
|--------|---------------------|
| **Declarative Sovereignty** | All tier/mapping config in Supabase JSONB. No hardcoded behavior in components. |
| **Capability Agnosticism** | TierBadge works identically regardless of AI model. Config-driven, not model-dependent. |
| **Provenance as Infrastructure** | GroveObject meta tracks creator/timestamps. System vs custom models explicit. |
| **Organic Scalability** | Multiple models in array. Custom models added via UI. Schema supports future phases. |

---

*User Stories & Acceptance Criteria for S5-SL-LifecycleEngine v1.0*
*Pattern: Supabase + ExperienceConsole factory*
*Foundation Loop v2 + User Story Refinery v1*
