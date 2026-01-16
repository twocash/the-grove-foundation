# Execution Prompt: S7.5-SL-JobConfigSystem

**Sprint:** S7.5-SL-JobConfigSystem (Declarative Job Infrastructure)
**Date:** 2026-01-16
**Status:** Ready for Execution
**Dependency:** S7-SL-AutoAdvancement (completing, not blocking)

---

## Quick Start

```bash
# Verify you're on main with latest
git checkout main && git pull origin main

# Create feature branch
git checkout -b feat/job-config-system-v1

# Run baseline tests (should pass)
npm test && npx playwright test
```

---

## Primary Artifacts (READ THESE)

| Artifact | Purpose | Location |
|----------|---------|----------|
| **PRODUCT_BRIEF.md** | Goals, flows, schemas, architecture | This directory |
| **UX_WIREFRAMES.md** | TSX code for Card/Editor components | This directory |
| **DEX_COMPLIANCE.md** | DEX pillar verification | This directory |

**Pattern:** Follow ExperienceConsole polymorphic pattern exactly. Reference `src/bedrock/consoles/ExperienceConsole/FeatureFlagCard.tsx` and `FeatureFlagEditor.tsx`.

---

## Architecture Overview

```
Job Configuration Flow
┌─────────────────────────────────────────────────────────┐
│  ExperienceConsole                              │
│  ┌──────────────┐     ┌──────────────┐              │
│  │ JobConfigCard│────▶│ JobConfigEditor│             │
│  │  (Grid View) │     │(Inspector Panel)│            │
│  └──────┬───────┘     └──────┬───────┘            │
│         │                     │                        │
│         └─────────────────────┼──────────────────────┘
│                                │
└────────────────────────────────┼────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────┬────────────────────────┐
│      GroveObject<JobConfig>    │   Supabase             │
│                                 │                         │
│  ┌────────────────────────────┐│   job_configs          │
│  │ { meta: {...},             ││   job_executions       │
│  │   payload: {                ││                         │
│  │     jobType,               ││   Table: job_configs   │
│  │     schedule,              ││   - id (UUID)          │
│  │     retryPolicy,           ││   - meta (JSONB)       │
│  │     limits,                ││   - payload (JSONB)     │
│  │     parameters             ││                         │
│  │   }                        ││   Table: job_executions │
│  │ }                           ││   - id (UUID)           │
│  └────────────────────────────┘│   - job_config_id      │
│                                 │   - status             │
│                                 │   - started_at         │
│  ┌────────────────────────────┐│   - completed_at       │
│  │ useJobConfigData()          ││   - result (JSONB)     │
│  │ (Data Hook)                 ││   - error (TEXT)       │
│  └────────────────────────────┘│                         │
│                                 │                         │
│                                 │                         │
└─────────────────────────────────┴────────────────────────┘
                                 │
                                 ▼
┌────────────────────────────────┬────────────────────────┐
│     Job Executor Engine         │   Cron Scheduler        │
│                                 │                         │
│  ┌────────────────────────────┐│   Daily 2am UTC        │
│  │Id)     executeJob(jobConfig ││   ┌─────────────┐       │
│  │  ├─ Load config            ││   │ Advancement │       │
│  │  ├─ Apply limits           ││   │ Batch Job  │       │
│  │  ├─ Route to handler       ││   └─────┬─────┘       │
│  │  └─ Execute with retry      ││         │             │
│  └────────────────────────────┘│         ▼             │
│                                 │   runAdvancementBatch()│
│                                 │                         │
│                                 │                         │
└─────────────────────────────────┴────────────────────────┘
```

---

## json-render Integration (1.0 Architecture)

**Critical:** This sprint implements a hybrid rendering strategy:

| UI Area | Pattern | Location |
|---------|---------|----------|
| **Config Forms** | Traditional React + BufferedInput | JobConfigCard/Editor |
| **Status Display** | json-render catalog | JobStatusCatalog + Renderer |
| **Execution History** | json-render (extend SignalsCatalog) | JobExecutionStatus |

### json-render Components to Create

```typescript
// src/bedrock/consoles/ExperienceConsole/json-render/job-status-catalog.ts
JobStatusCatalog = {
  components: {
    JobPhaseIndicator,    // queued → running → complete/failed
    JobProgressBar,       // items processed / total
    JobMetricRow,         // reuse MetricRow from SignalsCatalog
    JobLogEntry,          // timestamped log lines
    JobErrorAlert,        // failure details with retry action
    NextRunCountdown,     // time until next scheduled run
  }
}

// Transform: jobExecutionToRenderTree(execution: JobExecution): RenderTree
```

### Usage Pattern

```typescript
// In JobConfigEditor.tsx
import { Renderer } from '@surface/components/modals/SproutFinishingRoom/json-render';
import { JobStatusRegistry } from './json-render/job-status-registry';

<Renderer
  tree={jobExecutionToRenderTree(execution)}
  registry={JobStatusRegistry}
  catalog={JobStatusCatalog}
/>
```

---

## Execution Phases

