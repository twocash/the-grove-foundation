# Repository Audit: Journey Schema Unification

**Sprint:** journey-schema-unification-v1  
**Date:** 2024-12-28  
**Auditor:** Claude (Planning Phase)

---

## Executive Summary

The codebase contains **two incompatible Journey type definitions** that cause runtime crashes when the XState engagement machine receives the wrong type. This audit maps all Journey-related code to enable proper unification.

---

## 1. Journey Type Definitions

### 1.1 Canonical Type (NEW - XState Compatible)

**Location:** `src/core/schema/journey.ts`

```typescript
interface JourneyWaypoint {
  id: string;
  title: string;
  prompt: string;
  hub?: string;
  successCriteria?: { minExchanges?: number; topicsMentioned?: string[]; };
  entryPatterns?: string[];
}

interface Journey {
  id: string;
  title: string;
  description: string;
  estimatedTime?: string;
  lensAffinity?: string[];
  lensExclude?: string[];
  waypoints: JourneyWaypoint[];  // ← CRITICAL: XState expects this
  completionMessage: string;
  nextJourneys?: string[];
  allowImplicitEntry?: boolean;
  ambientTracking?: boolean;
}
```

**Used by:**
- XState machine (`src/core/engagement/machine.ts`)
- Journey hooks (`src/core/engagement/hooks/useJourneyState.ts`)
- TypeScript registry (`src/data/journeys/index.ts`)

### 1.2 Legacy Type (OLD - NarrativeEngine)

**Location:** `data/narratives-schema.ts`

```typescript
type JourneyStatus = 'active' | 'draft';

interface Journey {
  id: string;
  title: string;
  description: string;
  entryNode: string;              // ← Different structure
  targetAha: string;
  linkedHubId?: string;
  estimatedMinutes: number;       // ← Different name than estimatedTime
  icon?: string;
  color?: string;
  status: JourneyStatus;
  createdAt: string;
  updatedAt: string;
}

interface JourneyNode {
  id: string;
  label: string;
  query: string;
  contextSnippet?: string;
  sectionId?: string;
  journeyId: string;              // ← Nodes reference journey, not embedded
  sequenceOrder?: number;
  primaryNext?: string;
  alternateNext?: string[];
}
```

**Used by:**
- NarrativeEngine context (`contexts/NarrativeEngineContext.tsx`)
- Narrative schema API (`/api/narrative`)
- JourneyList component (for display)

---

## 2. Lookup Functions

### 2.1 TypeScript Registry (Returns Canonical Type)

**Location:** `src/data/journeys/index.ts`

```typescript
export function getJourneyById(id: string): Journey | undefined {
  return journeys.find(j => j.id === id);
}
```

**Contains:** 6 journeys with waypoints:
- simulation, stakes, ratchet, diary, architecture, emergence

### 2.2 NarrativeEngine (Returns Legacy Type)

**Location:** `hooks/useNarrativeEngine.ts` → `getJourney()`

```typescript
const getJourney = useCallback((journeyId: string) => {
  return schema?.journeys?.[journeyId] ?? null;
}, [schema]);
```

**Returns:** Legacy Journey from narratives-schema.ts (NO waypoints)

---

## 3. XState Machine Requirements

**Location:** `src/core/engagement/machine.ts`

```typescript
startJourney: assign(({ event }) => {
  if (event.type === 'START_JOURNEY') {
    return {
      journey: event.journey,
      journeyProgress: 0,
      journeyTotal: event.journey.waypoints.length,  // ← CRASHES if no waypoints
    };
  }
  return {};
}),
```

**Critical:** The machine REQUIRES `journey.waypoints.length`. Passing a legacy Journey causes:
```
Uncaught TypeError: Cannot read properties of undefined (reading 'length')
```

---

## 4. Usage Map (Files Calling Journey Lookups)

