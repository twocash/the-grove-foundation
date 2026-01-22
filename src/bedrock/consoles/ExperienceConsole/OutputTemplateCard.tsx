// src/bedrock/consoles/ExperienceConsole/OutputTemplateCard.tsx
// Card component for Output Template in grid/list view
// Sprint: prompt-template-architecture-v1
//
// DEX: Provenance as Infrastructure - displays source badge for provenance tracking

import React from 'react';
import type { ObjectCardProps } from '../../patterns/console-factory.types';
import type { OutputTemplatePayload, OutputTemplateSource, AgentType } from '@core/schema/output-template';

// =============================================================================
// Display Configuration
// =============================================================================

// Category colors for top bar
const CATEGORY_COLORS: Record<string, string> = {
  technical: 'var(--semantic-info)',
  strategy: 'var(--neon-violet)',
  policy: 'var(--neon-amber)',
  content: 'var(--semantic-success)',
  research: 'var(--neon-cyan)',
  default: 'var(--glass-text-muted)',
};

// Source badge configuration
const SOURCE_CONFIG: Record<OutputTemplateSource, { label: string; color: string; bg: string } | null> = {
  'system-seed': {
    label: 'SYSTEM',
    color: 'var(--glass-text-muted)',
    bg: 'var(--glass-panel)',
  },
  'forked': {
    label: 'FORKED',
    color: 'var(--semantic-info)',
    bg: 'var(--semantic-info-bg)',
  },
  'imported': {
    label: 'IMPORTED',
    color: 'var(--neon-violet)',
    bg: 'var(--neon-violet-bg)',
  },
  'user-created': null, // No badge for user-created
};

// Agent type configuration
const AGENT_TYPE_CONFIG: Record<AgentType, { label: string; icon: string; color: string; bg: string }> = {
  writer: {
    label: 'Writer',
    icon: 'edit_note',
    color: 'var(--semantic-success)',
    bg: 'var(--semantic-success-bg)',
  },
  research: {
    label: 'Research',
    icon: 'search',
    color: 'var(--neon-cyan)',
    bg: 'var(--neon-cyan-bg)',
  },
  code: {
    label: 'Code',
    icon: 'code',
    color: 'var(--neon-violet)',
    bg: 'var(--neon-violet-bg)',
  },
};

// Status configuration
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active: {
    label: 'Active',
    color: 'var(--semantic-success)',
    bg: 'var(--semantic-success-bg)',
  },
  draft: {
    label: 'Draft',
    color: 'var(--neon-amber)',
    bg: 'var(--neon-amber-bg)',
  },
  archived: {
    label: 'Archived',
    color: 'var(--glass-text-muted)',
    bg: 'var(--glass-panel)',
  },
};

// =============================================================================
// Component
// =============================================================================

/**
 * Card component for displaying an Output Template in grid/list view.
 *
 * Visual elements:
 * - Category color bar at top
 * - Source badge (SYSTEM/FORKED/IMPORTED, none for user-created)
 * - Icon + Title + Version
 * - Description (2-line truncate)
 * - Agent type badge
 * - Status badge
 * - Favorite toggle
 */
export function OutputTemplateCard({
  object: template,
  selected,
  isFavorite,
  onClick,
  onFavoriteToggle,
  className = '',
}: ObjectCardProps<OutputTemplatePayload>) {
  const { name, description, agentType, source, status, isDefault, version, config } = template.payload;

  // Get category color for top bar
  const categoryColor = CATEGORY_COLORS[config.category || ''] || CATEGORY_COLORS.default;

  // Get source badge config (null for user-created)
  const sourceBadge = SOURCE_CONFIG[source];

  // Get agent type config
  const agentConfig = AGENT_TYPE_CONFIG[agentType];

  // Get status config
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.draft;

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
      data-testid="output-template-card"
    >
      {/* Category color bar at top */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
        style={{ backgroundColor: categoryColor }}
      />

      {/* Source badge (top-left, inside card) */}
      {sourceBadge && (
        <span
          className="absolute top-3 left-3 px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider"
          style={{ backgroundColor: sourceBadge.bg, color: sourceBadge.color }}
        >
          {sourceBadge.label}
        </span>
      )}

      {/* Favorite button (top-right) */}
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
      <div className="flex items-start gap-3 mb-3 pr-8 mt-6">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: agentConfig.bg }}
        >
          <span className="material-symbols-outlined text-xl" style={{ color: agentConfig.color }}>
            {template.meta.icon || agentConfig.icon}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[var(--glass-text-primary)] truncate">
            {name || template.meta.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-[var(--glass-text-muted)]">
            <span>v{version}</span>
            {isDefault && (
              <span
                className="px-1 py-0.5 rounded text-[10px] uppercase"
                style={{ backgroundColor: 'var(--neon-amber-bg)', color: 'var(--neon-amber)' }}
              >
                Default
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description preview */}
      {description && (
        <p className="text-sm text-[var(--glass-text-secondary)] line-clamp-2 mb-3">
          {description}
        </p>
      )}

      {/* Agent type badge */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
          style={{ backgroundColor: agentConfig.bg, color: agentConfig.color }}
        >
          <span className="material-symbols-outlined text-xs">{agentConfig.icon}</span>
          {agentConfig.label}
        </span>

        {/* Category badge (if set) */}
        {config.category && (
          <span
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs capitalize"
            style={{ backgroundColor: 'var(--glass-panel)', color: categoryColor }}
          >
            {config.category}
          </span>
        )}

        {/* Citation info (for writer templates) */}
        {agentType === 'writer' && config.citationStyle && (
          <span
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs uppercase"
            style={{ backgroundColor: 'var(--glass-panel)', color: 'var(--glass-text-muted)' }}
          >
            <span className="material-symbols-outlined text-xs">format_quote</span>
            {config.citationStyle}
          </span>
        )}
      </div>

      {/* Footer: Status + Updated date */}
      <div className="flex items-center justify-between text-xs">
        <span
          className="px-2 py-0.5 rounded-full"
          style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
        >
          {statusConfig.label}
        </span>
        <span className="text-[var(--glass-text-muted)]">
          {new Date(template.meta.updatedAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

export default OutputTemplateCard;
