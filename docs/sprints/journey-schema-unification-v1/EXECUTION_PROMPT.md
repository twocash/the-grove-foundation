# Execution Prompt: Journey Schema Unification

**Sprint:** journey-schema-unification-v1  
**Handoff Date:** 2024-12-28  
**Estimated Duration:** 2-3 hours

---

## Context for Executing Agent

You are implementing a schema unification sprint for The Grove Foundation codebase. The project follows the **Trellis Architecture** and **DEX (Declarative Exploration)** principles.

### The Problem

Two incompatible `Journey` type definitions exist:
- **Canonical** (`src/core/schema/journey.ts`): Has `waypoints[]`, required by XState
- **Legacy** (`data/narratives-schema.ts`): Has `entryNode`, no waypoints

When code passes a legacy Journey to the XState machine, it crashes:
```
Uncaught TypeError: Cannot read properties of undefined (reading 'length')
```

### The Solution

Create an adapter layer that converts legacy → canonical at the boundary, plus a unified lookup service that always returns the canonical type.

---

## Working Directory

```
C:\GitHub\the-grove-foundation
```

---

## Pre-Flight Checklist

Before starting, verify:

```bash
cd C:\GitHub\the-grove-foundation
git status                    # Should be clean
npm run build                 # Should pass
npm test                      # Note any pre-existing failures
```

---

## Story 1: Create Adapter Infrastructure

### 1.1 Create the adapter file

**Create file:** `src/core/schema/journey-adapter.ts`

```typescript
import type { Journey, JourneyWaypoint } from './journey';

// Import legacy types - adjust path if needed based on your tsconfig
interface LegacyJourney {
  id: string;
  title: string;
  description: string;
  entryNode: string;
  targetAha: string;
  linkedHubId?: string;
  estimatedMinutes: number;
  icon?: string;
  color?: string;
  status: 'active' | 'draft';
  createdAt: string;
  updatedAt: string;
}

interface JourneyNode {
  id: string;
  label: string;
  query: string;
  contextSnippet?: string;
  sectionId?: string;
  journeyId: string;
  sequenceOrder?: number;
  primaryNext?: string;
  alternateNext?: string[];
}

/**
 * Adapts a legacy NarrativeEngine journey to canonical format.
 * 
 * Legacy journeys have entryNode + separate JourneyNode[].
 * Canonical journeys have embedded waypoints[].
 * 
 * @param legacy - Legacy journey from NarrativeEngine schema
 * @param nodes - All nodes from schema (will be filtered by journeyId)
 * @returns Canonical Journey with waypoints, or null if adaptation fails
 */
export function adaptLegacyJourney(
  legacy: LegacyJourney,
  nodes: JourneyNode[]
): Journey | null {
  // Filter and sort nodes for this journey
  const journeyNodes = nodes
    .filter(n => n.journeyId === legacy.id)
    .sort((a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0));

  if (journeyNodes.length === 0) {
    console.warn(`[JourneyAdapter] No nodes found for journey: ${legacy.id}`);
    return null;
  }

  // Convert nodes to waypoints
  const waypoints: JourneyWaypoint[] = journeyNodes.map(node => ({
    id: node.id,
    title: node.label,
    prompt: node.query,
    hub: node.sectionId,
  }));

  return {
    id: legacy.id,
    title: legacy.title,
    description: legacy.description,
    estimatedTime: legacy.estimatedMinutes ? `${legacy.estimatedMinutes} minutes` : undefined,
    waypoints,
    completionMessage: legacy.targetAha ?? 'Journey complete.',
    lensAffinity: undefined,
    lensExclude: undefined,
    nextJourneys: undefined,
    allowImplicitEntry: false,
    ambientTracking: false,
  };
}
```

### 1.2 Verify build

```bash
npm run build
```

---

## Story 2: Create Unified Lookup Service

### 2.1 Create the service file

**Create file:** `src/core/journey/service.ts`

```typescript
import type { Journey } from '../schema/journey';
import { getJourneyById } from '../../data/journeys';
import { adaptLegacyJourney } from '../schema/journey-adapter';

/**
 * Schema type for NarrativeEngine data.
 * Used only for adapter fallback.
 */
interface NarrativeSchema {
  journeys?: Record<string, any>;
  nodes?: Record<string, any>;
}

/**
 * Unified journey lookup that always returns canonical Journey type.
 * 
 * Priority:
 * 1. TypeScript registry (has waypoints, preferred)
 * 2. NarrativeEngine schema (adapted to canonical)
 * 
 * @param id - Journey ID
 * @param schema - Optional NarrativeEngine schema for fallback
 * @returns Canonical Journey or null
 */
export function getCanonicalJourney(
  id: string,
  schema?: NarrativeSchema | null
): Journey | null {
  // 1. Try TypeScript registry first (always has waypoints)
  const registryJourney = getJourneyById(id);
  if (registryJourney) {
    console.log(`[JourneyService] Found in registry: ${id}`);
    return registryJourney;
  }

  // 2. Fallback to schema with adaptation
  if (schema?.journeys?.[id]) {
    const legacyJourney = schema.journeys[id];
    const nodes = Object.values(schema.nodes ?? {}) as any[];
    const adapted = adaptLegacyJourney(legacyJourney, nodes);
    if (adapted) {
      console.log(`[JourneyService] Adapted legacy journey: ${id}`);
      return adapted;
    }
  }

  console.warn(`[JourneyService] Journey not found: ${id}`);
  return null;
}
```

