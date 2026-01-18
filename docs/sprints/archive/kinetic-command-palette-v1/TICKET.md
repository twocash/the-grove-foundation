# Kinetic Command Palette Integration

## Problem Statement

The `/explore` experience lacks the command palette infrastructure already built for the legacy Terminal. Users can't use slash commands (`/lenses`, `/journeys`, `/help`, etc.) to quickly navigate or access features.

## Current State

**Legacy Terminal has complete infrastructure:**
- `components/Terminal/CommandInput/CommandRegistry.ts` — Command registry singleton
- `components/Terminal/CommandInput/useCommandParser.ts` — Parse and execute commands
- `components/Terminal/CommandInput/CommandAutocomplete.tsx` — Dropdown UI
- `components/Terminal/CommandInput/CommandInput.tsx` — Full composite input
- `components/Terminal/CommandInput/commands/` — Individual command definitions:
  - `lens.ts` — `/lens [id]` or `/lens` to open picker
  - `journeys.ts` — `/journeys` to open browser
  - `help.ts` — `/help` to show command reference
  - `welcome.ts` — `/welcome` to re-show welcome
  - `stats.ts` — `/stats` to show engagement stats
  - `garden.ts` — `/garden` for sprout cultivation
  - `sprout.ts` — `/sprout` to capture insight

**Kinetic CommandConsole is minimal:**
- `src/surface/components/KineticStream/CommandConsole/index.tsx`
- Simple input with no command parsing
- No autocomplete, no slash command handling

## Desired Behavior

### Command Experience
1. User types `/` → autocomplete dropdown appears above input
2. Dropdown shows matching commands with descriptions
3. Arrow keys navigate; Tab/Enter selects
4. Commands execute immediately (open overlays, switch lenses, etc.)
5. Non-command input flows to existing `submit()` handler

### MVP Commands for Kinetic

| Command | Arguments | Action | Output |
|---------|-----------|--------|--------|
| `/lenses` | None | Open lens picker overlay | Current lens highlighted, custom lenses first |
| `/lenses [id]` | Lens ID | Switch directly to lens | Toast confirmation |
| `/journeys` | None | Open journey browser | Available journeys with progress |
| `/help` | None | Show command reference | HelpOverlay |
| `/wizard` | None | Open custom lens wizard | WizardOverlay |
| `/stats` | None | Show engagement stats | StatsOverlay |

### Lens Picker Enhancement

When opening via `/lenses`:
- Custom/personal lenses appear at top
- Current active lens is highlighted
- Quick-switch without full picker if only showing options

---

## Technical Approach

### Option A: Port CommandInput Wholesale ⭐ RECOMMENDED

Replace `CommandConsole` with adapted `CommandInput`:

1. Copy `CommandRegistry`, `useCommandParser`, `CommandAutocomplete` to Kinetic
2. Create `src/surface/components/KineticStream/CommandConsole/KineticCommandInput.tsx`
3. Update command context to use Kinetic overlays instead of Terminal modals
4. Wire into ExploreShell

**Pros:** Reuse proven code, consistent UX, minimal new development
**Cons:** Some adaptation needed for overlay vs modal patterns

### Option B: Build Fresh with Kinetic Patterns

Create new command system using Kinetic conventions:
- Use overlay state pattern from ExploreShell
- Wire to engagement machine actions
- Build autocomplete with Kinetic glass styling

**Pros:** Purpose-built for Kinetic
**Cons:** Duplicates work, diverges from proven implementation

---

## Implementation Plan (Option A)

### Phase 1: Port Core Infrastructure

**Step 1: Copy registry and parser**
```
src/surface/hooks/
├── useKineticCommands.ts      # Adapted from useCommandParser
```

```
src/core/commands/
├── CommandRegistry.ts          # Copy from Terminal
├── kinetic-commands/
│   ├── lenses.ts
│   ├── journeys.ts
│   ├── help.ts
│   ├── wizard.ts
│   └── stats.ts
```

**Step 2: Create Kinetic command context**
```typescript
interface KineticCommandContext {
  setOverlay: (type: OverlayType) => void;
  selectLens: (lensId: string) => void;
  showToast: (message: string) => void;
  startJourney: (journeyId: string) => void;
}
```

### Phase 2: Update CommandConsole

**Step 3: Add autocomplete to CommandConsole**
```typescript
// New imports
import { CommandAutocomplete } from './CommandAutocomplete';
import { useKineticCommands } from '@surface/hooks/useKineticCommands';

// Inside component
const { parseInput, getSuggestions, executeCommand } = useKineticCommands();
const suggestions = getSuggestions(value);

// Show autocomplete when typing /
{suggestions.length > 0 && (
  <CommandAutocomplete
    commands={suggestions}
    selectedIndex={selectedIndex}
    onSelect={handleSelectCommand}
  />
)}
```

