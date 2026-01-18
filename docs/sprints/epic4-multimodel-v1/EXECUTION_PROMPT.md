# EXECUTION PROMPT: EPIC4-SL-MultiModel

**Sprint:** EPIC4-SL-MultiModel (S8-SL-MultiModel [EPIC Phase 4])
**Date Created:** 2026-01-16
**Phase:** 7 - Execution Prompt
**Status:** Ready for Developer Handoff

---

## Instant Orientation

**Project:** The Grove Foundation
**Sprint:** EPIC4-SL-MultiModel
**Current Phase:** Phase 7 (Execution)
**Status:** 🚀 Ready for Implementation
**Next Action:** Begin Epic 1 implementation

## Context Reconstruction

### Read These First (In Order)
1. `docs/sprints/epic4-multimodel-v1/SPEC.md` — Live Status + Attention Anchor + Goals
2. `docs/sprints/epic4-multimodel-v1/DEVLOG.md` — All planning phases complete
3. `docs/sprints/epic4-multimodel-v1/SPRINTS.md` — Current epic to implement

### Key Decisions Made
- ✅ EXTEND GroveObject pattern (vs CREATE new pattern)
- ✅ Use FeatureFlag for A/B testing (vs custom solution)
- ✅ Json-render for analytics (vs hardcoded components)
- ✅ Database-first approach (vs config files)
- ✅ ExperienceConsole factory for UI (Card/Editor pattern)

### What's Done
- [x] Phase 0: Pattern Check Complete
- [x] Phase 0.5: Canonical Source Audit Complete
- [x] Phase 1: Repository Audit Complete
- [x] Phase 2: Architecture Design Complete
- [x] Phase 3: Migration Planning Complete
- [x] Phase 4: Decisions Documentation Complete
- [x] Phase 5: Story Breakdown Complete
- [x] Phase 6: Execution Prompt (THIS FILE)

### What's Pending
- [ ] Epic 1: Database & Schema Infrastructure
- [ ] Epic 2: GroveObject Pattern Extension
- [ ] Epic 3: ExperienceConsole Components
- [ ] Epic 4: A/B Testing Framework
- [ ] Epic 5: Model Analytics & Dashboard
- [ ] Epic 6: Testing & Polish

---

## Attention Anchoring Protocol

### Before any major decision, re-read:
1. `docs/sprints/epic4-multimodel-v1/SPEC.md` Live Status block
2. `docs/sprints/epic4-multimodel-v1/SPEC.md` Attention Anchor block

### After every 10 tool calls:
- Check: Am I still pursuing the stated goal?
- If uncertain: Re-read SPEC.md Goals and Acceptance Criteria

### Before committing:
- Verify: Does this change satisfy Acceptance Criteria?

---

## Architecture Overview

### Goal
Support multiple lifecycle models (botanical, academic, research, creative) with operator tools for A/B testing and analytics.

### Non-Goals
- Cross-grove federation (EPIC Phase 5)
- AI curation agents (EPIC Phase 6)
- Attribution economy (EPIC Phase 7)
- Hardcoded tier systems
- Model-specific logic in core engine

### Key Deliverables
1. Multi-model config support (GroveObject pattern)
2. ExperienceConsole lifecycle editor (ModelCard, ModelEditor)
3. A/B testing framework (FeatureFlag extension)
4. Analytics comparing model performance (ModelAnalyticsCatalog)
5. Model library (templates for 4 standard models)

---

## CRITICAL ARCHITECTURE WARNINGS

### 🚨 NEVER Modify These (Frozen Zones)
- `/foundation/*` - FROZEN legacy admin UI
- `/terminal/*` - FROZEN MVP chat interface
- `src/foundation/consoles/*` - FROZEN all Foundation consoles
- GCS files for new configs - DEPRECATED storage pattern
- Custom CRUD logic - NOT ALLOWED

### ✅ ALWAYS Use These (v1.0 Patterns)
- `/bedrock/consoles/ExperienceConsole` - Admin UI location
- Supabase tables - Storage pattern
- `useGroveData()` hook - Data access
- GroveObject pattern - Schema approach
- ExperienceConsole factory - Component pattern

---

## Code Locations & Patterns

### Database Schema
**Location:** Supabase migration
**File:** `supabase/migrations/XXX_lifecycle_models.sql`
**Pattern:** GroveObject with JSONB meta/payload
```typescript
// Example structure:
type LifecycleModel = GroveObject & {
  type: 'lifecycle-model';
  payload: {
    name: string;
    description: string;
    tiers: TierDefinition[];
    validationRules: ValidationRule[];
    templates?: ModelTemplate[];
  };
};
```

