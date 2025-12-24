# Epic 0: Health Integration - Architectural Decisions

**Sprint**: Engagement Phase 2
**Epic**: 0 - Health Integration Foundation
**Date**: 2024-12-23

---

## Decision Log

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| ADR-026 | Custom Playwright Reporter | ACCEPTED | 2024-12-23 |
| ADR-027 | Graceful Degradation on API Failure | ACCEPTED | 2024-12-23 |
| ADR-028 | e2e-behavior Check Type | ACCEPTED | 2024-12-23 |
| ADR-029 | POST Endpoint vs Direct Log Write | ACCEPTED | 2024-12-23 |
| ADR-030 | Test Reference Format | ACCEPTED | 2024-12-23 |
| ADR-031 | Status Mapping Strategy | ACCEPTED | 2024-12-23 |
| ADR-032 | Attribution Schema | ACCEPTED | 2024-12-23 |

---

## ADR-026: Custom Playwright Reporter

### Context

We need to send E2E test results to the Health system. Playwright offers several integration points:
1. Custom reporter class
2. Post-test script
3. CI-only integration
4. Playwright's built-in JSON reporter + parsing

### Decision

**Use a custom Playwright reporter class.**

### Rationale

| Option | Pros | Cons |
|--------|------|------|
| Custom reporter | Automatic, full context, lifecycle hooks | Requires TypeScript setup |
| Post-test script | Simple, no Playwright internals | Extra step, lose context |
| CI-only | Simple local dev | Delayed feedback |
| JSON + parse | Standard format | Extra step, parsing overhead |

Custom reporter provides:
- Automatic execution after tests
- Access to test metadata (file, duration, error)
- Lifecycle hooks (`onTestEnd`, `onEnd`)
- No manual steps required

### Consequences

- Must create `tests/reporters/health-reporter.ts`
- Must add to `playwright.config.ts` reporter array
- TypeScript compilation required

### Status

ACCEPTED

---

## ADR-027: Graceful Degradation on API Failure

### Context

The Health reporter will POST to a running server. What happens when:
- Server is not running
- Network error occurs
- API returns error

### Decision

**Reporter catches all errors and logs warnings without failing tests.**

### Rationale

Tests must run reliably regardless of Health system availability. The primary purpose of E2E tests is to verify application behavior, not to report to Health.

```typescript
try {
  await fetch(...)
} catch (error) {
  console.warn('[HealthReporter] Health API unavailable, skipping report');
  // Do NOT throw - tests should still pass
}
```

### Consequences

- Tests always pass if assertions pass (correct behavior)
- Health reporting is best-effort
- Developer must notice console warning if reporting fails
- CI should ensure server is running for reliable reporting

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Fail tests on API error | Coupling test success to Health system availability |
| Retry logic | Adds complexity, still might fail |
| Queue for later | Requires persistence, complexity |

### Status

ACCEPTED

---

## ADR-028: e2e-behavior Check Type

### Context

We want health checks in `health-config.json` that reference E2E tests. This creates a link between declarative health checks and behavioral verification.

### Decision

**Create new check type `e2e-behavior` that looks up test results in health log.**

### Implementation

```json
{
  "type": "e2e-behavior",
  "test": "engagement-behaviors.spec.ts:lens selection persists"
}
```

The executor:
1. Parses test reference
2. Finds most recent `e2e-tests` entry in health log
3. Looks up specific test by ID or name
4. Returns that test's status

### Rationale

This maintains the declarative pattern established in Health system:
- Check definition is data, not code
- Engine interprets at runtime
- Same pattern as `json-exists`, `reference-check`, `chain-valid`

### Consequences

- Health checks can now reference behavioral tests
- E2E tests must run before checks are valid
- Missing test data returns `warn` (not `fail`)

### Alternatives Considered

| Alternative | Why Rejected |
|-------------|--------------|
| Embed test status in check | Breaks declarative pattern |
| Separate test report file | Extra file to manage |
| Direct test execution | Too slow for health check |

### Status

ACCEPTED

---

## ADR-029: POST Endpoint vs Direct Log Write

### Context

How should the reporter write to health log?
1. POST to API endpoint
2. Direct file write
3. Shared module import

### Decision

**Use POST to `/api/health/report` endpoint.**

### Rationale

| Option | Pros | Cons |
|--------|------|------|
| POST to API | Clean separation, works in browser/CI | Requires server running |
| Direct file write | No server needed | File permissions, race conditions |
| Shared module | Type safety | Couples test runner to server code |

