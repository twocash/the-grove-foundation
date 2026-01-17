# Execution Prompt: S7-SL-AutoAdvancement

**Sprint:** S7-SL-AutoAdvancement (Programmable Curation Engine)
**Date:** 2026-01-16
**Status:** Ready for Execution
**Dependency:** S6-SL-ObservableSignals (in progress - use mock signals)

---

## Quick Start

```bash
# Verify you're on main with latest
git checkout main && git pull origin main

# Create feature branch
git checkout -b feat/auto-advancement-v1

# Run baseline tests (should pass)
npm test && npx playwright test
```

---

## Primary Artifacts (READ THESE)

| Artifact | Purpose | Location |
|----------|---------|----------|
| **PRODUCT_BRIEF.md** | Goals, flows, schemas, architecture | This directory |
| **DESIGN_WIREFRAMES.md** | TSX code for all 5 components | This directory |
| **DESIGN_DECISIONS.md** | 10 ADRs with rationale | This directory |
| **USER_STORIES.md** | 24 stories with Gherkin ACs | This directory |
| **UX_CHIEF_REVIEW.md** | DEX compliance verification | This directory |

**Pattern:** Follow FeatureFlagCard/Editor pattern exactly. Reference `src/bedrock/components/FeatureFlagCard.tsx` and `FeatureFlagEditor.tsx`.

---

## Architecture Overview

```
advancement_rules (Supabase)
        │
        ▼
┌───────────────────┐
│  Daily Batch Job  │ ←── 2am UTC cron
│  (advancementBatch.ts)
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐     ┌─────────────────────┐
│ evaluateAdvancement│ ←──│ observable_signals  │
│ (pure TypeScript) │     │ (S6 or mock)        │
└─────────┬─────────┘     └─────────────────────┘
          │
          ▼
┌───────────────────┐     ┌─────────────────────┐
│   sprouts.tier    │────►│  advancement_events │
│   (UPDATE)        │     │  (audit trail)      │
└───────────────────┘     └─────────────────────┘
```

---

## Execution Phases

### Phase 1: Infrastructure (Epic 5 + Database)
**Goal:** Registry + schema + hooks

| Task | Story | Commit |
|------|-------|--------|
| Create `advancement_rules` table | - | `feat(db): Add advancement_rules table` |
| Create `advancement_events` table | - | `feat(db): Add advancement_events audit table` |
| Add `advancement-rule` to GroveObjectType | US-S018 | `feat(types): Add advancement-rule type` |
| Register in EXPERIENCE_TYPE_REGISTRY | US-S018 | `feat(registry): Register advancement-rule` |
| Create `useAdvancementRuleData` hook | US-S021 | `feat(hooks): Add useAdvancementRuleData` |

**Build Gate:**
```bash
npm run build && npm test
# Verify: TypeScript compiles, hook tests pass
```

---

### Phase 2: UI Components (Epic 1, 5)
**Goal:** Card + Editor + Grid view

| Task | Story | Commit |
|------|-------|--------|
| Create `AdvancementRuleCard.tsx` | US-S005, US-S019 | `feat(ui): Add AdvancementRuleCard` |
| Create `AdvancementRuleEditor.tsx` | US-S020 | `feat(ui): Add AdvancementRuleEditor` |
| Wire CRUD operations | US-S001-S004 | `feat(ui): Wire advancement rule CRUD` |
| Add criteria builder UI | US-S001 | `feat(ui): Add criteria builder form` |

**Build Gate:**
```bash
npm run build && npm test && npx playwright test tests/e2e/bedrock-*.spec.ts
# Verify: Components render, CRUD works
```

**Screenshot Required:**
- Grid view with 2+ rules (enabled/disabled states)
- Editor with criteria builder open

---

### Phase 3: Evaluation Engine (Epic 2)
**Goal:** Core advancement logic

| Task | Story | Commit |
|------|-------|--------|
| Create `evaluateAdvancement.ts` | US-S007 | `feat(engine): Add advancement evaluator` |
| Create `getObservableSignals.ts` | US-S022 | `feat(engine): Add signal fetcher with mock fallback` |
| Create `advancementBatchJob.ts` | US-S006 | `feat(jobs): Add daily batch evaluator` |
| Implement tier update logic | US-S008 | `feat(engine): Add tier update with cache invalidation` |
| Implement event logging | US-S009 | `feat(engine): Add advancement event logging` |
| Add error handling | US-S010 | `feat(engine): Add graceful error handling` |

