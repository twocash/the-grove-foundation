# Health Report System

A human-readable diagnostic tool that shows system health, identifies failures, explains impact, and provides investigation commands.

## Purpose

When things break, developers need:
1. **What** is failing
2. **Impact** of the failure
3. **How** to investigate
4. **Where** to look (file/line)

The health report provides all four in a scannable format.

## Output Format

```
╔══════════════════════════════════════════════════════════════════╗
║                    SYSTEM HEALTH CHECK                           ║
╠══════════════════════════════════════════════════════════════════╣
║  Run: 2025-12-21 16:45:00                                        ║
║  Status: ⚠️  2 ISSUES FOUND                                       ║
╚══════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────┐
│ SCHEMA INTEGRITY                                          ✅ PASS │
├─────────────────────────────────────────────────────────────────┤
│ ✓ All files parse without errors                                │
│ ✓ All cross-references valid                                    │
│ ✓ Expected counts match                                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ API CONTRACTS                                             ❌ FAIL │
├─────────────────────────────────────────────────────────────────┤
│ ✗ GET /api/data — Missing 'items' in response                   │
│                                                                 │
│   IMPACT: Frontend cannot render list                           │
│   INSPECT: curl http://localhost:3000/api/data | jq .           │
│   FILE: server.js:150-200                                       │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ SUMMARY                                                         │
├─────────────────────────────────────────────────────────────────┤
│ Total checks: 15                                                │
│ Passed: 14                                                      │
│ Failed: 1                                                       │
│                                                                 │
│ Next steps:                                                     │
│ 1. Fix /api/data endpoint to include items array                │
└─────────────────────────────────────────────────────────────────┘
```

## Health Check Categories

| Category | What It Checks | Failure Impact |
|----------|----------------|----------------|
| Schema Integrity | JSON valid, references resolve | Runtime crashes |
| API Contracts | Endpoints return expected shape | Frontend breaks |
| Data Flows | Processing pipelines work | Silent data loss |
| Configuration | Env vars, settings correct | Startup failures |
| Dependencies | Required services available | Feature unavailable |

## Implementation Pattern

```typescript
interface HealthCheck {
  name: string
  status: 'pass' | 'fail' | 'warn'
  message: string
  impact?: string      // What breaks if this fails
  inspect?: string     // Command to investigate
  file?: string        // Where to look
}

interface HealthCategory {
  name: string
  status: 'pass' | 'fail' | 'warn'
  checks: HealthCheck[]
}

interface HealthReport {
  timestamp: string
  categories: HealthCategory[]
  summary: {
    total: number
    passed: number
    failed: number
    warnings: number
  }
}
```

## CLI Usage

```bash
# Full health check (human-readable)
npm run health

# JSON output (for CI)
npm run health -- --json

# Specific category
npm run health -- --category=schema

# Watch mode
npm run health -- --watch
```

## Writing Health Checks

### Good Health Check
```typescript
{
  name: 'User-Item References',
  status: missingRefs.length === 0 ? 'pass' : 'fail',
  message: missingRefs.length === 0 
    ? 'All user-item references valid'
    : `Invalid refs: ${missingRefs.join(', ')}`,
  impact: 'Users will see "Item not found" errors',
  inspect: 'node -e "require(\'./check-refs.js\')"',
  file: 'data/users.json'
}
```

### Bad Health Check (missing context)
```typescript
{
  name: 'References',
  status: 'fail',
  message: 'Check failed'  // No actionable information!
}
```

## Integration with CI

```yaml
- run: npm run health -- --json > health-report.json
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: health-report
    path: health-report.json
```

## Adding New Health Checks

1. Identify what can break
2. Write check that detects it
3. Include IMPACT and INSPECT
4. Add to appropriate category
5. Verify failure messages are actionable

## Health Check as Documentation

The health report doubles as living documentation:
- Shows system structure
- Documents expected values
- Provides investigation commands
- Links to relevant files

When the report passes, developers know the critical paths work.
When it fails, developers know exactly where to look.
