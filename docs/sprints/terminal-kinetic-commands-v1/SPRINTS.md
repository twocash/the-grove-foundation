# Sprint Breakdown: Terminal Kinetic Command System

**Sprint:** terminal-kinetic-commands-v1  
**Version:** 1.0  
**Estimated Duration:** 4-5 hours

---

## Epic Overview

| Epic | Stories | Est. Time | Risk |
|------|---------|-----------|------|
| Epic 1: Type Foundation | 3 | 45 min | Low |
| Epic 2: Parser & Resolvers | 4 | 60 min | Medium |
| Epic 3: Executor & Actions | 3 | 45 min | Medium |
| Epic 4: Command Palette UI | 3 | 60 min | Low |
| Epic 5: Terminal Integration | 3 | 45 min | Medium |
| Epic 6: Polish & Testing | 2 | 30 min | Low |

**Total:** 18 stories, ~5 hours

---

## Epic 1: Type Foundation

**Goal:** Establish type system and declarative command definitions.

### Story 1.1: Create Command Type Definitions
**File:** `src/core/commands/schema.ts`

Create TypeScript types for the command system:
- `CommandCategory` type
- `ArgType` type  
- `CommandArgSchema` interface
- `CommandAction` discriminated union
- `CommandDefinition` interface
- `ParsedCommand` interface
- `ExecutionResult` interface

**Acceptance:** Types compile without errors.

---

### Story 1.2: Create Command Definitions JSON
**File:** `src/core/commands/command-definitions.json`

Define initial commands:
- `/journey` - Start/list journeys
- `/lens` - Switch/list lenses
- `/plant` - Capture sprout
- `/stats` - Show statistics
- `/explore` - Free exploration mode
- `/help` - Show commands

Include subcommands where applicable (list, continue, clear).

**Acceptance:** JSON validates against schema.

---

### Story 1.3: Create CommandRegistry Class
**File:** `src/core/commands/registry.ts`

Implement registry with:
- Constructor loading from definitions
- `getByTrigger(trigger)` - lookup by trigger/alias
- `getById(id)` - lookup by ID
- `getAll()` - all commands
- `getByCategory(category)` - filtered list
- `search(query)` - fuzzy search

**Acceptance:** Registry instantiates and lookups work.

**Build Gate:** `npm run build` passes.

---

## Epic 2: Parser & Resolvers

**Goal:** Parse user input and resolve entity arguments.

### Story 2.1: Create Command Parser
**File:** `src/core/commands/parser.ts`

Implement parsing:
- `parseCommand(input)` - returns ParsedCommand or null
- Handle "/" prefix detection
- Extract trigger, subcommand, args, flags
- Support quoted strings
- Support `--key=value` flags

**Acceptance:** Parser correctly parses test cases.

---

### Story 2.2: Create Resolver Infrastructure
**Files:** `src/core/commands/resolvers/types.ts`, `src/core/commands/resolvers/index.ts`

Define:
- `Resolver<T>` interface with `resolve()` and `getSuggestions()`
- `ResolverContext` interface
- `ResolveResult<T>` type
- `Suggestion` interface
- Resolver registry map

**Acceptance:** Types compile, registry exports correctly.

---

### Story 2.3: Implement Journey Resolver
**File:** `src/core/commands/resolvers/journey.ts`

Implement:
- Exact ID match
- Exact title match (case-insensitive)
- Fuzzy match on title
- Multiple match handling (return suggestions)
- Not found handling (return suggestions)
- `getSuggestions()` for autocomplete

**Acceptance:** Resolver matches "ghost" to "Ghost in the Machine".

---

### Story 2.4: Implement Lens Resolver
**File:** `src/core/commands/resolvers/lens.ts`

Implement:
- Check PERSONAS (built-in)
- Check custom lenses
- Same matching logic as journey
- Handle custom lens prefix

**Acceptance:** Resolver matches "eng" to "Engineer" lens.

**Build Gate:** `npm run build` passes.

---

## Epic 3: Executor & Actions

**Goal:** Execute parsed commands and perform actions.

### Story 3.1: Create Executor Module
**File:** `src/core/commands/executor.ts`

Implement:
- `executeCommand(parsed, context)` - main execution
- Command lookup
- Subcommand resolution
- Argument resolution via resolvers
- Fallback handling for missing args
- Error handling with suggestions

**Acceptance:** Executor returns success/error results.

---

### Story 3.2: Implement Action Handlers
**File:** `src/core/commands/executor.ts` (continued)

Implement `executeAction()` for:
- `journey-start` → engagementActions.startJourney or overlay
- `lens-switch` → engagementActions.selectLens or overlay
- `show-overlay` → terminalActions.setOverlay
- `show-command-palette` → terminalActions.setOverlay
- `plant-sprout` → localStorage capture (MVP)

**Acceptance:** Actions trigger correct state changes.

---

### Story 3.3: Add Analytics Emission
**File:** `src/core/commands/executor.ts` + engagement bus

Add:
- `CommandExecutedEvent` type
- `emit.commandExecuted()` call on success
- Include full context (lens, journey, args)

