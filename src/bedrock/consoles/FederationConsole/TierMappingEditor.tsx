// src/bedrock/consoles/FederationConsole/TierMappingEditor.tsx
// Editor component for Tier Mapping with factory pattern
// Sprint: S15-BD-FederationEditors-v1

import React, { useState, useCallback } from 'react';
import type { ObjectEditorProps, PatchOperation } from '../../patterns/console-factory.types';
import type { TierMappingPayload, TierEquivalence, EquivalenceType, MappingStatus } from '@core/schema/federation';
import { InspectorSection, InspectorDivider } from '../../primitives/BedrockInspector';
import { BufferedInput } from '../../primitives/BufferedInput';
import { GroveConnectionDiagram } from '../../components/GroveConnectionDiagram';
import { ConfidenceBar } from '../../components/ProgressScoreBar';

// =============================================================================
// Constants
// =============================================================================

const EQUIVALENCE_TYPES: Array<{ value: EquivalenceType; label: string; description: string }> = [
  { value: 'exact', label: 'Exact', description: 'Identical meaning and scope' },
  { value: 'approximate', label: 'Approximate', description: 'Similar but not identical' },
  { value: 'subset', label: 'Subset', description: 'Source is more specific than target' },
  { value: 'superset', label: 'Superset', description: 'Source is broader than target' },
];

const STATUS_OPTIONS: Array<{ value: MappingStatus; label: string; color: string }> = [
  { value: 'draft', label: 'Draft', color: 'text-[var(--glass-text-muted)]' },
  { value: 'proposed', label: 'Proposed', color: 'text-[var(--neon-amber)]' },
  { value: 'accepted', label: 'Accepted', color: 'text-[var(--neon-green)]' },
  { value: 'rejected', label: 'Rejected', color: 'text-[var(--semantic-error)]' },
];

// Shared CSS classes for inputs
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
// Helper: Status Badge
// =============================================================================

