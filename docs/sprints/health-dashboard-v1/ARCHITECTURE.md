# Architecture — health-dashboard-v1

## Overview

The Health Dashboard adds a new Foundation console that displays system health status and maintains a persistent log. It uses the existing health check logic, exposed via new API endpoints, with results stored in a JSON log file.

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Foundation UI                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  NavSidebar │  │ HealthDash  │  │     Other Consoles      │  │
│  │  + Health   │  │  Console    │  │                         │  │
│  │    link     │──│             │  │                         │  │
│  └─────────────┘  └──────┬──────┘  └─────────────────────────┘  │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Express Server                              │
│  ┌─────────────────┐  ┌─────────────────┐                       │
│  │ GET /api/health │  │ GET /api/health │                       │
│  │                 │  │    /history     │                       │
│  └────────┬────────┘  └────────┬────────┘                       │
│           │                    │                                 │
│           ▼                    ▼                                 │
│  ┌─────────────────────────────────────────┐                    │
│  │         lib/health-validator.js          │                    │
│  │  (shared validation logic)               │                    │
│  └─────────────────────────────────────────┘                    │
└──────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                  │
│  ┌──────────────────┐  ┌──────────────────────────────────────┐ │
│  │ knowledge/       │  │ infrastructure/health-log.json       │ │
│  │ exploration/     │  │ [{ timestamp, summary, categories }] │ │
│  │ (validated)      │  │                                      │ │
│  └──────────────────┘  └──────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Data Structures

### HealthCheck
```typescript
interface HealthCheck {
  name: string
  status: 'pass' | 'fail' | 'warn'
  message: string
  impact?: string
  inspect?: string
  file?: string
}
```

### HealthCategory
```typescript
interface HealthCategory {
  name: string
  status: 'pass' | 'fail' | 'warn'
  checks: HealthCheck[]
}
```

### HealthReport
```typescript
interface HealthReport {
  timestamp: string  // ISO 8601
  categories: HealthCategory[]
  summary: {
    total: number
    passed: number
    failed: number
    warnings: number
  }
}
```

### HealthLogEntry
```typescript
interface HealthLogEntry extends HealthReport {
  id: string  // UUID
  triggeredBy: 'manual' | 'api' | 'ci'
}
```

### HealthLog (persisted)
```typescript
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
│   └── health-validator.js        # NEW: Shared validation logic
├── data/
│   └── infrastructure/
│       └── health-log.json        # NEW: Persistent health log
├── src/
│   └── foundation/
│       ├── consoles/
│       │   └── HealthDashboard.tsx  # NEW: Health console
│       └── layout/
│           └── NavSidebar.tsx       # MODIFY: Add health nav item
├── server.js                        # MODIFY: Add /api/health endpoints
└── scripts/
    └── health-check.js              # MODIFY: Use shared validator
```

## API Contracts

### GET /api/health
Returns current health report.

**Response:**
```json
{
  "timestamp": "2025-12-21T18:00:00Z",
  "categories": [...],
  "summary": { "total": 14, "passed": 14, "failed": 0, "warnings": 0 }
}
```

### GET /api/health/history
Returns health log entries.

**Query params:**
- `limit` (optional, default 50, max 100)
- `status` (optional: 'pass' | 'fail' | 'warn')

**Response:**
```json
{
  "entries": [...],
  "total": 50
}
```

### POST /api/health/run
Triggers a health check and appends to log.

**Response:**
```json
{
  "id": "uuid",
  "timestamp": "...",
  "summary": {...}
}
```

## Configuration

### Health Log Location
`data/infrastructure/health-log.json`

### Log Constraints
- Max entries: 100 (FIFO when exceeded)
- Entry retention: Indefinite (within limit)

## Integration Points

- **Genesis Console:** Could display health summary widget (future)
- **CI Pipeline:** Already uploads health report; could POST to /api/health/run
- **CLI:** `npm run health` continues to work independently
