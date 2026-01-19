// src/bedrock/components/ProgressScoreBar.tsx
// Progress bar component for displaying scores and percentages
// Sprint: S15-BD-FederationEditors-v1

import React from 'react';

// =============================================================================
// Types
// =============================================================================

export interface ProgressScoreBarMarker {
  /** Position on the bar (0-100) */
  position: number;
  /** Label to display below the marker */
  label: string;
}

export interface ProgressScoreBarProps {
  /** Current value (0-100) */
  value: number;
  /** Whether to show the numeric value */
  showValue?: boolean;
  /** Optional markers to display below the bar */
  markers?: ProgressScoreBarMarker[];
  /** Custom gradient colors */
  gradient?: {
    from: string;
    to: string;
  };
  /** Bar height variant */
  height?: 'sm' | 'md' | 'lg';
  /** Additional CSS classes */
  className?: string;
  /** Optional label to show above the bar */
  label?: string;
  /** Optional unit suffix (e.g., '%', 'pts') */
  unit?: string;
}

// =============================================================================
// Constants
// =============================================================================

const HEIGHT_CLASSES = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

const DEFAULT_GRADIENT = {
  from: 'var(--neon-green)',
  to: 'var(--neon-cyan)',
};

// =============================================================================
// Component
// =============================================================================

/**
 * ProgressScoreBar displays a filled progress bar with optional markers,
 * gradient colors, and value display.
 *
 * @example
 * <ProgressScoreBar
 *   value={75}
 *   showValue
 *   markers={[
 *     { position: 25, label: 'Low' },
 *     { position: 50, label: 'Medium' },
 *     { position: 75, label: 'High' },
 *   ]}
 * />
 */
export function ProgressScoreBar({
  value,
  showValue = false,
  markers,
  gradient = DEFAULT_GRADIENT,
  height = 'md',
  className = '',
  label,
  unit = '%',
}: ProgressScoreBarProps) {
  // Clamp value between 0 and 100
  const clampedValue = Math.max(0, Math.min(100, value));

  // Compute fill color based on value position in gradient
  const fillStyle = {
    background: `linear-gradient(90deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
    width: `${clampedValue}%`,
  };

  return (
    <div
      data-testid="progress-score-bar"
      className={`${className}`}
    >
      {/* Header row: label and value */}
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <span className="text-xs text-[var(--glass-text-muted)]">
              {label}
            </span>
          )}
          {showValue && (
            <span className="text-sm font-medium text-[var(--glass-text-primary)]">
              {Math.round(clampedValue)}{unit}
            </span>
          )}
        </div>
      )}

      {/* Progress bar track */}
      <div
        className={`
          w-full rounded-full overflow-hidden
          bg-[var(--glass-bg)] border border-[var(--glass-border)]
          ${HEIGHT_CLASSES[height]}
        `}
      >
        {/* Progress bar fill */}
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out`}
          style={fillStyle}
        />
      </div>

      {/* Markers row */}
      {markers && markers.length > 0 && (
        <div className="relative mt-2 h-4">
          {markers.map((marker, idx) => (
            <div
              key={idx}
              className="absolute transform -translate-x-1/2 flex flex-col items-center"
              style={{ left: `${marker.position}%` }}
            >
              {/* Marker tick */}
              <div className="w-px h-1.5 bg-[var(--glass-border)]" />
              {/* Marker label */}
              <span className="text-[10px] text-[var(--glass-text-muted)] whitespace-nowrap mt-0.5">
                {marker.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Variants
// =============================================================================

/**
 * Trust score bar with star markers at 20, 40, 60, 80 thresholds
 */
export function TrustScoreBar({
  value,
  showValue = true,
  className = '',
}: Pick<ProgressScoreBarProps, 'value' | 'showValue' | 'className'>) {
  const starMarkers: ProgressScoreBarMarker[] = [
    { position: 20, label: '★' },
    { position: 40, label: '★★' },
    { position: 60, label: '★★★' },
    { position: 80, label: '★★★★' },
    { position: 95, label: '★★★★★' },
  ];

  return (
    <ProgressScoreBar
      value={value}
      showValue={showValue}
      markers={starMarkers}
      gradient={{ from: 'var(--neon-amber)', to: 'var(--neon-green)' }}
      height="md"
      className={className}
    />
  );
}

/**
 * Confidence score bar (0-100%)
 */
export function ConfidenceBar({
  value,
  showValue = true,
  className = '',
}: Pick<ProgressScoreBarProps, 'value' | 'showValue' | 'className'>) {
  return (
    <ProgressScoreBar
      value={value}
      showValue={showValue}
      gradient={{ from: 'var(--neon-cyan)', to: 'var(--neon-green)' }}
      height="sm"
      className={className}
    />
  );
}

export default ProgressScoreBar;
