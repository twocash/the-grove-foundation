# Product Brief: S7.5-SL-JobConfigSystem

**Sprint ID:** S7.5-SL-JobConfigSystem  \
**Initiative:** Knowledge as Observable System (Phase 4)  \
**Date:** 2026-01-16  \
**Version:** 1.0  \
**Status:** For Product Pod Review

---

## Executive Summary

The Job Configuration System transforms Grove's batch job infrastructure from hardcoded implementations into a declarative, configurable system aligned with the EXPERIENCE_TYPE_REGISTRY pattern. This sprint introduces `job-config` as a new Grove Object type, enabling operators to manage job schedules, retry policies, and execution parameters through the Bedrock ExperienceConsole without code changes.

**The DEX Case:** Today, changing when the advancement batch runs requires a developer to modify `advancementBatchJob.ts`. Tomorrow, an operator should edit a JSON configuration in the ExperienceConsole. This is the difference between a hardcoded application and a declarative platform.

**Business Value:**
- Operators can adjust job timing without deploys
- New jobs follow a proven pattern rather than bespoke implementations
- Observability improves through unified job monitoring
- Foundation for future scheduled automation (notifications, cleanup, health checks)

---

## Problem Statement

### Anti-Patterns We Are Solving

**Anti-Pattern 1: Hardcoded Job Parameters**

The `advancementBatchJob.ts` currently embeds operational parameters directly in code:
```typescript
// Line 118-120 of advancementBatchJob.ts
const {
  batchSize = 100,        // Hardcoded default
  signalPeriod = 'all_time',  // Hardcoded default
} = options;
```

Changing batch size from 100 to 50 requires a code change, PR review, and deployment.

**Anti-Pattern 2: Scattered Job Definitions**

Jobs that should follow a common pattern are instead implemented as standalone functions:
- Advancement batch: `src/core/jobs/advancementBatchJob.ts`
- Signal aggregation: Inline in server.js (hypothetical)
- Cleanup jobs: Not implemented due to complexity

There is no registry, no unified monitoring, no shared retry logic.

**Anti-Pattern 3: No Operator Visibility**

Operators cannot see:
- When the last job ran
- What jobs are scheduled
- Why a job failed
- How to retry a failed job

This information is buried in Cloud Run logs.

---

## Proposed Solution

### 3.1 JobConfigPayload Schema

Following the established `GroveObject<Payload>` pattern from `AdvancementRulePayload`:

```typescript
// src/core/schema/job-config.ts

/**
 * Supported job types in Grove
 * INSTANCE pattern: Many jobs can be active simultaneously
 */
export type JobType =
  | 'advancement-batch'     // S7 tier advancement
  | 'signal-aggregation'    // S6 signal rollup
  | 'notification-digest'   // Operator email summary
  | 'orphan-cleanup'        // Archive orphaned entities
  | 'health-check';         // System validation

/**
 * Cron schedule configuration
 */
export interface ScheduleConfig {
  /** Cron expression (e.g., "0 2 * * *" for daily 2am) */
  cronExpression: string;
  /** Timezone for schedule (e.g., "America/Los_Angeles") */
  timezone: string;
  /** Whether schedule is active */
  isEnabled: boolean;
}

/**
 * Retry policy configuration
 */
export interface RetryConfig {
  /** Maximum retry attempts */
  maxAttempts: number;
  /** Backoff strategy */
  backoffStrategy: 'fixed' | 'exponential';
  /** Initial delay in seconds */
  initialDelaySeconds: number;
  /** Maximum delay between retries */
  maxDelaySeconds: number;
}

/**
 * Job execution limits
 */
export interface ExecutionLimits {
  /** Maximum items to process per run */
  batchSize: number;
  /** Timeout in seconds */
  timeoutSeconds: number;
  /** Maximum concurrent executions */
  maxConcurrent: number;
}

/**
 * Job-specific parameters (varies by jobType)
 */
export type JobParameters =
  | AdvancementJobParams
  | SignalAggregationParams
  | NotificationDigestParams
  | CleanupJobParams
  | HealthCheckParams;

export interface AdvancementJobParams {
  jobType: 'advancement-batch';
  /** Lifecycle model to evaluate */
  lifecycleModelId?: string;
  /** Specific tiers to process */
  fromTiers?: string[];
  /** Signal period for evaluation */
  signalPeriod: 'all_time' | 'last_30d' | 'last_7d';
}

export interface SignalAggregationParams {
  jobType: 'signal-aggregation';
  /** Aggregation periods to compute */
  periods: Array<'all_time' | 'last_30d' | 'last_7d'>;
}

export interface NotificationDigestParams {
  jobType: 'notification-digest';
  /** Events to include in digest */
  eventTypes: string[];
  /** Recipient operator IDs */
  recipientIds: string[];
}

export interface CleanupJobParams {
  jobType: 'orphan-cleanup';
  /** Entity types to clean */
  entityTypes: string[];
  /** Days before entity is considered orphaned */
  orphanThresholdDays: number;
  /** Dry run mode */
  dryRun: boolean;
}

export interface HealthCheckParams {
  jobType: 'health-check';
  /** Checks to run */
  checks: Array<'database' | 'storage' | 'api' | 'rag'>;
  /** Alert threshold (severity) */
  alertThreshold: 'warning' | 'error' | 'critical';
}

/**
 * Payload for a job configuration object
 * Follows GroveObject<JobConfigPayload> pattern
 */
export interface JobConfigPayload {
  /** Job type identifier */
  jobType: JobType;
  /** Human-readable job name */
  displayName: string;
  /** Schedule configuration */
  schedule: ScheduleConfig;
  /** Retry policy */
  retry: RetryConfig;
  /** Execution limits */
  limits: ExecutionLimits;
  /** Job-specific parameters */
  parameters: JobParameters;
  /** Last execution result (for display) */
  lastExecution?: {
    startedAt: string;
    completedAt: string;
    status: 'success' | 'partial' | 'failed';
    itemsProcessed: number;
    errors: number;
    runId: string;
  };
}

/**
 * Default payload for new job configs
 */
export const DEFAULT_JOB_CONFIG_PAYLOAD: JobConfigPayload = {
  jobType: 'advancement-batch',
  displayName: 'Daily Advancement',
  schedule: {
    cronExpression: '0 2 * * *',  // 2am daily
    timezone: 'America/Los_Angeles',
    isEnabled: false,  // Disabled by default for safety
  },
  retry: {
    maxAttempts: 3,
    backoffStrategy: 'exponential',
    initialDelaySeconds: 60,
    maxDelaySeconds: 900,
  },
  limits: {
    batchSize: 100,
    timeoutSeconds: 300,
    maxConcurrent: 1,
  },
  parameters: {
    jobType: 'advancement-batch',
    signalPeriod: 'all_time',
  },
};
```

### 3.2 UI Wireframes

**JobConfigCard (Grid View)**

