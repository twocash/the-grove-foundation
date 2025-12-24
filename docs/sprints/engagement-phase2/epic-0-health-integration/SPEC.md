# Epic 0: Health Integration - Specification

**Sprint**: Engagement Phase 2
**Epic**: 0 - Health Integration Foundation
**Date**: 2024-12-23
**Status**: DRAFT

---

## Overview

### Problem Statement

Currently, E2E test results exist only in Playwright's HTML report. The Health system tracks data integrity but not behavioral verification. These two systems should be unified to provide a single source of truth for system health.

### Goals

| Priority | Goal | Success Metric |
|----------|------|----------------|
| P0 | E2E results appear in Health dashboard | Health API returns e2e category |
| P0 | Tests report automatically after run | No manual steps required |
| P1 | Health checks can reference specific tests | `"test": "file:testname"` syntax works |
| P1 | CI pipeline gates on Health status | Failed tests block deploy |
| P2 | Engagement-specific health category | `engagement` category in config |

### Non-Goals (This Epic)

- Modifying NarrativeEngineContext (that's Epic 1+)
- Adding new E2E tests (already done in sprint v2)
- Building a visual Health dashboard UI (future sprint)
- Real-time test streaming (batch reporting is sufficient)

---

## User Stories

### US-1: Developer Runs Tests Locally

**As a** developer running tests locally
**I want** test results to appear in the Health system
**So that** I can see unified system health in one place

**Acceptance Criteria**:
- [ ] After `npx playwright test`, results POST to Health API
- [ ] If server not running, tests still pass (graceful degradation)
- [ ] Health log shows test entry with attribution
- [ ] Console shows "Reported N tests to Health system"

### US-2: CI Pipeline Reports Results

**As a** CI pipeline
**I want** to report test results with commit attribution
**So that** we can track health over time and gate deployments

**Acceptance Criteria**:
- [ ] CI can POST results with `GIT_COMMIT` env var
- [ ] Health history shows commit for each run
- [ ] Pipeline can query Health API for pass/fail status
- [ ] Failed tests result in non-zero exit code

### US-3: Health Config References Tests

**As a** system maintainer
**I want** health checks that reference specific E2E tests
**So that** I can define engagement health in terms of behaviors

**Acceptance Criteria**:
- [ ] New check type `e2e-behavior` in health-config.json
- [ ] Check specifies test file and test name
- [ ] Check status derived from most recent test run
- [ ] Missing test data results in `warn` status

### US-4: Engagement Health Category

**As a** future migration implementer
**I want** an `engagement` category in Health config
**So that** Phase 2 epics can add checks incrementally

**Acceptance Criteria**:
- [ ] `engagement` category exists in health-config.json
- [ ] Category label configured in display settings
- [ ] At least one engagement check defined
- [ ] Health API returns engagement category

---

## Technical Specification

### Component 1: Health Reporter for Playwright

**File**: `tests/reporters/health-reporter.ts`

```typescript
import type { 
  Reporter, 
  FullConfig, 
  Suite, 
  TestCase, 
  TestResult, 
  FullResult 
} from '@playwright/test/reporter';

interface TestHealth {
  id: string;
  name: string;
  file: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  duration: number;
}

interface HealthReport {
  category: string;
  categoryName: string;
  checks: TestHealth[];
  attribution: {
    triggeredBy: string;
    commit: string | null;
    branch: string | null;
    timestamp: string;
  };
}

class HealthReporter implements Reporter {
  private results: TestHealth[] = [];
  private baseUrl: string;
  
  constructor(options: { baseUrl?: string } = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:5173';
  }
  
  onTestEnd(test: TestCase, result: TestResult): void {
    this.results.push({
      id: this.slugify(test.title),
      name: test.title,
      file: test.location.file.replace(/.*tests\/e2e\//, ''),
      status: this.mapStatus(result.status),
      message: result.error?.message || 'Passed',
      duration: result.duration
    });
  }
  
  async onEnd(result: FullResult): Promise<void> {
    if (this.results.length === 0) {
      console.log('[HealthReporter] No test results to report');
      return;
    }
    
    const report: HealthReport = {
      category: 'e2e-tests',
      categoryName: 'E2E Tests',
      checks: this.results,
      attribution: {
        triggeredBy: 'playwright',
        commit: process.env.GIT_COMMIT || process.env.GITHUB_SHA || null,
        branch: process.env.GIT_BRANCH || process.env.GITHUB_REF_NAME || null,
        timestamp: new Date().toISOString()
      }
    };
    
    try {
      const response = await fetch(`${this.baseUrl}/api/health/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`[HealthReporter] Reported ${this.results.length} tests to Health system`);
        console.log(`[HealthReporter] Entry ID: ${data.id}`);
      } else {
        console.warn(`[HealthReporter] Failed to report: ${response.status}`);
      }
    } catch (error) {
      // Graceful degradation - don't fail tests if Health API unavailable
      console.warn('[HealthReporter] Health API unavailable, skipping report');
    }
  }
  
  private slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
  
  private mapStatus(status: string): 'pass' | 'fail' | 'warn' {
    switch (status) {
      case 'passed': return 'pass';
      case 'failed': 
      case 'timedOut': return 'fail';
      case 'skipped': return 'warn';
      default: return 'warn';
    }
  }
}

