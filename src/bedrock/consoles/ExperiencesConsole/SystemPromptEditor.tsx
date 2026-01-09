// src/bedrock/consoles/ExperiencesConsole/SystemPromptEditor.tsx
// Editor component for system prompts
// Sprint: experiences-console-v1
// Hotfix: experiences-console-v1.1 - added Activate button
// Hotfix: experiences-console-v1.2 - enhanced Active Status indicator with save/discard
//
// IMPORTANT: This editor uses BufferedInput/BufferedTextarea for all text fields.
// This prevents the inspector input race condition where rapid typing loses characters.
// @see src/bedrock/patterns/console-factory.tsx (architecture note at top)
// @see src/bedrock/primitives/BufferedInput.tsx

import React, { useCallback, useState, useRef, useEffect } from 'react';
import type { ObjectEditorProps } from '../../patterns/console-factory.types';
import type { SystemPromptPayload, ResponseMode, ClosingBehavior } from '@core/schema/system-prompt';
import { RESPONSE_MODES, CLOSING_BEHAVIORS, PROMPT_SECTIONS } from '@core/schema/system-prompt';
import type { PatchOperation } from '../../types/copilot.types';
import { InspectorSection, InspectorDivider } from '../../primitives/BedrockInspector';
import { GlassButton } from '../../primitives/GlassButton';
import { BufferedInput, BufferedTextarea } from '../../primitives/BufferedInput';
import { RESPONSE_MODE_CONFIG, CLOSING_BEHAVIOR_CONFIG } from './ExperiencesConsole.config';
import { useExperienceData } from './useExperienceData';

// =============================================================================
// Cache Invalidation Helper
// =============================================================================

async function invalidateSystemPromptCache(): Promise<boolean> {
  try {
    await fetch('/api/cache/invalidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'system-prompt' }),
    });
    console.log('[SystemPromptEditor] Cache invalidated');
    return true;
  } catch (error) {
    console.warn('[SystemPromptEditor] Failed to invalidate cache:', error);
    return false;
  }
}

/**
 * Editor component for SystemPrompt objects
 */
