# Batch Job Analysis for S7.5 JobConfigSystem

**Date:** 2026-01-16
**Purpose:** Identify all batch jobs and scheduled operations for configuration via JobConfigSystem

---

## Executive Summary

Analysis of the Grove codebase reveals **2 distinct batch job patterns** requiring configuration:

1. **Active Scheduled Jobs** (1 identified)
2. **Disabled Scheduled Jobs** (3 identified)

All are excellent candidates for the JobConfigSystem to make configurable via ExperienceConsole.

---

## Identified Batch Jobs

### 1. Advancement Batch Job (ACTIVE)

**File:** `src/core/jobs/advancementBatchJob.ts`

**Current State:**
- ✅ **Active** - Daily batch job for automatic tier advancement
- 🔴 **Hardcoded** - Schedule, batch size, and retry policy buried in code
- 📊 **Audit Trail** - Full provenance with signal snapshots

**Hardcoded Parameters:**
```typescript
// Line 118-119: Default options
batchSize = 100,           // No UI control
signalPeriod = 'all_time', // No UI control
dryRun = false,            // No UI control

// Schedule (likely in cron config, not in code)
Schedule: Daily at 2am UTC (inferred)
```

**Configurable Opportunities:**
- Schedule (cron expression)
- Batch size (currently 100)
- Signal period (all_time, last_30d, last_7d)
- Dry run mode
- Lifecycle model filtering
- Tier filtering
- Retry policy (not currently implemented)
- Timeout (not currently implemented)

**Database Tables:**
- `advancement_rules` - Rule configuration
- `sprouts` - Sprout data
- `advancement_events` - Audit trail

---

### 2. Signal Aggregation Jobs (DISABLED)

**File:** `supabase/migrations/017_sprout_signal_aggregation_engine.sql`

**Current State:**
- ❌ **Disabled** - pg_cron schedules commented out
- 📋 **Ready** - Infrastructure exists, just needs enabling
- 🔄 **3 Schedules** - Different periods for different aggregation types

**Disabled Cron Jobs:**
```sql
-- Refresh all_time aggregations every 15 minutes
SELECT cron.schedule(
  'refresh-sprout-aggregations-all-time',
  '*/15 * * * *',
  $$SELECT refresh_sprout_aggregations(NULL, 'all_time')$$
);

-- Refresh last_7d aggregations every hour
SELECT cron.schedule(
  'refresh-sprout-aggregations-7d',
  '0 * * * *',
  $$SELECT refresh_sprout_aggregations(NULL, 'last_7d')$$
);

-- Refresh last_30d aggregations every 6 hours
SELECT cron.schedule(
  'refresh-sprout-aggregations-30d',
  '0 */6 * * *',
  $$SELECT refresh_sprout_aggregations(NULL, 'last_30d')$$
);
```

**Configurable Opportunities:**
- Enable/disable each schedule individually
- Modify cron expressions
- Batch size for aggregation
- Timeout settings
- Retry policy
- Notification settings

**Database Functions:**
- `refresh_sprout_aggregations(sprout_id, period)` - Core aggregation
- `refresh_signal_aggregations(period)` - API-callable wrapper

---

## Queue Consumer Pattern (NOT a Batch Job)

**File:** `src/explore/services/research-queue-consumer.ts`

**Pattern:** Pull-based polling (not scheduled)
- **Poll Interval:** 5000ms (5 seconds) - configurable
- **Max Concurrent:** 1 - configurable
- **Trigger:** Polling loop, not cron

**Assessment:** Different architectural pattern from scheduled batch jobs. Not a candidate for JobConfigSystem.

---

## Recommended JobConfigSystem Integration

### Phase 1: Core Infrastructure
1. Create `job_configs` and `job_executions` tables
2. Implement `useJobConfigData` hook
3. Build ExperienceConsole integration

### Phase 2: Migrate Advancement Job
1. Extract hardcoded parameters from `advancementBatchJob.ts`
2. Create JobConfig for advancement-batch
3. Wire to ExperienceConsole for configuration

### Phase 3: Enable Aggregation Jobs
1. Create JobConfigs for 3 aggregation schedules
2. Replace commented pg_cron with database-driven scheduling
3. Add to ExperienceConsole for operator control

---

## Job Types for JobConfigPayload

```typescript
type JobType =
  | 'advancement-batch'        // Daily tier advancement
  | 'signal-aggregation-all'   // 15-min all_time aggregation
  | 'signal-aggregation-7d'     // Hourly last_7d aggregation
  | 'signal-aggregation-30d';   // 6-hour last_30d aggregation
```

---

## Configurable Parameters Matrix

| Parameter | advancement-batch | signal-aggregation-* |
|-----------|-----------------|---------------------|
| **Schedule** | ✅ Cron | ✅ Cron |
| **Batch Size** | ✅ 100 default | ✅ Configurable |
| **Timeout** | 🔴 Not implemented | 🔴 Not implemented |
| **Retry Policy** | 🔴 Not implemented | 🔴 Not implemented |
| **Enabled Flag** | ✅ Rule-based | 🔴 pg_cron only |
| **Dry Run** | ✅ Supported | ❌ Not applicable |
| **Notifications** | 🔴 Console only | 🔴 Not implemented |

---

## Strategic Value

### For Operators
- **Schedule Changes** - Adjust batch timing without code deploys
- **Resource Control** - Modify batch sizes for load management
- **Debugging** - Enable dry-run mode for testing
- **Monitoring** - View execution history and status

### For DEX Architecture
- **Declarative Sovereignty** - Job behavior in config, not code
- **Provenance** - Full audit trail in job_executions table
- **Capability Agnostic** - Same jobs regardless of underlying model
- **Organic Scalability** - Add new job types without infrastructure changes

---

## Next Steps

1. ✅ **Schema Design** - JobConfigPayload with job-specific parameters
2. ✅ **Database Migration** - job_configs + job_executions tables
3. ⏳ **ExperienceConsole** - JobConfigCard + JobConfigEditor
4. ⏳ **Json-render Status** - JobStatusCatalog for execution display
5. ⏳ **Migration Plan** - Extract parameters from advancementBatchJob.ts
6. ⏳ **Enable Aggregation** - Wire disabled pg_cron to database config

---

**Analysis Complete:** 2026-01-16
**Total Jobs Identified:** 4 (1 active, 3 disabled)
**Recommended for S7.5:** All 4 jobs
