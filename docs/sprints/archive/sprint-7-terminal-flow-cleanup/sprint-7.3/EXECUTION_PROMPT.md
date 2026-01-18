# Sprint 7.3: Execution Prompt

Copy this into Claude Code.

---

## FOUNDATION LOOP

Before making any changes:

1. **Read the spec:** `docs/sprints/sprint-7-terminal-flow-cleanup/sprint-7.3/SPEC.md`
2. **Audit current state:** Check how Terminal.tsx currently triggers lens/journey pickers
3. **Identify all files** that import from `components/Terminal/LensPicker.tsx` or `components/Terminal/WelcomeInterstitial.tsx`
4. **Plan the migration** before writing code

---

## CONTEXT

We're unifying lens and journey pickers into single components with two modes:
- `mode="full"` - Grid layout, search, inspector integration (workspace view)
- `mode="compact"` - List layout, simple header, click-to-select (chat nav)

This eliminates duplicate legacy components in `components/Terminal/`.

---

## EXECUTION PROMPT

```
Implement Sprint 7.3: Unified Compact Picker Pattern

## Phase 1: Audit

First, understand the current wiring:

1. Find where lens picker is triggered from chat nav:
   - Search for `showLensPicker` or similar state
   - Find what component renders when user clicks lens pill
   
2. Find where journey picker is triggered:
   - Search for `showJourneyPicker` or similar
   - Find what renders for journey switching

3. List all imports of legacy components:
   ```bash
   grep -r "Terminal/LensPicker" src/ components/ --include="*.tsx"
   grep -r "Terminal/WelcomeInterstitial" src/ components/ --include="*.tsx"
   grep -r "Terminal/LensGrid" src/ components/ --include="*.tsx"
   ```

## Phase 2: Add Compact Mode to LensPicker

File: `src/explore/LensPicker.tsx`

### 2a. Update component props and add CompactLensCard

Add at the top of the file after existing interfaces:

```tsx
interface LensPickerProps {
  mode?: 'full' | 'compact';
  onBack?: () => void;
}

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
      ) : null}
    </div>
  );
}
```

### 2b. Update LensPicker function signature and add compact mode

```tsx
export function LensPicker({ mode = 'full', onBack }: LensPickerProps = {}) {
  const { getEnabledPersonas, selectLens, session } = useNarrativeEngine();
  const { navigateTo, openInspector } = useWorkspaceUI();
  const personas = getEnabledPersonas();
  const activeLensId = session.activeLens;
  const activePersona = personas.find(p => p.id === activeLensId);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPersonas = useMemo(() => {
    if (!searchQuery.trim()) return personas;
    const query = searchQuery.toLowerCase();
    return personas.filter(p =>
      p.publicLabel.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query)
    );
  }, [personas, searchQuery]);

  const handleSelect = (personaId: string) => {
    selectLens(personaId);
    if (mode === 'compact' && onBack) {
      onBack();
    } else {
      openInspector({ type: 'lens', lensId: personaId });
    }
  };

  const handleView = (personaId: string) => {
    if (mode === 'compact') {
      handleSelect(personaId);
    } else {
      openInspector({ type: 'lens', lensId: personaId });
    }
  };

  // COMPACT MODE
  if (mode === 'compact') {
    return (
      <div className="flex flex-col h-full bg-transparent">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
              Back to Chat
            </button>
          )}
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Switch Lens</span>
          <div className="w-24" />
        </div>
        
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

  // FULL MODE - existing implementation
  return (
    <div className="h-full overflow-y-auto p-8">
      {/* ... existing full mode JSX ... */}
    </div>
  );
}
```

## Phase 3: Add Compact Mode to JourneyList

File: `src/explore/JourneyList.tsx`

### 3a. Add CompactJourneyCard and update props

```tsx
interface JourneyListProps {
  mode?: 'full' | 'compact';
  onBack?: () => void;
}

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
      ) : null}
    </div>
  );
}
```

### 3b. Update JourneyList with compact mode

```tsx
export function JourneyList({ mode = 'full', onBack }: JourneyListProps = {}) {
  const { schema, loading, startJourney, activeJourneyId, getJourney } = useNarrativeEngine();
  const { openInspector, navigateTo } = useWorkspaceUI();
  const [searchQuery, setSearchQuery] = useState('');

  const allJourneys = useMemo(() => {
    if (!schema?.journeys) return [];
    return Object.values(schema.journeys).filter(j => j.status === 'active');
  }, [schema]);

  const journeys = useMemo(() => {
    if (!searchQuery.trim()) return allJourneys;
    const query = searchQuery.toLowerCase();
    return allJourneys.filter(j =>
      j.title.toLowerCase().includes(query) ||
      j.description.toLowerCase().includes(query)
    );
  }, [allJourneys, searchQuery]);

  const handleStart = (journeyId: string) => {
    startJourney(journeyId);
    if (mode === 'compact' && onBack) {
      onBack();
    } else {
      navigateTo(['explore', 'groveProject']);
    }
  };

  const handleView = (journeyId: string) => {
    if (mode === 'compact') {
      handleStart(journeyId);
    } else {
      openInspector({ type: 'journey', journeyId });
    }
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center">
      <div className="text-primary animate-pulse">Loading journeys...</div>
    </div>;
  }

  // COMPACT MODE
  if (mode === 'compact') {
    return (
      <div className="flex flex-col h-full bg-transparent">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
            >
              <span className="material-symbols-outlined text-lg">chevron_left</span>
              Back to Chat
            </button>
          )}
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Switch Journey</span>
          <div className="w-24" />
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {allJourneys.map(journey => (
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

  // FULL MODE - existing implementation
  return (
    <div className="h-full overflow-y-auto p-8">
      {/* ... existing full mode JSX ... */}
    </div>
  );
}
```

## Phase 4: Wire Terminal to Use Compact Modes

Find where Terminal renders the legacy pickers and replace:

```tsx
// Replace legacy imports:
// REMOVE: import LensPicker from './Terminal/LensPicker';
// ADD:
import { LensPicker } from '../src/explore/LensPicker';
import { JourneyList } from '../src/explore/JourneyList';

// Replace legacy usage:
{showLensPicker && (
  <LensPicker 
    mode="compact" 
    onBack={() => setShowLensPicker(false)} 
  />
)}

{showJourneyPicker && (
  <JourneyList 
    mode="compact" 
    onBack={() => setShowJourneyPicker(false)} 
  />
)}
```

## Phase 5: Delete Legacy Components

After verifying compact modes work:

```bash
rm components/Terminal/LensPicker.tsx
rm components/Terminal/WelcomeInterstitial.tsx
rm components/Terminal/LensGrid.tsx
```

Search for and fix any broken imports:
```bash
grep -r "Terminal/LensPicker" src/ components/ --include="*.tsx"
grep -r "Terminal/WelcomeInterstitial" src/ components/ --include="*.tsx"
grep -r "Terminal/LensGrid" src/ components/ --include="*.tsx"
```

## Testing

After all changes:

1. `npm run build` - no TypeScript errors
2. `npm test` - tests pass

Browser testing:
- [ ] Click lens pill in chat nav → compact lens picker
- [ ] Click card → selects lens + returns to chat
- [ ] Click journey indicator → compact journey picker
- [ ] Click card → starts journey + returns to chat
- [ ] Sidebar → Lenses → full picker with grid + inspector
- [ ] Sidebar → Journeys → full list with grid + inspector
```
