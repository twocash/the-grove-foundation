// src/bedrock/consoles/PromptWorkshop/PromptEditor.tsx
// Prompt editor with section-based layout matching LensEditor pattern
// Sprint: prompt-editor-standardization-v1
//
// IMPORTANT: This editor uses BufferedInput/BufferedTextarea for all text fields.
// This prevents the inspector input race condition where rapid typing loses characters.
// @see src/bedrock/patterns/console-factory.tsx (architecture note at top)
// @see src/bedrock/primitives/BufferedInput.tsx

import React, { useCallback, useState } from 'react';
import type { ObjectEditorProps } from '../../patterns/console-factory.types';
import type { PromptPayload, PromptStage, QAIssue } from '@core/schema/prompt';
import type { PatchOperation } from '../../types/copilot.types';
import { InspectorSection, InspectorDivider } from '../../primitives/BedrockInspector';
import { GlassButton } from '../../primitives/GlassButton';
import { BufferedInput, BufferedTextarea } from '../../primitives/BufferedInput';
import { PROMPT_SOURCE_CONFIG, SEQUENCE_TYPE_CONFIG } from './PromptWorkshop.config';
import { SourceContextSection } from './components/SourceContextSection';
import { QAResultsSection } from './components/QAResultsSection';
import { generateCopilotStarterPrompt } from '@core/copilot/PromptQAActions';
import { setLibraryPromptOverride } from './utils/libraryPromptOverrides';

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
  onSetCopilotInput,
}: ObjectEditorProps<PromptPayload>) {

  // Read-only mode for library prompts (Sprint: prompt-library-readonly-v1)
  // Note: Status toggle is enabled for library prompts (Sprint: prompt-library-deactivation-v1)
  const isLibraryPrompt = prompt.payload.source === 'library';
  const isReadOnly = isLibraryPrompt || loading;
  // Library prompts can only toggle status (not edit other fields)
  const isStatusReadOnly = loading;

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

  // QA Check handler (Sprint: prompt-refinement-v1)
  const [isQAChecking, setIsQAChecking] = React.useState(false);
  const [isDuplicating, setIsDuplicating] = React.useState(false);

  // Duplicate library prompt to user's prompts (Sprint: prompt-refinement-v1)
  const handleDuplicateLibraryPrompt = useCallback(async () => {
    setIsDuplicating(true);
    try {
      // Call the provided onDuplicate which creates a user-owned copy
      // This uses usePromptData.duplicate which handles library prompts
      onDuplicate();
      // Note: The new prompt will appear in the list after data refresh
    } catch (error) {
      console.error('Duplicate failed:', error);
    } finally {
      // Small delay to show loading state before it disappears
      setTimeout(() => setIsDuplicating(false), 500);
    }
  }, [onDuplicate]);

  const handleRunQACheck = useCallback(async () => {
    setIsQAChecking(true);
    console.log('[PromptEditor] Running QA check for prompt:', prompt.meta.id);
    try {
      const response = await fetch(`/api/prompts/${prompt.meta.id}/qa-check`, {
        method: 'POST',
      });
      console.log('[PromptEditor] QA check response status:', response.status);
      if (response.ok) {
        const result = await response.json();
        console.log('[PromptEditor] QA check result:', {
          score: result.score,
          issuesCount: result.issues?.length,
          issues: result.issues?.map((i: { type: string; autoFixAvailable: boolean }) => ({ type: i.type, autoFixAvailable: i.autoFixAvailable })),
        });
        // Update the prompt with QA results
        // IMPORTANT: Include /meta/updatedAt to trigger version change detection in console factory
        const now = new Date().toISOString();
        const ops: PatchOperation[] = [
          { op: 'replace', path: '/payload/qaScore', value: result.score },
          { op: 'replace', path: '/payload/qaIssues', value: result.issues },
          { op: 'replace', path: '/payload/qaLastChecked', value: now },
          { op: 'replace', path: '/meta/updatedAt', value: now },
        ];
        console.log('[PromptEditor] Applying QA patches:', ops);
        await onEdit(ops);
        console.log('[PromptEditor] onEdit completed');
      } else {
        console.error('[PromptEditor] QA check failed with status:', response.status);
      }
    } catch (error) {
      console.error('[PromptEditor] QA check error:', error);
    } finally {
      setIsQAChecking(false);
    }
  }, [prompt.meta.id, onEdit]);

  const [fixMessage, setFixMessage] = useState<string | null>(null);

  // Handle "Refine" button click - populates Copilot input with starter prompt
  // Philosophy: Forces thought and reason - user reviews and completes the prompt
  // @see HOTFIX_COPILOT_FIX_FLOW.md
  const handleApplyFix = useCallback((issue: QAIssue) => {
    console.log('[PromptEditor] Refine requested for issue:', issue);

    const currentPrompt = prompt.payload.executionPrompt || prompt.meta.title || '';
    const starterPrompt = generateCopilotStarterPrompt(issue, currentPrompt);

    if (onSetCopilotInput) {
      // Populate Copilot input with starter prompt
      console.log('[PromptEditor] Setting Copilot input:', starterPrompt);
      onSetCopilotInput(starterPrompt);
      setFixMessage('💡 Complete the prompt in Copilot below to refine');
      setTimeout(() => setFixMessage(null), 4000);
    } else {
      // Fallback: show the suggestion if Copilot is not available
      console.log('[PromptEditor] Copilot not available, showing suggestion');
      setFixMessage(`💡 Suggestion: ${issue.suggestedFix || starterPrompt}`);
      setTimeout(() => setFixMessage(null), 5000);
    }
  }, [prompt.payload.executionPrompt, prompt.meta.title, onSetCopilotInput]);

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

        {/* === SOURCE CONTEXT (Sprint: prompt-refinement-v1) === */}
        <SourceContextSection
          promptId={prompt.meta.id}
          documentId={prompt.payload.provenance?.sourceDocIds?.[0]}
        />

        <InspectorDivider />

        {/* === IDENTITY === */}
        <InspectorSection title="Identity">
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Title</label>
              <BufferedTextarea
                value={prompt.meta.title}
                onChange={(v) => patchMeta('title', v)}
                rows={2}
                debounceMs={400}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 resize-none"
                disabled={isReadOnly}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Description</label>
              <BufferedTextarea
                value={prompt.meta.description || ''}
                onChange={(v) => patchMeta('description', v)}
                rows={3}
                debounceMs={400}
                placeholder="Brief description of this prompt"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 resize-none"
                disabled={isReadOnly}
              />
            </div>

            {/* Status toggle (Sprint: prompt-library-deactivation-v1 - enabled for library prompts) */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--glass-text-secondary)]">Active</span>
                {isLibraryPrompt && (
                  <span
                    className="material-symbols-outlined text-xs text-blue-400 cursor-help"
                    title="Library prompt status is stored locally. Toggle to exclude from suggestions."
                  >
                    info
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  const newStatus = prompt.meta.status === 'active' ? 'draft' : 'active';
                  if (isLibraryPrompt) {
                    // Library prompts: use localStorage override
                    setLibraryPromptOverride(prompt.meta.id, newStatus);
                  } else {
                    // Regular prompts: use normal patch
                    patchMeta('status', newStatus);
                  }
                }}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  prompt.meta.status === 'active' ? 'bg-[var(--neon-green)]' : 'bg-[var(--glass-border)]'
                }`}
                disabled={isStatusReadOnly}
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
          <BufferedTextarea
            value={prompt.payload.executionPrompt}
            onChange={(v) => patchPayload('executionPrompt', v)}
            rows={8}
            debounceMs={400}
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
              <BufferedInput
                value={(prompt.meta.tags || []).join(', ')}
                onChange={(v) => patchMeta('tags', v.split(',').map(t => t.trim()).filter(Boolean))}
                debounceMs={400}
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
              <BufferedInput
                value={(prompt.payload.targeting.lensIds || []).join(', ')}
                onChange={(v) => {
                  const ids = v.split(',').map(t => t.trim()).filter(Boolean);
                  patchTargeting('lensIds', ids.length ? ids : undefined);
                }}
                debounceMs={400}
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

        {/* === QA ASSESSMENT (Sprint: prompt-refinement-v1) === */}
        {/* QA checks only available for user-owned prompts (not library prompts) */}
        <QAResultsSection
          score={prompt.payload.qaScore}
          issues={prompt.payload.qaIssues}
          lastChecked={prompt.payload.qaLastChecked}
          onApplyFix={isLibraryPrompt ? undefined : handleApplyFix}
          onRunQACheck={isLibraryPrompt ? undefined : handleRunQACheck}
          isChecking={isQAChecking}
          onDuplicate={isLibraryPrompt ? handleDuplicateLibraryPrompt : undefined}
          isDuplicating={isDuplicating}
        />

        {/* Fix message toast */}
        {fixMessage && (
          <div className="mx-4 my-2 p-3 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-sm text-cyan-300 animate-pulse">
            {fixMessage}
          </div>
        )}

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
