// src/bedrock/primitives/QualityScoreBadge.tsx
// Quality Score Badge Component
// Sprint: S10.1-SL-AICuration v2 (Display + Filtering)
//
// DEX: Organic Scalability - reusable quality indicator

import React from 'react';
import type { QualityScore, QualityDimensions, QualityGrade } from '@core/schema';
import { getQualityGrade, QUALITY_GRADE_CONFIGS, DIMENSION_CONFIGS } from '@core/schema';

// =============================================================================
// Types
// =============================================================================

export interface QualityScoreBadgeProps {
  /** Composite quality score (0-100) */
  score: number;
  /** Optional dimension breakdown */
  dimensions?: QualityDimensions;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show letter grade */
  showGrade?: boolean;
  /** Show percentage */
  showPercentage?: boolean;
  /** Show tooltip on hover */
  showTooltip?: boolean;
  /** Additional class names */
  className?: string;
}

// =============================================================================
// Color Mapping (based on grade)
// =============================================================================

const GRADE_COLOR_MAP: Record<QualityGrade, { bg: string; text: string; border: string }> = {
  excellent: {
    bg: 'bg-[var(--neon-green)]/20',
    text: 'text-[var(--neon-green)]',
    border: 'border-[var(--neon-green)]/50',
  },
  good: {
    bg: 'bg-[var(--neon-amber)]/20',
    text: 'text-[var(--neon-amber)]',
    border: 'border-[var(--neon-amber)]/50',
  },
  fair: {
    bg: 'bg-orange-500/20',
    text: 'text-orange-400',
    border: 'border-orange-500/50',
  },
  'needs-improvement': {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    border: 'border-red-500/50',
  },
};

const SIZE_MAP = {
  sm: {
    badge: 'px-1.5 py-0.5 text-xs',
    icon: 'text-sm',
  },
  md: {
    badge: 'px-2 py-1 text-sm',
    icon: 'text-base',
  },
  lg: {
    badge: 'px-3 py-1.5 text-base',
    icon: 'text-lg',
  },
};

// =============================================================================
// Component
// =============================================================================

/**
 * Quality Score Badge
 *
 * Displays a quality score with color coding and optional grade/percentage.
 * Score range: 0-100
 */
export function QualityScoreBadge({
  score,
  dimensions,
  size = 'md',
  showGrade = false,
  showPercentage = true,
  showTooltip = true,
  className = '',
}: QualityScoreBadgeProps) {
  const grade = getQualityGrade(score);
  const gradeConfig = QUALITY_GRADE_CONFIGS[grade];
  const colors = GRADE_COLOR_MAP[grade];
  const sizes = SIZE_MAP[size];
  const roundedScore = Math.round(score);

  const tooltipContent = dimensions
    ? `Accuracy: ${Math.round(dimensions.accuracy)}%\nUtility: ${Math.round(dimensions.utility)}%\nNovelty: ${Math.round(dimensions.novelty)}%\nProvenance: ${Math.round(dimensions.provenance)}%`
    : `Quality Score: ${roundedScore}%`;

  return (
    <div
      className={`
        inline-flex items-center gap-1 rounded-lg font-medium border
        ${colors.bg} ${colors.text} ${colors.border}
        ${sizes.badge}
        ${className}
      `}
      title={showTooltip ? tooltipContent : undefined}
      data-testid="quality-score-badge"
    >
      <span className={`material-symbols-outlined ${sizes.icon}`}>
        {gradeConfig.icon}
      </span>
      {showPercentage && <span>{roundedScore}</span>}
      {showGrade && <span>{gradeConfig.label}</span>}
    </div>
  );
}

// =============================================================================
// Compact Variant
// =============================================================================

export interface QualityScoreIndicatorProps {
  score: number;
  className?: string;
}

/**
 * Compact quality indicator (just a colored dot)
 */
export function QualityScoreIndicator({ score, className = '' }: QualityScoreIndicatorProps) {
  const grade = getQualityGrade(score);
  const colors = GRADE_COLOR_MAP[grade];

  return (
    <div
      className={`w-2 h-2 rounded-full ${colors.bg.replace('/20', '')} ${className}`}
      title={`Quality: ${Math.round(score)}%`}
      data-testid="quality-score-indicator"
    />
  );
}

// =============================================================================
// Pending Badge
// =============================================================================

export interface QualityPendingBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Pending quality assessment indicator with pulse animation
 */
export function QualityPendingBadge({ size = 'md', className = '' }: QualityPendingBadgeProps) {
  const sizes = SIZE_MAP[size];

  return (
    <div
      className={`
        inline-flex items-center gap-1 rounded-lg font-medium border
        bg-gray-500/20 text-gray-400 border-gray-500/50
        animate-pulse
        ${sizes.badge}
        ${className}
      `}
      title="Quality assessment pending"
      data-testid="quality-pending-badge"
    >
      <span className={`material-symbols-outlined ${sizes.icon}`}>
        hourglass_empty
      </span>
      <span>...</span>
    </div>
  );
}

// =============================================================================
// Dimension Breakdown
// =============================================================================

export interface QualityDimensionBarProps {
  dimensions: QualityDimensions;
  className?: string;
}

/**
 * Horizontal bar showing all dimension scores
 */
export function QualityDimensionBar({ dimensions, className = '' }: QualityDimensionBarProps) {
  const dimensionList = [
    { key: 'accuracy' as const, value: dimensions.accuracy },
    { key: 'utility' as const, value: dimensions.utility },
    { key: 'novelty' as const, value: dimensions.novelty },
    { key: 'provenance' as const, value: dimensions.provenance },
  ];

  return (
    <div className={`flex items-center gap-1 ${className}`} data-testid="quality-dimension-bar">
      {dimensionList.map(({ key, value }) => {
        const config = DIMENSION_CONFIGS[key];
        const grade = getQualityGrade(value);
        const colors = GRADE_COLOR_MAP[grade];

        return (
          <div
            key={key}
            className={`
              flex items-center justify-center w-6 h-6 rounded text-xs font-medium
              ${colors.bg} ${colors.text}
            `}
            title={`${config.label}: ${Math.round(value)}%`}
          >
            {config.label.charAt(0)}
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// Full Quality Badge with Dimensions
// =============================================================================

export interface QualityFullBadgeProps {
  qualityScore: QualityScore;
  showDimensions?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Full quality badge with optional dimension breakdown
 */
export function QualityFullBadge({
  qualityScore,
  showDimensions = false,
  size = 'md',
  className = '',
}: QualityFullBadgeProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <QualityScoreBadge
        score={qualityScore.overall}
        dimensions={qualityScore.dimensions}
        size={size}
        showPercentage
      />
      {showDimensions && (
        <QualityDimensionBar dimensions={qualityScore.dimensions} />
      )}
    </div>
  );
}

export default QualityScoreBadge;
