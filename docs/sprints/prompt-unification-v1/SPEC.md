# Specification: prompt-unification-v1

**Version:** 1.0  
**Date:** January 3, 2026  
**Status:** Draft  
**Branch:** `bedrock` + `explore`  
**Scope:** Reference DEX Trellis 1.0 Implementation

---

## Constitutional Reference

- [x] PROJECT_PATTERNS.md
- [x] The_Trellis_Architecture__First_Order_Directives.md
- [x] Trellis_Architecture_Bedrock_Addendum.md
- [x] grove-data-layer-v1 sprint artifacts
- [x] BEDROCK_SPRINT_CONTRACT.md

---

## Domain Contract

**Applicable contract:** Bedrock Sprint Contract v1.0  
**Contract version:** 1.0  
**Additional requirements:** 
- DEX Compliance Matrix with evidence (Article I, Section 1.2)
- Canonical Console Pattern (Article II)
- Copilot Integration Mandate (Article III)
- GroveObject schema compliance (Article I)
- No imports from legacy `src/foundation/`

---

## Phase 0: Pattern Check (COMPLETE)

### Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Object storage | **Pattern 7: Object Model** | Add `prompt` to GroveObjectType union |
| Data persistence | **Data Layer (grove-data-layer-v1)** | Add `prompts` table mapping to SupabaseAdapter |
| Console structure | **Bedrock Console Pattern** | New PromptWorkshop using BedrockLayout |
| Object rendering | **Pattern 7: GroveObjectCard** | Add PROMPT renderer to CONTENT_RENDERERS |
| Styling | **Pattern 4: Token Namespaces** | Use existing `--card-*` tokens |
| State management | **Pattern 2: Engagement Machine** | Stats updates via existing telemetry hooks |

### New Patterns Proposed

**None required.** All needs met by extending existing patterns:
- Prompt is a new GroveObject type (Pattern 7)
- PromptWorkshop is a new Bedrock console (Bedrock Contract)
- Data flows through existing Data Layer infrastructure

---

## Phase 0.5: Canonical Source Audit (COMPLETE)

| Capability | Canonical Home | Current Approach | Recommendation |
|------------|----------------|------------------|----------------|
| Object identity | `src/core/schema/grove-object.ts` | ✅ Will extend | **EXTEND** GroveObjectType union |
| Data access | `src/core/data/grove-data-provider.ts` | ✅ Will extend | **EXTEND** with 'prompt' type |
| Console shell | `src/bedrock/primitives/BedrockLayout` | ✅ Will use | **USE** as-is |
| Object grid | `src/bedrock/components/ObjectGrid` | ✅ Will use | **USE** as-is |
| Object cards | `src/surface/components/GroveObjectCard` | Extend | **EXTEND** with Prompt renderer |
| Inspector | `src/bedrock/primitives/BedrockInspector` | ✅ Will use | **USE** as-is |
| Copilot | `src/bedrock/primitives/BedrockCopilot` | ✅ Will use | **USE** with prompt context |

### Porting Plan

No porting required. This sprint creates a new object type using existing infrastructure.

### No Duplication Certification

I confirm this sprint does not create parallel implementations of existing capabilities. All work extends Pattern 7 (Object Model) and the Bedrock Console Pattern.

---

## Executive Summary

**What:** Build the canonical Prompt object type—unified contextual content with declarative sequence membership.

**Why:** All guided content (journeys, briefings, wizards, tours) share identical structure: *content that knows when it's relevant, optionally organized into ordered sequences.* The difference is metadata, not architecture.

**DEX Alignment:** This is the reference implementation of Pillar I (Declarative Sovereignty). Sequences exist in configuration. The engine interprets them. Domain experts create journeys by editing JSON, never code.

**Scope:** Clean implementation on bedrock/explore. Legacy systems are irrelevant to this sprint—they continue functioning on main until deprecated.

---

## The Unified Content Pattern

### The Insight

| Content Type | What It Really Is |
|--------------|-------------------|
| Journey waypoint | Prompt with `sequences[{ groupId: 'journey-X' }]` |
| Stakeholder briefing | Prompt with `lensAffinities[{ lensId: 'persona-X' }]` |
| Wizard step | Prompt with `sequences[{ groupId: 'wizard-X' }]` |
| Onboarding tour | Prompt with `sequences[{ groupId: 'tour-X' }]` |
| FAQ/Objection | Prompt with `targeting.momentTriggers` |

