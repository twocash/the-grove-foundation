# Specification: 4D Prompt Telemetry Infrastructure
**Sprint:** 4d-prompt-refactor-telemetry-v1  
**Version:** 1.0  
**Status:** Draft  
**Author:** Foundation Loop (Claude)

---

## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | Phase 2: Specification |
| **Status** | 🟡 In Progress |
| **Blocking Issues** | None |
| **Last Updated** | 2025-01-05T19:30:00Z |
| **Next Action** | Complete SPEC, generate ARCHITECTURE.md |
| **Attention Anchor** | Build telemetry in bedrock, don't break marketing MVP |

---

## Attention Anchor

**Re-read this block before every major decision.**

- **We are building:** Telemetry infrastructure for prompt performance tracking in the bedrock layer
- **Success looks like:** Prompt selections captured, performance visible, scoring enhanced—marketing MVP unchanged
- **We are NOT:** Refactoring existing prompt content or breaking the live marketing site
- **Current phase:** Specification
- **Next action:** Define telemetry schema and API contracts

---

## 1. Goal

Build a **DEX-compliant telemetry infrastructure** in the bedrock layer that:

1. Captures prompt lifecycle events (impression, selection, completion, feedback)
2. Persists telemetry to database for analysis
3. Provides visibility into prompt performance via admin interface
4. Enables future feedback loops for scoring enhancement

**Constraint:** The marketing MVP (Genesis/Terminal/Foundation) must continue working unchanged. All new infrastructure wraps around existing code via adapters.

---

## 2. Non-Goals

- **NOT** refactoring existing prompt JSON content
- **NOT** changing prompt scoring algorithm in this sprint (telemetry collection first)
- **NOT** building AI-generated prompts
- **NOT** implementing the question-prompt bridge from RAG
- **NOT** modifying the deprecated `stage-prompts.ts`
- **NOT** breaking any existing Terminal functionality

---

## 3. Background

### 3.1 Current State

The Grove Terminal has 66 active prompts with sophisticated 4D targeting (stage, lens, topic, entropy). However:

- **No telemetry collection**: `PromptStats` fields are always zero
- **Static scoring**: Weights are hardcoded, no performance feedback
- **No visibility**: Operators cannot see which prompts perform well
- **No provenance**: Cannot trace why a prompt was surfaced

### 3.2 Strategic Context

Per Trellis Architecture principles:
- **Provenance as Infrastructure**: Every prompt surfacing should be traceable
- **Declarative Sovereignty**: Operators should be able to adjust without code changes
- **Organic Scalability**: Telemetry enables data-driven prompt improvement

### 3.3 Strangler Fig Pattern

```
┌─────────────────────────────────────────────────────────────┐
│                    Marketing MVP (LIVE)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ base.prompts│  │wayne-turner │  │ dr-chiang   │          │
│  │    .json    │  │  .prompts   │  │  .prompts   │          │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │
│         │                │                │                  │
│         └────────────────┼────────────────┘                  │
│                          ▼                                   │
│                  ┌───────────────┐                           │
│                  │  Prompt Index │                           │
│                  │   (loader)    │                           │
│                  └───────┬───────┘                           │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              │   ADAPTER  │  (NEW)     │
              │            ▼            │
              │  ┌─────────────────┐    │
              │  │ Telemetry Hook  │    │
              │  └────────┬────────┘    │
              └───────────┼────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────┐
│                    Bedrock Layer (NEW)                       │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Prompt Telemetry Service                │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐     │    │
│  │  │ Collect  │ │ Persist  │ │ Query/Aggregate  │     │    │
│  │  └──────────┘ └──────────┘ └──────────────────┘     │    │
│  └─────────────────────────────────────────────────────┘    │
│                          │                                   │
│                          ▼                                   │
│  ┌─────────────────────────────────────────────────────┐    │
│  │                prompt_telemetry (DB)                 │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Acceptance Criteria

### 4.1 Telemetry Collection (Must Have)

- [ ] **AC-1**: Prompt impression events captured when prompts are displayed to user
- [ ] **AC-2**: Prompt selection events captured when user clicks a prompt
- [ ] **AC-3**: Prompt completion events captured when AI response finishes
- [ ] **AC-4**: Events include context (session_id, lens_id, stage, entropy)
- [ ] **AC-5**: Events persisted to `prompt_telemetry` database table

### 4.2 Data Model (Must Have)

- [ ] **AC-6**: `prompt_telemetry` table created in Supabase
- [ ] **AC-7**: Schema supports all event types with appropriate fields
- [ ] **AC-8**: Indexes on prompt_id, session_id, timestamp for efficient queries

### 4.3 API Endpoints (Must Have)

- [ ] **AC-9**: `POST /api/telemetry/prompt` endpoint for event submission
- [ ] **AC-10**: `GET /api/telemetry/prompt/:id/stats` for prompt-level aggregates
- [ ] **AC-11**: Endpoints follow existing server.js patterns

### 4.4 Admin Visibility (Should Have)

- [ ] **AC-12**: PipelineMonitor or copilot shows prompt performance summary
- [ ] **AC-13**: Metrics include: impressions, selections, selection rate, avg entropy delta

### 4.5 Compatibility (Must Have)

- [ ] **AC-14**: Marketing MVP prompts continue working with zero changes
- [ ] **AC-15**: Telemetry hooks are opt-in, not breaking
- [ ] **AC-16**: Existing tests pass

### 4.6 DEX Compliance (Must Have)

- [ ] **AC-17**: Telemetry types defined as proper Grove objects
- [ ] **AC-18**: Configuration declarative (no hardcoded event types)
- [ ] **AC-19**: Provenance chain traceable from event to source prompt

---

## 5. Technical Approach

### 5.1 Event Types

```typescript
type PromptTelemetryEventType = 
  | 'impression'   // Prompt displayed to user
  | 'selection'    // User clicked prompt
  | 'completion'   // AI response finished
  | 'feedback'     // User rated helpfulness (future)
  | 'skip';        // User explicitly dismissed (future)
