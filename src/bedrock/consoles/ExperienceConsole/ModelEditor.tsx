// src/bedrock/consoles/ExperienceConsole/ModelEditor.tsx
// Editor component for Lifecycle Models
// Sprint: EPIC4-SL-MultiModel v1
//
// IMPORTANT: This editor uses BufferedInput/BufferedTextarea for all text fields.
// This prevents the inspector input race condition where rapid typing loses characters.

import React, { useCallback, useState } from 'react';
import type { ObjectEditorProps } from '../../patterns/console-factory.types';
import type { LifecycleModelPayload, LifecycleTier, ValidationRule } from '@core/schema/lifecycle-model';
import type { PatchOperation } from '../../types/copilot.types';
import { InspectorSection, InspectorDivider } from '../../primitives/BedrockInspector';
import { GlassButton } from '../../primitives/GlassButton';
import { BufferedInput, BufferedTextarea } from '../../primitives/BufferedInput';

// Model type options for dropdown
const MODEL_TYPE_OPTIONS: { value: LifecycleModelPayload['modelType']; label: string; description: string; icon: string }[] = [
  { value: 'botanical', label: 'Botanical', description: 'Natural growth patterns', icon: 'nature' },
  { value: 'academic', label: 'Academic', description: 'Educational progression', icon: 'school' },
  { value: 'research', label: 'Research', description: 'Scientific method', icon: 'science' },
  { value: 'creative', label: 'Creative', description: 'Artistic process', icon: 'palette' },
];

/**
 * Editor component for LifecycleModel objects
 */
