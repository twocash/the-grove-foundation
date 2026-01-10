# Sprout Research v1 - Continuation Prompt

## Session State

**Last completed:** Phase 0.5 - System Prompt pattern audit
**Next action:** Phase 1a - Interface definitions (PromptArchitectConfig)
**Blocking issues:** Awaiting human review of Phase 0 audit

## Files Modified This Session

- `docs/sprints/sprout-research-v1/INDEX.md`: Created phase checklist
- `docs/sprints/sprout-research-v1/REPO_AUDIT.md`: Route verification + pattern audit complete
- `docs/sprints/sprout-research-v1/DEVLOG.md`: Session 1 log
- `docs/sprints/sprout-research-v1/CONTINUATION_PROMPT.md`: This file

## Verification Status

- [x] Checkpoint tag created: `checkpoint-pre-sprout-research-20260110`
- [x] Sprint branch created: `feature/sprout-research-v1`
- [x] Build passing
- [x] Phase 0.25 route verification complete
- [x] Phase 0.5 pattern audit complete
- [ ] Human review of integration point

## To Resume

1. Read `docs/sprints/sprout-research-v1/DEVLOG.md`
2. Read `docs/sprints/sprout-research-v1/REPO_AUDIT.md`
3. Run `npm run build` to verify baseline
4. Continue with Phase 1a - Interface definitions

## Key Context

**Integration Point:**
- File: `src/surface/components/KineticStream/ExploreShell.tsx`
- Function: `handleSubmit()` (lines 509-517)
- Strategy: Intercept `displayText.startsWith('sprout:')` before calling `submit()`

**Pattern Distinction:**
- `PromptArchitectConfig` = SINGLETON (mirror System Prompt exactly)
  - One active per grove
  - `saveAndActivate()` for versioning
  - Partial unique index: `WHERE status = 'active'`

- `ResearchSprout` = INSTANCE (different pattern)
  - Many active per grove
  - Version chain per sprout_id
  - No global "only one active" constraint

**Frozen Zones:**
- `components/Terminal/`: 77 files - DO NOT TOUCH
- `src/foundation/`: 23 files - DO NOT TOUCH

**Existing Infrastructure:**
- `ResearchManifest` type exists in `@core/schema/sprout.ts`
- `useSproutStorage` for localStorage persistence
- Selection-based capture already works (different from command-based)
