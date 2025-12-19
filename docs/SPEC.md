# SPEC: The Cognitive Simulator (Phase 2)

> **Goal:** Enhance the Terminal from a reactive chatbot into a proactive simulator that detects conversation depth ("entropy") and offers structured deep-dives ("journeys").

## 1. Core Thesis

The UX mirrors Grove's **Hybrid Cognition** architecture:

1. **Local (Freestyle):** Fast, low-latency, surface-level answers. (Simulates local compute)
2. **Bridge (Entropy):** System detects complexity overload or specific technical depth.
3. **Cloud (Journey):** System "calls out" to a structured, high-context path. (Simulates cloud injection)

The Terminal makes this architecture *visible*. When the system detects conversation complexity ("entropy") reaching a threshold, it surfaces a Cognitive Bridge—a moment where the user sees the transition from local/freestyle to cloud/structured cognition happening.

## 2. Current Implementation Status

### 2.1 Entropy Detection ✅ IMPLEMENTED

- **Location:** `src/core/engine/entropyDetector.ts`
- **Trigger:** Analyzes every user message via `useNarrativeEngine.evaluateEntropy()`
- **Scoring Inputs:**
  - `exchangeCount` (≥3 exchanges = +30 pts)
  - `vocabulary` (Matches `TopicHub` tags = +15 pts/term, capped at 3)
  - `depthMarkers` (e.g., "why exactly", "mechanism" = +20 pts)
  - `chaining` (e.g., "you mentioned earlier" = +25 pts)
- **Thresholds:**
  - `Low (<30)`: Stay in Freestyle
  - `Medium (30-59)`: Monitor, eligible for injection
  - `High (≥60)`: Strong injection candidate
- **Cluster Detection:** Identifies dominant topic cluster from full conversation history

### 2.2 The Cognitive Bridge ✅ IMPLEMENTED

- **Location:** `components/Terminal/CognitiveBridge.tsx`
- **Behavior:**
  - Appears inline after the model's response when `shouldInject()` returns true
  - **Latency Sim:** Shows "Resolving connection..." with pulsing animation for 800ms
  - **Content:** Displays Journey Title, Node Count, Duration, and covered topics
  - **Actions:** [Start Journey] (Loads journey) vs. [Continue Freestyle] (Dismisses)
- **Cooldown:** 5 exchanges after dismissal. Max 2 injections per session.

### 2.3 Routing Strategy ✅ IMPLEMENTED

Maps dominant conversation topics to V2.1 Journey IDs:
- `ratchet` cluster → `ratchet` journey
- `economics` cluster → `stakes` journey
- `architecture` cluster → `stakes` journey
- `knowledge-commons` cluster → `stakes` journey
- `observer` cluster → `simulation` journey

## 3. Phase 2 Functional Requirements

### 3.1 Analytics Instrumentation (Sprint 6)

Add tracking events to measure cognitive bridge effectiveness:

| Event | Trigger | Data |
|-------|---------|------|
| `bridge_shown` | Bridge renders in chat | `journeyId`, `entropyScore`, `cluster` |
| `bridge_accepted` | User clicks "Start Journey" | `journeyId`, `timeToDecision` |
| `bridge_dismissed` | User clicks "Continue Freestyle" or Escape | `journeyId`, `timeToDecision` |
| `journey_started_from_bridge` | Journey begins after bridge accept | `journeyId`, `entryNodeId` |

### 3.2 Threshold Tuning (Sprint 6)

Current thresholds may need adjustment based on observed behavior:

```typescript
// Current (may need tuning)
ENTROPY_THRESHOLDS = {
  LOW: 30,      // Below this: stay in freestyle
  MEDIUM: 60,   // At or above: injection eligible
}

// Tunable constants (isolate in constants.ts)
ENTROPY_LIMITS = {
  MAX_INJECTIONS_PER_SESSION: 2,
  COOLDOWN_EXCHANGES: 5,
}
```

### 3.3 Dynamic Journey Metadata (Future)

Replace hardcoded `DEFAULT_JOURNEY_INFO` in CognitiveBridge.tsx with schema-driven metadata:

```typescript
// Current: Hardcoded in CognitiveBridge.tsx
const DEFAULT_JOURNEY_INFO: Record<string, JourneyInfo> = { ... }

// Target: Pull from schema
const journeyInfo = useMemo(() => {
  const journey = schema?.journeys?.[journeyId];
  return journey ? {
    id: journey.id,
    title: journey.title,
    nodeCount: journey.nodeIds?.length || 0,
    estimatedMinutes: journey.estimatedMinutes || 6,
    coverTopics: journey.coverTopics || []
  } : DEFAULT_JOURNEY_INFO[journeyId];
}, [schema, journeyId]);
```

## 4. Technical Constraints

- **No Refactors:** Do not rewrite `Terminal.tsx`. Inject the bridge via conditional rendering at existing injection point (~L943).
- **Persistence:** Entropy state (`score`, `cooldown`) persists across page refresh via `localStorage: grove-terminal-entropy`.
- **Type Safety:** Strict usage of `EntropyState`, `EntropyResult`, `JourneyInfo` interfaces.
- **Backward Compat:** Session schema changes must include defaults for existing sessions.

## 5. Success Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| Activation Rate | % of HIGH entropy conversations where bridge appears | Measure baseline |
| Acceptance Rate | % of shown bridges where user accepts | >30% |
| Completion Rate | % of accepted journeys completed (all nodes) | >50% |
| Return Rate | % of journey completers who return for another journey | Measure baseline |

## 6. Knowledge Commons Connection

Each Journey the Terminal offers corresponds to a validated knowledge cluster in Grove's architecture:

| Journey ID | Knowledge Domain | Commons Equivalent |
|------------|------------------|-------------------|
| `ratchet` | Capability propagation thesis | L1-Hub: The Ratchet |
| `stakes` | Credit economy and efficiency tax | L1-Hub: Economics |
| `simulation` | Agent cognition and Observer dynamic | L1-Hub: Simulation |

When we build new Journeys, we're performing the same operation that Grove communities will perform: validating knowledge, structuring it for consumption, and making it available for adoption.

## 7. Test Plan

### Unit/Logic
- Entropy scoring: Verify "why exactly" triggers +20 depth score
- Cooldown: Verify decrement on each exchange, reset on injection/dismiss
- Cluster detection: Verify dominant cluster identification from conversation history

### Integration/Manual
- `npm run dev` then type 3+ messages with technical vocabulary
- Verify Bridge appears with 800ms animation
- Verify "Start Journey" transitions to Journey mode
- Verify "Continue Freestyle" triggers 5-exchange cooldown
- Verify max 2 injections per session limit

### Analytics (Sprint 6)
- Verify events fire in console/analytics backend
- Verify funnel: `bridge_shown` → `bridge_accepted` → `journey_started_from_bridge`
