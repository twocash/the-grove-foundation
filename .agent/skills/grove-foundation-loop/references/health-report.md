# Health Report System

A unified diagnostic tool that combines data integrity checks AND behavioral test results into a single view of system health.

## Purpose

The Health system provides **one place** to see:
1. **Data Integrity** — Schema validation, reference checks
2. **Behavioral Health** — E2E test results
3. **API Contracts** — Endpoint validation
4. **Migration Progress** — Tracking refactoring completion

## Unified Health Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Unified Health System                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   Data Checks              E2E Tests              API Tests                 │
│   ───────────              ─────────              ─────────                 │
│   Schema valid?            User flows work?       Endpoints respond?        │
│   Refs resolve?            Behavior correct?      Contracts honored?        │
│                                                                             │
│         │                        │                       │                  │
│         └────────────────────────┼───────────────────────┘                  │
│                                  ▼                                          │
│                    ┌─────────────────────────┐                              │
│                    │   Health API + Log      │                              │
│                    │                         │                              │
│                    │  POST /api/health/run   │ ◄── Internal checks          │
│                    │  POST /api/health/report│ ◄── E2E reporter             │
│                    │  GET  /api/health       │ ◄── Dashboard                │
│                    └─────────────────────────┘                              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Output Format

```
╔══════════════════════════════════════════════════════════════════╗
║                    SYSTEM HEALTH CHECK                           ║
╠══════════════════════════════════════════════════════════════════╣
║  Run: 2024-12-23 16:45:00                                        ║
║  Status: ⚠️  1 ISSUE FOUND                                        ║
╚══════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────┐
│ SCHEMA INTEGRITY                                          ✅ PASS │
├─────────────────────────────────────────────────────────────────┤
│ ✓ All JSON files parse without errors                           │
│ ✓ All cross-references resolve                                  │
│ ✓ Journey chains complete                                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ E2E TESTS                                                 ✅ PASS │
├─────────────────────────────────────────────────────────────────┤
│ ✓ 34 tests passing                                              │
│ ✓ 6 tests skipped (deprecated)                                  │
│ ✓ 0 tests failing                                               │
│                                                                 │
│   Last run: 2024-12-23 16:40:00                                │
│   Triggered by: playwright                                      │
│   Commit: abc123                                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ ENGAGEMENT SYSTEM                                         ⚠️ WARN │
├─────────────────────────────────────────────────────────────────┤
│ ✓ lens-selection-works — Passed                                 │
│ ✓ url-lens-hydration — Passed                                   │
│ ⚠ entropy-detection — No E2E data (run tests first)             │
│                                                                 │
│   IMPACT: Entropy-based suggestions may not work                │
│   INSPECT: npx playwright test -g 'entropy'                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ SUMMARY                                                         │
├─────────────────────────────────────────────────────────────────┤
│ Total checks: 25                                                │
│ Passed: 24                                                      │
│ Warnings: 1                                                     │
│ Failed: 0                                                       │
│                                                                 │
│ Next steps:                                                     │
│ 1. Run E2E tests to populate entropy check                      │
└─────────────────────────────────────────────────────────────────┘
```

## Health Check Types

### Internal Checks (Run by Health Engine)

| Type | Purpose | Example |
|------|---------|---------|
| `json-exists` | File parses as valid JSON | Config files |
| `reference-check` | Cross-file references resolve | Journey → Hub |
| `chain-valid` | Linked sequences complete | Journey node chains |

### External Checks (Reported by Tests)

| Type | Purpose | Example |
|------|---------|---------|
| `e2e-behavior` | Links to E2E test result | Lens selection works |
| `unit-test` | Links to unit test result | Validator logic |
| `api-contract` | Links to integration test | Endpoint shape |

## E2E → Health Integration

### Playwright Reporter

```typescript
// tests/reporters/health-reporter.ts
class HealthReporter implements Reporter {
  async onEnd() {
    await fetch('/api/health/report', {
      method: 'POST',
      body: JSON.stringify({
        category: 'e2e-tests',
        checks: this.results,
        attribution: { triggeredBy: 'playwright', commit: process.env.GIT_COMMIT }
      })
    });
  }
}
```

### e2e-behavior Check Type

```json
// health-config.json
{
  "id": "lens-selection-works",
  "type": "e2e-behavior",
  "test": "engagement-behaviors.spec.ts:lens selection persists",
  "impact": "Users cannot personalize their experience",
  "inspect": "npx playwright test -g 'lens selection'"
}
```

