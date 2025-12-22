# Sprint 7: File Reference

This document contains current file contents needed for implementation.

---

## 1. components/Terminal/JourneyCard.tsx (FULL - TO BE REDESIGNED)

```tsx
// JourneyCard - Shows current journey progress and next card
// Replaces the legacy "SUGGESTED INQUIRY" component

import React from 'react';
import { Card } from '../../data/narratives-schema';

interface JourneyCardProps {
  currentThread: string[];
  currentPosition: number;
  currentCard: Card | null;
  journeyTitle?: string;
  onResume: () => void;
  onExploreFreely?: () => void;
  isFirstCard?: boolean; // Whether this is the first card (position 0)
}

const JourneyCard: React.FC<JourneyCardProps> = ({
  currentThread,
  currentPosition,
  currentCard,
  journeyTitle = 'Your Journey',
  onResume,
  onExploreFreely,
  isFirstCard = false
}) => {
  const totalCards = currentThread.length;
  const progress = totalCards > 0 ? ((currentPosition) / totalCards) * 100 : 0;
  const cardsRemaining = totalCards - currentPosition;

  if (!currentCard || currentPosition >= totalCards) {
    return null;
  }

  return (
    <div className="mb-4 bg-white border border-ink/5 rounded-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 bg-ink/[0.02] border-b border-ink/5">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-bold uppercase tracking-widest text-grove-forest">
            Continue Your Journey
          </span>
          <span className="text-[9px] font-mono text-ink-muted">
            {currentPosition + 1}/{totalCards} cards
          </span>
        </div>
      </div>

      {/* Content */}
      <button
        onClick={onResume}
        className="w-full text-left p-4 hover:bg-ink/[0.01] transition-colors group"
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="font-sans font-semibold text-sm text-ink group-hover:text-grove-forest transition-colors">
              {journeyTitle}
            </div>
            <div className="font-serif text-xs text-ink-muted italic mt-1 group-hover:text-grove-forest/70 transition-colors line-clamp-2">
              "{currentCard.label}"
            </div>
          </div>
          <span className="text-xs font-semibold text-grove-forest bg-grove-forest/10 px-2 py-1 rounded ml-3 group-hover:bg-grove-forest group-hover:text-white transition-colors">
            {isFirstCard ? 'Ask the Grove' : 'Resume'}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 h-1.5 bg-ink/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-grove-forest rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-ink-muted">
            {cardsRemaining} {cardsRemaining === 1 ? 'card' : 'cards'} remaining
          </span>
        </div>
      </button>

      {/* Explore Freely Option */}
      {onExploreFreely && (
        <div className="px-4 py-2 border-t border-ink/5">
          <button
            onClick={onExploreFreely}
            className="text-[10px] text-ink-muted hover:text-grove-forest transition-colors"
          >
            Or explore freely below
          </button>
        </div>
      )}
    </div>
  );
};

export default JourneyCard;
```

---

## 2. components/Terminal/JourneyCompletion.tsx (FULL - NEEDS DARK MODE)

```tsx
// JourneyCompletion - Shows completion celebration and optional rating
// Displayed when user finishes all cards in a journey

import React, { useState } from 'react';

interface JourneyCompletionProps {
  journeyTitle: string;
  journeyId: string;
  personaId: string | null;
  completionTimeMinutes: number;
  onSubmit: (rating: number, feedback: string, sendToFoundation: boolean) => void;
  onSkip: () => void;
  showRating?: boolean;
  showFeedbackTransmission?: boolean;
}

const RATING_EMOJIS = [
  { value: 1, emoji: '😐', label: 'Okay' },
  { value: 2, emoji: '🙂', label: 'Good' },
  { value: 3, emoji: '😊', label: 'Great' },
  { value: 4, emoji: '🤩', label: 'Excellent' },
  { value: 5, emoji: '🤯', label: 'Mind-blown' }
];

const JourneyCompletion: React.FC<JourneyCompletionProps> = ({
  journeyTitle,
  journeyId,
  personaId,
  completionTimeMinutes,
  onSubmit,
  onSkip,
  showRating = true,
  showFeedbackTransmission = true
}) => {
  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [showConsent, setShowConsent] = useState(false);

  // ... (rest of component - see full file)
  
  return (
    <div className="p-6 bg-white border border-ink/10 rounded-lg shadow-sm">
      {/* Celebration Header */}
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">🎉</div>
        <h3 className="font-display text-xl text-ink">
          Journey Complete!
        </h3>
        <p className="text-sm text-ink-muted mt-1">
          {journeyTitle}
        </p>
      </div>
      {/* ... rating and feedback sections */}
    </div>
  );
};

export default JourneyCompletion;
```

