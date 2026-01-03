# Execution Prompt: adaptive-prompt-recommendations-v1

**Sprint:** adaptive-prompt-recommendations-v1  
**Created:** 2026-01-03  
**For:** Claude Code CLI  
**Prerequisites:** prompt-schema-rationalization-v1 must be complete

---

## Context

You are implementing an adaptive prompt recommendation system for the Grove Terminal. This system uses entropy-weighted contextual bandits to surface prompts that match the user's epistemic state — recommending clarifying prompts when confused, challenging prompts when certain, and diverse prompts when exploring.

**Core thesis:** Recommend based on epistemic impact (entropy delta), not just engagement.

## Pre-Implementation Checklist

Before writing any code:

1. **Verify prerequisite sprint is complete:**
   ```bash
   # Check that prompt-schema-rationalization-v1 changes are merged
   git log --oneline -5
   # Should see commit with "prompt: rationalize schema"
   ```

2. **Read sprint artifacts:**
   - `docs/sprints/adaptive-prompt-recommendations-v1/REPO_AUDIT.md`
   - `docs/sprints/adaptive-prompt-recommendations-v1/SPEC.md`
   - `docs/sprints/adaptive-prompt-recommendations-v1/ARCHITECTURE.md`
   - `docs/sprints/adaptive-prompt-recommendations-v1/MIGRATION_MAP.md`
   - `docs/sprints/adaptive-prompt-recommendations-v1/SPRINTS.md`

3. **Verify existing code:**
   - `src/core/schema/prompt.ts` — Should have rationalized schema
   - `src/explore/utils/scorePrompt.ts` — Existing scoring logic
   - `src/explore/hooks/usePromptSuggestions.ts` — Current hook

---

## Implementation Order

Execute epics in order. Complete each build gate before proceeding.

### Epic 1: Schema & Types

**File to create:** `src/core/schema/adaptive-scoring.ts`

```typescript
/**
 * Adaptive Scoring Types
 * 
 * Implements contextual bandit state and entropy impact tracking
 * for adaptive prompt recommendations.
 * 
 * See: docs/sprints/adaptive-prompt-recommendations-v1/ARCHITECTURE.md
 */

export interface BanditArm {
  /** Encoded context signature (lens|topic|entropy|depth|time) */
  contextHash: string;
  /** Selection rate: selections / impressions */
  successRate: number;
  /** Total times shown in this context */
  impressions: number;
  /** Times user engaged with prompt in this context */
  selections: number;
  /** ISO timestamp of last impression */
  lastPull: string;
}

export interface EntropyImpact {
  /** Average entropy change after selection (negative = clarifying) */
  avgDelta: number;
  /** Number of observations */
  samples: number;
  /** Segmented by starting entropy state */
  byInitialState: {
    high: { avgDelta: number; samples: number };
    medium: { avgDelta: number; samples: number };
    low: { avgDelta: number; samples: number };
  };
}

export interface AdaptiveScoring {
  /** Contextual bandit arms, one per unique context hash */
  arms: BanditArm[];
  /** Entropy impact tracking */
  entropyImpact: EntropyImpact;
  /** ISO timestamp of last global impression */
  lastGlobalShow: string | null;
  /** Rolling average shows per day */
  showVelocity: number;
  /** True if < 50 total impressions */
  isNew: boolean;
  /** Current exploration bonus (decays with impressions) */
  explorationBonus: number;
}

/** Default adaptive scoring for new prompts */
export function createDefaultAdaptiveScoring(): AdaptiveScoring {
  return {
    arms: [],
    entropyImpact: {
      avgDelta: 0,
      samples: 0,
      byInitialState: {
        high: { avgDelta: 0, samples: 0 },
        medium: { avgDelta: 0, samples: 0 },
        low: { avgDelta: 0, samples: 0 },
      },
    },
    lastGlobalShow: null,
    showVelocity: 0,
    isNew: true,
    explorationBonus: 1.3,
  };
}
```

