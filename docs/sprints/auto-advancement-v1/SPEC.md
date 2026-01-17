# S7-SL-AutoAdvancement Execution Contract

**Codename:** `auto-advancement-v1`
**Status:** Execution Contract for Claude Code CLI
**Protocol:** Grove Execution Protocol v1.5
**Baseline:** `main` (post S6-ObservableSignals)
**Date:** 2026-01-16

---

## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | Phase 1 - Infrastructure |
| **Status** | Executing |
| **Blocking Issues** | None |
| **Last Updated** | 2026-01-16T14:00:00Z |
| **Next Action** | Create advancement_rules migration |

---

## Attention Anchor

**We are building:** Automatic tier advancement engine based on observable usage signals

**Success looks like:** Operators create advancement rules, daily batch evaluates sprouts against criteria, sprouts automatically advance tiers with full audit trail

---

## Hard Constraints

### Strangler Fig Compliance

```
FROZEN ZONE - DO NOT TOUCH
├── /terminal route
├── /foundation route (except Foundation consoles)
├── src/surface/components/Terminal/*
└── src/workspace/* (legacy GroveWorkspace)

ACTIVE BUILD ZONE - WHERE WE WORK
├── /explore route
├── /bedrock route
├── src/explore/*
├── src/bedrock/*
└── src/core/schema/*
```

### DEX Compliance Matrix

| Feature | Declarative | Agnostic | Provenance | Scalable |
|---------|-------------|----------|------------|----------|
| Advancement Rules | Config-driven criteria | No model deps | Full event logging | Registry pattern |
| Evaluation Engine | JSON rule definitions | Pure TypeScript | Signal snapshots | Batch processing |
| Operator Controls | Declarative overrides | UI-agnostic | Audit trail | Filter patterns |

---

## Architecture

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
│ evaluateAdvancement│ ←──│ signal_aggregations │
│ (pure TypeScript) │     │ (S6 real signals)   │
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

| Task | Story | Status |
|------|-------|--------|
| Create `advancement_rules` table | - | Pending |
| Create `advancement_events` table | - | Pending |
| Add `advancement-rule` to GroveObjectType | US-S018 | Pending |
| Register in EXPERIENCE_TYPE_REGISTRY | US-S018 | Pending |
| Create `useAdvancementRuleData` hook | US-S021 | Pending |

**Build Gate:** `npm run build && npm test`

---

### Phase 2: UI Components (Epic 1, 5)
**Goal:** Card + Editor + Grid view

| Task | Story | Status |
|------|-------|--------|
| Create `AdvancementRuleCard.tsx` | US-S005, US-S019 | Pending |
| Create `AdvancementRuleEditor.tsx` | US-S020 | Pending |
| Wire CRUD operations | US-S001-S004 | Pending |
| Add criteria builder UI | US-S001 | Pending |

**Screenshot Required:** Grid view + Editor open

---

### Phase 3: Evaluation Engine (Epic 2)
**Goal:** Core advancement logic

| Task | Story | Status |
|------|-------|--------|
| Create `evaluateAdvancement.ts` | US-S007 | Pending |
| Create `getObservableSignals.ts` | US-S022 | Pending |
| Create `advancementBatchJob.ts` | US-S006 | Pending |
| Implement tier update logic | US-S008 | Pending |
| Implement event logging | US-S009 | Pending |

**Build Gate:** Unit test coverage for evaluator

---

### Phase 4: Operator Controls (Epic 3)
**Goal:** Audit trail + override + rollback

| Task | Story | Status |
|------|-------|--------|
| Create `AdvancementHistoryPanel.tsx` | US-S011 | Pending |
| Create `ManualOverrideModal.tsx` | US-S012 | Pending |
| Create `BulkRollbackModal.tsx` | US-S013 | Pending |

**Screenshot Required:** History panel + Override modal

---

### Phase 5: Gardener Experience (Epic 4)
**Goal:** Badge updates + provenance tooltips

| Task | Story | Status |
|------|-------|--------|
| Verify TierBadge cache invalidation | US-S015 | Pending |
| Add advancement tooltip to TierBadge | US-S016 | Pending |

---

### Phase 6: E2E Testing & REVIEW.html
**Goal:** End-to-end validation

| Task | Status |
|------|--------|
| E2E: Create rule → batch → audit flow | Pending |
| E2E: Override → verify badge updates | Pending |
| Visual regression: All new components | Pending |
| Create REVIEW.html | Pending |

---

## Success Criteria

### Sprint Complete When:
- [ ] All phases completed with verification
- [ ] All DEX compliance gates pass
- [ ] All screenshots captured and embedded in REVIEW.html
- [ ] E2E test with console monitoring passes
- [ ] Zero critical console errors in E2E tests
- [ ] Code-simplifier applied
- [ ] Build and lint pass
- [ ] User notified with REVIEW.html path

### Sprint Failed If:
- Any FROZEN ZONE file modified
- Any phase without screenshot evidence
- DEX compliance test fails
- REVIEW.html not created or incomplete
- E2E test not created or missing console monitoring
- Critical console errors detected in E2E tests

---

## Key Files

### New Files to Create
```
src/core/schema/advancement.ts              # AdvancementRulePayload, Criterion types
src/core/engine/advancementEvaluator.ts     # evaluateAdvancement() pure function
src/core/engine/signalFetcher.ts            # getObservableSignals()
src/core/jobs/advancementBatchJob.ts        # Daily batch orchestration

src/bedrock/consoles/ExperienceConsole/
├── AdvancementRuleCard.tsx                 # Grid card
├── AdvancementRuleEditor.tsx               # Inspector panel
├── AdvancementHistoryPanel.tsx             # Audit trail
├── ManualOverrideModal.tsx                 # Individual tier override
├── BulkRollbackModal.tsx                   # Mass rollback
└── useAdvancementRuleData.ts               # CRUD hook

supabase/migrations/
├── 018_advancement_rules.sql               # Rules table
└── 019_advancement_events.sql              # Audit events table
```

### Files to Modify
```
src/core/schema/grove-object.ts             # Add 'advancement-rule' type
src/bedrock/types/experience.types.ts       # Add to registry + payload map
```

---

*This contract is binding. Deviation requires explicit human approval.*
