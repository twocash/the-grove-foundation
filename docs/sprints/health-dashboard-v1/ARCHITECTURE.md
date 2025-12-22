# Architecture — health-dashboard-v1 (Revised)

## Revision Note
Aligned with Trellis Architecture three-layer DEX Stack: Engine (Trellis Frame), Corpus (Substrate), Configuration (Conditions).

## Overview

The Health Dashboard implements the Trellis Architecture's DEX (Declarative Exploration) standard for system health monitoring. Check definitions, display labels, and validation rules live in JSON configuration—not code. The engine interprets configuration at runtime, enabling domain experts to define appropriate checks without engineering involvement.

**First Order Directive:** *Separation of Exploration Logic from Execution Capability.*

## System Diagram (DEX Stack)

```
┌─────────────────────────────────────────────────────────────────────────┐
│            LAYER 3: CONFIGURATION (The Conditions) — DEX Layer          │
│            Status: Declarative | Change Velocity: High                  │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │              data/infrastructure/health-config.json               │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐   │  │
│  │  │ engineChecks│  │corpusChecks │  │ display (labels, theme) │   │  │
│  │  │ (Trellis)   │  │ (Substrate) │  │ (View)                  │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│  "A legal analyst defines a 'Contradiction' nutrient; a biologist       │
│   defines a 'Replication Error' nutrient." — Trellis Codex             │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│            LAYER 1: ENGINE (The Trellis Frame) — Fixed Infrastructure   │
│            Status: Fixed | Change Velocity: Low                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    lib/health-validator.js                       │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐    │   │
│  │  │ loadConfig() │  │ runChecks()  │  │ interpretCheck()   │    │   │
│  │  │              │  │ (iterates    │  │ (type→executor)    │    │   │
│  │  │              │  │  config)     │  │                    │    │   │
│  │  └──────────────┘  └──────────────┘  └────────────────────┘    │   │
│  │                                                                 │   │
│  │  "The engine does not know WHAT it is refining, only HOW."     │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         server.js                                │   │
│  │  GET /api/health  │  GET /api/health/config  │  POST /run       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                   HealthDashboard.tsx                            │   │
│  │  Reads display config → renders labels from config, not code    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│            LAYER 2: CORPUS (The Substrate) — Variable Input             │
│            Status: Variable | Change Velocity: Medium                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐     │
│  │ knowledge/      │  │ exploration/    │  │ infrastructure/     │     │
│  │  hubs.json      │  │  journeys.json  │  │  health-log.json    │     │
│  │                 │  │  nodes.json     │  │                     │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────────┘     │
│                                                                         │
│  "The Trellis can be planted in any substrate:"                        │
│  │ Grove Research │ Legal Discovery │ Academic Lit │ Enterprise │      │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Structures

### HealthConfig (Configuration Layer — DEX)
```typescript
interface HealthConfig {
  version: string
  display: {
    dashboardTitle: string
    categoryLabels: Record<string, string>
    severityColors?: Record<string, string>
  }
  engineChecks: HealthCheckDefinition[]  // Trellis Frame checks
  corpusChecks: HealthCheckDefinition[]  // Substrate checks
}

interface HealthCheckDefinition {
  id: string
  name: string
  category?: string
  type: 'json-exists' | 'reference-check' | 'count-range' | 'chain-valid' | 'custom'
  source?: { file: string; path: string }
  target?: { file: string; path: string }
  params?: Record<string, any>  // Type-specific parameters
  severity: 'critical' | 'warning' | 'info'
  impact?: string   // Human-readable consequence of failure
  inspect?: string  // How to investigate/fix
}
```

### Check Type Executors (Engine Layer — Trellis Frame)
```typescript
// Engine provides executors for each check type
// The engine doesn't know WHAT it's checking, only HOW to check
const checkExecutors: Record<string, CheckExecutor> = {
  'json-exists': (def, dataDir) => { /* verify file exists and parses */ },
  'reference-check': (def, dataDir) => { /* verify all refs resolve */ },
  'count-range': (def, dataDir) => { /* verify count within range */ },
  'chain-valid': (def, dataDir) => { /* verify linked list integrity */ },
  'custom': (def, dataDir) => { /* execute custom validation function */ }
}
```

### HealthReport (Engine Output with Attribution)
```typescript
interface HealthReport {
  timestamp: string  // ISO 8601
  configVersion: string
  engineVersion: string
  categories: HealthCategory[]
  summary: {
    total: number
    passed: number
    failed: number
    warnings: number
  }
}