**One object type. Different metadata. Same engine.**

### The Pattern

```
┌─────────────────────────────────────────────────────────────────────┐
│  Prompt (GroveObject<PromptPayload>)                               │
│                                                                     │
│  meta: { id, type: 'prompt', title, createdBy, ... }              │
│                                                                     │
│  payload: {                                                         │
│    content: "The execution prompt text..."                         │
│    targeting: { stages, entropy, lenses, moments }                 │
│    affinities: { topics[], lenses[] }                              │
│    sequences: [                                                     │
│      { groupId: 'journey-ratchet', order: 1 },                    │
│      { groupId: 'briefing-chiang', order: 4 }                      │
│    ]                                                                │
│    stats: { impressions, selections, completions }                 │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
```

**One prompt, multiple sequences.** "The Ratchet Effect" appears in:
- `journey-ratchet` (position 1, the hook)
- `briefing-chiang` (position 4, technical evidence)  
- `research-capability` (position 2, foundation)

---

## DEX Compliance Matrix (Bedrock Contract Article I)

### Feature: Prompt Object Type

| Test | Pass | Evidence |
|------|------|----------|
| Declarative Sovereignty | ✅ | Sequences defined via `payload.sequences[]` JSON, not code. Domain experts create journeys by adding prompts with `groupId` metadata. No deployment required. |
| Capability Agnosticism | ✅ | `scorePrompt()` is pure algorithm—no AI dependency. Copilot enhances editing but system functions without it. |
| Provenance as Infrastructure | ✅ | `meta.createdBy` tracks origin (human/ai/system/import). `payload.generatedFrom` captures AI generation context. |
| Organic Scalability | ✅ | New sequence type = new `groupId` prefix (e.g., `onboarding-*`). UI filters by prefix. Zero code changes. |

**Blocking issues:** None.

### Feature: PromptWorkshop Console

| Test | Pass | Evidence |
|------|------|----------|
| Declarative Sovereignty | ✅ | Console navigation defined in `navigation.ts` config. Object display via declarative CONTENT_RENDERERS. |
| Capability Agnosticism | ✅ | All CRUD operations work without Copilot. Copilot provides AI assistance, not required functionality. |
| Provenance as Infrastructure | ✅ | All edits tracked via GroveObject.meta.updatedAt. Copilot edits tagged with model/session. |
| Organic Scalability | ✅ | Adding new prompt fields = schema change only. Console renders any PromptPayload shape. |

**Blocking issues:** None.

### Compliance Tests

```
TEST 1: Declarative Sovereignty
Q: Can a domain expert create a new journey without code?
A: Add prompts with sequences[{ groupId: 'journey-new', order: N }]
   → Journey appears in UI. No deployment.

TEST 2: Capability Agnosticism  
Q: Does the system work without AI?
A: Context scoring is pure algorithm. Copilot is enhancement layer.

TEST 3: Provenance
Q: Can we trace every prompt to origin?
A: meta.createdBy shows human/ai/system. generatedFrom captures AI context.

TEST 4: Organic Scalability
Q: Can we add sequence types without code?
A: sequences[{ groupId: 'onboarding-new' }] works immediately.
   UI filters by groupId prefix. No code required.
```

---

## Functional Requirements

### Core Object Model

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1 | Prompt extends GroveObject<PromptPayload> | Must |
| FR-2 | PromptPayload includes 4D targeting (stage, entropy, lens, moment) | Must |
| FR-3 | PromptPayload includes sequences[] array | Must |
| FR-4 | Sequences support order, bridge, successCriteria | Must |
| FR-5 | Stats tracking persists (impressions, selections, completions) | Must |
| FR-6 | AI-generated prompts include provenance | Should |

### Data Layer

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-7 | Add 'prompt' to GroveObjectType union | Must |
| FR-8 | Create knowledge.prompts Supabase table | Must |
| FR-9 | useGroveData<PromptPayload>('prompt') operational | Must |
| FR-10 | Query by sequences[].groupId | Must |
| FR-11 | Query by targeting criteria | Must |
| FR-12 | Query by lensAffinities[].lensId | Must |