export default HealthReporter;
```

### Component 2: Health Report API Endpoint

**File**: `server.js` (modification)

```javascript
// Add to existing server.js

// POST /api/health/report - Accept external test results
app.post('/api/health/report', express.json(), async (req, res) => {
  try {
    const { category, categoryName, checks, attribution } = req.body;
    
    // Validate required fields
    if (!category || !checks || !Array.isArray(checks)) {
      return res.status(400).json({ 
        error: 'Missing required fields: category, checks' 
      });
    }
    
    // Calculate summary
    const summary = {
      total: checks.length,
      passed: checks.filter(c => c.status === 'pass').length,
      failed: checks.filter(c => c.status === 'fail').length,
      warnings: checks.filter(c => c.status === 'warn').length
    };
    
    // Determine category status
    const hasFail = checks.some(c => c.status === 'fail');
    const hasWarn = checks.some(c => c.status === 'warn');
    const categoryStatus = hasFail ? 'fail' : hasWarn ? 'warn' : 'pass';
    
    // Build report in Health format
    const report = {
      timestamp: new Date().toISOString(),
      configVersion: 'external',
      engineVersion: healthValidator.getEngineVersion(),
      categories: [{
        id: category,
        name: categoryName || category,
        status: categoryStatus,
        checks: checks.map(c => ({
          id: c.id,
          name: c.name,
          status: c.status,
          message: c.message,
          file: c.file,
          duration: c.duration
        }))
      }],
      summary
    };
    
    // Log with attribution
    const entry = healthValidator.appendToHealthLog(report, {
      triggeredBy: attribution?.triggeredBy || 'external',
      commit: attribution?.commit || null,
      branch: attribution?.branch || null
    });
    
    res.json(entry);
  } catch (error) {
    console.error('[Health Report] Error:', error);
    res.status(500).json({ error: 'Failed to record health report' });
  }
});
```

### Component 3: e2e-behavior Check Type

**File**: `lib/health-validator.js` (modification)

```javascript
// Add new check executor

/**
 * e2e-behavior: Check status from most recent test run
 * Looks up test result in health log by test ID
 */
function executeE2EBehavior(def) {
  const testRef = def.test; // Format: "file.spec.ts:test name"
  if (!testRef) {
    return { status: 'warn', message: 'No test reference specified' };
  }
  
  const [file, testName] = testRef.split(':');
  const testId = testName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  
  // Find most recent e2e-tests entry
  const log = loadHealthLog();
  const e2eEntry = log.entries.find(entry => 
    entry.categories?.some(cat => cat.id === 'e2e-tests')
  );
  
  if (!e2eEntry) {
    return { 
      status: 'warn', 
      message: 'No E2E test data available - run tests first' 
    };
  }
  
  const e2eCategory = e2eEntry.categories.find(c => c.id === 'e2e-tests');
  const testResult = e2eCategory.checks.find(c => 
    c.id === testId || c.name.toLowerCase().includes(testName.toLowerCase())
  );
  
  if (!testResult) {
    return { 
      status: 'warn', 
      message: `Test not found: ${testRef}` 
    };
  }
  
  return {
    status: testResult.status,
    message: testResult.message,
    details: {
      file: testResult.file,
      lastRun: e2eEntry.timestamp
    }
  };
}

// Add to executeCheck switch statement
case 'e2e-behavior':
  return executeE2EBehavior(def);
