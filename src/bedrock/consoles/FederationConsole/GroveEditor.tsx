// src/bedrock/consoles/FederationConsole/GroveEditor.tsx
// Editor component for Federated Grove
// Sprint: S15-BD-FederationEditors-v1 (refactored)

import React, { useState, useCallback } from 'react';
import type { ObjectEditorProps, PatchOperation } from '../../patterns/console-factory.types';
import type { FederatedGrovePayload, TierDefinition, GroveStatus, ConnectionStatus } from '@core/schema/federation';
import { TRUST_LEVEL_CONFIGS } from '@core/schema/federation';
import { CONNECTION_STATUS_CONFIG } from './FederationConsole.config';

// Layout primitives
import { InspectorSection, InspectorDivider } from '../../primitives/BedrockInspector';

// Buffered inputs
import { BufferedInput, BufferedTextarea } from '../../primitives/BufferedInput';

// Shared components
import { StatusBanner } from '../../components/StatusBanner';
import { ProgressScoreBar } from '../../components/ProgressScoreBar';

// =============================================================================
// Types
// =============================================================================

type ConnectionStatusType = 'connected' | 'disconnected' | 'pending' | 'failed';

/**
 * Map ConnectionStatus to StatusBanner status type
 */
function mapConnectionStatus(status: ConnectionStatus | undefined): ConnectionStatusType {
  switch (status) {
    case 'connected':
      return 'connected';
    case 'connecting':
    case 'pending':
      return 'pending';
    case 'error':
      return 'failed';
    case 'disconnected':
    case 'none':
    default:
      return 'disconnected';
  }
}

