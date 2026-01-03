# Architecture: adaptive-prompt-recommendations-v1

**Sprint:** adaptive-prompt-recommendations-v1  
**Status:** Planning  
**Created:** 2026-01-03

---

## Architectural Overview

This system implements adaptive prompt recommendations using entropy-weighted contextual bandits. It operates in three layers:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                               │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ Terminal / Explorer UI                                           │    │
│  │   └── usePromptRecommendations() hook                           │    │
│  │         └── Displays recommended prompts                        │    │
│  │         └── Tracks impressions/selections                       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        RECOMMENDATION LAYER                              │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │ recommendPrompts(context, candidates, options)                   │    │
│  │   ├── getStrategyForEntropy(userEntropy)                        │    │
│  │   ├── hashContext(context)                                       │    │
│  │   ├── For each candidate:                                        │    │
│  │   │     ├── calculateBaseRelevance()      [existing]            │    │
│  │   │     ├── getEntropyMultiplier()        [new]                 │    │
│  │   │     ├── getUCBScore()                 [new]                 │    │
│  │   │     └── getFreshnessMultiplier()      [new]                 │    │
│  │   └── selectDiverse()                                            │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                      │
│  ┌────────────────────────┐  ┌────────────────────────────────────┐     │
│  │ Supabase: prompts      │  │ Supabase: prompt_telemetry        │     │
│  │   payload.adaptive     │  │   impressions, selections,        │     │
│  │   Scoring (JSONB)      │  │   entropy_deltas                  │     │
│  └────────────────────────┘  └────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Key Design Decisions

### Decision 1: No Collaborative Filtering

**Rationale:** 
- Avoids centralization of user data
- Prevents Sybil attacks (fake profiles boosting prompts)
- Eliminates filter bubbles from user similarity
- Aligns with Grove's privacy-first architecture

**Trade-off:** Slower learning for individual users. Mitigated by aggregate telemetry.

### Decision 2: Entropy as Primary Signal

**Rationale:**
- Aligns with Grove's exploration architecture thesis
- Measures actual epistemic impact, not just engagement
- Respects user autonomy (supports exploration, not addiction)
- Differentiates from engagement-optimizing systems

**Trade-off:** Requires accurate entropy measurement. Validate before relying on it.

### Decision 3: Contextual Bandits over Global Bandits

**Rationale:**
- Same prompt may perform differently in different contexts
- Lens + topic + entropy state creates meaningful segments
- Allows prompts to find their ideal context
- More data-efficient than global statistics

**Trade-off:** More complex, more arms to track. Context hashing keeps it manageable.

### Decision 4: UCB over Thompson Sampling

**Rationale:**
- Simpler to implement and debug
- Deterministic given same inputs (reproducible)
- Well-understood exploration/exploitation balance
- Doesn't require probability distribution assumptions

**Trade-off:** Slightly less optimal than Thompson Sampling in theory. Negligible in practice.

### Decision 5: Async Telemetry

**Rationale:**
- Don't block UI on telemetry writes
- Batch updates for efficiency
- Graceful degradation if telemetry fails
- No impact on recommendation latency

**Trade-off:** Small delay in learning. Acceptable for this use case.

---

## Component Architecture

### Context Hashing