### Bedrock Console: PromptWorkshop

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-13 | Follows canonical console pattern (BedrockLayout) | Must |
| FR-14 | Left nav: sequences grouped by type | Must |
| FR-15 | Content area: prompt grid/list | Must |
| FR-16 | Inspector: prompt detail + edit | Must |
| FR-17 | Filter by sequence groupId | Must |
| FR-18 | Visual sequence editor (drag-drop order) | Should |
| FR-19 | Preview prompt in context (lens/stage) | Should |
| FR-20 | Copilot slot with prompt actions | Should |

### Explore Surface Integration

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-21 | usePromptSuggestions hook (context-scored) | Must |
| FR-22 | useSequence hook (prompts by groupId, ordered) | Must |
| FR-23 | Journey mode uses useSequence | Must |
| FR-24 | Free exploration uses usePromptSuggestions | Must |
| FR-25 | Stats update on impression/selection | Must |

---

## Technical Design

### PromptPayload Type

```typescript
// src/core/schema/prompt.ts

import type { GroveObject } from './grove-object';

/** Lifecycle stages for targeting */
export type PromptStage = 'genesis' | 'exploration' | 'synthesis' | 'advocacy';

/** Sequence types for organization */
export type SequenceType = 
  | 'journey'    // Guided exploration path
  | 'briefing'   // Stakeholder-specific flow
  | 'wizard'     // Multi-step configuration
  | 'tour'       // Feature onboarding
  | 'research'   // Academic deep-dive
  | 'faq'        // Support/objection handling
  | string;      // Extensible

/** Topic relevance weighting */
export interface TopicAffinity {
  topicId: string;
  weight: number;  // 0.0-1.0
}

/** Lens relevance with optional override */
export interface LensAffinity {
  lensId: string;
  weight: number;  // 0.0-1.0
  labelOverride?: string;
}

/** Declarative targeting criteria */
export interface PromptTargeting {
  stages?: PromptStage[];
  excludeStages?: PromptStage[];
  entropyWindow?: { min?: number; max?: number };
  lensIds?: string[];
  excludeLenses?: string[];
  momentTriggers?: string[];
  requireMoment?: boolean;
  minInteractions?: number;
  afterPromptIds?: string[];
  topicClusters?: string[];
}

/** Sequence membership */
export interface PromptSequence {
  groupId: string;           // 'journey-ratchet', 'briefing-chiang'
  groupType: SequenceType;
  order: number;             // Position (1-based)
  bridgeAfter?: string;      // Narrative transition
  titleOverride?: string;    // Custom title for this sequence
  successCriteria?: {
    minExchanges?: number;
    topicsMentioned?: string[];
    entropyDelta?: number;
  };
}

/** Analytics */
export interface PromptStats {
  impressions: number;
  selections: number;
  completions: number;
  avgEntropyDelta: number;
  avgDwellMs: number;
  lastSurfaced?: string;
}

/** AI generation context */
export interface PromptGenerationContext {
  sessionId: string;
  modelId: string;
  generatedAt: string;
  reasoning?: string;
  telemetrySnapshot?: Record<string, unknown>;
}

/** The payload */
export interface PromptPayload {
  // Content
  label: string;
  description?: string;
  executionPrompt: string;
  systemContext?: string;

  // Visual
  icon?: string;
  variant?: 'default' | 'glow' | 'subtle' | 'urgent';

  // Classification
  tags: string[];
  topicAffinities: TopicAffinity[];
  lensAffinities: LensAffinity[];

  // Targeting
  targeting: PromptTargeting;
  baseWeight?: number;

  // Sequences (optional, array)
  sequences?: PromptSequence[];

  // Analytics
  stats: PromptStats;

  // Provenance
  source: 'library' | 'generated' | 'user';
  generatedFrom?: PromptGenerationContext;

  // Lifecycle
  cooldownMs?: number;
  maxShows?: number;
}

/** Full Prompt object */
export type Prompt = GroveObject<PromptPayload>;

/** Derived sequence definition */
export interface SequenceDefinition {
  groupId: string;
  groupType: SequenceType;
  title: string;
  description?: string;
  estimatedMinutes?: number;
  promptCount: number;
}
```

### Data Layer Extension

```typescript
// src/core/schema/grove-object.ts (extend union)

export type GroveObjectType =
  | 'lens'
  | 'hub'
  | 'sprout'
  | 'card'
  | 'moment'
  | 'document'
  | 'prompt'    // NEW
  | string;
```

