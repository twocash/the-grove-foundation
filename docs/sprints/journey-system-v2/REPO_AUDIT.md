# REPO_AUDIT.md: Journey System v2
**Sprint**: journey-system-v2  
**Generated**: 2024-12-27  
**Auditor**: Claude (Foundation Loop v2)

---

## Executive Summary

**Critical Finding**: The journey system has TWO INCOMPATIBLE type definitions that prevent journey pills from functioning. The `stage-prompts.ts` references journeyIds that don't exist in the runtime registry, and the engagement machine expects a different journey structure than what's defined in the schema.

**Severity**: P0 - Core feature completely broken  
**Root Cause**: Architectural fragmentation during sprint evolution  
**Estimated Fix**: 2-3 hours focused work

---

## 1. Problem Statement (Revised from INDEX.md)

INDEX.md identified three problems. After codebase audit, here's the revised assessment:

| Problem | INDEX.md Description | Actual Finding |
|---------|---------------------|----------------|
| P0 CRASH | WaveformCollapse TypeError | **NOT CONFIRMED** - WaveformCollapse.tsx has no obvious array access bugs. May be intermittent or already fixed. |
| P1 BROKEN | Journey pills don't fire | **CONFIRMED + ROOT CAUSE FOUND** - Type mismatch and missing journey definitions |
| P2 PERF | 30+ re-renders | **PARTIALLY CONFIRMED** - useSuggestedPrompts has refreshKey, but EngagementBus has optimization |

---

## 2. Journey System Architecture (Current State)

### 2.1 Two Incompatible Type Systems

**Schema Types** (`src/core/schema/journey.ts`):
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
  waypoints: JourneyWaypoint[];  // <-- Uses "waypoints"
  completionMessage: string;
  // ...
}
```

**Engagement Types** (`src/core/engagement/types.ts`):
```typescript
interface JourneyStep {
  id: string;
  title: string;
  content: string;  // <-- Different property name
}

interface Journey {
  id: string;
  name: string;  // <-- "name" not "title"
  hubId: string;
  steps: JourneyStep[];  // <-- Uses "steps" not "waypoints"
}
```

**Impact**: `useJourneyState.ts` line 56 accesses `journey.steps[journeyProgress]` but schema journeys have `waypoints`. The engagement machine's `START_JOURNEY` event expects the engagement `Journey` type.

### 2.2 Journey Registry Mismatch

**stage-prompts.ts references these journeyIds**:
- `simulation`, `stakes`, `ratchet`, `diary`, `architecture`, `emergence`

**src/data/journeys/index.ts exports**:
- Only `groveFundamentalsJourney` with id: `grove-fundamentals`

**data/exploration/journeys.json has**:
- `simulation`, `stakes`, `ratchet`, `diary`, `architecture`, `emergence`

**Problem**: The TypeScript registry (`getJourneyById()`) doesn't include the JSON journeys!

### 2.3 Data Flow Analysis

```
User clicks journey pill
    ↓
TerminalWelcome.handlePromptClick({ journeyId: 'simulation' })
    ↓
Terminal.onPromptClick (line 1090-1099):
    ↓
    if (journeyId) {
      const journey = getJourneyById(journeyId);  // Returns UNDEFINED
      if (journey) {
        emit.journeyStarted(journeyId, journey.waypoints.length);
        // BUG #1: engStartJourney(journey) is NEVER called!
      }
    }
    ↓
getJourneyById('simulation') → returns UNDEFINED
    ↓
The entire if(journey) block is SKIPPED
    ↓
