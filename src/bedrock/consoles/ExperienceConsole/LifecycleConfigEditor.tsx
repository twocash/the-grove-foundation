// src/bedrock/consoles/ExperienceConsole/LifecycleConfigEditor.tsx
// Editor component for Lifecycle Config
// Sprint: S5-SL-LifecycleEngine v1
//
// SINGLETON pattern with versioning support
// IMPORTANT: This editor uses BufferedInput for text fields.

import React, { useCallback, useState, useRef, useEffect } from 'react';
import type { ObjectEditorProps } from '../../patterns/console-factory.types';
import type { LifecycleConfigPayload, TierDefinition } from '@core/schema/lifecycle-config';
import type { PatchOperation } from '../../types/copilot.types';
import { InspectorSection, InspectorDivider } from '../../primitives/BedrockInspector';
import { GlassButton } from '../../primitives/GlassButton';
import { BufferedInput, BufferedTextarea } from '../../primitives/BufferedInput';
import { useLifecycleConfigData } from './useLifecycleConfigData';

/**
 * Editor component for LifecycleConfig objects
 * SINGLETON type - typically only one active config exists
 */
export function LifecycleConfigEditor({
  object: config,
  onEdit,
  onSave,
  onDelete,
  onDuplicate,
  loading,
  hasChanges,
  onSelectObject,
}: ObjectEditorProps<LifecycleConfigPayload>) {
  // Get functions from data hook
  const { activate, activeConfig, update, saveAndActivate } = useLifecycleConfigData();
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
        payload: JSON.parse(JSON.stringify(config.payload)), // Deep clone for payload
      };
      // Reset modification tracking for new selection
      setModifiedFields(new Set());
    }
  }, [config.meta.id, hasChanges]);

  const { activeModelId, models } = config.payload;
  const activeModel = models.find((m) => m.id === activeModelId);

  // Handle activation
  const handleActivate = useCallback(async () => {
    setActivating(true);
    try {
      await activate(config.meta.id);
      // Optimistic UI: show as active immediately
      setJustActivated(true);
      console.log('[LifecycleConfigEditor] Activation successful');
    } catch (error) {
      console.error('[LifecycleConfigEditor] Activation failed:', error);
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
        const pendingChanges: Partial<LifecycleConfigPayload> = {};

        // Extract current values for modified fields
        modifiedFields.forEach(fieldName => {
          const key = fieldName as keyof LifecycleConfigPayload;
          if (key in config.payload) {
            (pendingChanges as Record<string, unknown>)[key] = config.payload[key];
          }
        });

        console.log('[LifecycleConfigEditor] Creating version with changes:',
          Object.keys(pendingChanges));

        const newConfig = await saveAndActivate(config, pendingChanges);
        setModifiedFields(new Set()); // Reset tracking
        onSave(); // Clear hasChanges flag

        // Switch inspector to the newly created config
        if (onSelectObject && newConfig) {
          console.log('[LifecycleConfigEditor] Switching to new version:', newConfig.meta.id);
          onSelectObject(newConfig.meta.id);
        }
      } else {
        // Draft/archived or no changes: use regular save
        onSave();
      }
    } catch (error) {
      console.error('[LifecycleConfigEditor] Save failed:', error);
    } finally {
      setSaving(false);
    }
  }, [onSave, isActive, modifiedFields, config, saveAndActivate, onSelectObject]);

  // Handle discard - restore original snapshot
  const handleDiscard = useCallback(async () => {
    if (!originalSnapshotRef.current) {
      console.warn('[LifecycleConfigEditor] No snapshot to restore');
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
      console.error('[LifecycleConfigEditor] Discard failed:', error);
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

  // Update a tier's property
  const updateTier = useCallback(
    (tierId: string, field: keyof TierDefinition, value: string | number) => {
      if (!activeModel) return;

      const updatedModels = models.map((model) => {
        if (model.id !== activeModelId) return model;
        return {
          ...model,
          tiers: model.tiers.map((tier) =>
            tier.id === tierId ? { ...tier, [field]: value } : tier
          ),
        };
      });

      patchPayload('models', updatedModels);
    },
    [activeModel, models, activeModelId, patchPayload]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Active Status Indicator */}
      {isActive && (
        <div className={`
          flex items-center gap-3 px-4 py-3 border-b transition-colors
          ${hasChanges
            ? 'bg-amber-500/10 border-amber-500/30'
            : 'bg-lime-500/10 border-lime-500/20'
          }
        `}>
          <span className="relative flex h-3 w-3">
            {!hasChanges && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75" />
            )}
            <span className={`
              relative inline-flex rounded-full h-3 w-3
              ${hasChanges ? 'bg-amber-500' : 'bg-lime-500'}
            `} />
          </span>
          <div className="flex-1">
            <span className={`text-sm font-medium ${hasChanges ? 'text-amber-300' : 'text-lime-300'}`}>
              {hasChanges ? 'Active Configuration (editing...)' : 'Active Configuration'}
            </span>
            <p className={`text-xs ${hasChanges ? 'text-amber-400/70' : 'text-lime-400/70'}`}>
              {hasChanges
                ? 'Changes pending — save or discard below'
                : 'SINGLETON: Only one Lifecycle config can be active'
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
            Draft — {activeConfig
              ? `Active: "${activeConfig.meta.title}"`
              : 'No active config set'}
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

      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-2xl text-lime-400">
            timeline
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-[var(--glass-text-primary)] truncate">
              {config.meta.title || 'Lifecycle Configuration'}
            </h1>
            <p className="text-xs text-[var(--glass-text-muted)]">
              Configure tier labels and stage mappings
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
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-lime-500/50"
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
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-lime-500/50 resize-none"
                placeholder="What does this config control?"
                rows={2}
                disabled={loading}
              />
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* Active Model Section */}
        <InspectorSection title="Active Model" collapsible defaultCollapsed={false}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Current Model</label>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--glass-surface)]">
                <span className="material-symbols-outlined text-lime-400">eco</span>
                <div className="flex-1">
                  <span className="text-sm text-[var(--glass-text-primary)]">
                    {activeModel?.name || 'Unknown'}
                  </span>
                  {activeModel?.isEditable === false && (
                    <span className="ml-2 text-xs text-[var(--glass-text-muted)]">(System)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Model selector if multiple models */}
            {models.length > 1 && (
              <div>
                <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                  Select Model
                </label>
                <select
                  value={activeModelId}
                  onChange={(e) => patchPayload('activeModelId', e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-lime-500/50"
                >
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} {model.isEditable === false ? '(System)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* Tier Definitions Section */}
        <InspectorSection title="Tier Definitions" collapsible defaultCollapsed={false}>
          <div className="space-y-3">
            {activeModel?.tiers.map((tier) => (
              <div
                key={tier.id}
                className="p-3 rounded-lg border border-[var(--glass-border)] bg-[var(--glass-surface)]"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{tier.emoji}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[var(--glass-text-primary)]">
                      {tier.label}
                    </div>
                    <div className="text-xs text-[var(--glass-text-muted)]">
                      ID: {tier.id} | Order: {tier.order}
                    </div>
                  </div>
                </div>

                {/* Edit tier (only for editable models) */}
                {activeModel.isEditable && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div>
                      <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Label</label>
                      <BufferedInput
                        value={tier.label}
                        onChange={(val) => updateTier(tier.id, 'label', val)}
                        debounceMs={400}
                        className="w-full px-2 py-1 text-sm rounded border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)]"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Emoji</label>
                      <BufferedInput
                        value={tier.emoji}
                        onChange={(val) => updateTier(tier.id, 'emoji', val)}
                        debounceMs={400}
                        className="w-full px-2 py-1 text-sm rounded border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] text-center"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Order</label>
                      <input
                        type="number"
                        value={tier.order}
                        onChange={(e) => updateTier(tier.id, 'order', parseInt(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-sm rounded border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)]"
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}

                {tier.description && (
                  <p className="text-xs text-[var(--glass-text-muted)] mt-2">
                    {tier.description}
                  </p>
                )}
              </div>
            ))}

            {!activeModel?.isEditable && (
              <p className="text-xs text-[var(--glass-text-muted)] italic">
                System model tiers cannot be edited. Duplicate to create an editable copy.
              </p>
            )}
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* Stage Mappings Section */}
        <InspectorSection title="Stage Mappings" collapsible defaultCollapsed={true}>
          <div className="space-y-2">
            {activeModel?.mappings.map((mapping, idx) => (
              <div
                key={`${mapping.stage}-${idx}`}
                className="flex items-center justify-between p-2 rounded-lg bg-[var(--glass-surface)]"
              >
                <span className="text-sm text-[var(--glass-text-secondary)] font-mono">
                  {mapping.stage}
                </span>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[var(--glass-text-muted)] text-sm">
                    arrow_forward
                  </span>
                  <span className="text-sm text-[var(--glass-text-primary)]">
                    {activeModel.tiers.find((t) => t.id === mapping.tierId)?.emoji ?? '?'}{' '}
                    {activeModel.tiers.find((t) => t.id === mapping.tierId)?.label ?? mapping.tierId}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </InspectorSection>

        <InspectorDivider />

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
                  className="flex-1 bg-lime-600 hover:bg-lime-500"
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
                className="w-full px-4 py-2.5 rounded-lg bg-lime-600/90 text-white text-center
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
              className="w-full bg-lime-600 hover:bg-lime-500"
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

export default LifecycleConfigEditor;
