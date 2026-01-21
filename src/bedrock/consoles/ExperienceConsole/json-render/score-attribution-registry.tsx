// src/bedrock/consoles/ExperienceConsole/json-render/score-attribution-registry.tsx
// Sprint: S10.2-SL-AICuration v3 - Analytics + Override Workflows
// Pattern: json-render registry (maps catalog to React components)
// MANDATORY: Educational tone throughout - first-person plural, positive framing

import React from 'react';
import type {
  RenderElement,
  ScoreAttributionHeaderProps,
  StarRatingProps,
  AttributionDimensionProps,
  AttributionOverrideCtaProps,
  AttributionMetadataProps,
} from './score-attribution-catalog';

/**
 * Component registry interface
 */
export interface ScoreAttributionComponentRegistry {
  [key: string]: React.FC<{ element: RenderElement }>;
}

/**
 * Confidence level colors
 */
const CONFIDENCE_COLORS = {
  Low: 'text-[var(--semantic-warning)] bg-[var(--semantic-warning-bg)]',
  Medium: 'text-[var(--semantic-info)] bg-[var(--semantic-info-bg)]',
  High: 'text-grove-forest bg-grove-forest/10',
};

/**
 * Dimension display config
 */
const DIMENSION_CONFIG: Record<string, { label: string; icon: string }> = {
  accuracy: { label: 'Accuracy', icon: '✓' },
  utility: { label: 'Utility', icon: '⚡' },
  novelty: { label: 'Novelty', icon: '✨' },
  provenance: { label: 'Provenance', icon: '📜' },
};

/**
 * Star rating component (reused across dimensions)
 */
const StarRatingComponent: React.FC<{ value: number; size?: 'sm' | 'md' | 'lg' }> = ({
  value,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={`flex items-center gap-0.5 ${sizeClasses[size]}`} data-testid="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          style={{ color: star <= value ? 'var(--neon-amber)' : undefined }}
          className={star <= value ? '' : 'text-ink/20 dark:text-white/20'}
        >
          ★
        </span>
      ))}
    </div>
  );
};

/**
 * ScoreAttributionRegistry - Maps catalog components to React implementations
 *
 * EDUCATIONAL TONE REQUIREMENTS:
 * - Use first-person plural ("We found", "We noticed")
 * - Positive framing for findings
 * - Constructive suggestions ("To improve" not "Problems found")
 * - Never use "the model" or defensive language
 */
