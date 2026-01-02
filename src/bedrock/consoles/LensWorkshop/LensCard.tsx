// src/bedrock/consoles/LensWorkshop/LensCard.tsx
// Lens card component showing real Persona fields
// Migration: MIGRATION-001-lens

import React from 'react';
import type { ObjectCardProps } from '../../patterns/console-factory.types';
import type { LensPayload } from '../../types/lens';
import { LENS_COLOR_CONFIG, NARRATIVE_STYLES } from '../../types/lens';

/**
 * Card component for displaying a lens in grid/list view
 */
export function LensCard({
  object: lens,
  selected,
  isFavorite,
  onClick,
  onFavoriteToggle,
  className = '',
}: ObjectCardProps<LensPayload>) {
  const colorConfig = LENS_COLOR_CONFIG[lens.payload.color] || LENS_COLOR_CONFIG.slate;
  const styleLabel = NARRATIVE_STYLES.find(s => s.value === lens.payload.narrativeStyle)?.label || 'Balanced';
  const isActive = lens.meta.status === 'active';

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
      data-testid="lens-card"
    >
      {/* Color bar at top */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
        style={{ backgroundColor: colorConfig.hex }}
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
          style={{ backgroundColor: `${colorConfig.hex}20` }}
        >
          <span
            className="material-symbols-outlined text-xl"
            style={{ color: colorConfig.hex }}
          >
            {lens.meta.icon === 'Compass' ? 'explore' :
             lens.meta.icon === 'Home' ? 'home' :
             lens.meta.icon === 'GraduationCap' ? 'school' :
             lens.meta.icon === 'Settings' ? 'settings' :
             lens.meta.icon === 'Globe' ? 'public' :
             lens.meta.icon === 'Building2' ? 'apartment' :
             lens.meta.icon === 'Briefcase' ? 'work' :
             lens.meta.icon === 'Boxes' ? 'inventory_2' :
             'filter_alt'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[var(--glass-text-primary)] truncate">
            {lens.meta.title}
          </h3>
          <p className="text-xs text-[var(--glass-text-muted)]">
            {colorConfig.label} • {styleLabel}
          </p>
        </div>
      </div>

      {/* Description */}
      {lens.meta.description && (
        <p className="text-sm text-[var(--glass-text-secondary)] line-clamp-2 mb-3">
          {lens.meta.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <span
          className={`
            px-2 py-0.5 rounded-full
            ${isActive
              ? 'bg-green-500/20 text-green-400'
              : 'bg-amber-500/20 text-amber-400'
            }
          `}
        >
          {isActive ? 'Active' : 'Draft'}
        </span>
        <span className="text-[var(--glass-text-muted)]">
          {lens.payload.vocabularyLevel}
        </span>
      </div>
    </div>
  );
}

export default LensCard;
