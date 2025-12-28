# Sprint Breakdown: Journey Schema Unification

**Sprint:** journey-schema-unification-v1  
**Date:** 2024-12-28  
**Estimated Duration:** 2-3 hours

---

## Epic Overview

```
EPIC: Journey Schema Unification
├── Story 1: Create Adapter Infrastructure [45 min]
├── Story 2: Create Unified Lookup Service [30 min]
├── Story 3: Migrate Terminal.tsx [45 min]
├── Story 4: Migrate JourneyList.tsx [15 min]
├── Story 5: Add Integration Tests [30 min]
└── Story 6: Final Verification [15 min]
```

---

## Story 1: Create Adapter Infrastructure

**Estimate:** 45 minutes  
**Dependencies:** None  
**Build Gate:** `npm run build` passes

### Tasks

1.1 **Create journey-adapter.ts**
```
File: src/core/schema/journey-adapter.ts
```
- Import Journey type from ./journey
- Import LegacyJourney and JourneyNode from narratives-schema
- Implement adaptLegacyJourney() function
- Handle edge cases (no nodes, missing fields)
- Add console.warn for adaptation failures

1.2 **Verify build**
```bash
npm run build
```

### Acceptance Criteria
- [ ] File exists at correct location
- [ ] Exports adaptLegacyJourney function
- [ ] TypeScript compiles without errors
- [ ] Function handles null/undefined gracefully

---

## Story 2: Create Unified Lookup Service

**Estimate:** 30 minutes  
**Dependencies:** Story 1  
**Build Gate:** `npm run build` passes

### Tasks

2.1 **Create service.ts**
```
File: src/core/journey/service.ts
```
- Import getJourneyById from registry
- Import adaptLegacyJourney from adapter
- Implement getCanonicalJourney() function
- Registry-first, schema-fallback logic
- Add console.log for adapted journeys
- Add console.warn for not found

2.2 **Create barrel export**
```
File: src/core/journey/index.ts
```
- Export getCanonicalJourney
- Export adaptLegacyJourney (for testing)

2.3 **Add deprecation markers**
```
File: data/narratives-schema.ts
```
- Add @deprecated JSDoc to Journey interface
- Include migration guidance in deprecation message

2.4 **Verify build**
```bash
npm run build
```

### Acceptance Criteria
- [ ] getCanonicalJourney() exported from @/core/journey
- [ ] Legacy Journey marked @deprecated
- [ ] TypeScript compiles without errors

---

## Story 3: Migrate Terminal.tsx

**Estimate:** 45 minutes  
**Dependencies:** Story 2  
**Build Gate:** `npm run build` passes

### Tasks

3.1 **Add import**
```typescript
import { getCanonicalJourney } from '@/core/journey';
```

3.2 **Update onJourneyStart (~line 280)**
- Replace getJourneyById with getCanonicalJourney

3.3 **Update TerminalWelcome1 (~line 1099)**
- Replace getJourneyById with getCanonicalJourney

3.4 **Update pill button handlers (~line 1183)**
- Replace getJourneyById with getCanonicalJourney

3.5 **Update TerminalWelcome2 (~line 1335)**
- Replace getJourneyById with getCanonicalJourney

3.6 **Update CognitiveBridge (~line 1420)**
- Replace `schema?.journeys?.[id]` with `getCanonicalJourney(id, schema)`
- Remove the separate schema journey lookup

3.7 **Update journey suggestions (~line 1628)**
- Remove `|| getJourney()` fallback
- Use only getCanonicalJourney

3.8 **Clean up unused imports**
- Remove getJourneyById import if no longer used
- Remove getJourney from useNarrativeEngine destructuring if unused

3.9 **Verify build**
```bash
npm run build
```

### Acceptance Criteria
- [ ] No || fallback patterns remain
- [ ] All engStartJourney calls use getCanonicalJourney result
- [ ] No direct schema?.journeys access for XState
- [ ] TypeScript compiles without errors

---

## Story 4: Migrate JourneyList.tsx

**Estimate:** 15 minutes  
**Dependencies:** Story 2  
**Build Gate:** `npm run build` passes

### Tasks

4.1 **Add import**
```typescript
import { getCanonicalJourney } from '@/core/journey';
```

4.2 **Update handleStart (~line 178)**
- Replace getJourneyById with getCanonicalJourney
- Pass schema as second argument for fallback

4.3 **Verify build**
```bash
npm run build
```

### Acceptance Criteria
- [ ] handleStart uses getCanonicalJourney
- [ ] TypeScript compiles without errors

---

## Story 5: Add Integration Tests

**Estimate:** 30 minutes  
**Dependencies:** Stories 3, 4  
**Build Gate:** `npm test` passes

### Tasks

5.1 **Create test file**
```
File: __tests__/integration/journey-click.spec.ts
```

5.2 **Implement tests**
- Test: Click pill → XState receives Journey with waypoints
- Test: Adapter fallback works for legacy journeys
- Test: Missing journey handled gracefully (no crash)

5.3 **Run tests**
```bash
npm test
```

### Acceptance Criteria
- [ ] Test file exists
- [ ] All tests pass
- [ ] Tests cover registry path and adapter path

---

## Story 6: Final Verification

**Estimate:** 15 minutes  
**Dependencies:** All previous stories  
**Build Gate:** Full verification suite

### Tasks

6.1 **Full build**
```bash
npm run build
```

6.2 **All tests**
```bash
npm test
```

6.3 **Manual verification**
- Start dev server: `npm run dev`
- Navigate to /terminal
- Select a lens
- Click journey pill
- Verify: No console errors
- Verify: Journey UI appears
- Verify: XState state shows journeyActive

6.4 **Commit and push**
```bash
git add -A
git commit -m "feat: unify journey schema with adapter pattern

- Create journey-adapter.ts for legacy→canonical conversion
- Create unified getCanonicalJourney() service
- Migrate Terminal.tsx to use unified lookup
- Migrate JourneyList.tsx to use unified lookup
- Add @deprecated marker to legacy Journey type
- Add integration tests for journey click flow

Closes: journey-xstate-type-mismatch
ADRs: 001-005 in docs/sprints/journey-schema-unification-v1/"
git push origin main
```

### Acceptance Criteria
- [ ] Build passes
- [ ] All tests pass
- [ ] Manual verification succeeds
- [ ] Changes pushed to origin

---

## Commit Sequence

| Order | Type | Message |
|-------|------|---------|
| 1 | feat | create journey adapter infrastructure |
| 2 | feat | create unified journey lookup service |
| 3 | refactor | migrate Terminal.tsx to unified journey lookup |
| 4 | refactor | migrate JourneyList.tsx to unified journey lookup |
| 5 | test | add integration tests for journey click flow |
| 6 | docs | update sprint artifacts with completion status |

Or single squash commit as shown in Story 6.

---

*Sprint breakdown complete. Proceed to EXECUTION_PROMPT.md*
