# v0.12 Terminal UX Sprint - Completed

**Date:** 2025-12-20
**Status:** Complete
**Build:** Passing

## Summary

Transformed "The Terminal" into "Your Grove" with modern UX improvements including minimize-to-pill capability, streamlined header, controls relocation, and clickable suggestion chips.

## Changes Made

### New Components Created

| File | Purpose |
|------|---------|
| `components/Terminal/TerminalPill.tsx` | Minimized Terminal pill fixed at viewport bottom |
| `components/Terminal/TerminalHeader.tsx` | Clean "Your Grove" header with menu/minimize/close buttons |
| `components/Terminal/TerminalControls.tsx` | Controls bar below input (lens badge, journey progress, streak) |
| `components/Terminal/SuggestionChip.tsx` | Clickable suggestion chip with hover arrow animation |

### Files Modified

| File | Lines | Changes |
|------|-------|---------|
| `src/core/schema/base.ts` | 30-35 | Added `isMinimized?: boolean` to TerminalState |
| `data/narratives.json` | globalSettings.featureFlags | Added `terminal-minimize`, `terminal-controls-below` flags |
| `data/narratives-schema.ts` | DEFAULT_FEATURE_FLAGS | Added corresponding flag defaults |
| `components/Terminal/index.ts` | 10-13 | Exported TerminalPill, TerminalHeader, TerminalControls, SuggestionChip |
| `components/Terminal.tsx` | Multiple | Integrated all new components, minimize logic, telemetry |
| `styles/globals.css` | 162-195 | Added terminal-slide-up/down animations |
| `utils/funnelAnalytics.ts` | 268-282 | Added tracking functions |

### Feature Flags Added

| Flag ID | Name | Default | Purpose |
|---------|------|---------|---------|
| `terminal-minimize` | Terminal Minimize | `true` | Show minimize button in header |
| `terminal-controls-below` | Controls Below Input | `true` | Move lens/journey controls below input |

### Telemetry Events Added

| Event | Trigger |
|-------|---------|
| `terminal_minimized` | User clicks minimize button |
| `terminal_expanded` | User clicks pill to expand |
| `suggestion_clicked` | User clicks a suggestion chip |

## Architecture Decisions

Per ADR-001 through ADR-005 in DECISIONS.md:
- **ADR-001:** Used terminalState.isMinimized (not separate useState) for persistence
- **ADR-002:** Created TerminalPill as separate component (not inline)
- **ADR-003:** Created TerminalHeader with menu/minimize/close pattern
- **ADR-004:** TerminalControls positioned below input, gated by feature flag
- **ADR-005:** SuggestionChip replaces inline button in MarkdownRenderer

## User-Facing Changes

1. **"Your Grove" Branding** - Header now shows "Your Grove" instead of "The Terminal"
2. **Minimize Capability** - Terminal can minimize to a pill at viewport bottom
3. **Clean Header** - Simplified header with menu button (placeholder), minimize, close
4. **Controls Below Input** - Lens badge, journey progress, streak shown below input area
5. **Clickable Suggestions** - AI-suggested prompts are styled as interactive chips with hover arrow

## Testing Checklist

- [x] Build passes
- [x] Feature flags control visibility
- [x] Minimize/expand cycle works
- [x] Pill shows loading state
- [x] Controls show correct lens/progress/streak
- [x] Suggestion chips are clickable
- [x] Telemetry events fire correctly
- [x] Animations play smoothly

## Notes

- JourneyNav is hidden when `terminal-controls-below` is enabled
- Menu button in header is currently a placeholder (no onClick handler)
- Scholar Mode badge preserved in header
- All existing Terminal functionality preserved
