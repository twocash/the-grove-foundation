# Execution Prompt: prompt-unification-v1

**Self-contained handoff for Claude Code**

---

## Context

You are implementing the **Prompt Unification** sprint for The Grove Foundation. This creates a unified Prompt object type with declarative sequence membership, following DEX Trellis 1.0 principles.

**Branch:** `bedrock` (create from current state)  
**Contract:** Bedrock Sprint Contract v1.0

---

## Pre-Execution Verification

```bash
cd C:\GitHub\the-grove-foundation

# Verify branch
git branch --show-current  # Should be bedrock or create it

# Verify build works
npm run build
npm run typecheck
npm test

# Verify data layer exists
ls src/core/data/grove-data-provider.ts
ls src/core/data/adapters/supabase-adapter.ts
```

---

## Epic 1: Schema & Data Layer

### Step 1.1: Create PromptPayload Type

Create `src/core/schema/prompt.ts`:

```typescript
// src/core/schema/prompt.ts
// Prompt object type with declarative sequence membership

import type { GroveObject } from './grove-object';

/** Lifecycle stages for targeting */
export type PromptStage = 'genesis' | 'exploration' | 'synthesis' | 'advocacy';

/** Sequence types */
export type SequenceType = 
  | 'journey' | 'briefing' | 'wizard' 
  | 'tour' | 'research' | 'faq' 
  | string;

/** Topic relevance */
export interface TopicAffinity {
  topicId: string;
  weight: number;
}

/** Lens relevance */
export interface LensAffinity {
  lensId: string;
  weight: number;
  labelOverride?: string;
}

/** Targeting criteria */
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
}

/** The payload */
export interface PromptPayload {
  label: string;
  description?: string;
  executionPrompt: string;
  systemContext?: string;
  icon?: string;
  variant?: 'default' | 'glow' | 'subtle' | 'urgent';
  tags: string[];
  topicAffinities: TopicAffinity[];
  lensAffinities: LensAffinity[];
  targeting: PromptTargeting;
  baseWeight?: number;
  sequences?: PromptSequence[];
  stats: PromptStats;
  source: 'library' | 'generated' | 'user';
  generatedFrom?: PromptGenerationContext;
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

/** Derive sequences from prompts */
export function deriveSequences(prompts: Prompt[]): SequenceDefinition[] {
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

function formatGroupTitle(groupId: string): string {
  const parts = groupId.split('-').slice(1);
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}
```

### Step 1.2: Update Schema Index

Edit `src/core/schema/index.ts`:

```typescript
// Add export
export * from './prompt';
```

### Step 1.3: Extend GroveObjectType

Edit `src/core/data/grove-data-provider.ts` (~line 10):

```typescript
export type GroveObjectType =
  | 'lens'
  | 'journey'
  | 'node'
  | 'hub'
  | 'sprout'
  | 'card'
  | 'moment'
  | 'document'
  | 'prompt';  // ADD THIS
```

### Step 1.4: Add Table Mapping

Edit `src/core/data/adapters/supabase-adapter.ts` (~line 22):

```typescript
const TABLE_MAP: Record<GroveObjectType, string> = {
  lens: 'lenses',
  journey: 'journeys',
  hub: 'hubs',
  sprout: 'documents',
  document: 'documents',
  node: 'journey_nodes',
  card: 'cards',
  moment: 'moments',
  prompt: 'prompts',  // ADD THIS
};
```

### Step 1.5: Create Supabase Migration

Create `supabase/migrations/20260103_create_prompts_table.sql`:

```sql
-- Create prompts table
CREATE TABLE IF NOT EXISTS knowledge.prompts (
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
  
  label TEXT NOT NULL,
  execution_prompt TEXT NOT NULL,
  system_context TEXT,
  variant TEXT DEFAULT 'default',
  
  topic_affinities JSONB DEFAULT '[]',
  lens_affinities JSONB DEFAULT '[]',
  targeting JSONB DEFAULT '{}',
  base_weight INTEGER DEFAULT 50,
  sequences JSONB DEFAULT '[]',
  stats JSONB DEFAULT '{"impressions":0,"selections":0,"completions":0,"avgEntropyDelta":0,"avgDwellMs":0}',
  
  source TEXT DEFAULT 'library' CHECK (source IN ('library', 'generated', 'user')),
  generated_from JSONB,
  cooldown_ms INTEGER,
  max_shows INTEGER
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_prompts_status ON knowledge.prompts(status);
CREATE INDEX IF NOT EXISTS idx_prompts_source ON knowledge.prompts(source);
CREATE INDEX IF NOT EXISTS idx_prompts_sequences ON knowledge.prompts USING GIN (sequences);
CREATE INDEX IF NOT EXISTS idx_prompts_lens_affinities ON knowledge.prompts USING GIN (lens_affinities);
CREATE INDEX IF NOT EXISTS idx_prompts_targeting ON knowledge.prompts USING GIN (targeting);

-- RLS
ALTER TABLE knowledge.prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read prompts" ON knowledge.prompts FOR SELECT USING (true);
CREATE POLICY "Authenticated write prompts" ON knowledge.prompts FOR ALL USING (true);

-- Updated_at trigger
CREATE TRIGGER set_prompts_updated_at
  BEFORE UPDATE ON knowledge.prompts
  FOR EACH ROW EXECUTE FUNCTION knowledge.set_updated_at();
```

### Verify Epic 1

```bash
npm run typecheck
npm run build
# Apply migration via Supabase dashboard or CLI
```

---

## Epic 2: PromptWorkshop Console

### Step 2.1: Create Console Directory

```bash
mkdir -p src/bedrock/consoles/PromptWorkshop
```

### Step 2.2: Create usePromptData Hook

Create `src/bedrock/consoles/PromptWorkshop/usePromptData.ts`:

```typescript
// src/bedrock/consoles/PromptWorkshop/usePromptData.ts
import { useGroveData } from '@core/data';
import type { Prompt, PromptPayload, SequenceDefinition } from '@core/schema/prompt';
import { deriveSequences } from '@core/schema/prompt';
import { useMemo } from 'react';

export function usePromptData() {
  const { 
    data: prompts, 
    loading, 
    error,
    create,
    update,
    remove 
  } = useGroveData<PromptPayload>('prompt');

  const sequences = useMemo(() => {
    return deriveSequences(prompts);
  }, [prompts]);

  const getPromptsForSequence = (groupId: string): Prompt[] => {
    return prompts
      .filter(p => p.payload.sequences?.some(s => s.groupId === groupId))
      .sort((a, b) => {
        const aOrder = a.payload.sequences?.find(s => s.groupId === groupId)?.order ?? 0;
        const bOrder = b.payload.sequences?.find(s => s.groupId === groupId)?.order ?? 0;
        return aOrder - bOrder;
      });
  };

  const getUnsequencedPrompts = (): Prompt[] => {
    return prompts.filter(p => !p.payload.sequences?.length);
  };

  return {
    prompts,
    sequences,
    loading,
    error,
    create,
    update,
    remove,
    getPromptsForSequence,
    getUnsequencedPrompts
  };
}
```

### Step 2.3: Create PromptWorkshop Component

Create `src/bedrock/consoles/PromptWorkshop/PromptWorkshop.tsx`:

