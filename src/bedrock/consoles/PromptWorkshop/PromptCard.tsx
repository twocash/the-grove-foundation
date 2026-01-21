// src/bedrock/consoles/PromptWorkshop/PromptCard.tsx
// Prompt card component for grid/list view
// Sprint: prompt-unification-v1

import React from 'react';
import type { ObjectCardProps } from '../../patterns/console-factory.types';
import type { PromptPayload } from '@core/schema/prompt';
import { PROMPT_SOURCE_CONFIG, SEQUENCE_TYPE_CONFIG } from './PromptWorkshop.config';
import { ProvenanceBadge } from './ProvenanceBadge';

/**
 * Card component for displaying a prompt in grid/list view
 */
export function PromptCard({
  object: prompt,
  selected,
  isFavorite,
  onClick,
  onFavoriteToggle,
  className = '',
}: ObjectCardProps<PromptPayload>) {
  const sourceConfig = PROMPT_SOURCE_CONFIG[prompt.payload.source] || PROMPT_SOURCE_CONFIG.library;
  const isActive = prompt.meta.status === 'active';
  const sequenceCount = prompt.payload.sequences?.length || 0;
  const firstSequence = prompt.payload.sequences?.[0];
  const sequenceType = firstSequence?.groupType
    ? SEQUENCE_TYPE_CONFIG[firstSequence.groupType as keyof typeof SEQUENCE_TYPE_CONFIG]
    : null;

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
      data-testid="prompt-card"
    >
      {/* Source color bar at top */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
        style={{ backgroundColor: sourceConfig.color }}
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
          style={{ backgroundColor: `${sourceConfig.color}20` }}
        >
          <span
            className="material-symbols-outlined text-xl"
            style={{ color: sourceConfig.color }}
          >
            {sourceConfig.icon}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[var(--glass-text-primary)] truncate">
            {prompt.meta.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-[var(--glass-text-muted)]">
            <span>{sourceConfig.label}</span>
            <ProvenanceBadge provenance={prompt.payload.provenance} size="sm" />
          </div>
        </div>
      </div>

      {/* Execution prompt preview */}
      {prompt.payload.executionPrompt && (
        <p className="text-sm text-[var(--glass-text-secondary)] line-clamp-2 mb-3">
          {prompt.payload.executionPrompt}
        </p>
      )}

      {/* Sequence badge */}
      {sequenceCount > 0 && sequenceType && (
        <div className="flex items-center gap-2 mb-3">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
            style={{
              backgroundColor: `${sequenceType.color}20`,
              color: sequenceType.color,
            }}
          >
            <span className="material-symbols-outlined text-xs">{sequenceType.icon}</span>
            {firstSequence?.groupId.split('-').slice(1).join(' ')}
            {sequenceCount > 1 && ` +${sequenceCount - 1}`}
          </span>
        </div>
      )}

      {/* Targeting badges */}
      {prompt.payload.targeting.stages && prompt.payload.targeting.stages.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {prompt.payload.targeting.stages.slice(0, 3).map((stage) => (
            <span
              key={stage}
              className="px-2 py-0.5 rounded text-xs bg-[var(--glass-surface)] text-[var(--glass-text-muted)]"
            >
              {stage}
            </span>
          ))}
          {prompt.payload.targeting.stages.length > 3 && (
            <span className="px-2 py-0.5 rounded text-xs bg-[var(--glass-surface)] text-[var(--glass-text-muted)]">
              +{prompt.payload.targeting.stages.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Highlight trigger badges - Sprint: highlight-extraction-v1 */}
      {prompt.payload.highlightTriggers && prompt.payload.highlightTriggers.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {prompt.payload.highlightTriggers.slice(0, 2).map((trigger, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)] border border-[var(--neon-cyan)]/30"
            >
              <span className="opacity-70">{trigger.matchMode === 'exact' ? '=' : '~'}</span>
              {trigger.text}
            </span>
          ))}
          {prompt.payload.highlightTriggers.length > 2 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)]">
              +{prompt.payload.highlightTriggers.length - 2}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <span
          className="px-2 py-0.5 rounded-full"
          style={isActive
            ? { backgroundColor: 'var(--semantic-success-bg)', color: 'var(--semantic-success)' }
            : { backgroundColor: 'var(--semantic-warning-bg)', color: 'var(--semantic-warning)' }
          }
        >
          {isActive ? 'Active' : 'Draft'}
        </span>
        <div className="flex items-center gap-2 text-[var(--glass-text-muted)]">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">visibility</span>
            {prompt.payload.stats.impressions}
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">touch_app</span>
            {prompt.payload.stats.selections}
          </span>
        </div>
      </div>
    </div>
  );
}

export default PromptCard;
