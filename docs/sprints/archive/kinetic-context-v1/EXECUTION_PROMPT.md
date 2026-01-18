# EXECUTION_PROMPT.md — kinetic-context-v1

## Context

You are implementing header context pills and personalized welcome for Kinetic Stream. This migrates Terminal's proven patterns to the new exploration interface. Users will be able to:
- See and change their current lens from the header
- See their engagement stage progression
- Get a personalized welcome with adaptive prompts

## Pre-Flight Checks

```bash
cd C:\GitHub\the-grove-foundation
git status  # Should be clean
npx tsc --noEmit  # Should pass
```

## Phase 1: Create KineticHeader

### File: `src/surface/components/KineticStream/KineticHeader.tsx` (NEW)

```typescript
// src/surface/components/KineticStream/KineticHeader.tsx
// Header with lens/journey context pills
// Sprint: kinetic-context-v1

import React from 'react';
import { getPersonaColors } from '../../../../data/narratives-schema';

const STAGE_DISPLAY: Record<string, { emoji: string; label: string }> = {
  ARRIVAL: { emoji: '👋', label: 'New' },
  ORIENTED: { emoji: '🧭', label: 'Orienting' },
  EXPLORING: { emoji: '🔍', label: 'Exploring' },
  ENGAGED: { emoji: '🌲', label: 'Engaged' },
};

export interface KineticHeaderProps {
  lensName?: string;
  lensColor?: string;
  onLensClick?: () => void;
  journeyName?: string;
  onJourneyClick?: () => void;
  stage?: string;
  exchangeCount?: number;
  currentStreak?: number;
  showStreak?: boolean;
  onStreakClick?: () => void;
}

const HeaderPill: React.FC<{
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  className?: string;
}> = ({ label, onClick, icon, className = '' }) => (
  <button
    onClick={onClick}
    disabled={!onClick}
    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium
      bg-[var(--glass-elevated)] text-[var(--glass-text-secondary)] 
      border border-[var(--glass-border)] 
      hover:border-[var(--neon-cyan)]/50 transition-colors 
      cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
      shrink-0 whitespace-nowrap ${className}`}
  >
    {icon}
    <span className="truncate max-w-[100px]">{label}</span>
    {onClick && <span className="text-[9px] text-[var(--glass-text-subtle)]">▾</span>}
  </button>
);

