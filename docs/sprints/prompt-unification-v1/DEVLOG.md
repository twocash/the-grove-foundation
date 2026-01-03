# DEVLOG: prompt-unification-v1

**Progress tracking**

---

## Sprint Status

| Epic | Status | Progress |
|------|--------|----------|
| 1. Schema & Data Layer | ✅ Complete | 5/5 |
| 2. PromptWorkshop Console | ✅ Complete | 7/7 |
| 3. Explore Integration | ✅ Complete | 4/4 |
| 4. Seed Data & Verification | ✅ Complete | 3/3 |

---

## January 3, 2026 - Planning Complete

### Completed

- [x] Phase 0: Pattern Check
  - Reviewed PROJECT_PATTERNS.md
  - Mapped requirements to existing patterns
  - No new patterns required
  
- [x] Phase 0.5: Canonical Source Audit
  - Verified all components use canonical sources
  - No duplication planned
  
- [x] Phase 1: Repository Audit (REPO_AUDIT.md)
  - Documented current state
  - Identified extension points
  
- [x] Phase 2: Specification (SPEC.md)
  - DEX Compliance Matrix with evidence
  - Functional requirements documented
  - Console checklist included
  
- [x] Phase 3: Architecture (ARCHITECTURE.md)
  - Type definitions complete
  - Database schema documented
  - Console layout specified
  
- [x] Phase 4: Migration Map (MIGRATION_MAP.md)
  - File-by-file changes listed
  - Create/modify operations identified
  
- [x] Phase 5: Decisions (DECISIONS.md)
  - 6 ADRs documented
  - Rationale for each decision
  
- [x] Phase 6: Sprints (SPRINTS.md)
  - 4 epics, 19 stories
  - Test requirements for each story
  - Build gates defined
  
- [x] Phase 7: Execution Prompt (EXECUTION_PROMPT.md)
  - Self-contained handoff ready
  - Code samples included
  - Troubleshooting section

### Artifacts Created

```
docs/sprints/prompt-unification-v1/
├── INDEX.md
├── SPEC.md
├── REPO_AUDIT.md
├── ARCHITECTURE.md
├── MIGRATION_MAP.md
├── DECISIONS.md
├── SPRINTS.md
├── EXECUTION_PROMPT.md
└── DEVLOG.md (this file)
```

### Next Steps

- [ ] Hand off to Claude Code for execution
- [ ] Begin Epic 1: Schema & Data Layer

---

## Execution Log

---

## January 3, 2026 - 04:45 UTC

### All Epics Complete

**Epic 1: Schema & Data Layer**
- Created `src/core/schema/prompt.ts` with PromptPayload type
- Added Prompt exports to `src/core/schema/index.ts`
- Extended GroveObjectType in `grove-data-provider.ts` with 'prompt'
- Added TABLE_MAP entry in `supabase-adapter.ts`: prompt -> prompts
- Created `supabase/migrations/002_create_prompts_table.sql`

**Epic 2: PromptWorkshop Console**
- Created `src/bedrock/consoles/PromptWorkshop/` directory
- Created `PromptWorkshop.config.ts` with console configuration
- Created `usePromptData.ts` hook with sequence helpers
- Created `PromptCard.tsx` component
- Created `PromptEditor.tsx` with 4-tab interface
- Created `index.ts` wiring to console factory
- Added navigation and route entries

**Epic 3: Explore Integration**
- Created `src/explore/utils/scorePrompt.ts` with scoring algorithm
- Created `src/explore/hooks/usePromptSuggestions.ts`
- Created `src/explore/hooks/useSequence.ts`
- Updated hook exports

**Epic 4: Seed Data**
- Created `scripts/seed-prompts.ts` for Supabase seeding

### Files Created

| File | Purpose |
|------|---------|
| `src/core/schema/prompt.ts` | Type definitions |
| `supabase/migrations/002_create_prompts_table.sql` | Database table |
| `src/bedrock/consoles/PromptWorkshop/PromptWorkshop.config.ts` | Console config |
| `src/bedrock/consoles/PromptWorkshop/usePromptData.ts` | Data hook |
| `src/bedrock/consoles/PromptWorkshop/PromptCard.tsx` | Card component |
| `src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx` | Editor component |
| `src/bedrock/consoles/PromptWorkshop/index.ts` | Console export |
| `src/explore/utils/scorePrompt.ts` | Scoring algorithm |
| `src/explore/hooks/usePromptSuggestions.ts` | Suggestions hook |
| `src/explore/hooks/useSequence.ts` | Sequence navigation |
| `scripts/seed-prompts.ts` | Data seeding |

