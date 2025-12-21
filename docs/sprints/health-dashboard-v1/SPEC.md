# Specification — health-dashboard-v1 (Revised)

## Revision Note
Aligned with DAIRE Architecture Specification. Key addition: declarative health configuration.

## Overview

Add a Health Dashboard to the Foundation UI with **declarative health configuration** that establishes the pattern for domain-agnostic infrastructure. Health check definitions live in configuration files, not code. The engine interprets configuration at runtime, enabling domain experts to define appropriate checks without engineering involvement.

## Goals

1. **Establish declarative configuration pattern** — Health checks defined in JSON, not code
2. **Implement attribution preservation** — Full provenance chain on all log entries
3. **Separate engine from corpus checks** — Three-layer architecture in practice
4. **Surface health status in Foundation UI** — Admins see system health without CLI
5. **Persist health check history** — Store results with timestamps for trend analysis

## Non-Goals

- Real-time health monitoring (polling) — Manual trigger only for v1
- External alerting (email, Slack) — Future enhancement
- Health checks for external services (GCS, Gemini) — Data integrity only
- Multi-domain deployment — Single Grove corpus for now, but architecture supports future domains

## Success Criteria

After this sprint:
1. Health checks are defined in `health-config.json`, not hardcoded
2. Adding a new check requires only config change, no code change
3. Log entries include full attribution (config version, engine version, trigger source)
4. Foundation UI has a "System Health" console with configurable display labels
5. Engine checks vs corpus checks are clearly separated in config

## Acceptance Criteria

### Must Have (DAIRE Alignment)
- [ ] AC-1: Health checks defined declaratively in `data/infrastructure/health-config.json`
- [ ] AC-2: Validator reads check definitions from config, not hardcoded
- [ ] AC-3: Log entries include attribution chain (configVersion, engineVersion, triggeredBy)
- [ ] AC-4: Engine checks separated from corpus checks in config structure
- [ ] AC-5: Display labels (category names, dashboard title) come from config

### Must Have (Functionality)
- [ ] AC-6: `/api/health` endpoint returns current health JSON
- [ ] AC-7: `/api/health/history` endpoint returns health log array
- [ ] AC-8: Health Dashboard console renders in Foundation UI
- [ ] AC-9: "Run Health Check" button triggers check and updates UI
- [ ] AC-10: Health log persists to `data/infrastructure/health-log.json`
- [ ] AC-11: Tests pass: `npm test`
- [ ] AC-12: Health check passes: `npm run health`

### Should Have
- [ ] AC-13: Health dashboard shows trend indicator (improving/degrading)
- [ ] AC-14: Failed checks expand to show impact and inspection guidance
- [ ] AC-15: Config validation on load (fail fast if config malformed)

### Nice to Have
- [ ] AC-16: Filter history by status (pass/fail/warn)
- [ ] AC-17: Admin UI for editing health-config.json (Phase 3 per DAIRE roadmap)

## Configuration Schema Preview

```json
{
  "version": "1.0",
  "display": {
    "dashboardTitle": "System Health",
    "categoryLabels": {
      "schema-integrity": "Schema Integrity",
      "journey-navigation": "Journey Navigation"
    }
  },
  "engineChecks": [
    {
      "id": "config-valid",
      "name": "Health Config Valid",
      "type": "json-exists",
      "target": "infrastructure/health-config.json"
    }
  ],
  "corpusChecks": [
    {
      "id": "hub-references",
      "name": "Journey→Hub References",
      "category": "schema-integrity",
      "type": "reference-check",
      "source": { "file": "exploration/journeys.json", "path": "journeys.*.hubId" },
      "target": { "file": "knowledge/hubs.json", "path": "hubs" },
      "severity": "critical",
      "impact": "Broken hub references cause navigation failures",
      "inspect": "Check journeys.json hubId values against hubs.json keys"
    }
  ]
}
```

## Dependencies

| Package | Purpose | Version |
|---------|---------|---------|
| None required | Building on existing stack | - |

## Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Config schema too complex | Medium | Medium | Start minimal, extend incrementally |
| Over-engineering | Medium | Low | Time-box config design to 1 session |
| Breaking existing CLI | Low | High | CLI uses same validator, same config |

## Out of Scope

- Automated scheduled health checks
- Push notifications on failure
- Health checks for LLM/RAG quality
- Multi-tenant health isolation
- Admin UI for config editing (DAIRE Phase 3)
