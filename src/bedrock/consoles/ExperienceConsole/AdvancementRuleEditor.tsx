// src/bedrock/consoles/ExperienceConsole/AdvancementRuleEditor.tsx
// Editor component for Advancement Rules with criteria builder
// Sprint: S7-SL-AutoAdvancement v1
//
// DEX: Declarative Sovereignty - Rule criteria are JSON configuration
// DEX: Organic Scalability - Uses established editor patterns

import React, { useCallback, useState } from 'react';
import type { ObjectEditorProps } from '../../patterns/console-factory.types';
import type { AdvancementRulePayload, AdvancementCriterion, SignalType, ComparisonOperator, LogicOperator } from '@core/schema/advancement';
import { SIGNAL_METADATA } from '@core/schema/advancement';
import type { PatchOperation } from '../../types/copilot.types';
import { InspectorSection, InspectorDivider } from '../../primitives/BedrockInspector';
import { GlassButton } from '../../primitives/GlassButton';
import { BufferedInput, BufferedTextarea } from '../../primitives/BufferedInput';
import { useAdvancementRuleData } from './useAdvancementRuleData';

// =============================================================================
// Constants
// =============================================================================

const TIER_OPTIONS = ['seed', 'sprout', 'sapling', 'tree', 'grove'];

const SIGNAL_OPTIONS: { value: SignalType; label: string; description: string }[] = [
  { value: 'retrievals', label: 'Retrievals', description: 'Total retrieval count' },
  { value: 'citations', label: 'Citations', description: 'Citation/reference count' },
  { value: 'queryDiversity', label: 'Query Diversity', description: 'Diversity score (0-1)' },
  { value: 'utilityScore', label: 'Utility Score', description: 'User rating score (0-1)' },
];

const OPERATOR_OPTIONS: { value: ComparisonOperator; label: string }[] = [
  { value: '>=', label: '>= (at least)' },
  { value: '>', label: '> (more than)' },
  { value: '==', label: '== (exactly)' },
  { value: '<', label: '< (less than)' },
  { value: '<=', label: '<= (at most)' },
];

const LOGIC_OPTIONS: { value: LogicOperator; label: string; description: string }[] = [
  { value: 'AND', label: 'AND', description: 'All criteria must be met' },
  { value: 'OR', label: 'OR', description: 'Any criterion must be met' },
];

// =============================================================================
// CriterionRow Component
// =============================================================================

interface CriterionRowProps {
  criterion: AdvancementCriterion;
  index: number;
  onChange: (index: number, criterion: AdvancementCriterion) => void;
  onRemove: (index: number) => void;
  disabled?: boolean;
}

function CriterionRow({ criterion, index, onChange, onRemove, disabled }: CriterionRowProps) {
  const signalMeta = SIGNAL_METADATA[criterion.signal];

  return (
    <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)]">
      {/* Signal selector */}
      <select
        value={criterion.signal}
        onChange={(e) => onChange(index, { ...criterion, signal: e.target.value as SignalType })}
        disabled={disabled}
        className="flex-1 bg-[var(--glass-solid)] rounded px-2 py-1.5 text-sm border border-[var(--glass-border)] focus:border-[var(--neon-cyan)] focus:outline-none"
      >
        {SIGNAL_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Operator selector */}
      <select
        value={criterion.operator}
        onChange={(e) => onChange(index, { ...criterion, operator: e.target.value as ComparisonOperator })}
        disabled={disabled}
        className="w-28 bg-[var(--glass-solid)] rounded px-2 py-1.5 text-sm border border-[var(--glass-border)] focus:border-[var(--neon-cyan)] focus:outline-none"
      >
        {OPERATOR_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {/* Threshold input */}
      <input
        type="number"
        value={criterion.threshold}
        onChange={(e) => onChange(index, { ...criterion, threshold: parseFloat(e.target.value) || 0 })}
        disabled={disabled}
        className="w-20 bg-[var(--glass-solid)] rounded px-2 py-1.5 text-sm border border-[var(--glass-border)] focus:border-[var(--neon-cyan)] focus:outline-none text-center"
        min={0}
        step={signalMeta.unit === 'score' ? 0.1 : 1}
      />

      {/* Remove button */}
      <button
        onClick={() => onRemove(index)}
        disabled={disabled}
        className="p-1 rounded text-[var(--glass-text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
        aria-label="Remove criterion"
      >
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  );
}

