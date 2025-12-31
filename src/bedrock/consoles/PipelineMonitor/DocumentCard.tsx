// src/bedrock/consoles/PipelineMonitor/DocumentCard.tsx
// Card component for displaying documents in collection view
// Sprint: bedrock-alignment-v1 (Story 2.2)

import React from 'react';
import { GlassStatusBadge } from '../../primitives';
import { DOCUMENT_STATUSES, type DocumentStatus } from './pipeline.config';

// =============================================================================
// Types
// =============================================================================

interface DocumentCardProps {
  document: {
    id: string;
    title: string;
    tier: string;
    embedding_status: DocumentStatus;
    created_at: string;
    content_length?: number;
  };
  selected?: boolean;
  favorited?: boolean;
  onSelect?: () => void;
  onFavorite?: () => void;
}

// =============================================================================
// Component
// =============================================================================

export function DocumentCard({
  document,
  selected = false,
  favorited = false,
  onSelect,
  onFavorite,
}: DocumentCardProps) {
  const statusConfig = DOCUMENT_STATUSES[document.embedding_status] || DOCUMENT_STATUSES.pending;

  return (
    <div
      onClick={onSelect}
      className={`
        flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all
        ${selected
          ? 'border-[var(--neon-cyan)] bg-[var(--neon-cyan)]/5 shadow-[0_0_20px_-5px_var(--neon-cyan)]'
          : 'border-[var(--glass-border)] hover:border-[var(--glass-border-hover)] hover:bg-[var(--glass-elevated)]'
        }
      `}
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-lg bg-[var(--glass-panel)] flex items-center justify-center flex-shrink-0">
        <span className="material-symbols-outlined text-xl text-[var(--glass-text-muted)]">
          description
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-[var(--glass-text-primary)] truncate">
          {document.title}
        </h4>
        <p className="text-xs text-[var(--glass-text-subtle)]">
          {new Date(document.created_at).toLocaleDateString()}
          {document.content_length && ` · ${Math.round(document.content_length / 1000)}k chars`}
        </p>
      </div>

      {/* Tier Badge */}
      <span className="px-2 py-1 text-xs rounded bg-[var(--glass-panel)] text-[var(--glass-text-muted)] capitalize">
        {document.tier}
      </span>

      {/* Status Badge */}
      <GlassStatusBadge status={statusConfig.color} icon={statusConfig.icon} size="sm">
        {statusConfig.label}
      </GlassStatusBadge>

      {/* Favorite */}
      <button
        onClick={(e) => { e.stopPropagation(); onFavorite?.(); }}
        className={`p-1 rounded transition-colors ${
          favorited
            ? 'text-[var(--neon-amber)]'
            : 'text-[var(--glass-text-subtle)] hover:text-[var(--glass-text-muted)]'
        }`}
      >
        <span className="material-symbols-outlined text-lg">
          {favorited ? 'star' : 'star_outline'}
        </span>
      </button>
    </div>
  );
}

export default DocumentCard;
