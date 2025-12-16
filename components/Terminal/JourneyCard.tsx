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
