// src/surface/components/modals/SproutFinishingRoom/FinishingRoomHeader.tsx
// Sprint: S1-SFR-Shell - US-A001/US-A003 Header with close button

import React, { RefObject } from 'react';
import type { Sprout } from '@core/schema/sprout';

export interface FinishingRoomHeaderProps {
  sprout: Sprout;
  headerId: string;
  onClose: () => void;
  closeButtonRef: RefObject<HTMLButtonElement | null>;
}

/**
 * FinishingRoomHeader - Header bar with title and close button
 *
 * Layout:
 * [Sprout Icon] SPROUT FINISHING ROOM | [Sprout Title...] | [Close X]
 */
export const FinishingRoomHeader: React.FC<FinishingRoomHeaderProps> = ({
  sprout,
  headerId,
  onClose,
  closeButtonRef
}) => {
  // Truncate query for display as title
  const displayTitle = sprout.query.length > 60
    ? sprout.query.slice(0, 57) + '...'
    : sprout.query;

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-ink/10 dark:border-white/10 bg-paper/50 dark:bg-ink/50">
      {/* Left: Icon and title */}
      <div className="flex items-center gap-3">
        <span className="text-xl" role="img" aria-label="Sprout">
          🌱
        </span>
        <h1
          id={headerId}
          className="text-sm font-mono font-semibold text-ink dark:text-paper uppercase tracking-wider"
        >
          Sprout Finishing Room
        </h1>
      </div>

      {/* Center: Sprout query/title */}
      <div className="flex-1 mx-4 text-center">
        <span className="text-sm text-ink-muted dark:text-paper/70 font-serif italic truncate block">
          {displayTitle}
        </span>
      </div>

      {/* Right: Close button */}
      <button
        ref={closeButtonRef}
        onClick={onClose}
        aria-label="Close"
        className="flex items-center justify-center w-8 h-8 rounded-md text-ink-muted dark:text-paper/70 hover:text-ink dark:hover:text-paper hover:bg-ink/5 dark:hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-grove-forest/50"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </header>
  );
};

export default FinishingRoomHeader;
