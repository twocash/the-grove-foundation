# Migration Map: prompt-unification-v1

**File-by-file change plan**

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ➕ | Create new file |
| ✏️ | Modify existing file |
| 🔗 | Reference only |

---

## Epic 1: Schema & Data Layer

### 1.1 Create PromptPayload Type

```
➕ src/core/schema/prompt.ts
   Create: PromptPayload interface
   Create: PromptTargeting interface  
   Create: PromptSequence interface
   Create: PromptStats interface
   Create: TopicAffinity interface
   Create: LensAffinity interface
   Create: PromptGenerationContext interface
   Create: Prompt type alias
   Create: SequenceDefinition interface
   Export: All types
```

### 1.2 Extend GroveObjectType

```
✏️ src/core/data/grove-data-provider.ts
   Line ~10: Add 'prompt' to GroveObjectType union
   
   Before:
   | 'document';
   
   After:
   | 'document'
   | 'prompt';
```

### 1.3 Add Table Mapping

```
✏️ src/core/data/adapters/supabase-adapter.ts
   Line ~22: Add prompt mapping to TABLE_MAP
   
   Before:
   moment: 'moments',
   };
   
   After:
   moment: 'moments',
   prompt: 'prompts',
   };
```

### 1.4 Create Supabase Table

```
➕ supabase/migrations/YYYYMMDD_create_prompts_table.sql
   Create: knowledge.prompts table
   Create: Indexes (status, source, sequences GIN, targeting GIN)
   Create: RLS policies
   Create: Updated_at trigger
```

### 1.5 Update Schema Index

```
✏️ src/core/schema/index.ts
   Add: export * from './prompt';
```

---

## Epic 2: PromptWorkshop Console

### 2.1 Console Structure

```
➕ src/bedrock/consoles/PromptWorkshop/index.ts
   Export: PromptWorkshop component
   Export: PromptCard component
   Export: usePromptData hook
```

```
➕ src/bedrock/consoles/PromptWorkshop/PromptWorkshop.tsx
   Import: BedrockLayout, MetricsRow, ConsoleHeader
   Import: ObjectGrid, ObjectList
   Import: BedrockInspector, BedrockCopilot
   Compose: Full console with three-column layout
   Wire: usePromptData for data
   Wire: PromptInspector for detail view
   Wire: SequenceNav for left navigation
```

```
➕ src/bedrock/consoles/PromptWorkshop/PromptWorkshop.config.ts
   Define: Console metadata
   Define: Metrics configuration
   Define: Default sort/filter
```

### 2.2 Data Hook

```
➕ src/bedrock/consoles/PromptWorkshop/usePromptData.ts
   Import: useGroveData from '@core/data'
   Import: PromptPayload from '@core/schema/prompt'
   Export: usePromptData hook
   Implement: list, get, create, update, delete wrappers
   Implement: deriveSequences function
```

### 2.3 Components

```
➕ src/bedrock/consoles/PromptWorkshop/PromptCard.tsx
   Import: ObjectCard from '@bedrock/components'
   Render: label, sequence badges, stats
   Handle: Click → inspect
```

```
➕ src/bedrock/consoles/PromptWorkshop/PromptGrid.tsx
   Import: ObjectGrid from '@bedrock/components'
   Import: PromptCard
   Render: Grid of prompt cards
   Handle: Filtering by sequence
```

```
➕ src/bedrock/consoles/PromptWorkshop/SequenceNav.tsx
   Import: ObjectList from '@bedrock/components'
   Render: Tree of sequences grouped by type
   Handle: Selection → filter PromptGrid
```

```
➕ src/bedrock/consoles/PromptWorkshop/PromptInspector.tsx
   Import: BedrockInspector primitives
   Render: Full prompt detail
   Render: Sequence memberships
   Render: Targeting criteria
   Render: Stats
```

```
➕ src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx
   Create: Form for prompt creation/editing
   Validate: PromptPayload schema
   Handle: Save via usePromptData
```

### 2.4 Copilot Actions

```
➕ src/bedrock/consoles/PromptWorkshop/PromptCopilotActions.ts
   Define: suggest-prompt action
   Define: refine-wording action
   Define: generate-bridge action
   Define: analyze-coverage action
   Define: suggest-targeting action
```

### 2.5 Transforms

```
➕ src/bedrock/consoles/PromptWorkshop/prompt-transforms.ts
   Create: groveObjectToPromptDisplay transform
   Create: promptDisplayToGroveObject transform
   Create: Validation helpers
```

### 2.6 Wire to Navigation

```
✏️ src/bedrock/config/navigation.ts
   Add: PromptWorkshop route
   
   {
     id: 'prompt-workshop',
     label: 'Prompts',
     icon: MessageSquare,
     path: '/bedrock/prompts',
     component: PromptWorkshop,
   }
```

```
✏️ src/bedrock/consoles/index.ts
   Add: export { PromptWorkshop } from './PromptWorkshop';
```

---

## Epic 3: Explore Integration

### 3.1 Scoring Hook

```
➕ src/explore/hooks/usePromptSuggestions.ts
   Import: useGroveData
   Import: ExplorationContext from engagement
   Implement: scorePrompt pure function
   Export: usePromptSuggestions hook
   Return: Scored, sorted prompt array
```

### 3.2 Sequence Hook

```
➕ src/explore/hooks/useSequence.ts
   Import: useGroveData
   Export: useSequence(groupId) hook
   Return: { definition, prompts, currentIndex, advance }
   Implement: Ordering by sequences[].order
```

### 3.3 Display Component

```
➕ src/explore/components/PromptSuggestion/index.ts
   Export: PromptSuggestion component
```

```
➕ src/explore/components/PromptSuggestion/PromptSuggestion.tsx
   Render: Single prompt suggestion card
   Handle: Click → execute prompt
   Handle: Stats tracking on impression
```

### 3.4 Wire Hooks Export

```
✏️ src/explore/hooks/index.ts
   Add: export { usePromptSuggestions } from './usePromptSuggestions';
   Add: export { useSequence } from './useSequence';
```

---

## Epic 4: Seed Data

### 4.1 Seed Script

```
➕ scripts/seed-prompts.ts
   Import: SupabaseAdapter
   Import: Prompt type
   Create: Initial prompt data
   Insert: To knowledge.prompts table
```

### 4.2 Seed Content

```
Sequences to seed:
- journey-ratchet (5 prompts)
- journey-simulation (4 prompts)
- briefing-dr-chiang (6 prompts)
```

---

## Files Not Modified

These files continue unchanged:

```
🔗 src/core/schema/grove-object.ts (types already compatible)
🔗 src/bedrock/primitives/* (used as-is)
🔗 src/bedrock/components/* (used as-is)
🔗 src/core/data/adapters/local-storage-adapter.ts (inherits type)
🔗 src/core/data/adapters/hybrid-adapter.ts (inherits type)
```

---

## Database Migration Sequence

1. Create table: `knowledge.prompts`
2. Create indexes
3. Enable RLS
4. Seed initial data

```sql
-- Run in order:
-- 1. Create table (from ARCHITECTURE.md)
-- 2. Verify with: SELECT * FROM knowledge.prompts LIMIT 1;
-- 3. Seed data via script
```
