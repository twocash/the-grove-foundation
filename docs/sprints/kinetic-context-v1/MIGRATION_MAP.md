# MIGRATION_MAP.md — kinetic-context-v1

## Phase 1: KineticHeader Component

### File: `src/surface/components/KineticStream/KineticHeader.tsx` (CREATE)

```typescript
// src/surface/components/KineticStream/KineticHeader.tsx
// Header with lens/journey context pills
// Sprint: kinetic-context-v1

import React from 'react';
import { getPersonaColors } from '@data/narratives-schema';

const STAGE_DISPLAY: Record<string, { emoji: string; label: string }> = {
  ARRIVAL: { emoji: '👋', label: 'New' },
  ORIENTED: { emoji: '🧭', label: 'Orienting' },
  EXPLORING: { emoji: '🔍', label: 'Exploring' },
  ENGAGED: { emoji: '🌲', label: 'Engaged' },
};

export interface KineticHeaderProps {
  // Lens
  lensName?: string;
  lensColor?: string;
  onLensClick?: () => void;
  // Journey
  journeyName?: string;
  onJourneyClick?: () => void;
  // Stage
  stage?: string;
  exchangeCount?: number;
  // Streak
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

---

## Phase 2: KineticWelcome Component

### File: `src/surface/components/KineticStream/KineticWelcome.tsx` (CREATE)

```typescript
// src/surface/components/KineticStream/KineticWelcome.tsx
// Personalized welcome card with adaptive prompts
// Sprint: kinetic-context-v1

import React from 'react';
import type { TerminalWelcome } from '@core/schema/narrative';
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

  // Use provided prompts or fall back to content.prompts
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

---

## Phase 3: ExploreShell Integration

### File: `src/surface/components/KineticStream/ExploreShell.tsx` (MODIFY)

**Add imports:**
```typescript
import { KineticHeader } from './KineticHeader';
import { KineticWelcome } from './KineticWelcome';
import { useEngagement, useLensState, useJourneyState } from '@core/engagement';
import { useSuggestedPrompts } from '@hooks/useSuggestedPrompts';
import { getTerminalWelcome } from '@data/quantum-content';
import { getPersona } from '@data/default-personas';
import { getCanonicalJourney } from '@core/journey';
import { LensPicker } from '@components/Terminal/LensPicker';  // Reuse Terminal's picker
```

**Add state and hooks inside component:**
```typescript
// Engagement hooks
const { actor } = useEngagement();
const { lens, selectLens } = useLensState({ actor });
const { 
  journey, 
  isActive: isJourneyActive, 
  startJourney: engStartJourney,
  exitJourney 
} = useJourneyState({ actor });

// Derived lens data
const lensData = lens ? getPersona(lens) : null;

// Suggested prompts
const { prompts: suggestedPrompts, stage, refreshPrompts } = useSuggestedPrompts({
  lensId: lens,
  lensName: lensData?.publicLabel,
  maxPrompts: 3,
});

// Welcome content
const welcomeContent = getTerminalWelcome(lens, schema?.lensRealities);

// Overlay state
type OverlayType = 'none' | 'lens-picker' | 'journey-picker';
const [overlay, setOverlay] = useState<{ type: OverlayType }>({ type: 'none' });

// Exchange count (from items)
const exchangeCount = items.filter(i => i.type === 'query').length;
```

**Add handlers:**
```typescript
const handleLensSelect = (personaId: string) => {
  selectLens(personaId);
  setOverlay({ type: 'none' });
  localStorage.setItem('grove-session-established', 'true');
};

const handlePromptClick = (prompt: string, command?: string, journeyId?: string) => {
  if (journeyId) {
    const journey = getCanonicalJourney(journeyId, schema);
    if (journey) {
      engStartJourney(journey);
    }
  }
  submit(command || prompt);
};
```

**Replace header JSX:**
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

**Add welcome before renderer:**
```tsx
{/* Welcome when no messages */}
{items.length === 0 && lens && (
  <KineticWelcome
    content={welcomeContent}
    prompts={suggestedPrompts}
    stage={stage}
    exchangeCount={exchangeCount}
    onPromptClick={handlePromptClick}
  />
)}
```

**Add overlay rendering:**
```tsx
{/* Overlays */}
{overlay.type === 'lens-picker' && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div className="bg-[var(--glass-solid)] rounded-lg shadow-xl max-w-md w-full mx-4">
      <LensPicker
        onSelect={handleLensSelect}
        onDismiss={() => setOverlay({ type: 'none' })}
        currentLens={lens}
      />
    </div>
  </div>
)}
```

---

## Phase 4: Index Exports

### File: `src/surface/components/KineticStream/index.ts` (MODIFY)

Add exports:
```typescript
export { KineticHeader } from './KineticHeader';
export { KineticWelcome } from './KineticWelcome';
```

---

## Rollback Plan

```bash
# Delete created files
rm src/surface/components/KineticStream/KineticHeader.tsx
rm src/surface/components/KineticStream/KineticWelcome.tsx

# Revert modified files
git checkout -- src/surface/components/KineticStream/ExploreShell.tsx
git checkout -- src/surface/components/KineticStream/index.ts
```
