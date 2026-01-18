# Execution Prompt — Command Palette Sprint (v0.16)

## Context
You are implementing the Command Palette feature for The Grove Terminal. This adds slash commands (`/help`, `/welcome`, `/lens`, `/journeys`, `/stats`) with autocomplete to the Terminal input.

## Repository Intelligence

### Key Locations
- **Terminal component:** `components/Terminal.tsx` (1368 lines)
- **Input element:** `components/Terminal.tsx:1249-1260`
- **Modal pattern:** `components/Terminal/WelcomeInterstitial.tsx`
- **Streak data:** `hooks/useStreakTracking.ts`
- **Narrative data:** `hooks/useNarrativeEngine.ts`
- **Lens system:** `hooks/useCustomLens.ts`, `types/lens.ts`
- **Analytics:** `utils/funnelAnalytics.ts`

### Style Tokens (Tailwind)
- Text: `text-ink`, `text-ink-muted`, `text-grove-forest`, `text-grove-clay`
- Backgrounds: `bg-paper`, `bg-white`
- Borders: `border-ink/20`, `border-ink/5`
- Font: `font-serif` (body), `font-mono` (labels)

### Modal Pattern (from WelcomeInterstitial)
```tsx
<div className="flex flex-col h-full">
  {/* Header */}
  <div className="px-4 py-6 border-b border-ink/5">
    <div className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mb-2">
      TITLE
    </div>
    {/* Content */}
  </div>
  {/* Body */}
  <div className="flex-1 overflow-y-auto px-4 pb-4">
    {/* ... */}
  </div>
  {/* Footer */}
  <div className="px-4 py-3 border-t border-ink/5 bg-paper/50">
    {/* ... */}
  </div>
</div>
```

## Execution Phases

### Phase 1: Infrastructure (Stories 1.1, 1.2)

**Create CommandRegistry:**
```
File: components/Terminal/CommandInput/CommandRegistry.ts
```

Implement:
- `Command` interface with id, name, description, aliases, execute
- `CommandContext` interface (openModal, switchLens, showToast, showWelcome)
- `CommandResult` type (modal | action | error)
- `CommandRegistry` class with register/get/getAll/search methods
- Export singleton instance

**Create useCommandParser hook:**
```
File: components/Terminal/CommandInput/useCommandParser.ts
```

Implement:
- Parse input for `/` prefix
- Extract command ID and arguments
- Return suggestions from registry
- Provide execute callback

**BUILD GATE:** Run `npm run type-check`. Must pass before proceeding.

---

### Phase 2: UI Components (Stories 2.1-2.5)

**Create CommandAutocomplete:**
```
File: components/Terminal/CommandInput/CommandAutocomplete.tsx
```

Props: `commands`, `selectedIndex`, `onSelect`
- Render dropdown below input
- Style: `bg-white border border-ink/20 rounded shadow-sm`
- Highlight selected with `bg-paper`

**Create CommandInput:**
```
File: components/Terminal/CommandInput/CommandInput.tsx
```

Composite component that:
- Renders input with placeholder `"Write a query or type /help"`
- Shows CommandAutocomplete when input starts with `/`
- Handles keyboard navigation (arrows, Tab, Enter, Escape)
- Delegates to context handlers for command execution
- Falls back to onSubmitQuery for non-commands

**Create HelpModal:**
```
File: components/Terminal/Modals/HelpModal.tsx
```

Follow WelcomeInterstitial pattern. Content:
- Header: "TERMINAL COMMANDS"
- Section: "Navigation" — /help, /welcome, /lens, /journeys
- Section: "Progress" — /stats
- Tip text at bottom

**Create JourneysModal:**
```
File: components/Terminal/Modals/JourneysModal.tsx
```

- Get journeys from useNarrativeEngine
- Render as cards with title, description, progress
- CTA: "Begin" or "Continue"

**Create StatsModal:**
```
File: components/Terminal/Modals/StatsModal.tsx
```

- Create `hooks/useExplorationStats.ts` to aggregate data
- Display streak, query count, journey progress

**BUILD GATE:** Run `npm run type-check`. Must pass before proceeding.

