# Sprint 14: Cognitive Bridge & Dynamic Journey System

> Transforming the Terminal from reactive chatbot to proactive "Simulator"

## Overview

Sprint 14 implements the **Cognitive Bridge** - an entropy-based detection system that identifies when users are in complex conversations and offers to transition them from "freestyle" chat mode to structured journey paths. This demonstrates the Grove's "Hybrid Cognition" thesis: Local (Cold Start/Routine) → Bridge (Entropy Trigger) → Cloud (Dynamic Journey Injection).

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          USER CONVERSATION                                   │
│                                                                              │
│   "Tell me about the ratchet effect and how local hardware catches up"      │
│                                    │                                         │
└────────────────────────────────────┼─────────────────────────────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       ENTROPY DETECTOR                                       │
│                  src/core/engine/entropyDetector.ts                          │
│                                                                              │
│   Scoring:                                                                   │
│   ┌─────────────────────────────────────────────────────────┐               │
│   │ +30  Exchange depth (≥3 exchanges)                      │               │
│   │ +15  Technical vocabulary match (TopicHub tags, max 3)  │               │
│   │ +20  Depth markers ("how does", "why", "mechanism")     │               │
│   │ +25  Reference chaining ("you mentioned", "earlier")    │               │
│   └─────────────────────────────────────────────────────────┘               │
│                                                                              │
│   Thresholds:                                                                │
│   • LOW: < 30      → Stay in freestyle                                       │
│   • MEDIUM: 30-59  → Monitor                                                 │
│   • HIGH: ≥ 60     → Trigger Cognitive Bridge                                │
│                                                                              │
│   Limits:                                                                    │
│   • Max 2 injections per session                                             │
│   • 5-exchange cooldown after dismiss                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼ score ≥ 60
┌─────────────────────────────────────────────────────────────────────────────┐
│                       TOPIC CLUSTER DETECTION                                │
│                                                                              │
│   TOPIC_CLUSTERS = {                                                         │
│     'ratchet':    ['doubling', 'lag', '21 months', 'frontier', ...]         │
│     'economics':  ['efficiency tax', 'credits', 'enlightenment', ...]       │
│     'architecture': ['hybrid', 'split', 'local model', 'cloud', ...]        │
│     'knowledge-commons': ['publishing', 'attribution', 'commons', ...]      │
│     'observer':   ['terminal', 'cosmology', 'diary', 'simulation', ...]     │
│   }                                                                          │
│                                                                              │
│   Dominant cluster = highest term frequency in conversation                  │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼ cluster: 'architecture'
┌─────────────────────────────────────────────────────────────────────────────┐
│                       COGNITIVE BRIDGE UI                                    │
│                  components/Terminal/CognitiveBridge.tsx                     │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────┐       │
│   │  ● Resolving connection...  (0.8s loading animation)            │       │
│   │                                                                  │       │
│   │  This connects to the **Hybrid Architecture** sequence.         │       │
│   │  To fully map this dependency, I can switch to structured path. │       │
│   │                                                                  │       │
│   │  ┌──────────────────────────────────────────────────────────┐   │       │
│   │  │  Hybrid Architecture                                      │   │       │
│   │  │  5 nodes • ~8 min                                         │   │       │
│   │  │  Covers: Cognitive split, Local vs Cloud, Routing logic   │   │       │
│   │  └──────────────────────────────────────────────────────────┘   │       │
│   │                                                                  │       │
│   │  [ START JOURNEY ]  [ CONTINUE FREESTYLE ]                       │       │
│   └─────────────────────────────────────────────────────────────────┘       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼ User clicks "Start Journey"
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CLUSTER → PERSONA MAPPING                              │
│                                                                              │
│   clusterToPersona = {                                                       │
│     'ratchet':          'engineer'         // Technical AI concepts          │
│     'economics':        'family-office'    // Financial focus                │
│     'architecture':     'engineer'         // Technical architecture         │
│     'knowledge-commons': 'academic'        // Research focus                 │
│     'observer':         'concerned-citizen' // Meta/philosophical            │
│   }                                                                          │
│                                                                              │
│   selectLens('engineer') → Thread auto-generates via useEffect               │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       THREAD GENERATION                                      │
│                      utils/threadGenerator.ts                                │
│                                                                              │
│   generateThread(personaId, schema, archetypeId?)                            │
│                                                                              │
│   1. Get persona from schema (or create default for custom lenses)           │
│   2. Filter cards by persona visibility or 'all'                             │
│   3. Score cards by arcEmphasis alignment                                    │
│   4. Order by narrative arc (hook→stakes→mechanics→evidence→resolution)      │
│   5. Return thread of card IDs                                               │
│                                                                              │
│   Custom Lens Support:                                                       │
│   • If personaId starts with 'custom-', use cards marked 'all'               │
│   • Creates default persona config with balanced arcEmphasis                 │
│   • Generates 5-card thread using entry points + highest-scored cards        │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       JOURNEY CARD UI                                        │
│                   components/Terminal/JourneyCard.tsx                        │
│                                                                              │
│   Shows current position in thread with dynamic card label from schema       │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────┐       │
│   │  CONTINUE YOUR JOURNEY                              2/5 cards   │       │
│   │  ─────────────────────────────────────────────────────────────  │       │
│   │  Engineer Journey                              [ Ask the Grove ] │       │
│   │  "What are the dangers of AI concentration?"                     │       │
│   │                                                                  │       │
│   │  ████████████░░░░░░░░░░░░░░░  40%                               │       │
│   │  3 cards remaining                                               │       │
│   └─────────────────────────────────────────────────────────────────┘       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Key Files

