// src/bedrock/consoles/ExperienceConsole/LifecycleConfigCard.tsx
// Card component for Lifecycle Config in grid/list view
// Sprint: S5-SL-LifecycleEngine v1

import React from 'react';
import type { ObjectCardProps } from '../../patterns/console-factory.types';
import type { LifecycleConfigPayload } from '@core/schema/lifecycle-config';

/**
 * Card component for displaying a Lifecycle Config in grid/list view
 * SINGLETON type - typically only one active config exists
 */
export function LifecycleConfigCard({
  object: config,
  selected,
  isFavorite,
  onClick,
  onFavoriteToggle,
  className = '',
}: ObjectCardProps<LifecycleConfigPayload>) {
  const isActive = config.meta.status === 'active';
  const { activeModelId, models } = config.payload;

  // Find active model details
  const activeModel = models.find((m) => m.id === activeModelId);
  const tierCount = activeModel?.tiers?.length ?? 0;
  const mappingCount = activeModel?.mappings?.length ?? 0;

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
      data-testid="lifecycle-config-card"
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
            timeline
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[var(--glass-text-primary)] truncate">
            {config.meta.title || 'Lifecycle Configuration'}
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

      {/* Active model info */}
      {activeModel && (
        <div className="mb-3">
          <div className="flex items-center gap-1 text-sm text-[var(--glass-text-primary)]">
            <span className="material-symbols-outlined text-sm" style={{ color: 'var(--semantic-success)' }}>eco</span>
            {activeModel.name}
          </div>
          {activeModel.isEditable === false && (
            <span className="text-xs text-[var(--glass-text-muted)]">(System Model)</span>
          )}
        </div>
      )}

      {/* Config summary */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {/* Tier count */}
        <span
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
          style={{ backgroundColor: 'var(--semantic-success-bg)', color: 'var(--semantic-success)' }}
        >
          <span className="material-symbols-outlined text-xs">category</span>
          {tierCount} Tiers
        </span>

        {/* Mapping count */}
        <span
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
          style={{ backgroundColor: 'var(--semantic-success-bg)', color: 'var(--semantic-success)' }}
        >
          <span className="material-symbols-outlined text-xs">link</span>
          {mappingCount} Mappings
        </span>

        {/* Models count */}
        <span
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
          style={{ backgroundColor: 'var(--semantic-info-bg)', color: 'var(--semantic-info)' }}
        >
          <span className="material-symbols-outlined text-xs">forest</span>
          {models.length} Model{models.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Tier preview (first 5 tiers) */}
      {activeModel?.tiers && activeModel.tiers.length > 0 && (
        <div className="flex items-center gap-1 text-sm text-[var(--glass-text-muted)] mb-3 overflow-hidden">
          {activeModel.tiers.slice(0, 5).map((tier, idx) => (
            <span key={tier.id} className="flex items-center gap-0.5 whitespace-nowrap">
              {idx > 0 && <span className="text-[var(--glass-text-muted)]">→</span>}
              <span>{tier.emoji}</span>
            </span>
          ))}
          {activeModel.tiers.length > 5 && (
            <span className="text-xs">+{activeModel.tiers.length - 5}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <span
          className="px-2 py-0.5 rounded-full"
          style={isActive
            ? { backgroundColor: 'var(--semantic-success-bg)', color: 'var(--semantic-success)' }
            : { backgroundColor: 'var(--glass-panel)', color: 'var(--glass-text-muted)' }
          }
        >
          {isActive ? 'Active' : config.meta.status === 'archived' ? 'Archived' : 'Draft'}
        </span>
        <span className="text-[var(--glass-text-muted)]">
          {new Date(config.meta.updatedAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

export default LifecycleConfigCard;
