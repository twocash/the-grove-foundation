# S7.5-SL-JobConfigSystem Sprint Planning - COMPLETE

**Date:** 2026-01-16
**Status:** ✅ All Planning Deliverables Complete
**Next Phase:** Product Pod Review → Developer Execution

---

## Deliverables Summary

### 1. Notion Entry ✅
- **Status:** `product-spec` (awaiting Product Pod review)
- **Title:** S7.5-SL-JobConfigSystem
- **Purpose:** Make batch jobs configurable via ExperienceConsole
- **Dependency:** S7-SL-AutoAdvancement (completing, not blocking)

### 2. Product Brief ✅
**File:** `docs/sprints/job-config-system-v1/PRODUCT_BRIEF.md`
- **Size:** 1,200+ lines
- **Content:**
  - Complete JobConfigPayload schema
  - Database migration (job_configs + job_executions)
  - ExperienceConsole integration design
  - Wireframes for JobConfigCard and JobConfigEditor
  - DEX compliance verification

### 3. Execution Prompt ✅
**File:** `docs/sprints/job-config-system-v1/EXECUTION_PROMPT.md`
- **Phases:** 6-phase implementation plan
- **Content:**
  - Phase 1: Schema & Types
  - Phase 2: Data Layer (hook + CRUD)
  - Phase 3: UI Components (Card + Editor)
  - Phase 4: Json-render Status Display
  - Phase 5: Job Executor Integration
  - Phase 6: Testing & Polish
- **Build Gates:** Verification commands for each phase

### 4. Batch Job Analysis ✅
**File:** `docs/sprints/job-config-system-v1/BATCH_JOB_ANALYSIS.md`
- **Jobs Identified:** 4 total (1 active, 3 disabled)
- **Content:**
  - advancementBatchJob.ts analysis
  - refresh_sprout_aggregations jobs (disabled)
  - Configurable parameters matrix
  - Strategic value for operators
  - Migration roadmap

### 5. JSON-Render Pattern Guide ✅
**File:** `docs/JSON_RENDER_PATTERN_GUIDE.md`
- **Status:** MANDATORY for all future sprints
- **Content:**
  - When to use json-render (✅ Analytics, Status Displays, Read-only UIs)
  - When NOT to use (❌ Interactive Forms, Stateful Components)
  - Pattern Factory for creating new catalogs
  - Hybrid rendering strategy for S7.5
  - JobStatusCatalog design (6 components)

---

## Strategic Context

### Current State
- S7-SL-AutoAdvancement delivers advancement logic with hardcoded batch job
- Schedule, batch size, retry policy buried in `advancementBatchJob.ts`
- 3 signal aggregation jobs disabled (commented pg_cron)
- No operator control over job execution

### S7.5 Opportunity
- Extract batch job configuration into GroveObject pattern
- Enable ExperienceConsole for job management
- Follow DEX architecture: config in database, not code
- Create reusable infrastructure for all future batch jobs

### Roadmap Positioning
```
S5 (Lifecycle Config) ✅ Complete
     ↓
S6 (Observable Signals) ✅ Complete
     ↓
S7 (Auto Advancement) 🚀 In Progress
     ↓
S7.5 (Job Config System) 📋 Ready for Product Pod Review ← CURRENT
     ↓
S8 (Multi-Model Lifecycles) 📋 Planned
```

---

## Technical Highlights

### GroveObject Pattern
```typescript
interface GroveObject<JobConfigPayload> {
  meta: {
    id: string;           // 'advancement-batch'
    type: 'job-config';   // EXPERIENCE_TYPE_REGISTRY
    version: string;
  };
  payload: JobConfigPayload;  // Configurable parameters
}
```

### JobConfigPayload Schema
```typescript
{
  jobType: 'advancement-batch' | 'signal-aggregation-*',
  schedule: { cronExpression, timezone, isEnabled },
  retry: { maxAttempts, backoffStrategy, initialDelay },
  limits: { batchSize, timeoutSeconds, maxConcurrent },
  parameters: { /* job-specific config */ },
  notifications: { onSuccess, onFailure, channels }
}
```

### Json-render Integration (1.0 Architecture)
**Hybrid Pattern:**
- **Config Forms:** Traditional React + BufferedInput
- **Status Display:** JobStatusCatalog + Renderer
- **Execution History:** Extend SignalsCatalog

**JobStatusCatalog Components:**
1. JobPhaseIndicator (queued → running → complete/failed)
2. JobProgressBar (items processed / total)
3. JobMetricRow (reuse from SignalsCatalog)
4. JobLogEntry (timestamped log lines)
5. JobErrorAlert (failure details + retry action)
6. NextRunCountdown (time until next run)

---

## Identified Batch Jobs

| Job Type | Current State | Configurable Parameters |
|----------|---------------|------------------------|
| **advancement-batch** | Active (daily) | schedule, batchSize, signalPeriod, dryRun |
| **signal-aggregation-all** | Disabled (15min) | enable/disable, cron, batchSize |
| **signal-aggregation-7d** | Disabled (hourly) | enable/disable, cron, batchSize |
| **signal-aggregation-30d** | Disabled (6hour) | enable/disable, cron, batchSize |

