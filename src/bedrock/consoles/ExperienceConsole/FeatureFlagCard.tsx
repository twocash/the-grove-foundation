// src/bedrock/consoles/ExperienceConsole/FeatureFlagCard.tsx
// Card component for Feature Flag in grid/list view
// Sprint: feature-flags-v1

import React from 'react';
import type { ObjectCardProps } from '../../patterns/console-factory.types';
import type { FeatureFlagPayload, FeatureFlagCategory } from '@core/schema/feature-flag';

// Color mapping for categories (using semantic CSS variables)
const CATEGORY_STYLES: Record<FeatureFlagCategory, { style: React.CSSProperties; label: string }> = {
  experience: { style: { backgroundColor: 'var(--semantic-success-bg)', color: 'var(--semantic-success)' }, label: 'Experience' },
  research: { style: { backgroundColor: 'var(--semantic-accent-secondary-bg)', color: 'var(--semantic-accent-secondary)' }, label: 'Research' },
  experimental: { style: { backgroundColor: 'var(--semantic-warning-bg)', color: 'var(--semantic-warning)' }, label: 'Experimental' },
  internal: { style: { backgroundColor: 'var(--glass-panel)', color: 'var(--glass-text-muted)' }, label: 'Internal' },
};

/**
 * Card component for displaying a feature flag in grid/list view
 */
export function FeatureFlagCard({
  object: flag,
  selected,
  isFavorite,
  onClick,
  onFavoriteToggle,
  className = '',
}: ObjectCardProps<FeatureFlagPayload>) {
  const isAvailable = flag.payload.available;
  const isDefaultEnabled = flag.payload.defaultEnabled;
  const showInHeader = flag.payload.showInExploreHeader;
  const category = flag.payload.category;
  const categoryConfig = CATEGORY_STYLES[category] || CATEGORY_STYLES.experimental;

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
      data-testid="feature-flag-card"
    >
      {/* Status bar at top */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
        style={{ backgroundColor: isAvailable ? 'var(--semantic-success)' : 'var(--semantic-error)' }}
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
          style={{ backgroundColor: isAvailable ? 'var(--semantic-warning-bg)' : 'var(--glass-panel)' }}
        >
          <span
            className="material-symbols-outlined text-xl"
            style={{ color: isAvailable ? 'var(--semantic-warning)' : 'var(--glass-text-muted)' }}
          >
            {isAvailable ? 'toggle_on' : 'toggle_off'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[var(--glass-text-primary)] truncate">
            {flag.meta.title}
          </h3>
          <p className="text-xs text-[var(--glass-text-muted)] font-mono">
            {flag.payload.flagId}
          </p>
        </div>
      </div>

      {/* Description preview */}
      {flag.meta.description && (
        <p className="text-sm text-[var(--glass-text-secondary)] line-clamp-2 mb-3">
          {flag.meta.description}
        </p>
      )}

      {/* State indicators */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {/* Default enabled state */}
        <span
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
          style={isDefaultEnabled
            ? { backgroundColor: 'var(--semantic-success-bg)', color: 'var(--semantic-success)' }
            : { backgroundColor: 'var(--glass-panel)', color: 'var(--glass-text-muted)' }
          }
        >
          <span className="material-symbols-outlined text-xs">
            {isDefaultEnabled ? 'check_circle' : 'radio_button_unchecked'}
          </span>
          {isDefaultEnabled ? 'On by default' : 'Off by default'}
        </span>

        {/* Header visibility */}
        {showInHeader && (
          <span
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
            style={{ backgroundColor: 'var(--semantic-info-bg)', color: 'var(--semantic-info)' }}
          >
            <span className="material-symbols-outlined text-xs">visibility</span>
            Header
          </span>
        )}

        {/* A/B Testing indicator */}
        {flag.payload.modelVariants && flag.payload.modelVariants.length > 0 && (
          <span
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
            style={{ backgroundColor: 'var(--semantic-accent-secondary-bg)', color: 'var(--semantic-accent-secondary)' }}
          >
            <span className="material-symbols-outlined text-xs">science</span>
            A/B Test ({flag.payload.modelVariants.length})
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <span
          className="px-2 py-0.5 rounded-full"
          style={isAvailable
            ? { backgroundColor: 'var(--semantic-success-bg)', color: 'var(--semantic-success)' }
            : { backgroundColor: 'var(--semantic-error-bg)', color: 'var(--semantic-error)' }
          }
        >
          {isAvailable ? 'Available' : 'Disabled'}
        </span>
        <span className="px-2 py-0.5 rounded-full" style={categoryConfig.style}>
          {categoryConfig.label}
        </span>
      </div>
    </div>
  );
}

export default FeatureFlagCard;
