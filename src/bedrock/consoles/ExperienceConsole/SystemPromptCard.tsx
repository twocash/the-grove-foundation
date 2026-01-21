// src/bedrock/consoles/ExperienceConsole/SystemPromptCard.tsx
// Card component for System Prompt in grid/list view
// Sprint: experiences-console-recovery-v1

import React from 'react';
import type { ObjectCardProps } from '../../patterns/console-factory.types';
import type { SystemPromptPayload } from '@core/schema/system-prompt';

/**
 * Card component for displaying a system prompt in grid/list view
 */
export function SystemPromptCard({
  object: prompt,
  selected,
  isFavorite,
  onClick,
  onFavoriteToggle,
  className = '',
}: ObjectCardProps<SystemPromptPayload>) {
  const isActive = prompt.meta.status === 'active';
  const responseMode = prompt.payload.responseMode || 'architect';

  // Color mapping for response modes (using semantic CSS variables)
  const modeStyles: Record<string, { style: React.CSSProperties; label: string }> = {
    architect: { style: { backgroundColor: 'var(--semantic-success-bg)', color: 'var(--semantic-success)' }, label: 'Architect' },
    librarian: { style: { backgroundColor: 'var(--semantic-info-bg)', color: 'var(--semantic-info)' }, label: 'Librarian' },
    contemplative: { style: { backgroundColor: 'var(--semantic-accent-secondary-bg)', color: 'var(--semantic-accent-secondary)' }, label: 'Contemplative' },
  };
  const modeConfig = modeStyles[responseMode] || modeStyles.architect;

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
      data-testid="system-prompt-card"
    >
      {/* Status bar at top */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
        style={{ backgroundColor: isActive ? 'var(--semantic-success)' : 'var(--semantic-warning)' }}
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
        <div className="w-10 h-10 rounded-lg bg-[#2F5C3B]/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-xl text-[#2F5C3B]">
            smart_toy
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[var(--glass-text-primary)] truncate">
            {prompt.meta.title}
          </h3>
          <p className="text-xs text-[var(--glass-text-muted)]">
            v{prompt.payload.version || 1}
          </p>
        </div>
      </div>

      {/* Identity preview */}
      {prompt.payload.identity && (
        <p className="text-sm text-[var(--glass-text-secondary)] line-clamp-2 mb-3">
          {prompt.payload.identity.substring(0, 100)}...
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <span
          className="px-2 py-0.5 rounded-full"
          style={
            isActive
              ? { backgroundColor: 'var(--semantic-success-bg)', color: 'var(--semantic-success)' }
              : prompt.meta.status === 'archived'
                ? { backgroundColor: 'var(--glass-panel)', color: 'var(--glass-text-muted)' }
                : { backgroundColor: 'var(--semantic-warning-bg)', color: 'var(--semantic-warning)' }
          }
        >
          {isActive ? 'Active' : prompt.meta.status === 'archived' ? 'Archived' : 'Draft'}
        </span>
        <span className="px-2 py-0.5 rounded-full" style={modeConfig.style}>
          {modeConfig.label}
        </span>
      </div>
    </div>
  );
}

export default SystemPromptCard;