### Phase 1: Schema & Types (Epic 1)
**Goal:** Define JobConfigPayload and integrate with EXPERIENCE_TYPE_REGISTRY

| Task | Story | Commit |
|------|-------|--------|
| Create `job-config.ts` schema | - | `feat(types): Add JobConfigPayload schema` |
| Add to EXPERIENCE_TYPE_REGISTRY | - | `feat(registry): Register job-config type` |
| Create default payload factory | - | `feat(schema): Add default job config` |
| Add type guards | - | `feat(types): Add isJobConfigPayload guard` |

**Build Gate:**
```bash
npm run build && npm test
# Verify: TypeScript compiles, schema validation works
```

---

### Phase 2: Data Layer (Epic 1)
**Goal:** Hook + CRUD + database migration

| Task | Story | Commit |
|------|-------|--------|
| Create `useJobConfigData` hook | - | `feat(hooks): Add useJobConfigData` |
| Add database migration | - | `feat(db): Add job_configs table` |
| Implement domain helpers | - | `feat(data): Add getEnabledJobs helper` |
| Wire to Supabase | - | `feat(data): Connect hook to Supabase` |

**Build Gate:**
```bash
npm test -- --grep "job-config"
# Verify: Hook tests pass, database connection works
```

---

### Phase 3: UI Components (Epic 2)
**Goal:** Card + Editor + grid integration

| Task | Story | Commit |
|------|-------|--------|
| Create `JobConfigCard.tsx` | AC-U1 | `feat(ui): Add JobConfigCard` |
| Create `JobConfigEditor.tsx` | AC-U2 | `feat(ui): Add JobConfigEditor` |
| Wire "Run Now" button | AC-U3 | `feat(ui): Add manual job trigger` |
| Add execution history section | AC-U4 | `feat(ui): Add execution history` |

**Build Gate:**
```bash
npm run build && npx playwright test tests/e2e/bedrock-*.spec.ts
# Verify: Components render, interactions work
```

**Screenshot Required:**
- Grid view with job config cards
- Editor with all sections visible

---

### Phase 4: json-render Status Display (Epic 2)
**Goal:** JobStatusCatalog + Renderer integration

| Task | Story | Commit |
|------|-------|--------|
| Create `job-status-catalog.ts` | AC-J1 | `feat(json-render): Add JobStatusCatalog` |
| Implement `job-status-registry.tsx` | AC-J2 | `feat(json-render): Add JobStatusRegistry` |
| Create `job-status-transform.ts` | AC-J3 | `feat(json-render): Add transform function` |
| Wire into JobConfigEditor | AC-J4, AC-J5 | `feat(ui): Use Renderer for status` |

**Build Gate:**
```bash
npm test -- --grep "json-render"
# Verify: Transform works, Renderer displays correctly
```

**Screenshot Required:**
- Status section with json-render components
- JobPhaseIndicator, JobProgressBar visible

---

### Phase 5: Job Executor Integration (Epic 3)
**Goal:** Make advancement batch read from config

| Task | Story | Commit |
|------|-------|--------|
| Refactor `advancementBatchJob.ts` | AC-E1 | `feat(executor): Read config from DB` |
| Implement retry logic | AC-E2 | `feat(executor): Add retry policy` |
| Apply batch size limit | AC-E3 | `feat(executor): Respect configured limits` |
| Update last execution | AC-E5 | `feat(executor): Update execution status` |

**Build Gate:**
```bash
npm test -- --grep "advancement"
# Verify: Batch job works with config
```

**Test Coverage Required:**
- Reading config from database
- Retry with exponential backoff
- Batch size limits
- Execution status updates

---

### Phase 6: Testing & Polish (Epic 4)
**Goal:** End-to-end validation

| Task | Commit |
|------|--------|
| E2E: Config → Execution flow | `test(e2e): Add job config flow test` |
| Visual: json-render components | `test(visual): Add job status screenshots` |
| API endpoints for jobs | `feat(api): Add /api/jobs/trigger endpoint` |
| Documentation updates | `docs: Update job configuration guide` |

**Build Gate:**
```bash
npm run build && npm test && npx playwright test
# ALL tests must pass
```

---

## Key Code Locations

### New Files to Create

```
src/core/schema/job-config.ts              # JobConfigPayload schema
src/core/engine/jobScheduler.ts            # Schedule parser

src/bedrock/consoles/ExperienceConsole/
├── JobConfigCard.tsx                     # Grid card (follow FeatureFlagCard)
├── JobConfigEditor.tsx                   # Inspector panel (follow FeatureFlagEditor)
├── useJobConfigData.ts                   # CRUD hook

src/bedrock/consoles/ExperienceConsole/json-render/
├── job-status-catalog.ts                 # Zod schemas for status components
├── job-status-registry.tsx               # React implementations
├── job-status-transform.ts                # Domain → RenderTree
└── index.ts                             # Barrel exports
```

### Files to Modify

