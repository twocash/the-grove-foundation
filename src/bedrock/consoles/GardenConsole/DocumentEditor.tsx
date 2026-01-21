// src/bedrock/consoles/GardenConsole/DocumentEditor.tsx
// Document editor component for inspector panel
// Sprint: hotfix-pipeline-factory
//
// TODO: If text inputs in this editor lose characters during rapid typing,
// replace native <input>/<textarea> with BufferedInput/BufferedTextarea.
// @see src/bedrock/primitives/BufferedInput.tsx
// @see docs/hotfixes/HOTFIX-002-inspector-input-race.md

import React from 'react';
import type { ObjectEditorProps } from '../../patterns/console-factory.types';
import type { PatchOperation } from '../../types/copilot.types';
import { InspectorSection, InspectorDivider, GlassButton } from '../../primitives';
import { TagArray, GroupedChips, UtilityBar, GlassStatusBadge } from '../../primitives';
import { DOCUMENT_STATUSES } from './pipeline.config';
import { CANONICAL_TIERS, capitalize, type DocumentPayload, type DocumentTier } from './types';

// =============================================================================
// Component
// =============================================================================

export function DocumentEditor({
  object,
  onEdit,
  onSave,
  onDelete,
  onDuplicate,
  loading,
  hasChanges,
}: ObjectEditorProps<DocumentPayload>) {
  // Helper to create patch operation
  const patchPayload = (field: string, value: unknown) => {
    const op: PatchOperation = { op: 'replace', path: `/payload/${field}`, value };
    onEdit([op]);
  };

  const patchMeta = (field: string, value: unknown) => {
    const op: PatchOperation = { op: 'replace', path: `/meta/${field}`, value };
    onEdit([op]);
  };

  const statusConfig = DOCUMENT_STATUSES[object.payload.embedding_status] || DOCUMENT_STATUSES.pending;

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* === IDENTITY === */}
        <InspectorSection title="Identity">
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Title</label>
              <input
                type="text"
                value={object.meta.title}
                onChange={(e) => patchMeta('title', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                disabled={loading}
              />
            </div>

            {/* Tier */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Tier</label>
              <select
                value={object.payload.tier}
                onChange={(e) => patchPayload('tier', e.target.value as DocumentTier)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                disabled={loading}
              >
                {CANONICAL_TIERS.map((tier) => (
                  <option key={tier} value={tier}>
                    {capitalize(tier)}
                  </option>
                ))}
              </select>
            </div>

            {/* Status (read-only) */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Embedding Status
              </label>
              <GlassStatusBadge status={statusConfig.color} icon={statusConfig.icon} size="sm">
                {statusConfig.label}
              </GlassStatusBadge>
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* === ENRICHMENT === */}
        <InspectorSection title="Enrichment">
          <div className="space-y-4">
            {/* Keywords */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Keywords</label>
              <TagArray
                value={object.payload.keywords || []}
                onChange={(tags) => patchPayload('keywords', tags)}
                placeholder="Add keyword..."
              />
            </div>

            {/* Summary */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Summary</label>
              <textarea
                value={object.payload.summary || ''}
                onChange={(e) => patchPayload('summary', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 resize-none"
                disabled={loading}
              />
            </div>

            {/* Named Entities */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Named Entities
              </label>
              <GroupedChips
                value={object.payload.named_entities as unknown as Record<string, string[]>}
                onChange={(groups) => patchPayload('named_entities', groups)}
                groups={['people', 'organizations', 'concepts', 'technologies']}
                labels={{
                  people: 'People',
                  organizations: 'Organizations',
                  concepts: 'Concepts',
                  technologies: 'Technologies',
                }}
              />
            </div>

            {/* Temporal Class */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Temporal Class
              </label>
              <select
                value={object.payload.temporal_class || 'evergreen'}
                onChange={(e) => patchPayload('temporal_class', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                disabled={loading}
              >
                <option value="evergreen">Evergreen</option>
                <option value="current">Current</option>
                <option value="dated">Dated</option>
                <option value="historical">Historical</option>
              </select>
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* === USAGE SIGNALS === */}
        <InspectorSection title="Usage Signals" collapsible defaultCollapsed>
          <div className="space-y-4">
            {/* Utility Score */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Utility Score
              </label>
              <UtilityBar
                score={object.payload.utility_score || 0}
                retrievalCount={object.payload.retrieval_count || 0}
              />
            </div>

            {/* Retrieval Count */}
            <div className="flex justify-between">
              <span className="text-xs text-[var(--glass-text-muted)]">Retrievals</span>
              <span className="text-sm text-[var(--glass-text-secondary)]">
                {object.payload.retrieval_count || 0}
              </span>
            </div>

            {/* Last Retrieved */}
            <div className="flex justify-between">
              <span className="text-xs text-[var(--glass-text-muted)]">Last Retrieved</span>
              <span className="text-sm text-[var(--glass-text-secondary)]">
                {object.payload.last_retrieved_at
                  ? new Date(object.payload.last_retrieved_at).toLocaleDateString()
                  : 'Never'}
              </span>
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* === EDITORIAL === */}
        <InspectorSection title="Editorial" collapsible defaultCollapsed>
          <div className="space-y-4">
            {/* Editorial Notes */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">Notes</label>
              <textarea
                value={object.payload.editorial_notes || ''}
                onChange={(e) => patchPayload('editorial_notes', e.target.value)}
                rows={3}
                placeholder="Add notes about this document..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 resize-none"
                disabled={loading}
              />
            </div>

            {/* Enrichment metadata (read-only) */}
            {object.payload.enriched_at && (
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[var(--glass-text-muted)]">Enriched</dt>
                  <dd className="text-[var(--glass-text-secondary)]">
                    {new Date(object.payload.enriched_at).toLocaleDateString()}
                  </dd>
                </div>
                {object.payload.enrichment_model && (
                  <div className="flex justify-between">
                    <dt className="text-[var(--glass-text-muted)]">Model</dt>
                    <dd className="text-[var(--glass-text-secondary)] font-mono text-xs">
                      {object.payload.enrichment_model}
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </div>
        </InspectorSection>
      </div>

      {/* Fixed footer with actions */}
      <div className="flex-shrink-0 p-4 border-t border-[var(--glass-border)] bg-[var(--glass-panel)]">
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
      </div>
    </div>
  );
}

export default DocumentEditor;
