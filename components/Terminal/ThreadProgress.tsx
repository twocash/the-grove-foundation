// ThreadProgress - Shows journey progress with regenerate option
// Displays: "Step 2/5 in your journey" with progress dots and regenerate button

import React from 'react';
import { Card, Persona, getPersonaColors } from '../../data/narratives-schema';

interface ThreadProgressProps {
  currentThread: string[];
  currentPosition: number;
  persona: Persona | null;
  getThreadCard: (position: number) => Card | null;
  onRegenerate: () => void;
  onJumpToCard: (cardId: string) => void;
}

const ThreadProgress: React.FC<ThreadProgressProps> = ({
  currentThread,
  currentPosition,
  persona,
  getThreadCard,
  onRegenerate,
  onJumpToCard
}) => {
  if (!persona || currentThread.length === 0) {
    return null;
  }

  const colors = getPersonaColors(persona.color);
  const totalSteps = currentThread.length;
  const currentStep = currentPosition + 1;
  const isComplete = currentPosition >= totalSteps - 1;

  return (
    <div className="flex items-center justify-between px-3 py-2 bg-paper/50 border-b border-ink/5">
      {/* Progress info */}
      <div className="flex items-center space-x-3">
        <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted">
          Journey
        </span>

        {/* Progress dots */}
        <div className="flex items-center space-x-1">
          {currentThread.map((cardId, idx) => {
            const isVisited = idx < currentPosition;
            const isCurrent = idx === currentPosition;
            const card = getThreadCard(idx);

            return (
              <button
                key={cardId}
                onClick={() => onJumpToCard(cardId)}
                title={card?.label || cardId}
                className={`w-2 h-2 rounded-full transition-all ${
                  isCurrent
                    ? `${colors.dot} ring-2 ring-offset-1 ${colors.border}`
                    : isVisited
                    ? colors.dot
                    : 'bg-ink/20 hover:bg-ink/40'
                }`}
              />
            );
          })}
        </div>

        {/* Step counter */}
        <span className={`text-[10px] font-mono ${colors.text}`}>
          {isComplete ? (
            <span className="flex items-center space-x-1">
              <span>Complete</span>
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </span>
          ) : (
            `${currentStep}/${totalSteps}`
          )}
        </span>
      </div>

      {/* Regenerate button */}
      <button
        onClick={onRegenerate}
        className="flex items-center space-x-1 px-2 py-1 text-[9px] font-mono uppercase tracking-wider text-ink-muted hover:text-ink border border-transparent hover:border-ink/20 rounded transition-all group"
        title="Generate a new journey based on your persona"
      >
        <svg
          className="w-3 h-3 group-hover:rotate-180 transition-transform duration-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <span>New Journey</span>
      </button>
    </div>
  );
};

export default ThreadProgress;
