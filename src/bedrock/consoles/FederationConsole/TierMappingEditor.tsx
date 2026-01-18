// src/bedrock/consoles/FederationConsole/TierMappingEditor.tsx
// Editor component for Tier Mapping
// Sprint: S9-SL-Federation v1

import React, { useState } from 'react';
import type { ObjectEditorProps } from '../../patterns/console-factory.types';
import type { TierMappingPayload, TierEquivalence, EquivalenceType, MappingStatus } from '@core/schema/federation';

/**
 * Equivalence type options
 */
const EQUIVALENCE_TYPES: Array<{ value: EquivalenceType; label: string; description: string }> = [
  { value: 'exact', label: 'Exact', description: 'Identical meaning and scope' },
  { value: 'approximate', label: 'Approximate', description: 'Similar but not identical' },
  { value: 'subset', label: 'Subset', description: 'Source is more specific than target' },
  { value: 'superset', label: 'Superset', description: 'Source is broader than target' },
];

/**
 * Status options
 */
const STATUS_OPTIONS: Array<{ value: MappingStatus; label: string }> = [
  { value: 'draft', label: 'Draft' },
  { value: 'proposed', label: 'Proposed' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
];

/**
 * Editor component for Tier Mapping configuration
 */
export function TierMappingEditor({
  object: mapping,
  onChange,
  className = '',
}: ObjectEditorProps<TierMappingPayload>) {
  const { payload } = mapping;
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newMapping, setNewMapping] = useState<Partial<TierEquivalence>>({
    sourceTierId: '',
    targetTierId: '',
    equivalenceType: 'approximate',
  });

  const updatePayload = (updates: Partial<TierMappingPayload>) => {
    onChange({
      ...mapping,
      payload: { ...payload, ...updates },
      meta: { ...mapping.meta, updatedAt: new Date().toISOString() },
    });
  };

  const addMapping = () => {
    if (newMapping.sourceTierId && newMapping.targetTierId) {
      const equiv: TierEquivalence = {
        sourceTierId: newMapping.sourceTierId,
        targetTierId: newMapping.targetTierId,
        equivalenceType: newMapping.equivalenceType || 'approximate',
      };
      updatePayload({
        mappings: [...(payload.mappings || []), equiv],
      });
      setNewMapping({
        sourceTierId: '',
        targetTierId: '',
        equivalenceType: 'approximate',
      });
    }
  };

  const updateMapping = (index: number, updates: Partial<TierEquivalence>) => {
    const newMappings = [...(payload.mappings || [])];
    newMappings[index] = { ...newMappings[index], ...updates };
    updatePayload({ mappings: newMappings });
  };

  const removeMapping = (index: number) => {
    updatePayload({
      mappings: (payload.mappings || []).filter((_, i) => i !== index),
    });
  };

  return (
    <div className={`space-y-6 ${className}`} data-testid="tier-mapping-editor">
      {/* Grove References Section */}
      <section>
        <h3 className="text-sm font-medium text-[var(--glass-text-primary)] mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">forest</span>
          Grove Pair
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Source Grove */}
          <div>
            <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
              Source Grove
            </label>
            <input
              type="text"
              value={payload.sourceGroveId || ''}
              onChange={(e) => updatePayload({ sourceGroveId: e.target.value })}
              placeholder="source-grove-id"
              className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-muted)] focus:outline-none focus:border-[var(--neon-cyan)]"
            />
          </div>

          {/* Target Grove */}
          <div>
            <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
              Target Grove
            </label>
            <input
              type="text"
              value={payload.targetGroveId || ''}
              onChange={(e) => updatePayload({ targetGroveId: e.target.value })}
              placeholder="target-grove-id"
              className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-muted)] focus:outline-none focus:border-[var(--neon-cyan)]"
            />
          </div>
        </div>
      </section>

      {/* Status and Confidence Section */}
      <section>
        <h3 className="text-sm font-medium text-[var(--glass-text-primary)] mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">settings</span>
          Status & Confidence
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {/* Status */}
          <div>
            <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
              Status
            </label>
            <select
              value={payload.status || 'draft'}
              onChange={(e) => updatePayload({ status: e.target.value as MappingStatus })}
              className="w-full px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] focus:outline-none focus:border-[var(--neon-cyan)]"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Confidence Score */}
          <div>
            <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
              Confidence Score ({Math.round((payload.confidenceScore || 0) * 100)}%)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round((payload.confidenceScore || 0) * 100)}
              onChange={(e) => updatePayload({ confidenceScore: parseInt(e.target.value) / 100 })}
              className="w-full"
            />
          </div>
        </div>
      </section>

      {/* Tier Mappings Section */}
      <section>
        <h3 className="text-sm font-medium text-[var(--glass-text-primary)] mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">compare_arrows</span>
          Tier Equivalences
        </h3>

        {/* Existing mappings */}
        <div className="space-y-2 mb-4">
          {(payload.mappings || []).map((equiv, index) => (
            <div
              key={index}
              className="flex items-center gap-2 p-3 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)]"
            >
              {editingIndex === index ? (
                <>
                  <input
                    type="text"
                    value={equiv.sourceTierId}
                    onChange={(e) => updateMapping(index, { sourceTierId: e.target.value })}
                    className="flex-1 px-2 py-1 rounded bg-[var(--glass-solid)] border border-[var(--glass-border)] text-sm"
                    placeholder="Source tier ID"
                  />
                  <span className="material-symbols-outlined text-blue-400">arrow_forward</span>
                  <input
                    type="text"
                    value={equiv.targetTierId}
                    onChange={(e) => updateMapping(index, { targetTierId: e.target.value })}
                    className="flex-1 px-2 py-1 rounded bg-[var(--glass-solid)] border border-[var(--glass-border)] text-sm"
                    placeholder="Target tier ID"
                  />
                  <select
                    value={equiv.equivalenceType}
                    onChange={(e) => updateMapping(index, { equivalenceType: e.target.value as EquivalenceType })}
                    className="px-2 py-1 rounded bg-[var(--glass-solid)] border border-[var(--glass-border)] text-sm"
                  >
                    {EQUIVALENCE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => setEditingIndex(null)}
                    className="p-1 text-green-400 hover:text-green-300"
                  >
                    <span className="material-symbols-outlined text-sm">check</span>
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-[var(--glass-text-primary)] truncate">
                    {equiv.sourceTierId}
                  </span>
                  <span className="material-symbols-outlined text-blue-400">arrow_forward</span>
                  <span className="flex-1 text-[var(--glass-text-primary)] truncate">
                    {equiv.targetTierId}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs ${
                      equiv.equivalenceType === 'exact'
                        ? 'bg-green-500/20 text-green-400'
                        : equiv.equivalenceType === 'approximate'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {equiv.equivalenceType}
                  </span>
                  <button
                    onClick={() => setEditingIndex(index)}
                    className="p-1 text-[var(--glass-text-muted)] hover:text-[var(--glass-text-primary)]"
                  >
                    <span className="material-symbols-outlined text-sm">edit</span>
                  </button>
                  <button
                    onClick={() => removeMapping(index)}
                    className="p-1 text-red-400 hover:text-red-300"
                  >
                    <span className="material-symbols-outlined text-sm">delete</span>
                  </button>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Add new mapping */}
        <div className="p-3 rounded-lg border border-dashed border-[var(--glass-border)]">
          <div className="flex items-center gap-2 mb-3">
            <input
              type="text"
              value={newMapping.sourceTierId || ''}
              onChange={(e) => setNewMapping({ ...newMapping, sourceTierId: e.target.value })}
              placeholder="Source tier ID"
              className="flex-1 px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-muted)] focus:outline-none focus:border-[var(--neon-cyan)]"
            />
            <span className="material-symbols-outlined text-blue-400">arrow_forward</span>
            <input
              type="text"
              value={newMapping.targetTierId || ''}
              onChange={(e) => setNewMapping({ ...newMapping, targetTierId: e.target.value })}
              placeholder="Target tier ID"
              className="flex-1 px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-muted)] focus:outline-none focus:border-[var(--neon-cyan)]"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={newMapping.equivalenceType || 'approximate'}
              onChange={(e) => setNewMapping({ ...newMapping, equivalenceType: e.target.value as EquivalenceType })}
              className="flex-1 px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] focus:outline-none focus:border-[var(--neon-cyan)]"
            >
              {EQUIVALENCE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label} - {type.description}
                </option>
              ))}
            </select>
            <button
              onClick={addMapping}
              disabled={!newMapping.sourceTierId || !newMapping.targetTierId}
              className="px-4 py-2 rounded-lg bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Mapping
            </button>
          </div>
        </div>
      </section>

      {/* Validation Info (Read-only) */}
      {payload.validatedAt && (
        <section>
          <h3 className="text-sm font-medium text-[var(--glass-text-primary)] mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">verified</span>
            Validation
          </h3>
          <div className="p-4 rounded-lg bg-[var(--glass-bg)]">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-[var(--glass-text-muted)]">Validated At</span>
                <div className="text-[var(--glass-text-primary)]">
                  {new Date(payload.validatedAt).toLocaleString()}
                </div>
              </div>
              {payload.validatedBy && (
                <div>
                  <span className="text-xs text-[var(--glass-text-muted)]">Validated By</span>
                  <div className="text-[var(--glass-text-primary)]">{payload.validatedBy}</div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default TierMappingEditor;
