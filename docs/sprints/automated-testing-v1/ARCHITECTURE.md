# Architecture — Automated Testing Infrastructure

## Test Pyramid

```
            ┌─────────────┐
            │   E2E (5)   │  Playwright: Critical user journeys
            │  ~60 sec    │  Run on deploy, not every commit
            ├─────────────┤
            │ Integration │  API contract tests
            │    (15)     │  RAG orchestration tests
            │  ~10 sec    │  Run on every commit
            ├─────────────┤
            │    Unit     │  Schema validation
            │    (30+)    │  Journey navigation
            │   ~5 sec    │  Pure logic, no I/O
            └─────────────┘
```

## Directory Structure

```
tests/
├── unit/                        # Fast, isolated tests
│   ├── schema.test.ts           # Knowledge schema validation
│   └── journey-navigation.test.ts # Node chains, progress calc
│
├── integration/                 # API and data flow tests
│   ├── narrative-api.test.ts    # /api/narrative contract
│   └── rag-orchestration.test.ts # Hub routing logic
│
├── e2e/                         # Browser tests (Playwright)
│   └── smoke.spec.ts            # Critical user paths
│
├── fixtures/                    # Test data
│   ├── valid-schema/            # Known-good schema files
│   └── broken-schema/           # Known-bad for error testing
│
└── utils/                       # Test helpers
    ├── api.ts                   # API call wrappers
    ├── schema-loader.ts         # Load test fixtures
    └── health-report.ts         # Human-readable report generator

scripts/
└── health-check.js              # CLI entry point for health report

vitest.config.ts                 # Unit/integration config
playwright.config.ts             # E2E config
```

## Health Report System

### Purpose
Generate a human-readable report showing system health, what's failing, impact, and how to investigate.

### Output Format

```
╔══════════════════════════════════════════════════════════════════╗
║                    GROVE TERMINAL HEALTH CHECK                   ║
╠══════════════════════════════════════════════════════════════════╣
║  Run: 2025-12-21 16:45:00                                        ║
║  Status: ⚠️  2 ISSUES FOUND                                       ║
╚══════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────┐
│ SCHEMA INTEGRITY                                          ✅ PASS │
├─────────────────────────────────────────────────────────────────┤
│ ✓ 6 hubs defined                                                │
│ ✓ 6 journeys defined                                            │
│ ✓ 24 nodes defined                                              │
│ ✓ All journey→hub references valid                              │
│ ✓ All journey→entryNode references valid                        │
│ ✓ All node→journey references valid                             │
│ ✓ All node chains complete (no dead ends)                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ API CONTRACTS                                             ❌ FAIL │
├─────────────────────────────────────────────────────────────────┤
│ ✗ GET /api/narrative — Missing 'nodes' in response              │
│                                                                 │
│   IMPACT: Frontend cannot render journey progress               │
│   INSPECT: curl http://localhost:3000/api/narrative | jq .      │
│   FILE: server.js:658-732 (narrative endpoint)                  │
│                                                                 │
│ ✓ POST /api/chat — Response shape valid                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ JOURNEY NAVIGATION                                        ⚠️ WARN │
├─────────────────────────────────────────────────────────────────┤
│ ✓ simulation: 5 nodes, chain complete                           │
│ ✓ stakes: 3 nodes, chain complete                               │
│ ✗ ratchet: Expected 4 nodes, found 1                            │
│                                                                 │
│   IMPACT: Ratchet journey shows 1/1 instead of 1/4              │
│   INSPECT: node -e "require('./data/exploration/nodes.json')"   │
│   FILE: data/exploration/nodes.json                             │
│                                                                 │
│ ✓ diary: 4 nodes, chain complete                                │
│ ✓ emergence: 5 nodes, chain complete                            │
│ ✓ architecture: 3 nodes, chain complete                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ RAG ORCHESTRATION                                         ✅ PASS │
├─────────────────────────────────────────────────────────────────┤
│ ✓ Deterministic mode: All journey→hub mappings valid            │
│ ✓ Discovery mode: Tag matching functional                       │
│ ✓ Fallback: narratives.json loads when split files missing      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ SUMMARY                                                         │
├─────────────────────────────────────────────────────────────────┤
│ Total checks: 24                                                │
│ Passed: 22                                                      │
│ Failed: 1                                                       │
│ Warnings: 1                                                     │
│                                                                 │
│ Next steps:                                                     │
│ 1. Fix /api/narrative to include nodes in response              │
│ 2. Verify ratchet nodes extracted to nodes.json correctly       │
└─────────────────────────────────────────────────────────────────┘
```

