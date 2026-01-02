# Execution Prompt: genesis-context-fields-v1

**Sprint:** genesis-context-fields-v1  
**Date:** January 2, 2026  
**Target:** Claude Code or fresh Claude context

---

## 🎯 Mission

Replace Journey-based prompt selection with **Context Fields**—a 4-dimensional targeting system that surfaces relevant prompts based on Stage, Entropy, Lens, and Moment.

## 📍 Project Location

```
C:\github\the-grove-foundation
```

## 📚 Read First

Before executing ANY code:

1. `docs/sprints/genesis-context-fields-v1/ARCHITECTURE.md` — System design
2. `docs/sprints/genesis-context-fields-v1/DECISIONS.md` — Key decisions (ADR-001 through ADR-008)
3. `docs/PROJECT_PATTERNS.md` — Existing patterns to follow

## 🚫 Forbidden Actions

- **DO NOT** create new React contexts (use existing EngagementContext)
- **DO NOT** add new handlers or event types without reason
- **DO NOT** use imperative `if (type === 'foo')` patterns—use declarative targeting
- **DO NOT** modify Bedrock code—this is Genesis-only
- **DO NOT** import from deprecated `stage-prompts.ts` in new code

## ✅ Success Criteria

- [ ] Prompts surface based on 4D context (Stage, Entropy, Lens, Moment)
- [ ] Dr. Chiang lens delivers customized prompts
- [ ] High entropy triggers stabilization prompts
- [ ] All tests pass: `npm test && npx playwright test`
- [ ] Build succeeds: `npm run build`

---

## 📂 File Structure to Create

```
src/core/context-fields/
├── types.ts              # P1
├── scoring.ts            # P1
├── collection.ts         # P1
├── generator.ts          # P2
├── telemetry.ts          # P2
└── index.ts              # P1

src/data/prompts/
├── base.prompts.json     # P1
├── dr-chiang.prompts.json # P1
└── index.ts              # P1

src/data/lenses/
├── dr-chiang.lens.ts     # P1
└── index.ts              # P2

hooks/
├── useContextState.ts    # P1
├── usePromptCollection.ts # P1
└── useSessionTelemetry.ts # P2
```

---

## 🔧 Epic 1: Core Types & Scoring

### Step 1.1: Create types.ts

