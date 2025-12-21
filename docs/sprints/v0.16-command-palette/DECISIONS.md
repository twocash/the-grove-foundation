# Architecture Decision Records — Command Palette (v0.16)

## ADR-001: Command Registry Pattern

### Context
Need infrastructure for slash commands that can scale to future commands (`/annotate`, `/settings`, etc.) without refactoring.

### Options Considered
**A. Switch statement in handleSend()**
- Pros: Simple, no new files
- Cons: Doesn't scale, mixes concerns, no autocomplete support

**B. Command Registry with registration pattern**
- Pros: Extensible, decoupled, supports autocomplete, testable
- Cons: More initial setup

### Decision
**Option B: Command Registry**

Commands register themselves with a central registry. The parser checks the registry for matches and dispatches to the appropriate handler.

### Consequences
- New commands are single-file additions
- Autocomplete gets command list from registry
- Commands are individually testable
- Slightly more complex initial architecture

---

## ADR-002: Autocomplete Trigger

### Context
When should the autocomplete dropdown appear?

### Options Considered
**A. Immediate on `/`**
- Pros: Instant feedback, discoverable
- Cons: May feel aggressive

**B. Debounced (100-200ms after `/`)**
- Pros: Doesn't interfere with fast typing
- Cons: Adds latency to discovery

**C. Only when dropdown matches exist**
- Pros: Contextual
- Cons: Empty state confusion

### Decision
**Option A: Immediate on `/`**

The convention is well-established (Slack, Discord, Notion). Users expect immediate feedback. Fast typers will naturally continue typing and filter the dropdown.

### Consequences
- Autocomplete renders immediately when input starts with `/`
- No debounce complexity
- Consistent with user expectations

---

## ADR-003: Help Modal vs Inline Help

### Context
How should `/help` display command information?

### Options Considered
**A. Inline in chat as a message**
- Pros: Consistent with other responses
- Cons: Scrolls away, clutters conversation

**B. Modal overlay (WelcomeInterstitial style)**
- Pros: Persistent reference, consistent with existing modals
- Cons: Interrupts flow

**C. Sidebar/drawer**
- Pros: Accessible while typing
- Cons: New UI pattern, mobile complexity

### Decision
**Option B: Modal overlay**

Matches existing modal patterns (Welcome, LensPicker). Help content is reference material that users consult then dismiss. The familiar pattern reduces cognitive load.

### Consequences
- HelpModal component created
- Uses same styling as WelcomeInterstitial
- Dismissible via X or click-outside

---

## ADR-004: Input Component Extraction

### Context
Should we extract input into a separate component or modify Terminal.tsx directly?

### Options Considered
**A. Modify Terminal.tsx directly**
- Pros: No file restructuring, faster to ship
- Cons: Terminal.tsx is already 1368 lines, harder to maintain

**B. Extract CommandInput composite component**
- Pros: Separation of concerns, reusable, testable
- Cons: More files, import changes

### Decision
**Option B: Extract CommandInput**

Terminal.tsx is already large. The command input logic (parsing, autocomplete, keyboard navigation) deserves its own file. This also makes future enhancements cleaner.

### Consequences
- New `components/Terminal/CommandInput/` directory
- Terminal.tsx imports and uses `<CommandInput />`
- Props pass through necessary handlers

---

## ADR-005: Stats Data Source

### Context
Where does `/stats` get its data?

### Options Considered
**A. Create new analytics hook**
- Pros: Clean interface
- Cons: May duplicate existing data

**B. Compose from existing hooks**
- Pros: Reuses existing tracking
- Cons: Multiple hook calls

**C. Direct localStorage read**
- Pros: Simple
- Cons: Tight coupling, no reactivity

### Decision
**Option B: Compose from existing hooks**

`useStreakTracking` already has streak data. `useNarrativeEngine` has journey progress. We compose these into a `useExplorationStats` hook that aggregates the data StatsModal needs.

### Consequences
- New `hooks/useExplorationStats.ts` composes existing hooks
- StatsModal consumes single unified interface
- No duplicate tracking logic
