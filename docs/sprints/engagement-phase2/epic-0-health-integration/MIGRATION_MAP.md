# Epic 0: Health Integration - Migration Map

**Sprint**: Engagement Phase 2
**Epic**: 0 - Health Integration Foundation
**Date**: 2024-12-23

---

## Overview

This document maps all file changes required for Epic 0. The changes are additive - no existing functionality is modified or removed.

---

## File Changes Summary

| Action | File | Risk | Est. Lines |
|--------|------|------|------------|
| CREATE | `tests/reporters/health-reporter.ts` | LOW | ~80 |
| CREATE | `tests/reporters/index.ts` | LOW | ~5 |
| MODIFY | `lib/health-validator.js` | LOW | +40 |
| MODIFY | `data/infrastructure/health-config.json` | LOW | +30 |
| MODIFY | `server.js` | MEDIUM | +50 |
| MODIFY | `playwright.config.ts` | LOW | +5 |
| EXTEND | `tests/integration/health-api.test.ts` | LOW | +60 |

**Total new code**: ~270 lines

---

## Files to CREATE

### 1. `tests/reporters/health-reporter.ts`

**Purpose**: Playwright custom reporter that POSTs results to Health API

**Dependencies**:
- `@playwright/test/reporter` (types only)
- Node fetch (built-in)

**Implementation**:
```typescript
// See SPEC.md for full implementation
export default class HealthReporter implements Reporter {
  // Collects results, POSTs on completion
}
```

### 2. `tests/reporters/index.ts`

**Purpose**: Export barrel for reporters

**Content**:
```typescript
export { default as HealthReporter } from './health-reporter';
```

---

## Files to MODIFY

### 3. `lib/health-validator.js`

**Location**: Lines ~130-160 (after existing executors)

**Change**: Add `e2e-behavior` check type executor

```javascript
// ADD after executeChainValid function (~line 160)

/**
 * e2e-behavior: Check status from most recent test run
 */
function executeE2EBehavior(def) {
  const testRef = def.test;
  if (!testRef) {
    return { status: 'warn', message: 'No test reference specified' };
  }
  
  // Parse "file.spec.ts:test name" format
  const colonIndex = testRef.indexOf(':');
  const testName = colonIndex > 0 ? testRef.slice(colonIndex + 1) : testRef;
  const testId = testName.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  
  // Find most recent e2e-tests entry
  const log = loadHealthLog();
  const e2eEntry = log.entries.find(entry => 
    entry.categories?.some(cat => cat.id === 'e2e-tests')
  );
  
  if (!e2eEntry) {
    return { 
      status: 'warn', 
      message: 'No E2E test data available - run tests first' 
    };
  }
  
  const e2eCategory = e2eEntry.categories.find(c => c.id === 'e2e-tests');
  const testResult = e2eCategory?.checks?.find(c => 
    c.id === testId || 
    c.name?.toLowerCase().includes(testName.toLowerCase())
  );
  
  if (!testResult) {
    return { 
      status: 'warn', 
      message: `Test not found: ${testRef}` 
    };
  }
  
  return {
    status: testResult.status,
    message: testResult.message,
    details: {
      file: testResult.file,
      lastRun: e2eEntry.timestamp
    }
  };
}
```

**Also modify** `executeCheck` switch statement (~line 180):

```javascript
// ADD case to switch statement
case 'e2e-behavior':
  return executeE2EBehavior(def);
```

### 4. `data/infrastructure/health-config.json`

**Changes**:

1. Update version to "1.1"
2. Add category labels for new categories
3. Add `engagementChecks` array

