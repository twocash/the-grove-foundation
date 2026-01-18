# Sprint 7.2: LensPicker Card Pattern + Sidebar IA

**Status:** Ready for Execution  
**Depends On:** Sprint 7.1 (c325036) ✅

## Summary

Two focused changes to align with established patterns:

### Part A: LensCard Interaction
Match the JourneyCard pattern where clicking the card opens the inspector, and a "Select" button takes the action.

| Before | After |
|--------|-------|
| Click card → selects lens + opens inspector | Click card → opens inspector only |
| No separate button | "Select" button to activate lens |

### Part B: Sidebar IA
Add "Grove Project" nesting and "+ Fields" placeholder.

```
BEFORE:                  AFTER:
Explore                  Explore
  ├─ Nodes                 └─ Grove Project
  ├─ Journeys                  ├─ Nodes
  └─ Lenses                    ├─ Journeys
                               └─ Lenses
                           └─ + Fields (Soon)
```

## Files

| File | Purpose |
|------|---------|
| [SPEC.md](./SPEC.md) | Full specification |
| [EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md) | Copy to Claude Code |
| [FILE_REFERENCE.md](./FILE_REFERENCE.md) | Current file contents |

## Key Files to Modify

- `src/explore/LensPicker.tsx` - Update LensCard component
- `src/workspace/NavigationSidebar.tsx` - Restructure explore tree

## Already Working ✅

- `src/explore/LensInspector.tsx` - Full config UI exists
- `src/workspace/Inspector.tsx` - Lens case wired up
