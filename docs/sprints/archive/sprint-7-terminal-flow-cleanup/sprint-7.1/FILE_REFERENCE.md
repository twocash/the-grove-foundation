# Sprint 7.1: File Reference

Current contents of files to be modified.

---

## components/Terminal/WelcomeInterstitial.tsx (83 lines)

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
      {/* Header */}
      <div className="px-4 py-6 border-b border-ink/5">
        <div className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mb-2">
          THE GROVE TERMINAL [v2.5.0]
        </div>
        <div className="font-mono text-xs text-grove-forest mb-6">
          Connection established.
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
        <LensGrid
          personas={personas}
          customLenses={customLenses}
          onSelect={onSelect}
          onCreateCustomLens={onCreateCustomLens}
          onDeleteCustomLens={onDeleteCustomLens}
          showCreateOption={showCreateOption}
        />
      </div>

      {/* Footer */}
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

## components/Terminal/LensPicker.tsx (74 lines)

```tsx
// LensPicker - Lens switching for returning users
// v0.14.1: Minimal header with back button, dark mode support

import React from 'react';
import { Persona } from '../../data/narratives-schema';
import { CustomLens } from '../../types/lens';
import LensGrid from './LensGrid';

interface LensPickerProps {
  personas: Persona[];
  customLenses?: CustomLens[];
  onSelect: (personaId: string | null) => void;
  onClose?: () => void;
  onCreateCustomLens?: () => void;
  onDeleteCustomLens?: (id: string) => void;
  currentLens?: string | null;
  highlightedLens?: string | null;
  showCreateOption?: boolean;
}

const LensPicker: React.FC<LensPickerProps> = ({
  personas,
  customLenses = [],
  onSelect,
  onClose,
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
        {onClose ? (
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Chat
          </button>
        ) : (
          <div className="w-24" />
        )}
        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
          Switch Lens
        </span>
        <div className="w-24" />
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
    </div>
  );
};

export default LensPicker;
```

---

## src/workspace/NavigationSidebar.tsx - Key Sections

### Icon mapping (lines 11-20):
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
};
```

### Navigation tree - explore section (lines 23-31):
```typescript
explore: {
  id: 'explore',
  label: 'Explore',
  icon: 'compass',
  view: 'terminal',
  children: {
    nodes: { id: 'nodes', label: 'Nodes', icon: 'branch', view: 'node-grid' },
    journeys: { id: 'journeys', label: 'Journeys', icon: 'map', view: 'journey-list' },
    lenses: { id: 'lenses', label: 'Lenses', icon: 'glasses', view: 'lens-picker' },
  },
},
```
