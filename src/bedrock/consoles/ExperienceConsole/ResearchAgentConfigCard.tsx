// src/bedrock/consoles/ExperienceConsole/ResearchAgentConfigCard.tsx
// Card component for Research Agent Config in grid/list view
// Sprint: experience-console-cleanup-v1

import React from 'react';
import type { ObjectCardProps } from '../../patterns/console-factory.types';
import type { ResearchAgentConfigPayload } from '@core/schema/research-agent-config';

// Source type display config
const SOURCE_LABELS: Record<string, string> = {
  academic: 'Academic',
  practitioner: 'Practitioner',
  news: 'News',
  primary: 'Primary',
};

/**
 * Card component for displaying a Research Agent Config in grid/list view
 * SINGLETON type - typically only one active config exists
 */
export function ResearchAgentConfigCard({
  object: config,
  selected,
  isFavorite,
  onClick,
  onFavoriteToggle,
  className = '',
}: ObjectCardProps<ResearchAgentConfigPayload>) {
  const isActive = config.meta.status === 'active';
  const { searchDepth, sourcePreferences, confidenceThreshold, maxApiCalls } = config.payload;

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
      data-testid="research-agent-config-card"
    >
      {/* Status bar at top */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
        style={{ backgroundColor: isActive ? 'var(--neon-purple)' : 'var(--glass-text-muted)' }}
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
        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-500/20">
          <span className="material-symbols-outlined text-xl text-purple-400">
            search
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[var(--glass-text-primary)] truncate">
            {config.meta.title || 'Research Agent Config'}
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

      {/* Config summary */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {/* Search depth */}
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-400">
          <span className="material-symbols-outlined text-xs">layers</span>
          Depth: {searchDepth}
        </span>

        {/* API limit */}
        <span
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
          style={{ backgroundColor: 'var(--semantic-info-bg)', color: 'var(--semantic-info)' }}
        >
          <span className="material-symbols-outlined text-xs">api</span>
          Max: {maxApiCalls}
        </span>

        {/* Confidence */}
        <span
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
          style={{ backgroundColor: 'var(--semantic-success-bg)', color: 'var(--semantic-success)' }}
        >
          <span className="material-symbols-outlined text-xs">verified</span>
          {Math.round(confidenceThreshold * 100)}%
        </span>
      </div>

      {/* Source preferences */}
      <div className="text-xs text-[var(--glass-text-muted)] mb-3">
        Sources: {sourcePreferences.map(s => SOURCE_LABELS[s] || s).join(', ')}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <span
          className="px-2 py-0.5 rounded-full"
          style={isActive
            ? { backgroundColor: 'rgba(168, 85, 247, 0.2)', color: 'var(--neon-purple)' }
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

export default ResearchAgentConfigCard;
