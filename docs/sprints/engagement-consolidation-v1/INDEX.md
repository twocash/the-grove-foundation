# Sprint: engagement-consolidation-v1

**Status:** Planning  
**Priority:** P0 (blocking adaptive engagement)  
**Created:** 2025-12-27  
**Estimated Effort:** 4-6 hours

## Objective

Consolidate EngagementBus and TelemetryCollector into a single source of truth with declarative stage computation. Eliminate redundant state systems.

## Problem Statement

Two competing engagement tracking systems exist:
1. `EngagementBus` (grove-engagement-state) — 503 lines, event-driven
2. `TelemetryCollector` (grove-telemetry) — 187 lines, stage-focused

This caused a bug where UI read from empty new system while data existed in old system.

## Solution

Extend EngagementBus with SessionStage computation. Delete TelemetryCollector.

## Sprint Artifacts

| Artifact | Status | Description |
|----------|--------|-------------|
| [REPO_AUDIT.md](./REPO_AUDIT.md) | ✅ | Current state analysis |
| [SPEC.md](./SPEC.md) | ✅ | Requirements + DEX compliance |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | ✅ | Design decisions |
| [DECISIONS.md](./DECISIONS.md) | ✅ | ADRs |
| [MIGRATION_MAP.md](./MIGRATION_MAP.md) | ✅ | File-by-file changes |
| [SPRINTS.md](./SPRINTS.md) | ✅ | Execution phases |
| [EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md) | ✅ | CLI handoff |
| [DEVLOG.md](./DEVLOG.md) | 🔲 | Execution tracking |

## Quick Links

- Related bug: [adaptive-engagement-v1/BUGFIX_TELEMETRY.md](../adaptive-engagement-v1/BUGFIX_TELEMETRY.md)
- Pattern reference: PROJECT_PATTERNS.md (Pattern 11: Session Engagement Telemetry)

## Outcome

Single `useEngagementState()` hook provides:
- Stage (ARRIVAL → ORIENTED → EXPLORING → ENGAGED)
- Exchange counts, topics, sprouts
- Reveal queue (existing)
- Journey state (existing)

No redundant hooks. No duplicate storage. Declarative thresholds.
