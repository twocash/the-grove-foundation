// src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx
// Prompt editor component for inspector panel
// Sprint: prompt-unification-v1
// Fixed: Uses local state for editing, persists on blur/save

import React, { useState, useEffect, useCallback } from 'react';
import type { ObjectEditorProps } from '../../patterns/console-factory.types';
import type { PromptPayload, PromptStage } from '@core/schema/prompt';
import { PROMPT_VARIANT_CONFIG, PROMPT_SOURCE_CONFIG, SEQUENCE_TYPE_CONFIG } from './PromptWorkshop.config';

const STAGES: PromptStage[] = ['genesis', 'exploration', 'synthesis', 'advocacy'];

/**
 * Editor component for prompt details in inspector panel
 * 
 * Uses local state for form fields to prevent keystroke-level database updates.
 * Changes are persisted on blur or explicit save.
 */
export function PromptEditor({
  object: prompt,
  onEdit,
  onSave,
  onDelete,
  onDuplicate,
  loading,
  hasChanges,
}: ObjectEditorProps<PromptPayload>) {
  const [activeTab, setActiveTab] = useState<'content' | 'targeting' | 'sequences' | 'stats'>('content');
  
  // Local form state - synced from prompt on mount/selection change
  const [localTitle, setLocalTitle] = useState(prompt.meta.title);
  const [localDescription, setLocalDescription] = useState(prompt.meta.description || '');
  const [localExecutionPrompt, setLocalExecutionPrompt] = useState(prompt.payload.executionPrompt);
  const [localVariant, setLocalVariant] = useState(prompt.payload.variant || 'default');
  const [localWeight, setLocalWeight] = useState(prompt.payload.baseWeight ?? 50);
  const [localTags, setLocalTags] = useState(prompt.meta.tags?.join(', ') || '');
  const [localTargeting, setLocalTargeting] = useState(prompt.payload.targeting);
  
  // Track if local state has diverged from prompt
  const [isDirty, setIsDirty] = useState(false);

  // Sync local state when prompt changes (new selection)
  useEffect(() => {
    setLocalTitle(prompt.meta.title);
    setLocalDescription(prompt.meta.description || '');
    setLocalExecutionPrompt(prompt.payload.executionPrompt);
    setLocalVariant(prompt.payload.variant || 'default');
    setLocalWeight(prompt.payload.baseWeight ?? 50);
    setLocalTags(prompt.meta.tags?.join(', ') || '');
    setLocalTargeting(prompt.payload.targeting);
    setIsDirty(false);
  }, [prompt.meta.id]); // Reset when selecting different prompt

  // Persist a single field change to database
  const persistField = useCallback((field: string, value: unknown) => {
    const isMeta = ['title', 'description', 'status', 'icon', 'tags'].includes(field);
    const path = isMeta ? `meta.${field}` : `payload.${field}`;
    onEdit([{ op: 'replace', path: `/${path.replace(/\./g, '/')}`, value }]);
  }, [onEdit]);

  // Handle blur - persist the field
  const handleBlur = useCallback((field: string, value: unknown) => {
    // Parse special fields
    let parsedValue = value;
    if (field === 'tags' && typeof value === 'string') {
      parsedValue = value.split(',').map(t => t.trim()).filter(Boolean);
    }
    if (field === 'baseWeight' && typeof value === 'string') {
      parsedValue = parseInt(value, 10);
    }
    persistField(field, parsedValue);
    setIsDirty(true);
  }, [persistField]);

  // Handle targeting changes (persist immediately since they're toggles/selects)
  const handleTargetingChange = useCallback((key: string, value: unknown) => {
    const newTargeting = { ...localTargeting, [key]: value };
    setLocalTargeting(newTargeting);
    onEdit([{ op: 'replace', path: '/payload/targeting', value: newTargeting }]);
    setIsDirty(true);
  }, [localTargeting, onEdit]);

  // Save all changes
  const handleSaveAll = useCallback(() => {
    onSave();
    setIsDirty(false);
  }, [onSave]);

  const tabs = [
    { id: 'content', label: 'Content', icon: 'edit' },
    { id: 'targeting', label: 'Targeting', icon: 'filter_alt' },
    { id: 'sequences', label: 'Sequences', icon: 'route' },
    { id: 'stats', label: 'Stats', icon: 'analytics' },
  ] as const;

  return (
    <div className="flex flex-col h-full">
      {/* Header with Save/Delete/Duplicate buttons */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-2">
          {(isDirty || hasChanges) && (
            <span className="text-xs text-[var(--neon-orange)]">Unsaved changes</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onDuplicate}
            disabled={loading}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-[var(--glass-surface)] border border-[var(--glass-border)] text-[var(--glass-text-muted)] hover:text-[var(--glass-text-primary)] hover:border-[var(--glass-border-hover)] transition-colors disabled:opacity-50"
            title="Duplicate"
          >
            <span className="material-symbols-outlined text-sm">content_copy</span>
          </button>
          <button
            onClick={onDelete}
            disabled={loading}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded bg-[var(--glass-surface)] border border-[var(--glass-border)] text-[var(--neon-red)] hover:bg-[var(--neon-red)]/10 transition-colors disabled:opacity-50"
            title="Delete"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
          </button>
          <button
            onClick={handleSaveAll}
            disabled={loading || (!isDirty && !hasChanges)}
            className="flex items-center gap-1 px-3 py-1 text-xs rounded bg-[var(--neon-cyan)]/20 border border-[var(--neon-cyan)] text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-sm">save</span>
            Save
          </button>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex border-b border-[var(--glass-border)] mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors
              ${activeTab === tab.id
                ? 'text-[var(--neon-cyan)] border-b-2 border-[var(--neon-cyan)]'
                : 'text-[var(--glass-text-muted)] hover:text-[var(--glass-text-primary)]'
              }
            `}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'content' && (
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-[var(--glass-text-muted)] mb-1">
                Title
              </label>
              <input
                type="text"
                value={localTitle}
                onChange={(e) => setLocalTitle(e.target.value)}
                onBlur={() => handleBlur('title', localTitle)}
                disabled={loading}
                className="w-full px-3 py-2 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] focus:border-[var(--neon-cyan)] focus:outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-[var(--glass-text-muted)] mb-1">
                Description
              </label>
              <input
                type="text"
                value={localDescription}
                onChange={(e) => setLocalDescription(e.target.value)}
                onBlur={() => handleBlur('description', localDescription)}
                disabled={loading}
                className="w-full px-3 py-2 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] focus:border-[var(--neon-cyan)] focus:outline-none"
              />
            </div>

            {/* Execution Prompt */}
            <div>
              <label className="block text-xs font-medium text-[var(--glass-text-muted)] mb-1">
                Execution Prompt
              </label>
              <textarea
                value={localExecutionPrompt}
                onChange={(e) => setLocalExecutionPrompt(e.target.value)}
                onBlur={() => handleBlur('executionPrompt', localExecutionPrompt)}
                disabled={loading}
                rows={6}
                className="w-full px-3 py-2 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] focus:border-[var(--neon-cyan)] focus:outline-none resize-none font-mono text-sm"
              />
            </div>

            {/* Variant */}
            <div>
              <label className="block text-xs font-medium text-[var(--glass-text-muted)] mb-1">
                Variant
              </label>
              <select
                value={localVariant}
                onChange={(e) => {
                  setLocalVariant(e.target.value);
                  handleBlur('variant', e.target.value);
                }}
                disabled={loading}
                className="w-full px-3 py-2 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] focus:border-[var(--neon-cyan)] focus:outline-none"
              >
                {Object.entries(PROMPT_VARIANT_CONFIG).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Source (read-only) */}
            <div>
              <label className="block text-xs font-medium text-[var(--glass-text-muted)] mb-1">
                Source
              </label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)]">
                <span className="material-symbols-outlined text-base text-[var(--glass-text-muted)]">
                  {PROMPT_SOURCE_CONFIG[prompt.payload.source]?.icon || 'source'}
                </span>
                <span className="text-sm text-[var(--glass-text-primary)]">
                  {PROMPT_SOURCE_CONFIG[prompt.payload.source]?.label || prompt.payload.source}
                </span>
              </div>
            </div>

            {/* Base Weight */}
            <div>
              <label className="block text-xs font-medium text-[var(--glass-text-muted)] mb-1">
                Base Weight: {localWeight}
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={localWeight}
                onChange={(e) => setLocalWeight(parseInt(e.target.value, 10))}
                onMouseUp={() => handleBlur('baseWeight', localWeight)}
                onTouchEnd={() => handleBlur('baseWeight', localWeight)}
                disabled={loading}
                className="w-full accent-[var(--neon-cyan)]"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-medium text-[var(--glass-text-muted)] mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={localTags}
                onChange={(e) => setLocalTags(e.target.value)}
                onBlur={() => handleBlur('tags', localTags)}
                disabled={loading}
                className="w-full px-3 py-2 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] focus:border-[var(--neon-cyan)] focus:outline-none"
              />
            </div>
          </div>
        )}

        {activeTab === 'targeting' && (
          <div className="space-y-4">
            {/* Stage Targeting */}
            <div>
              <label className="block text-xs font-medium text-[var(--glass-text-muted)] mb-2">
                Journey Stages
              </label>
              <div className="flex flex-wrap gap-2">
                {STAGES.map((stage) => {
                  const isSelected = localTargeting.stages?.includes(stage);
                  return (
                    <button
                      key={stage}
                      onClick={() => {
                        const current = localTargeting.stages || [];
                        const newStages = isSelected
                          ? current.filter((s) => s !== stage)
                          : [...current, stage];
                        handleTargetingChange('stages', newStages.length ? newStages : undefined);
                      }}
                      disabled={loading}
                      className={`
                        px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                        ${isSelected
                          ? 'bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] border border-[var(--neon-cyan)]'
                          : 'bg-[var(--glass-surface)] text-[var(--glass-text-muted)] border border-[var(--glass-border)] hover:border-[var(--glass-border-hover)]'
                        }
                      `}
                    >
                      {stage}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Min Interactions */}
            <div>
              <label className="block text-xs font-medium text-[var(--glass-text-muted)] mb-1">
                Min Interactions: {localTargeting.minInteractions ?? 0}
              </label>
              <input
                type="range"
                min="0"
                max="20"
                value={localTargeting.minInteractions ?? 0}
                onChange={(e) =>
                  handleTargetingChange('minInteractions', parseInt(e.target.value, 10) || undefined)
                }
                disabled={loading}
                className="w-full accent-[var(--neon-cyan)]"
              />
            </div>

            {/* Lens IDs */}
            <div>
              <label className="block text-xs font-medium text-[var(--glass-text-muted)] mb-1">
                Lens IDs (comma-separated)
              </label>
              <input
                type="text"
                value={localTargeting.lensIds?.join(', ') || ''}
                onChange={(e) => {
                  const ids = e.target.value.split(',').map((t) => t.trim()).filter(Boolean);
                  handleTargetingChange('lensIds', ids.length ? ids : undefined);
                }}
                disabled={loading}
                className="w-full px-3 py-2 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)] text-[var(--glass-text-primary)] focus:border-[var(--neon-cyan)] focus:outline-none"
              />
            </div>

            {/* Require Moment */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localTargeting.requireMoment ?? false}
                  onChange={(e) => handleTargetingChange('requireMoment', e.target.checked)}
                  disabled={loading}
                  className="w-4 h-4 accent-[var(--neon-cyan)]"
                />
                <span className="text-sm text-[var(--glass-text-primary)]">
                  Require active moment
                </span>
              </label>
            </div>

            {/* Min Confidence */}
            <div>
              <label className="block text-xs font-medium text-[var(--glass-text-muted)] mb-1">
                Min Confidence: {(localTargeting.minConfidence ?? 0).toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={localTargeting.minConfidence ?? 0}
                onChange={(e) =>
                  handleTargetingChange('minConfidence', parseFloat(e.target.value) || undefined)
                }
                disabled={loading}
                className="w-full accent-[var(--neon-cyan)]"
              />
            </div>
          </div>
        )}

        {activeTab === 'sequences' && (
          <div className="space-y-4">
            {prompt.payload.sequences && prompt.payload.sequences.length > 0 ? (
              <div className="space-y-3">
                {prompt.payload.sequences.map((seq, idx) => {
                  const seqConfig = SEQUENCE_TYPE_CONFIG[seq.type];
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)]"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="material-symbols-outlined text-base"
                          style={{ color: seqConfig?.color || 'var(--glass-text-muted)' }}
                        >
                          {seqConfig?.icon || 'route'}
                        </span>
                        <span className="text-sm font-medium text-[var(--glass-text-primary)]">
                          {seq.groupId}
                        </span>
                        <span className="px-2 py-0.5 rounded text-xs bg-[var(--glass-surface-elevated)] text-[var(--glass-text-muted)]">
                          Order: {seq.order}
                        </span>
                      </div>
                      <div className="text-xs text-[var(--glass-text-muted)]">
                        Type: {seqConfig?.label || seq.type}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--glass-text-muted)]">
                <span className="material-symbols-outlined text-3xl mb-2 block">route</span>
                <p className="text-sm">No sequence memberships</p>
                <p className="text-xs mt-1">
                  Use the copilot to add this prompt to a sequence
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)]">
                <div className="text-xs text-[var(--glass-text-muted)] mb-1">Impressions</div>
                <div className="text-xl font-semibold text-[var(--glass-text-primary)]">
                  {prompt.payload.stats?.impressions ?? 0}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)]">
                <div className="text-xs text-[var(--glass-text-muted)] mb-1">Selections</div>
                <div className="text-xl font-semibold text-[var(--glass-text-primary)]">
                  {prompt.payload.stats?.selections ?? 0}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)]">
                <div className="text-xs text-[var(--glass-text-muted)] mb-1">Completions</div>
                <div className="text-xl font-semibold text-[var(--glass-text-primary)]">
                  {prompt.payload.stats?.completions ?? 0}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)]">
                <div className="text-xs text-[var(--glass-text-muted)] mb-1">Avg Entropy Δ</div>
                <div className="text-xl font-semibold text-[var(--glass-text-primary)]">
                  {(prompt.payload.stats?.avgEntropyDelta ?? 0).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)]">
              <div className="text-xs text-[var(--glass-text-muted)] mb-1">Avg Dwell Time</div>
              <div className="text-xl font-semibold text-[var(--glass-text-primary)]">
                {prompt.payload.stats?.avgDwellMs
                  ? `${(prompt.payload.stats.avgDwellMs / 1000).toFixed(1)}s`
                  : '0s'}
              </div>
            </div>

            {/* Selection Rate */}
            {prompt.payload.stats?.impressions ? (
              <div className="p-3 rounded-lg bg-[var(--glass-surface)] border border-[var(--glass-border)]">
                <div className="text-xs text-[var(--glass-text-muted)] mb-1">Selection Rate</div>
                <div className="text-xl font-semibold text-[var(--neon-cyan)]">
                  {((prompt.payload.stats.selections / prompt.payload.stats.impressions) * 100).toFixed(1)}%
                </div>
              </div>
            ) : null}

            {/* Metadata */}
            <div className="pt-4 border-t border-[var(--glass-border)]">
              <div className="text-xs text-[var(--glass-text-muted)] space-y-1">
                <p>Created: {new Date(prompt.meta.createdAt).toLocaleString()}</p>
                <p>Updated: {new Date(prompt.meta.updatedAt).toLocaleString()}</p>
                <p className="font-mono text-[10px] opacity-60">ID: {prompt.meta.id}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PromptEditor;
