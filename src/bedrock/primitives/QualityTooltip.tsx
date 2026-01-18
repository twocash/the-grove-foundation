// src/bedrock/primitives/QualityTooltip.tsx
// Quality Score Tooltip Component
// Sprint: S10.1-SL-AICuration v2 (Display + Filtering)
//
// DEX: Declarative Sovereignty - tooltip content driven by schema

import React, { useState, useRef, useEffect } from 'react';
import type { QualityScore, QualityDimensions, QualityGrade } from '@core/schema';
import { getQualityGrade, QUALITY_GRADE_CONFIGS, DIMENSION_CONFIGS } from '@core/schema';

// =============================================================================
// Types
// =============================================================================

export interface QualityTooltipProps {
  /** Full quality score data */
  qualityScore: QualityScore;
  /** Children element that triggers the tooltip */
  children: React.ReactNode;
  /** Optional callback when "View Details" is clicked */
  onViewDetails?: () => void;
  /** Position preference */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /** Additional class names */
  className?: string;
}

// =============================================================================
// Color Mapping (consistent with QualityScoreBadge)
// =============================================================================

const GRADE_COLOR_MAP: Record<QualityGrade, { bg: string; text: string; bar: string }> = {
  excellent: {
    bg: 'bg-[var(--neon-green)]/20',
    text: 'text-[var(--neon-green)]',
    bar: 'bg-[var(--neon-green)]',
  },
  good: {
    bg: 'bg-[var(--neon-amber)]/20',
    text: 'text-[var(--neon-amber)]',
    bar: 'bg-[var(--neon-amber)]',
  },
  fair: {
    bg: 'bg-orange-500/20',
    text: 'text-orange-400',
    bar: 'bg-orange-500',
  },
  'needs-improvement': {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    bar: 'bg-red-500',
  },
};

// =============================================================================
// Sub-Components
// =============================================================================

interface DimensionRowProps {
  dimension: keyof QualityDimensions;
  value: number;
}

/**
 * Single dimension row with label, bar, and value
 */
