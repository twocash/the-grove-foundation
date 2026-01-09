# Recovery Prompt: ExperiencesConsole Feature Completion

**Date:** 2026-01-08  
**Repository:** `C:\github\the-grove-foundation`  
**Current Branch:** `hotfix/experiences-console-v1.1`

---

## SITUATION SUMMARY

An ambitious sprint today broke multiple routes (/explore, /bedrock/*) after attempting to rename `/bedrock/experiences` to `/bedrock/experience` (singular) and add versioning + health check features. The damage was reversed via git reset, but we discovered the **ExperiencesConsole feature was never actually complete** - it was 90% built but missing the main console component.

### What We Thought We Had
- A working ExperiencesConsole at `/bedrock/experiences`
- Functioning system prompt management in Bedrock

### What We Actually Have
- 1,550 lines of infrastructure code (data hooks, editor, transforms, schema, tests)
- **NO main console component** (`index.ts` never created)
- **NO route wiring** (routes.tsx never updated)
- **NO navigation entry** (navigation.ts never updated)
- The feature was never functional

---

## BRANCH STATUS

| Branch | Commit | Status | Action |
|--------|--------|--------|--------|
| `main` | `d2b7700` | ✅ STABLE | Deploy-ready, no ExperiencesConsole |
| `hotfix/experiences-console-v1.1` | `762fe16` | ⚠️ INCOMPLETE | Has 90% of code, missing index.ts + wiring |
| `bedrock` | `18ed922` | ❌ STALE | 20+ commits behind, DO NOT USE |
| `stash@{0}` | - | 📦 Partial work | Contains route/nav changes but references missing file |

---

## WHAT HAPPENED IN THIS THREAD

### Early Research (Context Audit)
1. Audited feature flags - found dual-source problem (defaults.ts vs narratives-schema.ts)
2. Audited health checks - found well-structured DEX-compliant JSON config
3. Decided system prompts warrant GroveObject treatment, flags probably don't

### Sprint Planning (Foundation Loop)
Created full sprint artifacts for "experience-route-refactor-v1":
- REPO_AUDIT.md - Mapped all files needing changes
- SPEC.md - Defined scope (rename, versioning, health integration, status bug)
- ARCHITECTURE_DECISION.md - Documented key decisions
- MIGRATION_MAP.md - Phased execution plan
- STORY_BREAKDOWN.md - 19 stories, 40 points
- EXECUTION_PROMPT.md - Detailed implementation guide

### Sprint Execution Attempt
1. Created sprint folder in `docs/sprints/experience-route-refactor-v1/`
2. Handed off to Claude Code CLI for execution
3. Claude Code made ~170 file changes including console rename + route changes
4. **Everything broke** - /explore, /bedrock/*, Terminal all non-functional
5. `git reset --hard` to bedrock branch (which was stale)
6. More confusion ensued

### Discovery
1. The `bedrock` branch was 20+ commits behind `main`
2. The ExperiencesConsole NEVER had an `index.ts` - the feature was incomplete from the start
3. The sprint folder we created was wiped out by git reset (never committed)
4. Only remaining artifact is `docs/hotfixes/HOTFIX-003-experiences-console-source-control.md`

---

## CURRENT STATE (AS OF NOW)

### Files That Exist (90% Complete)
```
src/bedrock/consoles/ExperiencesConsole/
├── ExperiencesConsole.config.ts    ✅ 93 lines
├── SystemPromptEditor.tsx          ✅ 438 lines  
├── useExperienceData.ts            ✅ 232 lines
└── transforms/
    ├── index.ts                    ✅ 8 lines
    └── system-prompt.transforms.ts ✅ 127 lines

src/bedrock/types/experience.types.ts     ✅ 169 lines
src/core/schema/system-prompt.ts          ✅ 284 lines
supabase/migrations/009_add_system_prompt_provenance.sql ✅ 32 lines
tests/unit/transforms/system-prompt-transforms.test.ts   ✅ 163 lines
```

### Files That Are MISSING (10% - But Critical)
```
src/bedrock/consoles/ExperiencesConsole/index.ts  ❌ MISSING - the actual console component
src/router/routes.tsx                              ❌ No /experiences route entry
src/bedrock/config/navigation.ts                   ❌ No experiences nav item
```

### Git Status
- Current branch: `hotfix/experiences-console-v1.1`
- Only untracked file: `docs/hotfixes/HOTFIX-003-experiences-console-source-control.md`
- Stash contains partial route/nav work but references missing index.ts

---

## YOUR MISSION

### Objective
Complete the ExperiencesConsole feature with minimal risk. The goal is NOT the ambitious sprint we planned - it's simply getting the existing 90% of code functional.

### Phase 1: Create the Missing Console Component

**File to create:** `src/bedrock/consoles/ExperiencesConsole/index.ts`

Reference these working consoles for pattern:
- `src/bedrock/consoles/LensWorkshop/index.ts`
- `src/bedrock/consoles/PromptWorkshop/index.ts`

The console should:
1. Import `useExperienceData` hook
2. Import `experiencesConsoleConfig` 
3. Import `SystemPromptEditor`
4. Use the console-factory pattern OR implement the three-column layout directly
5. Export as default

### Phase 2: Wire the Route

**File to modify:** `src/router/routes.tsx`

Add:
```typescript
// Import (around line 42)
const ExperiencesConsole = lazy(() => import('../bedrock/consoles/ExperiencesConsole'));

// Route under /bedrock children (around line 247)
{
  path: 'experiences',
  element: (
    <Suspense fallback={<ConsoleLoadingFallback />}>
      <ExperiencesConsole />
    </Suspense>
  ),
},
```

### Phase 3: Wire the Navigation

**File to modify:** `src/bedrock/config/navigation.ts`

Add to `BEDROCK_NAV_ITEMS`:
```typescript
{
  id: 'experiences',
  label: 'Experiences',
  icon: 'smart_toy',
  path: '/bedrock/experiences',
},
```

Add to `CONSOLE_METADATA`:
```typescript
experiences: {
  id: 'experiences',
  title: 'Experiences',
  description: 'Manage AI system prompts for /explore',
  icon: 'smart_toy',
  path: '/bedrock/experiences',
},
```

### Phase 4: Verify
1. `npm run build` - must succeed
2. `npm run dev` - start dev server
3. Navigate to `/bedrock/experiences` - should load console
4. Sidebar should show "Experiences" nav item
5. Console should display system prompts from Supabase

### Phase 5: Commit and Document
```bash
git add .
git commit -m "feat: complete ExperiencesConsole MVP - wire console, routes, navigation"
```

---

## KEY REFERENCE FILES

### Understand the Pattern
- `docs/hotfixes/HOTFIX-003-experiences-console-source-control.md` - Full assessment
- `src/bedrock/consoles/LensWorkshop/index.ts` - Working console to reference
- `src/bedrock/patterns/console-factory.ts` - Factory pattern (if used)

### Existing Infrastructure (Already Built)
- `src/bedrock/consoles/ExperiencesConsole/ExperiencesConsole.config.ts`
- `src/bedrock/consoles/ExperiencesConsole/SystemPromptEditor.tsx`
- `src/bedrock/consoles/ExperiencesConsole/useExperienceData.ts`
- `src/bedrock/types/experience.types.ts`
- `src/core/schema/system-prompt.ts`

### Files to Create/Modify
- `src/bedrock/consoles/ExperiencesConsole/index.ts` (CREATE)
- `src/router/routes.tsx` (MODIFY - add route)
- `src/bedrock/config/navigation.ts` (MODIFY - add nav item)

---

## THINGS TO AVOID

1. **DO NOT rename anything** - Keep it "experiences" (plural) for now
2. **DO NOT add versioning features** - That's a future sprint
3. **DO NOT add health check integration** - That's a future sprint  
4. **DO NOT touch the bedrock branch** - It's stale and dangerous
5. **DO NOT make changes outside the three files listed** - Minimal footprint

---

## SUCCESS CRITERIA

- [ ] `/bedrock/experiences` loads without error
- [ ] Console displays system prompts from database
- [ ] Sidebar navigation shows "Experiences" link
- [ ] `npm run build` succeeds
- [ ] No regressions to `/explore` or other routes

---

## IF SOMETHING BREAKS

The stash contains partial work. To recover:
```bash
git stash list
git stash show -p stash@{0}  # View what's in stash
```

To completely abandon and reset:
```bash
git checkout main
git status  # Should be clean
```

---

## AFTER COMPLETION

Once the console is working, we can plan the NEXT sprint for:
- Route rename (experiences → experience)
- Versioning workflow (fork/deploy/archive)
- Health check integration
- Status bug in footer

But that's LATER. Right now, just get the existing code functional.

---

*This recovery prompt created 2026-01-08 after sprint failure analysis.*