POST to API:
- Maintains clear boundary between test runner and server
- Logs are written by server process (correct permissions)
- Works the same way locally and in CI
- Validates data before writing

### Consequences

- Server must be running for reporting to work
- Reporter is a pure HTTP client
- Validation happens server-side

### Status

ACCEPTED

---

## ADR-030: Test Reference Format

### Context

How should health checks reference specific tests?

Options:
1. Just test name: `"lens selection persists"`
2. File + name: `"engagement-behaviors.spec.ts:lens selection persists"`
3. Full path: `"tests/e2e/engagement-behaviors.spec.ts:lens selection persists"`
4. Test ID: `"lens-selection-persists"`

### Decision

**Use `"file:test name"` format.**

### Rationale

Format `file.spec.ts:test name`:
- Includes file for disambiguation (same test name in different files)
- Human-readable (matches what you see in test runner)
- Not too verbose (no full path)
- Easy to parse (split on first colon)

### Examples

```json
{
  "test": "engagement-behaviors.spec.ts:lens selection persists"
}
{
  "test": "active-grove.spec.ts:tree click opens terminal"
}
```

### Matching Strategy

1. Slugify test name → check ID (e.g., `lens-selection-persists`)
2. Match by ID first (exact)
3. Fallback: substring match on name (fuzzy)

### Consequences

- Test names should be descriptive and unique within file
- File name prefix helps when names aren't unique
- Fuzzy matching handles minor name variations

### Status

ACCEPTED

---

## ADR-031: Status Mapping Strategy

### Context

Playwright test results have these statuses:
- `passed`
- `failed`
- `timedOut`
- `skipped`
- `interrupted`

Health checks have:
- `pass`
- `fail`
- `warn`

### Decision

**Map statuses as follows:**

| Playwright | Health | Rationale |
|------------|--------|-----------|
| `passed` | `pass` | Direct mapping |
| `failed` | `fail` | Direct mapping |
| `timedOut` | `fail` | Timeout is a failure |
| `skipped` | `warn` | Intentional skip, not failure |
| `interrupted` | `warn` | External interruption, not failure |

### Consequences

- Skipped tests don't fail health checks
- Timeouts are treated as failures
- Interrupted runs show as warnings

### Status

ACCEPTED

---

## ADR-032: Attribution Schema

### Context

Health log entries have an `attribution` field for provenance tracking. What fields should the reporter include?

### Decision

**Use this attribution schema:**

```typescript
{
  triggeredBy: 'playwright',           // Constant for reporter
  commit: process.env.GIT_COMMIT,      // Git commit SHA
  branch: process.env.GIT_BRANCH,      // Git branch name
  timestamp: new Date().toISOString()  // When reported
}
```

### Environment Variables

| Variable | Source | Fallback |
|----------|--------|----------|
| `GIT_COMMIT` | CI or local | `GITHUB_SHA`, then `null` |
| `GIT_BRANCH` | CI or local | `GITHUB_REF_NAME`, then `null` |

### Rationale

- `triggeredBy: 'playwright'` identifies source (vs `manual`, `api`, `ci-pipeline`)
- Git info enables tracking health over commits
- Timestamp shows when reported (may differ from test run)

### Consequences

- CI pipelines should set `GIT_COMMIT` and `GIT_BRANCH`
- Local runs will have `null` for git info (acceptable)
- Can query history by commit to see regressions

### Status

ACCEPTED

---

## Decisions Summary

| Category | Decision |
|----------|----------|
| Integration | Custom Playwright reporter |
| Error handling | Graceful degradation (never fail tests) |
| Check type | New `e2e-behavior` type in Health engine |
| Data flow | POST to API endpoint |
| Reference format | `file.spec.ts:test name` |
| Status mapping | `passed→pass, failed→fail, skipped→warn` |
| Attribution | `triggeredBy + commit + branch + timestamp` |

---

## Future Decisions (Deferred)

### FD-001: Unit Test Integration

Should Vitest unit tests also report to Health?

**Deferred because**: Focus on E2E first, which covers user-visible behavior.

### FD-002: Real-time Streaming

Should tests stream results as they run (vs batch at end)?

**Deferred because**: Batch is simpler and sufficient for current needs.

### FD-003: Health Dashboard UI

How should health results be visualized?

**Deferred because**: API is sufficient for now; UI is separate sprint.

---

## References

- REPO_AUDIT.md - System analysis
- SPEC.md - Requirements
- ARCHITECTURE.md - System design
- Playwright Reporter API - https://playwright.dev/docs/api/class-reporter
