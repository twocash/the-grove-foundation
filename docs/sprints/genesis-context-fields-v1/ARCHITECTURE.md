# Architecture: genesis-context-fields-v1

**Sprint:** genesis-context-fields-v1  
**Date:** January 2, 2026  
**Status:** Draft

---

## 1. System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CONTEXT FIELDS ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                           USER INTERFACE                                 │ │
│  │                                                                          │ │
│  │   KineticWelcome                   PromptPill                            │ │
│  │   ├── useSuggestedPrompts()        └── onClick → trackSelection()       │ │
│  │   └── renders PromptPill[]                                               │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                     │                                        │
│                                     ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        HOOKS LAYER                                       │ │
│  │                                                                          │ │
│  │   useSuggestedPrompts           useContextState                          │ │
│  │   ├── gets context state        ├── aggregates 4D state                  │ │
│  │   ├── scores prompts            ├── stage from EngagementBus             │ │
│  │   ├── returns top N             ├── entropy from calculator              │ │
│  │   └── tracks analytics          ├── lens from EngagementBus              │ │
│  │                                 └── moments from EngagementBus           │ │
│  │                                                                          │ │
│  │   usePromptCollection           useSessionTelemetry                      │ │
│  │   ├── loads library prompts     ├── tracks interactions                  │ │
│  │   ├── caches generated          ├── tracks topics explored               │ │
│  │   └── CRUD operations           └── feeds generator                      │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                     │                                        │
│                                     ▼                                        │ │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        CORE LAYER                                        │ │
│  │                                                                          │ │
│  │   context-fields/               engagement/                              │ │
│  │   ├── types.ts                  ├── machine.ts                           │ │
│  │   ├── scoring.ts                ├── context.tsx                          │ │
│  │   ├── generator.ts              └── hooks/                               │ │
│  │   ├── telemetry.ts                                                       │ │
│  │   └── collection.ts             engine/                                  │ │
│  │                                 └── entropyCalculator.ts                 │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                     │                                        │
│                                     ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        DATA LAYER                                        │ │
│  │                                                                          │ │
│  │   src/data/prompts/             src/core/data/                           │ │
│  │   ├── base.prompts.json         ├── grove-data-provider.ts               │ │
│  │   ├── dr-chiang.prompts.json    ├── use-grove-data.ts                    │ │
│  │   └── index.ts                  └── adapters/                            │ │
│  │                                                                          │ │
│  │   src/data/lenses/                                                       │ │
│  │   └── dr-chiang.lens.ts                                                  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Data Flow

### 2.1 Prompt Selection Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PROMPT SELECTION FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Component mounts or context changes                                     │
│     ┌─────────────────────────────────────────────────────────────────────┐ │
│     │ const { prompts } = useSuggestedPrompts({ maxPrompts: 3 });         │ │
│     └─────────────────────────────────────────────────────────────────────┘ │
│                                     │                                       │
│                                     ▼                                       │
│  2. Hook aggregates context state                                           │
│     ┌─────────────────────────────────────────────────────────────────────┐ │
│     │ const context = useContextState();                                  │ │
│     │ // { stage, entropy, activeLensId, activeMoments, ... }             │ │
│     └─────────────────────────────────────────────────────────────────────┘ │
│                                     │                                       │
│                                     ▼                                       │
│  3. Hook loads prompt library + cached generated prompts                    │
│     ┌─────────────────────────────────────────────────────────────────────┐ │
│     │ const { library, generated } = usePromptCollection();               │ │
│     │ const allPrompts = [...library, ...generated];                      │ │
│     └─────────────────────────────────────────────────────────────────────┘ │
│                                     │                                       │
│                                     ▼                                       │
│  4. Apply HARD FILTERS (stage, lens excludes)                               │
│     ┌─────────────────────────────────────────────────────────────────────┐ │
│     │ const eligible = allPrompts.filter(p =>                             │ │
│     │   matchesStage(p, context) &&                                       │ │
│     │   !isLensExcluded(p, context) &&                                    │ │
│     │   meetsMinInteractions(p, context)                                  │ │
│     │ );                                                                  │ │
│     └─────────────────────────────────────────────────────────────────────┘ │
│                                     │                                       │
│                                     ▼                                       │
│  5. Score remaining prompts (SOFT SCORING)                                  │
│     ┌─────────────────────────────────────────────────────────────────────┐ │
│     │ const scored = eligible.map(p => ({                                 │ │
│     │   prompt: p,                                                        │ │
│     │   score: calculateRelevance(p, context, weights)                    │ │
│     │ }));                                                                │ │
│     └─────────────────────────────────────────────────────────────────────┘ │
│                                     │                                       │
│                                     ▼                                       │
│  6. Sort by score, return top N                                             │
│     ┌─────────────────────────────────────────────────────────────────────┐ │
│     │ return scored                                                       │ │
│     │   .sort((a, b) => b.score - a.score)                                │ │
│     │   .slice(0, maxPrompts)                                             │ │
│     │   .map(s => s.prompt);                                              │ │
│     └─────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Prompt Generation Flow (Async)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PROMPT GENERATION FLOW                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. After 2nd interaction, trigger background generation                    │
│     ┌─────────────────────────────────────────────────────────────────────┐ │
│     │ useEffect(() => {                                                   │ │
│     │   if (interactionCount >= 2) {                                      │ │
│     │     generator.generateAhead(context);                               │ │
│     │   }                                                                 │ │
│     │ }, [interactionCount]);                                             │ │
│     └─────────────────────────────────────────────────────────────────────┘ │
│                                     │                                       │
│                                     ▼                                       │
│  2. Generator builds prompt from telemetry                                  │
│     ┌─────────────────────────────────────────────────────────────────────┐ │
│     │ PromptGenerator.generateAhead(targetContext)                        │ │
│     │   → Analyze session telemetry                                       │ │
│     │   → Identify under-explored areas                                   │ │
│     │   → Call LLM with structured prompt                                 │ │
│     │   → Parse response into PromptObject                                │ │
│     │   → Cache with generatedFrom provenance                             │ │
│     └─────────────────────────────────────────────────────────────────────┘ │
│                                     │                                       │
│                                     ▼                                       │
│  3. Generated prompts available on NEXT selection cycle                     │
│     ┌─────────────────────────────────────────────────────────────────────┐ │
│     │ // User sends 3rd query                                             │ │
│     │ // useSuggestedPrompts sees cached generated prompts                │ │
│     │ // Generated prompts compete with library prompts in scoring        │ │
│     └─────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Component Architecture

