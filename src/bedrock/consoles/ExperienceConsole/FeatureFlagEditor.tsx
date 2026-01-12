// src/bedrock/consoles/ExperienceConsole/FeatureFlagEditor.tsx
// Editor component for Feature Flags
// Sprint: feature-flags-v1
//
// IMPORTANT: This editor uses BufferedInput/BufferedTextarea for all text fields.
// This prevents the inspector input race condition where rapid typing loses characters.

import React, { useCallback, useState } from 'react';
import type { ObjectEditorProps } from '../../patterns/console-factory.types';
import type { FeatureFlagPayload, FeatureFlagCategory } from '@core/schema/feature-flag';
import type { PatchOperation } from '../../types/copilot.types';
import { InspectorSection, InspectorDivider } from '../../primitives/BedrockInspector';
import { GlassButton } from '../../primitives/GlassButton';
import { BufferedInput, BufferedTextarea } from '../../primitives/BufferedInput';
import { useFeatureFlagsData } from './useFeatureFlagsData';

// Category options for dropdown
const CATEGORY_OPTIONS: { value: FeatureFlagCategory; label: string; description: string }[] = [
  { value: 'experience', label: 'Experience', description: 'User-facing experience features' },
  { value: 'research', label: 'Research', description: 'Research and sprout-related features' },
  { value: 'experimental', label: 'Experimental', description: 'Beta features in testing' },
  { value: 'internal', label: 'Internal', description: 'Developer and admin features' },
];

/**
 * Editor component for FeatureFlag objects
 */
