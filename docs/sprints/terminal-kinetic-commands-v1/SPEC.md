# Specification: Terminal Kinetic Command System

**Sprint:** terminal-kinetic-commands-v1  
**Version:** 1.0  
**Status:** Draft

---

## Overview

This specification defines the **Kinetic Command System**—a declarative, registry-based architecture for processing slash commands in the Terminal. The system transforms the Terminal from a simple chat interface into a **kinetic interface** where users can navigate journeys, switch lenses, capture insights, and access Proto-Skills through intuitive commands.

---

## Requirements

### REQ-1: Command Detection and Routing

**Description:** The system must detect when user input is a command (starts with "/") and route it to the command engine instead of the chat API.

**Acceptance Criteria:**
- Input starting with "/" is intercepted before chat API call
- Non-command input flows normally to chat
- Partial commands (just "/") trigger command palette
- Invalid commands show helpful error with suggestions

**Example:**
```
User types: "/journey ghost"
→ Routed to command engine
→ NOT sent to chat API

User types: "Tell me about the ratchet effect"
→ Sent to chat API normally
```

---

### REQ-2: Declarative Command Registry

**Description:** Commands must be defined in a JSON configuration file, not hardcoded in application logic.

**Acceptance Criteria:**
- All commands defined in `command-registry.json`
- Adding a new command requires only JSON changes
- Command schema is TypeScript-validated
- Registry is loaded at runtime

**Schema:**
```typescript
interface CommandDefinition {
  id: string;
  trigger: string;
  aliases?: string[];
  description: string;
  category: 'navigation' | 'action' | 'info' | 'system';
  args?: CommandArgSchema[];
  action: CommandAction;
  icon?: string;
  shortcut?: string;
}

interface CommandArgSchema {
  name: string;
  type: 'string' | 'journey' | 'lens' | 'number' | 'boolean';
  optional?: boolean;
  default?: unknown;
}
```

---

### REQ-3: Fuzzy Argument Resolution

**Description:** When commands accept entity arguments (journeys, lenses), the system must fuzzy-match user input to actual entities.

**Acceptance Criteria:**
- `/journey ghost` matches "Ghost in the Machine" journey
- `/lens eng` matches "Engineer" lens
- Multiple matches show disambiguation UI
- No match shows "not found" with suggestions

**Resolution Priority:**
1. Exact ID match
2. Exact title/name match (case-insensitive)
3. Fuzzy match on title/name
4. Fuzzy match on description

---

### REQ-4: Command Palette UI

**Description:** A searchable command palette must appear when user types "/" or presses a keyboard shortcut.

**Acceptance Criteria:**
- Palette opens on "/" in empty input
- Palette opens on Ctrl+K (configurable)
- Real-time fuzzy filtering as user types
- Arrow key navigation + Enter to select
- Escape to dismiss
- Shows command icon, trigger, description
- Groups by category

**Visual Design:**
```
┌─────────────────────────────────────────────┐
│ /                                        ⌘K │
├─────────────────────────────────────────────┤
│ Navigation                                   │
│ ├─ 🧭 /journey   Start a guided journey     │
│ ├─ 👓 /lens      Switch perspective lens    │
│ └─ 🔭 /explore   Free exploration mode      │
│                                              │
│ Actions                                      │
│ └─ 🌱 /plant     Capture as sprout          │
│                                              │
│ Info                                         │
│ └─ 📊 /stats     Session statistics         │
└─────────────────────────────────────────────┘
```

---

### REQ-5: Journey Navigation Commands

**Description:** Users must be able to start, continue, and navigate journeys via commands.

**Commands:**
| Command | Action |
|---------|--------|
| `/journey` | Open journey picker |
| `/journey [name]` | Start specific journey |
| `/journey continue` | Resume last journey |
| `/journey list` | Show available journeys |

**Acceptance Criteria:**
- `/journey ghost` starts "Ghost in the Machine"
- Starting journey updates `activeJourneyId` in session
- Journey entry node becomes next prompt
- Breadcrumb shows journey context

---

### REQ-6: Lens Switching Commands

**Description:** Users must be able to switch lenses inline without leaving chat flow.