### 3.1 File Structure

```
src/
├── core/
│   ├── context-fields/
│   │   ├── types.ts              # PromptObject, ContextTargeting, Stage, etc.
│   │   ├── scoring.ts            # calculateRelevance(), applyHardFilters()
│   │   ├── generator.ts          # PromptGenerator class
│   │   ├── telemetry.ts          # SessionTelemetry, TelemetryCollector
│   │   ├── collection.ts         # PromptCollection (in-memory for Genesis)
│   │   └── index.ts              # Barrel export
│   │
│   ├── data/
│   │   ├── grove-data-provider.ts  # Add 'prompt' to GroveObjectType
│   │   └── ...
│   │
│   ├── engagement/
│   │   ├── context.tsx           # Add computedEntropy to state
│   │   └── hooks/
│   │       └── useEngagementState.ts  # Expose entropy
│   │
│   └── schema/
│       ├── engagement.ts         # Add entropy to EngagementState
│       └── suggested-prompts.ts  # Deprecated, redirect to context-fields/types
│
├── data/
│   ├── prompts/
│   │   ├── base.prompts.json     # Universal prompts
│   │   ├── dr-chiang.prompts.json # Lens-specific prompts
│   │   └── index.ts              # Aggregator
│   │
│   └── lenses/
│       ├── dr-chiang.lens.ts     # Dr. Chiang configuration
│       └── index.ts              # Lens registry
│
├── hooks/
│   ├── useContextState.ts        # Aggregates 4D context
│   ├── useSuggestedPrompts.ts    # REWRITTEN: 4D targeting
│   ├── useSessionTelemetry.ts    # Telemetry collection
│   └── usePromptCollection.ts    # Prompt CRUD
│
└── surface/
    └── components/
        └── KineticStream/
            └── KineticWelcome.tsx  # Uses useSuggestedPrompts
```

### 3.2 Core Modules

#### context-fields/types.ts

```typescript
// Stage type (replaces SessionStage for Context Fields)
export type Stage = 'genesis' | 'exploration' | 'synthesis' | 'advocacy';

// PromptObject - full schema in SPEC.md
export interface PromptObject { ... }

// ContextTargeting - declarative filter criteria
export interface ContextTargeting { ... }

// ContextState - aggregated 4D state
export interface ContextState {
  stage: Stage;
  entropy: number;
  activeLensId: string | null;
  activeMoments: string[];
  interactionCount: number;
  topicsExplored: string[];
  sproutsCaptured: number;
  offTopicCount: number;
}

// ScoringWeights - configurable per lens
export interface ScoringWeights {
  stageMatch: number;      // Default: 2.0
  entropyFit: number;      // Default: 1.5
  lensPrecision: number;   // Default: 3.0
  topicRelevance: number;  // Default: 2.0
  momentBoost: number;     // Default: 3.0
  baseWeightScale: number; // Default: 0.5
}
```

#### context-fields/scoring.ts

```typescript
/**
 * Apply hard filters that disqualify prompts entirely.
 */
export function applyHardFilters(
  prompts: PromptObject[],
  context: ContextState
): PromptObject[];

/**
 * Calculate relevance score for a single prompt.
 */
export function calculateRelevance(
  prompt: PromptObject,
  context: ContextState,
  weights?: Partial<ScoringWeights>
): number;

/**
 * Score and rank prompts by relevance.
 */
export function rankPrompts(
  prompts: PromptObject[],
  context: ContextState,
  weights?: Partial<ScoringWeights>
): ScoredPrompt[];
```

#### context-fields/generator.ts

