// src/bedrock/consoles/FederationConsole/TrustEditor.tsx
// Editor component for Trust Relationship with factory pattern
// Sprint: S15-BD-FederationEditors-v1

import React, { useCallback } from 'react';
import type { ObjectEditorProps, PatchOperation } from '../../patterns/console-factory.types';
import type { TrustRelationshipPayload, TrustLevel, TrustComponents } from '@core/schema/federation';
import { TRUST_LEVEL_CONFIGS } from '@core/schema/federation';
import { InspectorSection, InspectorDivider } from '../../primitives/BedrockInspector';
import { BufferedInput } from '../../primitives/BufferedInput';
import { GroveConnectionDiagram } from '../../components/GroveConnectionDiagram';
import { TrustScoreBar, ProgressScoreBar } from '../../components/ProgressScoreBar';

// =============================================================================
// Constants
// =============================================================================

const COMPONENT_INFO: Record<keyof TrustComponents, { label: string; description: string; icon: string; weight: string }> = {
  exchangeSuccess: {
    label: 'Exchange Success',
    description: 'Rate of successful exchange completions',
    icon: 'swap_horiz',
    weight: '35%',
  },
  tierAccuracy: {
    label: 'Tier Accuracy',
    description: 'Accuracy of tier mapping translations',
    icon: 'compare_arrows',
    weight: '25%',
  },
  responseTime: {
    label: 'Response Time',
    description: 'Speed of response to requests',
    icon: 'timer',
    weight: '15%',
  },
  contentQuality: {
    label: 'Content Quality',
    description: 'Quality of shared content',
    icon: 'grade',
    weight: '25%',
  },
};

const VERIFICATION_OPTIONS = [
  { value: '', label: 'Not Verified', icon: 'help' },
  { value: 'system', label: 'System', icon: 'computer' },
  { value: 'admin', label: 'Admin', icon: 'admin_panel_settings' },
  { value: 'community', label: 'Community', icon: 'groups' },
];

// Shared CSS classes
const inputClasses = `
  w-full px-3 py-2 rounded-lg bg-[var(--glass-solid)]
  border border-[var(--glass-border)] text-[var(--glass-text-primary)]
  placeholder:text-[var(--glass-text-subtle)]
  focus:outline-none focus:border-[var(--neon-cyan)]
  focus:ring-1 focus:ring-[var(--neon-cyan)]/50
`;

const selectClasses = `
  w-full px-3 py-2 rounded-lg bg-[var(--glass-solid)]
  border border-[var(--glass-border)] text-[var(--glass-text-primary)]
  focus:outline-none focus:border-[var(--neon-cyan)]
  focus:ring-1 focus:ring-[var(--neon-cyan)]/50
  cursor-pointer
`;

// =============================================================================
// Helper: Trust Level Badge
// =============================================================================