**File to modify:** `src/core/schema/prompt.ts`

```typescript
// ADD import at top
import type { AdaptiveScoring } from './adaptive-scoring';

// ADD to PromptPayload interface
interface PromptPayload {
  // ... existing fields ...
  
  /** 
   * Adaptive scoring for telemetry-driven recommendations.
   * Optional - populated by telemetry system after first impression.
   * See: docs/sprints/adaptive-prompt-recommendations-v1/
   */
  adaptiveScoring?: AdaptiveScoring;
}
```

**Build gate:**
```bash
npm run typecheck
```

---

### Epic 2: Context Hashing

**File to create:** `src/core/telemetry/context-hash.ts`

```typescript
import type { ExplorationContext } from '@/explore/types';

export type EntropyBucket = 'high' | 'medium' | 'low';
export type SessionDepth = 'shallow' | 'medium' | 'deep';
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night';

export interface ContextFeatures {
  activeLensId: string | null;
  topicCluster: string;
  entropyBucket: EntropyBucket;
  sessionDepth: SessionDepth;
  timeOfDay: TimeOfDay;
}

export function getEntropyBucket(entropy: number | undefined): EntropyBucket {
  if (entropy === undefined || entropy === null) return 'medium';
  if (entropy > 0.7) return 'high';
  if (entropy < 0.3) return 'low';
  return 'medium';
}

export function getSessionDepth(messageCount: number | undefined): SessionDepth {
  if (!messageCount || messageCount < 5) return 'shallow';
  if (messageCount < 20) return 'medium';
  return 'deep';
}

export function getTimeOfDay(date: Date = new Date()): TimeOfDay {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export function getTopicCluster(topics: string[] | undefined): string {
  if (!topics || topics.length === 0) return 'none';
  if (topics.length === 1) return topics[0];
  // Return most frequent or first topic
  return topics[0];
}

export function extractContextFeatures(context: ExplorationContext): ContextFeatures {
  return {
    activeLensId: context.activeLens?.meta.id ?? null,
    topicCluster: getTopicCluster(context.activeTopics),
    entropyBucket: getEntropyBucket(context.entropyState),
    sessionDepth: getSessionDepth(context.messageCount),
    timeOfDay: getTimeOfDay(),
  };
}

/**
 * Generate stable, readable hash from exploration context.
 * Format: "lens:X|topic:Y|entropy:Z|depth:W|time:V"
 */
export function hashContext(context: ExplorationContext): string {
  const features = extractContextFeatures(context);
  return [
    `lens:${features.activeLensId ?? 'none'}`,
    `topic:${features.topicCluster}`,
    `entropy:${features.entropyBucket}`,
    `depth:${features.sessionDepth}`,
    `time:${features.timeOfDay}`,
  ].join('|');
}
```

**Build gate:**
```bash
npm run typecheck
npm test -- --grep "context-hash"
```

---

### Epic 3-5: Recommendation Components

**Create directory:** `src/explore/recommendation/`

**Files to create:**

1. `src/explore/recommendation/config.ts` — Configuration
2. `src/explore/recommendation/entropy-strategy.ts` — Strategy selection
3. `src/explore/recommendation/contextual-bandit.ts` — UCB scoring
4. `src/explore/recommendation/diversity-selector.ts` — Diverse selection
5. `src/explore/recommendation/recommend-prompts.ts` — Main orchestrator

See ARCHITECTURE.md for complete implementation of each file.

**Build gate:**
```bash
npm run typecheck
npm test -- --grep "recommendation"
```

---

### Epic 7: Database Schema

**File to create:** `supabase/migrations/[timestamp]_adaptive_scoring.sql`

Use the SQL from MIGRATION_MAP.md including:
- Tables: `prompt_impressions`, `prompt_selections`, `prompt_entropy_deltas`
- View: `prompt_telemetry_stats`
- Functions: `increment_prompt_impressions`, `record_prompt_selection`, `record_entropy_impact`

