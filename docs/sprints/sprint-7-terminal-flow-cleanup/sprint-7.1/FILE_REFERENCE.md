# Sprint 7.1: File Reference (Revised)

## 1. components/Terminal/LensPicker.tsx (FULL - 71 lines)

```tsx
// LensPicker - Lens switching for returning users
// Shows when user clicks lens pill button in TerminalControls
// Uses LensGrid for shared lens rendering

import React from 'react';
import { Persona } from '../../data/narratives-schema';
import { CustomLens } from '../../types/lens';
import LensGrid from './LensGrid';

interface LensPickerProps {
  personas: Persona[];
  customLenses?: CustomLens[];
  onSelect: (personaId: string | null) => void;
  onCreateCustomLens?: () => void;
  onDeleteCustomLens?: (id: string) => void;
  currentLens?: string | null;
  highlightedLens?: string | null;  // v0.12e: URL lens to highlight
  showCreateOption?: boolean;
}

const LensPicker: React.FC<LensPickerProps> = ({
  personas,
  customLenses = [],
  onSelect,
  onCreateCustomLens,
  onDeleteCustomLens,
  currentLens,
  highlightedLens,
  showCreateOption = true
}) => {
  return (
    <div className="flex flex-col h-full">
      {/* Header - TO BE REPLACED */}
      <div className="px-4 py-6 border-b border-ink/5">
        <div className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mb-4">
          THE GROVE TERMINAL [v2.5.0]
        </div>
        <h2 className="font-display text-xl text-ink mb-2">
          Switch Lens
        </h2>
        <p className="font-serif text-sm text-ink-muted italic">
          Change your perspective on the subject matter.
        </p>
      </div>

      {/* Lens Selection */}
      <div className="flex-1 overflow-y-auto p-4">
        <LensGrid
          personas={personas}
          customLenses={customLenses}
          currentLens={currentLens}
          highlightedLens={highlightedLens}
          onSelect={onSelect}
          onCreateCustomLens={onCreateCustomLens}
          onDeleteCustomLens={onDeleteCustomLens}
          showCreateOption={showCreateOption}
        />
      </div>

      {/* Footer - TO BE REMOVED */}
      <div className="px-4 py-3 border-t border-ink/5 bg-paper/50">
        <p className="text-[10px] text-ink-muted text-center">
          Your current lens shapes how we explore topics together.
        </p>
      </div>
    </div>
  );
};

export default LensPicker;
```

---

## 2. components/Terminal/LensGrid.tsx (Key Sections)

### Interface (lines 138-150)
```tsx
interface LensGridProps {
  personas: Persona[];
  customLenses?: CustomLens[];
  currentLens?: string | null;
  highlightedLens?: string | null;
  onSelect: (personaId: string | null) => void;
  onCreateCustomLens?: () => void;
  onDeleteCustomLens?: (id: string) => void;
  showCreateOption?: boolean;
}
```

### Custom Lens Card (lines 172-210)
```tsx
<button
  onClick={() => onSelect(lens.id)}
  className={`w-full text-left p-4 rounded-lg border transition-all duration-200
    ${isSelected
      ? `${colors.bgLight} ${colors.border} border-2`
      : 'bg-white border-ink/10 hover:border-ink/20 hover:shadow-sm'  // NEEDS DARK MODE
    }`}
>
```

### Standard Lens Card (lines 236-260)
```tsx
<button
  key={persona.id}
  onClick={() => onSelect(persona.id)}
  className={`w-full text-left p-4 rounded-lg border transition-all duration-200 group relative
    ${isSelected
      ? `${colors.bgLight} ${colors.border} border-2`
      : isHighlighted
        ? `bg-grove-clay/5 border-grove-clay/40 border-2 ring-2 ring-grove-clay/20 ring-offset-1`
        : 'bg-white border-ink/10 hover:border-ink/20 hover:shadow-sm'  // NEEDS DARK MODE
    }`}
>
```

