// src/bedrock/consoles/ExperienceConsole/OutputTemplateEditor.tsx
// Editor component for Output Template with fork flow
// Sprint: prompt-template-architecture-v1
//
// Key behaviors:
// - System seeds: Read-only, show Fork button
// - User/forked: Editable, show Save/Delete
// - Draft: Show Publish button
// - Active: Show Archive button
//
// DEX: Provenance as Infrastructure - displays source tracking

import React, { useCallback, useState } from 'react';
import type { ObjectEditorProps } from '../../patterns/console-factory.types';
import type { OutputTemplatePayload, AgentType, CitationStyle, CitationFormat } from '@core/schema/output-template';
import type { PatchOperation } from '../../types/copilot.types';
import { InspectorSection, InspectorDivider } from '../../primitives/BedrockInspector';
import { GlassButton } from '../../primitives/GlassButton';
import { BufferedInput, BufferedTextarea } from '../../primitives/BufferedInput';
import { useOutputTemplateData } from './useOutputTemplateData';

// =============================================================================
// Configuration Options
// =============================================================================

const AGENT_TYPE_OPTIONS: Array<{ value: AgentType; label: string; icon: string; description: string }> = [
  { value: 'writer', label: 'Writer', icon: 'edit_note', description: 'Document generation' },
  { value: 'research', label: 'Research', icon: 'search', description: 'Information gathering' },
  { value: 'code', label: 'Code', icon: 'code', description: 'Code generation (future)' },
];

const CITATION_STYLE_OPTIONS: Array<{ value: CitationStyle; label: string }> = [
  { value: 'chicago', label: 'Chicago' },
  { value: 'apa', label: 'APA' },
  { value: 'mla', label: 'MLA' },
];

const CITATION_FORMAT_OPTIONS: Array<{ value: CitationFormat; label: string }> = [
  { value: 'endnotes', label: 'Endnotes' },
  { value: 'inline', label: 'Inline' },
];

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  'system-seed': { label: 'System Template', color: 'var(--glass-text-muted)' },
  'user-created': { label: 'User Created', color: 'var(--semantic-success)' },
  'forked': { label: 'Forked', color: 'var(--semantic-info)' },
  'imported': { label: 'Imported', color: 'var(--neon-violet)' },
};

// =============================================================================
// Component
// =============================================================================

