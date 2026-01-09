# Inline Prompts Wiring v1 — Repository Audit

**Sprint:** inline-prompts-wiring-v1  
**Date:** January 9, 2026  
**Tier:** Bugfix  

---

## Problem Statement

Inline suggested prompts (navigation forks after LLM responses) are not appearing in the Explore route (`/bedrock/experiences`), despite:
1. Genesis welcome prompts (0 exchanges) working correctly ✅
2. A comprehensive 4D Context Fields scoring system existing ✅
3. 70+ prompts with proper targeting configuration in Supabase ✅

**The system WAS working.** Something broke.

---

## Patterns Extended (from PROJECT_PATTERNS.md)

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Prompt selection | Pattern 5: Feature Detection (Context Fields) | No new code - verify config |
| Fork rendering | Pattern 6: Component Composition | No new code - verify wiring |
| Data flow | Pattern 7: Object Model (Grove Data Layer) | No new code - verify pipeline |

## New Patterns Proposed

**None.** This is a wiring/configuration issue, not a pattern gap.

---

## DEX Compliance Check

The existing system IS DEX-compliant:

| DEX Pillar | Status | Evidence |
|------------|--------|----------|
| Declarative Sovereignty | ✅ | Prompts in Supabase with JSON targeting config |
| Capability Agnosticism | ✅ | No LLM calls in selection - pure scoring |
| Provenance | ✅ | FORK_SELECTED events with full context |
| Organic Scalability | ✅ | Add prompts to DB, system adapts |

**The architecture is sound. The wiring is broken.**

---

## Relevant Files

### Data Pipeline (Source → Selection)
```
src/core/data/use-grove-data.ts          → Fetches from Supabase
src/core/data/adapters/supabase-adapter.ts → DB connection
src/core/context-fields/scoring.ts       → selectPromptsWithScoring()
src/core/context-fields/types.ts         → ContextState, PromptObject
```

### Hook Layer (Selection → Forks)
```
src/explore/hooks/useNavigationPrompts.ts  → MAIN HOOK (grovePromptToPromptObject converter)
src/core/context-fields/useContextState.ts → Aggregates EngagementContext → ContextState
src/core/context-fields/adapters.ts        → promptsToForks()
```

### Rendering Layer (Forks → UI)
```
src/surface/components/KineticStream/Stream/blocks/ResponseObject.tsx → Renders NavigationBlock
src/surface/components/KineticStream/Stream/blocks/NavigationBlock.tsx → Fork buttons
```

---

## Configuration State (Supabase)

### Prompts Table Schema
```sql
prompts (
  id uuid,
  type text DEFAULT 'prompt',
  title text,           -- meta.title
  status text,          -- 'active' | 'draft' | 'deprecated'
  tags text[],          -- meta.tags (includes 'genesis-welcome')
  payload jsonb (
    executionPrompt text,
    targeting jsonb (
      stages text[],           -- ['genesis', 'exploration', 'synthesis']
      excludeStages text[],
      entropyWindow { min, max },
      lensIds text[],
      excludeLenses text[],
      momentTriggers text[],
      requireMoment boolean,
      minInteractions integer
    ),
    topicAffinities [],
    lensAffinities [],
    baseWeight integer
  )
)
```

### Expected Stage Flow
```
interactionCount=0 → stage='genesis'     → genesis-tagged prompts
interactionCount=1 → stage='exploration' → exploration-tagged prompts
interactionCount=3+ → stage='synthesis'  → synthesis-tagged prompts
```

---

## Hypothesis: Configuration Mismatch

The most likely failure point is **stage targeting mismatch**:

1. User sends first message → interactionCount becomes 1
2. `computeStage()` returns `'exploration'`
3. `applyHardFilters()` filters to prompts where `targeting.stages` includes `'exploration'`
4. **IF prompts in Supabase don't have `exploration` in their `targeting.stages`** → empty result

### Verification Required

Query Supabase to check:
```sql
SELECT title, payload->'targeting'->'stages' as stages
FROM prompts
WHERE status = 'active'
AND (payload->'targeting'->'stages') ? 'exploration';
```

If this returns 0 rows, the prompts are misconfigured.
If this returns rows, the issue is in the code pipeline.

---

## Test Points

| Stage | What to Check | Expected |
|-------|---------------|----------|
| 1. Data Load | `useGroveData('prompt')` returns prompts | 70+ prompts |
| 2. Active Filter | `status === 'active'` filter works | 50+ active |
| 3. Format Convert | `grovePromptToPromptObject()` maps correctly | targeting preserved |
| 4. Context State | `useContextState()` returns valid state | stage='exploration' after 1 msg |
| 5. Hard Filters | `applyHardFilters()` passes prompts | >0 prompts |
| 6. Scoring | `selectPromptsWithScoring()` returns results | 1-3 scored prompts |
| 7. Fork Conversion | `promptsToForks()` returns forks | JourneyFork[] |
| 8. Rendering | `NavigationBlock` receives forks | forks.length > 0 |

---

## Sprint Approach: Config-First Diagnosis

**Step 1:** Query Supabase directly (not through code)
**Step 2:** If config wrong → SQL UPDATE fix
**Step 3:** If config correct → Add targeted console.log at Test Points
**Step 4:** Identify exact break point
**Step 5:** Minimal fix at that point

This follows DEX: verify the declarative layer before touching the engine.
