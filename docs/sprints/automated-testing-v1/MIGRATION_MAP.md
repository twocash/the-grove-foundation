# Migration Map — Automated Testing Infrastructure

## Overview
Add testing infrastructure to Grove Terminal. No existing tests to migrate — greenfield implementation.

## Files to Create

### Configuration Files

#### `vitest.config.ts`
**Purpose:** Configure Vitest test runner
**Location:** Project root
**Depends on:** None

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
  },
})
```

---

#### `playwright.config.ts`
**Purpose:** Configure Playwright E2E tests
**Location:** Project root
**Depends on:** None

---

### Test Files

#### `tests/unit/schema.test.ts`
**Purpose:** Validate knowledge schema integrity
**Depends on:** `data/knowledge/*.json`, `data/exploration/*.json`
**Tests:**
- All JSON files parse
- All journey→hub references resolve
- All journey→entryNode references resolve
- All node→journey references resolve
- All node.primaryNext references resolve
- Hub paths follow pattern

---

#### `tests/unit/journey-navigation.test.ts`
**Purpose:** Validate journey node chains and counting
**Depends on:** `data/exploration/journeys.json`, `nodes.json`
**Tests:**
- Each journey has expected node count
- Node chains are traversable
- No dead-end nodes (except terminals)

---

#### `tests/integration/narrative-api.test.ts`
**Purpose:** Validate /api/narrative endpoint contract
**Depends on:** Server running
**Tests:**
- Returns 200 status
- Response has journeys, nodes, hubs objects
- Counts match expected

---

#### `tests/integration/rag-orchestration.test.ts`
**Purpose:** Validate hub routing logic
**Depends on:** Server running
**Tests:**
- Deterministic mode loads correct hub per journey
- Discovery mode routes queries to matching hubs
- Fallback works when split files missing

---

#### `tests/e2e/smoke.spec.ts`
**Purpose:** Critical user path validation
**Depends on:** Full application running
**Tests:**
- Landing page loads without errors
- Can start a journey
- Can submit a query

---

### Utility Files

#### `tests/utils/schema-loader.ts`
**Purpose:** Load and parse schema files for tests
**Exports:** `loadHubs()`, `loadJourneys()`, `loadNodes()`

---

#### `tests/utils/api.ts`
**Purpose:** API call wrappers for integration tests
**Exports:** `fetchNarrative()`, `sendChat()`

---

#### `tests/utils/health-report.ts`
**Purpose:** Generate human-readable health report
**Exports:** `generateHealthReport()`, `HealthReport` type

---

### Scripts

#### `scripts/health-check.js`
**Purpose:** CLI entry point for health report
**Usage:** `npm run health`
**Depends on:** `tests/utils/health-report.ts`

---

### CI Configuration

#### `.github/workflows/test.yml`
**Purpose:** Run tests on every PR
**Triggers:** pull_request, push to main
**Jobs:** unit-tests, e2e-tests

---

## Files to Modify

### `package.json`
**Lines:** scripts section
**Add:**
```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "test:ui": "vitest --ui",
  "test:integration": "vitest run tests/integration",
  "test:e2e": "playwright test",
  "test:all": "npm run test && npm run test:e2e",
  "health": "node scripts/health-check.js"
}
```
**Add devDependencies:**
```json
"devDependencies": {
  "vitest": "^2.0.0",
  "@vitest/ui": "^2.0.0",
  "@playwright/test": "^1.40.0"
}
```

---

## Directory Structure to Create

```bash
mkdir -p tests/unit
mkdir -p tests/integration
mkdir -p tests/e2e
mkdir -p tests/fixtures/valid-schema
mkdir -p tests/fixtures/broken-schema
mkdir -p tests/utils
```

---

## Execution Order

### Phase 1: Infrastructure
1. Install dependencies
2. Create directory structure
3. Create vitest.config.ts
4. Create playwright.config.ts
5. Add scripts to package.json
6. Verify `npm test` runs (no tests yet)

### Phase 2: Schema Tests
1. Create tests/utils/schema-loader.ts
2. Create tests/unit/schema.test.ts
3. Run `npm test` — should pass

### Phase 3: Journey Tests
1. Create tests/unit/journey-navigation.test.ts
2. Run `npm test` — should pass

### Phase 4: Health Report
1. Create tests/utils/health-report.ts
2. Create scripts/health-check.js
3. Run `npm run health` — should output report

### Phase 5: API Tests
1. Create tests/utils/api.ts
2. Create tests/integration/narrative-api.test.ts
3. Run `npm run test:integration` (server required)

### Phase 6: RAG Tests
1. Create tests/integration/rag-orchestration.test.ts
2. Run `npm run test:integration`

### Phase 7: E2E Tests
1. Run `npx playwright install chromium`
2. Create tests/e2e/smoke.spec.ts
3. Run `npm run test:e2e`

### Phase 8: CI Integration
1. Create .github/workflows/test.yml
2. Push and verify CI runs

### Phase 9: Documentation
1. Create docs/TESTING.md
2. Update SKILL.md with testing requirements

---

## Rollback Plan

### If tests break build:
1. Tests are additive — existing code unchanged
2. Remove test files and config
3. Revert package.json changes

### Commands:
```bash
rm -rf tests/
rm vitest.config.ts playwright.config.ts
git checkout -- package.json package-lock.json
```

---

## Verification Checklist

After each phase:
- [ ] `npm run build` passes
- [ ] No TypeScript errors
- [ ] Tests that exist pass

After all phases:
- [ ] `npm test` passes (~30 tests)
- [ ] `npm run health` outputs report
- [ ] `npm run test:e2e` passes
- [ ] CI runs on PR