```typescript
// src/core/telemetry/context-hash.ts

export interface ContextFeatures {
  activeLensId: string | null;
  topicCluster: string;
  entropyBucket: 'high' | 'medium' | 'low';
  sessionDepth: 'shallow' | 'medium' | 'deep';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
}

export function extractContextFeatures(context: ExplorationContext): ContextFeatures {
  return {
    activeLensId: context.activeLens?.meta.id ?? null,
    topicCluster: getTopicCluster(context.activeTopics),
    entropyBucket: getEntropyBucket(context.entropyState),
    sessionDepth: getSessionDepth(context.messageCount),
    timeOfDay: getTimeOfDay(new Date()),
  };
}

export function hashContext(context: ExplorationContext): string {
  const features = extractContextFeatures(context);
  
  // Stable, readable hash format
  return [
    `lens:${features.activeLensId ?? 'none'}`,
    `topic:${features.topicCluster}`,
    `entropy:${features.entropyBucket}`,
    `depth:${features.sessionDepth}`,
    `time:${features.timeOfDay}`,
  ].join('|');
}

// Helper functions
function getEntropyBucket(entropy: number | undefined): 'high' | 'medium' | 'low' {
  if (entropy === undefined) return 'medium';
  if (entropy > 0.7) return 'high';
  if (entropy < 0.3) return 'low';
  return 'medium';
}

function getTopicCluster(topics: string[]): string {
  if (topics.length === 0) return 'none';
  if (topics.length === 1) return topics[0];
  // Return most frequent topic or 'mixed'
  return topics[0] ?? 'mixed';
}

function getSessionDepth(messageCount: number): 'shallow' | 'medium' | 'deep' {
  if (messageCount < 5) return 'shallow';
  if (messageCount < 20) return 'medium';
  return 'deep';
}

function getTimeOfDay(date: Date): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}
```

### Entropy Strategy

```typescript
// src/explore/recommendation/entropy-strategy.ts

export type EntropyStrategy = 'clarify' | 'explore' | 'challenge';

export interface EntropyConfig {
  highThreshold: number;
  lowThreshold: number;
  clarifyMultipliers: { negative: number; positive: number; neutral: number };
  challengeMultipliers: { negative: number; positive: number; neutral: number };
  exploreMultipliers: { negative: number; positive: number; neutral: number };
}

export const DEFAULT_ENTROPY_CONFIG: EntropyConfig = {
  highThreshold: 0.7,
  lowThreshold: 0.3,
  clarifyMultipliers: { negative: 1.5, positive: 0.6, neutral: 1.0 },
  challengeMultipliers: { negative: 0.8, positive: 1.4, neutral: 1.0 },
  exploreMultipliers: { negative: 1.2, positive: 1.2, neutral: 1.0 },
};

export function getStrategyForEntropy(
  entropy: number,
  config: EntropyConfig = DEFAULT_ENTROPY_CONFIG
): EntropyStrategy {
  if (entropy > config.highThreshold) return 'clarify';
  if (entropy < config.lowThreshold) return 'challenge';
  return 'explore';
}

export function getEntropyMultiplier(
  entropyImpact: EntropyImpact | undefined,
  strategy: EntropyStrategy,
  config: EntropyConfig = DEFAULT_ENTROPY_CONFIG,
  minSamples: number = 10
): number {
  if (!entropyImpact || entropyImpact.samples < minSamples) {
    return 1.0; // Not enough data
  }
  
  const delta = entropyImpact.avgDelta;
  const multipliers = config[`${strategy}Multipliers`];
  
  if (delta < -0.1) return multipliers.negative;
  if (delta > 0.1) return multipliers.positive;
  return multipliers.neutral;
}
```

### Contextual Bandit

```typescript
// src/explore/recommendation/contextual-bandit.ts

export interface BanditConfig {
  explorationFactor: number;     // UCB exploration constant (default: 1.5)
  newContextBonus: number;       // Bonus for unseen contexts (default: 1.0)
  newPromptBonus: number;        // Bonus for new prompts (default: 1.3)
  minImpressionsForExploit: number;  // Min data before trusting success rate
}

export const DEFAULT_BANDIT_CONFIG: BanditConfig = {
  explorationFactor: 1.5,
  newContextBonus: 1.0,
  newPromptBonus: 1.3,
  minImpressionsForExploit: 5,
};

export function getUCBScore(
  arm: BanditArm | undefined,
  totalPulls: number,
  config: BanditConfig = DEFAULT_BANDIT_CONFIG
): number {
  if (!arm || arm.impressions === 0) {
    // New context - exploration bonus
    return 1.0 + config.newContextBonus;
  }
  
  if (arm.impressions < config.minImpressionsForExploit) {
    // Too few samples - high exploration
    return arm.successRate + config.explorationFactor * 2;
  }
  
  // UCB1 formula: μ + c * sqrt(ln(N) / n)
  const exploitation = arm.successRate;
  const exploration = config.explorationFactor * Math.sqrt(
    Math.log(totalPulls + 1) / arm.impressions
  );
  
  return exploitation + exploration;
}

export function updateArm(
  arm: BanditArm,
  wasSelected: boolean
): BanditArm {
  const newImpressions = arm.impressions + 1;
  const newSelections = arm.selections + (wasSelected ? 1 : 0);
  
  return {
    ...arm,
    impressions: newImpressions,
    selections: newSelections,
    successRate: newSelections / newImpressions,
    lastPull: new Date().toISOString(),
  };
}
```