export const ScoreAttributionRegistry: ScoreAttributionComponentRegistry = {
  ScoreAttributionHeader: ({ element }) => {
    const props = element.props as ScoreAttributionHeaderProps;

    return (
      <header className="mb-6 pb-4 border-b border-ink/10 dark:border-white/10" data-testid="attribution-overall">
        {props.sproutTitle && (
          <p className="text-xs text-ink-muted dark:text-paper/60 mb-1 truncate">
            {props.sproutTitle}
          </p>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-ink dark:text-paper" data-testid="overall-score">
              {props.overallScore}
            </span>
            <span className="text-lg text-ink-muted dark:text-paper/60">/100</span>
            <span className="text-xl font-semibold text-grove-forest ml-2">
              {props.grade}
            </span>
          </div>
          <div className={`px-2 py-1 rounded text-xs font-medium ${CONFIDENCE_COLORS[props.confidenceLabel]}`}>
            Confidence: {props.confidenceLabel}
          </div>
        </div>
        {props.assessedAt && (
          <p className="text-xs text-ink-muted dark:text-paper/50 mt-2">
            Assessed: {new Date(props.assessedAt).toLocaleDateString()}
          </p>
        )}
      </header>
    );
  },

  StarRating: ({ element }) => {
    const props = element.props as StarRatingProps;
    return <StarRatingComponent value={props.value} size={props.size} />;
  },

  AttributionDimension: ({ element }) => {
    const props = element.props as AttributionDimensionProps;
    const config = DIMENSION_CONFIG[props.dimension] || { label: props.label, icon: '•' };

    return (
      <div
        className="p-4 rounded border border-ink/10 dark:border-white/10 mb-3"
        data-testid="attribution-dimension"
        data-dimension={props.dimension}
      >
        {/* Header with score and stars */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">{config.icon}</span>
            <span className="font-medium text-ink dark:text-paper" data-testid="dimension-name">
              {config.label.toUpperCase()}
            </span>
            <span className="text-lg font-bold text-ink dark:text-paper" data-testid="dimension-score">
              {props.score}
            </span>
            <span className="text-xs text-ink-muted dark:text-paper/60">/100</span>
          </div>
          <StarRatingComponent value={props.stars} size="sm" />
        </div>

        {/* Educational narrative summary - MANDATORY first-person plural */}
        <p className="text-sm text-ink/80 dark:text-paper/80 mb-3">
          {props.summary}
        </p>

        {/* Findings - positive framing first ("What we found") */}
        {props.findings.length > 0 && (
          <div className="mb-3">
            <span className="text-xs font-medium text-ink/60 dark:text-paper/60">
              What we found:
            </span>
            <ul className="list-disc list-inside text-sm text-ink dark:text-paper mt-1 space-y-0.5">
              {props.findings.map((finding, i) => (
                <li key={i} className="text-ink/80 dark:text-paper/80">{finding}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Improvement suggestion - constructive, not critical */}
        {props.suggestion && (
          <div
            className="text-sm flex items-start gap-1.5 p-2 rounded"
            style={{ color: 'var(--semantic-warning)', backgroundColor: 'var(--semantic-warning-bg)' }}
          >
            <span className="text-base">💡</span>
            <span>
              <span className="font-medium">To improve:</span> {props.suggestion}
            </span>
          </div>
        )}
      </div>
    );
  },

  AttributionOverrideCta: ({ element }) => {
    const props = element.props as AttributionOverrideCtaProps;

    if (!props.enabled) return null;

    return (
      <div className="mt-6 pt-4 border-t border-ink/10 dark:border-white/10">
        <button
          className="w-full px-4 py-2 bg-ink dark:bg-white text-paper dark:text-ink rounded
                     font-medium text-sm hover:bg-ink/90 dark:hover:bg-white/90 transition-colors"
          data-testid="request-override-button"
          data-sprout-id={props.sproutId}
        >
          {props.label}
        </button>
        <p className="text-xs text-ink-muted dark:text-paper/50 text-center mt-2">
          Disagree with this assessment? Request a manual review.
        </p>
      </div>
    );
  },

  AttributionMetadata: ({ element }) => {
    const props = element.props as AttributionMetadataProps;

    return (
      <div className="mt-4 p-3 bg-ink/5 dark:bg-white/5 rounded text-xs" data-testid="attribution-metadata">
        <div className="grid grid-cols-2 gap-2">
          {props.model && (
            <div>
              <span className="text-ink-muted dark:text-paper/50">Model:</span>
              <span className="ml-1 font-mono text-ink dark:text-paper">{props.model}</span>
            </div>
          )}
          {props.version && (
            <div>
              <span className="text-ink-muted dark:text-paper/50">Version:</span>
              <span className="ml-1 font-mono text-ink dark:text-paper">{props.version}</span>
            </div>
          )}
          <div>
            <span className="text-ink-muted dark:text-paper/50">Assessed:</span>
            <span className="ml-1 font-mono text-ink dark:text-paper">
              {new Date(props.assessedAt).toLocaleString()}
            </span>
          </div>
          {props.processingTime && (
            <div>
              <span className="text-ink-muted dark:text-paper/50">Time:</span>
              <span className="ml-1 font-mono text-ink dark:text-paper">{props.processingTime}ms</span>
            </div>
          )}
        </div>
      </div>
    );
  },
};

export default ScoreAttributionRegistry;
