# Epic 0: Health Integration - Architecture

**Sprint**: Engagement Phase 2
**Epic**: 0 - Health Integration Foundation
**Date**: 2024-12-23

---

## System Context

### Before Epic 0

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Current State: Disconnected                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────┐              ┌───────────────────────┐          │
│  │   Health System       │              │   E2E Test Suite      │          │
│  │                       │              │                       │          │
│  │  • Data integrity     │              │  • Behavior tests     │          │
│  │  • Schema validation  │   (no link)  │  • UI verification    │          │
│  │  • Journey chains     │ ──────────── │  • Flow tests         │          │
│  │                       │              │                       │          │
│  │  Output: Health API   │              │  Output: HTML report  │          │
│  └───────────────────────┘              └───────────────────────┘          │
│                                                                             │
│  Problem: Two separate views of system health                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### After Epic 0

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Target State: Unified                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌───────────────────────┐    Reporter    ┌───────────────────────┐        │
│  │   Health System       │◄───────────────│   E2E Test Suite      │        │
│  │                       │                │                       │        │
│  │  • Data integrity     │                │  • Behavior tests     │        │
│  │  • Schema validation  │                │  • UI verification    │        │
│  │  • Journey chains     │                │  • Flow tests         │        │
│  │  + E2E test results   │                │                       │        │
│  │  + Engagement checks  │                │  + Health reporter    │        │
│  │                       │                │                       │        │
│  └───────────┬───────────┘                └───────────────────────┘        │
│              │                                                              │
│              ▼                                                              │
│  ┌───────────────────────┐                                                 │
│  │   Unified Health API  │                                                 │
│  │                       │                                                 │
│  │  GET /api/health      │ ◄── Single source of truth                     │
│  │  GET /api/health/history                                                │
│  │  POST /api/health/report ◄── NEW: Accept external results              │
│  │                       │                                                 │
│  └───────────────────────┘                                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Test → Health Flow                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Developer runs tests                                                    │
│     ┌────────────────┐                                                     │
│     │ npx playwright │                                                     │
│     │     test       │                                                     │
│     └───────┬────────┘                                                     │
│             │                                                               │
│  2. Playwright executes tests                                              │
│             │                                                               │
│     ┌───────▼────────┐     ┌─────────────────┐     ┌─────────────────┐    │
│     │ Test Runner    │────►│ health-reporter │────►│ Server API      │    │
│     │                │     │                 │     │                 │    │
│     │ onTestEnd()    │     │ Collect results │     │ POST /health/   │    │
│     │ onEnd()        │     │ Format payload  │     │      report     │    │
│     └────────────────┘     │ POST to server  │     │                 │    │
│                            └─────────────────┘     │ Validate        │    │
│                                                    │ Calculate sum   │    │
│  3. Health system logs result                      │ Append to log   │    │
│                                                    └────────┬────────┘    │
│                                                             │             │
│                                                    ┌────────▼────────┐    │
│                                                    │ health-log.json │    │
│                                                    │                 │    │
│                                                    │ { entries: [...]}   │
│                                                    └─────────────────┘    │
│                                                                             │
│  4. Subsequent health check can reference tests                            │
│                                                                             │
│     ┌────────────────────────────────────────────────────────────────┐    │
│     │ health-config.json                                              │    │
│     │                                                                 │    │
│     │ {                                                               │    │
│     │   "type": "e2e-behavior",                                       │    │
│     │   "test": "engagement-behaviors.spec.ts:lens selection"         │    │
│     │ }                                                               │    │
│     │                                                                 │    │
│     │         ↓ health-validator.js reads ↓                           │    │
│     │                                                                 │    │
│     │ health-log.json → find e2e-tests → find test → return status   │    │
│     └────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### File Structure

```
the-grove-foundation/
├── lib/
│   └── health-validator.js          # MODIFY: Add e2e-behavior type
├── data/infrastructure/
│   ├── health-config.json           # MODIFY: Add engagement category
│   └── health-log.json              # NO CHANGE: Existing log
├── server.js                        # MODIFY: Add /api/health/report
├── tests/
│   ├── reporters/
│   │   └── health-reporter.ts       # CREATE: Playwright reporter
│   ├── e2e/
│   │   ├── smoke.spec.ts            # NO CHANGE
│   │   ├── active-grove.spec.ts     # NO CHANGE
│   │   └── engagement-behaviors.spec.ts  # NO CHANGE
│   └── integration/
│       └── health-api.test.ts       # EXTEND: Test new endpoint
└── playwright.config.ts             # MODIFY: Add health reporter
```

---

