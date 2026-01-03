# Specification: adaptive-prompt-recommendations-v1

**Sprint:** adaptive-prompt-recommendations-v1  
**Status:** Planning  
**Created:** 2026-01-03  
**Author:** Jim Calhoun + Claude

---

## Constitutional Reference

- [x] Read: The_Trellis_Architecture__First_Order_Directives.md
- [x] Read: Bedrock_Architecture_Specification.md
- [x] Read: PROJECT_PATTERNS.md
- [x] Read: Grove_Simulation_Deep_Dive.docx (entropy thesis)

---

## Domain Contract

**Applicable contract:** Exploration Architecture  
**Core principle:** Support epistemic exploration, not engagement optimization

---

## Problem Statement

Current prompt recommendation is **static** — based on configured affinities and targeting rules. This works but doesn't learn from actual user interactions or adapt to epistemic state.

**Limitations:**
1. No learning from what actually resonates
2. No exploration/exploitation balance (always exploits configured weights)
3. No awareness of user's entropy state
4. No freshness management (same prompts surface repeatedly)
5. No contextual adaptation (same recommendations regardless of session state)

---

## Goals

| Goal | Success Criteria |
|------|------------------|
| Learn from interactions | Recommendation quality improves with usage data |
| Entropy-aware surfacing | Different strategies for high/medium/low entropy users |
| Balanced exploration | New prompts get fair exposure via UCB |
| No filter bubbles | Diversity constraints prevent narrow recommendations |
| Privacy-preserving | No user profiles, aggregate telemetry only |
| DEX compliant | Configurable without code changes |

---

## Non-Goals

- User profiles or collaborative filtering
- Cross-user recommendation ("users like you")
- Real-time ML model training
- A/B testing infrastructure (future sprint)
- Personalization beyond session state

---

## Core Concepts

### Entropy Strategy

Users exist in different epistemic states. Recommendations should match:

| Entropy Level | User State | Strategy | Prompt Preference |
|---------------|------------|----------|-------------------|
| High (>0.7) | Confused, overwhelmed | Clarify | Negative entropy delta |
| Medium (0.3-0.7) | Exploring, curious | Explore | Diverse, novel |
| Low (<0.3) | Certain, confident | Challenge | Positive entropy delta |

### Contextual Bandits

Each prompt is an "arm" in a multi-armed bandit problem. For each context:
- Track success rate (selections / impressions)
- Balance exploitation (high success rate) with exploration (high uncertainty)
- Use Upper Confidence Bound (UCB) for selection

### Context Hashing

Encode exploration context into a hash for bandit arm lookup:

```typescript
interface ContextFeatures {
  activeLensId: string | null;
  topicCluster: string;        // Primary topic or 'mixed'
  entropyBucket: 'high' | 'medium' | 'low';
  sessionDepth: 'shallow' | 'medium' | 'deep';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
}

// Hash: "lens:skeptic|topic:ai-safety|entropy:high|depth:shallow|time:evening"
```

---

## Schema Changes

### New Type: AdaptiveScoring

```typescript
// src/core/schema/adaptive-scoring.ts

export interface BanditArm {
  contextHash: string;          // Encoded context signature
  successRate: number;          // selections / impressions
  impressions: number;          // Times shown in this context
  selections: number;           // Times selected in this context
  lastPull: string;             // ISO timestamp of last impression
}

export interface EntropyImpact {
  avgDelta: number;             // Average entropy change after selection
  samples: number;              // Number of observations
  byInitialState: {
    high: { avgDelta: number; samples: number };
    medium: { avgDelta: number; samples: number };
    low: { avgDelta: number; samples: number };
  };
}

export interface AdaptiveScoring {
  // Contextual bandit state
  arms: BanditArm[];
  
  // Entropy impact tracking
  entropyImpact: EntropyImpact;
  
  // Freshness management
  lastGlobalShow: string;       // ISO timestamp
  showVelocity: number;         // Shows per day (7-day rolling avg)
  
  // Global exploration bonus
  isNew: boolean;               // < 50 total impressions
  explorationBonus: number;     // Decays as impressions increase
}
```

### PromptPayload Extension

```typescript
// Add to src/core/schema/prompt.ts

interface PromptPayload {
  // ... existing fields from rationalization sprint ...
  
  adaptiveScoring?: AdaptiveScoring;  // NEW
}
```

---

## Recommendation Algorithm

### Step 1: Base Relevance (Existing)

```typescript
function calculateBaseRelevance(prompt: Prompt, context: ExplorationContext): number {
  // Existing affinity and targeting logic
  // Returns 0-100 score
}
```

### Step 2: Entropy Multiplier