No event fires, no state changes
```

**Two bugs in the handler**:
1. `getJourneyById()` returns undefined (registry missing journeys)
2. Even if it returned a journey, `engStartJourney()` is never called (only `emit.journeyStarted()` which is EngagementBus, not XState)

---

## 3. File Inventory

### 3.1 Journey Definition Files

| File | Purpose | Status |
|------|---------|--------|
| `src/core/schema/journey.ts` | Schema types (waypoints) | ✅ Clean |
| `src/core/engagement/types.ts` | Engagement types (steps) | ⚠️ Incompatible with schema |
| `src/data/journeys/grove-fundamentals.ts` | Single journey definition | ⚠️ Uses schema types |
| `src/data/journeys/index.ts` | Journey registry | ❌ Missing 6 journeys |
| `data/exploration/journeys.json` | JSON journey definitions | ✅ Has all 6 journeys |
| `data/exploration/nodes.json` | Journey node content | ✅ Complete |

### 3.2 State Management Files

| File | Purpose | Status |
|------|---------|--------|
| `src/core/engagement/machine.ts` | XState parallel machine | ✅ Clean |
| `src/core/engagement/hooks/useJourneyState.ts` | Journey state hook | ⚠️ Expects engagement types |
| `hooks/useEngagementBus.ts` | Event-driven state | ✅ Clean |
| `hooks/useEngagementBridge.ts` | Legacy compatibility | ✅ Clean |

### 3.3 UI Files

| File | Purpose | Status |
|------|---------|--------|
| `components/Terminal.tsx` | Main terminal (1753 lines) | ⚠️ Has the broken handler |
| `components/Terminal/TerminalWelcome.tsx` | Welcome card | ✅ Clean |
| `hooks/useSuggestedPrompts.ts` | Stage-aware prompts | ⚠️ References missing journeys |
| `src/data/prompts/stage-prompts.ts` | Prompt definitions | ⚠️ journeyIds don't exist |

---

## 4. Pattern Compliance Check

Per PROJECT_PATTERNS.md requirements:

| Pattern | Status | Finding |
|---------|--------|---------|
| Declarative Sovereignty | ❌ VIOLATED | Journey suggestions hardcoded in TypeScript |
| State Management (XState) | ✅ Compliant | Engagement machine is properly XState |
| Canonical Source Rendering | ❌ VIOLATED | Two journey type systems |
| No Parallel Systems | ❌ VIOLATED | JSON journeys vs TS journeys |

---

## 5. Root Cause Analysis

### Primary Issue: Type System Fragmentation

The codebase evolved through multiple sprints without reconciling journey types:

1. **Sprint: adaptive-engagement-v1** created `src/core/schema/journey.ts` with `waypoints`
2. **Sprint: engagement-consolidation-v1** created `src/core/engagement/types.ts` with `steps`
3. **Sprint: terminal-quantum-welcome-v1** referenced journeyIds from JSON
4. **No sprint** connected the JSON journeys to the TypeScript registry

### Secondary Issue: Incomplete Registry

`src/data/journeys/index.ts` only exports one journey. It should either:
- Load journeys from JSON dynamically
- Export all journey definitions statically
- Bridge to the JSON system via API

---

## 6. Recommended Fix Strategy

### Option A: Unify Types (Recommended)

1. Pick ONE journey type (recommend schema version with `waypoints`)
2. Update engagement machine to use schema types
3. Update `useJourneyState.ts` to access `journey.waypoints`
4. Load journeys from JSON or sync TS definitions

**Pros**: Clean architecture, honors DEX
**Cons**: Requires touching engagement machine

### Option B: Bridge Layer

1. Create adapter that converts JSON journeys → engagement types
2. Update `getJourneyById` to load from JSON
3. Map `waypoints` → `steps` at runtime

**Pros**: Minimal changes to engagement machine
**Cons**: Adds complexity, doesn't fix root cause

### Option C: Sync Definitions (Quick Fix)

1. Add all 6 journeys to `src/data/journeys/index.ts`
2. Use engagement types (steps, not waypoints)
3. Accept type divergence for now

**Pros**: Fastest to implement
**Cons**: Duplicates data, doesn't fix architecture

---

## 7. Technical Debt Register Update

| ID | Issue | Priority | Sprint to Fix |
|----|-------|----------|---------------|
| TD-001 | Journey suggestions hardcoded | P2 | journey-system-v2 |
| TD-002 | Two incompatible Journey types | P1 | journey-system-v2 |
| TD-003 | JSON journeys not in TS registry | P0 | journey-system-v2 |
| TD-004 | WaveformCollapse defensive checks | P3 | (if issue recurs) |

---

## 8. Files to Modify (Minimal Fix Path)

### Phase 1: Fix Registry (P0)
```
src/data/journeys/index.ts  // Add all 6 journeys or load from JSON
```

### Phase 2: Fix Type Bridge (P1)
```
src/core/engagement/types.ts  // Align with schema or create adapter
src/core/engagement/hooks/useJourneyState.ts  // Update property access
```

### Phase 3: Fix Click Handler (P1)
```
components/Terminal.tsx  // Ensure engStartJourney() called with valid journey
```

### Phase 4: Declarative Migration (P2)
```
src/data/prompts/stage-prompts.ts  // Move to JSON
```

---

## 9. Verification Checklist

After fix, verify:
- [ ] Clicking "🗺️ The Ghost in the Machine" logs `[JOURNEY_STARTED]`
- [ ] XState transitions to `session.journeyActive`
- [ ] Journey progress UI appears
- [ ] Journey completion works
- [ ] All 6 journey pills function

---

## 10. Questions for Jim

1. **Type preference**: Should we keep `waypoints` (schema) or `steps` (engagement) going forward?
2. **Data source**: Should journeys load from JSON at runtime or be compiled into TS?
3. **WaveformCollapse crash**: Can you reproduce? May need console logs to capture.
4. **Scope**: Should this sprint also fix the re-render issue or focus purely on journeys?