export function ModelEditor({
  object: model,
  onEdit,
  onSave,
  onDelete,
  onDuplicate,
  loading,
  hasChanges,
}: ObjectEditorProps<LifecycleModelPayload>) {
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    tiers: true,
    validation: false,
    metadata: false,
  });

  const toggleSection = useCallback((section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

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

  const modelType = model.payload.modelType;
  const tierCount = model.payload.tiers.length;
  const version = model.payload.version;

  return (
    <div className="flex flex-col h-full">
      {/* Header: Icon + Title + Version */}
      <div className="px-4 py-3 border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-2xl text-[var(--neon-cyan)]">
            model_training
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-[var(--glass-text-primary)] truncate">
              {model.meta.title || 'Untitled Model'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <code className="font-mono text-sm text-[var(--glass-text-muted)]">
                v{version}
              </code>
              <span className="text-[var(--glass-text-muted)]">•</span>
              <span className="text-sm text-[var(--glass-text-muted)]">
                {tierCount} {tierCount === 1 ? 'tier' : 'tiers'}
              </span>
            </div>
          </div>
          {/* Model type indicator */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)]">
            <span className="material-symbols-outlined text-sm">
              {MODEL_TYPE_OPTIONS.find(opt => opt.value === modelType)?.icon || 'model_training'}
            </span>
            {MODEL_TYPE_OPTIONS.find(opt => opt.value === modelType)?.label || modelType}
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {/* Basic Information */}
        <InspectorSection
          title="Basic Information"
          isExpanded={expandedSections.basic}
          onToggle={() => toggleSection('basic')}
        >
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-1">
                Model Name
              </label>
              <BufferedInput
                value={model.meta.title || ''}
                onChange={(value) => patchMeta('title', value)}
                placeholder="Enter model name..."
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-1">
                Display Name
              </label>
              <BufferedInput
                value={model.payload.name || ''}
                onChange={(value) => patchPayload('name', value)}
                placeholder="Enter display name..."
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-1">
                Description
              </label>
              <BufferedTextarea
                value={model.meta.description || ''}
                onChange={(value) => patchMeta('description', value)}
                placeholder="Enter model description..."
                className="w-full"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-1">
                  Model Type
                </label>
                <select
                  value={modelType}
                  onChange={(e) => patchPayload('modelType', e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--glass-solid)] border border-[var(--glass-border)] rounded-lg text-[var(--glass-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--neon-cyan)]/50 focus:border-[var(--neon-cyan)]"
                >
                  {MODEL_TYPE_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-1">
                  Version
                </label>
                <BufferedInput
                  value={version}
                  onChange={(value) => patchPayload('version', value)}
                  placeholder="1.0.0"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* Tiers Configuration */}
        <InspectorSection
          title="Tiers Configuration"
          subtitle={`${tierCount} tiers defined (min: 3, max: 7)`}
          isExpanded={expandedSections.tiers}
          onToggle={() => toggleSection('tiers')}
        >
          <div className="space-y-3">
            <p className="text-sm text-[var(--glass-text-muted)]">
              Define the progression structure for your lifecycle model. Each tier represents a stage in the lifecycle.
            </p>

            {/* Tier list */}
            <div className="space-y-2">
              {model.payload.tiers.map((tier, index) => (
                <div
                  key={tier.id}
                  className="flex items-center gap-3 p-3 bg-[var(--glass-elevated)] border border-[var(--glass-border)] rounded-lg"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[var(--neon-cyan)]/20 flex items-center justify-center">
                    <span className="text-sm font-medium text-[var(--neon-cyan)]">
                      {tier.emoji || tier.label.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--glass-text-primary)]">
                      {tier.label}
                    </p>
                    <p className="text-xs text-[var(--glass-text-muted)] truncate">
                      {tier.description}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-xs text-[var(--glass-text-muted)]">
                      Order: {tier.order}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <GlassButton
              size="sm"
              variant="secondary"
              onClick={() => {
                // TODO: Implement tier editing modal
                console.log('Open tier editor');
              }}
              className="w-full"
            >
              <span className="material-symbols-outlined text-sm mr-1">edit</span>
              Edit Tiers
            </GlassButton>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* Validation Rules */}
        <InspectorSection
          title="Validation Rules"
          subtitle={`${model.payload.validationRules.length} rules defined`}
          isExpanded={expandedSections.validation}
          onToggle={() => toggleSection('validation')}
        >
          <div className="space-y-3">
            <p className="text-sm text-[var(--glass-text-muted)]">
              Define rules for tier advancement. These rules determine when sprouts can move to the next tier.
            </p>

            {model.payload.validationRules.length > 0 ? (
              <div className="space-y-2">
                {model.payload.validationRules.map((rule, index) => (
                  <div
                    key={index}
                    className="p-3 bg-[var(--glass-elevated)] border border-[var(--glass-border)] rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[var(--glass-text-primary)] capitalize">
                        {rule.type.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-[var(--glass-text-muted)]">
                        {rule.config.operator} {rule.config.threshold}
                        {rule.config.signalType && ` ${rule.config.signalType}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--glass-text-muted)] italic">
                No validation rules defined
              </p>
            )}

            <GlassButton
              size="sm"
              variant="secondary"
              onClick={() => {
                // TODO: Implement validation rule editor
                console.log('Open validation rule editor');
              }}
              className="w-full"
            >
              <span className="material-symbols-outlined text-sm mr-1">add</span>
              Add Validation Rule
            </GlassButton>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* Metadata */}
        <InspectorSection
          title="Metadata"
          subtitle="Additional model information"
          isExpanded={expandedSections.metadata}
          onToggle={() => toggleSection('metadata')}
        >
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-1">
                Tags
              </label>
              <BufferedInput
                value={model.meta.tags?.join(', ') || ''}
                onChange={(value) => patchMeta('tags', value.split(',').map(t => t.trim()).filter(Boolean))}
                placeholder="tag1, tag2, tag3..."
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-[var(--glass-text-muted)]">Created:</span>
                <p className="text-[var(--glass-text-secondary)]">
                  {new Date(model.meta.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-[var(--glass-text-muted)]">Updated:</span>
                <p className="text-[var(--glass-text-secondary)]">
                  {new Date(model.meta.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </InspectorSection>
      </div>
    </div>
  );
}

export default ModelEditor;
