# Terminal Header Cleanup - Execution Prompt

Copy this prompt into a new Claude context window to execute the implementation.

---

## EXECUTION PROMPT

```
I need to implement a Terminal header cleanup for The Grove Foundation project. This is a focused UI refactor to move context selectors to the header.

## Context

Read the sprint documentation first:
- `docs/sprints/terminal-header-cleanup/SPEC.md` - Full specification
- `docs/sprints/terminal-header-cleanup/FILE_REFERENCE.md` - Current file contents

## Goal

Move Field, Lens, Journey pills and Streak icon from the bottom of the Terminal to the header. Keep Scholar Mode button at the bottom but restyle for dark mode consistency.

## Before State
- Header: "Your Grove" + minimize/close
- Bottom: Scholar Mode toggle, input, lens badge, streak

## After State
- Header: "Your Grove" + [Field ▼] [Lens ▼] [Journey ▼] + 🔥streak + minimize/close
- Bottom: Scholar Mode toggle (restyled) + input only

## Implementation Steps

### Step 1: Update TerminalHeader.tsx

File: `components/Terminal/TerminalHeader.tsx`

Add new props interface:
```typescript
interface TerminalHeaderProps {
  onMenuClick?: () => void;
  onMinimize: () => void;
  onClose: () => void;
  isScholarMode: boolean;
  showMinimize?: boolean;
  // NEW
  fieldName?: string;
  lensName?: string;
  lensColor?: string;
  journeyName?: string;
  currentStreak?: number;
  onFieldClick?: () => void;
  onLensClick?: () => void;
  onJourneyClick?: () => void;
  onStreakClick?: () => void;
}
```

Add pill components in the header between title and action buttons:
- Field pill: Shows fieldName with ▼, calls onFieldClick
- Lens pill: Shows colored dot + lensName with ▼, calls onLensClick
- Journey pill: Shows journeyName with ▼, calls onJourneyClick
- Streak: Shows 🔥 + count, calls onStreakClick

Style pills for dark mode using CSS variables:
```tsx
className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium
  bg-white/5 dark:bg-white/10 border border-transparent
  hover:border-[var(--grove-accent)] transition-colors cursor-pointer"
```

### Step 2: Update Terminal.tsx

File: `components/Terminal.tsx`

Pass new props to TerminalHeader (~line 1070):
```tsx
<TerminalHeader
  onMinimize={handleMinimize}
  onClose={handleClose}
  isScholarMode={isVerboseMode}
  showMinimize={enableMinimize}
  // NEW
  fieldName="The Grove Foundation"
  lensName={activeLensData?.publicLabel || 'Choose Lens'}
  lensColor={activeLensData?.color}
  journeyName={activeJourneyId ? getJourney(activeJourneyId)?.title : 'Self-Guided'}
  currentStreak={currentStreak}
  onLensClick={() => setShowLensPicker(true)}
  onStreakClick={() => setShowStatsModal(true)}
/>
```

Remove TerminalControls from bottom area (~line 1375):
- Remove or comment out the `{enableControlsBelow && <TerminalControls ... />}` block
- The lens badge and streak are now in header

Restyle Scholar Mode button (~line 1340):
```tsx
<button
  onClick={toggleVerboseMode}
  className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all ${
    isVerboseMode
      ? 'bg-[var(--grove-accent)] text-white shadow-sm'
      : 'bg-transparent text-[var(--grove-text-muted)] border border-[var(--grove-border)] hover:border-[var(--grove-accent)] hover:text-[var(--grove-accent)]'
  }`}
>
  {isVerboseMode ? 'Scholar Mode: ON' : 'Enable Scholar Mode'}
</button>
```

### Step 3: Import getPersonaColors

In TerminalHeader.tsx, import for lens color dots:
```typescript
import { getPersonaColors } from '../../data/narratives-schema';
```

Use it:
```tsx
const colors = lensColor ? getPersonaColors(lensColor) : null;

// In lens pill:
{colors && <span className={`w-2 h-2 rounded-full ${colors.dot}`} />}
```

## Verification

After implementation:
1. Run `npm run build` - must pass
2. Run `npm test` - must pass
3. Visual check:
   - Header shows all pills
   - Pills styled consistently in dark mode
   - Lens pill click opens lens picker
   - Streak click opens stats modal
   - Bottom only has Scholar Mode + input
   - Scholar Mode button looks good in dark mode

## Constraints

- Do NOT remove Scholar Mode button - it stays at bottom
- Do NOT break chat functionality
- Keep changes minimal and focused
- Use CSS variables for dark mode (--grove-*)
```

---

## After Execution

Come back to the original context and share:
1. Screenshot of the new header
2. Any issues encountered
3. Build/test results