---

## 3. components/Terminal/TerminalHeader.tsx (FULL - CURRENT STATE)

```tsx
// components/Terminal/TerminalHeader.tsx
// Clean "Your Grove" header with context selectors
// v0.13: Terminal Header Cleanup - moved pills from bottom to header

import React from 'react';
import { getPersonaColors } from '../../data/narratives-schema';

interface TerminalHeaderProps {
  onMenuClick?: () => void;
  onMinimize: () => void;
  onClose: () => void;
  isScholarMode: boolean;
  showMinimize?: boolean;
  // Context selectors
  fieldName?: string;
  lensName?: string;
  lensColor?: string;
  journeyName?: string;
  currentStreak?: number;
  showStreak?: boolean;
  onFieldClick?: () => void;
  onLensClick?: () => void;
  onJourneyClick?: () => void;
  onStreakClick?: () => void;
}

// Reusable pill button component
const HeaderPill: React.FC<{
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
}> = ({ label, onClick, icon, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled || !onClick}
    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium
      bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200
      border border-transparent hover:border-primary/30 dark:hover:border-primary/50
      transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {icon}
    <span className="truncate max-w-[100px]">{label}</span>
    {onClick && <span className="text-[9px] text-slate-400 dark:text-slate-500">▾</span>}
  </button>
);

const TerminalHeader: React.FC<TerminalHeaderProps> = ({
  onMenuClick,
  onMinimize,
  onClose,
  isScholarMode,
  showMinimize = true,
  fieldName,
  lensName,
  lensColor,
  journeyName,
  currentStreak,
  showStreak = true,
  onFieldClick,
  onLensClick,
  onJourneyClick,
  onStreakClick
}) => {
  const lensColors = lensColor ? getPersonaColors(lensColor) : null;

  return (
    <div className="px-4 py-2.5 border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark flex items-center gap-3">
      {/* Left: Menu + Title */}
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={onMenuClick} /* ... */ />
        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">Your Grove</span>
        {isScholarMode && /* badge */ }
      </div>

      {/* Center: Context Pills */}
      <div className="flex items-center gap-2 flex-1 min-w-0 justify-center">
        {lensName && <HeaderPill label={lensName} onClick={onLensClick} icon={/* dot */} />}
        {journeyName && <HeaderPill label={journeyName} onClick={onJourneyClick} disabled={!onJourneyClick} />}
      </div>

      {/* Right: Streak + Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Streak, minimize, close buttons */}
      </div>
    </div>
  );
};

export default TerminalHeader;
```

---

## 4. Terminal.tsx - Key Sections

### Header Usage (~line 1067-1081)
```tsx
<TerminalHeader
  onMinimize={handleMinimize}
  onClose={handleClose}
  isScholarMode={isVerboseMode}
  showMinimize={enableMinimize}
  // Context selectors
  lensName={activeLensData?.publicLabel || 'Choose Lens'}
  lensColor={activeLensData?.color}
  journeyName={currentThread.length > 0 ? 'Guided Journey' : 'Self-Guided'}  // <-- CHANGE THIS
  currentStreak={currentStreak}
  showStreak={showStreakDisplay}
  onLensClick={() => setShowLensPicker(true)}
  onStreakClick={() => setShowStatsModal(true)}
/>
```

