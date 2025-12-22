# Terminal Header Cleanup - File Reference

This document contains the current state of all files needed for implementation.

---

## 1. components/Terminal/TerminalHeader.tsx

**Purpose:** Header bar with title and window controls
**Action:** ADD Field/Lens/Journey pills and Streak icon

```tsx
// components/Terminal/TerminalHeader.tsx
// Clean "Your Grove" header with minimize capability
// v0.12: Part of Terminal UX modernization

import React from 'react';

interface TerminalHeaderProps {
  onMenuClick?: () => void;
  onMinimize: () => void;
  onClose: () => void;
  isScholarMode: boolean;
  showMinimize?: boolean;
}

const TerminalHeader: React.FC<TerminalHeaderProps> = ({
  onMenuClick,
  onMinimize,
  onClose,
  isScholarMode,
  showMinimize = true
}) => {
  return (
    <div className="px-4 py-3 border-b border-ink/5 bg-white flex items-center justify-between">
      {/* Menu button (placeholder for future settings) */}
      <button
        onClick={onMenuClick}
        className="p-1 text-ink-muted hover:text-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!onMenuClick}
        aria-label="Menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Title */}
      <div className="flex items-center space-x-2">
        <span className="font-display font-bold text-base text-ink">Your Grove</span>
        {isScholarMode && (
          <span className="bg-grove-clay text-white px-2 py-0.5 rounded-full text-[8px] font-bold tracking-widest uppercase">
            Scholar
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center space-x-1">
        {/* Minimize button */}
        {showMinimize && (
          <button
            onClick={onMinimize}
            className="p-1 text-ink-muted hover:text-ink transition-colors"
            aria-label="Minimize"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="p-1 text-ink-muted hover:text-ink transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TerminalHeader;
```

---

## 2. components/Terminal/TerminalControls.tsx

**Purpose:** Bottom controls bar with lens badge, journey progress, streak
**Action:** REMOVE lens badge and streak (keep only if needed for journey progress)

```tsx
// components/Terminal/TerminalControls.tsx
// Controls bar below input - lens badge, journey progress, streak
// v0.12c: Lens selector redesigned as pill button [🔎 Lens Name ▾]

import React from 'react';
import { Persona } from '../../data/narratives-schema';

interface TerminalControlsProps {
  persona: Persona | null;
  onSwitchLens: () => void;
  currentPosition: number;
  totalSteps: number;
  currentStreak: number;
  showStreak: boolean;
  showJourney: boolean;
}

const TerminalControls: React.FC<TerminalControlsProps> = ({
  persona,
  onSwitchLens,
  currentPosition,
  totalSteps,
  currentStreak,
  showStreak,
  showJourney
}) => {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-ink/5 bg-paper/50">
      {/* Lens Selector Pill */}
      <button
        onClick={onSwitchLens}
        className="flex items-center space-x-1.5 px-3 py-1 border border-ink/20 rounded-full hover:border-grove-forest hover:text-grove-forest transition-colors"
      >
        <span className="text-xs">🔎</span>
        <span className="text-[11px] font-sans font-medium text-ink">
          {persona?.publicLabel || 'Choose Lens'}
        </span>
        <span className="text-[9px] text-ink-muted">▾</span>
      </button>

      {/* Journey Progress */}
      {showJourney && totalSteps > 0 && (
        <span className="text-[10px] font-mono text-ink-muted">
          Step {currentPosition + 1}/{totalSteps}
        </span>
      )}

      {/* Streak */}
      {showStreak && currentStreak > 0 && (
        <div className="flex items-center space-x-1 text-grove-clay">
          <span className="text-xs">🔥</span>
          <span className="text-[10px] font-mono font-bold">{currentStreak}</span>
        </div>
      )}
    </div>
  );
};

export default TerminalControls;
```

---

## 3. components/Terminal.tsx (Relevant Sections)

**Purpose:** Main Terminal component
**Action:** Pass new props to header, clean up bottom area

### Section: Header Usage (~line 1070)

```tsx
{/* Header - Clean title bar with minimize/close */}
<TerminalHeader
  onMinimize={handleMinimize}
  onClose={handleClose}
  isScholarMode={isVerboseMode}
  showMinimize={enableMinimize}
/>
```

### Section: Bottom Controls (~line 1375-1390)

```tsx
{/* Controls below input - shows when feature flag enabled */}
{enableControlsBelow && (
  <TerminalControls
    persona={activeLensData}
    onSwitchLens={() => setShowLensPicker(true)}
    currentPosition={currentPosition}
    totalSteps={currentThread.length}
    currentStreak={currentStreak}
    showStreak={showStreakDisplay}
    showJourney={currentThread.length > 0}
  />
)}
```

### Section: Scholar Mode Toggle (~line 1340-1355)

```tsx
<div className="flex items-center space-x-3 mb-4">
  {/* PRESERVED: Verbose Toggle - Wax Seal Style - exact same implementation */}
  <button
    onClick={toggleVerboseMode}
    className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all ${isVerboseMode
        ? 'bg-grove-clay text-white shadow-sm'
        : 'bg-transparent text-ink-muted border border-ink/10 hover:border-grove-clay hover:text-grove-clay'
      }`}
  >
    {isVerboseMode ? 'Scholar Mode: ON' : 'Enable Scholar Mode'}
  </button>
  {currentTopic && <span className="text-[10px] font-mono text-ink-muted">Ref: {currentTopic}</span>}
</div>
```

---

## 4. data/narratives-schema.ts (Reference)

**Purpose:** Persona colors helper function
**Action:** USE for lens color dots

```typescript
// Persona color palette - for lens dots in header
export function getPersonaColors(color?: string): {
  bg: string;
  text: string;
  border: string;
  dot: string;
} {
  const colors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    red: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', dot: 'bg-red-500' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', dot: 'bg-blue-500' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', dot: 'bg-green-500' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', dot: 'bg-amber-500' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', dot: 'bg-purple-500' },
    slate: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-500' },
  };
  return colors[color || 'slate'] || colors.slate;
}
```

---

## 5. CSS Variables Reference

**Location:** `src/index.css` or Tailwind config

```css
:root {
  --grove-bg: #0a0f14;
  --grove-surface: #121a22;
  --grove-border: #1e2a36;
  --grove-text: #e2e8f0;
  --grove-text-muted: #94a3b8;
  --grove-text-dim: #64748b;
  --grove-accent: #00d4aa;
}
```

---

## Key State Variables in Terminal.tsx

These are available in the Terminal component and can be passed to header:

```typescript
// Lens
const activeLensData = /* Persona object or null */;
const session.activeLens = /* lens ID string */;

// Journey
const activeJourneyId = /* string or null */;
const getJourney = (id: string) => Journey | undefined;

// Streak
const currentStreak = /* number */;
const showStreakDisplay = /* boolean from feature flag */;

// Scholar Mode
const isVerboseMode = /* boolean */;
const toggleVerboseMode = /* function */;

// Modal handlers
const setShowLensPicker = /* function */;
const setShowStatsModal = /* function */;
```
