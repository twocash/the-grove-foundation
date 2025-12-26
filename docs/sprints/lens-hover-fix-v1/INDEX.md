# Sprint: lens-hover-fix-v1

**Status:** Planning Complete  
**Duration:** 1-2 hours  
**Pattern Extended:** Pattern 4 (Token Namespaces)

## Summary

Fix lens card hover state to show interactive affordance (ghost Select button on hover) and align styling with Quantum Glass design system.

## Artifacts

| Artifact | Purpose |
|----------|---------|
| [REPO_AUDIT.md](./REPO_AUDIT.md) | Current state analysis |
| [SPEC.md](./SPEC.md) | Goals, acceptance criteria |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Target state, data flow |
| [MIGRATION_MAP.md](./MIGRATION_MAP.md) | File-by-file changes |
| [DECISIONS.md](./DECISIONS.md) | ADRs |
| [SPRINTS.md](./SPRINTS.md) | Epic/story breakdown |
| [EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md) | CLI handoff |
| [DEVLOG.md](./DEVLOG.md) | Progress tracking |

## Quick Start

```bash
# For Claude Code CLI execution:
cat C:\GitHub\the-grove-foundation\docs\sprints\lens-hover-fix-v1\EXECUTION_PROMPT.md
```

## Phase 0 Compliance

- [x] PROJECT_PATTERNS.md read
- [x] Patterns Extended: Pattern 4 (Token Namespaces)
- [x] Canonical Source Audit: LensGrid.tsx confirmed as canonical

## Phase 0.5 Compliance

- [x] Canonical home identified: `components/Terminal/LensGrid.tsx`
- [x] No duplication: Single source for lens rendering
- [x] Recommendation: REFACTOR inline styles to tokens
