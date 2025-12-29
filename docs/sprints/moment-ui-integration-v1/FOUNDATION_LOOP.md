# FOUNDATION_LOOP.md — moment-ui-integration-v1

**Sprint:** moment-ui-integration-v1
**Created:** 2024-12-29
**Status:** Ready for Execution

---

## Sprint Summary

Wire the declarative moment system from `engagement-orchestrator-v1` to actual UI surfaces in the Terminal. This sprint connects infrastructure to visible, interactive moments.

## Artifacts Created

| Artifact | Status | Purpose |
|----------|--------|---------|
| SPEC.md | ✅ Complete | Requirements, patterns, file inventory |
| ADR.md | ✅ Complete | Architecture decisions (ADR-014, 015, 016) |
| STORY_BREAKDOWN.md | ✅ Complete | Epics and stories with implementation |
| EXECUTION_PROMPT.md | ✅ Complete | Self-contained handoff for Claude Code CLI |

---

## Patterns Extended

| Pattern | Extension |
|---------|-----------|
| Pattern 6 (Component Composition) | Surface-specific moment wrappers |
| Pattern 7 (Object Model) | Reveal components follow GroveObject access |
| Pattern 2 (Engagement Machine) | Journey start wiring |
| Pattern 10 (Declarative Engine) | Component registry population |

## New Patterns

None required.

---

## Key Decisions

### ADR-014: Surface-Specific Renderers
Surface components (Overlay, Toast, Inline) handle layout; MomentCard handles content.

### ADR-015: Action Execution Hook
Separate `useMomentActions` hook for journey/lens/navigation wiring.

### ADR-016: Reveal Component Pattern
Lightweight reveal components accepting moment + variant props.

---

## File Changes

### New Files (9)
1. MomentOverlay.tsx - Full-screen overlay renderer
2. MomentToast.tsx - Toast notification renderer
3. MomentInline.tsx - In-stream card renderer
4. reveals/SimulationReveal.tsx - Simulation reveal content
5. reveals/CustomLensOffer.tsx - Lens offer content
6. reveals/EntropyJourneyOffer.tsx - Journey offer content
7. reveals/index.ts - Reveal exports
8. useMomentActions.ts - Action execution hook

### Modified Files (4)
1. component-registry.ts - Add lazy imports
2. MomentRenderer/index.ts - Add exports
3. useMoments.ts - Wire action execution
4. ExploreShell.tsx - Add overlay integration

---

## Execution

Hand off `EXECUTION_PROMPT.md` to Claude Code CLI:

```bash
cd C:\GitHub\the-grove-foundation
# Open in Claude Code or provide EXECUTION_PROMPT.md
```

## Success Criteria

1. ✅ `simulation-reveal` displays as overlay after journey completion
2. ✅ `startJourney` action actually starts a journey
3. ✅ Toast notifications appear and auto-dismiss
4. ✅ All 5 existing moments can render

---

## Dependencies

- ✅ `engagement-orchestrator-v1` (c1df11b)
- ✅ `kinetic-context-v1` (ad0b8b7)
- ✅ Journey registry
