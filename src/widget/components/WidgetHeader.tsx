// src/widget/components/WidgetHeader.tsx
// Ambient status bar with session timer, sprout count, mode indicator

import { useState, useEffect } from 'react';
import { useWidgetUI } from '../WidgetUIContext';
import { MODE_LABELS } from '@core/schema/widget';

export function WidgetHeader() {
  const { sessionStartTime, sproutCount, currentMode } = useWidgetUI();
  const [elapsed, setElapsed] = useState(0);

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
