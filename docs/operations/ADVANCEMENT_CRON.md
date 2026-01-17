# Advancement Batch Job - Production Operations

## Overview
Daily cron job that evaluates sprouts for tier advancement based on observable signals from S6-ObservableSignals.

## Schedule
- **Frequency:** Daily
- **Time:** 2:00 AM UTC
- **Duration:** ~5-15 minutes (depending on sprout count)

## Deployment

### GitHub Actions (Chosen for this deployment)

The advancement batch job is deployed via GitHub Actions for reliability and visibility.

- **Workflow:** `.github/workflows/advancement-cron.yml`
- **Trigger:** GitHub Actions scheduler (UTC)
- **Secrets Required:** SUPABASE_URL, SUPABASE_ANON_KEY

### Workflow File: `.github/workflows/advancement-cron.yml`

```yaml
name: Daily Advancement Batch Job

on:
  schedule:
    - cron: '0 2 * * *' # 2:00 AM UTC daily
  workflow_dispatch: # Allow manual trigger

jobs:
  run-batch:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run advancement batch job
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        run: |
          # Import and run the batch job
          node -e "
            const { executeAdvancementBatch } = require('./src/core/jobs/advancementBatchJob.ts');
            executeAdvancementBatch({
              dryRun: false,
              fromTiers: ['sprout'],
              batchSize: 100
            }).then(() => process.exit(0)).catch(err => {
              console.error('Batch job failed:', err);
              process.exit(1);
            });
          "
```

## Configuration

### Environment Variables
```bash
SUPABASE_URL=https://cntzzxqgqsjzsvscunsp.supabase.co
SUPABASE_ANON_KEY=[redacted]
```

### Default Parameters
- `dryRun`: false (production mode)
- `fromTiers`: ['sprout'] (only evaluate sprouts)
- `batchSize`: 100 (process 100 sprouts per batch)

## Monitoring

### Success Indicators
- Job completes without errors
- `advancement_events` table receives new entries
- TierBadge shows sparkle indicator for advanced sprouts

### Failure Scenarios

1. **Signal data missing**: Job skips sprouts without S6 aggregations
2. **No matching rules**: Sprouts remain at current tier (expected behavior)
3. **Database connection errors**: Job fails, retry on next scheduled run

### Logs
- **GitHub Actions**: Check workflow run logs in Actions tab
- **Run URL**: https://github.com/twocash/the-grove-foundation/actions/workflows/advancement-cron.yml

## Manual Trigger

Run batch job manually for testing:

```bash
# Dry run (preview only)
npm run advancement:batch -- --dry-run

# Production run
npm run advancement:batch
```

## Rollback Procedure

If batch job advances sprouts incorrectly:

1. Open Experience Console → Advancement Rule type
2. Click "Bulk Rollback" button
3. Select time range (last 24 hours recommended)
4. Review affected sprouts
5. Confirm rollback

All advancements are logged in `advancement_events` table with full signal snapshots for audit trail.

## Related Sprints

- **S6-SL-ObservableSignals**: Signal aggregation source
- **S5-SL-LifecycleEngine**: Tier configuration
- **S8-SL-MultiModel**: Custom lifecycle models (future)

---

**Last Updated:** 2026-01-16
**Deployment Status:** Production Ready
