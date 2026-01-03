# Migration Map: adaptive-prompt-recommendations-v1

**Sprint:** adaptive-prompt-recommendations-v1  
**Created:** 2026-01-03  
**Prerequisites:** prompt-schema-rationalization-v1 must be complete

---

## Overview

This sprint adds adaptive scoring capabilities to the existing prompt system. It's an **additive migration** — existing prompts continue to work, and adaptive scoring is optional until telemetry populates the data.

---

## Schema Migration

### New Type: AdaptiveScoring

**File:** `src/core/schema/adaptive-scoring.ts` (NEW)

```typescript
export interface BanditArm {
  contextHash: string;
  successRate: number;
  impressions: number;
  selections: number;
  lastPull: string;
}

export interface EntropyImpact {
  avgDelta: number;
  samples: number;
  byInitialState: {
    high: { avgDelta: number; samples: number };
    medium: { avgDelta: number; samples: number };
    low: { avgDelta: number; samples: number };
  };
}

export interface AdaptiveScoring {
  arms: BanditArm[];
  entropyImpact: EntropyImpact;
  lastGlobalShow: string | null;
  showVelocity: number;
  isNew: boolean;
  explorationBonus: number;
}
```

### PromptPayload Extension

**File:** `src/core/schema/prompt.ts`

```typescript
// ADD import
import type { AdaptiveScoring } from './adaptive-scoring';

// ADD to PromptPayload interface
interface PromptPayload {
  // ... existing fields ...
  
  adaptiveScoring?: AdaptiveScoring;  // NEW - optional
}
```

---

## Database Migration

### New Tables

```sql
-- File: supabase/migrations/YYYYMMDD_adaptive_scoring.sql

-- Impressions log
CREATE TABLE prompt_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  context_hash TEXT NOT NULL,
  entropy_bucket TEXT NOT NULL CHECK (entropy_bucket IN ('high', 'medium', 'low')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prompt_impressions_prompt ON prompt_impressions(prompt_id);
CREATE INDEX idx_prompt_impressions_context ON prompt_impressions(context_hash);
CREATE INDEX idx_prompt_impressions_time ON prompt_impressions(created_at);

-- Selections log
CREATE TABLE prompt_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  context_hash TEXT NOT NULL,
  entropy_bucket TEXT NOT NULL CHECK (entropy_bucket IN ('high', 'medium', 'low')),
  dwell_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prompt_selections_prompt ON prompt_selections(prompt_id);
CREATE INDEX idx_prompt_selections_time ON prompt_selections(created_at);

-- Entropy delta log
CREATE TABLE prompt_entropy_deltas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
  initial_bucket TEXT NOT NULL CHECK (initial_bucket IN ('high', 'medium', 'low')),
  delta FLOAT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prompt_entropy_prompt ON prompt_entropy_deltas(prompt_id);
CREATE INDEX idx_prompt_entropy_time ON prompt_entropy_deltas(created_at);

-- Aggregated stats view (for analytics)
CREATE VIEW prompt_telemetry_stats AS
SELECT 
  p.id AS prompt_id,
  p.meta->>'title' AS prompt_title,
  COUNT(DISTINCT pi.id) AS total_impressions,
  COUNT(DISTINCT ps.id) AS total_selections,
  CASE WHEN COUNT(DISTINCT pi.id) > 0 
    THEN COUNT(DISTINCT ps.id)::FLOAT / COUNT(DISTINCT pi.id)
    ELSE 0 
  END AS selection_rate,
  AVG(ped.delta) AS avg_entropy_delta,
  COUNT(DISTINCT ped.id) AS entropy_samples
FROM prompts p
LEFT JOIN prompt_impressions pi ON p.id = pi.prompt_id
LEFT JOIN prompt_selections ps ON p.id = ps.prompt_id
LEFT JOIN prompt_entropy_deltas ped ON p.id = ped.prompt_id
GROUP BY p.id;
```

### RPC Functions

