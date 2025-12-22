# ARCHITECTURE: Cognitive Simulation Engine

**Version:** 2.0 (Field-Aware)  
**Last Updated:** December 2024

## Overview

The Grove Terminal is the primary exploration interface for Field-scoped knowledge discovery. This document describes the cognitive simulation engine that powers dynamic content injection and journey management within a Field context.

**Key Principle:** All Terminal operations are scoped to a single Field. Field switching creates a new session (clean break).

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TERMINAL (Container)                               │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  FIELD CONTEXT: The Grove Foundation                                 │   │
│  │  fieldId: grove-foundation-001 | fieldSlug: grove-foundation         │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────┐     ┌────────────────────────────────────────────────┐   │
│  │  User Input  │────►│              useNarrativeEngine                │   │
│  └──────────────┘     │  ┌────────────────────────────────────────┐   │   │
│                       │  │         Entropy Evaluation              │   │   │
│                       │  │  • calculateEntropy(msg, history)       │   │   │
│                       │  │  • shouldInject(entropy, state)         │   │   │
│                       │  │  • getJourneyForCluster(cluster, field) │   │   │
│                       │  └────────────────────────────────────────┘   │   │
│                       │                                                │   │
│                       │  ┌────────────────────────────────────────┐   │   │
│                       │  │         Session State (Field-Scoped)   │   │   │
│                       │  │  • fieldId: string (REQUIRED)          │   │   │
│                       │  │  • activeJourneyId: string | null      │   │   │
│                       │  │  • currentNodeId: string | null        │   │   │
│                       │  │  • visitedNodes: string[]              │   │   │
│                       │  │  • entropyState                        │   │   │
│                       │  └───────────────┬────────────────────────┘   │   │
│                       └──────────────────┼────────────────────────────┘   │
│                                          │                                 │
│                                          ▼                                 │
│  ┌───────────────────────────────────────────────────────────────────────┐ │
│  │                        Render Decision                                 │ │
│  │                                                                        │ │
│  │   shouldInject() ──► TRUE  ──► <CognitiveBridge />                    │ │
│  │         │                       (Field-scoped Journey)                │ │
│  │         └───────► FALSE ──► <ChatMessage /> (normal flow)             │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

1. **Field Context:** Terminal initializes with `fieldId` from session or URL parameter

2. **Ingest:** Terminal pushes the latest message to `useNarrativeEngine.evaluateEntropy()`

3. **Analyze:** `calculateEntropy()` scans for engagement signals:
   - Exchange count threshold (≥3)
   - TopicHub tag matches (Field-specific vocabulary)
   - Depth markers ("why exactly", "mechanism", etc.)
   - Reference phrases ("you mentioned earlier", etc.)

4. **Classify:** Score produces classification:
   - `< 30` → `low` (no injection)
   - `30-59` → `medium` (injection eligible)
   - `≥ 60` → `high` (strong injection candidate)

5. **Cluster:** `dominantCluster` identified from conversation history

6. **Route:** `getJourneyForCluster(cluster, fieldId)` maps cluster to Field-scoped journey:
   ```
   Field: grove-foundation
   ├── ratchet cluster    → grove.ratchet-journey
   ├── economics cluster  → grove.stakes-journey
   ├── architecture       → grove.architecture-journey
   └── observer cluster   → grove.simulation-journey
   ```

7. **Decide:** `shouldInject()` checks:
   - Classification is `medium` or `high`
   - `cooldownRemaining === 0`
   - `injectionCount < MAX_INJECTIONS_PER_SESSION`
   - `dominantCluster` exists
   - Journey exists in current Field

8. **Render:** If approved, Terminal renders `<CognitiveBridge />` with Field-scoped Journey

9. **Transition:** 
   - On Accept: `startJourney(journeyId)` activates journey mode (same Field)
   - On Dismiss: `dismissEntropy()` sets 5-exchange cooldown

---

## Component Hierarchy

