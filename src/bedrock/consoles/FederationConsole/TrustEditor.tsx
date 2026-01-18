// src/bedrock/consoles/FederationConsole/TrustEditor.tsx
// Editor component for Trust Relationship
// Sprint: S9-SL-Federation v1

import React from 'react';
import type { ObjectEditorProps } from '../../patterns/console-factory.types';
import type { TrustRelationshipPayload, TrustLevel, TrustComponents } from '@core/schema/federation';
import { TRUST_LEVEL_CONFIGS } from '@core/schema/federation';

/**
 * Component score labels and descriptions
 */
const COMPONENT_INFO: Record<keyof TrustComponents, { label: string; description: string; icon: string }> = {
  exchangeSuccess: {
    label: 'Exchange Success',
    description: 'Rate of successful exchange completions',
    icon: 'swap_horiz',
  },
  tierAccuracy: {
    label: 'Tier Accuracy',
    description: 'Accuracy of tier mapping translations',
    icon: 'compare_arrows',
  },
  responseTime: {
    label: 'Response Time',
    description: 'Speed of response to requests',
    icon: 'timer',
  },
  contentQuality: {
    label: 'Content Quality',
    description: 'Quality of shared content',
    icon: 'grade',
  },
};

/**
 * Get color for a score value
 */
function getScoreColor(score: number): string {
  if (score >= 75) return '#4ade80';
  if (score >= 50) return '#60a5fa';
  if (score >= 25) return '#f59e0b';
  return '#ef4444';
}

/**
 * Editor component for Trust Relationship configuration
 */
