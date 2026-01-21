// src/bedrock/consoles/NurseryConsole/SproutCard.tsx
// Sprout card component for Nursery Console
// Sprint: S10.1-SL-AICuration v2 (Quality Badge Integration)

import React from 'react';
import type { ObjectCardProps } from '../../patterns/console-factory.types';
import type { SproutPayload } from './useNurseryData';
import { NURSERY_STATUS_CONFIG, type NurseryDisplayStatus } from './NurseryConsole.config';
import { QualityScoreBadge, QualityPendingBadge } from '../../primitives/QualityScoreBadge';

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Map ResearchSproutStatus to NurseryDisplayStatus
 */
function getDisplayStatus(status: string): NurseryDisplayStatus {
  if (status === 'completed') return 'ready';
  if (status === 'blocked') return 'failed';
  return 'archived';
}

/**
 * Format relative time
 */
function formatTimeSince(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// =============================================================================
// Quality Badge Renderer
// =============================================================================

interface QualityBadgeRendererProps {
  qualityStatus: SproutPayload['qualityStatus'];
  qualityScore?: SproutPayload['qualityScore'];
}

/**
 * Renders the appropriate quality badge based on status
 */
function QualityBadgeRenderer({ qualityStatus, qualityScore }: QualityBadgeRendererProps) {
  switch (qualityStatus) {
    case 'scored':
      if (!qualityScore) return null;
      return (
        <QualityScoreBadge
          score={qualityScore.overall}
          dimensions={qualityScore.dimensions}
          size="sm"
          showPercentage
        />
      );

    case 'pending':
      return <QualityPendingBadge size="sm" />;

    case 'error':
    case 'not-assessed':
    default:
      // Hide badge gracefully for error/not-assessed states
      return null;
  }
}

// =============================================================================
// Component
// =============================================================================

/**
 * Card component for displaying a sprout in grid/list view
 * Implements ObjectCardProps<SproutPayload> for factory pattern
 */
export function SproutCard({
  object: sprout,
  selected,
  isFavorite,
  onClick,
  onFavoriteToggle,
  className = '',
}: ObjectCardProps<SproutPayload>) {
  const displayStatus = getDisplayStatus(sprout.payload.status);
  const statusConfig = NURSERY_STATUS_CONFIG[displayStatus];
  const confidencePercent = Math.round((sprout.payload.inferenceConfidence ?? 0) * 100);
  const timeSince = formatTimeSince(sprout.meta.updatedAt);

  // Status color mapping (using semantic CSS variables)
  const statusStyles: Record<NurseryDisplayStatus, { bar: React.CSSProperties; badge: React.CSSProperties }> = {
    ready: {
      bar: { backgroundColor: 'var(--semantic-success)' },
      badge: { backgroundColor: 'var(--semantic-success-bg)', color: 'var(--semantic-success)' },
    },
    failed: {
      bar: { backgroundColor: 'var(--semantic-error)' },
      badge: { backgroundColor: 'var(--semantic-error-bg)', color: 'var(--semantic-error)' },
    },
    archived: {
      bar: { backgroundColor: 'var(--glass-text-muted)' },
      badge: { backgroundColor: 'var(--glass-panel)', color: 'var(--glass-text-muted)' },
    },
  };

  const styles = statusStyles[displayStatus];

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
      data-testid="sprout-card"
    >
      {/* Status color bar at top */}
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" style={styles.bar} />

      {/* Top right: Quality Badge + Favorite */}
      <div className="absolute top-3 right-3 flex items-center gap-2">
        {/* Quality badge */}
        <QualityBadgeRenderer
          qualityStatus={sprout.payload.qualityStatus}
          qualityScore={sprout.payload.qualityScore}
        />

        {/* Favorite button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFavoriteToggle();
          }}
          className={`
            p-1 rounded-lg transition-colors
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
      </div>

      {/* Title and spark */}
      <div className="mt-2 pr-20">
        <h3 className="font-medium text-[var(--glass-text-primary)] truncate mb-1">
          {sprout.meta.title}
        </h3>
        <p className="text-sm text-[var(--glass-text-secondary)] line-clamp-2 mb-3">
          {sprout.payload.spark}
        </p>
      </div>

      {/* Tags */}
      {sprout.payload.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {sprout.payload.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs rounded-full bg-[var(--glass-border)] text-[var(--glass-text-muted)]"
            >
              {tag}
            </span>
          ))}
          {sprout.payload.tags.length > 3 && (
            <span className="px-2 py-0.5 text-xs rounded-full bg-[var(--glass-border)] text-[var(--glass-text-muted)]">
              +{sprout.payload.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer: Status, Confidence, Time */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {/* Status badge */}
          <span
            className="flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={styles.badge}
          >
            <span className="material-symbols-outlined text-sm">{statusConfig.icon}</span>
            {statusConfig.label}
          </span>

          {/* Needs review indicator */}
          {sprout.payload.requiresReview && !sprout.payload.reviewed && (
            <span
              className="flex items-center gap-1 px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'var(--semantic-warning-bg)', color: 'var(--semantic-warning)' }}
            >
              <span className="material-symbols-outlined text-sm">rate_review</span>
              Review
            </span>
          )}
        </div>

        {/* Confidence and time */}
        <div className="flex items-center gap-2 text-[var(--glass-text-muted)]">
          {confidencePercent > 0 && (
            <span title="Inference confidence">
              {confidencePercent}%
            </span>
          )}
          <span>{timeSince}</span>
        </div>
      </div>
    </div>
  );
}

export default SproutCard;
