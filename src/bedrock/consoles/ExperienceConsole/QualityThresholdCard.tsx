// src/bedrock/consoles/ExperienceConsole/QualityThresholdCard.tsx
// Card component for Quality Threshold configuration
// Sprint: S10-SL-AICuration v1
//
// DEX: Organic Scalability - follows established card component pattern

import React from 'react';
import type { ObjectCardProps } from '../../patterns/console-factory.types';
import type { QualityThresholdPayload } from '@core/quality/schema';

/**
 * Get style for quality value
 */
function getValueStyle(value: number): React.CSSProperties {
  if (value >= 0.8) return { color: 'var(--semantic-success)' };
  if (value >= 0.6) return { color: 'var(--semantic-warning)' };
  if (value >= 0.4) return { color: 'var(--semantic-warning)' };
  return { color: 'var(--semantic-error)' };
}

/**
 * Quality dimension display
 */
interface DimensionDisplayProps {
  label: string;
  minimum: number;
  target: number;
}

function DimensionDisplay({ label, minimum, target }: DimensionDisplayProps) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-[var(--glass-text-secondary)] capitalize">{label}</span>
      <div className="flex items-center gap-2">
        <span style={getValueStyle(minimum)}>
          min: {(minimum * 100).toFixed(0)}%
        </span>
        <span className="text-[var(--glass-text-muted)]">→</span>
        <span style={getValueStyle(target)}>
          target: {(target * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

/**
 * Card component for displaying a quality threshold configuration
 */
export function QualityThresholdCard({
  object: threshold,
  selected,
  isFavorite,
  onClick,
  onFavoriteToggle,
  className = '',
}: ObjectCardProps<QualityThresholdPayload>) {
  const { thresholds, composite, weights, autoFilterEnabled, targetTypes, isActive } = threshold.payload;

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-xl border p-4 cursor-pointer transition-all
        ${selected
          ? 'border-[var(--neon-cyan)] bg-[var(--neon-cyan)]/5 ring-1 ring-[var(--neon-cyan)]/50'
          : 'border-[var(--glass-border)] bg-[var(--glass-solid)] hover:border-[var(--glass-border-bright)] hover:bg-[var(--glass-elevated)]'
        }
        ${className}
      `}
      data-testid="quality-threshold-card"
    >
      {/* Status bar at top */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
        style={{ backgroundColor: isActive ? 'var(--semantic-success)' : 'var(--glass-text-muted)' }}
      />

      {/* Favorite button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onFavoriteToggle();
        }}
        className={`
          absolute top-3 right-3 p-1 rounded-lg transition-colors
          ${isFavorite
            ? 'text-[var(--neon-amber)]'
            : 'text-[var(--glass-text-muted)] hover:text-[var(--glass-text-secondary)]'
          }
        `}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <span className="material-symbols-outlined text-lg">
          {isFavorite ? 'star' : 'star_outline'}
        </span>
      </button>

      {/* Icon and title */}
      <div className="flex items-start gap-3 mb-3 pr-8 mt-2">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: isActive ? 'var(--semantic-success-bg)' : 'var(--glass-panel)' }}
        >
          <span
            className="material-symbols-outlined text-xl"
            style={{ color: isActive ? 'var(--semantic-success)' : 'var(--glass-text-muted)' }}
          >
            tune
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[var(--glass-text-primary)] truncate">
            {threshold.meta.title}
          </h3>
          <p className="text-xs text-[var(--glass-text-muted)]">
            Quality Assessment Configuration
          </p>
        </div>
      </div>

      {/* Description */}
      {threshold.meta.description && (
        <p className="text-sm text-[var(--glass-text-secondary)] line-clamp-2 mb-3">
          {threshold.meta.description}
        </p>
      )}

      {/* Dimension thresholds */}
      <div className="space-y-1.5 mb-3 p-2 rounded-lg bg-[var(--glass-surface)]">
        <DimensionDisplay
          label="Accuracy"
          minimum={thresholds.accuracy.minimum}
          target={thresholds.accuracy.target}
        />
        <DimensionDisplay
          label="Utility"
          minimum={thresholds.utility.minimum}
          target={thresholds.utility.target}
        />
        <DimensionDisplay
          label="Novelty"
          minimum={thresholds.novelty.minimum}
          target={thresholds.novelty.target}
        />
        <DimensionDisplay
          label="Provenance"
          minimum={thresholds.provenance.minimum}
          target={thresholds.provenance.target}
        />
      </div>

      {/* Composite threshold */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-[var(--glass-text-muted)]">Composite:</span>
        <div className="flex items-center gap-1">
          <span className="text-xs" style={getValueStyle(composite.minimum)}>
            {(composite.minimum * 100).toFixed(0)}%
          </span>
          <span className="text-xs text-[var(--glass-text-muted)]">/</span>
          <span className="text-xs" style={getValueStyle(composite.target)}>
            {(composite.target * 100).toFixed(0)}%
          </span>
          <span className="text-xs text-[var(--glass-text-muted)]">/</span>
          <span className="text-xs" style={getValueStyle(composite.excellent)}>
            {(composite.excellent * 100).toFixed(0)}%
          </span>
        </div>
      </div>

      {/* Features badges */}
      <div className="flex flex-wrap gap-2 mb-3">
        <span
          className="px-2 py-0.5 rounded-full text-xs"
          style={autoFilterEnabled
            ? { backgroundColor: 'var(--semantic-info-bg)', color: 'var(--semantic-info)' }
            : { backgroundColor: 'var(--glass-panel)', color: 'var(--glass-text-muted)' }
          }
        >
          <span className="material-symbols-outlined text-xs align-middle mr-0.5">
            {autoFilterEnabled ? 'filter_alt' : 'filter_alt_off'}
          </span>
          Auto-filter {autoFilterEnabled ? 'ON' : 'OFF'}
        </span>

        <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-400">
          {targetTypes.length} target type{targetTypes.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <span
          className="px-2 py-0.5 rounded-full"
          style={isActive
            ? { backgroundColor: 'var(--semantic-success-bg)', color: 'var(--semantic-success)' }
            : { backgroundColor: 'var(--glass-panel)', color: 'var(--glass-text-muted)' }
          }
        >
          {isActive ? 'Active' : 'Inactive'}
        </span>
        <span className="text-[var(--glass-text-muted)]">
          {new Date(threshold.meta.updatedAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

export default QualityThresholdCard;
