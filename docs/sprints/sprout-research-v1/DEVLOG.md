# Development Log - Sprout Research v1

**Sprint:** `sprout-research-v1`
**Branch:** `feature/sprout-research-v1`

---

## Session 1: January 10, 2026

### Setup Complete

- Created checkpoint tag: `checkpoint-pre-sprout-research-20260110` at commit `ae1e4fd`
- Created sprint branch: `feature/sprout-research-v1`
- Created documentation structure in `docs/sprints/sprout-research-v1/`

### Phase 0.25: Route Verification ✅ COMPLETE

**Findings:**

1. `/explore` route renders through this chain:
   ```
   routes.tsx → ExploreEventProvider → ExplorePage → EngagementProvider → ExploreShell → CommandConsole
   ```

2. **Integration point identified:** `ExploreShell.tsx:handleSubmit()` (lines 509-517)
   - This is where `sprout:` command prefix will be intercepted
   - Currently passes through to `submit()` from `useKineticStream`

3. **Existing infrastructure discovered:**
   - `SproutCaptureCard` - for text selection capture (different from command-based)
   - `ResearchManifestCard` - for research directive capture
   - `useSproutStorage` - localStorage CRUD
   - `ResearchManifest` type already exists

### Phase 0.5: System Prompt Pattern Audit ✅ COMPLETE

**Key findings:**

1. **Singleton pattern reference:** System Prompt uses:
   - Status enum: `'active' | 'draft' | 'archived'`
   - Database partial unique index: `WHERE status = 'active'`
   - `saveAndActivate()` for version creation
   - Optimistic UI with `pendingActivation` and `justActivated` states

2. **Pattern distinction confirmed:**
   - `PromptArchitectConfig` = SINGLETON (one active per grove)
   - `ResearchSprout` = INSTANCE (many active per grove)

3. **Frozen zone snapshot:**
   - `components/Terminal/`: 77 files
   - `src/foundation/`: 23 files

### Gate Status

- [x] Build passing
- [x] Phase 0.25 documented in REPO_AUDIT.md
- [x] Phase 0.5 documented in REPO_AUDIT.md
- [x] Human review approved

---

### Phase 1a: PromptArchitectConfig Interface ✅ COMPLETE

**Files created:**

1. `src/core/schema/research-strategy.ts`
   - `ResearchStrategy` interface
   - `ResearchBranch` interface
   - `BranchTemplate` for auto-population
   - `Evidence` type for collected data

2. `src/core/schema/quality-gate.ts`
   - `QualityGateConfig` interface
   - `GateDecision` for audit trail
   - Default configs (permissive and strict)

3. `src/core/schema/prompt-architect-config.ts`
   - `PromptArchitectConfigPayload` interface (SINGLETON pattern)
   - `InferenceRule` and `InferenceTrigger` types
   - `ConfirmationMode` type
   - Type guards and validators

4. `src/core/schema/grove-object.ts`
   - Added `'prompt-architect-config'` to GroveObjectType
   - Added `'research-sprout'` to GroveObjectType
   - Added `'system-prompt'` for completeness

**Key pattern documentation:**
- Explicit comments in prompt-architect-config.ts explaining SINGLETON vs INSTANCE
- `groveId` documented as the anchor for singleton constraint
- Database constraint pattern documented: `UNIQUE WHERE status='active' ON grove_id`

**Build status:** ✅ Passes

---

### Phase 1b: Type Registry ✅ COMPLETE

**Changes:**
- Added `prompt-architect-config` to `EXPERIENCE_TYPE_REGISTRY`
- Updated `ExperiencePayloadMap` for type-safe access
- Configured as SINGLETON: `allowMultipleActive: false`

---

### Phase 1c: Inference Rule Engine ✅ COMPLETE

**File:** `src/explore/services/inference-engine.ts`

**Features:**
- `applyInferenceRules()` - Main entry point
- Keyword matching with scoring
- Regex pattern matching
- Placeholder semantic matching (future: embeddings)
- Rule merging with priority ordering
- `shouldShowConfirmation()` helper for confirmation mode
- `summarizeInference()` for human-readable output

---

### Phase 1d: Quality Gate Evaluator ✅ COMPLETE

**File:** `src/explore/services/quality-gate-evaluator.ts`

**Gates implemented:**

1. **Intake Gates:**
   - Hypothesis alignment check
   - Minimum context requirement

2. **Execution Gates:**
   - Spawn depth limit
   - Branch count limit

3. **Review Gates:**
   - Confidence threshold
   - Evidence presence check
   - Completion rate check

**Build status:** ✅ Passes

---

