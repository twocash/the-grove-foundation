# REPO_AUDIT.md
# Sprint: journey-content-dex-v1
# Date: 2024-12-28

## Problem Statement

Journey pills can be clicked, XState receives events correctly, but **no journey content renders**. The gap: Terminal.tsx never checks `isJourneyActive` to render waypoint content.

## Current State Analysis

### Journey State Flow (Working ✅)

```
User clicks pill → getCanonicalJourney() → engStartJourney() → XState updated
                                                                    │
                                                                    ▼
                                              isJourneyActive = true ✅
                                              currentWaypoint = {...} ✅
                                              journeyProgress = 0 ✅
```

### UI Render Flow (Broken ❌)

```
Terminal.tsx render()
         │
         ├── checks nextNodes.length > 0 → renders SuggestionChips
         ├── checks currentThread.length > 0 → renders OLD JourneyCard
         ├── checks stagePrompts.length > 0 → renders suggested prompts
         │
         └── NEVER checks isJourneyActive → nothing renders for new journeys
```

### Relevant Files

| File | Purpose | Lines |
|------|---------|-------|
| `src/core/schema/journey.ts` | Journey type definition | 43 |
| `src/core/engagement/hooks/useJourneyState.ts` | XState journey hook | 115 |
| `components/Terminal.tsx` | Main render logic | 1784 |
| `components/Terminal/JourneyCard.tsx` | OLD Card-based journey UI | 56 |
| `src/data/journeys/*.ts` | Journey definitions | varies |

### Schema: Journey Type (Current)

```typescript
// src/core/schema/journey.ts
interface JourneyWaypoint {
  id: string;
  title: string;
  prompt: string;
  hub?: string;
  successCriteria?: { minExchanges?: number; topicsMentioned?: string[] };
  entryPatterns?: string[];
}

interface Journey {
  id: string;
  title: string;
  description: string;
  estimatedTime?: string;
  lensAffinity?: string[];
  lensExclude?: string[];
  waypoints: JourneyWaypoint[];
  completionMessage: string;
  nextJourneys?: string[];
  allowImplicitEntry?: boolean;
  ambientTracking?: boolean;
}
```

**Missing for DEX compliance:**
- No `display` configuration
- No declarative action definitions
- Presentation logic must be hardcoded in React

### useJourneyState Hook Output

```typescript
interface UseJourneyStateReturn {
  journey: Journey | null;
  journeyProgress: number;
  journeyTotal: number;
  isActive: boolean;
  isComplete: boolean;
  currentWaypoint: JourneyWaypoint | null;
  progressPercent: number;
  startJourney: (journey: Journey) => void;
  advanceStep: () => void;
  completeJourney: () => void;
  exitJourney: () => void;
  isJourneyCompleted: (journeyId: string) => boolean;
  completedJourneys: string[];
}
```

All the data we need is available. The gap is purely in the render layer.

### Terminal.tsx Journey-Related Code

**Line 167-173: State extraction**
```typescript
const {
  journey: engJourney,
  isActive: isJourneyActive,
  startJourney: engStartJourney,
  advanceStep,
  exitJourney: engExitJourney
} = useJourneyState({ actor });
```

**Line 1588-1606: OLD JourneyCard render (Card-based, not Waypoint-based)**
```typescript
) : currentThread.length > 0 && currentPosition < currentThread.length ? (
  <JourneyCard
    currentPosition={currentPosition}
    totalCards={currentThread.length}
    currentCard={getThreadCard(currentPosition)}
    onResume={() => { ... }}
  />
```

This uses `currentThread` (Card[]) from NarrativeEngine, NOT `engJourney.waypoints[]` from XState.

## Technical Debt Identified

| ID | Issue | Severity | DEX Violation |
|----|-------|----------|---------------|
| TD-JRN-001 | No render path for XState journeys | HIGH | N/A (bug) |
| TD-JRN-002 | JourneyCard uses old Card type | MEDIUM | Type mismatch |
| TD-JRN-003 | No declarative display config | HIGH | Pillar I |
| TD-JRN-004 | Action labels hardcoded | MEDIUM | Pillar I |
| TD-JRN-005 | No provenance on waypoint actions | MEDIUM | Pillar III |

## Trellis Compliance Requirements

### Pillar I: Declarative Sovereignty

> "Can a non-technical person alter behavior by editing a schema file?"

**Required:** Journey display configuration in schema, not JSX.

### Pillar II: Capability Agnosticism

> "Does the system break if the model hallucinates?"

**Current:** XState provides rigid frame ✅. UI must render what XState says.

### Pillar III: Provenance as Infrastructure

> "Every Sprout must maintain attribution chain."

**Required:** Waypoint interactions must capture provenance.

### Pillar IV: Organic Scalability

> "Support serendipitous connection, guided wandering."

**Required:** Journey actions can branch, not just linear advance.

## Dependencies

- `journey-schema-unification-v1` (complete ✅)
- `HOTFIX_JOURNEY_SCREENSHOTS` (complete ✅)
- XState engagement machine (working ✅)

## Scope Boundaries

**In Scope:**
- New JourneyContent component
- Schema extension for display config
- DEX-compliant action rendering
- Provenance capture on actions

**Out of Scope:**
- Deprecating old JourneyCard (separate sprint)
- Branching journey paths (future enhancement)
- Visual design polish (can iterate)
