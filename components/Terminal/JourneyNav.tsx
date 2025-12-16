// JourneyNav - Consolidated navigation bar for journey, lens, and streak display
// Elegant, minimal design that propels users toward insight through perspective configuration

import React from 'react';
import { Card, Persona, getPersonaColors } from '../../data/narratives-schema';

// Icon components
const RefreshIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const ChevronIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const FlameIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2c0-3.32-2.67-7.25-8-11.8zm0 18c-3.35 0-6-2.57-6-6.2 0-2.34 1.95-5.44 6-9.14 4.05 3.7 6 6.8 6 9.14 0 3.63-2.65 6.2-6 6.2z"/>
    <path d="M12 6c-2.67 2.28-4 4.36-4 5.9 0 2.12 1.64 3.9 4 3.9s4-1.78 4-3.9c0-1.54-1.33-3.62-4-5.9z"/>
  </svg>
);

interface JourneyNavProps {
  // Persona/Lens
  persona: Persona | null;
  onSwitchLens: () => void;

  // Journey thread
  currentThread: string[];
  currentPosition: number;
  getThreadCard: (position: number) => Card | null;
  onRegenerate: () => void;
  onJumpToCard: (cardId: string) => void;

  // Stats
  currentStreak: number;
  journeysCompleted: number;
  showStreak?: boolean;
}

const JourneyNav: React.FC<JourneyNavProps> = ({
  persona,
  onSwitchLens,
  currentThread,
  currentPosition,
  getThreadCard,
  onRegenerate,
  onJumpToCard,
  currentStreak,
  journeysCompleted,
  showStreak = true
}) => {
  const hasJourney = currentThread.length > 0 && persona;
  const colors = persona ? getPersonaColors(persona.color) : null;
  const totalSteps = currentThread.length;
  const isComplete = currentPosition >= totalSteps - 1 && totalSteps > 0;

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[#FBFBF9] border-b border-ink/5">
      {/* Left: Lens Badge */}
      <button
        onClick={onSwitchLens}
        className="flex items-center space-x-2 group"
      >
        {persona ? (
          <>
            <span
              className={`w-2 h-2 rounded-full ${colors?.dot || 'bg-ink/30'}`}
            />
            <span className="text-[11px] font-sans font-medium text-ink uppercase tracking-wide">
              {persona.publicLabel}
            </span>
          </>
        ) : (
          <span className="text-[11px] font-sans text-ink-muted uppercase tracking-wide">
            No Lens
          </span>
        )}
        <span className="text-[9px] text-ink-muted group-hover:text-ink transition-colors">
          [Switch]
        </span>
      </button>

      {/* Center: Journey Progress */}
      {hasJourney && (
        <div className="flex items-center space-x-3">
          <span className="text-[9px] font-mono uppercase tracking-wider text-ink-muted">
            Journey
          </span>

          {/* Progress dots - clickable */}
          <div className="flex items-center space-x-1">
            {currentThread.slice(0, 8).map((cardId, idx) => {
              const isVisited = idx < currentPosition;
              const isCurrent = idx === currentPosition;
              const card = getThreadCard(idx);

              return (
                <button
                  key={cardId}
                  onClick={() => onJumpToCard(cardId)}
                  title={card?.label || `Step ${idx + 1}`}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${
                    isCurrent
                      ? `${colors?.dot || 'bg-ink'} ring-1 ring-offset-1 ${colors?.border || 'ring-ink/30'}`
                      : isVisited
                      ? colors?.dot || 'bg-ink/60'
                      : 'bg-ink/15 hover:bg-ink/30'
                  }`}
                />
              );
            })}
            {totalSteps > 8 && (
              <span className="text-[8px] text-ink-muted">+{totalSteps - 8}</span>
            )}
          </div>

          {/* Step counter */}
          <span className={`text-[9px] font-mono ${colors?.text || 'text-ink-muted'}`}>
            {isComplete ? (
              <span className="flex items-center space-x-0.5">
                <span>Done</span>
                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </span>
            ) : (
              `${currentPosition + 1}/${totalSteps}`
            )}
          </span>

          {/* Regenerate button */}
          <button
            onClick={onRegenerate}
            className="flex items-center space-x-1 px-1.5 py-0.5 text-ink-muted hover:text-ink rounded transition-colors group"
            title="Start a new journey"
          >
            <span className="group-hover:rotate-180 transition-transform duration-300">
              <RefreshIcon />
            </span>
            <span className="text-[9px] font-mono uppercase tracking-wide">New</span>
          </button>
        </div>
      )}

      {/* Right: Streak Display */}
      {showStreak && (currentStreak > 0 || journeysCompleted > 0) && (
        <div className="flex items-center space-x-2 text-[10px] text-ink-muted">
          {currentStreak > 0 && (
            <div className="flex items-center space-x-1 text-[#D95D39]">
              <FlameIcon />
              <span className="font-mono">{currentStreak}d</span>
            </div>
          )}
          {journeysCompleted > 0 && (
            <span className="font-mono">{journeysCompleted} journeys</span>
          )}
        </div>
      )}

      {/* Fallback when no journey */}
      {!hasJourney && persona && (
        <button
          onClick={onRegenerate}
          className="flex items-center space-x-1.5 px-2 py-1 text-[10px] font-mono uppercase tracking-wide text-ink-muted hover:text-ink border border-transparent hover:border-ink/10 rounded transition-all"
        >
          <RefreshIcon />
          <span>Start Journey</span>
        </button>
      )}
    </div>
  );
};

export default JourneyNav;