function TrustLevelBadge({ level }: { level: TrustLevel }) {
  const config = TRUST_LEVEL_CONFIGS[level];

  return (
    <span
      className="px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1"
      style={{
        backgroundColor: `${config.color}20`,
        color: config.color,
      }}
    >
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}

// =============================================================================
// Helper: Component Score Card
// =============================================================================

function ComponentScoreCard({
  componentKey,
  value,
  onChange,
}: {
  componentKey: keyof TrustComponents;
  value: number;
  onChange: (value: number) => void;
}) {
  const info = COMPONENT_INFO[componentKey];

  // Color gradient based on score
  const getGradient = (score: number) => {
    if (score >= 75) return { from: 'var(--neon-green)', to: 'var(--neon-cyan)' };
    if (score >= 50) return { from: 'var(--neon-cyan)', to: 'var(--neon-green)' };
    if (score >= 25) return { from: 'var(--neon-amber)', to: 'var(--neon-cyan)' };
    return { from: 'var(--neon-amber)', to: 'var(--neon-amber)' };
  };

  return (
    <div className="p-4 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-lg text-[var(--neon-cyan)]">
            {info.icon}
          </span>
          <div>
            <span className="text-sm font-medium text-[var(--glass-text-primary)]">
              {info.label}
            </span>
            <span className="text-xs text-[var(--glass-text-muted)] ml-2">
              ({info.weight})
            </span>
          </div>
        </div>
        <span className="text-sm font-bold text-[var(--glass-text-primary)]">
          {value}%
        </span>
      </div>

      <ProgressScoreBar
        value={value}
        gradient={getGradient(value)}
        height="sm"
        className="mb-3"
      />

      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full accent-[var(--neon-cyan)]"
        aria-label={`${info.label} score`}
      />

      <p className="text-xs text-[var(--glass-text-muted)] mt-2">{info.description}</p>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function TrustEditor({
  object: relationship,
  onEdit,
  onSave,
  onDelete,
  onDuplicate,
  loading,
  hasChanges,
  className = '',
}: ObjectEditorProps<TrustRelationshipPayload>) {
  const { payload } = relationship;

  // Helper for payload updates using patch operations
  const updatePayload = useCallback(
    (updates: Partial<TrustRelationshipPayload>) => {
      const ops: PatchOperation[] = Object.entries(updates).map(([key, value]) => ({
        op: 'replace' as const,
        path: `/payload/${key}`,
        value,
      }));
      onEdit(ops);
    },
    [onEdit]
  );

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

  const handleGroveChange = (index: 0 | 1, value: string) => {
    const newIds: [string, string] = [
      index === 0 ? value : (payload.groveIds?.[0] || ''),
      index === 1 ? value : (payload.groveIds?.[1] || ''),
    ];
    // Ensure alphabetical ordering
    newIds.sort();
    updatePayload({ groveIds: newIds });
  };

  const trustConfig = TRUST_LEVEL_CONFIGS[payload.level];
  const successRate = payload.exchangeCount > 0
    ? Math.round((payload.successfulExchanges / payload.exchangeCount) * 100)
    : 0;

  return (
    <div className={`flex flex-col h-full ${className}`} data-testid="trust-editor">
      {/* ================================================================== */}
      {/* Header with trust level badge                                     */}
      {/* ================================================================== */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--neon-green)]/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-lg text-[var(--neon-green)]">
              shield
            </span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-[var(--glass-text-primary)]">
              Trust Relationship
            </h3>
            <p className="text-xs text-[var(--glass-text-muted)]">
              {relationship.id}
            </p>
          </div>
        </div>
        <TrustLevelBadge level={payload.level} />
      </div>

      {/* ================================================================== */}
      {/* Scrollable Content Area                                           */}
      {/* ================================================================== */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-1">
          {/* ============================================================ */}
          {/* Grove Pair Section                                           */}
          {/* ============================================================ */}
          <InspectorSection title="Grove Pair">
            <GroveConnectionDiagram
              sourceGrove={payload.groveIds?.[0] || ''}
              targetGrove={payload.groveIds?.[1] || ''}
              sourceLabel="Grove 1"
              targetLabel="Grove 2"
              onSourceChange={(v) => handleGroveChange(0, v)}
              onTargetChange={(v) => handleGroveChange(1, v)}
              icon={
                <span className="material-symbols-outlined text-xl text-[var(--neon-green)]">
                  handshake
                </span>
              }
            />
            <p className="text-xs text-[var(--glass-text-muted)] mt-3 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">info</span>
              Grove IDs are automatically sorted alphabetically for consistency.
            </p>
          </InspectorSection>

          <InspectorDivider />

          {/* ============================================================ */}
          {/* Overall Trust Section                                        */}
          {/* ============================================================ */}
          <InspectorSection title="Overall Trust">
            <div className="p-4 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{trustConfig.icon}</span>
                  <div>
                    <div
                      className="text-2xl font-bold"
                      style={{ color: trustConfig.color }}
                    >
                      {payload.overallScore}%
                    </div>
                    <div className="text-xs text-[var(--glass-text-muted)]">
                      {trustConfig.label}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-[var(--neon-amber)]">
                    <span className="material-symbols-outlined text-sm">token</span>
                    <span className="text-xl font-bold">{trustConfig.multiplier}x</span>
                  </div>
                  <div className="text-xs text-[var(--glass-text-muted)]">Token Multiplier</div>
                </div>
              </div>

              <TrustScoreBar value={payload.overallScore} showValue={false} />
            </div>
          </InspectorSection>

          <InspectorDivider />

          {/* ============================================================ */}
          {/* Component Scores Section                                     */}
          {/* ============================================================ */}
          <InspectorSection title="Component Scores">
            <div className="space-y-3">
              {(Object.keys(COMPONENT_INFO) as (keyof TrustComponents)[]).map((key) => (
                <ComponentScoreCard
                  key={key}
                  componentKey={key}
                  value={payload.components[key]}
                  onChange={(value) => updateComponent(key, value)}
                />
              ))}
            </div>
            <p className="text-xs text-[var(--glass-text-muted)] mt-4 p-3 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)]">
              <span className="material-symbols-outlined text-xs align-middle mr-1">calculate</span>
              Overall score = Exchange Success (35%) + Tier Accuracy (25%) + Response Time (15%) + Content Quality (25%)
            </p>
          </InspectorSection>

          <InspectorDivider />

          {/* ============================================================ */}
          {/* Exchange Statistics Section                                  */}
          {/* ============================================================ */}
          <InspectorSection title="Exchange Statistics" collapsible>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[var(--glass-text-muted)] mb-1.5">
                    Total Exchanges
                  </label>
                  <input
                    type="number"
                    value={payload.exchangeCount || 0}
                    onChange={(e) => updatePayload({ exchangeCount: parseInt(e.target.value) || 0 })}
                    min={0}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--glass-text-muted)] mb-1.5">
                    Successful Exchanges
                  </label>
                  <input
                    type="number"
                    value={payload.successfulExchanges || 0}
                    onChange={(e) => updatePayload({ successfulExchanges: parseInt(e.target.value) || 0 })}
                    min={0}
                    max={payload.exchangeCount || 0}
                    className={inputClasses}
                  />
                </div>
              </div>

              {/* Success Rate Display */}
              {payload.exchangeCount > 0 && (
                <div className="p-4 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-[var(--glass-text-muted)]">Success Rate</span>
                    <span className="text-lg font-bold text-[var(--glass-text-primary)]">
                      {successRate}%
                    </span>
                  </div>
                  <ProgressScoreBar
                    value={successRate}
                    gradient={{
                      from: successRate >= 75 ? 'var(--neon-green)' : 'var(--neon-amber)',
                      to: 'var(--neon-green)',
                    }}
                    height="sm"
                  />
                </div>
              )}
            </div>
          </InspectorSection>

          <InspectorDivider />

          {/* ============================================================ */}
          {/* Verification Section (Collapsible)                           */}
          {/* ============================================================ */}
          <InspectorSection
            title="Verification"
            collapsible
            defaultCollapsed={!payload.verifiedBy}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[var(--glass-text-muted)] mb-1.5">
                  Verified By
                </label>
                <select
                  value={payload.verifiedBy || ''}
                  onChange={(e) =>
                    updatePayload({
                      verifiedBy: e.target.value as 'system' | 'admin' | 'community' | undefined || undefined,
                      verifiedAt: e.target.value ? new Date().toISOString() : undefined,
                    })
                  }
                  className={selectClasses}
                >
                  {VERIFICATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[var(--glass-text-muted)] mb-1.5">
                  Verified At
                </label>
                <div className="px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--glass-text-primary)]">
                  {payload.verifiedAt ? new Date(payload.verifiedAt).toLocaleString() : 'Not verified'}
                </div>
              </div>
            </div>
          </InspectorSection>

          {/* ============================================================ */}
          {/* Last Activity Section (Conditional)                          */}
          {/* ============================================================ */}
          {payload.lastExchangeAt && (
            <>
              <InspectorDivider />
              <InspectorSection title="Last Activity" collapsible defaultCollapsed>
                <div className="p-4 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--neon-cyan)]/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[var(--neon-cyan)]">
                        history
                      </span>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--glass-text-muted)]">Last Exchange</div>
                      <div className="text-sm text-[var(--glass-text-primary)] font-medium">
                        {new Date(payload.lastExchangeAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              </InspectorSection>
            </>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* Footer Actions                                                    */}
      {/* ================================================================== */}
      <div className="border-t border-[var(--glass-border)] p-4 space-y-3">
        {/* Save Button */}
        <button
          onClick={onSave}
          disabled={loading || !hasChanges}
          className={`
            w-full py-2.5 px-4 rounded-lg font-medium transition-all
            flex items-center justify-center gap-2
            ${
              hasChanges
                ? 'bg-[var(--neon-green)] text-black hover:bg-[var(--neon-green)]/90'
                : 'bg-[var(--glass-border)] text-[var(--glass-text-muted)] cursor-not-allowed'
            }
            ${loading ? 'opacity-50 cursor-wait' : ''}
          `}
        >
          {loading ? (
            <>
              <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
              Saving...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-sm">save</span>
              Save Changes
            </>
          )}
        </button>

        {/* Secondary Actions Row */}
        <div className="flex items-center gap-2">
          <button
            onClick={onDuplicate}
            disabled={loading}
            className="flex-1 py-2 px-3 rounded-lg border border-[var(--glass-border)] text-[var(--glass-text-secondary)] hover:bg-white/5 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-sm">content_copy</span>
            Duplicate
          </button>
          <button
            onClick={onDelete}
            disabled={loading}
            className="flex-1 py-2 px-3 rounded-lg border transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            style={{ borderColor: 'var(--semantic-error-border)', color: 'var(--semantic-error)' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--semantic-error-bg)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <span className="material-symbols-outlined text-sm">delete</span>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default TrustEditor;
