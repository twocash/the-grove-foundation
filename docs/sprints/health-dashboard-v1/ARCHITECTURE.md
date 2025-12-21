# Architecture — health-dashboard-v1 (Revised)

## Revision Note
Aligned with DAIRE three-layer architecture: Engine (fixed), Corpus (variable), Configuration (declarative).

## Overview

The Health Dashboard implements DAIRE's declarative configuration principle for system health monitoring. Check definitions, display labels, and validation rules live in JSON configuration—not code. The engine interprets configuration at runtime, enabling domain experts to define appropriate checks without engineering involvement.

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         LAYER 3: CONFIGURATION                          │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │              data/infrastructure/health-config.json               │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐   │  │
│  │  │ engineChecks│  │corpusChecks │  │ display (labels, theme) │   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          LAYER 1: ENGINE (Fixed)                        │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    lib/health-validator.js                       │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐    │   │
│  │  │ loadConfig() │  │ runChecks()  │  │ interpretCheck()   │    │   │
│  │  │              │  │ (iterates    │  │ (type→executor)    │    │   │
│  │  │              │  │  config)     │  │                    │    │   │
│  │  └──────────────┘  └──────────────┘  └────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         server.js                                │   │
│  │  GET /api/health  │  GET /api/health/history  │  POST /run      │   │
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
│                       LAYER 2: CORPUS (Variable)                        │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐     │
│  │ knowledge/      │  │ exploration/    │  │ infrastructure/     │     │
│  │  hubs.json      │  │  journeys.json  │  │  health-log.json    │     │
│  │                 │  │  nodes.json     │  │                     │     │
│  └─────────────────┘  └─────────────────┘  └─────────────────────┘     │
│                                                                         │
│  (In legal discovery deployment, this layer would contain:)            │
│  │ evidence/depositions.json │ timeline/events.json │ etc.            │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Structures

### HealthConfig (Configuration Layer)
```typescript
interface HealthConfig {
  version: string
  display: {
    dashboardTitle: string
    categoryLabels: Record<string, string>
    severityColors?: Record<string, string>
  }
  engineChecks: HealthCheckDefinition[]
  corpusChecks: HealthCheckDefinition[]
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

### Check Type Executors (Engine Layer)
```typescript
// Engine provides executors for each check type
const checkExecutors: Record<string, CheckExecutor> = {
  'json-exists': (def, dataDir) => { /* verify file exists and parses */ },
  'reference-check': (def, dataDir) => { /* verify all refs resolve */ },
  'count-range': (def, dataDir) => { /* verify count within range */ },
  'chain-valid': (def, dataDir) => { /* verify linked list integrity */ },
  'custom': (def, dataDir) => { /* execute custom validation function */ }
}
```

### HealthReport (Engine Output)
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
  details?: any     // Type-specific details (e.g., list of broken refs)
}
```

### HealthLogEntry (Corpus Layer - Persisted)
```typescript
interface HealthLogEntry extends HealthReport {
  id: string  // UUID
  attribution: {
    triggeredBy: 'manual' | 'api' | 'ci' | 'startup'
    userId?: string        // Grove ID when available
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
│   └── health-validator.js        # Config-driven validation engine
├── data/
│   └── infrastructure/
│       ├── health-config.json     # Declarative check definitions
│       └── health-log.json        # Persistent health log
├── src/
│   └── foundation/
│       ├── consoles/
│       │   └── HealthDashboard.tsx  # Config-driven UI
│       └── layout/
│           └── NavSidebar.tsx       # Add health nav item
├── server.js                        # Add /api/health endpoints
└── scripts/
    └── health-check.js              # CLI uses same validator
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

### GET /api/health/history
Returns health log entries with attribution.

**Query params:**
- `limit` (optional, default 50, max 100)
- `status` (optional: 'pass' | 'fail' | 'warn')

**Response:**
```json
{
  "entries": [
    {
      "id": "uuid",
      "timestamp": "...",
      "configVersion": "1.0",
      "attribution": {
        "triggeredBy": "api",
        "userId": null
      },
      "summary": {...}
    }
  ],
  "total": 50
}
```

### GET /api/health/config
Returns current health configuration (for UI to read display settings).

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

### POST /api/health/run
Triggers a health check and appends to log.

**Response:**
```json
{
  "id": "uuid",
  "timestamp": "...",
  "configVersion": "1.0",
  "summary": {...}
}
```

## Check Type Reference

| Type | Purpose | Params |
|------|---------|--------|
| `json-exists` | Verify file exists and parses | `target.file` |
| `reference-check` | Verify all references resolve | `source.file`, `source.path`, `target.file`, `target.path` |
| `count-range` | Verify count within range | `source.file`, `source.path`, `min?`, `max?` |
| `chain-valid` | Verify linked list integrity | `source.file`, `source.path`, `linkField`, `terminalValues[]` |
| `custom` | Run custom validation | `handler` (function name in registry) |

## Progressive Enhancement

Per DAIRE Principle 5, the system works with minimal configuration:

1. **No config file** → Engine uses built-in defaults, logs warning
2. **Minimal config** → Only essential checks, default display labels
3. **Full config** → Custom checks, custom labels, custom severity colors

This enables new domains to start simple and refine over time.
