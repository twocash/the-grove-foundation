// src/surface/components/genesis/ActiveTree.tsx
// Active Grove: Interactive tree that triggers layout changes
// Sprint: active-grove-v1 - Epic 2
//
// Modes:
// - 'pulsing': Initial state, attracting attention with glow animation
// - 'stabilized': Terminal visible, waiting for user action
// - 'directional': Navigation unlocked, bouncing down arrow

import React, { useState, useCallback } from 'react';

type TreeMode = 'pulsing' | 'stabilized' | 'directional';

interface ActiveTreeProps {
  mode?: TreeMode;
  onClick: () => void;
  isLocked?: boolean;  // When true, clicking shows shake animation
  className?: string;
}

export const ActiveTree: React.FC<ActiveTreeProps> = ({
  mode = 'pulsing',
  onClick,
  isLocked = false,
  className = ''
}) => {
  const [isShaking, setIsShaking] = useState(false);

  const handleClick = useCallback(() => {
    if (isLocked) {
      // Trigger shake animation
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    } else {
      onClick();
    }
  }, [isLocked, onClick]);

  // Mode-based classes
  const getModeClasses = () => {
    switch (mode) {
      case 'pulsing':
        return 'active-tree-pulsing';
      case 'stabilized':
        return 'active-tree-stabilized';
      case 'directional':
        return 'active-tree-directional';
      default:
        return '';
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        group flex flex-col items-center gap-2
        text-ink-muted hover:text-grove-forest
        transition-colors focus:outline-none
        focus-visible:ring-2 focus-visible:ring-grove-forest focus-visible:ring-offset-2
        ${getModeClasses()}
        ${isShaking ? 'active-tree-shake' : ''}
        ${className}
      `}
      aria-label={
        mode === 'directional'
          ? 'Continue to next section'
          : mode === 'pulsing'
          ? 'Open the Terminal'
          : 'Waiting for lens selection'
      }
      aria-expanded={mode !== 'pulsing'}
    >
      {/* Tree/Seedling icon */}
      <span className={`text-2xl ${mode === 'pulsing' ? 'animate-float' : ''}`}>
        🌱
      </span>

      {/* Down arrow - only visible in directional mode */}
      {mode === 'directional' && (
        <svg
          className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity animate-bounce"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 14l-7 7m0 0l-7-7"
          />
        </svg>
      )}

      {/* Stabilized indicator - subtle glow ring */}
      {mode === 'stabilized' && (
        <span className="absolute -inset-2 rounded-full bg-grove-forest/10 animate-pulse" />
      )}
    </button>
  );
};

// Also export the legacy ScrollIndicator for backward compatibility
export const ScrollIndicator = ActiveTree;

export default ActiveTree;