```
Terminal.tsx (Container)
├── FieldIndicator.tsx (Shows current Field)
├── ChatMessage.tsx (Standard chat bubbles)
├── CognitiveBridge.tsx (Injection component)
│   ├── LoadingState (800ms "Resolving..." animation)
│   └── JourneyPreview (Card with metadata + action buttons)
│       └── Journey namespace shown (e.g., "grove.architecture-deep-dive")
├── JourneyNav.tsx (Active journey navigation)
├── JourneyCompletion.tsx (Journey end state)
└── LensPicker.tsx (Field-scoped Lens selection)
    └── Only shows Lenses belonging to current Field
```

---

## State Management

### Session State (`grove-terminal-session`)

```typescript
interface TerminalSession {
  // ═══════════════════════════════════════════════════════════
  // FIELD CONTEXT (REQUIRED, IMMUTABLE PER SESSION)
  // ═══════════════════════════════════════════════════════════
  fieldId: string;
  fieldSlug: string;
  fieldName: string;
  
  // ═══════════════════════════════════════════════════════════
  // ACTIVE CONFIGURATION
  // ═══════════════════════════════════════════════════════════
  activeLensId: string | null;       // Namespaced: "grove.skeptic"
  activeLensNamespace: string | null;
  scholarMode: boolean;
  
  // Journey State
  activeJourneyId: string | null;    // Namespaced: "grove.architecture-deep-dive"
  activeJourneyNamespace: string | null;
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

---

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

---

## Knowledge Commons Integration

The Cognitive Bridge connects freestyle exploration to validated knowledge within the current Field:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        FIELD: The Grove Foundation                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐       │
│  │   Freestyle     │     │  Cognitive      │     │  Structured     │       │
│  │   Chat          │────►│  Bridge         │────►│  Journey        │       │
│  │                 │     │                 │     │                 │       │
│  │   Local RAG     │     │  Entropy        │     │  Field's        │       │
│  │   (grove docs)  │     │  Detection      │     │  Journeys       │       │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘       │
│         │                         │                       │                 │
│         ▼                         ▼                       ▼                 │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐       │
│  │  Pattern match  │     │  Cluster →      │     │  grove.* nodes  │       │
│  │  Quick retrieval│     │  Journey map    │     │  Validated paths│       │
│  │  Surface answers│     │  (Field-scoped) │     │  Deep-dive      │       │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘       │
│                                                                             │
│  Sprouts captured here → fieldId: "grove-foundation-001"                    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Field Switching Behavior

**Clean Break Model (MVP):**

When user switches Fields:
1. Current session is preserved (status: 'completed')
2. New session created with new `fieldId`
3. Conversation history starts fresh
4. Lens selection resets (new Field's Lenses)
5. Active Journey (if any) ends

```typescript
function switchField(newFieldId: string): void {
  // End current session
  updateSession({ status: 'completed' });
  
  // Create new session with new Field context
  createSession({
    fieldId: newFieldId,
    fieldSlug: getFieldSlug(newFieldId),
    fieldName: getFieldName(newFieldId),
    activeLensId: null,
    activeJourneyId: null,
    messages: [],
    exchangeCount: 0
  });
}
```

---

## Integration Points

| Component | Hook/Function | Purpose |
|-----------|---------------|---------|
| Terminal.tsx | `fieldId` prop | Field context for all operations |
| Terminal.tsx | `evaluateEntropy()` | Trigger entropy calculation |
| Terminal.tsx | `checkShouldInject()` | Determine if bridge should render |
| useNarrativeEngine | `fieldId` | Scope journey/lens lookups |
| useNarrativeEngine | `entropyState` | Persist entropy state |
| useNarrativeEngine | `startJourney()` | Transition to journey mode |
| entropyDetector.ts | `calculateEntropy()` | Core scoring logic |
| entropyDetector.ts | `shouldInject()` | Injection decision logic |
| LensPicker.tsx | `fieldId` | Filter to Field's Lenses |
| JourneyNav.tsx | `fieldId` | Load Field's Journey definitions |

---

## Cross-References

- `architecture/FIELD_ARCHITECTURE.md` — Complete Field specification
- `architecture/TRELLIS.md` — DEX stack documentation
- `SPROUT_SYSTEM.md` — Insight capture lifecycle
- `specs/dex-object-model.ts` — TypeScript schemas