### Text Classes to Update
```tsx
// Current → Target
'text-ink' → 'text-slate-900 dark:text-slate-100'
'text-ink-muted' → 'text-slate-500 dark:text-slate-400'
'bg-white' → 'bg-white dark:bg-slate-800'
'border-ink/10' → 'border-slate-200 dark:border-slate-700'
'bg-ink/5' → 'bg-slate-100 dark:bg-slate-700'
'hover:border-ink/20' → 'hover:border-slate-300 dark:hover:border-slate-600'
```

---

## 3. components/Terminal.tsx - LensPicker Usage

### Current (~line 1054-1065)
```tsx
) : showLensPicker ? (
  <LensPicker
    personas={enabledPersonas}
    customLenses={customLenses}
    onSelect={handleLensSelect}
    onCreateCustomLens={handleCreateCustomLens}
    onDeleteCustomLens={handleDeleteCustomLens}
    currentLens={session.activeLens}
    highlightedLens={urlLensId}
    showCreateOption={showCustomLensInPicker}
  />
) : (
```

### handleLensSelect (~line 395-410)
```tsx
const handleLensSelect = (personaId: string | null) => {
  selectLens(personaId);
  setShowLensPicker(false);  // This closes the picker
  
  // Track lens activation
  if (personaId) {
    trackLensActivated(personaId, personaId.startsWith('custom-'));
    // ... more tracking
  }
};
```

---

## 4. src/explore/ExploreChat.tsx - CSS Overrides

### Current Override Rules (relevant ones)
```css
/* Override background to match workspace theme */
.explore-chat-container .bg-white {
  background: var(--grove-surface, #121a22) !important;
}

/* Override text colors for dark theme */
.explore-chat-container .text-ink {
  color: var(--grove-text, #e2e8f0) !important;
}

.explore-chat-container .text-ink-muted {
  color: var(--grove-text-muted, #94a3b8) !important;
}

/* Override border colors */
.explore-chat-container .border-ink\\/10,
.explore-chat-container .border-ink-border {
  border-color: var(--grove-border, #1e2a36) !important;
}
```

### Additional Rules Needed
```css
/* LensPicker footer background */
.explore-chat-container .bg-paper\\/50 {
  background: transparent !important;
}

/* Border for header/footer */
.explore-chat-container .border-ink\\/5 {
  border-color: var(--grove-border, #1e2a36) !important;
}
```

---

## 5. Design Tokens Reference

### CSS Variables (defined in globals.css)
```css
.grove-workspace {
  --grove-surface: #121a22;
  --grove-bg: #0a0f14;
  --grove-border: #1e2a36;
  --grove-text: #e2e8f0;
  --grove-text-muted: #94a3b8;
  --grove-text-dim: #64748b;
  --grove-accent: #00d4aa;
}
```

### Tailwind Equivalents
```
--grove-surface → slate-900 (#0f172a) or custom #121a22
--grove-border → slate-700 (#334155) or custom #1e2a36
--grove-text → slate-100 (#f1f5f9) or custom #e2e8f0
--grove-text-muted → slate-400 (#94a3b8)
```

---

## 6. Target LensPicker Structure

```tsx
const LensPicker: React.FC<LensPickerProps> = ({
  personas,
  customLenses = [],
  onSelect,
  onClose,  // NEW PROP
  onCreateCustomLens,
  onDeleteCustomLens,
  currentLens,
  highlightedLens,
  showCreateOption = true
}) => {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* Minimal Header with Back Button */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Chat
        </button>
        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
          Switch Lens
        </span>
        <div className="w-24" /> {/* Spacer */}
      </div>

      {/* Lens Selection - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4">
        <LensGrid
          personas={personas}
          customLenses={customLenses}
          currentLens={currentLens}
          highlightedLens={highlightedLens}
          onSelect={onSelect}
          onCreateCustomLens={onCreateCustomLens}
          onDeleteCustomLens={onDeleteCustomLens}
          showCreateOption={showCreateOption}
        />
      </div>
      
      {/* NO FOOTER */}
    </div>
  );
};
```
