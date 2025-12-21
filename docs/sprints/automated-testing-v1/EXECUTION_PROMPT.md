# Execution Prompt — Automated Testing Infrastructure

## Context
Add automated testing to Grove Terminal to catch bugs before deploy. The recent knowledge architecture sprint deployed with three bugs that would have been caught by basic tests:
1. `nodes.json` not loaded by `loadKnowledgeConfig()`
2. `/api/narrative` endpoint ignored split files
3. Step counter showed wrong total

All three would have been caught by proper tests.

## Documentation
Sprint documentation in `docs/sprints/automated-testing-v1/`:
- `REPO_AUDIT.md` — Current state analysis (no tests exist)
- `SPEC.md` — Goals and acceptance criteria
- `ARCHITECTURE.md` — Test pyramid, health report system
- `MIGRATION_MAP.md` — File-by-file creation plan
- `DECISIONS.md` — ADRs explaining choices
- `SPRINTS.md` — Story breakdown

## Test Stack
- **Vitest** — Unit and integration tests
- **Playwright** — E2E browser tests
- **Health Report** — Human-readable status CLI

## Execution Order

### Phase 1: Framework Setup
```bash
# Install dependencies
npm install -D vitest @vitest/ui @playwright/test
npx playwright install chromium

# Create directories
mkdir -p tests/unit tests/integration tests/e2e tests/fixtures tests/utils
```

Create `vitest.config.ts`:
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

Create `playwright.config.ts`:
```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true,
  },
})
```

Update `package.json` scripts:
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

Verify: `npm test` should run (no tests yet)

### Phase 2: Schema Tests

Create `tests/utils/schema-loader.ts`:
```typescript
import * as fs from 'fs'
import * as path from 'path'

const DATA_DIR = path.join(__dirname, '../../data')

export function loadJson<T>(filePath: string): T {
  const fullPath = path.join(DATA_DIR, filePath)
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'))
}

export function loadHubs() {
  return loadJson<{ hubs: Record<string, any> }>('knowledge/hubs.json')
}

export function loadJourneys() {
  return loadJson<{ journeys: Record<string, any> }>('exploration/journeys.json')
}

export function loadNodes() {
  return loadJson<{ nodes: Record<string, any> }>('exploration/nodes.json')
}
```

Create `tests/unit/schema.test.ts`:
```typescript
import { describe, test, expect } from 'vitest'
import { loadHubs, loadJourneys, loadNodes } from '../utils/schema-loader'

describe('Knowledge Schema Validation', () => {
  const hubs = loadHubs()
  const journeys = loadJourneys()
  const nodes = loadNodes()

  test('all files parse without errors', () => {
    expect(hubs.hubs).toBeDefined()
    expect(journeys.journeys).toBeDefined()
    expect(nodes.nodes).toBeDefined()
  })

  test('expected counts', () => {
    expect(Object.keys(hubs.hubs)).toHaveLength(6)
    expect(Object.keys(journeys.journeys)).toHaveLength(6)
    expect(Object.keys(nodes.nodes)).toHaveLength(24)
  })

  test('all journey.hubId references exist in hubs', () => {
    for (const [id, journey] of Object.entries(journeys.journeys)) {
      expect(hubs.hubs[journey.hubId],
        `Journey "${id}" references non-existent hub "${journey.hubId}"`
      ).toBeDefined()
    }
  })

  test('all journey.entryNode references exist in nodes', () => {
    for (const [id, journey] of Object.entries(journeys.journeys)) {
      expect(nodes.nodes[journey.entryNode],
        `Journey "${id}" has invalid entryNode "${journey.entryNode}"`
      ).toBeDefined()
    }
  })

  test('all node.journeyId references exist in journeys', () => {
    for (const [id, node] of Object.entries(nodes.nodes)) {
      expect(journeys.journeys[node.journeyId],
        `Node "${id}" references non-existent journey "${node.journeyId}"`
      ).toBeDefined()
    }
  })

  test('all node.primaryNext references exist', () => {
    for (const [id, node] of Object.entries(nodes.nodes)) {
      if (node.primaryNext) {
        expect(nodes.nodes[node.primaryNext],
          `Node "${id}" has invalid primaryNext "${node.primaryNext}"`
        ).toBeDefined()
      }
    }
  })

  test('all hub paths follow hubs/{id}/ pattern', () => {
    for (const [id, hub] of Object.entries(hubs.hubs)) {
      expect(hub.path).toMatch(/^hubs\/[\w-]+\/$/,
        `Hub "${id}" has non-standard path "${hub.path}"`
      )
    }
  })
})
```

