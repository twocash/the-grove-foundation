# Specification: genesis-context-fields-v1

**Sprint:** genesis-context-fields-v1  
**Date:** January 2, 2026  
**Status:** Draft  
**Architecture Spec:** `/mnt/user-data/outputs/context-fields-architecture-spec-v2.md`

---

## 1. Goals

### Primary Goal

Replace Journey-based prompt selection with **Context Fields**—a 4-dimensional targeting system that surfaces relevant prompts based on Stage, Entropy, Lens, and Moment.

### Secondary Goals

1. Promote prompts from config to first-class DEX objects with identity, analytics, and provenance
2. Enable async prompt generation from session telemetry
3. Deliver Dr. Chiang lens as proof-of-concept for institutional personalization
4. Lay foundation for Bedrock phase (Copilot management, community sharing)

---

## 2. Non-Goals

| Excluded | Reason |
|----------|--------|
| Copilot prompt management | Bedrock phase |
| Community prompt sharing | Bedrock phase |
| A/B testing infrastructure | Future sprint |
| Prompt clustering by topic | Bedrock phase |
| Migration of existing Journey content | Deprecate, don't migrate |

---

## 3. Success Criteria

### Functional Requirements

- [ ] **F1:** useSuggestedPrompts returns prompts filtered by Stage
- [ ] **F2:** useSuggestedPrompts returns prompts filtered by Entropy window
- [ ] **F3:** useSuggestedPrompts returns prompts filtered by active Lens
- [ ] **F4:** useSuggestedPrompts boosts prompts when Moment is active
- [ ] **F5:** Scoring algorithm ranks prompts by weighted relevance
- [ ] **F6:** Hard filters (stage, lens excludes) applied before soft scoring
- [ ] **F7:** Dr. Chiang lens delivers 6+ customized prompts
- [ ] **F8:** Generated prompts appear after 2 interactions
- [ ] **F9:** Generated prompts cached via PromptGenerator.generateAhead()
- [ ] **F10:** Off-topic behavior (2+ queries) triggers redirect prompt
- [ ] **F11:** High entropy (>0.7) surfaces stabilization prompts
- [ ] **F12:** Entropy decays toward 0.5 over time/interactions
- [ ] **F13:** Prompts stored as JSON, loadable without code changes

### Test Requirements

- [ ] **T1:** Unit tests for scoring algorithm (100% coverage)
- [ ] **T2:** Unit tests for ContextTargeting filter logic
- [ ] **T3:** Integration test: useSuggestedPrompts with mock EngagementState
- [ ] **T4:** Integration test: Dr. Chiang lens prompt selection
- [ ] **T5:** E2E test: Prompt surfaced on Genesis /explore route

### DEX Compliance

- [ ] **D1:** Domain expert can add prompts via JSON edit
- [ ] **D2:** New lens config requires only data changes, no code
- [ ] **D3:** Generated prompts include telemetry snapshot (provenance)
- [ ] **D4:** System functions without generation capability (graceful degradation)

---

## 4. Dependencies

### Internal Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| grove-data-layer-v1 | ✅ Complete | useGroveData<T> for prompt storage |
| EngagementBus | ✅ Exists | Provides stage, lens, exchangeCount |
| entropyCalculator | ✅ Exists | Provides entropy calculation |
| Quantum Interface | ✅ Exists | Pattern for lens-reactive content |

### External Dependencies

None. Genesis is offline-capable.

---

## 5. Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Stage enum mismatch | High | Medium | Create mapping: ARRIVAL→genesis, ORIENTED→exploration, etc. |
| Entropy not in EngagementState | High | High | Extend useEngagementBus to compute and expose entropy |
| Moment infrastructure missing | Medium | Medium | Add moment detection to EngagementBus context |
| Performance with 100+ prompts | Low | Low | Lazy loading, memoization |
| Generator produces low-quality prompts | Medium | Low | Library fallback always available |

---

## 6. Out of Scope

- Bedrock integration (Phase 2)
- Prompt versioning and history
- Multi-tenant prompt libraries
- Real-time collaborative editing
- Export/import prompt bundles
- Analytics dashboard (separate sprint)

---