### Supabase Schema

```sql
-- knowledge.prompts
CREATE TABLE knowledge.prompts (
  -- Identity (GroveObjectMeta)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'draft', 'archived')),
  tags TEXT[] DEFAULT '{}',
  favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by JSONB,

  -- Content
  label TEXT NOT NULL,
  execution_prompt TEXT NOT NULL,
  system_context TEXT,
  variant TEXT DEFAULT 'default',

  -- Classification (JSONB for flexibility)
  topic_affinities JSONB DEFAULT '[]',
  lens_affinities JSONB DEFAULT '[]',
  
  -- Targeting
  targeting JSONB DEFAULT '{}',
  base_weight INTEGER DEFAULT 50,
  
  -- Sequences
  sequences JSONB DEFAULT '[]',
  
  -- Stats
  stats JSONB DEFAULT '{"impressions":0,"selections":0,"completions":0,"avgEntropyDelta":0,"avgDwellMs":0}',
  
  -- Provenance
  source TEXT DEFAULT 'library' CHECK (source IN ('library', 'generated', 'user')),
  generated_from JSONB,
  
  -- Lifecycle
  cooldown_ms INTEGER,
  max_shows INTEGER
);

-- Indexes
CREATE INDEX idx_prompts_status ON knowledge.prompts(status);
CREATE INDEX idx_prompts_source ON knowledge.prompts(source);
CREATE INDEX idx_prompts_sequences ON knowledge.prompts USING GIN (sequences);
CREATE INDEX idx_prompts_lens_affinities ON knowledge.prompts USING GIN (lens_affinities);
CREATE INDEX idx_prompts_targeting ON knowledge.prompts USING GIN (targeting);

-- RLS (permissive for now)
ALTER TABLE knowledge.prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON knowledge.prompts FOR SELECT USING (true);
CREATE POLICY "Authenticated write" ON knowledge.prompts FOR ALL USING (true);

-- Updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON knowledge.prompts
  FOR EACH ROW EXECUTE FUNCTION knowledge.set_updated_at();
```

### Query Patterns

```typescript
// Get prompts in a sequence (ordered)
const { data: journeyPrompts } = useGroveData<PromptPayload>('prompt', {
  filter: (p) => p.sequences?.some(s => s.groupId === 'journey-ratchet'),
  sort: (a, b) => {
    const aOrder = a.sequences?.find(s => s.groupId === 'journey-ratchet')?.order ?? 0;
    const bOrder = b.sequences?.find(s => s.groupId === 'journey-ratchet')?.order ?? 0;
    return aOrder - bOrder;
  }
});

// Get prompts for a lens
const { data: chiangPrompts } = useGroveData<PromptPayload>('prompt', {
  filter: (p) => p.lensAffinities.some(a => a.lensId === 'dr-chiang' && a.weight > 0.5)
});

// Get all sequences (derived)
function deriveSequences(prompts: Prompt[]): SequenceDefinition[] {
  const groups = new Map<string, { type: SequenceType; count: number }>();
  
  prompts.forEach(p => {
    p.payload.sequences?.forEach(seq => {
      const existing = groups.get(seq.groupId);
      if (existing) {
        existing.count++;
      } else {
        groups.set(seq.groupId, { type: seq.groupType, count: 1 });
      }
    });
  });
  
  return Array.from(groups.entries()).map(([groupId, { type, count }]) => ({
    groupId,
    groupType: type,
    title: formatGroupTitle(groupId),
    promptCount: count
  }));
}
```

---

## Console Design: PromptWorkshop

### Layout

