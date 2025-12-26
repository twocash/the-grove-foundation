# Development Log: Versioned Collection Refactor

**Sprint:** versioned-collection-refactor-v1
**Started:** 2025-12-26
**Status:** Planning Complete

## Session 1: Planning (2025-12-26)

### Completed
- [x] REPO_AUDIT.md - Identified pattern violations
- [x] SPEC.md - Defined goals and acceptance criteria
- [x] ARCHITECTURE.md - Designed target state
- [x] MIGRATION_MAP.md - Planned execution order
- [x] DECISIONS.md - Documented ADRs
- [x] SPRINTS.md - Epic/story breakdown
- [x] EXECUTION_PROMPT.md - Self-contained handoff

### Key Decisions
1. Generic hook over type-specific (ADR-001)
2. Declarative merge config (ADR-002)
3. Event-driven refresh (ADR-003)
4. Simple Set callbacks over pub/sub (ADR-004)

### Blockers
None

### Next Steps
Execute EXECUTION_PROMPT.md

---

## Session 2: Execution (pending)

### Epic 1: Core Infrastructure
- [ ] 1.1 Create merge-config.ts
- [ ] 1.2 Export from versioning index

### Epic 2: Generic Hook
- [ ] 2.1 Create useVersionedCollection.ts
- [ ] 2.2 Add unit tests

### Epic 3: Event System
- [ ] 3.1 Add onInspectorClosed to context
- [ ] 3.2 Update closeInspector to emit

### Epic 4: Migrate Consumers
- [ ] 4.1 Update LensPicker
- [ ] 4.2 Update JourneyList
- [ ] 4.3 Delete old hooks

### Epic 5: Verification
- [ ] 5.1 Run full test suite
- [ ] 5.2 Manual testing