```typescript
// src/core/context-fields/types.ts

/**
 * Stage in user lifecycle (Context Fields terminology)
 * Maps from SessionStage: ARRIVAL→genesis, ORIENTED→exploration, etc.
 */
export type Stage = 'genesis' | 'exploration' | 'synthesis' | 'advocacy';

/**
 * Aggregated 4-dimensional context state
 */
export interface ContextState {
  stage: Stage;
  entropy: number;                // 0.0-1.0
  activeLensId: string | null;
  activeMoments: string[];
  interactionCount: number;
  topicsExplored: string[];
  sproutsCaptured: number;
  offTopicCount: number;
}

/**
 * Declarative targeting criteria for when a prompt is relevant
 */
export interface ContextTargeting {
  stages?: Stage[];
  excludeStages?: Stage[];
  entropyWindow?: { min?: number; max?: number };
  lensIds?: string[];
  excludeLenses?: string[];
  momentTriggers?: string[];
  requireMoment?: boolean;
  minInteractions?: number;
  afterPromptIds?: string[];
  topicClusters?: string[];
}

/**
 * Topic affinity for weighted connections
 */
export interface TopicAffinity {
  topicId: string;
  weight: number;  // 0.0-1.0
}

/**
 * Lens affinity with optional label override
 */
export interface LensAffinity {
  lensId: string;
  weight: number;  // 0.0-1.0
  customLabel?: string;
}

/**
 * Prompt analytics
 */
export interface PromptStats {
  impressions: number;
  selections: number;
  completions: number;
  avgEntropyDelta: number;
  avgDwellAfter: number;
  lastSurfaced?: number;
}

/**
 * Generation provenance
 */
export interface GenerationContext {
  sessionId: string;
  telemetrySnapshot: Record<string, unknown>;
  generatedAt: number;
  reasoning: string;
}

/**
 * First-class DEX object for prompts
 */
export interface PromptObject {
  id: string;
  objectType: 'prompt';
  created: number;
  modified: number;
  author: 'system' | 'generated' | string;
  
  label: string;
  description?: string;
  executionPrompt: string;
  systemContext?: string;
  
  icon?: string;
  variant?: 'default' | 'glow' | 'subtle' | 'urgent';
  
  tags: string[];
  topicAffinities: TopicAffinity[];
  lensAffinities: LensAffinity[];
  
  targeting: ContextTargeting;
  baseWeight?: number;
  
  stats: PromptStats;
  
  status: 'draft' | 'active' | 'deprecated';
  source: 'library' | 'generated' | 'user';
  generatedFrom?: GenerationContext;
  
  cooldown?: number;
  maxShows?: number;
}

/**
 * Scoring weights (configurable per lens)
 */
export interface ScoringWeights {
  stageMatch: number;       // Default: 2.0
  entropyFit: number;       // Default: 1.5
  lensPrecision: number;    // Default: 3.0
  topicRelevance: number;   // Default: 2.0
  momentBoost: number;      // Default: 3.0
  baseWeightScale: number;  // Default: 0.5
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  stageMatch: 2.0,
  entropyFit: 1.5,
  lensPrecision: 3.0,
  topicRelevance: 2.0,
  momentBoost: 3.0,
  baseWeightScale: 0.5,
};

/**
 * Scored prompt result
 */
export interface ScoredPrompt {
  prompt: PromptObject;
  score: number;
  matchDetails: {
    stageMatch: boolean;
    entropyFit: boolean;
    lensWeight: number;
    topicWeight: number;
    momentBoosts: number;
  };
}

/**
 * Map SessionStage to Stage
 */
export type SessionStage = 'ARRIVAL' | 'ORIENTED' | 'EXPLORING' | 'ENGAGED';

export function mapSessionStageToStage(sessionStage: SessionStage): Stage {
  const mapping: Record<SessionStage, Stage> = {
    'ARRIVAL': 'genesis',
    'ORIENTED': 'exploration',
    'EXPLORING': 'synthesis',
    'ENGAGED': 'advocacy',
  };
  return mapping[sessionStage];
}
```

### Step 1.2: Create scoring.ts