### Core Schema
**Location:** `src/core/schema/grove-object.ts`
**Action:** ADD to union type (don't replace)
```typescript
// Add this type:
'lifecycle-model'

// Extend GroveObjectPayloadMap:
lifecycle-model: LifecycleModelPayload
```

### UI Components
**Location:** `src/bedrock/consoles/ExperienceConsole/`
**Pattern:** Follow ModelCard/ModelEditor pattern
```typescript
// Components to create:
ModelCard.tsx       // Display model in grid
ModelEditor.tsx      // Edit model configuration
ModelAnalyticsCatalog.tsx  // Analytics display
```

### Hook Integration
**Location:** `src/bedrock/consoles/ExperienceConsole/`
**Files:**
- `useLifecycleModelData.ts` - Data hook
- `component-registry.ts` - Register components
- `hook-registry.ts` - Register hook

### Tests
**Location:** `tests/e2e/`
**File:** `multimodel.spec.ts` - Create new E2E tests

---

## Implementation Sequence (6 Epics)

### Epic 1: Database & Schema Infrastructure
**Stories:**
- [ ] Create lifecycle_models table
- [ ] Add lifecycle-model to GroveObject union
- [ ] Create migration scripts
- [ ] Verify schema compatibility

**Code Location:**
```bash
# Database
supabase/migrations/XXX_lifecycle_models.sql

# Schema
src/core/schema/grove-object.ts

# Test
tests/unit/lifecycle-model.test.ts
```

### Epic 2: GroveObject Pattern Extension
**Stories:**
- [ ] Implement LifecycleModel GroveObject
- [ ] Add type guards and validation
- [ ] Create default factory functions
- [ ] Update registry entries

**Code Location:**
```bash
# Core
src/core/schema/lifecycle-model.ts (NEW)

# Registry
src/core/schema/grove-object.ts (MODIFY)
```

### Epic 3: ExperienceConsole Components
**Stories:**
- [ ] Create ModelCard component
- [ ] Create ModelEditor component
- [ ] Add inspector panel integration
- [ ] Implement CRUD operations

**Code Location:**
```bash
# Components
src/bedrock/consoles/ExperienceConsole/ModelCard.tsx (NEW)
src/bedrock/consoles/ExperienceConsole/ModelEditor.tsx (NEW)

# Registry
src/bedrock/consoles/ExperienceConsole/component-registry.ts (MODIFY)
```

### Epic 4: A/B Testing Framework
**Stories:**
- [ ] Extend FeatureFlag for model variants
- [ ] Implement traffic splitting
- [ ] Create variant assignment logic
- [ ] Build performance tracking

**Code Location:**
```bash
# Extend existing
src/bedrock/consoles/ExperienceConsole/FeatureFlagCard.tsx (MODIFY)
src/bedrock/consoles/ExperienceConsole/FeatureFlagEditor.tsx (MODIFY)
```

### Epic 5: Model Analytics & Dashboard
**Stories:**
- [ ] Create ModelAnalyticsCatalog
- [ ] Build analytics display components
- [ ] Implement comparison tools
- [ ] Add export functionality

**Code Location:**
```bash
# Analytics
src/bedrock/consoles/ExperienceConsole/json-render/ModelAnalyticsCatalog.tsx (NEW)
```

### Epic 6: Testing & Polish
**Stories:**
- [ ] Unit tests for all components
- [ ] Integration tests for workflows
- [ ] E2E tests for key flows
- [ ] Visual regression tests
- [ ] Performance testing

**Code Location:**
```bash
# Tests
tests/e2e/multimodel.spec.ts (NEW)
tests/unit/lifecycle-model.test.ts (NEW)
```

---

## Build Gates (Mandatory)

### Pre-Execution Verification
```bash
# 1. Verify baselines exist
ls tests/e2e/*-baseline.spec.ts-snapshots/

# 2. Run regression tests (should pass before starting)
npx playwright test tests/e2e/*-baseline.spec.ts
```

### After Each Epic
```bash
# 1. Run tests
npm test && npx playwright test

# 2. Update DEVLOG
echo "Epic N complete. Tests: PASS/FAIL" >> docs/sprints/epic4-multimodel-v1/DEVLOG.md

# 3. Update Live Status in SPEC.md
# Current Phase: {next phase}
# Last Updated: {timestamp}

# 4. ATTENTION ANCHOR: Re-read SPEC.md before next epic
```

### Before Commit
```bash
# Full verification
npm run build && npm test && npx playwright test

# Verify console clean (ZERO errors)
# Check for any /foundation references
grep -r "/foundation" src/ --exclude-dir=node_modules
# Should return NO results

# Check for GCS file storage
grep -r "\.json" supabase/migrations/ | grep -v "migration"
# Should only show SQL migration files
```

---

## DEX Compliance Checklist

### Declarative Sovereignty
- [ ] Models defined as JSON config (not hardcoded)
- [ ] Tier structures configurable via UI
- [ ] Validation rules declarative
- [ ] No model-specific logic in core

**Evidence:** GroveObject pattern with JSONB payload

### Capability Agnosticism
- [ ] Pure TypeScript implementation
- [ ] No model-specific dependencies
- [ ] Works with any LLM/agent
- [ ] No hardcoded assumptions

**Evidence:** Pattern extension, not model-specific code

### Provenance as Infrastructure
- [ ] All models track createdAt/updatedAt
- [ ] Provenance metadata included
- [ ] Attribution chain maintained
- [ ] Full audit trail

**Evidence:** GroveObject meta tracking

### Organic Scalability
- [ ] Registry pattern supports unlimited models
- [ ] Database-first approach
- [ ] Factory pattern for components
- [ ] Extensible architecture

**Evidence:** ExperienceConsole factory pattern

---

## Test Philosophy

### Behavior Over Implementation

**WRONG:**
```typescript
expect(element).toHaveClass('translate-x-0');
```

**RIGHT:**
```typescript
await expect(modelCard).toBeVisible();
await expect(modelEditor).toBeInTheDocument();
```

---

## Acceptance Criteria Verification

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

## Visual Verification

### Screenshots Required
1. ModelCard in ExperienceConsole grid
2. ModelEditor with tier configuration
3. Analytics dashboard with model comparison
4. A/B testing variant creation
5. Model library with templates

### Screenshot Location
`docs/sprints/epic4-multimodel-v1/screenshots/`

### Naming Convention
```
epic4-01-modelcard-grid.png
epic4-02-modeleditor-tiers.png
epic4-03-analytics-dashboard.png
epic4-04-ab-testing-variants.png
epic4-05-model-library.png
```

---

## Quality Gates

### Before Each Epic
- [ ] Live Status updated in SPEC.md
- [ ] Attention Anchor re-read
- [ ] Previous epic tests pass

### Before Commit
- [ ] All acceptance criteria verified
- [ ] No hardcoded model logic
- [ ] DEX compliance verified
- [ ] Documentation updated

### Before Merge
- [ ] All epics complete
- [ ] E2E tests pass (5 critical flows)
- [ ] Visual tests pass
- [ ] Console: ZERO errors (mandatory)
- [ ] Performance: Model switching < 200ms

---

## Rollback Plan

If issues arise:

1. **Database Rollback:**
```sql
-- Revert migration
DROP TABLE IF EXISTS lifecycle_models;
```

2. **Code Rollback:**
```bash
git revert HEAD
```

3. **Schema Rollback:**
- Remove 'lifecycle-model' from GroveObject union
- Delete component files
- Remove registry entries

---

## Resume Instructions

1. Read `docs/sprints/epic4-multimodel-v1/SPEC.md` for Live Status
2. Read `docs/sprints/epic4-multimodel-v1/SPRINTS.md` for current epic
3. Run: `npm test` to verify current state
4. Begin with Epic 1: Database & Schema Infrastructure
5. Update DEVLOG after each epic completion

---

## Developer Status Tracking

Write status updates to: `.agent/status/current/{NNN}-{timestamp}-developer.md`

Template:
```markdown
# Developer Status: EPIC4-SL-MultiModel

## Epic in Progress
{Epic number and name}

## Current Status
{What you're working on now}

## Completed
- [x] {task 1}
- [x] {task 2}

## Next
- [ ] {upcoming task}

## Blockers
{Any issues or questions}

## Tests
{Test results}

## Attention Check
- [ ] Re-read SPEC.md Live Status
- [ ] Verify goal alignment
```

---

## Attention Anchor

**We are building:** Multi-model lifecycle support with A/B testing framework for diverse knowledge communities

**Success looks like:** Operators can create and test different lifecycle models (botanical, academic, research, creative) via ExperienceConsole

**We are NOT:** Building federation or attribution economy (those are later EPIC phases)

**Current epic:** Epic 1: Database & Schema Infrastructure

**Next action:** Create lifecycle_models table migration

---

**EXECUTION READY** ✅

This prompt contains all context needed to begin implementation. The architecture is sound, patterns are defined, and the path forward is clear.

**CRITICAL REMINDER:** Always use `/bedrock` paths, never `/foundation`. Always use Supabase, never GCS files.