### Diversity Selector

```typescript
// src/explore/recommendation/diversity-selector.ts

export interface DiversityConfig {
  minTopicDistance: number;      // 0-1, higher = more diverse
  maxSameSequence: number;       // Max prompts from same sequence
}

export const DEFAULT_DIVERSITY_CONFIG: DiversityConfig = {
  minTopicDistance: 0.3,
  maxSameSequence: 1,
};

export function selectDiverse(
  scored: ScoredPrompt[],
  limit: number,
  config: DiversityConfig = DEFAULT_DIVERSITY_CONFIG
): Prompt[] {
  const selected: Prompt[] = [];
  const usedTopics = new Set<string>();
  const sequenceCounts = new Map<string, number>();
  
  // Sort by score descending
  const sorted = [...scored]
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);
  
  for (const { prompt } of sorted) {
    if (selected.length >= limit) break;
    
    // Check topic diversity
    const promptTopics = prompt.payload.topicAffinities.map(a => a.topic);
    const topicOverlap = promptTopics.length > 0
      ? promptTopics.filter(t => usedTopics.has(t)).length / promptTopics.length
      : 0;
    
    if (topicOverlap > (1 - config.minTopicDistance) && selected.length > 0) {
      continue; // Too similar to already selected
    }
    
    // Check sequence diversity
    const sequences = prompt.payload.sequences ?? [];
    const wouldExceedSequenceLimit = sequences.some(seq => {
      const key = `${seq.groupType}:${seq.groupId}`;
      return (sequenceCounts.get(key) ?? 0) >= config.maxSameSequence;
    });
    
    if (wouldExceedSequenceLimit && selected.length > 0) {
      continue; // Too many from same sequence
    }
    
    // Accept this prompt
    selected.push(prompt);
    promptTopics.forEach(t => usedTopics.add(t));
    sequences.forEach(seq => {
      const key = `${seq.groupType}:${seq.groupId}`;
      sequenceCounts.set(key, (sequenceCounts.get(key) ?? 0) + 1);
    });
  }
  
  return selected;
}
```

### Main Recommendation Orchestrator