```typescript
// src/bedrock/consoles/PromptWorkshop/PromptWorkshop.tsx
'use client';

import { useState } from 'react';
import { BedrockLayout } from '@bedrock/primitives/BedrockLayout';
import { ConsoleHeader } from '@bedrock/primitives/ConsoleHeader';
import { MetricsRow } from '@bedrock/primitives/MetricsRow';
import { BedrockInspector } from '@bedrock/primitives/BedrockInspector';
import { BedrockCopilot } from '@bedrock/primitives/BedrockCopilot';
import { ObjectGrid } from '@bedrock/components/ObjectGrid';
import { usePromptData } from './usePromptData';
import { SequenceNav } from './SequenceNav';
import { PromptCard } from './PromptCard';
import { PromptInspector } from './PromptInspector';
import type { Prompt } from '@core/schema/prompt';

export function PromptWorkshop() {
  const { prompts, sequences, loading, getPromptsForSequence, getUnsequencedPrompts } = usePromptData();
  const [selectedSequence, setSelectedSequence] = useState<string | null>(null);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);

  const displayedPrompts = selectedSequence === 'unsequenced'
    ? getUnsequencedPrompts()
    : selectedSequence
      ? getPromptsForSequence(selectedSequence)
      : prompts;

  const metrics = [
    { label: 'Active', value: prompts.filter(p => p.meta.status === 'active').length },
    { label: 'Sequences', value: sequences.length },
    { label: 'Targeted', value: `${Math.round((prompts.filter(p => Object.keys(p.payload.targeting).length > 0).length / prompts.length) * 100)}%` },
    { label: 'Selections', value: prompts.reduce((sum, p) => sum + p.payload.stats.selections, 0) },
  ];

  return (
    <BedrockLayout
      nav={
        <SequenceNav
          sequences={sequences}
          selected={selectedSequence}
          onSelect={setSelectedSequence}
        />
      }
      inspector={
        selectedPrompt ? (
          <BedrockInspector title={selectedPrompt.payload.label}>
            <PromptInspector prompt={selectedPrompt} />
          </BedrockInspector>
        ) : null
      }
      copilot={<BedrockCopilot context={{ consoleId: 'prompt-workshop', selectedObject: selectedPrompt }} />}
    >
      <ConsoleHeader
        title="Prompts"
        description="Contextual content with declarative sequence membership"
        primaryAction={{ label: '+ New Prompt', onClick: () => {} }}
      />
      
      <MetricsRow metrics={metrics} />
      
      <ObjectGrid loading={loading}>
        {displayedPrompts.map(prompt => (
          <PromptCard
            key={prompt.meta.id}
            prompt={prompt}
            isSelected={selectedPrompt?.meta.id === prompt.meta.id}
            onClick={() => setSelectedPrompt(prompt)}
          />
        ))}
      </ObjectGrid>
    </BedrockLayout>
  );
}
```

### Step 2.4: Create Supporting Components

Create these files following the patterns in LensWorkshop:

- `src/bedrock/consoles/PromptWorkshop/SequenceNav.tsx`
- `src/bedrock/consoles/PromptWorkshop/PromptCard.tsx`
- `src/bedrock/consoles/PromptWorkshop/PromptInspector.tsx`
- `src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx`
- `src/bedrock/consoles/PromptWorkshop/index.ts`

### Step 2.5: Wire to Navigation

Edit `src/bedrock/config/navigation.ts`:

```typescript
import { PromptWorkshop } from '@bedrock/consoles/PromptWorkshop';
import { MessageSquare } from 'lucide-react';

// Add to navigation items:
{
  id: 'prompt-workshop',
  label: 'Prompts',
  icon: MessageSquare,
  path: '/bedrock/prompts',
  component: PromptWorkshop,
}
```

### Verify Epic 2

```bash
npm run build
npm run dev
# Navigate to /bedrock/prompts
```

---

## Epic 3: Explore Integration

### Step 3.1: Create scorePrompt Function

Create `src/explore/utils/scorePrompt.ts`:

```typescript
// src/explore/utils/scorePrompt.ts
import type { Prompt } from '@core/schema/prompt';

export interface ExplorationContext {
  stage: string;
  lensId: string;
  entropy: number;
  activeTopics: string[];
  activeMoments: string[];
  interactions: number;
}

export function scorePrompt(prompt: Prompt, context: ExplorationContext): number {
  const p = prompt.payload;
  let score = p.baseWeight ?? 50;
  
  // Stage match
  if (p.targeting.stages?.includes(context.stage as any)) score += 20;
  if (p.targeting.excludeStages?.includes(context.stage as any)) return 0;
  
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
  
  // Cooldown
  if (p.cooldownMs && p.stats.lastSurfaced) {
    const elapsed = Date.now() - new Date(p.stats.lastSurfaced).getTime();
    if (elapsed < p.cooldownMs) return 0;
  }
  
  // Max shows
  if (p.maxShows && p.stats.impressions >= p.maxShows) return 0;
  
  return score;
}
```

### Step 3.2: Create usePromptSuggestions Hook

Create `src/explore/hooks/usePromptSuggestions.ts`:

```typescript
// src/explore/hooks/usePromptSuggestions.ts
import { useMemo } from 'react';
import { useGroveData } from '@core/data';
import type { Prompt, PromptPayload } from '@core/schema/prompt';
import { scorePrompt, type ExplorationContext } from '../utils/scorePrompt';

export function usePromptSuggestions(context: ExplorationContext, limit = 6): Prompt[] {
  const { data: prompts } = useGroveData<PromptPayload>('prompt');
  
  return useMemo(() => {
    return prompts
      .filter(p => p.meta.status === 'active')
      .map(p => ({ prompt: p, score: scorePrompt(p, context) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(({ prompt }) => prompt);
  }, [prompts, context, limit]);
}
```

