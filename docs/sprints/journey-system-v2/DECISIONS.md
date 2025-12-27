# DECISIONS.md: Journey System v2

**Sprint**: journey-system-v2  
**Created**: 2024-12-27

---

## Decision 1: Type Strategy

**Decision**: Use schema types (`waypoints`) as canonical, update engagement types to match.

**Rationale**: Jim's input - "waypoints" is more flexible/scalable language than "steps".

**Impact**:
- Update `src/core/engagement/types.ts` to use `waypoints`
- Update `src/core/engagement/machine.ts` line 32
- Update `src/core/engagement/hooks/useJourneyState.ts`
- Add 6 journeys to registry using schema types

---

## Decision 2: Deferred Issues

**WaveformCollapse crash**: Note for user testing. No code changes this sprint.

**Re-render performance**: Note for user testing. Separate sprint if confirmed.

---

## Implementation Order

1. Update engagement types to use `waypoints`
2. Update XState machine to use `waypoints`
3. Update useJourneyState hook
4. Add 6 journeys to registry
5. Fix Terminal click handler
6. Test all journey pills