// =============================================================================
// Main Editor Component
// =============================================================================

/**
 * Editor component for AdvancementRule objects
 */
export function AdvancementRuleEditor({
  object: rule,
  onEdit,
  onSave,
  onDelete,
  onDuplicate,
  loading,
  hasChanges,
}: ObjectEditorProps<AdvancementRulePayload>) {
  const { toggleEnabled } = useAdvancementRuleData();
  const [toggling, setToggling] = useState(false);

  const isEnabled = rule.payload.isEnabled;
  const criteriaCount = rule.payload.criteria.length;

  // Helper to generate patch operations
  const patchMeta = useCallback(
    (field: string, value: unknown) => {
      const ops: PatchOperation[] = [
        { op: 'replace', path: `/meta/${field}`, value },
      ];
      onEdit(ops);
    },
    [onEdit]
  );

  const patchPayload = useCallback(
    (field: string, value: unknown) => {
      const ops: PatchOperation[] = [
        { op: 'replace', path: `/payload/${field}`, value },
      ];
      onEdit(ops);
    },
    [onEdit]
  );

  // Toggle enabled state
  const handleToggleEnabled = useCallback(async () => {
    setToggling(true);
    try {
      await toggleEnabled(rule.meta.id);
    } catch (error) {
      console.error('[AdvancementRuleEditor] Toggle failed:', error);
    } finally {
      setToggling(false);
    }
  }, [rule.meta.id, toggleEnabled]);

  // Update a criterion
  const handleCriterionChange = useCallback(
    (index: number, criterion: AdvancementCriterion) => {
      const newCriteria = [...rule.payload.criteria];
      newCriteria[index] = criterion;
      patchPayload('criteria', newCriteria);
    },
    [rule.payload.criteria, patchPayload]
  );

  // Remove a criterion
  const handleCriterionRemove = useCallback(
    (index: number) => {
      const newCriteria = rule.payload.criteria.filter((_, i) => i !== index);
      patchPayload('criteria', newCriteria);
    },
    [rule.payload.criteria, patchPayload]
  );

  // Add a new criterion
  const handleAddCriterion = useCallback(() => {
    const newCriterion: AdvancementCriterion = {
      signal: 'retrievals',
      operator: '>=',
      threshold: 10,
    };
    const newCriteria = [...rule.payload.criteria, newCriterion];
    patchPayload('criteria', newCriteria);
  }, [rule.payload.criteria, patchPayload]);

  return (
    <div className="flex flex-col h-full">
      {/* Enabled Status Banner */}
      <div className={`
        flex items-center gap-3 px-4 py-3 border-b transition-colors
        ${isEnabled
          ? 'bg-green-500/10 border-green-500/20'
          : 'bg-slate-500/10 border-slate-500/20'
        }
      `}>
        {/* Status dot with pulse animation when enabled */}
        <span className="relative flex h-3 w-3">
          {isEnabled && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          )}
          <span className={`
            relative inline-flex rounded-full h-3 w-3
            ${isEnabled ? 'bg-green-500' : 'bg-slate-500'}
          `} />
        </span>

        {/* Status text */}
        <div className="flex-1">
          <span className={`text-sm font-medium ${isEnabled ? 'text-green-300' : 'text-slate-300'}`}>
            {isEnabled ? 'Enabled' : 'Disabled'}
          </span>
          <p className={`text-xs ${isEnabled ? 'text-green-400/70' : 'text-slate-400/70'}`}>
            {isEnabled ? 'Rule is active for batch evaluation' : 'Rule is not evaluated during batch runs'}
          </p>
        </div>

        {/* Toggle button */}
        <GlassButton
          size="sm"
          variant={isEnabled ? 'danger' : 'success'}
          onClick={handleToggleEnabled}
          disabled={toggling}
        >
          {toggling ? 'Toggling...' : isEnabled ? 'Disable' : 'Enable'}
        </GlassButton>
      </div>

      {/* Header: Icon + Title */}
      <div className="px-4 py-3 border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-2xl text-[var(--neon-cyan)]">
            trending_up
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-[var(--glass-text-primary)] truncate">
              {rule.meta.title || 'Untitled Rule'}
            </h1>
            {/* Tier transition */}
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-xs font-medium">
                {rule.payload.fromTier}
              </span>
              <span className="material-symbols-outlined text-sm text-[var(--glass-text-muted)]">
                arrow_forward
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                {rule.payload.toTier}
              </span>
            </div>
          </div>
          {/* Criteria count indicator */}
          <div className={`
            flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium
            ${criteriaCount > 0
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-slate-500/20 text-slate-400'
            }
          `}>
            <span className="material-symbols-outlined text-sm">checklist</span>
            {criteriaCount}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* === IDENTITY === */}
        <InspectorSection title="Identity" collapsible defaultCollapsed={false}>
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Title</label>
              <BufferedInput
                value={rule.meta.title}
                onChange={(val) => patchMeta('title', val)}
                debounceMs={400}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                placeholder="Rule Title"
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Description</label>
              <BufferedTextarea
                value={rule.meta.description || ''}
                onChange={(val) => patchMeta('description', val)}
                debounceMs={400}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 resize-none"
                placeholder="When should this rule apply?"
                rows={2}
                disabled={loading}
              />
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* === TIER TRANSITION === */}
        <InspectorSection title="Tier Transition" collapsible defaultCollapsed={false}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* From Tier */}
              <div>
                <label className="block text-xs text-[var(--glass-text-muted)] mb-1">From Tier</label>
                <select
                  value={rule.payload.fromTier}
                  onChange={(e) => patchPayload('fromTier', e.target.value)}
                  disabled={loading}
                  className="w-full bg-[var(--glass-solid)] rounded-lg px-3 py-2 text-sm border border-[var(--glass-border)] focus:border-[var(--neon-cyan)] focus:outline-none"
                >
                  {TIER_OPTIONS.map((tier) => (
                    <option key={tier} value={tier}>
                      {tier.charAt(0).toUpperCase() + tier.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* To Tier */}
              <div>
                <label className="block text-xs text-[var(--glass-text-muted)] mb-1">To Tier</label>
                <select
                  value={rule.payload.toTier}
                  onChange={(e) => patchPayload('toTier', e.target.value)}
                  disabled={loading}
                  className="w-full bg-[var(--glass-solid)] rounded-lg px-3 py-2 text-sm border border-[var(--glass-border)] focus:border-[var(--neon-cyan)] focus:outline-none"
                >
                  {TIER_OPTIONS.map((tier) => (
                    <option key={tier} value={tier}>
                      {tier.charAt(0).toUpperCase() + tier.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lifecycle Model (read-only for now) */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--glass-text-muted)]">Lifecycle Model</span>
              <code className="px-2 py-0.5 rounded-full bg-[var(--glass-surface)] text-sm font-mono text-[var(--glass-text-secondary)]">
                {rule.payload.lifecycleModelId}
              </code>
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* === CRITERIA BUILDER === */}
        <InspectorSection title="Advancement Criteria" collapsible defaultCollapsed={false}>
          <div className="space-y-4">
            {/* Logic operator selector (only shown if multiple criteria) */}
            {rule.payload.criteria.length > 1 && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)]">
                <span className="text-sm text-[var(--glass-text-secondary)]">Combine with:</span>
                <div className="flex gap-2">
                  {LOGIC_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => patchPayload('logicOperator', opt.value)}
                      disabled={loading}
                      className={`
                        px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                        ${rule.payload.logicOperator === opt.value
                          ? 'bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] border border-[var(--neon-cyan)]/50'
                          : 'bg-[var(--glass-solid)] text-[var(--glass-text-muted)] border border-[var(--glass-border)] hover:border-[var(--glass-border-bright)]'
                        }
                      `}
                    >
                      {opt.value}
                    </button>
                  ))}
                </div>
                <span className="text-xs text-[var(--glass-text-muted)]">
                  {rule.payload.logicOperator === 'AND' ? 'All criteria must be met' : 'Any criterion must be met'}
                </span>
              </div>
            )}

            {/* Criteria list */}
            <div className="space-y-2">
              {rule.payload.criteria.length === 0 ? (
                <div className="text-center py-6 text-[var(--glass-text-muted)] text-sm">
                  <span className="material-symbols-outlined text-3xl mb-2 block opacity-50">
                    checklist
                  </span>
                  No criteria defined yet.
                  <br />
                  Add criteria to define when sprouts should advance.
                </div>
              ) : (
                rule.payload.criteria.map((criterion, index) => (
                  <CriterionRow
                    key={index}
                    criterion={criterion}
                    index={index}
                    onChange={handleCriterionChange}
                    onRemove={handleCriterionRemove}
                    disabled={loading}
                  />
                ))
              )}
            </div>

            {/* Add criterion button */}
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={handleAddCriterion}
              disabled={loading}
              className="w-full"
            >
              <span className="material-symbols-outlined text-sm mr-1">add</span>
              Add Criterion
            </GlassButton>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* === SIGNAL REFERENCE === */}
        <InspectorSection title="Signal Reference" collapsible defaultCollapsed={true}>
          <div className="space-y-2">
            {Object.entries(SIGNAL_METADATA).map(([key, meta]) => (
              <div
                key={key}
                className="flex items-start gap-3 p-2 rounded bg-[var(--glass-surface)]"
              >
                <code className="px-2 py-0.5 rounded bg-[var(--glass-solid)] text-xs font-mono text-[var(--neon-cyan)]">
                  {key}
                </code>
                <div className="flex-1">
                  <span className="text-sm text-[var(--glass-text-primary)]">{meta.label}</span>
                  <p className="text-xs text-[var(--glass-text-muted)]">{meta.description}</p>
                </div>
                <span className="text-xs text-[var(--glass-text-muted)] px-2 py-0.5 rounded bg-[var(--glass-solid)]">
                  {meta.unit}
                </span>
              </div>
            ))}
          </div>
        </InspectorSection>
      </div>

      {/* Footer actions */}
      <div className="px-4 py-3 border-t border-[var(--glass-border)] space-y-3">
        {/* Primary action: Save */}
        {hasChanges ? (
          <GlassButton
            variant="primary"
            size="sm"
            onClick={onSave}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </GlassButton>
        ) : (
          <div className="w-full px-4 py-2.5 rounded-lg bg-[var(--glass-surface)] text-[var(--glass-text-muted)] text-center text-sm">
            No unsaved changes
          </div>
        )}

        {/* Secondary actions */}
        <div className="flex items-center gap-2">
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={onDuplicate}
            disabled={loading}
            className="flex-1"
          >
            <span className="material-symbols-outlined text-sm mr-1">content_copy</span>
            Duplicate
          </GlassButton>
          <GlassButton
            variant="danger"
            size="sm"
            onClick={onDelete}
            disabled={loading}
            className="flex-1"
          >
            <span className="material-symbols-outlined text-sm mr-1">delete</span>
            Delete
          </GlassButton>
        </div>
      </div>
    </div>
  );
}

export default AdvancementRuleEditor;
