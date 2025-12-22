# Sprint 7.1: LensPicker Layout Fix (Revised)

**Status:** Ready for Execution
**Priority:** HIGH
**Created:** 2024-12-22
**Revised:** 2024-12-22 (v2.0 - Changed focus from header visibility to LensPicker layout)

## Sprint Documents

| Document | Purpose |
|----------|---------|
| [SPEC.md](./SPEC.md) | Full specification with implementation plan |
| [FILE_REFERENCE.md](./FILE_REFERENCE.md) | Current file contents and target structure |
| [EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md) | Copy-paste prompt for Claude Code |

## Quick Summary

**Problem:** LensPicker has legacy "THE GROVE TERMINAL" styling that doesn't fit the workspace design.

**Solution:** 
1. Replace legacy header with minimal "Back to Chat" navigation
2. Remove footer
3. Add dark mode styling throughout
4. Wire up onClose prop

## Scope

| Change | File | Impact |
|--------|------|--------|
| New header with back button | `LensPicker.tsx` | ~15 lines |
| Remove footer | `LensPicker.tsx` | -5 lines |
| Dark mode classes | `LensGrid.tsx` | ~20 class changes |
| Wire onClose | `Terminal.tsx` | +1 line |
| CSS cleanup | `ExploreChat.tsx` | +10 lines |

## Execution

1. Open Claude Code context
2. Copy prompt from `EXECUTION_PROMPT.md`
3. Follow Foundation Loop methodology
4. Return with screenshots and DEVLOG.md

## Acceptance Criteria

- [ ] "Back to Chat" button visible and functional
- [ ] Legacy header removed
- [ ] Footer removed  
- [ ] Dark mode styling consistent
- [ ] Lens selection works
- [ ] Build passes
- [ ] Tests pass

---

## Post-Sprint Notes

_Fill in after completion:_

### Changes Made
_List files modified and key changes_

### Issues Encountered
_Any problems or unexpected findings_

### Screenshots
_Attach before/after screenshots_

### Follow-Up Items
- [ ] Apply same treatment to WelcomeInterstitial
- [ ] Consider header persistence (Sprint 7.2?)
- [ ] Inspector context awareness (future sprint)
