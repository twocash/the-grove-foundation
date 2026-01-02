// src/bedrock/components/FavoriteToggle.tsx
// Favorite toggle button for collection items
// Sprint: bedrock-foundation-v1

import React from 'react';
import type { FavoriteToggleProps } from '../patterns/collection-view.types';

// =============================================================================
// FavoriteToggle Component
// =============================================================================

export function FavoriteToggle({
  isFavorite,
  onToggle,
  size = 'md',
  label,
}: FavoriteToggleProps) {
  const sizeClasses = {
    sm: 'text-base p-1',
    md: 'text-xl p-1.5',
    lg: 'text-2xl p-2',
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`
        inline-flex items-center gap-1 rounded-lg transition-colors
        ${sizeClasses[size]}
        ${isFavorite
          ? 'text-[var(--neon-amber)] hover:text-[var(--neon-amber)]'
          : 'text-[var(--glass-text-muted)] hover:text-[var(--neon-amber)]'
        }
      `}
      title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <span className="material-symbols-outlined" style={{ fontVariationSettings: isFavorite ? "'FILL' 1" : "'FILL' 0" }}>
        star
      </span>
      {label && (
        <span className="text-sm">{label}</span>
      )}
    </button>
  );
}

// =============================================================================
// FavoritesFilter Component
// =============================================================================

interface FavoritesFilterProps {
  showFavoritesOnly: boolean;
  onToggle: () => void;
  favoritesCount: number;
}

export function FavoritesFilter({
  showFavoritesOnly,
  onToggle,
  favoritesCount,
}: FavoritesFilterProps) {
  return (
    <button
      onClick={onToggle}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg text-sm
        border transition-colors
        ${showFavoritesOnly
          ? 'border-[var(--neon-amber)]/60 bg-[var(--neon-amber)]/10 text-[var(--neon-amber)]'
          : 'border-[var(--glass-border-bright)] bg-[var(--glass-solid)] text-[var(--glass-text-secondary)] hover:border-[var(--neon-amber)]/50'
        }
      `}
    >
      <span
        className="material-symbols-outlined text-base"
        style={{ fontVariationSettings: showFavoritesOnly ? "'FILL' 1" : "'FILL' 0" }}
      >
        star
      </span>
      <span>Favorites</span>
      {favoritesCount > 0 && (
        <span className={`
          text-xs px-1.5 py-0.5 rounded-full
          ${showFavoritesOnly
            ? 'bg-[var(--neon-amber)]/20'
            : 'bg-[var(--glass-panel)]'
          }
        `}>
          {favoritesCount}
        </span>
      )}
    </button>
  );
}

export default FavoriteToggle;
