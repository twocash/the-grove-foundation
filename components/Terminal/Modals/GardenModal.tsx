// GardenModal - View user's captured sprouts
// Sprint: Sprout System
//
// @deprecated Sprint: Sprout System Wiring
// This modal is deprecated in favor of src/widget/views/GardenView.tsx
// The /garden command now switches to garden mode instead of opening a modal.
// This file is retained for backward compatibility but will be removed in a future sprint.

import React from 'react';
import { useSproutStats } from '../../../hooks/useSproutStats';
import { Sprout } from '../../../src/core/schema/sprout';

interface GardenModalProps {
  onClose: () => void;
  onViewFullStats: () => void;
}

// Sprout status badge component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    sprout: 'bg-grove-forest/10 text-grove-forest',
    sapling: 'bg-grove-forest/20 text-grove-forest',
    tree: 'bg-grove-clay/10 text-grove-clay',
  };

  const icons: Record<string, string> = {
    sprout: '🌱',
    sapling: '🌿',
    tree: '🌳',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs ${styles[status] || ''}`}>
      {icons[status] || ''} {status}
    </span>
  );
};

// Individual sprout card
const SproutCard: React.FC<{ sprout: Sprout }> = ({ sprout }) => (
  <div className="p-3 bg-paper border border-ink/10 rounded">
    <div className="flex items-start justify-between gap-2 mb-2">
      <StatusBadge status={sprout.status} />
      <span className="text-[10px] text-ink-muted">
        {new Date(sprout.capturedAt).toLocaleTimeString()}
      </span>
    </div>

    {/* Query that generated this */}
    <div className="text-[10px] text-ink-muted mb-1">
      In response to:
    </div>
    <div className="text-xs text-ink italic mb-2 line-clamp-1">
      "{sprout.query}"
    </div>

    {/* Captured response preview */}
    <div className="text-sm text-ink line-clamp-3 font-serif">
      {sprout.response}
    </div>

    {/* Tags */}
    {sprout.tags.length > 0 && (
      <div className="flex gap-1 mt-2 flex-wrap">
        {sprout.tags.map(tag => (
          <span
            key={tag}
            className="px-1.5 py-0.5 bg-ink/5 rounded text-[10px] text-ink-muted"
          >
            #{tag}
          </span>
        ))}
      </div>
    )}

    {/* Notes */}
    {sprout.notes && (
      <div className="mt-2 p-2 bg-ink/5 rounded text-xs text-ink-muted italic">
        {sprout.notes}
      </div>
    )}
  </div>
);

const GardenModal: React.FC<GardenModalProps> = ({ onClose, onViewFullStats }) => {
  const stats = useSproutStats();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-sm">
      <div className="bg-paper w-full max-w-md mx-4 rounded shadow-lg overflow-hidden">
        <div className="flex flex-col h-full max-h-[70vh]">

          {/* Header */}
          <div className="px-4 py-4 border-b border-ink/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-grove-forest/10 flex items-center justify-center">
                <span className="text-xl">🌿</span>
              </div>
              <div>
                <div className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">
                  YOUR GARDEN
                </div>
                <div className="font-serif text-lg text-ink">
                  {stats.sessionSprouts} sprout{stats.sessionSprouts !== 1 ? 's' : ''} this session
                </div>
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="px-4 py-3 bg-ink/5 border-b border-ink/5">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="text-lg font-serif text-grove-forest">
                  {stats.totalSprouts}
                </div>
                <div className="text-[10px] text-ink-muted">🌱 Sprouts</div>
              </div>
              <div>
                <div className="text-lg font-serif text-ink-muted">
                  0
                </div>
                <div className="text-[10px] text-ink-muted">🌿 Saplings</div>
              </div>
              <div>
                <div className="text-lg font-serif text-ink-muted">
                  0
                </div>
                <div className="text-[10px] text-ink-muted">🌳 Trees</div>
              </div>
            </div>
          </div>

          {/* Session Sprouts List */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {stats.sessionSprouts === 0 ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">🌱</div>
                <div className="text-sm text-ink-muted font-serif">
                  No sprouts yet this session
                </div>
                <div className="text-xs text-ink-muted mt-2">
                  Use <code className="px-1 bg-ink/5 rounded">/sprout</code> to capture valuable responses
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentSprouts.map(sprout => (
                  <SproutCard key={sprout.id} sprout={sprout} />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-ink/5 bg-paper/50">
            <div className="flex items-center justify-between">
              <button
                onClick={onViewFullStats}
                className="text-xs text-grove-forest hover:underline"
              >
                View Full Stats →
              </button>
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-mono text-ink-muted hover:text-ink border border-ink/20 hover:border-ink/40 rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GardenModal;
