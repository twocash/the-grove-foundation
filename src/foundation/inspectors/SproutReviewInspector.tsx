// src/foundation/inspectors/SproutReviewInspector.tsx
// Inspector for reviewing and moderating sprout submissions

import { useState } from 'react';
import { EmptyState } from '../../shared/feedback';
import { TextArea } from '../../shared/forms';
import { GlowButton } from '../components/GlowButton';
import { useSproutQueue } from '../hooks/useSproutQueue';
import { useFoundationUI } from '../FoundationUIContext';
import type { QueuedSprout } from '@core/schema/sprout-queue';

interface SproutReviewInspectorProps {
  sproutId: string;
}

function formatDateTime(timestamp: string): string {
  return new Date(timestamp).toLocaleString();
}

const statusColors: Record<QueuedSprout['status'], string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  flagged: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

export function SproutReviewInspector({ sproutId }: SproutReviewInspectorProps) {
  const { sprouts, updateSprout } = useSproutQueue();
  const { closeInspector } = useFoundationUI();
  const sprout = sprouts.find(s => s.id === sproutId);

  const [notes, setNotes] = useState('');

  if (!sprout) {
    return (
      <EmptyState
        icon="error"
        title="Sprout not found"
        description="This sprout may have been deleted or doesn't exist."
      />
    );
  }

  const handleDecision = async (decision: 'approved' | 'rejected' | 'flagged') => {
    await updateSprout(sproutId, {
      status: decision,
      moderation: {
        reviewedBy: 'admin', // TODO: actual user
        reviewedAt: new Date().toISOString(),
        decision,
        notes: notes || undefined,
      },
    });
    closeInspector();
  };

  return (
    <div className="h-full flex flex-col bg-surface-light dark:bg-background-dark/50">
      {/* Header */}
      <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">rate_review</span>
          <h3 className="font-medium text-slate-900 dark:text-slate-100">Review Sprout</h3>
        </div>
        <button
          onClick={closeInspector}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs rounded capitalize ${statusColors[sprout.status]}`}>
            {sprout.status}
          </span>
          {sprout.moderation && (
            <span className="text-xs text-slate-500">
              by {sprout.moderation.reviewedBy}
            </span>
          )}
        </div>

        {/* Sprout content */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Content
          </h4>
          <div className="p-4 bg-white dark:bg-slate-800 rounded-lg border border-border-light dark:border-border-dark">
            <p className="text-slate-900 dark:text-slate-100 leading-relaxed">
              "{sprout.content}"
            </p>
          </div>
        </div>

        {/* Capture context */}
        <div>
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Capture Context
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <span className="material-symbols-outlined text-lg">calendar_today</span>
              {formatDateTime(sprout.captureContext.timestamp)}
            </div>
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <span className="material-symbols-outlined text-lg">visibility</span>
              Lens: {sprout.captureContext.lensId} v{sprout.captureContext.lensVersion}
            </div>
            {sprout.captureContext.journeyId && (
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <span className="material-symbols-outlined text-lg">map</span>
                Journey: {sprout.captureContext.journeyId}
                {sprout.captureContext.journeyStep !== undefined && ` (Step ${sprout.captureContext.journeyStep})`}
              </div>
            )}
            {sprout.captureContext.nodeId && (
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <span className="material-symbols-outlined text-lg">hub</span>
                Node: {sprout.captureContext.nodeId}
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <span className="material-symbols-outlined text-lg">person</span>
              Submitter: user_{sprout.captureContext.userId.slice(5, 13)}
            </div>
          </div>
        </div>

        {/* Moderation notes input */}
        {sprout.status === 'pending' && (
          <div>
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Moderation Notes
            </h4>
            <TextArea
              value={notes}
              onChange={setNotes}
              placeholder="Add notes for the submitter (optional)..."
              rows={3}
            />
          </div>
        )}

        {/* Previous moderation if exists */}
        {sprout.moderation && (
          <div>
            <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Previous Moderation
            </h4>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-sm space-y-1">
              <div className="text-slate-600 dark:text-slate-400">
                Reviewed by <span className="font-medium">{sprout.moderation.reviewedBy}</span>
              </div>
              <div className="text-slate-600 dark:text-slate-400">
                {formatDateTime(sprout.moderation.reviewedAt)}
              </div>
              {sprout.moderation.notes && (
                <div className="text-slate-700 dark:text-slate-300 mt-2 pt-2 border-t border-border-light dark:border-border-dark">
                  {sprout.moderation.notes}
                </div>
              )}
              {sprout.moderation.qualityScore !== undefined && (
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  Quality Score:
                  <span className="font-medium text-primary">{sprout.moderation.qualityScore}%</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-border-light dark:border-border-dark">
        {sprout.status === 'pending' ? (
          <div className="grid grid-cols-3 gap-2">
            <GlowButton
              variant="primary"
              onClick={() => handleDecision('approved')}
              icon="check"
              className="!bg-emerald-600/20 !border-emerald-600 !text-emerald-600 hover:!bg-emerald-600/30"
            >
              Approve
            </GlowButton>
            <GlowButton
              variant="danger"
              onClick={() => handleDecision('rejected')}
              icon="close"
            >
              Reject
            </GlowButton>
            <GlowButton
              variant="secondary"
              onClick={() => handleDecision('flagged')}
              icon="flag"
            >
              Flag
            </GlowButton>
          </div>
        ) : (
          <div className="text-center text-sm text-slate-500 dark:text-slate-400">
            This sprout has been <span className="font-medium">{sprout.status}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default SproutReviewInspector;
