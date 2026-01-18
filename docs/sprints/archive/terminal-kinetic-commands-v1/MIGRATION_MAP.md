# Migration Map: Terminal Kinetic Command System

**Sprint:** terminal-kinetic-commands-v1  
**Version:** 1.0

---

## Overview

This sprint is primarily **additive**—we're creating new infrastructure rather than refactoring existing code. The main integration point is the `handleSend` function in Terminal.tsx.

---

## New Files

### Core Command Infrastructure

| File | Lines | Purpose |
|------|-------|---------|
| `src/core/commands/schema.ts` | ~100 | TypeScript types for command system |
| `src/core/commands/registry.ts` | ~80 | CommandRegistry class |
| `src/core/commands/parser.ts` | ~60 | Input parsing to ParsedCommand |
| `src/core/commands/executor.ts` | ~150 | Action execution logic |
| `src/core/commands/command-definitions.json` | ~120 | Declarative command registry |
| `src/core/commands/index.ts` | ~15 | Public exports |

### Resolvers

| File | Lines | Purpose |
|------|-------|---------|
| `src/core/commands/resolvers/types.ts` | ~30 | Resolver interfaces |
| `src/core/commands/resolvers/journey.ts` | ~60 | Journey fuzzy matching |
| `src/core/commands/resolvers/lens.ts` | ~60 | Lens fuzzy matching |
| `src/core/commands/resolvers/string.ts` | ~15 | Pass-through string resolver |
| `src/core/commands/resolvers/index.ts` | ~20 | Resolver registry |

### Components

| File | Lines | Purpose |
|------|-------|---------|
| `components/Terminal/CommandPalette.tsx` | ~150 | Command picker UI |
| `components/Terminal/CommandItem.tsx` | ~40 | Individual command display |
| `components/Terminal/hooks/useCommands.ts` | ~80 | Command system hook |

**Total New Code:** ~980 lines

---

## Modified Files

### 1. `components/Terminal/types.ts`

**Change:** Add command-palette to TerminalOverlay union

```typescript
// Before (from sprint 6)
export type TerminalOverlay =
  | { type: 'none' }
  | { type: 'welcome' }
  | { type: 'lens-picker' }
  | { type: 'journey-picker' }
  | { type: 'wizard'; wizardId?: string };

// After
export type TerminalOverlay =
  | { type: 'none' }
  | { type: 'welcome' }
  | { type: 'lens-picker' }
  | { type: 'journey-picker' }
  | { type: 'wizard'; wizardId?: string }
  | { type: 'command-palette'; initialQuery?: string }
  | { type: 'stats' };
```

**Lines Changed:** ~5

---

### 2. `components/Terminal/overlay-registry.ts`

**Change:** Add command-palette and stats overlay configs

```typescript
// Add to OVERLAY_REGISTRY
'command-palette': {
  component: CommandPalette,
  hideInput: true,
  analytics: 'command_palette_opened'
},
'stats': {
  component: StatsOverlay,
  hideInput: false,
  analytics: 'stats_viewed'
}
```

**Lines Changed:** ~15

---

### 3. `components/Terminal/Terminal.tsx`

**Change:** Add command interception in handleSend

```typescript
// Before (~line 670)
const handleSend = async (manualQuery?: string, ...) => {
  const textToSend = manualQuery !== undefined ? manualQuery : input;
  if (!textToSend.trim()) return;
  
  // ... directly to chat API

// After
const handleSend = async (manualQuery?: string, ...) => {
  const textToSend = manualQuery !== undefined ? manualQuery : input;
  if (!textToSend.trim()) return;
  
  // Command interception
  if (commands.isCommand(textToSend)) {
    const result = await commands.execute(textToSend);
    if (result.success) {
      actions.setInput('');
      return;
    }
    // Show error as system message
    addSystemMessage(result.error, result.suggestions);
    return;
  }
  
  // ... existing chat API flow
```

**Additional Changes:**
- Import useCommands hook
- Add "/" keystroke detection for palette
- Add helper for system messages

**Lines Changed:** ~40

---

### 4. `components/Terminal/TerminalOverlayRenderer.tsx`

**Change:** Add CommandPalette to handler mapping (if not using registry)

```typescript
// Add import
import { CommandPalette } from './CommandPalette';
import { StatsOverlay } from './StatsOverlay';

// Add to switch/registry
case 'command-palette':
  return <CommandPalette 
    onSelect={handleCommandSelect}
    onDismiss={() => actions.setOverlay({ type: 'none' })}
    initialQuery={overlay.initialQuery}
  />;
```

**Lines Changed:** ~15

---

### 5. `components/Terminal/index.ts`

**Change:** Export new components

```typescript
// Add exports
export { CommandPalette } from './CommandPalette';
export { useCommands } from './hooks/useCommands';
```

**Lines Changed:** ~3

---

### 6. `hooks/useEngagementBus.ts` (or similar)

**Change:** Add command event type

```typescript
// Add to event types
interface CommandExecutedEvent {
  type: 'command_executed';
  commandId: string;
  trigger: string;
  args: Record<string, unknown>;
  success: boolean;
  timestamp: string;
}

// Add emitter
commandExecuted: (commandId: string, trigger: string, args: Record<string, unknown>) => void;
```

**Lines Changed:** ~20

---

## File Tree After Sprint

```
src/
├── core/
│   └── commands/                    # NEW DIRECTORY
│       ├── schema.ts                # Type definitions
│       ├── registry.ts              # CommandRegistry class
│       ├── parser.ts                # Input parsing
│       ├── executor.ts              # Action execution
│       ├── command-definitions.json # Declarative registry
│       ├── resolvers/
│       │   ├── types.ts
│       │   ├── journey.ts
│       │   ├── lens.ts
│       │   ├── string.ts
│       │   └── index.ts
│       └── index.ts
│
components/
├── Terminal/
│   ├── Terminal.tsx                 # MODIFIED: command interception
│   ├── types.ts                     # MODIFIED: overlay types
│   ├── overlay-registry.ts          # MODIFIED: new overlays
│   ├── TerminalOverlayRenderer.tsx  # MODIFIED: new handlers
│   ├── CommandPalette.tsx           # NEW
│   ├── CommandItem.tsx              # NEW
│   ├── StatsOverlay.tsx             # NEW
│   ├── hooks/
│   │   └── useCommands.ts           # NEW
│   └── index.ts                     # MODIFIED: exports
│
hooks/
└── useEngagementBus.ts              # MODIFIED: command events
```

---

## Migration Sequence

### Phase 1: Infrastructure (Epic 1)
1. Create `src/core/commands/` directory
2. Add type definitions (`schema.ts`)
3. Add command definitions JSON
4. Create CommandRegistry class

### Phase 2: Parsing & Resolution (Epic 2)
1. Create parser module
2. Create resolver infrastructure
3. Implement journey resolver
4. Implement lens resolver

### Phase 3: Execution (Epic 3)
1. Create executor module
2. Wire up actions to Terminal/Engagement
3. Add analytics emission

### Phase 4: UI Integration (Epic 4)
1. Create CommandPalette component
2. Create StatsOverlay component
3. Update overlay registry
4. Add palette trigger to input

### Phase 5: Terminal Integration (Epic 5)
1. Create useCommands hook
2. Add command interception to handleSend
3. Wire up palette keyboard shortcut
4. Test end-to-end flow

---

## Rollback Strategy

If sprint needs to be reverted:

1. Remove `src/core/commands/` directory
2. Remove new components (CommandPalette, StatsOverlay)
3. Revert overlay type changes
4. Remove command interception from handleSend

All changes are additive, so rollback is clean removal.
