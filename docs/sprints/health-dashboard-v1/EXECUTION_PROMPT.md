# Execution Prompt — health-dashboard-v1 (Revised)

## Context

Add a Health Dashboard to the Grove Terminal Foundation UI with **declarative health configuration** aligned with the DAIRE Architecture Specification. This establishes the pattern for all future Grove infrastructure: domain-specific behavior in configuration, not code.

Key DAIRE principles being implemented:
- **Declarative Configuration** — Health checks defined in JSON, interpreted at runtime
- **Attribution Preservation** — Full provenance chain on all log entries
- **Three-Layer Separation** — Engine checks vs corpus checks explicitly separated
- **Progressive Enhancement** — Works without config, becomes more powerful with it

## Documentation

Sprint documentation in `docs/sprints/health-dashboard-v1/`:
- `REPO_AUDIT.md` — DAIRE alignment analysis
- `SPEC.md` — Goals with DAIRE acceptance criteria
- `ARCHITECTURE.md` — Three-layer system diagram, data structures
- `MIGRATION_MAP.md` — File-by-file changes with full config schema
- `DECISIONS.md` — 6 ADRs on declarative patterns
- `SPRINTS.md` — 7 epics, 23 stories

## Repository Intelligence

Key locations:
- `data/infrastructure/` — Where config and log files go
- `lib/` — Where shared validator goes
- `scripts/health-check.js` — CLI to refactor (currently ~280 lines of hardcoded logic)
- `server.js` — Add API endpoints around line 200-250
- `src/foundation/consoles/Genesis.tsx` — Reference for console patterns
- `src/foundation/layout/NavSidebar.tsx` — Add nav item

## Execution Order

### Phase 1: Configuration Layer

**Step 1.1:** Create health config file
```bash
mkdir -p data/infrastructure
```

Create `data/infrastructure/health-config.json`:
```json
{
  "version": "1.0",
  "display": {
    "dashboardTitle": "System Health",
    "categoryLabels": {
      "engine": "Engine Health",
      "schema-integrity": "Schema Integrity",
      "journey-navigation": "Journey Navigation",
      "rag-integration": "RAG Integration"
    }
  },
  "engineChecks": [
    {
      "id": "health-config-valid",
      "name": "Health Config Parseable",
      "category": "engine",
      "type": "json-exists",
      "target": { "file": "infrastructure/health-config.json" },
      "severity": "critical",
      "impact": "Health system cannot function without valid config",
      "inspect": "Validate JSON syntax in health-config.json"
    }
  ],
  "corpusChecks": [
    {
      "id": "hub-data-valid",
      "name": "Hub Data Parseable",
      "category": "schema-integrity",
      "type": "json-exists",
      "target": { "file": "knowledge/hubs.json" },
      "severity": "critical"
    },
    {
      "id": "journey-data-valid",
      "name": "Journey Data Parseable",
      "category": "schema-integrity",
      "type": "json-exists",
      "target": { "file": "exploration/journeys.json" },
      "severity": "critical"
    },
    {
      "id": "node-data-valid",
      "name": "Node Data Parseable",
      "category": "schema-integrity",
      "type": "json-exists",
      "target": { "file": "exploration/nodes.json" },
      "severity": "critical"
    },
    {
      "id": "journey-hub-refs",
      "name": "Journey→Hub References",
      "category": "schema-integrity",
      "type": "reference-check",
      "source": { "file": "exploration/journeys.json", "path": "journeys.*.hubId" },
      "target": { "file": "knowledge/hubs.json", "path": "hubs" },
      "severity": "critical",
      "impact": "Broken hub references cause navigation failures",
      "inspect": "Compare journeys.json hubId values against hubs.json keys"
    },
    {
      "id": "node-journey-refs",
      "name": "Node→Journey References",
      "category": "schema-integrity",
      "type": "reference-check",
      "source": { "file": "exploration/nodes.json", "path": "nodes.*.journeyId" },
      "target": { "file": "exploration/journeys.json", "path": "journeys" },
      "severity": "critical",
      "impact": "Orphaned nodes won't appear in any journey",
      "inspect": "Compare nodes.json journeyId values against journeys.json keys"
    },
    {
      "id": "journey-entry-refs",
      "name": "Journey Entry Node References",
      "category": "schema-integrity",
      "type": "reference-check",
      "source": { "file": "exploration/journeys.json", "path": "journeys.*.entryNodeId" },
      "target": { "file": "exploration/nodes.json", "path": "nodes" },
      "severity": "critical",
      "impact": "Journeys without valid entry nodes cannot start",
      "inspect": "Compare journeys.json entryNodeId values against nodes.json keys"
    },
    {
      "id": "node-next-refs",
      "name": "Node Next References",
      "category": "journey-navigation",
      "type": "reference-check",
      "source": { "file": "exploration/nodes.json", "path": "nodes.*.next" },
      "target": { "file": "exploration/nodes.json", "path": "nodes" },
      "severity": "critical",
      "params": { "allowNull": true },
      "impact": "Broken next references strand users mid-journey",
      "inspect": "Check nodes.json next values exist in nodes keys (null is valid terminal)"
    },
    {
      "id": "node-alt-next-refs",
      "name": "Node Alternate Next References",
      "category": "journey-navigation",
      "type": "reference-check",
      "source": { "file": "exploration/nodes.json", "path": "nodes.*.alternateNext" },
      "target": { "file": "exploration/nodes.json", "path": "nodes" },
      "severity": "critical",
      "params": { "allowNull": true },
      "impact": "Broken alternate paths frustrate exploration",
      "inspect": "Check nodes.json alternateNext values exist in nodes keys"
    },
    {
      "id": "journey-chains-complete",
      "name": "Journey Chains Reach Terminal",
      "category": "journey-navigation",
      "type": "chain-valid",
      "source": { "file": "exploration/journeys.json", "path": "journeys" },
      "params": {
        "entryField": "entryNodeId",
        "nodeFile": "exploration/nodes.json",
        "linkField": "next",
        "maxDepth": 50,
        "terminalValues": [null]
      },
      "severity": "warning",
      "impact": "Incomplete chains may leave users stranded or in loops",
      "inspect": "Trace from each journey's entryNodeId following next until null or maxDepth"
    }
  ]
}
```

