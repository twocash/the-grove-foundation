# Epic 0: Health Integration - Repository Audit

**Sprint**: Engagement Phase 2
**Epic**: 0 - Health Integration Foundation
**Date**: 2024-12-23
**Auditor**: Claude (Foundation Loop)

---

## Executive Summary

This audit examines two existing systems that must be connected:
1. **Health System** (`lib/health-validator.js`) - Declarative health checks with logging
2. **E2E Test Suite** (`tests/e2e/`) - Playwright behavior tests

The goal is to make E2E test results flow into the Health system, creating a unified view of system health that includes both data integrity checks AND behavioral verification.

---

## System 1: Health Validator

### Location
```
lib/health-validator.js          # Core engine (452 lines)
data/infrastructure/
├── health-config.json           # Declarative check definitions (125 lines)
└── health-log.json              # Execution history (auto-generated)
```

### Architecture Analysis

The Health system already implements the declarative pattern we want for engagement:

```javascript
// Check definition (declarative)
{
  "id": "journey-hub-refs",
  "type": "reference-check",
  "source": { "file": "...", "path": "..." },
  "target": { "file": "...", "path": "..." }
}

// Engine interprets at runtime
function executeCheck(def) {
  switch (def.type) {
    case 'json-exists': return executeJsonExists(def);
    case 'reference-check': return executeReferenceCheck(def);
    case 'chain-valid': return executeChainValid(def);
  }
}
```

### Current Check Types

| Type | Purpose | Count |
|------|---------|-------|
| `json-exists` | Verify JSON file parses | 4 |
| `reference-check` | Verify cross-file references | 5 |
| `chain-valid` | Verify journey chains complete | 1 |

### API Surface

```javascript
// Exports from lib/health-validator.js
export function loadConfig()                    // Load health-config.json
export function runChecks(config)               // Execute all checks
export function loadHealthLog()                 // Read history
export function appendToHealthLog(report, attr) // Write with attribution
export function getEngineVersion()              // From package.json
```

### Log Entry Structure

```json
{
  "id": "uuid",
  "timestamp": "ISO-8601",
  "configVersion": "1.0",
  "engineVersion": "0.15.0",
  "categories": [...],
  "summary": { "total": 10, "passed": 9, "failed": 1, "warnings": 0 },
  "attribution": {
    "triggeredBy": "api|manual|ci-pipeline",
    "userId": null,
    "sessionId": null,
    "timestamp": "ISO-8601"
  }
}
```

### Key Insight: Attribution System

The Health system already has provenance tracking via `attribution`. This is exactly what we need for E2E test integration:

```javascript
appendToHealthLog(report, {
  triggeredBy: 'playwright',      // New trigger type
  commit: 'abc123',               // Git commit
  testFile: 'engagement.spec.ts'  // Source test file
});
```

---

## System 2: E2E Test Suite

### Location
```
tests/e2e/
├── smoke.spec.ts                # Basic page load (3 tests)
├── active-grove.spec.ts         # Active Grove flow (22 tests)
├── engagement-behaviors.spec.ts # Behavior-focused (15 tests) ← NEW
└── deprecated/
    ├── genesis-terminal.spec.ts # Skipped FAB-era tests
    └── terminal-lens-flow.spec.ts
```

### Current Test Categories

| File | Tests | Purpose |
|------|-------|---------|
| smoke.spec.ts | 3 | Page loads, no errors |
| active-grove.spec.ts | 22 | Split layout, tree click, responsive |
| engagement-behaviors.spec.ts | 15 | Lens selection, URL params, navigation |

### Test Helper Infrastructure

```typescript
// tests/e2e/engagement-behaviors.spec.ts
async function openTerminalViaTree(page: Page) { ... }
async function terminalContainsText(page: Page, text: string) { ... }
async function selectLens(page: Page, lensId: string) { ... }
```

### Playwright Configuration

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  reporter: [['html'], ['list']],
  use: {
    baseURL: 'http://localhost:5173',
  },
});
```

### Key Insight: Reporter System

Playwright supports custom reporters. We can create a Health reporter:

```typescript
// tests/reporters/health-reporter.ts
class HealthReporter implements Reporter {
  onEnd(result: FullResult) {
    // Transform results → Health format
    // Call appendToHealthLog()
  }
}
```

---

## System 3: Integration Tests (Reference)

### Location
```
tests/integration/
├── health-api.test.ts    # Tests Health API endpoints
└── narrative-api.test.ts # Tests narrative API
tests/utils/
└── api.ts                # Fetch helpers for tests
```

### Health API Endpoints (from tests)

```typescript
// tests/utils/api.ts
export async function healthCheck() {
  return fetch(`${BASE_URL}/api/health/check`);
}

export async function fetchHealth() {
  return fetch(`${BASE_URL}/api/health`).then(r => r.json());
}

export async function fetchHealthConfig() {
  return fetch(`${BASE_URL}/api/health/config`).then(r => r.json());
}

export async function fetchHealthHistory(limit?: number) {
  const url = limit 
    ? `${BASE_URL}/api/health/history?limit=${limit}`
    : `${BASE_URL}/api/health/history`;
  return fetch(url).then(r => r.json());
}