| File | Function | Current Lookup | Problem |
|------|----------|----------------|---------|
| `components/Terminal.tsx:280` | onJourneyStart | `getJourneyById()` | ✅ Correct |
| `components/Terminal.tsx:1099` | TerminalWelcome1 | `getJourneyById()` | ✅ Correct |
| `components/Terminal.tsx:1183` | Pill buttons | `getJourneyById()` | ✅ Correct |
| `components/Terminal.tsx:1335` | TerminalWelcome2 | `getJourneyById()` | ✅ Correct |
| `components/Terminal.tsx:1420` | CognitiveBridge | `schema?.journeys?.[id]` | ❌ LEGACY |
| `components/Terminal.tsx:1628` | Journey suggestions | `getJourneyById() \|\| getJourney()` | ⚠️ FALLBACK |
| `src/explore/JourneyList.tsx:178` | handleStart | `getJourneyById()` | ✅ Fixed |
| `src/explore/JourneyList.tsx:161` | local getJourney | schema journeys | ❌ LEGACY (display only) |

---

## 5. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        JOURNEY DATA SOURCES                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  src/data/journeys/index.ts          data/narratives-schema.ts     │
│  ┌─────────────────────────┐         ┌─────────────────────────┐   │
│  │ TypeScript Registry     │         │ NarrativeEngine Schema  │   │
│  │ - 6 journeys            │         │ - Dynamic from API      │   │
│  │ - HAS waypoints[]       │         │ - NO waypoints          │   │
│  │ - Compile-time          │         │ - Runtime               │   │
│  └───────────┬─────────────┘         └───────────┬─────────────┘   │
│              │                                   │                  │
│              ▼                                   ▼                  │
│  ┌─────────────────────────┐         ┌─────────────────────────┐   │
│  │ getJourneyById(id)      │         │ getJourney(id)          │   │
│  │ Returns: Journey        │         │ Returns: LegacyJourney  │   │
│  │ (with waypoints)        │         │ (with entryNode)        │   │
│  └───────────┬─────────────┘         └───────────┬─────────────┘   │
│              │                                   │                  │
└──────────────┼───────────────────────────────────┼──────────────────┘
               │                                   │
               ▼                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         CONSUMERS                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  XState Machine                    UI Display                       │
│  ┌─────────────────────────┐      ┌─────────────────────────┐      │
│  │ engStartJourney()       │      │ JourneyList, Cards      │      │
│  │ REQUIRES: waypoints[]   │      │ Uses: title, desc, etc  │      │
│  │ CRASHES without it      │      │ Doesn't need waypoints  │      │
│  └─────────────────────────┘      └─────────────────────────┘      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. Technical Debt Identified

| ID | Debt | Severity | Location |
|----|------|----------|----------|
| TD-1 | Two incompatible Journey types | HIGH | schema files |
| TD-2 | No adapter between types | HIGH | missing |
| TD-3 | Mixed lookup patterns in Terminal.tsx | MEDIUM | 6 locations |
| TD-4 | CognitiveBridge uses legacy schema | HIGH | line 1420 |
| TD-5 | No integration tests for journey clicks | HIGH | missing |
| TD-6 | Legacy type not marked @deprecated | LOW | narratives-schema.ts |

---

## 7. Key Files for This Sprint

| File | Action | Reason |
|------|--------|--------|
| `src/core/schema/journey.ts` | CANONICAL | XState source of truth |
| `data/narratives-schema.ts` | DEPRECATE | Mark Journey as legacy |
| `src/data/journeys/index.ts` | KEEP | TypeScript registry |
| `src/core/engagement/hooks/useJourneyState.ts` | KEEP | Already uses canonical |
| `components/Terminal.tsx` | FIX | Remove legacy lookups |
| `src/explore/JourneyList.tsx` | FIX | Use canonical for display |
| `hooks/useNarrativeEngine.ts` | ADAPT | Return canonical type |

---

## 8. Recommendations

1. **Establish single source of truth:** `src/core/schema/journey.ts` is canonical
2. **Create adapter:** Convert legacy → canonical at API boundary
3. **Deprecate legacy type:** Add JSDoc `@deprecated` with migration path
4. **Unify lookups:** Single `getJourney()` that always returns canonical
5. **Add tests:** Integration test for journey click → XState state change
6. **Document:** ADR explaining the unification decision

---

*Audit complete. Proceed to SPEC.md*
