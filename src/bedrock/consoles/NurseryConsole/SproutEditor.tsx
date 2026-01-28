// src/bedrock/consoles/NurseryConsole/SproutEditor.tsx
// Sprout editor/inspector for Nursery Console
// Sprint: nursery-v1 (Course Correction)
//
// Note: Nursery-specific operations (promote, archive, restore) are implemented
// using the standard onEdit mechanism with patch operations, allowing this
// component to work within the createBedrockConsole factory pattern.

import React, { useState, useCallback, useMemo } from 'react';
import type { ObjectEditorProps } from '../../patterns/console-factory.types';
import type { SproutPayload } from './useNurseryData';
import type { PatchOperation } from '../../types/copilot.types';
import {
  NURSERY_STATUS_CONFIG,
  ARCHIVE_REASONS,
  type NurseryDisplayStatus,
} from './NurseryConsole.config';
import { InspectorSection, InspectorDivider } from '../../primitives/BedrockInspector';
import { GlassButton } from '../../primitives/GlassButton';
import { SproutSignalsPanel } from './SproutSignalsPanel';
import { GenerateDocumentSection } from './GenerateDocumentSection';
import { DocumentContentModal } from '../GardenConsole/DocumentContentModal';
// S26-NUR: SFR Bridge — view artifacts and promote via SproutFinishingRoom
import { SproutFinishingRoom } from '@surface/components/modals/SproutFinishingRoom/SproutFinishingRoom';
import { nurseryToSprout } from '@core/adapters/nurseryToSprout';
import type { NurseryBridgeInput } from '@core/adapters/nurseryToSprout';
import type { Sprout } from '@core/schema/sprout';

// =============================================================================
// Helper Components
// =============================================================================

interface ArchiveDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string, customReason?: string) => void;
  loading?: boolean;
}

