# Repository Audit — health-dashboard-v1

## Audit Date: 2025-12-21

## Current State Summary

Grove Terminal has a working CLI health check (`npm run health`) that validates schema integrity and journey chains. It outputs human-readable ASCII or JSON. However:

1. **No persistent history** — Each run is ephemeral; no trend analysis possible
2. **No UI integration** — Admins must use CLI; Foundation console has no health visibility
3. **No automated logging** — Health checks run manually or in CI, but results aren't stored

This sprint adds a Health Dashboard to the Foundation UI with persistent logging.

## File Structure Analysis

### Key Files
| File | Purpose | Lines |
|------|---------|-------|
| `scripts/health-check.js` | CLI health reporter | 280 |
| `tests/unit/schema.test.ts` | Schema validation tests | 106 |
| `tests/unit/journey-navigation.test.ts` | Journey chain tests | 134 |
| `src/foundation/layout/NavSidebar.tsx` | Foundation navigation | 127 |
| `src/foundation/consoles/Genesis.tsx` | Genesis console (metrics) | ~200 |
| `server.js` | Express API server | ~600 |

### Dependencies
- `vitest` — Test runner (already installed)
- `lucide-react` — Icons (already installed)
- No new dependencies required

## Technical Debt

1. **Duplicated validation logic** — `health-check.js` and `schema.test.ts` both validate references separately. Should extract to shared module.

2. **Hardcoded expected counts** — Tests fail when adding new content:
   ```typescript
   expect(Object.keys(hubs.hubs)).toHaveLength(6)  // Brittle
   ```

3. **No health log storage** — No infrastructure for persisting health results.

## Risk Assessment
| Area | Current Risk | Notes |
|------|--------------|-------|
| Storage | Low | Can use local JSON file initially |
| API security | Medium | Health endpoint needs admin auth |
| Performance | Low | Health check runs in <1 second |
| Complexity | Low | Building on existing patterns |

## Recommendations

1. **Extract shared validation logic** to `lib/schema-validator.ts`
2. **Add `/api/health` endpoint** that returns JSON health report
3. **Add `/api/health/history` endpoint** for log retrieval
4. **Store health logs** in `data/infrastructure/health-log.json`
5. **Create Health Dashboard console** in Foundation UI
6. **Add nav item** to Foundation sidebar
