// src/widget/views/GardenView.tsx
// Garden mode content - Sprout gallery with growth stages
// Sprint: Sprout System Wiring

import { useMemo, useState } from 'react';
import { useSproutStats } from '../../../hooks/useSproutStats';
import { Sprout, SproutStatus } from '../../core/schema/sprout';

// Growth stage configuration
const GROWTH_STAGES: { status: SproutStatus; emoji: string; label: string }[] = [
  { status: 'sprout', emoji: '🌱', label: 'Sprouts' },
  { status: 'sapling', emoji: '🌿', label: 'Saplings' },
  { status: 'tree', emoji: '🌳', label: 'Trees' }
];

// Sprout card component
function SproutCard({ sprout }: { sprout: Sprout }) {
  const [expanded, setExpanded] = useState(false);

  // Get status styling
  const statusStyles: Record<SproutStatus, string> = {
    sprout: 'bg-green-500/10 text-green-400 border-green-500/20',
    sapling: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    tree: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
  };

  const statusEmoji: Record<SproutStatus, string> = {
    sprout: '🌱',
    sapling: '🌿',
    tree: '🌳'
  };

  return (
    <div className="p-4 rounded-lg bg-[var(--grove-surface)] border border-[var(--grove-border)] hover:border-[var(--grove-border-hover)] transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className={`px-2 py-0.5 rounded text-xs border ${statusStyles[sprout.status]}`}>
          {statusEmoji[sprout.status]} {sprout.status}
        </span>
        <span className="text-[10px] text-[var(--grove-text-dim)]">
          {new Date(sprout.capturedAt).toLocaleDateString()}
        </span>
      </div>

      {/* Query */}
      <div className="text-[10px] text-[var(--grove-text-dim)] mb-1">In response to:</div>
      <div className="text-xs text-[var(--grove-text-muted)] italic mb-3 line-clamp-1">
        "{sprout.query}"
      </div>

      {/* Response preview */}
      <div
        className={`text-sm text-[var(--grove-text)] ${expanded ? '' : 'line-clamp-3'} cursor-pointer`}
        onClick={() => setExpanded(!expanded)}
      >
        {sprout.response}
      </div>
      {!expanded && sprout.response.length > 200 && (
        <button
          onClick={() => setExpanded(true)}
          className="text-xs text-[var(--grove-accent)] hover:underline mt-1"
        >
          Show more...
        </button>
      )}

      {/* Provenance summary */}
      {sprout.provenance && (
        <div className="mt-3 pt-3 border-t border-[var(--grove-border)] text-[10px] text-[var(--grove-text-dim)]">
          <div className="flex flex-wrap gap-2">
            {sprout.provenance.lens && (
              <span className="px-1.5 py-0.5 rounded bg-[var(--grove-surface-elevated)] border border-[var(--grove-border)]">
                🔍 {sprout.provenance.lens.name}
              </span>
            )}
            {sprout.provenance.hub && (
              <span className="px-1.5 py-0.5 rounded bg-[var(--grove-surface-elevated)] border border-[var(--grove-border)]">
                📚 {sprout.provenance.hub.name}
              </span>
            )}
            {sprout.provenance.journey && (
              <span className="px-1.5 py-0.5 rounded bg-[var(--grove-surface-elevated)] border border-[var(--grove-border)]">
                🗺️ {sprout.provenance.journey.name}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tags */}
      {sprout.tags.length > 0 && (
        <div className="flex gap-1.5 mt-3 flex-wrap">
          {sprout.tags.map(tag => (
            <span
              key={tag}
              className="px-1.5 py-0.5 bg-[var(--grove-accent)]/10 rounded text-[10px] text-[var(--grove-accent)]"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Notes */}
      {sprout.notes && (
        <div className="mt-3 p-2 bg-[var(--grove-surface-elevated)] rounded text-xs text-[var(--grove-text-muted)] italic">
          💬 {sprout.notes}
        </div>
      )}
    </div>
  );
}

export function GardenView() {
  const stats = useSproutStats();

  // Group sprouts by status
  const sproutsByStatus = useMemo(() => {
    const grouped: Record<SproutStatus, Sprout[]> = {
      sprout: [],
      sapling: [],
      tree: []
    };

    // Get all sprouts and group them
    const allSprouts = stats.recentSprouts;
    for (const sprout of allSprouts) {
      grouped[sprout.status].push(sprout);
    }

    // Sort each group by date (newest first)
    for (const status of Object.keys(grouped) as SproutStatus[]) {
      grouped[status].sort((a, b) =>
        new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()
      );
    }

    return grouped;
  }, [stats.recentSprouts]);

  // Empty state
  if (stats.totalSprouts === 0) {
    return (
      <div className="garden-view flex flex-col items-center justify-center h-full text-center p-8">
        <div className="text-6xl mb-4">🌱</div>
        <h2 className="text-2xl font-semibold text-[var(--grove-text)] mb-2">
          Your Garden
        </h2>
        <p className="text-[var(--grove-text-muted)] max-w-md mb-6">
          Watch your captured insights grow. Sprouts you plant in Explore mode
          will appear here, organized by growth stage.
        </p>
        <div className="p-4 rounded-lg bg-[var(--grove-surface)] border border-[var(--grove-border)]">
          <p className="text-[var(--grove-text-dim)] text-sm mb-2">
            <strong>How to capture a sprout:</strong>
          </p>
          <ol className="text-[var(--grove-text-dim)] text-sm text-left space-y-1">
            <li>1. Ask The Grove a question in Explore mode</li>
            <li>2. When you get a valuable response, type <code className="text-[var(--grove-accent)] bg-[var(--grove-surface-elevated)] px-1 rounded">/sprout</code></li>
            <li>3. Add tags: <code className="text-[var(--grove-accent)] bg-[var(--grove-surface-elevated)] px-1 rounded">/sprout --tag=ratchet</code></li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="garden-view flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[var(--grove-border)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
            <span className="text-xl">🌿</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[var(--grove-text)]">
              Your Garden
            </h2>
            <p className="text-xs text-[var(--grove-text-dim)]">
              {stats.totalSprouts} sprout{stats.totalSprouts !== 1 ? 's' : ''} captured •{' '}
              {stats.sessionSprouts} this session
            </p>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="px-4 py-3 bg-[var(--grove-surface-elevated)] border-b border-[var(--grove-border)]">
        <div className="grid grid-cols-3 gap-3 text-center">
          {GROWTH_STAGES.map(stage => (
            <div key={stage.status}>
              <div className="text-lg font-semibold text-[var(--grove-text)]">
                {sproutsByStatus[stage.status].length}
              </div>
              <div className="text-[10px] text-[var(--grove-text-dim)]">
                {stage.emoji} {stage.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sprout list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {GROWTH_STAGES.map(stage => {
          const sprouts = sproutsByStatus[stage.status];
          if (sprouts.length === 0) return null;

          return (
            <div key={stage.status}>
              <h3 className="text-xs font-semibold text-[var(--grove-text-muted)] uppercase tracking-widest mb-3 flex items-center gap-2">
                <span>{stage.emoji}</span>
                <span>{stage.label}</span>
                <span className="text-[var(--grove-text-dim)]">({sprouts.length})</span>
              </h3>
              <div className="space-y-3">
                {sprouts.map(sprout => (
                  <SproutCard key={sprout.id} sprout={sprout} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
