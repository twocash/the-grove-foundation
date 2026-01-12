// src/bedrock/consoles/ExperienceConsole/FeatureFlagCard.tsx
// Card component for Feature Flag in grid/list view
// Sprint: feature-flags-v1

import React from 'react';
import type { ObjectCardProps } from '../../patterns/console-factory.types';
import type { FeatureFlagPayload, FeatureFlagCategory } from '@core/schema/feature-flag';

// Color mapping for categories
const CATEGORY_COLORS: Record<FeatureFlagCategory, { bg: string; text: string; label: string }> = {
  experience: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Experience' },
  research: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Research' },
  experimental: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Experimental' },
  internal: { bg: 'bg-slate-500/20', text: 'text-slate-400', label: 'Internal' },
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
  const categoryConfig = CATEGORY_COLORS[category] || CATEGORY_COLORS.experimental;

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
        className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${
          isAvailable ? 'bg-green-500' : 'bg-red-500'
        }`}
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
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          isAvailable ? 'bg-[#D95D39]/20' : 'bg-slate-500/20'
        }`}>
          <span className={`material-symbols-outlined text-xl ${
            isAvailable ? 'text-[#D95D39]' : 'text-slate-400'
          }`}>
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
        <span className={`
          flex items-center gap-1 px-2 py-0.5 rounded-full text-xs
          ${isDefaultEnabled
            ? 'bg-green-500/20 text-green-400'
            : 'bg-slate-500/20 text-slate-400'
          }
        `}>
          <span className="material-symbols-outlined text-xs">
            {isDefaultEnabled ? 'check_circle' : 'radio_button_unchecked'}
          </span>
          {isDefaultEnabled ? 'On by default' : 'Off by default'}
        </span>

        {/* Header visibility */}
        {showInHeader && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400">
            <span className="material-symbols-outlined text-xs">visibility</span>
            Header
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <span
          className={`
            px-2 py-0.5 rounded-full
            ${isAvailable
              ? 'bg-green-500/20 text-green-400'
              : 'bg-red-500/20 text-red-400'
            }
          `}
        >
          {isAvailable ? 'Available' : 'Disabled'}
        </span>
        <span className={`px-2 py-0.5 rounded-full ${categoryConfig.bg} ${categoryConfig.text}`}>
          {categoryConfig.label}
        </span>
      </div>
    </div>
  );
}

export default FeatureFlagCard;