```

### 5.2 Event Schema

```typescript
interface PromptTelemetryEvent {
  id: string;                    // UUID
  eventType: PromptTelemetryEventType;
  promptId: string;              // References prompt.id
  sessionId: string;             // Session tracking
  timestamp: number;             // Unix ms
  
  // Context at time of event
  context: {
    stage: Stage;
    lensId: string | null;
    entropy: number;
    interactionCount: number;
    activeTopics: string[];
    activeMoments: string[];
  };
  
  // Scoring metadata (why was this prompt surfaced?)
  scoring: {
    finalScore: number;
    rank: number;                // Position in suggestion list
    matchDetails: {
      stageMatch: boolean;
      lensWeight: number;
      topicWeight: number;
      momentBoost: number;
    };
  };
  
  // Outcome metrics (populated on completion)
  outcome?: {
    dwellTimeMs: number;         // Time until next action
    entropyDelta: number;        // Change in entropy after response
    followUpPromptId?: string;   // If user selected another prompt
  };
}
```

### 5.3 Database Schema

```sql
CREATE TABLE prompt_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  prompt_id TEXT NOT NULL,
  session_id UUID NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Context snapshot
  context_stage TEXT,
  context_lens_id TEXT,
  context_entropy FLOAT,
  context_interaction_count INTEGER,
  context_active_topics TEXT[],
  context_active_moments TEXT[],
  
  -- Scoring metadata
  scoring_final_score FLOAT,
  scoring_rank INTEGER,
  scoring_stage_match BOOLEAN,
  scoring_lens_weight FLOAT,
  scoring_topic_weight FLOAT,
  scoring_moment_boost FLOAT,
  
  -- Outcome metrics
  outcome_dwell_time_ms INTEGER,
  outcome_entropy_delta FLOAT,
  outcome_follow_up_prompt_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_prompt_telemetry_prompt_id ON prompt_telemetry(prompt_id);
CREATE INDEX idx_prompt_telemetry_session_id ON prompt_telemetry(session_id);
CREATE INDEX idx_prompt_telemetry_timestamp ON prompt_telemetry(timestamp);
CREATE INDEX idx_prompt_telemetry_event_type ON prompt_telemetry(event_type);
```

### 5.4 Aggregation View

```sql
CREATE OR REPLACE VIEW prompt_performance AS
SELECT 
  prompt_id,
  COUNT(*) FILTER (WHERE event_type = 'impression') as impressions,
  COUNT(*) FILTER (WHERE event_type = 'selection') as selections,
  COUNT(*) FILTER (WHERE event_type = 'completion') as completions,
  CASE 
    WHEN COUNT(*) FILTER (WHERE event_type = 'impression') > 0 
    THEN COUNT(*) FILTER (WHERE event_type = 'selection')::FLOAT / 
         COUNT(*) FILTER (WHERE event_type = 'impression')
    ELSE 0 
  END as selection_rate,
  AVG(outcome_entropy_delta) FILTER (WHERE event_type = 'completion') as avg_entropy_delta,
  AVG(outcome_dwell_time_ms) FILTER (WHERE event_type = 'completion') as avg_dwell_time_ms,
  MAX(timestamp) as last_surfaced