```
┌─────────────────────────────────────────┐
│ [▶ Running]                          ★  │
├─────────────────────────────────────────┤
│  📅  Daily Advancement                   │
│      advancement-batch                   │
│                                          │
│  Next: Today 2:00 AM PST                 │
│  Last: Success (142 processed)           │
│                                          │
│  ┌─────┐  ┌─────┐  ┌─────┐              │
│  │ 2AM │  │ 100 │  │  3  │              │
│  │Daily│  │batch│  │retry│              │
│  └─────┘  └─────┘  └─────┘              │
│                                          │
│  [ Enabled ]                [ Run Now ]  │
└─────────────────────────────────────────┘
```

**JobConfigEditor (Inspector Panel)**

```
┌─────────────────────────────────────────┐
│ ═══════════════════════════════════════ │
│           SCHEDULE                       │
│ ─────────────────────────────────────── │
│  Cron Expression: [ 0 2 * * *      ]    │
│  Timezone:        [ America/Los_Angeles]│
│  [●] Schedule Active                     │
│                                          │
│ ═══════════════════════════════════════ │
│           EXECUTION                      │
│ ─────────────────────────────────────── │
│  Batch Size:    [ 100    ]              │
│  Timeout (sec): [ 300    ]              │
│  Max Concurrent:[ 1      ]              │
│                                          │
│ ═══════════════════════════════════════ │
│           RETRY POLICY                   │
│ ─────────────────────────────────────── │
│  Max Attempts:  [ 3      ]              │
│  Strategy:      [● Exponential]         │
│                 [○ Fixed      ]         │
│  Initial Delay: [ 60     ] sec          │
│  Max Delay:     [ 900    ] sec          │
│                                          │
│ ═══════════════════════════════════════ │
│           JOB PARAMETERS                 │
│ ─────────────────────────────────────── │
│  Signal Period: [○ All Time   ]         │
│                 [● Last 30 Days]        │
│                 [○ Last 7 Days ]        │
│  From Tiers:    [☑ seed] [☑ sprout]    │
│                 [☑ sapling] [☐ tree]   │
│                                          │
│ ═══════════════════════════════════════ │
│           EXECUTION HISTORY              │
│ ─────────────────────────────────────── │
│  ✓ Jan 16 2:00 AM - 142 items (23s)    │
│  ✓ Jan 15 2:00 AM - 138 items (21s)    │
│  ✗ Jan 14 2:00 AM - Failed (timeout)   │
│     [View Logs] [Retry]                 │
│                                          │
├─────────────────────────────────────────┤
│ [        Save Changes        ]          │
│ [Duplicate] [Run Now] [Delete]          │
└─────────────────────────────────────────┘
```

### 3.3 json-render Integration (1.0 Architecture)

**Job Status Display (Read-Only, Declarative)**

Following the SignalsCatalog pattern from `src/bedrock/consoles/ExperienceConsole/json-render/signals-catalog.ts`:

```typescript
// src/bedrock/consoles/ExperienceConsole/json-render/job-status-catalog.ts

/**
 * JobStatusCatalog: Zod schemas for job status components
 * Follows the SignalsCatalog pattern
 */

import { z } from 'zod';

// Job Phase Indicator Schema
export const JobPhaseIndicatorSchema = z.object({
  phase: z.enum(['queued', 'running', 'complete', 'failed']),
  startedAt: z.string().optional(),
  completedAt: z.string().optional(),
});

export type JobPhaseIndicatorProps = z.infer<typeof JobPhaseIndicatorSchema>;

// Job Progress Bar Schema
export const JobProgressBarSchema = z.object({
  itemsProcessed: z.number(),
  itemsTotal: z.number(),
  percentage: z.number().min(0).max(100),
});

export type JobProgressBarProps = z.infer<typeof JobProgressBarSchema>;

// Job Metric Row Schema (reuses MetricRow pattern)
export const JobMetricRowSchema = z.object({
  metrics: z.array(z.object({
    label: z.string(),
    value: z.union([z.string(), z.number()]),
    color: z.enum(['default', 'green', 'red', 'amber', 'blue']).default('default'),
  })),
});

export type JobMetricRowProps = z.infer<typeof JobMetricRowSchema>;

// Job Log Entry Schema
export const JobLogEntrySchema = z.object({
  timestamp: z.string(),
  level: z.enum(['info', 'warn', 'error']),
  message: z.string(),
});

export type JobLogEntryProps = z.infer<typeof JobLogEntrySchema>;

// Job Error Alert Schema
export const JobErrorAlertSchema = z.object({
  error: z.string(),
  retryable: z.boolean(),
  retryCount: z.number().optional(),
});

export type JobErrorAlertProps = z.infer<typeof JobErrorAlertSchema>;

// Next Run Countdown Schema
export const NextRunCountdownSchema = z.object({
  nextRunAt: z.string(),
  timezone: z.string(),
});

export type NextRunCountdownProps = z.infer<typeof NextRunCountdownSchema>;

// Catalog aggregator
export const JobStatusCatalog = {
  components: {
    JobPhaseIndicator: { props: JobPhaseIndicatorSchema },
    JobProgressBar: { props: JobProgressBarSchema },
    JobMetricRow: { props: JobMetricRowSchema },
    JobLogEntry: { props: JobLogEntrySchema },
    JobErrorAlert: { props: JobErrorAlertSchema },
    NextRunCountdown: { props: NextRunCountdownSchema },
  },
} as const;
```

**Registry Implementation**

