# Sprints: prompt-unification-v1

**Epic breakdown with tests**

---

## Overview

| Epic | Description | Stories | Est. Hours |
|------|-------------|---------|------------|
| 1 | Schema & Data Layer | 5 | 3 |
| 2 | PromptWorkshop Console | 7 | 6 |
| 3 | Explore Integration | 4 | 3 |
| 4 | Seed Data & Verification | 3 | 2 |

**Total:** 19 stories, ~14 hours

---

## Epic 1: Schema & Data Layer

**Goal:** Prompt type exists, persists to Supabase, accessible via useGroveData.

### Story 1.1: Create PromptPayload Type

**Task:** Create `src/core/schema/prompt.ts` with all type definitions.

**Acceptance:**
- [ ] PromptPayload interface defined
- [ ] All supporting interfaces (PromptTargeting, PromptSequence, etc.)
- [ ] Prompt type alias (GroveObject<PromptPayload>)
- [ ] SequenceDefinition interface for derived sequences
- [ ] Exported from `src/core/schema/index.ts`

**Tests:**
- Type: Compile-time validation via TypeScript
- Unit: `tests/unit/schema/prompt.test.ts` - validate type guards

```typescript
// tests/unit/schema/prompt.test.ts
import { describe, it, expect } from 'vitest';
import type { Prompt, PromptPayload } from '@core/schema/prompt';

describe('PromptPayload', () => {
  it('accepts valid payload', () => {
    const payload: PromptPayload = {
      label: 'Test Prompt',
      executionPrompt: 'Ask about X',
      tags: [],
      topicAffinities: [],
      lensAffinities: [],
      targeting: {},
      stats: { impressions: 0, selections: 0, completions: 0, avgEntropyDelta: 0, avgDwellMs: 0 },
      source: 'library'
    };
    expect(payload.label).toBe('Test Prompt');
  });
});
```

### Story 1.2: Extend GroveObjectType

**Task:** Add 'prompt' to GroveObjectType union in `grove-data-provider.ts`.

**Acceptance:**
- [ ] 'prompt' in GroveObjectType union
- [ ] TypeScript compiles without errors
- [ ] Existing type usages unaffected

**Tests:**
- Type: Compile-time validation
- Unit: Existing data layer tests still pass

```bash
npm run typecheck
npm test -- --grep "grove-data"
```

### Story 1.3: Add Supabase Table Mapping

**Task:** Add `prompt: 'prompts'` to TABLE_MAP in `supabase-adapter.ts`.

**Acceptance:**
- [ ] TABLE_MAP includes prompt → prompts
- [ ] Adapter can list/get/create/update/delete prompts

**Tests:**
- Integration: `tests/integration/data/prompt-adapter.test.ts`

```typescript
// tests/integration/data/prompt-adapter.test.ts
describe('SupabaseAdapter - Prompt', () => {
  it('creates prompt', async () => {
    const prompt = await adapter.create('prompt', testPrompt);
    expect(prompt.meta.id).toBeDefined();
  });
  
  it('lists prompts', async () => {
    const prompts = await adapter.list('prompt');
    expect(Array.isArray(prompts)).toBe(true);
  });
});
```

### Story 1.4: Create Supabase Migration

**Task:** Create migration file for `knowledge.prompts` table.

**Acceptance:**
- [ ] Migration file created
- [ ] Table created with all columns
- [ ] Indexes created (status, source, sequences GIN, targeting GIN)
- [ ] RLS policies enabled
- [ ] Updated_at trigger installed

**Tests:**
- Manual: Run migration, verify table exists
- Query: `SELECT * FROM knowledge.prompts LIMIT 1;`

```bash
# Run migration
npx supabase db push

# Verify
npx supabase db query "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'prompts';"
```

### Story 1.5: Verify Data Layer Integration

**Task:** Verify useGroveData<PromptPayload>('prompt') works end-to-end.

**Acceptance:**
- [ ] Can create prompt via useGroveData
- [ ] Can list prompts via useGroveData
- [ ] Can update prompt via useGroveData
- [ ] Can delete prompt via useGroveData

**Tests:**
- E2E: `tests/e2e/data-layer/prompt-crud.spec.ts`

```typescript
// tests/e2e/data-layer/prompt-crud.spec.ts
test('prompt CRUD operations', async ({ page }) => {
  // This test runs against actual Supabase
  // Create, verify, update, delete
});
```

### Build Gate - Epic 1

```bash
npm run typecheck        # Types compile
npm test                 # Unit tests pass
npm run test:integration # Integration tests pass
```

---

## Epic 2: PromptWorkshop Console

**Goal:** Bedrock console for managing prompts with full CRUD.

### Story 2.1: Create Console Structure

**Task:** Create `src/bedrock/consoles/PromptWorkshop/` directory with base files.

**Acceptance:**
- [ ] index.ts with exports
- [ ] PromptWorkshop.tsx with BedrockLayout
- [ ] PromptWorkshop.config.ts with metadata

**Tests:**
- Unit: Component renders without error

