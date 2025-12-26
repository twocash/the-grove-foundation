# Architectural Decisions: Terminal Kinetic Command System

**Sprint:** terminal-kinetic-commands-v1  
**Version:** 1.0

---

## ADR-001: JSON Registry Over Hardcoded Switch Statements

### Context
Commands could be implemented as a switch statement in the input handler, or as a declarative registry loaded from configuration.

### Decision
Use a JSON-based command registry with TypeScript validation.

### Rationale
- **DEX Compliance:** Domain experts can add commands without code changes
- **Kinetic Philosophy:** The system should be configurable, not compiled
- **Testability:** Registry can be unit tested in isolation
- **Extensibility:** New commands = new JSON entries

### Consequences
- Slightly more complex initial implementation
- Runtime parsing overhead (negligible)
- Must maintain schema validation
- Hot-reload possible in development

---

## ADR-002: Discriminated Union for Command Actions

### Context
Command actions could be represented as strings with separate configuration, or as discriminated unions with action-specific properties.

### Decision
Use discriminated union types for `CommandAction`.

### Rationale
- **Type Safety:** TypeScript enforces valid action configurations
- **Pattern Consistency:** Matches overlay system (sprint 6) and engagement machine
- **Self-Documenting:** Action type immediately reveals required properties
- **IDE Support:** Autocomplete and error detection

### Consequences
- Must update union when adding new action types
- Action execution requires type narrowing
- Clear contracts between definition and execution

---

## ADR-003: Resolver Pattern for Argument Types

### Context
Argument resolution (fuzzy matching journeys, lenses) could be inline in the executor or extracted to separate resolvers.

### Decision
Extract resolution logic into type-specific resolver modules.

### Rationale
- **Separation of Concerns:** Parsing ≠ Resolution ≠ Execution
- **Reusability:** Journey resolver used by `/journey` and command palette autocomplete
- **Testability:** Resolvers tested independently with mock data
- **Extensibility:** New entity types = new resolver (e.g., `hubResolver`)

### Consequences
- More files to manage
- Context must be passed to resolvers
- Consistent interface for all entity types

---

## ADR-004: Command Palette as Overlay

### Context
The command palette could be a separate modal, an inline dropdown, or integrated with the overlay system.

### Decision
Implement command palette as an overlay type, leveraging sprint 6's overlay architecture.

### Rationale
- **Consistency:** Same dismiss/transition patterns as other overlays
- **Code Reuse:** Uses existing overlay infrastructure
- **Single Source:** Overlay state managed in one place
- **Mobile Friendly:** Overlay patterns already handle responsive design

### Consequences
- Command palette must fit overlay contract
- Limited to overlay interaction patterns
- Cannot coexist with other overlays (acceptable)

---

## ADR-005: Fallback Actions for Optional Arguments

### Context
When a command has optional arguments (e.g., `/journey` with no journey name), the system could error, show help, or execute a fallback action.

### Decision
Support `fallback` property in actions that triggers when required context is missing.

### Rationale
- **User Experience:** `/journey` alone opens picker; `/journey ghost` starts journey
- **Discoverability:** Users learn commands through progressive interaction
- **Reduced Friction:** Don't force users to know exact journey names
- **Consistency:** Same pattern for all entity-selecting commands

### Consequences
- Actions have conditional execution paths
- Must document fallback behavior
- Testing must cover both paths

---

## ADR-006: Analytics via Engagement Bus

### Context
Command execution could log to a separate analytics system or integrate with existing engagement tracking.

### Decision
Emit command events through the existing Engagement Bus.

### Rationale
- **Unified Telemetry:** All user interactions in one stream
- **Existing Infrastructure:** Bus, emitters, and storage already exist
- **Cognitive Archaeology:** Command patterns part of exploration archaeology
- **Correlation:** Can correlate commands with subsequent chat interactions

### Consequences
- Must define command event types
- Engagement Bus schema expands
- Dashboard may need command visualization

---

## ADR-007: Local Sprout Storage for MVP

### Context
The `/plant` command needs to store captured content. Options include API persistence, IndexedDB, or localStorage.

### Decision
Use localStorage for MVP sprout storage, with migration path to API.

### Rationale
- **Speed to Market:** No backend changes required
- **Privacy:** User data stays local until explicitly shared
- **Simplicity:** localStorage is synchronous and well-understood
- **Future-Ready:** Storage interface abstracted for later migration

### Consequences
- Limited to ~5MB storage
- No cross-device sync (acceptable for MVP)
- Must handle storage full gracefully
- Migration story needed for v2

---

## ADR-008: Input Interception Point

### Context
Command detection could happen in the input component, the handleSend function, or a middleware layer.

### Decision
Intercept in `handleSend()` before API call, with early return for commands.

### Rationale
- **Minimal Change:** Single modification point
- **Clear Flow:** Same entry point, different routing
- **Debugging:** Easy to trace command vs chat flow
- **Testability:** handleSend can be unit tested

### Consequences
- handleSend becomes routing logic
- Must ensure commands don't leak to API
- Input component unchanged (separation maintained)

---

## ADR-009: Keyboard Shortcuts Implementation

### Context
Commands could have keyboard shortcuts (e.g., Ctrl+K for palette). Implementation could be global event listeners, library (react-hotkeys), or component-based.

### Decision
Use component-based event handlers with global listener for palette shortcut only.

### Rationale
- **Minimal Dependencies:** No additional library needed
- **Scoped Behavior:** Most shortcuts only active in Terminal
- **Conflict Avoidance:** Global shortcuts limited to safe combinations
- **Accessibility:** Keyboard navigation within palette is separate

### Consequences
- Must manage listener lifecycle
- Limited global shortcuts (just Ctrl+K or Cmd+K)
- Component shortcuts use standard React patterns

---

## ADR-010: Subcommand vs Argument Distinction

### Context
Should `/journey list` be a subcommand or `/journey --list` be a flag?

### Decision
Support both subcommands (position-based) and flags (named).

### Rationale
- **Natural Language:** `/journey list` reads better than `/journey --list`
- **Flexibility:** Some commands need flags (e.g., `/plant --tag=hub`)
- **Precedent:** Follows CLI conventions (git, npm)
- **Discoverability:** Subcommands appear in help, flags are advanced

### Consequences
- Parser must handle both
- Documentation must clarify distinction
- Subcommands defined in command definition

---

## Summary

| Decision | Choice | Primary Driver |
|----------|--------|----------------|
| ADR-001 | JSON Registry | DEX Compliance |
| ADR-002 | Discriminated Unions | Type Safety |
| ADR-003 | Resolver Pattern | Separation of Concerns |
| ADR-004 | Overlay Integration | Consistency |
| ADR-005 | Fallback Actions | User Experience |
| ADR-006 | Engagement Bus | Unified Telemetry |
| ADR-007 | localStorage MVP | Speed to Market |
| ADR-008 | handleSend Intercept | Minimal Change |
| ADR-009 | Component + Global | Minimal Dependencies |
| ADR-010 | Subcommands + Flags | Natural Language |
