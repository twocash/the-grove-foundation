# Grove Workspace: Sprint 4 Kickoff

**Copy and paste this entire message into a new Claude Code session.**

---

## SPRINT 4: Wire Real Data + Make Actions Work

Sprint 3 established the visual system and collection controls pattern. Now we make everything functional:
1. Inspector actions actually do things
2. State persists across sessions
3. Keyboard navigation works
4. Real data flows through the system

### Prerequisites

Before starting, verify Sprint 3 deliverables:
- [ ] Light/dark theme toggle works
- [ ] Collection controls (Search/Filter/Sort) render on all views
- [ ] LensInspector shows configuration panel
- [ ] Cards have accent colors and hover states
- [ ] Material Symbols icons throughout

If any are missing, complete Sprint 3 first.

---

### CORE PRINCIPLE: Actions Flow Through Inspector

The Inspector isn't just for viewing — it's the action center. Pattern:

```
User clicks card → Inspector opens with details → User takes action → State updates → UI reflects change
```

Every entity type (lens, node, journey, sprout) follows this pattern.

---

### Sprint 4 Deliverables

| Deliverable | Description | Priority |
|-------------|-------------|----------|
| Lens activation | Toggle lens → Terminal uses it | 🔴 Critical |
| Journey start/continue | Button in Inspector → navigates to Terminal with journey context | 🔴 Critical |
| Sprout actions | Delete, promote, edit from Inspector | 🔴 Critical |
| State persistence | Active lens, journey progress in localStorage | 🔴 Critical |
| Search filtering | Typeahead filters cards in real-time | 🟡 High |
| Keyboard navigation | ESC, arrows, Enter, ⌘K | 🟡 High |
| Versioned Artifact stub | Provenance UI pattern on all Inspectors | 🟡 High |
| Node → Journey linking | Click node → see related journeys in Inspector | 🟢 Medium |
| Filter/Sort dropdowns | Actually filter and sort collections | 🟢 Medium |

---

### Task Sequence

#### Phase 1: State Management Foundation

Create a unified state layer that persists to localStorage:

```typescript
// src/lib/workspace-state.ts

interface WorkspaceState {
  // Active selections
  activeLensId: string | null;
  activeJourneyId: string | null;
  
  // Journey progress (journeyId → step index)
  journeyProgress: Record<string, number>;
  
  // User preferences
  theme: 'light' | 'dark' | 'system';
  inspectorOpen: boolean;
  sidebarCollapsed: boolean;
  
  // Session
  sessionStartTime: number;
}

// Hook
export function useWorkspaceState() {
  const [state, setState] = useState<WorkspaceState>(() => {
    const stored = localStorage.getItem('grove-workspace-state');
    return stored ? JSON.parse(stored) : defaultState;
  });
  
  // Auto-persist on change
  useEffect(() => {
    localStorage.setItem('grove-workspace-state', JSON.stringify(state));
  }, [state]);
  
  return {
    state,
    setActiveLens: (id: string | null) => setState(s => ({ ...s, activeLensId: id })),
    setActiveJourney: (id: string | null) => setState(s => ({ ...s, activeJourneyId: id })),
    updateJourneyProgress: (journeyId: string, step: number) => 
      setState(s => ({ ...s, journeyProgress: { ...s.journeyProgress, [journeyId]: step } })),
    toggleTheme: () => setState(s => ({ 
      ...s, 
      theme: s.theme === 'dark' ? 'light' : 'dark' 
    })),
    // ... other actions
  };
}
```

**Integrate with WorkspaceUIContext:**

The existing `WorkspaceUIContext` handles UI state (navigation, inspector mode). Add `useWorkspaceState` for persistent state. They work together:

- `WorkspaceUIContext` → What's visible right now (ephemeral)
- `useWorkspaceState` → What the user has configured (persistent)

---

#### Phase 2: Lens Activation Flow

**Goal:** Toggle lens in Inspector → Terminal chat uses that lens's system prompt

**Files to modify:**
- `src/explore/LensPicker.tsx` — Click card opens Inspector
- `src/explore/LensInspector.tsx` — Toggle activates lens
- `src/explore/ExploreChat.tsx` — Reads active lens, passes to Terminal

**Implementation:**

```typescript
// LensInspector.tsx
const LensInspector: React.FC<{ lensId: string }> = ({ lensId }) => {
  const { state, setActiveLens } = useWorkspaceState();
  const lens = getLensById(lensId); // from default-personas.ts
  const isActive = state.activeLensId === lensId;
  
  const handleToggle = () => {
    setActiveLens(isActive ? null : lensId);
  };
  
  return (
    <div className="p-5 space-y-6">
      {/* Header with icon and name */}
      <LensHeader lens={lens} />
      
      {/* Active toggle */}
      <div className="p-4 bg-stone-50 dark:bg-slate-900/50 rounded-xl flex items-center justify-between">
        <div>
          <span className="text-sm font-medium">Lens Active</span>
          <span className="text-xs text-slate-400 block">
            {isActive ? 'Currently in use' : 'Click to activate'}
          </span>
        </div>
        <Toggle checked={isActive} onChange={handleToggle} />
      </div>
      
      {/* Configuration options */}
      {isActive && <LensConfiguration lens={lens} />}
      
      {/* Info callout */}
      <LensInfoCallout lens={lens} />
    </div>
  );
};
```

```typescript
// ExploreChat.tsx - Pass lens to Terminal
const ExploreChat: React.FC = () => {
  const { state } = useWorkspaceState();
  const activeLens = state.activeLensId ? getLensById(state.activeLensId) : null;
  
  return (
    <TerminalChat 
      systemPrompt={activeLens?.systemPrompt}
      lensName={activeLens?.name}
    />
  );
};
```

**Active Lens Indicator:**

Update the indicator bar in LensPicker to reflect actual state:

```typescript
// In LensPicker.tsx
const { state } = useWorkspaceState();
const activeLens = state.activeLensId ? getLensById(state.activeLensId) : null;

<div className="border border-border-light dark:border-slate-700 bg-stone-50 dark:bg-slate-900 rounded-lg p-4 mb-8 flex items-center gap-3">
  <div className={`h-2 w-2 rounded-full ${activeLens ? 'bg-primary animate-pulse' : 'bg-slate-300'}`} />
  <span className="text-sm font-medium text-slate-500 uppercase tracking-wide">Active Lens:</span>
  <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
    {activeLens?.name || 'None (Freestyle)'}
  </span>
</div>
```

---

#### Phase 3: Journey Start/Continue Flow

**Goal:** Click journey → Inspector shows details → "Start Journey" or "Continue" button → Navigates to Terminal with journey context

**Files to modify:**
- `src/explore/JourneyList.tsx` — Show progress badges
- `src/explore/JourneyInspector.tsx` — Create this component
- `src/explore/ExploreChat.tsx` — Accept journey context

**Journey Inspector:**