```
src/core/schema/grove-object.ts                           # Add 'job-config' to union
src/bedrock/types/experience.types.ts                     # Add to EXPERIENCE_TYPE_REGISTRY
server.js                                              # Add job trigger API endpoints
src/core/jobs/advancementBatchJob.ts                    # Refactor to read config
```

### Database Migration

```sql
-- Migration: add_job_config_tables
CREATE TABLE job_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta JSONB NOT NULL DEFAULT '{}',
  payload JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE job_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_config_id UUID REFERENCES job_configs(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running',
  result JSONB,
  error TEXT
);

CREATE INDEX idx_job_executions_config ON job_executions(job_config_id);
CREATE INDEX idx_job_executions_started ON job_executions(started_at DESC);
```

---

## json-render Pattern Reference

### Following SignalsCatalog Pattern

Reference: `src/bedrock/consoles/ExperienceConsole/json-render/signals-catalog.ts`

```typescript
// 1. Define Zod schemas (one per component)
export const JobPhaseIndicatorSchema = z.object({
  phase: z.enum(['queued', 'running', 'complete', 'failed']),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
});

// 2. Create catalog
export const JobStatusCatalog = {
  components: {
    JobPhaseIndicator: { props: JobPhaseIndicatorSchema },
    // ... more components
  }
};

// 3. Implement registry
export const JobStatusRegistry: ComponentRegistry = {
  JobPhaseIndicator: ({ element }) => {
    const props = element.props as JobPhaseIndicatorProps;
    return <div>{/* Render JSX */}</div>;
  }
};

// 4. Create transform
export function jobExecutionToRenderTree(execution: JobExecution): RenderTree {
  return {
    type: 'root',
    children: [
      { type: 'JobPhaseIndicator', props: { phase: execution.status } }
    ]
  };
}
```

### Usage in Component

```typescript
import { Renderer } from '@surface/components/modals/SproutFinishingRoom/json-render';
import { JobStatusCatalog } from './json-render/job-status-catalog';
import { JobStatusRegistry } from './json-render/job-status-registry';
import { jobExecutionToRenderTree } from './json-render/job-status-transform';

export function JobExecutionStatus({ execution }: { execution: JobExecution }) {
  const renderTree = jobExecutionToRenderTree(execution);

  return (
    <Renderer
      tree={renderTree}
      registry={JobStatusRegistry}
      catalog={JobStatusCatalog}
    />
  );
}
```

---

## Mock Implementation Strategy

**Jobs without S7/S6 dependency:**

For testing, create mock job configs in `job_configs` table:

```sql
INSERT INTO job_configs (meta, payload)
VALUES (
  '{"id": "mock-health-check", "type": "job-config"}'::jsonb,
  '{
    "jobType": "health-check",
    "displayName": "Mock Health Check",
    "schedule": {
      "cronExpression": "*/5 * * * *",
      "timezone": "UTC",
      "isEnabled": true
    },
    "retry": {
      "maxAttempts": 2,
      "backoffStrategy": "fixed",
      "initialDelaySeconds": 10,
      "maxDelaySeconds": 60
    },
    "limits": {
      "batchSize": 10,
      "timeoutSeconds": 30,
      "maxConcurrent": 1
    },
    "parameters": {
      "jobType": "health-check",
      "checks": ["database", "storage"],
      "alertThreshold": "warning"
    }
  }'::jsonb
);
```

This creates a mock job that runs every 5 minutes, doesn't depend on S6/S7 infrastructure.

---

## Attention Anchoring Protocol

Before each phase transition:
1. Re-read `PRODUCT_BRIEF.md` for the relevant epic
2. Verify acceptance criteria match implementation
3. Run build gate before proceeding

After every 10 tool calls:
- Check: Am I still pursuing declarative job configuration?
- If uncertain: Re-read this EXECUTION_PROMPT

Before committing:
- Verify: Does this change satisfy Gherkin scenarios?

---

## Definition of Done

- [ ] All schema types defined and validated
- [ ] EXPERIENCE_TYPE_REGISTRY integration complete
- [ ] JobConfigCard and JobConfigEditor complete
- [ ] `useJobConfigData` hook provides CRUD
- [ ] JobStatusCatalog with 6 json-render components
- [ ] JobExecutor reads config from database
- [ ] Advancement batch job refactored
- [ ] Retry logic with exponential backoff
- [ ] All E2E tests pass
- [ ] Screenshots captured for visual verification
- [ ] No regressions on existing ExperienceConsole

---

## Status Log Entry

Write status to: `.agent/status/current/{NNN}-{timestamp}-developer.md`

```yaml
---
sprint: S7.5-SL-JobConfigSystem
agent: developer
status: IN_PROGRESS
phase: "Phase {N}: {Name}"
heartbeat: {ISO timestamp}
notion_synced: false
---

## Progress
- [x] Phase 1 complete
- [ ] Phase 2 in progress
- ...

## Notes
{Any blockers, decisions, or observations}
```

---

*Execution Prompt for S7.5-SL-JobConfigSystem*
*Pattern: Hybrid rendering - traditional React + json-render*
*Grove Execution Protocol v1*
