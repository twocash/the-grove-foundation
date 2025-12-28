# Migration Map: Journey Schema Unification

**Sprint:** journey-schema-unification-v1  
**Date:** 2024-12-28

---

## Execution Order

Files must be modified in this order to maintain build integrity at each step.

### Phase 1: Create New Infrastructure (No Breaking Changes)

| Step | File | Action | Verification |
|------|------|--------|--------------|
| 1.1 | `src/core/schema/journey-adapter.ts` | CREATE | `npm run build` passes |
| 1.2 | `src/core/journey/service.ts` | CREATE | `npm run build` passes |
| 1.3 | `src/core/journey/index.ts` | CREATE | `npm run build` passes |

### Phase 2: Add Deprecation Markers (No Breaking Changes)

| Step | File | Action | Verification |
|------|------|--------|--------------|
| 2.1 | `data/narratives-schema.ts` | ADD @deprecated to Journey | `npm run build` passes |

### Phase 3: Migrate Consumers (Breaking Changes Contained)

| Step | File | Action | Verification |
|------|------|--------|--------------|
| 3.1 | `components/Terminal.tsx` | Replace lookups with getCanonicalJourney() | `npm run build` passes |
| 3.2 | `src/explore/JourneyList.tsx` | Replace lookups with getCanonicalJourney() | `npm run build` passes |

### Phase 4: Add Tests

| Step | File | Action | Verification |
|------|------|--------|--------------|
| 4.1 | `__tests__/integration/journey-click.spec.ts` | CREATE | `npm test` passes |

### Phase 5: Verification

| Step | Action | Verification |
|------|--------|--------------|
| 5.1 | Full build | `npm run build` |
| 5.2 | All tests | `npm test` |
| 5.3 | Manual test | Click journey pill in browser |

---

## Detailed File Changes

### 1.1 CREATE: `src/core/schema/journey-adapter.ts`

```
Location: src/core/schema/journey-adapter.ts
Action: Create new file
Dependencies: src/core/schema/journey.ts (existing)
```

**Content:** Adapter function that converts legacy Journey + JourneyNode[] to canonical Journey with waypoints[].

### 1.2 CREATE: `src/core/journey/service.ts`

```
Location: src/core/journey/service.ts
Action: Create new file
Dependencies: 
  - src/core/schema/journey-adapter.ts (step 1.1)
  - src/data/journeys/index.ts (existing)
```

**Content:** Unified lookup service with getCanonicalJourney() function.

### 1.3 CREATE: `src/core/journey/index.ts`

```
Location: src/core/journey/index.ts
Action: Create new file (barrel export)
```

**Content:**
```typescript
export { getCanonicalJourney } from './service';
export { adaptLegacyJourney } from '../schema/journey-adapter';
```

### 2.1 MODIFY: `data/narratives-schema.ts`

```
Location: data/narratives-schema.ts
Action: Add JSDoc @deprecated to Journey interface
Lines affected: ~Line 45 (Journey interface definition)
```

**Before:**
```typescript
export interface Journey {
```

**After:**
```typescript
/**
 * @deprecated Use Journey from src/core/schema/journey.ts instead.
 * This type lacks waypoints[] required by XState engagement machine.
 * Migration: Use getCanonicalJourney() from src/core/journey/service.ts
 */
export interface Journey {
```

### 3.1 MODIFY: `components/Terminal.tsx`

```
Location: components/Terminal.tsx
Action: Replace all journey lookups with getCanonicalJourney()
Lines affected: Multiple (see detailed list below)
```

**Changes:**

1. **Add import** (top of file):
```typescript
import { getCanonicalJourney } from '@/core/journey';
```

2. **Line ~280 (onJourneyStart)**: Already uses getJourneyById, change to getCanonicalJourney
3. **Line ~1099 (TerminalWelcome1)**: Change getJourneyById to getCanonicalJourney
4. **Line ~1183 (Pill buttons)**: Change getJourneyById to getCanonicalJourney
5. **Line ~1335 (TerminalWelcome2)**: Change getJourneyById to getCanonicalJourney
6. **Line ~1420 (CognitiveBridge)**: Replace schema?.journeys?.[id] with getCanonicalJourney(id, schema)
7. **Line ~1628 (Journey suggestions)**: Remove || getJourney() fallback

**Remove these imports if no longer needed:**
```typescript
// Remove if unused after migration:
import { getJourneyById } from '@/data/journeys';
```

### 3.2 MODIFY: `src/explore/JourneyList.tsx`

```
Location: src/explore/JourneyList.tsx
Action: Use getCanonicalJourney for XState calls
Lines affected: ~Line 178 (handleStart)
```

**Changes:**

1. **Add import**:
```typescript
import { getCanonicalJourney } from '@/core/journey';
```

2. **Line ~178 (handleStart)**:
```typescript
// Before:
const registryJourney = getJourneyById(journeyId);

// After:
const journey = getCanonicalJourney(journeyId, schema);
```

### 4.1 CREATE: `__tests__/integration/journey-click.spec.ts`

```
Location: __tests__/integration/journey-click.spec.ts
Action: Create new integration test file
Dependencies: Testing utilities, Terminal component
```

**Content:** Integration tests verifying journey click → XState flow.

---

## Rollback Plan

If issues arise, rollback in reverse order:

1. Revert Terminal.tsx and JourneyList.tsx changes
2. Remove new files (adapter, service, index)
3. Remove deprecation markers

Git commands:
```bash
git revert HEAD~N  # Where N is number of commits in this sprint
```

---

## Build Gates

After each phase, run:

```bash
npm run build    # Must pass
npm test         # Must pass (after Phase 4)
```

Do NOT proceed to next phase if build fails.

---

*Migration map complete. Proceed to DECISIONS.md*