**Build Gate:**
```bash
npm test -- --grep "advancement"
# Verify: 100% coverage on evaluateAdvancement, all edge cases pass
```

**Unit Test Coverage Required:**
- All comparison operators (>=, >, ==, <, <=)
- AND logic (all criteria must pass)
- OR logic (at least one criterion must pass)
- Missing signals (graceful skip)
- Invalid tiers (error handling)

---

### Phase 4: Operator Controls (Epic 3)
**Goal:** Audit trail + override + rollback

| Task | Story | Commit |
|------|-------|--------|
| Create `AdvancementHistoryPanel.tsx` | US-S011 | `feat(ui): Add advancement history panel` |
| Add event detail view | US-S014 | `feat(ui): Add event detail modal` |
| Create `ManualOverrideModal.tsx` | US-S012 | `feat(ui): Add manual override modal` |
| Create `BulkRollbackModal.tsx` | US-S013 | `feat(ui): Add bulk rollback modal` |

**Build Gate:**
```bash
npm run build && npx playwright test tests/e2e/advancement-*.spec.ts
# Verify: Override and rollback flows work
```

**Screenshot Required:**
- History panel with grouped events
- Manual override modal
- Bulk rollback confirmation

---

### Phase 5: Gardener Experience (Epic 4)
**Goal:** Badge updates + provenance tooltips

| Task | Story | Commit |
|------|-------|--------|
| Verify TierBadge cache invalidation | US-S015 | `fix(ui): Ensure tier badge updates after advancement` |
| Add advancement tooltip to TierBadge | US-S016 | `feat(ui): Add provenance tooltip to TierBadge` |
| Create sprout audit trail view | US-S017 | `feat(ui): Add sprout advancement history` |

**Build Gate:**
```bash
npx playwright test tests/e2e/tier-badge-*.spec.ts
# Verify: No visual regressions on TierBadge
```

---

### Phase 6: Integration Testing
**Goal:** End-to-end validation

| Task | Commit |
|------|--------|
| E2E: Create rule → batch → audit flow | `test(e2e): Add advancement flow test` |
| E2E: Override → verify badge updates | `test(e2e): Add override flow test` |
| Visual regression: All new components | `test(visual): Add advancement screenshots` |

**Build Gate:**
```bash
npm run build && npm test && npx playwright test
# ALL tests must pass
```

---

## Key Code Locations

### New Files to Create

```
src/core/schema/advancement.ts              # AdvancementRulePayload, Criterion types
src/core/engine/advancementEvaluator.ts     # evaluateAdvancement() pure function
src/core/engine/signalFetcher.ts            # getObservableSignals() with mock fallback
src/core/jobs/advancementBatchJob.ts        # Daily batch orchestration

src/bedrock/consoles/ExperienceConsole/
├── AdvancementRuleCard.tsx                 # Grid card (follow FeatureFlagCard pattern)
├── AdvancementRuleEditor.tsx               # Inspector panel (follow FeatureFlagEditor)
├── AdvancementHistoryPanel.tsx             # Audit trail grouped by batch
├── ManualOverrideModal.tsx                 # Individual tier override
├── BulkRollbackModal.tsx                   # Mass rollback with reason
└── useAdvancementRuleData.ts               # CRUD hook
```

### Files to Modify

```
src/core/schema/grove-object.ts                              # Add 'advancement-rule' to GroveObjectType union
src/bedrock/types/experience.types.ts                        # Add to EXPERIENCE_TYPE_REGISTRY + ExperiencePayloadMap
src/bedrock/consoles/ExperienceConsole/component-registry.ts # Import & register Card/Editor components
src/bedrock/consoles/ExperienceConsole/hook-registry.ts      # Register useAdvancementRuleData
src/bedrock/consoles/ExperienceConsole/useUnifiedExperienceData.ts  # Add explicit hook call (React Rules of Hooks)
src/surface/components/TierBadge/TierBadge.tsx               # Add provenance tooltip
```

### Supabase Migrations

