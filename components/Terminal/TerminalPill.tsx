// components/Terminal/TerminalPill.tsx
// Minimized Terminal state - fixed pill at viewport bottom
// v0.12: Part of Terminal UX modernization

import React from 'react';

interface TerminalPillProps {
  isLoading: boolean;
  onExpand: () => void;
}

const TerminalPill: React.FC<TerminalPillProps> = ({ isLoading, onExpand }) => {
  return (
    <button
      onClick={onExpand}
      className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between px-4 py-3 bg-paper border border-ink/10 rounded-full shadow-lg hover:shadow-xl hover:border-grove-forest/20 transition-all duration-300 group"
      aria-label="Expand Your Grove"
    >
      <div className="flex items-center space-x-2">
        <span className="text-lg" aria-hidden="true">🌱</span>
        <span className="font-display font-bold text-ink">
          {isLoading ? (
            <span className="flex items-center space-x-2">
              <span>Your Grove is thinking</span>
              <span className="inline-flex space-x-1">
                <span className="w-1 h-1 bg-grove-forest rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 bg-grove-forest rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 bg-grove-forest rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </span>
          ) : (
            'Your Grove'
          )}
        </span>
      </div>
      <svg
        className="w-5 h-5 text-ink-muted group-hover:text-grove-forest transition-colors"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    </button>
  );
};

export default TerminalPill;
