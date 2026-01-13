// src/bedrock/consoles/ExperienceConsole/ResearchAgentConfigEditor.tsx
// Editor component for Research Agent Config
// Sprint: experience-console-cleanup-v1
//
// IMPORTANT: This editor uses BufferedInput for text fields.
// This prevents the inspector input race condition where rapid typing loses characters.

import React, { useCallback } from 'react';
import type { ObjectEditorProps } from '../../patterns/console-factory.types';
import type { ResearchAgentConfigPayload } from '@core/schema/research-agent-config';
import type { PatchOperation } from '../../types/copilot.types';
import { InspectorSection, InspectorDivider } from '../../primitives/BedrockInspector';
import { GlassButton } from '../../primitives/GlassButton';
import { BufferedInput, BufferedTextarea } from '../../primitives/BufferedInput';

// Source type options
const SOURCE_OPTIONS = [
  { value: 'academic', label: 'Academic', description: 'Peer-reviewed papers and journals' },
  { value: 'practitioner', label: 'Practitioner', description: 'Industry blogs and case studies' },
  { value: 'news', label: 'News', description: 'News articles and press releases' },
  { value: 'primary', label: 'Primary', description: 'Official documentation and specs' },
] as const;

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
}: ObjectEditorProps<ResearchAgentConfigPayload>) {
  const isActive = config.meta.status === 'active';
  const { searchDepth, sourcePreferences, confidenceThreshold, maxApiCalls, branchDelay } = config.payload;

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

  // Toggle source preference
  const toggleSource = useCallback(
    (source: string) => {
      const newPrefs = sourcePreferences.includes(source as any)
        ? sourcePreferences.filter((s) => s !== source)
        : [...sourcePreferences, source as any];
      patchPayload('sourcePreferences', newPrefs);
    },
    [sourcePreferences, patchPayload]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Status Banner */}
      <div className={`
        flex items-center gap-3 px-4 py-3 border-b transition-colors
        ${isActive
          ? 'bg-purple-500/10 border-purple-500/20'
          : 'bg-slate-500/10 border-slate-500/20'
        }
      `}>
        <span className="relative flex h-3 w-3">
          {isActive && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
          )}
          <span className={`
            relative inline-flex rounded-full h-3 w-3
            ${isActive ? 'bg-purple-500' : 'bg-slate-500'}
          `} />
        </span>
        <div className="flex-1">
          <span className={`text-sm font-medium ${isActive ? 'text-purple-300' : 'text-slate-300'}`}>
            {isActive ? 'Active Configuration' : 'Draft Configuration'}
          </span>
          <p className={`text-xs ${isActive ? 'text-purple-400/70' : 'text-slate-400/70'}`}>
            SINGLETON: Only one Research Agent config can be active
          </p>
        </div>
      </div>

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
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* Search Settings */}
        <InspectorSection title="Search Settings" collapsible defaultCollapsed={false}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Search Depth (branches per query)
              </label>
              <input
                type="range"
                min={1}
                max={10}
                value={searchDepth}
                onChange={(e) => patchPayload('searchDepth', parseInt(e.target.value))}
                className="w-full accent-purple-500"
              />
              <div className="flex justify-between text-xs text-[var(--glass-text-muted)] mt-1">
                <span>1 (shallow)</span>
                <span className="text-purple-400 font-medium">{searchDepth}</span>
                <span>10 (deep)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Max API Calls (budget limit)
              </label>
              <input
                type="range"
                min={1}
                max={50}
                value={maxApiCalls}
                onChange={(e) => patchPayload('maxApiCalls', parseInt(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-xs text-[var(--glass-text-muted)] mt-1">
                <span>1</span>
                <span className="text-blue-400 font-medium">{maxApiCalls} calls</span>
                <span>50</span>
              </div>
            </div>

            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Branch Delay (ms between searches)
              </label>
              <input
                type="number"
                min={0}
                max={5000}
                step={100}
                value={branchDelay}
                onChange={(e) => patchPayload('branchDelay', parseInt(e.target.value) || 0)}
                className="w-24 bg-[var(--glass-solid)] rounded-lg px-3 py-2 text-sm border border-[var(--glass-border)] focus:border-purple-500 focus:outline-none"
              />
              <p className="text-xs text-[var(--glass-text-muted)] mt-1">
                Rate limiting delay between API calls
              </p>
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* Source Preferences */}
        <InspectorSection title="Source Preferences" collapsible defaultCollapsed={false}>
          <div className="space-y-2">
            {SOURCE_OPTIONS.map((source) => (
              <label
                key={source.value}
                className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-[var(--glass-surface)] transition-colors"
              >
                <input
                  type="checkbox"
                  checked={sourcePreferences.includes(source.value as any)}
                  onChange={() => toggleSource(source.value)}
                  className="w-5 h-5 rounded accent-purple-500"
                />
                <div>
                  <span className="text-sm text-[var(--glass-text-primary)]">
                    {source.label}
                  </span>
                  <p className="text-xs text-[var(--glass-text-muted)]">
                    {source.description}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* Quality Settings */}
        <InspectorSection title="Quality Threshold" collapsible defaultCollapsed={true}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Minimum Confidence Score
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(confidenceThreshold * 100)}
                onChange={(e) => patchPayload('confidenceThreshold', parseInt(e.target.value) / 100)}
                className="w-full accent-emerald-500"
              />
              <div className="flex justify-between text-xs text-[var(--glass-text-muted)] mt-1">
                <span>0% (include all)</span>
                <span className="text-emerald-400 font-medium">{Math.round(confidenceThreshold * 100)}%</span>
                <span>100% (high only)</span>
              </div>
              <p className="text-xs text-[var(--glass-text-muted)] mt-2">
                Evidence below this threshold will be excluded from results
              </p>
            </div>
          </div>
        </InspectorSection>
      </div>

      {/* Footer actions */}
      <div className="px-4 py-3 border-t border-[var(--glass-border)] space-y-3">
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

export default ResearchAgentConfigEditor;
