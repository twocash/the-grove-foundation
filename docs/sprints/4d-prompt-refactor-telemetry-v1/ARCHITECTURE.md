# Architecture: 4D Prompt Telemetry Infrastructure
**Sprint:** 4d-prompt-refactor-telemetry-v1  
**Version:** 1.0  
**Author:** Foundation Loop (Claude)

---

## 1. Architecture Overview

### 1.1 Design Principles

1. **Strangler Fig**: New infrastructure wraps existing code, never modifies it
2. **Bedrock First**: All new types and utilities live in `src/core/`
3. **Declarative**: Event types and schema defined in configuration
4. **Non-Blocking**: Telemetry failures never break user experience
5. **Provenance**: Every event traceable to source prompt and context

### 1.2 Layer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      SURFACE LAYER                               │
│  (Terminal, Kinetic Stream, Marketing MVP)                       │
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────┐                   │
│  │ ExploreShell     │    │ PromptCarousel   │                   │
│  │ (displays prompts)│    │ (suggestion UI)  │                   │
│  └────────┬─────────┘    └────────┬─────────┘                   │
│           │                       │                              │
│           └───────────┬───────────┘                              │
│                       ▼                                          │
│           ┌───────────────────────┐                              │
│           │ usePromptSuggestions  │ ← Existing hook              │
│           └───────────┬───────────┘                              │
└───────────────────────┼──────────────────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────────────────┐
│                      ADAPTER LAYER (NEW)                          │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                  usePromptTelemetry                          │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐    │ │
│  │  │recordImpress│ │recordSelect │ │recordCompletion    │    │ │
│  │  └─────────────┘ └─────────────┘ └─────────────────────┘    │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                    │
└──────────────────────────────┼────────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────────────┐
│                      CORE/BEDROCK LAYER                           │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                src/core/telemetry/                           │ │
│  │                                                              │ │
│  │  types.ts          # PromptTelemetryEvent, EventType        │ │
│  │  client.ts         # API client for telemetry endpoints     │ │
│  │  batch.ts          # Batching/debouncing logic              │ │
│  │  usePromptTelemetry.ts  # React hook                        │ │
│  │  index.ts          # Re-exports                              │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                    │
└──────────────────────────────┼────────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────────────┐
│                      SERVER LAYER                                 │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                server.js (extensions)                        │ │
│  │                                                              │ │
│  │  POST /api/telemetry/prompt        # Single event           │ │
│  │  POST /api/telemetry/prompt/batch  # Batched events         │ │
│  │  GET  /api/telemetry/prompt/:id/stats  # Prompt stats       │ │
│  │  GET  /api/telemetry/prompts/performance  # List all        │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                              │                                    │
└──────────────────────────────┼────────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────────────┐
│                      DATA LAYER (Supabase)                        │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  prompt_telemetry (table)                                   │ │
│  │  prompt_performance (view)                                  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Specifications

### 2.1 Core Types (`src/core/telemetry/types.ts`)

```typescript
// Event types as const for type safety and declarative config
export const PROMPT_TELEMETRY_EVENT_TYPES = [
  'impression',
  'selection', 
  'completion',
  'feedback',
  'skip'
] as const;

export type PromptTelemetryEventType = typeof PROMPT_TELEMETRY_EVENT_TYPES[number];

/**
 * Context snapshot at time of event
 * Mirrors ContextState but flattened for storage
 */
export interface TelemetryContext {
  stage: Stage;
  lensId: string | null;
  entropy: number;
  interactionCount: number;
  activeTopics: string[];
  activeMoments: string[];
}

/**
 * Scoring details explaining why prompt was surfaced
 */
export interface TelemetryScoringDetails {
  finalScore: number;
  rank: number;
  matchDetails: {
    stageMatch: boolean;
    lensWeight: number;
    topicWeight: number;
    momentBoost: number;
    baseWeight: number;
  };
}

/**
 * Outcome metrics (populated async after completion)
 */
export interface TelemetryOutcome {
  dwellTimeMs: number;
  entropyDelta: number;
  followUpPromptId?: string;
}

/**
 * Full telemetry event for transmission
 */
export interface PromptTelemetryEvent {
  eventType: PromptTelemetryEventType;
  promptId: string;
  sessionId: string;
  timestamp: number;
  context: TelemetryContext;
  scoring?: TelemetryScoringDetails;
  outcome?: TelemetryOutcome;
}

/**
 * Aggregated stats returned from API
 */
export interface PromptStats {
  promptId: string;
  impressions: number;
  selections: number;
  completions: number;
  selectionRate: number;
  avgEntropyDelta: number | null;
  avgDwellTimeMs: number | null;
  lastSurfaced: string | null;
}
```

