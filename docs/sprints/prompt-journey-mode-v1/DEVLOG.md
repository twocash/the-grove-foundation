# DEVLOG: prompt-journey-mode-v1

## Sprint Overview
**Started:** 2026-01-05
**Status:** 🟡 Planning Complete - Ready for Execution

---

## Planning Session: 2026-01-05

**Phase:** Foundation Loop Planning (Feature Tier)
**Duration:** ~30 minutes

### Analysis Completed

1. **Bug Identified:**
   - `ResponseObject.handleForkSelect` calls `onPromptSubmit(fork.queryPayload)`
   - `queryPayload` contains `executionPrompt` (detailed LLM instructions)
   - This long prompt appears in chat instead of short `label`

2. **Pattern Discovered:**
   - Wayne Turner lens already uses Journey Mode pattern correctly
   - Sets `closingBehavior: 'question'` and disables nav tags
   - 4D Context Fields system surfaces prompts via `useNavigationPrompts`

3. **Architecture Decision:**
   - Add `executionPrompt?: string` to `QueryStreamItem` schema
   - Separate display text from execution prompt in submit flow
   - Toggle overrides `personaBehaviors` at ExploreShell level

### Artifacts Created
- [x] SPEC.md - Goals, acceptance criteria, attention anchor
- [x] SPRINTS.md - 3 epics, 9 stories
- [x] EXECUTION_PROMPT.md - Self-contained handoff for Claude CLI
- [x] PROMPT_LIBRARY_ANALYSIS.md - Inventory and recommendations
- [x] CONTINUATION_PROMPT.md - Context reconstruction for future sessions

### Next Action
Hand `EXECUTION_PROMPT.md` to Claude CLI for implementation.

---

## Parallel Work: Prompt Library Expansion

### 2026-01-05 (continued)

**Expanded `base.prompts.json`:** 15 → 23 prompts

Added prompts following Wayne Turner stage progression pattern:

| Stage | New Prompts Added |
|-------|-------------------|
| Genesis | "Why does this matter?", "Who is this for?" |
| Exploration | "How does the technical architecture work?", "What makes this different?", "What evidence supports this?" |
| Synthesis | "What are the honest limitations?", "How does the economics work?", "What would success look like in 5 years?" |
| Advocacy | "What could I do with this?", "How would I explain this to someone else?", "What's the one thing I should remember?" |

**Key improvements:**
- All prompts now have `minInteractions` progression
- Added `systemContext` for better LLM guidance
- Weights tuned for appropriate surfacing (genesis hooks: 92-95, advocacy closers: 90-95)
- "Honest limitations" prompt at weight 95 (trust builder)

---

## Execution Log

### Epic 1: Schema & Bug Fix
**Status:** ⏳ Pending

#### Story 1.1: Extend QueryStreamItem
**Status:** ⏳ Pending

#### Story 1.2: Modify submit()
**Status:** ⏳ Pending

#### Story 1.3: Fix ResponseObject
**Status:** ⏳ Pending

#### Story 1.4: Wire Through ExploreShell
**Status:** ⏳ Pending

---

### Epic 2: Journey Mode Toggle UI
**Status:** ⏳ Pending

#### Story 2.1: Add Feature Flag
**Status:** ⏳ Pending

#### Story 2.2: Add Journey Mode State
**Status:** ⏳ Pending

#### Story 2.3: Add Toggle UI
**Status:** ⏳ Pending

---

### Epic 3: Verify End-to-End
**Status:** ⏳ Pending

#### Story 3.1: Manual Testing
**Status:** ⏳ Pending

---

## Prompt Library Status

| File | Before | After | Coverage |
|------|--------|-------|----------|
| `base.prompts.json` | 15 | 23 | ✅ Complete journey |
| `wayne-turner.prompts.json` | 20 | 20 | ✅ Complete |
| `dr-chiang.prompts.json` | 24 | 24 | ✅ Complete |
| **Total** | 59 | 67 | |

### Future Expansion (Not This Sprint)
- `academic.prompts.json` - Research methodology focus
- `engineer.prompts.json` - Technical deep-dives
- `concerned-citizen.prompts.json` - Personal impact
- `family-office.prompts.json` - Investment thesis