### Core Engine

| File | Purpose |
|------|---------|
| `src/core/engine/entropyDetector.ts` | Entropy scoring, topic clusters, state management |
| `src/core/engine/topicRouter.ts` | Topic hub routing, query-to-hub matching |
| `utils/threadGenerator.ts` | Thread generation with custom lens support |

### Components

| File | Purpose |
|------|---------|
| `components/Terminal/CognitiveBridge.tsx` | Inline injection UI with loading animation |
| `components/Terminal/JourneyCard.tsx` | Dynamic journey progress display |
| `components/Terminal.tsx` | Main terminal with bridge integration |

### Hooks

| File | Purpose |
|------|---------|
| `hooks/useNarrativeEngine.ts` | Entropy state, evaluation methods, journey management |

## State Flow

```typescript
// Entropy State (persisted to localStorage)
interface EntropyState {
  lastScore: number;
  lastClassification: 'low' | 'medium' | 'high';
  injectionCount: number;           // Max 2 per session
  cooldownRemaining: number;        // Exchanges until next injection allowed
  lastInjectionExchange: number;    // When last injection occurred
}

// Bridge State (Terminal component)
interface BridgeState {
  visible: boolean;
  journeyId: string | null;         // e.g., 'journey-architecture'
  topicMatch: string | null;        // e.g., 'architecture'
  afterMessageId: string | null;    // Show bridge after this message
}
```

## Console Debug Output

```
[Entropy Debug] Preconditions: {activeLens: null, threadLength: 0, messageCount: 5, ...}
[Entropy] {originalScore: 45, adjustedScore: 75, classification: 'high', cluster: 'architecture', ...}
[Entropy] shouldInject: true hasDominantCluster: true
[Entropy] Journey mapping: {cluster: 'architecture', journeyId: 'journey-architecture'}
[Entropy] Bridge ACTIVATED

[Thread State] {activeLens: 'engineer', threadLength: 5, position: 0, firstCard: 'What are the dangers...'}
```

## UX Decisions

### 1. Initial Load - No Suggested Inquiry
On initial load with no messages, don't show "Suggested Inquiry". Only show after user has engaged at least once.

```typescript
) : dynamicSuggestion && terminalState.messages.length > 0 ? (
  /* Only shown after user has sent at least one message */
```

### 2. Two Navigation Systems
The Terminal supports two navigation paradigms:

1. **Thread-based (JourneyCard)** - Linear progression through generated thread
2. **Graph-based (Continue the Journey)** - Follow card's `next[]` connections

Graph navigation takes precedence when `nextNodes.length > 0`.

### 3. Custom Lens Thread Generation
Custom lenses (starting with `custom-`) generate threads using:
- All cards marked with `personas: ['all']`
- Default balanced arcEmphasis
- Standard 5-card thread length

## Analytics Events

```typescript
trackCognitiveBridgeShown(clusterId, entropyScore);
trackCognitiveBridgeAccepted(clusterId, targetPersona);
trackCognitiveBridgeDismissed(clusterId, entropyScore);
trackEntropyHighDetected(score, cluster);
```

## Testing Checklist

- [ ] Open Terminal in incognito - no "Suggested Inquiry" on initial load
- [ ] Send 3+ messages about technical topics → Bridge should appear
- [ ] Accept bridge → Persona selected, JourneyCard appears with dynamic content
- [ ] Dismiss bridge → 5-exchange cooldown before next offer
- [ ] Custom lens → Thread generates with 'all' cards
- [ ] Graph navigation → "Continue the Journey" shows card's `next[]` options

## Related Documentation

- `docs/ENGAGEMENT_BUS_INTEGRATION.md` - Event bus architecture
- `docs/DEBUGGING.md` - Full debugging guide
- `CLAUDE.md` - Project overview and architecture
