# Sprint 7.2: File Reference

Current state of files to be modified.

---

## src/explore/LensPicker.tsx

**Key sections to change:**

### LensCardProps (line ~109)
```tsx
interface LensCardProps {
  persona: Persona;
  isActive: boolean;
  onSelect: () => void;  // ADD: onView: () => void;
}
```

### LensCard component (lines ~113-149)
Currently a `<button>` that combines select + view. Needs to be `<div>` with separate button.

### handleSelect function (line ~165)
```tsx
const handleSelect = (personaId: string) => {
  selectLens(personaId);
  openInspector({ type: 'lens', lensId: personaId });
};
// ADD: handleView function
```

### Grid mapping (line ~195)
```tsx
<LensCard
  key={persona.id}
  persona={persona}
  isActive={activeLensId === persona.id}
  onSelect={() => handleSelect(persona.id)}
  // ADD: onView={() => handleView(persona.id)}
/>
```

---

## src/workspace/NavigationSidebar.tsx

### Icon mappings (lines 9-20)
```typescript
const iconNameToSymbol: Record<string, string> = {
  compass: 'explore',
  sprout: 'eco',
  users: 'groups',
  zap: 'bolt',
  message: 'chat_bubble',
  branch: 'account_tree',
  map: 'map',
  glasses: 'eyeglasses',
  code: 'code',
  bot: 'smart_toy',
  // ADD: forest: 'forest',
  // ADD: add_circle: 'add_circle_outline',
};
```

### Navigation tree - explore (lines 23-32)
```typescript
// CURRENT:
explore: {
  id: 'explore',
  label: 'Explore',
  icon: 'compass',
  view: 'terminal',  // <-- REMOVE view from here
  children: {
    nodes: { id: 'nodes', label: 'Nodes', icon: 'branch', view: 'node-grid' },
    journeys: { id: 'journeys', label: 'Journeys', icon: 'map', view: 'journey-list' },
    lenses: { id: 'lenses', label: 'Lenses', icon: 'glasses', view: 'lens-picker' },
  },
},

// TARGET:
explore: {
  id: 'explore',
  label: 'Explore',
  icon: 'compass',
  // No view - just a container
  children: {
    groveProject: {
      id: 'groveProject',
      label: 'Grove Project',
      icon: 'forest',
      view: 'terminal',  // View moves here
      children: {
        nodes: { ... },
        journeys: { ... },
        lenses: { ... },
      },
    },
    addField: {
      id: 'addField',
      label: '+ Fields',
      icon: 'add_circle',
      comingSoon: true,
    },
  },
},
```

---

## Reference: JourneyCard Pattern (src/explore/JourneyList.tsx)

```tsx
function JourneyCard({ journey, isActive, onStart, onView }: JourneyCardProps) {
  return (
    <div
      className={`...card styling...`}
      onClick={onView}  // Click card → inspector
    >
      {/* Content */}
      
      <div className="flex items-center justify-between">
        {/* Left: metadata */}
        <div>...</div>
        
        {/* Right: Start button */}
        <div className="flex items-center gap-2">
          {!isActive && (
            <button
              onClick={(e) => {
                e.stopPropagation();  // Don't trigger card click
                onStart();            // Take action
              }}
              className="..."
            >
              <span>play_arrow</span>
              Start
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

This is the pattern LensCard should follow.
