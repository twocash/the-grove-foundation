# Architecture: prompt-unification-v1

**Target State Design**

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PROMPT SYSTEM                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                  │
│  │   Bedrock    │    │   Explore    │    │   Runtime    │                  │
│  │  Console     │    │   Surface    │    │   Scoring    │                  │
│  │              │    │              │    │              │                  │
│  │ CRUD prompts │    │ Show prompts │    │ Score by     │                  │
│  │ Edit sequences│   │ Navigate     │    │ context      │                  │
│  │ Track stats  │    │ sequences    │    │              │                  │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘                  │
│         │                   │                   │                           │
│         └───────────────────┼───────────────────┘                           │
│                             ▼                                               │
│                 ┌───────────────────────┐                                   │
│                 │  useGroveData<Prompt> │                                   │
│                 │      (Data Layer)     │                                   │
│                 └───────────┬───────────┘                                   │
│                             ▼                                               │
│                 ┌───────────────────────┐                                   │
│                 │   knowledge.prompts   │                                   │
│                 │      (Supabase)       │                                   │
│                 └───────────────────────┘                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Write Path (Bedrock)

```
Admin creates/edits prompt in PromptWorkshop
    ↓
PromptEditor validates PromptPayload
    ↓
useGroveData.create/update('prompt', data)
    ↓
SupabaseAdapter inserts/updates knowledge.prompts
    ↓
Realtime subscription notifies other clients
```

### Read Path (Explore)

```
User visits /explore
    ↓
usePromptSuggestions(context)
    ↓
useGroveData.list('prompt', { filter: { status: 'active' } })
    ↓
scorePrompt(prompt, context) for each
    ↓
Sort by score, return top N
    ↓
Display in PromptSuggestion component
```

### Sequence Navigation

```
User selects journey
    ↓
useSequence('journey-ratchet')
    ↓
useGroveData.list('prompt')
    ↓
Filter: payload.sequences[].groupId === 'journey-ratchet'
    ↓
Sort by sequences[].order
    ↓
Present as ordered waypoints
```

---

## Type Definitions

### PromptPayload (Complete)

```typescript
// src/core/schema/prompt.ts

import type { GroveObject } from './grove-object';

// Lifecycle stages
export type PromptStage = 'genesis' | 'exploration' | 'synthesis' | 'advocacy';

// Sequence types
export type SequenceType = 
  | 'journey' | 'briefing' | 'wizard' 
  | 'tour' | 'research' | 'faq' 
  | string;

// Topic affinity
export interface TopicAffinity {
  topicId: string;
  weight: number;
}

// Lens affinity
export interface LensAffinity {
  lensId: string;
  weight: number;
  labelOverride?: string;
}

// Targeting
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

// Sequence membership
export interface PromptSequence {
  groupId: string;
  groupType: SequenceType;
  order: number;
  bridgeAfter?: string;
  titleOverride?: string;
  successCriteria?: {
    minExchanges?: number;
    topicsMentioned?: string[];
    entropyDelta?: number;
  };
}

// Stats
export interface PromptStats {
  impressions: number;
  selections: number;
  completions: number;
  avgEntropyDelta: number;
  avgDwellMs: number;
  lastSurfaced?: string;
}

// AI generation context
export interface PromptGenerationContext {
  sessionId: string;
  modelId: string;
  generatedAt: string;
  reasoning?: string;
}

// The payload
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

  // Sequences
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

// Full Prompt object
export type Prompt = GroveObject<PromptPayload>;

// Derived sequence
export interface SequenceDefinition {
  groupId: string;
  groupType: SequenceType;
  title: string;
  description?: string;
  estimatedMinutes?: number;
  promptCount: number;
}
```

---

## Database Schema

### Supabase Table

```sql
-- knowledge.prompts
CREATE TABLE knowledge.prompts (
  -- Meta (GroveObjectMeta)
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT DEFAULT 'prompt',
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

  -- Payload (PromptPayload) - flattened for query efficiency
  label TEXT NOT NULL,
  execution_prompt TEXT NOT NULL,
  system_context TEXT,
  variant TEXT DEFAULT 'default',
  
  -- Affinities (JSONB)
  topic_affinities JSONB DEFAULT '[]',
  lens_affinities JSONB DEFAULT '[]',
  
  -- Targeting (JSONB)
  targeting JSONB DEFAULT '{}',
  base_weight INTEGER DEFAULT 50,
  
  -- Sequences (JSONB array)
  sequences JSONB DEFAULT '[]',
  
  -- Stats (JSONB)
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

-- RLS
ALTER TABLE knowledge.prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON knowledge.prompts FOR SELECT USING (true);
CREATE POLICY "Authenticated write" ON knowledge.prompts FOR ALL USING (true);

-- Updated_at trigger
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON knowledge.prompts
  FOR EACH ROW EXECUTE FUNCTION knowledge.set_updated_at();
```

---

## Console Structure

### PromptWorkshop Layout

