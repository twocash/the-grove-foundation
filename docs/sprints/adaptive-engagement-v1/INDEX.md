# Sprint: adaptive-engagement-v1

**Status:** Planning Complete → Ready for Execution  
**Created:** 2025-12-26  
**Updated:** 2025-12-27

---

## Sprint Navigation

| Artifact | Purpose | Status |
|----------|---------|--------|
| [REPO_AUDIT.md](./REPO_AUDIT.md) | Current state analysis | ✅ Complete |
| [SPEC.md](./SPEC.md) | Goals, non-goals, acceptance criteria | ✅ Complete |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Target state, schemas, data flows | ✅ Complete |
| [MIGRATION_MAP.md](./MIGRATION_MAP.md) | File-by-file change plan | ✅ Complete |
| [DECISIONS.md](./DECISIONS.md) | ADRs explaining "why" | ✅ Complete |
| [SPRINTS.md](./SPRINTS.md) | Epic/story breakdown with tests | ✅ Complete |
| [EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md) | Self-contained handoff | ✅ Complete |
| [DEVLOG.md](./DEVLOG.md) | Execution tracking | 🔄 In Progress |
| [CONTINUATION_PROMPT.md](./CONTINUATION_PROMPT.md) | Session handoff | ✅ Complete |

---

## Quick Summary

Transform Grove's static welcome prompts into an adaptive system responding to engagement depth. New users get orientation; returning engaged users get depth/contribution prompts.

### Key Deliverables

1. **Session Telemetry** — Track visits, exchanges, topics, sprouts
2. **Session Stages** — ARRIVAL → ORIENTED → EXPLORING → ENGAGED
3. **Adaptive Prompts** — Stage-aware with dynamic variables
4. **Journey Framework** — Declarative paths with implicit entry
5. **Server Persistence** — Supabase sync (extends server-side-capture-v1)

### Patterns Extended

| Pattern | Extension |
|---------|-----------|
| Quantum Interface | Add `stagePrompts` dimension |
| Schema System | New telemetry + journey schemas |

### New Pattern Proposed

**Pattern 11: Session Engagement Telemetry** — Approved for implementation.

---

## Dependencies

- **server-side-capture-v1** — Must complete first (provides Supabase client, session ID)

---

## Execution Command

```bash
cd C:\GitHub\the-grove-foundation
# In Claude CLI:
# Read and execute docs/sprints/adaptive-engagement-v1/EXECUTION_PROMPT.md
```

---

*Foundation Loop v2.0 — Grove Foundation*
