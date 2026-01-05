# Continuation Prompt: prompt-journey-mode-v1

## Instant Orientation

**Project:** C:\GitHub\the-grove-foundation
**Sprint:** prompt-journey-mode-v1
**Current Phase:** Ready for Execution
**Status:** 🟡 Planning Complete
**Next Action:** Hand EXECUTION_PROMPT.md to Claude CLI

## Context Reconstruction

### Read These First (In Order)
1. `docs/sprints/prompt-journey-mode-v1/SPEC.md` — Goals, acceptance criteria
2. `docs/sprints/prompt-journey-mode-v1/EXECUTION_PROMPT.md` — Self-contained handoff
3. `docs/sprints/prompt-journey-mode-v1/SPRINTS.md` — Epic/story breakdown

### Key Decisions Made
1. **Bug fix approach:** Add `executionPrompt?: string` to QueryStreamItem, separate display from execution
2. **Toggle approach:** localStorage persistence, feature flag gated, behavior override at ExploreShell level
3. **No Supabase for v1:** Keep it simple, add persistence later
4. **journeyMode overrides personaBehaviors:** Clean separation, doesn't modify persona definitions

### What's Done
- [x] Foundation Loop planning complete
- [x] SPEC.md with acceptance criteria
- [x] SPRINTS.md with 3 epics, 9 stories
- [x] EXECUTION_PROMPT.md ready for handoff
- [x] Prompt library analysis complete
- [x] Bug root cause identified (ResponseObject.handleForkSelect)

### What's Pending
- [ ] Epic 1: Schema & bug fix (4 stories)
- [ ] Epic 2: Journey Mode toggle UI (3 stories)
- [ ] Epic 3: End-to-end verification (1 story)
- [ ] Prompt library expansion (future sprint)

## Resume Instructions

### For Claude CLI Execution
```bash
cd C:\GitHub\the-grove-foundation

# Read the execution prompt
cat docs/sprints/prompt-journey-mode-v1/EXECUTION_PROMPT.md

# Or just start with:
# "Read EXECUTION_PROMPT.md in docs/sprints/prompt-journey-mode-v1 and execute the sprint"
```

### For Prompt Library Work (Parallel)
While Claude CLI runs, you can:
1. Review `docs/sprints/prompt-journey-mode-v1/PROMPT_LIBRARY_ANALYSIS.md`
2. Edit prompt JSON files directly (they hot-reload)
3. Add new prompts following Wayne Turner pattern

## Attention Anchor

**We are building:** Toggle to switch between LLM navigation and 4D library journeys
**Success looks like:** Toggle works, prompts show label (not executionPrompt) in chat
**We are NOT:** Expanding prompt library (separate task), modifying 4D scoring
