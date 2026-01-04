# Bedrock Event Architecture v1 — Sprint Index

**Sprint:** bedrock-event-architecture-v1  
**Status:** Planning Complete, Ready for Execution  
**Generated:** January 4, 2026

---

## Quick Links

| Document | Purpose |
|----------|---------|
| [README.md](./README.md) | Quick overview |
| [SPEC.md](./SPEC.md) | Full specification |
| [REPO_AUDIT.md](./REPO_AUDIT.md) | Current state analysis |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Target architecture |
| [MIGRATION_MAP.md](./MIGRATION_MAP.md) | File creation plan |
| [DECISIONS.md](./DECISIONS.md) | ADRs explaining "why" |
| [SPRINTS.md](./SPRINTS.md) | Epic/story breakdown |
| [EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md) | Handoff for execution |
| [DEVLOG.md](./DEVLOG.md) | Execution tracking |
| [CONTINUATION_PROMPT.md](./CONTINUATION_PROMPT.md) | Session handoff |

---

## Sprint Summary

### What We're Building
A unified event architecture that extends Grove's existing telemetry types into a complete event sourcing system.

### Key Numbers
- **15** semantic event types (down from 43)
- **5** epic phases over 4 days
- **90%+** test coverage target
- **0** existing files modified (Sprint 1)

### The Core Insight
> The telemetry types are the right foundation; the plumbing needs replacement.

---

## Execution Path

```
1. Read EXECUTION_PROMPT.md
       ↓
2. Complete Epic 1 (types.ts)
       ↓
3. Complete Epic 2 (schema.ts + tests)
       ↓
4. Complete Epic 3 (projections/)
       ↓
5. Complete Epic 4 (store + migration)
       ↓
6. Complete Epic 5 (index + final tests)
       ↓
7. Verify: npm test && coverage ≥ 90%
```

---

## Related Sprints

| Sprint | Status | Dependency |
|--------|--------|------------|
| **bedrock-event-architecture-v1** | ▶ Current | - |
| bedrock-event-hooks-v1 | Planned | Depends on this sprint |
| bedrock-event-integration-v1 | Planned | Depends on hooks sprint |
| kinetic-suggested-prompts-v1 | Deferred | Depends on integration |

---

*Foundation Loop artifact navigation*
