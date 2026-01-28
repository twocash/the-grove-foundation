// src/bedrock/consoles/ExperienceConsole/WriterAgentConfigCard.tsx
// Card component for Writer Agent Config in grid/list view
// Sprint: experience-console-cleanup-v1

import React from 'react';
import type { ObjectCardProps } from '../../patterns/console-factory.types';
import type { WriterAgentConfigPayload } from '@core/schema/writer-agent-config';

// S28-PIPE: Removed label constants (no longer needed for text-only schema)

/**
 * Card component for displaying a Writer Agent Config in grid/list view
 * SINGLETON type - typically only one active config exists
 */
export function WriterAgentConfigCard({
  object: config,
  selected,
  isFavorite,
  onClick,
  onFavoriteToggle,
  className = '',
}: ObjectCardProps<WriterAgentConfigPayload>) {
  const isActive = config.meta.status === 'active';
  // S28-PIPE: Simplified payload (text fields only)
  const { writingStyle, resultsFormatting, citationsStyle } = config.payload;

  // Guard: Old archived configs may not have new schema fields
  if (!writingStyle || !resultsFormatting || !citationsStyle) {
    return null; // Don't render old schema configs
  }

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
      data-testid="writer-agent-config-card"
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
          style={{ backgroundColor: 'var(--semantic-success-bg)' }}
        >
          <span className="material-symbols-outlined text-xl" style={{ color: 'var(--semantic-success)' }}>
            edit_note
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[var(--glass-text-primary)] truncate">
            {config.meta.title || 'Writer Agent Config'}
          </h3>
          <p className="text-xs text-[var(--glass-text-muted)]">
            SINGLETON
          </p>
        </div>
      </div>

      {/* Description preview */}
      {config.meta.description && (
        <p className="text-sm text-[var(--glass-text-secondary)] line-clamp-2 mb-3">
          {config.meta.description}
        </p>
      )}

      {/* S28-PIPE: Simplified preview of text config fields */}
      <div className="space-y-2 mb-3">
        {/* Writing Style preview */}
        <div>
          <div className="text-xs text-[var(--glass-text-muted)] mb-0.5">Writing Style</div>
          <p className="text-xs text-[var(--glass-text-secondary)] line-clamp-2">
            {writingStyle.substring(0, 100)}...
          </p>
        </div>

        {/* Results Formatting preview */}
        <div>
          <div className="text-xs text-[var(--glass-text-muted)] mb-0.5">Results Formatting</div>
          <p className="text-xs text-[var(--glass-text-secondary)] line-clamp-1">
            {resultsFormatting.substring(0, 60)}...
          </p>
        </div>

        {/* Citations Style preview */}
        <div>
          <div className="text-xs text-[var(--glass-text-muted)] mb-0.5">Citations</div>
          <p className="text-xs text-[var(--glass-text-secondary)] line-clamp-1">
            {citationsStyle.substring(0, 60)}...
          </p>
        </div>
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
          {isActive ? 'Active' : 'Draft'}
        </span>
        <span className="text-[var(--glass-text-muted)]">
          {new Date(config.meta.updatedAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

export default WriterAgentConfigCard;
