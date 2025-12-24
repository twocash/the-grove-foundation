// components/Terminal/TerminalHeader.tsx
// Clean "Your Grove" header with context selectors
// v0.13: Terminal Header Cleanup - moved pills from bottom to header

import React from 'react';
import { getPersonaColors } from '../../data/narratives-schema';

interface TerminalHeaderProps {
  onMenuClick?: () => void;
  onMinimize?: () => void;  // Optional for embedded mode
  onClose?: () => void;     // Optional for embedded mode
  isScholarMode: boolean;
  showMinimize?: boolean;
  showClose?: boolean;      // Control close button visibility
  variant?: 'overlay' | 'embedded';  // Styling context
  // Context selectors
  fieldName?: string;
  lensName?: string;
  lensColor?: string;
  journeyName?: string;
  currentStreak?: number;
  showStreak?: boolean;
  onFieldClick?: () => void;
  onLensClick?: () => void;
  onJourneyClick?: () => void;
  onStreakClick?: () => void;
}

// Reusable pill button component
const HeaderPill: React.FC<{
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  className?: string;  // Allow custom classes for responsive hiding
  embedded?: boolean;  // Use chat tokens in embedded mode
}> = ({ label, onClick, icon, disabled, className = '', embedded = false }) => (
  <button
    onClick={onClick}
    disabled={disabled || !onClick}
    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium
      ${embedded
        ? 'bg-[var(--chat-glass)] text-[var(--chat-text)] border border-[var(--chat-glass-border)] hover:bg-[var(--chat-glass-hover)] hover:border-[var(--chat-border-accent)]/50'
        : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-200 border border-transparent hover:border-primary/30 dark:hover:border-primary/50'
      }
      transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
      shrink-0 whitespace-nowrap ${className}`}
  >
    {icon}
    <span className="truncate max-w-[100px]">{label}</span>
    {onClick && <span className={`text-[9px] ${embedded ? 'text-[var(--chat-text-dim)]' : 'text-slate-400 dark:text-slate-500'}`}>▾</span>}
  </button>
);

const TerminalHeader: React.FC<TerminalHeaderProps> = ({
  onMenuClick,
  onMinimize,
  onClose,
  isScholarMode,
  showMinimize = true,
  showClose = true,        // Default to showing close button
  variant = 'overlay',
  fieldName,
  lensName,
  lensColor,
  journeyName,
  currentStreak,
  showStreak = true,
  onFieldClick,
  onLensClick,
  onJourneyClick,
  onStreakClick
}) => {
  const lensColors = lensColor ? getPersonaColors(lensColor) : null;
  const isEmbedded = variant === 'embedded';

  return (
    <div className={`px-4 py-2.5 border-b flex items-center gap-3 flex-nowrap ${
      isEmbedded
        ? 'border-[var(--chat-border)] bg-[var(--chat-bg)]'
        : 'border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark'
    }`}>
      {/* Left: Menu + Title */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Menu button */}
        <button
          onClick={onMenuClick}
          className={`p-1 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isEmbedded
              ? 'text-[var(--chat-text-muted)] hover:text-[var(--chat-text)]'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
          disabled={!onMenuClick}
          aria-label="Menu"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Title */}
        <span className={`font-semibold text-sm ${isEmbedded ? 'text-[var(--chat-text)]' : 'text-slate-900 dark:text-slate-100'}`}>Your Grove</span>
        {isScholarMode && (
          <span className="bg-primary text-white px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase">
            Scholar
          </span>
        )}
      </div>

      {/* Center: Context Pills - aligned right, Journey/Field collapse first */}
      {/* Note: flex-row is explicit to override .terminal-panel .flex-1 { flex-direction: column } in globals.css */}
      <div className="flex flex-row items-center gap-2 flex-1 min-w-0 justify-end mr-2 flex-nowrap">
        {/* Lens Pill - Always visible, highest priority */}
        {lensName && (
          <HeaderPill
            label={lensName}
            onClick={onLensClick}
            icon={lensColors && <span className={`w-2 h-2 rounded-full ${lensColors.dot}`} />}
            embedded={isEmbedded}
          />
        )}

        {/* Journey Pill - Hidden on smaller screens */}
        {journeyName && (
          <HeaderPill
            label={journeyName}
            onClick={onJourneyClick}
            disabled={!onJourneyClick}
            className="hidden xl:flex"
            embedded={isEmbedded}
          />
        )}

        {/* Field Pill - Only show on very wide screens */}
        {fieldName && (
          <HeaderPill
            label={fieldName}
            onClick={onFieldClick}
            disabled={!onFieldClick}
            className="hidden 2xl:flex"
            embedded={isEmbedded}
          />
        )}
      </div>

      {/* Right: Streak + Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Streak - Keep orange semantic color */}
        {showStreak && currentStreak !== undefined && currentStreak > 0 && (
          <button
            onClick={onStreakClick}
            className={`flex items-center gap-1 px-2 py-1 rounded-full transition-colors ${
              isEmbedded
                ? 'text-orange-400 hover:bg-orange-400/10'
                : 'text-primary hover:bg-primary/10'
            }`}
            aria-label={`${currentStreak} day streak`}
          >
            <span className="text-sm">🔥</span>
            <span className="text-xs font-mono font-bold">{currentStreak}</span>
          </button>
        )}

        {/* Minimize button */}
        {showMinimize && (
          <button
            onClick={onMinimize}
            className={`p-1 transition-colors ${
              isEmbedded
                ? 'text-[var(--chat-text-muted)] hover:text-[var(--chat-text)]'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
            aria-label="Minimize"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
        )}

        {/* Close button - only show if showClose is true and onClose is provided */}
        {showClose && onClose && (
          <button
            onClick={onClose}
            className={`p-1 transition-colors ${
              isEmbedded
                ? 'text-[var(--chat-text-muted)] hover:text-[var(--chat-text)]'
                : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
            }`}
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default TerminalHeader;