Run: `npm test` — should pass

### Phase 3: Journey Navigation Tests

Create `tests/unit/journey-navigation.test.ts`:
```typescript
import { describe, test, expect } from 'vitest'
import { loadJourneys, loadNodes } from '../utils/schema-loader'

const journeys = loadJourneys()
const nodes = loadNodes()

function getJourneyNodes(journeyId: string): string[] {
  return Object.entries(nodes.nodes)
    .filter(([_, node]) => node.journeyId === journeyId)
    .map(([id]) => id)
}

function traverseNodeChain(entryNode: string): string[] {
  const visited: string[] = []
  let current = entryNode
  while (current && !visited.includes(current)) {
    visited.push(current)
    current = nodes.nodes[current]?.primaryNext
  }
  return visited
}

describe('Journey Navigation', () => {
  test.each([
    ['simulation', 5],
    ['stakes', 3],
    ['ratchet', 4],
    ['diary', 4],
    ['emergence', 5],
    ['architecture', 3],
  ])('%s journey has %d nodes', (journeyId, expected) => {
    const journeyNodes = getJourneyNodes(journeyId)
    expect(journeyNodes).toHaveLength(expected)
  })

  test('all journeys have complete node chains', () => {
    for (const [id, journey] of Object.entries(journeys.journeys)) {
      const expectedNodes = getJourneyNodes(id)
      const chain = traverseNodeChain(journey.entryNode)
      expect(chain.length, `Journey "${id}" chain incomplete`).toBe(expectedNodes.length)
    }
  })

  test('ratchet node chain is correct', () => {
    const chain = traverseNodeChain('ratchet-hook')
    expect(chain).toEqual([
      'ratchet-hook',
      'ratchet-gap',
      'ratchet-floor',
      'ratchet-hybrid'
    ])
  })
})
```

Run: `npm test`

### Phase 4: Health Report System

