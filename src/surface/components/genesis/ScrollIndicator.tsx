// ScrollIndicator - Organic scroll invitation
// v0.12b: Redesigned with floating seedling animation

import React from 'react';

interface ScrollIndicatorProps {
  onClick: () => void;
}

export const ScrollIndicator: React.FC<ScrollIndicatorProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-2 text-ink-muted hover:text-grove-forest transition-colors focus:outline-none"
      aria-label="Continue scrolling"
    >
      <span className="text-2xl animate-float">🌱</span>
      <svg
        className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7" />
      </svg>
    </button>
  );
};

export default ScrollIndicator;
