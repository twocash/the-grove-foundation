# Epic 0: Health Integration - Execution Prompt

**For**: Claude Code CLI
**Sprint**: Engagement Phase 2
**Epic**: 0 - Health Integration Foundation

---

## Context

You are implementing Epic 0 of the Engagement Phase 2 migration. This epic connects E2E test results to the Health system, establishing "testing as process" for subsequent migration epics.

**Key Documents** (read before starting):
- `docs/sprints/engagement-phase2/epic-0-health-integration/SPEC.md` - Full specifications
- `docs/sprints/engagement-phase2/epic-0-health-integration/MIGRATION_MAP.md` - Exact file changes
- `docs/sprints/engagement-phase2/epic-0-health-integration/DECISIONS.md` - ADRs for approach

---

## Tasks

Execute these tasks in order:

### T1: Add e2e-behavior Check Type

**File**: `lib/health-validator.js`

1. Add `executeE2EBehavior` function after `executeChainValid` (~line 160)
2. Add case `'e2e-behavior': return executeE2EBehavior(def);` to switch in `executeCheck`

The function should:
- Parse `def.test` in format `"file.spec.ts:test name"`
- Load health log with `loadHealthLog()`
- Find most recent entry with `e2e-tests` category
- Look up test by slugified ID or name substring
- Return test's status/message, or `warn` if not found

See SPEC.md for full implementation.

---

### T2: Update Health Config

**File**: `data/infrastructure/health-config.json`

1. Change `"version": "1.0"` to `"version": "1.1"`
2. Add to `display.categoryLabels`:
   ```json
   "e2e-tests": "E2E Tests",
   "engagement": "Engagement System"
   ```
3. Add `"engagementChecks"` array with 3 checks:
   - `lens-selection-works` → `engagement-behaviors.spec.ts:lens selection persists`
   - `url-lens-hydration` → `engagement-behaviors.spec.ts:valid lens parameter`
   - `terminal-opens` → `active-grove.spec.ts:tree click opens terminal`

See MIGRATION_MAP.md for full check definitions.

---

### T3: Add API Endpoint

**File**: `server.js`

Add `POST /api/health/report` endpoint after existing health endpoints:

1. Parse JSON body: `{ category, categoryName, checks, attribution }`
2. Validate:
   - `category` is string (400 if missing)
   - `checks` is array (400 if missing)
   - Each check has `id` and valid `status` (pass/fail/warn)
3. Calculate summary (total, passed, failed, warnings)
4. Build report in Health format
5. Call `healthValidator.appendToHealthLog(report, attribution)`
6. Return 201 with entry

See SPEC.md for full implementation.

---

### T4: Create Health Reporter

**Files**: 
- `tests/reporters/health-reporter.ts` (create)
- `tests/reporters/index.ts` (create)

Create Playwright custom reporter:

```typescript
import type { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';

interface TestHealth {
  id: string;
  name: string;
  file: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  duration: number;
}

class HealthReporter implements Reporter {
  private results: TestHealth[] = [];
  private baseUrl: string;
  
  constructor(options: { baseUrl?: string } = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:5173';
  }
  
  onTestEnd(test: TestCase, result: TestResult): void {
    // Collect result
  }
  
  async onEnd(result: FullResult): Promise<void> {
    // POST to /api/health/report
    // Catch errors gracefully (never fail tests)
  }
  
  private slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  
  private mapStatus(status: string): 'pass' | 'fail' | 'warn' {
    // passed→pass, failed/timedOut→fail, skipped→warn
  }
}

export default HealthReporter;
```

See SPEC.md for full implementation.

---

### T5: Update Playwright Config

**File**: `playwright.config.ts`

Add health reporter to `reporter` array:

```typescript
reporter: [
  ['html'],
  ['list'],
  ['./tests/reporters/health-reporter.ts', {
    baseUrl: process.env.BASE_URL || 'http://localhost:5173'
  }]
],
```

---

### T6: Add Integration Tests

**File**: `tests/integration/health-api.test.ts`

Add new describe block for `POST /api/health/report`:

1. Test accepts valid report (201)
2. Test rejects missing category (400)
3. Test rejects missing checks (400)
4. Test rejects invalid status (400)
5. Test report appears in history

See MIGRATION_MAP.md for test implementations.

---

### T7: Verify End-to-End

1. Run `npm run dev` to start server
2. Run `npx playwright test` 
3. Verify console shows "[HealthReporter] Reported N tests"
4. Check `data/infrastructure/health-log.json` for e2e-tests entry
5. Run `curl http://localhost:5173/api/health | jq` to verify engagement category

---

## Test Matrix

| Test | Command | Expected |
|------|---------|----------|
| Health validator | `npm test` (if exists) | Pass |
| Integration tests | `npx vitest tests/integration/` | Pass |
| E2E tests | `npx playwright test` | 34 pass |
| Health log entry | Check file | Contains e2e-tests |
| Graceful degradation | Stop server, run tests | Tests still pass |

---

## Commit Message

After all tasks complete:

```
feat: integrate E2E tests with Health system

Epic 0: Health Integration Foundation

- Add e2e-behavior check type to health-validator.js
- Add POST /api/health/report endpoint to server.js
- Create Playwright health reporter (tests/reporters/)
- Add engagement health checks to health-config.json
- Add integration tests for health report API

E2E test results now automatically report to Health system,
enabling "testing as process" for engagement migration.

Refs: docs/sprints/engagement-phase2/epic-0-health-integration/
```

---

## Verification Checklist

Before marking complete:

- [ ] `npm run build` succeeds
- [ ] `npx playwright test` runs with reporter (34 pass)
- [ ] `npx vitest tests/integration/health-api.test.ts` passes
- [ ] Health log contains e2e-tests entry
- [ ] `GET /api/health` returns engagement category
- [ ] Engagement checks reference test results
- [ ] Graceful degradation works (tests pass without server)

---

## Troubleshooting

### Reporter not loading
- Check `playwright.config.ts` path is correct
- Run `npx tsc tests/reporters/health-reporter.ts --noEmit` to check types

### API returns 500
- Check server console for errors
- Verify `healthValidator` is imported correctly in server.js

### Tests not appearing in log
- Check server is running on correct port
- Check console for reporter errors
- Verify POST body format matches expected schema

### e2e-behavior returns warn
- Run E2E tests first to populate log
- Check test name matches format in config
- Verify slugification produces correct ID

---

## Files Summary

| Action | File |
|--------|------|
| MODIFY | `lib/health-validator.js` |
| MODIFY | `data/infrastructure/health-config.json` |
| MODIFY | `server.js` |
| CREATE | `tests/reporters/health-reporter.ts` |
| CREATE | `tests/reporters/index.ts` |
| MODIFY | `playwright.config.ts` |
| EXTEND | `tests/integration/health-api.test.ts` |

---

## Update DEVLOG

After completion, update `docs/sprints/engagement-phase2/epic-0-health-integration/DEVLOG.md` with:

1. Session timestamp
2. Tasks completed
3. Any issues encountered
4. Verification results
5. Commit hash