export function OutputTemplateEditor({
  object: template,
  onEdit,
  onSave,
  onDelete,
  onDuplicate,
  loading,
  hasChanges,
  onSelectObject,
}: ObjectEditorProps<OutputTemplatePayload>) {
  const { fork, activate, archive, publish, objects } = useOutputTemplateData();

  const [forking, setForking] = useState(false);
  const [activating, setActivating] = useState(false);
  const [archiving, setArchiving] = useState(false);

  // Status checks
  const isSystemSeed = template.payload.source === 'system-seed';
  const isActive = template.payload.status === 'active';
  const isDraft = template.payload.status === 'draft';
  const isArchived = template.payload.status === 'archived';
  const isEditable = !isSystemSeed;

  // Get forked-from template info
  const forkedFrom = template.payload.forkedFromId
    ? objects.find(t => t.meta.id === template.payload.forkedFromId)
    : null;

  // =============================================================================
  // Handlers
  // =============================================================================

  const handleFork = useCallback(async () => {
    setForking(true);
    try {
      const forked = await fork(template.meta.id);
      console.log('[OutputTemplateEditor] Fork created:', forked.meta.id);
      // Select the newly forked template
      if (onSelectObject) {
        onSelectObject(forked.meta.id);
      }
    } catch (error) {
      console.error('[OutputTemplateEditor] Fork failed:', error);
    } finally {
      setForking(false);
    }
  }, [fork, template.meta.id, onSelectObject]);

  const handlePublish = useCallback(async () => {
    setActivating(true);
    try {
      await publish(template.meta.id);
      console.log('[OutputTemplateEditor] Published:', template.meta.id);
    } catch (error) {
      console.error('[OutputTemplateEditor] Publish failed:', error);
    } finally {
      setActivating(false);
    }
  }, [publish, template.meta.id]);

  const handleArchive = useCallback(async () => {
    setArchiving(true);
    try {
      await archive(template.meta.id);
      console.log('[OutputTemplateEditor] Archived:', template.meta.id);
    } catch (error) {
      console.error('[OutputTemplateEditor] Archive failed:', error);
    } finally {
      setArchiving(false);
    }
  }, [archive, template.meta.id]);

  // Patch helpers
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

  const patchConfig = useCallback(
    (field: string, value: unknown) => {
      const ops: PatchOperation[] = [
        { op: 'replace', path: `/payload/config/${field}`, value },
      ];
      onEdit(ops);
    },
    [onEdit]
  );

  // =============================================================================
  // Render
  // =============================================================================

  const sourceInfo = SOURCE_LABELS[template.payload.source] || SOURCE_LABELS['user-created'];

  return (
    <div className="flex flex-col h-full">
      {/* System Seed Banner */}
      {isSystemSeed && (
        <div
          className="flex items-center gap-3 px-4 py-3 border-b"
          style={{ backgroundColor: 'var(--semantic-info-bg)', borderColor: 'var(--semantic-info-border)' }}
        >
          <span className="material-symbols-outlined text-xl" style={{ color: 'var(--semantic-info)' }}>
            lock
          </span>
          <div className="flex-1">
            <span className="text-sm font-medium" style={{ color: 'var(--semantic-info)' }}>
              System Template (Read-Only)
            </span>
            <p className="text-xs opacity-70" style={{ color: 'var(--semantic-info)' }}>
              Fork this template to create your own customized version
            </p>
          </div>
          <GlassButton
            onClick={handleFork}
            variant="primary"
            size="sm"
            disabled={loading || forking}
            style={{ backgroundColor: 'var(--semantic-info)' }}
          >
            <span className="material-symbols-outlined text-lg mr-1">
              {forking ? 'hourglass_empty' : 'fork_right'}
            </span>
            {forking ? 'Forking...' : 'Fork to Customize'}
          </GlassButton>
        </div>
      )}

      {/* Status Banners */}
      {!isSystemSeed && isDraft && (
        <div
          className="flex items-center gap-2 px-4 py-2 border-b"
          style={{ backgroundColor: 'var(--semantic-warning-bg)', borderColor: 'var(--semantic-warning-border)' }}
        >
          <span className="material-symbols-outlined text-base" style={{ color: 'var(--semantic-warning)' }}>
            edit_note
          </span>
          <span className="text-sm" style={{ color: 'var(--semantic-warning)' }}>
            Draft — Not yet available for use
          </span>
        </div>
      )}

      {!isSystemSeed && isActive && (
        <div
          className="flex items-center gap-2 px-4 py-2 border-b"
          style={{ backgroundColor: 'var(--semantic-success-bg)', borderColor: 'var(--semantic-success-border)' }}
        >
          <span className="relative flex h-3 w-3">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ backgroundColor: 'var(--semantic-success)' }}
            />
            <span
              className="relative inline-flex rounded-full h-3 w-3"
              style={{ backgroundColor: 'var(--semantic-success)' }}
            />
          </span>
          <span className="text-sm" style={{ color: 'var(--semantic-success)' }}>
            Active — Available for selection
          </span>
        </div>
      )}

      {!isSystemSeed && isArchived && (
        <div
          className="flex items-center gap-2 px-4 py-2 border-b"
          style={{ backgroundColor: 'var(--glass-panel)', borderColor: 'var(--glass-border)' }}
        >
          <span className="material-symbols-outlined text-base" style={{ color: 'var(--glass-text-muted)' }}>
            archive
          </span>
          <span className="text-sm" style={{ color: 'var(--glass-text-secondary)' }}>
            Archived — Not available for use
          </span>
        </div>
      )}

      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-3">
          <span
            className="material-symbols-outlined text-2xl"
            style={{ color: template.payload.agentType === 'writer' ? 'var(--semantic-success)' : 'var(--neon-cyan)' }}
          >
            {template.meta.icon || (template.payload.agentType === 'writer' ? 'description' : 'search')}
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-[var(--glass-text-primary)] truncate">
              {template.payload.name || template.meta.title}
            </h1>
            <div className="flex items-center gap-2 text-xs">
              <span style={{ color: sourceInfo.color }}>{sourceInfo.label}</span>
              <span className="text-[var(--glass-text-muted)]">•</span>
              <span className="text-[var(--glass-text-muted)]">v{template.payload.version}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Basic Information */}
        <InspectorSection title="Basic Information" collapsible defaultCollapsed={false}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Name {isSystemSeed && <span className="material-symbols-outlined text-xs align-middle">lock</span>}
              </label>
              <BufferedInput
                value={template.payload.name}
                onChange={(val) => {
                  patchPayload('name', val);
                  patchMeta('title', val);
                }}
                debounceMs={400}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                placeholder="Template name"
                disabled={loading || isSystemSeed}
              />
            </div>

            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Description {isSystemSeed && <span className="material-symbols-outlined text-xs align-middle">lock</span>}
              </label>
              <BufferedTextarea
                value={template.payload.description || ''}
                onChange={(val) => {
                  patchPayload('description', val);
                  patchMeta('description', val);
                }}
                debounceMs={400}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 resize-none"
                placeholder="What does this template produce?"
                rows={2}
                disabled={loading || isSystemSeed}
              />
            </div>

            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-2">
                Agent Type {isSystemSeed && <span className="material-symbols-outlined text-xs align-middle">lock</span>}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {AGENT_TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => !isSystemSeed && patchPayload('agentType', opt.value)}
                    disabled={isSystemSeed}
                    className={`
                      p-2 rounded-lg border text-center transition-colors
                      ${template.payload.agentType === opt.value
                        ? 'border-[var(--neon-cyan)] bg-[var(--neon-cyan-bg)] text-[var(--neon-cyan)]'
                        : 'border-[var(--glass-border)] hover:border-[var(--glass-border-bright)]'
                      }
                      ${isSystemSeed ? 'opacity-60 cursor-not-allowed' : ''}
                    `}
                  >
                    <span className="material-symbols-outlined text-lg block mb-1">{opt.icon}</span>
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Category {isSystemSeed && <span className="material-symbols-outlined text-xs align-middle">lock</span>}
              </label>
              <BufferedInput
                value={template.payload.config.category || ''}
                onChange={(val) => patchConfig('category', val || undefined)}
                debounceMs={400}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                placeholder="e.g., technical, strategy, policy"
                disabled={loading || isSystemSeed}
              />
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* System Prompt - The main content */}
        <InspectorSection title="System Prompt" collapsible defaultCollapsed={false}>
          <div className="space-y-2">
            <p className="text-xs text-[var(--glass-text-muted)]">
              Instructions that control how the agent transforms research into output.
              {isSystemSeed && ' Fork this template to customize.'}
            </p>
            <BufferedTextarea
              value={template.payload.systemPrompt}
              onChange={(val) => patchPayload('systemPrompt', val)}
              debounceMs={400}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 font-mono"
              placeholder="Enter system prompt instructions..."
              rows={12}
              disabled={loading || isSystemSeed}
            />
          </div>
        </InspectorSection>

        {/* Citation Config (for writer templates) */}
        {template.payload.agentType === 'writer' && (
          <>
            <InspectorDivider />
            <InspectorSection title="Citation Settings" collapsible defaultCollapsed={true}>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-[var(--glass-text-muted)] mb-2">Citation Style</label>
                  <div className="flex gap-2">
                    {CITATION_STYLE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => !isSystemSeed && patchConfig('citationStyle', opt.value)}
                        disabled={isSystemSeed}
                        className={`
                          flex-1 p-2 rounded-lg border text-center transition-colors
                          ${template.payload.config.citationStyle === opt.value
                            ? 'border-[var(--neon-amber)] bg-[var(--neon-amber-bg)] text-[var(--neon-amber)]'
                            : 'border-[var(--glass-border)] hover:border-[var(--glass-border-bright)]'
                          }
                          ${isSystemSeed ? 'opacity-60 cursor-not-allowed' : ''}
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
                        onClick={() => !isSystemSeed && patchConfig('citationFormat', opt.value)}
                        disabled={isSystemSeed}
                        className={`
                          flex-1 p-2 rounded-lg border text-center transition-colors
                          ${template.payload.config.citationFormat === opt.value
                            ? 'border-[var(--neon-amber)] bg-[var(--neon-amber-bg)] text-[var(--neon-amber)]'
                            : 'border-[var(--glass-border)] hover:border-[var(--glass-border-bright)]'
                          }
                          ${isSystemSeed ? 'opacity-60 cursor-not-allowed' : ''}
                        `}
                      >
                        <span className="text-sm font-medium">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </InspectorSection>
          </>
        )}

        <InspectorDivider />

        {/* Provenance */}
        <InspectorSection title="Provenance" collapsible defaultCollapsed={true}>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--glass-text-muted)]">Source</dt>
              <dd style={{ color: sourceInfo.color }}>{sourceInfo.label}</dd>
            </div>

            {template.payload.forkedFromId && (
              <div className="flex justify-between">
                <dt className="text-[var(--glass-text-muted)]">Forked From</dt>
                <dd className="text-[var(--glass-text-secondary)]">
                  {forkedFrom?.payload.name || template.payload.forkedFromId.slice(0, 8)}
                </dd>
              </div>
            )}

            <div className="flex justify-between">
              <dt className="text-[var(--glass-text-muted)]">Version</dt>
              <dd className="text-[var(--glass-text-secondary)]">v{template.payload.version}</dd>
            </div>

            {template.payload.changelog && (
              <div>
                <dt className="text-[var(--glass-text-muted)] mb-1">Changelog</dt>
                <dd className="text-[var(--glass-text-secondary)] text-xs bg-[var(--glass-panel)] p-2 rounded">
                  {template.payload.changelog}
                </dd>
              </div>
            )}
          </dl>
        </InspectorSection>

        <InspectorDivider />

        {/* Metadata */}
        <InspectorSection title="Metadata">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--glass-text-muted)]">Created</dt>
              <dd className="text-[var(--glass-text-secondary)]">
                {new Date(template.meta.createdAt).toLocaleDateString()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--glass-text-muted)]">Updated</dt>
              <dd className="text-[var(--glass-text-secondary)]">
                {new Date(template.meta.updatedAt).toLocaleDateString()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--glass-text-muted)]">ID</dt>
              <dd className="text-[var(--glass-text-muted)] font-mono text-xs truncate max-w-[200px]">
                {template.meta.id}
              </dd>
            </div>
          </dl>
        </InspectorSection>
      </div>

      {/* Footer Actions */}
      <div className="flex-shrink-0 p-4 border-t border-[var(--glass-border)] bg-[var(--glass-panel)]">
        <div className="flex flex-col gap-3">
          {/* System Seed: Fork button */}
          {isSystemSeed && (
            <GlassButton
              onClick={handleFork}
              variant="primary"
              size="sm"
              disabled={loading || forking}
              style={{ backgroundColor: 'var(--semantic-info)' }}
              className="w-full"
            >
              <span className="material-symbols-outlined text-lg mr-2">
                {forking ? 'hourglass_empty' : 'fork_right'}
              </span>
              {forking ? 'Forking...' : 'Fork to Customize'}
            </GlassButton>
          )}

          {/* Draft: Publish + Save/Delete */}
          {!isSystemSeed && isDraft && (
            <>
              <GlassButton
                onClick={handlePublish}
                variant="primary"
                size="sm"
                disabled={loading || activating || hasChanges}
                style={{ backgroundColor: 'var(--semantic-success)' }}
                className="w-full"
                title={hasChanges ? 'Save changes before publishing' : 'Make available for selection'}
              >
                <span className="material-symbols-outlined text-lg mr-2">
                  {activating ? 'hourglass_empty' : 'rocket_launch'}
                </span>
                {activating ? 'Publishing...' : 'Publish Template'}
              </GlassButton>
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
                  style={{ color: 'var(--semantic-error)' }}
                  title="Delete"
                >
                  <span className="material-symbols-outlined text-lg">delete</span>
                </GlassButton>
              </div>
            </>
          )}

          {/* Active: Save/Duplicate/Archive */}
          {!isSystemSeed && isActive && (
            <>
              <GlassButton
                onClick={onSave}
                variant="primary"
                size="sm"
                disabled={loading || !hasChanges}
                className="w-full"
              >
                {hasChanges ? 'Save Changes' : 'Saved'}
              </GlassButton>
              <div className="flex items-center gap-2">
                <GlassButton
                  onClick={onDuplicate}
                  variant="ghost"
                  size="sm"
                  disabled={loading}
                  className="flex-1"
                >
                  <span className="material-symbols-outlined text-lg mr-1">content_copy</span>
                  Duplicate
                </GlassButton>
                <GlassButton
                  onClick={handleArchive}
                  variant="ghost"
                  size="sm"
                  disabled={loading || archiving}
                  style={{ color: 'var(--semantic-warning)' }}
                >
                  <span className="material-symbols-outlined text-lg mr-1">
                    {archiving ? 'hourglass_empty' : 'archive'}
                  </span>
                  {archiving ? 'Archiving...' : 'Archive'}
                </GlassButton>
              </div>
            </>
          )}

          {/* Archived: Restore/Delete */}
          {!isSystemSeed && isArchived && (
            <div className="flex items-center gap-2">
              <GlassButton
                onClick={handlePublish}
                variant="ghost"
                size="sm"
                disabled={loading || activating}
                className="flex-1"
              >
                <span className="material-symbols-outlined text-lg mr-1">
                  {activating ? 'hourglass_empty' : 'unarchive'}
                </span>
                {activating ? 'Restoring...' : 'Restore'}
              </GlassButton>
              <GlassButton
                onClick={onDelete}
                variant="ghost"
                size="sm"
                disabled={loading}
                style={{ color: 'var(--semantic-error)' }}
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

export default OutputTemplateEditor;