```typescript
// src/core/context-fields/scoring.ts

import type { 
  PromptObject, 
  ContextState, 
  ScoringWeights, 
  ScoredPrompt,
  DEFAULT_SCORING_WEIGHTS 
} from './types';

/**
 * Apply hard filters that disqualify prompts entirely.
 * Hard filters: stage mismatch, lens excluded, minInteractions not met
 */
export function applyHardFilters(
  prompts: PromptObject[],
  context: ContextState
): PromptObject[] {
  return prompts.filter(prompt => {
    const { targeting } = prompt;
    
    // Stage filter
    if (targeting.stages && targeting.stages.length > 0) {
      if (!targeting.stages.includes(context.stage)) {
        return false;
      }
    }
    if (targeting.excludeStages?.includes(context.stage)) {
      return false;
    }
    
    // Lens exclusion (hard filter)
    if (targeting.excludeLenses?.includes(context.activeLensId ?? '')) {
      return false;
    }
    
    // Minimum interactions
    if (targeting.minInteractions && context.interactionCount < targeting.minInteractions) {
      return false;
    }
    
    // Require moment
    if (targeting.requireMoment && targeting.momentTriggers) {
      const hasMatch = targeting.momentTriggers.some(m => context.activeMoments.includes(m));
      if (!hasMatch) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Calculate relevance score for a single prompt.
 */
export function calculateRelevance(
  prompt: PromptObject,
  context: ContextState,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS
): number {
  const { targeting } = prompt;
  let score = 0;
  
  // Stage match (already filtered, but adds weight)
  const stageMatch = !targeting.stages || targeting.stages.includes(context.stage);
  if (stageMatch) {
    score += weights.stageMatch;
  }
  
  // Entropy fit
  const { entropyWindow } = targeting;
  let entropyFit = true;
  if (entropyWindow) {
    if (entropyWindow.min !== undefined && context.entropy < entropyWindow.min) {
      entropyFit = false;
    }
    if (entropyWindow.max !== undefined && context.entropy > entropyWindow.max) {
      entropyFit = false;
    }
  }
  if (entropyFit) {
    score += weights.entropyFit;
  }
  
  // Lens precision
  let lensWeight = 0;
  if (context.activeLensId) {
    const affinity = prompt.lensAffinities.find(a => a.lensId === context.activeLensId);
    if (affinity) {
      lensWeight = affinity.weight;
      score += lensWeight * weights.lensPrecision;
    }
  }
  
  // Topic relevance
  let topicWeight = 0;
  if (context.topicsExplored.length > 0) {
    const matchingAffinities = prompt.topicAffinities.filter(
      a => context.topicsExplored.includes(a.topicId)
    );
    if (matchingAffinities.length > 0) {
      topicWeight = Math.max(...matchingAffinities.map(a => a.weight));
      score += topicWeight * weights.topicRelevance;
    }
  }
  
  // Moment boost (additive per matching moment)
  let momentBoosts = 0;
  if (targeting.momentTriggers) {
    for (const moment of targeting.momentTriggers) {
      if (context.activeMoments.includes(moment)) {
        momentBoosts += weights.momentBoost;
      }
    }
  }
  score += momentBoosts;
  
  // Base weight contribution
  const baseWeight = prompt.baseWeight ?? 50;
  score += (baseWeight / 100) * weights.baseWeightScale;
  
  return score;
}

/**
 * Score and rank prompts by relevance.
 */
export function rankPrompts(
  prompts: PromptObject[],
  context: ContextState,
  weights: ScoringWeights = DEFAULT_SCORING_WEIGHTS
): ScoredPrompt[] {
  const scored = prompts.map(prompt => {
    const score = calculateRelevance(prompt, context, weights);
    const { targeting } = prompt;
    
    return {
      prompt,
      score,
      matchDetails: {
        stageMatch: !targeting.stages || targeting.stages.includes(context.stage),
        entropyFit: !targeting.entropyWindow || (
          (targeting.entropyWindow.min === undefined || context.entropy >= targeting.entropyWindow.min) &&
          (targeting.entropyWindow.max === undefined || context.entropy <= targeting.entropyWindow.max)
        ),
        lensWeight: prompt.lensAffinities.find(a => a.lensId === context.activeLensId)?.weight ?? 0,
        topicWeight: Math.max(0, ...prompt.topicAffinities
          .filter(a => context.topicsExplored.includes(a.topicId))
          .map(a => a.weight)),
        momentBoosts: (targeting.momentTriggers ?? [])
          .filter(m => context.activeMoments.includes(m)).length * weights.momentBoost,
      },
    };
  });
  
  return scored.sort((a, b) => b.score - a.score);
}
```

### Step 1.3: Create index.ts barrel

```typescript
// src/core/context-fields/index.ts

export * from './types';
export * from './scoring';
export { PromptCollection } from './collection';
```

### 🧪 VERIFICATION: Epic 1

```bash
# After creating types.ts, scoring.ts, index.ts
npm run typecheck
# Should pass with no errors

# Create and run scoring tests
npm test -- scoring.test.ts
# Should have 100% coverage
```

---

## 🔧 Epic 2: Data Layer

### Step 2.1: Create base.prompts.json