function StatusBadge({ status }: { status: MappingStatus }) {
  const config = STATUS_OPTIONS.find((s) => s.value === status) || STATUS_OPTIONS[0];

  const bgColors: Record<MappingStatus, string> = {
    draft: 'bg-[var(--glass-text-muted)]/10',
    proposed: 'bg-[var(--neon-amber)]/10',
    accepted: 'bg-[var(--neon-green)]/10',
    rejected: 'bg-[var(--semantic-error-bg)]',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${bgColors[status]} ${config.color}`}>
      {config.label}
    </span>
  );
}

// =============================================================================
// Helper: Equivalence Type Badge
// =============================================================================

function EquivalenceBadge({ type }: { type: EquivalenceType }) {
  const colors: Record<EquivalenceType, string> = {
    exact: 'bg-[var(--neon-green)]/20 text-[var(--neon-green)]',
    approximate: 'bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)]',
    subset: 'bg-[var(--neon-amber)]/20 text-[var(--neon-amber)]',
    superset: 'bg-purple-500/20 text-purple-400',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[type]}`}>
      {type}
    </span>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function TierMappingEditor({
  object: mapping,
  onEdit,
  onSave,
  onDelete,
  onDuplicate,
  loading,
  hasChanges,
  className = '',
}: ObjectEditorProps<TierMappingPayload>) {
  const { payload } = mapping;
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newMapping, setNewMapping] = useState<Partial<TierEquivalence>>({
    sourceTierId: '',
    targetTierId: '',
    equivalenceType: 'approximate',
  });

  // Helper for payload updates using patch operations
  const updatePayload = useCallback(
    (updates: Partial<TierMappingPayload>) => {
      const ops: PatchOperation[] = Object.entries(updates).map(([key, value]) => ({
        op: 'replace' as const,
        path: `/payload/${key}`,
        value,
      }));
      onEdit(ops);
    },
    [onEdit]
  );

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

  const confidencePercent = Math.round((payload.confidenceScore || 0) * 100);

  return (
    <div className={`flex flex-col h-full ${className}`} data-testid="tier-mapping-editor">
      {/* ================================================================== */}
      {/* Header with status badge                                          */}
      {/* ================================================================== */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--neon-cyan)]/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-lg text-[var(--neon-cyan)]">
              compare_arrows
            </span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-[var(--glass-text-primary)]">
              Tier Mapping
            </h3>
            <p className="text-xs text-[var(--glass-text-muted)]">
              {mapping.id}
            </p>
          </div>
        </div>
        <StatusBadge status={payload.status || 'draft'} />
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
              sourceGrove={payload.sourceGroveId || ''}
              targetGrove={payload.targetGroveId || ''}
              sourceLabel="Source Grove"
              targetLabel="Target Grove"
              onSourceChange={(v) => updatePayload({ sourceGroveId: v })}
              onTargetChange={(v) => updatePayload({ targetGroveId: v })}
              icon={
                <span className="material-symbols-outlined text-xl text-[var(--neon-cyan)]">
                  compare_arrows
                </span>
              }
            />
          </InspectorSection>

          <InspectorDivider />

          {/* ============================================================ */}
          {/* Status & Confidence Section                                  */}
          {/* ============================================================ */}
          <InspectorSection title="Status & Confidence">
            <div className="space-y-4">
              {/* Status Select */}
              <div>
                <label className="block text-xs text-[var(--glass-text-muted)] mb-1.5">
                  Mapping Status
                </label>
                <select
                  value={payload.status || 'draft'}
                  onChange={(e) => updatePayload({ status: e.target.value as MappingStatus })}
                  className={selectClasses}
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
                <label className="block text-xs text-[var(--glass-text-muted)] mb-1.5">
                  Confidence Score
                </label>
                <div className="space-y-2">
                  <ConfidenceBar value={confidencePercent} showValue />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={confidencePercent}
                    onChange={(e) => updatePayload({ confidenceScore: parseInt(e.target.value) / 100 })}
                    className="w-full accent-[var(--neon-cyan)]"
                    aria-label="Confidence score slider"
                  />
                </div>
              </div>
            </div>
          </InspectorSection>

          <InspectorDivider />

          {/* ============================================================ */}
          {/* Tier Equivalences Section                                    */}
          {/* ============================================================ */}
          <InspectorSection title="Tier Equivalences">
            {/* Existing mappings */}
            <div className="space-y-2 mb-4">
              {(payload.mappings || []).length === 0 ? (
                <div className="p-4 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-center">
                  <span className="material-symbols-outlined text-2xl text-[var(--glass-text-muted)] mb-2 block">
                    layers
                  </span>
                  <p className="text-sm text-[var(--glass-text-muted)]">
                    No tier equivalences defined
                  </p>
                  <p className="text-xs text-[var(--glass-text-subtle)] mt-1">
                    Add mappings below to define how tiers translate between groves
                  </p>
                </div>
              ) : (
                (payload.mappings || []).map((equiv, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)]"
                  >
                    {editingIndex === index ? (
                      /* Edit Mode */
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <BufferedInput
                            value={equiv.sourceTierId}
                            onChange={(v) => updateMapping(index, { sourceTierId: v })}
                            placeholder="Source tier ID"
                            className={`flex-1 ${inputClasses}`}
                          />
                          <span className="material-symbols-outlined text-[var(--neon-cyan)]">
                            arrow_forward
                          </span>
                          <BufferedInput
                            value={equiv.targetTierId}
                            onChange={(v) => updateMapping(index, { targetTierId: v })}
                            placeholder="Target tier ID"
                            className={`flex-1 ${inputClasses}`}
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={equiv.equivalenceType}
                            onChange={(e) => updateMapping(index, { equivalenceType: e.target.value as EquivalenceType })}
                            className={`flex-1 ${selectClasses}`}
                          >
                            {EQUIVALENCE_TYPES.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label} - {type.description}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={() => setEditingIndex(null)}
                            className="p-2 rounded-lg bg-[var(--neon-green)]/10 text-[var(--neon-green)] hover:bg-[var(--neon-green)]/20 transition-colors"
                            aria-label="Save changes"
                          >
                            <span className="material-symbols-outlined text-sm">check</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display Mode */
                      <div className="flex items-center gap-2">
                        <span className="flex-1 text-[var(--glass-text-primary)] truncate font-mono text-sm">
                          {equiv.sourceTierId}
                        </span>
                        <span className="material-symbols-outlined text-[var(--neon-cyan)]">
                          arrow_forward
                        </span>
                        <span className="flex-1 text-[var(--glass-text-primary)] truncate font-mono text-sm">
                          {equiv.targetTierId}
                        </span>
                        <EquivalenceBadge type={equiv.equivalenceType} />
                        <button
                          onClick={() => setEditingIndex(index)}
                          className="p-1.5 rounded text-[var(--glass-text-muted)] hover:text-[var(--glass-text-primary)] hover:bg-white/5 transition-colors"
                          aria-label="Edit mapping"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button
                          onClick={() => removeMapping(index)}
                          className="p-1.5 rounded transition-colors"
                          style={{ color: 'var(--semantic-error)' }}
                          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.backgroundColor = 'var(--semantic-error-bg)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                          aria-label="Delete mapping"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Add new mapping form */}
            <div className="p-4 rounded-lg border border-dashed border-[var(--glass-border)] bg-[var(--glass-bg)]/50">
              <div className="text-xs text-[var(--glass-text-muted)] mb-3 font-medium">
                Add New Equivalence
              </div>
              <div className="flex items-center gap-2 mb-3">
                <BufferedInput
                  value={newMapping.sourceTierId || ''}
                  onChange={(v) => setNewMapping({ ...newMapping, sourceTierId: v })}
                  placeholder="Source tier ID"
                  className={`flex-1 ${inputClasses}`}
                />
                <span className="material-symbols-outlined text-[var(--neon-cyan)]">
                  arrow_forward
                </span>
                <BufferedInput
                  value={newMapping.targetTierId || ''}
                  onChange={(v) => setNewMapping({ ...newMapping, targetTierId: v })}
                  placeholder="Target tier ID"
                  className={`flex-1 ${inputClasses}`}
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={newMapping.equivalenceType || 'approximate'}
                  onChange={(e) => setNewMapping({ ...newMapping, equivalenceType: e.target.value as EquivalenceType })}
                  className={`flex-1 ${selectClasses}`}
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
                  className="px-4 py-2 rounded-lg bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  Add
                </button>
              </div>
            </div>
          </InspectorSection>

          <InspectorDivider />

          {/* ============================================================ */}
          {/* Validation Section (Collapsible)                             */}
          {/* ============================================================ */}
          <InspectorSection
            title="Validation"
            collapsible
            defaultCollapsed={!payload.validatedAt}
          >
            {payload.validatedAt ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                    Validated At
                  </label>
                  <div className="px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--glass-text-primary)]">
                    {new Date(payload.validatedAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                    Validated By
                  </label>
                  <div className="px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm text-[var(--glass-text-primary)]">
                    {payload.validatedBy || 'Unknown'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-center">
                <span className="material-symbols-outlined text-2xl text-[var(--glass-text-muted)] mb-2 block">
                  pending
                </span>
                <p className="text-sm text-[var(--glass-text-muted)]">
                  Not yet validated
                </p>
              </div>
            )}
          </InspectorSection>
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

export default TierMappingEditor;
