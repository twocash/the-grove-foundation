# Migration Map — health-dashboard-v1 (Revised)

## Overview

Implement declarative health configuration aligned with DAIRE architecture. Creates 5 new files, modifies 3 existing files.

## Files to Create

### `data/infrastructure/health-config.json`
**Purpose:** Declarative health check definitions (DAIRE Layer 3)
**Depends on:** None
**Content:**
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
      "id": "journey-hub-refs",
      "name": "Journey→Hub References",
      "category": "schema-integrity",
      "type": "reference-check",
      "source": { "file": "exploration/journeys.json", "path": "journeys.*.hubId" },
      "target": { "file": "knowledge/hubs.json", "path": "hubs" },
      "severity": "critical",
      "impact": "Broken references cause navigation failures",
      "inspect": "Compare journeys.json hubId values against hubs.json keys"
    },
    {
      "id": "node-journey-refs",
      "name": "Node→Journey References",
      "category": "schema-integrity",
      "type": "reference-check",
      "source": { "file": "exploration/nodes.json", "path": "nodes.*.journeyId" },
      "target": { "file": "exploration/journeys.json", "path": "journeys" },
      "severity": "critical"
    },
    {
      "id": "journey-entry-refs",
      "name": "Journey Entry Node References",
      "category": "schema-integrity",
      "type": "reference-check",
      "source": { "file": "exploration/journeys.json", "path": "journeys.*.entryNodeId" },
      "target": { "file": "exploration/nodes.json", "path": "nodes" },
      "severity": "critical"
    },
    {
      "id": "node-next-refs",
      "name": "Node Next References",
      "category": "journey-navigation",
      "type": "reference-check",
      "source": { "file": "exploration/nodes.json", "path": "nodes.*.next" },
      "target": { "file": "exploration/nodes.json", "path": "nodes" },
      "severity": "critical",
      "params": { "allowNull": true }
    },
    {
      "id": "node-alt-next-refs",
      "name": "Node Alternate Next References",
      "category": "journey-navigation",
      "type": "reference-check",
      "source": { "file": "exploration/nodes.json", "path": "nodes.*.alternateNext" },
      "target": { "file": "exploration/nodes.json", "path": "nodes" },
      "severity": "critical",
      "params": { "allowNull": true }
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
        "terminalValues": [null]
      },
      "severity": "warning",
      "impact": "Incomplete chains leave users stranded",
      "inspect": "Trace from entryNodeId following next until null"
    },
    {
      "id": "hub-rag-files",
      "name": "Hub RAG File References",
      "category": "rag-integration",
      "type": "reference-check",
      "source": { "file": "knowledge/hubs.json", "path": "hubs.*.primaryFile" },
      "target": { "file": "knowledge/kb-export-manifest.json", "path": "files.*.name" },
      "severity": "warning",
      "params": { "allowNull": true }
    }
  ]
}
```

---

### `data/infrastructure/health-log.json`
**Purpose:** Persistent storage for health check history
**Depends on:** None
**Initial content:**
```json
{
  "version": "1.0",
  "maxEntries": 100,
  "entries": []
}
```

---

### `lib/health-validator.js`
**Purpose:** Config-driven validation engine (DAIRE Layer 1)
**Depends on:** health-config.json
**Key functions:**
- `loadConfig()` — Load and validate health-config.json
- `runChecks(config)` — Execute all checks, return HealthReport
- `interpretCheck(def, dataDir)` — Dispatch to type-specific executor
- `loadHealthLog()` — Load health-log.json
- `appendToHealthLog(report, attribution)` — Add entry, enforce cap
- `getEngineVersion()` — Return engine version string

**Check type executors:**
- `jsonExists(def, dataDir)` — Verify file exists and parses
- `referenceCheck(def, dataDir)` — Verify all refs resolve
- `countRange(def, dataDir)` — Verify count within range
- `chainValid(def, dataDir)` — Verify linked list reaches terminal

---

### `src/foundation/consoles/HealthDashboard.tsx`
**Purpose:** Config-driven health display (reads labels from config)
**Depends on:** API endpoints, health-config.json display settings
**Key behaviors:**
- Fetch `/api/health/config` on mount for display settings
- Fetch `/api/health` for current status
- Fetch `/api/health/history` for log entries
- Render category names from config, not hardcoded
- "Run Health Check" button POSTs to `/api/health/run`

---

### `tests/integration/health-api.test.ts`
**Purpose:** Tests for health API endpoints
**Depends on:** Server running
**Test cases:**
- GET /api/health returns valid report with configVersion
- GET /api/health/config returns display settings
- GET /api/health/history returns entries with attribution
- POST /api/health/run creates entry with attribution
- Invalid config file causes graceful degradation

---

## Files to Modify

### `server.js`
**Lines:** Near other API routes (~line 200-250)
**Change:** Add four health API endpoints
**Addition:**
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

// GET /api/health/config - Health configuration for UI
app.get('/api/health/config', (req, res) => {
  try {
    const config = loadConfig()
    res.json({
      version: config.version,
      display: config.display,
      checkCount: {
        engine: config.engineChecks.length,
        corpus: config.corpusChecks.length
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

---

### `src/foundation/layout/NavSidebar.tsx`
**Lines:** 1-30 (imports and navItems array)
**Change:** Add health dashboard nav item with HeartPulse icon
**Before:**
```typescript
import { Activity, BookOpen, Zap, Database, Sliders, Music } from 'lucide-react';
```
**After:**
```typescript
import { Activity, BookOpen, Zap, Database, Sliders, Music, HeartPulse } from 'lucide-react';

// In navItems array, add:
{ id: 'health', icon: HeartPulse, label: 'System Health', route: '/foundation/health' },
```

---

### `scripts/health-check.js`
**Lines:** Entire file refactored
**Change:** Use shared validator, output driven by config
**Before:** ~280 lines of inline validation logic
**After:**
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
  // ASCII formatting using display.categoryLabels
}
```

---

### Router file (App.tsx or equivalent)
**Change:** Add route for HealthDashboard
```tsx
import HealthDashboard from '@/foundation/consoles/HealthDashboard'

// In routes:
<Route path="/foundation/health" element={<HealthDashboard />} />
```

---

## Execution Order

1. Create `data/infrastructure/health-config.json` — Define all checks declaratively
2. Create `data/infrastructure/health-log.json` — Initialize empty log
3. Create `lib/health-validator.js` — Config-driven validation engine
4. Verify: Load config and run checks programmatically
5. Modify `scripts/health-check.js` — Use shared validator
6. Verify: `npm run health` produces output driven by config
7. Modify `server.js` — Add all four API endpoints
8. Verify: `curl localhost:8080/api/health` returns config-driven report
9. Create `src/foundation/consoles/HealthDashboard.tsx`
10. Modify `NavSidebar.tsx` — Add nav item
11. Modify router — Add route
12. Verify: Navigate to /foundation/health, see config-driven labels
13. Create `tests/integration/health-api.test.ts`
14. Verify: `npm test`

## Rollback Plan

### If config system breaks:
```bash
# Restore hardcoded validator temporarily
git checkout HEAD~1 -- scripts/health-check.js
```

### Full rollback:
```bash
git reset --hard HEAD~1
```

## Verification Checklist

- [ ] health-config.json defines all checks declaratively
- [ ] Adding a check to config.corpusChecks works without code change
- [ ] `npm run health` output reflects config display labels
- [ ] API returns configVersion and engineVersion
- [ ] Log entries include attribution chain
- [ ] Dashboard reads category labels from /api/health/config
- [ ] Engine checks vs corpus checks are separated in config
- [ ] `npm test` passes
