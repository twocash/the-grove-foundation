// src/bedrock/primitives/MetricCard.tsx
// Density-aware metric display primitive for Bedrock consoles
// Sprint: S2-SKIN-DeclarativeDensity

import React, { type ReactNode } from 'react';
import { type DensityToken, DEFAULT_DENSITY } from '../../theme/mappings/quantum-glass.map';
import { useSkin } from '../context/BedrockUIContext';
import { FoundationText } from './FoundationText';

// =============================================================================
// Types
// =============================================================================

type MetricTrend = 'up' | 'down' | 'neutral';
type MetricColor = 'green' | 'cyan' | 'amber' | 'violet' | 'default';

interface MetricCardProps {
  /** Main metric value */
  value: string | number;
  /** Label describing the metric */
  label: string;
  /** Optional trend indicator */
  trend?: MetricTrend;
  /** Optional trend value (e.g., "+12%") */
  trendValue?: string;
  /** Color accent for the metric */
  color?: MetricColor;
  /** Optional icon (Material Symbols name) */
  icon?: string;
  /**
   * Content density - affects sizing
   * @default from skin context
   */
  density?: DensityToken;
  /** Additional CSS classes */
  className?: string;
}

// =============================================================================
// Style Mappings
// =============================================================================

const colorAccents: Record<MetricColor, { text: string; bg: string }> = {
  green: {
    text: 'text-[var(--neon-green)]',
    bg: 'bg-[var(--neon-green)]/10',
  },
  cyan: {
    text: 'text-[var(--neon-cyan)]',
    bg: 'bg-[var(--neon-cyan)]/10',
  },
  amber: {
    text: 'text-[var(--neon-amber)]',
    bg: 'bg-[var(--neon-amber)]/10',
  },
  violet: {
    text: 'text-[var(--neon-violet)]',
    bg: 'bg-[var(--neon-violet)]/10',
  },
  default: {
    text: 'text-[var(--glass-text-primary)]',
    bg: 'bg-white/5',
  },
};

const trendIcons: Record<MetricTrend, { icon: string; colorClass: string }> = {
  up: { icon: 'trending_up', colorClass: 'text-[var(--neon-green)]' },
  down: { icon: 'trending_down', colorClass: 'text-[var(--neon-amber)]' },
  neutral: { icon: 'trending_flat', colorClass: 'text-[var(--glass-text-secondary)]' },
};

/**
 * Padding per density tier
 */
const densityPadding: Record<DensityToken, string> = {
  compact: 'p-2',
  comfortable: 'p-3',
  spacious: 'p-4',
};

/**
 * Icon container sizes per density
 */
const iconContainerSize: Record<DensityToken, string> = {
  compact: 'w-7 h-7',
  comfortable: 'w-8 h-8',
  spacious: 'w-10 h-10',
};

/**
 * Icon sizes per density
 */
const iconSize: Record<DensityToken, string> = {
  compact: 'text-sm',
  comfortable: 'text-base',
  spacious: 'text-lg',
};

/**
 * Value text sizes per density
 */
const valueSize: Record<DensityToken, string> = {
  compact: 'text-lg',
  comfortable: 'text-xl',
  spacious: 'text-2xl',
};

// =============================================================================
// Component
// =============================================================================

export function MetricCard({
  value,
  label,
  trend,
  trendValue,
  color = 'default',
  icon,
  density: densityProp,
  className = '',
}: MetricCardProps) {
  // S2-SKIN-DeclarativeDensity: Get density from skin context, allow prop override
  const { skin } = useSkin();
  const density = densityProp ?? (skin.layout?.density as DensityToken) ?? DEFAULT_DENSITY;

  const { text: textColor, bg: bgColor } = colorAccents[color];
  const trendConfig = trend ? trendIcons[trend] : null;

  return (
    <div
      className={`
        rounded-lg border border-white/5 bg-[var(--glass-panel)]
        ${densityPadding[density]}
        ${className}
      `}
    >
      {/* Header with icon and trend */}
      <div className="flex items-center justify-between mb-1">
        {icon && (
          <div className={`${iconContainerSize[density]} rounded-md ${bgColor} flex items-center justify-center`}>
            <span className={`material-symbols-outlined ${iconSize[density]} ${textColor}`}>
              {icon}
            </span>
          </div>
        )}
        {trendConfig && (
          <div className="flex items-center gap-1">
            <span className={`material-symbols-outlined text-sm ${trendConfig.colorClass}`}>
              {trendConfig.icon}
            </span>
            {trendValue && (
              <FoundationText variant="caption" color="secondary" density={density}>
                {trendValue}
              </FoundationText>
            )}
          </div>
        )}
      </div>

      {/* Value */}
      <div className={`${valueSize[density]} font-semibold ${textColor} tabular-nums`}>
        {value}
      </div>

      {/* Label */}
      <FoundationText variant="caption" color="secondary" density={density}>
        {label}
      </FoundationText>
    </div>
  );
}

export default MetricCard;
