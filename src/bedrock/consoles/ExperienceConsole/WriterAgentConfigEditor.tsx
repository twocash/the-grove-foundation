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

// Voice formality options
const FORMALITY_OPTIONS = [
  { value: 'casual', label: 'Casual', description: 'Conversational and approachable' },
  { value: 'professional', label: 'Professional', description: 'Business-appropriate tone' },
  { value: 'academic', label: 'Academic', description: 'Scholarly and formal' },
  { value: 'technical', label: 'Technical', description: 'Precise and detailed' },
] as const;

// Perspective options
const PERSPECTIVE_OPTIONS = [
  { value: 'first-person', label: 'First Person', description: 'Uses "I" and "we"' },
  { value: 'third-person', label: 'Third Person', description: 'Uses "they" and "it"' },
  { value: 'neutral', label: 'Neutral', description: 'Avoids personal pronouns' },
] as const;

// Citation style options
const CITATION_STYLE_OPTIONS = [
  { value: 'inline', label: 'Inline', description: 'Citations appear in text' },
  { value: 'endnote', label: 'Endnote', description: 'Citations at document end' },
] as const;

// Citation format options
const CITATION_FORMAT_OPTIONS = [
  { value: 'simple', label: 'Simple', description: 'Basic source attribution' },
  { value: 'apa', label: 'APA', description: 'American Psychological Association' },
  { value: 'chicago', label: 'Chicago', description: 'Chicago Manual of Style' },
] as const;

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

  const { voice, documentStructure, qualityRules } = config.payload;

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
  const patchVoice = useCallback(
    (field: string, value: unknown) => {
      // Track that voice section was modified
      setModifiedFields(prev => new Set(prev).add('voice'));
      const ops: PatchOperation[] = [
        { op: 'replace', path: `/payload/voice/${field}`, value },
      ];
      onEdit(ops);
    },
    [onEdit]
  );

  // Helper to patch nested documentStructure fields
  const patchDocStructure = useCallback(
    (field: string, value: unknown) => {
      // Track that documentStructure section was modified
      setModifiedFields(prev => new Set(prev).add('documentStructure'));
      const ops: PatchOperation[] = [
        { op: 'replace', path: `/payload/documentStructure/${field}`, value },
      ];
      onEdit(ops);
    },
    [onEdit]
  );

  // Helper to patch nested qualityRules fields
  const patchQualityRules = useCallback(
    (field: string, value: unknown) => {
      // Track that qualityRules section was modified
      setModifiedFields(prev => new Set(prev).add('qualityRules'));
      const ops: PatchOperation[] = [
        { op: 'replace', path: `/payload/qualityRules/${field}`, value },
      ];
      onEdit(ops);
    },
    [onEdit]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Active Status Indicator */}
      {isActive && (
        <div className={`
          flex items-center gap-3 px-4 py-3 border-b transition-colors
          ${hasChanges
            ? 'bg-amber-500/10 border-amber-500/30'
            : 'bg-teal-500/10 border-teal-500/20'
          }
        `}>
          <span className="relative flex h-3 w-3">
            {!hasChanges && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
            )}
            <span className={`
              relative inline-flex rounded-full h-3 w-3
              ${hasChanges ? 'bg-amber-500' : 'bg-teal-500'}
            `} />
          </span>
          <div className="flex-1">
            <span className={`text-sm font-medium ${hasChanges ? 'text-amber-300' : 'text-teal-300'}`}>
              {hasChanges ? 'Active Configuration (editing...)' : 'Active Configuration'}
            </span>
            <p className={`text-xs ${hasChanges ? 'text-amber-400/70' : 'text-teal-400/70'}`}>
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
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20">
          <span className="material-symbols-outlined text-amber-400 text-base">edit_note</span>
          <span className="text-sm text-amber-300">
            Draft — {activeConfig
              ? `Active: "${activeConfig.meta.title}"`
              : 'No active config set'}
          </span>
        </div>
      )}

      {/* Archived Banner */}
      {isArchived && (
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-500/10 border-b border-gray-500/20">
          <span className="material-symbols-outlined text-gray-400 text-base">archive</span>
          <span className="text-sm text-gray-300">
            Archived — no longer in use
          </span>
        </div>
      )}

      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-2xl text-teal-400">
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
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-teal-500/50"
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
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-teal-500/50 resize-none"
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

        {/* Voice Settings */}
        <InspectorSection title="Voice & Tone" collapsible defaultCollapsed={false}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-2">Formality</label>
              <div className="grid grid-cols-2 gap-2">
                {FORMALITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => patchVoice('formality', opt.value)}
                    className={`
                      p-2 rounded-lg border text-left transition-colors
                      ${voice.formality === opt.value
                        ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                        : 'border-[var(--glass-border)] hover:border-[var(--glass-border-bright)]'
                      }
                    `}
                  >
                    <span className="text-sm font-medium block">{opt.label}</span>
                    <span className="text-xs text-[var(--glass-text-muted)]">{opt.description}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-2">Perspective</label>
              <div className="flex gap-2">
                {PERSPECTIVE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => patchVoice('perspective', opt.value)}
                    className={`
                      flex-1 p-2 rounded-lg border text-center transition-colors
                      ${voice.perspective === opt.value
                        ? 'border-teal-500 bg-teal-500/10 text-teal-300'
                        : 'border-[var(--glass-border)] hover:border-[var(--glass-border-bright)]'
                      }
                    `}
                  >
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Personality (optional)
              </label>
              <BufferedInput
                value={voice.personality || ''}
                onChange={(val) => patchVoice('personality', val || undefined)}
                debounceMs={400}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-teal-500/50"
                placeholder="e.g., 'thoughtful and nuanced'"
                disabled={loading}
              />
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* Document Structure */}
        <InspectorSection title="Document Structure" collapsible defaultCollapsed={false}>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={documentStructure.includePosition}
                  onChange={(e) => patchDocStructure('includePosition', e.target.checked)}
                  className="w-5 h-5 rounded accent-teal-500"
                />
                <div>
                  <span className="text-sm text-[var(--glass-text-primary)]">Include Position</span>
                  <p className="text-xs text-[var(--glass-text-muted)]">Add thesis/position section</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={documentStructure.includeLimitations}
                  onChange={(e) => patchDocStructure('includeLimitations', e.target.checked)}
                  className="w-5 h-5 rounded accent-teal-500"
                />
                <div>
                  <span className="text-sm text-[var(--glass-text-primary)]">Include Limitations</span>
                  <p className="text-xs text-[var(--glass-text-muted)]">Add limitations section</p>
                </div>
              </label>
            </div>

            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-2">Citation Style</label>
              <div className="flex gap-2">
                {CITATION_STYLE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => patchDocStructure('citationStyle', opt.value)}
                    className={`
                      flex-1 p-2 rounded-lg border text-center transition-colors
                      ${documentStructure.citationStyle === opt.value
                        ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                        : 'border-[var(--glass-border)] hover:border-[var(--glass-border-bright)]'
                      }
                    `}
                  >
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-2">Citation Format</label>
              <div className="flex gap-2">
                {CITATION_FORMAT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => patchDocStructure('citationFormat', opt.value)}
                    className={`
                      flex-1 p-2 rounded-lg border text-center transition-colors
                      ${documentStructure.citationFormat === opt.value
                        ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                        : 'border-[var(--glass-border)] hover:border-[var(--glass-border-bright)]'
                      }
                    `}
                  >
                    <span className="text-sm font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Max Length (words, optional)
              </label>
              <input
                type="number"
                min={100}
                max={10000}
                step={100}
                value={documentStructure.maxLength || ''}
                onChange={(e) => patchDocStructure('maxLength', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-32 bg-[var(--glass-solid)] rounded-lg px-3 py-2 text-sm text-[var(--glass-text-primary)] placeholder:text-[var(--glass-text-muted)] border border-[var(--glass-border)] focus:border-teal-500 focus:outline-none"
                placeholder="No limit"
              />
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* Quality Rules */}
        <InspectorSection title="Quality Rules" collapsible defaultCollapsed={true}>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={qualityRules.requireCitations}
                onChange={(e) => patchQualityRules('requireCitations', e.target.checked)}
                className="w-5 h-5 rounded accent-emerald-500"
              />
              <div>
                <span className="text-sm text-[var(--glass-text-primary)]">Require Citations</span>
                <p className="text-xs text-[var(--glass-text-muted)]">All claims must have sources</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={qualityRules.flagUncertainty}
                onChange={(e) => patchQualityRules('flagUncertainty', e.target.checked)}
                className="w-5 h-5 rounded accent-amber-500"
              />
              <div>
                <span className="text-sm text-[var(--glass-text-primary)]">Flag Uncertainty</span>
                <p className="text-xs text-[var(--glass-text-muted)]">Mark uncertain claims in output</p>
              </div>
            </label>

            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Minimum Confidence to Include
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(qualityRules.minConfidenceToInclude * 100)}
                onChange={(e) => patchQualityRules('minConfidenceToInclude', parseInt(e.target.value) / 100)}
                className="w-full accent-emerald-500"
              />
              <div className="flex justify-between text-xs text-[var(--glass-text-muted)] mt-1">
                <span>0% (include all)</span>
                <span className="text-emerald-400 font-medium">
                  {Math.round(qualityRules.minConfidenceToInclude * 100)}%
                </span>
                <span>100% (high only)</span>
              </div>
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
                  className="border border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                >
                  <span className="material-symbols-outlined text-lg mr-1">undo</span>
                  {discarding ? 'Discarding...' : 'Discard'}
                </GlassButton>
                <GlassButton
                  onClick={handleSaveWithVersioning}
                  variant="primary"
                  size="sm"
                  disabled={loading || saving || discarding}
                  className="flex-1 bg-teal-600 hover:bg-teal-500"
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
                className="w-full px-4 py-2.5 rounded-lg bg-teal-600/90 text-white text-center
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
              className="w-full bg-teal-600 hover:bg-teal-500"
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

export default WriterAgentConfigEditor;