```typescript
export class PromptGenerator {
  private cache: Map<string, PromptObject[]>;
  private telemetry: SessionTelemetry;

  constructor(telemetry: SessionTelemetry);

  /**
   * Generate prompts targeting a future context state.
   * Runs async, caches results for retrieval.
   */
  async generateAhead(targetContext: ContextState): Promise<PromptObject[]>;

  /**
   * Get cached prompts matching current context.
   */
  getCached(context: ContextState): PromptObject[];

  /**
   * Clear all cached prompts.
   */
  invalidateCache(): void;
}
```

---

## 4. State Management

### 4.1 Context State Aggregation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CONTEXT STATE SOURCES                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   EngagementBus                                                             │
│   ├── stage (SessionStage)         → Map to Stage                           │
│   ├── exchangeCount                → interactionCount                       │
│   ├── topicsExplored[]             → topicsExplored                         │
│   ├── activeLensId                 → activeLensId                           │
│   ├── sproutsCaptured              → sproutsCaptured                        │
│   └── [NEW] activeMoments[]        → activeMoments                          │
│                                                                             │
│   EntropyCalculator                                                         │
│   └── calculateEntropy(inputs)     → entropy (0.0-1.0)                      │
│                                                                             │
│   SessionTelemetry                                                          │
│   └── offTopicCount                → offTopicCount                          │
│                                                                             │
│   useContextState() aggregates all sources into ContextState                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Stage Mapping

```typescript
function mapSessionStageToStage(sessionStage: SessionStage): Stage {
  const mapping: Record<SessionStage, Stage> = {
    'ARRIVAL': 'genesis',
    'ORIENTED': 'exploration',
    'EXPLORING': 'synthesis',
    'ENGAGED': 'advocacy',
  };
  return mapping[sessionStage];
}
```

---

## 5. DEX Compliance

### 5.1 Declarative Sovereignty

**Prompts as JSON:**
```json
// src/data/prompts/base.prompts.json
[
  {
    "id": "what-is-grove",
    "objectType": "prompt",
    "label": "What is The Grove?",
    "executionPrompt": "Explain what The Grove is...",
    "targeting": {
      "stages": ["genesis"]
    },
    "baseWeight": 80,
    "status": "active",
    "source": "library"
  }
]
```

**Domain experts can:**
- Add new prompts by editing JSON
- Change targeting criteria without code
- Create lens-specific prompt bundles

### 5.2 Capability Agnosticism

**Graceful degradation:**
- If generator fails → library prompts always available
- If entropy calculator fails → default to 0.5 (neutral)
- If moments unavailable → moment boost = 0

### 5.3 Provenance as Infrastructure

**Generated prompt provenance:**
```typescript
const generatedPrompt: PromptObject = {
  // ...
  source: 'generated',
  generatedFrom: {
    sessionId: 'sess_abc123',
    telemetrySnapshot: { ... },
    generatedAt: Date.now(),
    reasoning: 'User explored simulation but not economics...',
  },
};
```

### 5.4 Organic Scalability

**Adding new lens:**
1. Create `src/data/lenses/{lens-id}.lens.ts`
2. Create `src/data/prompts/{lens-id}.prompts.json`
3. No code changes required

---

## 6. Integration Points

### 6.1 EngagementBus Extensions

```typescript
// Add to EngagementState
interface EngagementState {
  // ... existing fields
  
  // NEW: Computed entropy (from entropyCalculator)
  computedEntropy: number;
  
  // NEW: Active moments (temporary high-signal events)
  activeMoments: string[];
}
```

### 6.2 Data Layer Integration

```typescript
// Add 'prompt' to GroveObjectType
export type GroveObjectType = 
  | 'lens' 
  | 'journey' 
  | 'hub' 
  | 'document'
  | 'prompt';  // NEW
```

---

## 7. Test Architecture

### 7.1 Unit Tests

| Module | Test File | Coverage Target |
|--------|-----------|-----------------|
| scoring.ts | `scoring.test.ts` | 100% |
| generator.ts | `generator.test.ts` | 80% |
| collection.ts | `collection.test.ts` | 90% |
| useContextState.ts | `useContextState.test.ts` | 90% |

### 7.2 Integration Tests

| Test | Description |
|------|-------------|
| `useSuggestedPrompts.integration.test.ts` | Full hook with mock EngagementBus |
| `drChiangLens.integration.test.ts` | Dr. Chiang lens prompt selection |

### 7.3 E2E Tests

| Test | Description |
|------|-------------|
| `genesis-prompts.spec.ts` | Prompts visible on /explore route |
| `lens-personalization.spec.ts` | Lens changes prompt selection |

---

## 8. Performance Considerations

| Concern | Strategy |
|---------|----------|
| Prompt loading | Load library on mount, cache in memory |
| Scoring computation | Memoize with useMemo, deps on context state |
| Generator calls | Debounce, cache results by context hash |
| Large prompt library | Lazy load lens-specific bundles |

---

## Architecture Complete

**Ready for:** Phase 4 (Migration Planning)  
**Key Files:** 
- `src/core/context-fields/*` (new)
- `hooks/useSuggestedPrompts.ts` (rewrite)
- `src/data/prompts/*.json` (new)
