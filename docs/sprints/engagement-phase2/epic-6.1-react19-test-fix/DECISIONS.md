# Architectural Decision Records — Epic 6.1: React 19 Test Infrastructure Fix

## ADR-072: Use jsdom Environment for All Vitest Tests

### Status
Accepted

### Context
React hook tests fail with "React.act is not a function" because:
1. Vitest uses `environment: 'node'`
2. React 19 moved `act` from `react-dom/test-utils` to `react`
3. @testing-library/react needs DOM APIs

### Decision
Change vitest environment to `jsdom` for all tests.

### Consequences
**Positive:**
- React hook tests work correctly
- DOM APIs available for all tests
- No per-file environment configuration needed

**Negative:**
- Slight overhead for pure Node tests (negligible)
- jsdom must be installed (already is)

### Alternatives Considered
1. **Per-file environment comments** — Rejected: maintenance burden
2. **Update @testing-library/react** — Rejected: already on latest v16
3. **Downgrade React to 18** — Rejected: breaks existing code

---

## ADR-073: Centralized Test Setup File

### Status
Accepted

### Context
Need consistent test configuration:
- jest-dom matchers
- React cleanup
- Global mocks (localStorage, location)

### Decision
Create `tests/setup.ts` referenced by `vitest.config.ts`.

### Consequences
**Positive:**
- Single source of truth for test setup
- Mocks available in all tests
- Cleanup runs automatically

**Negative:**
- All tests run setup (tiny overhead)

---

## ADR-074: Mock localStorage in Setup (Not Per-Test)

### Status
Accepted

### Context
Multiple test files need localStorage mock:
- persistence.test.ts
- use-lens-state.test.ts
- use-journey-state.test.ts

### Decision
Move localStorage mock to setup.ts, available globally.

### Consequences
**Positive:**
- No duplicate mock code
- Consistent behavior across tests
- Can clear between tests via store reset

**Negative:**
- Tests share mock implementation

---

## ADR-075: Keep Integration Tests in Same Environment

### Status
Accepted

### Context
Integration tests (health-api, narrative-api) test server endpoints.
Could use Node environment since they don't render React.

### Decision
Keep all tests in jsdom environment for simplicity.

### Consequences
**Positive:**
- Simpler configuration
- No environment switching
- Integration tests still work (http requests don't need DOM)

**Negative:**
- None observed
