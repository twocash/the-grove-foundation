# Sprint: dex-telemetry-compliance-v1

**Status:** Planning
**Parent Sprint:** xstate-telemetry-v1
**Created:** 2025-12-29
**Author:** Claude (Opus 4.5)

## Mission

Remediate DEX (Declarative Exploration) violations identified in xstate-telemetry-v1 sprint. Transform hardcoded domain logic into declarative configuration, add provenance tracking for cumulative metrics, and introduce Field-scoping for multi-Field support.

## DEX Compliance Goals

| Pillar | Current Grade | Target Grade | Fix |
|--------|---------------|--------------|-----|
| Declarative Sovereignty | C+ | A | Extract stage thresholds to config |
| Provenance as Infrastructure | B- | A | Add attribution chains to metrics |
| Capability Agnosticism | A | A | (No change needed) |
| Organic Scalability | A- | A | Add Field namespacing |

## Artifacts

| Artifact | Status | Description |
|----------|--------|-------------|
| [REPO_AUDIT.md](./REPO_AUDIT.md) | Draft | Current state analysis |
| [SPEC.md](./SPEC.md) | Draft | Goals, acceptance criteria |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Draft | Target state design |
| [MIGRATION_MAP.md](./MIGRATION_MAP.md) | Draft | File-by-file changes |
| [DECISIONS.md](./DECISIONS.md) | Draft | ADRs for key choices |
| [SPRINTS.md](./SPRINTS.md) | Draft | Epic breakdown |
| [EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md) | Draft | Self-contained handoff |

## Quick Links

- Parent sprint: [`../xstate-telemetry-v1/`](../xstate-telemetry-v1/)
- DEX Architecture: [`../../architecture/TRELLIS.md`](../../architecture/TRELLIS.md)
- Engagement Types: [`../../../src/core/engagement/types.ts`](../../../src/core/engagement/types.ts)
