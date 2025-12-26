// LensBadge - Shows current lens in Terminal header with switch button
// Displays next to Scholar Mode badge
// Sprint: route-selection-flow-v1 - Added navigateOnClick for route-based selection

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Persona, getPersonaColors } from '../../data/narratives-schema';

interface LensBadgeProps {
  persona: Persona | null;
  onSwitchClick?: () => void;
  navigateOnClick?: boolean;
}

const LensBadge: React.FC<LensBadgeProps> = ({ persona, onSwitchClick, navigateOnClick }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (navigateOnClick) {
      navigate('/lenses?returnTo=/terminal&ctaLabel=Apply');
    } else if (onSwitchClick) {
      onSwitchClick();
    }
  };
  if (!persona) {
    // No lens selected
    return (
      <button
        onClick={handleClick}
        className="flex items-center space-x-2 px-2 py-1 rounded-full border border-ink/10 hover:border-ink/30 transition-colors group"
      >
        <span className="w-2 h-2 rounded-full bg-ink/30"></span>
        <span className="text-[9px] font-mono uppercase tracking-wider text-ink-muted group-hover:text-ink transition-colors">
          No Lens
        </span>
        <span className="text-[8px] text-ink/40 group-hover:text-ink/60">
          [Switch]
        </span>
      </button>
    );
  }

  const colors = getPersonaColors(persona.color);

  return (
    <button
      onClick={handleClick}
      className={`flex items-center space-x-2 px-2 py-1 rounded-full ${colors.bgLight} ${colors.border} border hover:shadow-sm transition-all group`}
    >
      <span className={`w-2 h-2 rounded-full ${colors.dot}`}></span>
      <span className={`text-[9px] font-mono uppercase tracking-wider ${colors.text}`}>
        {persona.publicLabel}
      </span>
      <span className="text-[8px] text-ink/40 group-hover:text-ink/60">
        [Switch]
      </span>
    </button>
  );
};

export default LensBadge;
