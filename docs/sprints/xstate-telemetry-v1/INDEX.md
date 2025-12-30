# Sprint: xstate-telemetry-v1

**Created:** 2024-12-29
**Status:** Planning
**Objective:** Close telemetry gaps by adding missing metrics to XState context with persistence, enabling full deprecation of Engagement Bus

## Sprint Artifacts

| # | Artifact | Status | Purpose |
|---|----------|--------|---------|
| 0 | [SPEC.md](./SPEC.md) | ✅ | Goals, patterns, acceptance criteria |
| 1 | [REPO_AUDIT.md](./REPO_AUDIT.md) | ✅ | Current state analysis |
| 2 | [ARCHITECTURE.md](./ARCHITECTURE.md) | ✅ | Target state design |
| 3 | [MIGRATION_MAP.md](./MIGRATION_MAP.md) | ✅ | File-by-file change plan |
| 4 | [DECISIONS.md](./DECISIONS.md) | ✅ | ADRs for key choices |
| 5 | [SPRINTS.md](./SPRINTS.md) | ✅ | Epic/story breakdown |
| 6 | [EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md) | ✅ | Self-contained handoff |
| 7 | [DEVLOG.md](./DEVLOG.md) | 📝 | Execution tracking |

## Quick Links

- **Pattern Extended:** Pattern 2 (Engagement Machine)
- **Files Modified:** 5 core files, 1 hook
- **New Events:** 4 XState events
- **Persistence:** localStorage for cumulative metrics

## Build Gates

```bash
npm run build    # Compiles
npm test         # Unit tests pass
npx playwright test  # E2E tests pass
```