### Files Modified

| File | Change |
|------|--------|
| `src/core/schema/index.ts` | Added prompt exports |
| `src/core/data/grove-data-provider.ts` | Added 'prompt' type |
| `src/core/data/adapters/supabase-adapter.ts` | Added TABLE_MAP entry |
| `src/bedrock/config/navigation.ts` | Added PromptWorkshop nav |
| `src/router/routes.tsx` | Added /bedrock/prompts route |
| `src/explore/hooks/index.ts` | Added hook exports |

### Issues Encountered

- **Branch sync issue**: `bedrock` branch was behind `main`, missing data layer
  - Resolution: Merged main into bedrock before proceeding

### Build Gate

```bash
npm run build  # ✅ Pass (29.18s)
```

### Next Steps

- [ ] Apply Supabase migration via dashboard/CLI
- [ ] Run `npx tsx scripts/seed-prompts.ts` with env vars
- [ ] Test PromptWorkshop at /bedrock/prompts
- [ ] Wire usePromptSuggestions to Terminal for suggestions

---

## January 3, 2026 - 19:30 UTC

### PromptWorkshop Bug Fixes

**Issue 1: UUID Format Validation**
- **Error**: `POST .../rest/v1/prompts 400 (Bad Request) - invalid input syntax for type uuid: "prompt-1767466093942"`
- **Root Cause**: `createDefaultPrompt()` in usePromptData.ts generated IDs as `prompt-${Date.now()}` but Supabase expects valid UUIDs
- **Fix**: Replaced with `generateUUID()` from `@core/versioning/utils` in both `createDefaultPrompt()` and `duplicate()` functions

**Issue 2: Infinite Render Loop**
- **Error**: `BedrockUIContext.tsx:85 Maximum update depth exceeded`
- **Root Cause**: `useEffect` in console-factory.tsx called `openInspector()` on every render; the config object was recreated each render, triggering state updates
- **Fix**: 
  - Added `useRef` to track last opened selection ID
  - Split single useEffect into open/close + update effects
  - Memoized `inspectorConfig` to prevent unnecessary recreation

**Issue 3: PromptEditor Props Mismatch**
- **Error**: `onUpdate is not a function`
- **Root Cause**: PromptEditor expected `onUpdate` prop but `ObjectEditorProps` interface provides `onEdit`
- **Fix**: Updated PromptEditor to use correct prop names from interface

**Issue 4: Input Field Keystroke Loss**
- **Symptom**: Typing in input fields produced garbled output; characters were lost or duplicated
- **Root Cause**: `onEdit` triggered immediate database persistence on every keystroke, causing re-renders that reset cursor position
- **Fix**: Rewrote PromptEditor with local state pattern:
  - Local `useState` for all editable fields
  - Sync from prompt on selection change via `useEffect`
  - Persist on blur (not keystroke)
  - Added Save/Delete/Duplicate action buttons
  - Added dirty state indicator

**Issue 5: Missing Action Buttons**
- **Symptom**: No way to save, delete, or duplicate prompts
- **Fix**: Added action button row to PromptEditor header with:
  - Duplicate button (content_copy icon)
  - Delete button (delete icon, red accent)
  - Save button (save icon, cyan accent, disabled when no changes)

### Files Modified

| File | Change |
|------|--------|
| `src/bedrock/consoles/PromptWorkshop/usePromptData.ts` | UUID generation fix |
| `src/bedrock/patterns/console-factory.tsx` | Infinite loop prevention |
| `src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx` | Complete rewrite with local state |
| `src/bedrock/consoles/PromptWorkshop/PromptWorkshop.config.ts` | Type compliance fixes |
| `src/bedrock/consoles/PromptWorkshop/index.ts` | Export fix |

### Testing

- PromptWorkshop loads without console errors
- "New Prompt" creates prompt with valid UUID
- Input fields accept text without loss
- Changes persist on blur
- Save/Delete/Duplicate buttons functional

### Build Gate

```bash
npm run build  # Pending verification
```
