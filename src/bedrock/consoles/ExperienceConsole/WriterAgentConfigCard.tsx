// src/bedrock/consoles/ExperienceConsole/WriterAgentConfigCard.tsx
// Card component for Writer Agent Config in grid/list view
// Sprint: experience-console-cleanup-v1

import React from 'react';
import type { ObjectCardProps } from '../../patterns/console-factory.types';
import type { WriterAgentConfigPayload } from '@core/schema/writer-agent-config';

// Display labels for voice settings
const FORMALITY_LABELS: Record<string, string> = {
  casual: 'Casual',
  professional: 'Professional',
  academic: 'Academic',
  technical: 'Technical',
};

const PERSPECTIVE_LABELS: Record<string, string> = {
  'first-person': '1st Person',
  'third-person': '3rd Person',
  neutral: 'Neutral',
};

const CITATION_LABELS: Record<string, string> = {
  inline: 'Inline',
  endnote: 'Endnote',
};

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
  const { voice, documentStructure, qualityRules } = config.payload;

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

      {/* Voice config summary */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {/* Formality */}
        <span
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
          style={{ backgroundColor: 'var(--semantic-success-bg)', color: 'var(--semantic-success)' }}
        >
          <span className="material-symbols-outlined text-xs">tune</span>
          {FORMALITY_LABELS[voice.formality] || voice.formality}
        </span>

        {/* Perspective */}
        <span
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
          style={{ backgroundColor: 'var(--semantic-info-bg)', color: 'var(--semantic-info)' }}
        >
          <span className="material-symbols-outlined text-xs">person</span>
          {PERSPECTIVE_LABELS[voice.perspective] || voice.perspective}
        </span>

        {/* Citation style */}
        <span
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
          style={{ backgroundColor: 'var(--neon-amber-bg)', color: 'var(--neon-amber)' }}
        >
          <span className="material-symbols-outlined text-xs">format_quote</span>
          {CITATION_LABELS[documentStructure.citationStyle]}
        </span>
      </div>

      {/* Quality indicators */}
      <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
        {qualityRules.requireCitations && (
          <span className="flex items-center gap-1" style={{ color: 'var(--semantic-success)' }}>
            <span className="material-symbols-outlined text-xs">check_circle</span>
            Citations
          </span>
        )}
        {qualityRules.flagUncertainty && (
          <span className="flex items-center gap-1" style={{ color: 'var(--semantic-warning)' }}>
            <span className="material-symbols-outlined text-xs">warning</span>
            Flags uncertainty
          </span>
        )}
        {documentStructure.includeLimitations && (
          <span className="flex items-center gap-1" style={{ color: 'var(--glass-text-muted)' }}>
            <span className="material-symbols-outlined text-xs">info</span>
            Limitations
          </span>
        )}
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
