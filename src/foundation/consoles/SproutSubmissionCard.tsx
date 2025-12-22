// src/foundation/consoles/SproutSubmissionCard.tsx
// Card component for sprout submissions in the queue

import type { QueuedSprout } from '@core/schema/sprout-queue';

interface SproutSubmissionCardProps {
  sprout: QueuedSprout;
  selected: boolean;
  onClick: () => void;
}

const statusColors: Record<QueuedSprout['status'], string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  flagged: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
};

function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function SproutSubmissionCard({
  sprout,
  selected,
  onClick,
}: SproutSubmissionCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left p-4 rounded-lg border transition-all
        ${selected
          ? 'border-primary bg-primary/5 dark:bg-primary/10'
          : 'border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:border-primary/50'
        }
      `}
    >
      {/* Content preview */}
      <p className="text-slate-900 dark:text-slate-100 line-clamp-2 mb-3 text-sm leading-relaxed">
        "{sprout.content}"
      </p>

      {/* Metadata row */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">person</span>
            user_{sprout.captureContext.userId.slice(5, 11)}
          </span>
          <span>·</span>
          <span>{formatRelativeTime(sprout.captureContext.timestamp)}</span>
        </div>

        <div className="flex items-center gap-2">
          {sprout.captureContext.journeyId && (
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {sprout.captureContext.journeyId}
            </span>
          )}
          <span className={`px-2 py-0.5 rounded capitalize ${statusColors[sprout.status]}`}>
            {sprout.status}
          </span>
        </div>
      </div>
    </button>
  );
}

export default SproutSubmissionCard;