**Build gate:**
```bash
npx supabase db push --dry-run
npx supabase db push
```

---

### Epic 8: Event Tracking

**File to create:** `src/core/telemetry/prompt-events.ts`

```typescript
import { supabase } from '@/lib/supabase';
import type { ExplorationContext } from '@/explore/types';
import { hashContext, getEntropyBucket } from './context-hash';

/**
 * Track prompt impression (shown to user).
 * Non-blocking - failures are logged but don't throw.
 */
export async function trackPromptImpression(
  promptId: string,
  context: ExplorationContext
): Promise<void> {
  try {
    const contextHash = hashContext(context);
    const entropyBucket = getEntropyBucket(context.entropyState);
    
    await supabase.rpc('increment_prompt_impressions', {
      p_prompt_id: promptId,
      p_context_hash: contextHash,
      p_entropy_bucket: entropyBucket,
    });
  } catch (error) {
    console.warn('[telemetry] Failed to track impression:', error);
  }
}

/**
 * Track prompt selection (user engaged).
 * Non-blocking - failures are logged but don't throw.
 */
export async function trackPromptSelection(
  promptId: string,
  context: ExplorationContext,
  dwellMs?: number
): Promise<void> {
  try {
    const contextHash = hashContext(context);
    const entropyBucket = getEntropyBucket(context.entropyState);
    
    await supabase.rpc('record_prompt_selection', {
      p_prompt_id: promptId,
      p_context_hash: contextHash,
      p_entropy_bucket: entropyBucket,
      p_dwell_ms: dwellMs ?? null,
    });
  } catch (error) {
    console.warn('[telemetry] Failed to track selection:', error);
  }
}

/**
 * Track entropy delta after interaction.
 * Non-blocking - failures are logged but don't throw.
 */
export async function trackEntropyDelta(
  promptId: string,
  initialEntropy: number,
  finalEntropy: number
): Promise<void> {
  try {
    const delta = finalEntropy - initialEntropy;
    const initialBucket = getEntropyBucket(initialEntropy);
    
    await supabase.rpc('record_entropy_impact', {
      p_prompt_id: promptId,
      p_initial_bucket: initialBucket,
      p_delta: delta,
    });
  } catch (error) {
    console.warn('[telemetry] Failed to track entropy delta:', error);
  }
}
```

**Build gate:**
```bash
npm run typecheck
```

---

### Epic 9: React Hooks

**File to create:** `src/explore/hooks/usePromptTelemetry.ts`

```typescript
import { useCallback } from 'react';
import type { ExplorationContext } from '@/explore/types';
import {
  trackPromptImpression,
  trackPromptSelection,
  trackEntropyDelta,
} from '@/core/telemetry/prompt-events';

export function usePromptTelemetry() {
  const trackImpression = useCallback(
    (promptId: string, context: ExplorationContext) => {
      // Fire and forget
      trackPromptImpression(promptId, context);
    },
    []
  );

  const trackSelection = useCallback(
    (promptId: string, context: ExplorationContext, dwellMs?: number) => {
      trackPromptSelection(promptId, context, dwellMs);
    },
    []
  );

  const trackEntropyChange = useCallback(
    (promptId: string, initialEntropy: number, finalEntropy: number) => {
      trackEntropyDelta(promptId, initialEntropy, finalEntropy);
    },
    []
  );

  return {
    trackImpression,
    trackSelection,
    trackEntropyChange,
  };
}
```

**File to create:** `src/explore/hooks/usePromptRecommendations.ts`