```sql
-- File: supabase/functions/increment_prompt_impressions.sql

CREATE OR REPLACE FUNCTION increment_prompt_impressions(
  p_prompt_id UUID,
  p_context_hash TEXT,
  p_entropy_bucket TEXT
) RETURNS VOID AS $$
DECLARE
  v_payload JSONB;
  v_adaptive JSONB;
  v_arms JSONB;
  v_arm_index INT;
  v_total_impressions INT;
BEGIN
  -- Log the impression event
  INSERT INTO prompt_impressions (prompt_id, context_hash, entropy_bucket)
  VALUES (p_prompt_id, p_context_hash, p_entropy_bucket);
  
  -- Get current payload
  SELECT payload INTO v_payload FROM prompts WHERE id = p_prompt_id;
  IF v_payload IS NULL THEN RETURN; END IF;
  
  -- Initialize adaptive scoring if needed
  v_adaptive = v_payload->'adaptiveScoring';
  IF v_adaptive IS NULL THEN
    v_adaptive = jsonb_build_object(
      'arms', '[]'::jsonb,
      'entropyImpact', jsonb_build_object(
        'avgDelta', 0,
        'samples', 0,
        'byInitialState', jsonb_build_object(
          'high', jsonb_build_object('avgDelta', 0, 'samples', 0),
          'medium', jsonb_build_object('avgDelta', 0, 'samples', 0),
          'low', jsonb_build_object('avgDelta', 0, 'samples', 0)
        )
      ),
      'lastGlobalShow', NULL,
      'showVelocity', 0,
      'isNew', true,
      'explorationBonus', 1.3
    );
  END IF;
  
  -- Find arm for this context
  v_arms = v_adaptive->'arms';
  SELECT ordinality - 1 INTO v_arm_index
  FROM jsonb_array_elements(v_arms) WITH ORDINALITY
  WHERE value->>'contextHash' = p_context_hash;
  
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
    -- Update existing arm
    v_arms = jsonb_set(v_arms, ARRAY[v_arm_index::TEXT, 'impressions'],
      to_jsonb((v_arms->v_arm_index->>'impressions')::INT + 1));
    v_arms = jsonb_set(v_arms, ARRAY[v_arm_index::TEXT, 'lastPull'],
      to_jsonb(NOW()::TEXT));
  END IF;
  
  -- Update adaptive scoring
  v_adaptive = jsonb_set(v_adaptive, '{arms}', v_arms);
  v_adaptive = jsonb_set(v_adaptive, '{lastGlobalShow}', to_jsonb(NOW()::TEXT));
  
  -- Check if still "new"
  SELECT SUM((elem->>'impressions')::INT) INTO v_total_impressions
  FROM jsonb_array_elements(v_arms) AS elem;
  
  IF v_total_impressions >= 50 THEN
    v_adaptive = jsonb_set(v_adaptive, '{isNew}', 'false');
  END IF;
  
  -- Save back to prompt
  UPDATE prompts 
  SET payload = jsonb_set(v_payload, '{adaptiveScoring}', v_adaptive)
  WHERE id = p_prompt_id;
END;
$$ LANGUAGE plpgsql;
```