**Step 1.2:** Create health log file
Create `data/infrastructure/health-log.json`:
```json
{
  "version": "1.0",
  "maxEntries": 100,
  "entries": []
}
```

---

### Phase 2: Engine Layer (Validator)

Create `lib/health-validator.js`:

This module must implement:
1. `loadConfig()` — Load health-config.json, validate, return config or defaults
2. `runChecks(config)` — Execute all checks, return HealthReport with attribution
3. `loadHealthLog()` — Load health-log.json
4. `appendToHealthLog(report, attribution)` — Add entry with attribution, enforce cap
5. `getEngineVersion()` — Return version string (read from package.json)

Check type executors:
- `jsonExists(def, dataDir)` — Verify file exists and parses as valid JSON
- `referenceCheck(def, dataDir)` — Extract values at source.path, verify all exist in target.path
- `chainValid(def, dataDir)` — Follow links from entry through linkField until terminal or maxDepth

Key implementation notes:
- Use `import` for ES modules (project uses "type": "module")
- Path parsing: `nodes.*.hubId` means "for each key in nodes object, get hubId property"
- Attribution includes: configVersion, engineVersion, timestamp, triggeredBy
- Progressive enhancement: if config file missing, return sensible defaults with warning

Verify: 
```bash
node -e "import('./lib/health-validator.js').then(m => { const c = m.loadConfig(); console.log(m.runChecks(c)); })"
```

---

### Phase 3: CLI Migration

Refactor `scripts/health-check.js` to use shared validator:

```javascript
#!/usr/bin/env node
import { loadConfig, runChecks } from '../lib/health-validator.js'

const args = process.argv.slice(2)
const jsonOutput = args.includes('--json')

try {
  const config = loadConfig()
  const report = runChecks(config)
  
  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2))
  } else {
    printHumanReadable(report, config.display)
  }
  
  process.exit(report.summary.failed > 0 ? 1 : 0)
} catch (err) {
  console.error('Health check failed:', err.message)
  process.exit(1)
}

function printHumanReadable(report, display) {
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`  ${display.dashboardTitle || 'System Health'}`)
  console.log(`  Config: ${report.configVersion} | Engine: ${report.engineVersion}`)
  console.log(`${'═'.repeat(60)}\n`)
  
  for (const category of report.categories) {
    const label = display.categoryLabels?.[category.id] || category.id
    const icon = category.status === 'pass' ? '✓' : category.status === 'fail' ? '✗' : '⚠'
    console.log(`${icon} ${label}`)
    
    for (const check of category.checks) {
      const checkIcon = check.status === 'pass' ? '  ✓' : check.status === 'fail' ? '  ✗' : '  ⚠'
      console.log(`${checkIcon} ${check.name}: ${check.message}`)
      
      if (check.status === 'fail' && check.impact) {
        console.log(`      IMPACT: ${check.impact}`)
      }
      if (check.status === 'fail' && check.inspect) {
        console.log(`      INSPECT: ${check.inspect}`)
      }
    }
    console.log()
  }
  
  console.log(`${'─'.repeat(60)}`)
  console.log(`  Total: ${report.summary.total} | Passed: ${report.summary.passed} | Failed: ${report.summary.failed} | Warnings: ${report.summary.warnings}`)
  console.log(`${'─'.repeat(60)}\n`)
}
```