```json
[
  {
    "id": "what-is-grove",
    "objectType": "prompt",
    "created": 1735776000000,
    "modified": 1735776000000,
    "author": "system",
    "label": "What is The Grove?",
    "description": "Start here to understand the vision",
    "executionPrompt": "Explain what The Grove is in a way that captures both the technical architecture and the philosophical vision. Be concise but compelling.",
    "tags": ["orientation", "overview"],
    "topicAffinities": [],
    "lensAffinities": [],
    "targeting": {
      "stages": ["genesis"]
    },
    "baseWeight": 90,
    "stats": { "impressions": 0, "selections": 0, "completions": 0, "avgEntropyDelta": 0, "avgDwellAfter": 0 },
    "status": "active",
    "source": "library"
  },
  {
    "id": "why-distributed",
    "objectType": "prompt",
    "created": 1735776000000,
    "modified": 1735776000000,
    "author": "system",
    "label": "Why distributed AI?",
    "executionPrompt": "Explain why distributed AI infrastructure matters—both the technical advantages and the philosophical implications for AI ownership and access.",
    "tags": ["philosophy", "architecture"],
    "topicAffinities": [{ "topicId": "distributed-systems", "weight": 0.9 }],
    "lensAffinities": [],
    "targeting": {
      "stages": ["genesis", "exploration"]
    },
    "baseWeight": 80,
    "stats": { "impressions": 0, "selections": 0, "completions": 0, "avgEntropyDelta": 0, "avgDwellAfter": 0 },
    "status": "active",
    "source": "library"
  }
]
```

*Continue with 10+ prompts covering all stages...*

### Step 2.2: Create dr-chiang.prompts.json

See SPEC.md Part VIII for full prompt definitions. Must include:
- `chiang-research-infrastructure`
- `chiang-land-grant-mission`
- `chiang-distributed-ai`
- `chiang-partnership`
- `chiang-stabilize`
- `chiang-next-steps`

### 🧪 VERIFICATION: Epic 2

```bash
# Validate JSON
node -e "require('./src/data/prompts/base.prompts.json')"
node -e "require('./src/data/prompts/dr-chiang.prompts.json')"

# Build should pass
npm run build
```

---

## 🔧 Epic 3: State Integration

### Step 3.1: Modify engagement.ts

Add to `EngagementState` interface:

```typescript
/** Computed entropy (0.0-1.0) */
computedEntropy: number;

/** Active moments (temporary high-signal events) */
activeMoments: string[];
```

### Step 3.2: Modify context.tsx

In `EngagementProvider`:

```typescript
import { calculateEntropy } from '@core/engine/entropyCalculator';

// Compute entropy
const computedEntropy = useMemo(() => {
  return calculateEntropy({
    hubsVisited: state.cardsVisited,
    exchangeCount: state.exchangeCount,
    pivotCount: 0,
    journeyWaypointsHit: state.activeJourney?.currentPosition ?? 0,
    journeyWaypointsTotal: state.activeJourney?.threadCardIds.length ?? 0,
    consecutiveHubRepeats: 0,
  });
}, [state.cardsVisited, state.exchangeCount, state.activeJourney]);

// Detect high_entropy moment
const activeMoments = useMemo(() => {
  const moments: string[] = [];
  if (computedEntropy > 0.7) {
    moments.push('high_entropy');
  }
  return moments;
}, [computedEntropy]);

// Include in context value
const value = useMemo(() => ({
  ...state,
  computedEntropy,
  activeMoments,
}), [state, computedEntropy, activeMoments]);
```

### Step 3.3: Create useContextState.ts

```typescript
// hooks/useContextState.ts

import { useMemo } from 'react';
import { useEngagementState } from './useEngagementBus';
import type { ContextState, Stage } from '@core/context-fields/types';
import { mapSessionStageToStage } from '@core/context-fields/types';

export function useContextState(): ContextState {
  const engagement = useEngagementState();
  
  return useMemo(() => ({
    stage: mapSessionStageToStage(engagement.stage),
    entropy: engagement.computedEntropy,
    activeLensId: engagement.activeLensId,
    activeMoments: engagement.activeMoments,
    interactionCount: engagement.exchangeCount,
    topicsExplored: engagement.topicsExplored,
    sproutsCaptured: engagement.sproutsCaptured,
    offTopicCount: 0, // TODO: Track in telemetry
  }), [engagement]);
}
```

### 🧪 VERIFICATION: Epic 3