## Component Details

### 1. Health Reporter (`tests/reporters/health-reporter.ts`)

**Responsibility**: Transform Playwright test results into Health format and POST to API

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Health Reporter                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Lifecycle Methods:                                                         │
│                                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐                  │
│  │ onTestEnd() │     │ onTestEnd() │     │  onEnd()    │                  │
│  │             │────►│             │────►│             │                  │
│  │ Collect     │     │ Collect     │     │ POST all    │                  │
│  │ result 1    │     │ result N    │     │ results     │                  │
│  └─────────────┘     └─────────────┘     └─────────────┘                  │
│                                                                             │
│  Data Transformation:                                                       │
│                                                                             │
│  Playwright TestResult          →          Health Check                     │
│  ───────────────────────────────────────────────────────                   │
│  test.title                     →          check.name                       │
│  slugify(test.title)            →          check.id                         │
│  test.location.file             →          check.file                       │
│  result.status                  →          check.status (mapped)            │
│  result.error?.message          →          check.message                    │
│  result.duration                →          check.duration                   │
│                                                                             │
│  Status Mapping:                                                            │
│  ───────────────                                                            │
│  'passed'   → 'pass'                                                        │
│  'failed'   → 'fail'                                                        │
│  'timedOut' → 'fail'                                                        │
│  'skipped'  → 'warn'                                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Health Report Endpoint (`/api/health/report`)

**Responsibility**: Accept external test results, validate, and log

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     POST /api/health/report                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Request Flow:                                                              │
│                                                                             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌──────────┐ │
│  │  Receive    │     │  Validate   │     │  Transform  │     │  Log     │ │
│  │  JSON       │────►│  Fields     │────►│  to Report  │────►│  Entry   │ │
│  └─────────────┘     └─────────────┘     └─────────────┘     └──────────┘ │
│                             │                                              │
│                             ▼                                              │
│                      ┌─────────────┐                                       │
│                      │  400 Error  │ (if invalid)                          │
│                      └─────────────┘                                       │
│                                                                             │
│  Validation Rules:                                                          │
│  ─────────────────                                                          │
│  • category: required, string                                               │
│  • checks: required, array                                                  │
│  • checks[].id: required, string                                            │
│  • checks[].status: required, 'pass'|'fail'|'warn'                         │
│  • attribution: optional, object                                            │
│                                                                             │
│  Summary Calculation:                                                       │
│  ────────────────────                                                       │
│  total    = checks.length                                                   │
│  passed   = checks.filter(status === 'pass').length                         │
│  failed   = checks.filter(status === 'fail').length                         │
│  warnings = checks.filter(status === 'warn').length                         │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3. e2e-behavior Check Type

**Responsibility**: Link declarative health checks to E2E test results

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     e2e-behavior Check Executor                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Configuration:                                                             │
│  ──────────────                                                             │
│  {                                                                          │
│    "id": "lens-selection-works",                                            │
│    "type": "e2e-behavior",                                                  │
│    "test": "engagement-behaviors.spec.ts:lens selection persists"           │
│  }                                                                          │
│                                                                             │
│  Execution Flow:                                                            │
│                                                                             │
│  ┌───────────────┐     ┌───────────────┐     ┌───────────────┐            │
│  │ Parse test    │     │ Load health   │     │ Find test     │            │
│  │ reference     │────►│ log           │────►│ in e2e-tests  │            │
│  │               │     │               │     │ category      │            │
│  │ file:testname │     │ entries[]     │     │               │            │
│  └───────────────┘     └───────────────┘     └───────┬───────┘            │
│                                                      │                     │
│                        ┌─────────────────────────────┼─────────────────┐  │
│                        │                             │                 │  │
│                        ▼                             ▼                 ▼  │
│                 ┌─────────────┐            ┌─────────────┐    ┌──────────┐│
│                 │ Test Found  │            │ No E2E Data │    │ Test Not ││
│                 │             │            │             │    │ Found    ││
│                 │ Return test │            │ Return      │    │          ││
│                 │ status      │            │ 'warn'      │    │ Return   ││
│                 └─────────────┘            └─────────────┘    │ 'warn'   ││
│                                                               └──────────┘│
│                                                                             │
│  Test Reference Format:                                                     │
│  ──────────────────────                                                     │
│  "file.spec.ts:test name"                                                   │
│                                                                             │
│  Matching Strategy:                                                         │
│  ──────────────────                                                         │
│  1. Slugify test name → check ID                                            │
│  2. Exact match on ID                                                       │
│  3. Fallback: substring match on name                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Integration Points

### Playwright Integration

