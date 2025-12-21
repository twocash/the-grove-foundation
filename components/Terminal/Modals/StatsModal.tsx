// StatsModal - Display user exploration statistics
// Sprint v0.16: Command Palette feature

import React from 'react';
import { useExplorationStats, ExplorationStats } from '../../../hooks/useExplorationStats';

interface StatsModalProps {
  onClose: () => void;
}

// Engagement level descriptions
const ENGAGEMENT_LABELS: Record<ExplorationStats['engagementLevel'], { label: string; description: string }> = {
  new: {
    label: 'New Explorer',
    description: 'Just getting started on your journey'
  },
  exploring: {
    label: 'Curious Mind',
    description: 'Beginning to discover key insights'
  },
  engaged: {
    label: 'Active Researcher',
    description: 'Deeply engaged with the material'
  },
  dedicated: {
    label: 'Dedicated Scholar',
    description: 'Mastering the concepts'
  }
};

// Format minutes into human-readable duration
function formatDuration(minutes: number): string {
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

const StatCard: React.FC<{
  label: string;
  value: string | number;
  subtext?: string;
  highlight?: boolean;
}> = ({ label, value, subtext, highlight }) => (
  <div className={`p-3 rounded border ${
    highlight
      ? 'bg-grove-forest/5 border-grove-forest/20'
      : 'bg-paper border-ink/10'
  }`}>
    <div className="text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-1">
      {label}
    </div>
    <div className={`text-xl font-serif font-medium ${
      highlight ? 'text-grove-forest' : 'text-ink'
    }`}>
      {value}
    </div>
    {subtext && (
      <div className="text-[10px] text-ink-muted mt-0.5">{subtext}</div>
    )}
  </div>
);

const StatsModal: React.FC<StatsModalProps> = ({ onClose }) => {
  const stats = useExplorationStats();
  const engagement = ENGAGEMENT_LABELS[stats.engagementLevel];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-sm">
      <div className="bg-paper w-full max-w-md mx-4 rounded shadow-lg overflow-hidden">
        <div className="flex flex-col h-full max-h-[80vh]">
          {/* Header */}
          <div className="px-4 py-6 border-b border-ink/5">
            <div className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mb-2">
              YOUR EXPLORATION STATS
            </div>

            {/* Engagement Level Badge */}
            <div className="flex items-center gap-3 mt-4">
              <div className="w-10 h-10 rounded-full bg-grove-forest/10 flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-grove-forest">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div>
                <div className="font-serif font-medium text-ink">
                  {engagement.label}
                </div>
                <div className="text-xs text-ink-muted">
                  {engagement.description}
                </div>
              </div>
            </div>
          </div>

          {/* Body - Stats Grid */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Streak Stats */}
              <StatCard
                label="Current Streak"
                value={stats.currentStreak}
                subtext={stats.isActiveToday ? 'Active today!' : 'days'}
                highlight={stats.currentStreak > 0}
              />
              <StatCard
                label="Longest Streak"
                value={stats.longestStreak}
                subtext="days"
              />

              {/* Journey Stats */}
              <StatCard
                label="Journeys Done"
                value={stats.journeysCompleted}
                subtext="completed"
              />
              <StatCard
                label="Time Exploring"
                value={formatDuration(stats.totalMinutesActive)}
              />

              {/* Activity Stats */}
              <StatCard
                label="Cards Visited"
                value={stats.cardsVisited}
                subtext="concepts explored"
              />
              <StatCard
                label="Exchanges"
                value={stats.exchangeCount}
                subtext="with Terminal"
              />
            </div>

            {/* Progress Encouragement */}
            {stats.engagementLevel !== 'dedicated' && (
              <div className="mt-4 p-3 bg-ink/5 rounded border border-ink/10">
                <div className="text-xs text-ink-muted font-serif">
                  {stats.engagementLevel === 'new' && (
                    <>Complete your first journey to become a <strong>Curious Mind</strong>!</>
                  )}
                  {stats.engagementLevel === 'exploring' && (
                    <>Complete 3 journeys to become an <strong>Active Researcher</strong>!</>
                  )}
                  {stats.engagementLevel === 'engaged' && (
                    <>Complete 10 journeys to become a <strong>Dedicated Scholar</strong>!</>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-ink/5 bg-paper/50">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-ink-muted">
                Stats are saved locally on your device
              </p>
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

export default StatsModal;
