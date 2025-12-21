// StatsModal Garden Section - Component Sketch
// Sprint: Sprout System
// Purpose: Extended sprout statistics in full stats view

import React from 'react';
import { useSproutStats } from '../../../hooks/useSproutStats';

/**
 * GardenSection - Add this section to existing StatsModal
 * Insert after the existing stats grid, before the footer
 */

const GardenSection: React.FC = () => {
  const stats = useSproutStats();

  return (
    <div className="mt-4 pt-4 border-t border-ink/10">
      {/* Section Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🌿</span>
        <span className="font-mono text-[10px] text-ink-muted uppercase tracking-widest">
          YOUR GARDEN
        </span>
      </div>

      {/* Lifecycle Progress */}
      <div className="p-3 bg-grove-forest/5 rounded border border-grove-forest/20 mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-serif text-ink">Contribution Lifecycle</span>
          <span className="text-[10px] text-ink-muted">
            {stats.totalSprouts} total contributions
          </span>
        </div>
        
        {/* Visual lifecycle bar */}
        <div className="flex items-center gap-1 h-6">
          {/* Sprouts */}
          <div 
            className="h-full bg-grove-forest/30 rounded-l flex items-center justify-center"
            style={{ flex: stats.totalSprouts || 1 }}
          >
            <span className="text-[10px] text-grove-forest font-mono">
              🌱 {stats.totalSprouts}
            </span>
          </div>
          
          {/* Saplings (future) */}
          <div 
            className="h-full bg-grove-moss/30 flex items-center justify-center"
            style={{ flex: 0 }}
          >
            {/* Will show when saplings exist */}
          </div>
          
          {/* Trees (future) */}
          <div 
            className="h-full bg-grove-amber/30 rounded-r flex items-center justify-center"
            style={{ flex: 0 }}
          >
            {/* Will show when trees exist */}
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-between mt-2 text-[10px] text-ink-muted">
          <span>🌱 Captured</span>
          <span>🌿 Reviewed</span>
          <span>🌳 Published</span>
        </div>
      </div>

      {/* Top Contributions by Hub */}
      {Object.keys(stats.sproutsByHub).length > 0 && (
        <div className="p-3 bg-paper border border-ink/10 rounded mb-3">
          <div className="text-xs font-serif text-ink mb-2">
            Contributions by Topic
          </div>
          <div className="space-y-1">
            {Object.entries(stats.sproutsByHub)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([hub, count]) => (
                <div key={hub} className="flex items-center justify-between">
                  <span className="text-xs text-ink-muted">#{hub}</span>
                  <span className="text-xs font-mono text-ink">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Future: Network Impact */}
      <div className="p-3 bg-ink/5 rounded border border-ink/10">
        <div className="flex items-center gap-2">
          <span className="text-lg opacity-50">✨</span>
          <div>
            <div className="text-xs text-ink-muted">Network Impact</div>
            <div className="text-[10px] text-ink-muted italic">
              Coming soon: See when your contributions shape responses
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed (Future) */}
      {/* 
      When sprouts get promoted, show notifications like:
      "Your Ratchet explanation was promoted to the Knowledge Commons!"
      "12 responses have used this insight"
      */}
    </div>
  );
};

export default GardenSection;
