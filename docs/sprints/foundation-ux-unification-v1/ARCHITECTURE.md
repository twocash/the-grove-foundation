# Architecture: Grove Widget System

**Sprint:** foundation-ux-unification-v1
**Version:** 1.0
**Date:** December 21, 2025

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              GROVE WIDGET                                    │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  WidgetHeader                                                          │ │
│  │  [Logo] [Session Timer] [Sprout Count] [Mode Indicator]                │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                                                                        │ │
│  │                        CONTENT AREA                                    │ │
│  │                                                                        │ │
│  │   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                   │ │
│  │   │ ExploreView │  │ GardenView  │  │ChatPlacehld │  (one visible)    │ │
│  │   │             │  │             │  │             │                   │ │
│  │   │  Terminal   │  │  Sprouts    │  │ Coming Soon │                   │ │
│  │   │  content    │  │  by stage   │  │             │                   │ │
│  │   └─────────────┘  └─────────────┘  └─────────────┘                   │ │
│  │                                                                        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  WidgetInput                                                           │ │
│  │  [/ Type a message or command...]                           [⌘K]      │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  ModeToggle                                                            │ │
│  │  [Explore ──●──] [Garden ──○──] [Chat (Soon) ──○──]    [⚙] [?] [···]  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Directory Structure (Target State)

```
src/
├── core/                          # Pure TypeScript (unchanged)
│   ├── schema/
│   │   ├── widget.ts              # NEW: WidgetMode, WidgetState
│   │   └── sprout.ts              # Existing (unchanged)
│   └── ...

├── widget/                        # NEW: Grove Widget
│   ├── GroveWidget.tsx            # Main container
│   ├── WidgetUIContext.tsx        # State provider
│   ├── components/
│   │   ├── WidgetHeader.tsx       # Ambient status bar
│   │   ├── WidgetInput.tsx        # Command input adapter
│   │   ├── ModeToggle.tsx         # Footer mode switcher
│   │   └── CommandPalette.tsx     # Full-screen command picker
│   ├── views/
│   │   ├── ExploreView.tsx        # Wraps Terminal content
│   │   ├── GardenView.tsx         # Sprout gallery
│   │   └── ChatPlaceholder.tsx    # Coming soon
│   └── index.ts

├── garden/                        # NEW: Garden components
│   ├── SproutCard.tsx             # Individual sprout
│   ├── GrowthStageGroup.tsx       # Stage grouping
│   ├── KnowledgeCommonsPreview.tsx
│   └── GardenEmptyState.tsx

├── foundation/                    # Existing (enhanced)
│   ├── layout/                    # Existing
│   ├── components/
│   │   ├── DataPanel.tsx          # Existing
│   │   ├── GlowButton.tsx         # Existing
│   │   ├── MetricCard.tsx         # Existing
│   │   ├── ModuleLayout.tsx       # NEW: Console pattern
│   │   ├── CollectionGrid.tsx     # NEW: Grid pattern
│   │   └── Inspector.tsx          # NEW: Right drawer
│   ├── consoles/                  # Existing
│   └── ConsoleUIContext.tsx       # NEW: Inspector state

└── surface/                       # Existing (refactored)
    └── pages/
        └── SurfacePage.tsx        # Uses GroveWidget
```

---

## Type Definitions

### Widget Schema (`src/core/schema/widget.ts`)