Create `tests/utils/health-report.ts`:
```typescript
import { loadHubs, loadJourneys, loadNodes } from './schema-loader'

interface HealthCheck {
  name: string
  status: 'pass' | 'fail' | 'warn'
  message: string
  impact?: string
  inspect?: string
  file?: string
}

interface HealthCategory {
  name: string
  status: 'pass' | 'fail' | 'warn'
  checks: HealthCheck[]
}

export interface HealthReport {
  timestamp: string
  categories: HealthCategory[]
  summary: {
    total: number
    passed: number
    failed: number
    warnings: number
  }
}

export function generateHealthReport(): HealthReport {
  const categories: HealthCategory[] = []
  
  // Schema checks
  const schemaChecks: HealthCheck[] = []
  try {
    const hubs = loadHubs()
    const journeys = loadJourneys()
    const nodes = loadNodes()
    
    schemaChecks.push({
      name: 'Hub count',
      status: Object.keys(hubs.hubs).length === 6 ? 'pass' : 'fail',
      message: `${Object.keys(hubs.hubs).length} hubs defined`,
    })
    
    schemaChecks.push({
      name: 'Journey count',
      status: Object.keys(journeys.journeys).length === 6 ? 'pass' : 'fail',
      message: `${Object.keys(journeys.journeys).length} journeys defined`,
    })
    
    schemaChecks.push({
      name: 'Node count',
      status: Object.keys(nodes.nodes).length === 24 ? 'pass' : 'fail',
      message: `${Object.keys(nodes.nodes).length} nodes defined`,
    })
    
    // Check journey→hub references
    let hubRefErrors: string[] = []
    for (const [id, journey] of Object.entries(journeys.journeys)) {
      if (!hubs.hubs[journey.hubId]) {
        hubRefErrors.push(`${id} → ${journey.hubId}`)
      }
    }
    schemaChecks.push({
      name: 'Journey→Hub references',
      status: hubRefErrors.length === 0 ? 'pass' : 'fail',
      message: hubRefErrors.length === 0 
        ? 'All journey→hub references valid'
        : `Invalid: ${hubRefErrors.join(', ')}`,
      impact: hubRefErrors.length > 0 ? 'Journeys will fail to load RAG context' : undefined,
      inspect: 'node -e "require(\'./data/exploration/journeys.json\')"',
      file: 'data/exploration/journeys.json',
    })
    
  } catch (err) {
    schemaChecks.push({
      name: 'Schema parsing',
      status: 'fail',
      message: `Failed to parse: ${err.message}`,
      impact: 'Application will crash on load',
    })
  }
  
  const schemaStatus = schemaChecks.some(c => c.status === 'fail') ? 'fail' 
    : schemaChecks.some(c => c.status === 'warn') ? 'warn' : 'pass'
  
  categories.push({
    name: 'SCHEMA INTEGRITY',
    status: schemaStatus,
    checks: schemaChecks,
  })
  
  // Calculate summary
  const allChecks = categories.flatMap(c => c.checks)
  const summary = {
    total: allChecks.length,
    passed: allChecks.filter(c => c.status === 'pass').length,
    failed: allChecks.filter(c => c.status === 'fail').length,
    warnings: allChecks.filter(c => c.status === 'warn').length,
  }
  
  return {
    timestamp: new Date().toISOString(),
    categories,
    summary,
  }
}

export function formatReport(report: HealthReport): string {
  const lines: string[] = []
  
  const statusIcon = report.summary.failed > 0 ? '❌' 
    : report.summary.warnings > 0 ? '⚠️' : '✅'
  
  lines.push('╔══════════════════════════════════════════════════════════════════╗')
  lines.push('║                    GROVE TERMINAL HEALTH CHECK                   ║')
  lines.push('╠══════════════════════════════════════════════════════════════════╣')
  lines.push(`║  Run: ${report.timestamp.slice(0, 19).replace('T', ' ')}                                        ║`)
  lines.push(`║  Status: ${statusIcon}  ${report.summary.failed} failures, ${report.summary.warnings} warnings                              ║`)
  lines.push('╚══════════════════════════════════════════════════════════════════╝')
  lines.push('')
  
  for (const category of report.categories) {
    const catIcon = category.status === 'pass' ? '✅ PASS' 
      : category.status === 'fail' ? '❌ FAIL' : '⚠️ WARN'
    
    lines.push(`┌─────────────────────────────────────────────────────────────────┐`)
    lines.push(`│ ${category.name.padEnd(50)} ${catIcon.padStart(7)} │`)
    lines.push(`├─────────────────────────────────────────────────────────────────┤`)
    
    for (const check of category.checks) {
      const icon = check.status === 'pass' ? '✓' : check.status === 'fail' ? '✗' : '!'
      lines.push(`│ ${icon} ${check.message.slice(0, 60).padEnd(60)} │`)
      
      if (check.status !== 'pass' && check.impact) {
        lines.push(`│   IMPACT: ${check.impact.slice(0, 55).padEnd(55)} │`)
      }
      if (check.status !== 'pass' && check.inspect) {
        lines.push(`│   INSPECT: ${check.inspect.slice(0, 54).padEnd(54)} │`)
      }
    }
    
    lines.push(`└─────────────────────────────────────────────────────────────────┘`)
    lines.push('')
  }
  
  lines.push(`Summary: ${report.summary.passed}/${report.summary.total} passed`)
  
  return lines.join('\n')
}
```