```
┌────────────────────────────────────────────────────────────────────────────┐
│ PromptWorkshop                                              [+ New Prompt] │
│ Contextual content with declarative sequence membership                   │
├────────────────────────────────────────────────────────────────────────────┤
│ 📊 156 Active │ 📁 12 Sequences │ 🎯 89% Targeted │ 📈 2.4k Selections    │
├──────────────┬───────────────────────────────┬─────────────────────────────┤
│ SEQUENCES    │ PROMPTS                       │ INSPECTOR                   │
│ ▼ Journeys   │ [PromptGrid]                  │ [PromptInspector]          │
│ ▼ Briefings  │                               │ + [BedrockCopilot]         │
│ ▼ Wizards    │                               │                             │
│ ○ All        │                               │                             │
└──────────────┴───────────────────────────────┴─────────────────────────────┘
```

### File Structure

```
src/bedrock/consoles/PromptWorkshop/
├── index.ts                  → Exports
├── PromptWorkshop.tsx        → Console root (BedrockLayout)
├── PromptWorkshop.config.ts  → Console configuration
├── usePromptData.ts          → Data layer wrapper
├── prompt-transforms.ts      → GroveObject ↔ Display transforms
├── PromptCard.tsx            → Grid item component
├── PromptEditor.tsx          → Edit/create form
├── PromptGrid.tsx            → Content area
├── PromptInspector.tsx       → Right panel detail view
├── SequenceNav.tsx           → Left navigation tree
└── PromptCopilotActions.ts   → AI assistant actions
```

---

## Scoring Algorithm

```typescript
function scorePrompt(prompt: Prompt, context: ExplorationContext): number {
  const p = prompt.payload;
  let score = p.baseWeight ?? 50;
  
  // Stage match (+20)
  if (p.targeting.stages?.includes(context.stage)) score += 20;
  if (p.targeting.excludeStages?.includes(context.stage)) return 0;
  
  // Entropy window (filter)
  if (p.targeting.entropyWindow) {
    const { min = 0, max = 1 } = p.targeting.entropyWindow;
    if (context.entropy < min || context.entropy > max) return 0;
  }
  
  // Lens match (+30)
  if (p.targeting.lensIds?.includes(context.lensId)) score += 30;
  if (p.targeting.excludeLenses?.includes(context.lensId)) return 0;
  
  // Lens affinity (up to +25)
  const lensAffinity = p.lensAffinities.find(a => a.lensId === context.lensId);
  if (lensAffinity) score += lensAffinity.weight * 25;
  
  // Topic affinity (up to +15 per topic)
  context.activeTopics.forEach(topic => {
    const affinity = p.topicAffinities.find(a => a.topicId === topic);
    if (affinity) score += affinity.weight * 15;
  });
  
  // Moment triggers (+40)
  if (p.targeting.momentTriggers?.some(m => context.activeMoments.includes(m))) {
    score += 40;
  }
  
  // Cooldown check (filter)
  if (p.cooldownMs && p.stats.lastSurfaced) {
    const elapsed = Date.now() - new Date(p.stats.lastSurfaced).getTime();
    if (elapsed < p.cooldownMs) return 0;
  }
  
  // Max shows check (filter)
  if (p.maxShows && p.stats.impressions >= p.maxShows) return 0;
  
  return score;
}
```

---

## Sequence Derivation

Sequences are derived from prompt metadata, not stored separately:

```typescript
function deriveSequences(prompts: Prompt[]): SequenceDefinition[] {
  const groups = new Map<string, { 
    type: SequenceType; 
    prompts: Prompt[];
  }>();
  
  prompts.forEach(p => {
    p.payload.sequences?.forEach(seq => {
      const existing = groups.get(seq.groupId);
      if (existing) {
        existing.prompts.push(p);
      } else {
        groups.set(seq.groupId, { 
          type: seq.groupType, 
          prompts: [p] 
        });
      }
    });
  });
  
  return Array.from(groups.entries()).map(([groupId, { type, prompts }]) => ({
    groupId,
    groupType: type,
    title: formatGroupTitle(groupId),
    promptCount: prompts.length
  }));
}

function formatGroupTitle(groupId: string): string {
  // 'journey-ratchet' → 'Ratchet'
  // 'briefing-dr-chiang' → 'Dr. Chiang'
  const parts = groupId.split('-').slice(1);
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}
```

---

## Stats Tracking

Stats update on user interaction:

```typescript
// On impression (prompt surfaced to user)
await provider.update('prompt', promptId, [{
  op: 'replace',
  path: '/payload/stats/impressions',
  value: currentImpressions + 1
}, {
  op: 'replace',
  path: '/payload/stats/lastSurfaced',
  value: new Date().toISOString()
}]);

// On selection (user clicks prompt)
await provider.update('prompt', promptId, [{
  op: 'replace',
  path: '/payload/stats/selections',
  value: currentSelections + 1
}]);

// On completion (conversation reaches success criteria)
await provider.update('prompt', promptId, [{
  op: 'replace',
  path: '/payload/stats/completions',
  value: currentCompletions + 1
}]);
```
