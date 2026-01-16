# SPEC: EPIC4-SL-MultiModel Sprint Planning

## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | Phase 0: Pattern Check |
| **Status** | 🟡 In Progress |
| **Blocking Issues** | None |
| **Last Updated** | 2026-01-16T17:00:00Z |
| **Next Action** | Complete Phase 0.5: Canonical Source Audit |
| **Attention Anchor** | Re-read before every decision |

## Attention Anchor

**Re-read this block before every major decision.**

- **We are building:** Multi-model lifecycle support with A/B testing framework for diverse knowledge communities
- **Success looks like:** Operators can create and test different lifecycle models (botanical, academic, research, creative) via ExperienceConsole
- **We are NOT:** Building federation or attribution economy (those are later EPIC phases)
- **Current phase:** Phase 0: Pattern Check
- **Next action:** Complete canonical source audit

---

## Sprint Overview

**Sprint:** EPIC4-SL-MultiModel (S8-SL-MultiModel [EPIC Phase 4])
**EPIC:** Knowledge as Observable System (Phase 4 of 7)
**Effort:** 🌳 large (estimated 2 sprints)
**Dependencies:**
- S7-SL-AutoAdvancement (✅ Complete)
- S7.5-SL-JobConfigSystem (🎯 In Progress - not blocking)

---

## Goal

Support multiple lifecycle models (botanical, academic, research, creative) with operator tools for A/B testing and analytics.

**Vision:** "Each grove defines its own lifecycle model. Epistemological pluralism - no central authority."

**Context:** My grove (botanical): seed → sprout → sapling → tree → grove. Your grove (academic): hypothesis → tested → published → canonical. This enables diverse knowledge communities to co-exist with different quality standards.

---

## Non-Goals

- Cross-grove federation (EPIC Phase 5)
- AI curation agents (EPIC Phase 6)
- Attribution economy (EPIC Phase 7)
- Hardcoded tier systems
- Model-specific logic in core engine

---

## Key Deliverables

1. **Multi-model config support**
   - Database schema for lifecycle configurations
   - GroveObject pattern for model definitions
   - Config validation and type safety

2. **ExperienceConsole lifecycle editor**
   - Model creation wizard
   - Tier definition interface
   - Validation rules editor
   - Preview and testing tools

3. **A/B testing framework**
   - Model variant creation
   - Traffic splitting mechanism
   - Performance metrics collection
   - Statistical significance testing

4. **Analytics comparing model performance**
   - Model effectiveness dashboard
   - Tier advancement rates by model
   - Cross-model comparison tools
   - Operator insights and recommendations

5. **Model library**
   - Botanical template (current system)
   - Academic model (hypothesis → tested → published)
   - Research model (observation → theory → law)
   - Creative model (sketch → refined → masterwork)
   - Custom model builder

---

## Acceptance Criteria

### Multi-Model Support
- [ ] Operators can create new lifecycle models via ExperienceConsole
- [ ] Each model defines its own tier structure (minimum 3 tiers, maximum 7 tiers)
- [ ] Models are stored as GroveObjects with full provenance
- [ ] Sprouts can be assigned to specific models
- [ ] Tier advancement works with any model configuration

### A/B Testing Framework
- [ ] Operators can create variants of existing models
- [ ] Traffic is split between model variants (configurable percentages)
- [ ] System tracks performance metrics for each variant
- [ ] Statistical significance is calculated and displayed
- [ ] Winners can be promoted to replace baseline model

### Analytics Dashboard
- [ ] Model performance dashboard shows advancement rates
- [ ] Comparison tools allow side-by-side model analysis
- [ ] Time-series data shows model performance over time
- [ ] Operators can export analytics data

### Model Library
- [ ] Pre-built templates available for 4 standard models
- [ ] Templates include default tier definitions and validation rules
- [ ] Operators can customize templates or build from scratch
- [ ] Model library is searchable and browsable

### ExperienceConsole Integration
- [ ] ModelCard displays in ExperienceConsole grid
- [ ] ModelEditor provides full CRUD operations
- [ ] Inspector panel shows model details and metrics
- [ ] Actions panel supports variant creation and testing

---

## Pattern Check (Phase 0)

### Existing Patterns to Extend

| Requirement | Existing Pattern | Extension Approach |
|------------|----------------|-------------------|
| Config storage | GroveObject pattern | Add 'lifecycle-model' type |
| Console integration | ExperienceConsole factory | Add ModelCard/ModelEditor components |
| Analytics | SignalsCatalog pattern | Extend with model-specific metrics |
| A/B testing | FeatureFlag pattern | Extend for model variant routing |

### Canonical Sources

| Capability | Canonical Home | Current State |
|-----------|---------------|--------------|
| GroveObject schema | `src/core/schema/grove-object.ts` | Has advancement-rule, needs lifecycle-model |
| ExperienceConsole components | `src/bedrock/consoles/ExperienceConsole/` | Has RuleCard, needs ModelCard |
| Analytics display | Json-render catalogs | Has SignalsCatalog, needs ModelAnalyticsCatalog |

### Warning Signs Check
- ❌ Not creating new React Context
- ❌ Not hardcoding model-specific logic
- ❌ Not duplicating existing GroveObject patterns
- ✅ Extending ExperienceConsole factory pattern
- ✅ Using json-render for analytics

---

## Canonical Source Audit (Phase 0.5)

| Capability Needed | Canonical Home | Recommendation |
|------------------|---------------|---------------|
| Lifecycle model storage | GroveObject registry | EXTEND - Add lifecycle-model type |
| Console grid display | ExperienceConsole factory | EXTEND - Add ModelCard component |
| Console inspector | ExperienceConsole registry | EXTEND - Add ModelEditor |
| Analytics rendering | Json-render pattern | EXTEND - Add ModelAnalyticsCatalog |
| A/B testing | FeatureFlag system | EXTEND - Add model variant routing |

**Decision:** All capabilities can be met by extending existing patterns. No new infrastructure needed.

---

## Implementation Notes

### Technical Approach
1. **Schema Extension:** Add `lifecycle-model` to GroveObject union type
2. **Database:** New `lifecycle_models` table following GroveObject pattern
3. **UI Components:** ModelCard, ModelEditor following ExperienceConsole patterns
4. **A/B Testing:** Extend FeatureFlag with model-specific routing
5. **Analytics:** New ModelAnalyticsCatalog in json-render system

### Dependencies
- Supabase for model storage
- ExperienceConsole for operator interface
- Json-render for analytics display
- FeatureFlag system for A/B testing

### Risk Mitigation
- **Backward compatibility:** Existing botanical model becomes default template
- **Data migration:** All existing sprouts continue with current tier system
- **Testing:** A/B framework allows safe experimentation

---

## Quality Gates

### Before Each Epic
- [ ] Live Status updated in SPEC.md
- [ ] Attention Anchor re-read
- [ ] Tests pass for previous epic

### Before Commit
- [ ] All acceptance criteria verified
- [ ] No hardcoded model logic
- [ ] Dex compliance verified
- [ ] Documentation updated

---

## Next Steps

1. Complete Phase 0.5: Canonical Source Audit ✓
2. Phase 1: Repository Audit
3. Phase 2: Architecture Design
4. Phase 3: Migration Planning
5. Phase 4: Decisions Documentation
6. Phase 5: Story Breakdown
7. Phase 6: Execution Prompt
8. Phase 7-8: Implementation

---

**Primary Reference:** `docs/SPRINT_NAMING_CONVENTION.md`
**EPIC Context:** `docs/sprints/job-config-system-v1/` (S7.5)
**Pattern Reference:** `PROJECT_PATTERNS.md`
