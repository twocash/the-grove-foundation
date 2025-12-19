# ARCHITECTURE: Cognitive Simulation Engine

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TERMINAL (Container)                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     ┌────────────────────────────────────────────────┐    │
│  │  User Input  │────►│              useNarrativeEngine                │    │
│  └──────────────┘     │  ┌────────────────────────────────────────┐   │    │
│                       │  │         Entropy Evaluation              │   │    │
│                       │  │  • calculateEntropy(msg, history)       │   │    │
│                       │  │  • shouldInject(entropy, state)         │   │    │
│                       │  │  • getJourneyForCluster(cluster)        │   │    │
│                       │  └────────────────────────────────────────┘   │    │
│                       │                                                │    │
│                       │  ┌────────────────────────────────────────┐   │    │
│                       │  │         Session State                   │   │    │
│                       │  │  • activeJourneyId                      │   │    │
│                       │  │  • currentNodeId                        │   │    │
│                       │  │  • visitedNodes[]                       │   │    │
│                       │  │  • entropyState                         │   │    │
│                       │  └───────────────┬────────────────────────┘   │    │
│                       └──────────────────┼────────────────────────────┘    │
│                                          │                                  │
│                                          ▼                                  │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                        Render Decision                                 │ │
│  │                                                                        │ │
│  │   shouldInject() ──► TRUE  ──► <CognitiveBridge />                    │ │
│  │         │                                                              │ │
│  │         └───────► FALSE ──► <ChatMessage /> (normal flow)             │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                          │                                  │
│                                          ▼                                  │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                     CognitiveBridge Component                          │ │
│  │  ┌─────────────────┐    ┌─────────────────────────────────────────┐  │ │
│  │  │  Loading State  │───►│           Journey Preview Card          │  │ │
│  │  │  (0.8s anim)    │    │  • Title, Node Count, Duration          │  │ │
│  │  └─────────────────┘    │  • Cover Topics                         │  │ │
│  │                         │  • [Start Journey] [Continue Freestyle] │  │ │
│  │                         └─────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                          │                                  │
│                    ┌─────────────────────┴─────────────────────┐           │
│                    ▼                                           ▼           │
│            onAccept()                                   onDismiss()        │
│                    │                                           │           │
│                    ▼                                           ▼           │
│         startJourney(journeyId)                    dismissEntropy()        │
│         handleSend(entryNode.query)                cooldownRemaining = 5   │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

1. **Ingest:** Terminal pushes the latest message to `useNarrativeEngine.evaluateEntropy()`

2. **Analyze:** `calculateEntropy()` in `entropyDetector.ts` scans for:
   - Exchange count threshold (≥3)
   - TopicHub tag matches (vocabulary)
   - Depth markers ("why exactly", "mechanism", etc.)
   - Reference phrases ("you mentioned earlier", etc.)

3. **Classify:** Score produces classification:
   - `< 30` → `low` (no injection)
   - `30-59` → `medium` (injection eligible)
   - `≥ 60` → `high` (strong injection candidate)

4. **Cluster:** `dominantCluster` identified from full conversation history

5. **Route:** `getJourneyForCluster()` maps cluster to journey ID:
   ```
   ratchet     → ratchet journey
   economics   → stakes journey
   architecture → stakes journey
   observer    → simulation journey
   ```

6. **Decide:** `shouldInject()` checks:
   - Classification is `medium` or `high`
   - `cooldownRemaining === 0`
   - `injectionCount < MAX_INJECTIONS_PER_SESSION`
   - `dominantCluster` exists

7. **Render:** If approved, Terminal renders `<CognitiveBridge />` after the model response

8. **Transition:** 
   - On Accept: `startJourney(journeyId)` activates journey mode
   - On Dismiss: `dismissEntropy()` sets 5-exchange cooldown

## Component Hierarchy

```
Terminal.tsx (Container - ~1236 lines)
├── ChatMessage.tsx (Standard chat bubbles)
├── CognitiveBridge.tsx (Injection component - ~142 lines)
│   ├── LoadingState (800ms "Resolving..." animation)
│   └── JourneyPreview (Card with metadata + action buttons)
├── JourneyNav.tsx (Active journey navigation)
├── JourneyCompletion.tsx (Journey end state)
└── LensPicker.tsx (Tone selection)
```

## State Management

### Session State (`grove-terminal-session`)
```typescript
interface TerminalSession {
  activeLens: string | null;
  scholarMode: boolean;
  
  // V2.1 Journey State
  activeJourneyId: string | null;
  currentNodeId: string | null;
  visitedNodes: string[];
  
  // Exchange tracking
  exchangeCount: number;
}
```

### Entropy State (`grove-terminal-entropy`)
```typescript
interface EntropyState {
  lastScore: number;
  lastClassification: 'low' | 'medium' | 'high';
  injectionCount: number;
  cooldownRemaining: number;
  lastInjectionExchange: number;
}
```

## Entropy Scoring Breakdown

| Signal | Points | Condition |
|--------|--------|-----------|
| Exchange Depth | +30 | `exchangeCount >= 3` |
| Technical Vocabulary | +15/match | TopicHub tag found (max 3 matches = +45) |
| Depth Markers | +20 | Contains "why exactly", "mechanism", etc. |
| Reference Chaining | +25 | Contains "you mentioned", "earlier", etc. |

**Maximum Possible Score:** 30 + 45 + 20 + 25 = **120**

**Classification Thresholds:**
- `low`: score < 30
- `medium`: 30 ≤ score < 60
- `high`: score ≥ 60

## Knowledge Commons Mapping

The Cognitive Bridge connects freestyle exploration to validated knowledge:

```
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   Freestyle Chat    │     │  Cognitive Bridge   │     │  Structured Journey │
│   (Local Cognition) │────►│  (Transition Point) │────►│  (Cloud Cognition)  │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
         │                           │                           │
         │                           │                           │
         ▼                           ▼                           ▼
┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│  Pattern matching   │     │  Entropy detection  │     │  Knowledge Commons  │
│  Quick retrieval    │     │  Cluster routing    │     │  L1-Hub validated   │
│  Surface answers    │     │  Journey mapping    │     │  Deep-dive paths    │
└─────────────────────┘     └─────────────────────┘     └─────────────────────┘
```

## Integration Points

| Component | Hook/Function | Purpose |
|-----------|---------------|---------|
| Terminal.tsx | `evaluateEntropy()` | Trigger entropy calculation |
| Terminal.tsx | `checkShouldInject()` | Determine if bridge should render |
| Terminal.tsx | `bridgeState` | Track current bridge context |
| useNarrativeEngine | `entropyState` | Persist entropy state |
| useNarrativeEngine | `startJourney()` | Transition to journey mode |
| entropyDetector.ts | `calculateEntropy()` | Core scoring logic |
| entropyDetector.ts | `shouldInject()` | Injection decision logic |
