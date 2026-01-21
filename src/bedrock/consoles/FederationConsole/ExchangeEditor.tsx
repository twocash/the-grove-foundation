// src/bedrock/consoles/FederationConsole/ExchangeEditor.tsx
// Editor component for Federation Exchange with factory pattern
// Sprint: S15-BD-FederationEditors-v1

import React, { useCallback } from 'react';
import type { ObjectEditorProps, PatchOperation } from '../../patterns/console-factory.types';
import type {
  FederationExchangePayload,
  ExchangeType,
  ExchangeContentType,
  ExchangeStatus,
} from '@core/schema/federation';
import { EXCHANGE_STATUS_CONFIG, CONTENT_TYPE_CONFIG } from './FederationConsole.config';
import { InspectorSection, InspectorDivider } from '../../primitives/BedrockInspector';
import { BufferedInput, BufferedTextarea } from '../../primitives/BufferedInput';
import { GroveConnectionDiagram } from '../../components/GroveConnectionDiagram';

// =============================================================================
// Constants
// =============================================================================

const EXCHANGE_TYPES: Array<{ value: ExchangeType; label: string; icon: string }> = [
  { value: 'request', label: 'Request (Incoming)', icon: 'call_received' },
  { value: 'offer', label: 'Offer (Outgoing)', icon: 'call_made' },
];

// Shared CSS classes for inputs
const inputClasses = `
  w-full px-3 py-2 rounded-lg bg-[var(--glass-solid)]
  border border-[var(--glass-border)] text-[var(--glass-text-primary)]
  placeholder:text-[var(--glass-text-subtle)]
  focus:outline-none focus:border-[var(--neon-cyan)]
  focus:ring-1 focus:ring-[var(--neon-cyan)]/50
`;

const selectClasses = `
  w-full px-3 py-2 rounded-lg bg-[var(--glass-solid)]
  border border-[var(--glass-border)] text-[var(--glass-text-primary)]
  focus:outline-none focus:border-[var(--neon-cyan)]
  focus:ring-1 focus:ring-[var(--neon-cyan)]/50
  cursor-pointer
`;

// =============================================================================
// Helper: Status Badge
// =============================================================================

