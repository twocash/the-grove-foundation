// src/surface/components/KineticStream/KineticHeader.tsx
// Header with lens/journey context pills and theme picker
// Sprint: kinetic-context-v1, S25-GSE

import React, { useState, useRef, useEffect } from 'react';
import { getPersonaColors } from '../../../../data/narratives-schema';
import { ThemeSwitcher } from '../../../bedrock/components/ThemeSwitcher';
import { useSkin } from '../../../bedrock/context/BedrockUIContext';

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

/**
 * S25-GSE: Theme picker dropdown for the explore header.
 * Styled as a pill matching the header's visual language.
 */
const ThemePickerDropdown: React.FC = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { skin } = useSkin();

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium
          border transition-all duration-200
          ${open
            ? 'bg-[var(--neon-cyan)]/20 border-[var(--neon-cyan)]/50 text-[var(--neon-cyan)]'
            : 'bg-[var(--glass-elevated)] border-[var(--glass-border)] text-[var(--glass-text-secondary)]'
          }
          hover:border-[var(--neon-cyan)]/50`}
        title={`Theme: ${skin.name}`}
        aria-label="Switch theme"
      >
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: skin.tokens.colors.accent }}
        />
        <span className="whitespace-nowrap">{skin.name}</span>
        <span className="text-[9px] text-[var(--glass-text-subtle)]">▾</span>
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-2 z-50 p-3 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-solid)] shadow-xl backdrop-blur-sm min-w-[280px]">
          <ThemeSwitcher variant="compact" />
        </div>
      )}
    </div>
  );
};

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
}) => {
  const lensColors = lensColor ? getPersonaColors(lensColor) : null;
  const stageInfo = stage ? STAGE_DISPLAY[stage] : null;

  return (
    <header className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--glass-border)] bg-[var(--glass-solid)]">
      {/* Left: Title + Stage + Theme */}
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
        <ThemePickerDropdown />
      </div>

      {/* Center: Context Pills (push right) */}
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
      {showStreak && currentStreak !== undefined && currentStreak > 0 && (
        <div className="shrink-0">
          <button
            onClick={onStreakClick}
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[var(--neon-amber)] hover:bg-[var(--neon-amber)]/10 transition-colors"
          >
            <span className="text-sm">🔥</span>
            <span className="text-xs font-mono font-bold">{currentStreak}</span>
          </button>
        </div>
      )}
    </header>
  );
};

export default KineticHeader;
