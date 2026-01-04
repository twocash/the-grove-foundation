# Bedrock Event Architecture v1 — Continuation Prompt

**Sprint:** bedrock-event-architecture-v1  
**Last Updated:** January 4, 2026  
**Status:** Planning Complete, Ready for Execution

---

## Project Location

```
C:\GitHub\the-grove-foundation
```

---

## What This Sprint Does

Creates foundational event architecture for Grove's bedrock branch:
- 15 semantic event types extending existing `MetricAttribution`
- Zod validation schemas for runtime safety
- Pure projection functions deriving state from events
- V2 → V3 migration preserving existing telemetry data
- 90%+ test coverage

**NOT in scope:** React hooks, route integration (those are Sprints 2-3)

---

## Sprint Status

| Phase | Status |
|-------|--------|
| Phase 0: Pattern Check | ✅ Complete |
| Phase 1: Repository Audit | ✅ Complete |
| Phase 2: Specification | ✅ Complete (SPEC.md existed) |
| Phase 3: Architecture | ✅ Complete |
| Phase 4: Migration Map | ✅ Complete |
| Phase 5: Decisions | ✅ Complete |
| Phase 6: Sprint Breakdown | ✅ Complete |
| Phase 7: Execution Prompt | ✅ Complete |
| Phase 8: Execution | ⬜ Not Started |

---

## Files to Read First

1. `docs/sprints/bedrock-event-architecture-v1/EXECUTION_PROMPT.md` — Start here for implementation
2. `docs/sprints/bedrock-event-architecture-v1/SPEC.md` — Full specification
3. `docs/sprints/bedrock-event-architecture-v1/SPRINTS.md` — Story breakdown
4. `src/core/schema/telemetry.ts` — Existing types to extend

---

## Key Context

### The Core Insight
Grove's telemetry types (`MetricAttribution`, `JourneyCompletion`, etc.) already implement event sourcing in miniature. We're extending that pattern to all engagement state, not replacing it.

### What's Being Created
```
src/core/events/
├── types.ts              # 15 event types extending MetricAttribution
├── schema.ts             # Zod validation
├── store.ts              # Event log management
├── projections/          # State derivation functions
│   ├── session.ts
│   ├── telemetry.ts      # CumulativeMetricsV2 backward compat
│   ├── context.ts
│   ├── moments.ts
│   └── stream.ts
├── migration.ts          # V2 → V3
└── __tests__/            # 90%+ coverage
```

### Strangler Fig Boundary
- **Legacy zone:** Genesis, Terminal marketing routes (unchanged)
- **Bedrock zone:** /explore/*, /foundation/* routes (new system)

---

## Next Actions

### If Starting Fresh
1. Read `EXECUTION_PROMPT.md`
2. Create `src/core/events/types.ts` (Epic 1)
3. Follow epic sequence in `SPRINTS.md`

### If Resuming Mid-Sprint
1. Check `DEVLOG.md` for last completed story
2. Continue from next story in sequence
3. Update DEVLOG as you progress

---

## Build Commands

```bash
# Verify types compile
npx tsc --noEmit

# Run unit tests
npx vitest run src/core/events/

# Check coverage
npx vitest run --coverage src/core/events/

# Full test suite
npm test

# Build
npm run build
```

---

## Questions to Ask

If context is unclear, ask:
1. "What was the last story completed?" (Check DEVLOG)
2. "Are there any test failures?" (Run tests)
3. "What files have been created?" (ls src/core/events/)

---

## Related Documents

- `PROJECT_PATTERNS.md` — Pattern catalog (root)
- `docs/sprints/bedrock-event-architecture-v1/DECISIONS.md` — ADRs
- `docs/sprints/bedrock-event-architecture-v1/MIGRATION_MAP.md` — File creation plan

---

*Use this prompt to resume work in a fresh context window*
