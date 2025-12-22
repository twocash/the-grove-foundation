// JourneyCard - Minimal journey prompt showing next card suggestion
// v0.14: Simplified - context now lives in header, just show the prompt
// Removed: journeyTitle, progress bar, explore freely option

import React from 'react';
import { Card } from '../../data/narratives-schema';

interface JourneyCardProps {
  currentPosition: number;
  totalCards: number;
  currentCard: Card | null;
  onResume: () => void;
}

const JourneyCard: React.FC<JourneyCardProps> = ({
  currentPosition,
  totalCards,
  currentCard,
  onResume,
}) => {
  if (!currentCard || currentPosition >= totalCards) {
    return null;
  }

  return (
    <div className="mb-4">
      {/* Minimal header */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
          Continue the Journey
        </span>
        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
          {currentPosition + 1}/{totalCards}
        </span>
      </div>

      {/* Single suggestion chip */}
      <button
        onClick={onResume}
        className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700
          bg-slate-50 dark:bg-slate-800/50 hover:border-primary hover:bg-primary/5
          dark:hover:bg-primary/10 transition-all group"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-700 dark:text-slate-200 group-hover:text-primary transition-colors">
            {currentCard.label}
          </span>
          <span className="text-slate-400 group-hover:text-primary transition-colors">→</span>
        </div>
      </button>
    </div>
  );
};

export default JourneyCard;
