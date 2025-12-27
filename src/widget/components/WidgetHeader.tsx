// src/widget/components/WidgetHeader.tsx
// Ambient status bar with session timer, sprout count, mode indicator

import { useState, useEffect, useMemo } from 'react';
import { useWidgetUI } from '../WidgetUIContext';
import { MODE_LABELS } from '@core/schema/widget';
import { useEngagementState } from '../../../hooks/useEngagementBus';

// Stage display config
const STAGE_DISPLAY: Record<string, { emoji: string; label: string }> = {
  ARRIVAL: { emoji: '👋', label: 'New' },
  ORIENTED: { emoji: '🧭', label: 'Orienting' },
  EXPLORING: { emoji: '🔍', label: 'Exploring' },
  ENGAGED: { emoji: '🌲', label: 'Engaged' },
};

export function WidgetHeader() {
  const { sessionStartTime, sproutCount, currentMode } = useWidgetUI();
  const [elapsed, setElapsed] = useState(0);
  const engagementState = useEngagementState();

  // Compute engagement stage from state
  const computedStage = useMemo(() => {
    if (engagementState.journeysCompleted >= 1 || engagementState.exchangeCount >= 10) {
      return 'ENGAGED';
    }
    if (engagementState.topicsExplored.length >= 2 || engagementState.exchangeCount >= 5) {
      return 'EXPLORING';
    }
    if (engagementState.exchangeCount >= 3) {
      return 'ORIENTED';
    }
    return 'ARRIVAL';
  }, [engagementState.journeysCompleted, engagementState.exchangeCount, engagementState.topicsExplored.length]);

  const stageInfo = STAGE_DISPLAY[computedStage];

  // Update timer every second
  useEffect(() => {
    const updateElapsed = () => {
      const diff = Date.now() - sessionStartTime.getTime();
      setElapsed(Math.floor(diff / 60000)); // minutes
    };

    updateElapsed(); // Initial call
    const interval = setInterval(updateElapsed, 1000);
    return () => clearInterval(interval);
  }, [sessionStartTime]);

  return (
    <header className="widget-header flex items-center justify-between px-4 py-3 border-b border-[var(--grove-border)]">
      <div className="widget-logo flex items-center gap-2">
        <span className="text-[var(--grove-accent)] text-lg">🌳</span>
        <span className="font-medium text-[var(--grove-text)]">The Grove</span>
      </div>
      <div className="widget-status flex items-center gap-4 text-sm text-[var(--grove-text-muted)]">
        {/* Stage Indicator */}
        {stageInfo && (
          <span
            className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]"
            style={{
              backgroundColor: 'rgba(6, 78, 59, 0.7)',
              color: '#6ee7b7',
              border: '1px solid rgba(16, 185, 129, 0.5)',
            }}
          >
            <span>{stageInfo.emoji}</span>
            <span style={{ fontWeight: 500 }}>{stageInfo.label}</span>
            {engagementState.exchangeCount > 0 && (
              <span style={{ color: 'rgba(110, 231, 183, 0.7)' }}>• {engagementState.exchangeCount}</span>
            )}
          </span>
        )}
        <span className="session-timer font-mono">{elapsed}m</span>
        <span className="sprout-count">🌱 {sproutCount}</span>
        <span className="mode-indicator flex items-center gap-1">
          <span className="text-[var(--grove-accent)]">◐</span>
          <span>{MODE_LABELS[currentMode]}</span>
        </span>
      </div>
    </header>
  );
}