export function TrustEditor({
  object: relationship,
  onChange,
  className = '',
}: ObjectEditorProps<TrustRelationshipPayload>) {
  const { payload } = relationship;

  const updatePayload = (updates: Partial<TrustRelationshipPayload>) => {
    onChange({
      ...relationship,
      payload: { ...payload, ...updates },
      meta: { ...relationship.meta, updatedAt: new Date().toISOString() },
    });
  };

  const updateComponent = (key: keyof TrustComponents, value: number) => {
    const newComponents = { ...payload.components, [key]: value };
    // Recalculate overall score
    const overallScore = Math.round(
      newComponents.exchangeSuccess * 0.35 +
      newComponents.tierAccuracy * 0.25 +
      newComponents.responseTime * 0.15 +
      newComponents.contentQuality * 0.25
    );
    // Determine trust level
    let level: TrustLevel = 'new';
    if (overallScore >= 75) level = 'verified';
    else if (overallScore >= 50) level = 'trusted';
    else if (overallScore >= 25) level = 'established';

    updatePayload({
      components: newComponents,
      overallScore,
      level,
    });
  };

  const trustConfig = TRUST_LEVEL_CONFIGS[payload.level];

  return (
    <div className={`space-y-6 ${className}`} data-testid="trust-editor">
      {/* Grove Pair Section */}
      <section>
        <h3 className="text-sm font-medium text-[var(--glass-text-primary)] mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">forest</span>
          Grove Pair
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Grove 1 */}
          <div>
            <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
              Grove 1
            </label>
            <input
              type="text"
              value={payload.groveIds?.[0] || ''}
              onChange={(e) => {
                const newIds: [string, string] = [e.target.value, payload.groveIds?.[1] || ''];
                // Ensure alphabetical ordering
                newIds.sort();
                updatePayload({ groveIds: newIds });
              }}
              placeholder="first-grove-id"
              className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-muted)] focus:outline-none focus:border-[var(--neon-cyan)]"
            />
          </div>

          {/* Grove 2 */}
          <div>
            <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
              Grove 2
            </label>
            <input
              type="text"
              value={payload.groveIds?.[1] || ''}
              onChange={(e) => {
                const newIds: [string, string] = [payload.groveIds?.[0] || '', e.target.value];
                // Ensure alphabetical ordering
                newIds.sort();
                updatePayload({ groveIds: newIds });
              }}
              placeholder="second-grove-id"
              className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-muted)] focus:outline-none focus:border-[var(--neon-cyan)]"
            />
          </div>
        </div>
        <p className="text-xs text-[var(--glass-text-muted)] mt-2">
          Note: Grove IDs are automatically sorted alphabetically for consistency.
        </p>
      </section>

      {/* Overall Trust Section */}
      <section>
        <h3 className="text-sm font-medium text-[var(--glass-text-primary)] mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">shield</span>
          Overall Trust
        </h3>
        <div className="p-4 rounded-lg bg-[var(--glass-bg)]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{trustConfig.icon}</span>
              <div>
                <div className="text-lg font-bold" style={{ color: trustConfig.color }}>
                  {payload.overallScore}%
                </div>
                <div className="text-xs text-[var(--glass-text-muted)]">
                  {trustConfig.label}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-amber-400">
                <span className="material-symbols-outlined text-sm">token</span>
                <span className="font-bold">{trustConfig.multiplier}x</span>
              </div>
              <div className="text-xs text-[var(--glass-text-muted)]">Multiplier</div>
            </div>
          </div>
          <div className="h-3 bg-[var(--glass-solid)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${payload.overallScore}%`,
                backgroundColor: trustConfig.color,
              }}
            />
          </div>
        </div>
      </section>

      {/* Component Scores Section */}
      <section>
        <h3 className="text-sm font-medium text-[var(--glass-text-primary)] mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">tune</span>
          Component Scores
        </h3>
        <div className="space-y-4">
          {(Object.entries(COMPONENT_INFO) as [keyof TrustComponents, typeof COMPONENT_INFO[keyof TrustComponents]][]).map(([key, info]) => {
            const value = payload.components[key];
            return (
              <div key={key} className="p-3 rounded-lg bg-[var(--glass-bg)]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="material-symbols-outlined text-sm"
                      style={{ color: getScoreColor(value) }}
                    >
                      {info.icon}
                    </span>
                    <span className="text-sm text-[var(--glass-text-primary)]">{info.label}</span>
                  </div>
                  <span
                    className="text-sm font-medium"
                    style={{ color: getScoreColor(value) }}
                  >
                    {value}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={value}
                  onChange={(e) => updateComponent(key, parseInt(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-[var(--glass-text-muted)] mt-1">{info.description}</p>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-[var(--glass-text-muted)] mt-3">
          Overall score is calculated as: Exchange Success (35%) + Tier Accuracy (25%) + Response Time (15%) + Content Quality (25%)
        </p>
      </section>

      {/* Exchange Stats Section */}
      <section>
        <h3 className="text-sm font-medium text-[var(--glass-text-primary)] mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">analytics</span>
          Exchange Statistics
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Total Exchanges */}
          <div>
            <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
              Total Exchanges
            </label>
            <input
              type="number"
              value={payload.exchangeCount || 0}
              onChange={(e) => updatePayload({ exchangeCount: parseInt(e.target.value) || 0 })}
              min={0}
              className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] focus:outline-none focus:border-[var(--neon-cyan)]"
            />
          </div>

          {/* Successful Exchanges */}
          <div>
            <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
              Successful Exchanges
            </label>
            <input
              type="number"
              value={payload.successfulExchanges || 0}
              onChange={(e) => updatePayload({ successfulExchanges: parseInt(e.target.value) || 0 })}
              min={0}
              max={payload.exchangeCount || 0}
              className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] focus:outline-none focus:border-[var(--neon-cyan)]"
            />
          </div>
        </div>

        {/* Success Rate */}
        {payload.exchangeCount > 0 && (
          <div className="mt-3 p-3 rounded-lg bg-[var(--glass-bg)]">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--glass-text-muted)]">Success Rate:</span>
              <span
                className="font-medium"
                style={{
                  color: getScoreColor(
                    Math.round((payload.successfulExchanges / payload.exchangeCount) * 100)
                  ),
                }}
              >
                {Math.round((payload.successfulExchanges / payload.exchangeCount) * 100)}%
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Verification Section */}
      <section>
        <h3 className="text-sm font-medium text-[var(--glass-text-primary)] mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">verified</span>
          Verification
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Verified By */}
          <div>
            <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
              Verified By
            </label>
            <select
              value={payload.verifiedBy || ''}
              onChange={(e) =>
                updatePayload({
                  verifiedBy: e.target.value as 'system' | 'admin' | 'community' | undefined,
                  verifiedAt: e.target.value ? new Date().toISOString() : undefined,
                })
              }
              className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] focus:outline-none focus:border-[var(--neon-cyan)]"
            >
              <option value="">Not Verified</option>
              <option value="system">System</option>
              <option value="admin">Admin</option>
              <option value="community">Community</option>
            </select>
          </div>

          {/* Verified At (Read-only) */}
          <div>
            <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
              Verified At
            </label>
            <input
              type="text"
              value={payload.verifiedAt ? new Date(payload.verifiedAt).toLocaleString() : 'Not verified'}
              readOnly
              className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--glass-text-muted)]"
            />
          </div>
        </div>
      </section>

      {/* Last Exchange Info */}
      {payload.lastExchangeAt && (
        <section>
          <h3 className="text-sm font-medium text-[var(--glass-text-primary)] mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">schedule</span>
            Last Activity
          </h3>
          <div className="p-4 rounded-lg bg-[var(--glass-bg)]">
            <div className="text-sm text-[var(--glass-text-primary)]">
              Last exchange: {new Date(payload.lastExchangeAt).toLocaleString()}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default TrustEditor;