### JourneyCard Usage (~line 1319-1342)
```tsx
) : currentThread.length > 0 && currentPosition < currentThread.length ? (
  /* Journey Progress Card - dynamically shows journey cards from schema */
  <JourneyCard
    currentThread={currentThread}
    currentPosition={currentPosition}
    currentCard={getThreadCard(currentPosition)}
    journeyTitle={activeLensData?.publicLabel ? `${activeLensData.publicLabel} Journey` : 'Your Journey'}
    isFirstCard={currentPosition === 0}
    onResume={() => {
      const card = getThreadCard(currentPosition);
      if (card) {
        handleSend(card.query, card.label, card.id);
        const nextCardId = advanceThread();
        if (nextCardId === null && currentPosition >= currentThread.length - 1) {
          setShowJourneyCompletion(true);
          recordJourneyCompleted();
          incrementJourneysCompleted();
        }
      }
    }}
    onExploreFreely={() => {}}
  />
) : null}
```

### JourneyCompletion Modal (~line 1412-1439)
```tsx
{/* Journey Completion Modal - MOVE THIS INLINE */}
{showJourneyCompletion && (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/30 backdrop-blur-sm">
    <div className="w-full max-w-md mx-4">
      <JourneyCompletion
        journeyTitle={completedJourneyTitle || (activeLensData?.publicLabel ? `${activeLensData.publicLabel} Journey` : 'Your Journey')}
        journeyId={`${session.activeLens || 'default'}-${Date.now()}`}
        personaId={session.activeLens}
        completionTimeMinutes={Math.round((Date.now() - journeyStartTime) / 60000)}
        showRating={showJourneyRatings}
        showFeedbackTransmission={showFeedbackTransmission}
        onSubmit={(rating, feedback, sendToFoundation) => {
          console.log('Journey feedback:', { rating, feedback, sendToFoundation });
          setShowJourneyCompletion(false);
          setCompletedJourneyTitle(null);
          if (shouldShowFounder && currentArchetypeId) {
            markFounderStoryShown();
          }
        }}
        onSkip={() => {
          setShowJourneyCompletion(false);
          setCompletedJourneyTitle(null);
        }}
      />
    </div>
  </div>
)}
```

---

## 5. src/explore/ExploreChat.tsx (CSS OVERRIDES)

```tsx
// CSS overrides to embed Terminal in workspace
<style>{`
  .explore-chat-container {
    position: relative;
    height: 100%;
    overflow: hidden;
  }

  /* Override Terminal's fixed positioning to embed it */
  .explore-chat-container > div {
    position: relative !important;
    inset: unset !important;
    width: 100% !important;
    height: 100% !important;
    transform: none !important;
    z-index: 1 !important;
  }

  /* Override background to match workspace theme */
  .explore-chat-container .bg-white {
    background: var(--grove-surface, #121a22) !important;
  }

  /* Override text colors for dark theme */
  .explore-chat-container .text-ink {
    color: var(--grove-text, #e2e8f0) !important;
  }
  // ... more overrides
`}</style>
```

---

## 6. hooks/useNarrativeEngine.ts - Journey Data

Check this file for how to get the active journey title. Look for:
- `currentThread` - array of card IDs
- `activeJourney` or similar - journey metadata
- Any function that returns journey title from thread

---

## Key State Variables Available

```typescript
// In Terminal.tsx
const currentThread: string[] = /* from useNarrativeEngine */;
const currentPosition: number = /* from useNarrativeEngine */;
const activeLensData: Persona | null = /* computed from session.activeLens */;
const getThreadCard: (position: number) => Card | null = /* from useNarrativeEngine */;
const showJourneyCompletion: boolean = /* local state */;
const completedJourneyTitle: string | null = /* local state */;

// Need to find or derive:
const activeJourney: Journey | null = /* need to look this up */;
```