```json
{
  "version": "1.1",
  "display": {
    "dashboardTitle": "System Health",
    "categoryLabels": {
      "engine": "Engine Health",
      "schema-integrity": "Schema Integrity",
      "journey-navigation": "Journey Navigation",
      "rag-integration": "RAG Integration",
      "e2e-tests": "E2E Tests",
      "engagement": "Engagement System"
    }
  },
  "engineChecks": [...],
  "corpusChecks": [...],
  "engagementChecks": [
    {
      "id": "lens-selection-works",
      "name": "Lens Selection Persists",
      "category": "engagement",
      "type": "e2e-behavior",
      "test": "engagement-behaviors.spec.ts:lens selection persists",
      "impact": "Users cannot select a viewing perspective",
      "inspect": "Run: npx playwright test -g 'lens selection'"
    },
    {
      "id": "url-lens-hydration",
      "name": "URL Lens Parameter Works",
      "category": "engagement",
      "type": "e2e-behavior",
      "test": "engagement-behaviors.spec.ts:valid lens parameter",
      "impact": "Deep links to specific lenses fail",
      "inspect": "Run: npx playwright test -g 'URL lens'"
    },
    {
      "id": "terminal-opens",
      "name": "Terminal Opens on Tree Click",
      "category": "engagement",
      "type": "e2e-behavior",
      "test": "active-grove.spec.ts:tree click opens terminal",
      "impact": "Users cannot access Terminal",
      "inspect": "Run: npx playwright test -g 'tree click'"
    }
  ]
}
```

### 5. `server.js`

**Location**: After existing health endpoints (~line varies)

**Change**: Add `/api/health/report` endpoint

```javascript
// ADD after existing health endpoints

// POST /api/health/report - Accept external test results
app.post('/api/health/report', express.json(), async (req, res) => {
  try {
    const { category, categoryName, checks, attribution } = req.body;
    
    // Validate required fields
    if (!category || typeof category !== 'string') {
      return res.status(400).json({ 
        error: 'Missing or invalid required field: category' 
      });
    }
    
    if (!checks || !Array.isArray(checks)) {
      return res.status(400).json({ 
        error: 'Missing or invalid required field: checks (must be array)' 
      });
    }
    
    // Validate each check has required fields
    for (const check of checks) {
      if (!check.id || !check.status) {
        return res.status(400).json({
          error: 'Each check must have id and status fields'
        });
      }
      if (!['pass', 'fail', 'warn'].includes(check.status)) {
        return res.status(400).json({
          error: `Invalid status "${check.status}" - must be pass, fail, or warn`
        });
      }
    }
    
    // Calculate summary
    const summary = {
      total: checks.length,
      passed: checks.filter(c => c.status === 'pass').length,
      failed: checks.filter(c => c.status === 'fail').length,
      warnings: checks.filter(c => c.status === 'warn').length
    };
    
    // Determine category status
    const hasFail = checks.some(c => c.status === 'fail');
    const hasWarn = checks.some(c => c.status === 'warn');
    const categoryStatus = hasFail ? 'fail' : hasWarn ? 'warn' : 'pass';
    
    // Build report in Health format
    const report = {
      timestamp: new Date().toISOString(),
      configVersion: 'external',
      engineVersion: healthValidator.getEngineVersion(),
      categories: [{
        id: category,
        name: categoryName || category,
        status: categoryStatus,
        checks: checks.map(c => ({
          id: c.id,
          name: c.name || c.id,
          status: c.status,
          message: c.message || '',
          file: c.file,
          duration: c.duration
        }))
      }],
      summary
    };
    
    // Log with attribution
    const entry = healthValidator.appendToHealthLog(report, {
      triggeredBy: attribution?.triggeredBy || 'external',
      commit: attribution?.commit || null,
      branch: attribution?.branch || null
    });
    
    console.log(`[Health Report] Received ${checks.length} checks for category "${category}"`);
    res.status(201).json(entry);
    
  } catch (error) {
    console.error('[Health Report] Error:', error);
    res.status(500).json({ error: 'Failed to record health report' });
  }
});
```

### 6. `playwright.config.ts`

**Location**: `reporter` array

**Change**: Add health reporter

```typescript
// BEFORE
reporter: [
  ['html'],
  ['list']
],

// AFTER
reporter: [
  ['html'],
  ['list'],
  ['./tests/reporters/health-reporter.ts', {
    baseUrl: process.env.BASE_URL || 'http://localhost:5173'
  }]
],
```

---

## Files to EXTEND (Tests)

### 7. `tests/integration/health-api.test.ts`

**Location**: End of file

**Change**: Add tests for new endpoint

