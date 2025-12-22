# Sprint 7: Terminal Flow Cleanup

**Status:** Ready for Execution
**Created:** 2024-12-22

## Sprint Documents

| Document | Purpose |
|----------|---------|
| [SPEC.md](./SPEC.md) | Full specification with implementation plan |
| [FILE_REFERENCE.md](./FILE_REFERENCE.md) | Current file contents for reference |
| [EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md) | Copy-paste prompt for Claude Code |

## Quick Summary

**Goal:** Complete Terminal UX modernization

**Issues to Fix:**
1. Header disappears after chat engagement
2. Journey pill shows "Guided Journey" instead of actual name
3. JourneyCard is verbose and redundant (context now in header)
4. JourneyCompletion floats outside viewport as modal

**Target State:**
- Header always visible with Lens + Journey name pills
- Minimal inline journey prompt (just the suggestion)
- Journey completion renders inline in chat

## Execution

1. Open Claude Code context
2. Copy prompt from `EXECUTION_PROMPT.md`
3. Follow Foundation Loop methodology
4. Return with screenshots and DEVLOG.md

## Files to Modify

| File | Change |
|------|--------|
| `components/Terminal.tsx` | Header fix, journey name, move completion |
| `components/Terminal/JourneyCard.tsx` | Complete redesign (simplify) |
| `components/Terminal/JourneyCompletion.tsx` | Dark mode + inline styling |

## Acceptance Criteria

- [ ] Header visible at all times during chat
- [ ] Journey pill shows actual journey name
- [ ] JourneyCard minimal - only shows suggestion
- [ ] JourneyCompletion inline, not floating
- [ ] Dark mode styling consistent
- [ ] Build passes
- [ ] Tests pass

## Post-Sprint Notes

_To be filled after sprint completion:_

- What worked:
- What didn't:
- Decisions made:
- Follow-up items:
