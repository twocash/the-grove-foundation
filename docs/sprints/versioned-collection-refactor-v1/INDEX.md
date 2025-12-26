# Sprint Index: Versioned Collection Refactor

**Sprint ID:** versioned-collection-refactor-v1
**Started:** 2025-12-26
**Status:** Ready for Execution

## Summary

Refactor the versioning integration for Grove collections to use a single generic hook with declarative merge configuration and event-driven refresh.

## Problem

Two nearly identical hooks (`useVersionedPersonas`, `useVersionedJourneys`) with:
- 90%+ code duplication
- Hardcoded merge logic
- Imperative refresh effects

## Solution

1. Single `useVersionedCollection<T>()` generic hook
2. Declarative `MERGE_CONFIGS` registry
3. Event-driven refresh via `onInspectorClosed`

## Artifacts

| Document | Purpose |
|----------|---------|
| [REPO_AUDIT.md](./REPO_AUDIT.md) | Current state analysis |
| [SPEC.md](./SPEC.md) | Goals and acceptance criteria |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Target architecture design |
| [MIGRATION_MAP.md](./MIGRATION_MAP.md) | Execution order and rollback |
| [DECISIONS.md](./DECISIONS.md) | Architectural decisions (ADRs) |
| [SPRINTS.md](./SPRINTS.md) | Epic/story breakdown |
| [EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md) | Self-contained handoff |
| [DEVLOG.md](./DEVLOG.md) | Execution tracking |

## Quick Start

To execute this sprint:

```bash
# Read the execution prompt
cat docs/sprints/versioned-collection-refactor-v1/EXECUTION_PROMPT.md

# Or hand off to Claude Code
claude "Execute docs/sprints/versioned-collection-refactor-v1/EXECUTION_PROMPT.md"
```

## Metrics

| Metric | Before | After |
|--------|--------|-------|
| Duplicate code | 230 lines | 0 |
| Type-specific hooks | 2 | 0 |
| Generic hooks | 0 | 1 |
| Hardcoded merge logic | 2 | 0 |
| Imperative effects | 2 | 0 |
