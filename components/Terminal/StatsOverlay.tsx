// components/Terminal/StatsOverlay.tsx
// Session Statistics Overlay
// Sprint: terminal-kinetic-commands-v1

import React from 'react';
import { useEngagementState } from '../../hooks/useEngagementBus';

interface StatsOverlayProps {
  onDismiss: () => void;
}

export function StatsOverlay({ onDismiss }: StatsOverlayProps) {
  const state = useEngagementState();

  const formatDuration = (minutes: number) => {
    if (minutes < 1) return 'Just started';
    if (minutes === 1) return '1 minute';
    return `${Math.floor(minutes)} minutes`;
  };

  const stats = [
    {
      icon: 'schedule',
      label: 'Session Duration',
      value: formatDuration(state.minutesActive)
    },
    {
      icon: 'chat',
      label: 'Exchanges',
      value: state.exchangeCount.toString()
    },
    {
      icon: 'explore',
      label: 'Cards Explored',
      value: state.cardsVisited.length.toString()
    },
    {
      icon: 'flag',
      label: 'Journeys Completed',
      value: state.journeysCompleted.toString()
    }
  ];

  return (
    <div className="glass-panel rounded-lg shadow-xl max-w-sm w-full mx-auto overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--glass-border)]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">bar_chart</span>
          <h3 className="font-semibold text-[var(--glass-text-primary)]">Session Statistics</h3>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 hover:bg-[var(--glass-hover)] rounded"
        >
          <span className="material-symbols-outlined text-[var(--glass-text-muted)] text-lg">close</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="p-4 space-y-4">
        {stats.map(stat => (
          <div key={stat.label} className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--glass-hover)]">
              <span className="material-symbols-outlined text-primary text-lg">{stat.icon}</span>
            </div>
            <div className="flex-1">
              <div className="text-xs text-[var(--glass-text-muted)]">{stat.label}</div>
              <div className="text-lg font-semibold text-[var(--glass-text-primary)]">{stat.value}</div>
            </div>
          </div>
        ))}

        {/* Current Context */}
        <div className="pt-4 border-t border-[var(--glass-border)] space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-[var(--glass-text-muted)] text-lg">visibility</span>
            <span className="text-[var(--glass-text-muted)]">Active Lens:</span>
            <span className="text-[var(--glass-text-primary)]">
              {state.activeLensId || 'None'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="material-symbols-outlined text-[var(--glass-text-muted)] text-lg">explore</span>
            <span className="text-[var(--glass-text-muted)]">Topics Explored:</span>
            <span className="text-[var(--glass-text-primary)]">
              {state.topicsExplored.length > 0 ? state.topicsExplored.length : 'None'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[var(--glass-border)]">
        <button
          onClick={onDismiss}
          className="w-full py-2 px-4 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium"
        >
          Continue Exploring
        </button>
      </div>
    </div>
  );
}
