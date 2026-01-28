// src/bedrock/consoles/ExperienceConsole/WriterAgentConfigEditor.tsx
// Editor component for Writer Agent Config
// Sprint: experience-console-cleanup-v1
// Hotfix: singleton-pattern-v1 - full SystemPromptEditor pattern with versioning
//
// IMPORTANT: This editor uses BufferedInput for text fields.
// This prevents the inspector input race condition where rapid typing loses characters.

import React, { useCallback, useState, useRef, useEffect } from 'react';
import type { ObjectEditorProps } from '../../patterns/console-factory.types';
import type { WriterAgentConfigPayload } from '@core/schema/writer-agent-config';
import type { PatchOperation } from '../../types/copilot.types';
import { InspectorSection, InspectorDivider } from '../../primitives/BedrockInspector';
import { GlassButton } from '../../primitives/GlassButton';
import { BufferedInput, BufferedTextarea } from '../../primitives/BufferedInput';
import { useWriterAgentConfigData } from './useWriterAgentConfigData';

// S28-PIPE: Removed option constants (text-only config, no enums)

/**
 * Editor component for WriterAgentConfig objects
 * SINGLETON type - typically only one active config exists
 */
export function WriterAgentConfigEditor({
  object: config,
  onEdit,
  onSave,
  onDelete,
  onDuplicate,
  loading,
  hasChanges,
  onSelectObject,
}: ObjectEditorProps<WriterAgentConfigPayload>) {
  // Get functions from data hook
  const { activate, activeConfig, update, saveAndActivate } = useWriterAgentConfigData();
  const [activating, setActivating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [discarding, setDiscarding] = useState(false);

  // v1.0 UI simplification: Show only essential fields by default
  // Sprint: agents-go-live-v1
  // S28-PIPE: showAdvanced removed (only 3 text fields now, no advanced section)

  // Optimistic UI: track if we just activated (before props update)
  const [justActivated, setJustActivated] = useState(false);

  // Reset justActivated when config changes or status updates
  useEffect(() => {
    setJustActivated(false);
  }, [config.meta.id]);

  useEffect(() => {
    if (config.meta.status === 'active') {
      setJustActivated(false);
    }
  }, [config.meta.status]);

  // Status checks - include optimistic justActivated for immediate UI feedback
  const isActive = config.meta.status === 'active' || justActivated;
  const isArchived = config.meta.status === 'archived' && !justActivated;
  const isDraft = config.meta.status === 'draft' && !justActivated;

  // Track which payload fields have been modified for version creation
  const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set());

  // Snapshot of original state for discard functionality
  const originalSnapshotRef = useRef<{ meta: typeof config.meta; payload: typeof config.payload } | null>(null);

  // Capture snapshot when config changes (new selection) and no pending changes
  useEffect(() => {
    if (!hasChanges) {
      originalSnapshotRef.current = {
        meta: { ...config.meta },
        payload: {
          ...config.payload,
          voice: { ...config.payload.voice },
          documentStructure: { ...config.payload.documentStructure },
          qualityRules: { ...config.payload.qualityRules },
        },
      };
      // Reset modification tracking for new selection
      setModifiedFields(new Set());
    }
  }, [config.meta.id, hasChanges]);

  // S28-PIPE: Simplified payload (text fields only)
  const { writingStyle, resultsFormatting, citationsStyle } = config.payload;

  // Handle activation
  const handleActivate = useCallback(async () => {
    setActivating(true);
    try {
      await activate(config.meta.id);
      // Optimistic UI: show as active immediately
      setJustActivated(true);
      console.log('[WriterAgentConfigEditor] Activation successful');
    } catch (error) {
      console.error('[WriterAgentConfigEditor] Activation failed:', error);
    } finally {
      setActivating(false);
    }
  }, [activate, config.meta.id]);

  // Handle save with versioning for active configs
  const handleSaveWithVersioning = useCallback(async () => {
    setSaving(true);
    try {
      if (isActive && modifiedFields.size > 0) {
        // Active config with changes: create new version
        // Build partial payload with all current nested values for modified fields
        const pendingChanges: Partial<WriterAgentConfigPayload> = {};

        modifiedFields.forEach(fieldName => {
          if (fieldName === 'voice') {
            pendingChanges.voice = { ...config.payload.voice };
          } else if (fieldName === 'documentStructure') {
            pendingChanges.documentStructure = { ...config.payload.documentStructure };
          } else if (fieldName === 'qualityRules') {
            pendingChanges.qualityRules = { ...config.payload.qualityRules };
          }
        });

        console.log('[WriterAgentConfigEditor] Creating version with changes:',
          Object.keys(pendingChanges));

        const newConfig = await saveAndActivate(config, pendingChanges);
        setModifiedFields(new Set()); // Reset tracking
        onSave(); // Clear hasChanges flag

        // Switch inspector to the newly created config
        if (onSelectObject && newConfig) {
          console.log('[WriterAgentConfigEditor] Switching to new version:', newConfig.meta.id);
          onSelectObject(newConfig.meta.id);
        }
      } else {
        // Draft/archived or no changes: use regular save
        onSave();
      }
    } catch (error) {
      console.error('[WriterAgentConfigEditor] Save failed:', error);
    } finally {
      setSaving(false);
    }
  }, [onSave, isActive, modifiedFields, config, saveAndActivate, onSelectObject]);

  // Handle discard - restore original snapshot
  const handleDiscard = useCallback(async () => {
    if (!originalSnapshotRef.current) {
      console.warn('[WriterAgentConfigEditor] No snapshot to restore');
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

      // Restore payload fields (including nested objects)
      for (const [key, value] of Object.entries(snapshot.payload)) {
        operations.push({ op: 'replace', path: `/payload/${key}`, value });
      }

      // Apply restore operations
      await update(config.meta.id, operations);

      // Reset modification tracking
      setModifiedFields(new Set());

      // Call onSave to clear hasChanges flag
      onSave();
    } catch (error) {
      console.error('[WriterAgentConfigEditor] Discard failed:', error);
    } finally {
      setDiscarding(false);
    }
  }, [update, config.meta.id, onSave]);

  // Helper to generate patch operations for meta fields
  const patchMeta = useCallback(
    (field: string, value: unknown) => {
      const ops: PatchOperation[] = [
        { op: 'replace', path: `/meta/${field}`, value },
      ];
      onEdit(ops);
    },
    [onEdit]
  );

  // Helper to patch nested voice fields
  // S28-PIPE: Removed patchVoice, patchDocStructure, patchQualityRules
  // (no longer needed with flat text-only schema — patchPayload handles all fields)

  return (
    <div className="flex flex-col h-full">
      {/* Active Status Indicator */}
      {isActive && (
        <div
          className="flex items-center gap-3 px-4 py-3 border-b transition-colors"
          style={hasChanges
            ? { backgroundColor: 'var(--semantic-warning-bg)', borderColor: 'var(--semantic-warning-border)' }
            : { backgroundColor: 'var(--semantic-success-bg)', borderColor: 'var(--semantic-success-border)' }
          }
        >
          <span className="relative flex h-3 w-3">
            {!hasChanges && (
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: 'var(--semantic-success)' }}
              />
            )}
            <span
              className="relative inline-flex rounded-full h-3 w-3"
              style={{ backgroundColor: hasChanges ? 'var(--semantic-warning)' : 'var(--semantic-success)' }}
            />
          </span>
          <div className="flex-1">
            <span
              className="text-sm font-medium"
              style={{ color: hasChanges ? 'var(--semantic-warning)' : 'var(--semantic-success)' }}
            >
              {hasChanges ? 'Active Configuration (editing...)' : 'Active Configuration'}
            </span>
            <p
              className="text-xs opacity-70"
              style={{ color: hasChanges ? 'var(--semantic-warning)' : 'var(--semantic-success)' }}
            >
              {hasChanges
                ? 'Changes pending — save or discard below'
                : 'SINGLETON: Only one Writer Agent config can be active'
              }
            </p>
          </div>
        </div>
      )}

      {/* Draft Banner */}
      {isDraft && (
        <div
          className="flex items-center gap-2 px-4 py-2 border-b"
          style={{ backgroundColor: 'var(--semantic-warning-bg)', borderColor: 'var(--semantic-warning-border)' }}
        >
          <span className="material-symbols-outlined text-base" style={{ color: 'var(--semantic-warning)' }}>edit_note</span>
          <span className="text-sm" style={{ color: 'var(--semantic-warning)' }}>
            Draft — {activeConfig
              ? `Active: "${activeConfig.meta.title}"`
              : 'No active config set'}
          </span>
        </div>
      )}

      {/* Archived Banner */}
      {isArchived && (
        <div className="flex items-center gap-2 px-4 py-2 border-b" style={{ backgroundColor: 'var(--glass-panel)', borderColor: 'var(--glass-border)' }}>
          <span className="material-symbols-outlined text-base" style={{ color: 'var(--glass-text-muted)' }}>archive</span>
          <span className="text-sm" style={{ color: 'var(--glass-text-secondary)' }}>
            Archived — no longer in use
          </span>
        </div>
      )}

      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-3">
          <span
            className="material-symbols-outlined text-2xl"
            style={{ color: 'var(--semantic-success)' }}
          >
            edit_note
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-[var(--glass-text-primary)] truncate">
              {config.meta.title || 'Writer Agent Config'}
            </h1>
            <p className="text-xs text-[var(--glass-text-muted)]">
              Configure document writing behavior
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Identity Section */}
        <InspectorSection title="Identity" collapsible defaultCollapsed={false}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Title</label>
              <BufferedInput
                value={config.meta.title}
                onChange={(val) => patchMeta('title', val)}
                debounceMs={400}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--semantic-success)]/50"
                placeholder="Config Title"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Description</label>
              <BufferedTextarea
                value={config.meta.description || ''}
                onChange={(val) => patchMeta('description', val)}
                debounceMs={400}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--semantic-success)]/50 resize-none"
                placeholder="What does this config control?"
                rows={2}
                disabled={loading}
              />
            </div>
            {/* Version badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--glass-text-muted)]">Version</span>
              <span className="px-2 py-0.5 rounded-full bg-[var(--glass-surface)] text-sm text-[var(--glass-text-secondary)]">
                v{config.payload.version || 1}
              </span>
              {config.payload.previousVersionId && (
                <span className="text-xs text-[var(--glass-text-muted)]">
                  (from previous version)
                </span>
              )}
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* ============================================================
            ESSENTIAL FIELDS (v1.0 simplified UI)
            Sprint: agents-go-live-v1
            Shows only 3 fields by default:
            1. Writing Style (formality)
            2. Require Citations toggle
            3. Quality Floor slider
            ============================================================ */}
        {/* S28-PIPE: Simplified to 3 text fields */}
        <InspectorSection title="Writer Prompt Configuration" collapsible defaultCollapsed={false}>
          <div className="space-y-4">
            {/* Field 1: Writing Style */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-2">
                Writing Style Instructions
              </label>
              <BufferedTextarea
                value={writingStyle}
                onChange={(v) => patchPayload('writingStyle', v)}
                rows={8}
                className="w-full bg-[var(--glass-solid)] rounded-lg px-3 py-2 text-sm text-[var(--glass-text-primary)] border border-[var(--glass-border)] focus:border-purple-500 focus:outline-none font-mono"
                placeholder="e.g., Write professionally but accessibly. Use neutral perspective..."
                disabled={loading}
              />
              <p className="text-xs text-[var(--glass-text-muted)] mt-2 italic">
                Free-form instructions for voice, tone, formality, perspective. Templates can override.
              </p>
            </div>

            {/* Field 2: Results Formatting */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-2">
                Results Formatting Instructions
              </label>
              <BufferedTextarea
                value={resultsFormatting}
                onChange={(v) => patchPayload('resultsFormatting', v)}
                rows={10}
                className="w-full bg-[var(--glass-solid)] rounded-lg px-3 py-2 text-sm text-[var(--glass-text-primary)] border border-[var(--glass-border)] focus:border-purple-500 focus:outline-none font-mono"
                placeholder="e.g., Use ## headers, include executive summary, bullet lists..."
                disabled={loading}
              />
              <p className="text-xs text-[var(--glass-text-muted)] mt-2 italic">
                Document structure and markdown formatting guidelines.
              </p>
            </div>

            {/* Field 3: Citations Style */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-2">
                Citations Style Instructions
              </label>
              <BufferedTextarea
                value={citationsStyle}
                onChange={(v) => patchPayload('citationsStyle', v)}
                rows={6}
                className="w-full bg-[var(--glass-solid)] rounded-lg px-3 py-2 text-sm text-[var(--glass-text-primary)] border border-[var(--glass-border)] focus:border-purple-500 focus:outline-none font-mono"
                placeholder="e.g., Use inline (Author, Year). Include Sources section at end..."
                disabled={loading}
              />
              <p className="text-xs text-[var(--glass-text-muted)] mt-2 italic">
                Citation format and requirements. Experiment to find what works.
              </p>
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* Changelog (if exists) */}
        {config.payload.changelog && (
          <>
            <InspectorSection title="Version Notes" collapsible defaultCollapsed={true}>
              <p className="text-sm text-[var(--glass-text-secondary)]">
                {config.payload.changelog}
              </p>
            </InspectorSection>
            <InspectorDivider />
          </>
        )}

        {/* Metadata */}
        <InspectorSection title="Metadata">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--glass-text-muted)]">Created</dt>
              <dd className="text-[var(--glass-text-secondary)]">
                {new Date(config.meta.createdAt).toLocaleDateString()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--glass-text-muted)]">Updated</dt>
              <dd className="text-[var(--glass-text-secondary)]">
                {new Date(config.meta.updatedAt).toLocaleDateString()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--glass-text-muted)]">ID</dt>
              <dd className="text-[var(--glass-text-muted)] font-mono text-xs truncate max-w-[200px]">
                {config.meta.id}
              </dd>
            </div>
          </dl>
        </InspectorSection>
      </div>

      {/* Footer actions */}
      <div className="flex-shrink-0 p-4 border-t border-[var(--glass-border)] bg-[var(--glass-panel)]">
        <div className="flex flex-col gap-3">

          {/* === ACTIVE CONFIG: Save/Discard or Status === */}
          {isActive && (
            hasChanges ? (
              // Editing mode: Discard + Save & Activate
              <div className="flex items-center gap-2">
                <GlassButton
                  onClick={handleDiscard}
                  variant="ghost"
                  size="sm"
                  disabled={loading || discarding || saving}
                  style={{ borderColor: 'var(--semantic-warning-border)', color: 'var(--semantic-warning)' }}
                >
                  <span className="material-symbols-outlined text-lg mr-1">undo</span>
                  {discarding ? 'Discarding...' : 'Discard'}
                </GlassButton>
                <GlassButton
                  onClick={handleSaveWithVersioning}
                  variant="primary"
                  size="sm"
                  disabled={loading || saving || discarding}
                  style={{ backgroundColor: 'var(--semantic-success)' }}
                  className="flex-1 hover:opacity-90"
                >
                  <span className="material-symbols-outlined text-lg mr-1">
                    {saving ? 'hourglass_empty' : 'cloud_upload'}
                  </span>
                  {saving ? 'Saving...' : 'Save & Activate'}
                </GlassButton>
              </div>
            ) : (
              // Saved mode: Show "Active Configuration" status button
              <div
                className="w-full px-4 py-2.5 rounded-lg text-white text-center
                           flex items-center justify-center gap-2 cursor-default"
                style={{ backgroundColor: 'var(--semantic-success)' }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                <span className="font-medium">Active Configuration</span>
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
              style={{ backgroundColor: 'var(--semantic-success)' }}
              className="w-full hover:opacity-90"
              title={hasChanges ? 'Save changes before activating' : 'Make this the active config'}
            >
              <span className="material-symbols-outlined text-lg mr-2">
                {activating ? 'hourglass_empty' : 'rocket_launch'}
              </span>
              {activating ? 'Activating...' : 'Activate This Config'}
            </GlassButton>
          )}

          {/* === DRAFT: Save changes row === */}
          {isDraft && (
            <div className="flex items-center gap-2">
              <GlassButton
                onClick={handleSaveWithVersioning}
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
                style={{ color: 'var(--semantic-error)' }}
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
                title="Create a new draft from this archived config"
              >
                <span className="material-symbols-outlined text-lg mr-1">content_copy</span>
                Restore as Draft
              </GlassButton>
              <GlassButton
                onClick={onDelete}
                variant="ghost"
                size="sm"
                disabled={loading}
                style={{ color: 'var(--semantic-error)' }}
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

export default WriterAgentConfigEditor;
