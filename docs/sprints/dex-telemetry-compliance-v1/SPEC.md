# SPEC.md - DEX Telemetry Compliance

**Sprint:** dex-telemetry-compliance-v1
**Status:** Planning
**Created:** 2025-12-29

## Goals

### Primary Goal
Remediate DEX violations introduced in xstate-telemetry-v1 by transforming hardcoded domain logic into declarative configuration and adding provenance tracking infrastructure.

### Secondary Goals
1. Establish patterns for future DEX-compliant telemetry
2. Enable Foundation operators to tune engagement thresholds
3. Support future multi-Field deployments

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Declarative Sovereignty Grade | C+ | A |
| Provenance Grade | B- | A |
| Organic Scalability Grade | A- | A |
| Magic Numbers in UI Layer | 3 | 0 |
| Metrics with Attribution | 0% | 100% |

---

## Acceptance Criteria

### AC-1: Stage Thresholds Declarative
- [ ] Stage thresholds defined in `src/core/config/defaults.ts`
- [ ] `useMoments.ts` imports thresholds from config
- [ ] No hardcoded numbers in React layer
- [ ] Unit test for stage computation with configurable thresholds

### AC-2: Provenance Infrastructure
- [ ] New type `MetricAttribution` with fieldId, timestamp
- [ ] `JourneyCompletion` extends attribution with journeyId
- [ ] `TopicExploration` extends attribution with topicId, hubId
- [ ] `SproutCapture` extends attribution with sproutId
- [ ] Persistence layer stores attribution chain, not raw counts

### AC-3: Field Namespacing
- [ ] Storage keys include Field ID parameter
- [ ] Default Field ID: `'grove'`
- [ ] Multiple Fields can coexist in same browser
- [ ] Backward-compatible migration for existing data

### AC-4: Computed Properties
- [ ] `journeysCompleted` computed from `journeyCompletions.length`
- [ ] `topicsExplored` computed from `topicExplorations` unique topicIds
- [ ] `sproutsCaptured` computed from `sproutCaptures.length`

### AC-5: Type Safety
- [ ] All new types in `src/core/schema/telemetry.ts`
- [ ] XState context uses new provenance types
- [ ] No `any` types in telemetry code

### AC-6: Test Coverage
- [ ] Unit test: Stage computation
- [ ] Unit test: Provenance persistence
- [ ] Unit test: Field isolation
- [ ] Integration test: Migration from v1 to v2 storage

---

## Out of Scope

1. **Foundation UI for thresholds** - Admin console for editing thresholds is future work
2. **Remote Field sync** - Multi-device Field sync is future work
3. **Full telemetry service** - Server-side telemetry aggregation is future work
4. **Custom lens schema change** - `isCustom` flag in lens schema is future work

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| xstate-telemetry-v1 | Complete | Parent sprint |
| XState v5 | Installed | No changes needed |
| localStorage | Available | Browser API |

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Storage migration failure | Low | High | Add migration flag, rollback capability |
| Performance regression | Low | Medium | Computed properties are cheap |
| Breaking existing moments | Medium | Medium | Unit tests for stage evaluation |

---

## Definition of Done

1. All acceptance criteria pass
2. DEX grades all A or A-
3. 363+ tests passing (no regression)
4. No TypeScript errors
5. Build succeeds
6. DEVLOG updated with sprint summary