Create `scripts/health-check.js`:
```javascript
#!/usr/bin/env node
const { generateHealthReport, formatReport } = require('../tests/utils/health-report')

const args = process.argv.slice(2)
const jsonOutput = args.includes('--json')

const report = generateHealthReport()

if (jsonOutput) {
  console.log(JSON.stringify(report, null, 2))
} else {
  console.log(formatReport(report))
}

process.exit(report.summary.failed > 0 ? 1 : 0)
```

Note: You'll need to compile TypeScript or use ts-node. Alternative: write health-check.js in plain JS.

Run: `npm run health`

### Phase 5: API Contract Tests

Create `tests/utils/api.ts`:
```typescript
const API_URL = process.env.API_URL || 'http://localhost:3000'

export async function fetchNarrative() {
  const res = await fetch(`${API_URL}/api/narrative`)
  return res.json()
}

export async function sendChat(message: string, journeyId?: string) {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, journeyId }),
  })
  return res.json()
}
```

Create `tests/integration/narrative-api.test.ts`:
```typescript
import { describe, test, expect, beforeAll } from 'vitest'
import { fetchNarrative } from '../utils/api'

describe('GET /api/narrative', () => {
  let response: any

  beforeAll(async () => {
    response = await fetchNarrative()
  })

  test('returns journeys object', () => {
    expect(response.journeys).toBeDefined()
    expect(typeof response.journeys).toBe('object')
  })

  test('returns nodes object', () => {
    expect(response.nodes).toBeDefined()
    expect(typeof response.nodes).toBe('object')
  })

  test('returns hubs object', () => {
    expect(response.hubs).toBeDefined()
    expect(typeof response.hubs).toBe('object')
  })

  test('correct journey count', () => {
    expect(Object.keys(response.journeys)).toHaveLength(6)
  })

  test('correct node count', () => {
    expect(Object.keys(response.nodes)).toHaveLength(24)
  })

  test('ratchet journey has correct hubId', () => {
    expect(response.journeys.ratchet.hubId).toBe('ratchet-effect')
  })
})
```

Run: `npm run test:integration` (server must be running)

### Phase 6: E2E Tests

Create `tests/e2e/smoke.spec.ts`:
```typescript
import { test, expect } from '@playwright/test'

test('landing page loads without console errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text())
  })
  
  await page.goto('/')
  await page.waitForTimeout(2000)
  
  expect(errors.filter(e => !e.includes('favicon'))).toHaveLength(0)
})

test('terminal panel is visible', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('text=Your Grove')).toBeVisible({ timeout: 10000 })
})
```

Run: `npm run test:e2e`

### Phase 7: CI Integration

Create `.github/workflows/test.yml`:
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
        if: always()
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
      - run: npm run build
      - run: npm run test:e2e
```

### Phase 8: Documentation

Create `docs/TESTING.md` with:
- How to run tests
- How to add new tests
- Health check usage
- CI workflow

Update SKILL.md (next step after this sprint completes)

---

## Build Verification

After each phase:
```bash
npm run build   # TypeScript compiles
npm test        # Unit tests pass
```

After Phase 5:
```bash
npm run dev &   # Start server
npm run test:integration
```

After Phase 6:
```bash
npm run test:e2e
```

---

## Success Criteria

- [ ] `npm test` passes with 15+ tests
- [ ] `npm run health` outputs human-readable report
- [ ] Schema validation catches intentionally broken reference
- [ ] Health report shows IMPACT and INSPECT for failures
- [ ] CI runs on every PR

---

## Forbidden Actions

- Do NOT aim for 100% coverage
- Do NOT add slow tests (keep suite <30 sec)
- Do NOT test Gemini output (mock at routing layer)
- Do NOT make E2E tests that depend on LLM responses
- Do NOT skip health report system (key deliverable)
