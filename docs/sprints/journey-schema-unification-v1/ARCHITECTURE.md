# Architecture: Journey Schema Unification

**Sprint:** journey-schema-unification-v1  
**Date:** 2024-12-28

---

## Target Architecture

### Principle: Adapter at the Boundary

Following the Trellis Architecture's **Capability Agnosticism** pillar, we create a rigid boundary that converts legacy data to canonical format. The XState machine never sees legacy types.

```
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA SOURCES                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  TypeScript Registry              NarrativeEngine Schema            │
│  ┌─────────────────────────┐     ┌─────────────────────────┐       │
│  │ src/data/journeys/      │     │ /api/narrative          │       │
│  │ - Canonical Journey     │     │ - LegacyJourney         │       │
│  │ - waypoints[]           │     │ - entryNode + nodes     │       │
│  └───────────┬─────────────┘     └───────────┬─────────────┘       │
│              │                               │                      │
│              │                               ▼                      │
│              │                   ┌─────────────────────────┐       │
│              │                   │ ADAPTER LAYER           │       │
│              │                   │ adaptLegacyJourney()    │       │
│              │                   │ Legacy → Canonical      │       │
│              │                   └───────────┬─────────────┘       │
│              │                               │                      │
│              ▼                               ▼                      │
│         ┌────────────────────────────────────────────────────┐     │
│         │              UNIFIED LOOKUP SERVICE                 │     │
│         │                                                     │     │
│         │  getCanonicalJourney(id: string): Journey | null   │     │
│         │                                                     │     │
│         │  1. Check TypeScript registry first                │     │
│         │  2. If not found, check schema + adapt             │     │
│         │  3. Return canonical Journey or null               │     │
│         └────────────────────────────────────────────────────┘     │
│                                    │                                │
└────────────────────────────────────┼────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         CONSUMERS                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Terminal.tsx           JourneyList.tsx        CognitiveBridge      │
│  ┌────────────────┐    ┌────────────────┐    ┌────────────────┐    │
│  │ onJourneyStart │    │ handleStart    │    │ journey start  │    │
│  │ pill clicks    │    │ button click   │    │ from entropy   │    │
│  └───────┬────────┘    └───────┬────────┘    └───────┬────────┘    │
│          │                     │                     │              │
│          └─────────────────────┼─────────────────────┘              │
│                                ▼                                    │
│                    ┌─────────────────────────┐                      │
│                    │ engStartJourney(journey)│                      │
│                    │ XState Machine          │                      │
│                    │ REQUIRES: waypoints[]   │                      │
│                    └─────────────────────────┘                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Component Specifications

### 1. Adapter Function

**Location:** `src/core/schema/journey-adapter.ts` (NEW FILE)

```typescript
import type { Journey } from './journey';
import type { Journey as LegacyJourney, JourneyNode } from '@/data/narratives-schema';

/**
 * Adapts a legacy NarrativeEngine journey to canonical format.
 * 
 * Legacy journeys have entryNode + separate JourneyNode[].
 * Canonical journeys have embedded waypoints[].
 * 
 * @param legacy - Legacy journey from NarrativeEngine schema
 * @param nodes - JourneyNode[] from schema.nodes filtered by journeyId
 * @returns Canonical Journey with waypoints, or null if adaptation fails
 */