```typescript
function getEntropyMultiplier(
  prompt: Prompt,
  strategy: 'clarify' | 'explore' | 'challenge'
): number {
  const impact = prompt.payload.adaptiveScoring?.entropyImpact;
  if (!impact || impact.samples < 10) return 1.0; // Not enough data
  
  switch (strategy) {
    case 'clarify':
      // Prefer prompts that reduce entropy
      if (impact.avgDelta < -0.1) return 1.5;
      if (impact.avgDelta > 0.1) return 0.6;
      return 1.0;
      
    case 'challenge':
      // Prefer prompts that increase productive uncertainty
      if (impact.avgDelta > 0.1) return 1.4;
      if (impact.avgDelta < -0.1) return 0.8;
      return 1.0;
      
    case 'explore':
      // Prefer diverse prompts, slight bonus for moderate delta
      if (Math.abs(impact.avgDelta) > 0.05) return 1.2;
      return 1.0;
  }
}
```

### Step 3: UCB Selection

```typescript
function getUCBScore(
  prompt: Prompt,
  contextHash: string,
  totalPulls: number,
  explorationFactor: number = 1.5
): number {
  const arm = prompt.payload.adaptiveScoring?.arms.find(
    a => a.contextHash === contextHash
  );
  
  if (!arm || arm.impressions === 0) {
    // New context - high exploration bonus
    return 1.0 + explorationFactor;
  }
  
  // UCB formula: mean + c * sqrt(ln(N) / n)
  const exploitation = arm.successRate;
  const exploration = explorationFactor * Math.sqrt(
    Math.log(totalPulls + 1) / arm.impressions
  );
  
  return exploitation + exploration;
}
```

### Step 4: Freshness Penalty

```typescript
function getFreshnessMultiplier(prompt: Prompt): number {
  const lastShow = prompt.payload.adaptiveScoring?.lastGlobalShow;
  if (!lastShow) return 1.0;
  
  const hoursSince = (Date.now() - new Date(lastShow).getTime()) / (1000 * 60 * 60);
  
  // Full freshness after 24 hours, 50% penalty if shown in last hour
  return Math.min(1.0, 0.5 + (hoursSince / 48));
}
```

### Step 5: Diversity Selection

```typescript
function selectDiverse(
  scored: ScoredPrompt[],
  limit: number,
  minTopicDistance: number = 0.3
): Prompt[] {
  const selected: Prompt[] = [];
  const usedTopics = new Set<string>();
  
  // Sort by score descending
  const sorted = [...scored].sort((a, b) => b.score - a.score);
  
  for (const { prompt } of sorted) {
    if (selected.length >= limit) break;
    
    // Check topic diversity
    const promptTopics = prompt.payload.topicAffinities.map(a => a.topic);
    const overlap = promptTopics.filter(t => usedTopics.has(t)).length / promptTopics.length;
    
    if (overlap < (1 - minTopicDistance) || selected.length === 0) {
      selected.push(prompt);
      promptTopics.forEach(t => usedTopics.add(t));
    }
  }
  
  return selected;
}
```

### Complete Pipeline

```typescript
async function recommendPrompts(
  context: ExplorationContext,
  candidates: Prompt[],
  options: RecommendationOptions = {}
): Promise<Prompt[]> {
  const {
    limit = 3,
    explorationFactor = 1.5,
    minTopicDistance = 0.3,
  } = options;
  
  const userEntropy = context.entropyState ?? 0.5;
  const strategy = getStrategyForEntropy(userEntropy);
  const contextHash = hashContext(context);
  const totalPulls = await getTotalPulls(contextHash);
  
  const scored = candidates
    .filter(p => meetsTargeting(p, context))
    .map(prompt => {
      // Layer 1: Base relevance
      let score = calculateBaseRelevance(prompt, context);
      if (score === 0) return { prompt, score: 0 };
      
      // Layer 2: Entropy strategy
      score *= getEntropyMultiplier(prompt, strategy);
      
      // Layer 3: UCB exploration/exploitation
      score *= getUCBScore(prompt, contextHash, totalPulls, explorationFactor);
      
      // Layer 4: Freshness
      score *= getFreshnessMultiplier(prompt);
      
      // Layer 5: New prompt bonus
      if (prompt.payload.adaptiveScoring?.isNew) {
        score *= 1.3;
      }
      
      return { prompt, score };
    });
  
  return selectDiverse(scored, limit, minTopicDistance);
}
```

---

## Event Tracking

### Events to Track

| Event | Trigger | Data Captured |
|-------|---------|---------------|
| `prompt_impression` | Prompt shown to user | promptId, contextHash, entropyBucket, timestamp |
| `prompt_selection` | User engages with prompt | promptId, contextHash, entropyBucket, dwellMs, timestamp |
| `prompt_completion` | User completes interaction | promptId, contextHash, outcome, timestamp |
| `entropy_delta` | Entropy changes after interaction | promptId, initialEntropy, finalEntropy, timestamp |

