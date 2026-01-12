// src/surface/components/KineticStream/KineticHeader.tsx
// Header with lens/journey context pills
// Sprint: kinetic-context-v1, feature-flags-v1

import React from 'react';
import { getPersonaColors } from '../../../../data/narratives-schema';

// Sprint: feature-flags-v1 - Header flag display
export interface HeaderFlag {
  flagId: string;
  label: string;
  enabled: boolean;
  available: boolean;
}

const STAGE_DISPLAY: Record<string, { emoji: string; label: string }> = {
  ARRIVAL: { emoji: '👋', label: 'New' },
  ORIENTED: { emoji: '🧭', label: 'Orienting' },
  EXPLORING: { emoji: '🔍', label: 'Exploring' },
  ENGAGED: { emoji: '🌲', label: 'Engaged' },
};

export interface KineticHeaderProps {
  lensName?: string;
  lensColor?: string;
  onLensClick?: () => void;
  journeyName?: string;
  onJourneyClick?: () => void;
  stage?: string;
  exchangeCount?: number;
  currentStreak?: number;
  showStreak?: boolean;
  onStreakClick?: () => void;
  // Sprint: hybrid-search-toggle-v1
  useHybridSearch?: boolean;
  onHybridSearchToggle?: () => void;
  // Sprint: prompt-journey-mode-v1
  journeyMode?: boolean;
  onJourneyModeToggle?: () => void;
  // Sprint: feature-flags-v1 - Dynamic feature flag toggles
  headerFlags?: HeaderFlag[];
  onFlagToggle?: (flagId: string, enabled: boolean) => void;
}

const HeaderPill: React.FC<{
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  className?: string;
}> = ({ label, onClick, icon, className = '' }) => (
  <button
    onClick={onClick}
    disabled={!onClick}
    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium
      bg-[var(--glass-elevated)] text-[var(--glass-text-secondary)]
      border border-[var(--glass-border)]
      hover:border-[var(--neon-cyan)]/50 transition-colors
      cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
      shrink-0 whitespace-nowrap ${className}`}
  >
    {icon}
    <span className="truncate max-w-[100px]">{label}</span>
    {onClick && <span className="text-[9px] text-[var(--glass-text-subtle)]">▾</span>}
  </button>
);

export const KineticHeader: React.FC<KineticHeaderProps> = ({
  lensName,
  lensColor,
  onLensClick,
  journeyName,
  onJourneyClick,
  stage,
  exchangeCount,
  currentStreak,
  showStreak = true,
  onStreakClick,
  useHybridSearch,
  onHybridSearchToggle,
  journeyMode,
  onJourneyModeToggle,
  headerFlags,
  onFlagToggle,
}) => {
  const lensColors = lensColor ? getPersonaColors(lensColor) : null;
  const stageInfo = stage ? STAGE_DISPLAY[stage] : null;

  return (
    <header className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--glass-border)] bg-[var(--glass-solid)]">
      {/* Left: Title + Stage */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="font-semibold text-sm text-[var(--glass-text-primary)]">
          Explore The Grove
        </span>
        {stageInfo && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-900/70 text-emerald-300 border border-emerald-500/50">
            <span>{stageInfo.emoji}</span>
            <span className="font-medium">{stageInfo.label}</span>
            {exchangeCount !== undefined && exchangeCount > 0 && (
              <span className="text-emerald-300/70">• {exchangeCount}</span>
            )}
          </span>
        )}
      </div>

      {/* Hybrid Search Toggle (Sprint: hybrid-search-toggle-v1) */}
      {onHybridSearchToggle && (
        <button
          onClick={onHybridSearchToggle}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium
            border transition-all duration-200
            ${useHybridSearch
              ? 'bg-[var(--neon-cyan)]/20 border-[var(--neon-cyan)]/50 text-[var(--neon-cyan)]'
              : 'bg-[var(--glass-elevated)] border-[var(--glass-border)] text-[var(--glass-text-muted)]'
            }
            hover:border-[var(--neon-cyan)]/70`}
          title={useHybridSearch ? 'Hybrid search enabled (vector + keyword + temporal)' : 'Basic vector search'}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${useHybridSearch ? 'bg-[var(--neon-cyan)]' : 'bg-[var(--glass-text-subtle)]'}`} />
          <span>RAG</span>
          <span className="text-[9px] opacity-70">{useHybridSearch ? 'ON' : 'OFF'}</span>
        </button>
      )}

      {/* Sprint: prompt-journey-mode-v1 - Journey mode toggle */}
      {onJourneyModeToggle && (
        <button
          onClick={onJourneyModeToggle}
          className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium
            border transition-all duration-200
            ${journeyMode
              ? 'bg-[var(--neon-cyan)]/20 border-[var(--neon-cyan)]/50 text-[var(--neon-cyan)]'
              : 'bg-[var(--glass-elevated)] border-[var(--glass-border)] text-[var(--glass-text-muted)]'
            }
            hover:border-[var(--neon-cyan)]/70`}
          title={journeyMode
            ? 'Journey Mode: Library prompts guide exploration'
            : 'Path Mode: AI suggests next steps'}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${journeyMode ? 'bg-[var(--neon-cyan)]' : 'bg-[var(--glass-text-subtle)]'}`} />
          <span>JOURNEY</span>
          <span className="text-[9px] opacity-70">{journeyMode ? 'ON' : 'OFF'}</span>
        </button>
      )}

      {/* Sprint: feature-flags-v1 - Dynamic feature flag toggles */}
      {headerFlags && headerFlags.length > 0 && onFlagToggle && (
        <>
          {headerFlags
            .filter(flag => flag.available)
            .map(flag => (
              <button
                key={flag.flagId}
                onClick={() => onFlagToggle(flag.flagId, !flag.enabled)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium
                  border transition-all duration-200
                  ${flag.enabled
                    ? 'bg-[var(--neon-cyan)]/20 border-[var(--neon-cyan)]/50 text-[var(--neon-cyan)]'
                    : 'bg-[var(--glass-elevated)] border-[var(--glass-border)] text-[var(--glass-text-muted)]'
                  }
                  hover:border-[var(--neon-cyan)]/70`}
                title={`Toggle ${flag.label}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${flag.enabled ? 'bg-[var(--neon-cyan)]' : 'bg-[var(--glass-text-subtle)]'}`} />
                <span className="uppercase">{flag.label}</span>
                <span className="text-[9px] opacity-70">{flag.enabled ? 'ON' : 'OFF'}</span>
              </button>
            ))}
        </>
      )}

      {/* Center: Context Pills */}
      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end mr-2">
        {lensName && (
          <HeaderPill
            label={lensName}
            onClick={onLensClick}
            icon={lensColors && <span className={`w-2 h-2 rounded-full ${lensColors.dot}`} />}
          />
        )}
        {journeyName && (
          <HeaderPill
            label={journeyName}
            onClick={onJourneyClick}
            className="hidden xl:flex"
          />
        )}
      </div>

      {/* Right: Streak */}
      <div className="flex items-center gap-2 shrink-0">
        {showStreak && currentStreak !== undefined && currentStreak > 0 && (
          <button
            onClick={onStreakClick}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[var(--neon-amber)] hover:bg-[var(--neon-amber)]/10 transition-colors"
          >
            <span className="text-sm">🔥</span>
            <span className="text-xs font-mono font-bold">{currentStreak}</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default KineticHeader;