```typescript
/**
 * Widget mode determines which content area is visible
 */
export type WidgetMode = 'explore' | 'garden' | 'chat';

/**
 * Inspector mode for right-drawer context
 */
export type InspectorMode =
  | 'none'
  | 'sprout'      // Viewing a Sprout's properties
  | 'node'        // Viewing a Node in journey
  | 'journey'     // Viewing a Journey
  | 'settings';   // Widget settings

/**
 * Widget session state for persistence
 */
export interface WidgetSession {
  mode: WidgetMode;
  sessionStartTime: string;  // ISO timestamp
  sproutCount: number;
  lastActivity: string;      // ISO timestamp
}

/**
 * Widget state for context provider
 */
export interface WidgetState {
  // Mode
  currentMode: WidgetMode;

  // Session
  sessionStartTime: Date;
  sproutCount: number;

  // Inspector
  inspectorMode: InspectorMode;
  inspectorEntityId: string | null;

  // Command palette
  isCommandPaletteOpen: boolean;
}

/**
 * Widget actions for context provider
 */
export interface WidgetActions {
  setMode: (mode: WidgetMode) => void;
  openInspector: (mode: InspectorMode, entityId: string) => void;
  closeInspector: () => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  incrementSproutCount: () => void;
}
```

---

## Context Architecture

### WidgetUIContext

```typescript
// src/widget/WidgetUIContext.tsx

interface WidgetUIContextType extends WidgetState, WidgetActions {}

const WidgetUIContext = createContext<WidgetUIContextType | null>(null);

export function WidgetUIProvider({ children }: { children: React.ReactNode }) {
  // Mode state
  const [currentMode, setCurrentMode] = useState<WidgetMode>('explore');

  // Session state
  const [sessionStartTime] = useState(() => new Date());
  const [sproutCount, setSproutCount] = useState(0);

  // Inspector state
  const [inspectorMode, setInspectorMode] = useState<InspectorMode>('none');
  const [inspectorEntityId, setInspectorEntityId] = useState<string | null>(null);

  // Command palette state
  const [isCommandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Load sprout count on mount
  useEffect(() => {
    const storage = useSproutStorage();
    setSproutCount(storage.getSprouts().length);
  }, []);

  // Actions
  const setMode = useCallback((mode: WidgetMode) => {
    setCurrentMode(mode);
    localStorage.setItem('grove-widget-mode', mode);
  }, []);

  const openInspector = useCallback((mode: InspectorMode, entityId: string) => {
    setInspectorMode(mode);
    setInspectorEntityId(entityId);
  }, []);

  const closeInspector = useCallback(() => {
    setInspectorMode('none');
    setInspectorEntityId(null);
  }, []);

  const openCommandPalette = useCallback(() => setCommandPaletteOpen(true), []);
  const closeCommandPalette = useCallback(() => setCommandPaletteOpen(false), []);
  const incrementSproutCount = useCallback(() => setSproutCount(c => c + 1), []);

  const value = {
    // State
    currentMode,
    sessionStartTime,
    sproutCount,
    inspectorMode,
    inspectorEntityId,
    isCommandPaletteOpen,
    // Actions
    setMode,
    openInspector,
    closeInspector,
    openCommandPalette,
    closeCommandPalette,
    incrementSproutCount,
  };

  return (
    <WidgetUIContext.Provider value={value}>
      {children}
    </WidgetUIContext.Provider>
  );
}

export function useWidgetUI() {
  const context = useContext(WidgetUIContext);
  if (!context) throw new Error('useWidgetUI must be used within WidgetUIProvider');
  return context;
}
```

---

## Component Specifications

### GroveWidget.tsx

```typescript
// src/widget/GroveWidget.tsx

interface GroveWidgetProps {
  initialMode?: WidgetMode;
}

export function GroveWidget({ initialMode = 'explore' }: GroveWidgetProps) {
  return (
    <WidgetUIProvider>
      <div className="grove-widget">
        <WidgetHeader />
        <WidgetContent />
        <WidgetInput />
        <ModeToggle />
        <CommandPalette />
      </div>
    </WidgetUIProvider>
  );
}

function WidgetContent() {
  const { currentMode } = useWidgetUI();

  return (
    <div className="widget-content">
      {currentMode === 'explore' && <ExploreView />}
      {currentMode === 'garden' && <GardenView />}
      {currentMode === 'chat' && <ChatPlaceholder />}
    </div>
  );
}
```

### WidgetHeader.tsx

