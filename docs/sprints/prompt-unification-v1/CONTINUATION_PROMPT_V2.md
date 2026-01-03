# Continuation Prompt: PromptWorkshop Functionality Sprint

**Session handoff for fresh context**

---

## Quick Start

```
Read C:\GitHub\the-grove-foundation\docs\sprints\prompt-unification-v1\CONTINUATION_PROMPT_V2.md and plan the PromptWorkshop functionality improvements.
```

---

## What Was Accomplished

### Sprint: prompt-unification-v1 ✅

**Location:** `C:\GitHub\the-grove-foundation\docs\sprints\prompt-unification-v1/`

The sprint created a unified Prompt object type and PromptWorkshop console:

| Deliverable | Status | Files |
|-------------|--------|-------|
| Schema & Types | ✅ | `src/core/schema/prompt.ts` |
| Supabase Table | ✅ | `public.prompts` with JSONB payload |
| PromptWorkshop Console | ✅ | `src/bedrock/consoles/PromptWorkshop/*` |
| Scoring Algorithm | ✅ | `src/explore/utils/scorePrompt.ts` |
| Suggestion Hooks | ✅ | `src/explore/hooks/usePromptSuggestions.ts` |
| Seed Data | ✅ | 57 prompts seeded via `scripts/seed-prompts.ts` |

### Post-Sprint Fixes Applied

Several issues were discovered and fixed during deployment:

1. **Schema mismatch:** Migration originally created `knowledge.prompts` but Supabase API defaulted to `public` schema. Fixed by recreating table in `public` schema.

2. **Flat vs JSONB structure:** Original migration used flat columns but `SupabaseAdapter` expects `payload` JSONB column. Fixed by recreating table with:
   ```sql
   CREATE TABLE public.prompts (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     type TEXT DEFAULT 'prompt',
     title TEXT NOT NULL,
     description TEXT,
     icon TEXT,
     color TEXT,
     status TEXT DEFAULT 'active',
     tags TEXT[] DEFAULT '{}',
     favorite BOOLEAN DEFAULT false,
     created_at TIMESTAMPTZ DEFAULT now(),
     updated_at TIMESTAMPTZ DEFAULT now(),
     payload JSONB NOT NULL DEFAULT '{}'
   );
   ```

3. **UUID vs slug IDs:** Source JSON used slug IDs (`what-is-grove`) but table required UUIDs. Fixed seed script to omit ID and let Supabase auto-generate.

4. **LocalStorage default:** `RootLayout.tsx` defaulted to `LocalStorageAdapter`. Fixed to use `SupabaseAdapter` with VITE_ prefixed env vars.

**Modified files:**
- `src/router/RootLayout.tsx` — Now creates SupabaseAdapter from env vars
- `.env.local` — Added `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- `scripts/seed-prompts.ts` — Uses payload JSONB structure, auto-generates UUIDs
- `supabase/migrations/002_create_prompts_table.sql` — Added schema prerequisites (needs update to match actual deployed schema)

---

## Current State

The PromptWorkshop console loads and displays 57 prompts from Supabase. However, the UI needs work to be functionally useful:

### What Works
- Prompts load from Supabase
- Grid/list view toggle
- Basic stats cards (Total, Active, Sequences, Targeted)
- Navigation integrated into Bedrock sidebar

### What Needs Work

1. **Filtering & Search**
   - Source filter (library/generated/user)
   - Variant filter (default/glow/subtle/urgent)
   - Status filter (active/draft/archived)
   - Tag-based filtering
   - Full-text search on label/description/executionPrompt

2. **Sorting**
   - By weight (current default)
   - By created date
   - By last updated
   - By selection count (stats.selections)

3. **Tagging System**
   - Consistent with other Bedrock objects (Lens, Journey)
   - Tag autocomplete from existing tags
   - Bulk tag operations

4. **Inspector Panel**
   - View/edit prompt details
   - Preview execution prompt
   - View targeting rules
   - View/edit sequences
   - Stats display

5. **CRUD Operations**
   - Create new prompt (modal or inline)
   - Edit existing prompt
   - Duplicate prompt
   - Archive/delete prompt

6. **Consistency with Other Consoles**
   - Match LensWorkshop patterns
   - Match JourneyArchitect patterns
   - Unified filter/sort UX

---

## Reference Files

| Purpose | Location |
|---------|----------|
| PromptWorkshop Console | `src/bedrock/consoles/PromptWorkshop/` |
| Prompt Schema | `src/core/schema/prompt.ts` |
| Data Hook | `src/bedrock/consoles/PromptWorkshop/usePromptData.ts` |
| LensWorkshop (reference) | `src/bedrock/consoles/LensWorkshop/` |
| Bedrock Patterns | `src/bedrock/patterns/` |
| Sprint Docs | `docs/sprints/prompt-unification-v1/` |

---

## Suggested Approach

### Phase 1: Audit Existing Consoles
Review LensWorkshop and other Bedrock consoles to document:
- Filter component patterns
- Sort component patterns  
- Tag management patterns
- Inspector panel structure
- CRUD modal/form patterns

### Phase 2: Define Prompt-Specific Requirements
- What filters make sense for prompts?
- What sorting options are useful?
- What tags should be standardized?
- How should targeting be visualized?
- How should sequences be managed?

### Phase 3: Implementation
Apply patterns from Phase 1 to PromptWorkshop with prompt-specific requirements from Phase 2.

---

## Key Questions to Answer

1. **Tag taxonomy:** Should prompts use the same tag system as other objects, or have prompt-specific tags (e.g., `orientation`, `research`, `navigation`)?

2. **Sequence management:** Should sequences be managed in PromptWorkshop or in a separate SequenceBuilder console?

3. **Targeting visualization:** How should complex targeting rules (stages, lenses, entropy windows) be displayed and edited?

4. **Stats dashboard:** Should there be a separate analytics view for prompt performance?

---

## Build Commands

```bash
cd C:\GitHub\the-grove-foundation

# Dev server (Vite)
npm run dev

# Backend server (Express on 8080)
node server.js

# Type check
npm run typecheck

# Tests
npm test
```

---

## Environment Requirements

Both servers must be running:
- Vite dev server (port 3000+)
- Express backend (port 8080)

Supabase env vars must be VITE_ prefixed for client access:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## Session Handoff Complete

To continue:
1. Open fresh Claude context
2. Paste: `Read C:\GitHub\the-grove-foundation\docs\sprints\prompt-unification-v1\CONTINUATION_PROMPT_V2.md`
3. Begin with Phase 1 audit of existing console patterns
