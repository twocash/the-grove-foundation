// src/bedrock/consoles/FederationConsole/ExchangeEditor.tsx
// Editor component for Federation Exchange
// Sprint: S9-SL-Federation v1

import React from 'react';
import type { ObjectEditorProps } from '../../patterns/console-factory.types';
import type {
  FederationExchangePayload,
  ExchangeType,
  ExchangeContentType,
  ExchangeStatus,
} from '@core/schema/federation';
import { EXCHANGE_STATUS_CONFIG, CONTENT_TYPE_CONFIG } from './FederationConsole.config';

/**
 * Editor component for Federation Exchange configuration
 */
export function ExchangeEditor({
  object: exchange,
  onChange,
  className = '',
}: ObjectEditorProps<FederationExchangePayload>) {
  const { payload } = exchange;

  const updatePayload = (updates: Partial<FederationExchangePayload>) => {
    onChange({
      ...exchange,
      payload: { ...payload, ...updates },
      meta: { ...exchange.meta, updatedAt: new Date().toISOString() },
    });
  };

  const contentConfig = CONTENT_TYPE_CONFIG[payload.contentType];
  const statusConfig = EXCHANGE_STATUS_CONFIG[payload.status];

  return (
    <div className={`space-y-6 ${className}`} data-testid="exchange-editor">
      {/* Exchange Type Section */}
      <section>
        <h3 className="text-sm font-medium text-[var(--glass-text-primary)] mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">swap_horiz</span>
          Exchange Type
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Type */}
          <div>
            <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
              Type
            </label>
            <select
              value={payload.type || 'request'}
              onChange={(e) => updatePayload({ type: e.target.value as ExchangeType })}
              className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] focus:outline-none focus:border-[var(--neon-cyan)]"
            >
              <option value="request">Request (Incoming)</option>
              <option value="offer">Offer (Outgoing)</option>
            </select>
          </div>

          {/* Content Type */}
          <div>
            <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
              Content Type
            </label>
            <select
              value={payload.contentType || 'sprout'}
              onChange={(e) => updatePayload({ contentType: e.target.value as ExchangeContentType })}
              className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] focus:outline-none focus:border-[var(--neon-cyan)]"
            >
              {Object.entries(CONTENT_TYPE_CONFIG).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label} ({config.tokens} tokens)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Token value preview */}
        <div className="mt-3 p-3 rounded-lg bg-[var(--glass-bg)] flex items-center justify-between">
          <span className="text-sm text-[var(--glass-text-muted)]">Base Token Value:</span>
          <span className="flex items-center gap-1 text-amber-400">
            <span className="material-symbols-outlined text-sm">token</span>
            {contentConfig?.tokens || 0} tokens
          </span>
        </div>
      </section>

      {/* Grove References Section */}
      <section>
        <h3 className="text-sm font-medium text-[var(--glass-text-primary)] mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">forest</span>
          Grove Parties
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Requesting Grove */}
          <div>
            <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
              Requesting Grove
            </label>
            <input
              type="text"
              value={payload.requestingGroveId || ''}
              onChange={(e) => updatePayload({ requestingGroveId: e.target.value })}
              placeholder="requesting-grove-id"
              className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-muted)] focus:outline-none focus:border-[var(--neon-cyan)]"
            />
          </div>

          {/* Providing Grove */}
          <div>
            <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
              Providing Grove
            </label>
            <input
              type="text"
              value={payload.providingGroveId || ''}
              onChange={(e) => updatePayload({ providingGroveId: e.target.value })}
              placeholder="providing-grove-id"
              className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-muted)] focus:outline-none focus:border-[var(--neon-cyan)]"
            />
          </div>
        </div>
      </section>

      {/* Content Details Section */}
      <section>
        <h3 className="text-sm font-medium text-[var(--glass-text-primary)] mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">article</span>
          Content Details
        </h3>
        <div className="space-y-4">
          {/* Query */}
          <div>
            <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
              Search Query (for requests)
            </label>
            <textarea
              value={payload.query || ''}
              onChange={(e) => updatePayload({ query: e.target.value })}
              placeholder="Describe the content you're looking for..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-muted)] focus:outline-none focus:border-[var(--neon-cyan)] resize-none"
            />
          </div>

          {/* Content ID */}
          <div>
            <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
              Content ID (for offers)
            </label>
            <input
              type="text"
              value={payload.contentId || ''}
              onChange={(e) => updatePayload({ contentId: e.target.value })}
              placeholder="sprout-123 or concept-456"
              className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-muted)] focus:outline-none focus:border-[var(--neon-cyan)]"
            />
          </div>
        </div>
      </section>

      {/* Tier Mapping Section */}
      <section>
        <h3 className="text-sm font-medium text-[var(--glass-text-primary)] mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">compare_arrows</span>
          Tier Information
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Source Tier */}
          <div>
            <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
              Source Tier
            </label>
            <input
              type="text"
              value={payload.sourceTier || ''}
              onChange={(e) => updatePayload({ sourceTier: e.target.value })}
              placeholder="original-tier-id"
              className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-muted)] focus:outline-none focus:border-[var(--neon-cyan)]"
            />
          </div>

          {/* Mapped Tier (usually auto-filled) */}
          <div>
            <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
              Mapped Tier
            </label>
            <input
              type="text"
              value={payload.mappedTier || ''}
              onChange={(e) => updatePayload({ mappedTier: e.target.value })}
              placeholder="auto-mapped-tier"
              className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-muted)] focus:outline-none focus:border-[var(--neon-cyan)]"
            />
          </div>
        </div>
      </section>

      {/* Status Section */}
      <section>
        <h3 className="text-sm font-medium text-[var(--glass-text-primary)] mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">settings</span>
          Status
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Status */}
          <div>
            <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
              Exchange Status
            </label>
            <select
              value={payload.status || 'pending'}
              onChange={(e) => updatePayload({ status: e.target.value as ExchangeStatus })}
              className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] focus:outline-none focus:border-[var(--neon-cyan)]"
            >
              {Object.entries(EXCHANGE_STATUS_CONFIG).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          {/* Token Value */}
          <div>
            <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
              Token Value (if completed)
            </label>
            <input
              type="number"
              value={payload.tokenValue || ''}
              onChange={(e) => updatePayload({ tokenValue: parseFloat(e.target.value) || undefined })}
              placeholder="Calculated on completion"
              min={0}
              className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-muted)] focus:outline-none focus:border-[var(--neon-cyan)]"
            />
          </div>
        </div>
      </section>

      {/* Timeline (Read-only) */}
      <section>
        <h3 className="text-sm font-medium text-[var(--glass-text-primary)] mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">timeline</span>
          Timeline
        </h3>
        <div className="p-4 rounded-lg bg-[var(--glass-bg)]">
          <div className="space-y-3">
            {/* Initiated */}
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: '#60a5fa' }}
              />
              <div className="flex-1">
                <div className="text-xs text-[var(--glass-text-muted)]">Initiated</div>
                <div className="text-sm text-[var(--glass-text-primary)]">
                  {payload.initiatedAt
                    ? new Date(payload.initiatedAt).toLocaleString()
                    : 'Not initiated'}
                </div>
              </div>
            </div>

            {/* Current Status */}
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: statusConfig?.color || '#94a3b8' }}
              />
              <div className="flex-1">
                <div className="text-xs text-[var(--glass-text-muted)]">Current Status</div>
                <div className="text-sm text-[var(--glass-text-primary)]">
                  {statusConfig?.label || payload.status}
                </div>
              </div>
            </div>

            {/* Completed */}
            {payload.completedAt && (
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: '#4ade80' }}
                />
                <div className="flex-1">
                  <div className="text-xs text-[var(--glass-text-muted)]">Completed</div>
                  <div className="text-sm text-[var(--glass-text-primary)]">
                    {new Date(payload.completedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default ExchangeEditor;
