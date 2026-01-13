// src/bedrock/consoles/ExperienceConsole/CopilotStyleEditor.tsx
// Editor component for Copilot Style configuration
// Sprint: inspector-copilot-v1
// Hotfix: singleton-pattern-v1 - Added full lifecycle UI (activate, versioning, save & activate)
//
// IMPORTANT: This editor uses BufferedInput for text fields to prevent race conditions.
// PATTERN: Follows SystemPromptEditor lifecycle pattern exactly.

import React, { useCallback, useState, useRef, useEffect } from 'react';
import type { ObjectEditorProps } from '../../patterns/console-factory.types';
import type { CopilotStylePayload } from '@core/schema/copilot-style';
import type { PatchOperation } from '../../types/copilot.types';
import { InspectorSection, InspectorDivider } from '../../primitives/BedrockInspector';
import { GlassButton } from '../../primitives/GlassButton';
import { BufferedInput } from '../../primitives/BufferedInput';
import {
  THEME_TERMINAL_GREEN,
  THEME_TERMINAL_AMBER,
  THEME_TERMINAL_CYAN,
} from '@core/schema/copilot-style';
import { useCopilotStyleData } from './useCopilotStyleData';

// =============================================================================
// Preset Options
// =============================================================================

const PRESET_OPTIONS: { value: CopilotStylePayload['preset']; label: string; description: string }[] = [
  { value: 'terminal-green', label: 'Terminal Green', description: 'Classic Matrix/hacker aesthetic' },
  { value: 'terminal-amber', label: 'Terminal Amber', description: 'Warm retro CRT style' },
  { value: 'terminal-cyan', label: 'Terminal Cyan', description: 'Modern tech feel' },
  { value: 'custom', label: 'Custom', description: 'Define your own colors' },
];

const ANIMATION_OPTIONS: { value: CopilotStylePayload['decorations']['processingAnimation']; label: string }[] = [
  { value: 'pulse', label: 'Pulse' },
  { value: 'blink', label: 'Blink' },
  { value: 'spin', label: 'Spin' },
];

// =============================================================================
// Editor Component
// =============================================================================

/**
 * Editor component for CopilotStyle objects
 *
 * SINGLETON PATTERN: Follows SystemPromptEditor lifecycle exactly:
 * - Active style: Save creates new version, archives old
 * - Draft style: Can be activated (archives current active)
 * - Archived style: Can be restored as draft (duplicate)
 */