export function adaptLegacyJourney(
  legacy: LegacyJourney,
  nodes: JourneyNode[]
): Journey | null {
  // Sort nodes by sequenceOrder
  const sortedNodes = [...nodes]
    .filter(n => n.journeyId === legacy.id)
    .sort((a, b) => (a.sequenceOrder ?? 0) - (b.sequenceOrder ?? 0));

  if (sortedNodes.length === 0) {
    console.warn(`[JourneyAdapter] No nodes found for journey: ${legacy.id}`);
    return null;
  }

  return {
    id: legacy.id,
    title: legacy.title,
    description: legacy.description,
    estimatedTime: legacy.estimatedMinutes ? `${legacy.estimatedMinutes} minutes` : undefined,
    waypoints: sortedNodes.map(node => ({
      id: node.id,
      title: node.label,
      prompt: node.query,
      hub: node.sectionId,
    })),
    completionMessage: legacy.targetAha ?? 'Journey complete.',
    // Optional fields with sensible defaults
    lensAffinity: undefined,
    lensExclude: undefined,
    nextJourneys: undefined,
    allowImplicitEntry: false,
    ambientTracking: false,
  };
}
```

### 2. Unified Lookup Service

**Location:** `src/core/journey/service.ts` (NEW FILE)

```typescript
import type { Journey } from '../schema/journey';
import { getJourneyById } from '@/data/journeys';
import { adaptLegacyJourney } from '../schema/journey-adapter';

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
  schema?: { journeys?: Record<string, any>; nodes?: Record<string, any> }
): Journey | null {
  // 1. Try TypeScript registry first (always has waypoints)
  const registryJourney = getJourneyById(id);
  if (registryJourney) {
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

### 3. Deprecation Markers

**Location:** `data/narratives-schema.ts`

```typescript
/**
 * @deprecated Use Journey from src/core/schema/journey.ts instead.
 * This type lacks waypoints[] required by XState engagement machine.
 * Migration: Use getCanonicalJourney() from src/core/journey/service.ts
 */
export interface Journey {
  // ... existing fields
}
```

---

## File Changes Summary

| File | Change | Purpose |
|------|--------|---------|
| `src/core/schema/journey-adapter.ts` | CREATE | Adapter function |
| `src/core/journey/service.ts` | CREATE | Unified lookup |
| `src/core/journey/index.ts` | CREATE | Barrel export |
| `data/narratives-schema.ts` | MODIFY | Add @deprecated |
| `components/Terminal.tsx` | MODIFY | Use getCanonicalJourney() |
| `src/explore/JourneyList.tsx` | MODIFY | Use getCanonicalJourney() |
| `__tests__/integration/journey-click.spec.ts` | CREATE | Integration test |

---

## Type Flow Diagram

```
Before (BROKEN):
  LegacyJourney ──────────────────────► engStartJourney() ──► CRASH
                    (no waypoints)

After (FIXED):
  LegacyJourney ──► adaptLegacyJourney() ──► Journey ──► engStartJourney() ──► ✓
                                           (waypoints)

  RegistryJourney ─────────────────────────► Journey ──► engStartJourney() ──► ✓
                    (already has waypoints)
```

---

## API Contracts

### getCanonicalJourney()

```typescript
function getCanonicalJourney(
  id: string,
  schema?: NarrativeSchema
): Journey | null

// Returns:
// - Journey with waypoints[] (guaranteed)
// - null if journey not found or adaptation fails
```

### engStartJourney()

```typescript
// XState machine action (unchanged)
function engStartJourney(journey: Journey): void

// Precondition: journey.waypoints is defined and non-empty
// Postcondition: XState context.journeyTotal === journey.waypoints.length
```

---

## Test Strategy

### Integration Test: `journey-click.spec.ts`

```typescript
describe('Journey Click Flow', () => {
  it('should start journey with correct waypoint count', async () => {
    // Arrange: Render Terminal with lens selected
    // Act: Click journey pill
    // Assert: XState state === 'journeyActive'
    // Assert: context.journeyTotal === expectedWaypoints
  });

  it('should handle legacy journey via adapter', async () => {
    // Arrange: Journey only in schema (not registry)
    // Act: Trigger CognitiveBridge journey start
    // Assert: Adapter called
    // Assert: XState state === 'journeyActive'
  });

  it('should gracefully handle missing journey', async () => {
    // Arrange: Invalid journey ID
    // Act: Attempt to start journey
    // Assert: No crash
    // Assert: Warning logged
  });
});
```

---

*Architecture complete. Proceed to MIGRATION_MAP.md*