## 7. Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Prompt as DEX object | Pattern 7: Object Model | PromptObject implements GroveObjectMeta + payload |
| Prompt storage | grove-data-layer-v1 | Add 'prompt' to GroveObjectType |
| Lens-reactive behavior | Pattern 1: Quantum Interface | Add entropy/moment dimensions to targeting |
| State aggregation | Pattern 2: Engagement Machine | Extend EngagementState with computed entropy |
| Prompt card styling | Pattern 4: Token Namespaces | Use existing design tokens |

---

## 8. Canonical Source Audit

### Prompt System Canonicalization

| Capability | Canonical Home | Notes |
|------------|----------------|-------|
| Prompt schemas | `src/core/context-fields/types.ts` | PromptObject, ContextTargeting, etc. |
| Scoring algorithm | `src/core/context-fields/scoring.ts` | calculateRelevance() pure function |
| Prompt generation | `src/core/context-fields/generator.ts` | PromptGenerator class |
| Telemetry schema | `src/core/context-fields/telemetry.ts` | SessionTelemetry interface |
| Prompt collection | `src/core/context-fields/collection.ts` | In-memory store for Genesis |
| Context state hook | `hooks/useContextState.ts` | Aggregates 4D state |
| Main hook | `hooks/useSuggestedPrompts.ts` | Rewritten to use Context Fields |

### No Duplication Certification

✅ This sprint creates new canonical homes. No existing capability is duplicated.

---

## 9. Technical Specification

### 9.1 PromptObject Schema

```typescript
interface PromptObject {
  // DEX Identity
  id: string;
  objectType: 'prompt';
  created: number;
  modified: number;
  author: 'system' | 'generated' | string;
  
  // Content
  label: string;                    // User-visible text
  description?: string;             // Tooltip
  executionPrompt: string;          // What LLM receives
  systemContext?: string;           // Additional system prompt
  
  // Visual
  icon?: string;
  variant?: 'default' | 'glow' | 'subtle' | 'urgent';
  
  // Relationships
  tags: string[];
  topicAffinities: { topicId: string; weight: number }[];
  lensAffinities: { lensId: string; weight: number; customLabel?: string }[];
  
  // Targeting
  targeting: ContextTargeting;
  
  // Scoring
  baseWeight?: number;              // Default: 50
  
  // Analytics
  stats: {
    impressions: number;
    selections: number;
    completions: number;
    avgEntropyDelta: number;
    avgDwellAfter: number;
    lastSurfaced?: number;
  };
  
  // Lifecycle
  status: 'draft' | 'active' | 'deprecated';
  source: 'library' | 'generated' | 'user';
  generatedFrom?: GenerationContext;
  
  // Behavioral
  cooldown?: number;
  maxShows?: number;
}
```

### 9.2 ContextTargeting Schema

```typescript
interface ContextTargeting {
  // Stage dimension
  stages?: Stage[];
  excludeStages?: Stage[];
  
  // Entropy dimension
  entropyWindow?: { min?: number; max?: number };
  
  // Lens dimension
  lensIds?: string[];
  excludeLenses?: string[];
  
  // Moment dimension
  momentTriggers?: string[];
  requireMoment?: boolean;
  
  // Interaction history
  minInteractions?: number;
  afterPromptIds?: string[];
  
  // Topic clustering
  topicClusters?: string[];
}

type Stage = 'genesis' | 'exploration' | 'synthesis' | 'advocacy';
```

### 9.3 Scoring Algorithm

```
Score = (stageScore × 2.0) + 
        (entropyScore × 1.5) + 
        (lensScore × 3.0) + 
        (topicScore × 2.0) + 
        momentBoost +                    // Additive, default 3.0 per matching moment
        (baseWeight × 0.5 / 100)

Where:
- stageScore = 1.0 if stage matches, 0.0 otherwise (HARD FILTER)
- entropyScore = 1.0 if within window, 0.0 otherwise
- lensScore = lensAffinity weight (0.0-1.0), or 0.0 if excluded (HARD FILTER)
- topicScore = max(topicAffinity weights for explored topics)
- momentBoost = 3.0 per matching active moment (additive)
- baseWeight = manual priority (0-100, default 50)
```

### 9.4 Stage Mapping

