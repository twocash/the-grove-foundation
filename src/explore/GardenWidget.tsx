// src/explore/GardenWidget.tsx
// Dashboard widget showing sprout statistics
// Sprint: dashboard-sprout-widget-v1

import { useSproutStats } from '../../hooks/useSproutStats';

interface GardenWidgetProps {
  onViewGarden: () => void;
}

function formatTimeAgo(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export function GardenWidget({ onViewGarden }: GardenWidgetProps) {
  const stats = useSproutStats();
  const latestSprout = stats.recentSprouts[0];
  const isEmpty = stats.totalSprouts === 0;

  return (
    <div className="glass-card p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌱</span>
          <span className="font-mono text-xs text-[var(--glass-text-muted)] uppercase tracking-wider">
            Your Garden
          </span>
        </div>
        <button
          onClick={onViewGarden}
          className="text-xs text-[var(--neon-cyan)] hover:underline"
        >
          View →
        </button>
      </div>

      {isEmpty ? (
        /* Empty State */
        <div className="text-center py-4">
          <p className="text-[var(--glass-text-secondary)] text-sm mb-2">
            Plant your first sprout
          </p>
          <p className="text-[var(--glass-text-muted)] text-xs">
            Use <code className="text-[var(--neon-cyan)]">/sprout</code> in Explore mode
          </p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 text-center mb-4">
            <div>
              <div className="text-2xl font-mono text-[var(--neon-green)]">
                {stats.totalSprouts}
              </div>
              <div className="text-[10px] text-[var(--glass-text-muted)] uppercase">
                Sprouts
              </div>
            </div>
            <div>
              <div className="text-2xl font-mono text-[var(--glass-text-muted)]">
                0
              </div>
              <div className="text-[10px] text-[var(--glass-text-muted)] uppercase">
                Saplings
              </div>
            </div>
            <div>
              <div className="text-2xl font-mono text-[var(--glass-text-muted)]">
                0
              </div>
              <div className="text-[10px] text-[var(--glass-text-muted)] uppercase">
                Trees
              </div>
            </div>
          </div>

          {/* Latest Sprout Preview */}
          {latestSprout && (
            <div className="border-t border-[var(--glass-border)] pt-3">
              <p className="text-xs text-[var(--glass-text-secondary)] line-clamp-2 mb-1">
                "{latestSprout.response.slice(0, 100)}..."
              </p>
              <div className="flex items-center gap-2 text-[10px] text-[var(--glass-text-muted)]">
                <span>{formatTimeAgo(latestSprout.capturedAt)}</span>
                {latestSprout.tags.length > 0 && (
                  <span>· #{latestSprout.tags[0]}</span>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default GardenWidget;