### Step 3.3: Create useSequence Hook

Create `src/explore/hooks/useSequence.ts`:

```typescript
// src/explore/hooks/useSequence.ts
import { useState, useMemo } from 'react';
import { useGroveData } from '@core/data';
import type { Prompt, PromptPayload, SequenceDefinition } from '@core/schema/prompt';

export function useSequence(groupId: string) {
  const { data: allPrompts } = useGroveData<PromptPayload>('prompt');
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const prompts = useMemo(() => {
    return allPrompts
      .filter(p => p.payload.sequences?.some(s => s.groupId === groupId))
      .sort((a, b) => {
        const aOrder = a.payload.sequences?.find(s => s.groupId === groupId)?.order ?? 0;
        const bOrder = b.payload.sequences?.find(s => s.groupId === groupId)?.order ?? 0;
        return aOrder - bOrder;
      });
  }, [allPrompts, groupId]);

  const definition: SequenceDefinition = useMemo(() => {
    const first = prompts[0]?.payload.sequences?.find(s => s.groupId === groupId);
    return {
      groupId,
      groupType: first?.groupType ?? 'journey',
      title: formatGroupTitle(groupId),
      promptCount: prompts.length
    };
  }, [prompts, groupId]);

  const advance = () => {
    if (currentIndex < prompts.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const reset = () => setCurrentIndex(0);

  return {
    definition,
    prompts,
    currentPrompt: prompts[currentIndex],
    currentIndex,
    advance,
    reset,
    isComplete: currentIndex >= prompts.length - 1
  };
}

function formatGroupTitle(groupId: string): string {
  const parts = groupId.split('-').slice(1);
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}
```

### Verify Epic 3

```bash
npm run typecheck
npm test -- --grep "scorePrompt"
```

---

## Epic 4: Seed Data

### Step 4.1: Create Seed Script

Create `scripts/seed-prompts.ts`:

```typescript
// scripts/seed-prompts.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const seedPrompts = [
  {
    id: crypto.randomUUID(),
    title: 'The Ratchet Effect',
    label: 'The Ratchet Effect',
    execution_prompt: 'Explain how AI capabilities propagate from frontier models to consumer hardware over time.',
    targeting: { stages: ['exploration'] },
    sequences: [{ groupId: 'journey-ratchet', groupType: 'journey', order: 1 }],
    topic_affinities: [{ topicId: 'capability-propagation', weight: 1.0 }],
    lens_affinities: [],
    stats: { impressions: 0, selections: 0, completions: 0, avgEntropyDelta: 0, avgDwellMs: 0 },
    source: 'library',
    tags: ['core', 'ratchet'],
    base_weight: 60
  },
  // Add more seed prompts...
];

async function seed() {
  console.log('Seeding prompts...');
  
  for (const prompt of seedPrompts) {
    const { error } = await supabase
      .from('prompts')
      .upsert(prompt, { onConflict: 'id' });
    
    if (error) {
      console.error(`Error seeding ${prompt.title}:`, error);
    } else {
      console.log(`✓ ${prompt.title}`);
    }
  }
  
  console.log('Done!');
}

seed();
```

### Run Seed

```bash
npx tsx scripts/seed-prompts.ts
```

---

## Final Verification

```bash
# Full build
npm run build

# All tests
npm test
npx playwright test

# Type check
npm run typecheck

# Manual verification
npm run dev
# Visit /bedrock/prompts
# Verify prompts display
# Verify sequences in nav
# Verify inspector works
```

---

## Troubleshooting

### Type errors in prompt.ts
- Ensure GroveObject import path is correct
- Verify grove-object.ts exports GroveObject type

### Table not found
- Run Supabase migration
- Verify table in knowledge schema

### Prompts not displaying
- Check TABLE_MAP includes 'prompt'
- Verify RLS policies allow read
- Check browser console for errors

### Console not in navigation
- Verify navigation.ts updated
- Verify import path correct
- Check for component export

---

## DEVLOG Location

Track progress in: `docs/sprints/prompt-unification-v1/DEVLOG.md`

Log format:
```markdown
## [Date] [Time]

### Completed
- [x] Task description

### Issues
- Issue description → Resolution

### Next
- [ ] Next task
```
