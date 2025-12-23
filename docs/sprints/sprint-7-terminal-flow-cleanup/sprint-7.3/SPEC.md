# Sprint 7.3: Unified Compact Picker Pattern

**Status:** Ready for Execution  
**Depends On:** Sprint 7.2 (c41b7d7) ✅
**Priority:** HIGH

## Problem Statement

We have duplicate picker implementations:
- `src/explore/LensPicker.tsx` - Full workspace view ✅
- `src/explore/JourneyList.tsx` - Full workspace view ✅
- `components/Terminal/LensPicker.tsx` - Legacy compact picker ❌ DUPLICATE
- `components/Terminal/WelcomeInterstitial.tsx` - Legacy welcome ❌ DUPLICATE

Chat nav clicks (lens pill, journey indicator) should navigate to the workspace views with a `compact` mode, not render separate legacy components.

## Target Architecture

```
src/explore/LensPicker.tsx
  ├── mode="full" (default) → Header, search, 2-col grid, inspector integration
  └── mode="compact" → Simple header, list layout, click → select + return

src/explore/JourneyList.tsx  
  ├── mode="full" (default) → Header, search, 2-col grid, inspector integration
  └── mode="compact" → Simple header, list layout, click → select + return

components/Terminal/
  ├── LensPicker.tsx → DELETE (replaced by compact mode)
  └── WelcomeInterstitial.tsx → DELETE (fold into compact LensPicker)
```

## Compact Mode Behavior

| Aspect | Full Mode | Compact Mode |
|--------|-----------|--------------|
| Header | CollectionHeader with search | Simple "← Back to Chat" + "Switch X" |
| Layout | 2-column grid | Single column list |
| Inspector | Opens on card click | Disabled |
| Card click | Opens inspector | Selects + returns to chat |
| Button click | Selects + opens inspector | Selects + returns to chat |

## Visual Spec

### Compact Lens Picker
```
┌─────────────────────────────────────────┐
│ ← Back to Chat          Switch Lens     │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │ 🧭 Freestyle                     │   │
│  │ "Explore freely without..."      │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ 🏠 Concerned Citizen    [ACTIVE] │   │
│  │ "I'm worried about Big Tech..."  │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ 🎓 Academic             [Select] │   │
│  │ "I work in research..."          │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Compact Journey Picker
```
┌─────────────────────────────────────────┐
│ ← Back to Chat        Switch Journey    │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │ 📖 The Ghost in the Machine      │   │
│  │ "You aren't just reading..."     │   │
│  │ ⏱ 8 min              [ACTIVE]   │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ 📖 The $380 Billion Bet          │   │
│  │ "Follow the money..."            │   │
│  │ ⏱ 12 min              [Start]   │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

---

## Implementation Tasks

### Task 1: Add Compact Mode to LensPicker

File: `src/explore/LensPicker.tsx`

```tsx
interface LensPickerProps {
  mode?: 'full' | 'compact';
  onBack?: () => void;  // For compact mode "Back to Chat"
}

export function LensPicker({ mode = 'full', onBack }: LensPickerProps) {
  // ... existing state ...

  const handleSelect = (personaId: string) => {
    selectLens(personaId);
    if (mode === 'compact' && onBack) {
      onBack();  // Return to chat after selection
    } else {
      openInspector({ type: 'lens', lensId: personaId });
    }
  };

  const handleView = (personaId: string) => {
    if (mode === 'compact') {
      handleSelect(personaId);  // In compact, click = select
    } else {
      openInspector({ type: 'lens', lensId: personaId });
    }
  };

  if (mode === 'compact') {
    return (
      <div className="flex flex-col h-full bg-transparent">
        {/* Compact Header */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-primary">
            <span className="material-symbols-outlined text-lg">chevron_left</span>
            Back to Chat
          </button>
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Switch Lens</span>
          <div className="w-24" />
        </div>
        
        {/* Compact List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {personas.map(persona => (
            <CompactLensCard
              key={persona.id}
              persona={persona}
              isActive={activeLensId === persona.id}
              onSelect={() => handleSelect(persona.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  // ... existing full mode return ...
}
```

### Task 2: Create CompactLensCard Component

```tsx
function CompactLensCard({ persona, isActive, onSelect }: { 
  persona: Persona; 
  isActive: boolean; 
  onSelect: () => void;
}) {
  const accent = lensAccents[persona.id] || defaultAccent;
  
  return (
    <div
      onClick={onSelect}
      className={`
        flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all
        ${isActive
          ? 'border-primary/50 bg-primary/10 dark:bg-primary/20'
          : 'border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:border-primary/30'
        }
      `}
    >
      <div className={`${accent.bgLight} ${accent.bgDark} p-2.5 rounded-lg shrink-0`}>
        <span className={`material-symbols-outlined ${accent.textLight} ${accent.textDark}`}>
          {accent.icon}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={`font-medium ${isActive ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>
          {persona.publicLabel}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 italic truncate">
          "{persona.description}"
        </p>
      </div>
      {isActive ? (
        <span className="px-2 py-1 text-xs font-medium rounded bg-primary/20 text-primary shrink-0">
          ACTIVE
        </span>
      ) : (
        <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
          Select
        </span>
      )}
    </div>
  );
}
```

### Task 3: Add Compact Mode to JourneyList

File: `src/explore/JourneyList.tsx`

Same pattern as LensPicker:

```tsx
interface JourneyListProps {
  mode?: 'full' | 'compact';
  onBack?: () => void;
}

