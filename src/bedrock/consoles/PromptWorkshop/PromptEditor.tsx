// src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx
// Prompt editor with section-based layout matching LensEditor pattern
// Sprint: prompt-editor-standardization-v1

import React from 'react';
import type { ObjectEditorProps } from '../../patterns/console-factory.types';
import type { PromptPayload, PromptStage } from '@core/schema/prompt';
import type { PatchOperation } from '../../types/copilot.types';
import { InspectorSection, InspectorDivider } from '../../primitives/BedrockInspector';
import { GlassButton } from '../../primitives/GlassButton';
import { PROMPT_SOURCE_CONFIG, SEQUENCE_TYPE_CONFIG } from './PromptWorkshop.config';

// =============================================================================
// Constants
// =============================================================================

const STAGE_OPTIONS: { value: PromptStage; label: string }[] = [
  { value: 'genesis', label: 'Genesis' },
  { value: 'exploration', label: 'Exploration' },
  { value: 'synthesis', label: 'Synthesis' },
  { value: 'advocacy', label: 'Advocacy' },
];

// =============================================================================
// Main Editor
// =============================================================================

export function PromptEditor({
  object: prompt,
  onEdit,
  onSave,
  onDelete,
  onDuplicate,
  loading,
  hasChanges,
}: ObjectEditorProps<PromptPayload>) {

  // Read-only mode for library prompts (Sprint: prompt-library-readonly-v1)
  const isLibraryPrompt = prompt.payload.source === 'library';
  const isReadOnly = isLibraryPrompt || loading;

  // Helper to create patch operation for payload fields
  const patchPayload = (field: string, value: unknown) => {
    const op: PatchOperation = { op: 'replace', path: `/payload/${field}`, value };
    onEdit([op]);
  };

  // Helper to create patch operation for meta fields
  const patchMeta = (field: string, value: unknown) => {
    const op: PatchOperation = { op: 'replace', path: `/meta/${field}`, value };
    onEdit([op]);
  };

  // Helper for nested targeting fields
  const patchTargeting = (field: string, value: unknown) => {
    const op: PatchOperation = { op: 'replace', path: `/payload/targeting/${field}`, value };
    onEdit([op]);
  };

  const sourceConfig = PROMPT_SOURCE_CONFIG[prompt.payload.source];

  return (
    <div className="flex flex-col h-full">
      {/* Read-only banner for library prompts (Sprint: prompt-library-readonly-v1) */}
      {isLibraryPrompt && (
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/10 border-b border-blue-500/20">
          <span className="material-symbols-outlined text-blue-400 text-base">lock</span>
          <span className="text-sm text-blue-300">
            Library Prompt — shipped with Grove
          </span>
          <span
            className="material-symbols-outlined text-blue-400/60 text-base cursor-help"
            title="Library prompts are version-controlled configuration. Duplicate to create your own customized version."
          >
            info
          </span>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">

        {/* === IDENTITY === */}
        <InspectorSection title="Identity">
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Title</label>
              <textarea
                value={prompt.meta.title}
                onChange={(e) => patchMeta('title', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 resize-none"
                disabled={isReadOnly}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Description</label>
              <textarea
                value={prompt.meta.description || ''}
                onChange={(e) => patchMeta('description', e.target.value)}
                rows={3}
                placeholder="Brief description of this prompt"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 resize-none"
                disabled={isReadOnly}
              />
            </div>

            {/* Status toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--glass-text-secondary)]">Active</span>
              <button
                onClick={() => patchMeta('status', prompt.meta.status === 'active' ? 'draft' : 'active')}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  prompt.meta.status === 'active' ? 'bg-[var(--neon-green)]' : 'bg-[var(--glass-border)]'
                }`}
                disabled={isReadOnly}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                  prompt.meta.status === 'active' ? 'left-6' : 'left-1'
                }`} />
              </button>
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* === EXECUTION === */}
        <InspectorSection title="Execution Prompt">
          <textarea
            value={prompt.payload.executionPrompt}
            onChange={(e) => patchPayload('executionPrompt', e.target.value)}
            rows={8}
            placeholder="The prompt text that will be shown to users..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 resize-none font-mono"
            disabled={loading}
          />
          <p className="text-xs text-[var(--glass-text-muted)] mt-2">
            {prompt.payload.executionPrompt.length} characters
          </p>
        </InspectorSection>

        <InspectorDivider />

        {/* === SOURCE & WEIGHT === */}
        <InspectorSection title="Source & Weight">
          <div className="space-y-4">
            {/* Source badge */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Source</label>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-[var(--glass-text-muted)]">
                  {sourceConfig?.icon || 'source'}
                </span>
                <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                  prompt.payload.source === 'library' ? 'bg-blue-500/20 text-blue-300' :
                  prompt.payload.source === 'generated' ? 'bg-purple-500/20 text-purple-300' :
                  'bg-green-500/20 text-green-300'
                }`}>
                  {sourceConfig?.label || prompt.payload.source}
                </span>
              </div>
            </div>

            {/* Base Weight */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Base Weight: {prompt.payload.baseWeight}
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={prompt.payload.baseWeight}
                onChange={(e) => patchPayload('baseWeight', parseInt(e.target.value))}
                className="w-full h-2 bg-[var(--glass-border)] rounded-lg appearance-none cursor-pointer accent-[var(--neon-cyan)]"
                disabled={isReadOnly}
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Tags</label>
              <input
                type="text"
                value={(prompt.meta.tags || []).join(', ')}
                onChange={(e) => patchMeta('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                placeholder="tag1, tag2, tag3"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                disabled={isReadOnly}
              />
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* === TARGETING (collapsible) === */}
        <InspectorSection title="Targeting" collapsible defaultCollapsed={false}>
          <div className="space-y-4">
            {/* Stages */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-2">Target Stages</label>
              <div className="flex flex-wrap gap-2">
                {STAGE_OPTIONS.map(opt => {
                  const isSelected = prompt.payload.targeting.stages?.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      onClick={() => {
                        const current = prompt.payload.targeting.stages || [];
                        const updated = isSelected 
                          ? current.filter(s => s !== opt.value)
                          : [...current, opt.value];
                        patchTargeting('stages', updated.length ? updated : undefined);
                      }}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        isSelected 
                          ? 'bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] border border-[var(--neon-cyan)]/50'
                          : 'bg-[var(--glass-surface)] text-[var(--glass-text-muted)] border border-[var(--glass-border)]'
                      }`}
                      disabled={isReadOnly}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Min Interactions */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Min Interactions: {prompt.payload.targeting.minInteractions || 0}
              </label>
              <input
                type="range"
                min={0}
                max={20}
                value={prompt.payload.targeting.minInteractions || 0}
                onChange={(e) => patchTargeting('minInteractions', parseInt(e.target.value) || undefined)}
                className="w-full h-2 bg-[var(--glass-border)] rounded-lg appearance-none cursor-pointer accent-[var(--neon-cyan)]"
                disabled={isReadOnly}
              />
            </div>

            {/* Min Confidence */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Min Confidence: {(prompt.payload.targeting.minConfidence || 0).toFixed(2)}
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={prompt.payload.targeting.minConfidence || 0}
                onChange={(e) => patchTargeting('minConfidence', parseFloat(e.target.value) || undefined)}
                className="w-full h-2 bg-[var(--glass-border)] rounded-lg appearance-none cursor-pointer accent-[var(--neon-cyan)]"
                disabled={isReadOnly}
              />
            </div>

            {/* Lens IDs */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Lens IDs</label>
              <input
                type="text"
                value={(prompt.payload.targeting.lensIds || []).join(', ')}
                onChange={(e) => {
                  const ids = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                  patchTargeting('lensIds', ids.length ? ids : undefined);
                }}
                placeholder="lens-id-1, lens-id-2"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                disabled={isReadOnly}
              />
            </div>

            {/* Require Moment */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--glass-text-secondary)]">Require Active Moment</span>
              <button
                onClick={() => patchTargeting('requireMoment', !prompt.payload.targeting.requireMoment)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  prompt.payload.targeting.requireMoment ? 'bg-[var(--neon-cyan)]' : 'bg-[var(--glass-border)]'
                }`}
                disabled={isReadOnly}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                  prompt.payload.targeting.requireMoment ? 'left-6' : 'left-1'
                }`} />
              </button>
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* === SEQUENCES (collapsible, default collapsed) === */}
        <InspectorSection title="Sequences" collapsible defaultCollapsed={true}>
          {prompt.payload.sequences && prompt.payload.sequences.length > 0 ? (
            <div className="space-y-2">
              {prompt.payload.sequences.map((seq, idx) => {
                const seqConfig = SEQUENCE_TYPE_CONFIG[seq.groupType];
                return (
                  <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-[var(--glass-surface)]">
                    <span 
                      className="material-symbols-outlined text-base"
                      style={{ color: seqConfig?.color || 'var(--glass-text-muted)' }}
                    >
                      {seqConfig?.icon || 'route'}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-[var(--glass-border)] text-[var(--glass-text-muted)]">
                      {seqConfig?.label || seq.groupType}
                    </span>
                    <span className="text-sm text-[var(--glass-text-secondary)] flex-1 truncate">
                      {seq.groupId}
                    </span>
                    <span className="text-xs text-[var(--glass-text-muted)]">
                      #{seq.order}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-[var(--glass-text-muted)] italic">No sequence memberships</p>
          )}
        </InspectorSection>

        <InspectorDivider />

        {/* === PERFORMANCE (collapsible, default collapsed) === */}
        <InspectorSection title="Performance" collapsible defaultCollapsed={true}>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-[var(--glass-surface)]">
              <div className="text-lg font-semibold text-[var(--glass-text-primary)]">
                {prompt.payload.stats?.impressions ?? 0}
              </div>
              <div className="text-xs text-[var(--glass-text-muted)]">Impressions</div>
            </div>
            <div className="p-3 rounded-lg bg-[var(--glass-surface)]">
              <div className="text-lg font-semibold text-[var(--glass-text-primary)]">
                {prompt.payload.stats?.selections ?? 0}
              </div>
              <div className="text-xs text-[var(--glass-text-muted)]">Selections</div>
            </div>
            <div className="p-3 rounded-lg bg-[var(--glass-surface)]">
              <div className="text-lg font-semibold text-[var(--glass-text-primary)]">
                {prompt.payload.stats?.completions ?? 0}
              </div>
              <div className="text-xs text-[var(--glass-text-muted)]">Completions</div>
            </div>
            <div className="p-3 rounded-lg bg-[var(--glass-surface)]">
              <div className="text-lg font-semibold text-[var(--glass-text-primary)]">
                {(prompt.payload.stats?.avgEntropyDelta ?? 0).toFixed(2)}
              </div>
              <div className="text-xs text-[var(--glass-text-muted)]">Avg Entropy Δ</div>
            </div>
          </div>
          {/* Selection Rate */}
          {(prompt.payload.stats?.impressions ?? 0) > 0 && (
            <div className="mt-3 p-3 rounded-lg bg-[var(--glass-surface)]">
              <div className="text-lg font-semibold text-[var(--neon-cyan)]">
                {(((prompt.payload.stats?.selections ?? 0) / (prompt.payload.stats?.impressions ?? 1)) * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-[var(--glass-text-muted)]">Selection Rate</div>
            </div>
          )}
        </InspectorSection>

        <InspectorDivider />

        {/* === METADATA === */}
        <InspectorSection title="Metadata">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--glass-text-muted)]">Created</dt>
              <dd className="text-[var(--glass-text-secondary)]">
                {new Date(prompt.meta.createdAt).toLocaleDateString()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--glass-text-muted)]">Updated</dt>
              <dd className="text-[var(--glass-text-secondary)]">
                {new Date(prompt.meta.updatedAt).toLocaleDateString()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--glass-text-muted)]">ID</dt>
              <dd className="text-[var(--glass-text-muted)] font-mono text-xs">
                {prompt.meta.id}
              </dd>
            </div>
          </dl>
        </InspectorSection>
      </div>

      {/* Fixed footer with actions (Sprint: prompt-library-readonly-v1) */}
      <div className="flex-shrink-0 p-4 border-t border-[var(--glass-border)] bg-[var(--glass-panel)]">
        {isLibraryPrompt ? (
          // Library prompt: only duplicate action
          <GlassButton
            onClick={onDuplicate}
            variant="primary"
            size="sm"
            disabled={loading}
            className="w-full"
          >
            <span className="material-symbols-outlined text-lg mr-2">content_copy</span>
            Duplicate to Customize
          </GlassButton>
        ) : (
          // User prompt: full edit actions
          <div className="flex items-center gap-2">
            <GlassButton
              onClick={onSave}
              variant="primary"
              size="sm"
              disabled={loading || !hasChanges}
              className="flex-1"
            >
              {hasChanges ? 'Save Changes' : 'Saved'}
            </GlassButton>
            <GlassButton
              onClick={onDuplicate}
              variant="ghost"
              size="sm"
              disabled={loading}
              title="Duplicate"
            >
              <span className="material-symbols-outlined text-lg">content_copy</span>
            </GlassButton>
            <GlassButton
              onClick={onDelete}
              variant="ghost"
              size="sm"
              disabled={loading}
              className="text-red-400 hover:text-red-300"
              title="Delete"
            >
              <span className="material-symbols-outlined text-lg">delete</span>
            </GlassButton>
          </div>
        )}
      </div>
    </div>
  );
}

export default PromptEditor;