### Telemetry Functions

```typescript
// src/core/telemetry/prompt-events.ts

export async function trackPromptImpression(
  promptId: string,
  context: ExplorationContext
): Promise<void> {
  const contextHash = hashContext(context);
  const entropyBucket = getEntropyBucket(context.entropyState);
  
  await supabase.rpc('increment_prompt_impressions', {
    p_prompt_id: promptId,
    p_context_hash: contextHash,
    p_entropy_bucket: entropyBucket,
  });
}

export async function trackPromptSelection(
  promptId: string,
  context: ExplorationContext,
  dwellMs: number
): Promise<void> {
  const contextHash = hashContext(context);
  const entropyBucket = getEntropyBucket(context.entropyState);
  
  await supabase.rpc('record_prompt_selection', {
    p_prompt_id: promptId,
    p_context_hash: contextHash,
    p_entropy_bucket: entropyBucket,
    p_dwell_ms: dwellMs,
  });
}

export async function trackEntropyDelta(
  promptId: string,
  initialEntropy: number,
  finalEntropy: number
): Promise<void> {
  const delta = finalEntropy - initialEntropy;
  const initialBucket = getEntropyBucket(initialEntropy);
  
  await supabase.rpc('record_entropy_impact', {
    p_prompt_id: promptId,
    p_initial_bucket: initialBucket,
    p_delta: delta,
  });
}
```

---

## DEX Compliance Matrix

### Declarative Sovereignty

| Requirement | Implementation | Pass/Fail |
|-------------|----------------|-----------|
| Strategy configurable | Entropy thresholds in config | ✅ |
| Weights adjustable | Exploration factor, diversity threshold configurable | ✅ |
| No hardcoded behavior | All multipliers from config or learned | ✅ |

**Config example:**
```typescript
export const RECOMMENDATION_CONFIG = {
  entropy: {
    highThreshold: 0.7,
    lowThreshold: 0.3,
  },
  bandit: {
    explorationFactor: 1.5,
    newPromptBonus: 1.3,
    minSamplesForImpact: 10,
  },
  diversity: {
    minTopicDistance: 0.3,
  },
  freshness: {
    fullRecoveryHours: 24,
    minMultiplier: 0.5,
  },
};
```

### Capability Agnosticism

| Requirement | Implementation | Pass/Fail |
|-------------|----------------|-----------|
| No model dependency | Pure algorithmic scoring | ✅ |
| Works offline | Local computation, async telemetry | ✅ |
| Graceful degradation | Falls back to base relevance if no adaptive data | ✅ |

### Provenance as Infrastructure

| Requirement | Implementation | Pass/Fail |
|-------------|----------------|-----------|
| Audit trail | All events timestamped | ✅ |
| Attribution | Context hash links to exploration state | ✅ |
| Reproducible | Given same inputs, same recommendations | ✅ |

### Organic Scalability

| Requirement | Implementation | Pass/Fail |
|-------------|----------------|-----------|
| New prompts work | Exploration bonus for new prompts | ✅ |
| New contexts work | UCB handles novel contexts | ✅ |
| No retraining needed | Online learning via UCB updates | ✅ |

---

## Privacy Considerations

| Concern | Mitigation |
|---------|------------|
| User tracking | No user IDs in telemetry, aggregate only |
| Session linking | Context hash doesn't include user identity |
| Filter bubbles | Diversity constraints, exploration bonus |
| Gaming | Scoring algorithm opaque to users |

---

## Success Metrics

| Metric | Baseline | Target |
|--------|----------|--------|
| Prompt selection rate | (measure current) | +20% improvement |
| Prompt completion rate | (measure current) | +15% improvement |
| Topic diversity in selections | (measure current) | Maintain or improve |
| New prompt discovery | (measure current) | +30% impressions for new prompts |
| Entropy resolution | (measure current) | Faster convergence to medium entropy |

---

## Timeline Estimate

| Phase | Effort |
|-------|--------|
| Schema + types | 1 hour |
| Context hashing | 1 hour |
| Entropy strategy | 1 hour |
| UCB implementation | 2 hours |
| Recommendation orchestrator | 2 hours |
| Event tracking | 2 hours |
| Database migrations | 1 hour |
| React hooks | 2 hours |
| Terminal integration | 2 hours |
| Testing | 3 hours |
| **Total** | **~17 hours** |

---

## Approval

- [ ] Schema changes approved
- [ ] Algorithm approach approved
- [ ] Privacy approach approved
- [ ] Telemetry design approved
