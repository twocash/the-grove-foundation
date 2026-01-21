// src/bedrock/consoles/ExperienceConsole/QualityThresholdEditor.tsx
// Editor component for Quality Threshold configuration
// Sprint: S10-SL-AICuration v1
//
// DEX: Declarative Sovereignty - Threshold values are configuration
// DEX: Organic Scalability - Uses established editor patterns

import React, { useCallback } from 'react';
import type { ObjectEditorProps } from '../../patterns/console-factory.types';
import type { QualityThresholdPayload, QualityDimension } from '@core/quality/schema';
import type { PatchOperation } from '../../types/copilot.types';
import { InspectorSection, InspectorDivider } from '../../primitives/BedrockInspector';
import { GlassButton } from '../../primitives/GlassButton';
import { BufferedInput, BufferedTextarea } from '../../primitives/BufferedInput';

// =============================================================================
// Constants
// =============================================================================

const DIMENSION_INFO: Record<QualityDimension, { label: string; description: string; icon: string }> = {
  accuracy: {
    label: 'Accuracy',
    description: 'Factual correctness and verification status',
    icon: 'fact_check',
  },
  utility: {
    label: 'Utility',
    description: 'Practical value, relevance, and actionability',
    icon: 'build',
  },
  novelty: {
    label: 'Novelty',
    description: 'Originality and unique insights',
    icon: 'lightbulb',
  },
  provenance: {
    label: 'Provenance',
    description: 'Attribution completeness and source credibility',
    icon: 'verified',
  },
};

const TARGET_TYPE_OPTIONS = [
  { value: 'sprout', label: 'Sprout' },
  { value: 'research-sprout', label: 'Research Sprout' },
  { value: 'document', label: 'Document' },
];

// =============================================================================
// Dimension Threshold Row
// =============================================================================

interface DimensionRowProps {
  dimension: QualityDimension;
  minimum: number;
  target: number;
  weight: number;
  onMinimumChange: (value: number) => void;
  onTargetChange: (value: number) => void;
  onWeightChange: (value: number) => void;
  disabled?: boolean;
}

