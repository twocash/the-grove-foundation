# Sprint 7.2: File Reference

Current state of files to be modified (post Sprint 7.1).

---

## components/Terminal/WelcomeInterstitial.tsx

**Issues to fix:**
- Lines 36-42: Legacy "THE GROVE TERMINAL [v2.5.0]" header
- No max-width constraint
- Uses `text-ink`, `text-ink-muted`, `border-ink/5` (not dark mode)
- Footer uses `bg-paper/50`

```tsx
// WelcomeInterstitial - First-open experience for new Terminal users
// Shows welcome copy + lens selection to establish product context

import React from 'react';
import { Persona } from '../../data/narratives-schema';
import { CustomLens } from '../../types/lens';
import LensGrid from './LensGrid';

interface WelcomeInterstitialProps {
  personas: Persona[];
  customLenses?: CustomLens[];
  onSelect: (personaId: string | null) => void;
  onCreateCustomLens?: () => void;
  onDeleteCustomLens?: (id: string) => void;
  showCreateOption?: boolean;
}

const WELCOME_COPY = `Welcome to The Grove.

You're inside the Terminal — engaging with your own personal AI. In this demo, we explore complex ideas through conversation. Everything written about The Grove Foundation is indexed here.

Choose a lens to shape how we explore the subject matter in a way most relevant to you. Each lens emphasizes different aspects of this groundbreaking initiative. You can switch lenses anytime in your journey. And we recommend it!`;

const WelcomeInterstitial: React.FC<WelcomeInterstitialProps> = ({
  personas,
  customLenses = [],
  onSelect,
  onCreateCustomLens,
  onDeleteCustomLens,
  showCreateOption = true
}) => {
  return (
    <div className="flex flex-col h-full">
      {/* Header - REMOVE LEGACY TERMINAL BRANDING */}
      <div className="px-4 py-6 border-b border-ink/5">
        <div className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mb-2">
          THE GROVE TERMINAL [v2.5.0]   {/* <-- REMOVE */}
        </div>
        <div className="font-mono text-xs text-grove-forest mb-6">
          Connection established.   {/* <-- REMOVE */}
        </div>

        {/* Welcome Copy */}
        <div className="space-y-4">
          {WELCOME_COPY.split('\n\n').map((paragraph, i) => (
            <p key={i} className={`font-serif text-sm leading-relaxed ${i === 0 ? 'text-ink font-medium' : 'text-ink-muted'}`}>
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      {/* Section Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
          Select Your Starting Lens
        </div>
      </div>

      {/* Lens Grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <LensGrid ... />
      </div>

      {/* Footer - UPDATE OR REMOVE */}
      <div className="px-4 py-3 border-t border-ink/5 bg-paper/50">
        <p className="text-[10px] text-ink-muted text-center">
          You can switch lenses anytime by clicking on your lens in the Terminal.
        </p>
      </div>
    </div>
  );
};

export default WelcomeInterstitial;
```

---

## components/Terminal/LensPicker.tsx

**Issues to fix:**
- `bg-white dark:bg-slate-900` on outer div (should be transparent)
- No max-width constraint

```tsx
// LensPicker - Lens switching for returning users
// v0.14.1: Minimal header with back button, dark mode support

import React from 'react';
import { Persona } from '../../data/narratives-schema';
import { CustomLens } from '../../types/lens';
import LensGrid from './LensGrid';

// ... props interface ...

const LensPicker: React.FC<LensPickerProps> = ({ ... }) => {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900">  {/* <-- CHANGE TO bg-transparent */}
      {/* Minimal Header with Back Button */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        {/* ... header content ... */}
      </div>

      {/* Lens Selection */}
      <div className="flex-1 overflow-y-auto p-4">
        <LensGrid ... />
      </div>
    </div>
  );
};

export default LensPicker;
```

---

## src/workspace/NavigationSidebar.tsx

**Current structure to change:**

```tsx
// Icon mapping (lines 9-20)
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

// Navigation tree - explore section (lines 23-32)
const navigationTree: Record<string, NavItem> = {
  explore: {
    id: 'explore',
    label: 'Explore',
    icon: 'compass',
    view: 'terminal',  // <-- REMOVE view from here
    children: {
      // CHANGE: Nest under groveProject
      nodes: { id: 'nodes', label: 'Nodes', icon: 'branch', view: 'node-grid' },
      journeys: { id: 'journeys', label: 'Journeys', icon: 'map', view: 'journey-list' },
      lenses: { id: 'lenses', label: 'Lenses', icon: 'glasses', view: 'lens-picker' },
    },
  },
  // ... rest unchanged
};
```

**Target structure:**

```tsx
explore: {
  id: 'explore',
  label: 'Explore',
  icon: 'compass',
  // NO view here - just a container
  children: {
    groveProject: {
      id: 'groveProject',
      label: 'Grove Project',
      icon: 'forest',
      view: 'terminal',  // Click shows Terminal
      children: {
        nodes: { id: 'nodes', label: 'Nodes', icon: 'branch', view: 'node-grid' },
        journeys: { id: 'journeys', label: 'Journeys', icon: 'map', view: 'journey-list' },
        lenses: { id: 'lenses', label: 'Lenses', icon: 'glasses', view: 'lens-picker' },
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
