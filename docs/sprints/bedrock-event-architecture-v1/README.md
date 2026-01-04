# Bedrock Event Architecture v1

## Sprint Overview

**Type:** Foundation Sprint  
**Status:** Ready for Foundation Loop  
**Goal:** Extend Grove's telemetry foundation into a unified event architecture for bedrock/explore routes

## Core Insight

The telemetry types (`MetricAttribution`, `JourneyCompletion`, `CumulativeMetricsV2`, `computeMetrics()`) are the **right foundation**. They already implement event sourcing correctly. The problem is the plumbing around them—XState storing arrays, adapter hooks constructing types manually, parallel event systems.

**Keep the types. Replace the plumbing.**

## Key Files

| File | Purpose |
|------|---------|
| `SPEC.md` | Full specification (run Foundation Loop against this) |
| `SPEC_DRAFT.md` | Earlier draft with additional analysis (reference) |

## Quick Stats

| Metric | Current | Target |
|--------|---------|--------|
| Event types | 43+ | 15 |
| Adapter hooks | 3+ | 0 |
| Test coverage | ~40% | 90%+ |

## Sprint Sequence

1. **bedrock-event-schema-v1** ← This sprint (types, projections, tests)
2. bedrock-event-hooks-v1 (React layer)
3. bedrock-event-integration-v1 (wire to explore route)
4. kinetic-suggested-prompts-v1 (trivial on clean foundation)

## Foundation Loop Entry Point

Run Foundation Loop against: `docs/sprints/bedrock-event-architecture-v1/SPEC.md`

The spec includes:
- Current state analysis (what's right vs wrong)
- Event type definitions (extending telemetry)
- Projection architecture
- Migration strategy
- Acceptance criteria
- File structure