```
┌────────────────────────────────────────────────────────────────────────────┐
│ PromptWorkshop                                              [+ New Prompt] │
│ Contextual content with declarative sequence membership                   │
├────────────────────────────────────────────────────────────────────────────┤
│ 📊 156 Active │ 📁 12 Sequences │ 🎯 89% Targeted │ 📈 2.4k Selections    │
├──────────────┬───────────────────────────────┬─────────────────────────────┤
│ SEQUENCES    │ PROMPTS                       │ INSPECTOR                   │
│              │                               │                             │
│ ▼ Journeys   │ ┌─────────────────────────┐  │ The Ratchet Effect          │
│   simulation │ │ 🎯 The Ratchet Effect   │◀─│ ─────────────────────       │
│   stakes     │ │ journey-ratchet #1      │  │ Label: The Ratchet Effect  │
│   ratchet ◀  │ │ 85 selections           │  │ Stage: exploration          │
│   diary      │ └─────────────────────────┘  │                             │
│              │ ┌─────────────────────────┐  │ Sequences:                  │
│ ▼ Briefings  │ │ 📚 The 21-month lag     │  │ • journey-ratchet (#1)     │
│   dr-chiang  │ │ journey-ratchet #2      │  │ • briefing-chiang (#4)     │
│   wayne      │ └─────────────────────────┘  │                             │
│              │                               │ Targeting:                  │
│ ▼ Wizards    │ [4 more in sequence]         │ • stages: exploration       │
│   custom-lens│                               │ • entropy: 0.3-0.7         │
│              │                               │                             │
│ ○ All        │                               │ ─────────────────────       │
│ ○ Unsequenced│                               │ 🤖 COPILOT                  │
└──────────────┴───────────────────────────────┴─────────────────────────────┘
```

### Components

| Component | Purpose |
|-----------|---------|
| `PromptWorkshop.tsx` | Console root |
| `SequenceNav.tsx` | Left nav with grouped sequences |
| `PromptGrid.tsx` | Content area grid |
| `PromptCard.tsx` | Grid item |
| `PromptInspector.tsx` | Right panel detail |
| `PromptEditor.tsx` | Edit form |
| `SequenceEditor.tsx` | Drag-drop ordering |

### Copilot Actions

| Action | Description |
|--------|-------------|
| `suggest-prompt` | Generate new prompt for context |
| `refine-wording` | Improve label/execution text |
| `generate-bridge` | Create transition between prompts |
| `analyze-coverage` | Find gaps in sequence |
| `suggest-targeting` | Recommend targeting criteria |

### Console Implementation Checklist (Bedrock Contract Article II)

- [ ] Uses `BedrockLayout` as shell
- [ ] Header displays: title, description, primary action (`+ New Prompt`)
- [ ] Metrics row shows 4-6 relevant stats (Active, Sequences, Targeted%, Selections)
- [ ] Navigation column uses `ObjectList` for sequence tree
- [ ] Content area uses `ObjectGrid` for prompt display
- [ ] Inspector uses `BedrockInspector` shell with PromptInspector content
- [ ] Copilot panel integrated with prompt context (BedrockCopilotContext)
- [ ] Navigation declaratively configured in `navigation.ts`
- [ ] All objects use `GroveObject<PromptPayload>` schema
- [ ] No imports from legacy `src/foundation/`

---

## Explore Integration

### Hooks

```typescript
// usePromptSuggestions - context-scored prompts for free exploration
function usePromptSuggestions(context: ExplorationContext): Prompt[] {
  const { data: prompts } = useGroveData<PromptPayload>('prompt', {
    filter: (p) => p.status === 'active'
  });
  
  return useMemo(() => {
    return prompts
      .map(p => ({ prompt: p, score: scorePrompt(p, context) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(({ prompt }) => prompt);
  }, [prompts, context]);
}

// useSequence - prompts for a specific sequence
function useSequence(groupId: string): { 
  definition: SequenceDefinition; 
  prompts: Prompt[];
  currentIndex: number;
  advance: () => void;
} {
  const { data: allPrompts } = useGroveData<PromptPayload>('prompt');
  
  const prompts = useMemo(() => {
    return allPrompts
      .filter(p => p.payload.sequences?.some(s => s.groupId === groupId))
      .sort((a, b) => {
        const aOrder = a.payload.sequences?.find(s => s.groupId === groupId)?.order ?? 0;
        const bOrder = b.payload.sequences?.find(s => s.groupId === groupId)?.order ?? 0;
        return aOrder - bOrder;
      });
  }, [allPrompts, groupId]);
  
  // ... state management for progression
}
```

### Scoring Algorithm