export function CopilotStyleEditor({
  object: style,
  onEdit,
  onSave,
  onDelete,
  onDuplicate,
  loading,
  hasChanges,
  onSelectObject,
}: ObjectEditorProps<CopilotStylePayload>) {
  // Get singleton lifecycle functions from data hook
  const { activate, activeStyle, update, saveAndActivate } = useCopilotStyleData();
  const [activating, setActivating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [discarding, setDiscarding] = useState(false);

  // Optimistic UI: track if we just activated (before props update)
  const [justActivated, setJustActivated] = useState(false);

  // Reset justActivated when style changes or status updates
  useEffect(() => {
    setJustActivated(false);
  }, [style.meta.id]);

  useEffect(() => {
    if (style.meta.status === 'active') {
      setJustActivated(false);
    }
  }, [style.meta.status]);

  // Status checks - include optimistic justActivated for immediate UI feedback
  const isActive = style.meta.status === 'active' || justActivated;
  const isArchived = style.meta.status === 'archived' && !justActivated;
  const isDraft = style.meta.status === 'draft' && !justActivated;

  const preset = style.payload.preset;

  // Track which payload fields have been modified for version creation
  const [modifiedFields, setModifiedFields] = useState<Set<string>>(new Set());

  // Snapshot of original state for discard functionality
  const originalSnapshotRef = useRef<{ meta: typeof style.meta; payload: typeof style.payload } | null>(null);

  // Capture snapshot when style changes (new selection) and no pending changes
  useEffect(() => {
    if (!hasChanges) {
      originalSnapshotRef.current = {
        meta: { ...style.meta },
        payload: { ...style.payload },
      };
      setModifiedFields(new Set());
    }
  }, [style.meta.id, hasChanges]);

  // ==========================================================================
  // Handlers
  // ==========================================================================

  // Handle activation
  const handleActivate = useCallback(async () => {
    setActivating(true);
    try {
      await activate(style.meta.id);
      setJustActivated(true);
      console.log('[CopilotStyleEditor] Activation successful');
    } catch (error) {
      console.error('[CopilotStyleEditor] Activation failed:', error);
    } finally {
      setActivating(false);
    }
  }, [activate, style.meta.id]);

  // Handle save - uses saveAndActivate for active styles to create versions
  const handleSaveWithVersion = useCallback(async () => {
    setSaving(true);
    try {
      if (isActive && modifiedFields.size > 0) {
        // Active style with changes: create new version
        const pendingChanges: Partial<CopilotStylePayload> = {};

        // Extract current values for modified fields
        modifiedFields.forEach(fieldName => {
          const key = fieldName as keyof CopilotStylePayload;
          if (key in style.payload) {
            (pendingChanges as Record<string, unknown>)[key] = style.payload[key];
          }
        });

        console.log('[CopilotStyleEditor] Creating version with changes:',
          Object.keys(pendingChanges));

        const newStyle = await saveAndActivate(style, pendingChanges);
        setModifiedFields(new Set());
        onSave();

        // Switch inspector to the newly created style
        if (onSelectObject && newStyle) {
          console.log('[CopilotStyleEditor] Switching to new version:', newStyle.meta.id);
          onSelectObject(newStyle.meta.id);
        }
      } else {
        // Draft/archived or no changes: use regular save
        onSave();
      }
    } catch (error) {
      console.error('[CopilotStyleEditor] Save failed:', error);
    } finally {
      setSaving(false);
    }
  }, [onSave, isActive, modifiedFields, style, saveAndActivate, onSelectObject]);

  // Handle discard - restore original snapshot
  const handleDiscard = useCallback(async () => {
    if (!originalSnapshotRef.current) {
      console.warn('[CopilotStyleEditor] No snapshot to restore');
      return;
    }

    setDiscarding(true);
    try {
      const snapshot = originalSnapshotRef.current;

      // Build patch operations to restore original state
      const operations: PatchOperation[] = [];

      // Restore meta fields
      for (const [key, value] of Object.entries(snapshot.meta)) {
        if (key !== 'id' && key !== 'type') {
          operations.push({ op: 'replace', path: `/meta/${key}`, value });
        }
      }

      // Restore payload fields
      for (const [key, value] of Object.entries(snapshot.payload)) {
        operations.push({ op: 'replace', path: `/payload/${key}`, value });
      }

      await update(style.meta.id, operations);
      setModifiedFields(new Set());
      onSave();
    } catch (error) {
      console.error('[CopilotStyleEditor] Discard failed:', error);
    } finally {
      setDiscarding(false);
    }
  }, [update, style.meta.id, onSave]);

  // ==========================================================================
  // Patch Helpers
  // ==========================================================================

  const patchMeta = useCallback(
    (field: string, value: unknown) => {
      const ops: PatchOperation[] = [{ op: 'replace', path: `/meta/${field}`, value }];
      onEdit(ops);
    },
    [onEdit]
  );

  const patchPayload = useCallback(
    (path: string, value: unknown) => {
      // Track modified field for version creation
      const fieldName = path.split('/')[0]; // Get top-level field
      setModifiedFields(prev => new Set(prev).add(fieldName));
      const ops: PatchOperation[] = [{ op: 'replace', path: `/payload/${path}`, value }];
      onEdit(ops);
    },
    [onEdit]
  );

  // Handle preset change - also update colors
  const handlePresetChange = useCallback(
    (newPreset: CopilotStylePayload['preset']) => {
      const presetThemes = {
        'terminal-green': THEME_TERMINAL_GREEN,
        'terminal-amber': THEME_TERMINAL_AMBER,
        'terminal-cyan': THEME_TERMINAL_CYAN,
        'custom': style.payload.colors,
      };

      setModifiedFields(prev => new Set(prev).add('preset').add('colors'));
      const ops: PatchOperation[] = [
        { op: 'replace', path: '/payload/preset', value: newPreset },
        { op: 'replace', path: '/payload/colors', value: presetThemes[newPreset] },
      ];
      onEdit(ops);
    },
    [onEdit, style.payload.colors]
  );

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div className="flex flex-col h-full">
      {/* === ACTIVE STATUS BANNER === */}
      {isActive && (
        <div className={`
          flex items-center gap-3 px-4 py-3 border-b transition-colors
          ${hasChanges
            ? 'bg-amber-500/10 border-amber-500/30'
            : 'bg-green-500/10 border-green-500/20'
          }
        `}>
          <span className="relative flex h-3 w-3">
            {!hasChanges && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            )}
            <span className={`
              relative inline-flex rounded-full h-3 w-3
              ${hasChanges ? 'bg-amber-500' : 'bg-green-500'}
            `} />
          </span>
          <div className="flex-1">
            <span className={`text-sm font-medium ${hasChanges ? 'text-amber-300' : 'text-green-300'}`}>
              {hasChanges ? 'Active Style (editing...)' : 'Active Style'}
            </span>
            <p className={`text-xs ${hasChanges ? 'text-amber-400/70' : 'text-green-400/70'}`}>
              {hasChanges
                ? 'Changes pending — save or discard below'
                : 'Applied to all inspector copilots'
              }
            </p>
          </div>
        </div>
      )}

      {/* === DRAFT BANNER === */}
      {isDraft && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20">
          <span className="material-symbols-outlined text-amber-400 text-base">edit_note</span>
          <span className="text-sm text-amber-300">
            Draft — {activeStyle
              ? `Active: "${activeStyle.meta.title}" (${activeStyle.meta.id.slice(0, 8)}...)`
              : 'No active style set'}
          </span>
        </div>
      )}

      {/* === ARCHIVED BANNER === */}
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
          <span className="material-symbols-outlined text-2xl text-[var(--neon-cyan)]">terminal</span>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-[var(--glass-text-primary)] truncate">
              {style.meta.title || 'Untitled Style'}
            </h1>
            <p className="text-sm text-[var(--glass-text-muted)]">
              {PRESET_OPTIONS.find(p => p.value === preset)?.label}
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* === IDENTITY === */}
        <InspectorSection title="Identity" collapsible defaultCollapsed={false}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Title</label>
              <BufferedInput
                value={style.meta.title}
                onChange={(val) => patchMeta('title', val)}
                debounceMs={400}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                placeholder="Style name"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Preset</label>
              <select
                value={preset}
                onChange={(e) => handlePresetChange(e.target.value as CopilotStylePayload['preset'])}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                disabled={loading}
              >
                {PRESET_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} - {opt.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Version badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--glass-text-muted)]">Version</span>
              <span className="px-2 py-0.5 rounded-full bg-[var(--glass-surface)] text-sm text-[var(--glass-text-secondary)]">
                v{style.payload.version || 1}
              </span>
              {style.payload.previousVersionId && (
                <span className="text-xs text-[var(--glass-text-muted)]">
                  (from previous version)
                </span>
              )}
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* === TERMINAL PREVIEW === */}
        <InspectorSection title="Preview" collapsible defaultCollapsed={false}>
          <div
            className="rounded-lg p-3 font-mono text-sm"
            style={{ backgroundColor: style.payload.colors.background, borderColor: style.payload.colors.border, borderWidth: 1 }}
          >
            <div className="flex items-center gap-2 mb-2">
              <span style={{ color: style.payload.colors.accent }} className="text-xs uppercase tracking-wider">
                Copilot
              </span>
              <span style={{ color: style.payload.colors.mutedText }} className="text-xs">
                {style.payload.decorations.expandedIndicator}
              </span>
            </div>
            <div style={{ color: style.payload.colors.userText }}>
              <span style={{ color: style.payload.colors.accent }}>{style.payload.decorations.promptChar}</span> /help
            </div>
            <div
              style={{ color: style.payload.colors.responseText }}
              className="pl-3 border-l mt-2"
            >
              Available commands: set, clear, /help, /fields
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* === DECORATIONS === */}
        <InspectorSection title="Decorations" collapsible defaultCollapsed={true}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Prompt Character</label>
              <BufferedInput
                value={style.payload.decorations.promptChar}
                onChange={(val) => patchPayload('decorations/promptChar', val)}
                debounceMs={400}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 font-mono"
                placeholder=">"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Collapsed</label>
                <BufferedInput
                  value={style.payload.decorations.collapsedIndicator}
                  onChange={(val) => patchPayload('decorations/collapsedIndicator', val)}
                  debounceMs={400}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 font-mono"
                  placeholder="[+]"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Expanded</label>
                <BufferedInput
                  value={style.payload.decorations.expandedIndicator}
                  onChange={(val) => patchPayload('decorations/expandedIndicator', val)}
                  debounceMs={400}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 font-mono"
                  placeholder="[-]"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Processing Animation</label>
              <select
                value={style.payload.decorations.processingAnimation}
                onChange={(e) =>
                  patchPayload(
                    'decorations/processingAnimation',
                    e.target.value as CopilotStylePayload['decorations']['processingAnimation']
                  )
                }
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                disabled={loading}
              >
                {ANIMATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* === TYPOGRAPHY === */}
        <InspectorSection title="Typography" collapsible defaultCollapsed={true}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Font Size (px)</label>
              <input
                type="number"
                value={style.payload.typography.fontSize}
                onChange={(e) => patchPayload('typography/fontSize', parseInt(e.target.value) || 12)}
                className="w-24 px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                min={8}
                max={24}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Line Height</label>
              <input
                type="number"
                step="0.1"
                value={style.payload.typography.lineHeight}
                onChange={(e) => patchPayload('typography/lineHeight', parseFloat(e.target.value) || 1.5)}
                className="w-24 px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                min={1}
                max={3}
                disabled={loading}
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={style.payload.typography.uppercaseLabels}
                onChange={(e) => patchPayload('typography/uppercaseLabels', e.target.checked)}
                className="w-5 h-5 rounded accent-[var(--neon-cyan)]"
                disabled={loading}
              />
              <span className="text-sm text-[var(--glass-text-primary)]">Uppercase labels</span>
            </label>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* === BEHAVIOR === */}
        <InspectorSection title="Behavior" collapsible defaultCollapsed={true}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Max Messages</label>
              <input
                type="number"
                value={style.payload.maxDisplayMessages}
                onChange={(e) => patchPayload('maxDisplayMessages', parseInt(e.target.value) || 5)}
                className="w-24 px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                min={1}
                max={20}
                disabled={loading}
              />
              <p className="text-xs text-[var(--glass-text-muted)] mt-1">
                Number of messages shown in history
              </p>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={style.payload.autoFocusInput}
                onChange={(e) => patchPayload('autoFocusInput', e.target.checked)}
                className="w-5 h-5 rounded accent-[var(--neon-cyan)]"
                disabled={loading}
              />
              <div>
                <span className="text-sm text-[var(--glass-text-primary)]">Auto-focus input</span>
                <p className="text-xs text-[var(--glass-text-muted)]">Focus input after each response</p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={style.payload.showSuggestionButtons}
                onChange={(e) => patchPayload('showSuggestionButtons', e.target.checked)}
                className="w-5 h-5 rounded accent-[var(--neon-cyan)]"
                disabled={loading}
              />
              <div>
                <span className="text-sm text-[var(--glass-text-primary)]">Show suggestions</span>
                <p className="text-xs text-[var(--glass-text-muted)]">Display clickable suggestion buttons</p>
              </div>
            </label>
          </div>
        </InspectorSection>

        {/* === CUSTOM COLORS (only if custom preset) === */}
        {preset === 'custom' && (
          <>
            <InspectorDivider />
            <InspectorSection title="Custom Colors" collapsible defaultCollapsed={false}>
              <div className="space-y-3">
                {Object.entries(style.payload.colors).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-3">
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => patchPayload(`colors/${key}`, e.target.value)}
                      className="w-8 h-8 rounded border border-[var(--glass-border)] cursor-pointer"
                      disabled={loading}
                    />
                    <div className="flex-1">
                      <span className="text-sm text-[var(--glass-text-primary)] capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <code className="ml-2 text-xs text-[var(--glass-text-muted)]">{value}</code>
                    </div>
                  </div>
                ))}
              </div>
            </InspectorSection>
          </>
        )}

        <InspectorDivider />

        {/* === CHANGELOG (if exists) === */}
        {style.payload.changelog && (
          <>
            <InspectorSection title="Version Notes" collapsible defaultCollapsed={true}>
              <p className="text-sm text-[var(--glass-text-secondary)]">
                {style.payload.changelog}
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
                {new Date(style.meta.createdAt).toLocaleDateString()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--glass-text-muted)]">Updated</dt>
              <dd className="text-[var(--glass-text-secondary)]">
                {new Date(style.meta.updatedAt).toLocaleDateString()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--glass-text-muted)]">ID</dt>
              <dd className="text-[var(--glass-text-muted)] font-mono text-xs truncate max-w-[200px]">
                {style.meta.id}
              </dd>
            </div>
          </dl>
        </InspectorSection>
      </div>

      {/* =======================================================================
          FOOTER ACTIONS - Differentiated by status (SINGLETON PATTERN)
          ======================================================================= */}
      <div className="flex-shrink-0 p-4 border-t border-[var(--glass-border)] bg-[var(--glass-panel)]">
        <div className="flex flex-col gap-3">

          {/* === ACTIVE STYLE: Status button or Save/Discard === */}
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
                  onClick={handleSaveWithVersion}
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
              // Saved mode: Show "Active Style" status button
              <div
                className="w-full px-4 py-2.5 rounded-lg bg-green-600/90 text-white text-center
                           flex items-center justify-center gap-2 cursor-default"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                </span>
                <span className="font-medium">Active Style</span>
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
              title={hasChanges ? 'Save changes before activating' : 'Make this the active style'}
            >
              <span className="material-symbols-outlined text-lg mr-2">
                {activating ? 'hourglass_empty' : 'rocket_launch'}
              </span>
              {activating ? 'Activating...' : 'Activate This Style'}
            </GlassButton>
          )}

          {/* === DRAFT: Save changes row === */}
          {isDraft && (
            <div className="flex items-center gap-2">
              <GlassButton
                onClick={handleSaveWithVersion}
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
                title="Create a new draft from this archived style"
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

export default CopilotStyleEditor;
