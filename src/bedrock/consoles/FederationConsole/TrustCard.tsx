// src/bedrock/consoles/FederationConsole/TrustCard.tsx
// Card component for Trust Relationship in grid/list view
// Sprint: S9-SL-Federation v1

import React from 'react';
import type { ObjectCardProps } from '../../patterns/console-factory.types';
import type { TrustRelationshipPayload } from '@core/schema/federation';
import { TRUST_LEVEL_CONFIGS } from '@core/schema/federation';
import { TRUST_LEVEL_DISPLAY_CONFIG } from './FederationConsole.config';

/**
 * Component score display config
 */
const COMPONENT_CONFIG: Record<string, { label: string; icon: string }> = {
  exchangeSuccess: { label: 'Exchange', icon: 'swap_horiz' },
  tierAccuracy: { label: 'Tier Accuracy', icon: 'compare_arrows' },
  responseTime: { label: 'Response', icon: 'timer' },
  contentQuality: { label: 'Quality', icon: 'grade' },
};

/**
 * Get color for a score value
 */
function getScoreColor(score: number): string {
  if (score >= 75) return 'var(--semantic-success)';
  if (score >= 50) return 'var(--semantic-info)';
  if (score >= 25) return 'var(--semantic-warning)';
  return 'var(--semantic-error)';
}

/**
 * Card component for displaying a Trust Relationship in grid/list view
 */
export function TrustCard({
  object: relationship,
  selected,
  isFavorite,
  onClick,
  onFavoriteToggle,
  className = '',
}: ObjectCardProps<TrustRelationshipPayload>) {
  const { payload } = relationship;
  const trustConfig = TRUST_LEVEL_CONFIGS[payload.level];
  const trustDisplayConfig = TRUST_LEVEL_DISPLAY_CONFIG[payload.level];
  const successRate = payload.exchangeCount > 0
    ? Math.round((payload.successfulExchanges / payload.exchangeCount) * 100)
    : 0;

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
      data-testid="trust-card"
    >
      {/* Status bar at top - trust level color */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
        style={{ backgroundColor: trustConfig.color }}
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
          style={{ backgroundColor: `${trustConfig.color}20` }}
        >
          <span
            className="material-symbols-outlined text-xl"
            style={{ color: trustConfig.color }}
          >
            verified_user
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[var(--glass-text-primary)] truncate">
            {relationship.meta.title || 'Trust Relationship'}
          </h3>
          <p className="text-xs text-[var(--glass-text-muted)]">
            {payload.exchangeCount} exchange{payload.exchangeCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Grove pair display */}
      <div className="flex items-center gap-2 mb-3 text-sm">
        <div className="flex-1 px-2 py-1 rounded bg-[var(--glass-bg)] text-[var(--glass-text-secondary)] truncate text-center">
          <span className="material-symbols-outlined text-xs mr-1 align-middle">forest</span>
          {payload.groveIds[0]}
        </div>
        <span
          className="material-symbols-outlined"
          style={{ color: trustConfig.color }}
        >
          sync_alt
        </span>
        <div className="flex-1 px-2 py-1 rounded bg-[var(--glass-bg)] text-[var(--glass-text-secondary)] truncate text-center">
          <span className="material-symbols-outlined text-xs mr-1 align-middle">forest</span>
          {payload.groveIds[1]}
        </div>
      </div>

      {/* Overall trust score */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-[var(--glass-text-muted)]">Overall Trust</span>
          <span
            className="font-medium"
            style={{ color: trustConfig.color }}
          >
            {payload.overallScore}%
          </span>
        </div>
        <div className="h-2 bg-[var(--glass-bg)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${payload.overallScore}%`,
              backgroundColor: trustConfig.color,
            }}
          />
        </div>
      </div>

      {/* Trust level and success rate badges */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {/* Trust level badge */}
        <span
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
          style={{ backgroundColor: `${trustConfig.color}20`, color: trustConfig.color }}
        >
          <span className="text-sm">{trustConfig.icon}</span>
          {trustDisplayConfig.label}
        </span>

        {/* Success rate badge */}
        {payload.exchangeCount > 0 && (
          <span
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
            style={{
              backgroundColor: `${getScoreColor(successRate)}20`,
              color: getScoreColor(successRate),
            }}
          >
            <span className="material-symbols-outlined text-xs">trending_up</span>
            {successRate}% success
          </span>
        )}

        {/* Multiplier badge */}
        <span
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
          style={{ backgroundColor: 'var(--neon-amber-bg)', color: 'var(--neon-amber)' }}
        >
          <span className="material-symbols-outlined text-xs">token</span>
          {trustConfig.multiplier}x
        </span>
      </div>

      {/* Component scores */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {Object.entries(payload.components).map(([key, value]) => {
          const config = COMPONENT_CONFIG[key];
          if (!config) return null;
          return (
            <div key={key} className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-xs"
                style={{ color: getScoreColor(value) }}
              >
                {config.icon}
              </span>
              <div className="flex-1">
                <div className="h-1 bg-[var(--glass-bg)] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${value}%`,
                      backgroundColor: getScoreColor(value),
                    }}
                  />
                </div>
              </div>
              <span className="text-xs text-[var(--glass-text-muted)] w-8 text-right">
                {value}
              </span>
            </div>
          );
        })}
      </div>

      {/* Verification info */}
      {payload.verifiedAt && (
        <div className="text-xs text-[var(--glass-text-muted)] mb-3">
          <span className="material-symbols-outlined text-xs mr-1 align-middle">
            verified
          </span>
          Verified {new Date(payload.verifiedAt).toLocaleDateString()}
          {payload.verifiedBy && ` by ${payload.verifiedBy}`}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-[var(--glass-text-muted)]">
          {payload.successfulExchanges} / {payload.exchangeCount} successful
        </span>
        <span className="text-[var(--glass-text-muted)]">
          {payload.lastExchangeAt
            ? new Date(payload.lastExchangeAt).toLocaleDateString()
            : 'No exchanges'}
        </span>
      </div>
    </div>
  );
}

export default TrustCard;
