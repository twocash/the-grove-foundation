# Migration Map — health-dashboard-v1

## Overview

Add health dashboard with persistent logging. Creates 4 new files, modifies 3 existing files.

## Files to Create

### `lib/health-validator.js`
**Purpose:** Shared validation logic extracted from health-check.js
**Depends on:** None
**Content:** Functions to validate schema references, journey chains, return structured results

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

### `src/foundation/consoles/HealthDashboard.tsx`
**Purpose:** React component for health display and interaction
**Depends on:** API endpoints, existing Foundation patterns
**Content:** Status summary, category cards, history list, run button

---

### `tests/integration/health-api.test.ts`
**Purpose:** Tests for new health API endpoints
**Depends on:** Server running
**Content:** Tests for GET /api/health, GET /api/health/history, POST /api/health/run

---

## Files to Modify

### `server.js`
**Lines:** Near other API routes (~line 200-250)
**Change:** Add three health API endpoints
**Before:** No health endpoints
**After:**
```javascript
// Health API
app.get('/api/health', async (req, res) => {
  const report = generateHealthReport()
  res.json(report)
})

app.get('/api/health/history', (req, res) => {
  const log = loadHealthLog()
  const limit = Math.min(parseInt(req.query.limit) || 50, 100)
  res.json({
    entries: log.entries.slice(0, limit),
    total: log.entries.length
  })
})

app.post('/api/health/run', (req, res) => {
  const report = generateHealthReport()
  const entry = appendToHealthLog(report, 'api')
  res.json(entry)
})
```
**Reason:** Expose health data via API

---

### `src/foundation/layout/NavSidebar.tsx`
**Lines:** 23-30 (navItems array)
**Change:** Add health dashboard nav item
**Before:**
```typescript
const navItems: NavItem[] = [
  { id: 'genesis', icon: Activity, label: 'Genesis', route: '/foundation/genesis' },
  // ... other items
];
```
**After:**
```typescript
import { HeartPulse } from 'lucide-react';

const navItems: NavItem[] = [
  { id: 'genesis', icon: Activity, label: 'Genesis', route: '/foundation/genesis' },
  // ... other items
  { id: 'health', icon: HeartPulse, label: 'System Health', route: '/foundation/health' },
];
```
**Reason:** Add navigation to new console

---

### `scripts/health-check.js`
**Lines:** 10-140 (validation logic)
**Change:** Import from lib/health-validator.js instead of inline
**Before:** Inline validation functions
**After:**
```javascript
import { generateHealthReport } from '../lib/health-validator.js'
```
**Reason:** DRY — single source of truth for validation

---

### `src/router/index.tsx` (or equivalent routing file)
**Lines:** Foundation routes section
**Change:** Add route for HealthDashboard
**After:**
```tsx
import HealthDashboard from '@/foundation/consoles/HealthDashboard'

// In routes:
{ path: '/foundation/health', element: <HealthDashboard /> }
```
**Reason:** Wire up the new console

---

## Execution Order

1. Create `lib/health-validator.js` — Extract validation logic
2. Create `data/infrastructure/health-log.json` — Initialize empty log
3. Modify `scripts/health-check.js` — Use shared validator
4. Verify: `npm run health` still works
5. Modify `server.js` — Add API endpoints
6. Verify: `curl localhost:8080/api/health`
7. Create `src/foundation/consoles/HealthDashboard.tsx`
8. Modify `NavSidebar.tsx` — Add nav item
9. Modify router — Add route
10. Verify: Navigate to /foundation/health in browser
11. Create `tests/integration/health-api.test.ts`
12. Verify: `npm test`

## Rollback Plan

### If API breaks:
```bash
git checkout server.js
npm start
```

### If UI breaks:
```bash
git checkout src/foundation/
npm run dev
```

### Full rollback:
```bash
git reset --hard HEAD~1
```

## Verification Checklist

- [ ] `npm run health` produces same output as before
- [ ] `curl localhost:8080/api/health` returns JSON
- [ ] `curl localhost:8080/api/health/history` returns entries array
- [ ] Foundation UI shows "System Health" in nav
- [ ] Health Dashboard displays current status
- [ ] "Run Health Check" adds entry to history
- [ ] `npm test` passes