## Phase 1 COMPLETE

All configuration schema work done:
- Interfaces defined (1a)
- Type registry updated (1b)
- Inference engine implemented (1c)
- Quality gate evaluator implemented (1d)

Ready for Phase 2: Object Model & Storage

---

## Phase 2: Object Model & Storage

### Phase 2a: ResearchSprout Interface ✅ COMPLETE

**File:** `src/core/schema/research-sprout.ts`

**Features:**
- INSTANCE pattern (many active per grove)
- Full status lifecycle: `pending → active → completed/paused/blocked → archived`
- Parent-child spawning via `parentSproutId` and `spawnDepth`
- `GroveConfigSnapshot` for provenance (DEX Pillar III)
- `architectSessionId` for intake dialogue linking
- `createResearchSprout()` factory function
- `canTransitionTo()` state machine validator

**Key types:**
- `ResearchSprout` - Main interface (518 lines)
- `GroveConfigSnapshot` - Provenance capture
- `StatusTransition` - Audit trail entry
- `GateDecisionRecord` - Gate outcome record

---

### Phase 2b: Type Registry ✅ COMPLETE

**File:** `src/core/schema/research-sprout-registry.ts`

**Features:**
- Status labels, icons, colors for UI
- `ACTIVE_STATUSES` and `TERMINAL_STATUSES` groupings
- Supabase table name constants
- Filter presets for Garden Inspector
- Feature flag keys
- System limits (max pending, max active, etc.)
- `RESEARCH_SPROUT_TYPE_CONFIG` registry entry

---

### Phase 2c: ResearchSproutContext ✅ COMPLETE

**File:** `src/explore/context/ResearchSproutContext.tsx`

**Features:**
- `ResearchSproutProvider` - Context provider component
- `useResearchSprouts()` - Main hook
- `useResearchSprout(id)` - Single sprout lookup
- `useSelectedResearchSprout()` - Current selection

**Operations:**
- `create()` - Create new sprout with provenance
- `query()` - Filter/paginate sprouts
- `transitionStatus()` - State machine transitions
- `update()` - Update tags, notes, rating
- `getChildren()` - Get child sprouts
- `getStatusCounts()` - Status grouping

**Note:** In-memory implementation for MVP. Supabase integration via TODO comments for Phase 2d.

---

### Phase 2d: Supabase Migrations ✅ COMPLETE

**Files:**
- `supabase/migrations/010_research_sprouts.sql` - UP migration
- `supabase/migrations/010_research_sprouts_down.sql` - DOWN migration

**Tables created:**
1. `research_sprouts` - Main table with JSONB columns for flexibility
2. `research_sprout_status_history` - Status transition audit trail
3. `research_sprout_gate_decisions` - Quality gate outcomes
4. `research_sprout_evidence` - Collected evidence

**Features:**
- Indexes for grove_id, status, parent, creator, updated_at
- GIN index for tags array
- RLS enabled with open policies (tighten when auth is implemented)
- `update_research_sprout_updated_at` trigger
- `get_sprout_status_counts()` helper function
- `get_pending_sprouts()` for agent queue

---

### Phase 2e: Context Provider Integration ✅ COMPLETE

**File modified:** `src/surface/pages/ExplorePage.tsx`

**Change:** Added `ResearchSproutProvider` to the component tree:
```tsx
<EngagementProvider>
  <ResearchSproutProvider>
    <ExploreShell />
  </ResearchSproutProvider>
</EngagementProvider>
```

**Build impact:** ExplorePage chunk increased from 209KB to 213KB (+4KB)

---

### Phase 2f: Migration Rollback Test ✅ COMPLETE

**Test Results:**

1. **UP migration:** ✅ 4 tables created
2. **Storage round-trip:** ✅ Insert/select working
3. **DOWN migration:** ✅ Tables dropped (after fixing dependency order)

**Bug found and fixed:** DOWN migration had incorrect dependency ordering.
Triggers depend on both table AND function, so dropping function first failed.
Fixed by dropping tables with CASCADE first, then functions.
Commit: `e7dfc93`

---

## Phase 2 Gate Status ✅ COMPLETE

- [x] Build passing
- [x] ResearchSprout interface with provenance
- [x] Type registry complete
- [x] Context provider complete
- [x] Supabase migrations created
- [x] Context integrated into ExplorePage
- [x] Migration UP test on Supabase
- [x] Storage round-trip test
- [x] Migration DOWN (rollback) test

---

## Log Format

Each entry should include:
- Phase/sub-phase being worked on
- What was done
- Any unexpected findings
- Screenshot filenames if applicable
- Blocking issues if any
