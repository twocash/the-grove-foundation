// src/bedrock/consoles/ExperienceConsole/BulkRollbackModal.tsx
// Modal for bulk rollback of advancements
// Sprint: S7-SL-AutoAdvancement v1
//
// DEX: Provenance as Infrastructure - Bulk rollbacks create audit trail per sprout

import React, { useState, useEffect } from 'react';
import { GlassButton } from '../../primitives';
import type { AdvancementEvent } from '@core/schema/advancement';

// =============================================================================
// Types
// =============================================================================

interface BulkRollbackModalProps {
  open: boolean;
  onClose: () => void;
  onRollback: (eventIds: string[], reason: string) => Promise<void>;
}

interface RollbackCandidate {
  event: AdvancementEvent;
  sproutTitle?: string;
  selected: boolean;
}

// =============================================================================
// Tier Badge
// =============================================================================

const TIER_STYLES: Record<string, React.CSSProperties> = {
  seed: { backgroundColor: 'var(--semantic-warning-bg)', color: 'var(--semantic-warning)' },
  sprout: { backgroundColor: 'var(--semantic-success-bg)', color: 'var(--semantic-success)' },
  sapling: { backgroundColor: 'var(--semantic-success-bg)', color: 'var(--semantic-success)' },
  tree: { backgroundColor: 'var(--semantic-success-bg)', color: 'var(--semantic-success)' },
  grove: { backgroundColor: 'var(--semantic-info-bg)', color: 'var(--semantic-info)' },
};

function TierBadge({ tier }: { tier: string }) {
  const style = TIER_STYLES[tier] || { backgroundColor: 'var(--glass-panel)', color: 'var(--glass-text-muted)' };
  return (
    <span className="px-2 py-0.5 rounded text-xs font-medium" style={style}>
      {tier}
    </span>
  );
}

// =============================================================================
// Component
// =============================================================================