```typescript
// tests/unit/consoles/PromptWorkshop.test.tsx
describe('PromptWorkshop', () => {
  it('renders without crashing', () => {
    render(<PromptWorkshop />);
    expect(screen.getByText('Prompts')).toBeInTheDocument();
  });
});
```

### Story 2.2: Implement usePromptData Hook

**Task:** Create data hook wrapping useGroveData for prompts.

**Acceptance:**
- [ ] usePromptData hook exports list, get, create, update, delete
- [ ] deriveSequences function works
- [ ] Proper TypeScript typing

**Tests:**
- Unit: `tests/unit/consoles/PromptWorkshop/usePromptData.test.ts`

```typescript
describe('usePromptData', () => {
  it('derives sequences from prompts', () => {
    const prompts = [mockPromptWithSequence];
    const sequences = deriveSequences(prompts);
    expect(sequences).toHaveLength(1);
    expect(sequences[0].groupId).toBe('journey-test');
  });
});
```

### Story 2.3: Implement SequenceNav Component

**Task:** Create left navigation showing sequences grouped by type.

**Acceptance:**
- [ ] Shows sequence groups (Journeys, Briefings, Wizards)
- [ ] Expandable/collapsible groups
- [ ] Click filters PromptGrid
- [ ] "All" and "Unsequenced" options

**Tests:**
- Unit: Renders groups correctly
- Behavior: Click updates filter state

```typescript
describe('SequenceNav', () => {
  it('groups sequences by type', () => {
    render(<SequenceNav sequences={mockSequences} />);
    expect(screen.getByText('Journeys')).toBeInTheDocument();
  });
});
```

### Story 2.4: Implement PromptCard and PromptGrid

**Task:** Create grid display for prompts.

**Acceptance:**
- [ ] PromptCard shows label, sequence badges, stats
- [ ] PromptGrid uses ObjectGrid pattern
- [ ] Filtering by sequence works
- [ ] Click selects for inspector

**Tests:**
- Unit: Card renders prompt data
- Behavior: Click triggers selection

```typescript
describe('PromptCard', () => {
  it('displays prompt label', () => {
    render(<PromptCard prompt={mockPrompt} />);
    expect(screen.getByText('Test Prompt')).toBeInTheDocument();
  });
  
  it('shows sequence badges', () => {
    render(<PromptCard prompt={promptWithSequences} />);
    expect(screen.getByText('journey-ratchet')).toBeInTheDocument();
  });
});
```

### Story 2.5: Implement PromptInspector

**Task:** Create right panel detail view.

**Acceptance:**
- [ ] Shows full prompt details
- [ ] Displays sequence memberships
- [ ] Displays targeting criteria
- [ ] Shows stats
- [ ] Edit button opens editor

**Tests:**
- Unit: Renders all sections
- Behavior: Edit button works

### Story 2.6: Implement PromptEditor

**Task:** Create form for prompt creation/editing.

**Acceptance:**
- [ ] Form fields for all PromptPayload fields
- [ ] Validation before save
- [ ] Create and update modes
- [ ] Cancel discards changes

**Tests:**
- Unit: Form renders all fields
- Behavior: Save creates/updates prompt

### Story 2.7: Wire to Navigation and Copilot

**Task:** Add console to Bedrock navigation, integrate Copilot.

**Acceptance:**
- [ ] PromptWorkshop in navigation.ts
- [ ] Route /bedrock/prompts works
- [ ] Copilot context provided
- [ ] Copilot actions registered

**Tests:**
- E2E: Navigate to /bedrock/prompts, see console

```typescript
// tests/e2e/consoles/prompt-workshop.spec.ts
test('PromptWorkshop accessible via navigation', async ({ page }) => {
  await page.goto('/bedrock');
  await page.click('text=Prompts');
  await expect(page).toHaveURL('/bedrock/prompts');
  await expect(page.getByRole('heading', { name: 'Prompts' })).toBeVisible();
});
```

### Build Gate - Epic 2

```bash
npm run build            # Compiles
npm test                 # Unit tests pass
npx playwright test tests/e2e/consoles/prompt-workshop.spec.ts
```

---

## Epic 3: Explore Integration

**Goal:** Prompts surface in exploration context with scoring.

### Story 3.1: Implement scorePrompt Function

**Task:** Create pure function for prompt scoring.

**Acceptance:**
- [ ] Pure function, no side effects
- [ ] Scores based on stage, lens, topics, moments
- [ ] Returns 0 for filtered prompts (cooldown, max shows)
- [ ] Deterministic output

**Tests:**
- Unit: `tests/unit/explore/scorePrompt.test.ts`

```typescript
describe('scorePrompt', () => {
  it('returns base weight for neutral context', () => {
    const score = scorePrompt(promptWithWeight50, neutralContext);
    expect(score).toBe(50);
  });
  
  it('adds 20 for stage match', () => {
    const score = scorePrompt(promptTargetingExploration, explorationContext);
    expect(score).toBeGreaterThan(50);
  });
  
  it('returns 0 for excluded stage', () => {
    const score = scorePrompt(promptExcludingGenesis, genesisContext);
    expect(score).toBe(0);
  });
  
  it('returns 0 when max shows exceeded', () => {
    const prompt = { ...basePrompt, stats: { impressions: 10 }, maxShows: 10 };
    expect(scorePrompt(prompt, context)).toBe(0);
  });
});
```

