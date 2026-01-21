// src/bedrock/consoles/FederationConsole/TierMappingCard.tsx
// Card component for Tier Mapping in grid/list view
// Sprint: S9-SL-Federation v1

import React from 'react';
import type { ObjectCardProps } from '../../patterns/console-factory.types';
import type { TierMappingPayload } from '@core/schema/federation';

/**
 * Status display config for tier mappings
 */
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  draft: { label: 'Draft', color: 'var(--glass-text-muted)', icon: 'edit_note' },
  proposed: { label: 'Proposed', color: 'var(--semantic-warning)', icon: 'pending' },
  accepted: { label: 'Accepted', color: 'var(--semantic-success)', icon: 'check_circle' },
  rejected: { label: 'Rejected', color: 'var(--semantic-error)', icon: 'cancel' },
};

/**
 * Equivalence type display config
 */
const EQUIVALENCE_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  exact: { label: 'Exact', color: 'var(--semantic-success)' },
  approximate: { label: 'Approx', color: 'var(--semantic-info)' },
  subset: { label: 'Subset', color: 'var(--semantic-warning)' },
  superset: { label: 'Superset', color: 'var(--neon-purple)' },
};

/**
 * Card component for displaying a Tier Mapping in grid/list view
 */
export function TierMappingCard({
  object: mapping,
  selected,
  isFavorite,
  onClick,
  onFavoriteToggle,
  className = '',
}: ObjectCardProps<TierMappingPayload>) {
  const { payload } = mapping;
  const statusConfig = STATUS_CONFIG[payload.status] || STATUS_CONFIG.draft;
  const mappingCount = payload.mappings?.length || 0;

  // Count equivalence types
  const equivalenceCounts = (payload.mappings || []).reduce(
    (acc, m) => {
      acc[m.equivalenceType] = (acc[m.equivalenceType] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Calculate confidence percentage
  const confidencePercent = Math.round((payload.confidenceScore || 0) * 100);

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
      data-testid="tier-mapping-card"
    >
      {/* Status bar at top */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
        style={{ backgroundColor: statusConfig.color }}
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
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'var(--semantic-info-bg)' }}>
          <span className="material-symbols-outlined text-xl" style={{ color: 'var(--semantic-info)' }}>
            compare_arrows
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[var(--glass-text-primary)] truncate">
            {mapping.meta.title || 'Tier Mapping'}
          </h3>
          <p className="text-xs text-[var(--glass-text-muted)]">
            {mappingCount} mapping{mappingCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Grove pair display */}
      <div className="flex items-center gap-2 mb-3 text-sm">
        <div className="flex-1 px-2 py-1 rounded bg-[var(--glass-bg)] text-[var(--glass-text-secondary)] truncate">
          <span className="material-symbols-outlined text-xs mr-1 align-middle">forest</span>
          {payload.sourceGroveId}
        </div>
        <span className="material-symbols-outlined" style={{ color: 'var(--semantic-info)' }}>arrow_forward</span>
        <div className="flex-1 px-2 py-1 rounded bg-[var(--glass-bg)] text-[var(--glass-text-secondary)] truncate">
          <span className="material-symbols-outlined text-xs mr-1 align-middle">forest</span>
          {payload.targetGroveId}
        </div>
      </div>

      {/* Confidence bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-[var(--glass-text-muted)]">Confidence</span>
          <span className="text-[var(--glass-text-secondary)]">{confidencePercent}%</span>
        </div>
        <div className="h-1.5 bg-[var(--glass-bg)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${confidencePercent}%`,
              backgroundColor: confidencePercent >= 75 ? 'var(--semantic-success)' :
                              confidencePercent >= 50 ? 'var(--semantic-info)' :
                              confidencePercent >= 25 ? 'var(--semantic-warning)' : 'var(--semantic-error)',
            }}
          />
        </div>
      </div>

      {/* Equivalence type breakdown */}
      {mappingCount > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {Object.entries(equivalenceCounts).map(([type, count]) => {
            const config = EQUIVALENCE_TYPE_CONFIG[type] || { label: type, color: '#94a3b8' };
            return (
              <span
                key={type}
                className="px-2 py-0.5 rounded text-xs"
                style={{ backgroundColor: `${config.color}20`, color: config.color }}
              >
                {count} {config.label}
              </span>
            );
          })}
        </div>
      )}

      {/* Validation info */}
      {payload.validatedAt && (
        <div className="text-xs text-[var(--glass-text-muted)] mb-3">
          <span className="material-symbols-outlined text-xs mr-1 align-middle">
            verified
          </span>
          Validated {new Date(payload.validatedAt).toLocaleDateString()}
          {payload.validatedBy && ` by ${payload.validatedBy}`}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <span
          className="flex items-center gap-1 px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${statusConfig.color}20`, color: statusConfig.color }}
        >
          <span className="material-symbols-outlined text-xs">{statusConfig.icon}</span>
          {statusConfig.label}
        </span>
        <span className="text-[var(--glass-text-muted)]">
          {new Date(mapping.meta.updatedAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

export default TierMappingCard;