export async function runHealthCheck() {
  return fetch(`${BASE_URL}/api/health/run`, { method: 'POST' })
    .then(r => r.json());
}
```

### Key Insight: API Already Exists

The Health system has a full API surface. E2E reporter can POST results directly:

```
POST /api/health/run
  → Runs checks and logs result

POST /api/health/report (NEW)
  → Accepts external test results
```

---

## Gap Analysis

### What Exists

| Component | Status | Notes |
|-----------|--------|-------|
| Health check engine | ✅ Complete | Declarative, extensible |
| Health log with attribution | ✅ Complete | Provenance tracking |
| Health API endpoints | ✅ Complete | GET/POST supported |
| E2E test suite | ✅ Complete | 40 tests, 34 passing |
| Behavior-focused tests | ✅ Complete | Migration-safe |

### What's Missing

| Component | Status | Required For |
|-----------|--------|--------------|
| E2E → Health reporter | ❌ Missing | Test results in Health dashboard |
| `e2e-behavior` check type | ❌ Missing | Link Health checks to tests |
| `/api/health/report` endpoint | ❌ Missing | Accept external results |
| Engagement health checks | ❌ Missing | Track engagement subsystem |
| CI/CD integration | ❌ Missing | Automated reporting |

---

## File Inventory

### Files to CREATE

| File | Purpose | Lines (est) |
|------|---------|-------------|
| `tests/reporters/health-reporter.ts` | Playwright → Health | ~80 |
| `src/core/engagement/health/engagement-checks.json` | Engagement check definitions | ~50 |
| `scripts/report-test-health.js` | CLI for manual reporting | ~40 |

### Files to MODIFY

| File | Change | Risk |
|------|--------|------|
| `lib/health-validator.js` | Add `e2e-behavior` check type | LOW |
| `data/infrastructure/health-config.json` | Add engagement category | LOW |
| `playwright.config.ts` | Add health reporter | LOW |
| `server.js` | Add `/api/health/report` endpoint | MEDIUM |

### Files to NOT MODIFY

| File | Reason |
|------|--------|
| `hooks/NarrativeEngineContext.tsx` | Phase 2 target, not touched in Epic 0 |
| `tests/e2e/*.spec.ts` | Tests already written, just need reporting |

---

## Technical Constraints

### 1. Server Must Be Running

Health API requires running server. E2E tests already require this:

```bash
# Start server
npm run dev

# Run E2E tests (separate terminal)
npx playwright test
```

Reporter will POST to running server.

### 2. Log File Permissions

`health-log.json` is written by server process. Reporter must POST to API, not write directly.

### 3. Test Isolation

E2E tests run in isolated browser contexts. Reporter runs after all tests complete, not during.

### 4. Attribution Accuracy

Each test result needs accurate attribution:
- Test file name
- Test title
- Git commit (if available)
- Timestamp

---

## Recommended Approach

### Option A: Playwright Custom Reporter (RECOMMENDED)

```typescript
// tests/reporters/health-reporter.ts
import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';

class HealthReporter implements Reporter {
  private results: TestHealth[] = [];
  
  onTestEnd(test: TestCase, result: TestResult) {
    this.results.push({
      id: this.slugify(test.title),
      name: test.title,
      file: test.location.file,
      status: result.status === 'passed' ? 'pass' : 'fail',
      message: result.error?.message || 'Passed',
      duration: result.duration
    });
  }
  
  async onEnd() {
    await fetch('http://localhost:5173/api/health/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'e2e-tests',
        checks: this.results,
        attribution: {
          triggeredBy: 'playwright',
          commit: process.env.GIT_COMMIT || 'local'
        }
      })
    });
  }
}
```

**Pros**: Clean separation, runs automatically, full test context available
**Cons**: Requires server running

### Option B: Post-Test Script

```bash
npx playwright test --reporter=json > results.json
node scripts/report-test-health.js results.json
```

**Pros**: Works without server modifications
**Cons**: Extra step, less integrated

### Option C: CI-Only Integration

Only report in CI pipeline, not local development.

**Pros**: Simpler local dev experience
**Cons**: Delayed feedback, CI-dependent

---

## Recommendation

**Use Option A (Custom Reporter)** with fallback behavior:

1. Reporter attempts to POST to Health API
2. If server unavailable, log warning but don't fail tests
3. Results still available in Playwright HTML report
4. CI pipeline ensures server is running

This gives immediate feedback when server is running, graceful degradation otherwise.

---

## Next Steps

1. **SPEC.md**: Define exact requirements for Health integration
2. **ARCHITECTURE.md**: Design reporter and API changes
3. **DECISIONS.md**: Document ADRs for approach choices
4. **SPRINTS.md**: Break into implementable tasks

---

## References

- `lib/health-validator.js` - Health engine implementation
- `tests/integration/health-api.test.ts` - Health API test coverage
- `docs/testing/ENGAGEMENT_MIGRATION_TEST_STRATEGY.md` - Test philosophy
- `docs/roadmaps/ENGAGEMENT_PHASE2_ROADMAP.md` - Phase 2 plan
