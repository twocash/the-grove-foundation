// src/bedrock/consoles/ExperienceConsole/ResearchAgentConfigEditor.tsx
// Editor component for Research Agent Config
// Sprint: experience-console-cleanup-v1
// Hotfix: singleton-pattern-v1 - full SystemPromptEditor pattern with versioning
//
// IMPORTANT: This editor uses BufferedInput for text fields.
// This prevents the inspector input race condition where rapid typing loses characters.

import React, { useCallback, useState, useRef, useEffect } from 'react';
import type { ObjectEditorProps } from '../../patterns/console-factory.types';
import type { ResearchAgentConfigPayload } from '@core/schema/research-agent-config';
import type { PatchOperation } from '../../types/copilot.types';
import { InspectorSection, InspectorDivider } from '../../primitives/BedrockInspector';
import { GlassButton } from '../../primitives/GlassButton';
import { BufferedInput, BufferedTextarea } from '../../primitives/BufferedInput';
import { useResearchAgentConfigData } from './useResearchAgentConfigData';

// S28-PIPE: Simplified to text-only config (removed SOURCE_OPTIONS)

/**
 * Editor component for ResearchAgentConfig objects
 * SINGLETON type - typically only one active config exists
 */
export function ResearchAgentConfigEditor({
  object: config,
  onEdit,
  onSave,
  onDelete,
  onDuplicate,
  loading,
  hasChanges,
  onSelectObject,
}: ObjectEditorProps<ResearchAgentConfigPayload>) {
  // Get functions from data hook
  const { activate, activeConfig, update, saveAndActivate } = useResearchAgentConfigData();
  const [activating, setActivating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [discarding, setDiscarding] = useState(false);

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

  // S28-PIPE: showAdvanced removed (only 2 text fields now, no advanced section)

  // Snapshot of original state for discard functionality
  const originalSnapshotRef = useRef<{ meta: typeof config.meta; payload: typeof config.payload } | null>(null);

  // Capture snapshot when config changes (new selection) and no pending changes
  useEffect(() => {
    if (!hasChanges) {
      originalSnapshotRef.current = {
        meta: { ...config.meta },
        payload: { ...config.payload },
      };
      // Reset modification tracking for new selection
      setModifiedFields(new Set());
    }
  }, [config.meta.id, hasChanges]);

  // S28-PIPE: Simplified payload (text fields only)
  const { searchInstructions, qualityGuidance } = config.payload;

  // Handle activation
  const handleActivate = useCallback(async () => {
    setActivating(true);
    try {
      await activate(config.meta.id);
      // Optimistic UI: show as active immediately
      setJustActivated(true);
      console.log('[ResearchAgentConfigEditor] Activation successful');
    } catch (error) {
      console.error('[ResearchAgentConfigEditor] Activation failed:', error);
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
        const pendingChanges: Partial<ResearchAgentConfigPayload> = {};

        // Extract current values for modified fields
        modifiedFields.forEach(fieldName => {
          const key = fieldName as keyof ResearchAgentConfigPayload;
          if (key in config.payload) {
            (pendingChanges as Record<string, unknown>)[key] = config.payload[key];
          }
        });

        console.log('[ResearchAgentConfigEditor] Creating version with changes:',
          Object.keys(pendingChanges));

        const newConfig = await saveAndActivate(config, pendingChanges);
        setModifiedFields(new Set()); // Reset tracking
        onSave(); // Clear hasChanges flag

        // Switch inspector to the newly created config
        if (onSelectObject && newConfig) {
          console.log('[ResearchAgentConfigEditor] Switching to new version:', newConfig.meta.id);
          onSelectObject(newConfig.meta.id);
        }
      } else {
        // Draft/archived or no changes: use regular save
        onSave();
      }
    } catch (error) {
      console.error('[ResearchAgentConfigEditor] Save failed:', error);
    } finally {
      setSaving(false);
    }
  }, [onSave, isActive, modifiedFields, config, saveAndActivate, onSelectObject]);

  // Handle discard - restore original snapshot
  const handleDiscard = useCallback(async () => {
    if (!originalSnapshotRef.current) {
      console.warn('[ResearchAgentConfigEditor] No snapshot to restore');
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
      await update(config.meta.id, operations);

      // Reset modification tracking
      setModifiedFields(new Set());

      // Call onSave to clear hasChanges flag
      onSave();
    } catch (error) {
      console.error('[ResearchAgentConfigEditor] Discard failed:', error);
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

  // Helper to generate patch operations for payload fields
  const patchPayload = useCallback(
    (field: string, value: unknown) => {
      // Track modified field for version creation
      setModifiedFields(prev => new Set(prev).add(field));
      const ops: PatchOperation[] = [
        { op: 'replace', path: `/payload/${field}`, value },
      ];
      onEdit(ops);
    },
    [onEdit]
  );

  // S28-PIPE: toggleSource removed (no longer needed for text-only config)

  return (
    <div className="flex flex-col h-full">
      {/* Active Status Indicator */}
      {isActive && (
        <div
          className="flex items-center gap-3 px-4 py-3 border-b transition-colors"
          style={hasChanges
            ? { backgroundColor: 'var(--semantic-warning-bg)', borderColor: 'var(--semantic-warning-border)' }
            : { backgroundColor: 'var(--semantic-info-bg)', borderColor: 'var(--semantic-info-border)' }
          }
        >
          <span className="relative flex h-3 w-3">
            {!hasChanges && (
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: 'var(--semantic-info)' }}
              />
            )}
            <span
              className="relative inline-flex rounded-full h-3 w-3"
              style={{ backgroundColor: hasChanges ? 'var(--semantic-warning)' : 'var(--semantic-info)' }}
            />
          </span>
          <div className="flex-1">
            <span
              className="text-sm font-medium"
              style={{ color: hasChanges ? 'var(--semantic-warning)' : 'var(--semantic-info)' }}
            >
              {hasChanges ? 'Active Configuration (editing...)' : 'Active Configuration'}
            </span>
            <p
              className="text-xs opacity-70"
              style={{ color: hasChanges ? 'var(--semantic-warning)' : 'var(--semantic-info)' }}
            >
              {hasChanges
                ? 'Changes pending — save or discard below'
                : 'SINGLETON: Only one Research Agent config can be active'
              }
            </p>
          </div>
        </div>
      )}

      {/* Draft banner with current active info */}
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

      {/* Archived banner */}
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
          <span className="material-symbols-outlined text-2xl text-purple-400">
            search
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-[var(--glass-text-primary)] truncate">
              {config.meta.title || 'Research Agent Config'}
            </h1>
            <p className="text-xs text-[var(--glass-text-muted)]">
              Configure research execution behavior
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
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-purple-500/50"
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
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-purple-500/50 resize-none"
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

        {/* Essential Research Settings (v1.0 simplified UI) */}
        {/* S28-PIPE: Simplified to 2 text fields */}
        <InspectorSection title="Research Prompt Configuration" collapsible defaultCollapsed={false}>
          <div className="space-y-4">
            {/* Field 1: Search Instructions */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-2">
                Search Instructions
              </label>
              <BufferedTextarea
                value={searchInstructions}
                onChange={(v) => patchPayload('searchInstructions', v)}
                rows={12}
                className="w-full bg-[var(--glass-solid)] rounded-lg px-3 py-2 text-sm text-[var(--glass-text-primary)] border border-[var(--glass-border)] focus:border-purple-500 focus:outline-none font-mono"
                placeholder="e.g., You are a SENIOR RESEARCH ANALYST. Focus on academic sources..."
              />
              <p className="text-xs text-[var(--glass-text-muted)] mt-2 italic">
                Free-form instructions for how the research agent should search and gather evidence.
              </p>
            </div>

            {/* Field 2: Quality Guidance */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-2">
                Quality Guidance
              </label>
              <BufferedTextarea
                value={qualityGuidance}
                onChange={(v) => patchPayload('qualityGuidance', v)}
                rows={8}
                className="w-full bg-[var(--glass-solid)] rounded-lg px-3 py-2 text-sm text-[var(--glass-text-primary)] border border-[var(--glass-border)] focus:border-purple-500 focus:outline-none font-mono"
                placeholder="e.g., Use rich markdown. Cite sources with confidence scores..."
              />
              <p className="text-xs text-[var(--glass-text-muted)] mt-2 italic">
                Quality standards and output formatting guidance.
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
                  className="flex-1 bg-purple-600 hover:bg-purple-500"
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
                className="w-full px-4 py-2.5 rounded-lg bg-purple-600/90 text-white text-center
                           flex items-center justify-center gap-2 cursor-default"
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
              className="w-full bg-purple-600 hover:bg-purple-500"
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

export default ResearchAgentConfigEditor;
