# UX Chief Review Prompt: S5-SL-LifecycleEngine

## Role: Guardian of Grove's Architectural Soul

---

## Sprint Context

**Sprint:** S5-SL-LifecycleEngine v1
**Domain:** Bedrock ExperienceConsole
**Designer Handoff:** See `DESIGN_REVIEW_PROMPT.md` and attached wireframes

---

## Executive Summary

This sprint externalizes the hardcoded tier system (🌰→🌱→🌿→🌳→🌲) into a declarative configuration stored in Supabase. Operators will manage lifecycle models via the ExperienceConsole, enabling:

- Multiple lifecycle metaphors (botanical, academic, research)
- Customizable tier labels and emojis
- Stage-to-tier mapping flexibility
- No-code customization for operators

---

## DEX Alignment Checklist

### Pillar 1: Declarative Sovereignty

| Requirement | Status | Notes |
|-------------|--------|-------|
| Domain behavior in config, not code | ⏳ | Tier display reads from `LifecycleConfigPayload` |
| Operators can modify without deploy | ⏳ | Via ExperienceConsole editor |
| Schema defines structure, not implementation | ⏳ | `TierDefinition` and `StageTierMapping` types |

**Questions to Verify:**
- [ ] Can operators create entirely new tier labels without code changes?
- [ ] Is the stage-to-tier mapping purely declarative (no hardcoded mapping logic)?
- [ ] Will future tier additions require only schema changes, not React component updates?

### Pillar 2: Capability Agnosticism

| Requirement | Status | Notes |
|-------------|--------|-------|
| Works regardless of model capability | ⏳ | TierBadge renders from config, not model |
| No AI-dependent behavior | ⏳ | Pure config-driven display |
| Graceful fallback | ⏳ | `FALLBACK_TIER_CONFIG` if Supabase fails |

**Questions to Verify:**
- [ ] Does TierBadge work identically in offline/local mode?
- [ ] Are fallbacks purely data-based (no AI inference for missing config)?

### Pillar 3: Provenance as Infrastructure

| Requirement | Status | Notes |
|-------------|--------|-------|
| Config has creator/modifier tracking | ⏳ | GroveObject base class includes meta.createdBy |
| System vs custom origin clear | ⏳ | `isEditable: false` marks system models |
| Changes are auditable | ⏳ | Supabase audit via GroveDataProvider |

**Questions to Verify:**
- [ ] Is it clear which models are "official Grove" vs operator-customized?
- [ ] Can we trace who last modified a lifecycle config?

### Pillar 4: Organic Scalability

| Requirement | Status | Notes |
|-------------|--------|-------|
| Structure supports growth | ⏳ | Array of models, not single object |
| Adding new tiers is additive | ⏳ | Just add to `tiers[]` array |
| No hardcoded limits | ⏳ | Schema doesn't restrict tier count |

**Questions to Verify:**
- [ ] Can operators add a 6th tier (e.g., "forest") without code changes?
- [ ] Can they create entirely new lifecycle metaphors (not just edit botanical)?
- [ ] Does the schema support future features like advancement rules?

---

## Pattern Consistency Check

### ExperienceConsole Integration

| Pattern | Expected | Verify |
|---------|----------|--------|
| Type registry entry | `EXPERIENCE_TYPE_REGISTRY['lifecycle-config']` | ⏳ |
| Card component | `LifecycleConfigCard` in component registry | ⏳ |
| Editor component | `LifecycleConfigEditor` in component registry | ⏳ |
| Data hook | `useLifecycleConfigData` in hook registry | ⏳ |
| SINGLETON pattern | `allowMultipleActive: false` | ⏳ |

### GroveObject Compliance

| Requirement | Expected |
|-------------|----------|
| Extends GroveObject | `id`, `meta`, `payload` structure |
| JSONB meta+payload | Listed in `JSONB_META_TYPES` |
| Table mapping | `lifecycle_configs` in `TABLE_MAP` |

### Existing Pattern Alignment

| Component | Should Follow Pattern From |
|-----------|---------------------------|
| Card layout | FeatureFlagCard (compact status display) |
| Editor sections | SystemPromptEditor (multi-section form) |
| Table editing | CopilotStyleEditor (inline editing) |
| Status badges | Common status badge pattern |

---

## Design Decisions Requiring Approval

### 1. Model per Card vs Models in Single Config

**Option A (Recommended):** Single `lifecycle-config` entry contains array of models
- Matches spec: `LifecycleConfigPayload.models[]`
- One row in Supabase, one card in console
- Editor switches between models via tabs/dropdown

**Option B:** Each model is separate `lifecycle-config` entry
- Multiple cards in console
- More granular CRUD
- Breaks the "single active config" pattern

**UX Chief Decision:** _______________

### 2. Tier Count Flexibility

**Option A (Recommended):** Fixed 5 tiers, labels/emojis customizable
- Matches current TierBadge implementation
- Simpler UI
- Phase 2 can add dynamic tier count

**Option B:** Dynamic tier count from start
- More complex editor
- May break TierBadge assumptions
- Future-proof

**UX Chief Decision:** _______________

### 3. System Model Visibility

**Option A (Recommended):** System models visible but locked
- Clear which is "official"
- Operators can duplicate to customize
- Matches `isEditable: false` pattern

**Option B:** System models hidden, only custom shown
- Cleaner UI
- Less confusion about what's editable
- Harder to reference official defaults

**UX Chief Decision:** _______________

---

## Wireframe Review Checklist

When reviewing designer wireframes, verify:

### Card View
- [ ] Status badge clearly shows active/draft/archived
- [ ] System vs custom model distinction visible
- [ ] Tier emoji preview present
- [ ] Matches FeatureFlagCard density

### Editor View
- [ ] Model metadata section at top
- [ ] Tier table with inline editing (for custom)
- [ ] Locked indicator for system models
- [ ] Stage mapping table with dropdowns
- [ ] Save/discard actions clear
- [ ] Matches existing editor patterns

### Empty State
- [ ] Clear message about missing config
- [ ] Recovery action present

---

## Approval Criteria

Before approving for development:

1. **DEX Compliance:**
   - [ ] All four pillars satisfied
   - [ ] No hardcoded behavior
   - [ ] Config-driven everything

2. **Pattern Compliance:**
   - [ ] Follows ExperienceConsole patterns
   - [ ] Component registry integration clear
   - [ ] Matches existing card/editor patterns

3. **Design Quality:**
   - [ ] Wireframes complete for all states
   - [ ] Edge cases considered (locked models, empty state)
   - [ ] Accessibility addressed

4. **Scope Appropriate:**
   - [ ] v1.0 scope clear (no auto-advancement)
   - [ ] Deferred features documented
   - [ ] Upgrade path exists

---

## Verdict

| Status | Date | Notes |
|--------|------|-------|
| ⏳ Pending | | Awaiting wireframes from UI/UX Designer |

**UX Chief Signature:** _______________

---

*UX Chief Review for S5-SL-LifecycleEngine*
*Product Pod Workflow*
*Foundation Loop v2*
