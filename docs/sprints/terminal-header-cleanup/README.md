# Terminal Header Cleanup Sprint

**Status:** Ready for execution

## Sprint Documents

| Document | Purpose |
|----------|---------|
| [SPEC.md](./SPEC.md) | Full specification with design details |
| [FILE_REFERENCE.md](./FILE_REFERENCE.md) | Current file contents for reference |
| [EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md) | Copy-paste prompt for new context |

## Quick Summary

**Goal:** Move Field/Lens/Journey pills and Streak to header, clean bottom area

**Changes:**
1. `TerminalHeader.tsx` - Add context selector pills + streak
2. `Terminal.tsx` - Pass props, remove bottom controls, restyle Scholar Mode
3. Keep Scholar Mode button (restyled for dark mode)

## Execution

1. Open new Claude context
2. Copy prompt from `EXECUTION_PROMPT.md`
3. Execute implementation
4. Return with screenshot and results

## Acceptance Criteria

- [ ] Header shows Field, Lens, Journey pills
- [ ] Streak icon in header links to stats
- [ ] Bottom only has Scholar Mode + input
- [ ] Dark mode styling consistent
- [ ] Build passes
- [ ] Tests pass