```typescript
// src/explore/JourneyInspector.tsx
const JourneyInspector: React.FC<{ journeyId: string }> = ({ journeyId }) => {
  const { state, setActiveJourney, updateJourneyProgress } = useWorkspaceState();
  const { setNavigation } = useWorkspaceUI();
  const journey = getJourneyById(journeyId); // from narratives
  
  const currentStep = state.journeyProgress[journeyId] || 0;
  const isActive = state.activeJourneyId === journeyId;
  const isStarted = currentStep > 0;
  const isComplete = currentStep >= journey.nodes.length;
  
  const handleStart = () => {
    setActiveJourney(journeyId);
    updateJourneyProgress(journeyId, 0);
    // Navigate to Terminal with journey context
    setNavigation({ activePath: ['explore'] });
  };
  
  const handleContinue = () => {
    setActiveJourney(journeyId);
    setNavigation({ activePath: ['explore'] });
  };
  
  const handleReset = () => {
    updateJourneyProgress(journeyId, 0);
  };
  
  return (
    <div className="p-5 space-y-6">
      <JourneyHeader journey={journey} />
      
      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span>Progress</span>
          <span>{currentStep} / {journey.nodes.length} nodes</span>
        </div>
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all"
            style={{ width: `${(currentStep / journey.nodes.length) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Steps preview */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-slate-500 uppercase">Journey Steps</h4>
        {journey.nodes.map((node, i) => (
          <div 
            key={node.id}
            className={`flex items-center gap-2 text-sm ${
              i < currentStep ? 'text-primary' : 
              i === currentStep ? 'text-slate-900 dark:text-slate-100 font-medium' : 
              'text-slate-400'
            }`}
          >
            <span className="material-symbols-outlined text-sm">
              {i < currentStep ? 'check_circle' : i === currentStep ? 'radio_button_checked' : 'radio_button_unchecked'}
            </span>
            {node.title}
          </div>
        ))}
      </div>
      
      {/* Action buttons */}
      <div className="space-y-2 pt-4 border-t border-border-light dark:border-border-dark">
        {!isStarted ? (
          <Button onClick={handleStart} variant="primary" fullWidth>
            Start Journey
          </Button>
        ) : isComplete ? (
          <>
            <div className="text-center text-sm text-primary font-medium py-2">
              ✓ Journey Complete
            </div>
            <Button onClick={handleReset} variant="ghost" fullWidth>
              Start Over
            </Button>
          </>
        ) : (
          <>
            <Button onClick={handleContinue} variant="primary" fullWidth>
              Continue Journey
            </Button>
            <Button onClick={handleReset} variant="ghost" fullWidth>
              Reset Progress
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
```

**Journey context in Terminal:**

When a journey is active, the Terminal should:
1. Show journey header with current node
2. Guide conversation toward journey topics
3. Offer "Next" when ready to advance

```typescript
// ExploreChat.tsx
const ExploreChat: React.FC = () => {
  const { state, updateJourneyProgress } = useWorkspaceState();
  const activeJourney = state.activeJourneyId ? getJourneyById(state.activeJourneyId) : null;
  const currentStep = activeJourney ? (state.journeyProgress[activeJourney.id] || 0) : 0;
  const currentNode = activeJourney?.nodes[currentStep];
  
  const handleAdvanceJourney = () => {
    if (activeJourney && currentStep < activeJourney.nodes.length - 1) {
      updateJourneyProgress(activeJourney.id, currentStep + 1);
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Journey header if active */}
      {activeJourney && (
        <div className="px-4 py-2 bg-primary/10 border-b border-primary/20 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-primary">map</span>
            <span className="font-medium">{activeJourney.title}</span>
            <span className="text-slate-500">— {currentNode?.title}</span>
          </div>
          <Button size="sm" onClick={handleAdvanceJourney}>
            Next →
          </Button>
        </div>
      )}
      
      <TerminalChat 
        systemPrompt={buildJourneyPrompt(activeJourney, currentNode)}
      />
    </div>
  );
};
```

---

#### Phase 4: Sprout Actions

**Goal:** Inspector shows sprout details + actions (delete, promote, edit)

**Files to modify:**
- `src/cultivate/SproutGrid.tsx` — Click opens Inspector
- `src/cultivate/SproutInspector.tsx` — Create this component
- `hooks/useSproutStorage.ts` — Add delete, update methods if missing

**Sprout Inspector:**

```typescript
// src/cultivate/SproutInspector.tsx
const SproutInspector: React.FC<{ sproutId: string }> = ({ sproutId }) => {
  const { sprouts, deleteSprout, updateSprout } = useSproutStorage();
  const { closeInspector } = useWorkspaceUI();
  const sprout = sprouts.find(s => s.id === sproutId);
  
  if (!sprout) return <div>Sprout not found</div>;
  
  const handleDelete = () => {
    if (confirm('Delete this sprout? This cannot be undone.')) {
      deleteSprout(sproutId);
      closeInspector();
    }
  };
  
  const handlePromote = () => {
    updateSprout(sproutId, { stage: getNextStage(sprout.stage) });
  };
  
  return (
    <div className="p-5 space-y-6">
      {/* Stage badge */}
      <div className="flex items-center gap-2">
        <StageBadge stage={sprout.stage} />
        <span className="text-xs text-slate-400">
          Captured {formatRelativeTime(sprout.createdAt)}
        </span>
      </div>
      
      {/* Content */}
      <div className="prose prose-sm dark:prose-invert">
        <p>{sprout.content}</p>
      </div>
      
      {/* Source/provenance */}
      {sprout.source && (
        <div className="text-xs text-slate-500 border-l-2 border-slate-200 dark:border-slate-700 pl-3">
          <div className="font-medium">Source</div>
          <div>{sprout.source.type}: {sprout.source.title}</div>
        </div>
      )}
      
      {/* Actions */}
      <div className="space-y-2 pt-4 border-t border-border-light dark:border-border-dark">
        <Button onClick={handlePromote} variant="secondary" fullWidth>
          <span className="material-symbols-outlined text-sm">upgrade</span>
          Promote to {getNextStage(sprout.stage)}
        </Button>
        <Button onClick={() => {/* open edit modal */}} variant="ghost" fullWidth>
          <span className="material-symbols-outlined text-sm">edit</span>
          Edit Content
        </Button>
        <Button onClick={handleDelete} variant="danger" fullWidth>
          <span className="material-symbols-outlined text-sm">delete</span>
          Delete Sprout
        </Button>
      </div>
    </div>
  );
};
```

---

#### Phase 5: Search Filtering

**Goal:** Typeahead in collection header filters visible cards in real-time

**Implementation pattern:**

```typescript
// In any collection view (LensPicker, NodeGrid, JourneyList, SproutGrid)
const [searchQuery, setSearchQuery] = useState('');

const filteredItems = useMemo(() => {
  if (!searchQuery.trim()) return allItems;
  const query = searchQuery.toLowerCase();
  return allItems.filter(item => 
    item.name.toLowerCase().includes(query) ||
    item.description?.toLowerCase().includes(query)
  );
}, [allItems, searchQuery]);

return (
  <div>
    <CollectionHeader
      title="Choose Your Lens"
      description="Select a perspective..."
      searchPlaceholder="Search perspectives..."
      onSearch={setSearchQuery}
      searchValue={searchQuery}
    />
    
    <div className="grid grid-cols-2 gap-6">
      {filteredItems.map(item => <Card key={item.id} {...item} />)}
    </div>
    
    {filteredItems.length === 0 && (
      <EmptyState message={`No results for "${searchQuery}"`} />
    )}
  </div>
);
```

---

#### Phase 6: Keyboard Navigation

**Goal:** Power users can navigate entirely by keyboard

**Key bindings:**

| Key | Action |
|-----|--------|
| `ESC` | Close Inspector / Clear search / Deselect |
| `⌘K` | Open Command Palette |
| `↑↓` | Navigate items in list |
| `Enter` | Select item / Confirm action |
| `⌘1-4` | Jump to section (Explore/Do/Cultivate/Village) |
| `?` | Show keyboard shortcuts |

**Implementation:**

```typescript
// src/hooks/useKeyboardNavigation.ts
export function useKeyboardNavigation() {
  const { closeInspector, inspectorMode } = useWorkspaceUI();
  const { setNavigation } = useWorkspaceUI();
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ESC - close inspector or clear focus
      if (e.key === 'Escape') {
        if (inspectorMode.type !== 'none') {
          closeInspector();
        }
        return;
      }
      
      // ⌘K - command palette (handled by CommandPalette component)
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        // CommandPalette handles this
        return;
      }
      
      // ⌘1-4 - section navigation
      if (e.metaKey || e.ctrlKey) {
        const sections = ['explore', 'do', 'cultivate', 'village'];
        const num = parseInt(e.key);
        if (num >= 1 && num <= 4) {
          e.preventDefault();
          setNavigation({ activePath: [sections[num - 1]] });
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inspectorMode, closeInspector, setNavigation]);
}

// Use in GroveWorkspace.tsx
const GroveWorkspace: React.FC = () => {
  useKeyboardNavigation();
  // ...
};
```

---

#### Phase 7: Versioned Artifact Pattern (Stub)

**Goal:** Establish the provenance UI pattern across all Inspectors

Every entity in Grove has history and lineage. Sprint 4 stubs this pattern; full implementation comes later.

**Reference:** `docs/sprints/foundation-ux-unification-v1/PATTERN_VERSIONED_ARTIFACT.md`

**Add to each Inspector:**

1. **Version badge** below title:
```tsx
<div className="flex items-center gap-2 text-xs text-slate-500">
  <span>v{artifact.version}</span>
  <span>·</span>
  <span>{artifact.provenance.source === 'system' ? 'System default' : 'Modified'}</span>
  <span>·</span>
  <span>{formatRelativeTime(artifact.modifiedAt)}</span>
</div>
```

2. **Provenance section** (collapsible, below main content):
```tsx
<Collapsible title="Provenance">
  <div className="space-y-2 text-xs">
    <div>Source: {artifact.provenance.source}</div>
    {artifact.provenance.forkedFrom && (
      <div>Forked from: {artifact.provenance.forkedFrom.artifactId}</div>
    )}
    <div className="font-medium mt-3">History</div>
    {artifact.history.slice(0, 3).map(entry => (
      <div key={entry.version} className="flex justify-between">
        <span>v{entry.version} · {entry.label || 'Update'}</span>
        <span className="text-slate-400">{formatRelativeTime(entry.timestamp)}</span>
      </div>
    ))}
  </div>
</Collapsible>
```

3. **Action buttons** at bottom:
```tsx
<div className="flex gap-2 pt-4 border-t">
  <Button variant="ghost" size="sm" onClick={handleViewJSON}>
    View JSON
  </Button>
  <Button variant="ghost" size="sm" onClick={handleForkAsNew}>
    Fork as New
  </Button>
  {artifact.provenance.source === 'user' && (
    <Button variant="ghost" size="sm" onClick={handleResetToDefault}>
      Reset
    </Button>
  )}
</div>
```

**Sprout Capture Context (special case):**

Sprouts get richer provenance showing exactly when/how they were captured:

```tsx
<div className="space-y-2 text-xs border-l-2 border-primary/30 pl-3">
  <div className="font-medium">Captured</div>
  <div className="flex items-center gap-2">
    <span className="material-symbols-outlined text-sm">calendar_today</span>
    {formatDate(sprout.captureContext.timestamp)}
  </div>
  <div className="flex items-center gap-2">
    <span className="material-symbols-outlined text-sm">eyeglasses</span>
    Lens: {sprout.captureContext.lensName} v{sprout.captureContext.lensVersion}
  </div>
  {sprout.captureContext.journeyId && (
    <div className="flex items-center gap-2">
      <span className="material-symbols-outlined text-sm">map</span>
      Journey: {sprout.captureContext.journeyName} (Step {sprout.captureContext.journeyStep})
    </div>
  )}
</div>
```

**For now:** Add the UI elements with mock/stub data. Wire to real versioning in Sprint 5+.

**Why stub now:**
- Establishes the pattern visually across all entity types
- Users see that provenance matters from day one
- Foundation for Commons trust layer later
- Schema is defined, just needs persistence wiring

---

### File Structure Updates

```
src/
├── lib/
│   └── workspace-state.ts       # NEW: Persistent state management
├── core/schema/
│   └── versioned-artifact.ts    # NEW: Versioning types
├── hooks/
│   └── useKeyboardNavigation.ts # NEW: Keyboard shortcuts
├── explore/
│   ├── LensInspector.tsx        # UPDATE: Add toggle action + provenance
│   ├── JourneyInspector.tsx     # NEW: Journey details + actions + provenance
│   └── ExploreChat.tsx          # UPDATE: Accept lens/journey context
├── cultivate/
│   └── SproutInspector.tsx      # NEW: Sprout details + capture context
└── shared/
    ├── Button.tsx               # NEW: Reusable button variants
    ├── Toggle.tsx               # From Sprint 3
    ├── Collapsible.tsx          # NEW: Expandable section
    ├── VersionBadge.tsx         # NEW: Version + status display
    └── EmptyState.tsx           # NEW: "No results" component
```

---

### Acceptance Criteria

**Lens Flow:**
- [ ] Click lens card → Inspector opens
- [ ] Toggle lens active → State persists to localStorage
- [ ] Active lens indicator shows current lens name
- [ ] Terminal uses active lens's system prompt
- [ ] Refresh page → Active lens persists

**Journey Flow:**
- [ ] Click journey card → Inspector shows progress
- [ ] "Start Journey" button → Sets journey active, navigates to Terminal
- [ ] Journey progress bar reflects current step
- [ ] "Continue" shows if journey is in progress
- [ ] "Reset" clears progress
- [ ] Progress persists across page refresh

**Sprout Flow:**
- [ ] Click sprout card → Inspector shows full content
- [ ] Delete button removes sprout (with confirmation)
- [ ] Promote button advances growth stage
- [ ] Inspector closes after delete

**Search:**
- [ ] Typing in search filters visible cards
- [ ] Filter is instant (no debounce needed for small lists)
- [ ] "No results" state shows when nothing matches
- [ ] Clearing search shows all items

**Keyboard:**
- [ ] ESC closes inspector
- [ ] ⌘K opens command palette
- [ ] ⌘1-4 jumps to sections

**Provenance (stub):**
- [ ] Each Inspector shows version badge (v1.0.0 · System default)
- [ ] Provenance section is collapsible
- [ ] "View JSON" button opens modal with artifact data
- [ ] Sprout Inspector shows capture context (lens, journey, timestamp)

---

### Testing Checklist

1. **Fresh state:** Clear localStorage, verify defaults work
2. **Persistence:** Set lens, refresh, verify it persists
3. **Journey progress:** Start journey, advance steps, refresh, verify progress
4. **Cross-view:** Set lens in Lenses view, navigate to Terminal, verify it's applied
5. **Delete flow:** Delete sprout, verify it's gone, verify Inspector closes
6. **Keyboard:** Test all shortcuts in various states

---

### Reference

- Sprint 3 deliverables: Visual system, collection controls, Inspector layout
- State patterns: Similar to existing `useSproutStorage` hook
- Lens data: `src/data/default-personas.ts`
- Journey data: `src/data/narratives.json`

**Start with Phase 1 (State Management), then wire each entity type. Test after each phase.**
