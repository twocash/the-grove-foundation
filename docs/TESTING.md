# Testing Guide

This document covers the testing infrastructure for Grove Terminal.

## Test Stack

| Tool | Purpose | Location |
|------|---------|----------|
| **Vitest** | Unit & integration tests | `tests/unit/`, `tests/integration/` |
| **Playwright** | E2E browser tests | `tests/e2e/` |
| **Health Check** | Schema validation CLI | `scripts/health-check.js` |

## Running Tests

### Quick Commands

```bash
# Run all unit tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with UI
npm run test:ui

# Run integration tests (requires server)
npm run test:integration

# Run E2E tests (requires dev server)
npm run test:e2e

# Run all tests
npm run test:all

# Run health check
npm run health
npm run health -- --json  # JSON output
```

### Test Categories

#### Unit Tests (`tests/unit/`)

Schema validation and journey navigation tests that run without a server:

- `schema.test.ts` - Validates data file structure and references
- `journey-navigation.test.ts` - Verifies journey chains are complete

#### Integration Tests (`tests/integration/`)

API contract tests that require the server running:

- `narrative-api.test.ts` - Tests `/api/narrative` endpoint

Run with: `npm run dev` (in separate terminal) then `npm run test:integration`

#### E2E Tests (`tests/e2e/`)

Browser automation tests:

- `smoke.spec.ts` - Basic page load and navigation tests

Run with: `npm run test:e2e`

## Health Check System

The health check provides a human-readable report of data integrity:

```bash
npm run health
```

Output example:
```
╔══════════════════════════════════════════════════════════════════╗
║                    GROVE TERMINAL HEALTH CHECK                   ║
╠══════════════════════════════════════════════════════════════════╣
║  Run: 2025-01-15 10:30:00                                     ║
║  Status: ✅  0 failures, 0 warnings                              ║
╚══════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────┐
│ SCHEMA INTEGRITY                                    ✅ PASS │
├─────────────────────────────────────────────────────────────────┤
│ ✓ 6 hubs defined (expected 6)                                  │
│ ✓ All journey→hub references valid                             │
│ ...                                                            │
└─────────────────────────────────────────────────────────────────┘
```

For CI integration, use JSON output:
```bash
npm run health -- --json > health-report.json
```

## Adding New Tests

### Unit Test Example

```typescript
// tests/unit/my-feature.test.ts
import { describe, test, expect } from 'vitest'

describe('My Feature', () => {
  test('does something', () => {
    expect(true).toBe(true)
  })
})
```

### E2E Test Example

```typescript
// tests/e2e/my-feature.spec.ts
import { test, expect } from '@playwright/test'

test('loads page', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('body')).toBeVisible()
})
```

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Pushes to `main`

See `.github/workflows/test.yml` for configuration.

### CI Jobs

1. **unit-tests**: Runs schema and navigation tests
2. **e2e-tests**: Runs browser tests (depends on unit-tests passing)

Artifacts uploaded:
- `health-report.json` - Schema validation results
- `playwright-report/` - E2E test results

## Test Utilities

### Schema Loader (`tests/utils/schema-loader.ts`)

```typescript
import { loadHubs, loadJourneys, loadNodes } from '../utils/schema-loader'

const hubs = loadHubs()      // Loads data/knowledge/hubs.json
const journeys = loadJourneys()  // Loads data/exploration/journeys.json
const nodes = loadNodes()    // Loads data/exploration/nodes.json
```

### API Client (`tests/utils/api.ts`)

```typescript
import { fetchNarrative, healthCheck } from '../utils/api'

const narrative = await fetchNarrative()  // GET /api/narrative
const status = await healthCheck()        // GET /health
```

## Best Practices

1. **Keep tests fast** - Target <30s for full suite
2. **Don't test LLM output** - Mock at routing layer
3. **Focus on contracts** - Test structure, not content
4. **Use health check** - For data validation in CI

## Troubleshooting

### Tests fail to find files

Check that you're running from the project root:
```bash
cd C:\GitHub\the-grove-foundation
npm test
```

### E2E tests timeout

Ensure dev server is accessible:
```bash
npm run dev  # Terminal 1
npm run test:e2e  # Terminal 2
```

### Integration tests skip

Server must be running on port 8080:
```bash
npm start  # or node server.js
npm run test:integration
```