### 2.2 Create barrel export

**Create file:** `src/core/journey/index.ts`

```typescript
export { getCanonicalJourney } from './service';
export { adaptLegacyJourney } from '../schema/journey-adapter';
```

### 2.3 Add deprecation marker to legacy type

**Edit file:** `data/narratives-schema.ts`

Find the Journey interface and add deprecation JSDoc:

```typescript
/**
 * @deprecated Use Journey from src/core/schema/journey.ts instead.
 * This type lacks waypoints[] required by XState engagement machine.
 * Migration: Use getCanonicalJourney() from src/core/journey/service.ts
 */
export interface Journey {
  // ... existing fields unchanged
}
```

### 2.4 Verify build

```bash
npm run build
```

---

## Story 3: Migrate Terminal.tsx

**Edit file:** `components/Terminal.tsx`

### 3.1 Add import at top of file

```typescript
import { getCanonicalJourney } from '@/core/journey';
```

### 3.2 Find and replace all journey lookups

Search for these patterns and replace:

**Pattern 1:** `getJourneyById(someId)`
**Replace with:** `getCanonicalJourney(someId, schema)`

**Pattern 2:** `schema?.journeys?.[someId]` (when used for XState)
**Replace with:** `getCanonicalJourney(someId, schema)`

**Pattern 3:** `getJourneyById(id) || getJourney(id)` (fallback patterns)
**Replace with:** `getCanonicalJourney(id, schema)`

### 3.3 Specific locations to check

Use grep/search to find all occurrences:

```bash
grep -n "getJourneyById\|getJourney\|schema?.journeys" components/Terminal.tsx
```

Expected locations (line numbers approximate):
- ~280: onJourneyStart callback
- ~1099: TerminalWelcome1 component
- ~1183: Pill button handlers
- ~1335: TerminalWelcome2 component  
- ~1420: CognitiveBridge section
- ~1628: Journey suggestion pills

### 3.4 Clean up imports

If `getJourneyById` from `@/data/journeys` is no longer used anywhere in the file, remove that import.

### 3.5 Verify build

```bash
npm run build
```

---

## Story 4: Migrate JourneyList.tsx

**Edit file:** `src/explore/JourneyList.tsx`

### 4.1 Add import

```typescript
import { getCanonicalJourney } from '@/core/journey';
```

### 4.2 Update handleStart function

Find the handleStart function (around line 178) and update:

```typescript
const handleStart = useCallback((journeyId: string) => {
  const journey = getCanonicalJourney(journeyId, schema);
  if (journey) {
    engStartJourney(journey);
  } else {
    console.warn(`[JourneyList] Journey not found: ${journeyId}`);
  }
}, [schema, engStartJourney]);
```

### 4.3 Verify build

```bash
npm run build
```

---

## Story 5: Add Integration Tests

