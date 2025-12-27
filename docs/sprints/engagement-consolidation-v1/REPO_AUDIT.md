# Repository Audit: engagement-consolidation-v1

## Pattern Check Status

✅ **PROJECT_PATTERNS.md reviewed**

Relevant patterns:
- Pattern 11: Session Engagement Telemetry (from adaptive-engagement sprint)
- Pattern 1: Content Reactivity (Quantum Interface) — Stage can inform prompt selection

DEX Pillars applied:
- **Declarative Sovereignty:** Stage thresholds in config
- **Capability Agnosticism:** Observe counts/timestamps, not model outputs
- **Provenance:** Track session history
- **Organic Scalability:** Defaults work, config improves

## Canonical Source Audit

### Engagement State Systems (REDUNDANT)

| Component | Location | Storage Key | Lines | Purpose |
|-----------|----------|-------------|-------|---------|
| EngagementBus | hooks/useEngagementBus.ts | grove-engagement-state | 503 | Events, reveals, triggers |
| TelemetryCollector | src/lib/telemetry/collector.ts | grove-telemetry | 187 | Stage computation |

**VIOLATION:** Two singletons tracking overlapping data. Must consolidate.

### Schema Files

| File | Status | Action |
|------|--------|--------|
| src/core/schema/engagement.ts | ✅ Keep | Extend with SessionStage |
| src/core/schema/session-telemetry.ts | ❌ Delete | Merge into engagement.ts |
| types/engagement.ts | ✅ Keep | Shim for backward compatibility |

### Hook Files

| Hook | Status | Action |
|------|--------|--------|
| useEngagementBus.ts | ✅ Keep | Add stage computation |
| useEngagementState.ts | ✅ Keep | Already exists in same file |
| useSessionTelemetry.ts | ❌ Delete | Redundant |
| useSuggestedPrompts.ts | 🔧 Refactor | Use useEngagementState |
| useJourneyProgress.ts | 🔧 Refactor | Use EngagementBus events |

### Utility Files

| File | Status | Action |
|------|--------|--------|
| src/lib/telemetry/collector.ts | ❌ Delete | Consolidate into EngagementBus |
| src/lib/telemetry/stage-computation.ts | 🔄 Move | To utils/stageComputation.ts |
| src/lib/telemetry/index.ts | ❌ Delete | No longer needed |
| utils/engagementTriggers.ts | ✅ Keep | Reveal trigger evaluation |

### Config Files

| File | Status | Action |
|------|--------|--------|
| src/core/config/defaults.ts | 🔧 Extend | Add DEFAULT_STAGE_THRESHOLDS |
| src/data/prompts/stage-prompts.ts | ✅ Keep | Stage-specific prompts |

## Test Coverage Assessment

### Current Test State

| Type | Files | Tests | Coverage |
|------|-------|-------|----------|
| Unit | ~3 | ~15 | Minimal |
| E2E | ~8 | ~25 | Basic flows |

### Tests Needed for This Sprint

| Test | Type | File |
|------|------|------|
| Stage computation | Unit | utils/stageComputation.test.ts |
| EngagementBus stage | Integration | hooks/useEngagementBus.test.ts |
| Prompt selection | Unit | hooks/useSuggestedPrompts.test.ts |

### Test Quality Checklist

- [ ] Tests are behavior-focused (not implementation)
- [ ] Semantic queries where applicable
- [ ] Edge cases: new user, returning user, power user

## Dependency Graph

```
TerminalWelcome.tsx
  └── useSuggestedPrompts.ts
        └── useEngagementState() ← FROM useEngagementBus
              └── EngagementBusSingleton
                    └── localStorage: grove-engagement-state
                    └── computeSessionStage() ← NEW

DELETED PATH:
  useSessionTelemetry ← REMOVE
    └── TelemetryCollector ← REMOVE
          └── grove-telemetry ← REMOVE
```

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Data loss during migration | High | Migrate grove-telemetry → grove-engagement-state on first load |
| Breaking existing features | Medium | Reveals, triggers unaffected |
| Missing stage in UI | Low | Same bug we're fixing |

## Files to Change Summary

**Delete (6 files):**
- src/lib/telemetry/collector.ts
- src/lib/telemetry/stage-computation.ts
- src/lib/telemetry/index.ts
- src/core/schema/session-telemetry.ts
- hooks/useSessionTelemetry.ts
- services/telemetryService.ts (if unused)

**Extend (3 files):**
- src/core/schema/engagement.ts — Add SessionStage types
- hooks/useEngagementBus.ts — Add stage computation
- src/core/config/defaults.ts — Add stage thresholds

**Refactor (2 files):**
- hooks/useSuggestedPrompts.ts — Use useEngagementState
- components/Terminal/TerminalWelcome.tsx — Display stage

**Create (1 file):**
- utils/stageComputation.ts — Pure function from telemetry code
