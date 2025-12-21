# Specification — health-dashboard-v1

## Overview

Add a Health Dashboard to the Foundation UI that displays current system health status and maintains a persistent log of health check results over time, enabling trend analysis and regression detection.

## Goals

1. **Surface health status in Foundation UI** — Admins see system health without CLI
2. **Persist health check history** — Store results with timestamps for trend analysis
3. **Enable on-demand health checks** — Run checks from the UI with one click
4. **Consolidate validation logic** — Single source of truth for schema validation

## Non-Goals

- Real-time health monitoring (polling) — Manual trigger only for v1
- External alerting (email, Slack) — Future enhancement
- Health checks for external services (GCS, Gemini) — Data integrity only
- User-facing health status — Admin-only feature

## Success Criteria

After this sprint:
1. Foundation UI has a "System Health" console accessible from nav
2. Health dashboard shows current status with pass/fail breakdown
3. History log shows last 50 health check results with timestamps
4. Clicking "Run Health Check" executes check and appends to log
5. Tests validate the new API endpoints and UI rendering

## Acceptance Criteria

### Must Have
- [ ] AC-1: `/api/health` endpoint returns current health JSON
- [ ] AC-2: `/api/health/history` endpoint returns health log array
- [ ] AC-3: Health Dashboard console renders in Foundation UI
- [ ] AC-4: "Run Health Check" button triggers check and updates UI
- [ ] AC-5: Health log persists to `data/infrastructure/health-log.json`
- [ ] AC-6: Tests pass: `npm test`
- [ ] AC-7: Health check passes: `npm run health`

### Should Have
- [ ] AC-8: Health dashboard shows trend indicator (improving/degrading)
- [ ] AC-9: Failed checks expand to show IMPACT and INSPECT info
- [ ] AC-10: Log entries link to specific check details

### Nice to Have
- [ ] AC-11: Filter history by status (pass/fail/warn)
- [ ] AC-12: Export health log as JSON download

## Dependencies

| Package | Purpose | Version |
|---------|---------|---------|
| None required | Building on existing stack | - |

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Health log grows unbounded | Medium | Low | Cap at 100 entries, FIFO |
| API endpoint exposed to non-admins | Medium | Medium | Add admin auth check |
| UI doesn't match existing console style | Low | Low | Follow Genesis console patterns |

## Out of Scope

- Automated scheduled health checks
- Push notifications on failure
- Health checks for LLM/RAG quality
- Multi-tenant health isolation
