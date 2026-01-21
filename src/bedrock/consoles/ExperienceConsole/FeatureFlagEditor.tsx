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
      {/* Availability Status Banner (matches SystemPromptEditor pattern) */}
      <div
        className="flex items-center gap-3 px-4 py-3 border-b transition-colors"
        style={isAvailable
          ? { backgroundColor: 'var(--semantic-success-bg)', borderColor: 'var(--semantic-success-border)' }
          : { backgroundColor: 'var(--semantic-error-bg)', borderColor: 'var(--semantic-error-border)' }
        }
      >
        {/* Status dot with pulse animation when available */}
        <span className="relative flex h-3 w-3">
          {isAvailable && (
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: 'var(--semantic-success)' }}
            />
          )}
          <span
            className="relative inline-flex rounded-full h-3 w-3"
            style={{ backgroundColor: isAvailable ? 'var(--semantic-success)' : 'var(--semantic-error)' }}
          />
        </span>

        {/* Status text */}
        <div className="flex-1">
          <span
            className="text-sm font-medium"
            style={{ color: isAvailable ? 'var(--semantic-success)' : 'var(--semantic-error)' }}
          >
            {isAvailable ? 'Available' : 'Disabled (Admin Kill Switch)'}
          </span>
          <p
            className="text-xs opacity-70"
            style={{ color: isAvailable ? 'var(--semantic-success)' : 'var(--semantic-error)' }}
          >
            {isAvailable ? 'Flag is active and can be toggled by users' : 'Flag is disabled for all users'}
          </p>
        </div>

        {/* Toggle button */}
        <GlassButton
          size="sm"
          variant={isAvailable ? 'danger' : 'success'}
          onClick={handleToggleAvailability}
          disabled={toggling}
        >
          {toggling ? 'Toggling...' : isAvailable ? 'Disable' : 'Enable'}
        </GlassButton>
      </div>

      {/* Header: Icon + Title + Status Dot */}
      <div className="px-4 py-3 border-b border-[var(--glass-border)]">
        {/* Title row with icon and status */}
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-2xl text-[var(--neon-cyan)]">
            flag
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-[var(--glass-text-primary)] truncate">
              {flag.meta.title || 'Untitled Flag'}
            </h1>
            {/* Flag ID (read-only, mono) */}
            <div className="flex items-center gap-2 mt-1">
              <code className="font-mono text-sm text-[var(--glass-text-muted)]">
                {flag.payload.flagId}
              </code>
            </div>
          </div>
          {/* Default state indicator */}
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium"
            style={isDefaultEnabled
              ? { backgroundColor: 'var(--semantic-success-bg)', color: 'var(--semantic-success)' }
              : { backgroundColor: 'var(--glass-panel)', color: 'var(--glass-text-muted)' }
            }
          >
            <span className="material-symbols-outlined text-sm">
              {isDefaultEnabled ? 'check_circle' : 'cancel'}
            </span>
            {isDefaultEnabled ? 'On' : 'Off'}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* === IDENTITY (Configuration - expanded by default) === */}
        <InspectorSection title="Identity" collapsible defaultCollapsed={false}>
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Title</label>
              <BufferedInput
                value={flag.meta.title}
                onChange={(val) => patchMeta('title', val)}
                debounceMs={400}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                placeholder="Flag Title"
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Description</label>
              <BufferedTextarea
                value={flag.meta.description || ''}
                onChange={(val) => patchMeta('description', val)}
                debounceMs={400}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 resize-none"
                placeholder="What does this flag control?"
                rows={3}
                disabled={loading}
              />
            </div>

            {/* Flag ID badge (read-only) */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--glass-text-muted)]">Flag ID</span>
              <code className="px-2 py-0.5 rounded-full bg-[var(--glass-surface)] text-sm font-mono text-[var(--glass-text-secondary)]">
                {flag.payload.flagId}
              </code>
              <span className="text-xs text-[var(--glass-text-muted)]">(immutable)</span>
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* === CONFIGURATION (expanded by default) === */}
        <InspectorSection title="Default State" collapsible defaultCollapsed={false}>
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

        {/* === VISIBILITY (collapsed by default) === */}
        <InspectorSection title="Explore Header" collapsible defaultCollapsed={true}>
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

        {/* === METADATA (collapsed by default) === */}
        <InspectorSection title="Category" collapsible defaultCollapsed={true}>
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

        {/* === A/B TESTING CONFIGURATION (collapsed by default) === */}
        <InspectorSection
          title="A/B Testing Configuration"
          subtitle="Configure model variants for testing"
          collapsible
          defaultCollapsed={true}
        >
          <div className="space-y-3">
            {/* Deterministic Assignment Toggle */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={flag.payload.deterministicAssignment ?? true}
                onChange={(e) => patchPayload('deterministicAssignment', e.target.checked)}
                className="w-5 h-5 rounded accent-[var(--neon-cyan)]"
              />
              <div>
                <span className="text-sm text-[var(--glass-text-primary)]">
                  Deterministic Assignment
                </span>
                <p className="text-xs text-[var(--glass-text-muted)]">
                  Users get consistent variant assignments
                </p>
              </div>
            </label>

            {/* Assignment Seed */}
            {flag.payload.deterministicAssignment && (
              <div className="pl-8">
                <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                  Assignment Seed
                </label>
                <BufferedInput
                  value={flag.payload.assignmentSeed || ''}
                  onChange={(val) => patchPayload('assignmentSeed', val || undefined)}
                  className="w-full bg-[var(--glass-solid)] rounded-lg px-3 py-2 text-sm border border-[var(--glass-border)] focus:border-[var(--neon-cyan)] focus:outline-none"
                  placeholder="Optional seed for reproducible assignments"
                />
              </div>
            )}

            {/* Model Variants Info */}
            <div className="p-3 bg-[var(--glass-elevated)] border border-[var(--glass-border)] rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-[var(--glass-text-primary)]">
                  Model Variants
                </span>
                <span className="text-xs text-[var(--glass-text-muted)]">
                  {flag.payload.modelVariants?.length || 0} variants
                </span>
              </div>

              {flag.payload.modelVariants && flag.payload.modelVariants.length > 0 ? (
                <div className="space-y-2">
                  {flag.payload.modelVariants.map((variant, idx) => (
                    <div
                      key={variant.variantId}
                      className="p-2 bg-[var(--glass-solid)] rounded border border-[var(--glass-border)]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[var(--glass-text-primary)]">
                          {variant.name}
                        </span>
                        <span className="text-xs text-[var(--glass-text-muted)]">
                          {variant.trafficAllocation}%
                        </span>
                      </div>
                      {variant.description && (
                        <p className="text-xs text-[var(--glass-text-muted)] mt-1">
                          {variant.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--glass-text-muted)] italic">
                  No variants configured
                </p>
              )}

              <GlassButton
                size="sm"
                variant="secondary"
                onClick={() => {
                  // TODO: Implement variant editor modal
                  console.log('Open variant editor');
                }}
                className="w-full mt-3"
              >
                <span className="material-symbols-outlined text-sm mr-1">add</span>
                Manage Variants
              </GlassButton>
            </div>

            {/* Performance Metrics */}
            {flag.payload.variantPerformance && Object.keys(flag.payload.variantPerformance).length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-[var(--glass-text-primary)] mb-2">
                  Performance Metrics
                </h4>
                <div className="space-y-2">
                  {Object.entries(flag.payload.variantPerformance).map(([variantId, metrics]) => (
                    <div
                      key={variantId}
                      className="p-3 bg-[var(--glass-elevated)] border border-[var(--glass-border)] rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-[var(--glass-text-primary)]">
                          {variantId}
                        </span>
                        <span className="text-xs text-[var(--glass-text-muted)]">
                          {metrics.conversionRate > 0 ? `${(metrics.conversionRate * 100).toFixed(1)}% CR` : 'No data'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-[var(--glass-text-muted)]">Impressions:</span>
                          <span className="ml-1 text-[var(--glass-text-secondary)]">{metrics.impressions}</span>
                        </div>
                        <div>
                          <span className="text-[var(--glass-text-muted)]">Conversions:</span>
                          <span className="ml-1 text-[var(--glass-text-secondary)]">{metrics.conversions}</span>
                        </div>
                        <div>
                          <span className="text-[var(--glass-text-muted)]">Engagement:</span>
                          <span className="ml-1 text-[var(--glass-text-secondary)]">
                            {metrics.avgEngagementTime > 0 ? `${(metrics.avgEngagementTime / 1000).toFixed(1)}s` : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* === HISTORY (collapsed by default) === */}
        {flag.payload.changelog.length > 0 && (
          <InspectorSection title="Availability History" collapsible defaultCollapsed={true}>
            <div className="space-y-2 max-h-40 overflow-auto">
              {flag.payload.changelog.slice().reverse().map((entry, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-xs text-[var(--glass-text-muted)] bg-[var(--glass-solid)] rounded p-2"
                >
                  <span
                    className="material-symbols-outlined text-sm"
                    style={{ color: entry.newValue ? 'var(--semantic-success)' : 'var(--semantic-error)' }}
                  >
                    {entry.newValue ? 'toggle_on' : 'toggle_off'}
                  </span>
                  <div>
                    <span style={{ color: entry.newValue ? 'var(--semantic-success)' : 'var(--semantic-error)' }}>
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

      {/* Footer actions (standardized layout) */}
      <div className="px-4 py-3 border-t border-[var(--glass-border)] space-y-3">
        {/* Primary action: Save (full width) */}
        {hasChanges ? (
          <GlassButton
            variant="primary"
            size="sm"
            onClick={onSave}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </GlassButton>
        ) : (
          <div className="w-full px-4 py-2.5 rounded-lg bg-[var(--glass-surface)] text-[var(--glass-text-muted)] text-center text-sm">
            No unsaved changes
          </div>
        )}

        {/* Secondary actions */}
        <div className="flex items-center gap-2">
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={onDuplicate}
            disabled={loading}
            className="flex-1"
          >
            <span className="material-symbols-outlined text-sm mr-1">content_copy</span>
            Duplicate
          </GlassButton>
          <GlassButton
            variant="danger"
            size="sm"
            onClick={onDelete}
            disabled={loading}
            className="flex-1"
          >
            <span className="material-symbols-outlined text-sm mr-1">delete</span>
            Delete
          </GlassButton>
        </div>
      </div>
    </div>
  );
}

export default FeatureFlagEditor;