```typescript
function scorePrompt(prompt: Prompt, context: ExplorationContext): number {
  const p = prompt.payload;
  let score = p.baseWeight ?? 50;
  
  // Stage match
  if (p.targeting.stages?.includes(context.stage)) score += 20;
  if (p.targeting.excludeStages?.includes(context.stage)) return 0;
  
  // Entropy window
  if (p.targeting.entropyWindow) {
    const { min = 0, max = 1 } = p.targeting.entropyWindow;
    if (context.entropy < min || context.entropy > max) return 0;
  }
  
  // Lens match
  if (p.targeting.lensIds?.includes(context.lensId)) score += 30;
  if (p.targeting.excludeLenses?.includes(context.lensId)) return 0;
  
  // Lens affinity
  const lensAffinity = p.lensAffinities.find(a => a.lensId === context.lensId);
  if (lensAffinity) score += lensAffinity.weight * 25;
  
  // Topic affinity
  context.activeTopics.forEach(topic => {
    const affinity = p.topicAffinities.find(a => a.topicId === topic);
    if (affinity) score += affinity.weight * 15;
  });
  
  // Moment triggers
  if (p.targeting.momentTriggers?.some(m => context.activeMoments.includes(m))) {
    score += 40;
  }
  
  // Cooldown check
  if (p.cooldownMs && p.stats.lastSurfaced) {
    const elapsed = Date.now() - new Date(p.stats.lastSurfaced).getTime();
    if (elapsed < p.cooldownMs) return 0;
  }
  
  // Max shows check
  if (p.maxShows && p.stats.impressions >= p.maxShows) return 0;
  
  return score;
}
```

---

## Implementation Phases

### Phase 1: Schema & Data Layer
- [ ] Create `src/core/schema/prompt.ts`
- [ ] Extend GroveObjectType with 'prompt'
- [ ] Create Supabase table `knowledge.prompts`
- [ ] Update SupabaseAdapter table mapping
- [ ] Verify useGroveData<PromptPayload>('prompt') works

### Phase 2: PromptWorkshop Console
- [ ] Create console configuration
- [ ] Implement PromptWorkshop.tsx
- [ ] Implement SequenceNav.tsx
- [ ] Implement PromptGrid.tsx + PromptCard.tsx
- [ ] Implement PromptInspector.tsx
- [ ] Implement PromptEditor.tsx
- [ ] Wire to data layer

### Phase 3: Explore Integration
- [ ] Create usePromptSuggestions hook
- [ ] Create useSequence hook
- [ ] Implement scoring algorithm
- [ ] Wire stats tracking
- [ ] Update prompt display components

### Phase 4: Seed Data
- [ ] Create seed prompts for Grove fundamentals
- [ ] Create seed sequence: journey-ratchet
- [ ] Create seed sequence: journey-simulation
- [ ] Create seed briefing: briefing-chiang
- [ ] Verify end-to-end flow

---

## Testing Strategy

### Unit Tests
| Test | Verifies |
|------|----------|
| PromptPayload validation | Schema correctness |
| scorePrompt algorithm | Targeting logic |
| deriveSequences | Sequence extraction |

### Integration Tests
| Test | Verifies |
|------|----------|
| CRUD operations | Data layer works |
| Sequence queries | Filter by groupId |
| Stats update | Increment operations |

### E2E Tests
| Test | Verifies |
|------|----------|
| Create prompt in Bedrock | Console workflow |
| View in /explore | Runtime consumption |
| Journey progression | Sequence navigation |

---

## Success Criteria

| Criterion | Measurement |
|-----------|-------------|
| Type system complete | PromptPayload compiles, validates |
| Data layer works | CRUD via useGroveData |
| Console functional | Create, edit, organize prompts |
| Sequences work | Query by groupId returns ordered prompts |
| Scoring works | Context-appropriate prompts surface |
| Stats persist | Impressions/selections increment |

---

## Out of Scope (Future Sprints)

- AI prompt generation (copilot enhancement)
- Visual sequence designer (drag-drop)
- A/B testing framework
- Advanced analytics dashboard
- Legacy system migration (stays on main)

---

## Open Questions

| Question | Options | Recommendation |
|----------|---------|----------------|
| Sequence metadata storage | Separate table vs. derived | **Derived** (simpler, single source of truth) |
| Real-time sync | Supabase realtime vs. polling | **Polling** for MVP |
| Stats aggregation | Client vs. server | **Server** for accuracy |

---

## Approvals

- [ ] Architecture review (DEX compliance)
- [ ] Schema review
- [ ] Ready for Foundation Loop

---

*This is the reference implementation of unified contextual content for DEX Trellis 1.0.*