export function SystemPromptEditor({
  object: prompt,
  onEdit,
  onSave,
  onDelete,
  onDuplicate,
  loading,
  hasChanges,
}: ObjectEditorProps<SystemPromptPayload>) {
  const isActive = prompt.meta.status === 'active';
  const isArchived = prompt.meta.status === 'archived';
  const isDraft = prompt.meta.status === 'draft';

  // Get activate function and update from data hook
  const { activate, activePrompt, update } = useExperienceData();
  const [activating, setActivating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [discarding, setDiscarding] = useState(false);

  // Snapshot of original state for discard functionality
  const originalSnapshotRef = useRef<{ meta: typeof prompt.meta; payload: typeof prompt.payload } | null>(null);

  // Capture snapshot when prompt changes (new selection) and no pending changes
  useEffect(() => {
    if (!hasChanges) {
      originalSnapshotRef.current = {
        meta: { ...prompt.meta },
        payload: { ...prompt.payload },
      };
    }
  }, [prompt.meta.id, hasChanges]);

  // Handle activation
  const handleActivate = useCallback(async () => {
    setActivating(true);
    try {
      await activate(prompt.meta.id);
    } catch (error) {
      console.error('[SystemPromptEditor] Activation failed:', error);
    } finally {
      setActivating(false);
    }
  }, [activate, prompt.meta.id]);

  // Handle save with cache invalidation for active prompts
  const handleSaveWithCache = useCallback(async () => {
    setSaving(true);
    try {
      // Call the parent save handler
      onSave();
      // If this is the active prompt, invalidate cache so /explore gets the update
      if (isActive) {
        await invalidateSystemPromptCache();
      }
    } catch (error) {
      console.error('[SystemPromptEditor] Save failed:', error);
    } finally {
      setSaving(false);
    }
  }, [onSave, isActive]);

  // Handle discard - restore original snapshot
  const handleDiscard = useCallback(async () => {
    if (!originalSnapshotRef.current) {
      console.warn('[SystemPromptEditor] No snapshot to restore');
      return;
    }

    setDiscarding(true);
    try {
      const snapshot = originalSnapshotRef.current;

      // Build patch operations to restore original state
      const operations: PatchOperation[] = [];

      // Restore meta fields
      for (const [key, value] of Object.entries(snapshot.meta)) {
        if (key !== 'id' && key !== 'type') { // Don't patch immutable fields
          operations.push({ op: 'replace', path: `/meta/${key}`, value });
        }
      }

      // Restore payload fields
      for (const [key, value] of Object.entries(snapshot.payload)) {
        operations.push({ op: 'replace', path: `/payload/${key}`, value });
      }

      // Apply restore operations
      await update(prompt.meta.id, operations);

      // Call onSave to clear hasChanges flag
      onSave();
    } catch (error) {
      console.error('[SystemPromptEditor] Discard failed:', error);
    } finally {
      setDiscarding(false);
    }
  }, [update, prompt.meta.id, onSave]);

  // Helper to create patch operation for payload fields
  const patchPayload = useCallback((field: string, value: unknown) => {
    const op: PatchOperation = { op: 'replace', path: `/payload/${field}`, value };
    onEdit([op]);
  }, [onEdit]);

  // Helper to create patch operation for meta fields
  const patchMeta = useCallback((field: string, value: unknown) => {
    const op: PatchOperation = { op: 'replace', path: `/meta/${field}`, value };
    onEdit([op]);
  }, [onEdit]);

  const modeConfig = RESPONSE_MODE_CONFIG[prompt.payload.responseMode];

  return (
    <div className="flex flex-col h-full">
      {/* Active Status Indicator (visual only - actions in footer) */}
      {isActive && (
        <div className={`
          flex items-center gap-3 px-4 py-3 border-b transition-colors
          ${hasChanges
            ? 'bg-amber-500/10 border-amber-500/30'
            : 'bg-green-500/10 border-green-500/20'
          }
        `}>
          {/* Status dot with pulse animation when saved */}
          <span className="relative flex h-3 w-3">
            {!hasChanges && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            )}
            <span className={`
              relative inline-flex rounded-full h-3 w-3
              ${hasChanges ? 'bg-amber-500' : 'bg-green-500'}
            `} />
          </span>

          {/* Status text */}
          <div>
            <span className={`text-sm font-medium ${hasChanges ? 'text-amber-300' : 'text-green-300'}`}>
              {hasChanges ? 'Active System Prompt (editing...)' : 'Active System Prompt'}
            </span>
            <p className={`text-xs ${hasChanges ? 'text-amber-400/70' : 'text-green-400/70'}`}>
              {hasChanges
                ? 'Changes pending — save or discard below'
                : 'Currently powering /explore'
              }
            </p>
          </div>
        </div>
      )}

      {/* Draft banner with current active info */}
      {isDraft && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20">
          <span className="material-symbols-outlined text-amber-400 text-base">edit_note</span>
          <span className="text-sm text-amber-300">
            Draft — {activePrompt
              ? `Active: "${activePrompt.meta.title}" (${activePrompt.meta.id.slice(0, 8)}...)`
              : 'No active prompt set'}
          </span>
        </div>
      )}

      {/* Archived banner */}
      {isArchived && (
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-500/10 border-b border-gray-500/20">
          <span className="material-symbols-outlined text-gray-400 text-base">archive</span>
          <span className="text-sm text-gray-300">
            Archived — no longer in use
          </span>
        </div>
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">

        {/* === IDENTITY & META === */}
        <InspectorSection title="Identity">
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Title</label>
              <BufferedInput
                value={prompt.meta.title}
                onChange={(v) => patchMeta('title', v)}
                debounceMs={400}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Description</label>
              <BufferedTextarea
                value={prompt.meta.description || ''}
                onChange={(v) => patchMeta('description', v)}
                rows={2}
                debounceMs={400}
                placeholder="Brief description of this system prompt"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 resize-none"
                disabled={loading}
              />
            </div>

            {/* Version badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--glass-text-muted)]">Version</span>
              <span className="px-2 py-0.5 rounded-full bg-[var(--glass-surface)] text-sm text-[var(--glass-text-secondary)]">
                v{prompt.payload.version}
              </span>
              {prompt.payload.previousVersionId && (
                <span className="text-xs text-[var(--glass-text-muted)]">
                  (from previous version)
                </span>
              )}
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* === PROMPT CONTENT (5 Sections) === */}
        {Object.entries(PROMPT_SECTIONS).map(([key, config]) => (
          <React.Fragment key={key}>
            <InspectorSection title={config.label} collapsible defaultCollapsed={false}>
              <div className="space-y-2">
                <p className="text-xs text-[var(--glass-text-muted)]">{config.description}</p>
                <BufferedTextarea
                  value={prompt.payload[key as keyof SystemPromptPayload] as string || ''}
                  onChange={(v) => patchPayload(key, v)}
                  rows={4}
                  debounceMs={400}
                  placeholder={config.placeholder}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 resize-none font-mono"
                  disabled={loading}
                />
                <p className="text-xs text-[var(--glass-text-muted)] text-right">
                  {(prompt.payload[key as keyof SystemPromptPayload] as string || '').length} / {config.maxLength}
                </p>
              </div>
            </InspectorSection>
            <InspectorDivider />
          </React.Fragment>
        ))}

        {/* === BEHAVIOR === */}
        <InspectorSection title="Behavior" collapsible defaultCollapsed={false}>
          <div className="space-y-4">
            {/* Response Mode */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-2">Response Mode</label>
              <div className="flex flex-wrap gap-2">
                {RESPONSE_MODES.map((mode) => {
                  const config = RESPONSE_MODE_CONFIG[mode.value];
                  const isSelected = prompt.payload.responseMode === mode.value;
                  return (
                    <button
                      key={mode.value}
                      onClick={() => patchPayload('responseMode', mode.value as ResponseMode)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                        isSelected
                          ? 'ring-2 ring-[var(--neon-cyan)] bg-[var(--glass-surface)]'
                          : 'bg-[var(--glass-solid)] hover:bg-[var(--glass-surface)] border border-[var(--glass-border)]'
                      }`}
                      disabled={loading}
                      title={mode.description}
                    >
                      <span
                        className="material-symbols-outlined text-lg"
                        style={{ color: config?.color }}
                      >
                        {config?.icon}
                      </span>
                      <span className="text-sm">{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Closing Behavior */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-2">Closing Behavior</label>
              <div className="flex flex-wrap gap-2">
                {CLOSING_BEHAVIORS.map((behavior) => {
                  const config = CLOSING_BEHAVIOR_CONFIG[behavior.value];
                  const isSelected = prompt.payload.closingBehavior === behavior.value;
                  return (
                    <button
                      key={behavior.value}
                      onClick={() => patchPayload('closingBehavior', behavior.value as ClosingBehavior)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                        isSelected
                          ? 'ring-2 ring-[var(--neon-cyan)] bg-[var(--glass-surface)]'
                          : 'bg-[var(--glass-solid)] hover:bg-[var(--glass-surface)] border border-[var(--glass-border)]'
                      }`}
                      disabled={loading}
                      title={behavior.description}
                    >
                      <span className="material-symbols-outlined text-lg text-[var(--glass-text-muted)]">
                        {config?.icon}
                      </span>
                      <span className="text-sm">{behavior.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* === OUTPUT TAGS === */}
        <InspectorSection title="Output Tags" collapsible defaultCollapsed={true}>
          <div className="space-y-3">
            {/* Breadcrumb Tags */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-[var(--glass-text-secondary)]">Breadcrumb Tags</span>
                <p className="text-xs text-[var(--glass-text-muted)]">Include navigation context in responses</p>
              </div>
              <button
                onClick={() => patchPayload('useBreadcrumbTags', !prompt.payload.useBreadcrumbTags)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  prompt.payload.useBreadcrumbTags ? 'bg-[var(--neon-cyan)]' : 'bg-[var(--glass-border)]'
                }`}
                disabled={loading}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                  prompt.payload.useBreadcrumbTags ? 'left-6' : 'left-1'
                }`} />
              </button>
            </div>

            {/* Topic Tags */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-[var(--glass-text-secondary)]">Topic Tags</span>
                <p className="text-xs text-[var(--glass-text-muted)]">Include topic classification markers</p>
              </div>
              <button
                onClick={() => patchPayload('useTopicTags', !prompt.payload.useTopicTags)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  prompt.payload.useTopicTags ? 'bg-[var(--neon-cyan)]' : 'bg-[var(--glass-border)]'
                }`}
                disabled={loading}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                  prompt.payload.useTopicTags ? 'left-6' : 'left-1'
                }`} />
              </button>
            </div>

            {/* Navigation Blocks */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-[var(--glass-text-secondary)]">Navigation Blocks</span>
                <p className="text-xs text-[var(--glass-text-muted)]">Include suggested next steps</p>
              </div>
              <button
                onClick={() => patchPayload('useNavigationBlocks', !prompt.payload.useNavigationBlocks)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  prompt.payload.useNavigationBlocks ? 'bg-[var(--neon-cyan)]' : 'bg-[var(--glass-border)]'
                }`}
                disabled={loading}
              >
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                  prompt.payload.useNavigationBlocks ? 'left-6' : 'left-1'
                }`} />
              </button>
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* === ENVIRONMENT === */}
        <InspectorSection title="Environment" collapsible defaultCollapsed={true}>
          <div className="space-y-2">
            <p className="text-xs text-[var(--glass-text-muted)]">
              Target a specific environment, or leave unset for all environments.
            </p>
            <div className="flex flex-wrap gap-2">
              {['all', 'production', 'staging', 'development'].map((env) => {
                const isSelected = env === 'all'
                  ? !prompt.payload.environment
                  : prompt.payload.environment === env;
                return (
                  <button
                    key={env}
                    onClick={() => patchPayload('environment', env === 'all' ? undefined : env)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      isSelected
                        ? 'bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] border border-[var(--neon-cyan)]/50'
                        : 'bg-[var(--glass-surface)] text-[var(--glass-text-muted)] border border-[var(--glass-border)]'
                    }`}
                    disabled={loading}
                  >
                    {env === 'all' ? 'All Environments' : env.charAt(0).toUpperCase() + env.slice(1)}
                  </button>
                );
              })}
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* === CHANGELOG === */}
        {prompt.payload.changelog && (
          <>
            <InspectorSection title="Version Notes" collapsible defaultCollapsed={true}>
              <p className="text-sm text-[var(--glass-text-secondary)]">
                {prompt.payload.changelog}
              </p>
            </InspectorSection>
            <InspectorDivider />
          </>
        )}

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
              <dd className="text-[var(--glass-text-muted)] font-mono text-xs truncate max-w-[200px]">
                {prompt.meta.id}
              </dd>
            </div>
          </dl>
        </InspectorSection>
      </div>

      {/* Fixed footer with actions */}
      <div className="flex-shrink-0 p-4 border-t border-[var(--glass-border)] bg-[var(--glass-panel)]">
        <div className="flex flex-col gap-3">

          {/* === ACTIVE PROMPT: Status button or Save/Discard === */}
          {isActive && (
            hasChanges ? (
              // Editing mode: Save & Activate + Discard
              <div className="flex items-center gap-2">
                <GlassButton
                  onClick={handleDiscard}
                  variant="ghost"
                  size="sm"
                  disabled={loading || discarding || saving}
                  className="border border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                >
                  <span className="material-symbols-outlined text-lg mr-1">undo</span>
                  {discarding ? 'Discarding...' : 'Discard'}
                </GlassButton>
                <GlassButton
                  onClick={handleSaveWithCache}
                  variant="primary"
                  size="sm"
                  disabled={loading || saving || discarding}
                  className="flex-1 bg-green-600 hover:bg-green-500"
                >
                  <span className="material-symbols-outlined text-lg mr-1">
                    {saving ? 'hourglass_empty' : 'cloud_upload'}
                  </span>
                  {saving ? 'Saving...' : 'Save & Activate'}
                </GlassButton>
              </div>
            ) : (
              // Saved mode: Show "Active System Prompt" status button
              <div
                className="w-full px-4 py-2.5 rounded-lg bg-green-600/90 text-white text-center
                           flex items-center justify-center gap-2 cursor-default"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                <span className="font-medium">Active System Prompt</span>
              </div>
            )
          )}

          {/* === DRAFT: Activate button === */}
          {isDraft && (
            <GlassButton
              onClick={handleActivate}
              variant="primary"
              size="sm"
              disabled={loading || activating || hasChanges}
              className="w-full bg-green-600 hover:bg-green-500"
              title={hasChanges ? 'Save changes before activating' : 'Make this the active system prompt'}
            >
              <span className="material-symbols-outlined text-lg mr-2">
                {activating ? 'hourglass_empty' : 'rocket_launch'}
              </span>
              {activating ? 'Activating...' : 'Activate This Prompt'}
            </GlassButton>
          )}

          {/* === DRAFT: Save changes row === */}
          {isDraft && (
            <div className="flex items-center gap-2">
              <GlassButton
                onClick={handleSaveWithCache}
                variant="primary"
                size="sm"
                disabled={loading || saving || !hasChanges}
                className="flex-1"
              >
                {saving ? 'Saving...' : hasChanges ? 'Save Changes' : 'Saved'}
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

          {/* === ACTIVE: Secondary actions row === */}
          {isActive && (
            <div className="flex items-center justify-center gap-2">
              <GlassButton
                onClick={onDuplicate}
                variant="ghost"
                size="sm"
                disabled={loading}
                title="Create a copy as draft"
              >
                <span className="material-symbols-outlined text-lg mr-1">content_copy</span>
                Duplicate
              </GlassButton>
            </div>
          )}

          {/* === ARCHIVED: Restore/Delete === */}
          {isArchived && (
            <div className="flex items-center gap-2">
              <GlassButton
                onClick={onDuplicate}
                variant="ghost"
                size="sm"
                disabled={loading}
                className="flex-1"
                title="Create a new draft from this archived prompt"
              >
                <span className="material-symbols-outlined text-lg mr-1">content_copy</span>
                Restore as Draft
              </GlassButton>
              <GlassButton
                onClick={onDelete}
                variant="ghost"
                size="sm"
                disabled={loading}
                className="text-red-400 hover:text-red-300"
                title="Delete permanently"
              >
                <span className="material-symbols-outlined text-lg">delete</span>
              </GlassButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SystemPromptEditor;
