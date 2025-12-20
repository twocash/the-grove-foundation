// components/Terminal/TerminalHeader.tsx
// Clean "Your Grove" header with minimize capability
// v0.12: Part of Terminal UX modernization

import React from 'react';

interface TerminalHeaderProps {
  onMenuClick?: () => void;
  onMinimize: () => void;
  onClose: () => void;
  isScholarMode: boolean;
  showMinimize?: boolean;
}

const TerminalHeader: React.FC<TerminalHeaderProps> = ({
  onMenuClick,
  onMinimize,
  onClose,
  isScholarMode,
  showMinimize = true
}) => {
  return (
    <div className="px-4 py-3 border-b border-ink/5 bg-white flex items-center justify-between">
      {/* Menu button (placeholder for future settings) */}
      <button
        onClick={onMenuClick}
        className="p-1 text-ink-muted hover:text-ink transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!onMenuClick}
        aria-label="Menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Title */}
      <div className="flex items-center space-x-2">
        <span className="font-display font-bold text-base text-ink">Your Grove</span>
        {isScholarMode && (
          <span className="bg-grove-clay text-white px-2 py-0.5 rounded-full text-[8px] font-bold tracking-widest uppercase">
            Scholar
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center space-x-1">
        {/* Minimize button */}
        {showMinimize && (
          <button
            onClick={onMinimize}
            className="p-1 text-ink-muted hover:text-ink transition-colors"
            aria-label="Minimize"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="p-1 text-ink-muted hover:text-ink transition-colors"
          aria-label="Close"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TerminalHeader;
