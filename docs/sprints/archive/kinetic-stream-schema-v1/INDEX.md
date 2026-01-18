# Sprint: kinetic-stream-schema-v1

**The Declarative Foundation for Kinetic Chat**

## Vision

Transform the Terminal's chat from a "log of text" into a **Kinetic Stream of DEX Objects**—where every element (text, suggestions, lens reveals) is a first-class typed object the engagement machine emits and the UI renders polymorphically.

This is Sprint 1 of 3. It establishes the **schema and machine extensions**. Sprints 2-3 build the renderer and polish.

## Sprint Artifacts

| Artifact | Purpose | Status |
|----------|---------|--------|
| [REPO_AUDIT.md](./REPO_AUDIT.md) | Current state analysis | 📋 |
| [SPEC.md](./SPEC.md) | Goals, non-goals, acceptance criteria | 📋 |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Target state, schemas, data flows | 📋 |
| [MIGRATION_MAP.md](./MIGRATION_MAP.md) | File-by-file change plan | 📋 |
| [DECISIONS.md](./DECISIONS.md) | ADRs explaining "why" | 📋 |
| [SPRINTS.md](./SPRINTS.md) | Epic/story breakdown with tests | 📋 |
| [EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md) | Self-contained handoff for Claude Code | 📋 |
| [DEVLOG.md](./DEVLOG.md) | Execution tracking | 📋 |
| [CONTINUATION_PROMPT.md](./CONTINUATION_PROMPT.md) | Session handoff | 📋 |

## Related Sprints

- **Preceded by:** terminal-kinetic-commands-v1 (command architecture)
- **Followed by:** kinetic-stream-rendering-v1 (polymorphic renderer)
- **Followed by:** kinetic-stream-polish-v1 (glass UX layer)

## Key Decisions

1. **StreamItem extends ChatMessage** (not a parallel type)
2. **Uses GroveObjectMeta** for identity/provenance
3. **Engagement machine emits metadata** (not raw strings)
4. **NavigationBlock uses JourneyPath** (not new type)

## Advisory Council Guidance

Per weighted routing:
- **Park (10):** Validate LLM parsing feasibility for ActiveSpans
- **Benet (10):** Ensure schema supports eventual distribution
- **Adams (8):** Confirm drama potential in typed stream
- **Short (8):** Validate diary implications of rhetorical parsing

---

*Last updated: December 2024*
*Sprint owner: Jim Calhoun*
