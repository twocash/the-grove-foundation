# Repo Audit (Phase 2: Cognitive Simulator)

> **Last Updated:** 2025-12-19
> **Scope:** Terminal, Narrative Engine, Entropy Router, Cognitive Bridge

## Framework & Runtime
- **Core:** React 18 + Vite + TypeScript.
- **State:** `useNarrativeEngine` hook manages session state (`activeJourneyId`, `currentNodeId`, `visitedNodes`, `entropyState`) synced to `localStorage`.
- **Routing:** Client-side state toggles (`admin=true` query param) and `Terminal` component internal state (Freestyle vs. Journey mode).

## Key Artifacts

### Narrative Engine
- **Location:** `hooks/useNarrativeEngine.ts` (~604 lines)
- **Role:** Central nervous system for Terminal state. Handles message history, lens switching, journey navigation, and entropy evaluation.
- **Key Methods:**
  - Journey: `startJourney()`, `advanceNode()`, `exitJourney()`, `getJourney()`, `getNode()`
  - Entropy: `evaluateEntropy()`, `checkShouldInject()`, `recordEntropyInjection()`, `recordEntropyDismiss()`

### Entropy Router
- **Location:** `src/core/engine/entropyDetector.ts` (~307 lines)
- **Role:** Scores conversation complexity and determines when to offer structured journeys.
- **Scoring:**
  - +30: Exchange count ≥3
  - +15: Each TopicHub tag match (capped at 3)
  - +20: Depth markers (e.g., "why exactly", "mechanism")
  - +25: Reference chaining (e.g., "you mentioned earlier")
- **Thresholds:** LOW (<30), MEDIUM (30-59), HIGH (≥60)
- **Cluster Mapping:** Routes to `ratchet`, `stakes`, or `simulation` journeys

### Cognitive Bridge
- **Location:** `components/Terminal/CognitiveBridge.tsx` (~142 lines)
- **Role:** Inline injection component that appears in chat flow when entropy triggers.
- **Behavior:**
  - 800ms "Resolving connection..." animation (simulates cloud latency metaphor)
  - Shows journey preview card with title, node count, estimated time
  - Accept → starts journey; Dismiss → triggers 5-exchange cooldown

### Terminal UI
- **Location:** `components/Terminal.tsx` (~1236 lines)
- **Role:** Monolithic view layer. Renders chat stream, handles user input, conditionally renders CognitiveBridge.
- **Bridge Integration:** Lines ~943-1000 handle bridge state and injection logic.

### Topic Router
- **Location:** `src/core/engine/topicRouter.ts`
- **Role:** Keyword matching for hub routing. Entropy detector extends this with cluster scoring.

### Data Schema
- **Location:** `data/narratives-schema.ts`
- **Structures:** `TopicHub` (tags for entropy matching), `Journey` (entry nodes, linked hubs), `JourneyNode` (query, context, navigation)

## Current Integration Status

| Component | Status | Notes |
|-----------|--------|-------|
| Entropy Detector | ✅ COMPLETE | Scoring, thresholds, cluster mapping implemented |
| Cognitive Bridge UI | ✅ COMPLETE | Animation, card, accept/dismiss handlers |
| Terminal Integration | ✅ COMPLETE | Bridge renders inline when `shouldInject()` returns true |
| State Persistence | ✅ COMPLETE | `localStorage` keys: `grove-terminal-session`, `grove-terminal-entropy` |
| Journey Mapping | ✅ COMPLETE | Clusters map to V2.1 journey IDs |

## Tripwires & Hazards

1. **Terminal Monolith:** `Terminal.tsx` is large (~1.2k lines). Any logic injection must be minimally invasive (hook-based) to avoid regression.

2. **State Sync:** `useNarrativeEngine` persists multiple state objects. Schema changes to `localStorage` require backward-compatible defaults to prevent hydration errors.

3. **Cluster-Journey Mismatch:** `CLUSTER_JOURNEY_MAP` in entropyDetector.ts must stay aligned with actual journey IDs in `narratives.json`. Currently maps:
   - `ratchet` → `ratchet` journey
   - `economics` → `stakes` journey
   - `architecture` → `stakes` journey
   - `knowledge-commons` → `stakes` journey
   - `observer` → `simulation` journey

4. **Cooldown Logic:** 5-exchange cooldown after dismiss, max 2 injections per session. Verify cooldown decrements on each exchange regardless of entropy score.

5. **Default Journey Info:** `CognitiveBridge.tsx` has `DEFAULT_JOURNEY_INFO` hardcoded. Must stay synced with actual journey metadata in schema.

## Phase 2 Enhancements (Planned)

1. **Analytics Instrumentation:** Add funnel events for Bridge Shown, Bridge Accepted, Bridge Dismissed.

2. **Threshold Tuning:** Current MEDIUM threshold (30) may be too low. Evaluate based on actual user behavior.

3. **Dynamic Journey Info:** Pull journey metadata from schema instead of hardcoded defaults.

4. **Additional Clusters:** Expand `TOPIC_CLUSTERS` vocabulary based on hub coverage gaps.

## File Reference

```
grove-terminal/
├── src/core/engine/
│   ├── entropyDetector.ts      # Entropy scoring & classification
│   ├── topicRouter.ts          # Keyword matching for hubs
│   └── index.ts                # Core engine exports
├── hooks/
│   └── useNarrativeEngine.ts   # Central state management
├── components/Terminal/
│   ├── Terminal.tsx            # Main terminal view (bridge injection point ~L943)
│   ├── CognitiveBridge.tsx     # Bridge UI component
│   ├── JourneyNav.tsx          # Active journey navigation
│   └── JourneyCompletion.tsx   # Journey end state
└── data/
    ├── narratives-schema.ts    # Type definitions
    └── narratives.json         # Journey/node/hub data (GCS-synced)
```
