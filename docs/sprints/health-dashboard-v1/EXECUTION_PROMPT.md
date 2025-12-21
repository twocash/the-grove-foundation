# Execution Prompt — health-dashboard-v1

## Context

Add a Health Dashboard to the Grove Terminal Foundation UI with persistent health check logging. This enables admins to see system health status, run on-demand checks, and view historical results for trend analysis.

The sprint builds on the existing health check CLI (`npm run health`) by extracting its validation logic to a shared module, exposing it via API, and creating a React console for the Foundation UI.

## Documentation

Sprint documentation in `docs/sprints/health-dashboard-v1/`:
- `REPO_AUDIT.md` — Analysis of existing health infrastructure
- `SPEC.md` — Goals, acceptance criteria, success metrics
- `ARCHITECTURE.md` — System diagram, data structures, API contracts
- `MIGRATION_MAP.md` — File-by-file change plan with execution order
- `DECISIONS.md` — ADRs for storage, auth, UI patterns
- `SPRINTS.md` — 6 epics, 15 stories with commit sequence

## Repository Intelligence

Key locations:
- `scripts/health-check.js` — Existing CLI health reporter (280 lines)
- `server.js` — Express API server, add endpoints around line 200-250
- `src/foundation/consoles/Genesis.tsx` — Reference for console patterns
- `src/foundation/layout/NavSidebar.tsx` — Add nav item (lines 23-30)
- `src/foundation/components/MetricCard.tsx` — Reusable component
- `data/infrastructure/` — Where to put health-log.json

## Execution Order

### Phase 1: Extract Shared Validator
```bash
mkdir -p lib
```

Create `lib/health-validator.js`:
- Export `generateHealthReport()` — same logic as health-check.js
- Export `loadHealthLog()`, `appendToHealthLog(report, triggeredBy)` — log management
- Cap log at 100 entries (FIFO)

Then update `scripts/health-check.js`:
```javascript
import { generateHealthReport } from '../lib/health-validator.js'
```

Verify: `npm run health` produces identical output

---

### Phase 2: Health Log File
Create `data/infrastructure/health-log.json`:
```json
{
  "version": "1.0",
  "maxEntries": 100,
  "entries": []
}
```

---

### Phase 3: API Endpoints
Add to `server.js`:

```javascript
import { generateHealthReport, loadHealthLog, appendToHealthLog } from './lib/health-validator.js'

// GET /api/health - Current health status
app.get('/api/health', (req, res) => {
  try {
    const report = generateHealthReport()
    res.json(report)
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
    const report = generateHealthReport()
    const entry = appendToHealthLog(report, 'api')
    res.json(entry)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
```

Verify:
```bash
curl http://localhost:8080/api/health
curl http://localhost:8080/api/health/history
curl -X POST http://localhost:8080/api/health/run
```

---

### Phase 4: Health Dashboard Component
Create `src/foundation/consoles/HealthDashboard.tsx`:
- Import existing Foundation components (MetricCard, GlowButton)
- Fetch from /api/health and /api/health/history on mount
- Display summary: passed/failed/warnings
- Display category cards with status icons
- Display history list with timestamps
- "Run Health Check" button that POSTs to /api/health/run
- Failed checks expand to show IMPACT and INSPECT

Follow Genesis.tsx patterns for styling.

---

### Phase 5: Navigation
Update `src/foundation/layout/NavSidebar.tsx`:
```typescript
import { HeartPulse } from 'lucide-react'

// Add to navItems array:
{ id: 'health', icon: HeartPulse, label: 'System Health', route: '/foundation/health' },
```

Add route in App.tsx or router:
```tsx
import HealthDashboard from '@/foundation/consoles/HealthDashboard'

// In routes:
<Route path="/foundation/health" element={<HealthDashboard />} />
```

---

### Phase 6: Tests
Create `tests/integration/health-api.test.ts`:
- Test GET /api/health returns valid report structure
- Test GET /api/health/history returns entries array
- Test POST /api/health/run creates entry and returns it
- Test limit parameter works

Verify: `npm test`

---

## Build Verification
After each phase:
```bash
npm run build
npm test
npm run health
```

## Success Criteria
- [ ] `npm run health` works unchanged
- [ ] GET /api/health returns valid JSON
- [ ] GET /api/health/history returns entries
- [ ] POST /api/health/run creates log entry
- [ ] "System Health" appears in Foundation nav
- [ ] /foundation/health renders dashboard
- [ ] "Run Health Check" button triggers check
- [ ] History shows timestamped entries
- [ ] Tests pass
- [ ] Health check passes

## Forbidden Actions
- Do NOT delete or rename health-check.js (it's the CLI entry point)
- Do NOT remove existing validation logic until shared module works
- Do NOT add authentication (deferred per ADR-003)
- Do NOT change health report JSON structure (API consumers depend on it)
- Do NOT exceed 100 entries in health log (FIFO cap)