```sql
-- Migration: add_advancement_tables
CREATE TABLE advancement_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta JSONB NOT NULL DEFAULT '{}',
  payload JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE advancement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprout_id UUID NOT NULL REFERENCES sprouts(id),
  rule_id UUID REFERENCES advancement_rules(id),
  from_tier TEXT NOT NULL,
  to_tier TEXT NOT NULL,
  criteria_met JSONB NOT NULL,
  signal_values JSONB NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type TEXT NOT NULL DEFAULT 'auto-advancement',
  operator_id TEXT,
  reason TEXT
);

CREATE INDEX idx_advancement_events_sprout ON advancement_events(sprout_id);
CREATE INDEX idx_advancement_events_rule ON advancement_events(rule_id);
CREATE INDEX idx_advancement_events_timestamp ON advancement_events(timestamp DESC);
```

---

## Mock Signals Strategy

S6 is in progress. Use mock signals for S7 launch:

**Signal Name Mapping (PRODUCT_BRIEF → S6 Schema):**

| PRODUCT_BRIEF Name | S6 Schema Name | Notes |
|--------------------|----------------|-------|
| `retrievals` | `retrievalCount` | Raw retrieval count |
| `citations` | `referenceCount` | Times sprout was cited |
| `queryDiversity` | `diversityIndex` | 0-1 diversity score |
| `utilityScore` | `utilityScore` | Same name ✓ |

The signal fetcher should map S6 schema names to PRODUCT_BRIEF names for backward compatibility:

```typescript
// src/core/engine/signalFetcher.ts
const USE_MOCK_SIGNALS = process.env.USE_MOCK_SIGNALS !== 'false';

// S7 signal names (used in advancement rules)
export interface ObservableSignals {
  retrievals: number;
  citations: number;
  queryDiversity: number;
  utilityScore: number;
}

export async function getObservableSignals(sproutId: string): Promise<ObservableSignals> {
  if (USE_MOCK_SIGNALS) {
    return MOCK_SIGNALS[sproutId] || DEFAULT_SIGNALS;
  }

  // Fetch from S6 SignalAggregation table
  const { data } = await supabase
    .from('signal_aggregations')
    .select('*')
    .eq('sprout_id', sproutId)
    .eq('period', 'all_time')
    .single();

  if (!data) return DEFAULT_SIGNALS;

  // Map S6 schema names to S7 signal names
  return {
    retrievals: data.retrievalCount ?? 0,
    citations: data.referenceCount ?? 0,
    queryDiversity: data.diversityIndex ?? 0,
    utilityScore: data.utilityScore ?? 0,
  };
}

const DEFAULT_SIGNALS: ObservableSignals = {
  retrievals: 0,
  citations: 0,
  queryDiversity: 0,
  utilityScore: 0,
};

const MOCK_SIGNALS: Record<string, ObservableSignals> = {
  // Seed test data for development
};
```

---

## Attention Anchoring Protocol

Before each phase transition:
1. Re-read `USER_STORIES.md` for the relevant epic
2. Verify acceptance criteria match implementation
3. Run build gate before proceeding

After every 10 tool calls:
- Check: Am I still pursuing automatic tier advancement?
- If uncertain: Re-read this EXECUTION_PROMPT

Before committing:
- Verify: Does this change satisfy Gherkin scenarios?

---

## Definition of Done

- [ ] All 24 user stories implemented
- [ ] All Gherkin acceptance criteria pass
- [ ] `advancement_rules` and `advancement_events` tables created
- [ ] `advancement-rule` registered in EXPERIENCE_TYPE_REGISTRY
- [ ] AdvancementRuleCard and AdvancementRuleEditor complete
- [ ] `useAdvancementRuleData` hook provides CRUD
- [ ] `evaluateAdvancement()` has 100% test coverage
- [ ] Mock signals fallback works
- [ ] All E2E tests pass
- [ ] Screenshots captured for visual verification
- [ ] No regressions on TierBadge

---

## Status Log Entry

Write status to: `.agent/status/current/{NNN}-{timestamp}-developer.md`

```yaml
---
sprint: S7-SL-AutoAdvancement
agent: developer
status: IN_PROGRESS
phase: "Phase {N}: {Name}"
heartbeat: {ISO timestamp}
notion_synced: false
---

## Progress
- [x] Phase 1 complete
- [ ] Phase 2 in progress
- [ ] ...

## Notes
{Any blockers, decisions, or observations}
```

---

*Execution Prompt for S7-SL-AutoAdvancement*
*Pattern: Thin wrapper referencing detailed Product Pod artifacts*
*Grove Execution Protocol v1*
