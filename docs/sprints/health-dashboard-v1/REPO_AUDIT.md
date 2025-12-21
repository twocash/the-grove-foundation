# Repository Audit — health-dashboard-v1 (Revised)

## Audit Date: 2025-12-21
## Revision: Aligned with DAIRE Architecture Specification

## Current State Summary

Grove Terminal has a working CLI health check (`npm run health`) that validates schema integrity and journey chains. However, the implementation has architectural issues that conflict with the DAIRE specification:

1. **Hardcoded check definitions** — Validation logic is embedded in code, not configuration
2. **No attribution chain** — Log entries lack provenance (who, what config version, what context)
3. **Coupled to Grove corpus** — Health checks assume hubs/journeys/nodes, not domain-agnostic
4. **No persistent history** — Each run is ephemeral; no trend analysis possible
5. **No UI integration** — Admins must use CLI; Foundation console has no health visibility

This sprint adds a Health Dashboard with **declarative health configuration** that establishes the pattern for all future Grove infrastructure.

## DAIRE Alignment Requirements

Per the Domain-Agnostic Information Refinement Engine specification:

| Principle | Current State | Required State |
|-----------|---------------|----------------|
| Declarative Configuration | ❌ Hardcoded | ✅ JSON config defines checks |
| Attribution Preservation | ❌ Missing | ✅ Full provenance chain |
| Three-Layer Separation | ❌ Mixed | ✅ Engine vs corpus checks |
| Progressive Enhancement | ✅ Additive | ✅ Config optional, defaults work |

## File Structure Analysis

### Key Files
| File | Purpose | Lines | Issue |
|------|---------|-------|-------|
| `scripts/health-check.js` | CLI health reporter | 280 | Hardcoded logic |
| `tests/unit/schema.test.ts` | Schema validation tests | 106 | Duplicates validator |
| `src/foundation/layout/NavSidebar.tsx` | Foundation navigation | 127 | Needs health link |
| `server.js` | Express API server | ~600 | Needs health endpoints |

### Missing Files (To Create)
| File | Purpose |
|------|---------|
| `data/infrastructure/health-config.json` | Declarative check definitions |
| `data/infrastructure/health-log.json` | Persistent health history |
| `lib/health-validator.js` | Config-driven validation engine |
| `src/foundation/consoles/HealthDashboard.tsx` | UI component |

## Technical Debt Being Addressed

1. **Duplicated validation logic** — Extract to shared module that reads from config
2. **Hardcoded expected counts** — Move to config with explicit thresholds
3. **No separation of concerns** — Distinguish engine checks from corpus checks
4. **Missing attribution** — Add provenance to all log entries

## Risk Assessment
| Area | Risk | Mitigation |
|------|------|------------|
| Config schema design | Medium | Start simple, extend later |
| Migration complexity | Low | New system, no legacy to migrate |
| Over-engineering | Medium | Limit to essential DAIRE patterns |

## Recommendations

1. **Create health-config.json** with declarative check definitions
2. **Build config-driven validator** that interprets check definitions at runtime
3. **Add attribution chain** to all health log entries
4. **Separate engine from corpus checks** in config structure
5. **Make display labels configurable** for domain-agnostic UI
6. **Document the pattern** so future infrastructure follows it