export function BulkRollbackModal({
  open,
  onClose,
  onRollback,
}: BulkRollbackModalProps) {
  const [candidates, setCandidates] = useState<RollbackCandidate[]>([]);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<'1h' | '24h' | '7d' | 'all'>('24h');

  // Fetch recent advancement events when modal opens
  useEffect(() => {
    if (open) {
      fetchRecentEvents();
    }
  }, [open, timeFilter]);

  const fetchRecentEvents = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual Supabase call
      // const timeAgo = getTimeAgo(timeFilter);
      // const { data } = await supabase
      //   .from('advancement_events')
      //   .select('*, sprouts(meta)')
      //   .eq('event_type', 'auto-advancement')
      //   .eq('rolled_back', false)
      //   .gte('timestamp', timeAgo)
      //   .order('timestamp', { ascending: false })
      //   .limit(50);
      //
      // setCandidates(data?.map(e => ({
      //   event: e,
      //   sproutTitle: e.sprouts?.meta?.title,
      //   selected: false
      // })) ?? []);

      // Mock empty for development
      setCandidates([]);
    } catch (err) {
      console.error('[BulkRollbackModal] Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = candidates.filter((c) => c.selected).length;

  const toggleCandidate = (index: number) => {
    setCandidates((prev) =>
      prev.map((c, i) => (i === index ? { ...c, selected: !c.selected } : c))
    );
  };

  const selectAll = () => {
    setCandidates((prev) => prev.map((c) => ({ ...c, selected: true })));
  };

  const deselectAll = () => {
    setCandidates((prev) => prev.map((c) => ({ ...c, selected: false })));
  };

  const handleSubmit = async () => {
    const selected = candidates.filter((c) => c.selected);
    if (selected.length === 0) {
      setError('Please select at least one advancement to rollback');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide a reason for the bulk rollback');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await onRollback(
        selected.map((c) => c.event.id),
        reason.trim()
      );
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rollback failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--glass-solid)] border border-[var(--glass-border)] rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border)]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: 'var(--semantic-warning-bg)' }}
            >
              <span className="material-symbols-outlined" style={{ color: 'var(--semantic-warning)' }}>
                history
              </span>
            </div>
            <div>
              <h2 className="text-lg font-medium text-[var(--glass-text-primary)]">
                Bulk Rollback
              </h2>
              <p className="text-sm text-[var(--glass-text-muted)]">
                Revert multiple automatic advancements
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--glass-text-muted)] hover:text-[var(--glass-text-primary)] transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Time Filter */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-[var(--glass-border)] bg-[var(--glass-elevated)]">
          <span className="text-sm text-[var(--glass-text-secondary)]">Show advancements from:</span>
          <div className="flex gap-1">
            {[
              { value: '1h', label: 'Last hour' },
              { value: '24h', label: 'Last 24h' },
              { value: '7d', label: 'Last 7 days' },
              { value: 'all', label: 'All time' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeFilter(option.value as typeof timeFilter)}
                className={`
                  px-3 py-1 rounded-lg text-xs transition-colors
                  ${timeFilter === option.value
                    ? 'bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)]'
                    : 'text-[var(--glass-text-muted)] hover:text-[var(--glass-text-primary)]'
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Selection Controls */}
        <div className="flex items-center justify-between px-6 py-2 border-b border-[var(--glass-border)]">
          <div className="flex items-center gap-3">
            <button
              onClick={selectAll}
              className="text-xs text-[var(--neon-cyan)] hover:text-[var(--neon-cyan-bright)] transition-colors"
            >
              Select all
            </button>
            <span className="text-[var(--glass-text-muted)]">•</span>
            <button
              onClick={deselectAll}
              className="text-xs text-[var(--glass-text-muted)] hover:text-[var(--glass-text-primary)] transition-colors"
            >
              Deselect all
            </button>
          </div>
          <span className="text-xs text-[var(--glass-text-secondary)]">
            {selectedCount} of {candidates.length} selected
          </span>
        </div>

        {/* Event List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="material-symbols-outlined text-4xl text-[var(--glass-text-muted)] animate-spin">
                progress_activity
              </span>
            </div>
          ) : candidates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="material-symbols-outlined text-4xl text-[var(--glass-text-muted)] mb-3">
                check_circle
              </span>
              <p className="text-[var(--glass-text-secondary)]">No rollback candidates</p>
              <p className="text-sm text-[var(--glass-text-muted)]">
                No automatic advancements found in the selected time range
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--glass-border)]">
              {candidates.map((candidate, idx) => (
                <div
                  key={candidate.event.id}
                  className="flex items-center gap-4 px-6 py-3 cursor-pointer transition-colors hover:bg-[var(--glass-elevated)]"
                  style={candidate.selected ? { backgroundColor: 'var(--semantic-warning-bg)' } : undefined}
                  onClick={() => toggleCandidate(idx)}
                >
                  {/* Checkbox */}
                  <div
                    className="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
                    style={candidate.selected
                      ? { borderColor: 'var(--semantic-warning)', backgroundColor: 'var(--semantic-warning-bg)' }
                      : { borderColor: 'var(--glass-border)' }
                    }
                  >
                    {candidate.selected && (
                      <span className="material-symbols-outlined text-xs" style={{ color: 'var(--semantic-warning)' }}>
                        check
                      </span>
                    )}
                  </div>

                  {/* Sprout info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-[var(--glass-text-primary)] truncate">
                      {candidate.sproutTitle || candidate.event.sproutId}
                    </div>
                  </div>

                  {/* Tier transition */}
                  <div className="flex items-center gap-2">
                    <TierBadge tier={candidate.event.fromTier} />
                    <span className="material-symbols-outlined text-xs text-[var(--glass-text-muted)]">
                      arrow_forward
                    </span>
                    <TierBadge tier={candidate.event.toTier} />
                  </div>

                  {/* Timestamp */}
                  <span className="text-xs text-[var(--glass-text-muted)] whitespace-nowrap">
                    {new Date(candidate.event.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reason Input */}
        <div className="px-6 py-4 border-t border-[var(--glass-border)]">
          <label className="block text-sm font-medium text-[var(--glass-text-secondary)] mb-2">
            Reason for Bulk Rollback *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why these advancements need to be rolled back..."
            rows={2}
            className={`
              w-full px-4 py-3 rounded-lg
              bg-[var(--glass-elevated)] border border-[var(--glass-border)]
              text-[var(--glass-text-primary)] placeholder-[var(--glass-text-muted)]
              focus:outline-none focus:ring-2 focus:ring-[var(--neon-cyan)] focus:border-transparent
              resize-none text-sm
            `}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div
            className="mx-6 mb-4 flex items-center gap-2 p-3 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--semantic-error-bg)', color: 'var(--semantic-error)' }}
          >
            <span className="material-symbols-outlined text-sm">error</span>
            {error}
          </div>
        )}

        {/* Warning Banner */}
        {selectedCount > 0 && (
          <div
            className="mx-6 mb-4 flex items-start gap-2 p-3 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--semantic-warning-bg)', color: 'var(--semantic-warning)' }}
          >
            <span className="material-symbols-outlined text-sm mt-0.5">warning</span>
            <div>
              <div className="font-medium">
                Rolling back {selectedCount} advancement{selectedCount !== 1 ? 's' : ''}
              </div>
              <div style={{ opacity: 0.8 }} className="mt-1">
                Selected sprouts will revert to their previous tier. Each rollback will be logged individually.
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--glass-border)]">
          <GlassButton
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </GlassButton>
          <GlassButton
            variant="primary"
            onClick={handleSubmit}
            disabled={selectedCount === 0 || !reason.trim() || submitting}
            icon={submitting ? 'progress_activity' : 'undo'}
          >
            {submitting ? 'Rolling back...' : `Rollback ${selectedCount} Advancement${selectedCount !== 1 ? 's' : ''}`}
          </GlassButton>
        </div>
      </div>
    </div>
  );
}

export default BulkRollbackModal;