### 2.2 API Client (`src/core/telemetry/client.ts`)

```typescript
import type { PromptTelemetryEvent, PromptStats } from './types';

const TELEMETRY_BASE_URL = '/api/telemetry';

/**
 * Submit a single telemetry event
 */
export async function submitTelemetryEvent(
  event: PromptTelemetryEvent
): Promise<{ id: string; status: string }> {
  const response = await fetch(`${TELEMETRY_BASE_URL}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(event),
  });
  
  if (!response.ok) {
    throw new Error(`Telemetry submission failed: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Submit batch of telemetry events (for impressions)
 */
export async function submitTelemetryBatch(
  events: PromptTelemetryEvent[]
): Promise<{ count: number; status: string }> {
  const response = await fetch(`${TELEMETRY_BASE_URL}/prompt/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events }),
  });
  
  if (!response.ok) {
    throw new Error(`Telemetry batch failed: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Get stats for a specific prompt
 */
export async function getPromptStats(promptId: string): Promise<PromptStats> {
  const response = await fetch(`${TELEMETRY_BASE_URL}/prompt/${encodeURIComponent(promptId)}/stats`);
  
  if (!response.ok) {
    throw new Error(`Stats fetch failed: ${response.status}`);
  }
  
  return response.json();
}

/**
 * List all prompt performance
 */
export async function listPromptPerformance(options?: {
  limit?: number;
  sort?: keyof PromptStats;
  order?: 'asc' | 'desc';
}): Promise<{ prompts: PromptStats[]; total: number }> {
  const params = new URLSearchParams();
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.sort) params.set('sort', options.sort);
  if (options?.order) params.set('order', options.order);
  
  const response = await fetch(`${TELEMETRY_BASE_URL}/prompts/performance?${params}`);
  
  if (!response.ok) {
    throw new Error(`Performance list failed: ${response.status}`);
  }
  
  return response.json();
}
```

### 2.3 Batching Utility (`src/core/telemetry/batch.ts`)

```typescript
import type { PromptTelemetryEvent } from './types';
import { submitTelemetryBatch } from './client';

/**
 * Creates a batching queue that flushes after delay or max size
 */
export function createTelemetryBatcher(options: {
  maxSize?: number;
  flushDelayMs?: number;
  onError?: (error: Error, events: PromptTelemetryEvent[]) => void;
}) {
  const { maxSize = 10, flushDelayMs = 100, onError } = options;
  
  let queue: PromptTelemetryEvent[] = [];
  let flushTimeout: ReturnType<typeof setTimeout> | null = null;
  
  const flush = async () => {
    if (queue.length === 0) return;
    
    const batch = [...queue];
    queue = [];
    flushTimeout = null;
    
    try {
      await submitTelemetryBatch(batch);
    } catch (error) {
      onError?.(error as Error, batch);
    }
  };
  
  const add = (event: PromptTelemetryEvent) => {
    queue.push(event);
    
    if (queue.length >= maxSize) {
      if (flushTimeout) clearTimeout(flushTimeout);
      flush();
    } else if (!flushTimeout) {
      flushTimeout = setTimeout(flush, flushDelayMs);
    }
  };
  
  return { add, flush };
}
```

### 2.4 React Hook (`src/core/telemetry/usePromptTelemetry.ts`)

```typescript
import { useCallback, useRef, useEffect } from 'react';
import type { PromptObject, ContextState, ScoredPrompt } from '@core/context-fields/types';
import type { PromptTelemetryEvent, TelemetryOutcome } from './types';
import { submitTelemetryEvent } from './client';
import { createTelemetryBatcher } from './batch';

interface UsePromptTelemetryOptions {
  sessionId: string;
  enabled?: boolean;
}

/**
 * Hook for recording prompt telemetry events
 * 
 * Usage:
 * ```tsx
 * const { recordImpressions, recordSelection, recordCompletion } = usePromptTelemetry({
 *   sessionId: session.id,
 * });
 * 
 * // When prompts are displayed
 * useEffect(() => {
 *   recordImpressions(scoredPrompts, contextState);
 * }, [scoredPrompts]);
 * 
 * // When user selects a prompt
 * const handlePromptClick = (promptId: string) => {
 *   recordSelection(promptId);
 *   // ... handle prompt execution
 * };
 * 
 * // When AI response completes
 * recordCompletion(promptId, { dwellTimeMs: 5000, entropyDelta: -0.1 });
 * ```
 */
export function usePromptTelemetry({ sessionId, enabled = true }: UsePromptTelemetryOptions) {
  const batcherRef = useRef(createTelemetryBatcher({
    maxSize: 20,
    flushDelayMs: 100,
    onError: (error) => {
      console.warn('[Telemetry] Batch submission failed:', error.message);
    },
  }));
  
  const contextRef = useRef<ContextState | null>(null);
  const lastScoringRef = useRef<Map<string, ScoredPrompt>>(new Map());
  
  // Flush on unmount
  useEffect(() => {
    return () => {
      batcherRef.current.flush();
    };
  }, []);
  
  /**
   * Record impression events for displayed prompts
   */
  const recordImpressions = useCallback((
    scoredPrompts: ScoredPrompt[],
    context: ContextState
  ) => {
    if (!enabled) return;
    
    contextRef.current = context;
    lastScoringRef.current.clear();
    
    const timestamp = Date.now();
    
    scoredPrompts.forEach((scored, index) => {
      lastScoringRef.current.set(scored.prompt.id, scored);
      
      const event: PromptTelemetryEvent = {
        eventType: 'impression',
        promptId: scored.prompt.id,
        sessionId,
        timestamp,
        context: {
          stage: context.stage,
          lensId: context.activeLensId,
          entropy: context.entropy,
          interactionCount: context.interactionCount,
          activeTopics: context.topicsExplored,
          activeMoments: context.activeMoments,
        },
        scoring: {
          finalScore: scored.score,
          rank: index,
          matchDetails: scored.matchDetails,
        },
      };
      
      batcherRef.current.add(event);
    });
  }, [sessionId, enabled]);
  
  /**
   * Record selection event when user clicks a prompt
   */
  const recordSelection = useCallback((promptId: string) => {
    if (!enabled) return;
    
    const context = contextRef.current;
    const scored = lastScoringRef.current.get(promptId);
    
    const event: PromptTelemetryEvent = {
      eventType: 'selection',
      promptId,
      sessionId,
      timestamp: Date.now(),
      context: context ? {
        stage: context.stage,
        lensId: context.activeLensId,
        entropy: context.entropy,
        interactionCount: context.interactionCount,
        activeTopics: context.topicsExplored,
        activeMoments: context.activeMoments,
      } : {
        stage: 'genesis',
        lensId: null,
        entropy: 0,
        interactionCount: 0,
        activeTopics: [],
        activeMoments: [],
      },
      scoring: scored ? {
        finalScore: scored.score,
        rank: Array.from(lastScoringRef.current.keys()).indexOf(promptId),
        matchDetails: scored.matchDetails,
      } : undefined,
    };
    
    // Selection is important - submit immediately, don't batch
    submitTelemetryEvent(event).catch((error) => {
      console.warn('[Telemetry] Selection submission failed:', error.message);
    });
  }, [sessionId, enabled]);
  
  /**
   * Record completion event after AI responds
   */
  const recordCompletion = useCallback((
    promptId: string,
    outcome: TelemetryOutcome
  ) => {
    if (!enabled) return;
    
    const context = contextRef.current;
    
    const event: PromptTelemetryEvent = {
      eventType: 'completion',
      promptId,
      sessionId,
      timestamp: Date.now(),
      context: context ? {
        stage: context.stage,
        lensId: context.activeLensId,
        entropy: context.entropy,
        interactionCount: context.interactionCount,
        activeTopics: context.topicsExplored,
        activeMoments: context.activeMoments,
      } : {
        stage: 'genesis',
        lensId: null,
        entropy: 0,
        interactionCount: 0,
        activeTopics: [],
        activeMoments: [],
      },
      outcome,
    };
    
    submitTelemetryEvent(event).catch((error) => {
      console.warn('[Telemetry] Completion submission failed:', error.message);
    });
  }, [sessionId, enabled]);
  
  return {
    recordImpressions,
    recordSelection,
    recordCompletion,
  };
}
```

---

## 3. Database Schema

### 3.1 Migration File

**Location:** `supabase/migrations/006_prompt_telemetry.sql`

```sql
-- Migration: 006_prompt_telemetry.sql
-- Sprint: 4d-prompt-refactor-telemetry-v1
-- Purpose: Telemetry infrastructure for prompt performance tracking

-- =============================================================================
-- PROMPT TELEMETRY TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS prompt_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN ('impression', 'selection', 'completion', 'feedback', 'skip')),
  prompt_id TEXT NOT NULL,
  session_id UUID NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Context snapshot
  context_stage TEXT CHECK (context_stage IN ('genesis', 'exploration', 'synthesis', 'advocacy')),
  context_lens_id TEXT,
  context_entropy FLOAT CHECK (context_entropy >= 0 AND context_entropy <= 1),
  context_interaction_count INTEGER DEFAULT 0,
  context_active_topics TEXT[] DEFAULT '{}',
  context_active_moments TEXT[] DEFAULT '{}',
  
  -- Scoring metadata (for impressions/selections)
  scoring_final_score FLOAT,
  scoring_rank INTEGER,
  scoring_stage_match BOOLEAN,
  scoring_lens_weight FLOAT,
  scoring_topic_weight FLOAT,
  scoring_moment_boost FLOAT,
  scoring_base_weight FLOAT,
  
  -- Outcome metrics (for completions)
  outcome_dwell_time_ms INTEGER,
  outcome_entropy_delta FLOAT,
  outcome_follow_up_prompt_id TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX idx_prompt_telemetry_prompt_id ON prompt_telemetry(prompt_id);
CREATE INDEX idx_prompt_telemetry_session_id ON prompt_telemetry(session_id);
CREATE INDEX idx_prompt_telemetry_timestamp ON prompt_telemetry(timestamp DESC);
CREATE INDEX idx_prompt_telemetry_event_type ON prompt_telemetry(event_type);
CREATE INDEX idx_prompt_telemetry_lens ON prompt_telemetry(context_lens_id) WHERE context_lens_id IS NOT NULL;

-- Composite index for performance queries
CREATE INDEX idx_prompt_telemetry_performance ON prompt_telemetry(prompt_id, event_type, timestamp DESC);

-- =============================================================================
-- PROMPT PERFORMANCE VIEW (Aggregated Metrics)
-- =============================================================================

CREATE OR REPLACE VIEW prompt_performance AS
SELECT 
  prompt_id,
  COUNT(*) FILTER (WHERE event_type = 'impression') as impressions,
  COUNT(*) FILTER (WHERE event_type = 'selection') as selections,
  COUNT(*) FILTER (WHERE event_type = 'completion') as completions,
  CASE 
    WHEN COUNT(*) FILTER (WHERE event_type = 'impression') > 0 
    THEN ROUND(
      COUNT(*) FILTER (WHERE event_type = 'selection')::NUMERIC / 
      COUNT(*) FILTER (WHERE event_type = 'impression'),
      4
    )
    ELSE 0 
  END as selection_rate,
  ROUND(AVG(outcome_entropy_delta) FILTER (WHERE event_type = 'completion')::NUMERIC, 4) as avg_entropy_delta,
  ROUND(AVG(outcome_dwell_time_ms) FILTER (WHERE event_type = 'completion')::NUMERIC, 0) as avg_dwell_time_ms,
  MAX(timestamp) as last_surfaced
FROM prompt_telemetry
GROUP BY prompt_id;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE prompt_telemetry ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts for telemetry (no auth required)
CREATE POLICY "Allow anonymous telemetry inserts" ON prompt_telemetry
  FOR INSERT
  WITH CHECK (true);

-- Read access for service role only (admin queries)
CREATE POLICY "Service role can read telemetry" ON prompt_telemetry
  FOR SELECT
  USING (auth.role() = 'service_role');

-- =============================================================================
-- RETENTION POLICY (Optional - uncomment if needed)
-- =============================================================================

-- Delete telemetry older than 90 days (run via cron job)
-- CREATE OR REPLACE FUNCTION cleanup_old_telemetry() RETURNS void AS $$
-- BEGIN
--   DELETE FROM prompt_telemetry WHERE timestamp < NOW() - INTERVAL '90 days';
-- END;
-- $$ LANGUAGE plpgsql;
```

---

## 4. Server Endpoints

### 4.1 Endpoint Implementation

**Location:** Add to `server.js` in the API section

```javascript
// =============================================================================
// PROMPT TELEMETRY ENDPOINTS
// Sprint: 4d-prompt-refactor-telemetry-v1
// =============================================================================

/**
 * POST /api/telemetry/prompt
 * Submit a single telemetry event
 */
app.post('/api/telemetry/prompt', async (req, res) => {
  try {
    const event = req.body;
    
    // Validate required fields
    if (!event.eventType || !event.promptId || !event.sessionId) {
      return res.status(400).json({ 
        error: 'Missing required fields: eventType, promptId, sessionId' 
      });
    }
    
    const { data, error } = await supabase
      .from('prompt_telemetry')
      .insert({
        event_type: event.eventType,
        prompt_id: event.promptId,
        session_id: event.sessionId,
        timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
        context_stage: event.context?.stage,
        context_lens_id: event.context?.lensId,
        context_entropy: event.context?.entropy,
        context_interaction_count: event.context?.interactionCount,
        context_active_topics: event.context?.activeTopics || [],
        context_active_moments: event.context?.activeMoments || [],
        scoring_final_score: event.scoring?.finalScore,
        scoring_rank: event.scoring?.rank,
        scoring_stage_match: event.scoring?.matchDetails?.stageMatch,
        scoring_lens_weight: event.scoring?.matchDetails?.lensWeight,
        scoring_topic_weight: event.scoring?.matchDetails?.topicWeight,
        scoring_moment_boost: event.scoring?.matchDetails?.momentBoost,
        scoring_base_weight: event.scoring?.matchDetails?.baseWeight,
        outcome_dwell_time_ms: event.outcome?.dwellTimeMs,
        outcome_entropy_delta: event.outcome?.entropyDelta,
        outcome_follow_up_prompt_id: event.outcome?.followUpPromptId,
      })
      .select('id')
      .single();
    
    if (error) throw error;
    
    res.status(201).json({ id: data.id, status: 'recorded' });
  } catch (error) {
    console.error('[Telemetry] Insert error:', error);
    res.status(500).json({ error: 'Failed to record telemetry' });
  }
});

/**
 * POST /api/telemetry/prompt/batch
 * Submit multiple telemetry events (for impressions)
 */
app.post('/api/telemetry/prompt/batch', async (req, res) => {
  try {
    const { events } = req.body;
    
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'Events array required' });
    }
    
    const rows = events.map(event => ({
      event_type: event.eventType,
      prompt_id: event.promptId,
      session_id: event.sessionId,
      timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
      context_stage: event.context?.stage,
      context_lens_id: event.context?.lensId,
      context_entropy: event.context?.entropy,
      context_interaction_count: event.context?.interactionCount,
      context_active_topics: event.context?.activeTopics || [],
      context_active_moments: event.context?.activeMoments || [],
      scoring_final_score: event.scoring?.finalScore,
      scoring_rank: event.scoring?.rank,
      scoring_stage_match: event.scoring?.matchDetails?.stageMatch,
      scoring_lens_weight: event.scoring?.matchDetails?.lensWeight,
      scoring_topic_weight: event.scoring?.matchDetails?.topicWeight,
      scoring_moment_boost: event.scoring?.matchDetails?.momentBoost,
      scoring_base_weight: event.scoring?.matchDetails?.baseWeight,
    }));
    
    const { error } = await supabase
      .from('prompt_telemetry')
      .insert(rows);
    
    if (error) throw error;
    
    res.status(201).json({ count: rows.length, status: 'recorded' });
  } catch (error) {
    console.error('[Telemetry] Batch insert error:', error);
    res.status(500).json({ error: 'Failed to record telemetry batch' });
  }
});

/**
 * GET /api/telemetry/prompt/:promptId/stats
 * Get aggregated stats for a specific prompt
 */
app.get('/api/telemetry/prompt/:promptId/stats', async (req, res) => {
  try {
    const { promptId } = req.params;
    
    const { data, error } = await supabase
      .from('prompt_performance')
      .select('*')
      .eq('prompt_id', promptId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    
    if (!data) {
      return res.json({
        promptId,
        impressions: 0,
        selections: 0,
        completions: 0,
        selectionRate: 0,
        avgEntropyDelta: null,
        avgDwellTimeMs: null,
        lastSurfaced: null,
      });
    }
    
    res.json({
      promptId: data.prompt_id,
      impressions: data.impressions,
      selections: data.selections,
      completions: data.completions,
      selectionRate: parseFloat(data.selection_rate),
      avgEntropyDelta: data.avg_entropy_delta ? parseFloat(data.avg_entropy_delta) : null,
      avgDwellTimeMs: data.avg_dwell_time_ms ? parseInt(data.avg_dwell_time_ms) : null,
      lastSurfaced: data.last_surfaced,
    });
  } catch (error) {
    console.error('[Telemetry] Stats fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch prompt stats' });
  }
});

/**
 * GET /api/telemetry/prompts/performance
 * List all prompt performance metrics
 */
app.get('/api/telemetry/prompts/performance', async (req, res) => {
  try {
    const { limit = 50, sort = 'impressions', order = 'desc' } = req.query;
    
    const validSortFields = ['impressions', 'selections', 'selection_rate', 'avg_entropy_delta', 'last_surfaced'];
    const sortField = validSortFields.includes(sort) ? sort : 'impressions';
    const ascending = order === 'asc';
    
    const { data, error, count } = await supabase
      .from('prompt_performance')
      .select('*', { count: 'exact' })
      .order(sortField, { ascending })
      .limit(parseInt(limit));
    
    if (error) throw error;
    
    const prompts = data.map(row => ({
      promptId: row.prompt_id,
      impressions: row.impressions,
      selections: row.selections,
      completions: row.completions,
      selectionRate: parseFloat(row.selection_rate),
      avgEntropyDelta: row.avg_entropy_delta ? parseFloat(row.avg_entropy_delta) : null,
      avgDwellTimeMs: row.avg_dwell_time_ms ? parseInt(row.avg_dwell_time_ms) : null,
      lastSurfaced: row.last_surfaced,
    }));
    
    res.json({ prompts, total: count });
  } catch (error) {
    console.error('[Telemetry] Performance list error:', error);
    res.status(500).json({ error: 'Failed to list prompt performance' });
  }
});
```

---

## 5. File Structure Summary

```
src/core/telemetry/
├── types.ts                    # Event types, interfaces
├── client.ts                   # API client functions
├── batch.ts                    # Batching utility
├── usePromptTelemetry.ts       # React hook
└── index.ts                    # Re-exports

supabase/migrations/
└── 006_prompt_telemetry.sql    # Database schema

server.js                       # Add telemetry endpoints (lines TBD)
```

---

## 6. Integration Points

### 6.1 Where to Wire Telemetry

| Component | Event | Hook Method |
|-----------|-------|-------------|
| `usePromptSuggestions` | Prompts scored | `recordImpressions` |
| `PromptCarousel` / `SuggestedPrompts` | User clicks prompt | `recordSelection` |
| `ExploreShell` / Chat handler | AI response complete | `recordCompletion` |

### 6.2 Example Integration

```tsx
// In a component that displays prompts
const { recordImpressions, recordSelection } = usePromptTelemetry({
  sessionId: session.id,
});

// Record impressions when prompts change
useEffect(() => {
  if (scoredPrompts.length > 0) {
    recordImpressions(scoredPrompts, contextState);
  }
}, [scoredPrompts, contextState]);

// Record selection on click
const handlePromptSelect = (prompt: PromptObject) => {
  recordSelection(prompt.id);
  onSelect(prompt); // Existing handler
};
```

---

## 7. DEX Compliance Checklist

- [x] **Declarative Types**: Event types defined as const array
- [x] **Provenance Chain**: Events include full context snapshot
- [x] **Non-Blocking**: Async submission with error swallowing
- [x] **Compatibility**: Works alongside existing prompt system
- [x] **Testable**: Pure functions for batching, clear interfaces
- [x] **Observable**: Performance view for analytics