### Report Categories

| Category | What It Checks | Failure Impact |
|----------|----------------|----------------|
| Schema Integrity | JSON valid, references resolve | Runtime crashes |
| API Contracts | Endpoints return expected shape | Frontend breaks |
| Journey Navigation | Node chains, counts correct | UX broken |
| RAG Orchestration | Hub routing works | Wrong context loaded |
| Event Flow | Analytics events fire | Silent data loss |

### CLI Usage

```bash
# Full health check
npm run health

# Specific category
npm run health -- --category=schema

# JSON output (for CI)
npm run health -- --json

# Watch mode (re-run on file change)
npm run health -- --watch
```

## Test Categories Detail

### 1. Schema Validation Tests

```typescript
// tests/unit/schema.test.ts
describe('Knowledge Schema', () => {
  test('all journey.hubId references exist in hubs.json')
  test('all journey.entryNode references exist in nodes.json')
  test('all node.journeyId references exist in journeys.json')
  test('all node.primaryNext references exist')
  test('all hub paths follow hubs/{id}/ pattern')
  test('no orphan nodes')
  test('no orphan hubs')
})
```

### 2. API Contract Tests

```typescript
// tests/integration/narrative-api.test.ts
describe('GET /api/narrative', () => {
  test('returns 200 status')
  test('response has journeys object')
  test('response has nodes object')
  test('response has hubs object')
  test('journey count matches expected')
  test('node count matches expected')
})
```

### 3. Journey Navigation Tests

```typescript
// tests/unit/journey-navigation.test.ts
describe('Journey Navigation', () => {
  test.each([
    ['simulation', 5],
    ['stakes', 3],
    ['ratchet', 4],
    ['diary', 4],
    ['emergence', 5],
    ['architecture', 3],
  ])('%s journey has %d nodes', (journeyId, expected) => {
    const nodes = getJourneyNodes(journeyId)
    expect(nodes).toHaveLength(expected)
  })
  
  test('all node chains are traversable')
  test('no dead-end nodes (except terminal)')
})
```

### 4. RAG Orchestration Tests

```typescript
// tests/integration/rag-orchestration.test.ts
describe('Hub Routing', () => {
  test.each([
    ['simulation', 'meta-philosophy'],
    ['ratchet', 'ratchet-effect'],
    ['architecture', 'technical-architecture'],
  ])('journey %s loads hub %s', async (journeyId, expectedHub) => {
    const context = await loadRagContext(journeyId)
    expect(context.hubId).toBe(expectedHub)
  })
})
```

### 5. E2E Smoke Tests

```typescript
// tests/e2e/smoke.spec.ts
test('landing page loads without console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  await page.goto('/')
  expect(errors).toHaveLength(0)
})

test('can start simulation journey', async ({ page }) => {
  await page.goto('/')
  await page.click('text=The Ghost in the Machine')
  await expect(page.locator('text=Step 1')).toBeVisible()
})
```

## Configuration Files

### vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    exclude: ['tests/e2e/**'],
    coverage: {
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'tests/'],
    },
  },
})
```

### playwright.config.ts

```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true,
  },
})
```

## CI Integration

### .github/workflows/test.yml

```yaml
name: Tests

on:
  pull_request:
  push:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test
      - run: npm run health -- --json > health-report.json
      - uses: actions/upload-artifact@v4
        with:
          name: health-report
          path: health-report.json

  e2e-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install chromium --with-deps
      - run: npm run test:e2e
```
