// src/bedrock/consoles/FederationConsole/ExchangeCard.tsx
// Card component for Federation Exchange in grid/list view
// Sprint: S9-SL-Federation v1

import React from 'react';
import type { ObjectCardProps } from '../../patterns/console-factory.types';
import type { FederationExchangePayload } from '@core/schema/federation';
import { EXCHANGE_STATUS_CONFIG, CONTENT_TYPE_CONFIG } from './FederationConsole.config';

/**
 * Card component for displaying a Federation Exchange in grid/list view
 */
export function ExchangeCard({
  object: exchange,
  selected,
  isFavorite,
  onClick,
  onFavoriteToggle,
  className = '',
}: ObjectCardProps<FederationExchangePayload>) {
  const { payload } = exchange;
  const statusConfig = EXCHANGE_STATUS_CONFIG[payload.status] || EXCHANGE_STATUS_CONFIG.pending;
  const contentConfig = CONTENT_TYPE_CONFIG[payload.contentType] || CONTENT_TYPE_CONFIG.sprout;
  const isRequest = payload.type === 'request';

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
      data-testid="exchange-card"
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
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{
            backgroundColor: isRequest ? 'var(--semantic-warning-bg)' : 'var(--semantic-info-bg)'
          }}
        >
          <span
            className="material-symbols-outlined text-xl"
            style={{
              color: isRequest ? 'var(--semantic-warning)' : 'var(--semantic-info)'
            }}
          >
            {isRequest ? 'call_received' : 'call_made'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[var(--glass-text-primary)] truncate">
            {isRequest ? 'Content Request' : 'Content Offer'}
          </h3>
          <p className="text-xs text-[var(--glass-text-muted)]">
            {payload.contentType.charAt(0).toUpperCase() + payload.contentType.slice(1)}
          </p>
        </div>
      </div>

      {/* Grove pair with direction */}
      <div className="flex items-center gap-2 mb-3 text-sm">
        <div className="flex-1 px-2 py-1 rounded bg-[var(--glass-bg)] text-[var(--glass-text-secondary)] truncate">
          <span className="material-symbols-outlined text-xs mr-1 align-middle">
            {isRequest ? 'call_received' : 'forest'}
          </span>
          {payload.requestingGroveId}
        </div>
        <span
          className="material-symbols-outlined"
          style={{ color: 'var(--neon-amber)' }}
        >
          {isRequest ? 'arrow_back' : 'arrow_forward'}
        </span>
        <div className="flex-1 px-2 py-1 rounded bg-[var(--glass-bg)] text-[var(--glass-text-secondary)] truncate">
          <span className="material-symbols-outlined text-xs mr-1 align-middle">
            {isRequest ? 'forest' : 'call_made'}
          </span>
          {payload.providingGroveId}
        </div>
      </div>

      {/* Content info */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {/* Content type badge */}
        <span
          className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
          style={{ backgroundColor: 'var(--semantic-success-bg)', color: 'var(--semantic-success)' }}
        >
          <span className="material-symbols-outlined text-xs">{contentConfig.icon}</span>
          {contentConfig.label}
        </span>

        {/* Token value */}
        {payload.tokenValue !== undefined && (
          <span
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs"
            style={{ backgroundColor: 'var(--neon-amber-bg)', color: 'var(--neon-amber)' }}
          >
            <span className="material-symbols-outlined text-xs">token</span>
            {payload.tokenValue} tokens
          </span>
        )}

        {/* Type badge */}
        <span
          className="px-2 py-0.5 rounded-full text-xs"
          style={{
            backgroundColor: isRequest ? 'var(--semantic-warning-bg)' : 'var(--semantic-info-bg)',
            color: isRequest ? 'var(--semantic-warning)' : 'var(--semantic-info)'
          }}
        >
          {isRequest ? 'Request' : 'Offer'}
        </span>
      </div>

      {/* Query/Content ID */}
      {(payload.query || payload.contentId) && (
        <div className="text-sm text-[var(--glass-text-secondary)] line-clamp-2 mb-3 px-2 py-1 rounded bg-[var(--glass-bg)]">
          {payload.query && (
            <div className="flex items-start gap-1">
              <span className="material-symbols-outlined text-xs mt-0.5">search</span>
              <span className="truncate">{payload.query}</span>
            </div>
          )}
          {payload.contentId && (
            <div className="flex items-start gap-1">
              <span className="material-symbols-outlined text-xs mt-0.5">article</span>
              <span className="truncate">{payload.contentId}</span>
            </div>
          )}
        </div>
      )}

      {/* Tier mapping info */}
      {(payload.sourceTier || payload.mappedTier) && (
        <div className="flex items-center gap-2 text-xs text-[var(--glass-text-muted)] mb-3">
          {payload.sourceTier && (
            <span className="px-2 py-0.5 rounded bg-[var(--glass-bg)]">
              Source: {payload.sourceTier}
            </span>
          )}
          {payload.mappedTier && (
            <>
              <span className="material-symbols-outlined text-xs">arrow_forward</span>
              <span className="px-2 py-0.5 rounded bg-[var(--glass-bg)]">
                Mapped: {payload.mappedTier}
              </span>
            </>
          )}
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
          {new Date(payload.initiatedAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

export default ExchangeCard;