```typescript
// src/widget/components/WidgetHeader.tsx

export function WidgetHeader() {
  const { sessionStartTime, sproutCount, currentMode } = useWidgetUI();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Date.now() - sessionStartTime.getTime();
      setElapsed(Math.floor(diff / 60000)); // minutes
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStartTime]);

  return (
    <header className="widget-header">
      <div className="widget-logo">
        <span className="text-grove-accent">🌳</span>
        <span>The Grove</span>
      </div>
      <div className="widget-status">
        <span className="session-timer">{elapsed}m</span>
        <span className="sprout-count">🌱 {sproutCount}</span>
        <span className="mode-indicator">◐ {modeLabel(currentMode)}</span>
      </div>
    </header>
  );
}

function modeLabel(mode: WidgetMode): string {
  switch (mode) {
    case 'explore': return 'Exploring';
    case 'garden': return 'Gardening';
    case 'chat': return 'Chatting';
  }
}
```

### ModeToggle.tsx

```typescript
// src/widget/components/ModeToggle.tsx

export function ModeToggle() {
  const { currentMode, setMode } = useWidgetUI();

  const modes: { id: WidgetMode; label: string; disabled?: boolean }[] = [
    { id: 'explore', label: 'Explore' },
    { id: 'garden', label: 'Garden' },
    { id: 'chat', label: 'Chat (Soon)', disabled: true },
  ];

  return (
    <footer className="widget-footer">
      <nav className="mode-toggle">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => !mode.disabled && setMode(mode.id)}
            className={cn(
              'mode-button',
              currentMode === mode.id && 'active',
              mode.disabled && 'disabled'
            )}
            disabled={mode.disabled}
          >
            <span className="mode-indicator">
              {currentMode === mode.id ? '●' : '○'}
            </span>
            <span>{mode.label}</span>
          </button>
        ))}
      </nav>
      <div className="widget-utils">
        <button className="util-button">⚙</button>
        <button className="util-button">?</button>
        <button className="util-button">···</button>
      </div>
    </footer>
  );
}
```

### CommandPalette.tsx

```typescript
// src/widget/components/CommandPalette.tsx

export function CommandPalette() {
  const { isCommandPaletteOpen, closeCommandPalette, setMode } = useWidgetUI();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus on open
  useEffect(() => {
    if (isCommandPaletteOpen) {
      inputRef.current?.focus();
    }
  }, [isCommandPaletteOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCommandPalette();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [closeCommandPalette]);

  if (!isCommandPaletteOpen) return null;

  const commands = getFilteredCommands(query);

  return (
    <div className="command-palette-overlay" onClick={closeCommandPalette}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a command..."
          className="command-input"
        />
        <ul className="command-list">
          {commands.map((cmd) => (
            <li key={cmd.id}>
              <button onClick={() => executeCommand(cmd, { setMode, closeCommandPalette })}>
                <span className="command-name">{cmd.name}</span>
                <span className="command-hint">{cmd.hint}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

---

## Data Flow

### Mode Switching

```
User clicks "Garden" in ModeToggle
    ↓
ModeToggle.onClick()
    ↓
setMode('garden')
    ↓
WidgetUIContext updates currentMode
    ↓
localStorage.setItem('grove-widget-mode', 'garden')
    ↓
WidgetContent re-renders
    ↓
GardenView becomes visible, ExploreView hidden
```

### Command Execution

```
User presses "/" key
    ↓
WidgetInput detects "/" prefix
    ↓
openCommandPalette()
    ↓
CommandPalette renders
    ↓
User types "garden"
    ↓
Filtered commands shown
    ↓
User selects /garden
    ↓
executeCommand({ id: 'garden', action: () => setMode('garden') })
    ↓
closeCommandPalette()
    ↓
Mode switches to Garden
```

### Sprout Capture

```
User in Explore mode, types "/sprout --tag=ratchet"
    ↓
CommandInput parses command
    ↓