```typescript
// src/explore/recommendation/recommend-prompts.ts

export interface RecommendationOptions {
  limit?: number;
  explorationFactor?: number;
  minTopicDistance?: number;
  excludeIds?: string[];
}

export interface RecommendationResult {
  prompts: Prompt[];
  strategy: EntropyStrategy;
  contextHash: string;
  debug?: {
    candidateCount: number;
    scoredAboveZero: number;
    entropyState: number;
  };
}

export async function recommendPrompts(
  context: ExplorationContext,
  candidates: Prompt[],
  options: RecommendationOptions = {}
): Promise<RecommendationResult> {
  const {
    limit = 3,
    explorationFactor = 1.5,
    minTopicDistance = 0.3,
    excludeIds = [],
  } = options;
  
  // Derive context
  const userEntropy = context.entropyState ?? 0.5;
  const strategy = getStrategyForEntropy(userEntropy);
  const contextHash = hashContext(context);
  
  // Get total pulls for this context (for UCB denominator)
  const totalPulls = candidates.reduce((sum, p) => {
    const arm = p.payload.adaptiveScoring?.arms.find(a => a.contextHash === contextHash);
    return sum + (arm?.impressions ?? 0);
  }, 0);
  
  // Filter and score
  const scored = candidates
    .filter(p => !excludeIds.includes(p.meta.id))
    .filter(p => meetsTargeting(p, context))
    .map(prompt => {
      // Layer 1: Base relevance (existing algorithm)
      let score = calculateBaseRelevance(prompt, context);
      if (score === 0) return { prompt, score: 0 };
      
      // Layer 2: Entropy strategy multiplier
      const entropyMult = getEntropyMultiplier(
        prompt.payload.adaptiveScoring?.entropyImpact,
        strategy
      );
      score *= entropyMult;
      
      // Layer 3: UCB exploration/exploitation
      const arm = prompt.payload.adaptiveScoring?.arms.find(
        a => a.contextHash === contextHash
      );
      const ucbScore = getUCBScore(arm, totalPulls, { explorationFactor });
      score *= ucbScore;
      
      // Layer 4: Freshness
      score *= getFreshnessMultiplier(prompt);
      
      // Layer 5: New prompt bonus
      if (prompt.payload.adaptiveScoring?.isNew) {
        score *= DEFAULT_BANDIT_CONFIG.newPromptBonus;
      }
      
      return { prompt, score };
    });
  
  // Select diverse results
  const prompts = selectDiverse(scored, limit, { minTopicDistance });
  
  return {
    prompts,
    strategy,
    contextHash,
    debug: {
      candidateCount: candidates.length,
      scoredAboveZero: scored.filter(s => s.score > 0).length,
      entropyState: userEntropy,
    },
  };
}

function getFreshnessMultiplier(prompt: Prompt): number {
  const lastShow = prompt.payload.adaptiveScoring?.lastGlobalShow;
  if (!lastShow) return 1.0;
  
  const hoursSince = (Date.now() - new Date(lastShow).getTime()) / (1000 * 60 * 60);
  return Math.min(1.0, 0.5 + (hoursSince / 48));
}
```

---

## Database Schema

### Telemetry Tables

```sql
-- supabase/migrations/YYYYMMDD_adaptive_scoring.sql

-- Event log for impressions
CREATE TABLE prompt_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  context_hash TEXT NOT NULL,
  entropy_bucket TEXT NOT NULL CHECK (entropy_bucket IN ('high', 'medium', 'low')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prompt_impressions_prompt ON prompt_impressions(prompt_id);
CREATE INDEX idx_prompt_impressions_context ON prompt_impressions(context_hash);

-- Event log for selections
CREATE TABLE prompt_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  context_hash TEXT NOT NULL,
  entropy_bucket TEXT NOT NULL CHECK (entropy_bucket IN ('high', 'medium', 'low')),
  dwell_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prompt_selections_prompt ON prompt_selections(prompt_id);

-- Event log for entropy deltas
CREATE TABLE prompt_entropy_deltas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  initial_bucket TEXT NOT NULL CHECK (initial_bucket IN ('high', 'medium', 'low')),
  delta FLOAT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prompt_entropy_prompt ON prompt_entropy_deltas(prompt_id);
```

### RPC Functions