```sql
-- File: supabase/functions/record_prompt_selection.sql

CREATE OR REPLACE FUNCTION record_prompt_selection(
  p_prompt_id UUID,
  p_context_hash TEXT,
  p_entropy_bucket TEXT,
  p_dwell_ms INTEGER DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  v_payload JSONB;
  v_adaptive JSONB;
  v_arms JSONB;
  v_arm_index INT;
  v_impressions INT;
  v_selections INT;
BEGIN
  -- Log the selection event
  INSERT INTO prompt_selections (prompt_id, context_hash, entropy_bucket, dwell_ms)
  VALUES (p_prompt_id, p_context_hash, p_entropy_bucket, p_dwell_ms);
  
  -- Get current payload
  SELECT payload INTO v_payload FROM prompts WHERE id = p_prompt_id;
  IF v_payload IS NULL OR v_payload->'adaptiveScoring' IS NULL THEN RETURN; END IF;
  
  v_adaptive = v_payload->'adaptiveScoring';
  v_arms = v_adaptive->'arms';
  
  -- Find arm for this context
  SELECT ordinality - 1 INTO v_arm_index
  FROM jsonb_array_elements(v_arms) WITH ORDINALITY
  WHERE value->>'contextHash' = p_context_hash;
  
  IF v_arm_index IS NOT NULL THEN
    -- Update selections and success rate
    v_selections = (v_arms->v_arm_index->>'selections')::INT + 1;
    v_impressions = (v_arms->v_arm_index->>'impressions')::INT;
    
    v_arms = jsonb_set(v_arms, ARRAY[v_arm_index::TEXT, 'selections'], to_jsonb(v_selections));
    v_arms = jsonb_set(v_arms, ARRAY[v_arm_index::TEXT, 'successRate'], 
      to_jsonb(v_selections::FLOAT / GREATEST(v_impressions, 1)));
    
    v_adaptive = jsonb_set(v_adaptive, '{arms}', v_arms);
    
    UPDATE prompts 
    SET payload = jsonb_set(v_payload, '{adaptiveScoring}', v_adaptive)
    WHERE id = p_prompt_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
```

```sql
-- File: supabase/functions/record_entropy_impact.sql

CREATE OR REPLACE FUNCTION record_entropy_impact(
  p_prompt_id UUID,
  p_initial_bucket TEXT,
  p_delta FLOAT
) RETURNS VOID AS $$
DECLARE
  v_payload JSONB;
  v_adaptive JSONB;
  v_impact JSONB;
  v_bucket_stats JSONB;
  v_old_avg FLOAT;
  v_old_samples INT;
  v_new_avg FLOAT;
  v_new_samples INT;
BEGIN
  -- Log the entropy delta event
  INSERT INTO prompt_entropy_deltas (prompt_id, initial_bucket, delta)
  VALUES (p_prompt_id, p_initial_bucket, p_delta);
  
  -- Get current payload
  SELECT payload INTO v_payload FROM prompts WHERE id = p_prompt_id;
  IF v_payload IS NULL OR v_payload->'adaptiveScoring' IS NULL THEN RETURN; END IF;
  
  v_adaptive = v_payload->'adaptiveScoring';
  v_impact = v_adaptive->'entropyImpact';
  
  -- Update global average (incremental mean)
  v_old_avg = (v_impact->>'avgDelta')::FLOAT;
  v_old_samples = (v_impact->>'samples')::INT;
  v_new_samples = v_old_samples + 1;
  v_new_avg = v_old_avg + (p_delta - v_old_avg) / v_new_samples;
  
  v_impact = jsonb_set(v_impact, '{avgDelta}', to_jsonb(v_new_avg));
  v_impact = jsonb_set(v_impact, '{samples}', to_jsonb(v_new_samples));
  
  -- Update bucket-specific stats
  v_bucket_stats = v_impact->'byInitialState'->p_initial_bucket;
  v_old_avg = (v_bucket_stats->>'avgDelta')::FLOAT;
  v_old_samples = (v_bucket_stats->>'samples')::INT;
  v_new_samples = v_old_samples + 1;
  v_new_avg = v_old_avg + (p_delta - v_old_avg) / v_new_samples;
  
  v_bucket_stats = jsonb_set(v_bucket_stats, '{avgDelta}', to_jsonb(v_new_avg));
  v_bucket_stats = jsonb_set(v_bucket_stats, '{samples}', to_jsonb(v_new_samples));
  v_impact = jsonb_set(v_impact, ARRAY['byInitialState', p_initial_bucket], v_bucket_stats);
  
  v_adaptive = jsonb_set(v_adaptive, '{entropyImpact}', v_impact);
  
  UPDATE prompts 
  SET payload = jsonb_set(v_payload, '{adaptiveScoring}', v_adaptive)
  WHERE id = p_prompt_id;
END;
$$ LANGUAGE plpgsql;
```

---

## Code Migration

### Files to Create