The Health engine:
1. Finds most recent `e2e-tests` entry in log
2. Looks up test by name
3. Returns that test's pass/fail status

## Health Check Categories

| Category | What It Checks | Source |
|----------|----------------|--------|
| `engine` | Core system health | Internal checks |
| `schema-integrity` | Data validity | Internal checks |
| `e2e-tests` | User behaviors work | Playwright reporter |
| `engagement` | Engagement system | `e2e-behavior` checks |
| `migration` | Refactoring progress | File existence checks |

## Health Config Structure

```json
{
  "version": "1.1",
  "display": {
    "dashboardTitle": "System Health",
    "categoryLabels": {
      "engine": "Engine Health",
      "schema-integrity": "Schema Integrity",
      "e2e-tests": "E2E Tests",
      "engagement": "Engagement System"
    }
  },
  "engineChecks": [
    {
      "id": "journeys-json",
      "name": "Journeys Schema",
      "category": "engine",
      "type": "json-exists",
      "file": "data/exploration/journeys.json"
    }
  ],
  "engagementChecks": [
    {
      "id": "lens-selection-works",
      "name": "Lens Selection Persists",
      "category": "engagement",
      "type": "e2e-behavior",
      "test": "engagement-behaviors.spec.ts:lens selection persists",
      "impact": "Users cannot select a viewing perspective",
      "inspect": "npx playwright test -g 'lens selection'"
    }
  ]
}
```

## Health API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/health` | GET | Current health status |
| `/api/health/config` | GET | Health configuration |
| `/api/health/history` | GET | Historical health runs |
| `/api/health/run` | POST | Execute internal checks |
| `/api/health/report` | POST | Accept external results |

### POST /api/health/report

Accept results from external sources (Playwright, Vitest, CI):

```json
// Request
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
    "branch": "main"
  }
}

// Response (201)
{
  "id": "entry-uuid",
  "timestamp": "2024-12-23T16:45:00Z",
  "categories": [...],
  "summary": { "total": 34, "passed": 34, "failed": 0 }
}
```

## Writing Health Checks

### Good Health Check (Actionable)
```json
{
  "id": "user-refs-valid",
  "name": "User-Item References",
  "type": "reference-check",
  "source": { "file": "data/users.json", "path": "$.*.itemId" },
  "target": { "file": "data/items.json", "path": "$.*" },
  "impact": "Users will see 'Item not found' errors",
  "inspect": "node -e \"require('./check-refs.js')\""
}
```

### Behavior-Linked Check
```json
{
  "id": "navigation-works",
  "name": "User Can Navigate Journey",
  "type": "e2e-behavior",
  "test": "journey-navigation.spec.ts:user can navigate forward",
  "impact": "Users cannot progress through journeys",
  "inspect": "npx playwright test -g 'navigate forward'"
}
```

### Migration Progress Check
```json
{
  "id": "legacy-removed",
  "name": "Legacy Context Deleted",
  "type": "file-not-exists",
  "file": "hooks/NarrativeEngineContext.tsx",
  "impact": "Migration incomplete, technical debt remains",
  "inspect": "ls hooks/NarrativeEngineContext.tsx"
}
```

## CLI Usage

```bash
# Full health check (human-readable)
npm run health

# JSON output (for CI)
npm run health -- --json

# Specific category
npm run health -- --category=engagement

# Include E2E results
npx playwright test  # Reports to health
npm run health       # Shows combined results
```

## CI Integration

```yaml
name: Health Check
on: [push, pull_request]
jobs:
  health:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run dev &
      - run: npx playwright test  # Reports to Health
      - run: npm run health -- --json > health.json
      - run: |
          # Fail if any checks failed
          cat health.json | jq -e '.summary.failed == 0'
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: health-report
          path: health.json
```

## Health Check as Living Documentation

The health report serves multiple purposes:

1. **System Structure** — Shows what components exist
2. **Expected Values** — Documents what "working" means
3. **Investigation Commands** — `inspect` field guides debugging
4. **Test Coverage** — Links checks to behavioral tests
5. **Migration Progress** — Tracks refactoring completion

When health passes, the system is working.
When health fails, developers know exactly what to fix.

## Integration with Foundation Loop

Every sprint should:

1. **Add health checks** for new functionality
2. **Reference E2E tests** in health config
3. **Include health verification** in build gates
4. **Track migration** with file-exists/not-exists checks

```markdown
## SPRINTS.md

### Build Gate
```bash
npm run build
npm test
npx playwright test  # Reports to Health
npm run health       # Verifies everything
```
```