```sql
-- Increment impressions and update adaptive scoring
CREATE OR REPLACE FUNCTION increment_prompt_impressions(
  p_prompt_id UUID,
  p_context_hash TEXT,
  p_entropy_bucket TEXT
) RETURNS VOID AS $$
DECLARE
  v_payload JSONB;
  v_arms JSONB;
  v_arm_index INT;
BEGIN
  -- Log the impression
  INSERT INTO prompt_impressions (prompt_id, context_hash, entropy_bucket)
  VALUES (p_prompt_id, p_context_hash, p_entropy_bucket);
  
  -- Update adaptive scoring in prompt payload
  SELECT payload INTO v_payload FROM prompts WHERE id = p_prompt_id;
  
  IF v_payload IS NULL THEN
    RETURN;
  END IF;
  
  -- Initialize adaptive scoring if not present
  IF v_payload->'adaptiveScoring' IS NULL THEN
    v_payload = jsonb_set(v_payload, '{adaptiveScoring}', '{
      "arms": [],
      "entropyImpact": {"avgDelta": 0, "samples": 0, "byInitialState": {
        "high": {"avgDelta": 0, "samples": 0},
        "medium": {"avgDelta": 0, "samples": 0},
        "low": {"avgDelta": 0, "samples": 0}
      }},
      "lastGlobalShow": null,
      "showVelocity": 0,
      "isNew": true,
      "explorationBonus": 1.3
    }');
  END IF;
  
  -- Find or create arm for this context
  v_arms = COALESCE(v_payload->'adaptiveScoring'->'arms', '[]'::jsonb);
  
  SELECT i INTO v_arm_index
  FROM jsonb_array_elements(v_arms) WITH ORDINALITY AS a(elem, i)
  WHERE a.elem->>'contextHash' = p_context_hash;
  
  IF v_arm_index IS NULL THEN
    -- Create new arm
    v_arms = v_arms || jsonb_build_object(
      'contextHash', p_context_hash,
      'successRate', 0,
      'impressions', 1,
      'selections', 0,
      'lastPull', NOW()
    );
  ELSE
    -- Update existing arm impressions
    v_arms = jsonb_set(
      v_arms,
      ARRAY[(v_arm_index - 1)::text, 'impressions'],
      to_jsonb((v_arms->>(v_arm_index - 1)::text->>'impressions')::int + 1)
    );
    v_arms = jsonb_set(
      v_arms,
      ARRAY[(v_arm_index - 1)::text, 'lastPull'],
      to_jsonb(NOW())
    );
  END IF;
  
  -- Update payload
  v_payload = jsonb_set(v_payload, '{adaptiveScoring,arms}', v_arms);
  v_payload = jsonb_set(v_payload, '{adaptiveScoring,lastGlobalShow}', to_jsonb(NOW()));
  
  -- Check if still "new" (< 50 total impressions)
  IF (SELECT SUM((elem->>'impressions')::int) FROM jsonb_array_elements(v_arms) AS elem) >= 50 THEN
    v_payload = jsonb_set(v_payload, '{adaptiveScoring,isNew}', 'false');
  END IF;
  
  UPDATE prompts SET payload = v_payload WHERE id = p_prompt_id;
END;
$$ LANGUAGE plpgsql;
```

---

## React Integration

### usePromptRecommendations Hook

```typescript
// src/explore/hooks/usePromptRecommendations.ts

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
  
  const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (!enabled || !context || promptsLoading) return;
    
    setIsLoading(true);
    
    recommendPrompts(context, prompts, { limit, excludeIds })
      .then(result => {
        setRecommendations(result);
        
        // Track impressions (async, don't await)
        result.prompts.forEach(p => {
          trackImpression(p.meta.id, context);
        });
      })
      .finally(() => setIsLoading(false));
  }, [context, prompts, limit, excludeIds.join(','), enabled, promptsLoading]);
  
  return {
    recommendations: recommendations?.prompts ?? [],
    strategy: recommendations?.strategy ?? 'explore',
    contextHash: recommendations?.contextHash,
    isLoading: isLoading || promptsLoading,
    debug: recommendations?.debug,
  };
}
```

### usePromptTelemetry Hook

```typescript
// src/explore/hooks/usePromptTelemetry.ts

export function usePromptTelemetry() {
  const trackImpression = useCallback(async (
    promptId: string,
    context: ExplorationContext
  ) => {
    try {
      await trackPromptImpression(promptId, context);
    } catch (e) {
      console.warn('Failed to track impression:', e);
      // Don't throw - telemetry failure shouldn't break UX
    }
  }, []);
  
  const trackSelection = useCallback(async (
    promptId: string,
    context: ExplorationContext,
    dwellMs: number
  ) => {
    try {
      await trackPromptSelection(promptId, context, dwellMs);
    } catch (e) {
      console.warn('Failed to track selection:', e);
    }
  }, []);
  
  const trackEntropyChange = useCallback(async (
    promptId: string,
    initialEntropy: number,
    finalEntropy: number
  ) => {
    try {
      await trackEntropyDelta(promptId, initialEntropy, finalEntropy);
    } catch (e) {
      console.warn('Failed to track entropy delta:', e);
    }
  }, []);
  
  return {
    trackImpression,
    trackSelection,
    trackEntropyChange,
  };
}
```