export function FeatureFlagEditor({
  object: flag,
  onEdit,
  onSave,
  onDelete,
  onDuplicate,
  loading,
  hasChanges,
}: ObjectEditorProps<FeatureFlagPayload>) {
  const { toggleAvailability } = useFeatureFlagsData();
  const [toggling, setToggling] = useState(false);

  const isAvailable = flag.payload.available;
  const isDefaultEnabled = flag.payload.defaultEnabled;

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

  // Toggle availability with changelog entry
  const handleToggleAvailability = useCallback(async () => {
    setToggling(true);
    try {
      await toggleAvailability(flag.meta.id, 'Toggled via Experience Console');
    } catch (error) {
      console.error('[FeatureFlagEditor] Toggle failed:', error);
    } finally {
      setToggling(false);
    }
  }, [flag.meta.id, toggleAvailability]);

  return (
    <div className="flex flex-col h-full">
      {/* Header section */}
      <div className="px-4 py-3 border-b border-[var(--glass-border)]">
        {/* Availability status */}
        <div className={`
          flex items-center gap-2 px-3 py-2 rounded-lg mb-3
          ${isAvailable
            ? 'bg-green-500/10 border border-green-500/30'
            : 'bg-red-500/10 border border-red-500/30'
          }
        `}>
          <span className={`material-symbols-outlined ${
            isAvailable ? 'text-green-400' : 'text-red-400'
          }`}>
            {isAvailable ? 'toggle_on' : 'toggle_off'}
          </span>
          <span className={`font-medium ${
            isAvailable ? 'text-green-400' : 'text-red-400'
          }`}>
            {isAvailable ? 'Available' : 'Disabled (Admin Kill Switch)'}
          </span>
          <div className="flex-1" />
          <GlassButton
            size="sm"
            variant={isAvailable ? 'danger' : 'success'}
            onClick={handleToggleAvailability}
            disabled={toggling}
          >
            {toggling ? 'Toggling...' : isAvailable ? 'Disable' : 'Enable'}
          </GlassButton>
        </div>

        {/* Title */}
        <BufferedInput
          value={flag.meta.title}
          onChange={(val) => patchMeta('title', val)}
          className="text-lg font-medium w-full bg-transparent border-none focus:outline-none text-[var(--glass-text-primary)]"
          placeholder="Flag Title"
        />

        {/* Flag ID (read-only) */}
        <div className="flex items-center gap-2 mt-2 text-sm text-[var(--glass-text-muted)]">
          <span className="material-symbols-outlined text-sm">key</span>
          <code className="font-mono">{flag.payload.flagId}</code>
          <span className="text-xs">(immutable)</span>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {/* Description */}
        <InspectorSection title="Description" icon="description">
          <BufferedTextarea
            value={flag.meta.description || ''}
            onChange={(val) => patchMeta('description', val)}
            className="w-full bg-[var(--glass-solid)] rounded-lg p-3 text-sm border border-[var(--glass-border)] focus:border-[var(--neon-cyan)] focus:outline-none text-[var(--glass-text-secondary)]"
            placeholder="What does this flag control?"
            rows={3}
          />
        </InspectorSection>

        <InspectorDivider />

        {/* Default State */}
        <InspectorSection title="Default State" icon="tune">
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={isDefaultEnabled}
                onChange={(e) => patchPayload('defaultEnabled', e.target.checked)}
                className="w-5 h-5 rounded accent-[var(--neon-cyan)]"
              />
              <div>
                <span className="text-sm text-[var(--glass-text-primary)]">
                  Enabled by default
                </span>
                <p className="text-xs text-[var(--glass-text-muted)]">
                  Feature is on for users who haven't set a preference
                </p>
              </div>
            </label>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* Header Display */}
        <InspectorSection title="Explore Header" icon="visibility">
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={flag.payload.showInExploreHeader}
                onChange={(e) => patchPayload('showInExploreHeader', e.target.checked)}
                className="w-5 h-5 rounded accent-[var(--neon-cyan)]"
              />
              <div>
                <span className="text-sm text-[var(--glass-text-primary)]">
                  Show in Explore header
                </span>
                <p className="text-xs text-[var(--glass-text-muted)]">
                  Users can toggle this flag from the /explore page header
                </p>
              </div>
            </label>

            {flag.payload.showInExploreHeader && (
              <div className="pl-8 space-y-3">
                <div>
                  <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                    Header Label
                  </label>
                  <BufferedInput
                    value={flag.payload.headerLabel || ''}
                    onChange={(val) => patchPayload('headerLabel', val || null)}
                    className="w-full bg-[var(--glass-solid)] rounded-lg px-3 py-2 text-sm border border-[var(--glass-border)] focus:border-[var(--neon-cyan)] focus:outline-none"
                    placeholder="Toggle label in header"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                    Header Order
                  </label>
                  <input
                    type="number"
                    value={flag.payload.headerOrder}
                    onChange={(e) => patchPayload('headerOrder', parseInt(e.target.value) || 0)}
                    className="w-24 bg-[var(--glass-solid)] rounded-lg px-3 py-2 text-sm border border-[var(--glass-border)] focus:border-[var(--neon-cyan)] focus:outline-none"
                    min={0}
                  />
                  <p className="text-xs text-[var(--glass-text-muted)] mt-1">
                    Lower numbers appear first (left)
                  </p>
                </div>
              </div>
            )}
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* Category */}
        <InspectorSection title="Category" icon="category">
          <select
            value={flag.payload.category}
            onChange={(e) => patchPayload('category', e.target.value)}
            className="w-full bg-[var(--glass-solid)] rounded-lg px-3 py-2 text-sm border border-[var(--glass-border)] focus:border-[var(--neon-cyan)] focus:outline-none"
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label} - {opt.description}
              </option>
            ))}
          </select>
        </InspectorSection>

        <InspectorDivider />

        {/* Changelog */}
        {flag.payload.changelog.length > 0 && (
          <InspectorSection title="Availability History" icon="history">
            <div className="space-y-2 max-h-40 overflow-auto">
              {flag.payload.changelog.slice().reverse().map((entry, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-xs text-[var(--glass-text-muted)] bg-[var(--glass-solid)] rounded p-2"
                >
                  <span className={`material-symbols-outlined text-sm ${
                    entry.newValue ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {entry.newValue ? 'toggle_on' : 'toggle_off'}
                  </span>
                  <div>
                    <span className={entry.newValue ? 'text-green-400' : 'text-red-400'}>
                      {entry.newValue ? 'Enabled' : 'Disabled'}
                    </span>
                    <span className="text-[var(--glass-text-muted)]">
                      {' '}on {new Date(entry.timestamp).toLocaleDateString()}
                    </span>
                    {entry.reason && (
                      <p className="mt-1 text-[var(--glass-text-secondary)]">
                        {entry.reason}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </InspectorSection>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-4 py-3 border-t border-[var(--glass-border)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={onDuplicate}
            disabled={loading}
          >
            <span className="material-symbols-outlined text-sm mr-1">content_copy</span>
            Duplicate
          </GlassButton>
          <GlassButton
            variant="danger"
            size="sm"
            onClick={onDelete}
            disabled={loading}
          >
            <span className="material-symbols-outlined text-sm mr-1">delete</span>
            Delete
          </GlassButton>
        </div>
        <GlassButton
          variant="primary"
          size="sm"
          onClick={onSave}
          disabled={!hasChanges || loading}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </GlassButton>
      </div>
    </div>
  );
}

export default FeatureFlagEditor;
