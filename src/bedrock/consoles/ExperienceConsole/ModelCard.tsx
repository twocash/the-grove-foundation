// src/bedrock/consoles/ExperienceConsole/ModelCard.tsx
// Card component for Lifecycle Model in grid/list view
// Sprint: EPIC4-SL-MultiModel v1

import React from 'react';
import type { ObjectCardProps } from '../../patterns/console-factory.types';
import type { LifecycleModelPayload } from '@core/schema/lifecycle-model';

// Style mapping for model types (using semantic CSS variables)
const MODEL_TYPE_STYLES: Record<LifecycleModelPayload['modelType'], { style: React.CSSProperties; label: string; icon: string }> = {
  botanical: { style: { backgroundColor: 'var(--semantic-success-bg)', color: 'var(--semantic-success)' }, label: 'Botanical', icon: 'nature' },
  academic: { style: { backgroundColor: 'var(--semantic-info-bg)', color: 'var(--semantic-info)' }, label: 'Academic', icon: 'school' },
  research: { style: { backgroundColor: 'var(--semantic-accent-secondary-bg)', color: 'var(--semantic-accent-secondary)' }, label: 'Research', icon: 'science' },
  creative: { style: { backgroundColor: 'var(--semantic-accent-primary-bg)', color: 'var(--semantic-accent-primary)' }, label: 'Creative', icon: 'palette' },
};

/**
 * Card component for displaying a lifecycle model in grid/list view
 */
export function ModelCard({
  object: model,
  selected,
  isFavorite,
  onClick,
  onFavoriteToggle,
  className = '',
}: ObjectCardProps<LifecycleModelPayload>) {
  const modelType = model.payload.modelType;
  const modelTypeConfig = MODEL_TYPE_STYLES[modelType] || MODEL_TYPE_STYLES.botanical;
  const tierCount = model.payload.tiers.length;
  const version = model.payload.version;

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
      data-testid="lifecycle-model-card"
    >
      {/* Status bar at top */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
        style={{ backgroundColor: modelTypeConfig.style.color }}
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
          style={modelTypeConfig.style}
        >
          <span className="material-symbols-outlined text-xl">
            {modelTypeConfig.icon}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[var(--glass-text-primary)] truncate">
            {model.meta.title}
          </h3>
          <p className="text-xs text-[var(--glass-text-muted)] font-mono">
            v{version}
          </p>
        </div>
      </div>

      {/* Description preview */}
      {model.meta.description && (
        <p className="text-sm text-[var(--glass-text-secondary)] line-clamp-2 mb-3">
          {model.meta.description}
        </p>
      )}

      {/* Model info */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {/* Model type */}
        <span
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
          style={modelTypeConfig.style}
        >
          <span className="material-symbols-outlined text-xs">{modelTypeConfig.icon}</span>
          {modelTypeConfig.label}
        </span>

        {/* Tier count */}
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: 'var(--glass-panel)', color: 'var(--glass-text-muted)' }}>
          <span className="material-symbols-outlined text-xs">view_list</span>
          {tierCount} {tierCount === 1 ? 'tier' : 'tiers'}
        </span>
      </div>

      {/* Tier preview */}
      <div className="mb-3">
        <p className="text-xs text-[var(--glass-text-muted)] mb-1">Tier structure:</p>
        <div className="flex flex-wrap gap-1">
          {model.payload.tiers.slice(0, 5).map((tier, index) => (
            <span
              key={tier.id}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[var(--glass-border)] text-[var(--glass-text-secondary)]"
            >
              {tier.emoji && <span>{tier.emoji}</span>}
              <span>{tier.label}</span>
            </span>
          ))}
          {tierCount > 5 && (
            <span className="px-2 py-0.5 rounded-full text-xs bg-[var(--glass-border)] text-[var(--glass-text-muted)]">
              +{tierCount - 5} more
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--glass-text-muted)]">
          {new Date(model.meta.createdAt).toLocaleDateString()}
        </span>
        <span className="px-2 py-0.5 rounded-full" style={modelTypeConfig.style}>
          {modelTypeConfig.label}
        </span>
      </div>
    </div>
  );
}

export default ModelCard;