**Commands:**
| Command | Action |
|---------|--------|
| `/lens` | Open lens picker |
| `/lens [name]` | Switch to specific lens |
| `/lens clear` | Remove active lens |
| `/lens list` | Show available lenses |

**Acceptance Criteria:**
- `/lens engineer` switches to Engineer lens
- Lens change updates system prompt immediately
- Welcome message reflects new lens
- Works with custom lenses too

---

### REQ-7: Sprout Capture Command

**Description:** Users must be able to capture insights as "sprouts" for later cultivation.

**Commands:**
| Command | Action |
|---------|--------|
| `/plant` | Capture last response as sprout |
| `/plant [text]` | Capture specific text as sprout |
| `/plant --tag=[hub]` | Capture with hub association |

**Acceptance Criteria:**
- Sprout includes: content, source lens, source journey, timestamp
- Stored locally (localStorage for MVP)
- Confirmation toast shown
- `/garden` command to view sprouts (future)

---

### REQ-8: Session Statistics Overlay

**Description:** Users must be able to view their session statistics.

**Command:** `/stats`

**Displays:**
- Session duration
- Exchange count
- Cards/nodes visited
- Journeys completed
- Current lens
- Current journey (if any)

**Acceptance Criteria:**
- Opens as overlay (using overlay system from sprint 6)
- Shows real-time stats from useSessionTelemetry
- Includes "Continue" button to dismiss

---

### REQ-9: Help and Discovery

**Description:** Users must be able to discover available commands.

**Commands:**
| Command | Action |
|---------|--------|
| `/help` | Open command palette |
| `/help [command]` | Show command details |

**Acceptance Criteria:**
- `/help` equivalent to opening command palette
- `/help journey` shows journey command details and subcommands
- Unknown command shows suggestions

---

### REQ-10: Analytics and Provenance

**Description:** All command executions must be logged for cognitive archaeology.

**Logged Data:**
```typescript
interface CommandEvent {
  commandId: string;
  trigger: string;
  args: Record<string, unknown>;
  resolvedArgs: Record<string, unknown>;
  result: 'success' | 'error' | 'cancelled';
  errorMessage?: string;
  context: {
    activeLens: string | null;
    activeJourney: string | null;
    sessionDuration: number;
  };
  timestamp: string;
}
```

**Acceptance Criteria:**
- Every command execution emits event to Engagement Bus
- Includes full context for replay/analysis
- Failed commands logged with error reason

---

## Patterns Applied

### Pattern 2: Engagement Machine (Discriminated Union)

The command action type uses discriminated unions:

```typescript
type CommandAction =
  | { type: 'journey-start'; fallback?: string }
  | { type: 'lens-switch'; fallback?: string }
  | { type: 'plant-sprout'; contextCapture: string[] }
  | { type: 'show-overlay'; overlay: OverlayType }
  | { type: 'set-mode'; mode: string }
  | { type: 'show-command-palette' };
```

### Pattern 8: Canonical Source (Registry)

Single source of truth for command definitions:

```typescript
// All command knowledge lives here
const COMMAND_REGISTRY = loadCommandRegistry();

// Usage throughout app
const command = COMMAND_REGISTRY.getByTrigger('journey');
```

### New Pattern: Resolver Chain

Argument resolution follows a chain pattern:

```typescript
const RESOLVERS: Record<ArgType, Resolver> = {
  journey: journeyResolver,
  lens: lensResolver,
  string: stringResolver,
  // ...
};

// Resolution
const resolved = RESOLVERS[arg.type].resolve(rawValue, context);
```

---

## Out of Scope

1. **Command history** - Arrow up/down to recall (future enhancement)
2. **Command macros** - Chaining multiple commands
3. **Custom command creation** - User-defined commands
4. **Voice commands** - Speech-to-command
5. **Garden view** - `/garden` command (separate sprint)

---

## Dependencies

| Dependency | Purpose | Status |
|------------|---------|--------|
| terminal-overlay-machine-v1 | Overlay system for palette/stats | Completed |
| SchemaContext | Journey data access | Exists |
| useEngagementMachine | Session state | Exists |
| fuse.js | Fuzzy search | May need to add |
