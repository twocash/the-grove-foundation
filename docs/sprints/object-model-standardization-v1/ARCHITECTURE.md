# Architecture — Object Model Standardization

## Target State

### Unified Object Model Pattern

```
┌─────────────────────────────────────────────────────────────────┐
│                        Card Grid                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                          │
│  │  Card   │  │  Card   │  │  Card   │  ← Click body: Inspect   │
│  │ [View]  │  │[Select] │  │ [Start] │  ← Click button: Activate │
│  └─────────┘  └─────────┘  └─────────┘                          │
│       │            │            │                                │
│       ▼            ▼            ▼                                │
│   openInspector  selectLens  startJourney                       │
│       +          closeInsp   closeInsp                          │
│   setInspected   navigateTo  navigateTo                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      Inspector Panel                             │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Details for selected item                                   ││
│  │                                                              ││
│  │  [Primary Action Button]  ← Same behavior as card button     ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow

```typescript
// 1. User clicks card body → Open inspector, highlight card
const handleView = (itemId: string) => {
  workspaceUI.openInspector({ type: 'lens', lensId: itemId });
  // Card derives isInspected from workspaceUI.inspector.mode.lensId
};

// 2. User clicks card button → Activate, close, navigate
const handleSelect = (itemId: string) => {
  selectLens(itemId);                    // Apply the selection
  workspaceUI.closeInspector();          // Close any open inspector
  workspaceUI.navigateTo(['explore']);   // Return to chat
};

// 3. User clicks inspector button → Same as #2
const handleActivate = () => {
  selectLens(itemId);
  closeInspector();
  navigateTo(['explore']);
};
```

### Component Props

```typescript
// LensCard
interface LensCardProps {
  persona: Persona;
  isActive: boolean;      // Currently applied lens
  isInspected: boolean;   // NEW: Inspector showing this card
  onSelect: () => void;   // Activate and close
  onView: () => void;     // Open inspector
}

// JourneyCard
interface JourneyCardProps {
  journey: Journey;
  isActive: boolean;
  isInspected: boolean;   // NEW
  onStart: () => void;
  onView: () => void;
}

// CustomLensCard (same pattern)
interface CustomLensCardProps {
  lens: CustomLens;
  isActive: boolean;
  isInspected: boolean;   // NEW
  onSelect: () => void;
  onView: () => void;
}
```

### Style Hierarchy

```typescript
// Card className logic
const cardClassName = cn(
  // Base styles
  "group cursor-pointer flex flex-col p-5 rounded-xl border transition-all text-left relative",
  
  // State-based styles (order matters: inspected > active > default)
  isInspected
    ? "ring-2 ring-primary border-primary"
    : isActive
      ? "border-primary/30 bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/20"
      : "border-border-light dark:border-border-dark hover:shadow-lg hover:border-primary/30"
);
```

### Button Styles

```typescript
// Primary action button (Select/Start)
const primaryButtonClass = cn(
  "px-4 py-1.5 text-xs font-medium rounded-md",
  "bg-primary text-white hover:bg-primary/90",
  "transition-colors shadow-sm"
);

// CustomLensCard uses violet variant
const violetButtonClass = cn(
  "px-4 py-1.5 text-xs font-medium rounded-md",
  "bg-violet-500 text-white hover:bg-violet-500/90",
  "transition-colors shadow-sm"
);
```

## File Organization

No new files required. Changes are surgical modifications to existing components:

```
src/explore/
├── LensPicker.tsx       # Fix handleSelect, add isInspected derivation and prop passing
├── LensInspector.tsx    # Fix button to use handleActivate with closeInspector
├── JourneyList.tsx      # Fix handleStart, add isInspected derivation and prop passing
└── JourneyInspector.tsx # No changes (reference implementation)
```

## API Contracts

### WorkspaceUIContext (unchanged)

```typescript
// These methods already exist and work correctly
interface WorkspaceUI {
  inspector: {
    isOpen: boolean;
    mode: {
      type: 'lens' | 'journey' | 'none';
      lensId?: string;
      journeyId?: string;
    };
  };
  openInspector: (mode: InspectorMode) => void;
  closeInspector: () => void;
  navigateTo: (path: string[]) => void;
}
```

No changes to the context API—only how consumers use it.

## Rollback Plan

If issues arise:
1. Revert changes to the four files
2. The changes are isolated to selection/inspection flow
3. No schema changes, no new dependencies
4. Can be reverted without affecting other features