```

### Component 4: Engagement Health Category

**File**: `data/infrastructure/health-config.json` (modification)

```json
{
  "version": "1.1",
  "display": {
    "dashboardTitle": "System Health",
    "categoryLabels": {
      "engine": "Engine Health",
      "schema-integrity": "Schema Integrity",
      "journey-navigation": "Journey Navigation",
      "rag-integration": "RAG Integration",
      "e2e-tests": "E2E Tests",
      "engagement": "Engagement System"
    }
  },
  "engagementChecks": [
    {
      "id": "lens-selection-works",
      "name": "Lens Selection Persists",
      "category": "engagement",
      "type": "e2e-behavior",
      "test": "engagement-behaviors.spec.ts:lens selection persists",
      "impact": "Users cannot select a viewing perspective",
      "inspect": "Run: npx playwright test -g 'lens selection'"
    },
    {
      "id": "url-lens-hydration",
      "name": "URL Lens Parameter Works",
      "category": "engagement",
      "type": "e2e-behavior",
      "test": "engagement-behaviors.spec.ts:valid lens parameter",
      "impact": "Deep links to specific lenses fail",
      "inspect": "Run: npx playwright test -g 'URL lens'"
    },
    {
      "id": "terminal-opens",
      "name": "Terminal Opens on Tree Click",
      "category": "engagement",
      "type": "e2e-behavior",
      "test": "active-grove.spec.ts:tree click opens terminal",
      "impact": "Users cannot access Terminal",
      "inspect": "Run: npx playwright test -g 'tree click'"
    }
  ]
}
```

### Component 5: Playwright Configuration Update

**File**: `playwright.config.ts` (modification)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  
  reporter: [
    ['html'],
    ['list'],
    ['./tests/reporters/health-reporter.ts', { 
      baseUrl: process.env.BASE_URL || 'http://localhost:5173' 
    }]
  ],
  
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## API Contract

### POST /api/health/report

**Request**:
```json
{
  "category": "e2e-tests",
  "categoryName": "E2E Tests",
  "checks": [
    {
      "id": "lens-selection-persists",
      "name": "lens selection persists across sessions",
      "file": "engagement-behaviors.spec.ts",
      "status": "pass",
      "message": "Passed",
      "duration": 1234
    }
  ],
  "attribution": {
    "triggeredBy": "playwright",
    "commit": "abc123",
    "branch": "main",
    "timestamp": "2024-12-23T12:00:00Z"
  }
}
```

**Response** (201 Created):
```json
{
  "id": "uuid",
  "timestamp": "2024-12-23T12:00:00Z",
  "configVersion": "external",
  "engineVersion": "0.15.0",
  "categories": [...],
  "summary": {
    "total": 40,
    "passed": 34,
    "failed": 0,
    "warnings": 6
  },
  "attribution": {
    "triggeredBy": "playwright",
    "commit": "abc123"
  }
}
```

**Error Response** (400):
```json
{
  "error": "Missing required fields: category, checks"
}
```

---

## Acceptance Criteria Checklist

### Functional Requirements

- [ ] Playwright health reporter exists and compiles
- [ ] Reporter POSTs results after test run
- [ ] Reporter gracefully handles missing server
- [ ] `/api/health/report` endpoint accepts POST
- [ ] Endpoint validates required fields
- [ ] Endpoint calculates summary correctly
- [ ] Endpoint logs with attribution
- [ ] `e2e-behavior` check type works
- [ ] Health config includes engagement category
- [ ] At least 3 engagement checks defined

### Technical Requirements

- [ ] TypeScript compiles without errors
- [ ] No breaking changes to existing Health API
- [ ] Health log format unchanged
- [ ] Existing health checks still pass

### Documentation Requirements

- [ ] DEVLOG updated with implementation notes
- [ ] README updated with test reporting info
- [ ] Health config commented with examples

---

## Test Plan

### Unit Tests

1. **health-reporter.test.ts**
   - Reporter collects test results
   - Reporter maps status correctly
   - Reporter handles empty results
   - Reporter slugifies test names

2. **health-validator.test.ts**
   - `e2e-behavior` finds test by ID
   - `e2e-behavior` handles missing log
   - `e2e-behavior` handles missing test

### Integration Tests

1. **health-api.test.ts** (extend existing)
   - POST /api/health/report accepts valid data
   - POST /api/health/report rejects invalid data
   - Posted results appear in history
   - Attribution preserved in log

### E2E Verification

1. Run full test suite
2. Verify Health log contains entry
3. Verify `engagement` category checks reference tests
4. Verify graceful degradation without server

---

## Dependencies

| Dependency | Version | Purpose |
|------------|---------|---------|
| @playwright/test | existing | Test runner, reporter interface |
| express | existing | API endpoint |
| node:crypto | built-in | UUID generation |

No new dependencies required.

---

## Rollback Plan

If issues arise:

1. Remove health reporter from `playwright.config.ts`
2. Remove `/api/health/report` endpoint from `server.js`
3. Remove `e2e-behavior` executor from `health-validator.js`
4. Revert health-config.json to previous version

All changes are additive; existing functionality unaffected.

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| E2E results in Health | 100% of runs | Check health-log.json |
| Reporter overhead | <500ms | Measure POST duration |
| Graceful degradation | 100% | Tests pass without server |
| Engagement checks | 3+ defined | Count in health-config.json |

---

## References

- REPO_AUDIT.md - System analysis
- `lib/health-validator.js` - Health engine
- `tests/integration/health-api.test.ts` - Existing tests
- Playwright Reporter API: https://playwright.dev/docs/api/class-reporter