**Create file:** `__tests__/integration/journey-click.spec.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getCanonicalJourney } from '@/core/journey';
import { getJourneyById } from '@/data/journeys';
import { adaptLegacyJourney } from '@/core/schema/journey-adapter';

describe('Journey Schema Unification', () => {
  describe('getCanonicalJourney', () => {
    it('should return journey from registry when available', () => {
      const journey = getCanonicalJourney('simulation');
      
      expect(journey).not.toBeNull();
      expect(journey?.id).toBe('simulation');
      expect(journey?.waypoints).toBeDefined();
      expect(journey?.waypoints.length).toBeGreaterThan(0);
    });

    it('should return journey with waypoints array', () => {
      const journey = getCanonicalJourney('stakes');
      
      expect(journey?.waypoints).toBeInstanceOf(Array);
      journey?.waypoints.forEach(wp => {
        expect(wp.id).toBeDefined();
        expect(wp.title).toBeDefined();
        expect(wp.prompt).toBeDefined();
      });
    });

    it('should return null for unknown journey', () => {
      const journey = getCanonicalJourney('nonexistent-journey-id');
      
      expect(journey).toBeNull();
    });

    it('should adapt legacy journey when not in registry', () => {
      const mockSchema = {
        journeys: {
          'legacy-test': {
            id: 'legacy-test',
            title: 'Legacy Test Journey',
            description: 'A test journey',
            entryNode: 'node-1',
            targetAha: 'You learned something!',
            estimatedMinutes: 10,
            status: 'active',
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          }
        },
        nodes: {
          'node-1': {
            id: 'node-1',
            label: 'First Step',
            query: 'What is the first step?',
            journeyId: 'legacy-test',
            sequenceOrder: 0,
          },
          'node-2': {
            id: 'node-2',
            label: 'Second Step',
            query: 'What is the second step?',
            journeyId: 'legacy-test',
            sequenceOrder: 1,
          }
        }
      };

      const journey = getCanonicalJourney('legacy-test', mockSchema);
      
      expect(journey).not.toBeNull();
      expect(journey?.waypoints).toHaveLength(2);
      expect(journey?.waypoints[0].title).toBe('First Step');
      expect(journey?.waypoints[1].title).toBe('Second Step');
    });
  });

  describe('adaptLegacyJourney', () => {
    it('should return null when no nodes match journey', () => {
      const legacy = {
        id: 'orphan',
        title: 'Orphan Journey',
        description: 'No nodes',
        entryNode: 'missing',
        targetAha: 'Nothing',
        estimatedMinutes: 5,
        status: 'active' as const,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      const result = adaptLegacyJourney(legacy, []);
      
      expect(result).toBeNull();
    });

    it('should sort nodes by sequenceOrder', () => {
      const legacy = {
        id: 'test',
        title: 'Test',
        description: 'Test',
        entryNode: 'a',
        targetAha: 'Done',
        estimatedMinutes: 5,
        status: 'active' as const,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      const nodes = [
        { id: 'c', label: 'Third', query: 'Q3', journeyId: 'test', sequenceOrder: 2 },
        { id: 'a', label: 'First', query: 'Q1', journeyId: 'test', sequenceOrder: 0 },
        { id: 'b', label: 'Second', query: 'Q2', journeyId: 'test', sequenceOrder: 1 },
      ];

      const result = adaptLegacyJourney(legacy, nodes);
      
      expect(result?.waypoints[0].title).toBe('First');
      expect(result?.waypoints[1].title).toBe('Second');
      expect(result?.waypoints[2].title).toBe('Third');
    });
  });

  describe('XState Compatibility', () => {
    it('should provide waypoints.length for XState machine', () => {
      // This is the critical property that XState needs
      const journey = getCanonicalJourney('simulation');
      
      expect(journey).not.toBeNull();
      
      // Simulate what XState does:
      const journeyTotal = journey!.waypoints.length;
      
      expect(journeyTotal).toBeGreaterThan(0);
      expect(typeof journeyTotal).toBe('number');
    });
  });
});
```

### 5.1 Run tests

```bash
npm test
```

---

## Story 6: Final Verification

### 6.1 Full build

```bash
npm run build
```

### 6.2 All tests

```bash
npm test
```

### 6.3 Manual verification

```bash
npm run dev
```

Then in browser:
1. Navigate to `/terminal`
2. Select any lens
3. Click a journey pill
4. **Verify:** No console errors
5. **Verify:** Journey UI appears
6. **Verify:** Console shows `[JourneyService] Found in registry: {id}`

### 6.4 Commit and push

```bash
git add -A
git commit -m "feat: unify journey schema with adapter pattern

- Create journey-adapter.ts for legacy→canonical conversion
- Create unified getCanonicalJourney() service  
- Migrate Terminal.tsx to use unified lookup
- Migrate JourneyList.tsx to use unified lookup
- Add @deprecated marker to legacy Journey type
- Add integration tests for journey click flow

Resolves: journey-xstate-type-mismatch
ADRs: 001-005 in docs/sprints/journey-schema-unification-v1/"

git push origin main
```

---

## Troubleshooting

### Build fails after creating adapter

Check import paths. The adapter uses relative imports that may need adjustment based on your tsconfig paths.

### Tests fail on import

Ensure `@/core/journey` alias is configured in vitest.config.ts or tsconfig.json.

### Journey still crashes at runtime

1. Check console for `[JourneyService]` logs
2. Verify the journey ID exists in registry (`src/data/journeys/index.ts`)
3. Check that `engStartJourney` is receiving the result of `getCanonicalJourney`, not a legacy journey

### CognitiveBridge path not working

The CognitiveBridge section (~line 1420 in Terminal.tsx) may have complex logic. Ensure:
1. Schema is passed as second argument to getCanonicalJourney
2. The result is used for engStartJourney, not the raw schema journey

---

## Success Criteria Checklist

Before marking complete:

- [ ] `npm run build` passes
- [ ] `npm test` passes (including new integration tests)
- [ ] Manual test: journey pill click works without errors
- [ ] Console shows `[JourneyService]` logs (not undefined errors)
- [ ] Changes committed and pushed
- [ ] DEVLOG.md updated with completion notes

---

## Reference Files

Read these for additional context if needed:

- `docs/sprints/journey-schema-unification-v1/REPO_AUDIT.md`
- `docs/sprints/journey-schema-unification-v1/ARCHITECTURE.md`
- `docs/sprints/journey-schema-unification-v1/DECISIONS.md`
- `src/core/schema/journey.ts` (canonical type definition)
- `src/data/journeys/index.ts` (TypeScript registry)

---

*End of Execution Prompt*