export const KineticHeader: React.FC<KineticHeaderProps> = ({
  lensName,
  lensColor,
  onLensClick,
  journeyName,
  onJourneyClick,
  stage,
  exchangeCount,
  currentStreak,
  showStreak = true,
  onStreakClick,
}) => {
  const lensColors = lensColor ? getPersonaColors(lensColor) : null;
  const stageInfo = stage ? STAGE_DISPLAY[stage] : null;

  return (
    <header className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--glass-border)] bg-[var(--glass-solid)]">
      {/* Left: Title + Stage */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-semibold text-sm text-[var(--glass-text-primary)]">
          Explore The Grove
        </span>
        {stageInfo && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-900/70 text-emerald-300 border border-emerald-500/50">
            <span>{stageInfo.emoji}</span>
            <span className="font-medium">{stageInfo.label}</span>
            {exchangeCount !== undefined && exchangeCount > 0 && (
              <span className="text-emerald-300/70">• {exchangeCount}</span>
            )}
          </span>
        )}
      </div>

      {/* Center: Context Pills */}
      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end mr-2">
        {lensName && (
          <HeaderPill
            label={lensName}
            onClick={onLensClick}
            icon={lensColors && <span className={`w-2 h-2 rounded-full ${lensColors.dot}`} />}
          />
        )}
        {journeyName && (
          <HeaderPill
            label={journeyName}
            onClick={onJourneyClick}
            className="hidden xl:flex"
          />
        )}
      </div>

      {/* Right: Streak */}
      <div className="flex items-center gap-2 shrink-0">
        {showStreak && currentStreak !== undefined && currentStreak > 0 && (
          <button
            onClick={onStreakClick}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[var(--neon-amber)] hover:bg-[var(--neon-amber)]/10 transition-colors"
          >
            <span className="text-sm">🔥</span>
            <span className="text-xs font-mono font-bold">{currentStreak}</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default KineticHeader;
```

## Phase 2: Create KineticWelcome

### File: `src/surface/components/KineticStream/KineticWelcome.tsx` (NEW)

```typescript
// src/surface/components/KineticStream/KineticWelcome.tsx
// Personalized welcome card with adaptive prompts
// Sprint: kinetic-context-v1

import React from 'react';
import type { TerminalWelcome } from '../../../core/schema/narrative';
import { GlassContainer } from './Stream/motion/GlassContainer';

const STAGE_LABELS: Record<string, { emoji: string; label: string }> = {
  ARRIVAL: { emoji: '👋', label: 'Getting Started' },
  ORIENTED: { emoji: '🧭', label: 'Orienting' },
  EXPLORING: { emoji: '🔍', label: 'Exploring' },
  ENGAGED: { emoji: '🌲', label: 'Engaged' },
};

export interface KineticWelcomeProps {
  content: TerminalWelcome;
  prompts?: Array<{ id: string; text: string; command?: string; journeyId?: string }>;
  stage?: string;
  exchangeCount?: number;
  onPromptClick: (prompt: string, command?: string, journeyId?: string) => void;
}

export const KineticWelcome: React.FC<KineticWelcomeProps> = ({
  content,
  prompts,
  stage = 'ARRIVAL',
  exchangeCount = 0,
  onPromptClick,
}) => {
  const stageInfo = STAGE_LABELS[stage] ?? STAGE_LABELS.ARRIVAL;

  const displayPrompts = prompts && prompts.length > 0
    ? prompts
    : content.prompts.map((text, i) => ({ id: `static-${i}`, text }));

  return (
    <GlassContainer
      intensity="elevated"
      variant="default"
      className="p-6"
    >
      {/* Stage indicator */}
      <div className="text-xs text-[var(--glass-text-subtle)] mb-3 flex items-center gap-2">
        <span>{stageInfo.emoji}</span>
        <span>{stageInfo.label}</span>
        {exchangeCount > 0 && (
          <span className="opacity-50">• {exchangeCount} exchanges</span>
        )}
      </div>

      {/* Heading */}
      <h2 className="text-xl font-semibold text-[var(--glass-text-primary)] mb-3">
        {content.heading}
      </h2>

      {/* Thesis */}
      <p className="text-[var(--glass-text-body)] mb-6 leading-relaxed">
        {content.thesis}
      </p>

      {/* Prompts */}
      <div className="space-y-2 mb-4">
        {displayPrompts.map((prompt) => (
          <button
            key={prompt.id}
            onClick={() => onPromptClick(prompt.text, prompt.command, prompt.journeyId)}
            className="w-full text-left px-4 py-3 rounded-lg 
              bg-[var(--glass-surface)]/50 border border-[var(--glass-border)]
              hover:bg-[var(--glass-surface)] hover:border-[var(--neon-cyan)]/30
              transition-colors group"
          >
            <span className="text-[var(--neon-cyan)] mr-2 group-hover:translate-x-1 inline-block transition-transform">→</span>
            <span className="text-[var(--glass-text-secondary)]">{prompt.text}</span>
          </button>
        ))}
      </div>

      {/* Footer */}
      {content.footer && (
        <p className="text-xs text-[var(--glass-text-subtle)]">
          {content.footer}
        </p>
      )}
    </GlassContainer>
  );
};

export default KineticWelcome;
```

## Phase 3: Update ExploreShell

### File: `src/surface/components/KineticStream/ExploreShell.tsx` (MODIFY)

This is the most significant change. You'll need to:

1. **Add imports at the top:**
```typescript
import { useState, useCallback, useMemo } from 'react';
import { KineticHeader } from './KineticHeader';
import { KineticWelcome } from './KineticWelcome';
import { useEngagement, useLensState, useJourneyState } from '../../../core/engagement';
import { useSuggestedPrompts } from '../../../../hooks/useSuggestedPrompts';
import { getTerminalWelcome, DEFAULT_TERMINAL_WELCOME } from '../../../data/quantum-content';
import { getPersona } from '../../../../data/default-personas';
import { getCanonicalJourney } from '../../../core/journey';
import LensPicker from '../../../../components/Terminal/LensPicker';
```

2. **Add context hooks inside the component:**
```typescript
// Engagement hooks
const { actor } = useEngagement();
const { lens, selectLens } = useLensState({ actor });
const { 
  journey, 
  isActive: isJourneyActive, 
  startJourney: engStartJourney,
} = useJourneyState({ actor });

// Derived lens data
const lensData = useMemo(() => lens ? getPersona(lens) : null, [lens]);

// Suggested prompts (will need schema passed in via props or context)
const { prompts: suggestedPrompts, stage } = useSuggestedPrompts({
  lensId: lens,
  lensName: lensData?.publicLabel,
  maxPrompts: 3,
});

// Welcome content
const welcomeContent = useMemo(() => 
  getTerminalWelcome(lens, undefined) || DEFAULT_TERMINAL_WELCOME,
  [lens]
);

// Overlay state
type OverlayType = 'none' | 'lens-picker' | 'journey-picker';
const [overlay, setOverlay] = useState<{ type: OverlayType }>({ type: 'none' });

// Exchange count
const exchangeCount = useMemo(() => 
  items.filter(i => i.type === 'query').length,
  [items]
);
```

3. **Add handlers:**
```typescript
const handleLensSelect = useCallback((personaId: string) => {
  selectLens(personaId);
  setOverlay({ type: 'none' });
  localStorage.setItem('grove-session-established', 'true');
}, [selectLens]);

const handlePromptClick = useCallback((prompt: string, command?: string, journeyId?: string) => {
  if (journeyId) {
    // Would need schema access - for now just submit prompt
    console.log('[KineticWelcome] Journey prompt clicked:', journeyId);
  }
  submit(command || prompt);
}, [submit]);
```

4. **Replace the header section (~line 84-89) with:**
```tsx
{/* Header with context pills */}
<KineticHeader
  lensName={lensData?.publicLabel || 'Choose Lens'}
  lensColor={lensData?.color}
  onLensClick={() => setOverlay({ type: 'lens-picker' })}
  journeyName={journey?.title || (isJourneyActive ? 'Guided' : 'Self-Guided')}
  onJourneyClick={() => setOverlay({ type: 'journey-picker' })}
  stage={stage}
  exchangeCount={exchangeCount}
/>
```

5. **Inside the main content area, before KineticRenderer, add:**
```tsx
{/* Welcome when no messages */}
{items.length === 0 && (
  <KineticWelcome
    content={welcomeContent}
    prompts={suggestedPrompts}
    stage={stage}
    exchangeCount={exchangeCount}
    onPromptClick={handlePromptClick}
  />
)}
```

6. **At the end of the component, before the closing div, add overlay:**
```tsx
{/* Lens Picker Overlay */}
{overlay.type === 'lens-picker' && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
    <div className="bg-[var(--glass-solid)] rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[80vh] overflow-auto">
      <LensPicker
        onSelect={handleLensSelect}
        onDismiss={() => setOverlay({ type: 'none' })}
        currentLens={lens || undefined}
      />
    </div>
  </div>
)}
```

## Phase 4: Update Index Exports

### File: `src/surface/components/KineticStream/index.ts` (MODIFY)

Add exports:
```typescript
export { KineticHeader } from './KineticHeader';
export type { KineticHeaderProps } from './KineticHeader';
export { KineticWelcome } from './KineticWelcome';
export type { KineticWelcomeProps } from './KineticWelcome';
```

## Verification

```bash
npx tsc --noEmit
npm run build
npm run dev
```

## Manual Testing

1. Navigate to Kinetic Stream page
2. Verify header shows "Choose Lens" pill
3. Click lens pill → LensPicker overlay opens
4. Select a lens → overlay closes, header updates
5. Verify welcome card shows lens-specific content
6. Click a prompt → query submits, welcome disappears
7. Verify stage indicator updates after exchanges

## Success Criteria

- [ ] KineticHeader renders with lens pill
- [ ] Clicking lens pill opens picker
- [ ] Selecting lens updates header
- [ ] KineticWelcome shows personalized content
- [ ] Prompts are clickable and functional
- [ ] Stage indicator progresses correctly
- [ ] TypeScript compiles clean

## Commit

```bash
git add .
git commit -m "feat(kinetic): add header context and personalized welcome

Sprint: kinetic-context-v1

- Create KineticHeader with lens/journey pills
- Create KineticWelcome with adaptive prompts
- Integrate engagement hooks into ExploreShell
- Add LensPicker overlay
- Support stage progression display"
```
