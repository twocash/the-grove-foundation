# Continuation Prompt: prompt-unification-v1

**Session handoff for fresh context**

---

## Quick Start

```
Read C:\GitHub\the-grove-foundation\docs\sprints\prompt-unification-v1\EXECUTION_PROMPT.md and execute the sprint.
```

---

## Project Context

**Project:** The Grove Foundation  
**Location:** `C:\GitHub\the-grove-foundation`  
**Sprint:** prompt-unification-v1  
**Branch:** bedrock  
**Contract:** Bedrock Sprint Contract v1.0

---

## What Was Accomplished

### Planning Phase Complete ✅

All Foundation Loop artifacts created:

| Artifact | Status | Description |
|----------|--------|-------------|
| SPEC.md | ✅ | Goals, DEX compliance, requirements |
| REPO_AUDIT.md | ✅ | Current state analysis |
| ARCHITECTURE.md | ✅ | Type definitions, database schema |
| MIGRATION_MAP.md | ✅ | File-by-file change plan |
| DECISIONS.md | ✅ | 6 architectural decisions |
| SPRINTS.md | ✅ | 4 epics, 19 stories with tests |
| EXECUTION_PROMPT.md | ✅ | Self-contained handoff |
| DEVLOG.md | ✅ | Progress tracking initialized |

### Key Decisions Made

1. **Unified Prompt object type** — All contextual content (journeys, briefings, wizards) unified
2. **Sequences derived from metadata** — No separate sequences table
3. **Pure function scoring** — No AI dependency for prompt selection
4. **Follow LensWorkshop pattern** — Console structure matches existing

---

## What Needs to Happen Next

### Execution Phase

1. **Epic 1: Schema & Data Layer** (3 hours)
   - Create `src/core/schema/prompt.ts`
   - Extend GroveObjectType with 'prompt'
   - Add table mapping to SupabaseAdapter
   - Create Supabase migration
   - Verify data layer works

2. **Epic 2: PromptWorkshop Console** (6 hours)
   - Create console directory structure
   - Implement usePromptData hook
   - Build SequenceNav, PromptCard, PromptGrid
   - Build PromptInspector, PromptEditor
   - Wire to navigation

3. **Epic 3: Explore Integration** (3 hours)
   - Implement scorePrompt function
   - Create usePromptSuggestions hook
   - Create useSequence hook
   - Create PromptSuggestion component

4. **Epic 4: Seed Data** (2 hours)
   - Create seed script
   - Populate initial prompts
   - End-to-end verification

---

## Files to Read First

1. `docs/sprints/prompt-unification-v1/EXECUTION_PROMPT.md` — Complete implementation guide
2. `docs/sprints/prompt-unification-v1/ARCHITECTURE.md` — Type definitions to implement
3. `docs/sprints/prompt-unification-v1/SPRINTS.md` — Story breakdown with tests

---

## Reference Files

| Purpose | Location |
|---------|----------|
| Sprint spec | `docs/sprints/prompt-unification-v1/SPEC.md` |
| Bedrock contract | `docs/BEDROCK_SPRINT_CONTRACT.md` |
| Pattern catalog | `PROJECT_PATTERNS.md` |
| Reference console | `src/bedrock/consoles/LensWorkshop/` |
| Data layer | `src/core/data/` |
| Grove object schema | `src/core/schema/grove-object.ts` |

---

## Current Sprint Status

```
Epic 1: Schema & Data Layer     [ ] [ ] [ ] [ ] [ ]  0/5
Epic 2: PromptWorkshop Console  [ ] [ ] [ ] [ ] [ ] [ ] [ ]  0/7
Epic 3: Explore Integration     [ ] [ ] [ ] [ ]  0/4
Epic 4: Seed Data               [ ] [ ] [ ]  0/3

Overall: 0/19 stories complete
```

---

## Build Commands

```bash
cd C:\GitHub\the-grove-foundation

# Verify state
npm run build
npm run typecheck
npm test

# Run dev server
npm run dev

# Run specific tests
npm test -- --grep "prompt"
npx playwright test tests/e2e/consoles/prompt-workshop.spec.ts
```

---

## Questions to Ask Before Starting

1. Is the Supabase migration already applied? Check: `SELECT * FROM knowledge.prompts LIMIT 1;`
2. Is the bedrock branch current? Check: `git branch --show-current`
3. Are there any blocking issues in DEVLOG.md?

---

## Session Handoff Complete

To continue this sprint:

1. Open fresh Claude context
2. Paste: `Read C:\GitHub\the-grove-foundation\docs\sprints\prompt-unification-v1\EXECUTION_PROMPT.md and begin execution with Epic 1.`
3. Track progress in DEVLOG.md
