# Sprint: route-selection-flow-v1

**Status:** Planning Complete  
**Duration:** 4-6 hours  
**Patterns Implemented:** Pattern 8 (Canonical Source Rendering), Pattern 9 (Module Shell Architecture)

## Summary

Replace inline lens/journey pickers with route-based selection flow. Implement Module Shell Architecture with consistent header pattern across all modules.

**High Leverage:** This sprint eliminates architectural debt (inline pickers), establishes reusable patterns (ModuleHeader), and creates the foundation for consistent UX across all Grove modules.

## Artifacts

| Artifact | Purpose |
|----------|---------|
| [REPO_AUDIT.md](./REPO_AUDIT.md) | Current state analysis |
| [SPEC.md](./SPEC.md) | Goals, acceptance criteria |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Target state, component design |
| [MIGRATION_MAP.md](./MIGRATION_MAP.md) | File-by-file changes |
| [DECISIONS.md](./DECISIONS.md) | ADRs |
| [SPRINTS.md](./SPRINTS.md) | Epic/story breakdown |
| [EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md) | CLI handoff |
| [DEVLOG.md](./DEVLOG.md) | Progress tracking |

## Quick Start

```bash
# For Claude Code CLI execution:
cat C:\GitHub\the-grove-foundation\docs\sprints\route-selection-flow-v1\EXECUTION_PROMPT.md
```

## Phase 0 Compliance

- [x] PROJECT_PATTERNS.md read
- [x] Patterns Extended: Pattern 4 (Token Namespaces)
- [x] New Patterns Documented: Pattern 8, Pattern 9

## Phase 0.5 Compliance

- [x] Canonical homes identified for all selection features
- [x] Inline pickers flagged for removal
- [x] Route-based flow designed

## Key Deliverables

1. **ModuleHeader component** — Reusable header with search + contextual features
2. **Route-based lens selection** — `/lenses` with returnTo parameter
3. **Route-based journey selection** — `/journeys` with returnTo parameter  
4. **Terminal header integration** — Lens/Journey badges that navigate to routes
5. **WelcomeInterstitial simplification** — Remove embedded LensGrid
