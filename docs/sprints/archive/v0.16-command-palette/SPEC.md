# Command Palette Specification (v0.16)

## Overview
Transform the Terminal query input into a command palette supporting slash commands (`/help`, `/lens`, `/journeys`, `/stats`, `/welcome`) alongside natural language queries. Creates a unified entry point for navigation and power-user features.

## Goals
1. Add command parsing infrastructure to Terminal input
2. Implement autocomplete dropdown on `/` keystroke
3. Ship 5 MVP commands: `/help`, `/lens`, `/journeys`, `/stats`, `/welcome`
4. Create Help modal following Welcome modal visual pattern
5. Update placeholder text to hint at command availability

## Non-Goals
- Command history (up-arrow recall) — deferred
- `/annotate` or `/flag` commands — Phase 2
- `/settings` or `/export` commands — Phase 2
- Mobile-specific autocomplete UX — deferred

## Current State

### Input Element
- **Location**: `components/Terminal.tsx:1249-1260`
- **Behavior**: Simple controlled input with Enter-to-submit
- **Placeholder**: `"Write a query..."` (line 1256)
- **No command parsing**: All input goes to `handleSend()`

### Modal Infrastructure
- **WelcomeInterstitial**: Provides visual template for modals
- **LensPicker**: Shows lens selection grid
- **Pattern**: Boolean state toggles + conditional rendering

### Streak Data
- **Hook**: `useStreakTracking.ts` provides `currentStreak`
- **No stats display**: Data exists but no UI to show full stats

### Journey Data
- **Hook**: `useNarrativeEngine.ts` provides `currentThread`, journey navigation
- **No journey browser**: Journeys are entered via links, not browsed

## Target State

### Input Behavior
1. User types `/` → autocomplete dropdown appears
2. Dropdown shows matching commands with descriptions
3. Arrow keys navigate; Tab/Enter selects
4. Commands execute or insert with cursor positioned for arguments
5. Non-command input flows to existing `handleSend()`

### Placeholder Text
```
"Write a query or type /help"
```

### MVP Commands

| Command | Arguments | Action | Output |
|---------|-----------|--------|--------|
| `/help` | None | Show command reference | HelpModal |
| `/welcome` | None | Re-show welcome screen | WelcomeInterstitial |
| `/lens` | `[lens-id]` | Switch lens | Inline toast + UI update |
| `/lens list` | None | Show lens picker | LensPicker modal |
| `/journeys` | None | Show journey browser | JourneysModal |
| `/stats` | None | Show exploration stats | StatsModal |

### New Components
```
components/Terminal/
├── CommandInput/
│   ├── CommandInput.tsx         # Composite input with autocomplete
│   ├── CommandAutocomplete.tsx  # Dropdown component
│   └── useCommandParser.ts      # Command detection hook
├── Modals/
│   ├── HelpModal.tsx            # /help output
│   ├── JourneysModal.tsx        # /journeys output  
│   └── StatsModal.tsx           # /stats output
```

### Command Registry
```typescript
interface Command {
  id: string;
  name: string;           // "/help"
  description: string;    // "Show available commands"
  aliases?: string[];     // ["?", "commands"]
  execute: (args, context) => CommandResult;
}
```

## Acceptance Criteria

### AC-1: Placeholder Text Updated
- [ ] Input placeholder reads `"Write a query or type /help"`

### AC-2: Autocomplete Appears
- [ ] Typing `/` shows dropdown with available commands
- [ ] Dropdown filters as user types more characters
- [ ] Arrow keys navigate, Tab/Enter select

### AC-3: /help Command Works
- [ ] `/help` + Enter opens HelpModal
- [ ] Modal matches WelcomeInterstitial visual style
- [ ] Modal shows all available commands with descriptions
- [ ] Modal is dismissible (X button + click outside)

### AC-4: /welcome Command Works
- [ ] `/welcome` + Enter re-shows WelcomeInterstitial
- [ ] User can re-select lens from welcome flow

### AC-5: /lens Command Works
- [ ] `/lens` or `/lens list` opens LensPicker
- [ ] `/lens engineer` switches to Engineer lens + shows toast
- [ ] Invalid lens shows inline error

### AC-6: /journeys Command Works
- [ ] `/journeys` opens JourneysModal
- [ ] Modal shows available journeys with progress indicators
- [ ] Clicking journey starts/continues it

### AC-7: /stats Command Works
- [ ] `/stats` opens StatsModal
- [ ] Modal shows current streak, total queries, deep dives
- [ ] Data pulled from existing tracking hooks

### AC-8: Non-Commands Still Work
- [ ] Regular queries (not starting with `/`) go to `handleSend()`
- [ ] Existing Terminal behavior unchanged for normal use