function DimensionRow({ dimension, value }: DimensionRowProps) {
  const config = DIMENSION_CONFIGS[dimension];
  const grade = getQualityGrade(value);
  const colors = GRADE_COLOR_MAP[grade];
  const roundedValue = Math.round(value);

  return (
    <div className="flex items-center gap-2">
      {/* Icon and label */}
      <div className="flex items-center gap-1 w-24 text-xs text-[var(--glass-text-secondary)]">
        <span className="material-symbols-outlined text-sm" style={{ color: config.color }}>
          {config.icon}
        </span>
        <span>{config.label}</span>
      </div>

      {/* Progress bar */}
      <div className="flex-1 h-2 bg-[var(--glass-border)] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${colors.bar}`}
          style={{ width: `${roundedValue}%` }}
        />
      </div>

      {/* Value */}
      <span className={`w-8 text-xs text-right font-medium ${colors.text}`}>
        {roundedValue}
      </span>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

/**
 * Quality Tooltip
 *
 * Displays detailed quality score breakdown on hover.
 * Shows overall score, grade, 4 dimension bars, and assessment metadata.
 */
export function QualityTooltip({
  qualityScore,
  children,
  onViewDetails,
  position = 'bottom',
  className = '',
}: QualityTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const grade = getQualityGrade(qualityScore.overall);
  const gradeConfig = QUALITY_GRADE_CONFIGS[grade];
  const colors = GRADE_COLOR_MAP[grade];
  const roundedOverall = Math.round(qualityScore.overall);

  // Format assessment date
  const assessedDate = new Date(qualityScore.assessedAt);
  const formattedDate = assessedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = assessedDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  // Calculate tooltip position
  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const gap = 8;

      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = -tooltipRect.height - gap;
          left = (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'bottom':
          top = triggerRect.height + gap;
          left = (triggerRect.width - tooltipRect.width) / 2;
          break;
        case 'left':
          top = (triggerRect.height - tooltipRect.height) / 2;
          left = -tooltipRect.width - gap;
          break;
        case 'right':
          top = (triggerRect.height - tooltipRect.height) / 2;
          left = triggerRect.width + gap;
          break;
      }

      setTooltipPosition({ top, left });
    }
  }, [isVisible, position]);

  return (
    <div
      ref={triggerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      data-testid="quality-tooltip-trigger"
    >
      {children}

      {/* Tooltip Panel */}
      {isVisible && (
        <div
          ref={tooltipRef}
          className="absolute z-50 w-64 p-4 rounded-xl border border-[var(--glass-border)] bg-[var(--glass-solid)] shadow-xl backdrop-blur-sm"
          style={{
            top: tooltipPosition.top,
            left: tooltipPosition.left,
          }}
          data-testid="quality-tooltip-panel"
        >
          {/* Header: Overall Score and Grade */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined text-2xl ${colors.text}`}>
                {gradeConfig.icon}
              </span>
              <div>
                <div className={`text-2xl font-bold ${colors.text}`}>
                  {roundedOverall}
                </div>
                <div className="text-xs text-[var(--glass-text-muted)]">
                  Overall Score
                </div>
              </div>
            </div>
            <div className={`px-2 py-1 rounded-lg text-xs font-medium ${colors.bg} ${colors.text}`}>
              {gradeConfig.label}
            </div>
          </div>

          {/* Dimension Breakdown */}
          <div className="space-y-2 mb-4">
            <DimensionRow dimension="accuracy" value={qualityScore.dimensions.accuracy} />
            <DimensionRow dimension="utility" value={qualityScore.dimensions.utility} />
            <DimensionRow dimension="novelty" value={qualityScore.dimensions.novelty} />
            <DimensionRow dimension="provenance" value={qualityScore.dimensions.provenance} />
          </div>

          {/* Divider */}
          <div className="border-t border-[var(--glass-border)] my-3" />

          {/* Assessment Metadata */}
          <div className="space-y-1 text-xs text-[var(--glass-text-muted)]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">schedule</span>
              <span>{formattedDate} at {formattedTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">smart_toy</span>
              <span>{qualityScore.assessedBy}</span>
            </div>
            {qualityScore.confidence !== undefined && (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">verified</span>
                <span>{Math.round(qualityScore.confidence * 100)}% confidence</span>
              </div>
            )}
            {qualityScore.networkPercentile !== undefined && (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">trending_up</span>
                <span>Top {100 - qualityScore.networkPercentile}% in network</span>
              </div>
            )}
          </div>

          {/* View Details Link */}
          {onViewDetails && (
            <>
              <div className="border-t border-[var(--glass-border)] my-3" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onViewDetails();
                }}
                className="w-full flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/10 transition-colors"
              >
                <span>View Details</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Compact Tooltip (for list views)
// =============================================================================

export interface QualityMiniTooltipProps {
  /** Overall quality score (0-100) */
  score: number;
  /** Children element that triggers the tooltip */
  children: React.ReactNode;
  /** Additional class names */
  className?: string;
}

/**
 * Mini tooltip showing just the grade and score
 */
export function QualityMiniTooltip({ score, children, className = '' }: QualityMiniTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const grade = getQualityGrade(score);
  const gradeConfig = QUALITY_GRADE_CONFIGS[grade];
  const colors = GRADE_COLOR_MAP[grade];
  const roundedScore = Math.round(score);

  return (
    <div
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      data-testid="quality-mini-tooltip-trigger"
    >
      {children}

      {isVisible && (
        <div
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] shadow-lg whitespace-nowrap"
          data-testid="quality-mini-tooltip-panel"
        >
          <div className="flex items-center gap-2">
            <span className={`material-symbols-outlined text-lg ${colors.text}`}>
              {gradeConfig.icon}
            </span>
            <span className={`font-bold ${colors.text}`}>{roundedScore}</span>
            <span className="text-xs text-[var(--glass-text-muted)]">{gradeConfig.label}</span>
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[var(--glass-border)]" />
        </div>
      )}
    </div>
  );
}

export default QualityTooltip;