function DimensionRow({
  dimension,
  minimum,
  target,
  weight,
  onMinimumChange,
  onTargetChange,
  onWeightChange,
  disabled,
}: DimensionRowProps) {
  const info = DIMENSION_INFO[dimension];

  return (
    <div className="p-3 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)]">
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-lg text-[var(--neon-cyan)]">
          {info.icon}
        </span>
        <span className="font-medium text-sm text-[var(--glass-text-primary)]">
          {info.label}
        </span>
      </div>
      <p className="text-xs text-[var(--glass-text-muted)] mb-3">
        {info.description}
      </p>

      <div className="grid grid-cols-3 gap-3">
        {/* Minimum threshold */}
        <div>
          <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
            Minimum
          </label>
          <div className="flex items-center gap-1">
            <input
              type="range"
              min="0"
              max="100"
              value={minimum * 100}
              onChange={(e) => onMinimumChange(parseInt(e.target.value) / 100)}
              disabled={disabled}
              className="flex-1 h-1 accent-[var(--neon-cyan)]"
            />
            <span className="text-xs text-[var(--glass-text-secondary)] w-10 text-right">
              {(minimum * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Target threshold */}
        <div>
          <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
            Target
          </label>
          <div className="flex items-center gap-1">
            <input
              type="range"
              min="0"
              max="100"
              value={target * 100}
              onChange={(e) => onTargetChange(parseInt(e.target.value) / 100)}
              disabled={disabled}
              className="flex-1 h-1 accent-[var(--semantic-success)]"
            />
            <span className="text-xs text-[var(--glass-text-secondary)] w-10 text-right">
              {(target * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        {/* Weight */}
        <div>
          <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
            Weight
          </label>
          <div className="flex items-center gap-1">
            <input
              type="range"
              min="0"
              max="100"
              value={weight * 100}
              onChange={(e) => onWeightChange(parseInt(e.target.value) / 100)}
              disabled={disabled}
              className="flex-1 h-1 accent-purple-500"
            />
            <span className="text-xs text-[var(--glass-text-secondary)] w-10 text-right">
              {(weight * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Main Editor Component
// =============================================================================

export function QualityThresholdEditor({
  object: threshold,
  onEdit,
  onSave,
  onCancel,
  saving,
  className = '',
}: ObjectEditorProps<QualityThresholdPayload>) {
  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleMetaChange = useCallback(
    (field: string, value: string) => {
      onEdit([{ op: 'replace', path: `/meta/${field}`, value }]);
    },
    [onEdit]
  );

  const handleDimensionThresholdChange = useCallback(
    (dimension: QualityDimension, field: 'minimum' | 'target', value: number) => {
      onEdit([{
        op: 'replace',
        path: `/payload/thresholds/${dimension}/${field}`,
        value: Math.round(value * 1000) / 1000,
      }]);
    },
    [onEdit]
  );

  const handleWeightChange = useCallback(
    (dimension: QualityDimension, value: number) => {
      onEdit([{
        op: 'replace',
        path: `/payload/weights/${dimension}`,
        value: Math.round(value * 1000) / 1000,
      }]);
    },
    [onEdit]
  );

  const handleCompositeChange = useCallback(
    (field: 'minimum' | 'target' | 'excellent', value: number) => {
      onEdit([{
        op: 'replace',
        path: `/payload/composite/${field}`,
        value: Math.round(value * 1000) / 1000,
      }]);
    },
    [onEdit]
  );

  const handleAutoFilterToggle = useCallback(() => {
    onEdit([{
      op: 'replace',
      path: '/payload/autoFilterEnabled',
      value: !threshold.payload.autoFilterEnabled,
    }]);
  }, [onEdit, threshold.payload.autoFilterEnabled]);

  const handleTargetTypeToggle = useCallback(
    (type: string) => {
      const currentTypes = threshold.payload.targetTypes || [];
      const newTypes = currentTypes.includes(type)
        ? currentTypes.filter((t) => t !== type)
        : [...currentTypes, type];
      onEdit([{ op: 'replace', path: '/payload/targetTypes', value: newTypes }]);
    },
    [onEdit, threshold.payload.targetTypes]
  );

  const handleActiveToggle = useCallback(() => {
    onEdit([{
      op: 'replace',
      path: '/payload/isActive',
      value: !threshold.payload.isActive,
    }]);
  }, [onEdit, threshold.payload.isActive]);

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const { thresholds, composite, weights, autoFilterEnabled, targetTypes, isActive } = threshold.payload;

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Meta Section */}
        <InspectorSection title="Configuration Details" icon="settings">
          <div className="space-y-3">
            <BufferedInput
              label="Title"
              value={threshold.meta.title}
              onChange={(value) => handleMetaChange('title', value)}
              disabled={saving}
            />
            <BufferedTextarea
              label="Description"
              value={threshold.meta.description || ''}
              onChange={(value) => handleMetaChange('description', value)}
              disabled={saving}
              rows={2}
            />
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* Dimension Thresholds */}
        <InspectorSection title="Dimension Thresholds" icon="tune">
          <div className="space-y-3">
            {(['accuracy', 'utility', 'novelty', 'provenance'] as QualityDimension[]).map((dim) => (
              <DimensionRow
                key={dim}
                dimension={dim}
                minimum={thresholds[dim].minimum}
                target={thresholds[dim].target}
                weight={weights[dim]}
                onMinimumChange={(v) => handleDimensionThresholdChange(dim, 'minimum', v)}
                onTargetChange={(v) => handleDimensionThresholdChange(dim, 'target', v)}
                onWeightChange={(v) => handleWeightChange(dim, v)}
                disabled={saving}
              />
            ))}
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* Composite Thresholds */}
        <InspectorSection title="Composite Score Thresholds" icon="equalizer">
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                  Minimum
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={composite.minimum * 100}
                    onChange={(e) => handleCompositeChange('minimum', parseInt(e.target.value) / 100)}
                    disabled={saving}
                    className="flex-1 h-1"
                    style={{ accentColor: 'var(--semantic-error)' }}
                  />
                  <span className="text-sm text-[var(--glass-text-secondary)] w-12 text-right">
                    {(composite.minimum * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                  Target
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={composite.target * 100}
                    onChange={(e) => handleCompositeChange('target', parseInt(e.target.value) / 100)}
                    disabled={saving}
                    className="flex-1 h-1"
                    style={{ accentColor: 'var(--neon-amber)' }}
                  />
                  <span className="text-sm text-[var(--glass-text-secondary)] w-12 text-right">
                    {(composite.target * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                  Excellent
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={composite.excellent * 100}
                    onChange={(e) => handleCompositeChange('excellent', parseInt(e.target.value) / 100)}
                    disabled={saving}
                    className="flex-1 h-1 accent-[var(--semantic-success)]"
                  />
                  <span className="text-sm text-[var(--glass-text-secondary)] w-12 text-right">
                    {(composite.excellent * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* Settings */}
        <InspectorSection title="Settings" icon="settings_applications">
          <div className="space-y-4">
            {/* Auto-filter toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)]">
              <div>
                <div className="text-sm font-medium text-[var(--glass-text-primary)]">
                  Auto-Filter Content
                </div>
                <div className="text-xs text-[var(--glass-text-muted)]">
                  Automatically filter content below minimum thresholds
                </div>
              </div>
              <button
                onClick={handleAutoFilterToggle}
                disabled={saving}
                className={`
                  w-12 h-6 rounded-full transition-colors relative
                  ${autoFilterEnabled
                    ? 'bg-[var(--neon-cyan)]'
                    : 'bg-[var(--glass-border)]'
                  }
                `}
              >
                <div
                  className={`
                    absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                    ${autoFilterEnabled ? 'translate-x-7' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>

            {/* Target types */}
            <div className="p-3 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)]">
              <div className="text-sm font-medium text-[var(--glass-text-primary)] mb-2">
                Target Types
              </div>
              <div className="flex flex-wrap gap-2">
                {TARGET_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleTargetTypeToggle(opt.value)}
                    disabled={saving}
                    className={`
                      px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                      ${targetTypes.includes(opt.value)
                        ? 'bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] border border-[var(--neon-cyan)]/50'
                        : 'bg-[var(--glass-solid)] text-[var(--glass-text-muted)] border border-[var(--glass-border)] hover:border-[var(--glass-border-bright)]'
                      }
                    `}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)]">
              <div>
                <div className="text-sm font-medium text-[var(--glass-text-primary)]">
                  Configuration Active
                </div>
                <div className="text-xs text-[var(--glass-text-muted)]">
                  Enable this threshold configuration
                </div>
              </div>
              <button
                onClick={handleActiveToggle}
                disabled={saving}
                className="w-12 h-6 rounded-full transition-colors relative"
                style={{ backgroundColor: isActive ? 'var(--semantic-success)' : 'var(--glass-border)' }}
              >
                <div
                  className={`
                    absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                    ${isActive ? 'translate-x-7' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>
          </div>
        </InspectorSection>
      </div>

      {/* Fixed footer with actions */}
      <div className="flex-shrink-0 border-t border-[var(--glass-border)] px-4 py-3 flex justify-end gap-2">
        <GlassButton variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </GlassButton>
        <GlassButton variant="primary" onClick={onSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </GlassButton>
      </div>
    </div>
  );
}

export default QualityThresholdEditor;
