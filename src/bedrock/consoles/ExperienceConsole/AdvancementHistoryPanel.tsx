// src/bedrock/consoles/ExperienceConsole/AdvancementHistoryPanel.tsx
// Panel displaying advancement history for a sprout
// Sprint: S7-SL-AutoAdvancement v1
//
// DEX: Provenance as Infrastructure - Full audit trail visibility

import React, { useState, useEffect } from 'react';
import type { AdvancementEvent } from '@core/schema/advancement';

// =============================================================================
// Types
// =============================================================================

interface AdvancementHistoryPanelProps {
  sproutId: string;
  sproutTitle?: string;
  open: boolean;
  onClose: () => void;
  onRollback?: (eventId: string) => void;
}

// =============================================================================
// Tier Badge Component
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
// Event Type Badge
// =============================================================================

function EventTypeBadge({ type }: { type: string }) {
  const configs: Record<string, { style: React.CSSProperties; label: string }> = {
    'auto-advancement': { style: { backgroundColor: 'var(--semantic-success-bg)', color: 'var(--semantic-success)' }, label: 'Auto' },
    'manual-override': { style: { backgroundColor: 'var(--semantic-info-bg)', color: 'var(--semantic-info)' }, label: 'Manual' },
    'bulk-rollback': { style: { backgroundColor: 'var(--semantic-warning-bg)', color: 'var(--semantic-warning)' }, label: 'Rollback' },
  };
  const config = configs[type] || { style: { backgroundColor: 'var(--glass-panel)', color: 'var(--glass-text-muted)' }, label: type };
  return (
    <span className="px-2 py-0.5 rounded text-xs" style={config.style}>
      {config.label}
    </span>
  );
}

// =============================================================================
// History Event Row
// =============================================================================

interface EventRowProps {
  event: AdvancementEvent;
  onRollback?: () => void;
  canRollback: boolean;
}

