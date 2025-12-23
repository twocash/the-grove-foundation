# Sprint 7.3: Unified Compact Picker Pattern

**Status:** Ready for Execution  
**Depends On:** Sprint 7.2 (c41b7d7) ✅

## Summary

Unify lens and journey pickers into single components with two modes:

| Mode | Layout | Behavior | Trigger |
|------|--------|----------|---------|
| `full` | Grid + search + inspector | Card click → inspector | Sidebar navigation |
| `compact` | List + simple header | Card click → select + return | Chat nav pill click |

## What Gets Deleted

```
components/Terminal/
  ├── LensPicker.tsx        → DELETED (replaced by compact mode)
  ├── WelcomeInterstitial.tsx → DELETED (folded into compact)
  └── LensGrid.tsx          → DELETED (unused after migration)
```

## Files

| File | Purpose |
|------|---------|
| [SPEC.md](./SPEC.md) | Full specification |
| [EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md) | Copy to Claude Code (includes Foundation Loop) |

## Key Changes

1. **LensPicker** gets `mode` prop + `CompactLensCard` component
2. **JourneyList** gets `mode` prop + `CompactJourneyCard` component
3. **Terminal** wires compact modes for chat nav triggers
4. **Legacy components** deleted

## Acceptance Criteria

- [ ] Chat nav lens pill → compact lens picker → select → back to chat
- [ ] Chat nav journey indicator → compact journey picker → start → back to chat
- [ ] Sidebar → Lenses → full picker with grid + inspector
- [ ] Sidebar → Journeys → full list with grid + inspector
- [ ] Legacy components deleted, no broken imports
