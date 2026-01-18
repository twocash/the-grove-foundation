# Kinetic Foundation v1.0 — Sprint Specification

**Sprint:** `kinetic-foundation-v1`  
**Date:** December 24, 2024  
**Author:** Jim Calhoun (via Claude Desktop)  
**Status:** Ready for Execution

---

## Executive Summary

Transform Grove's Foundation console architecture from ad-hoc component patterns into a **Kinetic Architecture** aligned with the DEX (Declarative Exploration) standard. This sprint extracts reusable patterns from the working NarrativeArchitect implementation and creates a unified object model that supports future agent proposal pipelines.

**The First Order Directive:** Separation of Exploration Logic from Execution Capability.

---

## Goals

### G1: Extract Component Grammar
Extract inline components from NarrativeArchitect into shared primitives that all consoles can use consistently.

### G2: Create DEX Object Model
Define base `DEXObject` interface with kinetic metadata fields (proposedBy, approvedBy, telemetryScore, evolutionHistory).

### G3: Create DEX Registry Pattern
Build centralized object store with CRUD operations, subscriptions, and persistence hooks.

### G4: Refactor NarrativeArchitect
Update NarrativeArchitect to consume from DEXRegistry while maintaining identical behavior.

### G5: Maintain Full Backward Compatibility
All existing tests pass. No breaking changes to API or UI behavior.

---

## Non-Goals

- **NOT** migrating other consoles (KnowledgeVault, HealthDashboard, EngagementBridge)
- **NOT** implementing agent proposal pipeline (Sprint 2)
- **NOT** adding new features to NarrativeArchitect
- **NOT** changing the server.js API endpoints
- **NOT** modifying the GCS storage schema

---

## Acceptance Criteria

### AC1: Component Extraction
- [ ] `SegmentedControl` component exists in `src/shared/`
- [ ] `ObjectList` component exists in `src/shared/`
- [ ] `ObjectGrid` component exists in `src/shared/`
- [ ] Each component has TypeScript generics for type safety
- [ ] Each component follows Foundation design tokens

### AC2: DEX Type System
- [ ] `src/core/schema/dex.ts` exports `DEXObject` base interface
- [ ] `DEXCaptureContext` interface exists for entropy integration
- [ ] Extended types exist: `DEXJourney`, `DEXNode`, `DEXHub`, `DEXLens`
- [ ] Types include kinetic metadata fields (including `captureContext`)
- [ ] Existing `narratives-schema.ts` types can be cast to DEX types

### AC3: DEX Registry
- [ ] `useDEXRegistry` hook provides CRUD operations
- [ ] Registry supports subscription for reactivity
- [ ] Registry hydrates from NarrativeSchemaV2
- [ ] Registry dehydrates to NarrativeSchemaV2 for persistence

### AC4: NarrativeArchitect Migration
- [ ] NarrativeArchitect uses extracted components
- [ ] NarrativeArchitect uses DEXRegistry internally
- [ ] Inspector pattern continues working
- [ ] Save to Production continues working (GitHub sync)

### AC5: Test Verification
- [ ] All existing unit tests pass (`npm test`)
- [ ] All existing E2E tests pass (`npx playwright test`)
- [ ] Build succeeds (`npm run build`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)

---

## Test Requirements

### Unit Tests to Add
```
tests/unit/core/schema/dex.test.ts       # DEX type validation
tests/unit/core/registry/DEXRegistry.test.ts  # Registry operations
tests/unit/shared/SegmentedControl.test.tsx   # Component render
tests/unit/shared/ObjectList.test.tsx         # Component render
tests/unit/shared/ObjectGrid.test.tsx         # Component render
```

### E2E Tests to Verify
```
tests/e2e/foundation/narrative-architect.spec.ts  # Existing flows
tests/e2e/foundation/inspector-navigation.spec.ts # Click → Inspector
```

### Build Gate Commands
```bash
npm run build                    # Must compile
npm test                         # Unit tests pass
npx playwright test              # E2E tests pass
npx tsc --noEmit                 # No type errors
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking NarrativeArchitect | Medium | High | Run tests after each change |
| Type system too rigid | Low | Medium | Start minimal, extend as needed |
| Registry performance | Low | Low | Use React.useMemo for derived data |
| Over-abstraction | Medium | Medium | Only extract what's needed now |

---

## Success Metrics

1. **Zero Regressions:** All existing tests pass
2. **Code Reduction:** NarrativeArchitect.tsx shrinks by ~100 lines
3. **Reusability:** 3 new shared components available for other consoles
4. **Type Safety:** DEX types catch errors at compile time
5. **Documentation:** All new code has JSDoc comments

---

## Out of Scope (Future Sprints)

### Sprint 2: Console Migration
- Migrate SproutQueue to use ObjectGrid
- Add inspector to KnowledgeVault
- Unify tab patterns

### Sprint 3: Agent Proposal Pipeline
- Add proposal queue to DEXRegistry
- Implement agent → proposal → human approval flow
- Add telemetry scoring

### Sprint 4: Kinetic Configuration
- JSON configs become agent-editable
- Version control for schema changes
- Agent attribution tracking

---

## References

- [Deep Dive Analysis](notion://2d3780a7-8eef-811f-afbe-d07902ebc680)
- [GROVE_FOUNDATION_REFACTOR_SPEC.md](/mnt/project/GROVE_FOUNDATION_REFACTOR_SPEC.md)
- [Kinetic_Framework_Strategic_Vision.md](/mnt/project/Kinetic_Framework_Strategic_Vision.md)
- [The_Trellis_Architecture__First_Order_Directives.md](/mnt/project/The_Trellis_Architecture__First_Order_Directives.md)
