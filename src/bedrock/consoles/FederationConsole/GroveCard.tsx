// src/bedrock/consoles/FederationConsole/GroveCard.tsx
// Card component for Federated Grove in grid/list view
// Sprint: S9-SL-Federation v1

import React from 'react';
import type { ObjectCardProps } from '../../patterns/console-factory.types';
import type { FederatedGrovePayload } from '@core/schema/federation';
import { TRUST_LEVEL_CONFIGS } from '@core/schema/federation';
import { CONNECTION_STATUS_CONFIG, TRUST_LEVEL_DISPLAY_CONFIG } from './FederationConsole.config';

/**
 * Card component for displaying a Federated Grove in grid/list view
 */
export function GroveCard({
  object: grove,
  selected,
  isFavorite,
  onClick,
  onFavoriteToggle,
  className = '',
}: ObjectCardProps<FederatedGrovePayload>) {
  const { payload } = grove;
  const isConnected = payload.connectionStatus === 'connected';
  const connectionConfig = CONNECTION_STATUS_CONFIG[payload.connectionStatus] || CONNECTION_STATUS_CONFIG.none;
  const trustConfig = TRUST_LEVEL_CONFIGS[payload.trustLevel];
  const trustDisplayConfig = TRUST_LEVEL_DISPLAY_CONFIG[payload.trustLevel];

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
      data-testid="grove-card"
    >
      {/* Status bar at top - connection status color */}
      <div
        className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
        style={{ backgroundColor: connectionConfig.color }}
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
            forest
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[var(--glass-text-primary)] truncate">
            {payload.name}
          </h3>
          <p className="text-xs text-[var(--glass-text-muted)] truncate">
            {payload.groveId}
          </p>
        </div>
      </div>

      {/* Description preview */}
      {payload.description && (
        <p className="text-sm text-[var(--glass-text-secondary)] line-clamp-2 mb-3">
          {payload.description}
        </p>
      )}

      {/* Trust and connection badges */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {/* Trust level badge */}
        <span
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
          style={{ backgroundColor: `${trustConfig.color}20`, color: trustConfig.color }}
        >
          <span className="text-sm">{trustConfig.icon}</span>
          {trustDisplayConfig.label}
        </span>

        {/* Connection status badge */}
        <span
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
          style={{ backgroundColor: `${connectionConfig.color}20`, color: connectionConfig.color }}
        >
          <span className="material-symbols-outlined text-xs">{connectionConfig.icon}</span>
          {connectionConfig.label}
        </span>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 mb-3 text-sm text-[var(--glass-text-muted)]">
        {/* Trust score */}
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-sm" style={{ color: trustConfig.color }}>
            shield
          </span>
          <span>{payload.trustScore}%</span>
        </div>

        {/* Sprout count */}
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-sm text-green-400">eco</span>
          <span>{payload.sproutCount}</span>
        </div>

        {/* Exchange count */}
        <div className="flex items-center gap-1">
          <span className="material-symbols-outlined text-sm text-amber-400">swap_horiz</span>
          <span>{payload.exchangeCount}</span>
        </div>
      </div>

      {/* Tier system preview */}
      {payload.tierSystem?.tiers && payload.tierSystem.tiers.length > 0 && (
        <div className="flex items-center gap-1 text-sm text-[var(--glass-text-muted)] mb-3 overflow-hidden">
          <span className="text-xs text-[var(--glass-text-muted)] mr-1">Tiers:</span>
          {payload.tierSystem.tiers.slice(0, 4).map((tier, idx) => (
            <span key={tier.id} className="flex items-center gap-0.5 whitespace-nowrap">
              {idx > 0 && <span className="text-[var(--glass-text-muted)]">→</span>}
              <span>{tier.icon}</span>
            </span>
          ))}
          {payload.tierSystem.tiers.length > 4 && (
            <span className="text-xs">+{payload.tierSystem.tiers.length - 4}</span>
          )}
        </div>
      )}

      {/* Capabilities */}
      {payload.capabilities && payload.capabilities.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {payload.capabilities.slice(0, 3).map((cap) => (
            <span
              key={cap}
              className="px-2 py-0.5 rounded text-xs bg-[var(--glass-bg)] text-[var(--glass-text-muted)]"
            >
              {cap}
            </span>
          ))}
          {payload.capabilities.length > 3 && (
            <span className="px-2 py-0.5 rounded text-xs bg-[var(--glass-bg)] text-[var(--glass-text-muted)]">
              +{payload.capabilities.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <span
          className={`
            px-2 py-0.5 rounded-full
            ${payload.status === 'active'
              ? 'bg-green-500/20 text-green-400'
              : payload.status === 'degraded'
              ? 'bg-amber-500/20 text-amber-400'
              : payload.status === 'blocked'
              ? 'bg-red-500/20 text-red-400'
              : 'bg-slate-500/20 text-slate-400'
            }
          `}
        >
          {payload.status.charAt(0).toUpperCase() + payload.status.slice(1)}
        </span>
        <span className="text-[var(--glass-text-muted)]">
          {payload.lastActivityAt
            ? new Date(payload.lastActivityAt).toLocaleDateString()
            : 'No activity'}
        </span>
      </div>
    </div>
  );
}

export default GroveCard;