| Current (EngagementBus) | Context Fields | Transition |
|------------------------|----------------|------------|
| ARRIVAL | genesis | interactions 0-2 |
| ORIENTED | exploration | interactions 3-5, OR 1+ topics |
| EXPLORING | synthesis | interactions 6+, OR 2+ topics |
| ENGAGED | advocacy | 1+ sprouts OR 3+ visits OR 15+ total |

---

## 10. API Contracts

### useSuggestedPrompts Hook

```typescript
interface UseSuggestedPromptsOptions {
  maxPrompts?: number;          // Default: 3
  includeGenerated?: boolean;   // Default: true after 2 interactions
}

interface UseSuggestedPromptsResult {
  prompts: PromptObject[];      // Sorted by relevance score
  stage: Stage;
  entropy: number;
  activeMoments: string[];
  isLoading: boolean;
  error: Error | null;
  refreshPrompts: () => void;
  trackSelection: (promptId: string) => void;
}

function useSuggestedPrompts(options?: UseSuggestedPromptsOptions): UseSuggestedPromptsResult;
```

### useContextState Hook

```typescript
interface ContextState {
  stage: Stage;
  entropy: number;
  activeLensId: string | null;
  activeMoments: string[];
  interactionCount: number;
  topicsExplored: string[];
  sproutsCaptured: number;
  offTopicCount: number;
}

function useContextState(): ContextState;
```

### PromptGenerator Class

```typescript
class PromptGenerator {
  constructor(telemetry: SessionTelemetry);
  
  // Generate prompts for future context
  async generateAhead(targetContext: ContextState): Promise<PromptObject[]>;
  
  // Get cached prompts for current context
  getCached(context: ContextState): PromptObject[];
  
  // Clear cache
  invalidateCache(): void;
}
```

---

## 11. Dr. Chiang Lens Specification

### Lens Configuration

```typescript
const drChiangLens = {
  id: 'dr-chiang',
  name: 'Dr. Chiang',
  description: 'Purdue University President perspective',
  color: 'violet',
  icon: '🎓',
  
  // Scoring overrides
  scoringOverrides: {
    lensPrecision: 4.0,           // Higher weight on lens match
    momentBoost: 4.0,             // Stronger moment response
  },
  
  // Default prompts for this lens
  defaultPromptIds: [
    'chiang-research-infrastructure',
    'chiang-land-grant-mission',
    'chiang-distributed-ai',
    'chiang-partnership',
    'chiang-stabilize',
    'chiang-next-steps',
  ],
};
```

### Required Prompts (6 minimum)

1. **chiang-research-infrastructure** — How Grove supports research computing
2. **chiang-land-grant-mission** — Connection to public service mission
3. **chiang-distributed-ai** — Why distributed AI matters for universities
4. **chiang-partnership** — What partnership with Grove Foundation looks like
5. **chiang-stabilize** — High-entropy stabilization (synthesis)
6. **chiang-next-steps** — Call to action for institutional engagement

---

## 12. Off-Topic Handling

### Detection

Track `offTopicCount` in session telemetry. Increment when:
- User query doesn't match any known topic clusters
- Response entropy delta is high (conversation scattered)

### Response

After 2+ off-topic queries in sequence:
1. Surface "redirect" prompt: "I notice we've drifted from Grove's focus areas..."
2. Offer 3 on-topic options based on current stage
3. Reset off-topic counter on any on-topic interaction

---

## 13. File Deliverables

### New Files

```
src/core/context-fields/
├── types.ts
├── scoring.ts
├── generator.ts
├── telemetry.ts
└── collection.ts

src/data/prompts/
├── base.prompts.json
├── dr-chiang.prompts.json
└── index.ts

src/data/lenses/
└── dr-chiang.lens.ts

hooks/
├── useContextState.ts
├── useSessionTelemetry.ts
└── usePromptCollection.ts
```

### Modified Files

```
hooks/useSuggestedPrompts.ts
src/core/data/grove-data-provider.ts
src/core/schema/engagement.ts
hooks/useEngagementBus.ts
```

### Deprecated Files

```
src/data/prompts/stage-prompts.ts
```

---

## Specification Complete

**Ready for:** Phase 3 (Architecture)  
**Estimated Duration:** 5-7 days  
**Next Step:** Create ARCHITECTURE.md