interface HealthCategory {
  id: string
  name: string  // From config display.categoryLabels
  status: 'pass' | 'fail' | 'warn'
  checks: HealthCheckResult[]
}

interface HealthCheckResult {
  id: string
  name: string
  status: 'pass' | 'fail' | 'warn'
  message: string
  impact?: string   // From config
  inspect?: string  // From config
  details?: any     // Type-specific details
}
```

### HealthLogEntry (Corpus Layer — with Provenance)
```typescript
// "In the Trellis, a fact without a root is a weed."
interface HealthLogEntry extends HealthReport {
  id: string  // UUID
  attribution: {
    triggeredBy: 'manual' | 'api' | 'ci' | 'startup'
    userId?: string        // Grove ID (who collapsed the superposition)
    sessionId?: string     // Terminal session
    deploymentId?: string  // For future multi-deployment
  }
}

interface HealthLog {
  version: string
  maxEntries: number
  entries: HealthLogEntry[]
}
```

## File Organization

```
the-grove-foundation/
├── lib/
│   └── health-validator.js        # Engine (Trellis Frame)
├── data/
│   └── infrastructure/
│       ├── health-config.json     # Configuration (DEX Layer)
│       └── health-log.json        # Corpus (Substrate)
├── src/
│   └── foundation/
│       ├── consoles/
│       │   └── HealthDashboard.tsx  # Engine (UI)
│       └── layout/
│           └── NavSidebar.tsx       # Engine (Navigation)
├── server.js                        # Engine (API)
└── scripts/
    └── health-check.js              # Engine (CLI)
```

## API Contracts

### GET /api/health
Returns current health report with config-defined checks.

**Response:**
```json
{
  "timestamp": "2025-12-21T18:00:00Z",
  "configVersion": "1.0",
  "engineVersion": "0.1.0",
  "categories": [
    {
      "id": "schema-integrity",
      "name": "Schema Integrity",
      "status": "pass",
      "checks": [...]
    }
  ],
  "summary": { "total": 14, "passed": 14, "failed": 0, "warnings": 0 }
}
```

### GET /api/health/config
Returns current health configuration (DEX layer) for UI to read display settings.

**Response:**
```json
{
  "version": "1.0",
  "display": {
    "dashboardTitle": "System Health",
    "categoryLabels": {...}
  },
  "checkCount": { "engine": 2, "corpus": 12 }
}
```

### GET /api/health/history
Returns health log entries with attribution (provenance chain).

### POST /api/health/run
Triggers a health check, appends to log with attribution.

## Check Type Reference

| Type | Purpose | Params |
|------|---------|--------|
| `json-exists` | Verify file exists and parses | `target.file` |
| `reference-check` | Verify all references resolve | `source.file`, `source.path`, `target.file`, `target.path` |
| `count-range` | Verify count within range | `source.file`, `source.path`, `min?`, `max?` |
| `chain-valid` | Verify linked list integrity | `source.file`, `source.path`, `linkField`, `terminalValues[]` |
| `custom` | Run custom validation | `handler` (function name in registry) |

## Progressive Enhancement (Organic Scalability)

Per DEX Standard Principle IV: "Structure must precede growth, but not inhibit it."

1. **No config file** → Engine uses built-in defaults, logs warning
2. **Minimal config** → Only essential checks, default display labels
3. **Full config** → Custom checks, custom labels, custom severity colors

This enables new domains (Legal Trellis, Academic Trellis) to start simple and refine over time.