Verify: `npm run health` produces output with labels from config

---

### Phase 4: API Endpoints

Add to `server.js`:

```javascript
import { 
  loadConfig, 
  runChecks, 
  loadHealthLog, 
  appendToHealthLog,
  getEngineVersion 
} from './lib/health-validator.js'

// GET /api/health - Current health status
app.get('/api/health', (req, res) => {
  try {
    const config = loadConfig()
    const report = runChecks(config)
    res.json(report)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/health/config - Configuration for UI
app.get('/api/health/config', (req, res) => {
  try {
    const config = loadConfig()
    res.json({
      version: config.version,
      display: config.display,
      checkCount: {
        engine: config.engineChecks?.length || 0,
        corpus: config.corpusChecks?.length || 0
      }
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/health/history - Health log entries
app.get('/api/health/history', (req, res) => {
  try {
    const log = loadHealthLog()
    const limit = Math.min(parseInt(req.query.limit) || 50, 100)
    res.json({
      entries: log.entries.slice(0, limit),
      total: log.entries.length
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/health/run - Trigger check and log
app.post('/api/health/run', (req, res) => {
  try {
    const config = loadConfig()
    const report = runChecks(config)
    const entry = appendToHealthLog(report, { triggeredBy: 'api' })
    res.json(entry)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
```

Verify:
```bash
curl http://localhost:8080/api/health
curl http://localhost:8080/api/health/config
curl http://localhost:8080/api/health/history
curl -X POST http://localhost:8080/api/health/run
```

---

### Phase 5: Health Dashboard Component

Create `src/foundation/consoles/HealthDashboard.tsx`:
- Fetch `/api/health/config` on mount for display settings
- Fetch `/api/health` for current status
- Fetch `/api/health/history` for log entries
- Render using config.display.dashboardTitle and categoryLabels
- "Run Health Check" button POSTs to /api/health/run
- Failed checks expand to show impact/inspect

Follow Genesis.tsx patterns for styling and layout.

---

### Phase 6: Navigation

Update `src/foundation/layout/NavSidebar.tsx`:
```typescript
import { HeartPulse } from 'lucide-react'

// Add to navItems array:
{ id: 'health', icon: HeartPulse, label: 'System Health', route: '/foundation/health' },
```

Add route in App.tsx or router:
```tsx
import HealthDashboard from '@/foundation/consoles/HealthDashboard'

<Route path="/foundation/health" element={<HealthDashboard />} />
```

---

### Phase 7: Tests

Create `tests/integration/health-api.test.ts`:
- GET /api/health returns report with configVersion, engineVersion
- GET /api/health/config returns display settings
- GET /api/health/history returns entries with attribution
- POST /api/health/run creates entry

Create `tests/unit/health-config.test.ts`:
- Config loads correctly
- Missing config returns defaults with warning
- Malformed config handled gracefully

Verify: `npm test`

---

## Build Verification

After each phase:
```bash
npm run build
npm test
npm run health
```

## Success Criteria (DAIRE Alignment)

- [ ] Health checks defined declaratively in health-config.json
- [ ] Adding a check requires only config change, not code
- [ ] Engine checks separated from corpus checks in config
- [ ] Log entries include attribution (configVersion, engineVersion, triggeredBy)
- [ ] Display labels come from config.display
- [ ] Progressive enhancement: works without config, warns and uses defaults

## Success Criteria (Functionality)

- [ ] `npm run health` works with config-driven output
- [ ] All four API endpoints respond correctly
- [ ] Dashboard renders with config-driven labels
- [ ] "Run Health Check" button triggers check
- [ ] History shows entries with attribution
- [ ] Failed checks show impact/inspect
- [ ] Tests pass

## Forbidden Actions

- Do NOT hardcode check definitions in health-validator.js (they come from config)
- Do NOT hardcode display labels in HealthDashboard.tsx (read from API)
- Do NOT delete health-check.js (refactor it to use shared validator)
- Do NOT skip attribution on log entries (DAIRE requirement)
- Do NOT exceed 100 entries in health log (FIFO cap)
