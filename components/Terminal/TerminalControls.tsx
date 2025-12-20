// components/Terminal/TerminalControls.tsx
// Controls bar below input - lens badge, journey progress, streak
// v0.12: Part of Terminal UX modernization

import React from 'react';
import { Persona, getPersonaColors } from '../../data/narratives-schema';

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
  const colors = persona ? getPersonaColors(persona.color) : null;

  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-ink/5 bg-paper/50">
      {/* Lens Badge */}
      <button
        onClick={onSwitchLens}
        className="flex items-center space-x-2 group"
      >
        {persona ? (
          <>
            <span className={`w-2 h-2 rounded-full ${colors?.dot || 'bg-ink/30'}`} />
            <span className="text-[11px] font-sans font-medium text-ink">
              {persona.publicLabel}
            </span>
          </>
        ) : (
          <span className="text-[11px] font-sans text-ink-muted">
            Choose a lens
          </span>
        )}
        <span className="text-[9px] text-ink-muted group-hover:text-grove-forest transition-colors">
          ↔
        </span>
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
