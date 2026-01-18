# Sprint Stories — Command Palette (v0.16)

## Epic 1: Infrastructure

### Story 1.1: Command Registry
**Files:** `components/Terminal/CommandInput/CommandRegistry.ts` (new)

Create the command registration and lookup infrastructure.

```typescript
// CommandRegistry.ts
export interface Command { id, name, description, aliases?, execute }
export class CommandRegistry {
  register(command: Command): void
  get(id: string): Command | undefined
  getAll(): Command[]
  search(query: string): Command[]
}
export const commandRegistry = new CommandRegistry();
```

**Acceptance:**
- [ ] CommandRegistry class with register/get/getAll/search methods
- [ ] Singleton export
- [ ] TypeScript types for Command interface

**Commit:** `core: Add CommandRegistry infrastructure`

---

### Story 1.2: Command Parser Hook
**Files:** `components/Terminal/CommandInput/useCommandParser.ts` (new)

Create hook that parses input and returns command detection state.

```typescript
interface ParseResult {
  isCommand: boolean;
  commandId?: string;
  args?: string[];
  suggestions: Command[];
}
export function useCommandParser(input: string): ParseResult & { execute: () => void }
```

**Acceptance:**
- [ ] Detects `/` prefix
- [ ] Parses command ID and arguments
- [ ] Returns matching suggestions for autocomplete
- [ ] Provides execute function for matched commands

**Commit:** `core: Add useCommandParser hook`

---

## Epic 2: UI Components

### Story 2.1: CommandAutocomplete Component
**Files:** `components/Terminal/CommandInput/CommandAutocomplete.tsx` (new)

Dropdown showing matching commands.

**Acceptance:**
- [ ] Renders list of commands with name + description
- [ ] Highlights selected item
- [ ] Supports arrow key navigation via props
- [ ] Calls onSelect when item clicked

**Commit:** `surface: Add CommandAutocomplete dropdown`

---

### Story 2.2: CommandInput Component
**Files:** `components/Terminal/CommandInput/CommandInput.tsx` (new)

Composite input with autocomplete integration.

**Props:**
```typescript
interface CommandInputProps {
  onSubmitQuery: (query: string) => void;
  disabled?: boolean;
  placeholder?: string;
  // Command context passed through
  onOpenModal: (modal: ModalType) => void;
  onSwitchLens: (lensId: string) => void;
  onShowToast: (message: string) => void;
}
```

**Acceptance:**
- [ ] Renders input with updated placeholder
- [ ] Shows autocomplete when input starts with `/`
- [ ] Keyboard navigation (arrows, Tab, Enter, Escape)
- [ ] Commands execute via context handlers
- [ ] Non-commands pass to onSubmitQuery

**Commit:** `surface: Add CommandInput composite component`

---

### Story 2.3: HelpModal Component
**Files:** `components/Terminal/Modals/HelpModal.tsx` (new)

Modal displaying command reference.

**Design:**
```
┌─────────────────────────────────────────┐
│  TERMINAL COMMANDS                  [×] │
├─────────────────────────────────────────┤
│                                         │
│  Navigation                             │
│  ───────────────────────────────────    │
│  /help        Show this reference       │
│  /welcome     Return to start           │
│  /lens        Switch perspective        │
│  /journeys    Browse learning paths     │
│                                         │
│  Progress                               │
│  ───────────────────────────────────    │
│  /stats       View exploration data     │
│                                         │
└─────────────────────────────────────────┘
```

**Acceptance:**
- [ ] Follows WelcomeInterstitial visual style
- [ ] Lists all registered commands by category
- [ ] Dismissible via X button
- [ ] Dismissible via click-outside

**Commit:** `surface: Add HelpModal component`

---

### Story 2.4: JourneysModal Component
**Files:** `components/Terminal/Modals/JourneysModal.tsx` (new)

Modal showing available journeys.

**Acceptance:**
- [ ] Lists journeys from narrative schema
- [ ] Shows progress indicator for started journeys
- [ ] "Begin" or "Continue" CTA per journey
- [ ] Clicking journey triggers journey start and closes modal

**Commit:** `surface: Add JourneysModal component`

---

### Story 2.5: StatsModal Component
**Files:** `components/Terminal/Modals/StatsModal.tsx` (new), `hooks/useExplorationStats.ts` (new)

Modal showing user engagement statistics.

**Acceptance:**
- [ ] Shows current streak (from useStreakTracking)
- [ ] Shows total queries count
- [ ] Shows journey progress
- [ ] Shows deep dive count (if tracked)
- [ ] Uses useExplorationStats hook for data

**Commit:** `surface: Add StatsModal and useExplorationStats`

---

## Epic 3: Command Implementations

### Story 3.1: Register MVP Commands
**Files:** `components/Terminal/CommandInput/commands/` (new directory)

Create individual command files:
- `help.ts`
- `welcome.ts`
- `lens.ts`
- `journeys.ts`
- `stats.ts`
- `index.ts` (barrel + registration)

**Acceptance:**
- [ ] Each command has id, name, description, execute
- [ ] Commands registered on module load
- [ ] `/lens` handles both no-arg and with-arg cases

**Commit:** `core: Register MVP slash commands`

---

## Epic 4: Integration

### Story 4.1: Wire CommandInput into Terminal
**Files:** `components/Terminal.tsx` (modify), `components/Terminal/index.ts` (modify)

Replace raw input with CommandInput component.

**Changes to Terminal.tsx:**
- Import CommandInput
- Replace lines 1249-1260 with `<CommandInput ... />`
- Add modal state for Help, Journeys, Stats
- Add handlers for modal open/close
- Add toast handler for lens switching

**Acceptance:**
- [ ] CommandInput renders in place of old input
- [ ] Placeholder shows "Write a query or type /help"
- [ ] Commands open appropriate modals
- [ ] Regular queries still work

**Commit:** `surface: Wire CommandInput into Terminal`

---

### Story 4.2: Export New Components
**Files:** `components/Terminal/index.ts` (modify)

Add exports for new components.

**Acceptance:**
- [ ] CommandInput exported
- [ ] HelpModal, JourneysModal, StatsModal exported

**Commit:** `build: Export command palette components`

---

## Sprint Summary

| Epic | Stories | New Files | Modified Files |
|------|---------|-----------|----------------|
| Infrastructure | 2 | 2 | 0 |
| UI Components | 5 | 6 | 0 |
| Commands | 1 | 6 | 0 |
| Integration | 2 | 0 | 2 |
| **Total** | **10** | **14** | **2** |

## Commit Sequence
1. `core: Add CommandRegistry infrastructure`
2. `core: Add useCommandParser hook`
3. `surface: Add CommandAutocomplete dropdown`
4. `surface: Add CommandInput composite component`
5. `surface: Add HelpModal component`
6. `surface: Add JourneysModal component`
7. `surface: Add StatsModal and useExplorationStats`
8. `core: Register MVP slash commands`
9. `surface: Wire CommandInput into Terminal`
10. `build: Export command palette components`