**Step 4: Handle command execution**
```typescript
const handleSubmit = useCallback(() => {
  const parsed = parseInput(value);
  
  if (parsed.isCommand && parsed.commandId) {
    const result = executeCommand(parsed.commandId, context, parsed.args);
    if (result?.type === 'overlay') {
      setOverlay(result.overlay);
    }
    // etc.
  } else {
    onSubmit(value);
  }
}, [value, parseInput, executeCommand, onSubmit]);
```

### Phase 3: Create Kinetic Commands

**Step 5: `/lenses` command**
```typescript
export const lensesCommand: KineticCommand = {
  id: 'lenses',
  name: 'Lenses',
  description: 'Open lens picker or switch lens',
  aliases: ['lens', 'perspective'],
  execute: (context, args) => {
    if (args?.trim()) {
      context.selectLens(args.trim());
      return { type: 'toast', message: `Switched to ${args}` };
    }
    return { type: 'overlay', overlay: 'lens-picker' };
  }
};
```

**Step 6: `/journeys` command**
```typescript
export const journeysCommand: KineticCommand = {
  id: 'journeys',
  name: 'Journeys',
  description: 'Browse available guided journeys',
  aliases: ['journey', 'j'],
  execute: (context) => {
    return { type: 'overlay', overlay: 'journey-picker' };
  }
};
```

**Step 7: `/wizard` command**
```typescript
export const wizardCommand: KineticCommand = {
  id: 'wizard',
  name: 'Create Lens',
  description: 'Open custom lens creation wizard',
  aliases: ['create', 'custom'],
  execute: (context) => {
    return { type: 'overlay', overlay: 'custom-lens-wizard' };
  }
};
```

### Phase 4: Style Autocomplete for Kinetic

**Step 8: Create KineticAutocomplete.tsx**
```tsx
<div className="absolute bottom-full left-0 right-0 mb-2 
                bg-[var(--glass-solid)] border border-[var(--glass-border)]
                rounded-lg shadow-lg overflow-hidden">
  {commands.map((cmd, i) => (
    <button
      key={cmd.id}
      className={cn(
        'w-full px-4 py-2 flex items-center gap-3 text-left',
        i === selectedIndex && 'bg-[var(--neon-green)]/10'
      )}
    >
      <span className="font-mono text-[var(--neon-green)]">/{cmd.id}</span>
      <span className="text-sm text-[var(--glass-text-muted)]">{cmd.description}</span>
    </button>
  ))}
</div>
```

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/core/commands/CommandRegistry.ts` | Copy from Terminal |
| `src/core/commands/kinetic-commands/lenses.ts` | Create |
| `src/core/commands/kinetic-commands/journeys.ts` | Create |
| `src/core/commands/kinetic-commands/help.ts` | Create |
| `src/core/commands/kinetic-commands/wizard.ts` | Create |
| `src/core/commands/kinetic-commands/stats.ts` | Create |
| `src/core/commands/kinetic-commands/index.ts` | Create (register all) |
| `src/surface/hooks/useKineticCommands.ts` | Create |
| `src/surface/components/KineticStream/CommandConsole/KineticAutocomplete.tsx` | Create |
| `src/surface/components/KineticStream/CommandConsole/index.tsx` | Modify (add command support) |
| `src/surface/components/KineticStream/ExploreShell.tsx` | Modify (wire command context) |

---

## Acceptance Criteria

- [ ] Typing `/` in CommandConsole shows autocomplete dropdown
- [ ] Arrow keys navigate suggestions, Tab/Enter selects
- [ ] `/lenses` opens LensPicker overlay with current lens highlighted
- [ ] `/lenses engineer` switches directly to engineer lens
- [ ] `/journeys` opens journey picker overlay
- [ ] `/wizard` opens CustomLensWizard overlay
- [ ] `/help` shows available commands
- [ ] Regular queries (not starting with `/`) still work normally
- [ ] Autocomplete uses Kinetic glass styling
- [ ] Commands work with keyboard only (accessibility)

---

## Dependencies

- **kinetic-wizard-integration-v1** — Wizard overlay must work first
- **moment-ui-integration-v1** — Overlay pattern established

## Sprint Estimate

**Medium complexity** — mostly porting proven code, some adaptation for Kinetic patterns.

---

*Created: 2024-12-29*
*Sprint: kinetic-command-palette-v1*
*Depends on: kinetic-wizard-integration-v1*