function StatusBadge({ status }: { status: ExchangeStatus }) {
  const config = EXCHANGE_STATUS_CONFIG[status];

  const bgColors: Record<ExchangeStatus, string> = {
    pending: 'bg-[var(--neon-amber)]/10',
    in_progress: 'bg-[var(--neon-cyan)]/10',
    completed: 'bg-[var(--neon-green)]/10',
    rejected: 'bg-[var(--semantic-error-bg)]',
    expired: 'bg-[var(--glass-text-muted)]/10',
  };

  const textColors: Record<ExchangeStatus, string> = {
    pending: 'text-[var(--neon-amber)]',
    in_progress: 'text-[var(--neon-cyan)]',
    completed: 'text-[var(--neon-green)]',
    rejected: 'text-[var(--semantic-error)]',
    expired: 'text-[var(--glass-text-muted)]',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${bgColors[status]} ${textColors[status]}`}>
      {config?.label || status}
    </span>
  );
}

// =============================================================================
// Helper: Timeline Step
// =============================================================================

function TimelineStep({
  label,
  value,
  color,
  completed = false,
}: {
  label: string;
  value: string;
  color: string;
  completed?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-shrink-0">
        <div
          className={`w-3 h-3 rounded-full ${completed ? 'animate-pulse' : ''}`}
          style={{ backgroundColor: color }}
        />
        {completed && (
          <div
            className="absolute inset-0 w-3 h-3 rounded-full animate-ping opacity-75"
            style={{ backgroundColor: color }}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-[var(--glass-text-muted)]">{label}</div>
        <div className="text-sm text-[var(--glass-text-primary)] truncate">{value}</div>
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function ExchangeEditor({
  object: exchange,
  onEdit,
  onSave,
  onDelete,
  onDuplicate,
  loading,
  hasChanges,
  className = '',
}: ObjectEditorProps<FederationExchangePayload>) {
  const { payload } = exchange;

  // Helper for payload updates using patch operations
  const updatePayload = useCallback(
    (updates: Partial<FederationExchangePayload>) => {
      const ops: PatchOperation[] = Object.entries(updates).map(([key, value]) => ({
        op: 'replace' as const,
        path: `/payload/${key}`,
        value,
      }));
      onEdit(ops);
    },
    [onEdit]
  );

  const contentConfig = CONTENT_TYPE_CONFIG[payload.contentType];
  const statusConfig = EXCHANGE_STATUS_CONFIG[payload.status];

  return (
    <div className={`flex flex-col h-full ${className}`} data-testid="exchange-editor">
      {/* ================================================================== */}
      {/* Header with status badge                                          */}
      {/* ================================================================== */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--neon-amber)]/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-lg text-[var(--neon-amber)]">
              swap_horiz
            </span>
          </div>
          <div>
            <h3 className="text-sm font-medium text-[var(--glass-text-primary)]">
              Federation Exchange
            </h3>
            <p className="text-xs text-[var(--glass-text-muted)]">
              {exchange.id}
            </p>
          </div>
        </div>
        <StatusBadge status={payload.status || 'pending'} />
      </div>

      {/* ================================================================== */}
      {/* Scrollable Content Area                                           */}
      {/* ================================================================== */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-1">
          {/* ============================================================ */}
          {/* Exchange Type Section                                        */}
          {/* ============================================================ */}
          <InspectorSection title="Exchange Type">
            <div className="space-y-4">
              {/* Type and Content Type Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[var(--glass-text-muted)] mb-1.5">
                    Direction
                  </label>
                  <select
                    value={payload.type || 'request'}
                    onChange={(e) => updatePayload({ type: e.target.value as ExchangeType })}
                    className={selectClasses}
                  >
                    {EXCHANGE_TYPES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-[var(--glass-text-muted)] mb-1.5">
                    Content Type
                  </label>
                  <select
                    value={payload.contentType || 'sprout'}
                    onChange={(e) => updatePayload({ contentType: e.target.value as ExchangeContentType })}
                    className={selectClasses}
                  >
                    {Object.entries(CONTENT_TYPE_CONFIG).map(([value, config]) => (
                      <option key={value} value={value}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Token value preview */}
              <div className="p-3 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] flex items-center justify-between">
                <span className="text-sm text-[var(--glass-text-muted)]">Base Token Value:</span>
                <span className="flex items-center gap-1.5 text-[var(--neon-amber)] font-medium">
                  <span className="material-symbols-outlined text-sm">token</span>
                  {contentConfig?.tokens || 0} tokens
                </span>
              </div>
            </div>
          </InspectorSection>

          <InspectorDivider />

          {/* ============================================================ */}
          {/* Grove Parties Section                                        */}
          {/* ============================================================ */}
          <InspectorSection title="Grove Parties">
            <GroveConnectionDiagram
              sourceGrove={payload.requestingGroveId || ''}
              targetGrove={payload.providingGroveId || ''}
              sourceLabel="Requesting Grove"
              targetLabel="Providing Grove"
              onSourceChange={(v) => updatePayload({ requestingGroveId: v })}
              onTargetChange={(v) => updatePayload({ providingGroveId: v })}
              icon={
                <span className="material-symbols-outlined text-xl text-[var(--neon-amber)]">
                  {payload.type === 'request' ? 'call_received' : 'call_made'}
                </span>
              }
            />
          </InspectorSection>

          <InspectorDivider />

          {/* ============================================================ */}
          {/* Content Details Section                                      */}
          {/* ============================================================ */}
          <InspectorSection title="Content Details">
            <div className="space-y-4">
              {/* Query */}
              <div>
                <label className="block text-xs text-[var(--glass-text-muted)] mb-1.5">
                  Search Query <span className="text-[var(--glass-text-subtle)]">(for requests)</span>
                </label>
                <BufferedTextarea
                  value={payload.query || ''}
                  onChange={(v) => updatePayload({ query: v })}
                  placeholder="Describe the content you're looking for..."
                  rows={3}
                  className={`${inputClasses} resize-none`}
                />
              </div>

              {/* Content ID */}
              <div>
                <label className="block text-xs text-[var(--glass-text-muted)] mb-1.5">
                  Content ID <span className="text-[var(--glass-text-subtle)]">(for offers)</span>
                </label>
                <BufferedInput
                  value={payload.contentId || ''}
                  onChange={(v) => updatePayload({ contentId: v })}
                  placeholder="sprout-123 or concept-456"
                  className={inputClasses}
                />
              </div>
            </div>
          </InspectorSection>

          <InspectorDivider />

          {/* ============================================================ */}
          {/* Tier Information Section (Collapsible)                       */}
          {/* ============================================================ */}
          <InspectorSection title="Tier Information" collapsible defaultCollapsed>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[var(--glass-text-muted)] mb-1.5">
                  Source Tier
                </label>
                <BufferedInput
                  value={payload.sourceTier || ''}
                  onChange={(v) => updatePayload({ sourceTier: v })}
                  placeholder="original-tier-id"
                  className={inputClasses}
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--glass-text-muted)] mb-1.5">
                  Mapped Tier
                </label>
                <BufferedInput
                  value={payload.mappedTier || ''}
                  onChange={(v) => updatePayload({ mappedTier: v })}
                  placeholder="auto-mapped-tier"
                  className={inputClasses}
                />
              </div>
            </div>
          </InspectorSection>

          <InspectorDivider />

          {/* ============================================================ */}
          {/* Status Section                                               */}
          {/* ============================================================ */}
          <InspectorSection title="Status & Value">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[var(--glass-text-muted)] mb-1.5">
                  Exchange Status
                </label>
                <select
                  value={payload.status || 'pending'}
                  onChange={(e) => updatePayload({ status: e.target.value as ExchangeStatus })}
                  className={selectClasses}
                >
                  {Object.entries(EXCHANGE_STATUS_CONFIG).map(([value, config]) => (
                    <option key={value} value={value}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[var(--glass-text-muted)] mb-1.5">
                  Token Value
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-sm text-[var(--neon-amber)]">
                    token
                  </span>
                  <input
                    type="number"
                    value={payload.tokenValue || ''}
                    onChange={(e) => updatePayload({ tokenValue: parseFloat(e.target.value) || undefined })}
                    placeholder="0"
                    min={0}
                    className={`${inputClasses} pl-9`}
                  />
                </div>
              </div>
            </div>
          </InspectorSection>

          <InspectorDivider />

          {/* ============================================================ */}
          {/* Timeline Section (Collapsible)                               */}
          {/* ============================================================ */}
          <InspectorSection title="Timeline" collapsible defaultCollapsed={!payload.initiatedAt}>
            <div className="p-4 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)]">
              <div className="space-y-4">
                {/* Initiated */}
                <TimelineStep
                  label="Initiated"
                  value={payload.initiatedAt ? new Date(payload.initiatedAt).toLocaleString() : 'Not initiated'}
                  color="#60a5fa"
                  completed={!!payload.initiatedAt && !payload.completedAt}
                />

                {/* Vertical connector */}
                <div className="ml-1.5 w-px h-4 bg-[var(--glass-border)]" />

                {/* Current Status */}
                <TimelineStep
                  label="Current Status"
                  value={statusConfig?.label || payload.status}
                  color={statusConfig?.color || '#94a3b8'}
                  completed={payload.status === 'in_progress'}
                />

                {/* Completed (if applicable) */}
                {payload.completedAt && (
                  <>
                    <div className="ml-1.5 w-px h-4 bg-[var(--glass-border)]" />
                    <TimelineStep
                      label="Completed"
                      value={new Date(payload.completedAt).toLocaleString()}
                      color="#4ade80"
                    />
                  </>
                )}
              </div>
            </div>
          </InspectorSection>
        </div>
      </div>

      {/* ================================================================== */}
      {/* Footer Actions                                                    */}
      {/* ================================================================== */}
      <div className="border-t border-[var(--glass-border)] p-4 space-y-3">
        {/* Save Button */}
        <button
          onClick={onSave}
          disabled={loading || !hasChanges}
          className={`
            w-full py-2.5 px-4 rounded-lg font-medium transition-all
            flex items-center justify-center gap-2
            ${
              hasChanges
                ? 'bg-[var(--neon-green)] text-black hover:bg-[var(--neon-green)]/90'
                : 'bg-[var(--glass-border)] text-[var(--glass-text-muted)] cursor-not-allowed'
            }
            ${loading ? 'opacity-50 cursor-wait' : ''}
          `}
        >
          {loading ? (
            <>
              <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
              Saving...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-sm">save</span>
              Save Changes
            </>
          )}
        </button>

        {/* Secondary Actions Row */}
        <div className="flex items-center gap-2">
          <button
            onClick={onDuplicate}
            disabled={loading}
            className="flex-1 py-2 px-3 rounded-lg border border-[var(--glass-border)] text-[var(--glass-text-secondary)] hover:bg-white/5 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
          >
            <span className="material-symbols-outlined text-sm">content_copy</span>
            Duplicate
          </button>
          <button
            onClick={onDelete}
            disabled={loading}
            className="flex-1 py-2 px-3 rounded-lg border transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
            style={{ borderColor: 'var(--semantic-error-border)', color: 'var(--semantic-error)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--semantic-error-bg)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <span className="material-symbols-outlined text-sm">delete</span>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExchangeEditor;
