# Terminal Header Cleanup Sprint

**Goal:** Move context selectors (Field, Lens, Journey) and Streak to the header; clean up bottom area while keeping Scholar Mode button.

## Current State

### Top (TerminalHeader)
- Hamburger menu (left)
- "Your Grove" title + Scholar badge (center)
- Minimize/Close buttons (right)

### Bottom (Interactions Area)
- "Enable Scholar Mode" toggle button
- Input bar
- Lens badge ("Concerned Citizen") — in TerminalControls
- Streak icon — in TerminalControls

## Target State

### Top (TerminalHeader)
```
┌─────────────────────────────────────────────────────────────────┐
│ ☰  Your Grove   [Field ▼] [Lens ▼] [Journey ▼]      🔥3  ─  ✕  │
└─────────────────────────────────────────────────────────────────┘
```
- Hamburger menu (left)
- "Your Grove" title (left-center)
- Field pill: "The Grove Foundation ▼" (center)
- Lens pill: "Concerned Citizen ▼" (center)
- Journey pill: "Self-Guided ▼" (center)
- Streak icon with count, links to /stats (right)
- Minimize/Close buttons (right)

### Bottom (Interactions Area)
```
┌─────────────────────────────────────────────────────────────────┐
│                    [Enable Scholar Mode]                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Write a query or type /help                          → │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```
- Scholar Mode toggle (styled consistently with dark mode)
- Input bar
- NO lens badge
- NO streak icon

## Design Specifications

### Header Pills

**Shared pill styles:**
```css
/* Base pill */
.header-pill {
  display: flex;
  align-items: center;
  gap: 0.375rem;           /* space-x-1.5 */
  padding: 0.25rem 0.75rem; /* py-1 px-3 */
  border-radius: 9999px;    /* rounded-full */
  font-size: 0.6875rem;     /* text-[11px] */
  font-weight: 500;
  transition: all 150ms;
  cursor: pointer;
}

/* Light mode */
.header-pill {
  background: rgba(0,0,0,0.05);
  color: var(--grove-text);
  border: 1px solid transparent;
}

/* Dark mode */
.dark .header-pill {
  background: rgba(255,255,255,0.08);
  color: var(--grove-text);
  border: 1px solid var(--grove-border);
}

/* Hover */
.header-pill:hover {
  background: rgba(0,0,0,0.1);
  border-color: var(--grove-accent);
}

.dark .header-pill:hover {
  background: rgba(255,255,255,0.12);
  border-color: var(--grove-accent);
}
```

**Field pill:**
- Label: Current field name (default: "The Grove Foundation")
- Icon: None or subtle folder icon
- Dropdown: ▼
- Click: Opens field selector (future feature, can be no-op for now)

**Lens pill:**
- Label: Active lens name (e.g., "Concerned Citizen")
- Icon: Colored dot matching lens color
- Dropdown: ▼
- Click: Opens lens picker (`setShowLensPicker(true)`)

**Journey pill:**
- Label: "Self-Guided" or active journey name
- Icon: Map or route icon
- Dropdown: ▼
- Click: Opens journey selector (future) or navigates to /journeys

### Streak Display

```tsx
<button 
  onClick={() => navigateTo(['explore', 'stats'])} // or open stats modal
  className="flex items-center gap-1 text-[var(--grove-accent)] hover:opacity-80"
>
  <span>🔥</span>
  <span className="text-xs font-mono">{currentStreak}</span>
</button>
```

### Scholar Mode Button (Restyled)

Current style is good but needs dark mode consistency:
```tsx
<button
  onClick={toggleVerboseMode}
  className={`
    px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all
    ${isVerboseMode
      ? 'bg-[var(--grove-accent)] text-white shadow-sm'
      : 'bg-transparent text-[var(--grove-text-muted)] border border-[var(--grove-border)] hover:border-[var(--grove-accent)] hover:text-[var(--grove-accent)]'
    }
  `}
>
  {isVerboseMode ? 'Scholar Mode: ON' : 'Enable Scholar Mode'}
</button>
```

## Implementation Steps

### Step 1: Update TerminalHeader.tsx

Add new props:
```typescript
interface TerminalHeaderProps {
  // Existing
  onMenuClick?: () => void;
  onMinimize: () => void;
  onClose: () => void;
  isScholarMode: boolean;
  showMinimize?: boolean;
  
  // New
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

### Step 2: Update Terminal.tsx

Pass new props to TerminalHeader:
```tsx
<TerminalHeader
  // existing props...
  fieldName="The Grove Foundation"
  lensName={activeLensData?.publicLabel || 'Choose Lens'}
  lensColor={activeLensData?.color}
  journeyName={activeJourneyId ? getJourney(activeJourneyId)?.title : 'Self-Guided'}
  currentStreak={currentStreak}
  onLensClick={() => setShowLensPicker(true)}
  onStreakClick={() => setShowStatsModal(true)}
/>
```

### Step 3: Remove from Bottom Area

In Terminal.tsx interactions area, remove:
- The TerminalControls component call (or just the lens/streak parts)
- Keep Scholar Mode toggle but restyle

### Step 4: Restyle Scholar Mode

Update the Scholar Mode button classes to use CSS variables for dark mode compatibility.

## Files to Read Before Implementation

| File | Purpose |
|------|---------|
| `components/Terminal/TerminalHeader.tsx` | Current header - ADD pills here |
| `components/Terminal/TerminalControls.tsx` | Current bottom controls - lens/streak to REMOVE |
| `components/Terminal.tsx` | Main component - wire up new props, clean bottom |
| `components/Terminal/JourneyNav.tsx` | Reference for pill/badge styling |
| `data/narratives-schema.ts` | Persona colors via `getPersonaColors()` |

## Files to Modify

| File | Changes |
|------|---------|
| `components/Terminal/TerminalHeader.tsx` | Add Field/Lens/Journey pills, Streak |
| `components/Terminal.tsx` | Pass props, remove bottom controls |
| `components/Terminal/TerminalControls.tsx` | May remove or simplify |

## Acceptance Criteria

- [ ] Header shows Field, Lens, Journey pills with dropdown indicators
- [ ] Streak icon in header, clickable to stats
- [ ] Lens pill click opens lens picker
- [ ] Bottom area only has Scholar Mode + input
- [ ] Scholar Mode button styled for dark mode
- [ ] Pills styled consistently in dark mode
- [ ] Build passes
- [ ] Tests pass
- [ ] No visual regressions in chat functionality