**Acceptance:** Events appear in console/analytics.

**Build Gate:** `npm run build` passes.

---

## Epic 4: Command Palette UI

**Goal:** Create searchable command picker interface.

### Story 4.1: Create CommandItem Component
**File:** `components/Terminal/CommandItem.tsx`

Implement:
- Display command icon, trigger, description
- Highlight matched text
- Selected state styling
- Click handler

**Acceptance:** Component renders correctly in isolation.

---

### Story 4.2: Create CommandPalette Component
**File:** `components/Terminal/CommandPalette.tsx`

Implement:
- Search input with autofocus
- Real-time filtering via registry.search()
- Category grouping
- Arrow key navigation
- Enter to select
- Escape to dismiss
- Visual design matching Terminal aesthetic

**Acceptance:** Palette filters and selects commands.

---

### Story 4.3: Create StatsOverlay Component
**File:** `components/Terminal/StatsOverlay.tsx`

Implement:
- Session duration display
- Exchange count
- Cards visited
- Journeys completed
- Current lens/journey
- Dismiss button

**Acceptance:** Stats display correctly from session state.

**Build Gate:** `npm run build` passes.

---

## Epic 5: Terminal Integration

**Goal:** Wire command system into Terminal.

### Story 5.1: Create useCommands Hook
**File:** `components/Terminal/hooks/useCommands.ts`

Implement:
- Instantiate registry
- Create resolver map with context
- Expose `execute(input)` function
- Expose `isCommand(input)` function
- Expose `registry` for palette

**Acceptance:** Hook returns working command interface.

---

### Story 5.2: Add Command Interception to handleSend
**File:** `components/Terminal/Terminal.tsx`

Modify handleSend:
- Check `isCommand(textToSend)` first
- If command, execute and handle result
- Show error as system message if failed
- Clear input on success
- Continue to chat API if not command

**Acceptance:** `/journey ghost` starts journey, regular text goes to chat.

---

### Story 5.3: Add Palette Keyboard Trigger
**File:** `components/Terminal/Terminal.tsx`

Add:
- "/" in empty input opens palette
- Ctrl+K / Cmd+K opens palette
- Palette selection executes command
- Update overlay registry for new types

**Acceptance:** "/" and Ctrl+K open palette.

**Build Gate:** `npm run build` passes.

---

## Epic 6: Polish & Testing

**Goal:** Ensure quality and document.

### Story 6.1: Manual QA Checklist

Test all commands:
- [ ] `/journey` opens journey picker
- [ ] `/journey ghost` starts Ghost journey
- [ ] `/journey list` shows journeys
- [ ] `/lens` opens lens picker
- [ ] `/lens engineer` switches to Engineer
- [ ] `/lens clear` removes lens
- [ ] `/plant` captures last response
- [ ] `/stats` shows session stats
- [ ] `/help` opens command palette
- [ ] Ctrl+K opens palette
- [ ] "/" in empty input opens palette
- [ ] Arrow keys navigate palette
- [ ] Enter selects command
- [ ] Escape dismisses palette
- [ ] Invalid command shows error with suggestions

---

### Story 6.2: Update Exports and Documentation

- Add exports to `src/core/commands/index.ts`
- Update Terminal exports
- Add JSDoc comments to public functions
- Update PROJECT_PATTERNS.md with command pattern

**Acceptance:** Clean imports work, documentation exists.

**Final Build Gate:** `npm run build` passes, deploy succeeds.

---

## Story Dependency Graph

```
Epic 1: Types ─────────┬──────────────────────────────────────────┐
  1.1 Schema           │                                          │
  1.2 Definitions ─────┤                                          │
  1.3 Registry ────────┘                                          │
                       │                                          │
Epic 2: Parsing ───────┼───────────────────────┐                  │
  2.1 Parser           │                       │                  │
  2.2 Resolver Types ──┤                       │                  │
  2.3 Journey Resolver ┤                       │                  │
  2.4 Lens Resolver ───┘                       │                  │
                       │                       │                  │
Epic 3: Execution ─────┼───────────────────────┼──────────────────┤
  3.1 Executor ────────┤                       │                  │
  3.2 Actions ─────────┤                       │                  │
  3.3 Analytics ───────┘                       │                  │
                                               │                  │
Epic 4: UI ────────────────────────────────────┤                  │
  4.1 CommandItem ─────┐                       │                  │
  4.2 CommandPalette ──┤                       │                  │
  4.3 StatsOverlay ────┘                       │                  │
                                               │                  │
Epic 5: Integration ───────────────────────────┴──────────────────┘
  5.1 useCommands ─────┐
  5.2 handleSend ──────┤
  5.3 Keyboard ────────┘
                       │
Epic 6: Polish ────────┘
  6.1 QA
  6.2 Docs
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Journey data not loaded | Add loading check, graceful fallback |
| Palette steals focus incorrectly | Careful focus management, escape always works |
| Commands leak to chat API | Double-check isCommand logic, add unit test |
| Performance with many commands | Debounce search, virtual list if >50 commands |
