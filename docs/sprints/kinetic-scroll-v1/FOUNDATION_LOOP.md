# FOUNDATION_LOOP: kinetic-scroll-v1

**Sprint:** kinetic-scroll-v1
**Date:** December 28, 2025
**Status:** ✅ Ready for Execution

---

## Sprint Summary

Implement "Sticky-Release" scroll physics for the Kinetic Stream. This prevents jitter during LLM streaming while giving users control to review history.

**Key Behavior:**
- **Magnet** - User at bottom (within 50px) stays locked to bottom
- **Release** - Scroll up 1px past threshold breaks the lock
- **Re-engage** - Scroll to bottom, click FAB, or submit new query

---

## Artifact Status

| Phase | Artifact | Status |
|-------|----------|--------|
| 1 | REPO_AUDIT.md | ✅ Complete |
| 2 | SPEC.md | ✅ Complete |
| 3 | ARCH_DECISIONS.md | ✅ Complete |
| 4 | MIGRATION_MAP.md | ✅ Complete |
| 5 | TEST_STRATEGY.md | ✅ Complete |
| 6 | SPRINTS.md | ✅ Complete |
| 7 | EXECUTION_PROMPT.md | ✅ Complete |
| 8 | FOUNDATION_LOOP.md | ✅ Complete |

---

## Files Summary

### Create (3 files)
| File | Purpose |
|------|---------|
| `src/surface/components/KineticStream/hooks/useKineticScroll.ts` | Sticky-release scroll physics hook |
| `src/surface/components/KineticStream/Stream/ScrollAnchor.tsx` | Invisible scroll target |
| `src/surface/components/KineticStream/CommandConsole/ScrollToBottomFab.tsx` | Resume button with streaming indicator |

### Modify (4 files)
| File | Changes |
|------|---------|
| `src/surface/components/KineticStream/hooks/index.ts` | Export new hook |
| `src/surface/components/KineticStream/Stream/KineticRenderer.tsx` | Add bottomRef, render ScrollAnchor |
| `src/surface/components/KineticStream/CommandConsole/index.tsx` | Add scroll props, render FAB |
| `src/surface/components/KineticStream/ExploreShell.tsx` | Integrate useKineticScroll, wire refs |

---

## Execution

### Claude Code CLI Command

```bash
cd C:\GitHub\the-grove-foundation
cat docs/sprints/kinetic-scroll-v1/EXECUTION_PROMPT.md | claude
```

Or copy the EXECUTION_PROMPT.md content directly into Claude Code.

---

## Post-Execution

### Verification
```bash
npx tsc --noEmit
npm run build
npm run dev
# Navigate to /explore and test scroll behavior
```

### Manual Test Checklist
1. Submit query → auto-scrolls during response
2. Scroll up during streaming → FAB appears, auto-scroll stops
3. Click FAB → smooth scroll to bottom
4. Submit new query → instant scroll to bottom
5. No jitter during rapid streaming

### Commit
```bash
git add .
git commit -m "feat(kinetic): implement sticky-release scroll physics

- Add useKineticScroll hook with 50px magnetic threshold
- Add ScrollAnchor component for reliable scrollIntoView
- Add ScrollToBottomFab with streaming indicator
- Wire scroll refs and handlers through ExploreShell
- Auto-scroll during streaming, release on user scroll
- FAB appears when scrolled up during active stream

Sprint: kinetic-scroll-v1"
```

---

## Dependencies

**Previous Sprint:** kinetic-experience-v1 (completed)
**Next Sprint:** (to be determined)

**No new npm dependencies required.**

---

## Estimated Duration

**Implementation:** 1.5-2 hours
**Testing:** 30 minutes
**Total:** ~2.5 hours

---

*Foundation Loop complete. Ready for execution.*