```typescript
// ADD new describe block

describe('POST /api/health/report', () => {
  test('accepts valid report and returns entry', async () => {
    if (!serverRunning) return;
    
    const report = {
      category: 'test-category',
      categoryName: 'Test Category',
      checks: [
        { id: 'test-1', name: 'Test One', status: 'pass', message: 'OK' },
        { id: 'test-2', name: 'Test Two', status: 'fail', message: 'Failed' }
      ],
      attribution: {
        triggeredBy: 'integration-test',
        commit: 'test-commit'
      }
    };
    
    const response = await fetch(`${BASE_URL}/api/health/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report)
    });
    
    expect(response.status).toBe(201);
    
    const entry = await response.json();
    expect(entry.id).toBeDefined();
    expect(entry.categories[0].id).toBe('test-category');
    expect(entry.summary.total).toBe(2);
    expect(entry.summary.passed).toBe(1);
    expect(entry.summary.failed).toBe(1);
  });
  
  test('rejects missing category', async () => {
    if (!serverRunning) return;
    
    const response = await fetch(`${BASE_URL}/api/health/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checks: [] })
    });
    
    expect(response.status).toBe(400);
    const error = await response.json();
    expect(error.error).toContain('category');
  });
  
  test('rejects missing checks', async () => {
    if (!serverRunning) return;
    
    const response = await fetch(`${BASE_URL}/api/health/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category: 'test' })
    });
    
    expect(response.status).toBe(400);
    const error = await response.json();
    expect(error.error).toContain('checks');
  });
  
  test('rejects invalid status', async () => {
    if (!serverRunning) return;
    
    const response = await fetch(`${BASE_URL}/api/health/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'test',
        checks: [{ id: 'test', status: 'invalid' }]
      })
    });
    
    expect(response.status).toBe(400);
    const error = await response.json();
    expect(error.error).toContain('status');
  });
  
  test('report appears in history', async () => {
    if (!serverRunning) return;
    
    const beforeHistory = await fetchHealthHistory();
    
    await fetch(`${BASE_URL}/api/health/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'history-test',
        checks: [{ id: 'test', status: 'pass' }]
      })
    });
    
    const afterHistory = await fetchHealthHistory();
    expect(afterHistory.total).toBeGreaterThan(beforeHistory.total);
  });
});
```

---

## Files NOT Modified

| File | Reason |
|------|--------|
| `hooks/NarrativeEngineContext.tsx` | Phase 2 Epic 1+ target |
| `tests/e2e/*.spec.ts` | Tests already complete |
| `src/surface/**` | No UI changes this epic |
| `data/exploration/**` | No data changes |
| `data/knowledge/**` | No data changes |

---

## Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Dependency Order                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Step 1: No dependencies                                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ lib/health-validator.js (add e2e-behavior type)                      │   │
│  │ data/infrastructure/health-config.json (add engagement checks)       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼                                              │
│  Step 2: Depends on Step 1                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ server.js (add /api/health/report endpoint)                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼                                              │
│  Step 3: Depends on Step 2                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ tests/reporters/health-reporter.ts (create)                          │   │
│  │ tests/integration/health-api.test.ts (extend)                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                              │
│                              ▼                                              │
│  Step 4: Depends on Step 3                                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ playwright.config.ts (add reporter)                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Rollback Plan

### If Issues During Implementation

1. **Partial rollback**: Comment out health reporter in `playwright.config.ts`
   - Tests still run, just don't report to Health

2. **Full rollback**: Revert all changes
   - `git checkout lib/health-validator.js`
   - `git checkout data/infrastructure/health-config.json`
   - `git checkout server.js`
   - `git checkout playwright.config.ts`
   - `rm -rf tests/reporters/`

### If Issues After Deployment

1. Remove reporter from `playwright.config.ts`
2. Comment out `/api/health/report` endpoint
3. Remove engagement checks from `health-config.json`
4. Version bump to revert health-config

All changes are additive - existing functionality unaffected.

---

## Verification Checklist

After implementation, verify:

- [ ] `npm run build` succeeds
- [ ] `npm run dev` starts server
- [ ] `npx playwright test` runs with reporter
- [ ] Health log contains e2e-tests entry
- [ ] `GET /api/health` returns engagement category
- [ ] Existing health checks still pass
- [ ] Integration tests pass

---

## References

- SPEC.md - Detailed implementation specs
- ARCHITECTURE.md - System design
- `lib/health-validator.js` - Health engine source