FROM prompt_telemetry
GROUP BY prompt_id;
```

---

## 6. API Contracts

### 6.1 Submit Telemetry Event

```
POST /api/telemetry/prompt

Request Body:
{
  "eventType": "selection",
  "promptId": "turner-hook-infrastructure-of-thought",
  "sessionId": "abc123-def456",
  "context": {
    "stage": "genesis",
    "lensId": "wayne-turner",
    "entropy": 0.3,
    "interactionCount": 2,
    "activeTopics": ["infrastructure-bet"],
    "activeMoments": []
  },
  "scoring": {
    "finalScore": 145,
    "rank": 1,
    "matchDetails": {
      "stageMatch": true,
      "lensWeight": 30,
      "topicWeight": 15,
      "momentBoost": 0
    }
  }
}

Response: 201 Created
{
  "id": "event-uuid",
  "status": "recorded"
}
```

### 6.2 Get Prompt Stats

```
GET /api/telemetry/prompt/:promptId/stats

Response: 200 OK
{
  "promptId": "turner-hook-infrastructure-of-thought",
  "impressions": 150,
  "selections": 45,
  "completions": 42,
  "selectionRate": 0.30,
  "avgEntropyDelta": -0.15,
  "avgDwellTimeMs": 12500,
  "lastSurfaced": "2025-01-05T18:30:00Z"
}
```

### 6.3 List Prompt Performance

```
GET /api/telemetry/prompts/performance?limit=20&sort=selectionRate&order=desc

Response: 200 OK
{
  "prompts": [
    { "promptId": "...", "impressions": 150, "selections": 45, ... },
    ...
  ],
  "total": 66
}
```

---

## 7. Implementation Notes

### 7.1 Hook Integration Point

The telemetry hook should wrap `usePromptSuggestions` or be called from components that display prompts:

```typescript
// src/core/telemetry/usePromptTelemetry.ts
export function usePromptTelemetry() {
  const recordImpression = useCallback((prompt: PromptObject, context: ContextState, scoring: ScoringDetails) => {
    // Fire async POST to /api/telemetry/prompt
  }, []);
  
  const recordSelection = useCallback((promptId: string) => {
    // Fire async POST
  }, []);
  
  const recordCompletion = useCallback((promptId: string, outcome: OutcomeMetrics) => {
    // Fire async POST
  }, []);
  
  return { recordImpression, recordSelection, recordCompletion };
}
```

### 7.2 Batching Strategy

For impression events (multiple prompts displayed at once), batch into single request:

```typescript
// Batch impressions for efficiency
const batchImpressions = useDebouncedCallback((events: TelemetryEvent[]) => {
  fetch('/api/telemetry/prompt/batch', {
    method: 'POST',
    body: JSON.stringify({ events })
  });
}, 100);
```

### 7.3 Fallback Behavior

If telemetry fails:
- Log error to console (dev mode)
- Do NOT block user experience
- Queue for retry if offline (optional future enhancement)

---

## 8. Dependencies

### 8.1 Existing Infrastructure

- Supabase for database
- Server.js for API endpoints
- `ContextState` and `PromptObject` types from context-fields

### 8.2 New Infrastructure

- `src/core/telemetry/prompt-telemetry.ts` - Types and utilities
- `src/core/telemetry/usePromptTelemetry.ts` - React hook
- Migration file for database schema
- Server.js endpoints

---

## 9. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Telemetry overhead slows UI | Low | Medium | Async/debounced writes |
| Database bloat from events | Medium | Low | Retention policy, aggregation |
| Type drift from prompt schema | Medium | Medium | Shared types from bedrock |
| Scope creep into scoring changes | Medium | Medium | Explicit non-goal boundary |

---

## 10. Future Enhancements (Out of Scope)

These are explicitly deferred to future sprints:

1. **Feedback Loop Scoring**: Using telemetry to adjust `baseWeight`
2. **A/B Testing Framework**: Prompt variants with controlled comparison
3. **Question-Prompt Bridge**: Connecting RAG-extracted questions to prompts
4. **AI-Generated Prompts**: Using telemetry gaps to suggest new prompts
5. **Real-time Dashboard**: Live telemetry streaming visualization

---

## Appendix: Glossary

| Term | Definition |
|------|------------|
| **Impression** | A prompt was displayed to the user |
| **Selection** | User clicked/tapped a suggested prompt |
| **Completion** | AI finished responding to a selected prompt |
| **Dwell Time** | Duration between prompt selection and next user action |
| **Entropy Delta** | Change in conversation entropy after prompt response |
| **Selection Rate** | selections / impressions |