function EventRow({ event, onRollback, canRollback }: EventRowProps) {
  const [expanded, setExpanded] = useState(false);
  const timestamp = new Date(event.timestamp).toLocaleString();

  return (
    <div className="border-b border-[var(--glass-border)] last:border-b-0">
      {/* Main row */}
      <div
        className="flex items-center gap-3 py-3 px-4 hover:bg-[var(--glass-elevated)] transition-colors cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Expand icon */}
        <span className={`material-symbols-outlined text-sm text-[var(--glass-text-muted)] transition-transform ${expanded ? 'rotate-90' : ''}`}>
          chevron_right
        </span>

        {/* Event type */}
        <EventTypeBadge type={event.eventType} />

        {/* Tier transition */}
        <div className="flex items-center gap-2">
          <TierBadge tier={event.fromTier} />
          <span className="material-symbols-outlined text-xs text-[var(--glass-text-muted)]">
            arrow_forward
          </span>
          <TierBadge tier={event.toTier} />
        </div>

        {/* Timestamp */}
        <span className="flex-1 text-xs text-[var(--glass-text-muted)] text-right">
          {timestamp}
        </span>

        {/* Rollback indicator */}
        {event.rolledBack && (
          <span
            className="text-xs px-2 py-0.5 rounded"
            style={{ color: 'var(--semantic-warning)', backgroundColor: 'var(--semantic-warning-bg)' }}
          >
            Rolled back
          </span>
        )}

        {/* Rollback button */}
        {canRollback && !event.rolledBack && onRollback && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRollback();
            }}
            className="text-xs transition-colors"
            style={{ color: 'var(--semantic-warning)' }}
            title="Rollback this advancement"
          >
            <span className="material-symbols-outlined text-sm">undo</span>
          </button>
        )}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 bg-[var(--glass-solid)]">
          {/* Criteria met */}
          {event.criteriaMet && event.criteriaMet.length > 0 && (
            <div className="mb-3">
              <div className="text-xs font-medium text-[var(--glass-text-secondary)] mb-2">
                Criteria Evaluation
              </div>
              <div className="space-y-1">
                {event.criteriaMet.map((cr, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span
                      className="material-symbols-outlined text-sm"
                      style={{ color: cr.met ? 'var(--semantic-success)' : 'var(--semantic-error)' }}
                    >
                      {cr.met ? 'check_circle' : 'cancel'}
                    </span>
                    <span className="text-[var(--glass-text-secondary)]">
                      {cr.criterion.signal} {cr.criterion.operator} {cr.criterion.threshold}
                    </span>
                    <span className="text-[var(--glass-text-muted)]">
                      (actual: {cr.actual})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signal values */}
          {event.signalValues && (
            <div className="mb-3">
              <div className="text-xs font-medium text-[var(--glass-text-secondary)] mb-2">
                Signal Snapshot
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--glass-text-muted)]">Retrievals:</span>
                  <span className="text-[var(--glass-text-primary)]">{event.signalValues.retrievals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--glass-text-muted)]">Citations:</span>
                  <span className="text-[var(--glass-text-primary)]">{event.signalValues.citations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--glass-text-muted)]">Query Diversity:</span>
                  <span className="text-[var(--glass-text-primary)]">{event.signalValues.queryDiversity.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--glass-text-muted)]">Utility Score:</span>
                  <span className="text-[var(--glass-text-primary)]">{event.signalValues.utilityScore.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Reason (for manual/rollback) */}
          {event.reason && (
            <div className="mb-3">
              <div className="text-xs font-medium text-[var(--glass-text-secondary)] mb-1">
                Reason
              </div>
              <div className="text-xs text-[var(--glass-text-muted)] italic">
                {event.reason}
              </div>
            </div>
          )}

          {/* Operator info */}
          {event.operatorId && (
            <div className="text-xs text-[var(--glass-text-muted)]">
              Operator: {event.operatorId}
            </div>
          )}

          {/* Rule ID */}
          {event.ruleId && (
            <div className="text-xs text-[var(--glass-text-muted)]">
              Rule: {event.ruleId}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function AdvancementHistoryPanel({
  sproutId,
  sproutTitle,
  open,
  onClose,
  onRollback,
}: AdvancementHistoryPanelProps) {
  const [events, setEvents] = useState<AdvancementEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch events when panel opens
  useEffect(() => {
    if (open && sproutId) {
      fetchEvents();
    }
  }, [open, sproutId]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual Supabase call
      // const { data } = await supabase
      //   .from('advancement_events')
      //   .select('*')
      //   .eq('sprout_id', sproutId)
      //   .order('timestamp', { ascending: false });
      // setEvents(data ?? []);

      // Mock data for development
      setEvents([]);
    } catch (err) {
      console.error('[AdvancementHistoryPanel] Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[var(--glass-solid)] border border-[var(--glass-border)] rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border)]">
          <div>
            <h2 className="text-lg font-medium text-[var(--glass-text-primary)]">
              Advancement History
            </h2>
            {sproutTitle && (
              <p className="text-sm text-[var(--glass-text-muted)]">
                {sproutTitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[var(--glass-text-muted)] hover:text-[var(--glass-text-primary)] transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <span className="material-symbols-outlined text-4xl text-[var(--glass-text-muted)] animate-spin">
                progress_activity
              </span>
            </div>
          ) : events.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <span className="material-symbols-outlined text-4xl text-[var(--glass-text-muted)] mb-3">
                history
              </span>
              <p className="text-[var(--glass-text-secondary)]">No advancement history</p>
              <p className="text-sm text-[var(--glass-text-muted)]">
                This sprout has not been advanced yet
              </p>
            </div>
          ) : (
            <div>
              {events.map((event, idx) => (
                <EventRow
                  key={event.id}
                  event={event}
                  canRollback={idx === 0} // Only allow rollback of most recent
                  onRollback={onRollback ? () => onRollback(event.id) : undefined}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-[var(--glass-border)] bg-[var(--glass-elevated)]">
          <span className="text-xs text-[var(--glass-text-muted)]">
            {events.length} event{events.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={fetchEvents}
            className="text-xs text-[var(--neon-cyan)] hover:text-[var(--neon-cyan-bright)] transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdvancementHistoryPanel;