| File | Content |
|------|---------|
| `src/core/schema/adaptive-scoring.ts` | Type definitions |
| `src/core/telemetry/prompt-events.ts` | Event tracking functions |
| `src/core/telemetry/context-hash.ts` | Context encoding |
| `src/explore/recommendation/entropy-strategy.ts` | Strategy selection |
| `src/explore/recommendation/contextual-bandit.ts` | UCB implementation |
| `src/explore/recommendation/diversity-selector.ts` | Diverse selection |
| `src/explore/recommendation/recommend-prompts.ts` | Main orchestrator |
| `src/explore/recommendation/config.ts` | Configurable parameters |
| `src/explore/hooks/usePromptRecommendations.ts` | React hook |
| `src/explore/hooks/usePromptTelemetry.ts` | Telemetry hook |

### Files to Modify

| File | Changes |
|------|---------|
| `src/core/schema/prompt.ts` | Add `adaptiveScoring?: AdaptiveScoring` |
| `src/explore/hooks/usePromptSuggestions.ts` | Integrate recommendation engine |
| `src/explore/utils/scorePrompt.ts` | Use adaptive scoring if available |
| `src/terminal/components/PromptSuggestions.tsx` | Track impressions/selections |

---

## Backward Compatibility

### Prompts Without AdaptiveScoring

```typescript
// In recommend-prompts.ts
function getEntropyMultiplier(
  entropyImpact: EntropyImpact | undefined,
  strategy: EntropyStrategy
): number {
  // If no adaptive data, return neutral multiplier
  if (!entropyImpact || entropyImpact.samples < MIN_SAMPLES) {
    return 1.0;
  }
  // ... normal calculation
}

function getUCBScore(
  arm: BanditArm | undefined,
  totalPulls: number
): number {
  // If no arm data, return exploration bonus
  if (!arm || arm.impressions === 0) {
    return 1.0 + EXPLORATION_BONUS;
  }
  // ... normal calculation
}
```

### Existing scorePrompt Function

```typescript
// In scorePrompt.ts
export function scorePrompt(prompt: Prompt, context: ExplorationContext): number {
  // Existing base calculation
  let score = calculateBaseRelevance(prompt, context);
  
  // NEW: Apply adaptive scoring if available
  if (prompt.payload.adaptiveScoring) {
    const strategy = getStrategyForEntropy(context.entropyState);
    score *= getEntropyMultiplier(prompt.payload.adaptiveScoring.entropyImpact, strategy);
    // Note: Full UCB scoring happens in recommend-prompts.ts
  }
  
  return score;
}
```

---

## Rollback Strategy

### If Issues Arise

1. **Disable telemetry:** Set feature flag to skip event tracking
2. **Disable adaptive scoring:** Fall back to base relevance only
3. **Drop tables:** Telemetry tables are independent, can be dropped safely

```typescript
// Feature flags in config
export const RECOMMENDATION_FLAGS = {
  enableAdaptiveScoring: true,     // Set false to disable
  enableTelemetry: true,           // Set false to stop tracking
  fallbackToBaseRelevance: false,  // Set true to ignore adaptive data
};
```

---

## Deployment Order

1. **Deploy schema changes** (additive, no breaking changes)
2. **Deploy database migration** (new tables, RPC functions)
3. **Deploy recommendation engine** (new files)
4. **Deploy telemetry tracking** (start collecting data)
5. **Deploy UI integration** (show adaptive recommendations)
6. **Monitor and tune** (adjust exploration factor, thresholds)

---

## Data Initialization

New prompts start with:
```json
{
  "adaptiveScoring": {
    "arms": [],
    "entropyImpact": {
      "avgDelta": 0,
      "samples": 0,
      "byInitialState": {
        "high": { "avgDelta": 0, "samples": 0 },
        "medium": { "avgDelta": 0, "samples": 0 },
        "low": { "avgDelta": 0, "samples": 0 }
      }
    },
    "lastGlobalShow": null,
    "showVelocity": 0,
    "isNew": true,
    "explorationBonus": 1.3
  }
}
```

Existing prompts: `adaptiveScoring` will be `undefined` until first impression.
