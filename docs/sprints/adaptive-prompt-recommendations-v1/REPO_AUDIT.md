# Repository Audit: adaptive-prompt-recommendations-v1

**Sprint:** adaptive-prompt-recommendations-v1  
**Date:** 2026-01-03  
**Auditor:** Claude (Foundation Loop)  
**Prerequisites:** prompt-schema-rationalization-v1 (in progress)

---

## Executive Summary

This sprint implements an adaptive prompt recommendation system using telemetry signals. The system combines entropy-weighted relevance with contextual bandits to surface prompts that match user epistemic state — without collaborative filtering, avoiding centralization and Sybil vulnerabilities.

**Core thesis:** Recommend prompts based on their *epistemic impact* (entropy delta), not just engagement metrics.

---

## Files to Create

### Core Schema

| File | Purpose |
|------|---------|
| `src/core/schema/adaptive-scoring.ts` | AdaptiveScoring types |
| `src/core/telemetry/prompt-events.ts` | Event tracking functions |
| `src/core/telemetry/context-hash.ts` | Context encoding utilities |

### Recommendation Engine

| File | Purpose |
|------|---------|
| `src/explore/recommendation/entropy-strategy.ts` | Entropy-based strategy selection |
| `src/explore/recommendation/contextual-bandit.ts` | UCB arm selection |
| `src/explore/recommendation/recommend-prompts.ts` | Main recommendation orchestrator |
| `src/explore/recommendation/diversity-selector.ts` | Diverse result selection |

### Database

| File | Purpose |
|------|---------|
| `supabase/migrations/YYYYMMDD_adaptive_scoring.sql` | Schema for telemetry tables |
| `supabase/functions/increment_prompt_impressions.sql` | RPC function |
| `supabase/functions/record_prompt_selection.sql` | RPC function |
| `supabase/functions/record_entropy_impact.sql` | RPC function |

### Integration

| File | Purpose |
|------|---------|
| `src/explore/hooks/usePromptRecommendations.ts` | React hook for recommendations |
| `src/explore/hooks/usePromptTelemetry.ts` | React hook for event tracking |

---

## Files to Modify

### Schema (After prompt-schema-rationalization-v1)

| File | Changes |
|------|---------|
| `src/core/schema/prompt.ts` | Add `adaptiveScoring?: AdaptiveScoring` to PromptPayload |

### Existing Recommendation Code

| File | Changes |
|------|---------|
| `src/explore/utils/scorePrompt.ts` | Integrate adaptive scoring into base calculation |
| `src/explore/hooks/usePromptSuggestions.ts` | Use new recommendation engine |

### Terminal Integration

| File | Changes |
|------|---------|
| `src/terminal/components/PromptSuggestions.tsx` | Track impressions/selections |
| `src/terminal/hooks/useExplorationSession.ts` | Pass entropy state to recommendations |

---

## Dependency Analysis

### New Dependencies

| Package | Purpose | Notes |
|---------|---------|-------|
| None | Pure TypeScript implementation | No new deps needed |

### Internal Dependencies

```
src/core/schema/prompt.ts
  └── imports AdaptiveScoring from adaptive-scoring.ts

src/explore/recommendation/recommend-prompts.ts
  ├── imports from entropy-strategy.ts
  ├── imports from contextual-bandit.ts
  └── imports from diversity-selector.ts

src/explore/hooks/usePromptRecommendations.ts
  ├── imports recommend-prompts.ts
  └── imports usePromptTelemetry.ts
```

---

## Current State Analysis

### Existing Prompt Scoring

**Location:** `src/explore/utils/scorePrompt.ts`

```typescript
// Current approach (simplified)
function scorePrompt(prompt: Prompt, context: ExplorationContext): number {
  let score = prompt.payload.baseWeight;
  
  // Topic affinity matching
  for (const affinity of prompt.payload.topicAffinities) {
    if (context.activeTopics.includes(affinity.topic)) {
      score += affinity.strength * 20;
    }
  }
  
  // Lens affinity matching
  if (context.activeLens) {
    const lensAffinity = prompt.payload.lensAffinities.find(
      a => a.lensId === context.activeLens.id
    );
    if (lensAffinity) {
      score += lensAffinity.strength * 30;
    }
  }
  
  // Targeting constraints
  if (!meetsTargeting(prompt, context)) {
    return 0;
  }
  
  return score;
}
```

**Limitations:**
- Static weights, no learning
- No exploration/exploitation balance
- No entropy awareness
- No freshness consideration

### Existing Telemetry

**Current state:** Minimal. Basic stats in `prompt.payload.stats`:
- `impressions`
- `selections`
- `completions`
- `avgEntropyDelta`
- `avgDwellMs`

**Gap:** No contextual tracking, no bandit arms, no entropy-segmented analysis.

### Entropy Calculation

**Location:** `src/explore/utils/calculateEntropy.ts` (verify exists)

**Status:** Need to verify entropy calculation is available and accurate.

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Entropy measurement inaccurate | Medium | High | Validate entropy calc before integration |
| Cold start for new prompts | High | Medium | Exploration bonus for low-pull prompts |
| Gaming by users | Low | Medium | No user-level profiles, aggregate only |
| Performance impact | Medium | Medium | Async telemetry, batch updates |
| Complexity overwhelm | Medium | High | Phase implementation, validate each layer |

---

## Advisory Council Input

| Advisor | Weight | Key Guidance |
|---------|--------|--------------|
| **Park** | 10 | "Context hashing is the hard part. Keep features simple — lens ID, topic cluster, entropy bucket. Don't try to encode everything." |
| **Adams** | 8 | "The entropy strategy creates drama. Users in different states get different experiences. This is *good game design*." |
| **Buterin** | 6 | "No collaborative filtering is correct. Watch for gaming — if behaviors boost prompts, users will optimize. Keep scoring opaque." |
| **Vallor** | 6 | "Entropy-weighted recommendation respects autonomy. You're supporting exploration, not maximizing engagement." |
| **Taylor** | 7 | "Track aggregate patterns, not individual users. Community-level insights without surveillance." |

---

## Build Verification Commands

```bash
# Type check
npm run typecheck

# Unit tests
npm test -- --grep "recommendation"
npm test -- --grep "telemetry"
npm test -- --grep "entropy"

# E2E tests
npx playwright test recommendation

# Dev server
npm run dev
```

---

## Files Examined

- [x] `src/core/schema/prompt.ts` (after rationalization sprint)
- [x] `src/explore/utils/scorePrompt.ts`
- [x] `src/explore/hooks/usePromptSuggestions.ts`
- [ ] `src/explore/utils/calculateEntropy.ts` (need to verify)
- [ ] `src/terminal/components/PromptSuggestions.tsx` (need to verify)
- [x] `PROJECT_PATTERNS.md`
- [x] `docs/contracts/BEDROCK-SPRINT-CONTRACT.md`