```typescript
// src/bedrock/consoles/ExperienceConsole/json-render/job-status-registry.tsx

import React from 'react';
import { ComponentRegistry } from '@surface/components/modals/SproutFinishingRoom/json-render';
import { JobPhaseIndicator, JobProgressBar, JobMetricRow, JobLogEntry, JobErrorAlert, NextRunCountdown } from './components';

export const JobStatusRegistry: ComponentRegistry = {
  JobPhaseIndicator: ({ element }) => {
    const props = element.props as JobPhaseIndicatorProps;
    const phaseColors = {
      queued: 'bg-gray-400',
      running: 'bg-blue-500',
      complete: 'bg-green-500',
      failed: 'bg-red-500',
    };

    return (
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${phaseColors[props.phase]}`} />
        <span className="text-sm font-medium capitalize">{props.phase}</span>
        {props.startedAt && (
          <span className="text-xs text-gray-500">
            Started: {new Date(props.startedAt).toLocaleTimeString()}
          </span>
        )}
      </div>
    );
  },

  JobProgressBar: ({ element }) => {
    const props = element.props as JobProgressBarProps;
    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${props.percentage}%` }}
        />
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>{props.itemsProcessed} / {props.itemsTotal}</span>
          <span>{props.percentage.toFixed(1)}%</span>
        </div>
      </div>
    );
  },

  JobMetricRow: ({ element }) => {
    const props = element.props as JobMetricRowProps;
    return (
      <div className="grid grid-cols-3 gap-4">
        {props.metrics.map((metric, idx) => (
          <div key={idx} className="bg-gray-50 p-3 rounded">
            <div className="text-xs text-gray-500">{metric.label}</div>
            <div className={`text-lg font-semibold text-${metric.color}-600`}>
              {metric.value}
            </div>
          </div>
        ))}
      </div>
    );
  },

  // ... more components
};
```

**Transform Function**

```typescript
// src/bedrock/consoles/ExperienceConsole/json-render/job-status-transform.ts

import { RenderTree } from '@surface/components/modals/SproutFinishingRoom/json-render';
import { JobExecution } from '../types';

export function jobExecutionToRenderTree(execution: JobExecution): RenderTree {
  return {
    type: 'root',
    children: [
      {
        type: 'JobPhaseIndicator',
        props: {
          phase: execution.status,
          startedAt: execution.startedAt,
          completedAt: execution.completedAt,
        },
      },
      {
        type: 'JobProgressBar',
        props: {
          itemsProcessed: execution.itemsProcessed || 0,
          itemsTotal: execution.itemsTotal || 0,
          percentage: execution.percentage || 0,
        },
      },
      {
        type: 'JobMetricRow',
        props: {
          metrics: [
            { label: 'Duration', value: `${execution.durationSeconds}s`, color: 'default' },
            { label: 'Errors', value: execution.errors, color: execution.errors > 0 ? 'red' : 'green' },
            { label: 'Run ID', value: execution.runId.slice(0, 8), color: 'default' },
          ],
        },
      },
      // ... more components based on execution status
    ],
  };
}
```

**Usage in UI Component**

```typescript
// src/bedrock/consoles/ExperienceConsole/components/JobExecutionStatus.tsx

import React from 'react';
import { Renderer } from '@surface/components/modals/SproutFinishingRoom/json-render';
import { JobStatusCatalog } from '../json-render/job-status-catalog';
import { JobStatusRegistry } from '../json-render/job-status-registry';
import { jobExecutionToRenderTree } from '../json-render/job-status-transform';

export function JobExecutionStatus({ execution }: { execution: JobExecution }) {
  const renderTree = jobExecutionToRenderTree(execution);

  return (
    <div className="bg-white p-4 rounded-lg border">
      <h3 className="text-lg font-semibold mb-4">Execution Status</h3>
      <Renderer
        tree={renderTree}
        registry={JobStatusRegistry}
        catalog={JobStatusCatalog}
      />
    </div>
  );
}
```

---

## Architecture

### 4.1 Integration with EXPERIENCE_TYPE_REGISTRY

```typescript
// Addition to src/bedrock/types/experience.types.ts

'job-config': {
  type: 'job-config',
  label: 'Job Configuration',
  icon: 'schedule',
  description: 'Configure scheduled batch jobs and their execution parameters',
  defaultPayload: DEFAULT_JOB_CONFIG_PAYLOAD,
  editorComponent: 'JobConfigEditor',
  allowMultipleActive: true,  // INSTANCE pattern
  routePath: '/bedrock/experience',
  color: '#FF9800',  // Orange for operations
  cardComponent: 'JobConfigCard',
  dataHookName: 'useJobConfigData',
  searchFields: [
    'meta.title',
    'meta.description',
    'payload.jobType',
    'payload.displayName',
  ],
  metrics: [
    {
      id: 'enabled',
      label: 'Enabled',
      icon: 'check_circle',
      query: 'count(where: payload.schedule.isEnabled=true)',
      typeFilter: 'job-config',
    },
    {
      id: 'failed',
      label: 'Failed',
      icon: 'error',
      query: 'count(where: payload.lastExecution.status=failed)',
      typeFilter: 'job-config',
    },
  ],
  filters: [
    {
      field: 'payload.jobType',
      label: 'Job Type',
      type: 'select',
      options: ['advancement-batch', 'signal-aggregation', 'notification-digest', 'orphan-cleanup', 'health-check'],
    },
    {
      field: 'payload.schedule.isEnabled',
      label: 'Enabled',
      type: 'select',
      options: ['true', 'false'],
    },
  ],
  sortOptions: [
    { field: 'payload.lastExecution.completedAt', label: 'Last Run', direction: 'desc' },
    { field: 'payload.schedule.cronExpression', label: 'Schedule', direction: 'asc' },
  ],
} satisfies ExperienceTypeDefinition<JobConfigPayload>,
```

### 4.2 Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      JOB CONFIGURATION FLOW                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐   │
│   │ ExperienceConsole │  │ useJobConfigData │  │ Supabase     │   │
│   │ (Operator UI)│────▶│ (Data Hook)  │────▶│ job_configs  │   │
│   └──────────────┘     └──────────────┘     └──────┬───────┘   │
│                                                     │           │
│                                                     ▼           │
│                              ┌──────────────────────────────┐   │
│                              │      Job Executor Engine     │   │
│                              │      (src/core/jobs/)        │   │
│                              └──────────────────────────────┘   │
│                                          │                      │
│              ┌───────────────────────────┼───────────────────┐  │
│              ▼                           ▼                   ▼  │
│   ┌──────────────────┐   ┌──────────────────┐   ┌───────────┐  │
│   │AdvancementBatch  │   │ SignalAggregation│   │HealthCheck│  │
│   │ (existing)       │   │ (new)            │   │ (new)     │  │
│   └──────────────────┘   └──────────────────┘   └───────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Job Executor Engine

The Job Executor reads configuration from the database rather than hardcoded values:

```typescript
// src/core/jobs/jobExecutor.ts

export async function executeJob(
  supabase: SupabaseClientLike,
  jobConfigId: string
): Promise<JobExecutionResult> {
  // 1. Load job config from database
  const config = await loadJobConfig(supabase, jobConfigId);

  // 2. Apply execution limits
  const context: JobContext = {
    batchSize: config.payload.limits.batchSize,
    timeoutMs: config.payload.limits.timeoutSeconds * 1000,
    retryPolicy: config.payload.retry,
  };

  // 3. Route to appropriate job handler
  const handler = JOB_HANDLERS[config.payload.jobType];

  // 4. Execute with retry logic
  return executeWithRetry(handler, config.payload.parameters, context);
}
```

---

## 4.4 JobExecutor Pattern Definition

### 4.4.1 JobExecutor Interface

All job handlers must implement the `JobExecutor` interface:

```typescript
// src/core/jobs/jobExecutor.ts

/**
 * Execution context shared across all jobs
 */
export interface ExecutionContext {
  batchSize: number;
  timeoutMs: number;
  retryPolicy: RetryConfig;
  startedAt: string;
  jobConfigId: string;
}

/**
 * Result of job execution
 */
export interface JobResult {
  success: boolean;
  itemsProcessed: number;
  itemsSucceeded: number;
  itemsFailed: number;
  durationMs: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

/**
 * JobExecutor interface - All job handlers must implement
 */
export interface JobExecutor<T = unknown> {
  readonly type: JobType;
  execute(config: T, context: ExecutionContext): Promise<JobResult>;
}

/**
 * Job handler signature
 */
type JobHandler<T> = (config: T, context: ExecutionContext) => Promise<JobResult>;
```

### 4.4.2 JOB_HANDLERS Registry

New job types are added to the centralized `JOB_HANDLERS` registry:

```typescript
// src/core/jobs/registry.ts

import type { JobExecutor } from './jobExecutor';
import { advancementBatchExecutor } from './handlers/advancementBatch';
import { signalAggregationExecutor } from './handlers/signalAggregation';
import { notificationDigestExecutor } from './handlers/notificationDigest';
import { orphanCleanupExecutor } from './handlers/orphanCleanup';
import { healthCheckExecutor } from './handlers/healthCheck';

/**
 * JOB_HANDLERS registry - New job types add here
 * This prevents the anti-pattern where each job requires bespoke infrastructure
 */
export const JOB_HANDLERS = {
  'advancement-batch': advancementBatchExecutor,
  'signal-aggregation': signalAggregationExecutor,
  'notification-digest': notificationDigestExecutor,
  'orphan-cleanup': orphanCleanupExecutor,
  'health-check': healthCheckExecutor,
  // New jobs: Add handler here
} satisfies Record<JobType, JobExecutor>;

/**
 * Type-safe way to get a handler for a specific job type
 */
export function getJobHandler<T extends JobType>(
  type: T
): JobExecutor<JobConfigPayload[T]['parameters']> {
  const handler = JOB_HANDLERS[type];
  if (!handler) {
    throw new Error(`No handler registered for job type: ${type}`);
  }
  return handler;
}

/**
 * Check if a job type is supported
 */
export function isSupportedJobType(type: string): type is JobType {
  return type in JOB_HANDLERS;
}
```

### 4.4.3 Adding a New Job Type

To add a new job type, implement the handler and register it:

```typescript
// 1. Define handler in handlers/myNewJob.ts

export const myNewJobExecutor: JobExecutor<MyNewJobConfig> = {
  readonly type: 'my-new-job' as JobType,

  async execute(config: MyNewJobConfig, context: ExecutionContext): Promise<JobResult> {
    const started = Date.now();

    try {
      // Job-specific logic here
      const itemsProcessed = await processItems(config, context);

      return {
        success: true,
        itemsProcessed,
        itemsSucceeded: itemsProcessed,
        itemsFailed: 0,
        durationMs: Date.now() - started,
      };
    } catch (error) {
      return {
        success: false,
        itemsProcessed: 0,
        itemsSucceeded: 0,
        itemsFailed: 1,
        durationMs: Date.now() - started,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

// 2. Register in JOB_HANDLERS registry
export const JOB_HANDLERS = {
  // ... existing handlers
  'my-new-job': myNewJobExecutor,
} satisfies Record<JobType, JobExecutor>;

// 3. Add to JobType union in job-config.ts
export type JobType =
  | 'advancement-batch'
  | 'signal-aggregation'
  | 'notification-digest'
  | 'orphan-cleanup'
  | 'health-check'
  | 'my-new-job';  // ← Add here
```

### 4.4.4 Handler Contract Requirements

Every job handler MUST:

1. **Respect execution context** - Use provided batchSize, timeout, retry policy
2. **Return structured result** - Success/failure, counts, duration, optional error
3. **Handle errors gracefully** - Catch exceptions and return failed result
4. **Be idempotent where possible** - Safe to retry without side effects
5. **Log progress** - Console.log with job ID for observability

Example implementation:

```typescript
export const myJobExecutor: JobExecutor<MyConfig> = {
  readonly type: 'my-job',

  async execute(config: MyConfig, context: ExecutionContext): Promise<JobResult> {
    const { batchSize, timeoutMs } = context;
    const started = Date.now();

    console.log(`[MyJob] Starting with batchSize=${batchSize}, timeout=${timeoutMs}ms`);

    try {
      // Respect timeout
      const result = await Promise.race([
        processBatch(config.parameters, batchSize),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Job timeout')), timeoutMs)
        ),
      ]);

      console.log(`[MyJob] Completed successfully: ${result.count} items`);

      return {
        success: true,
        itemsProcessed: result.count,
        itemsSucceeded: result.count,
        itemsFailed: 0,
        durationMs: Date.now() - started,
        metadata: { processedItems: result.items },
      };
    } catch (error) {
      console.error(`[MyJob] Failed:`, error);

      return {
        success: false,
        itemsProcessed: 0,
        itemsSucceeded: 0,
        itemsFailed: 1,
        durationMs: Date.now() - started,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};
```

---

## 4.5 UX Mental Models & Visual Design

### 4.5.1 Mental Model: Two Types of Configuration

The ExperienceConsole will present two fundamentally different types of configuration:

**AdvancementRule Configuration (BLUE)**
- **Purpose:** Define WHEN sprouts advance tiers
- **Mental Model:** "Rules that trigger advancement"
- **User Action:** Create conditions (X signals → advance from Tier A to Tier B)
- **Visual Identity:** Lightning bolt (⚡) - rules trigger like lightning

**Job Configuration (ORANGE)**
- **Purpose:** Define HOW jobs execute
- **Mental Model:** "Schedules that run operations"
- **User Action:** Configure timing (cron), limits (batch size), retry policies
- **Visual Identity:** Hourglass (⌛) - batch processing with time progression

### 4.5.2 Visual Differentiation Requirements

**Color Coding (Non-negotiable):**

```css
/* AdvancementRule - Blue palette */
:root {
  --advancement-rule-primary: #1976D2;
  --advancement-rule-bg: rgba(25, 118, 210, 0.1);
  --advancement-rule-border: #1976D2;
  --advancement-rule-accent: #2196F3;
}

/* JobConfig - Orange palette (refined for better contrast) */
:root {
  --job-config-primary: #E65100;
  --job-config-bg: rgba(230, 81, 0, 0.08);
  --job-config-border: rgba(230, 81, 0, 0.3);
  --job-config-accent: #FF6F00;
}
```

**Card Styling:**

```css
/* AdvancementRule cards */
.card--advancement-rule {
  border-left: 4px solid var(--advancement-rule-border);
  background: linear-gradient(
    to right,
    var(--advancement-rule-bg),
    white
  );
}

.card--advancement-rule .card-header {
  color: var(--advancement-rule-primary);
}

/* JobConfig cards */
.card--job-config {
  border-left: 4px solid var(--job-config-border);
  background: linear-gradient(
    to right,
    var(--job-config-bg),
    white
  );
}

.card--job-config .card-header {
  color: var(--job-config-primary);
}
```

**Iconography:**

```typescript
// AdvancementRule
const ADVANCEMENT_RULE_CONFIG = {
  icon: '⚡', // lightning
  color: '#1976D2',
  label: 'Advancement Rules',
  tooltip: 'Configure when sprouts advance between tiers',
};

// JobConfig
const JOB_CONFIG = {
  icon: 'hourglass_empty', // hourglass - conveys batch processing
  color: '#E65100',
  label: 'Job Configurations',
  tooltip: 'Configure scheduled batch jobs and execution parameters',
};
```

### 4.5.3 Navigation Structure

```
ExperienceConsole
├── 📊 Analytics Dashboard
│   ├── Signal Metrics
│   ├── Advancement Stats
│   └── Usage Analytics
│
├── ⚡ Advancement Rules (BLUE)
│   ├── Rule: Seed → Sprout
│   ├── Rule: Sprout → Plant
│   └── [Create Rule]
│
└── ⏰ Job Configurations (ORANGE)
    ├── Job: advancement-batch
    ├── Job: signal-aggregation
    └── [Create Job]
```

**Tab Design:**

```typescript
// Navigation tabs with color coding
<div className="console-tabs">
  <Tab
    id="analytics"
    icon="📊"
    label="Analytics"
    active={false}
  />

  <Tab
    id="advancement-rules"
    icon="⚡"
    label="Advancement Rules"
    active={true}
    color="#1976D2"  // Blue
  />

  <Tab
    id="job-configs"
    icon="hourglass_empty"
    label="Job Configurations"
    active={false}
    color="#E65100"  // Orange
  />
</div>
```

### 4.5.4 Tooltip Explanations

**AdvancementRule Tooltip:**
```
💡 Advancement Rules define WHEN sprouts advance between tiers.

Example: "When a sprout has 10+ retrievals and 5+ citations,
advance from Seed to Sprout tier."

Click to configure tier advancement logic.
```

**JobConfig Tooltip:**
```
⌛ Job Configurations define HOW batch jobs execute.

Example: "Run advancement batch daily at 2am UTC with batch size 100,
retrying failed items up to 3 times."

Click to configure job schedules and parameters.
```

### 4.5.5 Grid View Differentiation

**Filtering by Type:**

```typescript
<div className="grid-toolbar">
  <FilterButton
    active={true}
    color="#1976D2"
    icon="⚡"
    label="Advancement Rules"
    count={12}
  />

  <FilterButton
    active={false}
    color="#E65100"
    icon="hourglass_empty"
    label="Job Configurations"
    count={4}
  />
</div>
```

**Card Preview Differences:**

```typescript
// AdvancementRule card preview
<Card type="advancement-rule">
  <Header>
    <Icon>⚡</Icon>
    <Title>Seed → Sprout</Title>
    <Badge color="blue">3 conditions</Badge>
  </Header>
  <Body>
    <ConditionList>
      • retrievals ≥ 10
      • citations ≥ 5
    </ConditionList>
  </Body>
</Card>

// JobConfig card preview
<Card type="job-config">
  {/* Tier 1: Critical - Always visible */}
  <Header>
    <Icon>hourglass_empty</Icon>
    <Title>Advancement Batch</Title>
    <StatusBadge status="success">Healthy</StatusBadge>
  </Header>

  {/* Tier 2: Summary - Collapsible */}
  <Body>
    <SummarySection>
      <NextRunInfo>
        Next: Tomorrow 2:00 AM UTC
      </NextRunInfo>
      <LastRunInfo>
        Last: ✅ Success (142 items, 2m 34s)
      </LastRunInfo>
    </SummarySection>

    {/* Collapsible details */}
    <details className="card-details">
      <summary>View configuration</summary>
      <ConfigDetails>
        Schedule: Daily at 2:00 AM
        Batch size: 100 items
        Retry: 3 attempts
      </ConfigDetails>
    </details>
  </Body>

  {/* Tier 3: Actions */}
  <Footer>
    <Button variant="secondary">Configure</Button>
    <Button variant="primary" color="orange">Run Now</Button>
  </Footer>
</Card>
```

### 4.5.6 Editor Tab Interface

The JobConfigEditor uses a **tabbed interface** to separate configuration from monitoring:

```typescript
<div className="job-config-editor">
  <Tabs>
    <Tab name="config" icon="settings">
      Configuration
    </Tab>
    <Tab name="status" icon="monitor_heart">
      Execution Status
    </Tab>
  </Tabs>

  {/* Tab content */}
  <TabContent name="config">
    {/* Traditional React forms for editing */}
    <FormField>
      <Label>Cron Expression</Label>
      <BufferedInput value={cronExpression} />
    </FormField>
    <FormField>
      <Label>Batch Size</Label>
      <BufferedInput type="number" value={batchSize} />
    </FormField>
  </TabContent>

  <TabContent name="status">
    {/* Json-render status display */}
    <Renderer
      tree={jobExecutionToRenderTree(latestExecution)}
      registry={JobStatusRegistry}
      catalog={JobStatusCatalog}
    />
  </TabContent>
</div>
```

**Rationale:** Tabs clearly distinguish the two rendering paradigms (React forms vs json-render status) and provide better UX than a visual divider.

### 4.5.7 Error State Visual Language

**3-Tier Severity System:**

```css
/* Warning - Amber */
.status--warning {
  border-left: 4px solid #FFA000;
  background: rgba(255, 160, 0, 0.08);
}

/* Error - Red */
.status--error {
  border-left: 4px solid #D32F2F;
  background: rgba(211, 47, 47, 0.08);
}

/* Critical - Dark Red */
.status--critical {
  border-left: 4px solid #B71C1C;
  background: rgba(183, 28, 28, 0.12);
  animation: pulse 2s infinite;
}
```

**Scenarios:**
- **Warning:** Retrying, degraded performance, nearing timeout
- **Error:** Failed execution, invalid config, connection error
- **Critical:** Job disabled after repeated failures

### 4.5.8 Living Glass Canonical Elements

**5 Visual Elements to Preserve:**

1. **Orange Operational Color** (`#E65100`) - Consistent for ALL operational configurations
2. **Hourglass Iconography** - Jobs use `hourglass_*` variants, never generic "clock"
3. **3-Tier Card Hierarchy** - Critical → Summary → Actions structure
4. **Tabbed Editor Pattern** - Configuration | Status for all object types
5. **Json-Render Component Vocabulary** - Canonical component names (JobPhaseIndicator, etc.)

**Migration Path:**
```
v1.0 (Current): Tabbed editor with separate sections
v1.5: Unified object view (tabs become visual sections)
v2.0: Living Glass - configuration becomes declarative data
```

These elements create a **design language** that survives implementation changes.

### 4.5.9 Human-Readable Schedule Display

**Design Principle:** Cron expressions are too technical for operational visibility.

**Transform Function:**
```typescript
function cronToHuman(cron: string): string {
  const patterns = {
    '0 2 * * *': 'Daily at 2:00 AM',
    '*/15 * * * *': 'Every 15 minutes',
    '0 */6 * * *': 'Every 6 hours',
    '0 0 * * 0': 'Weekly on Sunday',
  };

  return patterns[cron] || cron;
}
```

**Card Display:**
```
Next: Tomorrow 2:00 AM UTC
(Not: Next: 0 2 * * *)
```

**Rationale:** Operators need quick status assessment, not technical cron syntax.

### 4.5.10 Mobile Responsive Design

**Layout Rules:**
- **Desktop (≥1024px):** Two-column layout (config left, status right)
- **Tablet (768-1023px):** Stacked tabs (config above, status below)
- **Mobile (≤767px):** Accordion layout with sticky actions

**Mobile Structure:**
```
┌────────────────────┐
│ ⚙️ Job Name       │
│ Status: ✓ Healthy │
│ ───────────────── │
│                    │
│ ┌─ Configuration ─┐ │
│ │ [Form Fields]   │ │
│ └─────────────────┘ │
│ [Save] [Cancel]    │
│ ───────────────── │
│                    │
│ ┌─ Status ─┐      │
│ │ [Json-r] │      │
│ └──────────┘      │
│ [Refresh]          │
└────────────────────┘
```

**Touch Targets:** All buttons ≥44px for accessibility.

### 4.5.11 Living Glass Migration Consideration

**Future State: Living Glass Integration**

When migrating to Living Glass (the declarative glass interface):

1. **Portable Configurations** - All job configurations are already JSON in database
2. **Lens Reactive** - Job status displays can be lens-specific
3. **Narrative Integration** - Job execution stories in Terminal history
4. **Composable** - Json-render components work in both ExperienceConsole and Living Glass

**Design Considerations:**

- Job configurations stored as declarative JSON (already done ✅)
- Status displays use json-render pattern (already defined ✅)
- Component library reusable across interfaces ✅
- No hardcoded behavior in UI components ✅

---

## 4.6 Migration Strategy

### 4.6.1 Migration Phases

**Phase 1: Infrastructure (Week 1)**
- Create `job_configs` and `job_executions` tables
- Implement `useJobConfigData` hook
- Add JobConfig to EXPERIENCE_TYPE_REGISTRY
- Build UI components (Card + Editor)

**Phase 2: Dual-Read Implementation (Week 2)**
- Modify `advancementBatchJob.ts` to read from BOTH sources:
  - Primary: Database config (if exists)
  - Fallback: Legacy hardcoded values
- Log which source is being used
- Operators can create/modify configs in UI

**Phase 3: Migration Window (Week 2-3)**
- Seed database with default config matching current hardcoded values
- Monitor job execution logs for config usage
- Validate all parameters match legacy behavior

**Phase 4: Legacy Removal (Week 4)**
- Remove dual-read logic from advancementBatchJob.ts
- Delete hardcoded defaults
- Update comments to reference database config

### 4.6.2 Dual-Read Implementation

```typescript
// src/core/jobs/advancementBatchJob.ts

export async function executeAdvancementBatch(
  supabase: SupabaseClientLike,
  options: BatchJobOptions = {}
): Promise<BatchJobSummary> {
  // Try to load from database first
  const dbConfig = await fetchJobConfig(supabase, 'advancement-batch');
  const hasDbConfig = dbConfig && dbConfig.payload.schedule.isEnabled;

  if (hasDbConfig) {
    console.log('[AdvancementBatch] Using database config:', {
      schedule: dbConfig.payload.schedule,
      limits: dbConfig.payload.limits,
    });

    return executeWithConfig(supabase, dbConfig, options);
  }

  // FALLBACK: Legacy hardcoded values
  console.warn('[AdvancementBatch] No database config found, using legacy defaults');
  return executeLegacy(supabase, options);
}

/**
 * Execute with database configuration
 */
async function executeWithConfig(
  supabase: SupabaseClientLike,
  config: GroveObject<JobConfigPayload>,
  options: BatchJobOptions
): Promise<BatchJobSummary> {
  const { payload } = config;

  // Merge with options (options override config)
  const effectiveOptions: BatchJobOptions = {
    batchSize: payload.limits.batchSize,
    signalPeriod: payload.parameters.signalPeriod || 'all_time',
    dryRun: payload.parameters.dryRun || false,
    ...options,
  };

  return executeAdvancementLogic(supabase, effectiveOptions);
}

/**
 * Execute with legacy hardcoded defaults
 */
async function executeLegacy(
  supabase: SupabaseClientLike,
  options: BatchJobOptions
): Promise<BatchJobSummary> {
  console.warn('[AdvancementBatch] LEGACY MODE - update to database config');

  // These match the OLD hardcoded defaults
  const legacyOptions: BatchJobOptions = {
    batchSize: 100,        // OLD default
    signalPeriod: 'all_time',  // OLD default
    dryRun: false,        // OLD default
    ...options,
  };

  return executeAdvancementLogic(supabase, legacyOptions);
}
```

### 4.6.3 Database Seeding

```sql
-- Seed default config matching current hardcoded values
INSERT INTO job_configs (meta, payload)
VALUES (
  '{
    "id": "advancement-batch",
    "type": "job-config",
    "version": "1.0",
    "title": "Daily Advancement Batch",
    "description": "Daily evaluation of sprouts for tier advancement"
  }'::jsonb,
  '{
    "jobType": "advancement-batch",
    "schedule": {
      "cronExpression": "0 2 * * *",
      "timezone": "UTC",
      "isEnabled": true
    },
    "retry": {
      "maxAttempts": 3,
      "backoffStrategy": "exponential",
      "initialDelaySeconds": 60,
      "maxDelaySeconds": 3600
    },
    "limits": {
      "batchSize": 100,
      "timeoutSeconds": 3600,
      "maxConcurrent": 1
    },
    "parameters": {
      "signalPeriod": "all_time",
      "dryRun": false
    },
    "notifications": {
      "onSuccess": false,
      "onFailure": true,
      "channels": ["log"]
    }
  }'::jsonb
);
```

### 4.6.4 Rollback Procedure

**Emergency Rollback Steps:**

```typescript
// Step 1: Disable database config
// Operators can do this via UI or SQL:
UPDATE job_configs
SET payload = jsonb_set(payload, '{schedule,isEnabled}', 'false')
WHERE meta->>'id' = 'advancement-batch';

// Step 2: advancementBatchJob.ts automatically falls back to legacy
// The dual-read logic handles this automatically
// No code change needed

// Step 3: Operators notified
// Status display shows:
// "⚠️ Using legacy configuration - database config disabled"

// Step 4: Review logs for root cause
// Check:
// - Database connectivity
// - Config validation errors
// - Cron expression parsing errors
```

**Monitoring During Transition:**

```typescript
// Log entries to watch for:
console.log('[AdvancementBatch] Using database config:', config);
console.warn('[AdvancementBatch] No database config found, using legacy defaults');
console.error('[AdvancementBatch] Config validation failed:', error);

// Alert if legacy mode persists > 24 hours
if (Date.now() - lastDbConfigTime > 24 * 60 * 60 * 1000) {
  console.error('[AdvancementBatch] ALERT: Still using legacy config after 24 hours');
}
```

### 4.6.5 Success Criteria

**Migration Complete When:**

1. ✅ All advancement batch executions logged as "Using database config"
2. ✅ Zero executions logged as "No database config found"
3. ✅ Operators can successfully modify schedule via UI
4. ✅ Modified schedule takes effect within 1 cron cycle
5. ✅ Job execution history shows in ExperienceConsole
6. ✅ No errors in Cloud Run logs related to config loading

**Remove Legacy Code When:**

- All success criteria met for **7 consecutive days**
- No rollback has been triggered
- All operators trained on new UI
- Documentation updated

---

## User Stories

## User Stories

### US-1: Configure Advancement Job Schedule
**As an** operator
**I want to** change the advancement batch schedule to 3am instead of 2am
**So that** it runs after our overnight data sync completes

**Acceptance Criteria:**
```gherkin
Given I am viewing the Job Configuration for "Daily Advancement"
When I change the cron expression from "0 2 * * *" to "0 3 * * *"
And I click "Save Changes"
Then the job should be scheduled for 3am
And I should see confirmation "Schedule updated"
```

### US-2: Adjust Batch Size for Performance
**As an** operator
**I want to** reduce the batch size from 100 to 50
**So that** the job completes within the timeout window

**Acceptance Criteria:**
```gherkin
Given the advancement job is timing out with batch size 100
When I open the Job Configuration editor
And I change "Batch Size" to 50
And I click "Save Changes"
Then subsequent job runs should process 50 items per batch
```

### US-3: View Execution History
**As an** operator
**I want to** see why yesterday's job failed
**So that** I can diagnose and fix the issue

**Acceptance Criteria:**
```gherkin
Given a job execution failed yesterday
When I view the Job Configuration in the inspector
Then I should see the execution history with status "Failed"
And I should be able to click "View Logs" to see details
And I should be able to click "Retry" to rerun the failed job
```

### US-4: Disable Job Temporarily
**As an** operator
**I want to** disable the advancement job during maintenance
**So that** it doesn't interfere with database migrations

**Acceptance Criteria:**
```gherkin
Given the advancement job is enabled
When I toggle "Schedule Active" to off
And I save the configuration
Then the job should not run at its scheduled time
And the card should show "Disabled" status
```

### US-5: Manual Job Trigger
**As an** operator
**I want to** run the advancement job manually
**So that** I can verify a configuration change works

**Acceptance Criteria:**
```gherkin
Given I have updated a Job Configuration
When I click "Run Now"
Then the job should execute immediately with current configuration
And I should see real-time status in the inspector
And the execution history should update on completion
```

---

## DEX Alignment

### Pillar I: Declarative Sovereignty

| Requirement | Implementation | Verification |
|-------------|----------------|--------------|
| Domain expertise in configuration | JobConfigPayload defines all job parameters | Operator can change schedule without code |
| Non-technical edit capability | ExperienceConsole provides GUI editing | No JSON editing required |
| Configuration drives behavior | Job Executor reads config at runtime | Changing config changes behavior |

**Test:** Can an operator change the advancement batch time from 2am to 3am by editing the ExperienceConsole, without recompiling?
**Answer:** Yes - they edit `schedule.cronExpression` in the JobConfigEditor.

### Pillar II: Capability Agnosticism

| Requirement | Implementation | Verification |
|-------------|----------------|--------------|
| No model assumptions | Job execution is pure TypeScript | No LLM calls in job executor |
| Graceful degradation | Retry policy handles transient failures | Failed jobs don't crash system |
| Validated outputs | Execution results stored with status | Results are checkable facts |

**Test:** Does the system break if a job fails? Or does the Trellis catch it?
**Answer:** The retry policy provides structured recovery; failures are logged, not swallowed.

### Pillar III: Provenance as Infrastructure

| Requirement | Implementation | Verification |
|-------------|----------------|--------------|
| Attribution chain | `lastExecution` tracks run details | Every execution has a `runId` |
| Audit trail | `AdvancementEvent` records decisions | Who/what/when for every advancement |
| Configuration history | GroveObject versioning | Previous configs recoverable |

**Test:** Can we trace why sprout X was advanced on date Y?
**Answer:** Yes - `AdvancementEvent.ruleId` links to config; `JobConfig.lastExecution.runId` links to run.

### Pillar IV: Organic Scalability

| Requirement | Implementation | Verification |
|-------------|----------------|--------------|
| Structure precedes growth | JobType union is extensible | Adding new job types doesn't restructure |
| Pattern reuse | EXPERIENCE_TYPE_REGISTRY pattern | Same Card/Editor pattern as other types |
| Guided wandering | Job parameters are type-specific | Each job type can have unique config |

**Test:** Can we add a new job type (e.g., `audit-log-export`) without restructuring the system?
**Answer:** Yes - add to JobType union, add to JOB_HANDLERS map, create parameters interface.

---

## Substrate Potential

### What This Enables

**7.1 Unified Job Dashboard**
With job configs as Grove Objects, we can build a dedicated Jobs dashboard showing:
- All scheduled jobs in a timeline view
- Real-time execution status
- Cross-job dependency visualization

**7.2 Job Templates**
Operators can duplicate and modify job configs to create variations:
- "Daily Advancement (Production)" vs "Daily Advancement (Staging)"
- Per-lifecycle-model advancement jobs

**7.3 Webhook Integration**
Job completion events can trigger webhooks:
- Slack notifications on failure
- Analytics pipeline triggers
- Cross-system orchestration

**7.4 Agent-Triggered Jobs**
Future AI agents can request job execution:
- "The advancement criteria seem miscalibrated - should we run a dry-run to check?"
- Jobs become capabilities agents can invoke

**7.5 Cross-Field Job Portability**
Job configurations can be packaged and shared between Fields:
- Legal Field might have "Document Aging" job
- Research Field might have "Citation Refresh" job
- Configurations are portable JSON

---

## Acceptance Criteria

### Structural (Schema & Types)
- [ ] AC-S1: `JobConfigPayload` interface defined in `src/core/schema/job-config.ts`
- [ ] AC-S2: `job-config` entry added to `EXPERIENCE_TYPE_REGISTRY`
- [ ] AC-S3: `GroveObjectType` union includes `'job-config'`
- [ ] AC-S4: Default payload factory function exists
- [ ] AC-S5: Type guards for `isJobConfigPayload` exist

### Data Layer
- [ ] AC-D1: `useJobConfigData` hook implements `CollectionDataResult<JobConfigPayload>`
- [ ] AC-D2: Hook provides `getEnabledJobs()` helper
- [ ] AC-D3: Hook provides `getJobsByType(type)` helper
- [ ] AC-D4: Hook provides `updateLastExecution(id, result)` helper

### UI Components
- [ ] AC-U1: `JobConfigCard` renders job status, schedule, and last run
- [ ] AC-U2: `JobConfigEditor` provides all payload field editing
- [ ] AC-U3: "Run Now" button triggers immediate execution
- [ ] AC-U4: Execution history section shows last 10 runs
- [ ] AC-U5: Cron expression has helper tooltip explaining syntax

### json-render Integration (1.0 Architecture)
- [ ] AC-J1: `JobStatusCatalog` defined with 6 component schemas
- [ ] AC-J2: `JobStatusRegistry` implemented for all components
- [ ] AC-J3: `jobExecutionToRenderTree()` transforms domain → render tree
- [ ] AC-J4: `JobExecutionStatus` component uses `<Renderer />`
- [ ] AC-J5: Status section of JobConfigEditor uses json-render

### Job Executor Integration
- [ ] AC-E1: `advancementBatchJob.ts` reads config from database
- [ ] AC-E2: Retry logic applies configured policy
- [ ] AC-E3: Batch size respects configured limit
- [ ] AC-E4: Timeout respects configured value
- [ ] AC-E5: Execution results update `lastExecution` in config

### Functional
- [ ] AC-F1: Changing schedule in UI changes actual job schedule
- [ ] AC-F2: Disabling job prevents scheduled execution
- [ ] AC-F3: "Run Now" executes with current config (not stale)
- [ ] AC-F4: Failed execution shows in history with error details

### Migration
- [ ] AC-M1: Existing hardcoded values become default config
- [ ] AC-M2: Current advancement job continues working during transition
- [ ] AC-M3: No breaking changes to existing API endpoints

---

## Non-Goals

**Explicitly NOT building in this sprint:**

| Non-Goal | Reason | Future Sprint |
|----------|--------|---------------|
| Job orchestration (DAGs) | Scope creep | S8+ if needed |
| External scheduler (Temporal, etc.) | Premature complexity | Evaluate after MVP |
| Real-time job streaming UI | Nice-to-have | S8+ polish |
| Job-level RBAC | Requires auth refactor | After multi-tenant |
| Notification integrations | Separate concern | S8-notifications |
| Job versioning/rollback | Complex state | After initial validation |
| Cross-job dependencies | Orchestration territory | S8+ if needed |

---

## Dependencies and Risks

### Dependencies

| Dependency | Type | Status | Mitigation |
|------------|------|--------|------------|
| S7 Advancement Batch | Code | Complete | Job config wraps existing implementation |
| EXPERIENCE_TYPE_REGISTRY | Pattern | Complete | Follow established pattern |
| Supabase job_configs table | Data | Required | Migration script needed |
| ExperienceConsole polymorphic | UI | Complete | Registers like other types |
| json-render infrastructure | Pattern | Complete | SignalsCatalog pattern available |

### Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Cron parsing edge cases | Medium | Low | Use proven cron library (e.g., cron-parser) |
| Config-code drift | Medium | Medium | Single source of truth in database |
| Timezone confusion | Medium | Medium | Always store/display with explicit timezone |
| Execution during edit | Low | Medium | Lock pattern or optimistic concurrency |
| Job executor performance | Low | High | Profile before production; keep batch small |

### Open Questions

1. **Q:** Should job execution be synchronous (wait for result) or async (return immediately)?
   **Recommendation:** Async with polling - prevents UI timeout on long jobs

2. **Q:** Where should execution logs live?
   **Recommendation:** Separate `job_executions` table with foreign key to config; truncate old entries

3. **Q:** How do we handle schedule changes mid-execution?
   **Recommendation:** Running job completes with old config; next run uses new config

4. **Q:** Should job configs be SINGLETON (one config per job type) or INSTANCE (multiple configs allowed)?
   **Recommendation:** Start with SINGLETON (one advancement batch config); allow INSTANCE for future flexibility

5. **Q:** What notification channels are MVP?
   **Recommendation:** Log only in v1; email/webhook in v1.1 based on demand

6. **Q:** Should operators be able to create new job types, or only configure existing ones?
   **Recommendation:** Only configure existing ones; new job types require code changes

---

## Implementation Phases

### Phase 1: Schema & Types (0.5 day)
- Define `JobConfigPayload` and related types
- Add to `EXPERIENCE_TYPE_REGISTRY`
- Create default payload factory

### Phase 2: Data Layer (0.5 day)
- Create `useJobConfigData` hook
- Implement CRUD + domain helpers
- Add Supabase migration for `job_configs` table

### Phase 3: UI Components (1 day)
- `JobConfigCard` for grid view
- `JobConfigEditor` for inspector
- Register components in console factory

### Phase 4: json-render Status Display (0.5 day)
- `JobStatusCatalog` with 6 components
- `JobStatusRegistry` implementations
- `jobExecutionToRenderTree()` transform

### Phase 5: Executor Integration (1 day)
- Refactor `advancementBatchJob.ts` to read config
- Create generic job executor wrapper
- Implement retry logic with backoff

### Phase 6: Testing & Polish (0.5 day)
- E2E tests for config → execution flow
- Manual QA of UI workflows
- Documentation updates

**Total Estimate:** 4 days

---

## Appendix A: Jobs That Would Benefit

| Job | Current State | With JobConfig |
|-----|---------------|----------------|
| **Advancement Batch** | Hardcoded in `advancementBatchJob.ts` | Configurable schedule, batch size, tiers |
| **Signal Aggregation** | Manual/hypothetical | Scheduled rollup of signal data |
| **Notification Digest** | Not implemented | Daily operator summary emails |
| **Orphan Cleanup** | Not implemented | Archive old events, cleanup orphans |
| **Health Checks** | Ad-hoc | Periodic system validation |
| **RAG Index Refresh** | Manual | Scheduled re-indexing of knowledge |
| **Usage Analytics** | Not implemented | Aggregate telemetry data |

---

## Appendix B: Critical Files

- **C:\GitHub\the-grove-foundation\src\core\schema\job-config.ts** - JobConfigPayload schema and types
- **C:\GitHub\the-grove-foundation\src\bedrock\types\experience.types.ts** - Registry integration
- **C:\GitHub\the-grove-foundation\src\core\jobs\advancementBatchJob.ts** - Refactor to read config
- **C:\GitHub\the-grove-foundation\src\bedrock\consoles\ExperienceConsole\useAdvancementRuleData.ts** - Hook pattern reference
- **C:\GitHub\the-grove-foundation\src\bedrock\consoles\ExperienceConsole\FeatureFlagEditor.tsx** - Editor pattern reference
- **C:\GitHub\the-grove-foundation\src\bedrock\consoles\ExperienceConsole\json-render\signals-catalog.ts** - json-render pattern reference

---

*Product Brief for S7.5-SL-JobConfigSystem*
*Grove Foundation - Knowledge as Observable System (Phase 4)*
*Declarative Job Infrastructure for DEX Compliance*