---

### Phase 3: Command Implementations (Story 3.1)

**Create command files:**
```
components/Terminal/CommandInput/commands/
├── help.ts
├── welcome.ts
├── lens.ts
├── journeys.ts
├── stats.ts
└── index.ts
```

Each command file exports a `Command` object. The `index.ts` registers all commands:

```typescript
// commands/index.ts
import { commandRegistry } from '../CommandRegistry';
import { helpCommand } from './help';
import { welcomeCommand } from './welcome';
import { lensCommand } from './lens';
import { journeysCommand } from './journeys';
import { statsCommand } from './stats';

commandRegistry.register(helpCommand);
commandRegistry.register(welcomeCommand);
commandRegistry.register(lensCommand);
commandRegistry.register(journeysCommand);
commandRegistry.register(statsCommand);
```

**BUILD GATE:** Run `npm run type-check`. Must pass before proceeding.

---

### Phase 4: Integration (Stories 4.1, 4.2)

**Modify Terminal.tsx:**

1. Add imports:
```typescript
import { CommandInput } from './Terminal/CommandInput';
import { HelpModal, JourneysModal, StatsModal } from './Terminal/Modals';
```

2. Add state (near line 295):
```typescript
const [showHelpModal, setShowHelpModal] = useState(false);
const [showJourneysModal, setShowJourneysModal] = useState(false);
const [showStatsModal, setShowStatsModal] = useState(false);
```

3. Add handlers:
```typescript
const handleOpenModal = (modal: 'help' | 'journeys' | 'stats') => {
  if (modal === 'help') setShowHelpModal(true);
  if (modal === 'journeys') setShowJourneysModal(true);
  if (modal === 'stats') setShowStatsModal(true);
};

const handleCommandLensSwitch = (lensId: string) => {
  selectLens(lensId);
  // Show toast or inline confirmation
};
```

4. Replace input (lines 1249-1260):
```tsx
<CommandInput
  onSubmitQuery={(q) => handleSend(q)}
  disabled={terminalState.isLoading}
  onOpenModal={handleOpenModal}
  onSwitchLens={handleCommandLensSwitch}
  onShowWelcome={() => setShowWelcomeInterstitial(true)}
/>
```

5. Add modal renders (after other modals):
```tsx
{showHelpModal && <HelpModal onClose={() => setShowHelpModal(false)} />}
{showJourneysModal && <JourneysModal onClose={() => setShowJourneysModal(false)} />}
{showStatsModal && <StatsModal onClose={() => setShowStatsModal(false)} />}
```

**Update barrel exports:**
```
File: components/Terminal/index.ts
```
Add: `CommandInput`, `HelpModal`, `JourneysModal`, `StatsModal`

**BUILD GATE:** Run `npm run build`. Must pass.

---

### Phase 5: Verification

**Manual Testing:**
1. Type `/` — autocomplete should appear
2. Type `/help` + Enter — HelpModal should open
3. Type `/welcome` + Enter — WelcomeInterstitial should show
4. Type `/lens` + Enter — LensPicker should open
5. Type `/lens engineer` + Enter — lens should switch
6. Type `/journeys` + Enter — JourneysModal should open
7. Type `/stats` + Enter — StatsModal should open
8. Type regular query — should go to chat as before

**Commit Sequence:**
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

---

## Citation Requirements

When modifying existing files, cite with `path:lineStart-lineEnd` format.

Example:
```
// Replacing input element
// components/Terminal.tsx:1249-1260
// Before: <input ref={inputRef} ...
// After: <CommandInput onSubmitQuery={...}
```

## Forbidden Actions

- Do NOT modify WelcomeInterstitial.tsx
- Do NOT change existing analytics events
- Do NOT add new dependencies without approval
- Do NOT implement commands beyond the MVP set
- Do NOT add command history (up-arrow) functionality

## Response Format

After each phase:
1. **What I found** — with `path:line-line` citations
2. **What I changed** — files created/modified
3. **Diff summary** — key changes
4. **Tests run** — commands executed
5. **Risks/follow-ups** — anything to note