// =============================================================================
// Shared CSS Classes
// =============================================================================

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
`;

// =============================================================================
// Component
// =============================================================================

/**
 * Editor component for Federated Grove configuration
 * Refactored to use factory pattern with InspectorSection, BufferedInput
 */
export function GroveEditor({
  object: grove,
  onEdit,
  onSave,
  onDelete,
  onDuplicate,
  loading,
  hasChanges,
  className = '',
}: ObjectEditorProps<FederatedGrovePayload>) {
  const { payload } = grove;
  const [newCapability, setNewCapability] = useState('');
  const [editingTier, setEditingTier] = useState<string | null>(null);

  // Helper to generate patch operations for payload fields
  const patchPayload = useCallback(
    (field: string, value: unknown) => {
      const ops: PatchOperation[] = [
        { op: 'replace', path: `/payload/${field}`, value },
      ];
      onEdit(ops);
    },
    [onEdit]
  );

  // Helper for nested payload updates (e.g., tierSystem)
  const updatePayload = useCallback(
    (updates: Partial<FederatedGrovePayload>) => {
      const ops: PatchOperation[] = Object.entries(updates).map(([key, value]) => ({
        op: 'replace' as const,
        path: `/payload/${key}`,
        value,
      }));
      onEdit(ops);
    },
    [onEdit]
  );

  const addCapability = () => {
    if (newCapability.trim() && !payload.capabilities.includes(newCapability.trim())) {
      updatePayload({
        capabilities: [...payload.capabilities, newCapability.trim()],
      });
      setNewCapability('');
    }
  };

  const removeCapability = (cap: string) => {
    updatePayload({
      capabilities: payload.capabilities.filter((c) => c !== cap),
    });
  };

  const addTier = () => {
    const newTier: TierDefinition = {
      id: `tier-${Date.now()}`,
      name: `Tier ${(payload.tierSystem?.tiers?.length || 0) + 1}`,
      level: (payload.tierSystem?.tiers?.length || 0) + 1,
      icon: '🌱',
      color: '#94a3b8',
    };
    updatePayload({
      tierSystem: {
        ...payload.tierSystem,
        tiers: [...(payload.tierSystem?.tiers || []), newTier],
      },
    });
  };

  const updateTier = (tierId: string, updates: Partial<TierDefinition>) => {
    updatePayload({
      tierSystem: {
        ...payload.tierSystem,
        tiers: (payload.tierSystem?.tiers || []).map((t) =>
          t.id === tierId ? { ...t, ...updates } : t
        ),
      },
    });
  };

  const removeTier = (tierId: string) => {
    updatePayload({
      tierSystem: {
        ...payload.tierSystem,
        tiers: (payload.tierSystem?.tiers || []).filter((t) => t.id !== tierId),
      },
    });
  };

  const connectionStatus = mapConnectionStatus(payload.connectionStatus);
  const trustConfig = TRUST_LEVEL_CONFIGS[payload.trustLevel];

  return (
    <div className={`flex flex-col h-full ${className}`} data-testid="grove-editor">
      {/* Status Banner */}
      <StatusBanner
        status={connectionStatus}
        label={CONNECTION_STATUS_CONFIG[payload.connectionStatus || 'none']?.label || 'Unknown'}
        description={
          connectionStatus === 'connected'
            ? 'Grove is actively participating in federation'
            : connectionStatus === 'pending'
            ? 'Establishing connection...'
            : 'Grove is not connected to the federation'
        }
        actions={
          connectionStatus === 'connected' ? (
            <button
              onClick={() => updatePayload({ connectionStatus: 'disconnected' })}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
              style={{ backgroundColor: 'var(--semantic-error-bg)', color: 'var(--semantic-error)' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
            >
              Disconnect
            </button>
          ) : connectionStatus === 'disconnected' ? (
            <button
              onClick={() => updatePayload({ connectionStatus: 'connecting' })}
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/30"
            >
              Connect
            </button>
          ) : null
        }
        className="border-b"
      />

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Identity Section */}
        <InspectorSection title="Identity">
          <div className="space-y-3">
            {/* Grove Name */}
            <div>
              <label
                htmlFor="grove-name"
                className="block text-xs text-[var(--glass-text-muted)] mb-1"
              >
                Grove Name
              </label>
              <BufferedInput
                id="grove-name"
                value={payload.name || ''}
                onChange={(v) => patchPayload('name', v)}
                placeholder="My Grove Community"
                className={inputClasses}
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="grove-description"
                className="block text-xs text-[var(--glass-text-muted)] mb-1"
              >
                Description
              </label>
              <BufferedTextarea
                id="grove-description"
                value={payload.description || ''}
                onChange={(v) => patchPayload('description', v)}
                placeholder="Brief description of this grove community..."
                rows={3}
                className={`${inputClasses} resize-none`}
              />
            </div>

            {/* Grove ID (read-only) */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--glass-text-muted)]">Grove ID</span>
              <code className="px-2 py-0.5 rounded-full bg-[var(--glass-elevated)] text-sm font-mono text-[var(--glass-text-secondary)]">
                {payload.groveId || 'Not set'}
              </code>
              <span className="text-xs text-[var(--glass-text-muted)]">(immutable)</span>
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* Connection Section */}
        <InspectorSection title="Connection">
          <div className="space-y-3">
            {/* Status Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="grove-status"
                  className="block text-xs text-[var(--glass-text-muted)] mb-1"
                >
                  Status
                </label>
                <select
                  id="grove-status"
                  value={payload.status || 'active'}
                  onChange={(e) => updatePayload({ status: e.target.value as GroveStatus })}
                  className={selectClasses}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="degraded">Degraded</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="grove-connection"
                  className="block text-xs text-[var(--glass-text-muted)] mb-1"
                >
                  Connection
                </label>
                <select
                  id="grove-connection"
                  value={payload.connectionStatus || 'none'}
                  onChange={(e) => updatePayload({ connectionStatus: e.target.value as ConnectionStatus })}
                  className={selectClasses}
                >
                  {Object.entries(CONNECTION_STATUS_CONFIG).map(([value, config]) => (
                    <option key={value} value={value}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Endpoint */}
            <div>
              <label
                htmlFor="grove-endpoint"
                className="block text-xs text-[var(--glass-text-muted)] mb-1"
              >
                Federation Endpoint
              </label>
              <BufferedInput
                id="grove-endpoint"
                type="url"
                value={payload.endpoint || ''}
                onChange={(v) => patchPayload('endpoint', v)}
                placeholder="https://grove.example.com/api/federation"
                className={`${inputClasses} font-mono text-sm`}
              />
            </div>

            {/* Trust Score Visualization */}
            <div className="p-4 rounded-lg bg-[var(--glass-elevated)]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-[var(--glass-text-secondary)]">Trust Score</span>
                <span
                  className="text-lg font-bold"
                  style={{ color: trustConfig?.color || 'var(--glass-text-primary)' }}
                >
                  {payload.trustScore}%
                </span>
              </div>
              <ProgressScoreBar
                value={payload.trustScore || 0}
                gradient={{ from: 'var(--neon-amber)', to: 'var(--neon-green)' }}
                markers={[
                  { position: 25, label: 'New' },
                  { position: 50, label: 'Established' },
                  { position: 75, label: 'Trusted' },
                  { position: 95, label: 'Verified' },
                ]}
              />
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* Technical Section (Collapsible) */}
        <InspectorSection title="Technical" collapsible defaultCollapsed>
          <div className="space-y-3">
            {/* Tier System Name */}
            <div>
              <label
                htmlFor="tier-system-name"
                className="block text-xs text-[var(--glass-text-muted)] mb-1"
              >
                Tier System Name
              </label>
              <BufferedInput
                id="tier-system-name"
                value={payload.tierSystem?.name || ''}
                onChange={(v) =>
                  updatePayload({
                    tierSystem: { ...payload.tierSystem, name: v },
                  })
                }
                placeholder="Botanical, Academic, etc."
                className={inputClasses}
              />
            </div>

            {/* Tiers List */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-2">
                Tiers
              </label>
              <div className="space-y-2 mb-3">
                {(payload.tierSystem?.tiers || []).map((tier) => (
                  <div
                    key={tier.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-[var(--glass-solid)] border border-[var(--glass-border)]"
                  >
                    {editingTier === tier.id ? (
                      <>
                        <input
                          type="text"
                          value={tier.icon}
                          onChange={(e) => updateTier(tier.id, { icon: e.target.value })}
                          className="w-12 px-2 py-1 rounded bg-[var(--glass-elevated)] border border-[var(--glass-border)] text-center"
                          placeholder="🌱"
                        />
                        <input
                          type="text"
                          value={tier.name}
                          onChange={(e) => updateTier(tier.id, { name: e.target.value })}
                          className="flex-1 px-2 py-1 rounded bg-[var(--glass-elevated)] border border-[var(--glass-border)]"
                        />
                        <input
                          type="number"
                          value={tier.level}
                          onChange={(e) => updateTier(tier.id, { level: parseInt(e.target.value) || 1 })}
                          className="w-16 px-2 py-1 rounded bg-[var(--glass-elevated)] border border-[var(--glass-border)]"
                          min={1}
                        />
                        <button
                          onClick={() => setEditingTier(null)}
                          className="p-1 hover:opacity-80"
                          style={{ color: 'var(--semantic-success)' }}
                          aria-label="Save tier changes"
                        >
                          <span className="material-symbols-outlined text-sm">check</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-lg">{tier.icon}</span>
                        <span className="flex-1 text-[var(--glass-text-primary)]">{tier.name}</span>
                        <span className="text-xs text-[var(--glass-text-muted)]">Level {tier.level}</span>
                        <button
                          onClick={() => setEditingTier(tier.id)}
                          className="p-1 text-[var(--glass-text-muted)] hover:text-[var(--glass-text-primary)]"
                          aria-label={`Edit tier ${tier.name}`}
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button
                          onClick={() => removeTier(tier.id)}
                          className="p-1 transition-colors"
                          style={{ color: 'var(--semantic-error)' }}
                          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                          aria-label={`Delete tier ${tier.name}`}
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={addTier}
                className="w-full py-2 rounded-lg border border-dashed border-[var(--glass-border)] text-[var(--glass-text-muted)] hover:border-[var(--neon-cyan)] hover:text-[var(--neon-cyan)] transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                Add Tier
              </button>
            </div>

            {/* Capabilities */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-2">
                Capabilities
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {(payload.capabilities || []).map((cap) => (
                  <span
                    key={cap}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] text-sm"
                  >
                    {cap}
                    <button
                      onClick={() => removeCapability(cap)}
                      className="hover:text-white"
                      aria-label={`Remove capability ${cap}`}
                    >
                      <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <BufferedInput
                  value={newCapability}
                  onChange={setNewCapability}
                  onBlur={() => {
                    if (newCapability.trim()) addCapability();
                  }}
                  placeholder="Add capability..."
                  className={`flex-1 ${inputClasses}`}
                />
                <button
                  onClick={addCapability}
                  className="px-4 py-2 rounded-lg bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/30 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* Statistics Section (Read-only, collapsible) */}
        <InspectorSection title="Statistics" collapsible defaultCollapsed>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-[var(--glass-elevated)]">
              <div className="text-xs text-[var(--glass-text-muted)]">Total Sprouts</div>
              <div className="text-2xl font-bold text-[var(--glass-text-primary)]">
                {payload.sproutCount?.toLocaleString() || 0}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-[var(--glass-elevated)]">
              <div className="text-xs text-[var(--glass-text-muted)]">Exchanges</div>
              <div className="text-2xl font-bold text-[var(--glass-text-primary)]">
                {payload.exchangeCount?.toLocaleString() || 0}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-[var(--glass-elevated)]">
              <div className="text-xs text-[var(--glass-text-muted)]">Trust Level</div>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-lg">{trustConfig?.icon}</span>
                <span className="text-[var(--glass-text-primary)]" style={{ color: trustConfig?.color }}>
                  {trustConfig?.label}
                </span>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-[var(--glass-elevated)]">
              <div className="text-xs text-[var(--glass-text-muted)]">Trust Score</div>
              <div className="text-lg font-medium" style={{ color: trustConfig?.color }}>
                {payload.trustScore}%
              </div>
            </div>
          </div>
        </InspectorSection>
      </div>

      {/* Footer Actions */}
      <div className="px-4 py-3 border-t border-[var(--glass-border)] space-y-3 flex-shrink-0">
        <button
          disabled={!hasChanges || loading}
          onClick={onSave}
          className="w-full px-4 py-2.5 rounded-lg bg-[var(--neon-cyan)] text-[var(--glass-void)] font-medium hover:bg-[var(--neon-cyan)]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={onDuplicate}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg border border-[var(--glass-border)] text-[var(--glass-text-secondary)] hover:bg-[var(--glass-elevated)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">content_copy</span>
            Duplicate
          </button>
          <button
            onClick={onDelete}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1"
            style={{ borderColor: 'var(--semantic-error-border)', color: 'var(--semantic-error)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--semantic-error-bg)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span className="material-symbols-outlined text-sm">delete</span>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default GroveEditor;