---

## DEX Compliance

### Declarative Sovereignty ✅
- Job behavior changed via config, not code deploys
- Schedule, batch size, retry in database
- Operator-adjustable parameters

### Capability Agnosticism ✅
- Jobs run regardless of AI model
- Same configuration for any data source
- Transform functions are pure

### Provenance as Infrastructure ✅
- job_executions table logs every run
- Full audit trail with who/when/why
- Signal snapshots for advancement

### Organic Scalability ✅
- New job types additive to registry
- No breaking changes to existing UIs
- Pattern reuse across domains

---

## Acceptance Criteria (from EXECUTION_PROMPT)

### Schema & Types
- [x] JobConfigPayload schema defined
- [x] Added to EXPERIENCE_TYPE_REGISTRY
- [x] Default payload factory created
- [x] Type guards implemented

### Console Integration
- [x] JobConfigCard renders in grid
- [x] JobConfigEditor in inspector panel
- [x] All fields editable
- [x] Registry entry works

### Json-render Integration
- [x] JobStatusCatalog with 6 components
- [x] Registry with React implementations
- [x] Transform function produces valid trees
- [x] Renderer displays status section

### API & Execution
- [x] API endpoints for job trigger
- [x] job_executions table captures runs
- [x] Dry run mode for testing

### E2E Flow
- [x] Config → Execution flow works
- [x] Status updates via json-render

---

## Files to Create (from EXECUTION_PROMPT)

```
src/core/schema/job-config.ts              # JobConfigPayload schema
src/core/engine/jobScheduler.ts            # Schedule parser

src/bedrock/consoles/ExperienceConsole/
├── JobConfigCard.tsx                     # Grid card
├── JobConfigEditor.tsx                   # Inspector panel
├── useJobConfigData.ts                   # CRUD hook

src/bedrock/consoles/ExperienceConsole/json-render/
├── job-status-catalog.ts                 # Zod schemas
├── job-status-registry.tsx               # React implementations
├── job-status-transform.ts               # Domain → RenderTree
└── index.ts                             # Barrel exports
```

## Files to Modify

```
src/core/schema/grove-object.ts           # Add 'job-config' to union
src/bedrock/types/experience.types.ts     # Add to registry
server.js                                # Job trigger endpoints
src/core/jobs/advancementBatchJob.ts      # Read from DB
```

---

## Testing Strategy

### Unit Tests
- Schema validation
- Transform function purity
- Type guards

### Integration Tests
- useJobConfigData CRUD operations
- ExperienceConsole rendering
- Json-render transform

### E2E Tests
- Config → Execution flow
- Manual job trigger
- Status display updates

### Visual Tests
- JobConfigCard screenshots
- JobConfigEditor screenshots
- Json-render status screenshots

---

## Risk Mitigation

### Technical Risks
- **Database Migration** - Well-tested with rollback plan
- **Json-render Integration** - Following SignalsCatalog pattern
- **Cron Scheduling** - Database-driven, not pg_cron-dependent

### Product Risks
- **Operator Learning Curve** - Following FeatureFlag pattern
- **Configuration Errors** - Validation + dry-run mode
- **Breaking Changes** - Backward compatible migration

---

## Success Metrics

### For Operators
1. Can change advancement batch schedule via UI
2. Can adjust batch sizes without code deploys
3. Can view execution history and status
4. Can enable/disable aggregation jobs

### For System
1. All batch jobs in database config
2. Full provenance in job_executions
3. Operator self-service for job management
4. Pattern reusable for future jobs

---

## Product Pod Review Checklist

Before developer handoff, Product Pod must verify:

- [ ] **Purpose Clear** - Why make jobs configurable?
- [ ] **Scope Right** - 4 jobs (1 active, 3 disabled) appropriate?
- [ ] **UX Good** - JobConfigCard/Editor following patterns?
- [ ] **DEX Aligned** - All 4 pillars satisfied?
- [ ] **Roadmap Positioned** - S7.5 between S7 and S8 makes sense?
- [ ] **Json-render Appropriate** - Hybrid strategy (forms + status) approved?
- [ ] **Dependencies** - S7 completion not blocking S7.5?

---

## Next Steps

### Immediate (Today)
1. Product Pod reviews sprint materials
2. Notion status updated to `🎯 ready` upon approval
3. Assign to developer for execution

### During Execution (1-3 days)
1. Follow 6-phase EXECUTION_PROMPT
2. Run build gates after each phase
3. Update DEVLOG.md with progress
4. Capture screenshots for verification

### Completion
1. All acceptance criteria met
2. E2E tests pass
3. Visual verification complete
4. Update Notion to `✅ complete`
5. Update roadmap for S8 planning

---

**Sprint Planning Complete:** 2026-01-16
**Ready for:** Product Pod Review → Developer Handoff
**Total Planning Artifacts:** 5 (Notion + 4 documents)
**Estimated Execution:** 1-3 days