### Story 3.2: Implement usePromptSuggestions Hook

**Task:** Create hook returning scored prompts for context.

**Acceptance:**
- [ ] Fetches active prompts
- [ ] Scores each against current context
- [ ] Returns top N sorted by score
- [ ] Updates on context change

**Tests:**
- Unit: Returns sorted array
- Integration: Works with real data

```typescript
describe('usePromptSuggestions', () => {
  it('returns prompts sorted by score', () => {
    const { result } = renderHook(() => usePromptSuggestions(mockContext));
    const scores = result.current.map(p => scorePrompt(p, mockContext));
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });
});
```

### Story 3.3: Implement useSequence Hook

**Task:** Create hook for navigating ordered sequences.

**Acceptance:**
- [ ] Takes groupId, returns ordered prompts
- [ ] Provides currentIndex state
- [ ] Provides advance() function
- [ ] Derives sequence definition

**Tests:**
- Unit: Returns prompts in order

```typescript
describe('useSequence', () => {
  it('returns prompts ordered by sequence.order', () => {
    const { result } = renderHook(() => useSequence('journey-test'));
    expect(result.current.prompts[0].payload.sequences[0].order).toBe(1);
    expect(result.current.prompts[1].payload.sequences[0].order).toBe(2);
  });
  
  it('advances to next prompt', () => {
    const { result } = renderHook(() => useSequence('journey-test'));
    expect(result.current.currentIndex).toBe(0);
    act(() => result.current.advance());
    expect(result.current.currentIndex).toBe(1);
  });
});
```

### Story 3.4: Create PromptSuggestion Component

**Task:** Display component for prompt suggestions.

**Acceptance:**
- [ ] Renders prompt label and description
- [ ] Click executes prompt
- [ ] Tracks impression on mount
- [ ] Tracks selection on click

**Tests:**
- Unit: Renders prompt data
- Behavior: Click calls onSelect

### Build Gate - Epic 3

```bash
npm test -- --grep "explore"
npm test -- --grep "scorePrompt"
npm test -- --grep "usePromptSuggestions"
npm test -- --grep "useSequence"
```

---

## Epic 4: Seed Data & Verification

**Goal:** System populated with initial prompts, end-to-end verified.

### Story 4.1: Create Seed Script

**Task:** Create script to populate initial prompts.

**Acceptance:**
- [ ] Script in `scripts/seed-prompts.ts`
- [ ] Creates journey-ratchet sequence (5 prompts)
- [ ] Creates journey-simulation sequence (4 prompts)
- [ ] Creates briefing-dr-chiang sequence (6 prompts)
- [ ] Idempotent (can run multiple times)

**Tests:**
- Manual: Run script, verify data in Supabase

```bash
npx tsx scripts/seed-prompts.ts
```

### Story 4.2: End-to-End Verification

**Task:** Verify full flow works.

**Acceptance:**
- [ ] PromptWorkshop shows seeded prompts
- [ ] Sequences appear in navigation
- [ ] Filtering by sequence works
- [ ] Can edit prompt and save
- [ ] Stats update on interaction

**Tests:**
- E2E: Full workflow test

```typescript
// tests/e2e/prompt-workflow.spec.ts
test('full prompt workflow', async ({ page }) => {
  // Navigate to console
  await page.goto('/bedrock/prompts');
  
  // Verify prompts visible
  await expect(page.getByText('The Ratchet Effect')).toBeVisible();
  
  // Filter by sequence
  await page.click('text=journey-ratchet');
  
  // Select prompt
  await page.click('text=The Ratchet Effect');
  
  // Verify inspector shows details
  await expect(page.getByText('Execution Prompt')).toBeVisible();
});
```

### Story 4.3: Documentation Update

**Task:** Update PROJECT_PATTERNS.md with Prompt pattern.

**Acceptance:**
- [ ] Pattern 11: Prompt System documented
- [ ] References to usePromptSuggestions, useSequence
- [ ] DO/DON'T guidance

**Tests:**
- Review: Pattern follows existing format

### Build Gate - Epic 4

```bash
npm run build
npm test
npx playwright test
```

---

## Final Verification

### Pre-Merge Checklist

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] TypeScript compiles without errors
- [ ] No console errors in browser
- [ ] Supabase migration applied
- [ ] Seed data populated
- [ ] Documentation updated

### Domain Contract Verification

- [ ] Domain contract: Bedrock Sprint Contract v1.0
- [ ] All contract requirements satisfied
- [ ] Console Implementation Checklist complete
- [ ] DEX Compliance Matrix documented
- [ ] No contract violations introduced

### Build Gate Commands

```bash
# Full verification
npm run build
npm run typecheck
npm test
npx playwright test

# Visual regression (if baselines exist)
npx playwright test tests/e2e/*-baseline.spec.ts
```