sproutCommand.execute(context, '--tag=ratchet')
    ↓
context.captureSprout({ tags: ['ratchet'] })
    ↓
useSproutCapture.capture()
    ↓
useSproutStorage.addSprout(sprout)
    ↓
localStorage updated
    ↓
incrementSproutCount()
    ↓
WidgetHeader updates count
    ↓
Toast: "Sprout captured!"
```

---

## CSS Architecture

### Color Variables

```css
:root {
  /* Base */
  --grove-bg: #0a0f14;
  --grove-surface: #121a22;
  --grove-border: #1e2a36;

  /* Accent */
  --grove-accent: #00d4aa;
  --grove-accent-muted: #0a4a3a;

  /* Growth stages */
  --stage-tender: #7dd3c0;
  --stage-rooting: #4ade80;
  --stage-branching: #22c55e;
  --stage-hardened: #16a34a;
  --stage-grafted: #15803d;
  --stage-established: #166534;

  /* Text */
  --grove-text: #e2e8f0;
  --grove-text-muted: #94a3b8;
  --grove-text-dim: #64748b;

  /* Semantic */
  --grove-success: #22c55e;
  --grove-warning: #f59e0b;
  --grove-error: #ef4444;
}
```

### Component Classes

```css
.grove-widget {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--grove-bg);
  color: var(--grove-text);
}

.widget-header {
  display: flex;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid var(--grove-border);
}

.widget-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.widget-footer {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-top: 1px solid var(--grove-border);
}

.mode-toggle {
  display: flex;
  gap: 1rem;
}

.mode-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: transparent;
  border: none;
  color: var(--grove-text-muted);
  cursor: pointer;
  transition: color 200ms;
}

.mode-button.active {
  color: var(--grove-accent);
}

.mode-button.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

---

## Integration Points

### With Existing Terminal

```typescript
// ExploreView wraps existing Terminal
function ExploreView() {
  const { incrementSproutCount } = useWidgetUI();

  // Existing Terminal props
  const [terminalState, setTerminalState] = useState<TerminalState>({ ... });

  return (
    <Terminal
      activeSection="overview"
      terminalState={terminalState}
      setTerminalState={setTerminalState}
      onSproutCaptured={incrementSproutCount}
    />
  );
}
```

### With Sprout System

```typescript
// GardenView uses existing hooks
function GardenView() {
  const { getSprouts } = useSproutStorage();
  const sprouts = getSprouts();

  const sproutsByStage = useMemo(() =>
    groupByStage(sprouts), [sprouts]
  );

  return (
    <div className="garden-view">
      {Object.entries(sproutsByStage).map(([stage, items]) => (
        <GrowthStageGroup
          key={stage}
          stage={stage as GrowthStage}
          sprouts={items}
        />
      ))}
    </div>
  );
}
```

### With Command System

```typescript
// Extend command registry with mode commands
commandRegistry.register({
  id: 'explore',
  name: 'Explore',
  description: 'Enter exploration mode',
  aliases: ['/explore'],
  execute: (context) => {
    context.setMode?.('explore');
    return { type: 'action', action: 'mode-switched' };
  }
});
```

---

## Migration Path

### Phase 1: Shell (Week 1)
1. Create `src/widget/` directory
2. Implement WidgetUIContext
3. Implement GroveWidget shell
4. Create placeholder views
5. Wire up mode switching

### Phase 2: Garden (Week 2)
1. Extract GardenModal content to GardenView
2. Create SproutCard component
3. Implement GrowthStageGroup
4. Add empty state

### Phase 3: Explore (Week 3)
1. Create ExploreView wrapper
2. Move Terminal inside ExploreView
3. Add sprout callback integration

### Phase 4: Polish (Week 4)
1. Keyboard shortcuts
2. Animation polish
3. Accessibility audit

---

## Document History

| Date | Author | Changes |
|------|--------|---------|
| 2025-12-21 | Claude | Initial architecture |