```bash
npm test && npm run build
# Context should provide new fields
```

---

## 🔧 Epic 4: Hook Rewrite

### Step 4.1: Rewrite useSuggestedPrompts.ts

```typescript
// hooks/useSuggestedPrompts.ts

import { useMemo, useCallback } from 'react';
import { useContextState } from './useContextState';
import { usePromptCollection } from './usePromptCollection';
import { applyHardFilters, rankPrompts } from '@core/context-fields';
import type { PromptObject, ScoringWeights } from '@core/context-fields';

export interface UseSuggestedPromptsOptions {
  maxPrompts?: number;
  includeGenerated?: boolean;
  scoringOverrides?: Partial<ScoringWeights>;
}

export interface UseSuggestedPromptsResult {
  prompts: PromptObject[];
  stage: string;
  entropy: number;
  activeMoments: string[];
  isLoading: boolean;
  error: Error | null;
  refreshPrompts: () => void;
  trackSelection: (promptId: string) => void;
}

export function useSuggestedPrompts(
  options: UseSuggestedPromptsOptions = {}
): UseSuggestedPromptsResult {
  const { maxPrompts = 3, includeGenerated = true, scoringOverrides } = options;
  
  const context = useContextState();
  const { library, generated, isLoading, error, trackSelection } = usePromptCollection();
  
  const prompts = useMemo(() => {
    // Combine sources
    let allPrompts = [...library];
    if (includeGenerated && context.interactionCount >= 2) {
      allPrompts = [...allPrompts, ...generated];
    }
    
    // Hard filters
    const eligible = applyHardFilters(allPrompts, context);
    
    // Soft scoring
    const scored = rankPrompts(eligible, context, scoringOverrides);
    
    // Return top N
    return scored.slice(0, maxPrompts).map(s => s.prompt);
  }, [library, generated, context, maxPrompts, includeGenerated, scoringOverrides]);
  
  const refreshPrompts = useCallback(() => {
    // Force re-evaluation (context change will trigger)
  }, []);
  
  return {
    prompts,
    stage: context.stage,
    entropy: context.entropy,
    activeMoments: context.activeMoments,
    isLoading,
    error,
    refreshPrompts,
    trackSelection,
  };
}
```

### 🧪 VERIFICATION: Epic 4

```bash
npm test -- useSuggestedPrompts.test.ts
npx playwright test genesis-prompts.spec.ts

# Visual check
npm run dev
# Navigate to /explore, verify prompts appear
```

---

## 🧪 Final Verification

```bash
# Full test suite
npm test

# E2E tests
npx playwright test

# Build
npm run build

# Visual check
npm run dev
# Test Dr. Chiang lens at /explore
```

---

## 🆘 Troubleshooting

### "Cannot find module '@core/context-fields'"

Check `tsconfig.json` paths:
```json
{
  "compilerOptions": {
    "paths": {
      "@core/*": ["./src/core/*"]
    }
  }
}
```

### "stage is undefined"

Ensure EngagementProvider wraps the component tree. Check that `useEngagementState()` returns the new `computedEntropy` field.

### "No prompts appearing"

1. Check console for errors
2. Verify JSON files are valid
3. Check that stage mapping works
4. Verify hard filters aren't excluding everything

### "Dr. Chiang prompts not showing"

1. Verify lens is selected in UI
2. Check `activeLensId` in context
3. Verify `lensAffinities` in prompt JSON

---

## 📋 Completion Checklist

- [ ] All files created per file structure
- [ ] Types compile: `npm run typecheck`
- [ ] Unit tests pass: `npm test`
- [ ] E2E tests pass: `npx playwright test`
- [ ] Build succeeds: `npm run build`
- [ ] Visual check: prompts render on /explore
- [ ] Dr. Chiang lens: custom prompts appear
- [ ] High entropy: stabilization prompt surfaces
- [ ] DEVLOG.md updated with session notes
- [ ] INDEX.md status updated to ✅ Complete

---

**Execution prompt ready. Good luck! 🌳**