export function JourneyList({ mode = 'full', onBack }: JourneyListProps) {
  // ... existing logic ...

  const handleStart = (journeyId: string) => {
    startJourney(journeyId);
    if (mode === 'compact' && onBack) {
      onBack();
    } else {
      navigateTo(['explore']);
    }
  };

  if (mode === 'compact') {
    return (
      <div className="flex flex-col h-full bg-transparent">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <button onClick={onBack} className="...">
            <span className="material-symbols-outlined">chevron_left</span>
            Back to Chat
          </button>
          <span className="...">Switch Journey</span>
          <div className="w-24" />
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {journeys.map(journey => (
            <CompactJourneyCard
              key={journey.id}
              journey={journey}
              isActive={activeJourneyId === journey.id}
              onStart={() => handleStart(journey.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  // ... existing full mode ...
}
```

### Task 4: Create CompactJourneyCard Component

```tsx
function CompactJourneyCard({ journey, isActive, onStart }: {
  journey: Journey;
  isActive: boolean;
  onStart: () => void;
}) {
  return (
    <div
      onClick={onStart}
      className={`
        flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all
        ${isActive
          ? 'border-primary/50 bg-primary/10 dark:bg-primary/20'
          : 'border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:border-primary/30'
        }
      `}
    >
      <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 shrink-0">
        <span className="material-symbols-outlined text-amber-600 dark:text-amber-400">
          {journey.icon || 'map'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className={`font-medium ${isActive ? 'text-primary' : 'text-slate-900 dark:text-white'}`}>
          {journey.title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 italic truncate mb-1">
          "{journey.targetAha || journey.description}"
        </p>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <span className="material-symbols-outlined text-sm">schedule</span>
          {journey.estimatedMinutes} min
        </div>
      </div>
      {isActive ? (
        <span className="px-2 py-1 text-xs font-medium rounded bg-primary/20 text-primary shrink-0">
          ACTIVE
        </span>
      ) : (
        <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
          Start
        </span>
      )}
    </div>
  );
}
```

### Task 5: Update Terminal to Use Compact Modes

File: `components/Terminal.tsx` (or wherever chat nav triggers pickers)

Instead of rendering legacy `components/Terminal/LensPicker.tsx`:

```tsx
import { LensPicker } from '../src/explore/LensPicker';
import { JourneyList } from '../src/explore/JourneyList';

// When showing lens picker:
{showLensPicker && (
  <LensPicker 
    mode="compact" 
    onBack={() => setShowLensPicker(false)} 
  />
)}

// When showing journey picker:
{showJourneyPicker && (
  <JourneyList 
    mode="compact" 
    onBack={() => setShowJourneyPicker(false)} 
  />
)}
```

### Task 6: Delete Legacy Components

After compact modes are working:

```bash
rm components/Terminal/LensPicker.tsx
rm components/Terminal/WelcomeInterstitial.tsx
rm components/Terminal/LensGrid.tsx  # If only used by legacy picker
```

Update any imports that reference these deleted files.

---

## Files to Modify

| File | Action | Priority |
|------|--------|----------|
| `src/explore/LensPicker.tsx` | Add compact mode + CompactLensCard | HIGH |
| `src/explore/JourneyList.tsx` | Add compact mode + CompactJourneyCard | HIGH |
| `components/Terminal.tsx` | Wire compact pickers | HIGH |
| `components/Terminal/LensPicker.tsx` | DELETE | MEDIUM |
| `components/Terminal/WelcomeInterstitial.tsx` | DELETE | MEDIUM |
| `components/Terminal/LensGrid.tsx` | DELETE if unused | LOW |

---

## Acceptance Criteria

- [ ] Click lens pill in chat nav → Compact lens picker appears
- [ ] Click journey indicator in chat nav → Compact journey picker appears
- [ ] Compact pickers have "← Back to Chat" + "Switch X" header
- [ ] Compact pickers show single-column list (not grid)
- [ ] Click card in compact mode → Selects + returns to chat
- [ ] Active items show "ACTIVE" badge
- [ ] Inactive items show "Select" / "Start" text
- [ ] Full mode (via sidebar) still works with grid + inspector
- [ ] Legacy components deleted, no broken imports

---

## Testing Checklist

1. **Compact Lens Picker:**
   - [ ] Click lens pill in chat → compact picker shows
   - [ ] Shows all lenses in list format
   - [ ] Active lens highlighted with "ACTIVE" badge
   - [ ] Click inactive lens → selects + returns to chat
   - [ ] "Back to Chat" button works

2. **Compact Journey Picker:**
   - [ ] Click journey indicator → compact picker shows
   - [ ] Shows all journeys in list format
   - [ ] Active journey highlighted with "ACTIVE" badge
   - [ ] Click inactive journey → starts + returns to chat
   - [ ] "Back to Chat" button works

3. **Full Mode (via sidebar):**
   - [ ] Sidebar → Lenses still shows full picker with grid
   - [ ] Card click opens inspector
   - [ ] Select button activates lens
   - [ ] Same for Journeys view

4. **Cleanup:**
   - [ ] No imports reference deleted files
   - [ ] Build passes
   - [ ] Tests pass
