// src/bedrock/consoles/FederationConsole/GroveEditor.tsx
// Editor component for Federated Grove
// Sprint: S9-SL-Federation v1

import React, { useState, useCallback } from 'react';
import type { ObjectEditorProps, PatchOperation } from '../../patterns/console-factory.types';
import type { FederatedGrovePayload, TierDefinition, GroveStatus, ConnectionStatus, TrustLevel } from '@core/schema/federation';
import { TRUST_LEVEL_CONFIGS } from '@core/schema/federation';
import { CONNECTION_STATUS_CONFIG } from './FederationConsole.config';

/**
 * Editor component for Federated Grove configuration
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

  return (
    <div className={`space-y-6 ${className}`} data-testid="grove-editor">
      {/* Basic Info Section */}
      <section>
        <h3 className="text-sm font-medium text-[var(--glass-text-primary)] mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">info</span>
          Basic Information
        </h3>
        <div className="space-y-4">
          {/* Grove ID (read-only if editing existing) */}
          <div>
            <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
              Grove ID
            </label>
            <input
              type="text"
              value={payload.groveId || ''}
              onChange={(e) => updatePayload({ groveId: e.target.value })}
              placeholder="unique-grove-identifier"
              className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-muted)] focus:outline-none focus:border-[var(--neon-cyan)]"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
              Grove Name
            </label>
            <input
              type="text"
              value={payload.name || ''}
              onChange={(e) => updatePayload({ name: e.target.value })}
              placeholder="My Grove Community"
              className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-muted)] focus:outline-none focus:border-[var(--neon-cyan)]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
              Description
            </label>
            <textarea
              value={payload.description || ''}
              onChange={(e) => updatePayload({ description: e.target.value })}
              placeholder="Brief description of this grove community..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-muted)] focus:outline-none focus:border-[var(--neon-cyan)] resize-none"
            />
          </div>

          {/* Endpoint */}
          <div>
            <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
              Federation Endpoint
            </label>
            <input
              type="url"
              value={payload.endpoint || ''}
              onChange={(e) => updatePayload({ endpoint: e.target.value })}
              placeholder="https://grove.example.com/api/federation"
              className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-muted)] focus:outline-none focus:border-[var(--neon-cyan)]"
            />
          </div>
        </div>
      </section>

      {/* Status Section */}
      <section>
        <h3 className="text-sm font-medium text-[var(--glass-text-primary)] mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">settings</span>
          Status & Connection
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Grove Status */}
          <div>
            <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
              Status
            </label>
            <select
              value={payload.status || 'active'}
              onChange={(e) => updatePayload({ status: e.target.value as GroveStatus })}
              className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] focus:outline-none focus:border-[var(--neon-cyan)]"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="degraded">Degraded</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>

          {/* Connection Status */}
          <div>
            <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
              Connection
            </label>
            <select
              value={payload.connectionStatus || 'none'}
              onChange={(e) => updatePayload({ connectionStatus: e.target.value as ConnectionStatus })}
              className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] focus:outline-none focus:border-[var(--neon-cyan)]"
            >
              {Object.entries(CONNECTION_STATUS_CONFIG).map(([value, config]) => (
                <option key={value} value={value}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Tier System Section */}
      <section>
        <h3 className="text-sm font-medium text-[var(--glass-text-primary)] mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">category</span>
          Tier System
        </h3>

        {/* Tier System Name */}
        <div className="mb-4">
          <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
            System Name
          </label>
          <input
            type="text"
            value={payload.tierSystem?.name || ''}
            onChange={(e) =>
              updatePayload({
                tierSystem: { ...payload.tierSystem, name: e.target.value },
              })
            }
            placeholder="Botanical, Academic, etc."
            className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-muted)] focus:outline-none focus:border-[var(--neon-cyan)]"
          />
        </div>

        {/* Tiers List */}
        <div className="space-y-2 mb-3">
          {(payload.tierSystem?.tiers || []).map((tier) => (
            <div
              key={tier.id}
              className="flex items-center gap-2 p-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)]"
            >
              {editingTier === tier.id ? (
                <>
                  <input
                    type="text"
                    value={tier.icon}
                    onChange={(e) => updateTier(tier.id, { icon: e.target.value })}
                    className="w-12 px-2 py-1 rounded bg-[var(--glass-solid)] border border-[var(--glass-border)] text-center"
                    placeholder="🌱"
                  />
                  <input
                    type="text"
                    value={tier.name}
                    onChange={(e) => updateTier(tier.id, { name: e.target.value })}
                    className="flex-1 px-2 py-1 rounded bg-[var(--glass-solid)] border border-[var(--glass-border)]"
                  />
                  <input
                    type="number"
                    value={tier.level}
                    onChange={(e) => updateTier(tier.id, { level: parseInt(e.target.value) || 1 })}
                    className="w-16 px-2 py-1 rounded bg-[var(--glass-solid)] border border-[var(--glass-border)]"
                    min={1}
                  />
                  <button
                    onClick={() => setEditingTier(null)}
                    className="p-1 text-green-400 hover:text-green-300"
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
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button
                    onClick={() => removeTier(tier.id)}
                    className="p-1 text-red-400 hover:text-red-300"
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
      </section>

      {/* Capabilities Section */}
      <section>
        <h3 className="text-sm font-medium text-[var(--glass-text-primary)] mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">extension</span>
          Capabilities
        </h3>

        {/* Existing capabilities */}
        <div className="flex flex-wrap gap-2 mb-3">
          {(payload.capabilities || []).map((cap) => (
            <span
              key={cap}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--glass-bg)] text-[var(--glass-text-secondary)]"
            >
              {cap}
              <button
                onClick={() => removeCapability(cap)}
                className="text-red-400 hover:text-red-300"
              >
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            </span>
          ))}
        </div>

        {/* Add capability */}
        <div className="flex gap-2">
          <input
            type="text"
            value={newCapability}
            onChange={(e) => setNewCapability(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCapability()}
            placeholder="Add capability..."
            className="flex-1 px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-muted)] focus:outline-none focus:border-[var(--neon-cyan)]"
          />
          <button
            onClick={addCapability}
            className="px-4 py-2 rounded-lg bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/30 transition-colors"
          >
            Add
          </button>
        </div>
      </section>

      {/* Trust Info (Read-only) */}
      <section>
        <h3 className="text-sm font-medium text-[var(--glass-text-primary)] mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">shield</span>
          Trust Information
        </h3>
        <div className="grid grid-cols-2 gap-4 p-4 rounded-lg bg-[var(--glass-bg)]">
          <div>
            <span className="text-xs text-[var(--glass-text-muted)]">Trust Score</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl font-bold" style={{ color: TRUST_LEVEL_CONFIGS[payload.trustLevel]?.color }}>
                {payload.trustScore}%
              </span>
            </div>
          </div>
          <div>
            <span className="text-xs text-[var(--glass-text-muted)]">Trust Level</span>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-lg">{TRUST_LEVEL_CONFIGS[payload.trustLevel]?.icon}</span>
              <span className="text-[var(--glass-text-primary)]">
                {TRUST_LEVEL_CONFIGS[payload.trustLevel]?.label}
              </span>
            </div>
          </div>
          <div>
            <span className="text-xs text-[var(--glass-text-muted)]">Sprouts</span>
            <div className="text-[var(--glass-text-primary)] mt-1">{payload.sproutCount}</div>
          </div>
          <div>
            <span className="text-xs text-[var(--glass-text-muted)]">Exchanges</span>
            <div className="text-[var(--glass-text-primary)] mt-1">{payload.exchangeCount}</div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default GroveEditor;
