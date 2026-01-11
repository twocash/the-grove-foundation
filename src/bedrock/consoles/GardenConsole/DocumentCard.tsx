// src/bedrock/consoles/GardenConsole/DocumentCard.tsx
// Card component for displaying documents in grid view (vertical layout)
// Sprint: hotfix-pipeline-factory-v2

import React from 'react';
import type { ObjectCardProps } from '../../patterns/console-factory.types';
import { GlassStatusBadge } from '../../primitives';
import { DOCUMENT_STATUSES } from './pipeline.config';
import { capitalize, type DocumentPayload } from './types';

// =============================================================================
// Component
// =============================================================================

export function DocumentCard({
  object,
  selected,
  isFavorite,
  onClick,
  onFavoriteToggle,
}: ObjectCardProps<DocumentPayload>) {
  const statusConfig = DOCUMENT_STATUSES[object.payload.embedding_status] || DOCUMENT_STATUSES.pending;
  const tier = object.payload.tier || 'seed';
  const title = object.meta.title || 'Untitled Document';

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-xl border p-4 cursor-pointer transition-all
        ${selected
          ? 'border-[var(--neon-cyan)] bg-[var(--neon-cyan)]/5 ring-1 ring-[var(--neon-cyan)]/50'
          : 'border-[var(--glass-border)] bg-[var(--glass-solid)] hover:border-[var(--glass-border-bright)] hover:bg-[var(--glass-elevated)]'
        }
      `}
    >
      {/* Favorite button - top right */}
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

      {/* Icon and title row */}
      <div className="flex items-start gap-3 mb-3 pr-8">
        <div className="w-10 h-10 rounded-lg bg-[var(--glass-panel)] flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-xl text-[var(--glass-text-muted)]">
            description
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[var(--glass-text-primary)] truncate">
            {title}
          </h3>
          <p className="text-xs text-[var(--glass-text-muted)]">
            {new Date(object.meta.createdAt).toLocaleDateString()}
            {object.payload.content_length ? ` · ${Math.round(object.payload.content_length / 1000)}k chars` : ''}
          </p>
        </div>
      </div>

      {/* Footer with tier and status */}
      <div className="flex items-center justify-between">
        <span className="px-2 py-0.5 text-xs rounded bg-[var(--glass-panel)] text-[var(--glass-text-muted)]">
          {capitalize(tier)}
        </span>
        <GlassStatusBadge status={statusConfig.color} icon={statusConfig.icon} size="sm">
          {statusConfig.label}
        </GlassStatusBadge>
      </div>
    </div>
  );
}

export default DocumentCard;