```typescript
// playwright.config.ts
export default defineConfig({
  reporter: [
    ['html'],                                    // Keep existing
    ['list'],                                    // Keep existing
    ['./tests/reporters/health-reporter.ts']    // ADD: Health reporter
  ],
});
```

### Server Integration

```javascript
// server.js
const healthValidator = require('./lib/health-validator.js');

// Existing endpoints (unchanged)
app.get('/api/health', ...);
app.get('/api/health/config', ...);
app.get('/api/health/history', ...);
app.post('/api/health/run', ...);

// New endpoint
app.post('/api/health/report', ...);  // ADD
```

### Health Config Integration

```json
// health-config.json
{
  "version": "1.1",
  "display": {
    "categoryLabels": {
      "engagement": "Engagement System"  // ADD
    }
  },
  "engagementChecks": [...]  // ADD
}
```

---

## Error Handling

### Reporter Errors

| Scenario | Handling | User Impact |
|----------|----------|-------------|
| Server not running | Log warning, continue | Tests pass, no Health entry |
| Network error | Log warning, continue | Tests pass, no Health entry |
| Invalid response | Log warning, continue | Tests pass, no Health entry |
| Timeout | Log warning, continue | Tests pass, no Health entry |

**Principle**: Reporter failures never fail tests.

### API Errors

| Scenario | Response | Status |
|----------|----------|--------|
| Missing category | `{ error: "..." }` | 400 |
| Missing checks | `{ error: "..." }` | 400 |
| Invalid status | `{ error: "..." }` | 400 |
| Log write failure | `{ error: "..." }` | 500 |

### Check Execution Errors

| Scenario | Result | Message |
|----------|--------|---------|
| No test ref | `warn` | "No test reference specified" |
| No E2E data | `warn` | "No E2E test data available" |
| Test not found | `warn` | "Test not found: {ref}" |

---

## Security Considerations

### API Protection

The `/api/health/report` endpoint is internal-only:

1. **No authentication required** - Server runs locally or in trusted environment
2. **No external access** - Not exposed to public internet
3. **Input validation** - All fields validated before processing

### Log Integrity

Health log is append-only with attribution:

1. **Provenance tracking** - Every entry has `triggeredBy` field
2. **Timestamp** - Entries ordered chronologically
3. **FIFO cap** - Old entries removed, recent history preserved

---

## Performance Considerations

### Reporter Overhead

| Operation | Expected Time |
|-----------|---------------|
| Collect results | <1ms per test |
| Build payload | <10ms |
| POST to server | <100ms (local) |
| Total overhead | <200ms |

**Mitigation**: POST happens after all tests complete, not blocking test execution.

### Log Size

| Limit | Value |
|-------|-------|
| Max entries | 100 (FIFO) |
| Entry size | ~5KB (40 tests) |
| Max log size | ~500KB |

---

## Future Extensibility

### Phase 2 Integration

Epic 1+ will add more engagement checks:

```json
{
  "id": "state-machine-valid",
  "type": "unit-test",
  "test": "engagement-machine.test.ts:*"
}
```

New check type `unit-test` for Vitest results.

### Dashboard UI (Future)

Health API already returns all needed data for dashboard:
- Categories with status
- Individual checks with details
- History with trends
- Attribution for debugging

### CI/CD Integration

```yaml
# Future: GitHub Actions
- name: Check Health
  run: |
    curl -s $API/health | jq '.summary.failed' | grep -q '^0$'
```

---

## Testing Strategy

### Unit Tests

```typescript
// tests/unit/health-reporter.test.ts
describe('HealthReporter', () => {
  test('collects test results on onTestEnd', ...);
  test('maps passed status correctly', ...);
  test('maps failed status correctly', ...);
  test('maps skipped status to warn', ...);
  test('slugifies test names', ...);
  test('handles empty results', ...);
});
```

### Integration Tests

```typescript
// tests/integration/health-api.test.ts (extend)
describe('POST /api/health/report', () => {
  test('accepts valid report', ...);
  test('rejects missing category', ...);
  test('rejects missing checks', ...);
  test('calculates summary correctly', ...);
  test('logs with attribution', ...);
});
```

### E2E Verification

1. Run `npx playwright test`
2. Check `health-log.json` for new entry
3. Verify entry has `e2e-tests` category
4. Verify attribution shows `playwright`

---

## References

- REPO_AUDIT.md - Current state analysis
- SPEC.md - Detailed requirements
- Playwright Reporter API - https://playwright.dev/docs/api/class-reporter
- `lib/health-validator.js` - Health engine implementation
