# Sprint: terminal-kinetic-commands-v1

**Version:** 1.0
**Status:** ✅ Complete
**Created:** 2024-12-25
**Completed:** 2024-12-25
**Author:** Claude (Planning Agent) + Jim Calhoun
**Execution:** Claude Opus 4.5

---

## The Kinetic Vision

> **"The Terminal is the village's connection to the world beyond."**

The Terminal is where 90% of user engagement happens. It must be **kinetic**—alive with possibilities, responsive to intent, extensible without code changes. This sprint establishes the declarative command architecture that makes the Terminal a true **Kinetic Interface**.

### What We're Building

A **Command Engine** that:
1. Reads command definitions from config (not hardcoded switches)
2. Routes `/slash` commands to declarative actions
3. Enables journeys, sprouting, lens switching, and future Proto-Skills
4. Provides real-time command palette with fuzzy search
5. Supports command composition and context-awareness

### The DEX Alignment

| DEX Pillar | Implementation |
|------------|----------------|
| **Declarative Sovereignty** | Commands defined in JSON; domain experts add `/journey clinical-intake` without code |
| **Capability Agnosticism** | Same commands work regardless of AI model powering responses |
| **Provenance** | Every command execution logged with full context |
| **Organic Scalability** | Start with 6 commands, grow to 60 without restructuring |

---

## The Problem

Currently, Terminal has **no command processing**. User input goes directly to the chat API. Features like journey navigation exist in the codebase but aren't accessible from the primary interface where users spend their time.

**Missing Capabilities:**
- `/journey ghost-in-the-machine` → Start a specific journey
- `/lens engineer` → Switch lens inline
- `/plant` → Capture current insight as sprout
- `/stats` → View session statistics
- `/help` → Discover available commands

---

## The Architecture

### Command Schema

```typescript
interface CommandDefinition {
  id: string;                    // Unique identifier
  trigger: string;               // The slash command (e.g., "journey")
  aliases?: string[];            // Alternative triggers (e.g., ["j"])
  description: string;           // Shown in command palette
  category: CommandCategory;     // Navigation | Action | Info | System
  
  // Argument schema
  args?: CommandArgSchema[];     // Expected arguments
  
  // Execution
  action: CommandAction;         // What happens when executed
  
  // Context
  availableIn?: TerminalContext[]; // Where command works (chat, journey, etc.)
  requiresLens?: boolean;        // Must have active lens
  
  // Display
  icon?: string;                 // Lucide icon
  shortcut?: string;             // Keyboard shortcut (e.g., "Ctrl+J")
}
```

### Command Registry

```typescript
// src/core/commands/command-registry.json
{
  "commands": [
    {
      "id": "journey-start",
      "trigger": "journey",
      "aliases": ["j"],
      "description": "Start or continue a guided journey",
      "category": "navigation",
      "args": [
        { "name": "journeyId", "type": "journey", "optional": true }
      ],
      "action": {
        "type": "journey-start",
        "fallback": "show-journey-picker"
      },
      "icon": "Compass"
    },
    {
      "id": "lens-switch",
      "trigger": "lens",
      "aliases": ["l"],
      "description": "Switch your perspective lens",
      "category": "navigation",
      "args": [
        { "name": "lensId", "type": "lens", "optional": true }
      ],
      "action": {
        "type": "lens-switch",
        "fallback": "show-lens-picker"
      },
      "icon": "Glasses"
    },
    {
      "id": "plant-sprout",
      "trigger": "plant",
      "aliases": ["p", "sprout"],
      "description": "Capture an insight as a sprout",
      "category": "action",
      "args": [
        { "name": "content", "type": "string", "optional": true }
      ],
      "action": {
        "type": "plant-sprout",
        "contextCapture": ["lastResponse", "activeLens", "activeJourney"]
      },
      "icon": "Sprout"
    },
    {
      "id": "show-stats",
      "trigger": "stats",
      "description": "View your session statistics",
      "category": "info",
      "action": {
        "type": "show-overlay",
        "overlay": "stats"
      },
      "icon": "BarChart3"
    },
    {
      "id": "explore-mode",
      "trigger": "explore",
      "aliases": ["e"],
      "description": "Enter free exploration mode",
      "category": "navigation",
      "action": {
        "type": "set-mode",
        "mode": "explore"
      },
      "icon": "Telescope"
    },
    {
      "id": "help",
      "trigger": "help",
      "aliases": ["?", "commands"],
      "description": "Show available commands",
      "category": "system",
      "action": {
        "type": "show-command-palette"
      },
      "icon": "HelpCircle"
    }
  ]
}
```

### Command Engine Flow

```
User types: "/journey ghost"
         ↓
┌─────────────────────────────────────────────────────────────┐
│                    CommandParser                             │
│  1. Detect "/" prefix                                        │
│  2. Extract trigger: "journey"                               │
│  3. Extract args: ["ghost"]                                  │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│                   CommandRegistry                            │
│  1. Lookup command by trigger/alias                          │
│  2. Validate args against schema                             │
│  3. Check context availability                               │
└─────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│                   CommandExecutor                            │
│  1. Resolve arg values (fuzzy match "ghost" → journey ID)   │
│  2. Execute action (journey-start with resolved ID)          │
│  3. Emit analytics event                                     │
│  4. Return result for UI update                              │
└─────────────────────────────────────────────────────────────┘
         ↓
Journey "Ghost in the Machine" starts in Terminal
```

---

## Files Structure

```
src/core/commands/
├── schema.ts              # TypeScript types for command system
├── registry.json          # Declarative command definitions
├── parser.ts              # Parse user input into command + args
├── executor.ts            # Execute commands, handle actions
├── resolvers/             # Arg type resolvers
│   ├── journey.ts         # Fuzzy match journey by name/id
│   ├── lens.ts            # Fuzzy match lens by name/id
│   └── index.ts           # Resolver registry
└── actions/               # Action implementations
    ├── journey-start.ts   # Start journey action
    ├── lens-switch.ts     # Switch lens action
    ├── plant-sprout.ts    # Plant sprout action
    ├── show-overlay.ts    # Show overlay action
    └── index.ts           # Action registry

components/Terminal/
├── CommandPalette.tsx     # Fuzzy search command picker
├── CommandInput.tsx       # Input with "/" detection
└── hooks/
    └── useCommands.ts     # Hook exposing command system
```

---

## Success Criteria

- [x] `/journey` opens journey picker OR starts named journey
- [x] `/lens` opens lens picker OR switches to named lens
- [x] `/plant` captures context as sprout (stored locally for now)
- [x] `/stats` shows session statistics overlay
- [x] `/help` shows command palette
- [x] Command palette opens on "/" keystroke (Ctrl+K)
- [x] Fuzzy matching works for journey/lens names
- [x] Adding new command = JSON entry only (no code)
- [x] All commands logged for cognitive archaeology

---

## Sprint Artifacts

| Document | Purpose |
|----------|---------|
| [REPO_AUDIT.md](./REPO_AUDIT.md) | Current state analysis |
| [SPEC.md](./SPEC.md) | Requirements and patterns |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical design |
| [DECISIONS.md](./DECISIONS.md) | Architectural decisions |
| [MIGRATION_MAP.md](./MIGRATION_MAP.md) | File-by-file changes |
| [SPRINTS.md](./SPRINTS.md) | Epic and story breakdown |
| [EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md) | Handoff to execution agent |
| [DEVLOG.md](./DEVLOG.md) | Execution journal |