function ArchiveDialog({ open, onClose, onConfirm, loading }: ArchiveDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState('');

  if (!open) return null;

  const handleConfirm = () => {
    if (!selectedReason) return;
    onConfirm(selectedReason, selectedReason === 'other' ? customReason : undefined);
    setSelectedReason('');
    setCustomReason('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md p-6 rounded-xl bg-[var(--glass-panel)] border border-[var(--glass-border)] shadow-2xl">
        <h3 className="text-lg font-medium text-[var(--glass-text-primary)] mb-4">
          Archive Sprout
        </h3>
        <p className="text-sm text-[var(--glass-text-secondary)] mb-4">
          Select a reason for archiving this sprout:
        </p>

        <div className="space-y-2 mb-4">
          {ARCHIVE_REASONS.map((reason) => (
            <button
              key={reason.id}
              onClick={() => setSelectedReason(reason.id)}
              className={`
                w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors
                ${selectedReason === reason.id
                  ? 'bg-[var(--neon-cyan)]/10 border border-[var(--neon-cyan)]/50'
                  : 'bg-[var(--glass-solid)] border border-[var(--glass-border)] hover:border-[var(--glass-border-bright)]'
                }
              `}
              disabled={loading}
            >
              <span className="material-symbols-outlined text-[var(--glass-text-secondary)]">
                {reason.icon}
              </span>
              <div>
                <div className="text-sm font-medium text-[var(--glass-text-primary)]">
                  {reason.label}
                </div>
                <div className="text-xs text-[var(--glass-text-muted)]">
                  {reason.description}
                </div>
              </div>
            </button>
          ))}
        </div>

        {selectedReason === 'other' && (
          <div className="mb-4">
            <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
              Custom Reason
            </label>
            <input
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Enter your reason..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
              disabled={loading}
            />
          </div>
        )}

        <div className="flex justify-end gap-2">
          <GlassButton
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </GlassButton>
          <GlassButton
            variant="primary"
            size="sm"
            onClick={handleConfirm}
            disabled={loading || !selectedReason || (selectedReason === 'other' && !customReason)}
          >
            Archive
          </GlassButton>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Status Badge Component
// =============================================================================

function StatusBadge({ status }: { status: string }) {
  const getDisplayStatus = (s: string): NurseryDisplayStatus => {
    if (s === 'completed') return 'ready';
    if (s === 'blocked') return 'failed';
    if (s === 'promoted') return 'promoted';
    return 'archived';
  };

  const displayStatus = getDisplayStatus(status);
  const config = NURSERY_STATUS_CONFIG[displayStatus];

  const colorStyles: Record<NurseryDisplayStatus, React.CSSProperties> = {
    ready: { backgroundColor: 'var(--semantic-success-bg)', color: 'var(--semantic-success)', borderColor: 'var(--semantic-success-border)' },
    failed: { backgroundColor: 'var(--semantic-error-bg)', color: 'var(--semantic-error)', borderColor: 'var(--semantic-error-border)' },
    promoted: { backgroundColor: 'var(--semantic-info-bg, rgba(6,182,212,0.1))', color: 'var(--semantic-info, #06b6d4)', borderColor: 'var(--semantic-info-border, rgba(6,182,212,0.3))' },
    archived: { backgroundColor: 'var(--glass-surface)', color: 'var(--glass-text-muted)', borderColor: 'var(--glass-border)' },
  };

  return (
    <span
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border"
      style={colorStyles[displayStatus]}
    >
      <span className="material-symbols-outlined text-base">{config.icon}</span>
      {config.label}
    </span>
  );
}

// =============================================================================
// Main Editor Component
// =============================================================================

export function SproutEditor({
  object: sprout,
  onEdit,
  onSave,
  onDelete,
  onDuplicate,
  loading,
  hasChanges,
}: ObjectEditorProps<SproutPayload>) {
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showSFRModal, setShowSFRModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // S26-NUR: Convert Nursery sprout → SFR Sprout type via adapter
  const sfrSprout = useMemo(() => {
    const bridgeInput: NurseryBridgeInput = {
      meta: {
        id: sprout.meta.id,
        createdAt: sprout.meta.createdAt,
      },
      payload: {
        spark: sprout.payload.spark,
        status: sprout.payload.status,
        inferenceModel: sprout.payload.inferenceModel,
        tags: sprout.payload.tags,
        notes: sprout.payload.notes,
        synthesis: sprout.payload.synthesis,
        researchDocument: sprout.payload.researchDocument,
        generatedArtifacts: sprout.payload.generatedArtifacts,
        promotedAt: sprout.payload.promotedAt,
        promotedToGardenId: sprout.payload.promotionGardenDocId,
      },
    };
    return nurseryToSprout(bridgeInput);
  }, [sprout]);

  // Helper to create patch operation
  const patchPayload = (field: keyof SproutPayload, value: unknown) => {
    const op: PatchOperation = { op: 'replace', path: `/payload/${field}`, value };
    onEdit([op]);
  };

  const patchMeta = (field: string, value: unknown) => {
    const op: PatchOperation = { op: 'replace', path: `/meta/${field}`, value };
    onEdit([op]);
  };

  // S26-NUR: "Promote to Garden" opens the SproutFinishingRoom modal
  // instead of directly archiving. The SFR modal handles artifact selection
  // and garden-bridge promotion pipeline.
  const handlePromote = () => {
    setShowSFRModal(true);
  };

  // S26-NUR Phase 3a: When SFR completes promotion, sync the result back to
  // the Nursery sprout via patch operations. The updatedSprout carries
  // promotionGardenDocId and promotionTier injected by SFR after garden-bridge
  // succeeds (see SproutFinishingRoom.tsx handlePromoteToGarden).
  const handleSFRSproutUpdate = useCallback((updatedSprout: Sprout) => {
    // S26-NUR Phase 3a: Extract promotion data injected by SFR's handlePromoteToGarden.
    // These fields are added to the Sprout object at runtime after garden-bridge succeeds.
    const promoted = updatedSprout as Sprout & {
      promotionGardenDocId?: string;
      promotionTier?: string;
    };

    const ops: PatchOperation[] = [
      { op: 'replace', path: '/payload/status', value: 'promoted' },
      { op: 'replace', path: '/payload/promotedAt', value: promoted.promotedAt ?? new Date().toISOString() },
    ];

    if (promoted.promotionGardenDocId) {
      ops.push({ op: 'replace', path: '/payload/promotionGardenDocId', value: promoted.promotionGardenDocId });
    }
    if (promoted.promotionTier) {
      ops.push({ op: 'replace', path: '/payload/promotionTier', value: promoted.promotionTier });
    }

    onEdit(ops);
    onSave();
  }, [onEdit, onSave]);

  const handleArchive = async (reason: string, customReason?: string) => {
    setActionLoading(true);
    try {
      const now = new Date().toISOString();
      const archiveReason = reason === 'other' && customReason ? customReason : reason;
      const ops: PatchOperation[] = [
        { op: 'replace', path: '/payload/status', value: 'archived' },
        { op: 'replace', path: '/payload/archiveReason', value: archiveReason },
        { op: 'replace', path: '/payload/archivedAt', value: now },
      ];
      await onEdit(ops);
      onSave();
      setShowArchiveDialog(false);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async () => {
    setActionLoading(true);
    try {
      const ops: PatchOperation[] = [
        { op: 'replace', path: '/payload/status', value: 'completed' },
        { op: 'replace', path: '/payload/archiveReason', value: null },
        { op: 'replace', path: '/payload/archivedAt', value: null },
        { op: 'replace', path: '/payload/reviewed', value: false },
      ];
      await onEdit(ops);
      onSave();
    } finally {
      setActionLoading(false);
    }
  };

  // Sprint: research-template-wiring-v1 - US-RL006 Document Generation
  const handleGenerateDocument = useCallback(async (templateId: string) => {
    setActionLoading(true);
    setGenerateError(null);

    try {
      // Import document generator dynamically to avoid circular deps
      const { generateDocument } = await import('@explore/services/document-generator');

      // Build evidence bundle from sprout synthesis
      // Note: Full evidence bundle would come from sprout.evidence if available
      const evidenceBundle = {
        sproutId: sprout.meta.id,
        totalSources: 0,
        branches: [],
        confidenceScore: sprout.payload.synthesis?.confidence ?? 0.5,
        createdAt: new Date().toISOString(),
      };

      const result = await generateDocument({
        evidenceBundle,
        query: sprout.payload.spark,
        writerTemplateId: templateId,
      });

      if (!result.success) {
        throw new Error(result.error || 'Document generation failed');
      }

      // Save the generated document to the sprout
      const ops: PatchOperation[] = [
        { op: 'replace', path: '/payload/researchDocument', value: result.document },
      ];
      await onEdit(ops);
      onSave();

      console.log('[SproutEditor] Document generated successfully', {
        templateUsed: result.templateUsed,
        duration: result.execution.durationMs,
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Generation failed';
      setGenerateError(errorMessage);
      console.error('[SproutEditor] Document generation failed:', e);
      throw e; // Re-throw so GenerateDocumentSection can handle it
    } finally {
      setActionLoading(false);
    }
  }, [sprout.meta.id, sprout.payload.spark, sprout.payload.synthesis, onEdit, onSave]);

  const isArchived = sprout.payload.status === 'archived';
  const isReady = sprout.payload.status === 'completed';
  const confidencePercent = Math.round((sprout.payload.inferenceConfidence ?? 0) * 100);

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">

        {/* === STATUS & ACTIONS === */}
        <InspectorSection title="Status">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <StatusBadge status={sprout.payload.status} />
              {sprout.payload.requiresReview && !sprout.payload.reviewed && (
                <span
                  className="flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                  style={{ backgroundColor: 'var(--semantic-warning-bg)', color: 'var(--semantic-warning)' }}
                >
                  <span className="material-symbols-outlined text-sm">rate_review</span>
                  Needs Review
                </span>
              )}
            </div>

            {sprout.payload.statusMessage && (
              <p className="text-sm text-[var(--glass-text-muted)] italic">
                {sprout.payload.statusMessage}
              </p>
            )}

            {/* Action buttons based on status */}
            <div className="flex flex-wrap gap-2">
              {isReady && (
                <GlassButton
                  variant="primary"
                  size="sm"
                  onClick={handlePromote}
                  disabled={loading || actionLoading}
                  aria-haspopup="dialog"
                >
                  <span className="material-symbols-outlined text-base mr-1">park</span>
                  Promote to Garden
                </GlassButton>
              )}

              {/* S26-NUR: View Artifacts button — opens SFR modal to inspect generated documents */}
              {(sprout.payload.generatedArtifacts?.length ?? 0) > 0 && (
                <GlassButton
                  variant="primary"
                  accent="violet"
                  size="sm"
                  onClick={() => setShowSFRModal(true)}
                  disabled={loading || actionLoading}
                  aria-haspopup="dialog"
                >
                  <span className="material-symbols-outlined text-base mr-1">description</span>
                  View Artifacts
                  <span
                    className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-medium"
                    style={{ backgroundColor: 'var(--neon-violet)', color: 'var(--glass-void)' }}
                    aria-label={`${sprout.payload.generatedArtifacts!.length} artifact${sprout.payload.generatedArtifacts!.length !== 1 ? 's' : ''}`}
                  >
                    {sprout.payload.generatedArtifacts!.length}
                  </span>
                </GlassButton>
              )}

              {!isArchived && (
                <GlassButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowArchiveDialog(true)}
                  disabled={loading || actionLoading}
                >
                  <span className="material-symbols-outlined text-base mr-1">archive</span>
                  Archive
                </GlassButton>
              )}

              {isArchived && (
                <GlassButton
                  variant="primary"
                  size="sm"
                  onClick={handleRestore}
                  disabled={loading || actionLoading}
                >
                  <span className="material-symbols-outlined text-base mr-1">unarchive</span>
                  Restore
                </GlassButton>
              )}
            </div>

            {/* S26-NUR: Post-promotion status display */}
            {sprout.payload.status === 'promoted' && sprout.payload.promotedAt && (
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--semantic-success-bg)' }}>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base" style={{ color: 'var(--semantic-success)' }}>
                    check_circle
                  </span>
                  <span className="text-sm font-medium" style={{ color: 'var(--semantic-success)' }}>
                    Promoted to Garden
                  </span>
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--glass-text-muted)' }}>
                  {new Date(sprout.payload.promotedAt).toLocaleString()}
                  {sprout.payload.promotionTier && ` · Tier: ${sprout.payload.promotionTier}`}
                  {sprout.payload.promotionGardenDocId && (
                    <span className="ml-1">
                      · Doc: <span className="font-mono">{sprout.payload.promotionGardenDocId.slice(0, 8)}...</span>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Archive reason if archived */}
            {isArchived && sprout.payload.archiveReason && (
              <div className="p-3 rounded-lg bg-[var(--glass-border)]/50">
                <div className="text-xs text-[var(--glass-text-muted)] mb-1">Archive Reason</div>
                <div className="text-sm text-[var(--glass-text-secondary)]">
                  {sprout.payload.archiveReason}
                </div>
                {sprout.payload.archivedAt && (
                  <div className="text-xs text-[var(--glass-text-muted)] mt-1">
                    Archived {new Date(sprout.payload.archivedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            )}
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* === IDENTITY === */}
        <InspectorSection title="Identity">
          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Title
              </label>
              <input
                type="text"
                value={sprout.meta.title}
                onChange={(e) => patchMeta('title', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                disabled={loading}
              />
            </div>

            {/* Spark (research question) */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Research Spark
              </label>
              <textarea
                value={sprout.payload.spark}
                onChange={(e) => patchPayload('spark', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 resize-none"
                disabled={loading}
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Tags
              </label>
              <input
                type="text"
                value={sprout.payload.tags.join(', ')}
                onChange={(e) => {
                  const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean);
                  patchPayload('tags', tags);
                }}
                placeholder="Comma-separated tags"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                disabled={loading}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Notes
              </label>
              <textarea
                value={sprout.payload.notes || ''}
                onChange={(e) => patchPayload('notes', e.target.value || null)}
                rows={2}
                placeholder="Optional reviewer notes..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 resize-none"
                disabled={loading}
              />
            </div>

            {/* Review toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--glass-text-secondary)]">Mark as Reviewed</span>
              <button
                onClick={() => patchPayload('reviewed', !sprout.payload.reviewed)}
                className={`
                  relative w-11 h-6 rounded-full transition-colors
                  ${sprout.payload.reviewed ? 'bg-[var(--neon-green)]' : 'bg-[var(--glass-border)]'}
                `}
                disabled={loading}
              >
                <span
                  className={`
                    absolute top-1 w-4 h-4 rounded-full bg-white transition-all
                    ${sprout.payload.reviewed ? 'left-6' : 'left-1'}
                  `}
                />
              </button>
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* === SYNTHESIS (if completed) === */}
        {sprout.payload.synthesis && (
          <>
            <InspectorSection title="Synthesis" collapsible defaultCollapsed={false}>
              <div className="space-y-4">
                {/* Summary */}
                {sprout.payload.synthesis.summary && (
                  <div>
                    <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                      Summary
                    </label>
                    <p className="text-sm text-[var(--glass-text-secondary)] whitespace-pre-wrap">
                      {sprout.payload.synthesis.summary}
                    </p>
                  </div>
                )}

                {/* Key Insights */}
                {sprout.payload.synthesis.insights && sprout.payload.synthesis.insights.length > 0 && (
                  <div>
                    <label className="block text-xs text-[var(--glass-text-muted)] mb-2">
                      Key Insights
                    </label>
                    <ul className="space-y-1">
                      {sprout.payload.synthesis.insights.map((insight, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-[var(--glass-text-secondary)]">
                          <span className="material-symbols-outlined text-base text-[var(--neon-cyan)] mt-0.5">check_circle</span>
                          {insight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </InspectorSection>
            <InspectorDivider />
          </>
        )}

        {/* === GENERATE DOCUMENT (Sprint: research-template-wiring-v1) === */}
        {/* US-RL006: User-triggered document generation with Writer Template selection */}
        <GenerateDocumentSection
          sproutId={sprout.meta.id}
          hasResearchResults={!!sprout.payload.synthesis}
          hasDocument={!!sprout.payload.researchDocument}
          onGenerate={handleGenerateDocument}
          onViewDocument={sprout.payload.researchDocument ? () => setShowDocumentModal(true) : undefined}
          disabled={loading || actionLoading}
        />

        {sprout.payload.synthesis && !sprout.payload.researchDocument && <InspectorDivider />}

        {/* === PROVENANCE === */}
        <InspectorSection title="Provenance" collapsible defaultCollapsed={true}>
          <dl className="space-y-3">
            <div className="flex justify-between items-start">
              <dt className="text-sm text-[var(--glass-text-muted)]">Confidence</dt>
              <dd className="text-sm text-[var(--glass-text-secondary)]">
                {confidencePercent > 0 ? `${confidencePercent}%` : 'N/A'}
              </dd>
            </div>
            {sprout.payload.inferenceModel && (
              <div className="flex justify-between items-start">
                <dt className="text-sm text-[var(--glass-text-muted)]">Model</dt>
                <dd className="text-sm text-[var(--glass-text-secondary)]">
                  {sprout.payload.inferenceModel}
                </dd>
              </div>
            )}
            <div className="flex justify-between items-start">
              <dt className="text-sm text-[var(--glass-text-muted)]">Grove</dt>
              <dd className="text-sm text-[var(--glass-text-secondary)] font-mono text-xs">
                {sprout.payload.groveId}
              </dd>
            </div>
            {sprout.payload.completedAt && (
              <div className="flex justify-between items-start">
                <dt className="text-sm text-[var(--glass-text-muted)]">Completed</dt>
                <dd className="text-sm text-[var(--glass-text-secondary)]">
                  {new Date(sprout.payload.completedAt).toLocaleString()}
                </dd>
              </div>
            )}
          </dl>
        </InspectorSection>

        <InspectorDivider />

        {/* === USAGE SIGNALS (S6-SL-ObservableSignals) === */}
        <SproutSignalsPanel
          sproutId={sprout.meta.id}
          sproutQuery={sprout.payload.spark}
          collapsible
          defaultCollapsed
        />

        <InspectorDivider />

        {/* === METADATA === */}
        <InspectorSection title="Metadata">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--glass-text-muted)]">Created</dt>
              <dd className="text-[var(--glass-text-secondary)]">
                {new Date(sprout.meta.createdAt).toLocaleDateString()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--glass-text-muted)]">Updated</dt>
              <dd className="text-[var(--glass-text-secondary)]">
                {new Date(sprout.meta.updatedAt).toLocaleDateString()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--glass-text-muted)]">ID</dt>
              <dd className="text-[var(--glass-text-muted)] font-mono text-xs">
                {sprout.meta.id}
              </dd>
            </div>
          </dl>
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
      </div>

      {/* Archive dialog */}
      <ArchiveDialog
        open={showArchiveDialog}
        onClose={() => setShowArchiveDialog(false)}
        onConfirm={handleArchive}
        loading={actionLoading}
      />

      {/* S25-SFR: Document content modal */}
      {showDocumentModal && sprout.payload.researchDocument && (
        <DocumentContentModal
          title={sprout.payload.researchDocument.position || sprout.meta.title}
          content={sprout.payload.researchDocument.analysis}
          tier={sprout.payload.researchDocument.status || 'complete'}
          createdAt={sprout.payload.researchDocument.createdAt}
          onClose={() => setShowDocumentModal(false)}
        />
      )}

      {/* S26-NUR: SproutFinishingRoom modal — launched from Promote or View Artifacts */}
      <SproutFinishingRoom
        sprout={sfrSprout}
        isOpen={showSFRModal}
        onClose={() => setShowSFRModal(false)}
        onSproutUpdate={handleSFRSproutUpdate}
      />
    </div>
  );
}

export default SproutEditor;