```typescript
import { useState, useEffect, useMemo } from 'react';
import type { ExplorationContext } from '@/explore/types';
import type { Prompt } from '@/core/schema/prompt';
import { recommendPrompts, type RecommendationResult } from '../recommendation/recommend-prompts';
import { usePromptData } from '@/bedrock/consoles/PromptWorkshop/usePromptData';
import { usePromptTelemetry } from './usePromptTelemetry';

export interface UsePromptRecommendationsOptions {
  limit?: number;
  excludeIds?: string[];
  enabled?: boolean;
}

export function usePromptRecommendations(
  context: ExplorationContext | null,
  options: UsePromptRecommendationsOptions = {}
) {
  const { limit = 3, excludeIds = [], enabled = true } = options;
  const { prompts, isLoading: promptsLoading } = usePromptData();
  const { trackImpression } = usePromptTelemetry();
  
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Memoize excludeIds to prevent unnecessary re-renders
  const excludeKey = useMemo(() => excludeIds.sort().join(','), [excludeIds]);

  useEffect(() => {
    if (!enabled || !context || promptsLoading || prompts.length === 0) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    recommendPrompts(context, prompts, { limit, excludeIds })
      .then((newResult) => {
        if (cancelled) return;
        
        setResult(newResult);
        
        // Track impressions for recommended prompts
        newResult.prompts.forEach((p) => {
          trackImpression(p.meta.id, context);
        });
      })
      .catch((error) => {
        console.error('[recommendations] Failed:', error);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [context, prompts, limit, excludeKey, enabled, promptsLoading, trackImpression]);

  return {
    recommendations: result?.prompts ?? [],
    strategy: result?.strategy ?? 'explore',
    contextHash: result?.contextHash,
    isLoading: isLoading || promptsLoading,
    debug: result?.debug,
  };
}
```

**Build gate:**
```bash
npm run typecheck
npm test -- --grep "usePromptRecommendations"
```

---

### Epic 10: Integration

**Modify:** `src/explore/hooks/usePromptSuggestions.ts`

Replace existing scoring with recommendation engine:

```typescript
import { usePromptRecommendations } from './usePromptRecommendations';

export function usePromptSuggestions(context: ExplorationContext | null) {
  const { recommendations, strategy, isLoading } = usePromptRecommendations(context, {
    limit: 3,
    enabled: !!context,
  });

  return {
    suggestions: recommendations,
    strategy,
    isLoading,
  };
}
```

**Modify:** `src/terminal/components/PromptSuggestions.tsx` (if exists)

Add selection tracking:

```typescript
import { usePromptTelemetry } from '@/explore/hooks/usePromptTelemetry';

// In component:
const { trackSelection, trackEntropyChange } = usePromptTelemetry();
const selectionStartRef = useRef<number>(0);

const handlePromptClick = (prompt: Prompt) => {
  const dwellMs = Date.now() - selectionStartRef.current;
  trackSelection(prompt.meta.id, context, dwellMs);
  // ... existing click handling
};

// Track entropy after response
useEffect(() => {
  if (previousEntropy !== undefined && currentEntropy !== undefined && lastSelectedPromptId) {
    trackEntropyChange(lastSelectedPromptId, previousEntropy, currentEntropy);
  }
}, [currentEntropy]);
```

**Build gate:**
```bash
npm run dev
# Manual: Verify recommendations appear in Terminal
# Manual: Check Supabase for telemetry events
```

---

## Success Criteria

After completing all epics:

- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
- [ ] Recommendations appear in Terminal
- [ ] Different strategies for different entropy states
- [ ] Telemetry events recorded in Supabase
- [ ] Prompts show adaptive scoring data after interactions
- [ ] No performance degradation

---

## Prohibited Actions

- Do NOT add user profiles or user-level tracking
- Do NOT implement collaborative filtering
- Do NOT block UI on telemetry writes
- Do NOT modify existing prompt data (only add adaptiveScoring)
- Do NOT change Supabase table structure for prompts

---

## Completion

When all build gates pass and success criteria are met:

1. Create `docs/sprints/adaptive-prompt-recommendations-v1/DEV_LOG.md` with:
   - Summary of changes made
   - Any deviations from plan
   - Issues encountered and resolutions
   - Test results
   - Performance observations

2. Commit with message: `feat(recommendations): implement adaptive prompt recommendations with entropy-weighted contextual bandits`

3. Update sprint status in SPRINTS.md to "Complete"