---

## File Structure

```
src/
├── core/
│   ├── schema/
│   │   ├── prompt.ts                    # Add adaptiveScoring field
│   │   └── adaptive-scoring.ts          # NEW: AdaptiveScoring types
│   └── telemetry/
│       ├── prompt-events.ts             # NEW: Event tracking functions
│       └── context-hash.ts              # NEW: Context encoding
├── explore/
│   ├── recommendation/
│   │   ├── entropy-strategy.ts          # NEW: Strategy selection
│   │   ├── contextual-bandit.ts         # NEW: UCB implementation
│   │   ├── diversity-selector.ts        # NEW: Diverse selection
│   │   ├── recommend-prompts.ts         # NEW: Main orchestrator
│   │   └── config.ts                    # NEW: Configurable parameters
│   ├── hooks/
│   │   ├── usePromptRecommendations.ts  # NEW: React hook
│   │   ├── usePromptTelemetry.ts        # NEW: Telemetry hook
│   │   └── usePromptSuggestions.ts      # MODIFY: Use new engine
│   └── utils/
│       └── scorePrompt.ts               # MODIFY: Integrate adaptive scoring

supabase/
├── migrations/
│   └── YYYYMMDD_adaptive_scoring.sql    # NEW: Telemetry tables
└── functions/
    ├── increment_prompt_impressions.sql # NEW: RPC
    ├── record_prompt_selection.sql      # NEW: RPC
    └── record_entropy_impact.sql        # NEW: RPC
```

---

## Testing Strategy

### Unit Tests

| Test File | Coverage |
|-----------|----------|
| `entropy-strategy.test.ts` | Strategy selection, multiplier calculation |
| `contextual-bandit.test.ts` | UCB scoring, arm updates |
| `diversity-selector.test.ts` | Topic diversity, sequence limits |
| `recommend-prompts.test.ts` | Full pipeline integration |
| `context-hash.test.ts` | Hash stability, feature extraction |

### Integration Tests

| Test | Purpose |
|------|---------|
| Recommendation with real prompts | Verify scoring produces sensible results |
| Telemetry round-trip | Verify events update adaptive scoring |
| Hook integration | Verify React hooks work with context |

### E2E Tests

| Test | Purpose |
|------|---------|
| Browse → recommendations appear | User sees contextual prompts |
| Select prompt → telemetry fires | Events recorded correctly |
| Repeat interactions → recommendations adapt | Learning observed over time |

---

## Performance Considerations

### Optimization Points

1. **Context hash caching:** Don't recompute hash if context unchanged
2. **Arm lookup:** Index arms by contextHash in memory
3. **Batch telemetry:** Queue events, flush periodically
4. **Lazy loading:** Only fetch adaptive scoring when needed

### Expected Performance

| Operation | Target Latency |
|-----------|----------------|
| recommendPrompts() | < 50ms |
| trackImpression() | < 10ms (async) |
| hashContext() | < 1ms |
| Database RPC | < 100ms |

---

## Future Considerations

### A/B Testing

Future sprint could add:
- Split traffic between old and new recommendation algorithms
- Measure selection rate, completion rate, entropy resolution
- Statistical significance testing

### Advanced Features

- **Time-decay on arms:** Older data weighted less
- **Seasonal patterns:** Time-of-week effects
- **Cross-prompt relationships:** "Users who selected X also selected Y"
- **Exploration scheduling:** More exploration during low-traffic periods
